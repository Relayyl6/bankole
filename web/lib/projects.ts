import { useState, useEffect } from "react";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { type Project, type ProgressProof } from "@/lib/models";

/**
 * Checks if a project is assigned to an agent based on user ID, agent details ID,
 * email, full name, or alias slugs.
 */
export function isProjectAssignedToAgent(project: Project | any, user: any): boolean {
  if (!user || !project) return false;

  // 1. Direct ID comparison
  const userIds = new Set<string>();
  if (user.id) userIds.add(String(user.id).toLowerCase());
  if (user._id) userIds.add(String(user._id).toLowerCase());
  if (user.userId) userIds.add(String(user.userId).toLowerCase());
  if (user.agentDetails?.id) userIds.add(String(user.agentDetails.id).toLowerCase());
  if (user.agentDetails?.userId) userIds.add(String(user.agentDetails.userId).toLowerCase());

  const projectAgentId = String(
    project.agentId || (project as any).agent_id || project.agent?.id || (project as any).agent?.userId || ""
  ).toLowerCase();
  if (projectAgentId && userIds.has(projectAgentId)) return true;

  // 2. Email comparison
  const userEmail = String(user.email || "").trim().toLowerCase();
  const projectAgentEmail = String(project.agentEmail || project.agent?.email || "").trim().toLowerCase();
  if (userEmail && projectAgentEmail && userEmail === projectAgentEmail) return true;

  // 3. Name comparison (full name, first name, last name, normalized strings)
  const userNames = new Set<string>();
  if (user.fullName) {
    const raw = user.fullName.trim().toLowerCase();
    userNames.add(raw);
    userNames.add(raw.replace(/\s+/g, "_"));
    userNames.add(raw.replace(/[^a-z0-9]/g, ""));
    raw.split(/\s+/).forEach((part: string) => {
      if (part.length >= 2) userNames.add(part);
    });
  }
  if (user.name) {
    const raw = user.name.trim().toLowerCase();
    userNames.add(raw);
    userNames.add(raw.replace(/\s+/g, "_"));
    userNames.add(raw.replace(/[^a-z0-9]/g, ""));
    raw.split(/\s+/).forEach((part: string) => {
      if (part.length >= 2) userNames.add(part);
    });
  }

  const projectAgentName = String(project.agentName || project.agent?.name || "").trim().toLowerCase();
  if (projectAgentName) {
    if (userNames.has(projectAgentName)) return true;
    if (userNames.has(projectAgentName.replace(/\s+/g, "_"))) return true;
    if (userNames.has(projectAgentName.replace(/[^a-z0-9]/g, ""))) return true;

    // Check individual name parts (e.g. "Naomi" or "Tabitha")
    const agentParts = projectAgentName.split(/\s+/);
    for (const part of agentParts) {
      if (part.length >= 3 && userNames.has(part)) return true;
    }

    if (user.fullName && (user.fullName.toLowerCase().includes(projectAgentName) || projectAgentName.includes(user.fullName.toLowerCase()))) {
      return true;
    }
  }

  // 4. Partial or slug matching between projectAgentId and user identifiers
  for (const uid of Array.from(userIds)) {
    if (projectAgentId && (projectAgentId.includes(uid) || uid.includes(projectAgentId))) return true;
  }

  for (const uname of Array.from(userNames)) {
    if (projectAgentName && (projectAgentName.includes(uname) || uname.includes(projectAgentName))) return true;
    if (projectAgentId && (projectAgentId.includes(uname) || uname.includes(projectAgentId))) return true;
  }

  return false;
}

