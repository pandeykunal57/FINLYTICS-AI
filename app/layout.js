// Importing Inter font from Google Fonts through Next.js
import { Inter } from "next/font/google";

// Importing global CSS styles
import "./globals.css";

// Importing the Header component
import Header from "@/components/header";

// Importing ClerkProvider for authentication context
import { ClerkProvider } from "@clerk/nextjs";

// Importing Toaster from 'sonner' for notification/toast support
import { Toaster } from "sonner";

// Loading Inter font with 'latin' subset
const inter = Inter({ subsets: ["latin"] });

// Defining metadata for the website (used for SEO, browser tab title, etc.)
export const metadata = {
  title: "FINLYTICS AI",
  description: "Automate Your Finance ,Optimize Your Future",
};

// This is the main layout component that wraps the entire application
export default function RootLayout({ children }) {
  return (
    // ClerkProvider wraps the whole app to provide user session/authentication context
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.className}`}> {/* Apply Inter font to the body */}

          {/* Header component shown at the top of every page */}
          <Header />

          {/* Main content of the page goes here, occupies full viewport height */}
          <main className="min-h-screen">{children}</main>

          {/* Toast notifications with rich colors */}
          <Toaster richColors />

          {/* Footer section at the bottom of the page */}
          <footer className="bg-blue-50 py-12"> {/* Blue background with vertical padding */}
            <div className="container mx-auto px-4 text-center text-gray-600">
              <p>Made by KP</p> {/* Footer text */}
            </div>
          </footer>

        </body>
      </html>
    </ClerkProvider>
  );
}
//  ClerkProvider: Wraps the app to provide authentication via Clerk (used for managing user sessions, auth).

// Inter: Font from Google Fonts, loaded with latin subset for typography consistency.

// Header: Reusable component rendered at the top of every page.

// children: Dynamic content injected into the layout depending on the route (via pages or app router).

// Toaster: Displays notifications (e.g., success or error messages).

// Footer: Simple site footer with a name/signature, styled with Tailwind CSS.

//  min-h-screen: Ensures the main content area stretches at least the height of the screen