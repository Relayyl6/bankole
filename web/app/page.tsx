import Link from "next/link";
import Image from "next/image";
import {
  Activity,
  ArrowRight,
  Camera,
  Check,
  Clock,
  Eye,
  FolderKanban,
  Globe,
  LifeBuoy,
  Lock,
  MapPin,
  MessagesSquare,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { surveyQuotes } from "@/lib/mock-data";
import Avatar from "@/components/avatar";

const PROBLEMS = [
  {
    letter: "A",
    icon: ShieldCheck,
    title: "Trust",
    body: "Diaspora senders cannot verify that the person or team managing their project on the ground is legitimate, competent, or still working in their interest once funds are sent.",
  },
  {
    letter: "B",
    icon: MessagesSquare,
    title: "Fragmentation",
    body: "Coordination happens across scattered, informal channels: phone calls, WhatsApp, bank transfers, with no single record either side can rely on.",
  },
  {
    letter: "C",
    icon: Eye,
    title: "Visibility",
    body: "Once money is sent, the sender has no independent, real-time view of whether it was used as agreed, or whether progress reported is progress made.",
  },
  {
    letter: "D",
    icon: LifeBuoy,
    title: "Recourse",
    body: "When funds are diverted, work stalls, or claims turn out false, the sender, often thousands of miles away, has no practical way to intervene or recover the loss.",
  },
];

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Verified agent & contractor profiles",
    body: "Every professional is identity-checked, credential-checked, and rated by past diaspora clients before they can take on a project.",
    solves: "Solves: Trust",
  },
  {
    icon: FolderKanban,
    title: "Shared project workspace",
    body: "One space per project holding the agreed scope, budget, documents, and communication history, replacing scattered calls and WhatsApp threads.",
    solves: "Solves: Fragmentation",
  },
  {
    icon: Lock,
    title: "Milestone-based escrow",
    body: "Funds are held on the platform and released only as each agreed stage is confirmed, not handed over in large, unsupervised chunks.",
    solves: "Solves: Trust, Recourse",
  },
  {
    icon: Camera,
    title: "Independent progress proof",
    body: "Geo-tagged photos, video walkthroughs, and timestamps confirm real-world progress before funds move.",
    solves: "Solves: Visibility",
  },
  {
    icon: Activity,
    title: "Live status tracking",
    body: "Both sender and agent see the same real-time view of budget spent, stage reached, and outstanding actions.",
    solves: "Solves: Visibility, Fragmentation",
  },
];

const STEPS = [
  { step: "1", title: "Fund the project", body: "Set the scope, budget, and milestone plan, then fund escrow. The platform holds it, not the agent." },
  { step: "2", title: "Agent shows proof", body: "At each stage, your verified agent submits geo-tagged photos or video walkthroughs of real progress." },
  { step: "3", title: "You review, live", body: "You see the same real-time view as your agent: budget spent, stage reached, proof submitted." },
  { step: "4", title: "Approve, funds release", body: "Approve the stage and escrow releases automatically. Flag a concern instead, and funds stay held." },
];

const HERO_POINTS = [
  "Funds sit in escrow, released stage by stage",
  "Every release backed by geo-tagged proof",
  "Agents identity- and credential-verified",
  "One shared record for sender and builder",
];

const HERO_STAGES = [
  { stage: "Site survey & foundation", state: "Funds released", done: true },
  { stage: "Block work to lintel level", state: "Funds released", done: true },
  { stage: "Roofing & structural finishing", state: "Awaiting your review", done: false },
];

