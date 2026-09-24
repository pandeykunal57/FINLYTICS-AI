import { useState } from "react"; // Importing useState hook to manage component state
import { toast } from "sonner"; // Importing toast utility from 'sonner' for showing error notifications

// Custom hook to handle async data fetching logic
const useFetch = (cb) => {
  // State for storing fetched data
  const [data, setData] = useState(undefined);

  // State for tracking loading state (null by default)
  const [loading, setLoading] = useState(null);

  // State for storing error, if any occurs during fetch
  const [error, setError] = useState(null);

  // Core function to execute the async operation
  const fn = async (...args) => {
    setLoading(true);      // Set loading to true before starting fetch
    setError(null);        // Clear any previous error

    try {
      const response = await cb(...args); // Execute the callback function with given arguments
      setData(response);                 // Set the fetched data to state
      setError(null);                    // Clear any existing error (if previous call had failed)
    } catch (error) {
      setError(error);                   // Store the error in state
      toast.error(error.message);        // Display a toast notification for the error
    } finally {
      setLoading(false);                 // Set loading to false after the fetch completes (either way)
    }
  };

  // Return the data, loading state, error, the fetch function, and a setter for data
  return { data, loading, error, fn, setData };
};

export default useFetch; // Export the custom hook


// useFetch is a reusable custom React hook for handling async API calls.

// It manages loading, error, and data states internally, abstracting repetitive fetch logic.

// It also uses the sonner library to notify users of any fetch errors via toast.

// The callback cb is passed when calling useFetch(cb), and executed inside fn.

// You can call fn with any arguments and it will trigger the fetch process.