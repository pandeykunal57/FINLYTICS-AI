"use client";

import { ArrowUpRight, ArrowDownRight, CreditCard } from "lucide-react"; // Icons for income/expense
import { Switch } from "@/components/ui/switch"; // Custom switch component
import { Badge } from "@/components/ui/badge"; // Optional: for labels (not used here)
import { useEffect } from "react";
import useFetch from "@/hooks/use-fetch"; // Custom hook for handling async API calls
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"; // Custom card layout components
import Link from "next/link"; // For navigation
import { updateDefaultAccount } from "@/actions/account"; // API action to update default account
import { toast } from "sonner"; // Toast notifications

// Main functional component that accepts `account` as a prop
export function AccountCard({ account }) {
  const { name, type, balance, id, isDefault } = account; // Destructure account fields

  // Setup fetch hook for updating default account
  const {
    loading: updateDefaultLoading, // Boolean: is the request in progress?
    fn: updateDefaultFn,           // Function to call the update API
    data: updatedAccount,          // Response data
    error,                         // Any error encountered
  } = useFetch(updateDefaultAccount);

  // Handles toggle of default account switch
  const handleDefaultChange = async (event) => {
    event.preventDefault(); // Prevents the card's link from triggering

    // Prevent removing the only default account
    if (isDefault) {
      toast.warning("You need atleast 1 default account");
      return;
    }

    // Call update function with account ID
    await updateDefaultFn(id);
  };

  // Show success message if account was successfully updated
  useEffect(() => {
    if (updatedAccount?.success) {
      toast.success("Default account updated successfully");
    }
  }, [updatedAccount]);

  // Show error if update failed
  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to update default account");
    }
  }, [error]);

  return (
    <Card className="hover:shadow-md transition-shadow group relative">
      {/* Whole card is wrapped in a link to the account detail page */}
      <Link href={`/account/${id}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium capitalize">
            {name} {/* Account name */}
          </CardTitle>
          <Switch
            checked={isDefault} // Whether the switch is toggled on
            onClick={handleDefaultChange} // Handle toggle
            disabled={updateDefaultLoading} // Disable while loading
          />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            Rs.{parseFloat(balance).toFixed(2)} {/* Show balance */}
          </div>
          <p className="text-xs text-muted-foreground">
            {type.charAt(0) + type.slice(1).toLowerCase()} Account {/* Format type */}
          </p>
        </CardContent>
        <CardFooter className="flex justify-between text-sm text-muted-foreground">
          <div className="flex items-center">
            <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
            Income
          </div>
          <div className="flex items-center">
            <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
            Expense
          </div>
        </CardFooter>
      </Link>
    </Card>
  );
}
/*
NOTES:

- This component renders a clickable card showing a financial account's details.
- Includes a toggle switch to mark/unmark the account as the default account.
- Uses useFetch hook to asynchronously update default account via API.
- Prevents user from disabling the only default account.
- Uses toast notifications (success or error) for user feedback.
- Visual breakdown:
  - Header shows account name and toggle.
  - Content shows balance and account type.
  - Footer shows icons for Income and Expense.
- Wrapped in <Link> to allow redirection to detailed account page on click.

*/
