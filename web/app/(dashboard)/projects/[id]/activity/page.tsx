"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Activity as ActivityIcon, Camera, Banknote, ShieldCheck, Flag, CheckCircle } from "lucide-react";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { type Project } from "@/lib/models";

// Matches API contract for GET /projects/:id/activity
interface ProjectActivity {
  id: string;
  projectId: string;
  type: string;
  message: string;
  actor: {
    id: string;
    name: string;
    role: string;
  } | null;
  createdAt: string;
}

export default function ProjectActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  
  const { data: project } = useSWR(`/projects/${projectId}`, (url) => apiClient<Project>(url));
  const { data: activityResponse, isLoading } = useSWR(
    `/projects/${projectId}/activity`, 
    (url) => apiClient<{data: ProjectActivity[], meta: any}>(url)
  );

  const activities = activityResponse?.data || [];

  const getIconForType = (type: string) => {
    switch (type) {
      case "proof_submitted": return <Camera className="size-5" />;
      case "funds_released": return <Banknote className="size-5" />;
      case "milestone_approved": return <CheckCircle className="size-5" />;
      case "concern_flagged": 
      case "overdue_flag": return <Flag className="size-5" />;
      default: return <ActivityIcon className="size-5" />;
    }
  };

  const getColorForType = (type: string) => {
    switch (type) {
      case "proof_submitted": return "text-brand-600 bg-brand-50 border-white";
      case "funds_released": return "text-emerald-600 bg-emerald-50 border-white";
      case "milestone_approved": return "text-blue-600 bg-blue-50 border-white";
      case "concern_flagged":
      case "overdue_flag": return "text-rose-600 bg-rose-50 border-white";
      default: return "text-ink-600 bg-ink-50 border-white";
    }
  };

  return (
    <div className="px-8 pb-10 pt-8 animate-slide-in-right max-w-4xl mx-auto">
      <Link href={`/projects/${projectId}`} className="inline-flex items-center gap-2 text-sm font-bold text-ink-500 hover:text-ink-900 transition-colors mb-6">
        <ArrowLeft className="size-4" /> Back to Workspace
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-black text-ink-900 tracking-tight">Project Activity</h1>
        <p className="text-sm font-medium text-ink-500 mt-1">
          Complete audit trail for {project ? project.name : "this project"}.
        </p>
      </div>

      <div className="bg-white rounded-xl p-6 lg:p-8 shadow-sm border border-ink-100">
        {isLoading ? (
          <div className="py-20 text-center text-ink-400">Loading activity...</div>
        ) : activities.length === 0 ? (
          <div className="py-20 text-center text-ink-400">No activity recorded for this project yet.</div>
        ) : (
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-ink-100 before:to-transparent">
            {activities.map((act) => (
              <div key={act.id} className="relative flex items-center justify-between group is-active pl-16">
                {/* Icon */}
                <div className={`absolute left-0 flex items-center justify-center size-12 rounded-full border-4 ${getColorForType(act.type)} shadow-sm z-10`}>
                  {getIconForType(act.type)}
                </div>
                {/* Card */}
                <div className="w-full p-5 rounded-2xl bg-white border border-ink-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-ink-900 capitalize">
                        {act.type.split('_').join(' ')}
                      </h3>
                      {act.actor && (
                        <p className="text-xs font-medium text-ink-500 mt-0.5">
                          by <span className="text-ink-700">{act.actor.name}</span> ({act.actor.role})
                        </p>
                      )}
                    </div>
                    <time className="text-xs font-medium text-ink-400 shrink-0">
                      {new Date(act.createdAt).toLocaleString()}
                    </time>
                  </div>
                  <p className="text-sm text-ink-600 leading-snug">{act.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
