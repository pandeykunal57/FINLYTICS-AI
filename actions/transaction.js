"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { GoogleGenerativeAI } from "@google/generative-ai";
import aj from "@/lib/arcjet";
import { request } from "@arcjet/next";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper to serialize Prisma Decimal to number for transaction amount
const serializeAmount = (obj) => ({
  ...obj,
  amount: obj.amount.toNumber(),
});

// Create a new transaction and update account balance atomically
export async function createTransaction(data) {
  try {
    // Get authenticated user id
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // ArcJet rate limiting check for API abuse protection
    const req = await request();
    const decision = await aj.protect(req, { userId, requested: 1 });
    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        const { remaining, reset } = decision.reason;
        console.error({
          code: "RATE_LIMIT_EXCEEDED",
          details: { remaining, resetInSeconds: reset },
        });
        throw new Error("Too many requests. Please try again later.");
      }
      throw new Error("Request blocked");
    }

    // Lookup user in DB using Clerk userId
    const user = await db.user.findUnique({ where: { clerkUserId: userId } });
    if (!user) throw new Error("User not found");

    // Validate the transaction's account belongs to user
    const account = await db.account.findUnique({
      where: { id: data.accountId, userId: user.id },
    });
    if (!account) throw new Error("Account not found");

    // Calculate new balance after this transaction
    const balanceChange = data.type === "EXPENSE" ? -data.amount : data.amount;
    const newBalance = account.balance.toNumber() + balanceChange;

    // Create transaction and update account balance in one atomic transaction
    const transaction = await db.$transaction(async (tx) => {
      const newTransaction = await tx.transaction.create({
        data: {
          ...data,
          userId: user.id,
          // If recurring, calculate next recurring date; else null
          nextRecurringDate:
            data.isRecurring && data.recurringInterval
              ? calculateNextRecurringDate(data.date, data.recurringInterval)
              : null,
        },
      });

      // Update the account balance
      await tx.account.update({
        where: { id: data.accountId },
        data: { balance: newBalance },
      });

      return newTransaction;
    });

    // Revalidate cache for dashboard and account page
    revalidatePath("/dashboard");
    revalidatePath(`/account/${transaction.accountId}`);

    // Return success and serialized transaction data
    return { success: true, data: serializeAmount(transaction) };
  } catch (error) {
    throw new Error(error.message);
  }
}

// Fetch a single transaction by ID with ownership validation
export async function getTransaction(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  const transaction = await db.transaction.findUnique({
    where: { id, userId: user.id },
  });

  if (!transaction) throw new Error("Transaction not found");

  return serializeAmount(transaction);
}

// Update an existing transaction and adjust account balance accordingly
export async function updateTransaction(id, data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({ where: { clerkUserId: userId } });
    if (!user) throw new Error("User not found");

    // Fetch original transaction to compute balance difference
    const originalTransaction = await db.transaction.findUnique({
      where: { id, userId: user.id },
      include: { account: true },
    });
    if (!originalTransaction) throw new Error("Transaction not found");

    // Calculate old and new balance impact
    const oldBalanceChange =
      originalTransaction.type === "EXPENSE"
        ? -originalTransaction.amount.toNumber()
        : originalTransaction.amount.toNumber();

    const newBalanceChange = data.type === "EXPENSE" ? -data.amount : data.amount;
    const netBalanceChange = newBalanceChange - oldBalanceChange;

    // Update transaction and increment account balance atomically
    const transaction = await db.$transaction(async (tx) => {
      const updated = await tx.transaction.update({
        where: { id, userId: user.id },
        data: {
          ...data,
          nextRecurringDate:
            data.isRecurring && data.recurringInterval
              ? calculateNextRecurringDate(data.date, data.recurringInterval)
              : null,
        },
      });

      await tx.account.update({
        where: { id: data.accountId },
        data: { balance: { increment: netBalanceChange } },
      });

      return updated;
    });

    revalidatePath("/dashboard");
    revalidatePath(`/account/${data.accountId}`);

    return { success: true, data: serializeAmount(transaction) };
  } catch (error) {
    throw new Error(error.message);
  }
}

