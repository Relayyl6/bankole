"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { 
  Activity as ActivityIcon, Camera, Banknote, ShieldCheck, 
  Plus, UserCheck, AlertTriangle, CheckCircle2, Flag, FileText, Loader2
} from "lucide-react";
import { type Project } from "@/lib/models";
import { apiClient } from "@/lib/api-client";
import useSWR from "swr";

interface ActivityItem {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  projectId?: string;
  projectName?: string;
}

// Maps backend activity type → lucide icon + color class
function getActivityMeta(type: string): { icon: React.ReactNode; color: string; label: string } {
  switch (type) {
    case "proof_submitted":
      return { icon: <Camera className="size-5" />, color: "text-brand-600 bg-brand-50", label: "Proof Submitted" };
    case "funds_released":
    case "milestone_released":
      return { icon: <Banknote className="size-5" />, color: "text-emerald-600 bg-emerald-50", label: "Funds Released" };
    case "agent_verified":
      return { icon: <ShieldCheck className="size-5" />, color: "text-blue-600 bg-blue-50", label: "Agent Verified" };
    case "project_created":
      return { icon: <Plus className="size-5" />, color: "text-purple-600 bg-purple-50", label: "Project Created" };
    case "agent_assigned":
      return { icon: <UserCheck className="size-5" />, color: "text-sky-600 bg-sky-50", label: "Agent Assigned" };
    case "milestone_approved":
      return { icon: <CheckCircle2 className="size-5" />, color: "text-emerald-600 bg-emerald-50", label: "Milestone Approved" };
    case "milestone_flagged":
    case "proof_flagged":
      return { icon: <AlertTriangle className="size-5" />, color: "text-rose-600 bg-rose-50", label: "Concern Flagged" };
    case "document_uploaded":
      return { icon: <FileText className="size-5" />, color: "text-ink-600 bg-ink-50", label: "Document Uploaded" };
    default:
      return { icon: <Flag className="size-5" />, color: "text-ink-400 bg-ink-50", label: type.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") };
  }
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// Hook: fetches activity for a single project
function useProjectActivity(projectId: string) {
  const { data } = useSWR(
    `/projects/${projectId}/activity?page=1&perPage=20`,
    (url) => apiClient<{ data: ActivityItem[] }>(url).catch(() => ({ data: [] }))
  );
  return (data?.data || []).map(a => ({ ...a, projectId }));
}

// Component that loads activity for ONE project and contributes to a shared list
// (We do this with a parent aggregator instead)
export default function ActivityPage() {
  const { role } = useAuth();
  
  // 1. Load all projects
  const { data: projectsRes, isLoading: loadingProjects } = useSWR(
    "/projects",
    (url) => apiClient<{ data: Project[] }>(url)
  );
  const projects = projectsRes?.data || [];

  // 2. Load activity for each project (up to first 10 projects to avoid too many requests)
  const projectsToFetch = projects.slice(0, 10);
  
  const { data: act0 } = useSWR(projectsToFetch[0]?.id ? `/projects/${projectsToFetch[0].id}/activity?perPage=15` : null, (url) => apiClient<{data: ActivityItem[]}>(url).catch(() => ({data:[]})));
  const { data: act1 } = useSWR(projectsToFetch[1]?.id ? `/projects/${projectsToFetch[1].id}/activity?perPage=15` : null, (url) => apiClient<{data: ActivityItem[]}>(url).catch(() => ({data:[]})));
  const { data: act2 } = useSWR(projectsToFetch[2]?.id ? `/projects/${projectsToFetch[2].id}/activity?perPage=15` : null, (url) => apiClient<{data: ActivityItem[]}>(url).catch(() => ({data:[]})));
  const { data: act3 } = useSWR(projectsToFetch[3]?.id ? `/projects/${projectsToFetch[3].id}/activity?perPage=15` : null, (url) => apiClient<{data: ActivityItem[]}>(url).catch(() => ({data:[]})));
  const { data: act4 } = useSWR(projectsToFetch[4]?.id ? `/projects/${projectsToFetch[4].id}/activity?perPage=15` : null, (url) => apiClient<{data: ActivityItem[]}>(url).catch(() => ({data:[]})));

  // 3. Aggregate all activities, tag with project name, sort by date
  const activities = useMemo(() => {
    const raw = [
      ...(act0?.data || []).map(a => ({ ...a, projectId: projectsToFetch[0]?.id, projectName: projectsToFetch[0]?.name })),
      ...(act1?.data || []).map(a => ({ ...a, projectId: projectsToFetch[1]?.id, projectName: projectsToFetch[1]?.name })),
      ...(act2?.data || []).map(a => ({ ...a, projectId: projectsToFetch[2]?.id, projectName: projectsToFetch[2]?.name })),
      ...(act3?.data || []).map(a => ({ ...a, projectId: projectsToFetch[3]?.id, projectName: projectsToFetch[3]?.name })),
      ...(act4?.data || []).map(a => ({ ...a, projectId: projectsToFetch[4]?.id, projectName: projectsToFetch[4]?.name })),
    ];
    return raw
      .filter((a) => !!a.id && !!a.message)
      .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
  }, [act0, act1, act2, act3, act4, projectsToFetch]);

  const isLoading = loadingProjects;

  return (
    <div className="max-w-4xl mx-auto p-6 lg:p-10 animate-slide-in-right">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-ink-900 flex items-center gap-3">
          <ActivityIcon className="size-8 text-brand-600" />
          System Activity
        </h1>
        <p className="text-sm font-medium text-ink-500 mt-2">
          {role === "sender"
            ? "A chronological feed of all actions across your portfolio."
            : "A chronological feed of all actions across your projects."}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-ink-400">
          <Loader2 className="size-8 animate-spin mr-3" />
          <span className="font-medium">Loading activity...</span>
        </div>
      ) : activities.length === 0 ? (
        <div className="bg-white rounded-xl border border-ink-100 shadow-sm p-12 text-center">
          <ActivityIcon className="size-12 text-ink-200 mx-auto mb-4" />
          <h3 className="font-bold text-ink-900 mb-2">No activity yet</h3>
          <p className="text-sm text-ink-500">
            Activity will appear here as you create projects, submit proof, and release funds.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-6 lg:p-8 shadow-soft border border-ink-100">
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-ink-100 before:to-transparent">
            {activities.map((act, idx) => {
              const meta = getActivityMeta(act.type);
              return (
                <div
                  key={`${act.id}-${idx}`}
                  className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                >
                  {/* Icon bubble */}
                  <div
                    className={`flex items-center justify-center size-12 rounded-full border-4 border-white ${meta.color} shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10`}
                  >
                    {meta.icon}
                  </div>

                  {/* Card */}
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-5 rounded-2xl bg-white border border-ink-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-ink-900">{meta.label}</h3>
                      <time className="text-xs font-medium text-ink-400">
                        {act.createdAt ? timeAgo(act.createdAt) : "—"}
                      </time>
                    </div>
                    <p className="text-sm text-ink-600 leading-snug">{act.message}</p>
                    {act.projectId && act.projectName && (
                      <Link
                        href={`/projects/${act.projectId}`}
                        className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-ink-50 text-xs font-bold text-ink-600 hover:bg-brand-50 hover:text-brand-700 transition-colors"
                      >
                        📁 {act.projectName}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
