import { AlertTriangle, Camera, CheckCircle2, Circle, Clock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  formatCurrency,
  MILESTONE_STATUS_LABEL,
  type Milestone,
} from "@/lib/mock-data";
import StatusPill from "@/components/status-pill";
import { MILESTONE_STATUS_TONE } from "@/lib/status";

const STATUS_ICON: Record<Milestone["status"], LucideIcon> = {
  pending: Circle,
  in_progress: Clock,
  proof_submitted: Camera,
  approved: CheckCircle2,
  released: CheckCircle2,
  flagged: AlertTriangle,
};

const STATUS_ICON_TONE: Record<Milestone["status"], string> = {
  pending: "text-ink-300 bg-ink-50",
  in_progress: "text-brand-600 bg-brand-50",
  proof_submitted: "text-amber-500 bg-amber-100",
  approved: "text-mint-500 bg-mint-100",
  released: "text-mint-500 bg-mint-100",
  flagged: "text-rose-500 bg-rose-100",
};

export default function MilestoneTimeline({
  milestones,
}: {
  milestones: Milestone[];
}) {
  return (
    <ol className="relative">
      {milestones.map((m, idx) => {
        const Icon = STATUS_ICON[m.status];
        const isLast = idx === milestones.length - 1;
        return (
          <li key={m.id} className="relative flex gap-4 pb-8 last:pb-0">
            {!isLast && (
              <span className="absolute left-[19px] top-10 bottom-0 w-px bg-ink-200" />
            )}
            <span
              className={`relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full ${STATUS_ICON_TONE[m.status]}`}
            >
              <Icon className="size-5" strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1 pt-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-ink-900">
                  {m.order}. {m.stage}
                </p>
                <StatusPill
                  label={MILESTONE_STATUS_LABEL[m.status]}
                  tone={MILESTONE_STATUS_TONE[m.status]}
                />
              </div>
              <p className="mt-0.5 text-sm text-ink-500">
                {formatCurrency(m.escrowAmount)} in escrow · due{" "}
                {new Date(m.dueDate).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
