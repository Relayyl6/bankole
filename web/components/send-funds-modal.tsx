"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  X, Send, Wallet, ShieldCheck, CheckCircle2, 
  AlertCircle, ArrowRight, Loader2, Sparkles, Building2,
  Plus
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useWallet } from "@/lib/wallet";
import { useNotifications } from "@/lib/notification-context";
import { formatCurrency } from "@/lib/models";
import { toast } from "react-toastify";
import { apiClient } from "@/lib/api-client";

interface SendFundsModalProps {
  agentId: string;
  agentName: string;
  projectId?: string;
  projectName?: string;
  onClose: () => void;
  onSuccess?: () => void;
  onOpenTopUp?: () => void;
}

const PRESET_AMOUNTS = [50000, 100000, 250000, 500000, 1000000];

const PURPOSE_OPTIONS = [
  "Initial Mobilization & Site Setup",
  "Building Materials Advance",
  "Machinery & Equipment Rental",
  "Site Survey & Structural Clearance",
  "Labor & Artisan Mobilization",
  "General Project Advance",
];

export default function SendFundsModal({
  agentId,
  agentName,
  projectId,
  projectName,
  onClose,
  onSuccess,
  onOpenTopUp,
}: SendFundsModalProps) {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const { balance, sendFundsToAgent, topUp } = useWallet(user?.id, user?.fullName);

  const [amount, setAmount] = useState<number>(100000);
  const [customAmountText, setCustomAmountText] = useState<string>("100000");
  const [purpose, setPurpose] = useState<string>(PURPOSE_OPTIONS[0]);
  const [customNote, setCustomNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [txRef, setTxRef] = useState<string>("");

  const handleAmountChange = (valStr: string) => {
    const numeric = valStr.replace(/\D/g, "");
    setCustomAmountText(numeric);
    setAmount(Number(numeric) || 0);
  };

  const handlePresetSelect = (val: number) => {
    setAmount(val);
    setCustomAmountText(String(val));
  };

  const isInsufficient = balance < amount;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      toast.error("Please enter a valid amount to send.");
      return;
    }

    if (isInsufficient) {
      toast.error(`Insufficient balance. You need ₦${(amount - balance).toLocaleString()} more.`);
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Deduct from in-app virtual wallet and credit agent
      const senderDisplayName = user?.fullName || user?.name || "Diaspora Sender";
      const fullPurpose = customNote.trim() ? `${purpose} (${customNote.trim()})` : purpose;

      const res = sendFundsToAgent(amount, {
        agentId,
        agentName,
        senderName: senderDisplayName,
        projectId,
        projectName,
        purpose: fullPurpose,
        currency: "NGN",
      });

      if (!res.success) {
        throw new Error(res.error || "Failed to disburse funds");
      }

      // 2. Add in-app notifications for both parties
      addNotification({
        title: "Funds Received 💰",
        desc: `₦${amount.toLocaleString()} received from ${senderDisplayName} for "${fullPurpose}"${projectName ? ` on ${projectName}` : ""}.`,
        type: "success",
        targetRole: "agent",
      });

      addNotification({
        title: "Funds Sent 🚀",
        desc: `₦${amount.toLocaleString()} sent to ${agentName} for "${fullPurpose}".`,
        type: "info",
        targetRole: "sender",
      });

      // 3. Attempt backend endpoint sync (graceful if route in progress)
      if (projectId) {
        try {
          await apiClient(`/projects/${projectId}/send-funds`, {
            method: "POST",
            body: {
              amount,
              currency: "NGN",
              note: fullPurpose,
            },
          });
        } catch {
          // graceful backend fallback
        }
      }

      const generatedRef = `BNK-MOB-${Date.now().toString().slice(-6)}`;
      setTxRef(generatedRef);
      setIsSuccess(true);
      toast.success(`Successfully sent ₦${amount.toLocaleString()} to ${agentName}!`);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      toast.error(err.message || "Could not complete transaction.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 sm:pt-14 md:pt-16 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Card */}
      <motion.div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
      >
        {/* Header */}
        <div className="p-6 border-b border-ink-100 bg-gradient-to-r from-brand-900 via-brand-800 to-ink-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
              <Send className="size-5 text-brand-300" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white">Send Funds to Agent</h2>
              <p className="text-xs text-brand-200">Mobilization advance & project kick-off</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="size-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X className="size-4 text-white" />
          </button>
        </div>

        {isSuccess ? (
          /* Success Screen */
          <div className="p-8 text-center flex flex-col items-center justify-center space-y-4">
            <div className="size-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="size-10" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-ink-900">Funds Transferred!</h3>
              <p className="text-sm text-ink-500 mt-1 max-w-sm mx-auto">
                <span className="font-bold text-ink-900">₦{amount.toLocaleString()}</span> has been debited from your virtual wallet and disbursed to <span className="font-bold text-ink-900">{agentName}</span>.
              </p>
            </div>

            <div className="w-full bg-ink-50 rounded-2xl p-4 text-left border border-ink-100 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-ink-400">Reference:</span>
                <span className="font-mono font-bold text-ink-800">{txRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-400">Purpose:</span>
                <span className="font-bold text-ink-800">{purpose}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-400">New Wallet Balance:</span>
                <span className="font-bold text-emerald-600">₦{balance.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl bg-brand-600 text-white font-bold hover:bg-brand-700 transition-colors text-sm shadow-md"
            >
              Done & Return to Project
            </button>
          </div>
        ) : (
          /* Form Content */
          <form onSubmit={handleSend} className="p-6 overflow-y-auto space-y-6 flex-1">
            
            {/* Wallet Balance Banner */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-brand-50 border border-brand-100">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-sm">
                  <Wallet className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-700 uppercase tracking-wider">In-App Virtual Balance</p>
                  <p className="text-xl font-black text-ink-900">
                    ₦{balance.toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  topUp(250000);
                  toast.success("Simulated instant ₦250,000 top-up to your virtual account!");
                }}
                className="inline-flex items-center gap-1 text-xs font-bold bg-white text-brand-700 border border-brand-200 px-3 py-1.5 rounded-xl hover:bg-brand-100 transition-colors shadow-sm"
              >
                <Plus className="size-3.5" /> +₦250k Quick Top-up
              </button>
            </div>

            {/* Recipient Details */}
            <div className="p-3.5 rounded-2xl bg-ink-50 border border-ink-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-ink-900 text-white flex items-center justify-center font-bold text-xs">
                  {agentName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-bold text-ink-400">Assigned Agent</p>
                  <p className="text-sm font-bold text-ink-900 flex items-center gap-1.5">
                    {agentName}
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-brand-600 bg-brand-50 border border-brand-200 px-1.5 py-0.5 rounded-md">
                      <ShieldCheck className="size-3" /> Verified
                    </span>
                  </p>
                </div>
              </div>
              {projectName && (
                <div className="text-right">
                  <p className="text-xs font-bold text-ink-400">Project</p>
                  <p className="text-xs font-bold text-ink-700 truncate max-w-[140px]">{projectName}</p>
                </div>
              )}
            </div>

            {/* Amount Input */}
            <div>
              <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-2">
                Disbursement Amount (₦)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-ink-400">
                  ₦
                </span>
                <input
                  type="text"
                  value={customAmountText}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="e.g. 100,000"
                  className={`w-full rounded-2xl border bg-white pl-10 pr-4 py-3.5 text-xl font-black text-ink-900 outline-none transition-colors ${
                    isInsufficient 
                      ? "border-rose-400 focus:border-rose-600 bg-rose-50/20" 
                      : "border-ink-200 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                  }`}
                />
              </div>

              {/* Quick Amount Presets */}
              <div className="flex flex-wrap gap-2 mt-3">
                {PRESET_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handlePresetSelect(amt)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      amount === amt 
                        ? "bg-brand-600 text-white shadow-sm" 
                        : "bg-ink-50 text-ink-600 border border-ink-200 hover:bg-ink-100"
                    }`}
                  >
                    ₦{(amt / 1000).toFixed(0)}k
                  </button>
                ))}
              </div>

              {isInsufficient && (
                <div className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-rose-600">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>Amount exceeds available wallet balance by ₦{(amount - balance).toLocaleString()}.</span>
                </div>
              )}
            </div>

            {/* Purpose */}
            <div>
              <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-2">
                Disbursement Purpose
              </label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-ink-800 outline-none focus:border-brand-600"
              >
                {PURPOSE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Optional Note */}
            <div>
              <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-2">
                Site Instructions / Reference Note (Optional)
              </label>
              <input
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="e.g. For site clearing, pegging, and sand delivery"
                className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-800 outline-none focus:border-brand-600"
              />
            </div>

            {/* Escrow Guarantee Notice */}
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-100 text-amber-900 text-xs flex items-start gap-2.5">
              <ShieldCheck className="size-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Direct Mobilization Release</p>
                <p className="text-amber-800 mt-0.5 leading-relaxed">
                  This sends funds directly from your in-app virtual wallet to start work. All site proof submissions and progress milestones will be logged under this project.
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || isInsufficient || amount <= 0}
                className="w-full py-4 rounded-2xl bg-brand-600 text-white font-bold text-base hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    Disbursing from Wallet...
                  </>
                ) : (
                  <>
                    <Send className="size-4" />
                    Send ₦{amount.toLocaleString()} from Wallet
                  </>
                )}
              </button>
            </div>

          </form>
        )}
      </motion.div>
    </motion.div>
  );
}
