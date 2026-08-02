"use client";

import { useSyncExternalStore } from "react";
import {
  getDraftsSnapshot,
  getServerDraftsSnapshot,
  subscribeDrafts,
  type DraftProject,
} from "@/lib/draft-projects";

/**
 * Subscribe to projects created in this browser.
 *
 * Returns an empty list on the server and on the first client render, then the
 * stored projects once hydration completes — which is what keeps the markup
 * matching on both sides.
 */
export function useDrafts(): readonly DraftProject[] {
  return useSyncExternalStore(
    subscribeDrafts,
    getDraftsSnapshot,
    getServerDraftsSnapshot
  );
}
