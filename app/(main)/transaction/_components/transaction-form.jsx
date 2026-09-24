"use client";

import { useEffect } from "react"; // React hook for lifecycle
import { useForm } from "react-hook-form"; // Form management
import { zodResolver } from "@hookform/resolvers/zod"; // Zod schema validation integration
import { CalendarIcon, Loader2 } from "lucide-react"; // Icons for calendar and loading spinner
import { format } from "date-fns"; // Date formatting utility
import { useRouter, useSearchParams } from "next/navigation"; // Routing and URL search params in Next.js
import useFetch from "@/hooks/use-fetch"; // Custom hook for API calls
import { toast } from "sonner"; // Toast notifications

import { Button } from "@/components/ui/button"; // UI Button component
import { Input } from "@/components/ui/input"; // UI Input component
import { Switch } from "@/components/ui/switch"; // UI Switch component
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // UI Select components
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"; // UI Popover components
import { Calendar } from "@/components/ui/calendar"; // Calendar UI component
import { CreateAccountDrawer } from "@/components/create-account-drawer"; // Drawer for creating accounts
import { cn } from "@/lib/utils"; // Utility for conditional classNames
import { createTransaction, updateTransaction } from "@/actions/transaction"; // API actions
import { transactionSchema } from "@/app/lib/schema"; // Zod validation schema
import { ReceiptScanner } from "./recipt-scanner"; // Component for scanning receipts

