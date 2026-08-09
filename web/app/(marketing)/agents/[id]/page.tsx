"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, Star, MapPin, Building2, CheckCircle2, Award,
  Briefcase, FileText, MessageSquare, ShieldCheck, XCircle,
  Phone, Mail, Globe, Clock
} from "lucide-react";
import { ASSET_TYPE_LABEL, type Agent, type AssetType } from "@/lib/models";
import Avatar from "@/components/avatar";
import VerifiedBadge from "@/components/verified-badge";
import { useAuth } from "@/lib/auth-context";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";

import RegisterPage from "../apply/page";

// ── Normalize raw API response into Agent shape ─────────────────────────────

const normalizeAgent = (raw: any): Agent | null => {
  if (!raw) return null;
  const a = raw.data || raw.agent || raw;
  if (!a || (!a.id && !a.name && !a.fullName && !a.full_name)) return null;

  const id = a.id || a.userId || a.user_id || "";
  const name = a.name || a.fullName || a.full_name || "Verified Agent";
  const initials = a.initials || name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "AG";
  const avatarHue = typeof a.avatarHue === "string"
    ? parseInt(a.avatarHue.match(/\d+/)?.[0] || "220")
    : (a.avatarHue || a.avatar_hue || 220);

  return {
    id,
    name,
    initials,
    avatarHue,
    avatarUrl: a.avatarUrl || a.avatar_url || null,
    verified: a.verified ?? a.is_verified ?? a.agentDetails?.verified ?? false,
    location: a.location || a.country || a.state || null,
    specialties: (a.specialties || a.agentDetails?.specialties || []) as AssetType[],
    rating: Number(a.rating ?? a.agentDetails?.rating ?? 0),
    reviewCount: Number(a.reviewCount ?? a.review_count ?? a.agentDetails?.reviewCount ?? 0),
    completedProjects: Number(a.completedProjects ?? a.completed_projects ?? a.agentDetails?.completedProjects ?? 0),
    yearsExperience: Number(a.yearsExperience ?? a.years_experience ?? a.agentDetails?.yearsExperience ?? 0),
    bio: a.bio || a.agentDetails?.bio || null,
    // Only use real credentials / portfolio / reviews from backend — no stubs
    credentials: Array.isArray(a.credentials) ? a.credentials : [],
    portfolio: Array.isArray(a.portfolio) ? a.portfolio : [],
    reviews: Array.isArray(a.reviews) ? a.reviews : [],
    // Extra contact fields if the backend ever surfaces them
    email: a.email || null,
    phone: a.phone || a.phoneNumber || a.phone_number || null,
    website: a.website || null,
  } as any;
};

// ── Component ────────────────────────────────────────────────────────────────

