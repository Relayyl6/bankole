"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Search, 
  Send, PhoneCall, Video,
  MessageSquare,
  MoreVertical
} from "lucide-react";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { Agent } from "@/lib/models";
import { useAuth } from "@/lib/auth-context";
import Avatar from "@/components/avatar";

interface DmMessage {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export default function MessagesPage() {
  const { user, role } = useAuth();
  
  // 1. Fetch Contacts (Agents for Sender, or Senders for Agent - for now we just fetch agents as a generic contact list)
  const { data: contactsRes, isLoading: isLoadingContacts } = useSWR(
    role === "sender" ? `/agents` : null, 
    url => apiClient<{data: Agent[]}>(url).catch(() => ({ data: [] }))
  );
  const contacts = contactsRes?.data || [];
  
  // Mock some contacts if agent (since there is no /senders endpoint)
  const mockContacts = role === "agent" ? [
    { id: "sender-1", name: "Sarah O.", initials: "SO", avatarHue: 15, role: "sender" },
    { id: "sender-2", name: "David K.", initials: "DK", avatarHue: 45, role: "sender" },
  ] : [];

  const displayContacts = role === "agent" ? mockContacts : contacts;

  const [activeContacts, setActiveContacts] = useState<Agent[]>([]);
  
  useEffect(() => {
    if (typeof window !== 'undefined' && displayContacts.length > 0 && user?.id) {
      const active = displayContacts.filter(c => {
        const fallbackThreadId = role === "sender" 
          ? `local_thread_${user.id}_${c.id}`
          : `local_thread_${c.id}_${user.id}`;
        return !!localStorage.getItem(`bankole_dm_${fallbackThreadId}`);
      });
      setActiveContacts(active);
    }
  }, [displayContacts, user?.id, role]);

  const [searchQuery, setSearchQuery] = useState("");
  const filteredContacts = activeContacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [localMessages, setLocalMessages] = useState<DmMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeContact = displayContacts.find(c => c.id === activeChat);

