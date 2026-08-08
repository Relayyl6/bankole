import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-24 pb-10 px-4 sm:px-6">
      <div className="mx-auto max-w-6xl p-6 sm:p-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between bg-white rounded-[32px] shadow-soft">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-soft">
            <ShieldCheck className="size-5" strokeWidth={2.5} />
          </span>
          <span className="text-sm font-medium text-ink-500 max-w-md">
            © 2026 Bankole. Verified people, milestone-locked funds, independent proof of progress.
          </span>
        </div>
        <div className="flex flex-wrap gap-6 text-sm font-semibold text-ink-500">
          <Link href="/dashboard" className="hover:text-ink-900 transition-colors">
            Dashboard
          </Link>
          <Link href="/dashboard/agents" className="hover:text-ink-900 transition-colors">
            Verified agents
          </Link>
          <Link href="/projects/new" className="hover:text-brand-600 transition-colors">
            Start a project
          </Link>
        </div>
      </div>
    </footer>
  );
}
