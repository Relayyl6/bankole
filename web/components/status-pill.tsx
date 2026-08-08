const TONES = {
  neutral: "bg-ink-100 text-ink-700",
  brand: "bg-brand-100 text-brand-700",
  success: "bg-mint-100 text-mint-500",
  warning: "bg-amber-100 text-amber-500",
  danger: "bg-rose-100 text-rose-500",
} as const;

export type StatusTone = keyof typeof TONES;

export default function StatusPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: StatusTone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-xl px-2.5 py-1 text-xs font-semibold ${TONES[tone]}`}
    >
      {label}
    </span>
  );
}
