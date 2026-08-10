"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { 
  HelpCircle, ChevronRight, Mail, MessageSquare, 
  Send, Paperclip, Clock, CheckCircle2, AlertCircle 
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function HelpSupportPage() {
  const { role } = useAuth();
  const [showAttach, setShowAttach] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const form = e.target as HTMLFormElement;
    const subject = (form.elements[0] as HTMLInputElement).value;
    const category = (form.elements[1] as HTMLSelectElement).value;
    const priority = (form.elements[2] as HTMLSelectElement).value;
    const description = (form.elements[3] as HTMLTextAreaElement).value;

    try {
      const res = await fetch("/api/help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, category, priority, description }),
      });

      const data = await res.json();
      
      if (res.ok) {
        toast.success(data.message);
        form.reset();
        setShowAttach(false);
      } else {
        toast.error(data.message || "Something went wrong.");
      }
    } catch (error) {
      toast.error("Failed to submit ticket. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 lg:p-10 font-sans" style={{ color: "var(--color-body)" }}>
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-8"
      >
        <div className="p-3 bg-brand-100 rounded-2xl">
          <HelpCircle className="size-8 text-brand-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Help & Support</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-mute)" }}>
            Need assistance? We're here to help you resolve any issues.
          </p>
        </div>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        {/* Main Content - Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* File a Ticket Form */}
          <motion.section variants={itemVariants} className="rounded-xl p-6 sm:p-8 border shadow-sm" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-hairline)' }}>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <MessageSquare className="size-5 text-brand-500" />
              File a new ticket
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold mb-2">Subject</label>
                <input 
                  type="text" 
                  required
                  placeholder="Briefly describe the issue..."
                  className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                  style={{ background: 'var(--color-canvas)', borderColor: 'var(--color-hairline)' }}
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold mb-2">Category</label>
                  <select 
                    required
                    className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all appearance-none bg-no-repeat"
                    style={{ 
                      background: 'var(--color-canvas)', 
                      borderColor: 'var(--color-hairline)',
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundSize: '1.5em 1.5em'
                    }}
                  >
                    <option value="">Select a category</option>
                    <option value="general">General inquiry</option>
                    <option value="milestone">Milestone dispute</option>
                    <option value="agent">Agent complaint</option>
                    <option value="payment">Payment issue</option>
                    <option value="technical">Technical problem</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Priority</label>
                  <select 
                    required
                    className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all appearance-none"
                    style={{ 
                      background: 'var(--color-canvas)', 
                      borderColor: 'var(--color-hairline)',
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundSize: '1.5em 1.5em'
                    }}
                  >
                    <option value="low">Low</option>
                    <option value="normal" selected>Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Description</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Please provide as much detail as possible..."
                  className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all resize-none"
                  style={{ background: 'var(--color-canvas)', borderColor: 'var(--color-hairline)' }}
                ></textarea>
              </div>

              {showAttach && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="pt-2"
                >
                  <label className="block text-sm font-bold mb-2">Attachments (Optional)</label>
                  <input 
                    type="file" 
                    multiple
                    className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 transition-colors"
                  />
                </motion.div>
              )}

              <div className="flex items-center justify-between pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowAttach(!showAttach)}
                  className="flex items-center gap-2 text-sm font-medium hover:text-brand-600 transition-colors"
                  style={{ color: "var(--color-mute)" }}
                >
                  <Paperclip className="size-4" />
                  {showAttach ? "Remove attachment" : "Attach evidence"}
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  Submit Ticket
                </button>
              </div>
            </form>
          </motion.section>

          {/* Open Tickets */}
          <motion.section variants={itemVariants}>
            <h2 className="text-xl font-bold mb-4 ml-2">My open tickets</h2>
            <div className="space-y-4">
              {/* Ticket 1 */}
              <div className="rounded-2xl p-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-md cursor-pointer" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-hairline)' }}>
                <div className="flex gap-4 items-start">
                  <div className="mt-1">
                    <Clock className="size-5 text-amber-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-xl bg-amber-100 text-amber-800">
                        In Review
                      </span>
                      <span className="text-xs font-medium" style={{ color: "var(--color-mute)" }}>#BK-0042</span>
                    </div>
                    <h3 className="font-bold text-base">Dispute regarding Phase 2 deliverable</h3>
                    <p className="text-xs mt-1" style={{ color: "var(--color-mute)" }}>Submitted 2 days ago</p>
                  </div>
                </div>
                <button className="text-sm font-bold px-4 py-2 rounded-2xl border hover:bg-black/5 transition-colors" style={{ borderColor: 'var(--color-hairline)' }}>
                  View
                </button>
              </div>

              {/* Ticket 2 */}
              <div className="rounded-2xl p-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-md cursor-pointer" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-hairline)' }}>
                <div className="flex gap-4 items-start">
                  <div className="mt-1">
                    <AlertCircle className="size-5 text-blue-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-xl bg-blue-100 text-blue-800">
                        Awaiting Response
                      </span>
                      <span className="text-xs font-medium" style={{ color: "var(--color-mute)" }}>#BK-0038</span>
                    </div>
                    <h3 className="font-bold text-base">Payment processing delay</h3>
                    <p className="text-xs mt-1" style={{ color: "var(--color-mute)" }}>Submitted 5 days ago</p>
                  </div>
                </div>
                <button className="text-sm font-bold px-4 py-2 rounded-2xl border hover:bg-black/5 transition-colors" style={{ borderColor: 'var(--color-hairline)' }}>
                  View
                </button>
              </div>
              
              {/* Ticket 3 */}
              <div className="rounded-2xl p-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 opacity-75" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-hairline)' }}>
                <div className="flex gap-4 items-start">
                  <div className="mt-1">
                    <CheckCircle2 className="size-5 text-emerald-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-xl bg-emerald-100 text-emerald-800">
                        Resolved
                      </span>
                      <span className="text-xs font-medium" style={{ color: "var(--color-mute)" }}>#BK-0021</span>
                    </div>
                    <h3 className="font-bold text-base line-through opacity-80">Profile verification documents missing</h3>
                    <p className="text-xs mt-1" style={{ color: "var(--color-mute)" }}>Resolved on Oct 12, 2025</p>
                  </div>
                </div>
                <button className="text-sm font-bold px-4 py-2 rounded-2xl border hover:bg-black/5 transition-colors" style={{ borderColor: 'var(--color-hairline)' }}>
                  View
                </button>
              </div>
            </div>
          </motion.section>
        </div>

        {/* Sidebar - Right Column (1/3) */}
        <div className="space-y-8">
          
          {/* Knowledge Base */}
          <motion.section variants={itemVariants} className="rounded-xl p-6 border shadow-sm" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-hairline)' }}>
            <h2 className="text-lg font-bold mb-4">Knowledge Base</h2>
            <div className="space-y-2">
              {[
                "How does milestone escrow work?",
                "Disputing proof of work",
                "Agent background check process",
                "Refund and fund recovery policy",
                "How to flag a concern"
              ].map((title, i) => (
                <Link 
                  key={i}
                  href="#"
                  className="group flex items-center justify-between p-3 rounded-xl hover:bg-black/5 transition-colors"
                >
                  <span className="text-sm font-medium pr-4">{title}</span>
                  <ChevronRight className="size-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0" />
                </Link>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-hairline)' }}>
              <Link href="#" className="text-sm font-bold text-brand-600 hover:text-brand-700 transition-colors">
                View all articles &rarr;
              </Link>
            </div>
          </motion.section>

          {/* Contact Support Directly */}
          <motion.section variants={itemVariants} className="rounded-xl p-6 border shadow-sm bg-gradient-to-br from-brand-900 to-brand-950 text-white border-transparent">
            <h2 className="text-lg font-bold mb-4 text-brand-50">Contact support directly</h2>
            <p className="text-sm text-brand-200 mb-6 leading-relaxed">
              Can't find what you're looking for? Our support team is here to help you {role === 'agent' ? 'with your assignments' : 'manage your projects'}.
            </p>
            
            <div className="space-y-4">
              <a href="mailto:support@bankole.com" className="flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
                <Mail className="size-5 text-brand-200" />
                <div>
                  <div className="text-xs text-brand-300 font-medium">Email us</div>
                  <div className="text-sm font-bold">support@bankole.com</div>
                </div>
              </a>
              
              <a href="https://wa.me/234800BANKOLE" target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 transition-colors">
                <MessageSquare className="size-5 text-green-300" />
                <div>
                  <div className="text-xs text-green-200 font-medium">WhatsApp</div>
                  <div className="text-sm font-bold">+234 800 BANKOLE</div>
                </div>
              </a>
            </div>
            
            <div className="mt-6 flex items-center gap-2 text-xs text-brand-300 font-medium justify-center bg-black/20 py-2 rounded-2xl">
              <Clock className="size-3" />
              Response time: within 24 hours
            </div>
          </motion.section>

        </div>
      </motion.div>
    </div>
  );
}
