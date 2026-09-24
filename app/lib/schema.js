import { z } from "zod"; // Importing zod for schema-based form validation

// Schema for account creation form validation
export const accountSchema = z.object({
  name: z.string().min(1, "Name is required"), // 'name' must be a non-empty string
  type: z.enum(["CURRENT", "SAVINGS"]), // 'type' must be one of the two predefined values
  balance: z.string().min(1, "Initial balance is required"), // 'balance' must be a non-empty string
  isDefault: z.boolean().default(false), // 'isDefault' is optional and defaults to false
});

// Schema for transaction creation form validation
export const transactionSchema = z
  .object({
    type: z.enum(["INCOME", "EXPENSE"]), // 'type' must be either 'INCOME' or 'EXPENSE'
    amount: z.string().min(1, "Amount is required"), // 'amount' must be a non-empty string
    description: z.string().optional(), // 'description' is optional
    date: z.date({ required_error: "Date is required" }), // 'date' must be a valid date
    accountId: z.string().min(1, "Account is required"), // 'accountId' must be a non-empty string
    category: z.string().min(1, "Category is required"), // 'category' must be a non-empty string
    isRecurring: z.boolean().default(false), // 'isRecurring' is a boolean with default value false
    recurringInterval: z
      .enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]) // optional field for frequency
      .optional(), // only used when 'isRecurring' is true
  })
  .superRefine((data, ctx) => {
    // Custom validation rule using superRefine for conditional logic
    if (data.isRecurring && !data.recurringInterval) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom, // Custom validation error
        message: "Recurring interval is required for recurring transactions", // Error message
        path: ["recurringInterval"], // Targeting the specific field in error
      });
    }
  });


//   This file uses zod to define strict validation schemas for account and transaction forms.

// accountSchema ensures that a valid account name, type, and balance are provided.

// transactionSchema validates transaction details and applies a custom rule:

// If a transaction is marked as recurring (isRecurring: true), then recurringInterval must be specified.

// These schemas are essential for frontend form validation and help prevent invalid or incomplete data from being submitted.