export const ProjectStorage = {
  getCreatedProjects: (): Project[] => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("bankole_created_projects");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  },

  saveCreatedProject: (project: Project): void => {
    if (typeof window === "undefined" || !project) return;
    try {
      const existing = ProjectStorage.getCreatedProjects();
      const filtered = existing.filter((p) => p.id !== project.id);
      const updated = [project, ...filtered];
      localStorage.setItem("bankole_created_projects", JSON.stringify(updated));
      window.dispatchEvent(new Event("bankole_projects_updated"));
    } catch {}
  },

  getMergedProjects: (apiProjects: Project[] = []): Project[] => {
    const local = ProjectStorage.getCreatedProjects();
    const map = new Map<string, Project>();

    // Put API projects first
    for (const p of apiProjects) {
      if (p && p.id) map.set(p.id, p);
    }

    // Merge/override with local created projects
    for (const p of local) {
      if (p && p.id) {
        const existing = map.get(p.id);
        map.set(p.id, existing ? { ...existing, ...p } : p);
      }
    }

    return Array.from(map.values());
  },

  getProofs: (projectId?: string): ProgressProof[] => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("bankole_proofs");
      const proofs: ProgressProof[] = stored ? JSON.parse(stored) : [];
      if (!projectId) return proofs;
      return proofs.filter((p) => p.projectId === projectId);
    } catch {
      return [];
    }
  },

  saveProof: (proof: ProgressProof): void => {
    if (typeof window === "undefined" || !proof) return;
    try {
      const stored = localStorage.getItem("bankole_proofs");
      const proofs: ProgressProof[] = stored ? JSON.parse(stored) : [];
      const filtered = proofs.filter((p) => p.id !== proof.id);
      const updated = [proof, ...filtered];
      localStorage.setItem("bankole_proofs", JSON.stringify(updated));
      window.dispatchEvent(new Event("bankole_proofs_updated"));
    } catch {}
  },

  updateProofStatus: (proofId: string, status: "pending_review" | "approved" | "flagged", flagReason?: string): void => {
    if (typeof window === "undefined" || !proofId) return;
    try {
      const stored = localStorage.getItem("bankole_proofs");
      const proofs: ProgressProof[] = stored ? JSON.parse(stored) : [];
      const updated = proofs.map((p) => {
        if (p.id === proofId) {
          return { ...p, status, ...(flagReason ? { flagReason } : {}) };
        }
        return p;
      });
      localStorage.setItem("bankole_proofs", JSON.stringify(updated));
      window.dispatchEvent(new Event("bankole_proofs_updated"));
    } catch {}
  },

  getMergedProofs: (projectId: string, apiProofs: ProgressProof[] = []): ProgressProof[] => {
    const local = ProjectStorage.getProofs(projectId);
    const map = new Map<string, ProgressProof>();

    // Put API proofs first
    for (const p of apiProofs) {
      if (p && p.id) map.set(p.id, p);
    }

    // Merge with locally stored/submitted proofs
    for (const p of local) {
      if (p && p.id) {
        const existing = map.get(p.id);
        map.set(p.id, existing ? { ...existing, ...p } : p);
      }
    }

    return Array.from(map.values());
  },
};

/**
 * Hook to retrieve projects with local cache merge and role-aware filtering.
 */
export function useProjects(role?: string | null, user?: any) {
  const { data: projectsRes, mutate, isLoading } = useSWR(
    "/projects",
    (url) => apiClient<{ data: Project[]; meta: any }>(url).catch(() => ({ data: [], meta: {} }))
  );

  const [localProjects, setLocalProjects] = useState<Project[]>(() => ProjectStorage.getCreatedProjects());

  useEffect(() => {
    const handleUpdate = () => {
      setLocalProjects(ProjectStorage.getCreatedProjects());
    };
    window.addEventListener("bankole_projects_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("bankole_projects_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const apiProjects = projectsRes?.data || [];
  const mergedProjects = ProjectStorage.getMergedProjects(apiProjects);

  // If the user is an agent:
  // Include projects returned from backend GET /projects (since backend scopes GET /projects to authenticated caller)
  // plus any local projects matching the agent
  let userProjects: Project[];
  if (role === "agent" && user) {
    const combined = new Map<string, Project>();

    // 1. Projects returned by the backend GET /projects for this authenticated user
    for (const p of apiProjects) {
      if (p && p.id) {
        // If it is not explicitly an unassigned marketplace listing, or if assigned to this agent
        if (p.status !== "agent_unassigned" || isProjectAssignedToAgent(p, user)) {
          combined.set(p.id, p);
        }
      }
    }

    // 2. Matching projects from local storage
    for (const p of localProjects) {
      if (p && p.id && isProjectAssignedToAgent(p, user)) {
        const existing = combined.get(p.id);
        combined.set(p.id, existing ? { ...existing, ...p } : p);
      }
    }

    // 3. Any projects in mergedProjects where isProjectAssignedToAgent is true
    for (const p of mergedProjects) {
      if (p && p.id && isProjectAssignedToAgent(p, user)) {
        const existing = combined.get(p.id);
        combined.set(p.id, existing ? { ...existing, ...p } : p);
      }
    }

    userProjects = Array.from(combined.values());
  } else {
    userProjects = mergedProjects;
  }

  return {
    projects: mergedProjects,
    userProjects,
    isLoading,
    mutate: () => {
      setLocalProjects(ProjectStorage.getCreatedProjects());
      return mutate();
    },
  };
}
