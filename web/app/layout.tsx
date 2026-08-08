import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Caveat } from "next/font/google";
import "./globals.css";
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-caveat-custom",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bankole: Fund what matters back home, verified every step",
  description:
    "Bankole is a verified, milestone-based platform that lets diaspora Africans fund infrastructure back home without needing to personally supervise it.",
};

import { AuthProvider } from "@/lib/auth-context";
import { NotificationProvider } from "@/lib/notification-context";
import DevRoleSwitcher from "@/components/dev-role-switcher";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} ${caveat.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AuthProvider>
          <NotificationProvider>
            {children}
            <DevRoleSwitcher />
            <ToastContainer position="bottom-right" />
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
