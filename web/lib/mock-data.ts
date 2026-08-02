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

export interface Agent {
  id: string;
  name: string;
  initials: string;
  avatarHue: number;
  verified: boolean;
  location: string;
  specialties: AssetType[];
  rating: number;
  reviewCount: number;
  completedProjects: number;
  yearsExperience: number;
  bio: string;
  credentials: string[];
  portfolio: {
    title: string;
    assetType: AssetType;
    location: string;
    summary: string;
  }[];
  reviews: { author: string; quote: string; rating: number }[];
}

export interface Milestone {
  id: string;
  projectId: string;
  order: number;
  stage: string;
  escrowAmount: number;
  status: MilestoneStatus;
  dueDate: string;
}

export interface ProgressProof {
  id: string;
  projectId: string;
  milestoneId: string;
  type: "photo" | "video";
  caption: string;
  location: string;
  geoTag: string;
  timestamp: string;
  status: "pending_review" | "approved" | "flagged";
}

export type ProjectStatus =
  | "on_track"
  | "awaiting_review"
  | "attention_needed"
  | "completed";

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  on_track: "On track",
  awaiting_review: "Awaiting your review",
  attention_needed: "Attention needed",
  completed: "Completed",
};

export interface Project {
  id: string;
  name: string;
  assetType: AssetType;
  location: string;
  agentId: string;
  totalBudget: number;
  fundsReleased: number;
  fundsInEscrow: number;
  currentStage: string;
  status: ProjectStatus;
  scope: string;
  startedOn: string;
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

export const agents: Agent[] = [
  {
    id: "agent-adaeze",
    name: "Adaeze Nwosu",
    initials: "AN",
    avatarHue: 262,
    verified: true,
    location: "Lekki, Lagos, Nigeria",
    specialties: ["house", "shop"],
    rating: 4.9,
    reviewCount: 38,
    completedProjects: 22,
    yearsExperience: 9,
    bio: "Licensed builder and project manager focused on diaspora-funded residential and commercial builds across Lagos. Identity and credential-verified on Bankole since 2025.",
    credentials: [
      "COREN-certified site engineer",
      "Government ID verified",
      "Business registration verified (CAC)",
      "3 years on-platform track record",
    ],
    portfolio: [
      {
        title: "4-bedroom family home",
        assetType: "house",
        location: "Ajah, Lagos",
        summary: "Completed in 11 months, 6 milestones, zero flagged concerns.",
      },
      {
        title: "Retail plaza, 6 units",
        assetType: "shop",
        location: "Sangotedo, Lagos",
        summary: "Delivered 3 weeks ahead of schedule for a UK-based sender.",
      },
    ],
    reviews: [
      {
        author: "Dr. Emeka N., London",
        quote:
          "Bankole didn't just get us a builder, it gave us a paper trail. Every milestone had proof before a naira moved.",
        rating: 5,
      },
      {
        author: "Ifeoma A., Houston",
        quote: "First time funding a build from abroad without losing sleep.",
        rating: 5,
      },
    ],
  },
  {
    id: "agent-kwabena",
    name: "Kwabena Owusu",
    initials: "KO",
    avatarHue: 231,
    verified: true,
    location: "Kumasi, Ghana",
    specialties: ["house", "community", "borehole"],
    rating: 4.8,
    reviewCount: 24,
    completedProjects: 15,
    yearsExperience: 12,
    bio: "Civil engineer specializing in family compounds and community infrastructure, including water access projects for hometown associations.",
    credentials: [
      "Ghana Institution of Engineers member",
      "Government ID verified",
      "Community reference-checked",
    ],
    portfolio: [
      {
        title: "Family compound, 2 units",
        assetType: "house",
        location: "Ejisu, Ashanti Region",
        summary: "Funded by 3 siblings across UK, US, and Ghana.",
      },
      {
        title: "Community borehole",
        assetType: "borehole",
        location: "Bekwai, Ashanti Region",
        summary: "Funded by a hometown association of 40 diaspora members.",
      },
    ],
    reviews: [
      {
        author: "Yaw B., Toronto",
        quote:
          "The milestone photos with GPS tags meant our whole association could verify progress, not just me.",
        rating: 5,
      },
    ],
  },
  {
    id: "agent-mariam",
    name: "Mariam Cisse",
    initials: "MC",
    avatarHue: 292,
    verified: true,
    location: "Dakar, Senegal",
    specialties: ["clinic", "school", "community"],
    rating: 4.95,
    reviewCount: 19,
    completedProjects: 11,
    yearsExperience: 14,
    bio: "Manages health and education infrastructure projects for diaspora foundations and family trusts across Senegal.",
    credentials: [
      "Registered project manager",
      "Government ID verified",
      "NGO partnership references verified",
    ],
    portfolio: [
      {
        title: "Community health post",
        assetType: "clinic",
        location: "Thies, Senegal",
        summary: "Delivered for a US-based diaspora medical foundation.",
      },
    ],
    reviews: [
      {
        author: "Dr. Fatou S., New York",
        quote: "Every clinic milestone came with a video walkthrough. No more guessing.",
        rating: 5,
      },
    ],
  },
  {
    id: "agent-tunde",
    name: "Tunde Bankole",
    initials: "TB",
    avatarHue: 20,
    verified: true,
    location: "Ibadan, Nigeria",
    specialties: ["house", "land", "shop"],
    rating: 4.7,
    reviewCount: 31,
    completedProjects: 18,
    yearsExperience: 7,
    bio: "Handles land acquisition through to build-out for diaspora clients, with a focus on title verification before any funds move.",
    credentials: [
      "Licensed surveyor partnership",
      "Government ID verified",
      "Land title verification specialist",
    ],
    portfolio: [
      {
        title: "Land purchase + fencing",
        assetType: "land",
        location: "Ibadan, Oyo State",
        summary: "Title verification completed before first milestone release.",
      },
    ],
    reviews: [
      {
        author: "Bimbo O., Atlanta",
        quote: "The title fraud checks alone were worth it. I'd been burned before.",
        rating: 4,
      },
    ],
  },
];

export const projects: Project[] = [
  {
    id: "proj-ajah-home",
    name: "Adeyemi Family Home",
    assetType: "house",
    location: "Ajah, Lagos, Nigeria",
    agentId: "agent-adaeze",
    totalBudget: 42000000,
    fundsReleased: 18000000,
    fundsInEscrow: 24000000,
    currentStage: "Roofing & structural finishing",
    status: "awaiting_review",
    scope:
      "4-bedroom detached duplex on a 600sqm plot, including boundary fencing and a borehole. 6 milestones from foundation to handover.",
    startedOn: "2026-02-10",
  },
  {
    id: "proj-sangotedo-plaza",
    name: "Sangotedo Retail Plaza",
    assetType: "shop",
    location: "Sangotedo, Lagos, Nigeria",
    agentId: "agent-adaeze",
    totalBudget: 65000000,
    fundsReleased: 65000000,
    fundsInEscrow: 0,
    currentStage: "Handover complete",
    status: "completed",
    scope: "6-unit retail plaza with shared parking, delivered for a diaspora-owned investment group.",
    startedOn: "2025-05-01",
  },
  {
    id: "proj-ejisu-compound",
    name: "Owusu Family Compound",
    assetType: "house",
    location: "Ejisu, Ashanti Region, Ghana",
    agentId: "agent-kwabena",
    totalBudget: 28000000,
    fundsReleased: 9000000,
    fundsInEscrow: 19000000,
    currentStage: "Foundation & block work",
    status: "on_track",
    scope: "2-unit family compound funded jointly by three siblings across the UK, US, and Ghana.",
    startedOn: "2026-04-18",
  },
  {
    id: "proj-bekwai-borehole",
    name: "Bekwai Community Borehole",
    assetType: "borehole",
    location: "Bekwai, Ashanti Region, Ghana",
    agentId: "agent-kwabena",
    totalBudget: 6500000,
    fundsReleased: 2500000,
    fundsInEscrow: 4000000,
    currentStage: "Drilling & casing",
    status: "attention_needed",
    scope: "Community borehole and water point funded by a 40-member hometown association.",
    startedOn: "2026-03-02",
  },
  {
    id: "proj-thies-clinic",
    name: "Thies Community Health Post",
    assetType: "clinic",
    location: "Thies, Senegal",
    agentId: "agent-mariam",
    totalBudget: 34000000,
    fundsReleased: 12000000,
    fundsInEscrow: 22000000,
    currentStage: "Interior fit-out",
    status: "on_track",
    scope: "Single-story community health post with two consultation rooms and a small pharmacy.",
    startedOn: "2026-01-22",
  },
  {
    id: "proj-ibadan-land",
    name: "Ibadan Land & Fencing",
    assetType: "land",
    location: "Ibadan, Oyo State, Nigeria",
    agentId: "agent-tunde",
    totalBudget: 15000000,
    fundsReleased: 15000000,
    fundsInEscrow: 0,
    currentStage: "Title transfer complete",
    status: "completed",
    scope: "1200sqm plot purchase, title verification, and perimeter fencing ahead of a future build.",
    startedOn: "2025-09-14",
  },
];

export const milestones: Milestone[] = [
  // Ajah Family Home
  { id: "m1", projectId: "proj-ajah-home", order: 1, stage: "Site survey & foundation", escrowAmount: 8000000, status: "released", dueDate: "2026-03-01" },
  { id: "m2", projectId: "proj-ajah-home", order: 2, stage: "Block work to lintel level", escrowAmount: 10000000, status: "released", dueDate: "2026-04-15" },
  { id: "m3", projectId: "proj-ajah-home", order: 3, stage: "Roofing & structural finishing", escrowAmount: 9000000, status: "proof_submitted", dueDate: "2026-06-20" },
  { id: "m4", projectId: "proj-ajah-home", order: 4, stage: "Plumbing & electrical rough-in", escrowAmount: 7000000, status: "pending", dueDate: "2026-08-10" },
  { id: "m5", projectId: "proj-ajah-home", order: 5, stage: "Interior finishing", escrowAmount: 5000000, status: "pending", dueDate: "2026-09-25" },
  { id: "m6", projectId: "proj-ajah-home", order: 6, stage: "Final handover", escrowAmount: 3000000, status: "pending", dueDate: "2026-10-30" },

  // Ejisu Compound
  { id: "m7", projectId: "proj-ejisu-compound", order: 1, stage: "Land clearing & survey", escrowAmount: 4000000, status: "released", dueDate: "2026-05-01" },
  { id: "m8", projectId: "proj-ejisu-compound", order: 2, stage: "Foundation & block work", escrowAmount: 9000000, status: "in_progress", dueDate: "2026-07-01" },
  { id: "m9", projectId: "proj-ejisu-compound", order: 3, stage: "Roofing", escrowAmount: 8000000, status: "pending", dueDate: "2026-09-01" },
  { id: "m10", projectId: "proj-ejisu-compound", order: 4, stage: "Finishing & handover", escrowAmount: 7000000, status: "pending", dueDate: "2026-11-01" },

  // Bekwai Borehole
  { id: "m11", projectId: "proj-bekwai-borehole", order: 1, stage: "Site assessment & permits", escrowAmount: 1000000, status: "released", dueDate: "2026-03-20" },
  { id: "m12", projectId: "proj-bekwai-borehole", order: 2, stage: "Drilling & casing", escrowAmount: 3000000, status: "flagged", dueDate: "2026-05-15" },
  { id: "m13", projectId: "proj-bekwai-borehole", order: 3, stage: "Pump installation & handover", escrowAmount: 2500000, status: "pending", dueDate: "2026-07-01" },

  // Thies Clinic
  { id: "m14", projectId: "proj-thies-clinic", order: 1, stage: "Foundation", escrowAmount: 6000000, status: "released", dueDate: "2026-02-15" },
  { id: "m15", projectId: "proj-thies-clinic", order: 2, stage: "Structure & roofing", escrowAmount: 6000000, status: "released", dueDate: "2026-04-01" },
  { id: "m16", projectId: "proj-thies-clinic", order: 3, stage: "Interior fit-out", escrowAmount: 10000000, status: "proof_submitted", dueDate: "2026-06-30" },
  { id: "m17", projectId: "proj-thies-clinic", order: 4, stage: "Equipment & handover", escrowAmount: 12000000, status: "pending", dueDate: "2026-09-15" },
];

export const progressProofs: ProgressProof[] = [
  {
    id: "pp1",
    projectId: "proj-ajah-home",
    milestoneId: "m3",
    type: "photo",
    caption: "Roof trusses installed, corrugated sheeting 60% complete",
    location: "Ajah, Lagos",
    geoTag: "6.4698° N, 3.5852° E",
    timestamp: "2026-07-29T10:14:00Z",
    status: "pending_review",
  },
  {
    id: "pp2",
    projectId: "proj-ajah-home",
    milestoneId: "m3",
    type: "video",
    caption: "Walkthrough of upper floor structural work",
    location: "Ajah, Lagos",
    geoTag: "6.4698° N, 3.5852° E",
    timestamp: "2026-07-29T10:20:00Z",
    status: "pending_review",
  },
  {
    id: "pp3",
    projectId: "proj-ajah-home",
    milestoneId: "m2",
    type: "photo",
    caption: "Block work reaching lintel level, all four walls",
    location: "Ajah, Lagos",
    geoTag: "6.4698° N, 3.5852° E",
    timestamp: "2026-04-12T09:02:00Z",
    status: "approved",
  },
  {
    id: "pp4",
    projectId: "proj-bekwai-borehole",
    milestoneId: "m12",
    type: "photo",
    caption: "Drilling paused, equipment fault reported by site team",
    location: "Bekwai, Ashanti Region",
    geoTag: "6.4526° N, 1.5716° W",
    timestamp: "2026-05-18T14:40:00Z",
    status: "flagged",
  },
  {
    id: "pp5",
    projectId: "proj-thies-clinic",
    milestoneId: "m16",
    type: "photo",
    caption: "Interior partition walls and electrical conduit in place",
    location: "Thies",
    geoTag: "14.7910° N, 16.9359° W",
    timestamp: "2026-07-25T08:55:00Z",
    status: "pending_review",
  },
  {
    id: "pp6",
    projectId: "proj-ejisu-compound",
    milestoneId: "m8",
    type: "photo",
    caption: "Foundation trenches dug, ready for concrete pour",
    location: "Ejisu, Ashanti Region",
    geoTag: "6.7180° N, 1.4778° W",
    timestamp: "2026-06-30T11:05:00Z",
    status: "approved",
  },
];

export const activity: ActivityItem[] = [
  { id: "a1", projectId: "proj-ajah-home", type: "proof_submitted", message: "New progress proof submitted for Roofing & structural finishing", timestamp: "2026-07-29T10:20:00Z" },
  { id: "a2", projectId: "proj-ajah-home", type: "funds_released", message: "₦10,000,000 released for Block work to lintel level", timestamp: "2026-04-16T09:00:00Z" },
  { id: "a3", projectId: "proj-bekwai-borehole", type: "concern_flagged", message: "Proof for Drilling & casing flagged: equipment fault reported", timestamp: "2026-05-18T15:00:00Z" },
  { id: "a4", projectId: "proj-bekwai-borehole", type: "overdue_flag", message: "Drilling & casing milestone is 12 days past due date", timestamp: "2026-05-27T08:00:00Z" },
  { id: "a5", projectId: "proj-thies-clinic", type: "proof_submitted", message: "New progress proof submitted for Interior fit-out", timestamp: "2026-07-25T09:10:00Z" },
  { id: "a6", projectId: "proj-ejisu-compound", type: "milestone_approved", message: "Foundation trenches proof approved by sender", timestamp: "2026-06-30T18:22:00Z" },
];

export const documents: DocumentRecord[] = [
  { id: "d1", projectId: "proj-ajah-home", name: "Building contract, Adeyemi Family Home", kind: "Contract", uploadedOn: "2026-02-08" },
  { id: "d2", projectId: "proj-ajah-home", name: "Foundation stage receipt", kind: "Receipt", uploadedOn: "2026-03-01" },
  { id: "d3", projectId: "proj-ajah-home", name: "Agent identity & credential verification", kind: "Verification record", uploadedOn: "2026-02-05" },
  { id: "d4", projectId: "proj-ajah-home", name: "Building permit, Lagos State", kind: "Permit", uploadedOn: "2026-01-30" },
];

// Verbatim answers from the Bankole survey (n = 10, August 2026). These are real
// respondent words — do not edit them for polish, and do not attach names or
// locations: the form was answered without per-quote attribution.
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

export function getAgent(id: string): Agent | undefined {
  return agents.find((a) => a.id === id);
}

export function getProject(id: string): Project | undefined {
  return projects.find((p) => p.id === id);
}

export function getMilestonesForProject(projectId: string): Milestone[] {
  return milestones
    .filter((m) => m.projectId === projectId)
    .sort((a, b) => a.order - b.order);
}

export function getProofsForProject(projectId: string): ProgressProof[] {
  return progressProofs.filter((p) => p.projectId === projectId);
}

export function getActivityForProject(projectId: string): ActivityItem[] {
  return activity
    .filter((a) => a.projectId === projectId)
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
}

export function getDocumentsForProject(projectId: string): DocumentRecord[] {
  return documents.filter((d) => d.projectId === projectId);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}
