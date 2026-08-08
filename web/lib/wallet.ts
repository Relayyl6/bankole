import { useState, useEffect, useCallback } from "react";

export interface WalletTransaction {
  id: string;
  title: string;
  amount: number;
  currency: string;
  type: "credit" | "debit";
  category?: "topup" | "mobilization" | "milestone_release" | "withdrawal" | "transfer";
  createdAt: string;
  projectId?: string;
  agentId?: string;
  agentName?: string;
  senderName?: string;
  reference?: string;
  status?: "completed" | "pending" | "failed";
}

const DEFAULT_INITIAL_BALANCE = 0; // Starts at ₦0; actual balance comes from user top-ups / transfers

function getNormalizedKeys(...keys: (string | undefined | null)[]): string[] {
  const set = new Set<string>();
  for (const k of keys) {
    if (!k || typeof k !== "string") continue;
    const trimmed = k.trim();
    if (!trimmed) continue;
    set.add(trimmed);
    set.add(trimmed.toLowerCase());
    set.add(trimmed.toLowerCase().replace(/\s+/g, "_"));
    set.add(trimmed.toLowerCase().replace(/[^a-z0-9]/g, ""));
    // If key has an agent_ or user_ prefix, also include without prefix
    if (trimmed.startsWith("agent_") || trimmed.startsWith("user_")) {
      const stripped = trimmed.slice(6);
      if (stripped) {
        set.add(stripped);
        set.add(stripped.toLowerCase());
      }
    }
  }
  return Array.from(set);
}

