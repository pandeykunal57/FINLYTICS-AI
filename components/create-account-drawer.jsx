"use client"; // Marks this file as a client-side component (required for hooks like useState)

import { useState, useEffect } from "react"; // React hooks
import { useForm } from "react-hook-form"; // Hook for managing form state
import { zodResolver } from "@hookform/resolvers/zod"; // Integrates Zod schema validation with react-hook-form
import { Loader2 } from "lucide-react"; // Loading spinner icon
import useFetch from "@/hooks/use-fetch"; // Custom hook for API call handling
import { toast } from "sonner"; // Notification library

// UI components
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import { createAccount } from "@/actions/dashboard"; // Function to create an account (API call)
import { accountSchema } from "@/app/lib/schema"; // Zod schema for form validation

// Functional component to handle account creation through a drawer
export function CreateAccountDrawer({ children }) {
  const [open, setOpen] = useState(false); // Controls whether the drawer is open

  // React Hook Form setup with default values and Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: "",
      type: "CURRENT",
      balance: "",
      isDefault: false,
    },
  });

  // Custom hook to handle API interaction
  const {
    loading: createAccountLoading,
    fn: createAccountFn,
    error,
    data: newAccount,
  } = useFetch(createAccount);

  // Form submission handler
  const onSubmit = async (data) => {
    await createAccountFn(data); // Call API to create account
  };

  // Effect to close drawer and reset form if account is created
  useEffect(() => {
    if (newAccount) {
      toast.success("Account created successfully");
      reset(); // Reset form fields
      setOpen(false); // Close drawer
    }
  }, [newAccount, reset]);

  // Effect to show error message if account creation fails
  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to create account");
    }
  }, [error]);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Create New Account</DrawerTitle>
        </DrawerHeader>

        {/* Drawer form for account creation */}
        <div className="px-4 pb-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Account Name Field */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Account Name
              </label>
              <Input
                id="name"
                placeholder="e.g., Main Checking"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Account Type Select */}
            <div className="space-y-2">
              <label htmlFor="type" className="text-sm font-medium">
                Account Type
              </label>
              <Select
                onValueChange={(value) => setValue("type", value)}
                defaultValue={watch("type")}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CURRENT">Current</SelectItem>
                  <SelectItem value="SAVINGS">Savings</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-red-500">{errors.type.message}</p>
              )}
            </div>

            {/* Initial Balance Input */}
            <div className="space-y-2">
              <label htmlFor="balance" className="text-sm font-medium">
                Initial Balance
              </label>
              <Input
                id="balance"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register("balance")}
              />
              {errors.balance && (
                <p className="text-sm text-red-500">{errors.balance.message}</p>
              )}
            </div>

            {/* Default Account Toggle */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <label htmlFor="isDefault" className="text-base font-medium ">
                  Set as Default
                </label>
                <p className="text-sm text-muted-foreground">
                  This account will be selected by default for transactions
                </p>
              </div>
              <Switch
                id="isDefault"
                checked={watch("isDefault")}
                onCheckedChange={(checked) => setValue("isDefault", checked)}
              />
            </div>

            {/* Form Buttons */}
            <div className="flex gap-4 pt-4">
              <DrawerClose asChild>
                <Button type="button" variant="outline" className="flex-1">
                  Cancel
                </Button>
              </DrawerClose>
              <Button
                type="submit"
                className="flex-1"
                disabled={createAccountLoading}
              >
                {createAccountLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </div>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
 

// This component displays a drawer modal that allows users to create a new bank account.

// Uses react-hook-form with Zod validation to ensure safe and correct input.

// Custom useFetch hook handles the API call to create an account, showing loading states and toast messages on success/failure.

// Drawer UI includes fields for name, type, balance, and a toggle to mark it as the default account.

// Includes accessibility, error handling, and feedback to the user (via toast and disabled buttons).

// Modular and reusable using headless UI primitives from your design system.