import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import SmoothScroll from "@/components/SmoothScroll";
import AppLockWrapper from "@/components/AppLockWrapper";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#000000",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Trackr — Expense Tracker",
  description: "Track your expenses, manage budgets, and gain insights into your spending.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Trackr",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body>
          <AppLockWrapper>
            <SmoothScroll>
              {children}
            </SmoothScroll>
          </AppLockWrapper>
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
