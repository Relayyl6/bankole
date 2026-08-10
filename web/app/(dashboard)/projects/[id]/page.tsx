"use client";

import { useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, MapPin, FlagTriangleRight, FileText, CheckCircle2, AlertTriangle, MessageSquare, Star, UserMinus, UserPlus, Activity, ShieldCheck, Send, Wallet, Plus, Zap, UploadCloud, ChevronRight, Lock, Unlock } from "lucide-react";
import StatusPill from "@/components/status-pill";
import ProgressProofCard from "@/components/progress-proof-card";
import { useAuth } from "@/lib/auth-context";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { toast } from "react-toastify";
import { type Project, type Milestone, type ProgressProof, formatCurrency } from "@/lib/models";
import { AnimatePresence } from "framer-motion";
import ReviewAgentModal from "@/components/review-agent-modal";
import UnassignAgentModal from "@/components/unassign-agent-modal";
import AssignAgentModal from "@/components/assign-agent-modal";
import ProjectDocuments from "@/components/project-documents";
import ProjectChat from "@/components/project-chat";
import ProjectProposals from "@/components/project-proposals";
import SendFundsModal from "@/components/send-funds-modal";
import UploadProofModal from "@/components/upload-proof-modal";
import { useWallet } from "@/lib/wallet";
import { Building2 } from "lucide-react";
import { isProjectAssignedToAgent, ProjectStorage } from "@/lib/projects";

type ProjectTab = "milestones" | "proposals" | "documents" | "messages";

