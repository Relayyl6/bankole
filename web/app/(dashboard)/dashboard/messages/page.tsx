"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Send, PhoneCall, Video, MessageSquare, MoreVertical, ArrowLeft } from "lucide-react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import Avatar from "@/components/avatar";

interface DmThread {
  threadId: string;
  participant: { id: string; name: string; avatarUrl: string | null };
  lastMessage: string | null;
  unreadCount: number;
  updatedAt: string;
}

interface DmMessage {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
}

interface LocalThread {
  threadId: string;
  participantId: string;
  participantName: string;
  lastMessage: string | null;
  updatedAt: string;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function deterministicHue(id: string) {
  return id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
}

// ── localStorage helpers ────────────────────────────────────────────────────

const LS_PREFIX = "bankole_dm_";
const LS_THREADS_KEY = "bankole_dm_threads";

function readLocalMessages(threadId: string): DmMessage[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(`${LS_PREFIX}${threadId}`) || "[]"); }
  catch { return []; }
}

function writeLocalMessages(threadId: string, msgs: DmMessage[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${LS_PREFIX}${threadId}`, JSON.stringify(msgs));
}

function readLocalThreadIndex(): LocalThread[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(LS_THREADS_KEY) || "[]"); }
  catch { return []; }
}

function upsertLocalThread(thread: LocalThread) {
  if (typeof window === "undefined") return;
  const existing = readLocalThreadIndex();
  const idx = existing.findIndex((t) => t.threadId === thread.threadId);
  if (idx >= 0) existing[idx] = { ...existing[idx], ...thread };
  else existing.unshift(thread);
  localStorage.setItem(LS_THREADS_KEY, JSON.stringify(existing));
}

// ── Component ───────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const { user } = useAuth();

  // Backend threads (optional — graceful 404 handled)
  const { data: backendThreadsRes, mutate: mutateBackendThreads } = useSWR(
    "/messages/threads",
    (url) => apiClient<{ data: DmThread[] }>(url).catch(() => ({ data: [] })),
    { refreshInterval: 5000 }
  );
  const backendThreads: DmThread[] = backendThreadsRes?.data || [];

  // Local thread index
  const [localThreadIndex, setLocalThreadIndex] = useState<LocalThread[]>([]);
  useEffect(() => { setLocalThreadIndex(readLocalThreadIndex()); }, []);

  // Merge backend + local-only threads
  const backendIds = new Set(backendThreads.map((t) => t.threadId));
  const localOnlyThreads = localThreadIndex.filter((t) => !backendIds.has(t.threadId));
  const unifiedThreads: DmThread[] = [
    ...backendThreads,
    ...localOnlyThreads.map((t) => ({
      threadId: t.threadId,
      participant: { id: t.participantId, name: t.participantName, avatarUrl: null },
      lastMessage: t.lastMessage,
      unreadCount: 0,
      updatedAt: t.updatedAt,
    })),
  ];

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const filteredThreads = unifiedThreads.filter((t) =>
    t.participant.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const searchParams = useSearchParams();
  const urlThreadId = searchParams.get("threadId");

  // Active thread (null = show thread list on mobile)
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const activeThread = unifiedThreads.find((t) => t.threadId === activeThreadId) || null;
  const isLocalThread = activeThreadId?.startsWith("local_") ?? false;

  // Auto-open thread from URL param once threads are loaded
  useEffect(() => {
    if (urlThreadId && unifiedThreads.length > 0 && !activeThreadId) {
      const match = unifiedThreads.find((t) => t.threadId === urlThreadId);
      if (match) setActiveThreadId(urlThreadId);
    }
  }, [urlThreadId, unifiedThreads.length]);

  // Messages
  const { data: backendMsgsRes, mutate: mutateMessages } = useSWR(
    activeThreadId && !isLocalThread ? `/messages/threads/${activeThreadId}/messages` : null,
    (url) => apiClient<{ data: DmMessage[] }>(url).catch(() => ({ data: [] })),
    { refreshInterval: 3000 }
  );

  const [localMessages, setLocalMessages] = useState<DmMessage[]>([]);
  useEffect(() => {
    if (activeThreadId) setLocalMessages(readLocalMessages(activeThreadId));
    else setLocalMessages([]);
  }, [activeThreadId]);

  const messages: DmMessage[] = isLocalThread
    ? localMessages
    : (backendMsgsRes?.data || localMessages);

  // Auto-scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send
  const [messageText, setMessageText] = useState("");

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeThreadId || !user?.id) return;
    const text = messageText.trim();
    setMessageText("");

    const newMsg: DmMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      authorId: user.id,
      body: text,
      createdAt: new Date().toISOString(),
    };

    const updated = [...readLocalMessages(activeThreadId), newMsg];
    writeLocalMessages(activeThreadId, updated);
    setLocalMessages(updated);

    if (activeThread) {
      upsertLocalThread({
        threadId: activeThreadId,
        participantId: activeThread.participant.id,
        participantName: activeThread.participant.name,
        lastMessage: text,
        updatedAt: new Date().toISOString(),
      });
      setLocalThreadIndex(readLocalThreadIndex());
    }

    if (!isLocalThread) {
      try {
        await apiClient(`/messages/threads/${activeThreadId}/messages`, {
          method: "POST",
          body: { body: text },
        });
        mutateMessages();
        mutateBackendThreads();
      } catch {}
    }
  };

  // ── Thread List Panel ────────────────────────────────────────────────────
  const threadListPanel = (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-ink-100 shrink-0">
        <h1 className="text-2xl font-bold text-ink-900">Messages</h1>
        <p className="text-ink-500 mt-0.5 text-sm">Your conversations with agents and senders.</p>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-ink-100 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-ink-50 rounded-xl pl-9 pr-4 py-2.5 text-sm border-none outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
      </div>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto">
        {filteredThreads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 text-ink-400">
            <MessageSquare className="size-12 mb-3 opacity-20" />
            <p className="font-bold text-ink-500">No messages yet.</p>
            <p className="text-sm mt-1">
              Go to the Agents page and tap <span className="font-bold">Message</span> to start a conversation.
            </p>
          </div>
        ) : (
          filteredThreads.map((thread) => (
            <button
              key={thread.threadId}
              onClick={() => setActiveThreadId(thread.threadId)}
              className="w-full p-4 flex items-center gap-3 text-left transition-colors border-b border-ink-50 last:border-0 hover:bg-ink-50 active:bg-ink-100"
            >
              <Avatar
                initials={getInitials(thread.participant.name)}
                hue={deterministicHue(thread.participant.id)}
                size="md"
              />
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold truncate text-sm text-ink-900">{thread.participant.name}</h4>
                  {thread.unreadCount > 0 && (
                    <span className="shrink-0 size-5 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {thread.unreadCount}
                    </span>
                  )}
                </div>
                {thread.lastMessage && (
                  <p className="text-xs text-ink-500 truncate mt-0.5 font-medium">{thread.lastMessage}</p>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );

  // ── Chat Panel ────────────────────────────────────────────────────────────
  const chatPanel = activeThread ? (
    <div className="flex flex-col h-full bg-ink-50/30 overflow-hidden">
      {/* Chat Header */}
      <div className="bg-white border-b border-ink-100 px-4 py-3 flex items-center gap-3 shrink-0 shadow-sm">
        {/* Back button — mobile only */}
        <button
          onClick={() => setActiveThreadId(null)}
          className="md:hidden size-9 flex items-center justify-center rounded-full hover:bg-ink-50 text-ink-500 transition-colors -ml-1 mr-1"
        >
          <ArrowLeft className="size-5" />
        </button>
        <Avatar
          initials={getInitials(activeThread.participant.name)}
          hue={deterministicHue(activeThread.participant.id)}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-ink-900 leading-tight truncate">{activeThread.participant.name}</h3>
          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">
            <span className="size-1.5 rounded-full bg-emerald-500" /> Online
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button className="size-9 flex items-center justify-center rounded-full hover:bg-ink-50 text-ink-500 transition-colors">
            <PhoneCall className="size-4" />
          </button>
          <button className="size-9 flex items-center justify-center rounded-full hover:bg-ink-50 text-ink-500 transition-colors">
            <Video className="size-4" />
          </button>
          <button className="size-9 flex items-center justify-center rounded-full hover:bg-ink-50 text-ink-500 transition-colors">
            <MoreVertical className="size-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-3">
        {messages.length === 0 ? (
          <div className="text-center text-sm text-ink-500 my-auto">
            No messages yet. Say hi to {activeThread.participant.name.split(" ")[0]}!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.authorId === user?.id;
            return isMe ? (
              <div key={msg.id} className="flex gap-2 max-w-[80%] ml-auto justify-end">
                <div className="bg-brand-600 text-white px-4 py-2.5 rounded-2xl rounded-br-sm shadow-sm text-sm whitespace-pre-wrap leading-relaxed">
                  {msg.body}
                </div>
              </div>
            ) : (
              <div key={msg.id} className="flex gap-2 max-w-[80%]">
                <Avatar
                  initials={getInitials(activeThread.participant.name)}
                  hue={deterministicHue(activeThread.participant.id)}
                  size="sm"
                  className="mt-auto shrink-0"
                />
                <div className="bg-white border border-ink-100 px-4 py-2.5 rounded-2xl rounded-bl-sm shadow-sm text-sm text-ink-700 whitespace-pre-wrap leading-relaxed">
                  {msg.body}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-ink-100 p-3 sm:p-4 shrink-0">
        <form onSubmit={handleSendMessage} className="flex gap-2 sm:gap-3">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-ink-50 rounded-2xl px-4 py-3 text-sm border-none outline-none focus:ring-2 focus:ring-brand-500/30 transition-all"
          />
          <button
            type="submit"
            disabled={!messageText.trim()}
            className="size-11 shrink-0 rounded-full bg-brand-600 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-700 transition-colors shadow-sm"
          >
            <Send className="size-4 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  ) : (
    // Desktop empty state (no thread selected)
    <div className="flex-1 flex flex-col items-center justify-center text-ink-400 bg-ink-50/30">
      <MessageSquare className="size-16 mb-4 opacity-20" />
      <p className="font-bold text-ink-500">Select a conversation</p>
      <p className="text-sm mt-1">Choose a contact from the left to start messaging.</p>
    </div>
  );

  // ── Layout: mobile = stack panels, desktop = side-by-side ────────────────
  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-80px)] max-h-[calc(100vh-80px)] w-full overflow-hidden">

      {/* Mobile: show either thread list OR chat — never both */}
      <div className="md:hidden flex-1 overflow-hidden">
        {activeThreadId ? chatPanel : threadListPanel}
      </div>

      {/* Desktop: side by side */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {/* Left pane */}
        <div className="w-[300px] lg:w-[340px] border-r border-ink-100 shrink-0 flex flex-col h-full overflow-hidden">
          {threadListPanel}
        </div>
        {/* Right pane */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {chatPanel}
        </div>
      </div>

    </div>
  );
}
