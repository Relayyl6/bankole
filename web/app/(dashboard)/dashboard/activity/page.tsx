"use client";

import { useAuth } from "@/lib/auth-context";
import { Activity as ActivityIcon, Camera, Banknote, ShieldCheck, Plus } from "lucide-react";
import { type Project } from "@/lib/models";
import { apiClient } from "@/lib/api-client";
import useSWR from "swr";

export default function ActivityPage() {
  const { role } = useAuth();
  const { data: projectsRes } = useSWR('/projects', (url) => apiClient<{data: Project[], meta: any}>(url));
  const projects = projectsRes?.data || [];
  
  // Generating a rich activity feed based on mock data
  const activities = [
    {
      id: "act-1",
      icon: <Camera className="size-5" />,
      color: "text-brand-600 bg-brand-50",
      title: "Proof Submitted",
      description: "Foundation stage on Adeyemi Home is ready for review.",
      time: "2 hours ago",
      projectId: "proj-1"
    },
    {
      id: "act-2",
      icon: <Banknote className="size-5" />,
      color: "text-emerald-600 bg-emerald-50",
      title: "Funds Released",
      description: "N12.5M released for Roofing on Retail Plaza.",
      time: "5 hours ago",
      projectId: "proj-2"
    },
    {
      id: "act-3",
      icon: <ShieldCheck className="size-5" />,
      color: "text-blue-600 bg-blue-50",
      title: "Agent Verified",
      description: "Background check completed for Kwabena Owusu.",
      time: "1 day ago",
      projectId: null
    },
    {
      id: "act-4",
      icon: <Plus className="size-5" />,
      color: "text-purple-600 bg-purple-50",
      title: "Project Created",
      description: "Adeyemi Family Home setup in escrow.",
      time: "3 days ago",
      projectId: "proj-1"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 lg:p-10">
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

      <div className="bg-white rounded-xl p-6 lg:p-8 shadow-soft border border-ink-100">
        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-ink-100 before:to-transparent">
          {activities.map((act) => {
            const project = projects.find(p => p.id === act.projectId);
            return (
              <div key={act.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                {/* Icon */}
                <div className={`flex items-center justify-center size-12 rounded-full border-4 border-white ${act.color} shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10`}>
                  {act.icon}
                </div>
                {/* Card */}
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-5 rounded-2xl bg-white border border-ink-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-ink-900">{act.title}</h3>
                    <time className="text-xs font-medium text-ink-400">{act.time}</time>
                  </div>
                  <p className="text-sm text-ink-600 leading-snug">{act.description}</p>
                  {project && (
                    <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-ink-50 text-xs font-bold text-ink-600">
                      Project: {project.name}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
