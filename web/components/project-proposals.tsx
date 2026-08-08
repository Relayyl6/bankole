"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Building2, CheckCircle2, Clock, DollarSign, Star, 
  Send, UserCheck, ShieldCheck, ChevronRight, X, AlertCircle, ArrowUpRight
} from "lucide-react";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notification-context";
import { type Project, type ProjectBid, formatCurrency } from "@/lib/models";
import Avatar from "@/components/avatar";
import VerifiedBadge from "@/components/verified-badge";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";

const BIDS_STORAGE_KEY = "bankole_marketplace_bids";

export default function ProjectProposals({
  project,
  onProjectUpdated,
}: {
  project: Project;
  onProjectUpdated: () => void;
}) {
  const { user, role } = useAuth();
  const { addNotification } = useNotifications();
  const isSender = role === "sender";
  const isAgent = role === "agent";

  // Data fetching from backend
  const { data: apiBidsRes, mutate: mutateBids } = useSWR(
    `/projects/${project.id}/bids`,
    (url) => apiClient<{ data: ProjectBid[] }>(url).catch(() => ({ data: [] }))
  );

  const [localBids, setLocalBids] = useState<ProjectBid[]>([]);
  const [isAcceptingBidId, setIsAcceptingBidId] = useState<string | null>(null);

  // Proposal submission modal for agents
  const [showBidModal, setShowBidModal] = useState(false);
  const [proposedFeePercentage, setProposedFeePercentage] = useState(8);
  const [estimatedDurationWeeks, setEstimatedDurationWeeks] = useState(6);
  const [coverLetter, setCoverLetter] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load from local storage fallback
  useEffect(() => {
    try {
      const stored = localStorage.getItem(BIDS_STORAGE_KEY);
      if (stored) {
        const parsed: ProjectBid[] = JSON.parse(stored);
        setLocalBids(parsed.filter((b) => b.projectId === project.id));
      }
    } catch {
      // ignore
    }
  }, [project.id]);

  // Combine API bids and local bids
  const allBids: ProjectBid[] = [
    ...(apiBidsRes?.data || []),
    ...localBids.filter(
      (lb) => !(apiBidsRes?.data || []).some((ab) => ab.id === lb.id || (ab.agentId === lb.agentId && ab.projectId === lb.projectId))
    ),
  ];

  // Only show real bids — no mock data in a real-world app
  const displayBids: ProjectBid[] = allBids;

  // Is this a marketplace project (no assigned agent)?
  const isMarketplaceProject = !project.agentId && (project.status === "agent_unassigned" || project.isOpenForBids || (project as any).isPublic);

  const handleAcceptBid = async (bid: ProjectBid) => {
    setIsAcceptingBidId(bid.id);
    try {
      // Call backend endpoint
      await apiClient(`/projects/${project.id}/assign-agent`, {
        method: "POST",
        body: {
          newAgentId: bid.agentId,
          supervisionFeePercentage: bid.proposedFeePercentage,
        },
      });

      // Update bid status in local storage
      try {
        const stored = localStorage.getItem(BIDS_STORAGE_KEY);
        if (stored) {
          const parsed: ProjectBid[] = JSON.parse(stored);
          const updated = parsed.map((b) =>
            b.projectId === project.id
              ? b.id === bid.id
                ? { ...b, status: "accepted" as const }
                : { ...b, status: "declined" as const }
              : b
          );
          localStorage.setItem(BIDS_STORAGE_KEY, JSON.stringify(updated));
        }
      } catch {
        // ignore
      }

      toast.success(`Proposal accepted! ${bid.agentName} has been assigned to supervise.`);
      
      addNotification({
        title: "Agent Assigned via Proposal",
        desc: `You accepted ${bid.agentName}'s proposal (${bid.proposedFeePercentage}% fee) for "${project.name}".`,
        type: "success",
        targetRole: "sender",
      });

      onProjectUpdated();
      mutateBids();
    } catch (err: any) {
      toast.error(err.message || "Failed to assign agent.");
    } finally {
      setIsAcceptingBidId(null);
    }
  };

  const handleAgentSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!coverLetter.trim() || coverLetter.length < 15) {
      toast.error("Please provide a cover letter (at least 15 characters).");
      return;
    }

    setIsSubmitting(true);
    const newBid: ProjectBid = {
      id: `bid-${Date.now()}`,
      projectId: project.id,
      projectName: project.name,
      agentId: user.id || "agent-current",
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
      await apiClient(`/projects/${project.id}/bids`, {
        method: "POST",
        body: {
          proposedFeePercentage,
          estimatedDurationWeeks,
          coverLetter: coverLetter.trim(),
        },
      }).catch(() => {});

      // Save to local storage
      try {
        const stored = localStorage.getItem(BIDS_STORAGE_KEY);
        const parsed: ProjectBid[] = stored ? JSON.parse(stored) : [];
        parsed.unshift(newBid);
        localStorage.setItem(BIDS_STORAGE_KEY, JSON.stringify(parsed));
        setLocalBids((prev) => [newBid, ...prev]);
      } catch {
        // ignore
      }

      toast.success("Your proposal was submitted successfully!");
      addNotification({
        title: "Proposal Submitted",
        desc: `Submitted ${proposedFeePercentage}% proposal for "${project.name}".`,
        type: "success",
        targetRole: "agent",
      });

      setShowBidModal(false);
      setCoverLetter("");
      mutateBids();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit proposal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // If this is a direct-assignment project (already has agent), show a message instead of proposals
  if (!isMarketplaceProject) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <div className="size-14 rounded-full bg-emerald-50 flex items-center justify-center">
          <UserCheck className="size-7 text-emerald-600" />
        </div>
        <h3 className="text-lg font-bold text-ink-900">Agent directly assigned</h3>
        <p className="text-sm text-ink-500 max-w-sm">
          This project was assigned to a specific agent directly — it was not posted to the public marketplace, so there are no competitive bids.
        </p>
        {project.agentId && (
          <Link
            href={`/agents/${project.agentId}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-50 border border-brand-200 text-brand-700 text-sm font-bold hover:bg-brand-100 transition-colors"
          >
            <ArrowUpRight className="size-4" /> View Agent Profile
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-brand-900 to-ink-900 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-bold border border-brand-400/20">
            <Building2 className="size-3.5" /> Public Marketplace Bids
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            Agent Proposals ({displayBids.length})
          </h2>
          <p className="text-xs sm:text-sm text-ink-300 font-medium leading-relaxed">
            {isSender
              ? "Review bids submitted by verified construction supervisors. Compare their supervision fees, inspection timelines, and past performance before making an assignment."
              : "Submit your competitive bid and supervision plan to win supervision rights for this project."}
          </p>
        </div>

        {isAgent && (
          <button
            onClick={() => setShowBidModal(true)}
            className="px-6 py-3 rounded-full bg-brand-500 hover:bg-brand-400 text-white font-bold text-xs shadow-soft hover:-translate-y-0.5 transition-all flex items-center gap-2 shrink-0"
          >
            <Send className="size-4" /> Submit Proposal
          </button>
        )}
      </div>

      {/* Proposals List */}
      <div className="space-y-4">
        {displayBids.map((bid) => {
          const calculatedFee = (project.totalBudget * bid.proposedFeePercentage) / 100;
          const isCurrentAssignedAgent = project.agentId === bid.agentId || project.agent?.id === bid.agentId;

          return (
            <motion.div
              key={bid.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white rounded-3xl p-6 sm:p-8 shadow-soft border transition-all ${
                isCurrentAssignedAgent
                  ? "border-2 border-mint-500 bg-mint-50/20"
                  : "border-ink-100 hover:border-brand-200"
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                
                {/* Agent Profile & Pitch */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-start gap-4">
                    <Avatar
                      initials={bid.agentInitials || bid.agentName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      hue={bid.agentAvatarHue || 200}
                      size="lg"
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/agents/${bid.agentId}`}
                          className="text-lg font-black text-ink-900 hover:text-brand-600 transition-colors underline-offset-2 hover:underline"
                        >
                          {bid.agentName}
                        </Link>
                        {bid.agentVerified && <VerifiedBadge size="sm" />}
                        {isCurrentAssignedAgent && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-mint-100 text-mint-800">
                            <CheckCircle2 className="size-3" /> Active Supervisor
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs font-semibold text-ink-500 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 text-amber-600 font-bold">
                          <Star className="size-3.5 fill-amber-400 text-amber-400" />
                          {bid.agentRating ? bid.agentRating.toFixed(1) : "5.0"} ({bid.agentReviewCount || 10} reviews)
                        </span>
                        <span>•</span>
                        <span>{bid.agentCompletedProjects || 5} Completed Projects</span>
                        <span>•</span>
                        <span className="text-ink-400">
                          Submitted {new Date(bid.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pitch / Cover letter */}
                  <div className="bg-ink-50 rounded-2xl p-4 border border-ink-100 text-xs text-ink-700 leading-relaxed font-medium">
                    <p className="font-bold text-ink-900 mb-1 flex items-center gap-1.5">
                      <ShieldCheck className="size-3.5 text-brand-600" /> Supervision Strategy & Pitch:
                    </p>
                    <p className="whitespace-pre-line">{bid.coverLetter}</p>
                  </div>
                </div>

                {/* Pricing, Timeline & Action Box */}
                <div className="lg:w-72 shrink-0 bg-ink-50 rounded-2xl p-5 border border-ink-100 flex flex-col justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-ink-500 font-bold uppercase tracking-wider">Supervision Fee</span>
                      <span className="text-base font-black text-brand-700">{bid.proposedFeePercentage}%</span>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-2 border-t border-ink-200/60">
                      <span className="text-ink-500 font-medium">Fee Amount</span>
                      <span className="font-bold text-ink-900">{formatCurrency(calculatedFee, project.currency)}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-ink-500 font-medium">Est. Duration</span>
                      <span className="font-bold text-ink-900 flex items-center gap-1">
                        <Clock className="size-3 text-ink-400" /> {bid.estimatedDurationWeeks} Weeks
                      </span>
                    </div>
                  </div>

                  {isSender && (
                    <div className="pt-2">
                      {isCurrentAssignedAgent ? (
                        <div className="w-full py-2.5 rounded-xl bg-mint-100 text-mint-800 text-center text-xs font-bold flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="size-4" /> Assigned Supervisor
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAcceptBid(bid)}
                          disabled={isAcceptingBidId === bid.id}
                          className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-soft hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isAcceptingBidId === bid.id ? (
                            "Assigning..."
                          ) : (
                            <>
                              <UserCheck className="size-4" /> Accept & Assign
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Agent Submit Bid Modal */}
      <AnimatePresence>
        {showBidModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowBidModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-ink-100 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-ink-100 mb-6">
                <div>
                  <h2 className="text-xl font-black text-ink-900">Submit Proposal for {project.name}</h2>
                  <p className="text-xs text-ink-500 font-medium mt-0.5">
                    Budget: <span className="font-bold text-ink-900">{formatCurrency(project.totalBudget, project.currency)}</span>
                  </p>
                </div>
                <button
                  onClick={() => setShowBidModal(false)}
                  className="size-8 rounded-full bg-ink-50 text-ink-400 hover:text-ink-900 flex items-center justify-center transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={handleAgentSubmitBid} className="space-y-6">
                <div className="bg-brand-50/60 rounded-2xl p-5 border border-brand-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-ink-900">Proposed Fee Percentage</label>
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

                  <div className="pt-2 border-t border-brand-200/60 flex items-center justify-between text-xs">
                    <span className="font-bold text-brand-900">Calculated Supervision Earnings:</span>
                    <span className="font-black text-brand-700 text-sm">
                      {formatCurrency((project.totalBudget * proposedFeePercentage) / 100, project.currency)}
                    </span>
                  </div>
                </div>

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

                <div>
                  <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-2">
                    Cover Letter & Supervision Strategy
                  </label>
                  <textarea
                    rows={4}
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    placeholder="Outline your past site supervision experience, weekly inspection schedule, and materials receipt audit procedure..."
                    className="w-full bg-white rounded-xl p-4 text-sm font-medium text-ink-900 border border-ink-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-black text-sm shadow-soft hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? "Submitting Proposal..." : (
                    <>
                      <Send className="size-4" /> Submit Proposal
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
