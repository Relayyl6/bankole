"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  Camera,
  CheckCircle2,
  FileText,
  FlagTriangleRight,
  FolderKanban,
  LayoutList,
  MapPin,
} from "lucide-react";
import {
  ASSET_TYPE_LABEL,
  PROJECT_STATUS_LABEL,
  formatCurrency,
  type ActivityItem,
  type Agent,
  type DocumentRecord,
  type Milestone,
  type Project,
  type ProgressProof,
} from "@/lib/mock-data";
import { MILESTONE_STATUS_TONE, PROJECT_STATUS_TONE } from "@/lib/status";
import Avatar from "@/components/avatar";
import VerifiedBadge from "@/components/verified-badge";
import StatusPill from "@/components/status-pill";
import BudgetBar from "@/components/budget-bar";
import MilestoneTimeline from "@/components/milestone-timeline";
import ProgressProofCard from "@/components/progress-proof-card";

const TABS = [
  { key: "overview", label: "Overview", icon: LayoutList },
  { key: "milestones", label: "Milestones & Escrow", icon: FolderKanban },
  { key: "proof", label: "Progress Proof", icon: Camera },
  { key: "activity", label: "Documents & Activity", icon: FileText },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function ProjectWorkspace({
  project,
  agent,
  initialMilestones,
  initialProofs,
  initialActivity,
  documents,
}: {
  project: Project;
  agent: Agent;
  initialMilestones: Milestone[];
  initialProofs: ProgressProof[];
  initialActivity: ActivityItem[];
  documents: DocumentRecord[];
}) {
  const [tab, setTab] = useState<TabKey>("overview");
  const [milestones, setMilestones] = useState(initialMilestones);
  const [proofs, setProofs] = useState(initialProofs);
  const [activity, setActivity] = useState(initialActivity);

  function addActivity(message: string, type: ActivityItem["type"]) {
    setActivity((prev) => [
      {
        id: `local-${Date.now()}`,
        projectId: project.id,
        type,
        message,
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ]);
  }

  function handleApprove(proof: ProgressProof) {
    setProofs((prev) =>
      prev.map((p) => (p.id === proof.id ? { ...p, status: "approved" } : p))
    );
    const milestone = milestones.find((m) => m.id === proof.milestoneId);
    setMilestones((prev) =>
      prev.map((m) =>
        m.id === proof.milestoneId ? { ...m, status: "released" } : m
      )
    );
    if (milestone) {
      addActivity(
        `${formatCurrency(milestone.escrowAmount)} released for ${milestone.stage}`,
        "funds_released"
      );
    }
  }

  function handleFlag(proof: ProgressProof) {
    setProofs((prev) =>
      prev.map((p) => (p.id === proof.id ? { ...p, status: "flagged" } : p))
    );
    const milestone = milestones.find((m) => m.id === proof.milestoneId);
    setMilestones((prev) =>
      prev.map((m) =>
        m.id === proof.milestoneId ? { ...m, status: "flagged" } : m
      )
    );
    if (milestone) {
      addActivity(`Concern flagged for ${milestone.stage}`, "concern_flagged");
    }
  }

  const pendingProofs = proofs.filter((p) => p.status === "pending_review");
  const reviewedProofs = proofs.filter((p) => p.status !== "pending_review");

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-brand-700">
            {ASSET_TYPE_LABEL[project.assetType]}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink-900">
            {project.name}
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-500">
            <MapPin className="size-4" />
            {project.location}
          </p>
        </div>
        <StatusPill
          label={PROJECT_STATUS_LABEL[project.status]}
          tone={PROJECT_STATUS_TONE[project.status]}
        />
      </div>

      <div className="mt-6 rounded-2xl bg-white shadow-soft p-5">
        <BudgetBar
          totalBudget={project.totalBudget}
          fundsReleased={project.fundsReleased}
          fundsInEscrow={project.fundsInEscrow}
        />
      </div>

      <div className="mt-8 flex gap-1 overflow-x-auto rounded-full bg-ink-50 p-1 w-fit max-w-full">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-white text-ink-900 shadow-soft"
                : "text-ink-500 hover:text-ink-800"
            }`}
          >
            <t.icon className="size-4" />
            {t.label}
            {t.key === "proof" && pendingProofs.length > 0 && (
              <span className="ml-1 flex size-5 items-center justify-center rounded-full bg-amber-500 text-[11px] font-semibold text-white">
                {pendingProofs.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "overview" && (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="rounded-2xl bg-white shadow-soft p-6">
              <h2 className="font-semibold text-ink-900">Scope</h2>
              <p className="mt-2 text-sm text-ink-600 text-pretty">
                {project.scope}
              </p>
              <p className="mt-4 text-xs text-ink-400">
                Started{" "}
                {new Date(project.startedOn).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <Link
              href={`/agents/${agent.id}`}
              className="rounded-2xl bg-white shadow-soft p-6 hover:shadow-soft-lg transition-shadow"
            >
              <p className="text-xs font-medium text-ink-400">Assigned agent</p>
              <div className="mt-3 flex items-center gap-3">
                <Avatar initials={agent.initials} hue={agent.avatarHue} />
                <div>
                  <p className="font-semibold text-ink-900">{agent.name}</p>
                  <VerifiedBadge size="sm" />
                </div>
              </div>
              <p className="mt-3 text-xs text-ink-500">
                {agent.completedProjects} completed projects ·{" "}
                {agent.rating.toFixed(1)} rating
              </p>
            </Link>
          </div>
        )}

        {tab === "milestones" && (
          <div className="rounded-2xl bg-white shadow-soft p-6">
            <MilestoneTimeline milestones={milestones} />
          </div>
        )}

        {tab === "proof" && (
          <div className="space-y-8">
            {pendingProofs.length > 0 && (
              <div>
                <h2 className="font-semibold text-ink-900">Awaiting your review</h2>
                <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {pendingProofs.map((proof) => (
                    <ProgressProofCard
                      key={proof.id}
                      proof={proof}
                      actions={
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(proof)}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-mint-500 px-3 py-2 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
                          >
                            <CheckCircle2 className="size-3.5" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleFlag(proof)}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-rose-100 px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-500 hover:text-white transition-colors"
                          >
                            <FlagTriangleRight className="size-3.5" />
                            Flag concern
                          </button>
                        </div>
                      }
                    />
                  ))}
                </div>
              </div>
            )}
            <div>
              <h2 className="font-semibold text-ink-900">
                Verified progress log
              </h2>
              <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {reviewedProofs.map((proof) => (
                  <ProgressProofCard key={proof.id} proof={proof} />
                ))}
                {reviewedProofs.length === 0 && (
                  <p className="text-sm text-ink-500">No reviewed proof yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === "activity" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h2 className="font-semibold text-ink-900">Documents</h2>
              <div className="mt-4 space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 rounded-xl bg-white shadow-soft p-4"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                      <FileText className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink-900 truncate">
                        {doc.name}
                      </p>
                      <p className="text-xs text-ink-400">
                        {doc.kind} · {doc.uploadedOn}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h2 className="font-semibold text-ink-900">
                Activity &amp; trust alerts
              </h2>
              <div className="mt-4 space-y-3">
                {activity.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-start gap-3 rounded-xl bg-white shadow-soft p-4"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-ink-50 text-ink-500">
                      <Bell className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm text-ink-800">{a.message}</p>
                      <p className="text-xs text-ink-400 mt-0.5">
                        {new Date(a.timestamp).toLocaleString("en-GB", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
