"use client";

import { useRef, useEffect } from "react"; // React hooks for ref and lifecycle
import { Camera, Loader2 } from "lucide-react"; // Icons for camera and loading spinner
import { Button } from "@/components/ui/button"; // Reusable button component
import { toast } from "sonner"; // Toast notifications for user feedback
import useFetch from "@/hooks/use-fetch"; // Custom hook to handle API calls
import { scanReceipt } from "@/actions/transaction"; // API action for receipt scanning

export function ReceiptScanner({ onScanComplete }) {
  // Reference to hidden file input element
  const fileInputRef = useRef(null);

  // Destructure loading state, function to call API, and response data from useFetch hook
  const {
    loading: scanReceiptLoading,
    fn: scanReceiptFn,
    data: scannedData,
  } = useFetch(scanReceipt);

  // Function to handle file upload and call API
  const handleReceiptScan = async (file) => {
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }

    // Call the receipt scanning function with file
    await scanReceiptFn(file);
  };

  // Use effect to trigger callback when scan completes and data is available
  useEffect(() => {
    if (scannedData && !scanReceiptLoading) {
      onScanComplete(scannedData); // Pass scanned data to parent component
      toast.success("Receipt scanned successfully"); // Notify user of success
    }
  }, [scanReceiptLoading, scannedData]);

  return (
    <div className="flex items-center gap-4">
      {/* Hidden file input for image upload with camera capture */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleReceiptScan(file); // Handle file when selected
        }}
      />
      {/* Button triggers file input click */}
      <Button
        type="button"
        variant="outline"
        className="w-full h-10 bg-gradient-to-br from-orange-500 via-pink-500 to-purple-500 animate-gradient hover:opacity-90 transition-opacity text-white hover:text-white"
        onClick={() => fileInputRef.current?.click()}
        disabled={scanReceiptLoading} // Disable button while scanning
      >
        {/* Show spinner and loading text while scanning */}
        {scanReceiptLoading ? (
          <>
            <Loader2 className="mr-2 animate-spin" />
            <span>Scanning Receipt...</span>
          </>
        ) : (
          <>
            {/* Show camera icon and prompt when idle */}
            <Camera className="mr-2" />
            <span>Scan Receipt with AI</span>
          </>
        )}
      </Button>
    </div>
  );
}

/*
Notes:
- This component allows users to upload an image file of a receipt for AI-powered scanning.
- The hidden file input is triggered via the styled button click.
- File size validation prevents uploads larger than 5MB.
- Upon file selection, the receipt scanning API is called using a custom hook.
- When scanning completes, the scanned data is passed up via the onScanComplete callback.
- User feedback is provided with toast notifications for success and errors.
- Button UI updates to show loading state with spinner and disables input during scan.
*/
