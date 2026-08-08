"use server";

// import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";
import Groq from "groq-sdk";
import { z } from "zod";
import { ASSET_TYPE_LABEL, type AssetType } from "@/lib/models";

export interface PlannedMilestone {
  stage: string;
  escrowAmount: number;
  dueDate: string;
}

/**
 * Extra context the caller may already have on hand (typically from the
 * create-asset form) that helps the model produce a more specific plan.
 * Every field is optional — suggestPlan degrades gracefully down to just
 * assetType + totalBudget.
 */
export interface PlanContext {
  name?: string;
  location?: { lat: number; lng: number; label: string } | null;
  scope?: string;
  assignmentMode?: "direct" | "marketplace";
}

/* ------------------------------------------------------------------ */
/* Static fallback plans.                                              */
/*                                                                      */
/* These are the original hand-written plans. They're no longer the    */
/* primary source of truth, but suggestPlan falls back to them if the   */
/* AI call fails, times out, or returns something we don't trust — so   */
/* the feature can never break or return an empty plan.                */
/* ------------------------------------------------------------------ */

interface PlanStage {
  stage: string;
  weight: number;
}

const FALLBACK_PLANS: Record<AssetType, PlanStage[]> = {
  house: [
    { stage: "Site Prep & Substructure (Foundation)", weight: 0.15 },
    { stage: "Superstructure & Blockwork to Eaves", weight: 0.20 },
    { stage: "Roofing & Weatherproofing", weight: 0.15 },
    { stage: "First Fix (Plumbing & Electrical)", weight: 0.15 },
    { stage: "Plastering & Floor Screeding", weight: 0.15 },
    { stage: "Second Fix, Finishes & Handover", weight: 0.20 },
  ],
  shop: [
    { stage: "Site Prep, Demolition & Foundation", weight: 0.15 },
    { stage: "Structural Framing & Roofing", weight: 0.25 },
    { stage: "MEP Rough-in (Mechanical, Electrical, Plumbing)", weight: 0.15 },
    { stage: "Shopfront Glazing & Security Systems", weight: 0.15 },
    { stage: "Interior Fit-out, Shelving & HVAC", weight: 0.20 },
    { stage: "Final Finishes, Branding & Handover", weight: 0.10 },
  ],
  clinic: [
    { stage: "Site Clear & Substructure", weight: 0.15 },
    { stage: "Structural Envelope & Roofing", weight: 0.20 },
    { stage: "Specialized MEP (Medical Gases, Plumbing, HVAC)", weight: 0.20 },
    { stage: "Partitioning, Insulation & Plastering", weight: 0.15 },
    { stage: "Medical Equipment Install & Sterilization Fit-out", weight: 0.20 },
    { stage: "Testing, Commissioning & Handover", weight: 0.10 },
  ],
  borehole: [
    { stage: "Geophysical Survey & Site Prep", weight: 0.15 },
    { stage: "Rig Mobilization & Pilot Drilling", weight: 0.35 },
    { stage: "Well Casing & Gravel Packing", weight: 0.20 },
    { stage: "Pump Installation & Power Setup (Solar/Grid)", weight: 0.15 },
    { stage: "Yield Testing, Water Treatment & Commissioning", weight: 0.15 },
  ],
  school: [
    { stage: "Site Clearing, Fencing & Foundation", weight: 0.15 },
    { stage: "Superstructure (Blockwork & Concrete columns)", weight: 0.20 },
    { stage: "Roofing, Truss Work & Ceilings", weight: 0.15 },
    { stage: "MEP First Fix & Plastering", weight: 0.15 },
    { stage: "Doors, Windows & Flooring Finishes", weight: 0.15 },
    { stage: "Classroom Furniture, Utilities & Handover", weight: 0.20 },
  ],
  land: [
    { stage: "Title Search, Verification & Survey Plan", weight: 0.20 },
    { stage: "Drafting Deed of Assignment & Initial Payment", weight: 0.40 },
    { stage: "Perimeter Fencing & Gate Installation", weight: 0.20 },
    { stage: "Registration & Government Consent Processing", weight: 0.15 },
    { stage: "Final Handover of Original Documents", weight: 0.05 },
  ],
  community: [
    { stage: "Community Consultation, Scoping & Design", weight: 0.10 },
    { stage: "Site Prep, Earthworks & Foundation", weight: 0.20 },
    { stage: "Main Structural Erection", weight: 0.25 },
    { stage: "Utilities Install (Water, Power, Drainage)", weight: 0.20 },
    { stage: "Finishing, Landscaping & Fencing", weight: 0.15 },
    { stage: "Public Commissioning & Handover", weight: 0.10 },
  ],
};

