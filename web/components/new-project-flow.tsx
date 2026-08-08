"use client";

import { useMemo, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Lock,
  MapPin,
  Star,
  Wallet,
  Home,
  Store,
  Stethoscope,
  Droplets,
  GraduationCap,
  Map,
  Users2,
  Building2,
  CalendarDays,
  X,
  Search,
  Trash2,
  Plus,
  GripVertical,
  Pencil
} from "lucide-react";
import {
  ASSET_TYPE_LABEL,
  formatCurrency,
  type AssetType,
  type Milestone,
  type Project,
  type Agent,
} from "@/lib/models";
import useSWR from "swr";
import { suggestPlan, type PlannedMilestone } from "@/lib/project-plans";
import { newDraftId } from "@/lib/draft-projects";
import Avatar from "@/components/avatar";
import VerifiedBadge from "@/components/verified-badge";
import { useNotifications } from "@/lib/notification-context";
import { useAuth } from "@/lib/auth-context";
import { ProjectStorage } from "@/lib/projects";
import DynamicMapPicker from "@/components/dynamic-map-picker";
import { apiClient } from "@/lib/api-client";
import { toast } from "react-toastify";

const ASSET_TYPES = Object.keys(ASSET_TYPE_LABEL) as AssetType[];

const ASSET_ICONS: Record<AssetType, any> = {
  house: Home,
  shop: Store,
  clinic: Stethoscope,
  borehole: Droplets,
  school: GraduationCap,
  land: Map,
  community: Users2,
};

const ASSET_DESCS: Record<AssetType, string> = {
  house: "Single family or multi-family homes",
  shop: "Retail spaces and commercial units",
  clinic: "Healthcare facilities and pharmacies",
  borehole: "Water access and well drilling",
  school: "Educational facilities and classrooms",
  land: "Plot acquisition and fencing",
  community: "Parks, halls, and shared infrastructure",
};

const STEPS = [
  "Asset",
  "Scope & budget",
  "Agent",
  "Milestones",
  "Review",
] as const;

const MIN_BUDGET = 100_000;

