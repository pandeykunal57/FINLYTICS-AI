"use server";

import { db } from "@/lib/prisma"; // Prisma client for database access
import { auth } from "@clerk/nextjs/server"; // Authentication helper from Clerk
import { revalidatePath } from "next/cache"; // To trigger Next.js ISR cache refresh

// Fetch current budget and expenses for a specific account
export async function getCurrentBudget(accountId) {
  try {
    const { userId } = await auth(); // Get currently authenticated user ID
    if (!userId) throw new Error("Unauthorized"); // Reject if not logged in

    // Find user record in DB by Clerk user ID
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Find budget record for the user (assuming one budget per user)
    const budget = await db.budget.findFirst({
      where: {
        userId: user.id,
      },
    });

    // Calculate current month's date range
    const currentDate = new Date();
    const startOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    const endOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );

    // Aggregate total expenses for the current month and given account
    const expenses = await db.transaction.aggregate({
      where: {
        userId: user.id,
        type: "EXPENSE",
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        accountId,
      },
      _sum: {
        amount: true,
      },
    });

    return {
      // Return budget with amount converted from Prisma Decimal to number
      budget: budget ? { ...budget, amount: budget.amount.toNumber() } : null,
      // Return current expenses or 0 if none found
      currentExpenses: expenses._sum.amount
        ? expenses._sum.amount.toNumber()
        : 0,
    };
  } catch (error) {
    console.error("Error fetching budget:", error);
    throw error; // Let caller handle error
  }
}

// Update or create budget for logged-in user
export async function updateBudget(amount) {
  try {
    const { userId } = await auth(); // Get authenticated user ID
    if (!userId) throw new Error("Unauthorized");

    // Find user record by Clerk ID
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    // Upsert budget: update if exists, create otherwise
    const budget = await db.budget.upsert({
      where: {
        userId: user.id,
      },
      update: {
        amount,
      },
      create: {
        userId: user.id,
        amount,
      },
    });

    // Revalidate dashboard page to reflect updated budget
    revalidatePath("/dashboard");

    return {
      success: true,
      data: { ...budget, amount: budget.amount.toNumber() }, // Convert Decimal to number
    };
  } catch (error) {
    console.error("Error updating budget:", error);
    return { success: false, error: error.message };
  }
};

/*
NOTES:
- Both functions require user authentication and verify user existence.
- getCurrentBudget calculates expenses for the current month for the specified account.
- Prisma Decimal fields are converted to plain numbers before returning.
- updateBudget uses Prisma's upsert to handle creation or update in one operation.
- revalidatePath ensures that the dashboard page reflects changes immediately.
- Error handling logs to console and returns failure details.
*/
