"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Star, X, CheckCircle2, MessageSquare } from "lucide-react";
import { toast } from "react-toastify";
import { useNotifications } from "@/lib/notification-context";
import { apiClient } from "@/lib/api-client";

interface ReviewAgentModalProps {
  agentId: string;
  agentName: string;
  projectId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ReviewAgentModal({ agentId, agentName, projectId, onClose, onSuccess }: ReviewAgentModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [quote, setQuote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { addNotification } = useNotifications();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating.");
      return;
    }
    if (!quote.trim()) {
      toast.error("Please write a brief review.");
      return;
    }

    setSubmitting(true);
    
    try {
      await apiClient(`/agents/${agentId}/reviews`, {
        method: "POST",
        body: { quote, rating },
      });
      
      toast.success("Review submitted successfully!");
      
      // Global Notification Trigger
      addNotification({
        title: "Agent Review Published",
        desc: `You rated ${agentName} ${rating} stars for this project.`,
        type: "success",
        targetRole: "sender" // specific to the user who did the review
      });
      
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 sm:pt-14 md:pt-16 overflow-y-auto backdrop-blur-sm bg-ink-900/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 60, opacity: 0, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-ink-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-ink-900">Rate & Review Agent</h2>
            <p className="text-sm text-ink-500 mt-1">Leave feedback for {agentName}</p>
          </div>
          <button onClick={onClose} className="p-2 text-ink-400 hover:text-ink-900 hover:bg-ink-50 rounded-full transition-colors">
            <X className="size-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="text-center">
            <p className="text-sm font-bold text-ink-900 mb-3">How was your experience working with {agentName}?</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star 
                    className={`size-10 ${
                      (hoverRating || rating) >= star 
                        ? "fill-amber-400 text-amber-400" 
                        : "text-ink-200"
                    } transition-colors`} 
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-ink-400 mt-2 h-4">
              {rating === 1 && "Very Dissatisfied"}
              {rating === 2 && "Dissatisfied"}
              {rating === 3 && "Neutral"}
              {rating === 4 && "Satisfied"}
              {rating === 5 && "Extremely Satisfied"}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-ink-900 flex items-center gap-2">
              <MessageSquare className="size-4 text-ink-400" />
              Written Review (Quote)
            </label>
            <textarea
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              placeholder="Describe what went well or what could be improved..."
              rows={4}
              className="w-full rounded-xl border border-ink-200 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all resize-none shadow-sm"
            />
            <p className="text-xs text-ink-400 text-right">{quote.length}/500 chars</p>
          </div>
        </div>

        <div className="px-6 py-5 bg-ink-50 border-t border-ink-100 flex items-center justify-between">
          <p className="text-xs text-ink-500 max-w-[200px]">Reviews help maintain trust and quality in the Bankole community.</p>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 transition-colors disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
