import type { LucideIcon } from "lucide-react";

export default function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-2xl bg-white shadow-soft p-5 flex items-start gap-4">
      <div className="shrink-0 size-11 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center">
        <Icon className="size-5" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-ink-500">{label}</p>
        <p className="text-xl font-semibold text-ink-900 tracking-tight truncate">
          {value}
        </p>
        {hint && <p className="text-xs text-ink-400 mt-0.5">{hint}</p>}
      </div>
    </div>
  );
}