// Fetch all user transactions with optional filtering
export async function getUserTransactions(query = {}) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({ where: { clerkUserId: userId } });
    if (!user) throw new Error("User not found");

    const transactions = await db.transaction.findMany({
      where: { userId: user.id, ...query },
      include: { account: true },
      orderBy: { date: "desc" },
    });

    return { success: true, data: transactions };
  } catch (error) {
    throw new Error(error.message);
  }
}

// AI-powered receipt scanning using Google Gemini generative model
export async function scanReceipt(file) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Convert file to base64 string
    const arrayBuffer = await file.arrayBuffer();
    const base64String = Buffer.from(arrayBuffer).toString("base64");

    // Prompt instructing the AI to extract JSON data only from receipt image
    const prompt = `
You are an intelligent receipt scanning assistant. Given an image of a receipt, extract the following information and return ONLY valid JSON. Do not add explanations or extra formatting.

Format:
{
  "amount": number (e.g., 23.5),
  "date": "ISO date string" (e.g., "2024-04-01T00:00:00.000Z"),
  "description": "brief summary of items",
  "merchantName": "store name",
  "category": "one of: housing, transportation, groceries, utilities, entertainment, food, shopping, healthcare, education, personal, travel, insurance, gifts, bills, other-expense"
}

If the image is not a receipt, return {}.
`;

    // Generate content from Gemini AI
    const result = await model.generateContent([
      {
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      },
      prompt,
    ]);

    const response = await result.response;
    const text = response.text();
    // Clean up any markdown code block formatting
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

    // Parse the AI response JSON and return structured data
    try {
      const data = JSON.parse(cleanedText);
      return {
        amount: parseFloat(data.amount),
        date: new Date(data.date),
        description: data.description,
        category: data.category,
        merchantName: data.merchantName,
      };
    } catch (parseError) {
      console.error("Error parsing JSON response:", parseError);
      throw new Error("Invalid response format from Gemini");
    }
  } catch (error) {
    console.error("Error scanning receipt:", error);
    throw new Error("Failed to scan receipt");
  }
}

// Helper to calculate next recurring date based on interval
function calculateNextRecurringDate(startDate, interval) {
  const date = new Date(startDate);

  switch (interval) {
    case "DAILY":
      date.setDate(date.getDate() + 1);
      break;
    case "WEEKLY":
      date.setDate(date.getDate() + 7);
      break;
    case "MONTHLY":
      date.setMonth(date.getMonth() + 1);
      break;
    case "YEARLY":
      date.setFullYear(date.getFullYear() + 1);
      break;
  }

  return date;
}

/*Authentication & Authorization:
Every function uses Clerk’s auth() to ensure the user is authenticated. Operations are scoped to the authenticated user's ID to
 prevent data leakage.

Rate Limiting (ArcJet):
The createTransaction function integrates ArcJet to enforce rate limiting per user to prevent abuse (e.g., spamming transaction 
creation).

Data Serialization:
Prisma's Decimal types (used for monetary values) are converted to JS numbers before returning to the client to avoid serialization 
issues.

Atomic DB Transactions:
Operations that require multiple DB changes (like creating a transaction + updating account balance) are wrapped in a Prisma
 transaction to ensure consistency.

Next.js Cache Revalidation:
After state-changing operations, cache revalidation calls ensure the UI fetches fresh data on the dashboard and account pages.

Receipt Scanning via Gemini AI:
The scanReceipt function sends an image encoded in base64 to Google Gemini's generative model with a prompt requesting 
structured JSON output of key receipt details. Parsing is carefully handled with error logging.

Recurring Transactions:
The helper calculateNextRecurringDate computes the next due date for recurring transactions based on a provided interval,
 facilitating automated transaction scheduling.

Error Handling:
Errors are caught and thrown with messages to propagate meaningful error info up to the frontend for user feedback.

This setup provides a secure, robust backend service supporting transaction creation, updates, retrieval, and AI-powered 
receipt scanning within a modern Next.js app using Clerk for auth and Prisma for the database layer.*/