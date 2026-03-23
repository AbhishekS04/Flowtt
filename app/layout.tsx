import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trackr — Expense Tracker",
  description: "Track your expenses, manage budgets, and gain insights into your spending.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#1a1a1a",
                border: "1px solid #2a2a2a",
                color: "#e5e5e5",
              },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
