import { inngest } from "./client";  // Import Inngest client instance for event handling
import { db } from "@/lib/prisma";  // Import Prisma client for DB operations
import EmailTemplate from "@/emails/template";  // Import React email template component
import { sendEmail } from "@/actions/send-email";  // Import function to send emails
import { GoogleGenerativeAI } from "@google/generative-ai";  // Import Google Gemini AI SDK

// 1. Recurring Transaction Processing with throttling to avoid overload
export const processRecurringTransaction = inngest.createFunction(
  {
    id: "process-recurring-transaction",
    name: "Process Recurring Transaction",
    throttle: {
      limit: 10, // Allow max 10 transactions per minute
      period: "1m", 
      key: "event.data.userId", // Throttle per user to prevent abuse
    },
  },
  { event: "transaction.recurring.process" },  // Triggered on this event
  async ({ event, step }) => {
    // Validate required event data is present
    if (!event?.data?.transactionId || !event?.data?.userId) {
      console.error("Invalid event data:", event);
      return { error: "Missing required event data" };
    }

    // Run processing step asynchronously
    await step.run("process-transaction", async () => {
      // Fetch the transaction record including related account
      const transaction = await db.transaction.findUnique({
        where: {
          id: event.data.transactionId,
          userId: event.data.userId,
        },
        include: {
          account: true,
        },
      });

      // Skip if no transaction found or not due for processing
      if (!transaction || !isTransactionDue(transaction)) return;

      // Begin database transaction for atomicity
      await db.$transaction(async (tx) => {
        // Create a new transaction entry for the recurring payment
        await tx.transaction.create({
          data: {
            type: transaction.type,
            amount: transaction.amount,
            description: `${transaction.description} (Recurring)`,
            date: new Date(),  // Current date
            category: transaction.category,
            userId: transaction.userId,
            accountId: transaction.accountId,
            isRecurring: false, // New transaction is not recurring itself
          },
        });

        // Calculate balance change depending on transaction type
        const balanceChange =
          transaction.type === "EXPENSE"
            ? -transaction.amount.toNumber()
            : transaction.amount.toNumber();

        // Update account balance accordingly
        await tx.account.update({
          where: { id: transaction.accountId },
          data: { balance: { increment: balanceChange } },
        });

        // Update the last processed date and set the next recurring date
        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            lastProcessed: new Date(),
            nextRecurringDate: calculateNextRecurringDate(
              new Date(),
              transaction.recurringInterval
            ),
          },
        });
      });
    });
  }
);

// 2. Trigger recurring transactions daily at midnight
export const triggerRecurringTransactions = inngest.createFunction(
  {
    id: "trigger-recurring-transactions",
    name: "Trigger Recurring Transactions",
  },
  { cron: "0 0 * * *" },  // Run daily at midnight
  async ({ step }) => {
    // Fetch all due recurring transactions (not processed or due now)
    const recurringTransactions = await step.run(
      "fetch-recurring-transactions",
      async () => {
        return await db.transaction.findMany({
          where: {
            isRecurring: true,
            status: "COMPLETED",
            OR: [
              { lastProcessed: null },
              {
                nextRecurringDate: {
                  lte: new Date(), // Due now or earlier
                },
              },
            ],
          },
        });
      }
    );

    // If there are transactions due, send an event for each to process
    if (recurringTransactions.length > 0) {
      const events = recurringTransactions.map((transaction) => ({
        name: "transaction.recurring.process",
        data: {
          transactionId: transaction.id,
          userId: transaction.userId,
        },
      }));

      // Dispatch all events in batch to Inngest
      await inngest.send(events);
    }

    return { triggered: recurringTransactions.length };
  }
);

// 3. Generate financial insights using Google Gemini AI
async function generateFinancialInsights(stats, month) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // Compose prompt with financial data summary
  const prompt = `
    Analyze this financial data and provide 3 concise, actionable insights.
    Focus on spending patterns and practical advice.
    Keep it friendly and conversational.

    Financial Data for ${month}:
    - Total Income: $${stats.totalIncome}
    - Total Expenses: $${stats.totalExpenses}
    - Net Income: $${stats.totalIncome - stats.totalExpenses}
    - Expense Categories: ${Object.entries(stats.byCategory)
      .map(([category, amount]) => `${category}: $${amount}`)
      .join(", ")}

    Format the response as a JSON array of strings, like this:
    ["insight 1", "insight 2", "insight 3"]
  `;

  try {
    // Generate content from AI model
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

    // Parse AI response as JSON array
    return JSON.parse(cleanedText);
  } catch (error) {
    // Fallback insights on error
    console.error("Error generating insights:", error);
    return [
      "Your highest expense category this month might need attention.",
      "Consider setting up a budget for better financial management.",
      "Track your recurring expenses to identify potential savings.",
    ];
  }
}

