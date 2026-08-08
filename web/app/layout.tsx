import type { Metadata } from "next";
import "./globals.css";
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from "@/lib/auth-context";
import { NotificationProvider } from "@/lib/notification-context";
import DevRoleSwitcher from "@/components/dev-role-switcher";

export const metadata: Metadata = {
  title: "Bankole: Fund what matters back home, verified every step",
  description:
    "Bankole is a verified, milestone-based platform that lets diaspora Africans fund infrastructure back home without needing to personally supervise it.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@400..700&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
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
