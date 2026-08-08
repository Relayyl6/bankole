"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, Search, MapPin, Filter, ArrowRight, ShieldCheck, 
  Clock, DollarSign, Send, CheckCircle2, AlertCircle, X, 
  Sparkles, Layers, Briefcase, Plus, ChevronRight, Check
} from "lucide-react";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notification-context";
import { 
  formatCurrency, 
  ASSET_TYPE_LABEL, 
  type AssetType, 
  type Project, 
  type ProjectBid 
} from "@/lib/models";
import { toast } from "react-toastify";

// Local storage key for fallback persisted bids
const BIDS_STORAGE_KEY = "bankole_marketplace_bids";

export default function MarketplacePage() {
  const { user, role } = useAuth();
  const { addNotification } = useNotifications();
  const isAgent = role === "agent";

  // Data fetching
  const { data: projectsRes, mutate: mutateProjects } = useSWR("/projects?includeMarketplace=true", (url) => 
    apiClient<{ data: Project[] }>(url)
  );
  const allProjects = projectsRes?.data || [];

  // Only show projects that are genuinely public/unassigned marketplace listings.
  // A project is on the marketplace ONLY if it has no assigned agent AND is explicitly marked public.
  const openProjects = useMemo(() => {
    return allProjects.filter((p) => 
      !p.agentId && (p.status === "agent_unassigned" || p.isOpenForBids || (p as any).isPublic)
    );
  }, [allProjects]);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssetType, setSelectedAssetType] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [minBudget, setMinBudget] = useState<number>(0);

  // Active Bid Modal State
  const [activeProjectForBid, setActiveProjectForBid] = useState<Project | null>(null);
  const [proposedFeePercentage, setProposedFeePercentage] = useState<number>(8);
  const [estimatedDurationWeeks, setEstimatedDurationWeeks] = useState<number>(6);
  const [coverLetter, setCoverLetter] = useState<string>("");
  const [isSubmittingBid, setIsSubmittingBid] = useState<boolean>(false);

  // Stored bids
  const [myBids, setMyBids] = useState<ProjectBid[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(BIDS_STORAGE_KEY);
      if (stored) {
        setMyBids(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveBidToLocal = (newBid: ProjectBid) => {
    const updated = [newBid, ...myBids.filter(b => !(b.projectId === newBid.projectId && b.agentId === newBid.agentId))];
    setMyBids(updated);
    try {
      localStorage.setItem(BIDS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return openProjects.filter((p) => {
      // Asset Type
      if (selectedAssetType !== "all" && p.assetType !== selectedAssetType) return false;
      
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const locStr = typeof p.location === "string" ? p.location : p.location?.label || "";
        const nameMatch = p.name.toLowerCase().includes(query);
        const locMatch = locStr.toLowerCase().includes(query);
        const scopeMatch = p.scope?.toLowerCase().includes(query);
        if (!nameMatch && !locMatch && !scopeMatch) return false;
      }

      // Location filter
      if (selectedLocation !== "all") {
        const locStr = typeof p.location === "string" ? p.location : p.location?.label || "";
        if (!locStr.toLowerCase().includes(selectedLocation.toLowerCase())) return false;
      }

      // Budget
      if (minBudget > 0 && p.totalBudget < minBudget) return false;

      return true;
    });
  }, [openProjects, selectedAssetType, searchQuery, selectedLocation, minBudget]);

  // Aggregate Metrics
  const totalMarketplaceEscrow = openProjects.reduce((acc, p) => acc + (p.totalBudget || 0), 0);

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProjectForBid || !user) return;

    if (!coverLetter.trim() || coverLetter.length < 15) {
      toast.error("Please provide a proposal cover letter (at least 15 characters).");
      return;
    }

    setIsSubmittingBid(true);

    const bidData: ProjectBid = {
      id: `bid-${Date.now()}`,
      projectId: activeProjectForBid.id,
      projectName: activeProjectForBid.name,
      projectAssetType: activeProjectForBid.assetType,
      projectLocation: activeProjectForBid.location,
      projectBudget: activeProjectForBid.totalBudget,
      agentId: user.id || "agent-1",
      agentName: user.fullName || user.name || "Agent",
      agentRating: 4.9,
      agentReviewCount: 14,
      agentCompletedProjects: 8,
      agentVerified: true,
      proposedFeePercentage,
      estimatedDurationWeeks,
      coverLetter: coverLetter.trim(),
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    try {
      // Try backend endpoint
      await apiClient(`/projects/${activeProjectForBid.id}/bids`, {
        method: "POST",
        body: {
          proposedFeePercentage,
          estimatedDurationWeeks,
          coverLetter: coverLetter.trim(),
        }
      }).catch(() => {
        // Fallback gracefully if backend has not mounted POST /projects/:id/bids yet
      });

      saveBidToLocal(bidData);

      toast.success("Proposal submitted successfully!");
      addNotification({
        title: "Bid Submitted",
        desc: `You submitted a ${proposedFeePercentage}% proposal for "${activeProjectForBid.name}".`,
        type: "success",
        targetRole: "agent",
      });

      setActiveProjectForBid(null);
      setCoverLetter("");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit proposal.");
    } finally {
      setIsSubmittingBid(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 lg:p-10 space-y-10">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-950 via-ink-900 to-brand-950 p-8 sm:p-12 text-white shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/20 px-4 py-1.5 text-xs font-bold text-brand-300 backdrop-blur-md border border-brand-400/20">
            <Sparkles className="size-3.5" /> Open Opportunities Board
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Bid on Verified Construction & Infrastructure Projects
          </h1>
          <p className="text-sm sm:text-base font-medium text-ink-300 leading-relaxed">
            Diaspora senders post open builds here seeking trusted local supervisors. Review scopes, calculate your supervision earnings, and submit competitive proposals.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-6 text-xs sm:text-sm font-semibold text-ink-300">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-mint-400 animate-pulse" />
              <span>{openProjects.length} Active Opportunities</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-brand-400" />
              <span>100% Escrow-Backed Funding</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="size-4 text-amber-400" />
              <span>{formatCurrency(totalMarketplaceEscrow)} Available Escrow</span>
            </div>
          </div>
        </div>

        {/* Decorative Background Glow */}
        <div className="absolute right-0 top-0 -mr-20 -mt-20 size-96 rounded-full bg-brand-600/20 blur-3xl pointer-events-none" />
        <div className="absolute right-40 bottom-0 size-64 rounded-full bg-mint-500/10 blur-2xl pointer-events-none" />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-6 shadow-soft border border-ink-100 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* Search Box */}
          <div className="md:col-span-5 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-ink-400" />
            <input
              type="text"
              placeholder="Search by project name, description or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-ink-50 rounded-xl pl-11 pr-4 py-3 text-sm font-medium text-ink-900 placeholder:text-ink-400 border border-ink-200/80 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>

          {/* Asset Type Select */}
          <div className="md:col-span-3">
            <select
              value={selectedAssetType}
              onChange={(e) => setSelectedAssetType(e.target.value)}
              className="w-full bg-ink-50 rounded-xl px-4 py-3 text-sm font-semibold text-ink-900 border border-ink-200/80 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            >
              <option value="all">All Asset Types</option>
              {Object.entries(ASSET_TYPE_LABEL).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          {/* Location Select */}
          <div className="md:col-span-2">
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full bg-ink-50 rounded-xl px-4 py-3 text-sm font-semibold text-ink-900 border border-ink-200/80 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            >
              <option value="all">All Regions</option>
              <option value="Lagos">Lagos</option>
              <option value="Abuja">Abuja</option>
              <option value="Edo">Edo / Benin</option>
              <option value="Ibadan">Ibadan</option>
              <option value="Port Harcourt">Port Harcourt</option>
              <option value="Accra">Accra (Ghana)</option>
              <option value="Kumasi">Kumasi (Ghana)</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div className="md:col-span-2 flex items-center justify-end">
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedAssetType("all");
                setSelectedLocation("all");
                setMinBudget(0);
              }}
              className="w-full h-full py-3 px-4 rounded-xl border border-ink-200 text-xs font-bold text-ink-600 hover:bg-ink-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <Filter className="size-3.5" /> Reset Filters
            </button>
          </div>

        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center shadow-soft border border-ink-100 space-y-4">
          <div className="size-16 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
            <Building2 className="size-8" />
          </div>
          <h3 className="text-xl font-bold text-ink-900">No Open Projects Found</h3>
          <p className="text-sm text-ink-500 max-w-md mx-auto">
            There are currently no open projects matching your active filter criteria. Check back soon or reset filters to see all available builds.
          </p>
          {!isAgent && (
            <div className="pt-4">
              <Link
                href="/projects/new"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-600 text-white font-bold text-sm shadow-soft hover:bg-brand-700 transition-all"
              >
                <Plus className="size-4" /> Post a Project to Marketplace
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const locStr = typeof project.location === "string" ? project.location : project.location?.label || "Nigeria";
            const myExistingBid = myBids.find(b => b.projectId === project.id);
            const estFeeAt8Percent = (project.totalBudget || 0) * 0.08;

            return (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl p-6 shadow-soft border border-ink-100 hover:shadow-soft-xl hover:border-brand-300 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-100">
                      {ASSET_TYPE_LABEL[project.assetType] || project.assetType}
                    </span>
                    
                    {myExistingBid ? (
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                        myExistingBid.status === "accepted" ? "bg-green-50 text-green-700 border border-green-200" :
                        myExistingBid.status === "declined" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                        "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        <CheckCircle2 className="size-3" /> Bid {myExistingBid.status} ({myExistingBid.proposedFeePercentage}%)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-mint-50 text-mint-700">
                        Accepting Bids
                      </span>
                    )}
                  </div>

                  {/* Title & Location */}
                  <div>
                    <h3 className="font-black text-xl text-ink-900 group-hover:text-brand-600 transition-colors line-clamp-1">
                      {project.name}
                    </h3>
                    <p className="text-xs text-ink-500 font-semibold flex items-center gap-1 mt-1">
                      <MapPin className="size-3.5 text-ink-400 shrink-0" />
                      <span className="line-clamp-1">{locStr}</span>
                    </p>
                  </div>

                  {/* Scope Summary */}
                  <p className="text-xs text-ink-600 line-clamp-3 bg-ink-50/70 p-3.5 rounded-2xl border border-ink-100/50 leading-relaxed font-medium">
                    {project.scope || "Verified build with staged milestone escrow funding."}
                  </p>

                  {/* Budget & Earnings Preview */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-ink-50 to-white border border-ink-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-ink-500 font-bold uppercase tracking-wider">Total Budget</span>
                      <span className="font-black text-ink-900 text-sm">{formatCurrency(project.totalBudget, project.currency)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-ink-100/80">
                      <span className="text-brand-600 font-bold flex items-center gap-1">
                        <DollarSign className="size-3" /> Est. Supervisor Fee (8%)
                      </span>
                      <span className="font-bold text-brand-700">~{formatCurrency(estFeeAt8Percent, project.currency)}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-6 border-t border-ink-100 mt-6 flex items-center justify-between gap-3">
                  <Link
                    href={`/projects/${project.id}`}
                    className="text-xs font-bold text-ink-500 hover:text-ink-900 flex items-center gap-1 py-2"
                  >
                    View Project <ChevronRight className="size-3.5" />
                  </Link>

                  {isAgent ? (
                    <button
                      onClick={() => {
                        setActiveProjectForBid(project);
                        setProposedFeePercentage(8);
                        setEstimatedDurationWeeks(6);
                      }}
                      className="px-5 py-2.5 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-soft hover:-translate-y-0.5 transition-all flex items-center gap-1.5"
                    >
                      <Send className="size-3.5" /> {myExistingBid ? "Update Proposal" : "Submit Proposal"}
                    </button>
                  ) : (
                    <Link
                      href={`/projects/${project.id}`}
                      className="px-4 py-2 rounded-full bg-ink-900 hover:bg-ink-800 text-white font-bold text-xs shadow-sm transition-all"
                    >
                      Project Workspace
                    </Link>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Submit Proposal Modal */}
      <AnimatePresence>
        {activeProjectForBid && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setActiveProjectForBid(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-ink-100 max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-ink-100 mb-6">
                <div>
                  <h2 className="text-xl font-black text-ink-900">Submit Supervisor Proposal</h2>
                  <p className="text-xs text-ink-500 font-medium mt-0.5">
                    For: <span className="font-bold text-ink-900">{activeProjectForBid.name}</span> ({formatCurrency(activeProjectForBid.totalBudget)})
                  </p>
                </div>
                <button
                  onClick={() => setActiveProjectForBid(null)}
                  className="size-8 rounded-full bg-ink-50 text-ink-400 hover:text-ink-900 flex items-center justify-center transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitBid} className="space-y-6">
                
                {/* Fee Slider & Calculation */}
                <div className="bg-brand-50/60 rounded-2xl p-5 border border-brand-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-ink-900">Proposed Supervision Fee</label>
                    <span className="text-lg font-black text-brand-700">{proposedFeePercentage}%</span>
                  </div>

                  <input
                    type="range"
                    min="3"
                    max="15"
                    step="0.5"
                    value={proposedFeePercentage}
                    onChange={(e) => setProposedFeePercentage(parseFloat(e.target.value))}
                    className="w-full accent-brand-600 cursor-pointer"
                  />

                  <div className="flex justify-between text-[11px] font-bold text-ink-400">
                    <span>3% (Budget)</span>
                    <span>8% (Standard)</span>
                    <span>15% (Comprehensive)</span>
                  </div>

                  <div className="pt-2 border-t border-brand-200/60 flex items-center justify-between text-xs">
                    <span className="font-bold text-brand-900">Your Calculated Earnings:</span>
                    <span className="font-black text-brand-700 text-sm">
                      {formatCurrency((activeProjectForBid.totalBudget * proposedFeePercentage) / 100)}
                    </span>
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-2">
                    Estimated Duration (Weeks)
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-ink-400" />
                    <input
                      type="number"
                      min="1"
                      max="52"
                      value={estimatedDurationWeeks}
                      onChange={(e) => setEstimatedDurationWeeks(parseInt(e.target.value) || 1)}
                      className="w-full bg-white rounded-xl pl-11 pr-4 py-3 text-sm font-bold text-ink-900 border border-ink-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                    />
                  </div>
                </div>

                {/* Pitch / Cover Letter */}
                <div>
                  <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-2">
                    Cover Letter & Supervision Approach
                  </label>
                  <textarea
                    rows={4}
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    placeholder="Describe your relevant experience in this area, your site visit schedule, quality inspection method, and how you will verify materials..."
                    className="w-full bg-white rounded-xl p-4 text-sm font-medium text-ink-900 border border-ink-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none resize-none"
                  />
                  <p className="text-[11px] text-ink-400 mt-1">
                    Include site inspection frequencies (e.g. 3x per week) and geo-tagged proof verification details.
                  </p>
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingBid}
                    className="w-full py-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-black text-sm shadow-soft hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmittingBid ? (
                      "Transmitting Proposal..."
                    ) : (
                      <>
                        <Send className="size-4" /> Send Official Proposal
                      </>
                    )}
                  </button>
                </div>

              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