const REVENUE = [
  {
    icon: Wallet,
    title: "Milestone escrow fee",
    body: "A small service fee on each milestone released. We only earn when verified work is actually delivered, so our incentives sit with the sender.",
  },
  {
    icon: ShieldCheck,
    title: "Agent verification & listing",
    body: "Agents pay for identity and credential verification, then a listing subscription once the marketplace is live. Verified status is the asset they buy.",
  },
  {
    icon: TrendingUp,
    title: "Premium assurance add-ons",
    body: "Independent site inspections, land title checks, and insurance partnerships offered as paid add-ons on higher-value projects.",
  },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-50 to-background"
          aria-hidden
        />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-14 pb-20 sm:pt-20 sm:pb-28">
          <div className="grid gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-ink-900 text-balance">
                Fund what matters back home.{" "}
                <span className="text-brand-600">Know, not hope,</span> it&apos;s
                working.
              </h1>
              <p className="mt-5 text-lg text-ink-500 text-pretty">
                Bankole is a verified, milestone-based platform that lets diaspora
                Africans fund a house, shop, clinic, or community asset back home
                without needing to personally supervise it.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/projects/new"
                  className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft-lg hover:bg-brand-700 transition-colors"
                >
                  Start a project
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/agents"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink-800 shadow-soft hover:bg-ink-50 transition-colors"
                >
                  Browse verified agents
                </Link>
              </div>

              <ul className="mt-10 grid gap-3 sm:grid-cols-2">
                {HERO_POINTS.map((point) => (
                  <li key={point} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                    <span className="text-sm text-ink-600 text-pretty">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="w-full max-w-md mx-auto lg:max-w-none">
              <div className="overflow-hidden rounded-3xl bg-white shadow-soft-lg ring-1 ring-ink-100">
                <div className="relative aspect-[4/3]">
                  <Image
                    src="/images/modern-home.jpg"
                    alt="A finished modern home, the kind of build Bankole helps fund and verify"
                    fill
                    priority
                    sizes="(min-width: 1024px) 480px, (min-width: 640px) 448px, 100vw"
                    className="object-cover"
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-ink-900/85 via-ink-900/10 to-transparent"
                    aria-hidden
                  />
                  <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-ink-700 backdrop-blur">
                    Sample project
                  </span>
                  <div className="absolute inset-x-4 bottom-4">
                    <p className="font-semibold text-white">Adeyemi Family Home</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-white/80">
                      <MapPin className="size-3.5" />
                      Ajah, Lagos · 4-bedroom build
                    </p>
                  </div>
                </div>

                <div className="p-5">
                  <ol className="space-y-3">
                    {HERO_STAGES.map((s) => (
                      <li key={s.stage} className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${
                            s.done
                              ? "bg-mint-100 text-mint-500"
                              : "bg-amber-100 text-amber-500"
                          }`}
                        >
                          {s.done ? (
                            <Check className="size-3.5" strokeWidth={3} />
                          ) : (
                            <Clock className="size-3.5" strokeWidth={2.5} />
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-ink-900">
                            {s.stage}
                          </span>
                          <span
                            className={`block text-xs ${
                              s.done ? "text-ink-500" : "text-amber-500 font-medium"
                            }`}
                          >
                            {s.state}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ol>

                  <div className="mt-5 flex items-center gap-3 border-t border-ink-100 pt-4">
                    <span className="relative size-10 shrink-0 overflow-hidden rounded-full">
                      <Image
                        src="/images/hero-portrait.jpg"
                        alt="Adaeze Nwosu, verified Bankole agent"
                        fill
                        sizes="40px"
                        className="object-cover object-[center_20%]"
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-sm font-medium text-ink-900">
                        Adaeze Nwosu
                        <ShieldCheck
                          className="size-4 text-brand-600"
                          strokeWidth={2.5}
                        />
                      </p>
                      <p className="text-xs text-ink-500">
                        Verified agent · proof required before funds move
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-brand-700">The problem</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink-900 text-balance">
            It&apos;s not a housing problem. It&apos;s a trust gap.
          </h2>
          <p className="mt-4 text-ink-500 text-pretty">
            Diaspora Africans who want to raise infrastructure back home routinely
            lose money, time, and trust to a system with no independent
            verification layer. This shows up four consistent ways.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {PROBLEMS.map((p) => (
            <div key={p.letter} className="rounded-2xl bg-white shadow-soft p-6">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-ink-900 text-sm font-semibold text-white">
                  {p.letter}
                </span>
                <span className="flex size-9 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                  <p.icon className="size-4.5" strokeWidth={2} />
                </span>
              </div>
              <h3 className="mt-4 font-semibold text-ink-900">{p.title}</h3>
              <p className="mt-2 text-sm text-ink-500 text-pretty">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Solution */}
      <section className="bg-ink-900 text-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-brand-300">The solution</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance">
              The trust layer between sender and builder.
            </h2>
            <p className="mt-4 text-ink-300 text-pretty">
              Escrow is not the product. It&apos;s the mechanism. The product is
              your confidence that money sent from thousands of miles away is
              doing exactly what it was sent to do.
            </p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl bg-white/5 border border-white/10 p-6"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-brand-500/20 text-brand-300">
                  <f.icon className="size-5" strokeWidth={2} />
                </span>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-ink-300 text-pretty">{f.body}</p>
                <p className="mt-3 text-xs font-medium text-brand-300">
                  {f.solves}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-brand-700">How escrow works</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink-900 text-balance">
            Four steps between your money and a finished build.
          </h2>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, idx) => (
            <div key={s.step} className="relative">
              <div className="rounded-2xl bg-white shadow-soft p-6 h-full">
                <span className="text-3xl font-semibold text-brand-200">
                  {s.step}
                </span>
                <h3 className="mt-3 font-semibold text-ink-900">{s.title}</h3>
                <p className="mt-2 text-sm text-ink-500 text-pretty">{s.body}</p>
              </div>
              {idx < STEPS.length - 1 && (
                <ArrowRight className="hidden lg:block absolute top-1/2 -right-4 -translate-y-1/2 size-5 text-ink-300" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Real progress, real people */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-brand-700">Real progress, real people</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink-900 text-balance">
            Behind every milestone is a person you can verify.
          </h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 sm:items-stretch">
          <div className="relative rounded-2xl overflow-hidden shadow-soft aspect-[4/3] sm:aspect-auto">
            <Image
              src="/images/family-portrait.jpg"
              alt="A diaspora family, the kind Bankole is built to serve"
              fill
              sizes="(min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-900/80 to-transparent p-5">
              <p className="text-white font-medium text-sm">
                Built for families like this one
              </p>
            </div>
          </div>
          <div className="rounded-2xl bg-white shadow-soft p-6">
            <p className="text-xs font-semibold text-brand-700">
              What a progress proof looks like
            </p>
            <div className="mt-4 rounded-xl border border-ink-100 p-4">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                  <Camera className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink-900">
                    Roof trusses installed, sheeting 60% complete
                  </p>
                  <p className="text-xs text-ink-500">
                    Photo proof · submitted from the site
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-ink-500">
                <p className="rounded-lg bg-ink-50 px-3 py-2">
                  Geo-tag: 6.4698° N, 3.5852° E
                </p>
                <p className="rounded-lg bg-ink-50 px-3 py-2">
                  Timestamp: 29 Jul, 10:14 am
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-ink-500 text-pretty">
              Every submission carries a location tag and timestamp the sender
              can check independently. The agent cannot release funds; only your
              approval can.
            </p>
          </div>
        </div>
      </section>

      {/* Business model & scalability */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
        <div className="rounded-3xl bg-white shadow-soft-lg p-8 sm:p-12">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-brand-700">
              The business · planned model, pre-launch
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-ink-900 text-balance">
              We earn when verified work is delivered. Not before.
            </h2>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {REVENUE.map((r) => (
              <div
                key={r.title}
                className="rounded-2xl border border-ink-100 p-5"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <r.icon className="size-5" strokeWidth={2} />
                </span>
                <h3 className="mt-4 font-semibold text-ink-900">{r.title}</h3>
                <p className="mt-2 text-sm text-ink-500 text-pretty">{r.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div className="rounded-2xl bg-ink-50 p-5">
              <div className="flex items-center gap-2">
                <Globe className="size-4.5 text-brand-700" />
                <h3 className="font-semibold text-ink-900">How it scales</h3>
              </div>
              <p className="mt-2 text-sm text-ink-500 text-pretty">
                Prove one remittance corridor first, UK/US to Nigeria, with a
                hand-vetted agent cohort. Then repeat the same playbook corridor
                by corridor: Ghana, Senegal, Kenya. The verification and escrow
                engine stays the same; only the local agent network is new.
              </p>
            </div>
            <div className="rounded-2xl bg-ink-50 p-5">
              <div className="flex items-center gap-2">
                <Activity className="size-4.5 text-brand-700" />
                <h3 className="font-semibold text-ink-900">Impact we&apos;ll measure</h3>
              </div>
              <p className="mt-2 text-sm text-ink-500 text-pretty">
                Share of funds released only against verified proof, project
                completion rate versus the informal baseline, and disputes
                resolved without the sender losing money. Honest metrics, tracked
                from day one.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Research quotes */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
        <div className="rounded-3xl bg-brand-700 text-white p-8 sm:p-12">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-brand-200">
              From our survey · 10 responses, August 2026
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-balance">
              We asked what people fear about sending money home.
            </h2>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {surveyQuotes.map((q) => (
              <div
                key={q.quote}
                className="rounded-2xl bg-white/10 border border-white/10 p-5"
              >
                <p className="text-sm text-white text-pretty">
                  &ldquo;{q.quote}&rdquo;
                </p>
                <p className="mt-4 text-xs text-brand-200">Survey respondent</p>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-3xl text-xs text-brand-200 text-pretty">
            Verbatim answers from ten people across Nigeria, Burkina Faso and the
            United States, collected August 2026. Roughly a third currently live
            abroad, so this is a directional signal from a small sample, not
            statistically significant research. Verified agent profiles were the
            most-requested feature, chosen by 6 of the 10.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-20 sm:pb-28">
        <div className="grid gap-10 rounded-3xl bg-white shadow-soft-lg p-8 sm:p-12 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="max-w-md">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink-900 text-balance">
              Depth before breadth. Trust before scale.
            </h2>
            <p className="mt-3 text-sm text-ink-500 text-pretty">
              We hand-vet every agent in the first cohort. Early trust is the
              product. Start with a verified agent and a milestone plan.
            </p>
            <Link
              href="/projects/new"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft hover:bg-brand-700 transition-colors"
            >
              Start a project
              <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="lg:text-right">
            <div className="flex items-center gap-3 lg:justify-end">
              <Avatar initials="AN" hue={262} />
              <Avatar initials="KO" hue={231} />
              <Avatar initials="MC" hue={292} />
              <Avatar initials="TB" hue={20} />
            </div>
            <p className="mt-3 text-xs text-ink-500">
              The first hand-vetted agent cohort
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