  const getLocalThreadMessages = (tId: string): DmMessage[] => {
    if (typeof window === "undefined" || !tId) return [];
    try {
      const stored = localStorage.getItem(`bankole_dm_${tId}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const handleOpenChat = async (contactId: string) => {
    setActiveChat(contactId);
    
    // Exact match for the fallback thread ID used in the agents page
    const fallbackThreadId = role === "sender" 
      ? `local_thread_${user?.id || 'sender'}_${contactId}`
      : `local_thread_${contactId}_${user?.id || 'agent'}`; // if agent is logged in, contactId is the sender
    
    setThreadId(fallbackThreadId);
    setLocalMessages(getLocalThreadMessages(fallbackThreadId));

    try {
      // For sender chatting with agent, the endpoint expects { agentId: contactId }
      const res = await apiClient<{threadId: string}>('/messages/threads', { 
        method: 'POST', 
        body: role === "sender" ? { agentId: contactId } : { senderId: contactId } 
      });
      if (res?.threadId) {
        setThreadId(res.threadId);
      }
    } catch {
      // Seamlessly continue with local thread if backend throws 404
    }
  };

  useEffect(() => {
    if (threadId) {
      setLocalMessages(getLocalThreadMessages(threadId));
    } else {
      setLocalMessages([]);
    }
  }, [threadId]);

  useEffect(() => {
    // Auto-scroll to bottom of chat
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [localMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !threadId || !user?.id) return;

    const newMsg: DmMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      authorId: user.id,
      body: messageText.trim(),
      createdAt: new Date().toISOString(),
    };

    const updated = [...localMessages, newMsg];
    setLocalMessages(updated);
    setMessageText("");
    
    if (typeof window !== "undefined") {
      localStorage.setItem(`bankole_dm_${threadId}`, JSON.stringify(updated));
    }
    
    // Attempt backend sync silently if exists
    try {
      await apiClient(`/messages/threads/${threadId}/messages`, {
        method: "POST",
        body: { body: newMsg.body }
      });
    } catch {}
  };

  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-hidden">
      
      {/* Page Header */}
      <div className="bg-white border-b border-ink-100 p-6 shrink-0 flex items-center justify-between z-10 relative">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Messages</h1>
          <p className="text-ink-500 mt-1 text-sm">Connect with your {role === "agent" ? "clients" : "agents"} directly.</p>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden bg-ink-50/30">
        
        {/* Left Pane - Contact List */}
        <div className="w-[320px] bg-white border-r border-ink-100 flex flex-col shrink-0 h-full overflow-hidden relative z-10">
          <div className="p-4 border-b border-ink-100 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-400" />
              <input 
                type="text" 
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-ink-50 rounded-xl pl-9 pr-4 py-2.5 text-sm border-none focus:ring-2 focus:ring-brand-500/20 outline-none"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {isLoadingContacts ? (
              <div className="p-8 text-center text-ink-500 text-sm">Loading contacts...</div>
            ) : filteredContacts.length === 0 ? (
              <div className="p-8 text-center text-ink-500 text-sm">
                No active conversations.<br/><br/>Visit the Agent Directory to start a chat.
              </div>
            ) : (
              filteredContacts.map(contact => (
                <button 
                  key={contact.id}
                  onClick={() => handleOpenChat(contact.id)}
                  className={`w-full p-4 flex items-center gap-3 text-left transition-colors border-b border-ink-50 last:border-0 ${
                    activeChat === contact.id ? 'bg-brand-50' : 'hover:bg-ink-50'
                  }`}
                >
                  <Avatar initials={contact.initials} hue={contact.avatarHue} size="md" />
                  <div className="flex-1 overflow-hidden">
                    <h4 className={`font-bold truncate text-sm ${activeChat === contact.id ? 'text-brand-900' : 'text-ink-900'}`}>
                      {contact.name}
                    </h4>
                    <p className="text-xs text-ink-500 truncate mt-0.5 font-medium">
                      {role === "agent" ? "Project Sender" : "Verified Agent"}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Pane - Chat Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-ink-50/50">
          {!activeContact ? (
            <div className="flex-1 flex flex-col items-center justify-center text-ink-400">
              <MessageSquare className="size-16 mb-4 opacity-20" />
              <p className="font-bold text-ink-500">Select a conversation</p>
              <p className="text-sm mt-1">Choose a contact from the left to start messaging.</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-ink-100 p-5 flex items-center justify-between shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-3">
                  <Avatar initials={activeContact.initials} hue={activeContact.avatarHue} size="md" />
                  <div>
                    <h3 className="font-bold text-ink-900 leading-tight">{activeContact.name}</h3>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">
                      <span className="size-1.5 rounded-full bg-emerald-500"></span> Online
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button className="size-9 flex items-center justify-center rounded-full hover:bg-ink-50 text-ink-500 transition-colors">
                    <PhoneCall className="size-4" />
                  </button>
                  <button className="size-9 flex items-center justify-center rounded-full hover:bg-ink-50 text-ink-500 transition-colors">
                    <Video className="size-4" />
                  </button>
                  <button className="size-9 flex items-center justify-center rounded-full hover:bg-ink-50 text-ink-500 transition-colors ml-2">
                    <MoreVertical className="size-5" />
                  </button>
                </div>
              </div>

              {/* Chat Messages List */}
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                {localMessages.length === 0 ? (
                  <div className="text-center text-sm text-ink-500 my-auto">
                    No messages yet. Say hi to {activeContact.name.split(' ')[0]}!
                  </div>
                ) : (
                  localMessages.map(msg => {
                    const isMe = msg.authorId === user?.id;
                    if (isMe) {
                      return (
                        <div key={msg.id} className="flex gap-3 max-w-[75%] ml-auto justify-end">
                          <div className="bg-brand-600 text-white px-4 py-3 rounded-2xl rounded-br-sm shadow-sm text-sm whitespace-pre-wrap leading-relaxed">
                            {msg.body}
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={msg.id} className="flex gap-3 max-w-[75%]">
                        <Avatar initials={activeContact.initials} hue={activeContact.avatarHue} size="sm" className="mt-auto shrink-0" />
                        <div className="bg-white border border-ink-100 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm text-sm text-ink-700 whitespace-pre-wrap leading-relaxed">
                          {msg.body}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="bg-white border-t border-ink-100 p-4 shrink-0">
                <form onSubmit={handleSendMessage} className="flex gap-3 max-w-4xl mx-auto">
                  <input 
                    type="text" 
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-ink-50 rounded-2xl px-5 py-3.5 text-sm border-none outline-none focus:ring-2 focus:ring-brand-500/30 transition-all"
                  />
                  <button 
                    type="submit"
                    disabled={!messageText.trim()}
                    className="size-12 shrink-0 rounded-full bg-brand-600 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-700 transition-colors shadow-sm"
                  >
                    <Send className="size-4 ml-1" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
