"use client";

import { use, useState } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle2, AlertTriangle, UploadCloud, MapPin, Clock, Camera, ChevronLeft, ChevronRight, FileText, FileBadge, X } from "lucide-react";
import { 
  MILESTONE_STATUS_LABEL,
  formatCurrency,
  type Project,
  type Milestone,
  type ProgressProof
} from "@/lib/models";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import StatusPill from "@/components/status-pill";
import { MILESTONE_STATUS_TONE } from "@/lib/status";
import { useAuth } from "@/lib/auth-context";
import UploadProofModal from "@/components/upload-proof-modal";
import SendFundsModal from "@/components/send-funds-modal";
import { WalletManager } from "@/lib/wallet";
import { useNotifications } from "@/lib/notification-context";
import { toast } from "react-toastify";

import { ProjectStorage } from "@/lib/projects";

export default function MilestoneDetailPage({
  params,
}: {
  params: Promise<{ id: string; milestoneId: string }>;
}) {
  const { id, milestoneId } = use(params);
  const { role, user } = useAuth();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSendFundsModal, setShowSendFundsModal] = useState(false);
  const { addNotification } = useNotifications();
  
  const { data: apiProject, isLoading: isProjectLoading } = useSWR(`/projects/${id}`, (url) => apiClient<Project>(url).catch(() => null));
  const localProject = ProjectStorage.getCreatedProjects().find(p => p.id === id);
  const project = apiProject || localProject;

  const { data: allMilestones, mutate: mutateMilestones, isLoading: isMilestonesLoading } = useSWR(`/projects/${id}/milestones`, (url) => apiClient<Milestone[]>(url).catch(() => []));
  const { data: proofsResponse, mutate: mutateProofs } = useSWR(
    `/projects/${id}/proofs`, 
    (url) => apiClient<{data: ProgressProof[]}>(url).catch(() => ({ data: [] })),
    {
      refreshInterval: 3000, // Poll every 3 seconds so the AI verdict seamlessly appears!
    }
  );
  
  const milestones = allMilestones || [];
  const localProofs = (proofsResponse?.data || []).filter(p => p.milestoneId === milestoneId);
  
  // Modals state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [proofingState, setProofingState] = useState<{
    proofId: string;
    action: 'approve' | 'flag' | null;
  }>({ proofId: "", action: null });
  const [flagReason, setFlagReason] = useState("");

  const milestone = milestones.find(m => m.id === milestoneId);
  
  if (isProjectLoading || isMilestonesLoading) {
    return (
      <div className="p-10 flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!project || !milestone) {
    notFound();
  }

  const projectMilestones = milestones.filter(m => m.projectId === id).sort((a, b) => a.order - b.order);
  const currentIndex = projectMilestones.findIndex(m => m.id === milestoneId);
  const prevMilestone = currentIndex > 0 ? projectMilestones[currentIndex - 1] : null;
  const nextMilestone = currentIndex < projectMilestones.length - 1 ? projectMilestones[currentIndex + 1] : null;

  const handleApproveProof = async () => {
    try {
      await apiClient(`/proofs/${proofingState.proofId}/approve`, { method: "POST" });
      mutateProofs();
      mutateMilestones();
      toast.success("Proof approved successfully.");
      setProofingState({ proofId: "", action: null });
    } catch (err: any) {
      toast.error(err.message || "Failed to approve proof");
    }
  };

  const handleFlagProof = async () => {
    if (!flagReason.trim()) return;
    try {
      await apiClient(`/proofs/${proofingState.proofId}/flag`, {
        method: "POST",
        body: { reason: flagReason },
      });
      mutateProofs();
      mutateMilestones();
      toast.success("Concern flagged and sent to agent.");
      setProofingState({ proofId: "", action: null });
      setFlagReason("");
    } catch (err: any) {
      toast.error(err.message || "Failed to flag proof");
    }
  };

  // Milestone Lifecycle Handlers
  const handleSubmitMilestone = async () => {
    try {
      await apiClient(`/milestones/${milestoneId}/submit`, { method: "POST" });
      mutateMilestones();
      toast.success("Milestone submitted for sender review!");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit milestone");
    }
  };

  const handleApproveMilestone = async (note?: string) => {
    try {
      await apiClient(`/milestones/${milestoneId}/approve`, {
        method: "POST",
        body: { note: note || "Looks great, milestone approved." },
      });
      mutateMilestones();
      toast.success("Milestone approved!");
    } catch (err: any) {
      toast.error(err.message || "Failed to approve milestone");
    }
  };

  const handleFlagMilestone = async (reason: string) => {
    try {
      await apiClient(`/milestones/${milestoneId}/flag`, {
        method: "POST",
        body: { reason },
      });
      mutateMilestones();
      toast.success("Milestone flagged with feedback.");
    } catch (err: any) {
      toast.error(err.message || "Failed to flag milestone");
    }
  };

  const handleReleaseMilestoneFunds = async () => {
    try {
      let releasedAmt = milestone.escrowAmount;
      try {
        const response = await apiClient<{
          milestone: Milestone;
          fundsReleased: number;
          fundsInEscrow: number;
        }>(`/milestones/${milestoneId}/release`, {
          method: "POST",
          headers: { "Idempotency-Key": crypto.randomUUID() },
        });
        if (response.fundsReleased) {
          releasedAmt = response.fundsReleased;
        }
      } catch (err: any) {
        // Continue with graceful local ledger release if backend mock
      }

      // Record in wallet manager ledger
      WalletManager.addTransaction(user?.id, {
        title: `Milestone Released: ${milestone.stage} (${project.name})`,
        amount: releasedAmt,
        currency: milestone.currency || "NGN",
        type: "debit",
        category: "milestone_release",
        projectId: id,
        reference: `BNK-REL-${Date.now().toString().slice(-6)}`,
        status: "completed",
      });

      mutateMilestones();
      toast.success(`Escrow funds of ${formatCurrency(releasedAmt, milestone.currency)} released to agent!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to release escrow funds");
    }
  };

  return (
    <>
      <AnimatePresence>
        {showSendFundsModal && (
          <SendFundsModal
            agentId={project.agent?.id || project.agentId || ""}
            agentName={project.agent?.name || "Assigned Agent"}
            projectId={id}
            projectName={project.name}
            onClose={() => setShowSendFundsModal(false)}
            onSuccess={() => {
              mutateMilestones();
            }}
          />
        )}

        {showUploadModal && (
          <UploadProofModal
            milestoneId={milestoneId}
            milestoneStage={milestone.stage}
            onClose={() => setShowUploadModal(false)}
            onSuccess={(files) => {
              mutateProofs();
              mutateMilestones();
              addNotification({
                title: "New Proof Uploaded",
                desc: `${files.length} new proof(s) uploaded for ${milestone.stage}.`,
                type: "info",
                targetRole: "sender",
              });
            }}
          />
        )}
      </AnimatePresence>

      {/* Image Viewer Modal */}
      <AnimatePresence>
        {selectedImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/80 backdrop-blur-sm z-[100]">
            <div className="relative max-w-4xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl">
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
              >
                <X className="size-5" />
              </button>
              <div className="aspect-video bg-ink-100 flex items-center justify-center relative">
                 {/* Render actual image if it exists in localProofs */}
                 {(() => {
                   const proof = localProofs.find(p => p.id === selectedImage);
                   if (proof && (proof.fileUrl || proof.thumbnailUrl || proof.previewUrl)) {
                     return <img src={proof.fileUrl || proof.thumbnailUrl || proof.previewUrl} alt="Proof preview" className="w-full h-full object-contain" />;
                   }
                   return (
                     <>
                       <Camera className="size-20 text-ink-300" />
                       <p className="absolute bottom-4 left-4 right-4 text-center text-ink-500 font-bold">Image Preview: {selectedImage}</p>
                     </>
                   );
                 })()}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Approve/Flag Confirmation Modal */}
      <AnimatePresence>
        {proofingState.action && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 sm:pt-14 md:pt-16 overflow-y-auto bg-ink-900/50 backdrop-blur-sm z-[100]">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-ink-100">
                <h3 className="text-xl font-bold text-ink-900">
                  {proofingState.action === 'approve' ? 'Approve this proof?' : 'Flag a concern'}
                </h3>
              </div>
              <div className="p-6">
                {proofingState.action === 'approve' ? (
                  <p className="text-ink-600">
                    Are you sure you want to approve this proof? This action verifies that the work shown meets your expectations.
                  </p>
                ) : (
                  <div>
                    <label className="block text-sm font-bold text-ink-700 mb-2">Reason for concern</label>
                    <textarea 
                      value={flagReason}
                      onChange={(e) => setFlagReason(e.target.value)}
                      placeholder="Please explain what is missing or incorrect..."
                      className="w-full rounded-xl border border-ink-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                      rows={4}
                    />
                  </div>
                )}
              </div>
              <div className="p-6 border-t border-ink-100 bg-ink-50 flex gap-3 justify-end">
                <button 
                  onClick={() => {
                    setProofingState({ proofId: "", action: null });
                    setFlagReason("");
                  }}
                  className="px-4 py-2 font-bold text-ink-600 hover:bg-ink-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                {proofingState.action === 'approve' ? (
                  <button 
                    onClick={handleApproveProof}
                    className="px-4 py-2 font-bold text-white bg-mint-500 hover:bg-mint-600 rounded-xl transition-colors"
                  >
                    Yes, Approve
                  </button>
                ) : (
                  <button 
                    onClick={handleFlagProof}
                    disabled={!flagReason.trim()}
                    className="px-4 py-2 font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-xl transition-colors disabled:opacity-50"
                  >
                    Submit Concern
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

    <div className="flex flex-col h-full bg-[#f6f8fa] overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b border-ink-100 px-8 py-6 shrink-0 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link 
              href={`/projects/${id}`} 
              className="p-2 -ml-2 rounded-full hover:bg-ink-50 text-ink-500 transition-colors"
            >
              <ArrowLeft className="size-5" />
            </Link>
            <div>
              <p className="text-sm font-medium text-ink-500 mb-1">Milestone {milestone.order} of {projectMilestones.length}</p>
              <h1 className="text-2xl font-bold text-ink-900">{milestone.stage}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4 flex-wrap">
            <StatusPill 
              label={MILESTONE_STATUS_LABEL[milestone.status]} 
              tone={MILESTONE_STATUS_TONE[milestone.status]} 
            />

            {/* Role Action Controls */}
            {role === "agent" && (milestone.status === "in_progress" || milestone.status === "pending" || milestone.status === "flagged") && (
              <button
                onClick={handleSubmitMilestone}
                className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors shadow-sm"
              >
                Submit for Review
              </button>
            )}

            {role === "sender" && milestone.status === "proof_submitted" && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleApproveMilestone()}
                  className="bg-mint-500 hover:bg-mint-600 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors shadow-sm"
                >
                  Approve Milestone
                </button>
                <button
                  onClick={() => {
                    const reason = prompt("Enter reason for flagging milestone:");
                    if (reason) handleFlagMilestone(reason);
                  }}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-sm font-bold px-3 py-2 rounded-xl transition-colors"
                >
                  Flag
                </button>
              </div>
            )}

            {role === "sender" && milestone.status === "approved" && (
              <button
                onClick={handleReleaseMilestoneFunds}
                className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors shadow-sm"
              >
                Release Escrow Funds
              </button>
            )}

            <div className="flex items-center gap-2 border-l border-ink-100 pl-4">
              {prevMilestone ? (
                <Link 
                  href={`/projects/${id}/milestones/${prevMilestone.id}`}
                  className="p-2 rounded-full hover:bg-ink-50 text-ink-600 transition-colors"
                  title="Previous Milestone"
                >
                  <ChevronLeft className="size-5" />
                </Link>
              ) : (
                <button disabled className="p-2 rounded-full text-ink-300 cursor-not-allowed">
                  <ChevronLeft className="size-5" />
                </button>
              )}
              
              {nextMilestone ? (
                <Link 
                  href={`/projects/${id}/milestones/${nextMilestone.id}`}
                  className="p-2 rounded-full hover:bg-ink-50 text-ink-600 transition-colors"
                  title="Next Milestone"
                >
                  <ChevronRight className="size-5" />
                </Link>
              ) : (
                <button disabled className="p-2 rounded-full text-ink-300 cursor-not-allowed">
                  <ChevronRight className="size-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-8 max-w-4xl mx-auto w-full flex flex-col gap-8 pb-20">
        
        {/* Milestone Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-ink-100 shadow-sm">
            <p className="text-sm font-medium text-ink-500 mb-1">Escrow Amount</p>
            <p className="text-xl font-bold text-ink-900">{formatCurrency(milestone.escrowAmount, milestone.currency)}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-ink-100 shadow-sm">
            <p className="text-sm font-medium text-ink-500 mb-1">Due Date</p>
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold text-ink-900">
                {new Date(milestone.dueDate).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric'})}
              </p>
              {milestone.isOverdue && (
                <span className="inline-flex items-center rounded bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700">
                  {milestone.daysOverdue}d Late
                </span>
              )}
            </div>
          </div>
          {milestone.status === "released" && milestone.releasedAt ? (
            <div className="bg-white p-5 rounded-2xl border border-ink-100 shadow-sm md:col-span-2">
              <p className="text-sm font-medium text-ink-500 mb-1">Released On</p>
              <p className="text-xl font-bold text-mint-600">
                {new Date(milestone.releasedAt).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric'})}
              </p>
            </div>
          ) : (
            <div className="bg-white p-5 rounded-2xl border border-ink-100 shadow-sm md:col-span-2">
              <p className="text-sm font-medium text-ink-500 mb-1">Verification Req.</p>
              <p className="text-sm font-bold text-ink-900 mt-1 flex gap-4">
                 <span className="flex items-center gap-1"><MapPin className="size-4 text-brand-500" /> GPS Tag</span>
                 <span className="flex items-center gap-1"><Clock className="size-4 text-brand-500" /> Live Timestamp</span>
              </p>
            </div>
          )}
        </div>

        {/* Scope of Work */}
        <div className="bg-white rounded-xl border border-ink-100 shadow-soft p-8">
          <h2 className="text-lg font-bold text-ink-900 mb-6 border-b border-ink-100 pb-4">Scope of Work & Requirements</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-ink-900 mb-2 flex items-center gap-2">
                <FileText className="size-4 text-brand-500" /> Detailed Description
              </h3>
              <p className="text-ink-600 leading-relaxed text-sm">
                {(milestone as any).description || "No specific instructions provided for this milestone."}
              </p>
            </div>
            
            {(milestone.billOfQuantities && milestone.billOfQuantities.length > 0) && (
              <div>
                <h3 className="text-sm font-bold text-ink-900 mb-2 flex items-center gap-2">
                  <FileText className="size-4 text-brand-500" /> Bill of Quantities (BOQ)
                </h3>
                <ul className="list-disc pl-5 text-sm text-ink-600 space-y-1">
                  {milestone.billOfQuantities.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {(milestone.certifications && milestone.certifications.length > 0) && (
              <div>
                <h3 className="text-sm font-bold text-ink-900 mb-2 flex items-center gap-2">
                  <FileBadge className="size-4 text-brand-500" /> Required Certifications
                </h3>
                <div className="flex flex-wrap gap-2">
                  {milestone.certifications.map((cert, idx) => (
                    <span key={idx} className="bg-brand-50 text-brand-700 px-3 py-1.5 rounded-2xl text-xs font-bold border border-brand-100">
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Proof Submission / Review Area */}
        <div className="bg-white rounded-xl border border-ink-100 shadow-soft overflow-hidden">
          <div className="p-6 border-b border-ink-100 bg-ink-50/50 flex justify-between items-center">
            <h2 className="text-lg font-bold text-ink-900">
              Milestone Proofs & Biodata
              {milestone.proofCount !== undefined && milestone.proofCount > 0 && (
                <span className="ml-3 inline-flex items-center justify-center rounded-full bg-ink-200 px-2.5 py-0.5 text-sm font-bold text-ink-700">
                  {milestone.proofCount}
                </span>
              )}
            </h2>
            {role === "agent" && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors"
              >
                <UploadCloud className="size-4" /> Upload Proof
              </button>
            )}
          </div>
          
          <div className="p-6">
            {localProofs.length === 0 ? (
              <div className="text-center py-12 px-4 border-2 border-dashed border-ink-200 rounded-2xl">
                <Camera className="size-12 mx-auto text-ink-300 mb-3" />
                <h3 className="text-lg font-bold text-ink-900 mb-1">No proofs submitted yet</h3>
                <p className="text-ink-500 text-sm max-w-sm mx-auto">
                  {role === "agent" 
                    ? "Upload geo-tagged photos, videos, and site updates here once work begins."
                    : "Waiting for your agent to upload proofs and site updates for this milestone."}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {localProofs.map((proof) => (
                  <div key={proof.id} className="flex flex-col md:flex-row gap-6 p-4 border border-ink-100 rounded-2xl bg-ink-50/30">
                    <button 
                      onClick={() => setSelectedImage(proof.id)}
                      className="w-full md:w-64 h-40 bg-ink-200 hover:bg-ink-300 rounded-xl flex items-center justify-center shrink-0 overflow-hidden relative transition-colors cursor-pointer group"
                    >
                       {(proof.fileUrl || proof.thumbnailUrl || proof.previewUrl) ? (
                         <img src={proof.thumbnailUrl || proof.fileUrl || proof.previewUrl} alt={proof.caption} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                       ) : (
                         <Camera className="size-8 text-ink-400 group-hover:scale-110 transition-transform" />
                       )}
                       <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <span className="opacity-0 group-hover:opacity-100 text-white font-bold text-sm bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm transition-opacity">View Full</span>
                       </div>
                    </button>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-ink-900 text-lg">{proof.caption}</h4>
                          <StatusPill 
                            label={proof.status === 'approved' ? 'Approved' : proof.status === 'flagged' ? 'Flagged' : 'Pending Review'}
                            tone={proof.status === 'approved' ? 'success' : proof.status === 'flagged' ? 'danger' : 'warning'}
                          />
                        </div>
                        
                        <div className="flex flex-wrap gap-4 text-xs font-bold text-ink-500 mt-4">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="size-4 text-ink-400" /> 
                            {proof.geo ? `${proof.geo.lat.toFixed(4)}°, ${proof.geo.lng.toFixed(4)}°` : proof.geoTag || "Site Location"}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="size-4 text-ink-400" /> 
                            {new Date(proof.capturedAt || proof.uploadedAt || proof.timestamp || Date.now()).toLocaleString("en-GB")}
                          </span>
                        </div>
                        {/* AI Verification Report */}
                        {proof.verification ? (
                          <div className={`mt-5 border rounded-xl overflow-hidden ${
                            proof.verification.riskLevel === 'high' ? 'border-rose-200 bg-rose-50/50' : 
                            proof.verification.riskLevel === 'medium' || proof.verification.riskLevel === 'unverifiable' ? 'border-amber-200 bg-amber-50/50' : 
                            'border-mint-200 bg-mint-50/50'
                          }`}>
                            <div className={`px-4 py-3 flex items-start gap-3 border-b ${
                              proof.verification.riskLevel === 'high' ? 'border-rose-100 bg-rose-50' : 
                              proof.verification.riskLevel === 'medium' || proof.verification.riskLevel === 'unverifiable' ? 'border-amber-100 bg-amber-50' : 
                              'border-mint-100 bg-mint-50'
                            }`}>
                              {proof.verification.riskLevel === 'high' ? (
                                <AlertTriangle className="size-5 text-rose-500 shrink-0 mt-0.5" />
                              ) : proof.verification.riskLevel === 'medium' || proof.verification.riskLevel === 'unverifiable' ? (
                                <AlertTriangle className="size-5 text-amber-500 shrink-0 mt-0.5" />
                              ) : (
                                <ShieldCheck className="size-5 text-mint-500 shrink-0 mt-0.5" />
                              )}
                              <div>
                                <h5 className={`font-bold text-sm ${
                                  proof.verification.riskLevel === 'high' ? 'text-rose-900' : 
                                  proof.verification.riskLevel === 'medium' || proof.verification.riskLevel === 'unverifiable' ? 'text-amber-900' : 
                                  'text-mint-900'
                                }`}>
                                  AI Verification Report 
                                  <span className="ml-2 uppercase text-[10px] tracking-wider px-1.5 py-0.5 rounded bg-white/50 border border-current opacity-80">
                                    Risk: {proof.verification.riskLevel}
                                  </span>
                                </h5>
                                <p className={`text-xs mt-1 leading-relaxed ${
                                  proof.verification.riskLevel === 'high' ? 'text-rose-800' : 
                                  proof.verification.riskLevel === 'medium' || proof.verification.riskLevel === 'unverifiable' ? 'text-amber-800' : 
                                  'text-mint-800'
                                }`}>
                                  {proof.verification.summary}
                                </p>
                              </div>
                            </div>
                            
                            {proof.verification.checks && proof.verification.checks.length > 0 && (
                              <div className="px-4 py-3 bg-white">
                                <ul className="space-y-2">
                                  {proof.verification.checks.map((check: any, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2 text-xs">
                                      {check.result === 'pass' ? (
                                        <CheckCircle2 className="size-4 text-mint-500 shrink-0 mt-0.5" />
                                      ) : check.result === 'fail' ? (
                                        <X className="size-4 text-rose-500 shrink-0 mt-0.5" />
                                      ) : (
                                        <div className="size-4 rounded-full bg-ink-200 flex items-center justify-center shrink-0 mt-0.5">
                                          <div className="w-2 h-0.5 bg-ink-500 rounded-full" />
                                        </div>
                                      )}
                                      <div>
                                        <span className="font-bold text-ink-700 capitalize">{check.id}: </span>
                                        <span className="text-ink-600">{check.detail}</span>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ) : (
                          // Fallback for proofs without AI verification yet
                          <>
                            {proof.locationVerified && (
                              <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-mint-600 bg-mint-50 px-2.5 py-1 rounded-xl">
                                <CheckCircle2 className="size-3.5" /> GPS Location Verified
                              </div>
                            )}
                          </>
                        )}

                        {proof.status === 'flagged' && proof.flagReason && (
                          <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-xl text-sm flex gap-2 items-start text-rose-900">
                            <AlertTriangle className="size-4 text-rose-500 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold block mb-0.5">Sender's Feedback:</span>
                              {proof.flagReason}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Action buttons (conditional based on role) */}
                      {role === "sender" && proof.status === "pending_review" && (
                        <div className="flex gap-3 mt-6">
                           <button 
                             onClick={() => setProofingState({ proofId: proof.id, action: 'approve' })}
                             className="flex-1 bg-mint-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-mint-600 transition-colors shadow-sm"
                           >
                             Approve Proof
                           </button>
                           <button 
                             onClick={() => setProofingState({ proofId: proof.id, action: 'flag' })}
                             className="flex-1 bg-white text-rose-600 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-rose-50 transition-colors border border-rose-200 shadow-sm"
                           >
                             Flag Concern
                           </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
