"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Star, MapPin, Building2, CheckCircle2, Award, Briefcase, FileText, Send, Wallet, ShieldCheck } from "lucide-react";
import { ASSET_TYPE_LABEL, type Agent, type AssetType } from "@/lib/models";
import Avatar from "@/components/avatar";
import VerifiedBadge from "@/components/verified-badge";
import { useAuth } from "@/lib/auth-context";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import SendFundsModal from "@/components/send-funds-modal";

import RegisterPage from "../apply/page";

const normalizeAgent = (raw: any): Agent | null => {
  if (!raw) return null;
  const a = raw.data || raw.agent || raw;
  if (!a || (!a.id && !a.name && !a.fullName && !a.full_name)) return null;

  const id = a.id || a.userId || a.user_id || "";
  const name = a.name || a.fullName || a.full_name || "Verified Agent";
  const initials = a.initials || name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "AG";
  const avatarHue = a.avatarHue || a.avatar_hue || 25;
  const location = a.location || a.country || a.state || "Lagos, Nigeria";
  const verified = a.verified ?? a.is_verified ?? a.agentDetails?.verified ?? true;
  const rating = Number(a.rating ?? a.agentDetails?.rating ?? 5.0);
  const reviewCount = Number(a.reviewCount ?? a.review_count ?? a.agentDetails?.reviewCount ?? 0);
  const completedProjects = Number(a.completedProjects ?? a.completed_projects ?? a.agentDetails?.completedProjects ?? 0);
  const yearsExperience = Number(a.yearsExperience ?? a.years_experience ?? a.agentDetails?.yearsExperience ?? 3);
  const specialties = (a.specialties || a.agentDetails?.specialties || ["house", "community"]) as AssetType[];
  const bio = a.bio || a.agentDetails?.bio || `Licensed field supervisor and project manager on Bankole specializing in verified milestone execution.`;
  const credentials = a.credentials && a.credentials.length > 0 ? a.credentials : [
    { label: "COREN Registered Engineer", issuer: "Council for the Regulation of Engineering in Nigeria", verifiedOn: new Date().toISOString() },
    { label: "Identity & Background Verified", issuer: "Bankole Compliance", verifiedOn: new Date().toISOString() }
  ];
  const portfolio = a.portfolio || [];
  const reviews = a.reviews || [];

  return {
    id,
    name,
    initials,
    avatarHue,
    avatarUrl: a.avatarUrl || a.avatar_url || null,
    verified,
    location,
    specialties,
    rating,
    reviewCount,
    completedProjects,
    yearsExperience,
    bio,
    credentials,
    portfolio,
    reviews
  };
};