export function AddTransactionForm({
  accounts,       // List of user accounts
  categories,     // List of categories to choose from
  editMode = false,   // Flag to check if form is in edit mode
  initialData = null, // Initial data for editing
}) {
  const router = useRouter(); // Router for navigation
  const searchParams = useSearchParams(); // Access query parameters
  const editId = searchParams.get("edit"); // Get edit id from URL params

  // Setup form with react-hook-form and zod validation
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
    reset,
  } = useForm({
    resolver: zodResolver(transactionSchema), // Validate using Zod schema
    defaultValues:
      editMode && initialData
        ? { // If edit mode, populate with initial data
            type: initialData.type,
            amount: initialData.amount.toString(),
            description: initialData.description,
            accountId: initialData.accountId,
            category: initialData.category,
            date: new Date(initialData.date),
            isRecurring: initialData.isRecurring,
            ...(initialData.recurringInterval && {
              recurringInterval: initialData.recurringInterval,
            }),
          }
        : { // Default values for create mode
            type: "EXPENSE",
            amount: "",
            description: "",
            accountId: accounts.find((ac) => ac.isDefault)?.id, // default account
            date: new Date(),
            isRecurring: false,
          },
  });

  // Setup custom hook to handle create or update transaction API call
  const {
    loading: transactionLoading,
    fn: transactionFn,
    data: transactionResult,
  } = useFetch(editMode ? updateTransaction : createTransaction);

  // On form submit
  const onSubmit = (data) => {
    const formData = {
      ...data,
      amount: parseFloat(data.amount), // Convert amount to float
    };

    if (editMode) {
      transactionFn(editId, formData); // Update transaction if in edit mode
    } else {
      transactionFn(formData); // Create new transaction otherwise
    }
  };

  // Handle receipt scan completion to auto-fill form fields
  const handleScanComplete = (scannedData) => {
    if (scannedData) {
      setValue("amount", scannedData.amount.toString());
      setValue("date", new Date(scannedData.date));
      if (scannedData.description) {
        setValue("description", scannedData.description);
      }
      if (scannedData.category) {
        setValue("category", scannedData.category);
      }
      toast.success("Receipt scanned successfully");
    }
  };

  // Effect to handle successful transaction creation or update
  useEffect(() => {
    if (transactionResult?.success && !transactionLoading) {
      toast.success(
        editMode
          ? "Transaction updated successfully"
          : "Transaction created successfully"
      );
      reset(); // Reset form after success
      router.push(`/account/${transactionResult.data.accountId}`); // Redirect to account page
    }
  }, [transactionResult, transactionLoading, editMode]);

  // Watch selected type, recurring toggle, and date for reactive UI changes
  const type = watch("type");
  const isRecurring = watch("isRecurring");
  const date = watch("date");

  // Filter categories based on selected transaction type (Income/Expense)
  const filteredCategories = categories.filter(
    (category) => category.type === type
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Show receipt scanner only when not editing */}
      {!editMode && <ReceiptScanner onScanComplete={handleScanComplete} />}

      {/* Transaction Type Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Type</label>
        <Select
          onValueChange={(value) => setValue("type", value)}
          defaultValue={type}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EXPENSE">Expense</SelectItem>
            <SelectItem value="INCOME">Income</SelectItem>
          </SelectContent>
        </Select>
        {errors.type && (
          <p className="text-sm text-red-500">{errors.type.message}</p>
        )}
      </div>

      {/* Amount and Account Selection */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Amount</label>
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register("amount")}
          />
          {errors.amount && (
            <p className="text-sm text-red-500">{errors.amount.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Account</label>
          <Select
            onValueChange={(value) => setValue("accountId", value)}
            defaultValue={getValues("accountId")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name} (Rs.{parseFloat(account.balance).toFixed(2)})
                </SelectItem>
              ))}
              {/* Option to create a new account */}
              <CreateAccountDrawer>
                <Button
                  variant="ghost"
                  className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                >
                  Create Account
                </Button>
              </CreateAccountDrawer>
            </SelectContent>
          </Select>
          {errors.accountId && (
            <p className="text-sm text-red-500">{errors.accountId.message}</p>
          )}
        </div>
      </div>

      {/* Category Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Category</label>
        <Select
          onValueChange={(value) => setValue("category", value)}
          defaultValue={getValues("category")}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {filteredCategories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && (
          <p className="text-sm text-red-500">{errors.category.message}</p>
        )}
      </div>

      {/* Date Picker */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Date</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full pl-3 text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              {date ? format(date, "PPP") : <span>Pick a date</span>}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(date) => setValue("date", date)}
              disabled={(date) =>
                date > new Date() || date < new Date("1900-01-01")
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {errors.date && (
          <p className="text-sm text-red-500">{errors.date.message}</p>
        )}
      </div>

      {/* Description Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <Input placeholder="Enter description" {...register("description")} />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description.message}</p>
        )}
      </div>

      {/* Recurring Transaction Toggle */}
      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <label className="text-base font-medium">Recurring Transaction</label>
          <div className="text-sm text-muted-foreground">
            Set up a recurring schedule for this transaction
          </div>
        </div>
        <Switch
          checked={isRecurring}
          onCheckedChange={(checked) => setValue("isRecurring", checked)}
        />
      </div>

      {/* Recurring Interval Selector (shown only if recurring is enabled) */}
      {isRecurring &&
      (
  <div className="space-y-2">
  <label className="text-sm font-medium">Recurring Interval</label>
  <Select
  onValueChange={(value) => setValue("recurringInterval", value)}
  defaultValue={getValues("recurringInterval")}
  >
  <SelectTrigger>
  <SelectValue placeholder="Select interval" />
  </SelectTrigger>
  <SelectContent>
  <SelectItem value="DAILY">Daily</SelectItem>
  <SelectItem value="WEEKLY">Weekly</SelectItem>
  <SelectItem value="MONTHLY">Monthly</SelectItem>
  <SelectItem value="YEARLY">Yearly</SelectItem>
  </SelectContent>
  </Select>
  {errors.recurringInterval && (
  <p className="text-sm text-red-500">
  {errors.recurringInterval.message}
  </p>
  )}
</div>
)}
  {/* Submit and Cancel Buttons */}
  <div className="flex gap-4">
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={() => router.back()}
    >
      Cancel
    </Button>
    <Button type="submit" className="w-full" disabled={transactionLoading}>
      {transactionLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {editMode ? "Updating..." : "Creating..."}
        </>
      ) : editMode ? (
        "Update Transaction"
      ) : (
        "Create Transaction"
      )}
    </Button>
  </div>
</form>
);
}

/*
NOTES:

This form component handles both creation and editing of transactions.

Includes support for recurring transaction setup and receipt scanning.

Dynamic form state is managed using react-hook-form and Zod.

Provides category filtering based on transaction type (Income/Expense).

Uses modular UI components (Select, Popover, Calendar, Button).

Scanned receipt data auto-fills form fields when available.

Shows different defaults and behaviors based on editMode.
*/