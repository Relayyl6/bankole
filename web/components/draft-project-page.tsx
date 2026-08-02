"use client";

import Link from "next/link";
import { agents, formatCurrency, type ActivityItem } from "@/lib/mock-data";
import { useDrafts } from "@/lib/use-drafts";
import ProjectWorkspace from "@/components/project-workspace";

/**
 * Workspace for a project created through the guided flow.
 *
 * Created projects live in localStorage, so the server renders nothing for
 * them and the store fills in once hydration completes.
 */
export default function DraftProjectPage({ id }: { id: string }) {
  const draft = useDrafts().find((d) => d.project.id === id);

  if (!draft) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-20 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
          This project isn&apos;t on this device.
        </h1>
        <p className="mt-3 text-ink-500 text-pretty">
          Projects created in the prototype are stored in the browser that
          created them, so they don&apos;t follow you across devices. Start
          another to see the flow.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/projects/new"
            className="inline-flex items-center rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft hover:bg-brand-700 transition-colors"
          >
            Start a project
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink-800 shadow-soft hover:bg-ink-50 transition-colors"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const agent = agents.find((a) => a.id === draft.project.agentId);
  if (!agent) return null;

  const funded: ActivityItem = {
    id: `${draft.project.id}-funded`,
    projectId: draft.project.id,
    type: "funds_released",
    message: `${formatCurrency(draft.project.totalBudget)} funded into escrow across ${draft.milestones.length} milestones`,
    timestamp: draft.createdAt,
  };

  return (
    <ProjectWorkspace
      project={draft.project}
      agent={agent}
      initialMilestones={draft.milestones}
      initialProofs={[]}
      initialActivity={[funded]}
      documents={[]}
    />
  );
}