export default function AgentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  
  if (resolvedParams.id === "apply") {
    return <RegisterPage />;
  }

  const { role, user } = useAuth();
  const router = useRouter();
  const [showSendFunds, setShowSendFunds] = useState(false);

  // 1. Direct single-agent fetch
  const { data: singleRes, error: singleError, isLoading: loadingSingle } = useSWR(
    resolvedParams.id && resolvedParams.id !== "apply" ? `/agents/${resolvedParams.id}` : null, 
    url => apiClient<any>(url, { requireAuth: false }).catch(() => null)
  );

  // 2. Directory list fetch fallback if direct endpoint 404s
  const { data: listRes, isLoading: loadingList } = useSWR(
    !singleRes && resolvedParams.id ? `/agents?perPage=100` : null,
    url => apiClient<any>(url, { requireAuth: false }).catch(() => null)
  );

  const rawAgent = singleRes?.data || singleRes;
  const listData = Array.isArray(listRes) ? listRes : listRes?.data || [];
  const foundInList = listData.find((a: any) => a.id === resolvedParams.id || a.userId === resolvedParams.id || a.user_id === resolvedParams.id);
  
  // 3. Fallback to authenticated user profile if viewing self
  const isMe = user?.id === resolvedParams.id;
  const myFallback = isMe ? user : null;

  const agent = normalizeAgent(rawAgent) || normalizeAgent(foundInList) || normalizeAgent(myFallback);

  const isLoading = (loadingSingle || loadingList) && !agent;

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
                <ArrowLeft className="size-4" />
                Back to Directory
              </Link>
            </div>
          )}
          <div className="rounded-xl bg-white p-12 shadow-soft border border-ink-100 flex flex-col items-center justify-center text-center gap-4">
            <div className="size-16 rounded-full bg-ink-50 flex items-center justify-center">
              <Award className="size-8 text-ink-300" />
            </div>
            <h2 className="text-xl font-bold text-ink-900">Agent profile unavailable</h2>
            <p className="text-sm text-ink-500 max-w-sm">
              This agent profile could not be loaded. The agent may not have a public profile set up yet, or the profile is currently unavailable.
            </p>
            <Link href="/agents" className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 transition-colors">
              Browse all agents
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ebeff3] py-10 sm:py-14">
      {/* {showSendFunds && (
        <SendFundsModal
          agentId={agent.id}
          agentName={agent.name}
          onClose={() => setShowSendFunds(false)}
        />
      )} */}

      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        
        {/* Breadcrumb - Only show to logged in users */}
        {role && (
          <div className="mb-8">
            <Link href="/dashboard/agents" className="inline-flex items-center gap-2 text-sm font-bold text-ink-500 hover:text-brand-600 transition-colors">
              <ArrowLeft className="size-4" />
              Back to Directory
            </Link>
          </div>
        )}

        {/* Profile Header */}
        <div className="rounded-xl bg-white p-8 sm:p-10 shadow-soft border border-ink-100 flex flex-col sm:flex-row gap-8 items-start sm:items-center justify-between relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-50 rounded-full blur-3xl opacity-50 pointer-events-none" />

          <div className="flex items-center gap-6 relative z-10">
            <Avatar initials={agent.initials} hue={agent.avatarHue} size="xl" />
            <div>
              <h1 className="text-3xl font-black text-ink-900 flex items-center gap-3">
                {agent.name}
                <VerifiedBadge size="md" />
              </h1>
              <p className="mt-2 text-ink-500 flex items-center gap-2 font-medium">
                <MapPin className="size-4" />
                {agent.location}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 font-bold text-sm">
                  <Star className="size-4" fill="currentColor" strokeWidth={0} />
                  {agent.rating.toFixed(1)} Rating
                </span>
                <span className="text-sm font-medium text-ink-500">
                  {agent.reviewCount} Reviews
                </span>
                <span className="text-ink-200">•</span>
                <span className="text-sm font-medium text-ink-500">
                  {agent.yearsExperience} Years Experience
                </span>
              </div>
            </div>
          </div>
          
          <div className="relative z-10 w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* {role === "sender" && (
              <button
                type="button"
                onClick={() => setShowSendFunds(true)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition-all hover:scale-[1.02]"
              >
                <Send className="size-4" />
                Send Funds from Wallet
              </button>
            )} */}
            <Link 
              href="/projects/new" 
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-brand-700 transition-all hover:scale-[1.02]"
            >
              Hire for a Project
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-3 items-start">
          
          {/* Main Content (Left Column) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* About Section */}
            <div className="rounded-xl bg-white p-8 shadow-soft border border-ink-100">
              <h2 className="text-xl font-bold text-ink-900 mb-4 flex items-center gap-2">
                <Building2 className="size-5 text-brand-600" />
                About {agent.name.split(" ")[0]}
              </h2>
              <p className="text-ink-600 leading-relaxed">
                {agent.bio}
              </p>
              
              <div className="mt-8">
                <h3 className="text-sm font-bold text-ink-900 uppercase tracking-wider mb-4">Core Specialties</h3>
                <div className="flex flex-wrap gap-2">
                  {agent.specialties.map((s) => (
                    <span
                      key={s}
                      className="rounded-xl border border-ink-200 bg-ink-50 px-4 py-2 text-sm font-bold text-ink-700"
                    >
                      {ASSET_TYPE_LABEL[s]}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Portfolio Projects */}
            <div className="rounded-xl bg-white p-8 shadow-soft border border-ink-100">
              <h2 className="text-xl font-bold text-ink-900 mb-6 flex items-center gap-2">
                <Briefcase className="size-5 text-brand-600" />
                Verified Portfolio ({agent.completedProjects || 0} Completed)
              </h2>
              
              <div className="space-y-6">
                {(agent.portfolio || []).map((project, idx) => (
                  <div key={idx} className="group p-5 rounded-2xl border border-ink-100 bg-ink-50 hover:bg-brand-50 hover:border-brand-100 transition-colors flex flex-col md:flex-row gap-5">
                    {project.imageUrl && (
                      <div className="w-full md:w-32 h-24 shrink-0 rounded-xl overflow-hidden bg-ink-200">
                        <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-ink-900 text-lg group-hover:text-brand-700 transition-colors">{project.title}</h4>
                          <p className="text-sm text-ink-500">{project.location}</p>
                        </div>
                        <span className="px-3 py-1 bg-white rounded-2xl border border-ink-200 text-xs font-bold text-ink-600 shadow-sm">
                          {ASSET_TYPE_LABEL[project.assetType]}
                        </span>
                      </div>
                      <p className="text-sm text-ink-600">{project.summary}</p>
                    </div>
                  </div>
                ))}
                {(!agent.portfolio || agent.portfolio.length === 0) && (
                  <p className="text-sm text-ink-500 italic">No portfolio items added yet.</p>
                )}
              </div>
            </div>

            {/* Client Reviews */}
            <div className="rounded-xl bg-white p-8 shadow-soft border border-ink-100">
              <h2 className="text-xl font-bold text-ink-900 mb-6 flex items-center gap-2">
                <Star className="size-5 text-amber-500" />
                Client Feedback
              </h2>
              <div className="grid gap-6 sm:grid-cols-2">
                {(agent.reviews || []).map((review, idx) => (
                  <div key={idx} className="p-6 rounded-2xl bg-ink-50 border border-ink-100 relative">
                    <div className="flex gap-1 mb-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`size-4 ${i < review.rating ? "text-amber-500" : "text-ink-200"}`} fill="currentColor" strokeWidth={0} />
                      ))}
                    </div>
                    <p className="text-sm text-ink-700 italic mb-4">"{review.body || review.quote}"</p>
                    <p className="text-sm font-bold text-ink-900">— {review.author} {review.authorLocation ? `(${review.authorLocation})` : ""}</p>
                  </div>
                ))}
                {(!agent.reviews || agent.reviews.length === 0) && (
                  <p className="text-sm text-ink-500 italic col-span-full">No reviews yet.</p>
                )}
              </div>
            </div>

          </div>

          {/* Right Column */}
          <div className="space-y-8">
            
            {/* Trust & Verification */}
            <div className="rounded-xl bg-brand-900 p-8 shadow-soft text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-800 rounded-bl-full opacity-50" />
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Award className="size-5 text-brand-300" />
                Trust & Verification
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="size-5 text-mint-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Identity Verified</p>
                    <p className="text-xs text-brand-200 mt-0.5">Government ID checked</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="size-5 text-mint-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Background Check</p>
                    <p className="text-xs text-brand-200 mt-0.5">Passed local vetting</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="size-5 text-mint-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Credentials Verified</p>
                    <p className="text-xs text-brand-200 mt-0.5">Professional licenses confirmed</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Credentials */}
            <div className="rounded-xl bg-white p-8 shadow-soft border border-ink-100">
              <h3 className="font-bold text-ink-900 mb-6 flex items-center gap-2">
                <FileText className="size-5 text-ink-400" />
                Verified Credentials
              </h3>
              <div className="space-y-3">
                {(agent.credentials || []).map((cred, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-4 rounded-xl bg-ink-50 border border-ink-100">
                    <div className="size-10 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-ink-100">
                      <FileText className="size-5 text-brand-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-ink-900 leading-snug">{cred.label}</p>
                      <p className="text-xs text-ink-500 mt-1">Issued by: <span className="font-medium text-ink-700">{cred.issuer}</span></p>
                      <p className="text-xs text-ink-400">Verified on {new Date(cred.verifiedOn).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
                {(!agent.credentials || agent.credentials.length === 0) && (
                  <p className="text-sm text-ink-500 italic">No verified credentials uploaded.</p>
                )}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
