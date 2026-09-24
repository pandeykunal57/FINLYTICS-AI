// Import Suspense for possible future use in wrapping async components
import { Suspense } from "react";

// Import actions to fetch user-related data
import { getUserAccounts } from "@/actions/dashboard";
import { getDashboardData } from "@/actions/dashboard";
import { getCurrentBudget } from "@/actions/budget";

// Import UI components used within the dashboard
import { AccountCard } from "./_components/account-card";
import { CreateAccountDrawer } from "@/components/create-account-drawer";
import { BudgetProgress } from "./_components/budget-progress";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react"; // Icon used for 'Add Account' UI
import { DashboardOverview } from "./_components/transaction-overview";

// Async server component to load dashboard data
export default async function DashboardPage() {
  // Fetch user accounts and transactions concurrently
  const [accounts, transactions] = await Promise.all([
    getUserAccounts(),
    getDashboardData(),
  ]);

  // Identify default account to load budget data
  const defaultAccount = accounts?.find((account) => account.isDefault);

  // Initialize budgetData as null and fetch budget info for default account
  let budgetData = null;
  if (defaultAccount) {
    budgetData = await getCurrentBudget(defaultAccount.id);
  }

  return (
    <div className="space-y-8">
      {/* Budget Progress bar showing how much of the monthly budget has been used */}
      <BudgetProgress
        initialBudget={budgetData?.budget}
        currentExpenses={budgetData?.currentExpenses || 0}
      />

      {/* Transaction Overview: shows charts and latest transactions */}
      <DashboardOverview
        accounts={accounts}
        transactions={transactions || []}
      />

      {/* Account List: Cards for each user account including Add New Account */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Add New Account card triggers account drawer form */}
        <CreateAccountDrawer>
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed">
            <CardContent className="flex flex-col items-center justify-center text-muted-foreground h-full pt-5">
              <Plus className="h-10 w-10 mb-2" />
              <p className="text-sm font-medium">Add New Account</p>
            </CardContent>
          </Card>
        </CreateAccountDrawer>

        {/* Render each account as a card */}
        {accounts.length > 0 &&
          accounts?.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
      </div>
    </div>
  );
}


/*
NOTES:

- This is the main dashboard server component that loads essential user data:
  • Accounts
  • Transactions
  • Budget info for the default account

- It renders three key sections:
  1. Budget Progress bar (monthly budget tracking)
  2. Dashboard Overview (recent transactions + category pie chart)
  3. Account Cards Grid (existing accounts + add new account)

- Async/await and Promise.all are used for optimized parallel data fetching.
- The CreateAccountDrawer wraps an 'Add New Account' button styled as a dashed card.
- Component structure is modular and allows scalability for additional features.
*/
