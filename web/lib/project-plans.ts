import type { AssetType } from "@/lib/mock-data";

/**
 * A suggested milestone plan per asset type: the stages a build of this kind
 * moves through, and the share of the budget conventionally released at each.
 *
 * Weights are a starting point the sender edits, not a rule. What matters is
 * that funds are split across verifiable stages rather than handed over at once.
 */
interface PlanStage {
  stage: string;
  weight: number;
}

const PLANS: Record<AssetType, PlanStage[]> = {
  house: [
    { stage: "Site survey & foundation", weight: 0.2 },
    { stage: "Block work to lintel level", weight: 0.25 },
    { stage: "Roofing & structural finishing", weight: 0.2 },
    { stage: "Windows, doors & plastering", weight: 0.2 },
    { stage: "Final finishing & handover", weight: 0.15 },
  ],
  shop: [
    { stage: "Site preparation & foundation", weight: 0.25 },
    { stage: "Structure & roofing", weight: 0.3 },
    { stage: "Shopfront & security fittings", weight: 0.25 },
    { stage: "Interior fit-out & handover", weight: 0.2 },
  ],
  clinic: [
    { stage: "Site preparation & foundation", weight: 0.2 },
    { stage: "Structure & roofing", weight: 0.25 },
    { stage: "Plumbing, electrical & waste", weight: 0.2 },
    { stage: "Interior fit-out & equipment", weight: 0.2 },
    { stage: "Commissioning & handover", weight: 0.15 },
  ],
  borehole: [
    { stage: "Hydrogeological survey & siting", weight: 0.2 },
    { stage: "Drilling & casing", weight: 0.4 },
    { stage: "Pump & storage tank installation", weight: 0.25 },
    { stage: "Water testing & commissioning", weight: 0.15 },
  ],
  school: [
    { stage: "Site preparation & foundation", weight: 0.2 },
    { stage: "Block work & structure", weight: 0.25 },
    { stage: "Roofing, windows & doors", weight: 0.2 },
    { stage: "Classroom fit-out", weight: 0.2 },
    { stage: "Furnishing & handover", weight: 0.15 },
  ],
  land: [
    { stage: "Title verification & survey", weight: 0.3 },
    { stage: "Purchase & documentation", weight: 0.4 },
    { stage: "Perimeter fencing", weight: 0.2 },
    { stage: "Final documentation handover", weight: 0.1 },
  ],
  community: [
    { stage: "Scoping & site survey", weight: 0.15 },
    { stage: "Groundwork & foundation", weight: 0.25 },
    { stage: "Main construction", weight: 0.3 },
    { stage: "Fit-out", weight: 0.2 },
    { stage: "Commissioning & handover", weight: 0.1 },
  ],
};

export interface PlannedMilestone {
  stage: string;
  escrowAmount: number;
  dueDate: string;
}

/** Weeks between milestone due dates in a suggested plan. */
const WEEKS_PER_STAGE = 6;

/**
 * Build a suggested plan for an asset type against a total budget.
 *
 * Amounts are integers and the last stage absorbs the rounding remainder, so
 * the plan always sums to exactly the budget. Splitting by percentage and
 * rounding each stage independently would leave the escrow total short.
 */
export function suggestPlan(
  assetType: AssetType,
  totalBudget: number
): PlannedMilestone[] {
  const stages = PLANS[assetType];
  const start = new Date();

  let allocated = 0;
  return stages.map((s, index) => {
    const isLast = index === stages.length - 1;
    const escrowAmount = isLast
      ? totalBudget - allocated
      : Math.round(totalBudget * s.weight);
    allocated += escrowAmount;

    const due = new Date(start);
    due.setDate(due.getDate() + WEEKS_PER_STAGE * 7 * (index + 1));

    return {
      stage: s.stage,
      escrowAmount,
      dueDate: due.toISOString().slice(0, 10),
    };
  });
}
