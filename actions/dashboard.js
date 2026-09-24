"use server";

import aj from "@/lib/arcjet"; // ArcJet for bot protection & rate limiting
import { db } from "@/lib/prisma"; // Prisma client for DB access
import { request } from "@arcjet/next"; // Next.js request wrapper for ArcJet
import { auth } from "@clerk/nextjs/server"; // Clerk auth server-side helper
import { revalidatePath } from "next/cache"; // Next.js ISR cache invalidation

// Helper to convert Prisma Decimal fields to numbers in account/transaction objects
const serializeTransaction = (obj) => {
  const serialized = { ...obj };
  if (obj.balance) {
    serialized.balance = obj.balance.toNumber(); // Convert Prisma Decimal balance to number
  }
  if (obj.amount) {
    serialized.amount = obj.amount.toNumber(); // Convert Prisma Decimal amount to number
  }
  return serialized;
};

// Fetch all user accounts with transaction counts, ordered by creation date desc
export async function getUserAccounts() {
  const { userId } = await auth(); // Get authenticated user's Clerk ID
  if (!userId) throw new Error("Unauthorized"); // Require login

  const user = await db.user.findUnique({
    where: { clerkUserId: userId }, // Find user in DB by Clerk ID
  });

  if (!user) {
    throw new Error("User not found");
  }

  try {
    // Fetch accounts belonging to the user including count of transactions
    const accounts = await db.account.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    // Serialize each account to convert decimals
    const serializedAccounts = accounts.map(serializeTransaction);

    return serializedAccounts;
  } catch (error) {
    console.error(error.message);
  }
}

// Create a new account with ArcJet rate limiting and user validation
export async function createAccount(data) {
  try {
    const { userId } = await auth(); // Authenticated user's ID
    if (!userId) throw new Error("Unauthorized");

    const req = await request(); // Get current request for ArcJet protection

    // Check ArcJet rate limiting and bot protection
    const decision = await aj.protect(req, {
      userId,
      requested: 1, // Tokens consumed
    });

    // Handle denial reasons (rate limit or block)
    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        const { remaining, reset } = decision.reason;
        console.error({
          code: "RATE_LIMIT_EXCEEDED",
          details: {
            remaining,
            resetInSeconds: reset,
          },
        });

        throw new Error("Too many requests. Please try again later.");
      }
      throw new Error("Request blocked");
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Validate and parse balance as float
    const balanceFloat = parseFloat(data.balance);
    if (isNaN(balanceFloat)) {
      throw new Error("Invalid balance amount");
    }

    // Check if user has existing accounts
    const existingAccounts = await db.account.findMany({
      where: { userId: user.id },
    });

    // Automatically make first account default, else use user input
    const shouldBeDefault =
      existingAccounts.length === 0 ? true : data.isDefault;

    // If new account should be default, unset others first
    if (shouldBeDefault) {
      await db.account.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Create new account with validated and adjusted data
    const account = await db.account.create({
      data: {
        ...data,
        balance: balanceFloat,
        userId: user.id,
        isDefault: shouldBeDefault,
      },
    });

    // Serialize before returning
    const serializedAccount = serializeTransaction(account);

    // Revalidate dashboard to show updated accounts immediately
    revalidatePath("/dashboard");
    return { success: true, data: serializedAccount };
  } catch (error) {
    throw new Error(error.message);
  }
}

// Fetch all transactions for the logged-in user, ordered by date desc
export async function getDashboardData() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Fetch all user transactions
  const transactions = await db.transaction.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
  });

  // Serialize decimals before returning
  return transactions.map(serializeTransaction);
};

/*
NOTES:
- Implements server-side logic to securely access and modify user accounts and transactions.
- Uses Clerk for user authentication and authorization.
- ArcJet protects the createAccount function from abuse by rate limiting and bot detection.
- Prisma Decimal fields are converted to plain numbers for client compatibility.
- Ensures first created account is always default to maintain consistent UX.
- Revalidates Next.js paths after changes to update static/dynamic pages.
- Proper error handling with clear messages for unauthorized or invalid requests.
*/
