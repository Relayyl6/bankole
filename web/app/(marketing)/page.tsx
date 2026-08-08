import Link from "next/link";
import Image from "next/image";
import AnimatedSection from "@/components/animated-section";
import EscrowSteps from "@/components/escrow-steps";
import SurveyCharts from "@/components/survey-charts";
import LandingHero from "@/components/landing-hero";
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
import { surveyQuotes } from "@/lib/models";
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
    <div className="pb-20">
      {/* Hero Section */}
      <LandingHero />

      {/* Problem */}
      <AnimatedSection>
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-24 lg:py-40">
          <div className="grid lg:grid-cols-12 gap-16 lg:gap-24 items-start">
            
            {/* Sticky Left: Headline */}
            <div className="lg:col-span-5 lg:sticky lg:top-40">
              <p className="text-sm font-bold tracking-widest uppercase text-brand-600">The Problem</p>
              <h2 className="mt-6 text-5xl sm:text-6xl font-bold tracking-tight text-ink-900 leading-[1.1] text-balance">
                It&apos;s not a housing problem. <br/> It&apos;s a trust gap.
              </h2>
              <p className="mt-8 text-xl text-ink-600 text-pretty">
                Diaspora Africans who want to raise infrastructure back home routinely
                lose money, time, and trust to a system with no independent
                verification layer.
              </p>
            </div>

            {/* Scrolling Right: Problem Cards */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {PROBLEMS.map((p) => (
                <div key={p.letter} className="group flex flex-col sm:flex-row gap-6 lg:gap-8 rounded-[2.5rem] p-8 lg:p-10 hover:bg-white hover:shadow-soft-xl transition-all duration-500 border border-transparent hover:border-ink-100/60 relative overflow-hidden">
                  
                  {/* Subtle hover gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  <div className="relative z-10 flex flex-row sm:flex-col gap-4 shrink-0">
                     <span className="flex size-14 items-center justify-center rounded-lg bg-ink-900 text-xl font-black text-white shadow-soft group-hover:scale-110 group-hover:bg-brand-600 transition-all duration-300">
                        {p.letter}
                      </span>
                      <span className="flex size-14 items-center justify-center rounded-lg bg-white text-brand-600 shadow-sm border border-ink-100/50">
                        <p.icon className="size-7" strokeWidth={2} />
                      </span>
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-2xl font-bold text-ink-900 sm:mt-1">{p.title}</h3>
                    <p className="mt-4 text-lg text-ink-600 leading-relaxed text-pretty">{p.body}</p>
                  </div>
                </div>
              ))}
            </div>
            
          </div>
        </section>
      </AnimatedSection>

      {/* Solution */}
      <AnimatedSection delay={0.1}>
        <section className="relative bg-ink-900 text-white py-32 overflow-hidden mt-20">
          {/* Abstract glowing layers in background to represent "The Trust Layer" */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[600px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-900/40 via-ink-900 to-ink-900 opacity-70 pointer-events-none" />
          <div className="absolute top-1/4 right-0 w-96 h-96 bg-brand-600/20 blur-[128px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-600/20 blur-[128px] rounded-full pointer-events-none" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-24">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-brand-500/10 text-brand-400 text-sm font-bold tracking-widest uppercase mb-6 ring-1 ring-brand-500/20">
                <ShieldCheck className="size-4" /> The Solution
              </span>
              <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-balance leading-[1.1] bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
                The trust layer between sender and builder.
              </h2>
              <p className="mt-8 text-xl text-ink-300 text-pretty font-medium">
                Escrow is not the product. It&apos;s the mechanism. The product is
                your confidence that money sent from thousands of miles away is
                doing exactly what it was sent to do.
              </p>
            </div>

            {/* Creative Features Layout: A dynamic, interactive feeling diagram/flow rather than a grid */}
            <div className="relative max-w-5xl mx-auto">
              {/* Connecting vertical line (The "Layer") */}
              <div className="absolute left-6 sm:left-1/2 top-8 bottom-8 w-px bg-gradient-to-b from-brand-500/0 via-brand-500/30 to-brand-500/0 sm:-translate-x-1/2 md:block" />
              
              <div className="space-y-16 sm:space-y-24">
                {FEATURES.map((f, idx) => (
                  <div key={f.title} className={`relative flex flex-col sm:flex-row items-start sm:items-center gap-8 sm:gap-16 ${idx % 2 === 0 ? 'sm:flex-row-reverse' : ''} group`}>
                    
                    {/* Center Node */}
                    <div className="absolute left-6 sm:left-1/2 top-6 sm:top-1/2 -translate-x-1/2 -translate-y-1/2 size-12 flex items-center justify-center z-10">
                       <div className="absolute inset-0 bg-brand-500/20 rounded-full blur-md group-hover:bg-brand-400/40 group-hover:blur-xl transition-all duration-500" />
                       <div className="relative size-3 sm:size-4 bg-brand-500 rounded-full ring-4 ring-ink-900 group-hover:scale-150 transition-transform duration-500" />
                    </div>

                    {/* Content Half */}
                    <div className={`flex-1 w-full sm:w-1/2 pl-16 sm:pl-0 ${idx % 2 === 0 ? 'sm:pl-16' : 'sm:pr-16 sm:text-right'} flex flex-col ${idx % 2 === 0 ? 'items-start' : 'items-start sm:items-end'}`}>
                      <span className="flex size-14 sm:size-16 items-center justify-center rounded-lg bg-white/5 text-brand-400 mb-6 group-hover:-translate-y-2 group-hover:bg-brand-500/10 group-hover:text-brand-300 transition-all duration-500 ring-1 ring-white/10 group-hover:ring-brand-500/30">
                        <f.icon className="size-7 sm:size-8" strokeWidth={1.5} />
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4 group-hover:text-brand-300 transition-colors duration-300">{f.title}</h3>
                      <p className="text-lg text-ink-300 leading-relaxed text-pretty mb-6">
                        {f.body}
                      </p>
                      <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-md bg-white/5 border border-white/10 text-xs font-bold tracking-widest text-brand-400/80 uppercase group-hover:border-brand-500/30 group-hover:text-brand-400 transition-colors duration-300`}>
                        {f.solves}
                      </div>
                    </div>

                    {/* Empty Space for the other half on desktop */}
                    <div className="hidden sm:block flex-1" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* How it works */}
      <AnimatedSection>
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-24">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-sm font-bold tracking-widest uppercase text-brand-700">How Escrow Works</p>
            <h2 className="mt-4 text-4xl sm:text-5xl font-semibold tracking-tight text-ink-900 text-balance">
              Four steps between your money and a finished build.
            </h2>
          </div>
          <EscrowSteps steps={STEPS} />
        </section>
      </AnimatedSection>

      {/* Real progress, real people */}
      <AnimatedSection>
        <section className="relative overflow-hidden py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="lg:w-[48%] lg:pr-16 relative z-10">
              <p className="text-sm font-bold tracking-widest uppercase text-brand-600">Verification</p>
              <h2 className="mt-6 text-4xl sm:text-5xl font-bold tracking-tight text-ink-900 text-balance leading-[1.1]">
                Behind every milestone is a person you can verify.
              </h2>
              <p className="mt-8 text-xl text-ink-600 text-pretty">
                Every submission carries a location tag and timestamp the sender
                can check independently. The agent cannot release funds; only your
                approval can.
              </p>
              
              <div className="mt-12 rounded-[2.5rem] bg-white shadow-soft-xl border border-ink-100 p-8 sm:p-10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none text-ink-900 group-hover:scale-110 group-hover:opacity-[0.05] transition-all duration-500">
                   <ShieldCheck className="size-48 rotate-12" strokeWidth={1} />
                </div>
                <div className="relative z-10">
                  <p className="text-sm font-bold tracking-widest uppercase text-brand-600">
                    Progress Proof Example
                  </p>
                  <div className="mt-8 flex items-start gap-4">
                    <span className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 shadow-sm border border-ink-100/50">
                      <Camera className="size-7" />
                    </span>
                    <div>
                      <p className="text-xl sm:text-2xl font-bold text-ink-900 mt-1">
                        Roof trusses installed
                      </p>
                      <p className="mt-2 text-lg text-ink-500">
                        Sheeting 60% complete · submitted from site
                      </p>
                    </div>
                  </div>
                  <div className="mt-8 flex flex-wrap gap-4">
                    <span className="inline-flex items-center gap-2 rounded-full bg-ink-50 px-5 py-2.5 text-sm font-bold text-ink-700 shadow-sm">
                      <MapPin className="size-4 text-brand-600" /> 6.4698° N, 3.5852° E
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-ink-50 px-5 py-2.5 text-sm font-bold text-ink-700 shadow-sm">
                      <Clock className="size-4 text-brand-600" /> 29 Jul, 10:14 am
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Edge-to-edge image on large screens */}
          <div className="relative mt-16 h-[24rem] sm:h-[32rem] lg:mt-0 lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 ml-4 sm:ml-6 lg:ml-0 z-10">
            <div className="absolute inset-0 rounded-l-[2.5rem] lg:rounded-l-[3rem] overflow-hidden shadow-2xl group">
              <Image
                src="/images/family-portrait.jpg"
                alt="A diaspora family, the kind Bankole is built to serve"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-900/90 via-ink-900/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-8 sm:p-12 lg:p-16">
                <h3 className="text-3xl sm:text-4xl font-bold text-white">Built for families like this one</h3>
                <p className="mt-4 text-lg sm:text-xl text-white/80">Securing futures back home with verified trust.</p>
              </div>
            </div>

            {/* Floating Image 1: Scaffolding */}
            <div 
              className="absolute top-8 sm:top-12 -left-6 sm:-left-16 w-32 sm:w-48 h-24 sm:h-36 rounded-lg overflow-hidden shadow-2xl border-4 border-white z-20 hover:-translate-y-2 hover:rotate-3 transition-all duration-500"
            >
              <Image src="/images/construction-scaffolding.jpg" alt="Construction scaffolding" fill className="object-cover" />
            </div>

            {/* Floating Image 2: Workers */}
            <div 
              className="absolute top-1/3 right-4 sm:right-12 w-24 sm:w-32 h-24 sm:h-32 rounded-full overflow-hidden shadow-2xl border-4 border-white z-20 animate-[bounce_8s_infinite] hover:animate-none hover:scale-110 hover:-rotate-6 transition-all duration-500"
            >
              <Image src="/images/construction-workers.jpg" alt="Construction workers" fill className="object-cover" />
            </div>

            {/* Floating Image 3: Finished */}
            <div 
              className="absolute -bottom-16 sm:-bottom-36 left-8 sm:left-12 w-28 sm:w-40 h-36 sm:h-48 rounded-lg overflow-hidden shadow-2xl border-4 border-white z-20 hover:-translate-y-4 hover:-rotate-3 transition-all duration-500"
            >
              <Image src="/images/construction-finished.jpg" alt="Finished property" fill className="object-cover" />
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Business model & scalability */}
      <AnimatedSection>
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-24 sm:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-sm font-bold tracking-widest uppercase text-brand-600">
              The business · pre-launch model
            </p>
            <h2 className="mt-6 text-4xl sm:text-5xl font-bold tracking-tight text-ink-900 text-balance leading-[1.1]">
              We earn when verified work is delivered. Not before.
            </h2>
          </div>
          
          <div className="mt-16 sm:mt-24 grid gap-8 sm:grid-cols-3">
            {REVENUE.map((r, idx) => (
              <div
                key={r.title}
                className={`relative rounded-[2.5rem] bg-white p-8 sm:p-10 shadow-soft border border-ink-100/50 hover:shadow-soft-xl hover:-translate-y-2 transition-all duration-500 ${idx === 1 ? 'sm:-mt-8 sm:mb-8 lg:-mt-12 lg:mb-12' : ''}`}
              >
                <div className="absolute top-0 right-0 p-6 opacity-[0.02] pointer-events-none text-ink-900">
                  <r.icon className="size-32" />
                </div>
                <span className="relative z-10 flex size-14 items-center justify-center rounded-lg bg-brand-50 text-brand-600 shadow-sm border border-ink-100/50">
                  <r.icon className="size-7" strokeWidth={2} />
                </span>
                <h3 className="relative z-10 mt-8 text-2xl font-bold text-ink-900">{r.title}</h3>
                <p className="relative z-10 mt-4 text-lg text-ink-600 leading-relaxed text-pretty">{r.body}</p>
              </div>
            ))}
          </div>
        </section>
      </AnimatedSection>

      {/* Research quotes */}
      <AnimatedSection>
        <section className="bg-ink-900 text-white py-24 sm:py-32 mt-16 relative overflow-hidden">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-600 to-transparent pointer-events-none" />
          <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10 text-center">
            <p className="text-sm font-bold tracking-widest uppercase text-brand-400">
              From our survey · August 2026
            </p>
            <h2 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-balance leading-[1.1]">
              We asked what people fear about <br className="hidden sm:block" /> sending money home.
            </h2>
            <div className="mt-16 sm:mt-24 grid gap-12 sm:gap-8 sm:grid-cols-3 text-left">
              {surveyQuotes.map((q) => (
                <div key={q.quote} className="relative group">
                  <span className="absolute -top-10 -left-6 text-9xl font-serif text-white/5 group-hover:text-brand-500/20 transition-colors duration-500 select-none">&ldquo;</span>
                  <p className="relative z-10 text-xl sm:text-2xl text-white/90 text-pretty leading-snug font-medium">
                    {q.quote}
                  </p>
                  <p className="relative z-10 mt-8 text-sm font-bold tracking-wide text-brand-400 uppercase">Survey respondent</p>
                </div>
              ))}
            </div>
            
            <SurveyCharts />
            
          </div>
        </section>
      </AnimatedSection>

      {/* CTA */}
      <AnimatedSection>
        <section className="py-24 sm:py-40 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-brand-50/50" />
          <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6">
            <h2 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter text-ink-900 text-balance leading-[0.9]">
              Depth before breadth. <br/> Trust before scale.
            </h2>
            <p className="mt-8 text-xl sm:text-2xl text-ink-600 max-w-2xl mx-auto text-pretty font-medium">
              Bankole is launching an invite-only pilot focusing exclusively on
              residential builds in Lagos, Nigeria.
            </p>
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/projects/new"
                className="rounded-full bg-brand-600 px-10 py-5 text-base font-bold text-white shadow-soft-xl hover:bg-brand-700 hover:-translate-y-1 transition-all duration-300"
              >
                JOIN THE WAITLIST
              </Link>
              <Link
                href="/agents/apply"
                className="rounded-full bg-white border border-ink-100 px-10 py-5 text-base font-bold text-ink-900 shadow-sm hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-300"
              >
                APPLY AS AN AGENT
              </Link>
            </div>
          </div>
        </section>
      </AnimatedSection>
    </div>
  );
}
