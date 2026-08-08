import { formatCurrency } from "@/lib/models";

export default function BudgetBar({
  totalBudget,
  fundsReleased,
  fundsInEscrow,
  compact = false,
}: {
  totalBudget: number;
  fundsReleased: number;
  fundsInEscrow: number;
  compact?: boolean;
}) {
  const releasedPct = Math.min(100, (fundsReleased / totalBudget) * 100);
  const escrowPct = Math.min(100 - releasedPct, (fundsInEscrow / totalBudget) * 100);

  return (
    <div>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-ink-100">
        <div
          className="h-full bg-brand-600"
          style={{ width: `${releasedPct}%` }}
          title={`Released: ${formatCurrency(fundsReleased)}`}
        />
        <div
          className="h-full bg-brand-200"
          style={{ width: `${escrowPct}%` }}
          title={`In escrow: ${formatCurrency(fundsInEscrow)}`}
        />
      </div>
      {!compact && (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-brand-600" />
            Released {formatCurrency(fundsReleased)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-brand-200" />
            In escrow {formatCurrency(fundsInEscrow)}
          </span>
          <span className="text-ink-400">of {formatCurrency(totalBudget)} total</span>
        </div>
      )}
    </div>
  );
}
