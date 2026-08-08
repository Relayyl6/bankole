"use client";

import { useState } from "react";
import { X, UserMinus, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { useNotifications } from "@/lib/notification-context";
import { apiClient } from "@/lib/api-client";

interface UnassignAgentModalProps {
  projectId: string;
  agentName: string;
  onClose: () => void;
  onUnassign: () => void;
}

export default function UnassignAgentModal({
  projectId,
  agentName,
  onClose,
  onUnassign,
}: UnassignAgentModalProps) {
  const [reason, setReason] = useState("");
  const [requestDispute, setRequestDispute] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addNotification } = useNotifications();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setIsSubmitting(true);
    try {
      await apiClient(`/projects/${projectId}/unassign-agent`, {
        method: "POST",
        body: { reason, requestDispute }
      });
      toast.success("Agent successfully unassigned.");
      addNotification({
        title: "Agent Unassigned",
        desc: `${agentName} has been unassigned from the project.`,
        type: requestDispute ? "warning" : "info",
        targetRole: "sender"
      });
      onUnassign();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to unassign agent.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 sm:pt-14 md:pt-16 overflow-y-auto bg-ink-900/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-ink-100">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <UserMinus className="size-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-ink-900">Unassign Agent</h2>
              <p className="text-sm font-medium text-ink-500">Remove {agentName} from this project.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-ink-400 hover:bg-ink-50 hover:text-ink-600 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          
          <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3">
            <AlertTriangle className="size-5 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800">
              Unassigning an agent will halt project progress. Unreleased escrow funds remain secure. You cannot unassign an agent if a milestone proof is pending your review.
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-ink-900">Reason for unassignment</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please explain why you are removing this agent..."
                rows={3}
                required
                className="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm font-medium text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 resize-none shadow-sm"
              />
            </div>

            <label className="flex items-start gap-3 p-4 rounded-xl border border-ink-200 cursor-pointer hover:bg-ink-50 transition-colors">
              <input
                type="checkbox"
                checked={requestDispute}
                onChange={(e) => setRequestDispute(e.target.checked)}
                className="mt-0.5 size-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
              />
              <div>
                <span className="block text-sm font-bold text-ink-900">Request Dispute Lock</span>
                <span className="block text-xs text-ink-500 mt-1">Check this if funds have been released for incomplete or faulty work, requiring platform mediation.</span>
              </div>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-ink-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-bold text-ink-600 hover:bg-ink-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="px-6 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? "Unassigning..." : "Confirm Unassignment"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