export default function NewProjectFlow() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);

  const [assetType, setAssetType] = useState<AssetType | null>(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState<{lat: number, lng: number, label: string} | null>(null);
  const [scope, setScope] = useState("");
  const [budgetInput, setBudgetInput] = useState("");
  const [assignmentMode, setAssignmentMode] = useState<"direct" | "marketplace">("direct");
  const [agentId, setAgentId] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlannedMilestone[]>([]);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [agentSearch, setAgentSearch] = useState("");
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  const { data: agentsRes } = useSWR('/agents', (url) => apiClient<{data: Agent[], meta: any}>(url));
  const agents = agentsRes?.data || [];

  const budget = Number(budgetInput.replace(/[^0-9]/g, "")) || 0;
  const agent = assignmentMode === "direct" ? (agents.find((a) => a.id === agentId) ?? null) : null;

  const allocated = useMemo(
    () => plan.reduce((sum, m) => sum + m.escrowAmount, 0),
    [plan]
  );
  const unallocated = budget - allocated;

  const matchingAgents = useMemo(() => {
    const searchLower = agentSearch.toLowerCase();
    
    let results = agents;
    
    // If no search query, only show agents matching the current asset type
    if (!searchLower && assetType) {
      results = agents.filter((a) => a.specialties.includes(assetType));
    } else if (searchLower) {
      // If searching, filter all agents by name or location
      results = agents.filter(a => a.name.toLowerCase().includes(searchLower) || a.location.toLowerCase().includes(searchLower));
    }
    
    return results.sort((a, b) => {
      // Always sort by specialty match first, then rating
      const aMatches = assetType && a.specialties.includes(assetType) ? 1 : 0;
      const bMatches = assetType && b.specialties.includes(assetType) ? 1 : 0;
      if (aMatches !== bMatches) return bMatches - aMatches;
      return b.rating - a.rating;
    });
  }, [assetType, agentSearch]);

  const canAdvance =
    (step === 0 && assetType !== null && name.trim() !== "" && location !== null) ||
    (step === 1 && scope.trim() !== "" && budget >= MIN_BUDGET) ||
    (step === 2 && (assignmentMode === "marketplace" || agentId !== null)) ||
    (step === 3 && unallocated === 0 && plan.every((m) => m.escrowAmount > 0)) ||
    step === 4;

  async function goNext() {
    if (step === 2 && assetType && plan.length === 0) {
      setIsGeneratingPlan(true);
      try {
        const suggested = await suggestPlan(assetType, budget, {
          name,
          scope,
          location,
          assignmentMode,
        });
        setPlan(suggested);
      } catch (err) {
        toast.error("Couldn't generate a plan — try again.");
        setIsGeneratingPlan(false);
        return; // don't advance if it failed
      }
      setIsGeneratingPlan(false);
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function updateMilestoneAmount(index: number, raw: string) {
    const amount = Number(raw.replace(/[^0-9]/g, "")) || 0;
    setPlan((prev) =>
      prev.map((m, i) => (i === index ? { ...m, escrowAmount: amount } : m))
    );
  }

  function updateMilestoneStage(index: number, stage: string) {
    setPlan((prev) => prev.map((m, i) => (i === index ? { ...m, stage } : m)));
  }

  function updateMilestoneDueDate(index: number, dateStr: string) {
    setPlan((prev) => prev.map((m, i) => (i === index ? { ...m, dueDate: dateStr } : m)));
  }

  function deleteMilestone(index: number) {
    setPlan((prev) => prev.filter((_, i) => i !== index));
  }

  function addMilestone() {
    const lastDate = plan.length > 0 ? plan[plan.length - 1].dueDate : new Date().toISOString().split("T")[0];
    const nextDate = new Date(lastDate);
    nextDate.setMonth(nextDate.getMonth() + 1);
    setPlan((prev) => [
      ...prev,
      {
        stage: `Stage ${prev.length + 1}`,
        escrowAmount: 0,
        dueDate: nextDate.toISOString().split("T")[0],
      },
    ]);
  }

  async function resetPlan() {
    if (!assetType) return;
    setIsGeneratingPlan(true);
    try {
      const suggested = await suggestPlan(assetType, budget, {
        name,
        scope,
        location,
        assignmentMode,
      });
      setPlan(suggested);
    } catch (err) {
      toast.error("Couldn't generate a plan — try again.");
    } finally {
      setIsGeneratingPlan(false);
    }
  }

  const { addNotification } = useNotifications();

  async function handleFund() {
    if (!assetType || !location) return;
    if (assignmentMode === "direct" && !agent) return;

    try {
      const payload: any = {
        name: name.trim(),
        assetType,
        location: {
          label: location.label,
          lat: location.lat,
          lng: location.lng,
        },
        currency: "NGN",
        totalBudget: budget,
        supervisionFeePercentage: 10,
        isPublic: assignmentMode === "marketplace",
        scope: scope.trim(),
        milestones: plan.map((m, index) => ({
          order: index + 1,
          stage: m.stage,
          escrowAmount: m.escrowAmount,
          dueDate: m.dueDate,
        })),
      };

      if (assignmentMode === "direct" && agent) {
        const resolvedAgentId = agent.id || (agent as any).userId || (agent as any).user_id || (agent as any).agentId;
        payload.agentId = resolvedAgentId;
        payload.agentName = agent.name;
        payload.agent = {
          id: resolvedAgentId,
          name: agent.name,
          initials: agent.initials || "AG",
          verified: agent.verified ?? true,
        };
        payload.supervisionFeePercentage = 10;
        payload.isPublic = false; 
      }

      const response = await apiClient<{ id: string }>("/projects", {
        method: "POST",
        body: payload
      });

      const projectId = response?.id || `prj_${Date.now()}`;
      const resolvedAgentId = (assignmentMode === "direct" && agent)
        ? (agent.id || (agent as any).userId || (agent as any).user_id || (agent as any).agentId)
        : undefined;

      const newProjectObj: Project = {
        id: projectId,
        name: name.trim(),
        assetType: assetType!,
        location: location!,
        currency: "NGN",
        totalBudget: budget,
        fundsInEscrow: budget,
        fundsReleased: 0,
        supervisionFeePercentage: 10,
        supervisionFeeTotal: Math.round(budget * 0.1),
        currentStage: plan[0]?.stage || "Phase 1 Mobilization",
        status: assignmentMode === "marketplace" ? "agent_unassigned" : "on_track",
        milestoneCount: plan.length,
        milestonesReleased: 0,
        startedOn: new Date().toISOString().slice(0, 10),
        scope: scope.trim(),
        isOpenForBids: assignmentMode === "marketplace",
        agentId: resolvedAgentId,
        agentName: (assignmentMode === "direct" && agent) ? agent.name : undefined,
        agent: (assignmentMode === "direct" && agent) ? {
          id: resolvedAgentId || "",
          name: agent.name,
          initials: agent.initials || "AG",
          verified: agent.verified ?? true,
        } : undefined,
      };

      ProjectStorage.saveCreatedProject(newProjectObj);

      if (assignmentMode === "marketplace") {
        addNotification({
          title: "Project Published to Marketplace",
          desc: `"${name}" is now live on the open marketplace for verified agents to submit bids.`,
          type: "success",
          targetRole: "sender",
        });
      } else {
        addNotification({
          title: "New Project Started",
          desc: `Your project "${name}" is now live with ${agent?.name}.`,
          type: "success",
          targetRole: "sender",
        });
        addNotification({
          title: "New Project Assigned 🏗️",
          desc: `You have been assigned as supervising agent for "${name}" by ${user?.fullName || "a diaspora sender"}.`,
          type: "info",
          targetRole: "agent",
        });
      }

      setCreatedId(projectId);
    } catch (err: any) {
      toast.error(err.message || "Failed to create project");
    }
  }

  if (createdId) {
    return (
      <Success
        projectId={createdId}
        name={name.trim()}
        budget={budget}
        firstStage={plan[0]?.stage ?? ""}
        stageCount={plan.length}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#ebeff3] py-10 sm:py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        
        {/* Header */}
        <div className="mb-10 text-center">
          <p className="text-sm font-bold text-brand-700 uppercase tracking-wider mb-2">Start a project</p>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-ink-900 text-balance">
            Set the scope. Fund the stages. <br/>Release nothing until it's proven.
          </h1>
        </div>

        {/* Layout Grid */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Wizard Area */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Step indicator */}
            <div className="rounded-xl bg-white p-6 shadow-soft border border-ink-100 mb-2">
              <ol className="flex flex-wrap items-center justify-between gap-2">
                {STEPS.map((label, index) => (
                  <li key={label} className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
                    <span
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                        index < step
                          ? "bg-brand-600 text-white shadow-md shadow-brand-500/20"
                          : index === step
                            ? "bg-brand-50 text-brand-700 ring-2 ring-brand-600"
                            : "bg-ink-50 text-ink-400"
                      }`}
                    >
                      {index < step ? <Check className="size-4" strokeWidth={3} /> : index + 1}
                    </span>
                    <span
                      className={`text-xs sm:text-sm font-bold ${
                        index === step ? "text-ink-900" : "text-ink-400"
                      }`}
                    >
                      {label}
                    </span>
                    {index < STEPS.length - 1 && (
                      <span className="hidden lg:block h-px w-8 bg-ink-200 mx-2" aria-hidden />
                    )}
                  </li>
                ))}
              </ol>
            </div>

            {/* Wizard Content */}
            <div className="rounded-xl bg-white p-8 shadow-soft border border-ink-100 min-h-[500px] flex flex-col relative overflow-hidden">
              
              {step === 0 && (
                <div className="flex-1 animate-in fade-in slide-in-from-right-4 duration-500">
                  <h2 className="text-2xl font-black text-ink-900">What are you building?</h2>
                  <p className="mt-2 text-sm font-medium text-ink-500 mb-8">
                    Select the type of asset you want to fund. Bankole covers what a single sender can fund end to end.
                  </p>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                    {ASSET_TYPES.map((type) => {
                      const Icon = ASSET_ICONS[type];
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setAssetType(type)}
                          className={`rounded-2xl p-4 text-left transition-all border-2 ${
                            assetType === type
                              ? "bg-brand-50 border-brand-600 shadow-sm"
                              : "bg-white border-ink-100 hover:border-brand-300 hover:bg-brand-50/30"
                          }`}
                        >
                          <div className={`size-10 rounded-xl flex items-center justify-center mb-3 ${assetType === type ? "bg-brand-600 text-white" : "bg-ink-50 text-ink-600"}`}>
                            <Icon className="size-5" />
                          </div>
                          <p className={`font-bold text-sm ${assetType === type ? "text-brand-900" : "text-ink-900"}`}>{ASSET_TYPE_LABEL[type]}</p>
                          <p className="text-xs text-ink-500 mt-1 leading-relaxed">{ASSET_DESCS[type]}</p>
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-6 pt-6 border-t border-ink-100">
                    <Field label="Project Name">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Adeyemi Family Home"
                        className="w-full rounded-xl bg-ink-50 px-4 py-3 text-sm font-medium outline-none placeholder:text-ink-400 focus:ring-2 focus:ring-brand-600 border border-transparent focus:border-transparent transition-all"
                      />
                    </Field>
                    <Field label="Location">
                      <DynamicMapPicker onLocationSelect={setLocation} defaultLocation={location || undefined} />
                      {location && (
                        <div className="mt-3 p-3 bg-brand-50 border border-brand-100 rounded-lg flex items-center gap-2 text-sm text-brand-900 font-medium">
                          <MapPin className="size-4 text-brand-600 shrink-0" />
                          <span className="truncate">{location.label}</span>
                        </div>
                      )}
                    </Field>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="flex-1 animate-in fade-in slide-in-from-right-4 duration-500">
                  <h2 className="text-2xl font-black text-ink-900">Scope and budget</h2>
                  <p className="mt-2 text-sm font-medium text-ink-500 mb-8">
                    This is what your agent is held to. Be specific; it's the record both sides work from.
                  </p>

                  <div className="space-y-6">
                    <Field label="Detailed Scope of Work">
                      <textarea
                        value={scope}
                        onChange={(e) => setScope(e.target.value)}
                        rows={5}
                        placeholder="Describe exactly what needs to be built. e.g. 4-bedroom detached house on a 600sqm plot, from foundation through to roofing and interior finishing."
                        className="w-full resize-none rounded-xl bg-ink-50 px-4 py-3 text-sm font-medium outline-none placeholder:text-ink-400 focus:ring-2 focus:ring-brand-600 border border-transparent focus:border-transparent transition-all"
                      />
                    </Field>
                    <div className="bg-brand-50 p-6 rounded-2xl border border-brand-100">
                      <Field label="Total Budget (NGN ₦)">
                        <div className="relative mt-2">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-ink-400">₦</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={budgetInput}
                            onChange={(e) => setBudgetInput(e.target.value)}
                            placeholder="18,000,000"
                            className="w-full rounded-xl bg-white pl-10 pr-4 py-4 text-lg font-black text-ink-900 outline-none placeholder:text-ink-300 focus:ring-2 focus:ring-brand-600 shadow-sm transition-all"
                          />
                        </div>
                        <p className="mt-3 text-xs font-bold text-ink-500 flex items-center gap-2">
                          <Lock className="size-4 text-brand-600" />
                          {budget > 0
                            ? budget < MIN_BUDGET
                              ? `Minimum ${formatCurrency(MIN_BUDGET)} to split across stages`
                              : `${formatCurrency(budget)} held securely in escrow`
                            : "Funds are held by the platform, never by the agent directly"}
                        </p>
                      </Field>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="flex-1 animate-in fade-in slide-in-from-right-4 duration-500">
                  <h2 className="text-2xl font-black text-ink-900">Choose Supervisor Assignment</h2>
                  <p className="mt-2 text-sm font-medium text-ink-500 mb-6">
                    You can directly select a vetted agent or post this project to our public board and let local agents bid.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <button
                      type="button"
                      onClick={() => setAssignmentMode("direct")}
                      className={`p-5 rounded-2xl border-2 text-left transition-all ${
                        assignmentMode === "direct"
                          ? "border-brand-600 bg-brand-50/50 shadow-sm"
                          : "border-ink-100 bg-white hover:border-ink-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Users2 className={`size-6 ${assignmentMode === "direct" ? "text-brand-600" : "text-ink-400"}`} />
                        <div className={`size-5 rounded-full border-2 flex items-center justify-center ${
                          assignmentMode === "direct" ? "border-brand-600 bg-brand-600 text-white" : "border-ink-300"
                        }`}>
                          {assignmentMode === "direct" && <Check className="size-3" />}
                        </div>
                      </div>
                      <h3 className="font-bold text-ink-900 text-base">Direct Agent Selection</h3>
                      <p className="text-xs text-ink-500 mt-1 leading-relaxed">
                        Handpick a specific verified agent from our directory to supervise the build immediately.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAssignmentMode("marketplace");
                        setAgentId(null);
                      }}
                      className={`p-5 rounded-2xl border-2 text-left transition-all ${
                        assignmentMode === "marketplace"
                          ? "border-brand-600 bg-brand-50/50 shadow-sm"
                          : "border-ink-100 bg-white hover:border-ink-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Building2 className={`size-6 ${assignmentMode === "marketplace" ? "text-brand-600" : "text-ink-400"}`} />
                        <div className={`size-5 rounded-full border-2 flex items-center justify-center ${
                          assignmentMode === "marketplace" ? "border-brand-600 bg-brand-600 text-white" : "border-ink-300"
                        }`}>
                          {assignmentMode === "marketplace" && <Check className="size-3" />}
                        </div>
                      </div>
                      <h3 className="font-bold text-ink-900 text-base">Post to Marketplace</h3>
                      <p className="text-xs text-ink-500 mt-1 leading-relaxed">
                        Publish project to verified local agents. Compare their fee bids, experience, and timelines.
                      </p>
                    </button>
                  </div>

                  {assignmentMode === "direct" ? (
                    <div className="bg-ink-50 rounded-xl border border-ink-100 p-8 text-center">
                      {agent ? (
                        <div className="bg-white rounded-2xl p-6 border-2 border-brand-600 shadow-md text-left mb-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <Avatar initials={agent.initials} hue={agent.avatarHue} size="lg" />
                              <div>
                                <h3 className="font-bold text-ink-900 flex items-center gap-2 text-lg">
                                  {agent.name} <VerifiedBadge size="sm" />
                                </h3>
                                <p className="text-sm text-ink-500 flex items-center gap-1 mt-1">
                                  <MapPin className="size-3.5" /> {agent.location}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-2xl">
                              <Star className="size-4 text-amber-500" fill="currentColor" strokeWidth={0} />
                              <span className="text-sm font-bold text-amber-700">{agent.rating.toFixed(1)}</span>
                            </div>
                          </div>
                          <p className="text-sm text-ink-600 line-clamp-2 bg-ink-50 p-4 rounded-xl">{agent.bio}</p>
                        </div>
                      ) : (
                        <div className="mb-6">
                          <Users2 className="size-16 text-ink-300 mx-auto mb-4" />
                          <h3 className="text-lg font-bold text-ink-900">No agent selected yet</h3>
                          <p className="text-sm text-ink-500 max-w-sm mx-auto mt-2">
                            Browse our directory to find the perfect verified agent for your {ASSET_TYPE_LABEL[assetType!]?.toLowerCase()}.
                          </p>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setIsAgentModalOpen(true)}
                        className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3.5 text-sm font-bold text-white shadow-soft hover:bg-brand-700 hover:-translate-y-0.5 transition-all"
                      >
                        <Search className="size-4" />
                        {agent ? "Change Agent" : "Browse Agent Directory"}
                      </button>
                    </div>
                  ) : (
                    <div className="bg-brand-50/50 rounded-2xl border border-brand-200 p-8 text-center">
                      <div className="size-14 rounded-full bg-brand-100 flex items-center justify-center mx-auto mb-4 text-brand-700">
                        <Building2 className="size-7" />
                      </div>
                      <h3 className="text-lg font-bold text-brand-950">Marketplace Bidding Enabled</h3>
                      <p className="text-sm text-brand-800 max-w-md mx-auto mt-2 leading-relaxed">
                        Once created, this project will appear on the Open Opportunities board. Qualified local agents in <span className="font-bold">{location?.label || "your area"}</span> will review your scope and submit proposals.
                      </p>
                      <div className="mt-6 inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-brand-200 text-xs font-bold text-brand-700">
                        <Check className="size-4 text-brand-600" /> You review proposals and choose when you're ready
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="flex-1 animate-in fade-in slide-in-from-right-4 duration-500">
                  <h2 className="text-2xl font-black text-ink-900">Milestone Plan</h2>
                  <p className="mt-2 text-sm font-medium text-ink-500 mb-8">
                    Customise your milestone stages, due dates, and escrow amounts. The total must exactly match your budget.
                  </p>

                  <div className="space-y-3">
                    {plan.map((m, index) => (
                      <div
                        key={index}
                        className="rounded-2xl bg-ink-50 border border-ink-100 overflow-hidden"
                      >
                        {/* Top row: order badge, name input, delete button */}
                        <div className="flex items-center gap-3 p-3 pb-2">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-black text-ink-400 shadow-sm border border-ink-100">
                            {index + 1}
                          </div>
                          <input
                            type="text"
                            value={m.stage}
                            onChange={(e) => updateMilestoneStage(index, e.target.value)}
                            placeholder="Stage name…"
                            className="flex-1 rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm font-bold text-ink-900 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => deleteMilestone(index)}
                            disabled={plan.length <= 1}
                            className="size-8 flex items-center justify-center rounded-lg text-ink-400 hover:bg-rose-50 hover:text-rose-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Delete milestone"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>

                        {/* Bottom row: date picker + amount input */}
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 px-3 pb-3 pt-1">
                          <div className="flex items-center gap-2 flex-1 min-w-0 rounded-xl border border-ink-200 bg-white px-3 py-2">
                            <CalendarDays className="size-3.5 text-ink-400 shrink-0" />
                            <input
                              type="date"
                              value={m.dueDate}
                              onChange={(e) => updateMilestoneDueDate(index, e.target.value)}
                              className="flex-1 text-xs font-medium text-ink-700 bg-transparent outline-none min-w-0"
                            />
                          </div>
                          <div className="relative w-full sm:w-44">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-ink-400 text-sm">₦</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={editingIndex === index ? String(m.escrowAmount) : m.escrowAmount.toLocaleString("en-NG")}
                              onFocus={() => setEditingIndex(index)}
                              onBlur={() => setEditingIndex(null)}
                              onChange={(e) => updateMilestoneAmount(index, e.target.value)}
                              className="w-full rounded-xl bg-white pl-8 pr-3 py-2 text-right text-sm font-bold tabular-nums outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-500 border border-ink-200 transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add milestone button */}
                  <button
                    type="button"
                    onClick={addMilestone}
                    className="mt-3 w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink-200 py-3 text-sm font-bold text-ink-500 hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50/50 transition-all"
                  >
                    <Plus className="size-4" />
                    Add milestone
                  </button>

                  {/* Budget balance footer */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-ink-100 p-5 bg-white">
                    <div>
                      <p className="text-sm font-bold text-ink-900">
                        {formatCurrency(allocated)} allocated
                      </p>
                      <p
                        className={`text-xs font-bold mt-1 ${
                          unallocated === 0 ? "text-emerald-600" : "text-amber-600"
                        }`}
                      >
                        {unallocated === 0
                          ? "✓ Matches total budget perfectly"
                          : `${formatCurrency(Math.abs(unallocated))} ${
                              unallocated > 0 ? "remaining to allocate" : "over budget"
                            }`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={resetPlan}
                      disabled={isGeneratingPlan}
                      className="rounded-xl border border-ink-200 px-4 py-2 text-xs font-bold text-ink-600 hover:bg-ink-50 transition-colors disabled:opacity-50"
                    >
                      {isGeneratingPlan ? "Generating…" : "Reset to defaults"}
                    </button>
                  </div>
                </div>
              )}

              {step === 4 && assetType && (
                <div className="flex-1 animate-in fade-in slide-in-from-right-4 duration-500">
                  <h2 className="text-2xl font-black text-ink-900 mb-8">Review and Post</h2>
                  
                  <div className="rounded-2xl border border-brand-100 bg-brand-50 p-6 flex items-start gap-4 mb-8">
                    <div className="size-10 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                      <Lock className="size-5 text-brand-700" />
                    </div>
                    <div>
                      <h3 className="font-bold text-brand-900">Escrow Protection Guarantee</h3>
                      <p className="text-sm text-brand-800 mt-1 leading-relaxed">
                        Funds are held in secure escrow. Milestones release only after you inspect and approve verified, geo-tagged proof of work.
                      </p>
                    </div>
                  </div>

                  <div className="bg-ink-50 rounded-2xl p-6 border border-ink-100">
                    <h3 className="font-bold text-ink-900 mb-4">Final Project Summary</h3>
                    <dl className="space-y-3 text-sm">
                      <div className="flex justify-between py-2 border-b border-ink-100">
                        <dt className="text-ink-500 font-medium">Assignment Type</dt>
                        <dd className="font-bold text-ink-900">
                          {assignmentMode === "marketplace" ? "Public Marketplace (Agent Bidding)" : "Direct Agent Selection"}
                        </dd>
                      </div>
                      {agent && (
                        <div className="flex justify-between py-2 border-b border-ink-100">
                          <dt className="text-ink-500 font-medium">Assigned Agent</dt>
                          <dd className="font-bold text-ink-900 flex items-center gap-1">{agent.name} <VerifiedBadge size="sm"/></dd>
                        </div>
                      )}
                      <div className="flex justify-between py-2 border-b border-ink-100">
                        <dt className="text-ink-500 font-medium">Asset Type</dt>
                        <dd className="font-bold text-ink-900">{ASSET_TYPE_LABEL[assetType]}</dd>
                      </div>
                      <div className="flex justify-between py-2 border-b border-ink-100">
                        <dt className="text-ink-500 font-medium">Milestones</dt>
                        <dd className="font-bold text-ink-900">{plan.length} Stages</dd>
                      </div>
                      <div className="flex justify-between py-4">
                        <dt className="text-ink-500 font-bold">Total Budget</dt>
                        <dd className="text-lg font-black text-brand-700">{formatCurrency(budget)}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              )}

              {/* Navigation Controls */}
              <div className="mt-10 pt-6 border-t border-ink-100 flex items-center justify-between gap-3 mt-auto">
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.max(s - 1, 0))}
                  disabled={step === 0}
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-ink-600 hover:bg-ink-100 disabled:opacity-0 transition-colors"
                >
                  <ArrowLeft className="size-4" /> Back
                </button>

                {step < STEPS.length - 1 ? (
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={!canAdvance || isGeneratingPlan}
                    className="inline-flex items-center gap-2 rounded-xl bg-ink-900 px-8 py-3 text-sm font-bold text-white shadow-md hover:bg-ink-800 hover:-translate-y-0.5 disabled:bg-ink-200 disabled:text-ink-400 disabled:shadow-none disabled:transform-none transition-all"
                  >
                    {step === 2 && isGeneratingPlan ? "Planning stages…" : "Continue"} <ArrowRight className="size-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFund}
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-8 py-3 text-sm font-bold text-white shadow-md hover:bg-brand-700 hover:-translate-y-0.5 transition-all"
                  >
                    <Wallet className="size-4" /> {assignmentMode === "marketplace" ? "Publish to Marketplace" : "Fund Escrow & Start"}
                  </button>
                )}
              </div>

            </div>
          </div>

          {/* Dynamic Summary Panel (Right Column) */}
          <div className="lg:col-span-4 hidden lg:block">
            <div className="rounded-xl bg-white p-6 shadow-soft border border-ink-100 sticky top-24">
              <h3 className="font-black text-ink-900 mb-6 flex items-center gap-2">
                <Building2 className="size-5 text-brand-600" />
                Project Summary
              </h3>

              <div className="space-y-6">
                <div>
                  <p className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-1">Project Details</p>
                  <p className="font-bold text-ink-900">{name || "Unnamed Project"}</p>
                  <p className="text-sm text-ink-500 mt-0.5">{assetType ? ASSET_TYPE_LABEL[assetType] : "No asset selected"}</p>
                  <p className="text-sm text-ink-500 mt-0.5">{typeof location === 'string' ? location : (location?.label || "No location set")}</p>
                </div>

                <div className="h-px w-full bg-ink-100" />

                <div>
                  <p className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-1">Budget</p>
                  <p className="text-2xl font-black text-ink-900">{budget > 0 ? formatCurrency(budget) : "₦0.00"}</p>
                </div>

                <div className="h-px w-full bg-ink-100" />

                <div>
                  <p className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-2">Supervisor Assignment</p>
                  {assignmentMode === "marketplace" ? (
                    <div className="bg-brand-50 p-3.5 rounded-xl border border-brand-100">
                      <p className="text-sm font-bold text-brand-900 flex items-center gap-1.5">
                        <Building2 className="size-4 text-brand-600" /> Open Marketplace
                      </p>
                      <p className="text-xs text-brand-700 mt-1">Local agents will submit proposals & bids.</p>
                    </div>
                  ) : agent ? (
                    <div className="flex items-center gap-3 bg-ink-50 p-3 rounded-xl">
                      <Avatar initials={agent.initials} hue={agent.avatarHue} size="sm" />
                      <div>
                        <p className="text-sm font-bold text-ink-900">{agent.name}</p>
                        <p className="text-xs font-medium text-ink-500 flex items-center gap-1">
                          <Star className="size-3 text-amber-500" fill="currentColor" strokeWidth={0} /> {agent.rating.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-ink-500 italic">No agent selected yet.</p>
                  )}
                </div>

                {plan.length > 0 && (
                  <>
                    <div className="h-px w-full bg-ink-100" />
                    <div>
                      <p className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-2">Milestones</p>
                      <p className="text-sm font-bold text-ink-900">{plan.length} Stages Planned</p>
                    </div>
                  </>
                )}

              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Agent Selection Modal */}
      {isAgentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 pt-10 sm:pt-14 md:pt-16 overflow-y-auto bg-ink-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-ink-100 flex items-center justify-between bg-white">
              <div>
                <h3 className="text-xl font-bold text-ink-900">Select an Agent</h3>
                <p className="text-sm text-ink-500 mt-1">Browse verified agents for your {assetType ? ASSET_TYPE_LABEL[assetType] : "project"}</p>
              </div>
              <button 
                onClick={() => setIsAgentModalOpen(false)}
                className="size-10 rounded-full flex items-center justify-center text-ink-400 hover:text-ink-900 hover:bg-ink-50 transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>
            
            <div className="p-6 border-b border-ink-100 bg-ink-50/50">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-ink-400" />
                <input
                  type="text"
                  placeholder="Search by name or location..."
                  value={agentSearch}
                  onChange={(e) => setAgentSearch(e.target.value)}
                  className="w-full rounded-xl bg-white pl-12 pr-4 py-4 text-sm font-medium outline-none placeholder:text-ink-400 focus:ring-2 focus:ring-brand-600 border border-ink-200 shadow-sm transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white">
              {matchingAgents.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-ink-500 font-medium">No agents found matching your search.</p>
                </div>
              ) : (
                matchingAgents.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      setAgentId(a.id);
                      setIsAgentModalOpen(false);
                    }}
                    className={`w-full text-left p-5 rounded-xl border-2 transition-all flex flex-col sm:flex-row sm:items-center gap-4 ${
                      agentId === a.id ? "border-brand-600 bg-brand-50" : "border-ink-100 bg-white hover:border-brand-300 hover:shadow-md"
                    }`}
                  >
                    <Avatar initials={a.initials} hue={a.avatarHue} size="lg" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-ink-900 text-lg truncate">{a.name}</h4>
                        <VerifiedBadge size="sm" />
                      </div>
                      <p className="text-sm text-ink-500 flex items-center gap-1">
                        <MapPin className="size-3.5" /> {a.location}
                      </p>
                      <p className="text-sm text-ink-600 mt-2 line-clamp-1">{a.bio}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg w-max">
                          <Star className="size-3.5 text-amber-500" fill="currentColor" strokeWidth={0} />
                          <span className="text-xs font-bold text-amber-700">{a.rating.toFixed(1)}</span>
                        </div>
                        <span className="text-xs font-medium text-ink-500">
                          {a.completedProjects} projects · {a.yearsExperience} yrs exp.
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 text-sm font-bold text-brand-600 bg-white px-4 py-2 rounded-lg border border-ink-200 shadow-sm mt-2 sm:mt-0">
                      Select
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-ink-900">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function Success({
  projectId,
  name,
  budget,
  firstStage,
  stageCount,
}: {
  projectId: string;
  name: string;
  budget: number;
  firstStage: string;
  stageCount: number;
}) {
  return (
    <div className="min-h-screen bg-[#ebeff3] py-16 sm:py-24 flex items-center justify-center">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 text-center">
        <span className="mx-auto flex size-20 items-center justify-center rounded-full bg-mint-100 text-mint-500 shadow-sm mb-8 animate-in zoom-in-50 duration-500">
          <Check className="size-10" strokeWidth={3} />
        </span>
        <h1 className="text-4xl font-black tracking-tight text-ink-900 text-balance animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          {formatCurrency(budget)} securely held.
        </h1>
        <p className="mt-4 text-ink-500 text-pretty text-lg max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <span className="font-bold text-ink-900">{name}</span> is live across {stageCount} milestones. Your verified agent has been
          notified and will start on <strong className="text-ink-800">{firstStage}</strong>.
        </p>

        <div className="mt-12 overflow-hidden rounded-xl bg-white shadow-soft text-left animate-in fade-in slide-in-from-bottom-8 duration-500 delay-300">
          <div className="relative aspect-[16/7]">
            <Image
              src="/images/modern-home.jpg"
              alt=""
              fill
              sizes="(min-width: 640px) 672px, 100vw"
              className="object-cover"
            />
          </div>
          <div className="p-8">
            <p className="text-sm font-black uppercase tracking-wider text-brand-700 mb-4">What happens next</p>
            <ol className="space-y-4 text-ink-600 font-medium">
              <li className="flex gap-3 items-start">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 text-xs font-bold mt-0.5">1</span>
                Your agent completes the first stage and submits geo-tagged media proof.
              </li>
              <li className="flex gap-3 items-start">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 text-xs font-bold mt-0.5">2</span>
                You review the proof in your project workspace.
              </li>
              <li className="flex gap-3 items-start">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 text-xs font-bold mt-0.5">3</span>
                Approve to release funds for that stage, or flag to keep funds securely held.
              </li>
            </ol>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 animate-in fade-in duration-500 delay-500">
          <Link
            href={`/projects/${projectId}`}
            className="inline-flex items-center gap-2 rounded-xl bg-ink-900 px-8 py-4 text-base font-bold text-white shadow-md hover:bg-ink-800 hover:-translate-y-0.5 transition-all"
          >
            Open Project Workspace
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-xl bg-white px-8 py-4 text-base font-bold text-ink-800 shadow-sm border border-ink-100 hover:bg-ink-50 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
