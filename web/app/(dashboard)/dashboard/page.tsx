"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell, Mail, LayoutDashboard, FolderKanban, Users, Settings, 
  HelpCircle, LogOut, Plus, TrendingUp, ArrowUpRight,
  Camera, Banknote, ShieldCheck, X, Rocket, Building2, ArrowRight
} from "lucide-react";
import { ASSET_TYPE_LABEL, PROJECT_STATUS_LABEL, formatCurrency, type Project } from "@/lib/models";
import { PROJECT_STATUS_TONE } from "@/lib/status";
import Avatar from "@/components/avatar";
import StatusPill from "@/components/status-pill";
import { toast } from "react-toastify";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useWallet } from "@/lib/wallet";
import { useProjects } from "@/lib/projects";

export default function DashboardPage() {
  const [activeModal, setActiveModal] = useState<"total" | "active" | "escrow" | "review" | null>(null);

  const { data: summary } = useSWR("/dashboard/summary", (url) => apiClient(url));
  const { role, user } = useAuth();
  const { userProjects: projects } = useProjects(role, user);
  const { balance: walletBalance } = useWallet(user?.id, user?.fullName, (user as any)?.agentDetails?.id);
  
  const activeProjects = projects.filter(p => p.status !== "completed");
  
  const activeProjectsCount = activeProjects.length;
  const completedProjectsCount = projects.length - activeProjectsCount;
  const totalInvested = summary?.totalBudget ?? 0;
  const totalInEscrow = summary?.totalInEscrow ?? 0;
  const totalReleased = summary?.totalReleased ?? 0;
  const milestonesAwaitingReview = summary?.awaitingYourReview ?? 0;
  const currency = summary?.currency || "NGN";
  const recentActivity = summary?.recentActivity || [];
  
  return (
    <>
      <div className="px-8 pb-10">
          
          {/* Header */}
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1">
                {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
              </p>
              <h1 className="text-3xl font-black text-ink-900 tracking-tight">
                {user?.fullName ? `Welcome back, ${user.fullName.split(" ")[0]} 👋` : "Dashboard"}
              </h1>
              <p className="text-sm text-ink-500 mt-1 font-medium">
                {role === "sender"
                  ? "Here's what's happening across your projects today."
                  : "Here's your performance and assigned project overview."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {role === "sender" ? (
                <Link
                  href="/projects/new"
                  className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-bold text-white shadow-soft hover:bg-brand-700 hover:-translate-y-0.5 transition-all"
                >
                  <Plus className="size-4" />
                  Start a Project
                </Link>
              ) : (
                <Link
                  href="/dashboard/marketplace"
                  className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-bold text-white shadow-soft hover:bg-brand-700 hover:-translate-y-0.5 transition-all"
                >
                  <Plus className="size-4" />
                  Find Project
                </Link>
              )}
            </div>
          </div>

          {/* Zero-state onboarding card for new users */}
          {projects.length === 0 && (
            <div className="mb-8 rounded-2xl overflow-hidden border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-purple-50 shadow-sm">
              <div className="p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center gap-8">
                <div className="size-20 shrink-0 rounded-2xl bg-brand-600 flex items-center justify-center shadow-lg">
                  <Rocket className="size-10 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-black text-ink-900">
                    {role === "sender"
                      ? "Build something that lasts 🏗️"
                      : "Find your first project 🤝"}
                  </h2>
                  <p className="mt-2 text-ink-600 text-sm leading-relaxed max-w-xl">
                    {role === "sender"
                      ? "Bankole lets you fund construction projects back home — with milestone-locked escrow, geo-tagged proof, and verified agents. Every naira moves only when real work is confirmed."
                      : "Browse open marketplace projects from diaspora senders. Submit a proposal, get assigned, and manage milestones with full transparency and on-time escrow releases."}
                  </p>
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    {role === "sender" ? (
                      <>
                        <Link
                          href="/projects/new"
                          className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-bold text-white hover:bg-brand-700 transition-all shadow-sm"
                        >
                          <Plus className="size-4" /> Start your first project
                        </Link>
                        <Link
                          href="/dashboard/agents"
                          className="inline-flex items-center gap-2 rounded-full bg-white border border-ink-200 px-6 py-3 text-sm font-bold text-ink-700 hover:bg-ink-50 transition-all"
                        >
                          Browse verified agents <ArrowRight className="size-4" />
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/dashboard/marketplace"
                          className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-bold text-white hover:bg-brand-700 transition-all shadow-sm"
                        >
                          <Building2 className="size-4" /> Browse open projects
                        </Link>
                        <Link
                          href="/profile"
                          className="inline-flex items-center gap-2 rounded-full bg-white border border-ink-200 px-6 py-3 text-sm font-bold text-ink-700 hover:bg-ink-50 transition-all"
                        >
                          Complete your profile <ArrowRight className="size-4" />
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="border-t border-brand-100 px-8 sm:px-10 py-4 bg-white/60 flex flex-wrap gap-6">
                {["Milestone-locked escrow", "Geo-tagged proof required", "Identity-verified agents", "Real-time project tracking"].map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs font-bold text-ink-600">
                    <ShieldCheck className="size-4 text-brand-600 shrink-0" /> {f}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
            
            <div 
              onClick={() => setActiveModal("total")}
              className="rounded-xl bg-[#1a4a38] p-6 text-white shadow-soft-lg relative overflow-hidden group hover:shadow-xl transition-shadow cursor-pointer">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <FolderKanban className="size-32 rotate-12" />
              </div>
              <div className="relative z-10 flex justify-between items-start mb-6">
                <p className="font-medium text-white/90">Total Projects</p>
                <span className="flex size-8 items-center justify-center rounded-full bg-white text-ink-900 group-hover:scale-110 transition-transform">
                  <ArrowUpRight className="size-4" />
                </span>
              </div>
              <h3 className="relative z-10 text-5xl font-black mb-4">{projects.length}</h3>
              <div className="relative z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 text-xs font-medium backdrop-blur">
                <TrendingUp className="size-3" />
                Across all assets
              </div>
            </div>

            <div 
              onClick={() => setActiveModal("active")}
              className="rounded-xl bg-white p-6 shadow-sm border border-ink-100 flex flex-col justify-between group hover:shadow-soft transition-shadow cursor-pointer">
               <div className="flex justify-between items-start mb-6">
                <p className="font-medium text-ink-600">Active Projects</p>
                <span className="flex size-8 items-center justify-center rounded-full bg-ink-50 text-ink-500 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                  <ArrowUpRight className="size-4" />
                </span>
              </div>
              <h3 className="text-5xl font-black text-ink-900 mb-4">{activeProjectsCount}</h3>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-ink-50 text-xs font-medium text-ink-600 w-fit">
                {completedProjectsCount} completed
              </div>
            </div>

            <div 
              onClick={() => setActiveModal("escrow")}
              className="rounded-xl bg-white p-6 shadow-sm border border-ink-100 flex flex-col justify-between group hover:shadow-soft transition-shadow cursor-pointer">
               <div className="flex justify-between items-start mb-6">
                <p className="font-medium text-ink-600">
                  {role === "agent" ? "Available Earnings" : "Funds in Escrow"}
                </p>
                <span className="flex size-8 items-center justify-center rounded-full bg-ink-50 text-ink-500 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                  <ArrowUpRight className="size-4" />
                </span>
              </div>
              <h3 className="text-3xl font-black text-ink-900 mb-4 tracking-tight">
                {role === "agent" 
                  ? formatCurrency((walletBalance || 0) + (totalReleased || 0), currency) 
                  : formatCurrency(totalInEscrow, currency)}
              </h3>
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium w-fit ${
                role === "agent" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
              }`}>
                {role === "agent" ? "Ready for payout" : "Pending release"}
              </div>
            </div>

            <div 
              onClick={() => setActiveModal("review")}
              className="rounded-xl bg-white p-6 shadow-sm border border-ink-100 flex flex-col justify-between group hover:shadow-soft transition-shadow cursor-pointer">
               <div className="flex justify-between items-start mb-6">
                <p className="font-medium text-ink-600">Awaiting Review</p>
                <span className="flex size-8 items-center justify-center rounded-full bg-ink-50 text-ink-500 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                  <ArrowUpRight className="size-4" />
                </span>
              </div>
              <h3 className="text-5xl font-black text-ink-900 mb-4">{milestonesAwaitingReview}</h3>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-50 text-xs font-medium text-rose-600 w-fit">
                Action required
              </div>
            </div>

          </div>

          {/* Middle Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
               
               {/* Project Progress (Donezo Pie Chart Style) */}
               <div className="rounded-xl bg-white p-6 shadow-sm border border-ink-100 col-span-1 md:col-span-2 flex flex-col md:flex-row items-center gap-8">
                 <div className="flex-1">
                   <h3 className="font-bold text-ink-900 mb-6">Escrow Progress</h3>
                   <div className="flex items-center justify-center relative">
                     {/* Circular chart using simple SVG */}
                     <svg viewBox="0 0 100 100" className="size-48 transform -rotate-90">
                       <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="20" />
                       <circle cx="50" cy="50" r="40" fill="none" stroke="#1a4a38" strokeWidth="20" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - (totalInvested > 0 ? totalReleased / totalInvested : 0))} strokeLinecap="round" className="transition-all duration-1000" />
                     </svg>
                     <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                       <span className="text-3xl font-black text-ink-900">{totalInvested > 0 ? Math.round((totalReleased / totalInvested) * 100) : 0}%</span>
                       <span className="text-xs font-medium text-ink-500">Released</span>
                     </div>
                   </div>
                 </div>
                 
                 <div className="flex-1 space-y-4 w-full">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="size-3 rounded-full bg-[#1a4a38]"></span>
                        <span className="text-sm font-medium text-ink-600">Released</span>
                      </div>
                      <span className="font-bold text-ink-900">{formatCurrency(totalReleased, currency)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="size-3 rounded-full bg-ink-100"></span>
                        <span className="text-sm font-medium text-ink-600">In Escrow</span>
                      </div>
                      <span className="font-bold text-ink-900">{formatCurrency(totalInEscrow, currency)}</span>
                    </div>
                 </div>
               </div>

               {/* Reminders / Activity */}
               <div className="rounded-xl bg-white p-6 shadow-sm border border-ink-100">
                  <h3 className="font-bold text-ink-900 mb-6">Recent Activity</h3>
                  <div className="space-y-4">
                    {recentActivity && recentActivity.length > 0 ? (
                      recentActivity.map((activity: any) => (
                        <Link href={`/projects/${activity.projectId || 'unknown'}/activity`} key={activity.id} className="flex gap-3 mt-4 first:mt-0 p-3 -mx-3 rounded-xl hover:bg-ink-50 transition-colors group">
                          <div className={`size-8 rounded-full flex items-center justify-center shrink-0 ${activity.type === 'funds_released' ? 'bg-mint-50 text-mint-600' : 'bg-brand-50 text-brand-600'}`}>
                            {activity.type === 'funds_released' ? <Banknote className="size-4" /> : <Camera className="size-4" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-ink-900 group-hover:text-brand-600 transition-colors">
                              {activity.type.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                            </p>
                            <p className="text-xs text-ink-500 mt-0.5">{activity.message}</p>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <p className="text-sm text-ink-500 italic text-center py-4">No recent activity.</p>
                    )}
                  </div>
                  <Link href="/dashboard/activity" className="block text-center w-full mt-6 py-2.5 rounded-xl bg-ink-50 text-ink-700 text-sm font-bold hover:bg-ink-100 transition-colors">
                    View All Activity
                  </Link>
               </div>

               {/* Quick Config Card */}
               <div className="rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 p-6 shadow-soft text-white relative overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow">
                  <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:rotate-90 transition-transform duration-700">
                     <Settings className="size-24" />
                  </div>
                  <h3 className="font-bold mb-2 relative z-10">Configure Dashboard</h3>
                  <p className="text-sm text-brand-100 mb-6 relative z-10 pr-10 text-balance">Customize your widgets and layout.</p>
                  <Link href="/dashboard/settings" className="inline-block px-5 py-2 rounded-xl bg-white text-brand-700 text-sm font-bold shadow-sm relative z-10 hover:bg-brand-50 transition-colors">
                    Settings
                  </Link>
               </div>

            </div>

            {/* Right Column: Projects List */}
            <div className="rounded-xl bg-white p-6 shadow-sm border border-ink-100 flex flex-col h-[400px] lg:h-[500px]">
               <div className="flex items-center justify-between mb-6 shrink-0">
                 <h3 className="font-bold text-ink-900">Active Projects</h3>
                 <Link href="/projects/new" className="px-3 py-1.5 rounded-xl bg-ink-50 text-ink-700 text-xs font-bold hover:bg-ink-100 transition-colors">
                   + New
                 </Link>
               </div>
               
               <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                 {activeProjects.map((project, idx) => {
                    return (
                      <Link key={project.id} href={`/projects/${project.id}`} className="block group">
                        <div className="flex items-start gap-3">
                          <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${['bg-rose-50 text-rose-600', 'bg-blue-50 text-blue-600', 'bg-amber-50 text-amber-600', 'bg-mint-50 text-mint-600'][idx % 4]}`}>
                            <FolderKanban className="size-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-bold text-ink-900 truncate group-hover:text-brand-600 transition-colors">{project.name}</h4>
                            <p className="text-xs text-ink-500 mt-1 truncate">{project.currentStage}</p>
                            <div className="mt-2 flex items-center justify-between">
                              <StatusPill label={PROJECT_STATUS_LABEL[project.status]} tone={PROJECT_STATUS_TONE[project.status]} />
                              <span className="text-[10px] font-bold text-ink-400 uppercase">{ASSET_TYPE_LABEL[project.assetType]}</span>
                            </div>
                          </div>
                        </div>
                        {idx < activeProjects.length - 1 && <div className="h-px w-full bg-ink-50 mt-4" />}
                      </Link>
                    )
                 })}
               </div>
            </div>

          </div>

      </div>

      {/* Slide-over Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-ink-900/20 backdrop-blur-sm transition-opacity" onClick={() => setActiveModal(null)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl border-l border-ink-100 flex flex-col animate-slide-in-right">
            <div className="flex items-center justify-between p-6 border-b border-ink-100">
              <h2 className="text-xl font-bold text-ink-900">
                {activeModal === "total" && "Total Projects"}
                {activeModal === "active" && "Active Projects"}
                {activeModal === "escrow" && "Funds in Escrow"}
                {activeModal === "review" && "Awaiting Review"}
              </h2>
              <button onClick={() => setActiveModal(null)} className="p-2 rounded-full hover:bg-ink-50 text-ink-500 transition-colors">
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {activeModal === "total" && (
                <div className="space-y-4">
                  {projects.map(p => (
                    <Link href={`/projects/${p.id}`} key={p.id} className="block group">
                      <div className="p-4 rounded-xl border border-ink-100 bg-ink-50 flex items-center justify-between hover:border-brand-300 hover:bg-brand-50 transition-colors">
                        <div>
                          <p className="font-bold text-ink-900 group-hover:text-brand-600 transition-colors">{p.name}</p>
                          <p className="text-xs text-ink-500">{ASSET_TYPE_LABEL[p.assetType]}</p>
                        </div>
                        <StatusPill label={PROJECT_STATUS_LABEL[p.status]} tone={PROJECT_STATUS_TONE[p.status]} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              {activeModal === "active" && (
                <div className="space-y-4">
                  {activeProjects.map(p => (
                    <Link href={`/projects/${p.id}`} key={p.id} className="block group">
                      <div className="p-4 rounded-xl border border-ink-100 bg-ink-50 flex items-center justify-between hover:border-brand-300 hover:bg-brand-50 transition-colors">
                        <div>
                          <p className="font-bold text-ink-900 group-hover:text-brand-600 transition-colors">{p.name}</p>
                          <p className="text-xs text-ink-500">{p.currentStage}</p>
                        </div>
                        <span className="text-sm font-bold text-brand-700">{formatCurrency(p.totalBudget)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              {activeModal === "escrow" && (
                <div className="space-y-4">
                  {activeProjects.map(p => (
                    <Link href={`/projects/${p.id}`} key={p.id} className="block group">
                      <div className="p-4 rounded-xl border border-ink-100 bg-ink-50 flex items-center justify-between hover:border-brand-300 hover:bg-brand-50 transition-colors">
                        <p className="font-bold text-ink-900 group-hover:text-brand-600 transition-colors">{p.name}</p>
                        <span className="text-sm font-bold text-amber-700">{formatCurrency(p.fundsInEscrow)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              {activeModal === "review" && (
                <div className="space-y-4">
                  {projects.filter(p => p.status === "awaiting_review" || p.status === "attention_needed").map(p => (
                    <Link href={`/projects/${p.id}`} key={p.id} className="block group">
                      <div className="p-4 rounded-xl border border-rose-100 bg-rose-50 flex flex-col gap-2 hover:bg-rose-100 hover:border-rose-200 transition-colors">
                        <p className="font-bold text-ink-900 group-hover:text-rose-700 transition-colors">{p.name}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-rose-600 bg-white px-2 py-1 rounded-xl border border-rose-200">{PROJECT_STATUS_LABEL[p.status] || "Needs Review"}</span>
                          <span className="text-sm font-bold text-ink-900">{formatCurrency(p.totalBudget, p.currency)}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                  {projects.filter(p => p.status === "awaiting_review" || p.status === "attention_needed").length === 0 && (
                    <p className="text-sm text-ink-500 text-center py-8">You're all caught up! No projects requiring urgent review.</p>
                  )}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-ink-100">
              <button onClick={() => setActiveModal(null)} className="w-full py-3 rounded-xl bg-ink-900 text-white font-bold hover:bg-ink-800 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
