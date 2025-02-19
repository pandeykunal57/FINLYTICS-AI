import {  Inter } from "next/font/google";
import "./globals.css";

const inter=Inter({subsets:["latin"]});

export const metadata = {
  title: "FINLYTICS AI",
  description: "Automate Your Finance ,Optimize Your Future",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${inter.className}`}
      >
        {children}
      </body>
    </html>
  );
}
