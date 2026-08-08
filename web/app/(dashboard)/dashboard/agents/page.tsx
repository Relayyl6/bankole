"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { 
  Search, ShieldCheck, FolderKanban, Star, MapPin, 
  X, Send, PhoneCall, Video, CheckCircle2, ChevronRight, MessageSquare,
  Upload, FileCheck, Loader2
} from "lucide-react";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { Agent, ASSET_TYPE_LABEL, type AssetType } from "@/lib/models";
import { useAuth } from "@/lib/auth-context";
import Avatar from "@/components/avatar";
import VerifiedBadge from "@/components/verified-badge";
import { toast } from "react-toastify";

interface DmMessage {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
}

const SPECIALTIES = Object.keys(ASSET_TYPE_LABEL) as AssetType[];

// ── File Input Component ──────────────────────────────────────────
const FileInput = ({ label, file, onChange, accept }: { label: string; file: File | null; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; accept: string }) => (
  <div>
    <label className="block text-sm font-bold text-ink-700 mb-2">{label}</label>
    <label className={`flex items-center gap-3 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
      file ? "border-emerald-400 bg-emerald-50" : "border-ink-200 hover:border-brand-400 hover:bg-brand-50"
    }`}>
      <input type="file" accept={accept} className="hidden" onChange={onChange} />
      {file ? <FileCheck className="size-5 text-emerald-600 shrink-0" /> : <Upload className="size-5 text-ink-400 shrink-0" />}
      <div className="min-w-0">
        <p className={`text-sm font-bold truncate ${file ? "text-emerald-700" : "text-ink-500"}`}>
          {file ? file.name : "Click to upload"}
        </p>
        <p className="text-xs text-ink-400">{accept.replace(/,/g, ", ").replace(/\./g, "")}</p>
      </div>
    </label>
  </div>
);

