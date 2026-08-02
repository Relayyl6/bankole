import { Clock, MapPin, PlayCircle } from "lucide-react";
import type { ProgressProof } from "@/lib/mock-data";
import StatusPill from "@/components/status-pill";

const PROOF_STATUS_TONE = {
  pending_review: "brand",
  approved: "success",
  flagged: "danger",
} as const;

const PROOF_STATUS_LABEL = {
  pending_review: "Awaiting your review",
  approved: "Approved",
  flagged: "Concern flagged",
} as const;

export default function ProgressProofCard({
  proof,
  actions,
}: {
  proof: ProgressProof;
  actions?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white shadow-soft overflow-hidden flex flex-col">
      <div
        className="relative h-36 bg-gradient-to-br from-brand-200 to-brand-500 flex items-center justify-center"
        aria-hidden
      >
        {proof.type === "video" && (
          <PlayCircle className="size-10 text-white/90" strokeWidth={1.5} />
        )}
        <span className="absolute top-2 right-2">
          <StatusPill
            label={PROOF_STATUS_LABEL[proof.status]}
            tone={PROOF_STATUS_TONE[proof.status]}
          />
        </span>
      </div>
      <div className="p-4 flex-1 flex flex-col gap-2">
        <p className="text-sm font-medium text-ink-900">{proof.caption}</p>
        <div className="flex items-center gap-1.5 text-xs text-ink-500">
          <MapPin className="size-3.5" />
          {proof.location} · {proof.geoTag}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-ink-500">
          <Clock className="size-3.5" />
          {new Date(proof.timestamp).toLocaleString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
        {actions && <div className="mt-auto pt-2">{actions}</div>}
      </div>
    </div>
  );
}
