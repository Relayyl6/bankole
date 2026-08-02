"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Star } from "lucide-react";
import { ASSET_TYPE_LABEL, agents, type AssetType } from "@/lib/mock-data";
import Avatar from "@/components/avatar";
import VerifiedBadge from "@/components/verified-badge";

const SPECIALTIES = Object.keys(ASSET_TYPE_LABEL) as AssetType[];
const LOCATIONS = Array.from(new Set(agents.map((a) => a.location.split(",").pop()!.trim())));

export default function AgentsPage() {
  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState<AssetType | "all">("all");
  const [location, setLocation] = useState<string>("all");
  const [minRating, setMinRating] = useState(0);

  const filtered = useMemo(() => {
    return agents.filter((agent) => {
      const matchesQuery =
        query.trim() === "" ||
        agent.name.toLowerCase().includes(query.toLowerCase()) ||
        agent.location.toLowerCase().includes(query.toLowerCase());
      const matchesSpecialty =
        specialty === "all" || agent.specialties.includes(specialty);
      const matchesLocation =
        location === "all" || agent.location.endsWith(location);
      const matchesRating = agent.rating >= minRating;
      return matchesQuery && matchesSpecialty && matchesLocation && matchesRating;
    });
  }, [query, specialty, location, minRating]);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14">
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
            onChange={(e) => setQuery(e.target.value)}
            className="w-full py-2 text-sm outline-none placeholder:text-ink-400"
          />
        </div>
        <select
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value as AssetType | "all")}
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
          onChange={(e) => setLocation(e.target.value)}
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
          onChange={(e) => setMinRating(Number(e.target.value))}
          className="rounded-full bg-ink-50 px-4 py-2 text-sm text-ink-700 outline-none"
        >
          <option value={0}>Any rating</option>
          <option value={4.5}>4.5+ rating</option>
          <option value={4.8}>4.8+ rating</option>
        </select>
      </div>

      <p className="mt-4 text-sm text-ink-500">
        {filtered.length} agent{filtered.length === 1 ? "" : "s"} found
      </p>

      <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((agent) => (
          <Link
            key={agent.id}
            href={`/agents/${agent.id}`}
            className="rounded-2xl bg-white shadow-soft p-6 hover:shadow-soft-lg transition-shadow"
          >
            <div className="flex items-center gap-3">
              <Avatar initials={agent.initials} hue={agent.avatarHue} size="lg" />
              <div className="min-w-0">
                <h3 className="font-semibold text-ink-900 truncate">{agent.name}</h3>
                <p className="text-sm text-ink-500 truncate">{agent.location}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <VerifiedBadge size="sm" />
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
        {filtered.length === 0 && (
          <p className="col-span-full text-sm text-ink-500 py-10 text-center">
            No agents match those filters yet.
          </p>
        )}
      </div>
    </div>
  );
}
