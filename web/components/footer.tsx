import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-ink-100 mt-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-brand-600 text-white">
            <ShieldCheck className="size-4" strokeWidth={2.5} />
          </span>
          <span className="text-sm text-ink-500">
            © 2026 Bankole. Verified people, milestone-locked funds, independent
            proof of progress.
          </span>
        </div>
        <div className="flex gap-6 text-sm text-ink-500">
          <Link href="/dashboard" className="hover:text-ink-900">
            Dashboard
          </Link>
          <Link href="/agents" className="hover:text-ink-900">
            Verified agents
          </Link>
          <Link href="/projects/new" className="hover:text-ink-900">
            Start a project
          </Link>
        </div>
      </div>
    </footer>
  );
}
