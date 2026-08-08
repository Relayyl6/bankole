"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Lock,
  Camera,
  MapPin,
  ArrowRight,
  CheckCircle2,
  Eye,
  Layers,
  Sparkles,
  Building2,
  Check,
  Star,
  Clock,
  ArrowUpRight,
  Radio,
} from "lucide-react";

export default function LandingHero() {
  const [activeStage, setActiveStage] = useState(2); // 0-indexed: stage 3 is active review

  const stages = [
    { id: 0, label: "01 Foundation", state: "released", amount: "₦12.5M", proof: "GPS Verified" },
    { id: 1, label: "02 Blockwork", state: "released", amount: "₦16.0M", proof: "Drone Audited" },
    { id: 2, label: "03 Decking & Roof", state: "review", amount: "₦20.0M", proof: "Proof Ready" },
    { id: 3, label: "04 Finishing", state: "locked", amount: "₦14.0M", proof: "Escrow Held" },
  ];

  return (
    <section className="relative w-full overflow-hidden bg-[#FAF8F5] pt-8 sm:pt-14 pb-20 sm:pb-32">
      {/* Ambient background atmosphere - airy, generous whitespace */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[520px] bg-[radial-gradient(ellipse_at_top,_#ECE7DE_0%,transparent_70%)] opacity-80" />
        <div className="absolute top-1/3 left-0 w-80 h-80 bg-amber-100/40 rounded-full blur-3xl" />
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-brand-100/30 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Top Eyebrow Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-6 sm:mb-8"
        >
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/80 border border-[#E5E0D8] text-xs font-semibold text-ink-800 shadow-sm backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="tracking-wide uppercase text-[11px] font-bold text-ink-700">
              Milestone Escrow · Verified On-Ground Supervision
            </span>
          </div>
        </motion.div>

        {/* Main Editorial Headline (Inspired by References 2, 4 & 5) */}
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-serif sm:font-bold tracking-tight text-[#16171A] leading-[1.08] text-balance"
          >
            The calm precision of <br className="hidden sm:inline" />
            building back home.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 sm:mt-7 text-lg sm:text-xl text-[#585A60] leading-relaxed max-w-2xl mx-auto font-normal text-pretty"
          >
            Lock your construction capital in milestone-protected escrow. 
            COREN-vetted field agents submit geo-tagged site proof before a single Naira is released.
          </motion.p>

          {/* Unified Action Controls */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-9 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4"
          >
            <Link
              href="/projects/new"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#16171A] hover:bg-[#2C2E33] text-white px-8 py-4 text-sm font-bold tracking-wide transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5"
            >
              Start a project <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/agents"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-white hover:bg-[#F3EFEA] text-[#16171A] border border-[#E2DDD5] px-7 py-4 text-sm font-bold transition-all duration-300 shadow-sm"
            >
              Browse verified agents
            </Link>
          </motion.div>

          {/* Trust Guarantees Row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs font-semibold text-[#73757C]"
          >
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-emerald-600" />
              ₦2.4B Escrow Protected
            </span>
            <span className="hidden sm:inline text-[#D8D4CC]">·</span>
            <span className="flex items-center gap-1.5">
              <Camera className="size-4 text-brand-600" />
              Geo-Tagged Drone Proof
            </span>
            <span className="hidden sm:inline text-[#D8D4CC]">·</span>
            <span className="flex items-center gap-1.5">
              <Lock className="size-4 text-amber-600" />
              Zero Unsupervised Payouts
            </span>
            <span className="hidden sm:inline text-[#D8D4CC]">·</span>
            <span className="flex items-center gap-1.5">
              <Star className="size-3.5 text-amber-500 fill-amber-500" />
              COREN &amp; NIA Vetted
            </span>
          </motion.div>
        </div>

        {/* Panoramic Multi-Card Showcase (Inspired by References 2, 4 & 5) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
          className="mt-14 sm:mt-20 lg:mt-24 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch"
        >
          
          {/* Card 1 (Left - 4 Cols): Diaspora Experience & Supervision Insight */}
          <div className="lg:col-span-4 rounded-[2rem] bg-[#534F40] text-white p-7 sm:p-8 flex flex-col justify-between relative overflow-hidden shadow-lg group">
            {/* Subtle atmospheric gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/40 pointer-events-none" />
            
            <div className="relative z-10 space-y-6">
              {/* Reference 2 inspired gold pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/20 backdrop-blur-md">
                <span className="size-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-mono font-bold tracking-wide text-white">
                  ₦39,465,240
                </span>
                <span className="text-[10px] text-white/70 uppercase">Escrow Held</span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
                  Lekki Phase 1, <br />
                  Lagos
                </h3>
                <p className="mt-3 text-xs sm:text-sm text-white/75 leading-relaxed">
                  Direct diaspora supervision. Every milestone payment is released only when verified on-site photos match engineering blueprints.
                </p>
              </div>
            </div>

            {/* Inset supervisor snapshot card */}
            <div className="relative z-10 mt-8 pt-6 border-t border-white/15 bg-black/20 -mx-2 -mb-2 p-4 rounded-2xl backdrop-blur-sm">
              <div className="flex items-center gap-3.5">
                <div className="size-11 rounded-full bg-amber-500/20 border border-amber-400/30 flex items-center justify-center font-bold text-amber-300 text-sm shrink-0">
                  BO
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-white truncate">Engr. Babatunde O.</p>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                      VERIFIED
                    </span>
                  </div>
                  <p className="text-[11px] text-white/60 mt-0.5 truncate">COREN Certified Supervisor · 4.9 ★</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-white/75 bg-white/10 px-3 py-1.5 rounded-xl">
                <span className="flex items-center gap-1.5">
                  <Radio className="size-3 text-emerald-400 animate-pulse" />
                  Site audit logged today
                </span>
                <span className="font-mono text-white/60">14:20 WAT</span>
              </div>
            </div>
          </div>

          {/* Card 2 (Center - 5 Cols): Primary Architectural Focus */}
          <div className="lg:col-span-5 rounded-[2rem] overflow-hidden relative min-h-[420px] sm:min-h-[500px] shadow-xl group border border-[#E5E0D8]">
            <Image
              src="/images/hero-architecture.jpg"
              alt="Modern contemporary African villa"
              fill
              priority
              className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 pointer-events-none" />

            {/* Top Geo Badge */}
            <div className="absolute top-5 left-5 right-5 flex items-center justify-between pointer-events-none">
              <div className="inline-flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/20 px-3.5 py-1.5 rounded-full text-xs font-medium text-white shadow-md">
                <MapPin className="size-3.5 text-amber-400" />
                <span>6.4474° N, 3.4849° E</span>
              </div>
              <div className="inline-flex items-center gap-1.5 bg-emerald-950/80 backdrop-blur-md border border-emerald-500/30 px-3.5 py-1.5 rounded-full text-xs font-bold text-emerald-300 shadow-md">
                <ShieldCheck className="size-3.5 text-emerald-400" />
                <span>₦62.5M Total Project</span>
              </div>
            </div>

            {/* Bottom Floating Blueprint & Milestone Status Overlay */}
            <div className="absolute bottom-5 left-5 right-5 bg-white/95 backdrop-blur-md rounded-2xl p-5 shadow-2xl border border-white/40">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400">
                    Project Spec
                  </span>
                  <h4 className="text-lg font-bold text-ink-900 leading-tight">
                    480 m² · 5-Bed Villa
                  </h4>
                  <p className="text-xs text-ink-500 mt-0.5">Contemporary Coastal Design</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 text-[11px] font-bold border border-brand-100">
                  Phase 3 in progress
                </span>
              </div>

              {/* Interactive 4-stage progression pills */}
              <div className="grid grid-cols-4 gap-1.5 pt-3 border-t border-ink-100 text-center">
                {stages.map((stg) => (
                  <button
                    key={stg.id}
                    onClick={() => setActiveStage(stg.id)}
                    className={`py-1.5 px-1 rounded-xl transition-all ${
                      stg.id === activeStage
                        ? "bg-ink-900 text-white font-bold shadow-sm"
                        : stg.state === "released"
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold"
                        : "bg-ink-50 text-ink-400 hover:bg-ink-100 font-medium"
                    }`}
                  >
                    <p className="text-[10px] uppercase truncate">{stg.label.split(" ")[1]}</p>
                    <p className="text-[9px] opacity-80 truncate">{stg.amount}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Card 3 (Right - 3 Cols): Milestone & Inspection Verification Card */}
          <div className="lg:col-span-3 rounded-[2rem] bg-white border border-[#E5E0D8] p-7 sm:p-8 flex flex-col justify-between shadow-sm relative group">
            <div className="space-y-6">
              {/* Mini architectural thumbnail */}
              <div className="relative h-36 w-full rounded-2xl overflow-hidden shadow-inner">
                <Image
                  src="/images/modern-home.jpg"
                  alt="Finished Architectural Rendering"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <span className="absolute bottom-2.5 left-3 text-[10px] font-bold text-white uppercase tracking-wider bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm">
                  Blueprints #BK-842
                </span>
              </div>

              <div>
                <h4 className="font-bold text-ink-900 text-base">Stage 03 Verification</h4>
                <p className="text-xs text-ink-500 mt-1 leading-relaxed">
                  Decking &amp; structural concrete curing inspection submitted by on-ground engineer.
                </p>
              </div>

              {/* Audit Checklist */}
              <div className="space-y-2.5 pt-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50/70 px-3 py-2 rounded-xl">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                  <span className="font-medium">32 Geo-photos verified</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50/70 px-3 py-2 rounded-xl">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                  <span className="font-medium">Concrete slump test passed</span>
                </div>
                <div className="flex items-center gap-2 text-amber-800 bg-amber-50/70 px-3 py-2 rounded-xl">
                  <Clock className="size-4 shrink-0 text-amber-600" />
                  <span className="font-medium">Awaiting sender release</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-ink-100 flex items-center justify-between">
              <Link
                href="/projects/new"
                className="text-xs font-bold text-brand-700 hover:text-brand-800 flex items-center gap-1 group/link"
              >
                Post similar project
                <ArrowUpRight className="size-3.5 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
              </Link>
              <span className="text-[11px] font-mono text-ink-400">Phase 3/4</span>
            </div>
          </div>

        </motion.div>

      </div>
    </section>
  );
}
