import { serve } from "inngest/next"; // Importing Inngest's server handler for Next.js API routes

import { inngest } from "@/lib/inngest/client"; // Importing the Inngest client instance configured for this app
import {
  checkBudgetAlerts,           // Function to check and notify about budget alerts
  generateMonthlyReports,      // Function to generate monthly financial reports
  processRecurringTransaction, // Function to process individual recurring transactions
  triggerRecurringTransactions // Function to trigger all recurring transactions processing
} from "@/lib/inngest/function"; // Importing Inngest event functions from local module

// Exporting the HTTP methods (GET, POST, PUT) handled by Inngest's server
export const { GET, POST, PUT } = serve({
  client: inngest,           // The Inngest client instance for event handling
  functions: [               // List of serverless functions to handle events
    processRecurringTransaction,
    triggerRecurringTransactions,
    generateMonthlyReports,
    checkBudgetAlerts,
  ],
 });
// This file sets up serverless API handlers for the app using Inngest with Next.js.

// The serve function registers multiple event-driven functions that respond to scheduled or triggered tasks.

// The functions handle core background tasks such as:

// Processing recurring transactions automatically.

// Triggering all recurring transaction workflows.

// Generating monthly reports to summarize user finances.

// Checking budgets and sending alerts if limits are exceeded.

// This setup ensures asynchronous and efficient handling of financial workflows without blocking user interactions.

// It provides scalability and reliability for background operations crucial to FINLYTICS AI.