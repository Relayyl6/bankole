"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type NotificationType = "info" | "success" | "warning" | "error";

export interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  type: NotificationType;
  read: boolean;
  targetRole?: "agent" | "sender" | "all";
}

interface NotificationContextValue {
  notifications: NotificationItem[];
  addNotification: (notif: Omit<NotificationItem, "id" | "time" | "read">) => void;
  markAllRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("bankole-notifications");
    if (saved) {
      try {
        setNotifications(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse notifications", e);
      }
    } else {
      // Seed with some mock data for demo purposes
      setNotifications([
        {
          id: "mock-1",
          title: "Welcome to Bankole",
          desc: "Your account has been created successfully.",
          time: new Date().toISOString(),
          type: "success",
          read: false,
          targetRole: "all",
        }
      ]);
    }
    setIsLoaded(true);
  }, []);

  // Save to local storage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("bankole-notifications", JSON.stringify(notifications));
    }
  }, [notifications, isLoaded]);

  const addNotification = (notif: Omit<NotificationItem, "id" | "time" | "read">) => {
    setNotifications((prev) => [
      {
        ...notif,
        id: `notif-${Date.now()}-${Math.random()}`,
        time: new Date().toISOString(),
        read: false,
      },
      ...prev,
    ]);
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAllRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
