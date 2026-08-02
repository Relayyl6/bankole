"use client";

import Link from "next/link";
import {
  ASSET_TYPE_LABEL,
  PROJECT_STATUS_LABEL,
  agents,
} from "@/lib/mock-data";
import { PROJECT_STATUS_TONE } from "@/lib/status";
import { useDrafts } from "@/lib/use-drafts";
import StatusPill from "@/components/status-pill";
import BudgetBar from "@/components/budget-bar";
import VerifiedBadge from "@/components/verified-badge";
import Avatar from "@/components/avatar";

/**
 * Projects the visitor created in this browser, shown above the seeded ones.
 * Renders nothing on the server, since localStorage is a client-only store.
 */
export default function DraftProjectList() {
  const drafts = useDrafts();

  if (drafts.length === 0) return null;

  return (
    <div className="mt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-ink-900">
          Projects you created
        </h2>
        <p className="text-xs text-ink-400">
          Stored in this browser · prototype only
        </p>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {drafts.map(({ project }) => {
          const agent = agents.find((a) => a.id === project.agentId);
          return (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="rounded-2xl bg-white shadow-soft p-6 ring-1 ring-brand-100 hover:shadow-soft-lg transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-brand-700">
                    {ASSET_TYPE_LABEL[project.assetType]}
                  </p>
                  <h3 className="mt-1 font-semibold text-ink-900 truncate">
                    {project.name}
                  </h3>
                  <p className="text-sm text-ink-500 truncate">
                    {project.location}
                  </p>
                </div>
                <StatusPill
                  label={PROJECT_STATUS_LABEL[project.status]}
                  tone={PROJECT_STATUS_TONE[project.status]}
                />
              </div>

              <div className="mt-5">
                <BudgetBar
                  totalBudget={project.totalBudget}
                  fundsReleased={project.fundsReleased}
                  fundsInEscrow={project.fundsInEscrow}
                  compact
                />
              </div>

              {agent && (
                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar
                      initials={agent.initials}
                      hue={agent.avatarHue}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink-900 truncate">
                        {agent.name}
                      </p>
                      <VerifiedBadge size="sm" />
                    </div>
                  </div>
                  <p className="text-xs text-ink-500 text-right shrink-0">
                    {project.currentStage}
                  </p>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