// Monthly report generation function registered with Inngest
export const generateMonthlyReports = inngest.createFunction(
  {
    id: "generate-monthly-reports",
    name: "Generate Monthly Reports",
  },
  { cron: "0 0 1 * *" },  // Run on the first day of each month
  async ({ step }) => {
    // Fetch all users with their accounts
    const users = await step.run("fetch-users", async () => {
      return await db.user.findMany({
        include: { accounts: true },
      });
    });

    // Generate and send report for each user
    for (const user of users) {
      await step.run(`generate-report-${user.id}`, async () => {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1); // Previous month

        const stats = await getMonthlyStats(user.id, lastMonth);
        const monthName = lastMonth.toLocaleString("default", {
          month: "long",
        });

        // Generate AI-driven insights for the report
        const insights = await generateFinancialInsights(stats, monthName);

        // Send monthly report email with generated data
        await sendEmail({
          to: user.email,
          subject: `Your Monthly Financial Report - ${monthName}`,
          react: EmailTemplate({
            userName: user.name,
            type: "monthly-report",
            data: {
              stats,
              month: monthName,
              insights,
            },
          }),
        });
      });
    }

    return { processed: users.length };
  }
);

// 4. Budget Alerts Checking - runs every 6 hours
export const checkBudgetAlerts = inngest.createFunction(
  { name: "Check Budget Alerts" },
  { cron: "0 */6 * * *" },  // Every 6 hours
  async ({ step }) => {
    // Fetch all budgets including user default accounts
    const budgets = await step.run("fetch-budgets", async () => {
      return await db.budget.findMany({
        include: {
          user: {
            include: {
              accounts: {
                where: {
                  isDefault: true,
                },
              },
            },
          },
        },
      });
    });

    // Iterate over each budget to check spending
    for (const budget of budgets) {
      const defaultAccount = budget.user.accounts[0];
      if (!defaultAccount) continue; // Skip if no default account

      await step.run(`check-budget-${budget.id}`, async () => {
        const startDate = new Date();
        startDate.setDate(1); // Set to first day of current month

        // Aggregate expenses for the user’s default account in current month
        const expenses = await db.transaction.aggregate({
          where: {
            userId: budget.userId,
            accountId: defaultAccount.id,
            type: "EXPENSE",
            date: {
              gte: startDate,
            },
          },
          _sum: {
            amount: true,
          },
        });

        const totalExpenses = expenses._sum.amount?.toNumber() || 0;
        const budgetAmount = budget.amount;
        const percentageUsed = (totalExpenses / budgetAmount) * 100;

        // Send alert email if 80% of budget is used and alert not sent this month
        if (
          percentageUsed >= 80 &&
          (!budget.lastAlertSent ||
            isNewMonth(new Date(budget.lastAlertSent), new Date()))
        ) {
          await sendEmail({
            to: budget.user.email,
            subject: `Budget Alert for ${defaultAccount.name}`,
            react: EmailTemplate({
              userName: budget.user.name,
              type: "budget-alert",
              data: {
                percentageUsed,
                budgetAmount: parseInt(budgetAmount).toFixed(1),
                totalExpenses: parseInt(totalExpenses).toFixed(1),
                accountName: defaultAccount.name,
              },
            }),
          });

          // Update last alert timestamp to avoid duplicate alerts this month
          await db.budget.update({
            where: { id: budget.id },
            data: { lastAlertSent: new Date() },
          });
        }
      });
    }
  }
);

// Helper to check if alert was sent in a different month
function isNewMonth(lastAlertDate, currentDate) {
  return (
    lastAlertDate.getMonth() !== currentDate.getMonth() ||
    lastAlertDate.getFullYear() !== currentDate.getFullYear()
  );
}

// Utility to determine if a transaction is due for recurring processing
function isTransactionDue(transaction) {
  if (!transaction.lastProcessed) return true; // Never processed = due

  const today = new Date();
  const nextDue = new Date(transaction.nextRecurringDate);

  return nextDue <= today;
}

// Utility to calculate the next recurring date based on interval
function calculateNextRecurringDate(date, interval) {
  const next = new Date(date);
  switch (interval) {
    case "DAILY":
      next.setDate(next.getDate() + 1);
      break;
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      break;
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      break;
    case "YEARLY":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

// Aggregate monthly statistics for a user in a given month
async function getMonthlyStats(userId, month) {
  const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
  const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  // Fetch all transactions in the month
const transactions = await db.transaction.findMany({
where: {
userId,
date: {
gte: startDate,
lte: endDate,
},
},
});

// Aggregate total expenses, income, and category-wise expenses
return transactions.reduce(
(stats, t) => {
const amount = t.amount.toNumber();
if (t.type === "EXPENSE") {
stats.totalExpenses += amount;
stats.byCategory[t.category] =
(stats.byCategory[t.category] || 0) + amount;
} else {
stats.totalIncome += amount;
}
return stats;
},
{
totalExpenses: 0,
totalIncome: 0,
byCategory: {},
transactionCount: transactions.length,
}
);
}


//  This module implements key Inngest event-driven functions for FINLYTICS AI.
// - `processRecurringTransaction`: Handles individual recurring transactions with throttling per user.
// - `triggerRecurringTransactions`: Runs daily to find due recurring transactions and trigger processing events.
// - `generateMonthlyReports`: Runs monthly to generate financial summaries with AI-generated insights and emails users.
// - `checkBudgetAlerts`: Runs every 6 hours to check user budgets and send alert emails if usage is high.
// - Utility functions help calculate recurring schedules and aggregate monthly stats.
// - Integration with Google Gemini AI provides personalized, actionable financial insights.
// - The design ensures scalable, reliable asynchronous background tasks vital for automation in the platform.