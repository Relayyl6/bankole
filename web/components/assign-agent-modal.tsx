"use client";

import { useState } from "react";
import { X, UserPlus, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { Agent } from "@/lib/models";
import { useNotifications } from "@/lib/notification-context";
import Avatar from "@/components/avatar";

interface AssignAgentModalProps {
  projectId: string;
  onClose: () => void;
  onAssign: (agentId: string) => void;
}

export default function AssignAgentModal({
  projectId,
  onClose,
  onAssign,
}: AssignAgentModalProps) {
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addNotification } = useNotifications();
  const { data: agentsRes, isLoading } = useSWR('/agents', url => apiClient<{data: Agent[], meta: any}>(url));
  const agents = agentsRes?.data || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgentId) return;

    setIsSubmitting(true);
    try {
      await apiClient(`/projects/${projectId}/assign-agent`, {
        method: "POST",
        body: { newAgentId: selectedAgentId }
      });
      toast.success("New agent successfully assigned.");
      
      const newAgent = agents.find(a => a.id === selectedAgentId);
      if (newAgent) {
        addNotification({
          title: "Agent Assigned",
          desc: `${newAgent.name} has been assigned to your project.`,
          type: "success",
          targetRole: "sender"
        });
      }
      
      onAssign(selectedAgentId);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to assign new agent.");
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
            <div className="size-10 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
              <UserPlus className="size-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-ink-900">Assign New Agent</h2>
              <p className="text-sm font-medium text-ink-500">Select an agent to take over this project.</p>
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
          {isLoading ? (
            <div className="py-8 text-center text-ink-500">Loading agents...</div>
          ) : (
          <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2">
            {agents.map(agent => (
              <label 
                key={agent.id}
                className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors ${
                  selectedAgentId === agent.id 
                    ? "border-brand-500 bg-brand-50 shadow-sm" 
                    : "border-ink-200 hover:bg-ink-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar initials={agent.initials} hue={agent.avatarHue} size="md" />
                  <div>
                    <p className="font-bold text-ink-900">{agent.name}</p>
                    <p className="text-xs text-ink-500">{agent.rating} ★ · {agent.completedProjects} projects</p>
                  </div>
                </div>
                <div className={`size-5 rounded-full border flex items-center justify-center ${
                  selectedAgentId === agent.id 
                    ? "border-brand-500 bg-brand-500 text-white" 
                    : "border-ink-300"
                }`}>
                  {selectedAgentId === agent.id && <CheckCircle2 className="size-3" />}
                </div>
                <input 
                  type="radio" 
                  name="agent" 
                  value={agent.id} 
                  checked={selectedAgentId === agent.id}
                  onChange={() => setSelectedAgentId(agent.id)}
                  className="sr-only"
                />
              </label>
            ))}
          </div>
          )}

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
              disabled={isSubmitting || !selectedAgentId}
              className="px-6 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? "Assigning..." : "Assign Agent"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
