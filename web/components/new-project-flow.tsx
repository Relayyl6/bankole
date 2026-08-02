"use client";

import { useMemo, useState } from "react";
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
} from "lucide-react";
import {
  ASSET_TYPE_LABEL,
  agents,
  formatCurrency,
  type AssetType,
  type Milestone,
  type Project,
} from "@/lib/mock-data";
import { suggestPlan, type PlannedMilestone } from "@/lib/project-plans";
import { newDraftId, saveDraft } from "@/lib/draft-projects";
import Avatar from "@/components/avatar";
import VerifiedBadge from "@/components/verified-badge";

const ASSET_TYPES = Object.keys(ASSET_TYPE_LABEL) as AssetType[];

const STEPS = [
  "Asset",
  "Scope & budget",
  "Agent",
  "Milestones",
  "Review",
] as const;

/** Naira. Below this a milestone split stops being meaningful. */
const MIN_BUDGET = 100_000;

export default function NewProjectFlow() {
  const [step, setStep] = useState(0);

  const [assetType, setAssetType] = useState<AssetType | null>(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [scope, setScope] = useState("");
  const [budgetInput, setBudgetInput] = useState("");
  const [agentId, setAgentId] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlannedMilestone[]>([]);
  const [createdId, setCreatedId] = useState<string | null>(null);

  // Thousands separators make a seven-figure amount readable, but reformatting
  // on every keystroke moves the caret and scrambles what the sender typed.
  // Show raw digits in the field being edited, formatted everywhere else.
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const budget = Number(budgetInput.replace(/[^0-9]/g, "")) || 0;
  const agent = agents.find((a) => a.id === agentId) ?? null;

  const allocated = useMemo(
    () => plan.reduce((sum, m) => sum + m.escrowAmount, 0),
    [plan]
  );
  const unallocated = budget - allocated;

  // Agents who list this asset type, best rated first. The survey put verified
  // agent profiles first among features, so this step leads with credentials.
  const matchingAgents = useMemo(() => {
    if (!assetType) return [];
    const matches = agents.filter((a) => a.specialties.includes(assetType));
    return (matches.length > 0 ? matches : agents)
      .slice()
      .sort((a, b) => b.rating - a.rating);
  }, [assetType]);

  const canAdvance =
    (step === 0 && assetType !== null && name.trim() !== "" && location.trim() !== "") ||
    (step === 1 && scope.trim() !== "" && budget >= MIN_BUDGET) ||
    (step === 2 && agentId !== null) ||
    (step === 3 && unallocated === 0 && plan.every((m) => m.escrowAmount > 0)) ||
    step === 4;

  function goNext() {
    // Entering the milestone step, seed the plan from the chosen asset type
    // and budget, unless the sender has already edited one.
    if (step === 2 && assetType && plan.length === 0) {
      setPlan(suggestPlan(assetType, budget));
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function updateMilestoneAmount(index: number, raw: string) {
    const amount = Number(raw.replace(/[^0-9]/g, "")) || 0;
    setPlan((prev) =>
      prev.map((m, i) => (i === index ? { ...m, escrowAmount: amount } : m))
    );
  }

  function resetPlan() {
    if (assetType) setPlan(suggestPlan(assetType, budget));
  }

  function handleFund() {
    if (!assetType || !agent) return;

    const id = newDraftId();
    const project: Project = {
      id,
      name: name.trim(),
      assetType,
      location: location.trim(),
      agentId: agent.id,
      totalBudget: budget,
      fundsReleased: 0,
      fundsInEscrow: budget,
      currentStage: plan[0]?.stage ?? "Not started",
      status: "on_track",
      scope: scope.trim(),
      startedOn: new Date().toISOString().slice(0, 10),
    };

    const milestones: Milestone[] = plan.map((m, index) => ({
      id: `${id}-m${index + 1}`,
      projectId: id,
      order: index + 1,
      stage: m.stage,
      escrowAmount: m.escrowAmount,
      status: index === 0 ? "in_progress" : "pending",
      dueDate: m.dueDate,
    }));

    saveDraft({ project, milestones, createdAt: new Date().toISOString() });
    setCreatedId(id);
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
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-14">
      <p className="text-sm font-semibold text-brand-700">Start a project</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink-900 text-balance">
        Set the scope. Fund the stages. Release nothing until it&apos;s proven.
      </h1>

      {/* Step indicator */}
      <ol className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-2">
        {STEPS.map((label, index) => (
          <li key={label} className="flex items-center gap-2">
            <span
              className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                index < step
                  ? "bg-brand-600 text-white"
                  : index === step
                    ? "bg-brand-100 text-brand-700 ring-2 ring-brand-600"
                    : "bg-ink-100 text-ink-400"
              }`}
            >
              {index < step ? <Check className="size-3.5" strokeWidth={3} /> : index + 1}
            </span>
            <span
              className={`text-xs font-medium ${
                index === step ? "text-ink-900" : "text-ink-400"
              }`}
            >
              {label}
            </span>
            {index < STEPS.length - 1 && (
              <span className="hidden sm:block h-px w-4 bg-ink-200" aria-hidden />
            )}
          </li>
        ))}
      </ol>

      <div className="mt-8 rounded-2xl bg-white shadow-soft p-6 sm:p-8">
        {step === 0 && (
          <div>
            <h2 className="font-semibold text-ink-900">What are you building?</h2>
            <p className="mt-1 text-sm text-ink-500">
              Bankole covers what a single sender can fund end to end.
            </p>

            <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {ASSET_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setAssetType(type)}
                  className={`rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors ${
                    assetType === type
                      ? "bg-brand-600 text-white"
                      : "bg-ink-50 text-ink-700 hover:bg-ink-100"
                  }`}
                >
                  {ASSET_TYPE_LABEL[type]}
                </button>
              ))}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Project name">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Adeyemi Family Home"
                  className="w-full rounded-xl bg-ink-50 px-4 py-2.5 text-sm outline-none placeholder:text-ink-400 focus:ring-2 focus:ring-brand-600"
                />
              </Field>
              <Field label="Location">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ajah, Lagos"
                  className="w-full rounded-xl bg-ink-50 px-4 py-2.5 text-sm outline-none placeholder:text-ink-400 focus:ring-2 focus:ring-brand-600"
                />
              </Field>
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="font-semibold text-ink-900">Scope and budget</h2>
            <p className="mt-1 text-sm text-ink-500">
              This is what your agent is held to. Be specific; it&apos;s the
              record both sides work from.
            </p>

            <div className="mt-5 space-y-4">
              <Field label="Scope of work">
                <textarea
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  rows={4}
                  placeholder="4-bedroom detached house on a 600sqm plot, from foundation through to roofing and interior finishing."
                  className="w-full resize-y rounded-xl bg-ink-50 px-4 py-3 text-sm outline-none placeholder:text-ink-400 focus:ring-2 focus:ring-brand-600"
                />
              </Field>
              <Field label="Total budget (₦)">
                <input
                  type="text"
                  inputMode="numeric"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  placeholder="18000000"
                  className="w-full rounded-xl bg-ink-50 px-4 py-2.5 text-sm outline-none placeholder:text-ink-400 focus:ring-2 focus:ring-brand-600"
                />
                <p className="mt-1.5 text-xs text-ink-400">
                  {budget > 0
                    ? budget < MIN_BUDGET
                      ? `Minimum ${formatCurrency(MIN_BUDGET)} to split across stages`
                      : `${formatCurrency(budget)} held in escrow, released stage by stage`
                    : "Held by the platform, never by the agent"}
                </p>
              </Field>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="font-semibold text-ink-900">Choose a verified agent</h2>
            <p className="mt-1 text-sm text-ink-500">
              Every agent below is identity- and credential-checked, and rated by
              past diaspora clients.
            </p>

            <div className="mt-5 space-y-3">
              {matchingAgents.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAgentId(a.id)}
                  className={`w-full rounded-xl p-4 text-left transition-colors ${
                    agentId === a.id
                      ? "bg-brand-50 ring-2 ring-brand-600"
                      : "bg-ink-50 hover:bg-ink-100"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar initials={a.initials} hue={a.avatarHue} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-semibold text-ink-900">{a.name}</span>
                        <VerifiedBadge size="sm" />
                      </div>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-500">
                        <MapPin className="size-3" />
                        {a.location}
                      </p>
                      <p className="mt-2 text-xs text-ink-500 text-pretty">{a.bio}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-ink-900">
                        <Star
                          className="size-3.5 text-amber-500"
                          fill="currentColor"
                          strokeWidth={0}
                        />
                        {a.rating.toFixed(1)}
                      </span>
                      <p className="mt-0.5 text-xs text-ink-400">
                        {a.completedProjects} projects
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="font-semibold text-ink-900">Milestone plan</h2>
            <p className="mt-1 text-sm text-ink-500">
              A suggested split for this build. Adjust any stage; the total has
              to match your budget before funds can be held.
            </p>

            <div className="mt-5 space-y-3">
              {plan.map((m, index) => (
                <div
                  key={m.stage}
                  className="flex flex-wrap items-center gap-3 rounded-xl bg-ink-50 p-4"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-ink-500">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink-900">{m.stage}</p>
                    <p className="text-xs text-ink-400">
                      Target{" "}
                      {new Date(m.dueDate).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    aria-label={`Escrow amount for ${m.stage}`}
                    value={
                      editingIndex === index
                        ? String(m.escrowAmount)
                        : m.escrowAmount.toLocaleString("en-NG")
                    }
                    onFocus={() => setEditingIndex(index)}
                    onBlur={() => setEditingIndex(null)}
                    onChange={(e) => updateMilestoneAmount(index, e.target.value)}
                    className="w-36 rounded-lg bg-white px-3 py-2 text-right text-sm tabular-nums outline-none focus:ring-2 focus:ring-brand-600"
                  />
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-100 p-4">
              <div>
                <p className="text-sm font-medium text-ink-900">
                  {formatCurrency(allocated)} allocated
                </p>
                <p
                  className={`text-xs ${
                    unallocated === 0 ? "text-mint-500" : "text-amber-500"
                  }`}
                >
                  {unallocated === 0
                    ? "Matches your budget exactly"
                    : unallocated > 0
                      ? `${formatCurrency(unallocated)} still unallocated`
                      : `${formatCurrency(Math.abs(unallocated))} over budget`}
                </p>
              </div>
              <button
                type="button"
                onClick={resetPlan}
                className="text-xs font-semibold text-brand-700 hover:text-brand-800"
              >
                Reset to suggested split
              </button>
            </div>
          </div>
        )}

        {step === 4 && agent && assetType && (
          <div>
            <h2 className="font-semibold text-ink-900">Review and fund escrow</h2>
            <p className="mt-1 text-sm text-ink-500">
              Nothing reaches your agent on funding. Each stage releases only
              after you approve the proof for it.
            </p>

            <dl className="mt-5 divide-y divide-ink-100 rounded-xl border border-ink-100">
              <Row label="Project" value={name.trim()} />
              <Row label="Type" value={ASSET_TYPE_LABEL[assetType]} />
              <Row label="Location" value={location.trim()} />
              <Row label="Agent" value={`${agent.name} · verified`} />
              <Row label="Stages" value={`${plan.length} milestones`} />
              <Row
                label="Total held in escrow"
                value={formatCurrency(budget)}
                emphasis
              />
            </dl>

            <div className="mt-5 flex items-start gap-3 rounded-xl bg-brand-50 p-4">
              <Lock className="mt-0.5 size-4 shrink-0 text-brand-700" />
              <p className="text-xs text-brand-800 text-pretty">
                This is a prototype. No payment is taken and no funds move. In
                production, escrow is held by a licensed payment partner, not by
                Bankole and not by your agent.
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(s - 1, 0))}
            disabled={step === 0}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold text-ink-600 hover:bg-ink-50 disabled:invisible transition-colors"
          >
            <ArrowLeft className="size-4" />
            Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={goNext}
              disabled={!canAdvance}
              className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-soft hover:bg-brand-700 disabled:bg-ink-200 disabled:text-ink-400 disabled:shadow-none transition-colors"
            >
              Continue
              <ArrowRight className="size-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFund}
              className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-soft hover:bg-brand-700 transition-colors"
            >
              <Wallet className="size-4" />
              Fund escrow
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-ink-700">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function Row({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <dt className="text-sm text-ink-500">{label}</dt>
      <dd
        className={`text-right text-sm ${
          emphasis ? "font-semibold text-ink-900" : "text-ink-800"
        }`}
      >
        {value}
      </dd>
    </div>
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
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-16 sm:py-24 text-center">
      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-mint-100 text-mint-500">
        <Check className="size-7" strokeWidth={3} />
      </span>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-ink-900 text-balance">
        {formatCurrency(budget)} is held in escrow.
      </h1>
      <p className="mt-3 text-ink-500 text-pretty">
        {name} is live across {stageCount} milestones. Your agent has been
        notified and starts on <strong className="text-ink-800">{firstStage}</strong>.
        Nothing releases until you approve the proof for it.
      </p>

      <div className="mt-8 overflow-hidden rounded-2xl bg-white shadow-soft text-left">
        <div className="relative aspect-[16/7]">
          <Image
            src="/images/modern-home.jpg"
            alt=""
            fill
            sizes="(min-width: 640px) 672px, 100vw"
            className="object-cover"
          />
        </div>
        <div className="p-5">
          <p className="text-xs font-semibold text-brand-700">What happens next</p>
          <ol className="mt-3 space-y-2.5 text-sm text-ink-600">
            <li className="flex gap-2.5">
              <span className="text-ink-400">1.</span>
              Your agent works the first stage and submits geo-tagged proof.
            </li>
            <li className="flex gap-2.5">
              <span className="text-ink-400">2.</span>
              You review it in the workspace, on the same live view they see.
            </li>
            <li className="flex gap-2.5">
              <span className="text-ink-400">3.</span>
              Approve, and that stage&apos;s funds release. Flag it, and they stay
              held.
            </li>
          </ol>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href={`/projects/${projectId}`}
          className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft hover:bg-brand-700 transition-colors"
        >
          Open the workspace
          <ArrowRight className="size-4" />
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink-800 shadow-soft hover:bg-ink-50 transition-colors"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
