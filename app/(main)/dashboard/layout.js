// Import the actual dashboard content from the local page file
import DashboardPage from "./page";

// Import a loading spinner from react-spinners for visual feedback during suspense
import { BarLoader } from "react-spinners";

// React's Suspense component to handle lazy loading and fallback UI
import { Suspense } from "react";

// Functional component named Layout (used as the wrapper layout for the Dashboard page)
export default function Layout() {
  return (
    <div className="px-5"> {/* Padding on x-axis for consistent layout spacing */}
      <div className="flex items-center justify-between mb-5">
        {/* Dashboard title with gradient style and spacing */}
        <h1 className="text-6xl font-bold tracking-tight gradient-title">
          Dashboard
        </h1>
      </div>

      {/* Suspense handles asynchronous loading with a fallback loader */}
      <Suspense
        fallback={<BarLoader className="mt-4" width={"100%"} color="#9333ea" />}
      >
        {/* The main dashboard page is rendered here when ready */}
        <DashboardPage />
      </Suspense>
    </div>
  );
}

/*
NOTES:

- This layout acts as a container for the Dashboard page.
- Includes a title section styled with gradient text and bold typography.
- Uses <Suspense> to show a purple bar loader while the `DashboardPage` component is being rendered asynchronously.
- Enhances user experience by providing immediate feedback during data loading.
- Maintains spacing and structure using utility classes (TailwindCSS).

*/
