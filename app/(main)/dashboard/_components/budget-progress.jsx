"use client"; // Marks this file as a client-side component

import { useState, useEffect } from "react"; // React hooks
import { Pencil, Check, X } from "lucide-react"; // Icons for edit actions
import useFetch from "@/hooks/use-fetch"; // Custom hook for async operations
import { toast } from "sonner"; // Toast notifications

// UI components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress"; // Progress bar
import { Button } from "@/components/ui/button"; // Reusable button
import { Input } from "@/components/ui/input"; // Styled input field
import { updateBudget } from "@/actions/budget"; // API call to update budget

// Main component for showing and updating budget
export function BudgetProgress({ initialBudget, currentExpenses }) {
  const [isEditing, setIsEditing] = useState(false); // Controls edit mode
  const [newBudget, setNewBudget] = useState(
    initialBudget?.amount?.toString() || ""
  ); // Budget input value state

  // Destructure fetch state from custom hook
  const {
    loading: isLoading,
    fn: updateBudgetFn,
    data: updatedBudget,
    error,
  } = useFetch(updateBudget);

  // Calculate budget usage in percentage
  const percentUsed = initialBudget
    ? (currentExpenses / initialBudget.amount) * 100
    : 0;

  // Handles budget update logic
  const handleUpdateBudget = async () => {
    const amount = parseFloat(newBudget);

    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    await updateBudgetFn(amount); // Trigger API call
  };

  // Reset to original and exit edit mode
  const handleCancel = () => {
    setNewBudget(initialBudget?.amount?.toString() || "");
    setIsEditing(false);
  };

  // Show success toast and exit edit mode if update successful
  useEffect(() => {
    if (updatedBudget?.success) {
      setIsEditing(false);
      toast.success("Budget updated successfully");
    }
  }, [updatedBudget]);

  // Show error toast on failure
  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to update budget");
    }
  }, [error]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex-1">
          <CardTitle className="text-sm font-medium">
            Monthly Budget (Default Account)
          </CardTitle>
          <div className="flex items-center gap-2 mt-1">
            {isEditing ? (
              // Render editable input if in edit mode
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                  className="w-32"
                  placeholder="Enter amount"
                  autoFocus
                  disabled={isLoading}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleUpdateBudget}
                  disabled={isLoading}
                >
                  <Check className="h-4 w-4 text-green-500" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ) : (
              // Render static view and pencil icon when not editing
              <>
                <CardDescription>
                  {initialBudget
                    ? `Rs.${currentExpenses.toFixed(
                        2
                      )} of Rs.${initialBudget.amount.toFixed(2)} spent`
                    : "No budget set"}
                </CardDescription>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(true)}
                  className="h-6 w-6"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {initialBudget && (
          <div className="space-y-2">
            <Progress
              value={percentUsed} // Percentage for progress bar
              extraStyles={`${
                percentUsed >= 90
                  ? "bg-red-500" // Alert color
                  : percentUsed >= 75
                  ? "bg-yellow-500" // Warning color
                  : "bg-green-500" // Normal color
              }`}
            />
            <p className="text-xs text-muted-foreground text-right">
              {percentUsed.toFixed(1)}% used
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/*
NOTES:

- `BudgetProgress` displays the current spending against a monthly budget.
- Allows users to edit the budget amount directly from the UI.
- Uses `useFetch` for async API call to update the budget in the database.
- Handles validation for non-numeric/invalid budget inputs.
- Visual feedback includes toast notifications for success/error and a progress bar.
- Progress bar color dynamically reflects budget usage (green, yellow, red).
- Keeps UI responsive and user-friendly with real-time feedback and smooth transitions.
*/
