"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import { ArrowRight, X, ChevronDown } from "lucide-react";

interface Step {
  step: string;
  title: string;
  body: string;
}

function EscrowModal({
  steps,
  selectedId,
  onClose
}: {
  steps: Step[];
  selectedId: string;
  onClose: () => void;
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Track scroll within the modal
  const { scrollYProgress } = useScroll({
    container: scrollContainerRef,
  });

  // Map scroll progress to horizontal translation
  // We use [0, 0.9] so the last 10% of scroll is "pull to close"
  const x = useTransform(scrollYProgress, [0, 0.9], ["0%", "-75%"]);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest >= 0.99) {
      onClose();
    }
  });

  // Effect to automatically scroll to the right step when opened
  useEffect(() => {
    if (selectedId && scrollContainerRef.current) {
      const stepIndex = steps.findIndex(s => s.step === selectedId);
      if (stepIndex > 0) {
        // Calculate where to scroll based on the 400vh container height
        const progress = stepIndex * 0.3;
        const scrollHeight = scrollContainerRef.current.scrollHeight - scrollContainerRef.current.clientHeight;
        scrollContainerRef.current.scrollTo({
          top: scrollHeight * progress,
          behavior: 'instant'
        });
      }
    }
  }, [selectedId, steps]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#f6f8fa] flex flex-col"
    >
      {/* Header/Close Button */}
      <div className="fixed top-0 inset-x-0 z-20 p-6 flex justify-end items-center pointer-events-none">
        <button 
          onClick={onClose}
          className="pointer-events-auto flex items-center gap-2 px-6 py-3 rounded-full bg-white shadow-soft text-ink-900 font-bold hover:scale-105 hover:shadow-soft-xl transition-all border border-ink-100"
        >
          Back to landing page <X className="size-5" />
        </button>
      </div>

      {/* Scrolling Container */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden relative"
      >
        {/* Very tall container to allow scrolling */}
        <div className="h-[400vh]">
          {/* Sticky horizontal track */}
          <div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden">
            
            {/* Progress Indicator */}
            <div className="absolute top-8 left-0 right-0 z-10 hidden sm:flex justify-center">
              <div className="w-64 h-2 bg-ink-200 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-brand-500 rounded-full"
                  style={{ scaleX: scrollYProgress, originX: 0 }}
                />
              </div>
            </div>

            <motion.div style={{ x }} className="flex gap-8 w-[400%] px-[5vw] lg:px-[10vw]">
              {steps.map((s) => (
                <div 
                  key={s.step} 
                  className="w-[90vw] lg:w-[80vw] shrink-0"
                >
                  <motion.div 
                    layoutId={selectedId === s.step ? `card-${s.step}` : undefined}
                    className="flex flex-col lg:flex-row gap-12 rounded-[2.5rem] bg-white shadow-2xl border border-ink-100 p-10 lg:p-16 h-full max-h-[80vh] overflow-hidden"
                  >
                    {/* Text Side */}
                    <div className="flex-1 flex flex-col justify-center">
                      <motion.span 
                        layoutId={selectedId === s.step ? `number-${s.step}` : undefined}
                        className="text-7xl lg:text-9xl font-black text-brand-50 block mb-6"
                      >
                        {s.step}
                      </motion.span>
                      <motion.h3 
                        layoutId={selectedId === s.step ? `title-${s.step}` : undefined}
                        className="text-3xl lg:text-5xl font-bold text-ink-900"
                      >
                        {s.title}
                      </motion.h3>
                      <motion.p 
                        layoutId={selectedId === s.step ? `body-${s.step}` : undefined}
                        className="mt-6 text-xl lg:text-2xl text-ink-500 leading-relaxed text-pretty"
                      >
                        {s.body}
                      </motion.p>
                    </div>
                    
                    {/* Visual Side */}
                    <div className="flex-1 mt-10 lg:mt-0 rounded-xl bg-brand-50/50 border border-brand-100 p-6 flex items-center justify-center min-h-[200px] relative overflow-hidden group">
                       <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-100/50 to-transparent group-hover:scale-110 transition-transform duration-1000" />
                       <div className="relative z-10 text-center">
                         <p className="text-brand-600 font-bold tracking-widest uppercase text-sm mb-4">
                           Stage {s.step} Visualization
                         </p>
                         <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto text-brand-500">
                           <ArrowRight className="size-6" />
                         </div>
                       </div>
                    </div>
                  </motion.div>
                </div>
              ))}
            </motion.div>

            <motion.div 
              style={{ opacity: useTransform(scrollYProgress, [0.8, 0.95], [0, 1]) }}
              className="absolute bottom-8 left-0 right-0 z-10 flex flex-col items-center justify-center pointer-events-none"
            >
              <p className="text-sm font-bold text-ink-900 bg-white shadow-lg px-6 py-3 rounded-full border border-ink-100 flex items-center gap-2">
                Keep scrolling down to close <ChevronDown className="size-4 animate-bounce" />
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function EscrowSteps({ steps }: { steps: Step[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (selectedId) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedId]);

  return (
    <>
      {/* 1. Grid of 4 Cards on Landing Page */}
      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, idx) => (
          <div key={s.step} className="relative group cursor-pointer" onClick={() => setSelectedId(s.step)}>
            <motion.div 
              layoutId={`card-${s.step}`}
              className="rounded-xl bg-white shadow-sm border border-ink-100 p-8 h-full hover:shadow-soft-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <motion.span layoutId={`number-${s.step}`} className="text-5xl font-black text-brand-100 transition-colors inline-block">
                  {s.step}
                </motion.span>
                <motion.h3 layoutId={`title-${s.step}`} className="mt-6 text-xl font-bold text-ink-900">{s.title}</motion.h3>
                <motion.p layoutId={`body-${s.step}`} className="mt-3 text-ink-500 leading-relaxed text-pretty text-sm">{s.body}</motion.p>
              </div>
              
              <div className="mt-8 flex items-center gap-2 text-sm font-bold text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity">
                See stage details <ArrowRight className="size-4" />
              </div>
            </motion.div>
            
            {idx < steps.length - 1 && (
              <ArrowRight className="hidden lg:block absolute top-1/2 -right-6 -translate-y-1/2 size-6 text-ink-300 pointer-events-none z-10" />
            )}
          </div>
        ))}
      </div>

      {/* 2. Scrollable Modal View */}
      <AnimatePresence>
        {selectedId && (
          <EscrowModal 
            key="modal"
            steps={steps} 
            selectedId={selectedId} 
            onClose={() => setSelectedId(null)} 
          />
        )}
      </AnimatePresence>
    </>
  );
}
