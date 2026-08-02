import type { StatusTone } from "@/components/status-pill";
import type { MilestoneStatus, ProjectStatus } from "@/lib/mock-data";

export const PROJECT_STATUS_TONE: Record<ProjectStatus, StatusTone> = {
  on_track: "success",
  awaiting_review: "brand",
  attention_needed: "danger",
  completed: "neutral",
};

export const MILESTONE_STATUS_TONE: Record<MilestoneStatus, StatusTone> = {
  pending: "neutral",
  in_progress: "brand",
  proof_submitted: "warning",
  approved: "success",
  released: "success",
  flagged: "danger",
};