export const WalletManager = {
  getBalance: (...userKeys: (string | undefined | null)[]): number => {
    if (typeof window === "undefined") return DEFAULT_INITIAL_BALANCE;
    const keys = getNormalizedKeys(...userKeys);
    if (keys.length === 0) return DEFAULT_INITIAL_BALANCE;

    let maxBalance = DEFAULT_INITIAL_BALANCE;
    let found = false;

    for (const key of keys) {
      try {
        const stored = localStorage.getItem(`bankole_wallet_${key}`);
        if (stored !== null) {
          const val = parseFloat(stored);
          if (!isNaN(val)) {
            maxBalance = Math.max(maxBalance, val);
            found = true;
          }
        }
      } catch {}
    }

    return found ? maxBalance : DEFAULT_INITIAL_BALANCE;
  },

  setBalance: (userId: string | undefined, newBalance: number, ...aliases: (string | undefined | null)[]): void => {
    if (typeof window === "undefined" || !userId) return;
    const keys = getNormalizedKeys(userId, ...aliases);
    try {
      const valStr = String(Math.max(0, newBalance));
      for (const key of keys) {
        localStorage.setItem(`bankole_wallet_${key}`, valStr);
      }
      window.dispatchEvent(new Event("bankole_wallet_updated"));
    } catch {}
  },

  getTransactions: (...userKeys: (string | undefined | null)[]): WalletTransaction[] => {
    if (typeof window === "undefined") return [];
    const keys = getNormalizedKeys(...userKeys);
    if (keys.length === 0) return [];

    const txMap = new Map<string, WalletTransaction>();

    for (const key of keys) {
      try {
        const stored = localStorage.getItem(`bankole_wallet_txs_${key}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            for (const tx of parsed) {
              const uniqueKey = tx.reference || tx.id || JSON.stringify(tx);
              if (!txMap.has(uniqueKey)) {
                txMap.set(uniqueKey, tx);
              }
            }
          }
        }
      } catch {}
    }

    const all = Array.from(txMap.values());
    // Sort descending by createdAt
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  addTransaction: (
    userId: string | undefined,
    tx: Omit<WalletTransaction, "id" | "createdAt">,
    ...aliases: (string | undefined | null)[]
  ): WalletTransaction => {
    const fullTx: WalletTransaction = {
      ...tx,
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
      status: tx.status || "completed",
    };

    if (typeof window !== "undefined" && userId) {
      const keys = getNormalizedKeys(userId, ...aliases);
      try {
        for (const key of keys) {
          const existing = WalletManager.getTransactions(key);
          const updated = [fullTx, ...existing.filter(e => e.id !== fullTx.id && e.reference !== fullTx.reference)];
          localStorage.setItem(`bankole_wallet_txs_${key}`, JSON.stringify(updated));
        }
        window.dispatchEvent(new Event("bankole_wallet_updated"));
      } catch {}
    }

    return fullTx;
  },

  sendFundsToAgent: (
    userId: string | undefined,
    amount: number,
    details: {
      agentId: string;
      agentName: string;
      senderName?: string;
      projectId?: string;
      projectName?: string;
      purpose: string;
      currency?: string;
    }
  ): { success: boolean; error?: string; newBalance?: number } => {
    if (!userId) return { success: false, error: "User authentication required" };
    if (amount <= 0) return { success: false, error: "Please enter a valid amount greater than zero." };

    const currentBalance = WalletManager.getBalance(userId);
    if (currentBalance < amount) {
      return {
        success: false,
        error: `Insufficient virtual wallet balance (Available: ₦${currentBalance.toLocaleString()}). Please top up your wallet first.`,
      };
    }

    const ref = `BNK-MOB-${Date.now().toString().slice(-6)}`;
    const senderName = details.senderName || "Diaspora Sender";

    // 1. Debit Sender
    const newSenderBalance = currentBalance - amount;
    WalletManager.setBalance(userId, newSenderBalance);

    WalletManager.addTransaction(userId, {
      title: `${details.purpose} — ${details.agentName}`,
      amount,
      currency: details.currency || "NGN",
      type: "debit",
      category: "mobilization",
      agentId: details.agentId,
      agentName: details.agentName,
      senderName,
      projectId: details.projectId,
      reference: ref,
      status: "completed",
    });

    // 2. Credit Agent
    // Credit agent using agentId and agentName keys
    const agentCurrentBalance = WalletManager.getBalance(details.agentId, details.agentName);
    const newAgentBalance = agentCurrentBalance + amount;
    WalletManager.setBalance(details.agentId, newAgentBalance, details.agentName);

    // Record credit transaction for the Agent
    WalletManager.addTransaction(
      details.agentId,
      {
        title: `${details.purpose} received from ${senderName}${details.projectName ? ` (${details.projectName})` : ""}`,
        amount,
        currency: details.currency || "NGN",
        type: "credit",
        category: "mobilization",
        agentId: details.agentId,
        agentName: details.agentName,
        senderName,
        projectId: details.projectId,
        reference: ref,
        status: "completed",
      },
      details.agentName
    );

    return { success: true, newBalance: newSenderBalance };
  },

  topUp: (
    userId: string | undefined,
    amount: number,
    reference?: string
  ): { success: boolean; newBalance: number } => {
    const current = WalletManager.getBalance(userId);
    const newBal = current + amount;
    WalletManager.setBalance(userId, newBal);

    WalletManager.addTransaction(userId, {
      title: "Wallet Top-up via Virtual Account",
      amount,
      currency: "NGN",
      type: "credit",
      category: "topup",
      reference: reference || `BNK-TOP-${Date.now().toString().slice(-6)}`,
      status: "completed",
    });

    return { success: true, newBalance: newBal };
  }
};

export function useWallet(userId?: string, ...aliases: (string | undefined | null)[]) {
  const [balance, setBalance] = useState<number>(() => WalletManager.getBalance(userId, ...aliases));
  const [transactions, setTransactions] = useState<WalletTransaction[]>(() => WalletManager.getTransactions(userId, ...aliases));

  const refresh = useCallback(() => {
    if (userId || aliases.some(Boolean)) {
      setBalance(WalletManager.getBalance(userId, ...aliases));
      setTransactions(WalletManager.getTransactions(userId, ...aliases));
    }
  }, [userId, ...aliases]);

  useEffect(() => {
    refresh();
    const handleUpdate = () => refresh();
    window.addEventListener("bankole_wallet_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("bankole_wallet_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [refresh]);

  return {
    balance,
    transactions,
    refresh,
    sendFundsToAgent: (amount: number, details: Parameters<typeof WalletManager.sendFundsToAgent>[2]) =>
      WalletManager.sendFundsToAgent(userId, amount, details),
    topUp: (amount: number, ref?: string) => WalletManager.topUp(userId, amount, ref),
  };
}
