import { getUserAccounts } from "@/actions/dashboard"; // Fetches user's accounts from backend
import { defaultCategories } from "@/data/categories"; // Predefined list of categories for transactions
import { AddTransactionForm } from "../_components/transaction-form"; // Form component for adding/editing transactions
import { getTransaction } from "@/actions/transaction"; // Fetches transaction details by ID

export default async function AddTransactionPage({ searchParams }) {
  // Fetch all user accounts for selection in form
  const accounts = await getUserAccounts();

  // Check if editing existing transaction via query param 'edit'
  const editId = searchParams?.edit;

  // Initialize form data for editing or null for new transaction
  let initialData = null;
  if (editId) {
    // Fetch transaction data for pre-filling the form
    const transaction = await getTransaction(editId);
    initialData = transaction;
  }

  return (
    <div className="max-w-3xl mx-auto px-5">
      {/* Page title with gradient style */}
      <div className="flex justify-center md:justify-normal mb-8">
        <h1 className="text-5xl gradient-title ">Add Transaction</h1>
      </div>
      {/* Transaction form component with props */}
      <AddTransactionForm
        accounts={accounts} // List of user accounts to choose from
        categories={defaultCategories} // List of categories for expenses/income
        editMode={!!editId} // True if editing an existing transaction
        initialData={initialData} // Pre-fill data when editing
      />
    </div>
  );
}

/*
NOTES:
- This async page component handles both adding a new transaction and editing an existing one.
- User accounts are fetched on the server to provide up-to-date account options.
- If an 'edit' query parameter is present, fetches the corresponding transaction data to initialize the form.
- The AddTransactionForm component handles all UI and form logic for creating or updating transactions.
- Layout uses responsive max-width and padding for centered and clean UI.
*/
