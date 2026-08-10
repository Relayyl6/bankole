"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { 
  PlusCircle, CreditCard, ArrowDownCircle, ArrowUpCircle, 
  Clock, BarChart3, Building2, Eye, EyeOff, Send, Users,
  X, Check, Trash2, Star, Lock, AlertCircle, Loader2, Landmark, CheckCircle2, Wallet, Zap
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notification-context";
import { toast } from "react-toastify";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { formatCurrency, type Project } from "@/lib/models";
import { WalletManager, useWallet } from "@/lib/wallet";

// ── Types ────────────────────────────────────────────────────────
type CardType = "visa" | "mastercard" | "verve" | "afrgo";

interface BankAccount {
  id: string;
  bankName: string;
  bankCode?: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
}

interface Transaction {
  id: string;
  title: string;
  amount: number;
  currency: string;
  type: "credit" | "debit";
  createdAt: string;
}

interface SavedCard {
  id: string;
  type: CardType;
  last4: string;
  expiry: string;
  holder: string;
  isDefault: boolean;
  gradient?: string;
}

const NIGERIAN_BANKS = [
  { name: "Access Bank", code: "044" },
  { name: "Guaranty Trust Bank (GTBank)", code: "058" },
  { name: "First Bank of Nigeria", code: "011" },
  { name: "Zenith Bank", code: "057" },
  { name: "United Bank for Africa (UBA)", code: "033" },
  { name: "Kuda Microfinance Bank", code: "090267" },
  { name: "Wema Bank / ALAT", code: "035" },
  { name: "Moniepoint Microfinance Bank", code: "50515" },
  { name: "OPay Digital Services", code: "999992" },
  { name: "Stanbic IBTC Bank", code: "039" },
  { name: "Sterling Bank", code: "232" },
  { name: "FCMB", code: "214" },
  { name: "Union Bank of Nigeria", code: "032" },
  { name: "Fidelity Bank", code: "070" },
  { name: "Providus Bank", code: "101" },
  { name: "Polaris Bank", code: "076" },
  { name: "PalmPay", code: "999991" },
];

// ── Helpers ──────────────────────────────────────────────────────
const CARD_GRADIENTS = [
  "linear-gradient(110deg, #1e293b, #0f172a)",
  "linear-gradient(110deg, #6d28d9, #4c1d95)",
  "linear-gradient(110deg, #065f46, #064e3b)",
  "linear-gradient(110deg, #92400e, #78350f)",
  "linear-gradient(110deg, #1e3a5f, #0c2340)",
];

const detectCardType = (num: string): CardType => {
  if (num.startsWith("4")) return "visa";
  if (num.startsWith("562")) return "afrgo"; // AfriGO prefix
  if (num.startsWith("5") || num.startsWith("2")) return "mastercard";
  return "verve";
};

const CARD_LABEL: Record<CardType, string> = {
  visa: "VISA",
  mastercard: "MASTERCARD",
  verve: "VERVE",
  afrgo: "AFRIGO",
};

