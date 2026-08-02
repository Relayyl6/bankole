import Link from "next/link";
import { Banknote, Camera, FolderKanban, Wallet } from "lucide-react";
import {
  ASSET_TYPE_LABEL,
  PROJECT_STATUS_LABEL,
  agents,
  formatCurrency,
  milestones,
  projects,
} from "@/lib/mock-data";
import { PROJECT_STATUS_TONE } from "@/lib/status";
import StatCard from "@/components/stat-card";
import StatusPill from "@/components/status-pill";
import BudgetBar from "@/components/budget-bar";
import VerifiedBadge from "@/components/verified-badge";
import Avatar from "@/components/avatar";

export default function DashboardPage() {
  const activeProjects = projects.filter((p) => p.status !== "completed");
  const totalInvested = projects.reduce((sum, p) => sum + p.totalBudget, 0);
  const totalInEscrow = projects.reduce((sum, p) => sum + p.fundsInEscrow, 0);
  const milestonesAwaitingReview = milestones.filter(
    (m) => m.status === "proof_submitted"
  ).length;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-brand-700">Dashboard</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink-900">
            Your projects, live.
          </h1>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex items-center rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-soft hover:bg-brand-700 transition-colors"
        >
          Start a project
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total invested"
          value={formatCurrency(totalInvested)}
          hint={`Across ${projects.length} projects`}
          icon={Banknote}
        />
        <StatCard
          label="Active projects"
          value={String(activeProjects.length)}
          hint={`${projects.length - activeProjects.length} completed`}
          icon={FolderKanban}
        />
        <StatCard
          label="Funds in escrow"
          value={formatCurrency(totalInEscrow)}
          hint="Held until milestones confirmed"
          icon={Wallet}
        />
        <StatCard
          label="Awaiting your review"
          value={String(milestonesAwaitingReview)}
          hint="Proof submitted, action needed"
          icon={Camera}
        />
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-ink-900">All projects</h2>
        <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {projects.map((project) => {
            const agent = agents.find((a) => a.id === project.agentId)!;
            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="rounded-2xl bg-white shadow-soft p-6 hover:shadow-soft-lg transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium text-brand-700">
                      {ASSET_TYPE_LABEL[project.assetType]}
                    </p>
                    <h3 className="mt-1 font-semibold text-ink-900">
                      {project.name}
                    </h3>
                    <p className="text-sm text-ink-500">{project.location}</p>
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

                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar initials={agent.initials} hue={agent.avatarHue} size="sm" />
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
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