const FALLBACK_WEEKS_PER_STAGE = 6;

function buildFallbackPlan(
  assetType: AssetType,
  totalBudget: number
): PlannedMilestone[] {
  const stages = FALLBACK_PLANS[assetType];
  const start = new Date();
  let allocated = 0;

  return stages.map((s, index) => {
    const isLast = index === stages.length - 1;
    const escrowAmount = isLast
      ? totalBudget - allocated
      : Math.round(totalBudget * s.weight);
    allocated += escrowAmount;

    const due = new Date(start);
    due.setDate(due.getDate() + FALLBACK_WEEKS_PER_STAGE * 7 * (index + 1));

    return {
      stage: s.stage,
      escrowAmount,
      dueDate: due.toISOString().slice(0, 10),
    };
  });
}

/* ------------------------------------------------------------------ */
/* AI-generated plan.                                                  */
/* ------------------------------------------------------------------ */

// llama-3.3-70b-versatile is on Groq's free tier — no card required, generous
// rate limits. Swap to llama-3.1-8b-instant if you want faster/cheaper at
// the cost of plan quality.
const MODEL = "llama-3.3-70b-versatile";

const aiStageSchema = z.object({
  stage: z.string().min(3).max(80),
  weight: z.number().min(0).max(1),
  // Cumulative weeks from project start until this milestone is due.
  weeksFromStart: z.number().min(1).max(104),
});

const aiPlanSchema = z.object({
  stages: z.array(aiStageSchema).min(8).max(25),
});

type AiPlan = z.infer<typeof aiPlanSchema>;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });


function buildSystemPrompt(): string {
  return [
    "You design detailed, trade-by-trade milestone escrow release plans",
    "for a platform where senders fund physical construction/acquisition",
    "projects (houses, shops, clinics, boreholes, schools, land,",
    "community assets) and money is released in stages as work is",
    "verified, instead of being handed over all at once.",
    "",
    "Break the project down to the level of detail a real quantity",
    "surveyor or site engineer would use in a bill of quantities — NOT",
    "broad phases. Each stage must cover ONE identifiable trade or",
    "deliverable, not several combined with 'and'. For example, split",
    "'structural work and MEP installation' into separate stages for",
    "structural framing, electrical rough-in, plumbing rough-in, and",
    "HVAC/mechanical, each as its own milestone.",
    "",
    "For a physical build, always consider whether these apply and",
    "include them as distinct stages where relevant: architectural &",
    "structural drawings / permitting, land clearing & site survey,",
    "excavation & substructure, damp-proofing & foundation, superstructure",
    "(blockwork/columns), scaffolding, roofing structure, roof covering,",
    "windows & doors, electrical first fix, plumbing first fix,",
    "plastering & rendering, flooring/screeding, electrical second fix,",
    "plumbing second fix & fittings, painting & decoration, fixtures &",
    "fittings/equipment installation, external works & landscaping,",
    "final inspection/testing/commissioning, and handover. Adapt this",
    "list to the specific asset type (e.g. a borehole needs drilling,",
    "casing, pump installation, water testing — not house-building steps;",
    "land purchase needs title search, legal drafting, registration —",
    "no construction steps at all).",
    "",
    "Aim for 10-20 stages for most projects; fewer only for genuinely",
    "simple/small-scope ones like land purchase. Use the given budget and",
    "scope description to judge project size and adjust granularity.",
    "",
    "For each stage give: a short, concrete stage name naming ONE trade",
    "or deliverable; a weight (0-1) representing the share of the total",
    "budget released at that stage (weights across all stages must sum",
    "to ~1); and weeksFromStart, the cumulative number of weeks from",
    "project start until that milestone is expected to be complete and",
    "verifiable.",
    "",
    "Order stages chronologically. Front-load risk appropriately (e.g.",
    "land title/legal work, drilling, or foundation work often carries a",
    "larger share early on).",
    "",
    "Respond with ONLY a JSON object, no markdown formatting or commentary,",
    'shaped exactly like: {"stages":[{"stage":"string","weight":0.0,"weeksFromStart":0}]}.',
  ].join("\n");
}

