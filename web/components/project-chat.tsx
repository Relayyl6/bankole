"use client";

import { useState, useRef, useEffect } from "react";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { Send, User, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

interface ChatAuthor {
  id: string;
  name: string;
  role: string;
}

interface ChatMessage {
  id: string;
  projectId: string;
  author: ChatAuthor;
  body: string;
  createdAt: string;
}

export default function ProjectChat({ projectId }: { projectId: string }) {
  const { user, role } = useAuth(); // "sender" | "agent"
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messagesResponse, mutate } = useSWR(
    `/projects/${projectId}/messages`, 
    (url) => apiClient<{ data: ChatMessage[] }>(url)
  );
  
  const messages = messagesResponse?.data || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    const messageText = newMessage.trim();
    setIsSending(true);
    try {
      const createdMessage = await apiClient<ChatMessage>(`/projects/${projectId}/messages`, {
        method: "POST",
        body: { body: messageText },
      });
      setNewMessage("");
      
      if (createdMessage && createdMessage.id) {
        mutate(
          (curr) => (curr ? { ...curr, data: [...curr.data, createdMessage] } : { data: [createdMessage] }),
          false
        );
      } else {
        mutate();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send message");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex flex-col h-[500px] rounded-[32px] bg-white shadow-soft overflow-hidden">
      <div className="p-6 border-b border-ink-100 shrink-0">
        <h2 className="font-bold text-lg text-ink-900">Project Messages</h2>
        <p className="text-sm text-ink-500 mt-1">Chat securely about this project.</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-ink-50/30">
        {messages.map((msg) => {
          const isMe = msg.author?.id === user?.id || msg.author?.role === role;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
              <div className="flex items-center gap-2 mb-1">
                {!isMe && (
                  <span className="text-xs font-bold text-ink-500">
                    {msg.author?.name || msg.author?.role || "Participant"}
                  </span>
                )}
              </div>
              <div 
                className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
                  isMe 
                    ? "bg-brand-600 text-white rounded-tr-none" 
                    : "bg-white border border-ink-100 text-ink-900 shadow-sm rounded-tl-none"
                }`}
              >
                {msg.body}
              </div>
              <span className="text-[10px] text-ink-400 mt-1 font-medium">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-ink-400 text-sm">
            No messages yet. Start the conversation!
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-ink-100 shrink-0">
        <form onSubmit={handleSendMessage} className="relative flex items-center">
          <input 
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="w-full rounded-full bg-ink-50 border border-ink-200 px-5 py-3 pr-14 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
          <button 
            type="submit" 
            disabled={isSending || !newMessage.trim()}
            className="absolute right-2 p-2 rounded-full bg-brand-600 text-white hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:bg-ink-300"
          >
            <Send className="size-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
