"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  FolderKanban, Plus, Clock, CheckCircle2, ArrowRight,
  MapPin, Building2, Eye, ShieldCheck, AlertCircle
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { type Project, ASSET_TYPE_LABEL, PROJECT_STATUS_LABEL, formatCurrency } from "@/lib/models";
import { PROJECT_STATUS_TONE } from "@/lib/status";
import StatusPill from "@/components/status-pill";
import { apiClient } from "@/lib/api-client";
import useSWR from "swr";

export default function ProjectsPage() {
  const { role, user } = useAuth();
  const { data: projectsRes } = useSWR('/projects', (url) => apiClient<{data: Project[], meta: any}>(url));
  const projects = projectsRes?.data || [];
  
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  // For agents: only show projects assigned to them (by their real user ID)
  const isAgent = role === "agent";
  const userProjects = isAgent 
    ? projects.filter(p => user?.id && (p.agentId === user.id || (p as any).agent_id === user.id || p.agent?.id === user.id))
    : projects; // sender sees all their own projects

  const filteredProjects = userProjects.filter(p => {
    if (filter === "active") return p.status !== "completed";
    if (filter === "completed") return p.status === "completed";
    return true;
  });

  return (
    <div className="px-8 pb-10 pt-8 animate-slide-in-right">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-ink-900 tracking-tight">Projects</h1>
          <p className="text-sm text-ink-500 mt-1 font-medium">
            {isAgent ? "Manage your ongoing assignments and submit proofs." : "Track and manage your active investments."}
          </p>
        </div>
        {!isAgent && (
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-bold text-white shadow-soft hover:bg-brand-700 hover:-translate-y-0.5 transition-all"
          >
            <Plus className="size-4" />
            New Project
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
            filter === "all" ? "bg-ink-900 text-white" : "bg-ink-50 text-ink-600 hover:bg-ink-100"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter("active")}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
            filter === "active" ? "bg-ink-900 text-white" : "bg-ink-50 text-ink-600 hover:bg-ink-100"
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setFilter("completed")}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
            filter === "completed" ? "bg-ink-900 text-white" : "bg-ink-50 text-ink-600 hover:bg-ink-100"
          }`}
        >
          Completed
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredProjects.map((p) => (
          <Link href={`/projects/${p.id}`} key={p.id} className="block group">
            <div className="bg-white rounded-xl border border-ink-100 p-6 shadow-sm hover:shadow-md hover:border-brand-200 transition-all flex flex-col h-full">
              
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-ink-900 group-hover:text-brand-600 transition-colors mb-2">
                    {p.name}
                  </h3>
                  <div className="flex items-center gap-4 text-xs font-medium text-ink-500">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="size-3.5" />
                      {ASSET_TYPE_LABEL[p.assetType]}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="size-3.5" />
                      {typeof p.location === 'string' ? p.location : p.location.label}
                    </span>
                  </div>
                </div>
                <StatusPill label={PROJECT_STATUS_LABEL[p.status]} tone={PROJECT_STATUS_TONE[p.status]} />
              </div>

              <div className="mt-auto grid grid-cols-2 gap-4 bg-ink-50 p-4 rounded-2xl">
                <div>
                  <p className="text-xs font-medium text-ink-500 mb-1">Current Stage</p>
                  <p className="text-sm font-bold text-ink-900 flex items-center gap-1.5">
                    {p.status === "attention_needed" ? (
                      <AlertCircle className="size-4 text-rose-500" />
                    ) : p.status === "completed" ? (
                      <CheckCircle2 className="size-4 text-emerald-500" />
                    ) : (
                      <Clock className="size-4 text-amber-500" />
                    )}
                    {p.currentStage}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-ink-500 mb-1">Budget</p>
                  <p className="text-sm font-bold text-ink-900">{formatCurrency(p.totalBudget, p.currency)}</p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-ink-100 pt-6">
                {!isAgent ? (
                  <div className="flex items-center gap-2 text-xs font-medium text-ink-500">
                    <ShieldCheck className="size-4 text-brand-500" />
                    <span>{formatCurrency(p.fundsInEscrow, p.currency)} currently in escrow</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-medium text-ink-500">
                    <CheckCircle2 className="size-4 text-emerald-500" />
                    <span>You are the assigned agent</span>
                  </div>
                )}
                <span className="flex items-center gap-1.5 text-sm font-bold text-brand-600 group-hover:translate-x-1 transition-transform">
                  View Workspace <ArrowRight className="size-4" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-20 bg-white rounded-xl border border-ink-100 border-dashed">
          <FolderKanban className="size-12 text-ink-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-ink-900 mb-2">No projects found</h3>
          <p className="text-ink-500 max-w-sm mx-auto">
            {filter !== "all" 
              ? `You don't have any ${filter} projects at the moment.`
              : isAgent 
                ? "You haven't been assigned to any projects yet."
                : "You haven't started any projects yet. Create one to begin building!"}
          </p>
        </div>
      )}
    </div>
  );
}
