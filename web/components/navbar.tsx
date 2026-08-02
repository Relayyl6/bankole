"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, ShieldCheck, X } from "lucide-react";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/agents", label: "Verified agents" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="flex size-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <ShieldCheck className="size-4.5" strokeWidth={2.5} />
          </span>
          <span className="text-lg font-semibold tracking-tight text-ink-900">
            Bankole
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-ink-600 hover:text-ink-900 hover:bg-ink-50"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:block">
          <Link
            href="/projects/new"
            className="inline-flex items-center rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-soft hover:bg-brand-700 transition-colors"
          >
            Start a project
          </Link>
        </div>

        <button
          type="button"
          className="md:hidden flex size-9 items-center justify-center rounded-full text-ink-700 hover:bg-ink-50"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-ink-100 bg-background px-4 pb-4 pt-2 flex flex-col gap-1">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/projects/new"
            onClick={() => setOpen(false)}
            className="mt-1 inline-flex items-center justify-center rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Start a project
          </Link>
        </div>
      )}
    </header>
  );
}