// ── Add Bank Account Modal ───────────────────────────────────────
function AddBankAccountModal({ 
  onClose, 
  onAdd 
}: { 
  onClose: () => void; 
  onAdd: (payload: { bankName: string; bankCode: string; accountNumber: string; accountName: string }) => Promise<void>; 
}) {
  const [bankCode, setBankCode] = useState(NIGERIAN_BANKS[0].code);
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedBank = NIGERIAN_BANKS.find(b => b.code === bankCode) || NIGERIAN_BANKS[0];

  const handleResolve = async () => {
    if (accountNumber.length !== 10) return;
    setIsVerifying(true);
    try {
      const res = await apiClient<{ accountName?: string; data?: { account_name?: string } }>('/payments/bank-accounts/resolve', {
        method: 'POST',
        body: { accountNumber, bankCode }
      });
      const resolved = res.accountName || res.data?.account_name;
      if (resolved) {
        setAccountName(resolved);
        toast.success(`Account verified: ${resolved}`);
      }
    } catch {
      // User can still input manually
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (accountNumber.length !== 10) {
      toast.error("Please enter a valid 10-digit account number.");
      return;
    }
    if (!accountName.trim()) {
      toast.error("Please enter the account name as registered with your bank.");
      return;
    }
    setIsSubmitting(true);
    try {
      await onAdd({
        bankName: selectedBank.name,
        bankCode: selectedBank.code,
        accountNumber,
        accountName: accountName.trim().toUpperCase(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 sm:pt-14 md:pt-16 overflow-y-auto backdrop-blur-sm"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="w-full max-w-md rounded-2xl p-8 relative bg-white border border-ink-100 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-ink-100 text-ink-500 transition-colors">
          <X className="size-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="size-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <Landmark className="size-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-ink-900">Add Bank Account</h2>
            <p className="text-xs text-ink-500">For direct payouts and earnings withdrawals</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block text-ink-600">Select Bank</label>
            <select
              value={bankCode}
              onChange={(e) => {
                setBankCode(e.target.value);
                setAccountName("");
              }}
              className="w-full px-4 py-3 rounded-xl border border-ink-200 bg-white font-medium text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-600 transition-all text-sm"
            >
              {NIGERIAN_BANKS.map((b) => (
                <option key={b.code} value={b.code}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block text-ink-600">Account Number (10 Digits)</label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                maxLength={10}
                value={accountNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setAccountNumber(val);
                  if (val.length === 10) {
                    setTimeout(() => handleResolve(), 300);
                  }
                }}
                onBlur={handleResolve}
                placeholder="0123456789"
                className="w-full px-4 py-3 rounded-xl border border-ink-200 bg-white font-mono text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-600 transition-all text-sm"
              />
              {isVerifying && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs text-brand-600 font-medium">
                  <Loader2 className="size-4 animate-spin" /> Verifying...
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block text-ink-600">Account Name</label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="e.g. LEONARD OSEGHALE"
              className="w-full px-4 py-3 rounded-xl border border-ink-200 bg-white font-semibold text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-600 transition-all text-sm uppercase"
            />
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl text-xs bg-ink-50 text-ink-600">
            <Lock className="size-4 shrink-0 text-brand-600" />
            <span>Bank account information is verified via Paystack and strictly secured.</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !accountNumber || !accountName}
            className="w-full py-3 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Saving Account...
              </>
            ) : (
              "Save Bank Account"
            )}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── Add Card Modal ────────────────────────────────────────────────
function AddCardModal({ onClose, onAdd }: { onClose: () => void; onAdd: (payload: { cardNumber: string, expiry: string, cvv: string, holder: string }) => void }) {
  const [num, setNum] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [holder, setHolder] = useState("");
  const [showCvv, setShowCvv] = useState(false);

  const formatNum = (v: string) =>
    v.replace(/\D/g, "").slice(0, 19).replace(/(.{4})/g, "$1 ").trim();

  const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length >= 3 ? d.slice(0, 2) + "/" + d.slice(2) : d;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = num.replace(/\s/g, "");
    if (raw.length < 15 || expiry.length < 5 || cvv.length < 3 || !holder) {
      toast.error("Please fill in all card details correctly.");
      return;
    }
    onAdd({
      cardNumber: raw,
      expiry,
      cvv,
      holder: holder.toUpperCase(),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 sm:pt-14 md:pt-16 overflow-y-auto backdrop-blur-sm"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="w-full max-w-md rounded-2xl p-8 relative bg-white border border-ink-100 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Live card preview */}
        <div
          className="rounded-2xl p-6 text-white mb-6 flex flex-col justify-between h-44 relative overflow-hidden shadow-lg"
          style={{ background: num ? CARD_GRADIENTS[num.replace(/\s/g,"").length % CARD_GRADIENTS.length] : "linear-gradient(110deg,#1e293b,#0f172a)" }}
        >
          <div className="flex justify-between items-start">
            <CreditCard className="size-6 text-white/80" />
            <span className="font-bold text-sm italic">{CARD_LABEL[detectCardType(num.replace(/\s/g,""))]}</span>
          </div>
          <div>
            <p className="text-lg tracking-widest mb-2 font-mono">
              {num || "•••• •••• •••• ••••"}
            </p>
            <div className="flex justify-between text-xs text-white/70">
              <span className="truncate max-w-[180px]">{holder || "CARDHOLDER NAME"}</span>
              <span>{expiry || "MM/YY"}</span>
            </div>
          </div>
        </div>

        <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-ink-100 text-ink-500 transition-colors">
          <X className="size-5" />
        </button>

        <h2 className="text-xl font-bold mb-4 text-ink-900">Link a New Card</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block text-ink-600">Card Number</label>
            <input
              type="text"
              inputMode="numeric"
              value={num}
              onChange={(e) => setNum(formatNum(e.target.value))}
              placeholder="0000 0000 0000 0000"
              className="w-full px-4 py-3 rounded-xl border border-ink-200 font-mono bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-600 transition-all text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-2 block text-ink-600">Expiry Date</label>
              <input
                type="text"
                inputMode="numeric"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                placeholder="MM/YY"
                className="w-full px-4 py-3 rounded-xl border border-ink-200 font-mono bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-600 transition-all text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-2 block text-ink-600">CVV</label>
              <div className="relative">
                <input
                  type={showCvv ? "text" : "password"}
                  inputMode="numeric"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g,"").slice(0,4))}
                  placeholder="•••"
                  className="w-full px-4 py-3 pr-10 rounded-xl border border-ink-200 font-mono bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-600 transition-all text-sm"
                />
                <button type="button" onClick={() => setShowCvv(!showCvv)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600">
                  {showCvv ? <EyeOff className="size-4"/> : <Eye className="size-4"/>}
                </button>
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block text-ink-600">Cardholder Name</label>
            <input
              type="text"
              value={holder}
              onChange={(e) => setHolder(e.target.value)}
              placeholder="As it appears on the card"
              className="w-full px-4 py-3 rounded-xl border border-ink-200 bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-600 transition-all text-sm"
            />
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl text-xs bg-ink-50 text-ink-600">
            <Lock className="size-4 shrink-0 text-brand-600" />
            <span>Card tokens are securely encrypted. Bankole never stores raw CVV numbers.</span>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 transition-colors shadow-sm mt-2"
          >
            Link Card Securely
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── Co-Funder Modal ───────────────────────────────────────────────
function CoFunderModal({ projects, onClose, onInvite }: { projects: Project[]; onClose: () => void; onInvite: (projectId: string, email: string) => Promise<void> | void }) {
  const [projectId, setProjectId] = useState(projects[0]?.id || "");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !email) return toast.error("Please select a project and provide an email.");
    try {
      setLoading(true);
      await onInvite(projectId, email);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 sm:pt-14 md:pt-16 overflow-y-auto backdrop-blur-sm"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="w-full max-w-md rounded-2xl p-8 relative bg-white border border-ink-100 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-ink-100 text-ink-500 transition-colors">
          <X className="size-5" />
        </button>
        <h2 className="text-xl font-bold mb-4 text-ink-900">Invite Co-Funder</h2>
        <p className="text-xs text-ink-500 mb-6">Allow trusted partners or family members to deposit funds into specific project milestones.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold block mb-2 text-ink-600 uppercase">Target Project</label>
            {projects.length > 0 ? (
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-ink-200 text-ink-900 bg-white focus:ring-2 focus:ring-brand-600 outline-none text-sm font-medium"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.currency} {p.totalBudget?.toLocaleString()})</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="Enter Project ID"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-ink-200 text-ink-900 bg-white focus:ring-2 focus:ring-brand-600 outline-none text-sm"
              />
            )}
          </div>
          <div>
            <label className="text-xs font-bold block mb-2 text-ink-600 uppercase">Co-Funder Email</label>
            <input
              type="email"
              placeholder="partner@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-ink-200 text-ink-900 bg-white focus:ring-2 focus:ring-brand-600 outline-none text-sm"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-sm mt-4 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {loading ? "Sending Invitation..." : "Send Co-Funding Invitation"}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
// ── TopUpModal ───────────────────────────────────────────────────
const TOP_UP_PRESETS = [5_000, 10_000, 25_000, 50_000, 100_000, 250_000];

function TopUpModal({ onClose, onSuccess, cards }: { onClose: () => void; onSuccess: (amount: number) => void; cards: SavedCard[] }) {
  const [amount, setAmount] = useState("");
  const [selectedCardId, setSelectedCardId] = useState(cards.find(c => c.isDefault)?.id || cards[0]?.id || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount.replace(/,/g, ""));
    if (!val || val <= 0) { toast.error("Enter a valid amount"); return; }
    if (val < 1000) { toast.error("Minimum top-up is ₦1,000"); return; }
    if (!selectedCardId) { toast.error("Please select a card or link one first."); return; }
    setLoading(true);
    try {
      await apiClient("/payments/topup", { method: "POST", body: { amount: val, currency: "NGN", cardId: selectedCardId } });
      toast.success("Wallet topped up successfully!");
      onSuccess(val);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to top up wallet. Please check your card.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 sm:pt-14 md:pt-16 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
      >
        {/* Header */}
        <div className="p-6 border-b border-ink-100 flex items-center justify-between bg-gradient-to-r from-brand-600 to-brand-800">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-white/20 flex items-center justify-center">
              <Wallet className="size-5 text-white" />
            </div>
            <div>
              <h2 className="font-black text-white text-lg">Top Up Wallet</h2>
              <p className="text-brand-200 text-xs">Funds go to your virtual account</p>
            </div>
          </div>
          <button onClick={onClose} className="size-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <X className="size-4 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Preset amounts */}
          <div>
            <label className="block text-xs font-bold text-ink-500 uppercase tracking-wider mb-3">Quick Select</label>
            <div className="grid grid-cols-3 gap-2">
              {TOP_UP_PRESETS.map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset.toLocaleString())}
                  className={`py-2.5 rounded-xl border text-sm font-bold transition-all ${
                    amount === preset.toLocaleString()
                      ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                      : "border-ink-200 text-ink-700 hover:border-brand-400 hover:text-brand-700 hover:bg-brand-50"
                  }`}
                >
                  ₦{preset >= 1000 ? `${preset / 1000}k` : preset}
                </button>
              ))}
            </div>
          </div>

          {/* Custom amount */}
          <div>
            <label className="block text-xs font-bold text-ink-500 uppercase tracking-wider mb-2">Or Enter Amount (NGN)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400 font-bold">₦</span>
              <input
                type="text"
                value={amount}
                onChange={e => setAmount(e.target.value.replace(/[^0-9,]/g, ""))}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-3.5 rounded-xl border border-ink-200 text-ink-900 font-bold text-lg focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
          </div>

          {/* Card Selector */}
          <div>
            <label className="block text-xs font-bold text-ink-500 uppercase tracking-wider mb-2">Select Payment Method</label>
            <select 
              value={selectedCardId}
              onChange={(e) => setSelectedCardId(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border border-ink-200 text-ink-900 font-medium text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white"
            >
              {cards.length === 0 && <option value="">No cards linked (Add one first)</option>}
              {cards.map(card => (
                <option key={card.id} value={card.id}>
                  {CARD_LABEL[card.type] || 'Card'} ending in {card.last4} {card.isDefault ? '(Default)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
            <Zap className="size-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 font-medium">
              This will charge your selected card via Paystack and credit your virtual wallet.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !amount}
            className="w-full py-3.5 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="size-5 animate-spin" /> : <Wallet className="size-5" />}
            {loading ? "Processing..." : "Add to Wallet"}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────
export default function PaymentsPage() {
  const { user, role } = useAuth();
  const { addNotification } = useNotifications();
  const [showBalance, setShowBalance] = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showAddBank, setShowAddBank] = useState(false);
  const [showCoFunder, setShowCoFunder] = useState(false);
  const [showTopUp, setShowTopUp] = useState(false);
  const { balance: walletBalance, transactions: walletTransactions } = useWallet(
    user?.id,
    user?.fullName,
    (user as any)?.agentDetails?.id
  );
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);

  const handleTopUp = (amount: number) => {
    const res = WalletManager.topUp(user?.id, amount);
    toast.success(`₦${amount.toLocaleString()} added to your virtual wallet!`);
    addNotification({
      title: "Wallet Topped Up",
      desc: `₦${amount.toLocaleString()} credited to your Bankole virtual wallet. New balance: ₦${res.newBalance.toLocaleString()}.`,
      type: "success",
      targetRole: "sender",
    });
    setShowTopUp(false);
  };

  // Dynamic API queries
  const { data: summary } = useSWR("/dashboard/summary", (url) => apiClient<any>(url));
  const { data: projectsRes } = useSWR("/projects", (url) => apiClient<{ data: Project[] }>(url));
  const { data: cardsRes, mutate: mutateCards } = useSWR('/payments/cards', url => apiClient<{data: SavedCard[]}>(url));
  const { data: bankRes, mutate: mutateBankAccounts } = useSWR('/payments/bank-accounts', url => apiClient<{data: BankAccount[]}>(url));
  const { data: txRes, mutate: mutateTx } = useSWR('/payments/transactions?page=1&perPage=20', url => apiClient<{data: Transaction[], meta: any}>(url));

  const projects = projectsRes?.data || [];
  const cards = cardsRes?.data || [];
  const bankAccounts = bankRes?.data || [];
  
  // Merge API transactions and live wallet transactions
  const apiTransactions = txRes?.data || [];
  const transactions: Transaction[] = [
    ...walletTransactions.map(wt => ({
      id: wt.id,
      title: wt.title,
      amount: wt.amount,
      currency: wt.currency === "NGN" ? "₦" : wt.currency,
      type: wt.type,
      createdAt: new Date(wt.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
    })),
    ...apiTransactions.filter(at => !walletTransactions.some(wt => wt.id === at.id)),
  ];

  const defaultBank = bankAccounts.find(b => b.isDefault) || bankAccounts[0];

  // Dynamic calculations
  const totalEscrowHeld = summary?.totalInEscrow ?? projects.reduce((acc, p) => acc + (p.fundsInEscrow || 0), 0);
  const totalReleased = summary?.totalReleased ?? projects.reduce((acc, p) => acc + (p.fundsReleased || 0), 0);
  const agentAvailableEarnings = (walletBalance || 0) + (totalReleased || 0);
  const currency = summary?.currency || "NGN";

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount.replace(/,/g, ""));
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    if (amount < 1000) {
      toast.error("Minimum withdrawal is ₦1,000.");
      return;
    }
    if (!defaultBank) {
      toast.error("Please link a bank account before requesting withdrawal.");
      setShowAddBank(true);
      return;
    }
    setWithdrawing(true);
    try {
      await apiClient("/payments/withdraw", {
        method: "POST",
        body: {
          amount,
          currency: "NGN",
          bankAccountId: defaultBank.id,
          description: "Agent earnings withdrawal",
        },
      });
      // If agent has virtual wallet balance, deduct and add withdrawal transaction
      if (walletBalance > 0) {
        WalletManager.setBalance(user?.id, Math.max(0, walletBalance - amount), user?.fullName);
        WalletManager.addTransaction(
          user?.id,
          {
            title: `Earnings Withdrawal to ${defaultBank.bankName}`,
            amount,
            currency: "NGN",
            type: "debit",
            category: "withdrawal",
            reference: `BNK-WDR-${Date.now().toString().slice(-6)}`,
            status: "completed",
          },
          user?.fullName
        );
      }

      toast.success("Withdrawal initiated successfully!");
      addNotification({
        title: "Withdrawal Initiated",
        desc: `Payout of ${formatCurrency(amount, "NGN")} to ${defaultBank.bankName} has been submitted.`,
        type: "info",
        targetRole: "agent",
      });
      setWithdrawAmount("");
      mutateTx();
    } catch (err: any) {
      toast.error(err.message || "Withdrawal failed. Please try again.");
    } finally {
      setWithdrawing(false);
    }
  };

  const handleAddCard = async (payload: { cardNumber: string, expiry: string, cvv: string, holder: string }) => {
    try {
      await apiClient("/payments/cards", {
        method: "POST",
        body: payload
      });
      toast.success("Card linked successfully!");
      addNotification({
        title: "Payment Card Added",
        desc: `Card ending in ${payload.cardNumber.slice(-4)} is now available for escrow deposits.`,
        type: "success",
        targetRole: "sender",
      });
      setShowAddCard(false);
      mutateCards();
    } catch (err: any) {
      toast.error(err.message || "Failed to add card");
    }
  };

  const handleAddBankAccount = async (payload: { bankName: string; bankCode: string; accountNumber: string; accountName: string }) => {
    try {
      await apiClient("/payments/bank-accounts", {
        method: "POST",
        body: payload
      });
      toast.success("Bank account added successfully!");
      addNotification({
        title: "Bank Account Linked",
        desc: `Added ${payload.bankName} (${payload.accountNumber}) for your project earnings payouts.`,
        type: "success",
        targetRole: "agent",
      });
      setShowAddBank(false);
      mutateBankAccounts();
    } catch (err: any) {
      toast.error(err.message || "Failed to add bank account");
    }
  };

  const handleSetDefaultCard = async (id: string) => {
    try {
      await apiClient(`/payments/cards/${id}/default`, { method: "POST" });
      toast.success("Default payment card updated.");
      mutateCards();
    } catch (err: any) {
      toast.error(err.message || "Failed to set default card");
    }
  };

  const handleRemoveCard = async (id: string) => {
    try {
      await apiClient(`/payments/cards/${id}`, { method: "DELETE" });
      toast.info("Card removed.");
      mutateCards();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove card");
    }
  };

  const handleSetDefaultBank = async (id: string) => {
    try {
      await apiClient(`/payments/bank-accounts/${id}/default`, { method: "POST" });
      toast.success("Default payout account updated.");
      mutateBankAccounts();
    } catch (err: any) {
      toast.error(err.message || "Failed to update default bank account");
    }
  };

  const handleRemoveBank = async (id: string) => {
    try {
      await apiClient(`/payments/bank-accounts/${id}`, { method: "DELETE" });
      toast.info("Bank account removed.");
      mutateBankAccounts();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove bank account");
    }
  };

  const handleInviteCoFunder = async (projectId: string, email: string) => {
    try {
      await apiClient(`/projects/${projectId}/co-funders`, {
        method: "POST",
        body: { email }
      });
      toast.success("Co-funder invited successfully!");
      setShowCoFunder(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to invite co-funder");
    }
  };

  // ── SENDER VIEW ──────────────────────────────────────────────
  if (role === "sender") {
    return (
      <>
        <AnimatePresence>
          {showAddCard && (
            <AddCardModal onClose={() => setShowAddCard(false)} onAdd={handleAddCard} />
          )}
          {showAddBank && (
            <AddBankAccountModal onClose={() => setShowAddBank(false)} onAdd={handleAddBankAccount} />
          )}
          {showCoFunder && (
            <CoFunderModal projects={projects} onClose={() => setShowCoFunder(false)} onInvite={handleInviteCoFunder} />
          )}
          {showTopUp && (
            <TopUpModal onClose={() => setShowTopUp(false)} onSuccess={handleTopUp} cards={cards} />
          )}
        </AnimatePresence>

        <div className="max-w-5xl mx-auto p-6 lg:p-10 space-y-8 animate-slide-in-right">
          <header>
            <h1 className="text-3xl font-black text-ink-900 tracking-tight">Payments &amp; Escrow</h1>
            <p className="mt-1 text-sm text-ink-500 font-medium">Manage your project escrow balances, linked cards, and ledger.</p>
          </header>

          {/* Hero Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-8 text-white relative overflow-hidden bg-gradient-to-br from-ink-900 via-brand-950 to-brand-800 shadow-xl"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <p className="font-medium text-white/80 text-sm">Total Escrow Funds Held</p>
                <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold backdrop-blur-sm border border-white/10">
                  {projects.length} {projects.length === 1 ? "Project" : "Projects"} Active
                </span>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <h2 className="text-4xl sm:text-5xl font-black tracking-tight">
                  {showBalance ? formatCurrency(totalEscrowHeld, currency) : "••••••••••"}
                </h2>
                <button onClick={() => setShowBalance(!showBalance)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  {showBalance ? <EyeOff className="size-6" /> : <Eye className="size-6" />}
                </button>
              </div>
              <p className="text-xs font-medium text-white/70">
                Protected by Bankole Escrow Guarantee · Funds released only on verified milestone completion
              </p>
            </div>
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl" />
          </motion.div>

          {/* Virtual Wallet Balance Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-6 flex items-center justify-between gap-4 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                <Wallet className="size-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Virtual Wallet</p>
                <p className="text-2xl font-black text-ink-900">
                  {showBalance ? formatCurrency(walletBalance, "NGN") : "••••••"}
                </p>
                <p className="text-xs text-ink-500 mt-0.5">Available to fund project milestones</p>
              </div>
            </div>
            <button
              onClick={() => setShowTopUp(true)}
              className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <Zap className="size-4" /> Top Up
            </button>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">

              {/* ── Payment Cards ── */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-ink-900">Linked Payment Cards</h3>
                    <p className="text-xs text-ink-500">Fund project milestones securely with 1-click escrow deposit</p>
                  </div>
                  <button
                    onClick={() => setShowAddCard(true)}
                    className="flex items-center gap-2 text-sm font-bold text-brand-600 hover:text-brand-700 transition-colors bg-brand-50 px-3 py-1.5 rounded-xl"
                  >
                    <PlusCircle className="size-4" />
                    Add Card
                  </button>
                </div>

                {cards.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-ink-200 p-8 text-center bg-white">
                    <CreditCard className="size-10 mx-auto mb-3 text-brand-400" />
                    <p className="font-bold text-ink-900 mb-1">No cards linked yet</p>
                    <p className="text-xs text-ink-500 mb-4">Add a debit or credit card for instant escrow deposits.</p>
                    <button
                      onClick={() => setShowAddCard(true)}
                      className="px-5 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 transition-colors shadow-sm"
                    >
                      + Link a Card
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Visual card carousel */}
                    <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
                      {cards.map((card, idx) => (
                        <div
                          key={card.id}
                          className="min-w-[280px] p-6 rounded-2xl text-white snap-center shrink-0 flex flex-col justify-between h-40 relative overflow-hidden shadow-md"
                          style={{
                            background: card.gradient || CARD_GRADIENTS[idx % CARD_GRADIENTS.length],
                          }}
                        >
                          {card.isDefault && (
                            <span className="absolute top-3 right-3 px-2 py-0.5 bg-white/20 rounded-lg text-[10px] font-bold backdrop-blur-sm flex items-center gap-1">
                              <Star className="size-3 fill-white stroke-none" /> Default
                            </span>
                          )}
                          <div className="flex justify-between items-start">
                            <CreditCard className="size-5 text-white/80" />
                            <span className="font-bold italic text-xs">{CARD_LABEL[card.type] || "CARD"}</span>
                          </div>
                          <div>
                            <p className="text-base tracking-widest mb-1 font-mono">•••• •••• •••• {card.last4}</p>
                            <div className="flex justify-between text-xs text-white/70">
                              <span className="truncate max-w-[160px]">{card.holder}</span>
                              <span>{card.expiry}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {/* Add card slot */}
                      <button
                        onClick={() => setShowAddCard(true)}
                        className="min-w-[160px] h-40 rounded-2xl border-2 border-dashed border-ink-200 bg-white flex flex-col items-center justify-center gap-2 shrink-0 transition-all hover:border-brand-400 hover:bg-brand-50/50"
                      >
                        <PlusCircle className="size-6 text-brand-500" />
                        <span className="text-xs font-bold text-brand-700">Add Card</span>
                      </button>
                    </div>

                    {/* Card management list */}
                    <div className="rounded-2xl border border-ink-100 bg-white overflow-hidden divide-y divide-ink-100 shadow-sm">
                      {cards.map((card, idx) => (
                        <div key={card.id} className="flex items-center justify-between p-4 gap-4 hover:bg-ink-50/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div
                              className="size-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                              style={{ background: card.gradient || CARD_GRADIENTS[idx % CARD_GRADIENTS.length] }}
                            >
                              {card.type === "visa" ? "V" : card.type === "mastercard" ? "MC" : "VV"}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-ink-900">
                                {CARD_LABEL[card.type] || "Card"} •••• {card.last4}
                                {card.isDefault && (
                                  <span className="ml-2 px-1.5 py-0.5 bg-brand-100 text-brand-700 rounded text-[10px] font-bold">DEFAULT</span>
                                )}
                              </p>
                              <p className="text-xs text-ink-400">Expires {card.expiry} · {card.holder}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!card.isDefault && (
                              <button
                                onClick={() => handleSetDefaultCard(card.id)}
                                className="px-2.5 py-1 rounded-xl text-xs font-bold hover:bg-brand-50 text-brand-600 transition-colors flex items-center gap-1 border border-brand-200"
                              >
                                <Check className="size-3.5" /> Make Default
                              </button>
                            )}
                            <button
                              onClick={() => handleRemoveCard(card.id)}
                              className="p-1.5 rounded-xl hover:bg-rose-50 text-rose-500 transition-colors"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>

              {/* ── Bank Accounts (Sender) ── */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-ink-900">Linked Bank Accounts</h3>
                    <p className="text-xs text-ink-500">For escrow refunds and direct bank transfers</p>
                  </div>
                  <button
                    onClick={() => setShowAddBank(true)}
                    className="flex items-center gap-2 text-sm font-bold text-brand-600 hover:text-brand-700 transition-colors bg-brand-50 px-3 py-1.5 rounded-xl"
                  >
                    <PlusCircle className="size-4" />
                    Add Bank
                  </button>
                </div>

                {bankAccounts.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-ink-200 p-8 text-center bg-white">
                    <Building2 className="size-10 mx-auto mb-3 text-brand-400" />
                    <p className="font-bold text-ink-900 mb-1">No bank account linked</p>
                    <p className="text-xs text-ink-500 mb-4">Add your Nigerian bank account to receive refunds or escrow returns.</p>
                    <button
                      onClick={() => setShowAddBank(true)}
                      className="px-5 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 transition-colors shadow-sm"
                    >
                      + Add Bank Account
                    </button>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-ink-100 bg-white overflow-hidden divide-y divide-ink-100 shadow-sm">
                    {bankAccounts.map((b) => (
                      <div key={b.id} className="flex items-center justify-between p-4 gap-4 hover:bg-ink-50/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-brand-50 text-brand-600 rounded-xl">
                            <Building2 className="size-5" />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-ink-900">
                              {b.bankName}
                              {b.isDefault && (
                                <span className="ml-2 px-1.5 py-0.5 bg-brand-100 text-brand-700 rounded text-[10px] font-bold">DEFAULT</span>
                              )}
                            </p>
                            <p className="text-xs text-ink-500 font-mono">{b.accountNumber} · {b.accountName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!b.isDefault && (
                            <button
                              onClick={() => handleSetDefaultBank(b.id)}
                              className="px-2.5 py-1 rounded-xl text-xs font-bold hover:bg-brand-50 text-brand-600 transition-colors border border-brand-200 flex items-center gap-1"
                            >
                              <Check className="size-3.5" /> Make Default
                            </button>
                          )}
                          <button
                            onClick={() => handleRemoveBank(b.id)}
                            className="p-1.5 rounded-xl hover:bg-rose-50 text-rose-500 transition-colors"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Recent Transactions */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-2xl border border-ink-100 bg-white overflow-hidden shadow-sm"
              >
                <div className="p-6 border-b border-ink-100 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-ink-900">Escrow Ledger &amp; Transactions</h3>
                </div>
                <div className="divide-y divide-ink-100">
                  {transactions.map((tx, i) => (
                    <div key={i} className="p-4 sm:p-5 flex items-center justify-between hover:bg-ink-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-full ${tx.type === "credit" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"}`}>
                          {tx.type === "credit" ? <ArrowDownCircle className="size-5" /> : <ArrowUpCircle className="size-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-ink-900">{tx.title}</p>
                          <p className="text-xs text-ink-400 mt-0.5">{tx.createdAt}</p>
                        </div>
                      </div>
                      <span className={`font-bold text-sm ${tx.type === "credit" ? "text-emerald-600" : "text-ink-900"}`}>
                        {tx.type === "credit" ? "+" : "-"}{tx.currency || "₦"}{tx.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  {transactions.length === 0 && (
                    <div className="p-8 text-center text-xs text-ink-400">
                      No transactions recorded yet. Escrow deposits and milestone payouts will appear here.
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            <div className="space-y-8">
              {/* Co-fund section */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-2xl p-6 border border-ink-100 bg-white shadow-sm text-center"
              >
                <div className="size-14 mx-auto bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 mb-4">
                  <Users className="size-7" />
                </div>
                <h3 className="text-lg font-bold text-ink-900 mb-2">Co-fund Projects</h3>
                <p className="text-xs text-ink-500 mb-6 leading-relaxed">
                  Invite family members or diaspora partners to contribute to specific milestone stages.
                </p>
                <button
                  onClick={() => setShowCoFunder(true)}
                  className="w-full py-3 rounded-xl bg-brand-600 text-white font-bold text-sm hover:bg-brand-700 transition-colors shadow-sm"
                >
                  + Invite Co-Funder
                </button>
              </motion.div>

              {/* Escrow Guarantee Card */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="rounded-2xl p-6 border border-brand-100 bg-brand-50/50 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-3 text-brand-700">
                  <CheckCircle2 className="size-5 shrink-0" />
                  <h4 className="font-bold text-sm text-ink-900">Milestone Protection</h4>
                </div>
                <p className="text-xs text-ink-600 leading-relaxed mb-4">
                  Funds deposited into escrow are held securely. Agents cannot withdraw milestone funds until photographic proof with GPS and EXIF verification is submitted and approved by you.
                </p>
                <div className="text-[11px] font-bold text-brand-700 bg-white/80 p-2.5 rounded-xl border border-brand-100">
                  Total Released on Proof: {formatCurrency(totalReleased, currency)}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── AGENT VIEW ───────────────────────────────────────────────
  return (
    <>
      <AnimatePresence>
        {showAddBank && (
          <AddBankAccountModal onClose={() => setShowAddBank(false)} onAdd={handleAddBankAccount} />
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto p-6 lg:p-10 space-y-8 animate-slide-in-right">
        <header>
          <h1 className="text-3xl font-black text-ink-900 tracking-tight">Wallet &amp; Earnings</h1>
          <p className="mt-1 text-sm text-ink-500 font-medium">Manage your supervision fees, payout ledger, and linked bank accounts.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Hero Card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-8 text-white relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-gradient-to-br from-ink-900 via-brand-950 to-brand-800 shadow-xl"
            >
              <div className="relative z-10">
                <p className="font-medium text-white/80 text-sm mb-2">Available Earnings Balance</p>
                <div className="flex items-center gap-4 mb-2">
                  <h2 className="text-4xl sm:text-5xl font-black tracking-tight">
                    {showBalance ? formatCurrency(agentAvailableEarnings, currency) : "••••••••••"}
                  </h2>
                  <button onClick={() => setShowBalance(!showBalance)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    {showBalance ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
                <p className="text-xs font-medium text-white/70">
                  {defaultBank ? `${defaultBank.bankName} · ${defaultBank.accountNumber}` : "No bank account linked yet"}
                </p>
              </div>
              <button 
                onClick={() => {
                  const elem = document.getElementById("withdraw-section");
                  elem?.scrollIntoView({ behavior: "smooth" });
                }}
                className="relative z-10 w-full sm:w-auto px-5 py-3 bg-white text-brand-700 font-bold text-sm rounded-xl shadow-sm hover:bg-brand-50 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowUpCircle className="size-4" /> Withdraw Funds
              </button>
              <div className="absolute -right-10 -bottom-20 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl" />
            </motion.div>

            {/* ── Linked Bank Accounts List (Agent) ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-ink-900">Linked Payout Accounts</h3>
                  <p className="text-xs text-ink-500">Earnings from supervised milestones are transferred directly to these accounts</p>
                </div>
                <button
                  onClick={() => setShowAddBank(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 text-brand-600 hover:bg-brand-100 text-xs font-bold transition-colors"
                >
                  <PlusCircle className="size-4" /> Add Bank
                </button>
              </div>

              {bankAccounts.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-ink-200 p-8 text-center">
                  <Building2 className="size-10 mx-auto mb-3 text-brand-400" />
                  <p className="font-bold text-sm text-ink-900 mb-1">No payout account linked</p>
                  <p className="text-xs text-ink-500 mb-4">Add your Nigerian bank account to withdraw your supervision earnings.</p>
                  <button
                    onClick={() => setShowAddBank(true)}
                    className="px-5 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 transition-colors shadow-sm"
                  >
                    + Add Bank Account
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {bankAccounts.map((b) => (
                    <div
                      key={b.id}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${b.isDefault ? "border-brand-300 bg-brand-50/30" : "border-ink-100 hover:bg-ink-50/50"}`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="p-2.5 bg-brand-50 text-brand-600 rounded-xl">
                          <Building2 className="size-5" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-ink-900 flex items-center gap-2">
                            {b.bankName}
                            {b.isDefault && (
                              <span className="px-2 py-0.5 bg-brand-100 text-brand-700 rounded-md text-[10px] font-bold">DEFAULT PAYOUT</span>
                            )}
                          </p>
                          <p className="text-xs text-ink-500 font-mono mt-0.5">{b.accountNumber} · {b.accountName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!b.isDefault && (
                          <button
                            onClick={() => handleSetDefaultBank(b.id)}
                            className="px-2.5 py-1 rounded-xl text-xs font-bold text-brand-600 hover:bg-brand-50 border border-brand-200 transition-colors flex items-center gap-1"
                          >
                            <Check className="size-3" /> Make Default
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveBank(b.id)}
                          className="p-1.5 rounded-xl hover:bg-rose-50 text-rose-500 transition-colors"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Transaction History */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-ink-100 bg-white overflow-hidden shadow-sm"
            >
              <div className="p-6 border-b border-ink-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-ink-900">Payout &amp; Fee History</h3>
              </div>
              <div className="divide-y divide-ink-100">
                {transactions.map((tx, i) => (
                  <div key={i} className="p-4 sm:p-5 flex items-center justify-between hover:bg-ink-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-full ${tx.type === "credit" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"}`}>
                        {tx.type === "credit" ? <ArrowDownCircle className="size-5" /> : <ArrowUpCircle className="size-5" />}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-ink-900">{tx.title}</p>
                        <p className="text-xs text-ink-400 mt-0.5">{tx.createdAt}</p>
                      </div>
                    </div>
                    <span className={`font-bold text-sm ${tx.type === "credit" ? "text-emerald-600" : "text-rose-500"}`}>
                      {tx.type === "credit" ? "+" : "-"}{tx.currency || "₦"}{tx.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
                {transactions.length === 0 && (
                  <div className="p-8 text-center text-xs text-ink-400">
                    No payout transactions yet. Completed milestone supervision fees will appear here.
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          <div className="space-y-8">
            {/* Withdrawal Form */}
            <motion.div
              id="withdraw-section"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl p-6 border border-ink-100 bg-white shadow-sm"
            >
              <h3 className="font-bold text-ink-900 mb-4 text-base">Request Withdrawal</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider mb-2 block text-ink-600">Amount (NGN)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-ink-900 text-sm">₦</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0.00"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                      className="w-full pl-8 pr-4 py-3 rounded-xl border border-ink-200 bg-white font-bold text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-600 transition-all text-sm"
                    />
                  </div>
                </div>

                {defaultBank ? (
                  <div className="text-xs p-3 rounded-xl bg-ink-50 text-ink-600">
                    Destination: <span className="font-bold text-ink-900">{defaultBank.bankName}</span> ({defaultBank.accountNumber})
                  </div>
                ) : (
                  <div className="text-xs p-3 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
                    No bank account linked. <button onClick={() => setShowAddBank(true)} className="font-bold underline">Add one now</button>
                  </div>
                )}

                <button
                  onClick={handleWithdraw}
                  disabled={withdrawing || !withdrawAmount || !defaultBank}
                  className="w-full py-3 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                >
                  {withdrawing ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Processing…
                    </>
                  ) : (
                    "Withdraw Now"
                  )}
                </button>
              </div>
            </motion.div>

            {/* Platform Supervision Stats */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-2xl p-6 border border-ink-100 bg-white shadow-sm"
            >
              <h4 className="font-bold text-sm text-ink-900 mb-3">Supervision Fee Schedule</h4>
              <ul className="space-y-2.5 text-xs text-ink-600">
                <li className="flex justify-between items-center py-1 border-b border-ink-100">
                  <span>Standard Rate</span>
                  <span className="font-bold text-ink-900">5% per milestone</span>
                </li>
                <li className="flex justify-between items-center py-1 border-b border-ink-100">
                  <span>Payout Processing</span>
                  <span className="font-bold text-emerald-600">Instant (via Paystack)</span>
                </li>
                <li className="flex justify-between items-center py-1">
                  <span>Settlement Currency</span>
                  <span className="font-bold text-ink-900">NGN (Naira)</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