export default function AgentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);

  if (resolvedParams.id === "apply") {
    return <RegisterPage />;
  }

  const { role, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromDirectory = searchParams.get("from") === "directory";

  // Fetch agent profile
  const { data: singleRes, isLoading: loadingSingle } = useSWR(
    resolvedParams.id && resolvedParams.id !== "apply" ? `/agents/${resolvedParams.id}` : null,
    url => apiClient<any>(url, { requireAuth: false }).catch(() => null)
  );

  // Fallback: list fetch if single 404'd
  const { data: listRes, isLoading: loadingList } = useSWR(
    !singleRes && resolvedParams.id ? `/agents?perPage=100` : null,
    url => apiClient<any>(url, { requireAuth: false }).catch(() => null)
  );

  const rawAgent = singleRes?.data || singleRes;
  const listData = Array.isArray(listRes) ? listRes : listRes?.data || [];
  const foundInList = listData.find(
    (a: any) => a.id === resolvedParams.id || a.userId === resolvedParams.id || a.user_id === resolvedParams.id
  );

  const isMe = user?.id === resolvedParams.id;
  const myFallback = isMe ? user : null;

  const agent = normalizeAgent(rawAgent) || normalizeAgent(foundInList) || normalizeAgent(myFallback);
  const isLoading = (loadingSingle || loadingList) && !agent;

  // ── Handle "Message" button ────────────────────────────────────────────────
  const handleMessageAgent = async () => {
    if (!user) {
      router.push(`/login?redirect=/agents/${resolvedParams.id}`);
      return;
    }

    // Determine thread ID — try backend first, fall back to local
    let threadId = `local_thread_${user.id}_${resolvedParams.id}`;

    try {
      const res = await apiClient<{ threadId: string }>("/messages/threads", {
        method: "POST",
        body: { agentId: resolvedParams.id },
      });
      if (res?.threadId) threadId = res.threadId;
    } catch {}

    // Always persist to local thread index so Messages page shows it
    const threadIndex: any[] = (() => {
      try { return JSON.parse(localStorage.getItem("bankole_dm_threads") || "[]"); } catch { return []; }
    })();
    const entry = {
      threadId,
      participantId: resolvedParams.id,
      participantName: agent?.name || "Agent",
      lastMessage: null,
      updatedAt: new Date().toISOString(),
    };
    const idx = threadIndex.findIndex((t: any) => t.participantId === resolvedParams.id);
    if (idx >= 0) threadIndex[idx] = { ...threadIndex[idx], ...entry, threadId };
    else threadIndex.unshift(entry);
    localStorage.setItem("bankole_dm_threads", JSON.stringify(threadIndex));

    // Navigate to Messages page with threadId so it auto-opens
    router.push(`/dashboard/messages?threadId=${encodeURIComponent(threadId)}`);
  };

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#ebeff3] py-10 sm:py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="rounded-2xl bg-white p-12 shadow-soft border border-ink-100 flex flex-col items-center justify-center text-center gap-4 animate-pulse">
            <div className="size-16 rounded-full bg-ink-100" />
            <div className="h-6 w-48 bg-ink-100 rounded-lg" />
            <div className="h-4 w-64 bg-ink-50 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-[#ebeff3] py-10 sm:py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          {role && (
            <div className="mb-8">
              <Link href="/dashboard/agents" className="inline-flex items-center gap-2 text-sm font-bold text-ink-500 hover:text-brand-600 transition-colors">
                <ArrowLeft className="size-4" /> Back to Directory
              </Link>
            </div>
          )}
          <div className="rounded-xl bg-white p-12 shadow-soft border border-ink-100 flex flex-col items-center justify-center text-center gap-4">
            <div className="size-16 rounded-full bg-ink-50 flex items-center justify-center">
              <Award className="size-8 text-ink-300" />
            </div>
            <h2 className="text-xl font-bold text-ink-900">Agent profile unavailable</h2>
            <p className="text-sm text-ink-500 max-w-sm">
              This profile could not be loaded. The agent may not have set up their public profile yet.
            </p>
            <Link href="/agents" className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 transition-colors">
              Browse all agents
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const hasCredentials = agent.credentials && agent.credentials.length > 0;
  const hasPortfolio = agent.portfolio && agent.portfolio.length > 0;
  const hasReviews = agent.reviews && agent.reviews.length > 0;

  return (
    <div className="min-h-screen bg-[#ebeff3] py-10 sm:py-14">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">

        {/* Back nav — only show if came from /agents directory */}
        {(role || fromDirectory) && (
          <div className="mb-8">
            <Link href="/agents" className="inline-flex items-center gap-2 text-sm font-bold text-ink-500 hover:text-brand-600 transition-colors">
              <ArrowLeft className="size-4" /> Back to Directory
            </Link>
          </div>
        )}

        {/* ── Hero Card ──────────────────────────────────────────────────────── */}
        <div className="rounded-2xl bg-white p-8 sm:p-10 shadow-soft border border-ink-100 flex flex-col sm:flex-row gap-8 items-start sm:items-center justify-between relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-50 rounded-full blur-3xl opacity-50 pointer-events-none" />

          <div className="flex items-start sm:items-center gap-5 sm:gap-6 relative z-10">
            <Avatar initials={agent.initials} hue={agent.avatarHue} size="xl" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-ink-900 flex flex-wrap items-center gap-2 sm:gap-3">
                {agent.name}
                {agent.verified && <VerifiedBadge size="md" />}
              </h1>
              {agent.location && (
                <p className="mt-1.5 text-ink-500 flex items-center gap-2 font-medium text-sm">
                  <MapPin className="size-4 shrink-0" /> {agent.location}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {agent.rating > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 font-bold text-sm">
                    <Star className="size-4" fill="currentColor" strokeWidth={0} />
                    {agent.rating.toFixed(1)} Rating
                  </span>
                )}
                {agent.reviewCount > 0 && (
                  <span className="text-sm font-medium text-ink-500">{agent.reviewCount} Review{agent.reviewCount !== 1 ? "s" : ""}</span>
                )}
                {agent.reviewCount > 0 && agent.yearsExperience > 0 && <span className="text-ink-200">•</span>}
                {agent.yearsExperience > 0 && (
                  <span className="text-sm font-medium text-ink-500 flex items-center gap-1">
                    <Clock className="size-3.5" /> {agent.yearsExperience} Yr{agent.yearsExperience !== 1 ? "s" : ""} Experience
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="relative z-10 w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={handleMessageAgent}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-brand-200 bg-brand-50 text-brand-700 px-5 py-3 text-sm font-bold hover:bg-brand-100 transition-all"
            >
              <MessageSquare className="size-4" />
              Message
            </button>
            <Link
              href={user ? `/projects/new?agentId=${encodeURIComponent(agent.id)}` : `/login?redirect=/projects/new?agentId=${encodeURIComponent(agent.id)}`}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-brand-700 transition-all hover:scale-[1.02]"
            >
              Hire for a Project
            </Link>
          </div>
        </div>

        {/* ── Body Grid ─────────────────────────────────────────────────────── */}
        <div className="mt-8 grid gap-8 lg:grid-cols-3 items-start">

          {/* Left: main content */}
          <div className="lg:col-span-2 space-y-8">

            {/* About */}
            {(agent.bio || agent.specialties.length > 0) && (
              <div className="rounded-xl bg-white p-8 shadow-soft border border-ink-100">
                <h2 className="text-xl font-bold text-ink-900 mb-4 flex items-center gap-2">
                  <Building2 className="size-5 text-brand-600" />
                  About {agent.name.split(" ")[0]}
                </h2>
                {agent.bio && (
                  <p className="text-ink-600 leading-relaxed">{agent.bio}</p>
                )}
                {agent.specialties.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-3">Core Specialties</h3>
                    <div className="flex flex-wrap gap-2">
                      {agent.specialties.map((s) => (
                        <span key={s} className="rounded-xl border border-ink-200 bg-ink-50 px-4 py-2 text-sm font-bold text-ink-700">
                          {ASSET_TYPE_LABEL[s] || s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Portfolio */}
            <div className="rounded-xl bg-white p-8 shadow-soft border border-ink-100">
              <h2 className="text-xl font-bold text-ink-900 mb-6 flex items-center gap-2">
                <Briefcase className="size-5 text-brand-600" />
                Verified Portfolio ({agent.completedProjects || 0} Completed)
              </h2>
              {hasPortfolio ? (
                <div className="space-y-4">
                  {(agent.portfolio || []).map((project: any, idx: number) => (
                    <div key={idx} className="group p-5 rounded-2xl border border-ink-100 bg-ink-50 hover:bg-brand-50 hover:border-brand-100 transition-colors flex flex-col md:flex-row gap-5">
                      {project.imageUrl && (
                        <div className="w-full md:w-32 h-24 shrink-0 rounded-xl overflow-hidden bg-ink-200">
                          <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1.5">
                          <div>
                            <h4 className="font-bold text-ink-900 group-hover:text-brand-700 transition-colors">{project.title}</h4>
                            {project.location && <p className="text-xs text-ink-500 mt-0.5">{project.location}</p>}
                          </div>
                          {project.assetType && (
                            <span className="px-3 py-1 bg-white rounded-2xl border border-ink-200 text-xs font-bold text-ink-600 shadow-sm shrink-0 ml-2">
                              {ASSET_TYPE_LABEL[project.assetType as AssetType] || project.assetType}
                            </span>
                          )}
                        </div>
                        {project.summary && <p className="text-sm text-ink-600 mt-1">{project.summary}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-ink-400">
                  <Briefcase className="size-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No portfolio items yet.</p>
                </div>
              )}
            </div>

            {/* Reviews */}
            <div className="rounded-xl bg-white p-8 shadow-soft border border-ink-100">
              <h2 className="text-xl font-bold text-ink-900 mb-6 flex items-center gap-2">
                <Star className="size-5 text-amber-500" />
                Client Feedback
              </h2>
              {hasReviews ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {(agent.reviews || []).map((review: any, idx: number) => (
                    <div key={idx} className="p-5 rounded-2xl bg-ink-50 border border-ink-100">
                      <div className="flex gap-1 mb-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`size-3.5 ${i < review.rating ? "text-amber-500" : "text-ink-200"}`} fill="currentColor" strokeWidth={0} />
                        ))}
                      </div>
                      <p className="text-sm text-ink-700 italic mb-3">"{review.body || review.quote}"</p>
                      <p className="text-xs font-bold text-ink-900">— {review.author}{review.authorLocation ? ` (${review.authorLocation})` : ""}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-ink-400">
                  <Star className="size-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No reviews yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">

            {/* Trust & Verification — only if verified */}
            {agent.verified && (
              <div className="rounded-xl bg-brand-900 p-7 shadow-soft text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-28 h-28 bg-brand-800 rounded-bl-full opacity-50" />
                <h3 className="text-base font-bold mb-5 flex items-center gap-2">
                  <ShieldCheck className="size-5 text-brand-300" />
                  Trust & Verification
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="size-4 text-mint-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-sm">Identity Verified</p>
                      <p className="text-xs text-brand-200 mt-0.5">Government ID checked</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="size-4 text-mint-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-sm">Background Check</p>
                      <p className="text-xs text-brand-200 mt-0.5">Passed local vetting</p>
                    </div>
                  </li>
                  {hasCredentials && (
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="size-4 text-mint-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-sm">Credentials Verified</p>
                        <p className="text-xs text-brand-200 mt-0.5">Professional licenses confirmed</p>
                      </div>
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Credentials — only if they exist */}
            {hasCredentials && (
              <div className="rounded-xl bg-white p-7 shadow-soft border border-ink-100">
                <h3 className="font-bold text-ink-900 mb-5 flex items-center gap-2">
                  <FileText className="size-5 text-ink-400" />
                  Verified Credentials
                </h3>
                <div className="space-y-3">
                  {(agent.credentials || []).map((cred: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-4 rounded-xl bg-ink-50 border border-ink-100">
                      <div className="size-9 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-ink-100">
                        <FileText className="size-4 text-brand-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-ink-900 leading-snug">{cred.label}</p>
                        {cred.issuer && <p className="text-xs text-ink-500 mt-0.5">Issued by: <span className="font-medium text-ink-700">{cred.issuer}</span></p>}
                        {cred.verifiedOn && <p className="text-xs text-ink-400 mt-0.5">Verified {new Date(cred.verifiedOn).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact */}
            <div className="rounded-xl bg-white p-7 shadow-soft border border-ink-100">
              <h3 className="font-bold text-ink-900 mb-5 flex items-center gap-2">
                <MessageSquare className="size-5 text-ink-400" />
                Get in Touch
              </h3>
              <div className="space-y-3">
                {(agent as any).phone && (
                  <a href={`tel:${(agent as any).phone}`} className="flex items-center gap-3 text-sm text-ink-700 hover:text-brand-600 transition-colors">
                    <div className="size-9 rounded-xl bg-ink-50 flex items-center justify-center shrink-0">
                      <Phone className="size-4 text-ink-500" />
                    </div>
                    {(agent as any).phone}
                  </a>
                )}
                {(agent as any).email && (
                  <a href={`mailto:${(agent as any).email}`} className="flex items-center gap-3 text-sm text-ink-700 hover:text-brand-600 transition-colors">
                    <div className="size-9 rounded-xl bg-ink-50 flex items-center justify-center shrink-0">
                      <Mail className="size-4 text-ink-500" />
                    </div>
                    {(agent as any).email}
                  </a>
                )}
                {(agent as any).website && (
                  <a href={(agent as any).website} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-ink-700 hover:text-brand-600 transition-colors">
                    <div className="size-9 rounded-xl bg-ink-50 flex items-center justify-center shrink-0">
                      <Globe className="size-4 text-ink-500" />
                    </div>
                    {(agent as any).website}
                  </a>
                )}
                {agent.location && (
                  <div className="flex items-center gap-3 text-sm text-ink-700">
                    <div className="size-9 rounded-xl bg-ink-50 flex items-center justify-center shrink-0">
                      <MapPin className="size-4 text-ink-500" />
                    </div>
                    {agent.location}
                  </div>
                )}
                <button
                  onClick={handleMessageAgent}
                  className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-brand-50 border border-brand-200 text-brand-700 font-bold text-sm py-2.5 hover:bg-brand-100 transition-colors"
                >
                  <MessageSquare className="size-4" />
                  Send a Message
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
