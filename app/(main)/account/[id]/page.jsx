// Import necessary dependencies and components
import { Suspense } from "react";
import { getAccountWithTransactions } from "@/actions/account"; // Fetches account details and its transactions
import { BarLoader } from "react-spinners"; // Used for loading indicator
import { TransactionTable } from "../_components/transaction-table"; // Component to display transactions in a table
import { notFound } from "next/navigation"; // Used to show 404 if account is not found
import { AccountChart } from "../_components/account-chart"; // Component for account-related charts

// Async Server Component to render account details page
export default async function AccountPage({ params }) {
  // Fetch account data including transactions using ID from URL params
  const accountData = await getAccountWithTransactions(params.id);

  // If account is not found, show 404 page
  if (!accountData) {
    notFound();
  }

  // Destructure transactions from the accountData
  const { transactions, ...account } = accountData;

  return (
    <div className="space-y-8 px-5">
      {/* Header section showing account name, type, and balance */}
      <div className="flex gap-4 items-end justify-between">
        <div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight gradient-title capitalize">
            {account.name}
          </h1>
          <p className="text-muted-foreground">
            {account.type.charAt(0) + account.type.slice(1).toLowerCase()} Account
          </p>
        </div>

        {/* Account Balance and Transaction Count */}
        <div className="text-right pb-2">
          <div className="text-xl sm:text-2xl font-bold">
            Rs.{parseFloat(account.balance).toFixed(2)}
          </div>
          <p className="text-sm text-muted-foreground">
            {account._count.transactions} Transactions
          </p>
        </div>
      </div>

      {/* Chart Section - visualizes transaction trends */}
      <Suspense
        fallback={<BarLoader className="mt-4" width={"100%"} color="#9333ea" />}
      >
        <AccountChart transactions={transactions} />
      </Suspense>

      {/* Transactions Table - lists all transactions in tabular format */}
      <Suspense
        fallback={<BarLoader className="mt-4" width={"100%"} color="#9333ea" />}
      >
        <TransactionTable transactions={transactions} />
      </Suspense>
    </div>
  );
}

/*
NOTES:

- This page displays individual account details including balance, type, and associated transactions.
- It gracefully handles missing data by showing a 404 using `notFound()`.
- Suspense is used with `BarLoader` fallback for both `AccountChart` and `TransactionTable` to enhance perceived loading performance.
- Account type is capitalized manually for readability.
- The page is fully responsive due to Tailwind classes like `sm:text-6xl`, `px-5`, and `space-y-8`.

Clean separation of concerns between chart and table makes the page both scalable and readable.
*/
