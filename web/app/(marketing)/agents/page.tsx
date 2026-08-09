"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Star } from "lucide-react";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { Agent, ASSET_TYPE_LABEL, type AssetType } from "@/lib/models";
import Avatar from "@/components/avatar";
import VerifiedBadge from "@/components/verified-badge";
import { useAuth } from "@/lib/auth-context";

const SPECIALTIES = Object.keys(ASSET_TYPE_LABEL) as AssetType[];
export default function AgentsPage() {
  const { role } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [specialty, setSpecialty] = useState<AssetType | "all">("all");
  const [location, setLocation] = useState<string>("all");
  const [minRating, setMinRating] = useState(0);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState<string>("rating_desc");
  const [page, setPage] = useState(1);
  const perPage = 12;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  const queryParams = new URLSearchParams();
  if (debouncedQuery.trim()) queryParams.set("q", debouncedQuery.trim());
  if (specialty !== "all") queryParams.set("specialty", specialty);
  if (location !== "all") queryParams.set("location", location);
  if (minRating > 0) queryParams.set("minRating", minRating.toString());
  // Only filter to verified=true when the checkbox is explicitly checked.
  // Otherwise pass verifiedOnly=false so ALL agents appear (admin can verify via Supabase).
  queryParams.set("verifiedOnly", verifiedOnly ? "true" : "false");
  if (sort) queryParams.set("sort", sort);
  queryParams.set("page", page.toString());
  queryParams.set("perPage", perPage.toString());

  const { data: agentsRes, isLoading, isValidating } = useSWR(
    `/agents?${queryParams.toString()}`, 
    url => apiClient<{data: Agent[], meta: { page: number; perPage: number; total: number; totalPages: number }}>(url, { requireAuth: false }),
    { keepPreviousData: true }
  );
  const agents = agentsRes?.data || [];
  const meta = agentsRes?.meta || { page: 1, perPage, total: 0, totalPages: 1 };
  const LOCATIONS = Array.from(new Set(agents.map((a) => a.location ? a.location.split(",").pop()!.trim() : "")));

  const filtered = agents;

  const handleResetFilters = () => {
    setQuery("");
    setSpecialty("all");
    setLocation("all");
    setMinRating(0);
    setVerifiedOnly(false);
    setSort("rating_desc");
    setPage(1);
  };

  if (isLoading && !agentsRes) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14 min-h-[calc(100vh-280px)] flex items-center justify-center text-ink-500">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold">Loading verified agents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14 min-h-[calc(100vh-280px)] flex flex-col">
      <p className="text-sm font-semibold text-brand-700">Verified agents</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink-900">
        Every agent here is identity and credential checked.
      </h1>
      <p className="mt-3 max-w-2xl text-ink-500">
        Search and filter our hand-vetted first cohort by location, specialty, and
        client rating before you start a project.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl bg-white shadow-soft p-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] px-3">
          <Search className="size-4 text-ink-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by name or location"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            className="w-full py-2 text-sm outline-none placeholder:text-ink-400"
          />
        </div>
        <select
          value={specialty}
          onChange={(e) => { setSpecialty(e.target.value as AssetType | "all"); setPage(1); }}
          className="rounded-full bg-ink-50 px-4 py-2 text-sm text-ink-700 outline-none"
        >
          <option value="all">All specialties</option>
          {SPECIALTIES.map((s) => (
            <option key={s} value={s}>
              {ASSET_TYPE_LABEL[s]}
            </option>
          ))}
        </select>
        <select
          value={location}
          onChange={(e) => { setLocation(e.target.value); setPage(1); }}
          className="rounded-full bg-ink-50 px-4 py-2 text-sm text-ink-700 outline-none"
        >
          <option value="all">All countries</option>
          {LOCATIONS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <select
          value={minRating}
          onChange={(e) => { setMinRating(Number(e.target.value)); setPage(1); }}
          className="rounded-full bg-ink-50 px-4 py-2 text-sm text-ink-700 outline-none"
        >
          <option value={0}>Any rating</option>
          <option value={4.5}>4.5+ rating</option>
          <option value={4.8}>4.8+ rating</option>
        </select>
        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value); setPage(1); }}
          className="rounded-full bg-ink-50 px-4 py-2 text-sm text-ink-700 outline-none"
        >
          <option value="rating_desc">Highest Rated</option>
          <option value="experience_desc">Most Experienced</option>
          <option value="projects_desc">Most Projects</option>
        </select>
        <label className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-ink-700 cursor-pointer">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => { setVerifiedOnly(e.target.checked); setPage(1); }}
            className="rounded border-ink-300 text-brand-600 focus:ring-brand-500"
          />
          Verified Only
        </label>
      </div>

      <p className="mt-4 text-sm text-ink-500">
        {meta.total} agent{meta.total === 1 ? "" : "s"} found
      </p>

      <div className={`mt-4 min-h-[420px] transition-opacity duration-200 ${isValidating ? "opacity-70" : "opacity-100"}`}>
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((agent) => (
              <Link 
                key={agent.id} 
                href={`/agents/${agent.id}?from=directory`}
                className="bg-white rounded-2xl p-6 shadow-sm border border-ink-100 hover:shadow-md transition-shadow relative overflow-hidden group block"
              >  <div className="flex items-center gap-3">
                  <Avatar initials={agent.initials} hue={agent.avatarHue} size="lg" />
                  <div className="min-w-0">
                    <h3 className="font-semibold text-ink-900 truncate">{agent.name}</h3>
                    <p className="text-sm text-ink-500 truncate">{agent.location}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  {agent.verified 
                    ? <VerifiedBadge size="sm" />
                    : <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">⏳ Pending Verification</span>
                  }
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-ink-900">
                    <Star className="size-3.5 text-amber-500" fill="currentColor" strokeWidth={0} />
                    {agent.rating.toFixed(1)}
                    <span className="text-ink-400 font-normal">
                      ({agent.reviewCount})
                    </span>
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {agent.specialties.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700"
                    >
                      {ASSET_TYPE_LABEL[s]}
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-xs text-ink-500">
                  {agent.completedProjects} completed projects · {agent.yearsExperience}{" "}
                  years experience
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="min-h-[380px] rounded-2xl bg-white border border-ink-100 p-12 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="size-16 rounded-full bg-brand-50 flex items-center justify-center mb-4 text-brand-600">
              <Search className="size-8 opacity-75" />
            </div>
            <h3 className="text-lg font-bold text-ink-900 mb-1">No agents found</h3>
            <p className="text-sm text-ink-500 max-w-md mb-6">
              No agents match your current filters. Try resetting or removing some filters.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-5 py-2.5 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-soft transition-all hover:-translate-y-0.5"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {meta.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between border-t border-ink-100 pt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl border border-ink-200 text-sm font-bold text-ink-700 disabled:opacity-40 hover:bg-ink-50 transition-colors"
          >
            Previous
          </button>
          <span className="text-sm font-medium text-ink-500">
            Page {page} of {meta.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
            disabled={page >= meta.totalPages}
            className="px-4 py-2 rounded-xl border border-ink-200 text-sm font-bold text-ink-700 disabled:opacity-40 hover:bg-ink-50 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
