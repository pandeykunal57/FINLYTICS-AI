"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Trash,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Clock,
} from "lucide-react"; // Icons for UI elements
import { format } from "date-fns"; // Date formatting library
import { toast } from "sonner"; // Toast notifications

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; // Table components from UI library
import { Input } from "@/components/ui/input"; // Input field component
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Select dropdown components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"; // Dropdown menu components
import { Checkbox } from "@/components/ui/checkbox"; // Checkbox component
import { Button } from "@/components/ui/button"; // Button component
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // Tooltip components for hover info
import { Badge } from "@/components/ui/badge"; // Badge component for labels
import { cn } from "@/lib/utils"; // Utility for conditional classNames
import { categoryColors } from "@/data/categories"; // Color mappings for categories
import { bulkDeleteTransactions } from "@/actions/account"; // API action for bulk delete
import useFetch from "@/hooks/use-fetch"; // Custom fetch hook for API calls
import { BarLoader } from "react-spinners"; // Loading spinner component
import { useRouter } from "next/navigation"; // Next.js router for navigation

const ITEMS_PER_PAGE = 10; // Number of transactions to show per page

// Map recurring interval keys to human-readable labels
const RECURRING_INTERVALS = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

export function TransactionTable({ transactions }) {
  // State for selected transaction IDs (for bulk actions)
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Sorting config: field and direction (asc or desc)
  const [sortConfig, setSortConfig] = useState({
    field: "date",
    direction: "desc",
  });
  
  // Filter states for search, type, recurring transactions
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [recurringFilter, setRecurringFilter] = useState("");
  
  // Current page number for pagination
  const [currentPage, setCurrentPage] = useState(1);

  const router = useRouter();

  // Compute filtered and sorted transactions whenever dependencies change
  const filteredAndSortedTransactions = useMemo(() => {
    let result = [...transactions]; // Clone array to avoid mutation

    // Filter by search term in description (case-insensitive)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter((transaction) =>
        transaction.description?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by transaction type (INCOME/EXPENSE)
    if (typeFilter) {
      result = result.filter((transaction) => transaction.type === typeFilter);
    }

    // Filter by recurring status
    if (recurringFilter) {
      result = result.filter((transaction) => {
        if (recurringFilter === "recurring") return transaction.isRecurring;
        return !transaction.isRecurring;
      });
    }

    // Sort transactions by selected field and direction
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortConfig.field) {
        case "date":
          comparison = new Date(a.date) - new Date(b.date);
          break;
        case "amount":
          comparison = a.amount - b.amount;
          break;
        case "category":
          comparison = a.category.localeCompare(b.category);
          break;
        default:
          comparison = 0;
      }
      return sortConfig.direction === "asc" ? comparison : -comparison;
    });

    return result;
  }, [transactions, searchTerm, typeFilter, recurringFilter, sortConfig]);

  // Calculate total number of pages for pagination
  const totalPages = Math.ceil(
    filteredAndSortedTransactions.length / ITEMS_PER_PAGE
  );

  // Paginate filtered + sorted transactions for current page
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedTransactions.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );
  }, [filteredAndSortedTransactions, currentPage]);

  // Toggle sorting direction or change field
  const handleSort = (field) => {
    setSortConfig((current) => ({
      field,
      direction:
        current.field === field && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Toggle select/deselect single transaction ID
  const handleSelect = (id) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  // Toggle select/deselect all visible transactions on current page
  const handleSelectAll = () => {
    setSelectedIds((current) =>
      current.length === paginatedTransactions.length
        ? []
        : paginatedTransactions.map((t) => t.id)
    );
  };

  // Custom hook for bulk delete API call
  const {
    loading: deleteLoading,
    fn: deleteFn,
    data: deleted,
  } = useFetch(bulkDeleteTransactions);

  // Confirm and call bulk delete API
  const handleBulkDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedIds.length} transactions?`
      )
    )
      return;

    deleteFn(selectedIds);
  };

  // Show toast on successful deletion
  useEffect(() => {
    if (deleted && !deleteLoading) {
      toast.error("Transactions deleted successfully");
    }
  }, [deleted, deleteLoading]);

  // Clear all filters and reset to first page
  const handleClearFilters = () => {
    setSearchTerm("");
    setTypeFilter("");
    setRecurringFilter("");
    setCurrentPage(1);
  };

  // Change current page and clear selected checkboxes
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    setSelectedIds([]); // Clear selection on page switch
  };

  return (
    <div className="space-y-4">
      {/* Loading spinner during delete operation */}
      {deleteLoading && (
        <BarLoader className="mt-4" width={"100%"} color="#9333ea" />
      )}

      {/* Filters: Search, Type, Recurring */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page on filter change
            }}
            className="pl-8"
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={typeFilter}
            onValueChange={(value) => {
              setTypeFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INCOME">Income</SelectItem>
              <SelectItem value="EXPENSE">Expense</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={recurringFilter}
            onValueChange={(value) => {
              setRecurringFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="All Transactions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recurring">Recurring Only</SelectItem>
              <SelectItem value="non-recurring">Non-recurring Only</SelectItem>
            </SelectContent>
          </Select>

          {/* Bulk Delete Button */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                <Trash className="h-4 w-4 mr-2" />
                Delete Selected ({selectedIds.length})
              </Button>
            </div>
          )}

          {/* Clear Filters Button */}
          {(searchTerm || typeFilter || recurringFilter) && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleClearFilters}
              title="Clear filters"
            >
              <X className="h-4 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {/* Select All Checkbox */}
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={
                    selectedIds.length === paginatedTransactions.length &&
                    paginatedTransactions.length > 0
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>

              {/* Sortable Columns: Date */}
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("date")}
              >
                <div className="flex items-center">
                  Date
                  {sortConfig.field === "date" &&
                    (sortConfig.direction === "asc" ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
) : (
<ChevronDown className="ml-1 h-4 w-4" />
))}
</div>
</TableHead>
          {/* Description Column */}
          <TableHead>Description</TableHead>

          {/* Sortable Columns: Category */}
          <TableHead
            className="cursor-pointer"
            onClick={() => handleSort("category")}
          >
            <div className="flex items-center">
              Category
              {sortConfig.field === "category" &&
                (sortConfig.direction === "asc" ? (
                  <ChevronUp className="ml-1 h-4 w-4" />
                ) : (
                  <ChevronDown className="ml-1 h-4 w-4" />
                ))}
            </div>
          </TableHead>

          {/* Sortable Columns: Amount */}
          <TableHead
            className="cursor-pointer text-right"
            onClick={() => handleSort("amount")}
          >
            <div className="flex items-center justify-end">
              Amount
              {sortConfig.field === "amount" &&
                (sortConfig.direction === "asc" ? (
                  <ChevronUp className="ml-1 h-4 w-4" />
                ) : (
                  <ChevronDown className="ml-1 h-4 w-4" />
                ))}
            </div>
          </TableHead>

          {/* Recurring Column */}
          <TableHead>Recurring</TableHead>

          {/* Actions Column */}
          <TableHead className="w-[50px]" />
        </TableRow>
      </TableHeader>

      <TableBody>
        {/* No Transactions Found */}
        {paginatedTransactions.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={7}
              className="text-center text-muted-foreground"
            >
              No transactions found
            </TableCell>
          </TableRow>
        ) : (
          // Render paginated transactions
          paginatedTransactions.map((transaction) => (
            <TableRow key={transaction.id}>
              {/* Select Row Checkbox */}
              <TableCell>
                <Checkbox
                  checked={selectedIds.includes(transaction.id)}
                  onCheckedChange={() => handleSelect(transaction.id)}
                />
              </TableCell>

              {/* Date formatted */}
              <TableCell>{format(new Date(transaction.date), "PP")}</TableCell>

              {/* Description */}
              <TableCell>{transaction.description}</TableCell>

              {/* Category with background color */}
              <TableCell className="capitalize">
                <span
                  style={{
                    background: categoryColors[transaction.category],
                  }}
                  className="px-2 py-1 rounded text-white text-sm"
                >
                  {transaction.category}
                </span>
              </TableCell>

              {/* Amount with color & sign based on type */}
              <TableCell
                className={cn(
                  "text-right font-medium",
                  transaction.type === "EXPENSE"
                    ? "text-red-500"
                    : "text-green-500"
                )}
              >
                {transaction.type === "EXPENSE" ? "-" : "+"}Rs.
                {transaction.amount.toFixed(2)}
              </TableCell>

              {/* Recurring Badge with Tooltip */}
              <TableCell>
                {transaction.isRecurring ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge
                          variant="secondary"
                          className="gap-1 bg-purple-100 text-purple-700 hover:bg-purple-200"
                        >
                          <RefreshCw className="h-3 w-3" />
                          {
                            RECURRING_INTERVALS[
                              transaction.recurringInterval
                            ]
                          }
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-sm">
                          <div className="font-medium">Next Date:</div>
                          <div>
                            {format(
                              new Date(transaction.nextRecurringDate),
                              "PPP"
                            )}
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  // One-time transaction badge
                  <Badge variant="outline" className="gap-1">
                    <Clock className="h-3 w-3" />
                    One-time
                  </Badge>
                )}
              </TableCell>

              {/* Actions Dropdown */}
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() =>
                        router.push(
                          `/transaction/create?edit=${transaction.id}`
                        )
                      }
                    >
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => deleteFn([transaction.id])}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>

  {/* Pagination Controls */}
  {totalPages > 1 && (
    <div className="flex items-center justify-center gap-2">
      {/* Previous Page */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Page Indicator */}
      <span className="text-sm">
        Page {currentPage} of {totalPages}
      </span>

      {/* Next Page */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )}
</div>
);
}

/*
NOTES:

This component displays a transaction table with:

Search by description

Filters by type (Income/Expense) and recurring status

Sorting by date, amount, or category (toggle ascending/descending)

Pagination showing 10 transactions per page

Bulk selection with select all on current page

Bulk deletion with confirmation and toast feedback

Each row shows transaction details with colored badges for category and recurring info

Actions per row include Edit (navigates to edit page) and Delete

Responsive and accessible UI with tooltips and dropdown menus

Loading spinner shows during delete operation

Page changes reset selected checkboxes to avoid accidental bulk actions.

Clear filters button resets all filters and pagination.

Sort icons indicate active sorting column and direction.

Ideal for managing large sets of financial transactions with rich interactivity and usability.
*/
