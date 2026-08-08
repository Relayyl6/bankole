"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, ShieldCheck, X, Search, Bell, Settings, User, LogIn } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/agents", label: "Verified agents" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user, role } = useAuth();
  const router = useRouter();

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      router.push(`/agents?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-transparent pt-4 pb-2">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="flex size-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-soft">
            <ShieldCheck className="size-5" strokeWidth={2.5} />
          </span>
          <span className="text-xl font-bold tracking-tight text-ink-900">
            Bankole
          </span>
        </Link>

        {/* Center Links */}
        <nav className="hidden md:flex items-center gap-8">
          {LINKS.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-1 py-4 text-sm font-bold transition-colors ${
                  active ? "text-brand-700" : "text-ink-500 hover:text-ink-900"
                }`}
              >
                {link.label}
                {active && (
                  <span className="absolute bottom-1 left-0 h-[3px] w-full rounded-t-full bg-brand-600" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Section */}
        <div className="hidden lg:flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-400" />
            <input
              type="text"
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              className="w-48 rounded-full bg-white py-2 pl-9 pr-4 text-sm outline-none placeholder:text-ink-400 focus:ring-2 focus:ring-brand-500 shadow-soft"
            />
          </div>
          
          {user ? (
            <>
              <div className="flex items-center gap-2">
                <button className="flex size-10 items-center justify-center rounded-full bg-white text-ink-500 shadow-soft hover:text-ink-900 transition-colors">
                  <Settings className="size-5" />
                </button>
                <button className="flex size-10 items-center justify-center rounded-full bg-white text-ink-500 shadow-soft hover:text-ink-900 transition-colors">
                  <Bell className="size-5" />
                </button>
              </div>
              <Link href="/profile" className="flex size-10 items-center justify-center rounded-full bg-brand-100 text-brand-700 shadow-soft overflow-hidden border-2 border-white hover:ring-2 hover:ring-brand-500 hover:ring-offset-1 transition-all">
                <User className="size-5" />
              </Link>
              <Link
                href="/projects/new"
                className="ml-2 inline-flex items-center rounded-full bg-brand-600 px-5 py-2.5 text-sm font-bold text-white shadow-soft hover:bg-brand-700 transition-colors"
              >
                Start a project
              </Link>
            </>
          ) : (
            <Link
              href="/agents/apply"
              className="ml-2 inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-bold text-white shadow-soft hover:bg-brand-700 transition-colors"
            >
              <LogIn className="size-4" />
              Login / Sign up
            </Link>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          type="button"
          className="lg:hidden flex size-10 items-center justify-center rounded-full bg-white shadow-soft text-ink-700"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="lg:hidden mx-4 mt-2 rounded-[24px] bg-white p-4 shadow-soft flex flex-col gap-2">
          {LINKS.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`rounded-xl px-4 py-3 text-sm font-bold ${
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-ink-700 hover:bg-ink-50"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/projects/new"
            onClick={() => setOpen(false)}
            className="mt-2 inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white shadow-sm"
          >
            Start a project
          </Link>
        </div>
      )}
    </header>
  );
}
