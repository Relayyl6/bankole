"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Mail, Bell, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-toastify";
import Avatar from "@/components/avatar";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notification-context";
import { type Agent } from "@/lib/models";
import { apiClient } from "@/lib/api-client";
import useSWR from "swr";
import Link from "next/link";

export default function DashboardTopbar() {
  const { role, user } = useAuth();
  const { data: agentsRes } = useSWR('/agents', (url) => apiClient<{data: Agent[], meta: any}>(url));
  const agents = agentsRes?.data || [];
  
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isAgent = role === "agent";
  const displayName = user?.fullName || (isAgent ? "Agent" : "User");
  const displayEmail = user?.email || "user@bankole.com";
  const userInitials = displayName
    .split(" ")
    .filter(Boolean)
    .map((n: string) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || (isAgent ? "AG" : "US");

  const { notifications, markAllRead } = useNotifications();

  // Filter notifications by role (show "all" and the specific role)
  const roleNotifications = notifications.filter(
    (n) => !n.targetRole || n.targetRole === "all" || n.targetRole === role
  );
  
  const unreadCount = roleNotifications.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    markAllRead();
    toast.success("All notifications marked as read.");
  };

  const handleNotifClick = (title: string) => {
    // In a real app we might route to the notification's target
    toast.info(`Opened: ${title}`);
    setShowNotifications(false);
  };

  const handleAction = (msg: string) => {
    toast.info(msg);
  };

  return (
    <header className="h-24 px-8 flex items-center justify-between shrink-0 bg-[#f6f8fa] z-10">
      <div className="relative w-96">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-ink-400" />
        <input 
          type="text" 
          placeholder="Search projects..." 
          className="w-full bg-white rounded-full pl-12 pr-4 py-3 text-sm font-medium text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAction(`Searching for: ${e.currentTarget.value}`);
          }}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-ink-50 text-[10px] font-bold text-ink-400">⌘F</div>
      </div>
      
      <div className="flex items-center gap-4">
        <button 
          onClick={() => handleAction("Messages coming soon!")}
          className="size-10 rounded-full bg-white flex items-center justify-center text-ink-600 hover:text-ink-900 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-colors"
        >
          <Mail className="size-4" />
        </button>
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="size-10 rounded-full bg-white flex items-center justify-center text-ink-600 hover:text-ink-900 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-colors relative"
          >
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 size-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
            )}
          </button>
          
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-soft-xl border border-ink-100 overflow-hidden z-50"
              >
                <div className="px-4 py-3 border-b border-ink-100 flex items-center justify-between bg-ink-50/50">
                  <h3 className="font-bold text-ink-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-xs font-bold text-brand-600 hover:text-brand-700">Mark all as read</button>
                  )}
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {roleNotifications.length === 0 ? (
                    <div className="py-8 text-center px-4">
                      <Bell className="size-8 text-ink-300 mx-auto mb-2" />
                      <p className="text-sm font-bold text-ink-800">No new notifications</p>
                      <p className="text-xs text-ink-400 mt-1">You're completely caught up!</p>
                    </div>
                  ) : (
                    roleNotifications.map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => handleNotifClick(n.title)}
                        className={`p-4 border-b border-ink-50 flex items-start gap-3 hover:bg-ink-50/80 cursor-pointer transition-colors ${
                          !n.read ? 'bg-brand-50/20' : ''
                        }`}
                      >
                        <div className={`size-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          n.type === 'success' ? 'bg-emerald-50 text-emerald-500' :
                          n.type === 'error' ? 'bg-rose-50 text-rose-500' :
                          n.type === 'warning' ? 'bg-amber-50 text-amber-500' :
                          'bg-brand-50 text-brand-500'
                        }`}>
                          {n.type === 'success' ? <CheckCircle2 className="size-4" /> :
                           n.type === 'error' ? <AlertCircle className="size-4" /> :
                           n.type === 'warning' ? <AlertCircle className="size-4" /> :
                           <Bell className="size-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-ink-900 leading-tight">{n.title}</p>
                          <p className="text-xs text-ink-500 mt-1">{n.desc}</p>
                          <p className="text-[10px] text-ink-400 mt-1.5 font-medium flex items-center gap-1">
                            <Clock className="size-3" /> 
                            {new Date(n.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="px-4 py-2 bg-ink-50/50 border-t border-ink-100 text-center">
                  <Link href="/profile?tab=notifications" className="text-xs font-bold text-ink-500 hover:text-ink-900 block w-full">View all notifications</Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <Link href="/profile" className="flex items-center gap-3 ml-4 pl-4 border-l border-ink-200 hover:opacity-80 transition-opacity">
          <Avatar 
            initials={userInitials} 
            avatarUrl={user?.avatarUrl}
            hue={260} 
            size="md" 
          />
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-ink-900 leading-none">
              {displayName}
            </p>
            <p className="text-xs text-ink-500 mt-1">
              {displayEmail}
            </p>
          </div>
        </Link>
      </div>
    </header>
  );
}
