import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BadgeCheck, Star } from "lucide-react";
import { ASSET_TYPE_LABEL, agents } from "@/lib/mock-data";
import Avatar from "@/components/avatar";
import VerifiedBadge from "@/components/verified-badge";

export default async function AgentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agent = agents.find((a) => a.id === id);
  if (!agent) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-14">
      <div className="rounded-3xl bg-white shadow-soft p-6 sm:p-10">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <Avatar initials={agent.initials} hue={agent.avatarHue} size="lg" />
            <div>
              <h1 className="text-2xl font-semibold text-ink-900">{agent.name}</h1>
              <p className="text-sm text-ink-500">{agent.location}</p>
              <div className="mt-2 flex items-center gap-3">
                <VerifiedBadge />
                <span className="inline-flex items-center gap-1 text-sm font-medium text-ink-900">
                  <Star className="size-4 text-amber-500" fill="currentColor" strokeWidth={0} />
                  {agent.rating.toFixed(2)}
                  <span className="text-ink-400 font-normal">
                    ({agent.reviewCount} reviews)
                  </span>
                </span>
              </div>
            </div>
          </div>
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft hover:bg-brand-700 transition-colors"
          >
            Start a project with {agent.name.split(" ")[0]}
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <p className="mt-6 text-ink-600 max-w-2xl">{agent.bio}</p>

        <div className="mt-6 flex flex-wrap gap-1.5">
          {agent.specialties.map((s) => (
            <span
              key={s}
              className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700"
            >
              {ASSET_TYPE_LABEL[s]}
            </span>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            [String(agent.completedProjects), "Completed projects"],
            [`${agent.yearsExperience} yrs`, "Experience"],
            [agent.rating.toFixed(1), "Average rating"],
            [String(agent.reviewCount), "Client reviews"],
          ].map(([value, label]) => (
            <div key={label} className="rounded-2xl bg-ink-50 p-4">
              <p className="text-xl font-semibold text-ink-900">{value}</p>
              <p className="mt-1 text-xs text-ink-500">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold text-ink-900">
            Verification &amp; credentials
          </h2>
          <ul className="mt-4 space-y-3">
            {agent.credentials.map((c) => (
              <li
                key={c}
                className="flex items-start gap-3 rounded-xl bg-white shadow-soft p-4"
              >
                <BadgeCheck className="size-5 shrink-0 text-mint-500" strokeWidth={2} />
                <span className="text-sm text-ink-700">{c}</span>
              </li>
            ))}
          </ul>

          <h2 className="mt-8 text-lg font-semibold text-ink-900">
            What clients say
          </h2>
          <div className="mt-4 space-y-3">
            {agent.reviews.map((r) => (
              <div key={r.author} className="rounded-xl bg-white shadow-soft p-4">
                <div className="flex gap-0.5 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="size-3.5"
                      fill={i < r.rating ? "currentColor" : "none"}
                      strokeWidth={i < r.rating ? 0 : 1.5}
                    />
                  ))}
                </div>
                <p className="mt-2 text-sm text-ink-700">&ldquo;{r.quote}&rdquo;</p>
                <p className="mt-2 text-xs text-ink-400">{r.author}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-ink-900">Portfolio</h2>
          <div className="mt-4 space-y-3">
            {agent.portfolio.map((p) => (
              <div key={p.title} className="rounded-xl bg-white shadow-soft p-4">
                <p className="text-xs font-medium text-brand-700">
                  {ASSET_TYPE_LABEL[p.assetType]}
                </p>
                <h3 className="mt-1 font-semibold text-ink-900">{p.title}</h3>
                <p className="text-sm text-ink-500">{p.location}</p>
                <p className="mt-2 text-sm text-ink-600">{p.summary}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