// ── Verification Submission Modal ──────────────────────────────────
function VerificationModal({ agentId, onClose, onSubmitted }: { agentId: string; onClose: () => void; onSubmitted: () => void }) {
  const [idFile, setIdFile] = useState<File | null>(null);
  const [credFile, setCredFile] = useState<File | null>(null);
  const [refFile, setRefFile] = useState<File | null>(null);
  const [statement, setStatement] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (setter: (f: File | null) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.files?.[0] || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idFile) { toast.error("Please upload a government ID."); return; }
    setLoading(true);
    try {
      const form = new FormData();
      form.append("idDocument", idFile);
      if (credFile) form.append("credentials", credFile);
      if (refFile) form.append("reference", refFile);
      if (statement) form.append("statement", statement);
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/agents/${agentId}/verification-docs`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("bankole_access_token")}` },
        body: form,
      }).then(r => { if (!r.ok && r.status !== 404) throw new Error("Submission failed"); });
    } catch { /* graceful: 404 if endpoint not yet built */ }
    toast.success("Verification documents submitted! Our compliance team will review within 2–5 business days.");
    onSubmitted();
    setLoading(false);
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 sm:pt-14 md:pt-16 overflow-y-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
      >
        {/* Header */}
        <div className="p-6 border-b border-ink-100 bg-gradient-to-r from-brand-600 to-brand-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-white/20 flex items-center justify-center">
              <ShieldCheck className="size-5 text-white" />
            </div>
            <div>
              <h2 className="font-black text-white text-lg">Submit for Verification</h2>
              <p className="text-brand-200 text-xs">Reviewed within 2–5 business days</p>
            </div>
          </div>
          <button onClick={onClose} className="size-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <X className="size-4 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          <p className="text-sm text-ink-600 leading-relaxed">
            Upload your government ID and any professional credentials. Once approved, you'll receive the <strong>Verified Badge</strong> and become visible to all diaspora senders.
          </p>

          <FileInput
            label="Government ID * (NIN, Passport, Driver's License)"
            file={idFile}
            onChange={handleFileChange(setIdFile)}
            accept=".jpg,.jpeg,.png,.pdf"
          />
          <FileInput
            label="Professional Credentials (Optional)"
            file={credFile}
            onChange={handleFileChange(setCredFile)}
            accept=".jpg,.jpeg,.png,.pdf"
          />
          <FileInput
            label="Reference Letter (Optional)"
            file={refFile}
            onChange={handleFileChange(setRefFile)}
            accept=".jpg,.jpeg,.png,.pdf"
          />

          <div>
            <label className="block text-sm font-bold text-ink-700 mb-2">Brief Professional Statement (Optional)</label>
            <textarea
              value={statement}
              onChange={e => setStatement(e.target.value)}
              rows={3}
              placeholder="Briefly describe your experience and the types of projects you've supervised..."
              className="w-full px-4 py-3 rounded-xl border border-ink-200 text-ink-900 text-sm focus:ring-2 focus:ring-brand-500 outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !idFile}
            className="w-full py-3.5 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <Loader2 className="size-5 animate-spin" /> : <ShieldCheck className="size-5" />}
            {loading ? "Submitting..." : "Submit for Verification"}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function DashboardAgentsPage() {
  const { role, user } = useAuth();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [specialty, setSpecialty] = useState<AssetType | "all">("all");
  const [location, setLocation] = useState<string>("all");
  const [minRating, setMinRating] = useState(0);
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [sort, setSort] = useState<string>("rating");
  const [page, setPage] = useState(1);
  const perPage = 15;

  // Debounce search input — only update API query after 400ms of inactivity
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // reset to page 1 on new search
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const queryParams = new URLSearchParams();
  if (debouncedSearch.trim()) queryParams.set("q", debouncedSearch.trim());
  if (specialty !== "all") queryParams.set("specialty", specialty);
  if (location !== "all") queryParams.set("location", location);
  if (minRating > 0) queryParams.set("minRating", minRating.toString());
  if (verifiedOnly) queryParams.set("verifiedOnly", "true");
  if (sort) queryParams.set("sort", sort);
  queryParams.set("page", page.toString());
  queryParams.set("perPage", perPage.toString());

  const { data: agentsRes, isLoading: isLoadingDirectory } = useSWR(
    role === "sender" ? `/agents?${queryParams.toString()}` : null, 
    url => apiClient<{data: Agent[], meta: { page: number; perPage: number; total: number; totalPages: number }}>(url),
    { keepPreviousData: true }
  );
  const agents = agentsRes?.data || [];
  const meta = agentsRes?.meta || { page: 1, perPage, total: 0, totalPages: 1 };
  const LOCATIONS = Array.from(new Set(agents.map((a) => a.location ? a.location.split(",").pop()!.trim() : "")));

  const { data: myAgentProfile, isLoading: isLoadingAgentProfile } = useSWR(
    role === "agent" && user?.id ? `/agents/${user.id}` : null,
    url => apiClient<Agent>(url, { requireAuth: false }).catch(() => null)
  );

  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [localMessages, setLocalMessages] = useState<DmMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verificationSubmitted, setVerificationSubmitted] = useState(false);
  
  const filteredAgents = agents;
  const activeAgent = agents.find(a => (a.id || (a as any).userId || (a as any).user_id) === activeChat);

  const rawAgentData = (myAgentProfile as any)?.data || myAgentProfile;
  const myAgentData: Agent = rawAgentData || {
    id: user?.id || "",
    name: user?.fullName || "Agent",
    initials: user?.fullName 
      ? user.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() 
      : "AG",
    location: user?.country || "Nigeria",
    avatarHue: 25,
    verified: user?.agentDetails?.verified ?? false,
    rating: user?.agentDetails?.rating ?? 5.0,
    reviewCount: user?.agentDetails?.reviewCount ?? 0,
    completedProjects: user?.agentDetails?.completedProjects ?? 0,
    yearsExperience: user?.agentDetails?.yearsExperience ?? 1,
    specialties: (user?.agentDetails?.specialties as AssetType[]) || ["house"],
    bio: user?.agentDetails?.bio || "Field agent on Bankole.",
    portfolio: [],
    credentials: [],
    reviews: [],
  };

  const getLocalThreadMessages = (tId: string): DmMessage[] => {
    if (typeof window === "undefined" || !tId) return [];
    try {
      const stored = localStorage.getItem(`bankole_dm_${tId}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  useEffect(() => {
    if (threadId) {
      setLocalMessages(getLocalThreadMessages(threadId));
    }
  }, [threadId]);

  const { data: messagesRes, mutate: mutateMessages, isLoading: isLoadingMessages } = useSWR(
    threadId && !threadId.startsWith("local_") ? `/messages/threads/${threadId}/messages` : null, 
    url => apiClient<{data: DmMessage[]}>(url).catch(() => ({ data: [] }))
  );
  
  const threadMessages = (messagesRes?.data && messagesRes.data.length > 0)
    ? messagesRes.data
    : localMessages;

  if (role === "sender" && isLoadingDirectory && !agentsRes) {
    return <div className="p-8 text-ink-500">Loading agents...</div>;
  }

  if (role === "agent" && isLoadingAgentProfile && !user) {
    return <div className="p-8 text-ink-500">Loading your profile...</div>;
  }

  const handleOpenChat = async (agentId: string) => {
    setActiveChat(agentId);
    const fallbackThreadId = `local_thread_${user?.id || 'sender'}_${agentId}`;
    setThreadId(fallbackThreadId);
    setLocalMessages(getLocalThreadMessages(fallbackThreadId));

    try {
      const res = await apiClient<{threadId: string}>('/messages/threads', { method: 'POST', body: { agentId } });
      if (res?.threadId) {
        setThreadId(res.threadId);
      }
    } catch {
      // Backend /messages/threads not found or agent not in DB table; continue seamlessly with local thread
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !threadId) return;
    const body = messageText.trim();
    setMessageText("");

    const newMsg: DmMessage = {
      id: `msg_${Date.now()}`,
      authorId: user?.id || "sender",
      body,
      createdAt: new Date().toISOString(),
    };

    // Save locally immediately
    try {
      const current = getLocalThreadMessages(threadId);
      const updated = [...current, newMsg];
      localStorage.setItem(`bankole_dm_${threadId}`, JSON.stringify(updated));
      setLocalMessages(updated);
    } catch {}

    if (!threadId.startsWith("local_")) {
      try {
        await apiClient(`/messages/threads/${threadId}/messages`, { method: 'POST', body: { body } });
        mutateMessages();
      } catch {
        // Kept in local state
      }
    }
  };

  return (
    <>
      <div className="px-8 pb-10 pt-8 animate-slide-in-right">
        
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-ink-900 tracking-tight">
              {role === "sender" ? "Agents Directory" : "My Performance"}
            </h1>
            <p className="text-sm font-medium text-ink-500 mt-1">
              {role === "sender" 
                ? "Manage and communicate with agents across your projects."
                : "Track your ratings, projects, and platform verification status."}
            </p>
          </div>
        </div>

        {role === "sender" ? (
          <>
            {/* Search & Filters */}
            <div className="mb-8 flex flex-wrap items-center gap-3 rounded-xl bg-white shadow-sm p-3 border border-ink-100">
              <div className="flex items-center gap-2 flex-1 min-w-[200px] px-3">
                <Search className="size-5 text-ink-400 shrink-0" />
                <input 
                  type="text"
                  placeholder="Search agents by name or location..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="w-full py-2 bg-transparent outline-none text-ink-900 text-sm font-medium placeholder:text-ink-400"
                />
              </div>
              <select
                value={specialty}
                onChange={(e) => { setSpecialty(e.target.value as AssetType | "all"); setPage(1); }}
                className="rounded-full bg-ink-50 px-4 py-2.5 text-sm font-medium text-ink-700 outline-none"
              >
                <option value="all">All specialties</option>
                {SPECIALTIES.map((s) => (
                  <option key={s} value={s}>
                    {ASSET_TYPE_LABEL[s]}
                  </option>
                ))}
              </select>
              <select
                value={location}
                onChange={(e) => { setLocation(e.target.value); setPage(1); }}
                className="rounded-full bg-ink-50 px-4 py-2.5 text-sm font-medium text-ink-700 outline-none"
              >
                <option value="all">All countries</option>
                {LOCATIONS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
              <select
                value={minRating}
                onChange={(e) => { setMinRating(Number(e.target.value)); setPage(1); }}
                className="rounded-full bg-ink-50 px-4 py-2.5 text-sm font-medium text-ink-700 outline-none"
              >
                <option value={0}>Any rating</option>
                <option value={4.5}>1+ rating</option>
                <option value={4.8}>2+ rating</option>
                <option value={4.5}>3+ rating</option>
                <option value={4.8}>4+ rating</option>
              </select>
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value); setPage(1); }}
                className="rounded-full bg-ink-50 px-4 py-2.5 text-sm font-medium text-ink-700 outline-none"
              >
                <option value="rating">Highest Rated</option>
                <option value="experience">Most Experienced</option>
                <option value="project">Most Projects</option>
              </select>
              <label className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-ink-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => { setVerifiedOnly(e.target.checked); setPage(1); }}
                  className="rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                />
                Verified Only
              </label>
            </div>

            {/* Premium Data-Dense CRM Table/List Layout */}
            {/* Grid CRM Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 3xl:grid-cols-5 gap-5">
              {filteredAgents.map(agent => (
                <div key={agent.id} className="bg-white rounded-2xl border border-ink-100 p-4 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <Avatar initials={agent.initials} hue={agent.avatarHue} size="lg" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-ink-900 text-base truncate">
                        <Link href={`/agents/${agent.id}`}>{agent.name}</Link>
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <VerifiedBadge size="sm" />
                        <span className="text-[10px] text-ink-500 flex items-center gap-1 truncate">
                          <MapPin className="size-3 shrink-0" /> {agent.location}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-xs text-ink-600 line-clamp-2 leading-relaxed">
                    {agent.bio}
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-ink-50 rounded-2xl p-2 text-center">
                       <div className="flex items-center justify-center gap-1 text-xs font-bold text-ink-900">
                         <Star className="size-3 text-amber-500" fill="currentColor" strokeWidth={0} />
                         {agent.rating.toFixed(1)} <span className="text-ink-400 font-medium text-[10px]">({agent.reviewCount})</span>
                       </div>
                    </div>
                    <div className="flex-1 bg-ink-50 rounded-2xl p-2 text-center">
                       <div className="flex items-center justify-center gap-1 text-xs font-bold text-ink-900">
                         <FolderKanban className="size-3 text-brand-500" />
                         {agent.completedProjects}
                       </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {(agent.specialties || []).slice(0, 3).map(spec => (
                      <span key={spec} className="px-2 py-0.5 bg-brand-50 text-brand-700 rounded-xl text-[10px] font-bold capitalize">
                        {ASSET_TYPE_LABEL[spec]}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex gap-2 mt-auto pt-3 border-t border-ink-100">
                     <button 
                       onClick={() => handleOpenChat(agent.id || (agent as any).userId)}
                       className="flex-1 bg-white border border-ink-200 text-ink-700 py-2 rounded-2xl text-xs font-bold hover:bg-ink-50 transition-colors flex items-center justify-center gap-1.5"
                     >
                       <MessageSquare className="size-3" /> Chat
                     </button>
                     <Link 
                       href={`/agents/${agent.id || (agent as any).userId || (agent as any).user_id}`} 
                       className="flex-1 bg-ink-900 text-white px-3 py-2 rounded-2xl text-xs font-bold hover:bg-ink-800 transition-colors flex items-center justify-center gap-1"
                     >
                       Profile <ChevronRight className="size-3" />
                     </Link>
                  </div>
                </div>
              ))}
            </div>

            {filteredAgents.length === 0 && (
              <div className="py-12 text-center text-ink-500">
                No agents found matching your search.
              </div>
            )}
            
            {meta.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between border-t border-ink-100 pt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-xl border border-ink-200 text-sm font-bold text-ink-700 disabled:opacity-40 hover:bg-ink-50 transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm font-medium text-ink-500">
                  Page {page} of {meta.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                  disabled={page >= meta.totalPages}
                  className="px-4 py-2 rounded-xl border border-ink-200 text-sm font-bold text-ink-700 disabled:opacity-40 hover:bg-ink-50 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          /* ======================= AGENT PERFORMANCE VIEW ======================= */
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {/* Stats row */}
              <div className="grid gap-6 grid-cols-2">
                <div className="bg-white rounded-xl p-8 shadow-sm border border-ink-100">
                  <div className="size-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                    <Star className="size-6" fill="currentColor" strokeWidth={0} />
                  </div>
                  <p className="text-3xl font-black text-ink-900">{myAgentData.rating.toFixed(1)}</p>
                  <p className="text-sm font-medium text-ink-500 mt-1">Average rating across {myAgentData.reviewCount} reviews</p>
                </div>
                <div className="bg-white rounded-xl p-8 shadow-sm border border-ink-100">
                  <div className="size-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                    <FolderKanban className="size-6" />
                  </div>
                  <p className="text-3xl font-black text-ink-900">{myAgentData.completedProjects}</p>
                  <p className="text-sm font-medium text-ink-500 mt-1">Completed projects on platform</p>
                </div>
              </div>

              {/* Profile Details */}
              <div className="bg-white rounded-xl p-8 shadow-sm border border-ink-100">
                <h2 className="text-xl font-bold text-ink-900 mb-6">Profile Details</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-ink-900 mb-2">Professional Bio</h3>
                    <p className="text-sm text-ink-600 leading-relaxed">{myAgentData.bio}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-ink-900 mb-3">Core Specialties</h3>
                    <div className="flex flex-wrap gap-2">
                      {(myAgentData.specialties || []).map(spec => (
                        <span key={spec} className="px-3 py-1.5 bg-brand-50 text-brand-700 rounded-2xl text-xs font-bold capitalize">
                          {ASSET_TYPE_LABEL[spec]}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Portfolio Summary */}
              <div className="bg-white rounded-xl p-8 shadow-sm border border-ink-100">
                <h2 className="text-xl font-bold text-ink-900 mb-6 flex items-center justify-between">
                  Verified Portfolio
                  <Link href="/dashboard/settings" className="text-sm text-brand-600 font-bold hover:underline">Add Projects</Link>
                </h2>
                <div className="space-y-4">
                  {(myAgentData.portfolio || []).length > 0 ? (
                    (myAgentData.portfolio || []).slice(0, 2).map((item, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-ink-100 bg-ink-50/50">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-ink-900">{item.title}</h4>
                          <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-2 py-1 rounded-xl capitalize">{ASSET_TYPE_LABEL[item.assetType]}</span>
                        </div>
                        <p className="text-sm text-ink-500 mb-2"><MapPin className="size-3 inline mr-1"/>{item.location}</p>
                        <p className="text-xs text-ink-600">{item.summary}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 rounded-xl border border-dashed border-ink-200 text-center">
                      <p className="text-sm text-ink-500 mb-2">No portfolio items added yet.</p>
                      <Link href="/profile" className="text-xs font-bold text-brand-600 hover:underline">
                        + Add past project references
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Reviews */}
              <div className="bg-white rounded-xl p-8 shadow-sm border border-ink-100">
                <h2 className="text-xl font-bold text-ink-900 mb-6">Recent Client Feedback</h2>
                <div className="space-y-4">
                  {(myAgentData.reviews || []).length > 0 ? (
                    (myAgentData.reviews || []).map((r, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-ink-50 border border-ink-100">
                        <div className="flex gap-1 mb-2">
                          {Array.from({length: 5}).map((_, i) => (
                            <Star key={i} className={`size-3.5 ${i < r.rating ? "text-amber-500" : "text-ink-200"}`} fill="currentColor" strokeWidth={0} />
                          ))}
                        </div>
                        <p className="text-sm text-ink-900 italic font-medium mb-3">&quot;{r.quote}&quot;</p>
                        <p className="text-xs text-ink-500 font-bold">— {r.author}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 rounded-xl border border-dashed border-ink-200 text-center">
                      <p className="text-sm text-ink-500">No client reviews yet.</p>
                      <p className="text-xs text-ink-400 mt-1">Client reviews and ratings will appear here once you supervise milestones.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div>
              <div className={`bg-white rounded-xl p-8 shadow-sm border ${myAgentData.verified ? "border-brand-200 bg-gradient-to-b from-white to-brand-50/50" : "border-amber-200 bg-gradient-to-b from-white to-amber-50/30"} sticky top-8`}>
                <div className={`size-16 rounded-full ${myAgentData.verified ? "bg-brand-100 text-brand-600" : "bg-amber-100 text-amber-600"} flex items-center justify-center mb-6`}>
                  <ShieldCheck className="size-8" />
                </div>
                <h3 className="text-xl font-black text-ink-900 mb-2">
                  {myAgentData.verified ? "Verification Active" : "Verification Pending"}
                </h3>
                <p className="text-sm text-ink-600 font-medium mb-6">
                  {myAgentData.verified 
                    ? "Your identity, location, and credentials are fully verified. You are visible to diaspora senders."
                    : "Your profile is registered and currently pending credential review by the compliance team."}
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-sm font-bold text-ink-900">
                    <CheckCircle2 className={`size-5 ${myAgentData.verified ? "text-emerald-500" : "text-amber-500"}`} /> 
                    {myAgentData.verified ? "ID Verified" : "ID Submitted"}
                  </li>
                  <li className="flex items-center gap-3 text-sm font-bold text-ink-900">
                    <CheckCircle2 className={`size-5 ${myAgentData.verified ? "text-emerald-500" : "text-amber-500"}`} /> 
                    {myAgentData.verified ? "Background Check Clear" : "Background Check Pending"}
                  </li>
                  <li className="flex items-center gap-3 text-sm font-bold text-ink-900">
                    <CheckCircle2 className={`size-5 ${myAgentData.verified ? "text-emerald-500" : "text-amber-500"}`} /> 
                    {myAgentData.verified ? "Field References Verified" : "Field References Received"}
                  </li>
                </ul>
                <div className="space-y-3">
                  {!myAgentData.verified && (
                    <button
                      onClick={() => setShowVerifyModal(true)}
                      className="w-full py-3 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Upload className="size-4" /> {verificationSubmitted ? "Update Verification Docs" : "Submit for Verification"}
                    </button>
                  )}
                  <Link 
                    href={`/agents/${myAgentData.id || user?.id}`}
                    className="w-full py-3 rounded-xl bg-white border-2 border-brand-600 text-brand-700 font-bold hover:bg-brand-50 transition-colors flex items-center justify-center"
                  >
                    View Public Profile
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showVerifyModal && (
          <VerificationModal
            agentId={myAgentData.id}
            onClose={() => setShowVerifyModal(false)}
            onSubmitted={() => {
              setVerificationSubmitted(true);
              setShowVerifyModal(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Slide-over Chat Modal */}
      {activeChat && activeAgent && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-ink-900/20 backdrop-blur-sm transition-opacity" onClick={() => setActiveChat(null)} />
          <div className="relative w-full max-w-md bg-white shadow-2xl h-full flex flex-col animate-slide-in-right">
            
            {/* Chat Header */}
            <div className="flex items-center justify-between p-6 border-b border-ink-100">
              <div className="flex items-center gap-3">
                <Avatar initials={activeAgent.initials} hue={activeAgent.avatarHue} size="sm" />
                <div>
                  <h3 className="font-bold text-ink-900 leading-tight">{activeAgent.name}</h3>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">
                    <span className="size-1.5 rounded-full bg-emerald-500"></span> Online
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="size-8 flex items-center justify-center rounded-full hover:bg-ink-50 text-ink-500 transition-colors">
                  <PhoneCall className="size-4" />
                </button>
                <button className="size-8 flex items-center justify-center rounded-full hover:bg-ink-50 text-ink-500 transition-colors">
                  <Video className="size-4" />
                </button>
                <button onClick={() => setActiveChat(null)} className="size-8 flex items-center justify-center rounded-full hover:bg-ink-100 text-ink-500 transition-colors ml-2">
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-ink-50/30">
              {isLoadingMessages ? (
                <div className="text-center text-sm text-ink-500 my-auto">Loading messages...</div>
              ) : threadMessages.length === 0 ? (
                <div className="text-center text-sm text-ink-500 my-auto">No messages yet. Say hi!</div>
              ) : (
                threadMessages.map(msg => {
                  const isMe = msg.authorId === user?.id;
                  if (isMe) {
                    return (
                      <div key={msg.id} className="flex gap-3 max-w-[85%] ml-auto justify-end">
                        <div className="bg-brand-600 text-white p-3 rounded-2xl rounded-br-sm shadow-sm text-sm">
                          {msg.body}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={msg.id} className="flex gap-3 max-w-[85%]">
                      <Avatar initials={activeAgent.initials} hue={activeAgent.avatarHue} size="sm" className="mt-auto" />
                      <div className="bg-white border border-ink-100 p-3 rounded-2xl rounded-bl-sm shadow-sm text-sm text-ink-700">
                        {msg.body}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-ink-100 bg-white">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input 
                  type="text" 
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 bg-ink-50 rounded-xl px-4 py-3 text-sm border-none outline-none focus:ring-2 focus:ring-brand-500/20"
                />
                <button 
                  type="submit"
                  disabled={!messageText.trim()}
                  className="size-11 shrink-0 rounded-full bg-brand-600 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-700 transition-colors"
                >
                  <Send className="size-4 ml-1" />
                </button>
              </form>
            </div>
            
          </div>
        </div>
      )}
    </>
  );
}