function buildUserPrompt(
  assetType: AssetType,
  totalBudget: number,
  context?: PlanContext
): string {
  const lines = [
    `Asset type: ${ASSET_TYPE_LABEL[assetType]} (${assetType})`,
    `Total budget: ${totalBudget}`,
  ];
  if (context?.name) lines.push(`Project name: ${context.name}`);
  if (context?.scope) lines.push(`Scope / description: ${context.scope}`);
  if (context?.location?.label) {
    lines.push(`Location: ${context.location.label}`);
  }
  if (context?.assignmentMode) {
    lines.push(`Assignment mode: ${context.assignmentMode}`);
  }
  return lines.join("\n");
}

async function fetchAiPlan(
  assetType: AssetType,
  totalBudget: number,
  context?: PlanContext
): Promise<AiPlan | null> {
  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      response_format: { type: "json_object" },
      max_tokens: 4096,
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: buildUserPrompt(assetType, totalBudget, context) },
      ],
    });

    const text = completion.choices[0]?.message?.content;
    if (!text) return null;

    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch (err) {
      console.error("suggestPlan: AI returned invalid JSON", err);
      return null;
    }

    const parsed = aiPlanSchema.safeParse(raw);
    if (!parsed.success) {
      console.error("suggestPlan: AI response failed validation", parsed.error);
      return null;
    }

    return parsed.data;
  } catch (err) {
    console.error("suggestPlan: AI call failed, falling back", err);
    return null;
  }
}

/**
 * Turn an AI-proposed plan (weights + cumulative weeks) into concrete
 * escrow amounts and due dates against a real budget.
 *
 * Same rounding rule as the original static function: amounts are
 * integers and the last stage absorbs the remainder, so the plan always
 * sums to exactly totalBudget. Weights are also re-normalized defensively
 * in case the model's weights don't sum to exactly 1.
 */
function materializePlan(aiPlan: AiPlan, totalBudget: number): PlannedMilestone[] {
  const stages = [...aiPlan.stages].sort(
    (a, b) => a.weeksFromStart - b.weeksFromStart
  );

  const weightSum = stages.reduce((sum, s) => sum + s.weight, 0) || 1;
  const start = new Date();
  let allocated = 0;

  return stages.map((s, index) => {
    const isLast = index === stages.length - 1;
    const normalizedWeight = s.weight / weightSum;
    const escrowAmount = isLast
      ? totalBudget - allocated
      : Math.round(totalBudget * normalizedWeight);
    allocated += escrowAmount;

    const due = new Date(start);
    due.setDate(due.getDate() + Math.round(s.weeksFromStart) * 7);

    return {
      stage: s.stage,
      escrowAmount,
      dueDate: due.toISOString().slice(0, 10),
    };
  });
}

/**
 * Build a suggested milestone plan for a project, using AI to design
 * stages specific to the asset type, scope, location and assignment mode
 * — instead of picking from a fixed table.
 *
 * `context` is optional: pass whatever you already have from the
 * create-asset form (name, scope, location, assignmentMode) to get a more
 * tailored plan; suggestPlan still works with just assetType + totalBudget.
 *
 * Falls back to a static, hand-written plan per asset type if the AI call
 * fails or returns something invalid, so this function never throws and
 * never returns an empty plan. Return shape is unchanged from before:
 * { stage, escrowAmount, dueDate }[].
 *
 * Note: this is now async (it was sync before) since it calls out to the
 * model — await it, or call it from a server action / effect.
 */
export async function suggestPlan(
  assetType: AssetType,
  totalBudget: number,
  context?: PlanContext
): Promise<PlannedMilestone[]> {
  const aiPlan = await fetchAiPlan(assetType, totalBudget, context);
  if (aiPlan) {
    return materializePlan(aiPlan, totalBudget);
  }
  return buildFallbackPlan(assetType, totalBudget);
}