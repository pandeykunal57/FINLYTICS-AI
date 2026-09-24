"use server";

import { db } from "@/lib/prisma";
import { subDays } from "date-fns";

// Hardcoded placeholders for demo user and account IDs
const ACCOUNT_ID = "account-id";
const USER_ID = "user-id";

// Define categories for income and expenses with typical amount ranges
const CATEGORIES = {
  INCOME: [
    { name: "salary", range: [5000, 8000] },
    { name: "freelance", range: [1000, 3000] },
    { name: "investments", range: [500, 2000] },
    { name: "other-income", range: [100, 1000] },
  ],
  EXPENSE: [
    { name: "housing", range: [1000, 2000] },
    { name: "transportation", range: [100, 500] },
    { name: "groceries", range: [200, 600] },
    { name: "utilities", range: [100, 300] },
    { name: "entertainment", range: [50, 200] },
    { name: "food", range: [50, 150] },
    { name: "shopping", range: [100, 500] },
    { name: "healthcare", range: [100, 1000] },
    { name: "education", range: [200, 1000] },
    { name: "travel", range: [500, 2000] },
  ],
};

// Generate a random float amount between min and max, with 2 decimals
function getRandomAmount(min, max) {
  return Number((Math.random() * (max - min) + min).toFixed(2));
}

// Pick a random category of given type and generate an amount within its range
function getRandomCategory(type) {
  const categories = CATEGORIES[type];
  const category = categories[Math.floor(Math.random() * categories.length)];
  const amount = getRandomAmount(category.range[0], category.range[1]);
  return { category: category.name, amount };
}

export async function seedTransactions() {
  try {
    const transactions = [];
    let totalBalance = 0;

    // Generate transactions for last 90 days
    for (let i = 90; i >= 0; i--) {
      const date = subDays(new Date(), i);

      // Random 1 to 3 transactions per day
      const transactionsPerDay = Math.floor(Math.random() * 3) + 1;

      for (let j = 0; j < transactionsPerDay; j++) {
        // 40% chance income, else expense
        const type = Math.random() < 0.4 ? "INCOME" : "EXPENSE";

        // Get random category and amount
        const { category, amount } = getRandomCategory(type);

        // Build transaction object
        const transaction = {
          id: crypto.randomUUID(), // Unique transaction ID
          type,
          amount,
          description: `${type === "INCOME" ? "Received" : "Paid for"} ${category}`,
          date,
          category,
          status: "COMPLETED",
          userId: USER_ID, // Use hardcoded user id placeholder
          accountId: ACCOUNT_ID, // Use hardcoded account id placeholder
          createdAt: date,
          updatedAt: date,
        };

        // Update running total balance: add for income, subtract for expense
        totalBalance += type === "INCOME" ? amount : -amount;

        // Collect transaction
        transactions.push(transaction);
      }
    }

    // Use Prisma transaction to batch DB ops atomically
    await db.$transaction(async (tx) => {
      // Clear existing transactions for account
      await tx.transaction.deleteMany({
        where: { accountId: ACCOUNT_ID },
      });

      // Insert all generated transactions at once
      await tx.transaction.createMany({
        data: transactions,
      });

      // Update account balance to reflect net total of generated transactions
      await tx.account.update({
        where: { id: ACCOUNT_ID },
        data: { balance: totalBalance },
      });
    });

    return {
      success: true,
      message: `Created ${transactions.length} transactions`,
    };
  } catch (error) {
    console.error("Error seeding transactions:", error);
    return { success: false, error: error.message };
  }
};

/*
NOTES:
- This function seeds the database with randomized transaction data over the past 90 days.
- Transactions have random types (income or expense), categories, and amounts within sensible ranges.
- Hardcoded USER_ID and ACCOUNT_ID should be replaced with actual IDs in production or test setups.
- It creates 1-3 transactions per day, simulating real-world financial activity.
- All DB operations run in a transaction to ensure atomicity: first deletes old data, then inserts new, then updates account balance.
- Useful for generating demo/test data or resetting development DB.
- Logs and returns success/error info to help trace issues.
*/
