"use client";

import { motion } from "framer-motion";

export default function SurveyCharts() {
  return (
    <div className="grid lg:grid-cols-2 gap-16 items-center w-full max-w-6xl mx-auto mt-20">
      
      {/* Chart 1: Donut Chart - Fund Diversion */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7 }}
        className="bg-ink-800/50 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-10 flex flex-col sm:flex-row items-center gap-10 hover:bg-ink-800/80 transition-colors"
      >
        <div className="relative size-40 shrink-0">
          <svg viewBox="0 0 100 100" className="-rotate-90 w-full h-full">
            <circle cx="50" cy="50" r="40" className="stroke-white/10" strokeWidth="12" fill="none" />
            <motion.circle 
              cx="50" cy="50" r="40" 
              className="stroke-brand-500" 
              strokeWidth="12" fill="none"
              strokeDasharray="251.2"
              initial={{ strokeDashoffset: 251.2 }}
              whileInView={{ strokeDashoffset: 251.2 * (1 - 0.85) }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span 
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 1.2 }}
              className="text-4xl font-black text-white"
            >
              85%
            </motion.span>
          </div>
        </div>
        <div className="text-center sm:text-left">
          <h4 className="text-2xl font-bold text-white mb-3">Fund Diversion</h4>
          <p className="text-ink-400 text-lg leading-relaxed">
            of diaspora senders reported that funds were used for purposes other than what was agreed upon.
          </p>
        </div>
      </motion.div>

      {/* Chart 2: Bar Chart - Top Fears */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="bg-ink-800/50 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-10 hover:bg-ink-800/80 transition-colors"
      >
        <h4 className="text-2xl font-bold text-white mb-8">Top Concerns</h4>
        <div className="space-y-6">
          {[
            { label: "Fraud & Theft", value: 65, color: "bg-rose-500" },
            { label: "Substandard Quality", value: 45, color: "bg-amber-500" },
            { label: "Extreme Delays", value: 30, color: "bg-brand-500" },
          ].map((item, idx) => (
            <div key={item.label}>
              <div className="flex justify-between text-sm font-bold text-ink-300 mb-2">
                <span>{item.label}</span>
                <span>{item.value}%</span>
              </div>
              <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: `${item.value}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.6 + (idx * 0.2), ease: "easeOut" }}
                  className={`h-full rounded-full ${item.color}`}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

    </div>
  );
}
