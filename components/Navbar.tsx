"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/expenses", label: "Expenses", icon: "📋" },
  { href: "/add", label: "Add", icon: "➕" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <>
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 bg-bg/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-xl font-extrabold bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent tracking-tight hover:opacity-80 transition-opacity">
              Trackr
            </Link>
            <div className="hidden md:flex items-center gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    pathname === link.href
                      ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
                      : "text-text-muted hover:text-text-primary hover:bg-card-hover"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <span className="hidden md:block text-sm font-medium text-text-muted">
                {user.firstName}
              </span>
            )}
            <div className="ring-2 ring-border rounded-full hover:ring-primary/50 transition-all">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9",
                  },
                }}
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-bg/90 backdrop-blur-lg border-t border-border md:hidden mb-safe pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-around h-16 px-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-[10px] font-semibold transition-all duration-300 ${
                pathname === link.href ? "text-primary scale-110" : "text-text-muted hover:text-text-primary"
              }`}
            >
              <span className="text-xl mb-0.5">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