export default function ProjectWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  
  const { data: apiProject, mutate: mutateProject } = useSWR(`/projects/${projectId}`, (url) => apiClient<Project>(url).catch(() => null));
  const { data: milestones, mutate: mutateMilestones } = useSWR(`/projects/${projectId}/milestones`, (url) => apiClient<Milestone[]>(url).catch(() => []));
  const { data: proofsResponse, mutate: mutateProofs } = useSWR(`/projects/${projectId}/proofs`, (url) => apiClient<{data: ProgressProof[]}>(url).catch(() => ({ data: [] })));
  
  const localProject = ProjectStorage.getCreatedProjects().find(p => p.id === projectId);
  const project = apiProject || localProject;

  const proofs = proofsResponse?.data || [];
  const { role, user } = useAuth();
  const { balance } = useWallet(user?.id, user?.fullName, (user as any)?.agentDetails?.id);

  const isUnassigned = project ? (project.status === "agent_unassigned" || !project.agent) : false;
  
  // Calculate if the current user is the assigned agent
  const isAssignedAgent = isProjectAssignedToAgent(project, user);
  const canAccessChat = role === "sender" || (role === "agent" && isAssignedAgent);

  const [activeTab, setActiveTab] = useState<ProjectTab>(isUnassigned ? "proposals" : "milestones");
  
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showUnassignModal, setShowUnassignModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showSendFundsModal, setShowSendFundsModal] = useState(false);
  const [uploadMilestone, setUploadMilestone] = useState<Milestone | null>(null);

  const handleFundMilestone = async (milestoneId: string) => {
    try {
      await apiClient(`/milestones/${milestoneId}/fund`, { method: "POST" });
      toast.success("Milestone funded successfully! The escrow is now locked.");
      mutateProject();
      mutateMilestones();
    } catch (err: any) {
      toast.error(err.message || "Failed to fund milestone. Please top up your wallet.");
    }
  };

  if (!project || !milestones) {
    return <div className="p-10 text-center animate-pulse">Loading...</div>;
  }

  // Find proofs with concern flagged
  const flaggedProofs = proofs.filter(p => p.status === "flagged");

  return (
    <div className="px-8 pb-10 pt-8 animate-slide-in-right max-w-5xl mx-auto">
      
      <Link href={`/projects`} className="inline-flex items-center gap-2 text-sm font-bold text-ink-500 hover:text-ink-900 transition-colors mb-6">
        <ArrowLeft className="size-4" /> Back to Projects List
      </Link>

      <div className="mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-ink-900 tracking-tight flex items-center gap-3">
            {project.name || "Project Workspace"}
            {isUnassigned && (
              <span className="inline-flex px-2.5 py-1 bg-amber-50 text-amber-700 text-xs rounded-lg border border-amber-200 font-bold">
                Open for Proposals
              </span>
            )}
          </h1>
          <p className="text-sm font-medium text-ink-500 mt-1">Review flagged concerns, uploaded documents, proposals, and detailed progress reports.</p>

          {/* Assigned agent card */}
          {project.agent && (
            <Link
              href={`/agents/${project.agent.id}`}
              className="mt-3 inline-flex items-center gap-3 px-4 py-2.5 rounded-xl bg-ink-50 border border-ink-100 hover:bg-brand-50 hover:border-brand-200 transition-colors group w-fit"
            >
              <div className="size-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                {project.agent.initials || project.agent.name?.split(" ").map((n: string) => n[0]).join("").slice(0,2).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-bold text-ink-500 uppercase tracking-wider">Assigned Agent</p>
                <p className="text-sm font-bold text-ink-900 group-hover:text-brand-700 transition-colors flex items-center gap-1.5">
                  {project.agent.name}
                  {project.agent.verified && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-brand-600 bg-brand-50 border border-brand-200 px-1.5 py-0.5 rounded-md">
                      <ShieldCheck className="size-3" /> Verified
                    </span>
                  )}
                </p>
              </div>
              <CheckCircle2 className="size-4 text-ink-300 group-hover:text-brand-600 transition-colors ml-auto" />
            </Link>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/projects/${projectId}/activity`}
            className="inline-flex items-center gap-2 bg-white border border-ink-200 text-ink-700 font-bold px-4 py-2 rounded-xl hover:bg-ink-50 transition-colors shadow-sm"
          >
            <Activity className="size-4 text-brand-600" />
            Audit Trail
          </Link>
          {role === "sender" && (
            <>
              {!isUnassigned && project.agent ? (
                <>
                  <button 
                    onClick={() => setShowSendFundsModal(true)}
                    className="inline-flex items-center gap-2 bg-emerald-600 border border-emerald-700 text-white font-bold px-4 py-2 rounded-xl hover:bg-emerald-700 transition-all shadow-sm hover:scale-[1.02]"
                  >
                    <Send className="size-4" />
                    Send Funds to Agent
                  </button>
                  <button 
                    onClick={() => setShowUnassignModal(true)}
                    className="inline-flex items-center gap-2 bg-white border border-rose-200 text-rose-700 font-bold px-4 py-2 rounded-xl hover:bg-rose-50 transition-colors shadow-sm"
                  >
                    <UserMinus className="size-4" />
                    Unassign Agent
                  </button>
                  <button 
                    onClick={() => setShowReviewModal(true)}
                    className="inline-flex items-center gap-2 bg-white border border-ink-200 text-ink-700 font-bold px-4 py-2 rounded-xl hover:bg-ink-50 transition-colors shadow-sm"
                  >
                    <Star className="size-4 text-amber-400" />
                    Rate Agent
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setShowAssignModal(true)}
                  className="inline-flex items-center gap-2 bg-brand-600 border border-brand-700 text-white font-bold px-4 py-2 rounded-xl hover:bg-brand-700 transition-colors shadow-sm"
                >
                  <UserPlus className="size-4" />
                  Assign Verified Agent
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showSendFundsModal && (project.agent || project.agentId) && (
          <SendFundsModal
            agentId={project.agent?.id || (project.agentId as string)}
            agentName={project.agent?.name || "Assigned Agent"}
            projectId={project.id}
            projectName={project.name}
            onClose={() => setShowSendFundsModal(false)}
            onSuccess={() => {
              mutateProject();
              mutateMilestones();
            }}
          />
        )}

        {showReviewModal && project.agent && (
          <ReviewAgentModal
            agentId={project.agent.id}
            agentName={project.agent.name}
            projectId={project.id}
            onClose={() => setShowReviewModal(false)}
            onSuccess={() => {}}
          />
        )}
        
        {showUnassignModal && project.agent && (
          <UnassignAgentModal
            projectId={project.id}
            agentName={project.agent.name}
            onClose={() => setShowUnassignModal(false)}
            onUnassign={() => {
              mutateProject();
            }}
          />
        )}

        {showAssignModal && (
          <AssignAgentModal
            projectId={project.id}
            onClose={() => setShowAssignModal(false)}
            onAssign={(newAgentId) => {
              mutateProject();
            }}
          />
        )}
      </AnimatePresence>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-ink-200 mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab("milestones")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
            activeTab === "milestones"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-ink-500 hover:text-ink-900"
          }`}
        >
          <Clock className="size-4" />
          Milestones & Progress
        </button>
        <button
          onClick={() => setActiveTab("proposals")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
            activeTab === "proposals"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-ink-500 hover:text-ink-900"
          }`}
        >
          <Building2 className="size-4" />
          Proposals & Bids
          {isUnassigned && (
            <span className="size-2 rounded-full bg-brand-600 animate-pulse" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("documents")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
            activeTab === "documents"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-ink-500 hover:text-ink-900"
          }`}
        >
          <FileText className="size-4" />
          Documents & Records
        </button>
        {canAccessChat && (
          <button
            onClick={() => setActiveTab("messages")}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === "messages"
                ? "border-brand-600 text-brand-600"
                : "border-transparent text-ink-500 hover:text-ink-900"
            }`}
          >
            <MessageSquare className="size-4" />
            Messages & Discussions
          </button>
        )}
      </div>

      {activeTab === "proposals" && (
        <ProjectProposals 
          project={project} 
          onProjectUpdated={() => {
            mutateProject();
          }} 
        />
      )}

      {activeTab === "milestones" && (
        <>
          {flaggedProofs.length > 0 && (
            <div className="mb-10 p-6 rounded-xl bg-rose-50 border border-rose-200 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="size-6 text-rose-600" />
                <h2 className="text-xl font-bold text-rose-900">Attention Required</h2>
              </div>
              <p className="text-sm text-rose-700 mb-6">The following milestone submissions have been flagged for concerns. Please review the details and engage with the agent to resolve the blockages.</p>
              
              <div className="grid gap-6 sm:grid-cols-2">
                {flaggedProofs.map(proof => (
                  <div key={proof.id} className="bg-white rounded-2xl p-5 shadow-sm border border-rose-100 flex flex-col">
                    <ProgressProofCard proof={proof} />
                    <div className="mt-4 pt-4 border-t border-ink-100">
                      <h4 className="text-sm font-bold text-ink-900 mb-2 flex items-center gap-2">
                        <FileText className="size-4 text-ink-400" /> Resolution Documents
                      </h4>
                      <div className="bg-ink-50 rounded-xl p-3 flex items-center justify-between text-sm">
                        <span className="font-medium text-ink-700 truncate">materials-receipt-v2.pdf</span>
                        <button onClick={() => setActiveTab("documents")} className="text-brand-600 font-bold hover:underline">View</button>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      {canAccessChat && (
                        <button onClick={() => setActiveTab("messages")} className="flex-1 bg-white border border-ink-200 text-ink-700 font-bold py-2.5 rounded-xl hover:bg-ink-50 transition-colors flex items-center justify-center gap-2">
                          <MessageSquare className="size-4" /> Discuss
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-6">
            <h2 className="text-xl font-bold text-ink-900">All Milestones Timeline</h2>
            {milestones.map((milestone, idx) => {
              const mProofs = proofs.filter(p => p.milestoneId === milestone.id);
              return (
                <div key={milestone.id} className="bg-white rounded-xl p-6 shadow-sm border border-ink-100 flex flex-col md:flex-row gap-6 items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink-100 text-sm font-black text-ink-500">
                        {idx + 1}
                      </span>
                      <h3 className="text-lg font-bold text-ink-900">{milestone.stage}</h3>
                    </div>
                    <div className="pl-11">
                      <div className="flex flex-wrap gap-3 text-xs font-medium text-ink-500 mt-2">
                        <span className="flex items-center gap-1"><MapPin className="size-3.5" /> Geo-verification required</span>
                        <span className="flex items-center gap-1"><CheckCircle2 className="size-3.5" /> Escrow: {formatCurrency(milestone.escrowAmount, milestone.currency)}</span>
                        {(milestone as any).is_funded ? (
                          <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold"><Lock className="size-3" /> Funded & Protected</span>
                        ) : (
                          <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-bold"><Unlock className="size-3" /> Awaiting Funds</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="w-full md:w-64 shrink-0 bg-ink-50 rounded-2xl p-4 flex flex-col">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-3">Submissions</h4>
                    <div className="flex-1">
                      {mProofs.length > 0 ? (
                        <div className="space-y-3">
                          {mProofs.map(p => (
                            <div key={p.id} className="flex items-center justify-between text-sm">
                              <span className="text-ink-700 font-medium truncate pr-2">{p.caption}</span>
                              <StatusPill label={p.status === 'flagged' ? 'Flagged' : p.status === 'approved' ? 'Approved' : 'Pending'} tone={p.status === 'flagged' ? 'danger' : p.status === 'approved' ? 'success' : 'brand'} />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-ink-400 italic mb-4">No proofs submitted yet</p>
                      )}
                    </div>
                    <div className="mt-4 flex flex-col gap-2">
                      {role === "sender" && !(milestone as any).is_funded && (
                        <button 
                          onClick={() => handleFundMilestone(milestone.id)}
                          className="w-full bg-brand-600 text-white rounded-xl py-2 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-brand-700 transition-colors"
                        >
                          <Wallet className="size-3.5" /> Fund Milestone
                        </button>
                      )}

                      {isAssignedAgent && (
                        <button 
                          onClick={() => setUploadMilestone(milestone)}
                          className="w-full bg-brand-600 text-white rounded-xl py-2 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-brand-700 transition-colors"
                        >
                          <UploadCloud className="size-3.5" /> Upload Proof
                        </button>
                      )}
                      
                      {role === "sender" && mProofs.some(p => p.status === 'pending_review') ? (
                        <Link 
                          href={`/projects/${projectId}/milestones/${milestone.id}`} 
                          className="w-full bg-ink-900 text-white rounded-xl py-2 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-ink-800 transition-colors"
                        >
                          Review Submissions <ChevronRight className="size-3.5" />
                        </Link>
                      ) : (
                        <Link href={`/projects/${projectId}/milestones/${milestone.id}`} className="block text-center text-xs font-bold text-ink-600 hover:text-brand-600 transition-colors">
                          View Details &rarr;
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {activeTab === "documents" && (
        <ProjectDocuments projectId={projectId} />
      )}

      {activeTab === "messages" && canAccessChat && (
        <ProjectChat projectId={projectId} />
      )}

      {/* Modals */}
      <AnimatePresence>
        {uploadMilestone && (
          <UploadProofModal
            projectId={projectId}
            milestoneId={uploadMilestone.id}
            milestoneStage={uploadMilestone.stage}
            onClose={() => setUploadMilestone(null)}
            onSuccess={() => {
              mutateProofs();
              mutateMilestones();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
