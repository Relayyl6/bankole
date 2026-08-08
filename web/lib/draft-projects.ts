import type { Milestone, Project } from "@/lib/models";

/**
 * Projects created through the guided flow, held in the browser.
 *
 * The platform has no backend yet, so a project a visitor creates lives in
 * localStorage rather than a database. Everything here is namespaced under a
 * `draft-` id prefix so a created project is never mistaken for seeded
 * demonstration data, and so `/projects/[id]` can tell which store to read.
 *
 * Replacing this with `POST /projects` (API-CONTRACT.md §4) touches this file
 * and the flow's submit handler, nothing else.
 */
export interface DraftProject {
  project: Project;
  milestones: Milestone[];
  createdAt: string;
}

const STORAGE_KEY = "bankole.draft-projects";

export const DRAFT_ID_PREFIX = "draft-";

export function isDraftId(id: string): boolean {
  return id.startsWith(DRAFT_ID_PREFIX);
}

export function newDraftId(): string {
  return `${DRAFT_ID_PREFIX}${Date.now().toString(36)}`;
}

const EMPTY: readonly DraftProject[] = Object.freeze([]);

/**
 * `useSyncExternalStore` compares snapshots by identity, so parsing on every
 * read would re-render forever. Cache against the raw string and only reparse
 * when storage actually changed.
 */
let cachedRaw: string | null = null;
let cached: readonly DraftProject[] = EMPTY;

function parse(raw: string | null): readonly DraftProject[] {
  if (!raw) return EMPTY;
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as DraftProject[]) : EMPTY;
  } catch {
    // Hand-edited or truncated JSON. A created project is not worth breaking
    // the page over.
    return EMPTY;
  }
}

/** Every created project, newest first. Empty on the server. */
export function getDraftsSnapshot(): readonly DraftProject[] {
  if (typeof window === "undefined") return EMPTY;

  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Private browsing with storage blocked entirely.
    return EMPTY;
  }

  if (raw === cachedRaw) return cached;
  cachedRaw = raw;
  cached = parse(raw);
  return cached;
}

/** The server never has created projects; they exist only in the browser. */
export function getServerDraftsSnapshot(): readonly DraftProject[] {
  return EMPTY;
}

const listeners = new Set<() => void>();

export function subscribeDrafts(onChange: () => void): () => void {
  listeners.add(onChange);
  // `storage` fires for writes from other tabs; local writes notify directly.
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function saveDraft(draft: DraftProject): void {
  if (typeof window === "undefined") return;
  try {
    const next = [
      draft,
      ...getDraftsSnapshot().filter((d) => d.project.id !== draft.project.id),
    ];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked. The flow still shows its confirmation screen;
    // only persistence across a reload is lost.
  }
  listeners.forEach((notify) => notify());
}
