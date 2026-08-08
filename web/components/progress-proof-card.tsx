import Link from "next/link";
import { Clock, MapPin, PlayCircle } from "lucide-react";
import type { ProgressProof } from "@/lib/models";
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
    <div className="rounded-[24px] bg-white shadow-soft overflow-hidden flex flex-col group hover:shadow-soft-lg transition-all border border-transparent hover:border-brand-100">
      <Link 
        href={`/projects/${proof.projectId}/milestones/${proof.milestoneId}`}
        className="flex flex-col flex-1 cursor-pointer"
      >
        <div
          className="relative h-40 bg-gradient-to-br from-brand-200 to-brand-500 flex items-center justify-center group-hover:opacity-90 transition-opacity"
          aria-hidden
        >
          {proof.type === "video" && (
            <PlayCircle className="size-10 text-white/90 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
          )}
          <span className="absolute top-3 right-3">
            <StatusPill
              label={PROOF_STATUS_LABEL[proof.status]}
              tone={PROOF_STATUS_TONE[proof.status]}
            />
          </span>
        </div>
        <div className="p-5 flex-1 flex flex-col gap-3 pb-4">
          <p className="text-sm font-bold text-ink-900 group-hover:text-brand-600 transition-colors">{proof.caption}</p>
          <p className="text-xs text-ink-500 font-medium flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="flex items-center gap-1 min-w-0">
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">{proof.location || 'Location'} · {proof.geo ? `${proof.geo.lat.toFixed(4)}°, ${proof.geo.lng.toFixed(4)}°` : proof.geoTag}</span>
            </span>
          </p>
          <div className="flex items-center gap-2 text-xs font-medium text-ink-500">
            <Clock className="size-3.5 shrink-0" />
            {new Date(proof.capturedAt || proof.timestamp || new Date()).toLocaleString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </Link>
      {actions && <div className="px-5 pb-5 pt-0 mt-auto">{actions}</div>}
    </div>
  );
}
