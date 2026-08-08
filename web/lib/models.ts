export type AssetType =
  | "house"
  | "shop"
  | "clinic"
  | "borehole"
  | "school"
  | "land"
  | "community";

export const ASSET_TYPE_LABEL: Record<AssetType, string> = {
  house: "Residential build",
  shop: "Shop / commercial",
  clinic: "Clinic",
  borehole: "Borehole / water",
  school: "School",
  land: "Land purchase",
  community: "Community asset",
};

export type MilestoneStatus =
  | "pending"
  | "in_progress"
  | "proof_submitted"
  | "approved"
  | "released"
  | "flagged";

export const MILESTONE_STATUS_LABEL: Record<MilestoneStatus, string> = {
  pending: "Not started",
  in_progress: "In progress",
  proof_submitted: "Proof submitted",
  approved: "Approved",
  released: "Funds released",
  flagged: "Concern flagged",
};

export interface Credential {
  label: string;
  issuer: string;
  verifiedOn: string;
}

export interface PortfolioItem {
  title: string;
  assetType: AssetType;
  location: string;
  summary: string;
  imageUrl?: string;
}

export interface Agent {
  id: string;
  name: string;
  initials: string;
  avatarHue: number | string;
  avatarUrl?: string | null;
  verified: boolean;
  location: string;
  specialties: AssetType[];
  rating: number;
  reviewCount: number;
  completedProjects: number;
  yearsExperience: number;
  bio?: string;
  credentials?: Credential[];
  portfolio?: PortfolioItem[];
  reviews?: { id?: string; author: string; authorLocation?: string; body?: string; quote?: string; rating: number; date?: string }[];
}

export interface Milestone {
  id: string;
  projectId: string;
  order: number;
  stage: string;
  escrowAmount: number;
  status: MilestoneStatus;
  dueDate: string;
  description?: string;
  billOfQuantities?: string[];
  certifications?: string[];
  currency?: string;
  isOverdue?: boolean;
  daysOverdue?: number;
  proofCount?: number;
  releasedAt?: string;
}

export interface ProgressProof {
  id: string;
  projectId: string;
  milestoneId: string;
  type: "photo" | "video";
  caption: string;
  location?: string;
  geoTag?: string;
  geo?: { lat: number; lng: number };
  fileUrl?: string;
  thumbnailUrl?: string | null;
  timestamp?: string;
  capturedAt?: string;
  uploadedAt?: string;
  locationVerified?: boolean;
  verification?: any;
  capturedLat?: number;
  capturedLng?: number;
  status: "pending_review" | "approved" | "flagged";
  previewUrl?: string;
  flagReason?: string;
}

export type ProjectStatus =
  | "on_track"
  | "awaiting_review"
  | "attention_needed"
  | "completed"
  | "dispute"
  | "agent_unassigned";

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  on_track: "On track",
  awaiting_review: "Awaiting your review",
  attention_needed: "Attention needed",
  completed: "Completed",
  dispute: "In Dispute",
  agent_unassigned: "Agent Unassigned (Open for Bids)",
};

export type BidStatus = "pending" | "accepted" | "declined";

export interface ProjectBid {
  id: string;
  projectId: string;
  projectName?: string;
  projectAssetType?: AssetType;
  projectLocation?: string | { label: string; lat: number; lng: number };
  projectBudget?: number;
  agentId: string;
  agentName: string;
  agentAvatarHue?: number | string;
  agentAvatarUrl?: string | null;
  agentInitials?: string;
  agentRating?: number;
  agentReviewCount?: number;
  agentCompletedProjects?: number;
  agentVerified?: boolean;
  proposedFeePercentage: number;
  estimatedDurationWeeks: number;
  coverLetter: string;
  status: BidStatus;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  assetType: AssetType;
  location: string | { label: string; lat: number; lng: number };
  agentId?: string | null;
  agentName?: string;
  agentEmail?: string;
  agent?: { id: string; name: string; initials: string; verified: boolean };
  currency?: string;
  totalBudget: number;
  fundsReleased: number;
  fundsInEscrow: number;
  supervisionFeePercentage?: number;
  supervisionFeeTotal?: number;
  supervisionFeePaid?: number;
  currentStage: string;
  status: ProjectStatus;
  milestoneCount?: number;
  milestonesReleased?: number;
  coverImageUrl?: string | null;
  scope: string;
  startedOn: string;
  unassignedReason?: string;
  disputeReason?: string;
  isOpenForBids?: boolean;
  bidsCount?: number;
}

export interface ActivityItem {
  id: string;
  projectId: string;
  type:
    | "proof_submitted"
    | "funds_released"
    | "overdue_flag"
    | "milestone_approved"
    | "concern_flagged";
  message: string;
  timestamp: string;
}

export interface SurveyQuote {
  quote: string;
}

export interface DocumentRecord {
  id: string;
  projectId: string;
  name: string;
  kind: "Contract" | "Receipt" | "Verification record" | "Permit";
  uploadedOn: string;
}

export const surveyQuotes: SurveyQuote[] = [
  {
    quote:
      "Money was sent and my friend's sibling diverted the funds for something completely ridiculous.",
  },
  {
    quote: "I fear to be stolen and to break a relation because of that.",
  },
  {
    quote:
      "My biggest fear is whether the person will carry out the work and if they are trustworthy enough.",
  },
];

export function formatCurrency(amount: number, currency: string = "NGN"): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
