"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  ShieldCheck, LayoutDashboard, FolderKanban, Users, Settings, 
  HelpCircle, LogOut, User, Menu, X, CreditCard, PlusCircle, Building2
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { TokenManager } from "@/lib/api-client";
import DashboardTopbar from "@/components/dashboard-topbar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const { role, logout, user, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check token synchronously - if no token at all, redirect immediately
  const hasToken = typeof window !== "undefined" ? !!TokenManager.getToken() : true;

  useEffect(() => {
    // No token: redirect immediately
    if (!hasToken) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    // SWR finished loading and confirmed no user (real auth failure)
    if (!isLoading && !user) {
      TokenManager.clearToken();
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, isLoading, hasToken, pathname, router]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  // No token at all: show nothing while redirect fires
  if (!hasToken) return null;

  // Still loading user: show spinner (but don't redirect yet - SWR is fetching)
  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-sand flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-ink-600">Verifying session...</p>
        </div>
      </div>
    );
  }

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const SidebarContent = () => (
    <>
      <Link href="/" onClick={closeSidebar} className="p-8 flex items-center gap-3">
        <ShieldCheck className="size-8 text-brand-600" />
        <span className="text-xl font-bold text-ink-900 tracking-tight">Bankole</span>
      </Link>

      <div className="flex-1 px-4 overflow-y-auto">
        <p className="px-4 text-xs font-bold text-ink-400 uppercase tracking-widest mb-4 mt-2">Menu</p>
        <nav className="space-y-1">
          <Link 
            href="/dashboard" 
            onClick={closeSidebar}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-colors ${
              pathname === "/dashboard" 
                ? "bg-brand-50 text-brand-700" 
                : "text-ink-500 hover:bg-ink-50 hover:text-ink-900 font-medium"
            }`}
          >
            <LayoutDashboard className="size-5" />
            Dashboard
          </Link>
          <Link 
            href="/projects" 
            onClick={closeSidebar}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-colors ${
              pathname.startsWith("/projects") && pathname !== "/projects/new"
                ? "bg-brand-50 text-brand-700" 
                : "text-ink-500 hover:bg-ink-50 hover:text-ink-900 font-medium"
            }`}
          >
            <FolderKanban className="size-5" />
            Projects
          </Link>
          <Link 
            href="/dashboard/marketplace" 
            onClick={closeSidebar}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-colors ${
              pathname.startsWith("/dashboard/marketplace") 
                ? "bg-brand-50 text-brand-700" 
                : "text-ink-500 hover:bg-ink-50 hover:text-ink-900 font-medium"
            }`}
          >
            <Building2 className="size-5" />
            {role === "agent" ? "Open Opportunities" : "Marketplace"}
          </Link>
          {role !== "agent" && (
            <Link 
              href="/projects/new" 
              onClick={closeSidebar}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-colors ${
                pathname === "/projects/new"
                  ? "bg-brand-50 text-brand-700" 
                  : "text-ink-500 hover:bg-ink-50 hover:text-ink-900 font-medium"
              }`}
            >
              <ShieldCheck className="size-5" />
              Start a project
            </Link>
          )}
          <Link 
            href="/dashboard/agents" 
            onClick={closeSidebar}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-colors ${
              pathname.startsWith("/dashboard/agents") 
                ? "bg-brand-50 text-brand-700" 
                : "text-ink-500 hover:bg-ink-50 hover:text-ink-900 font-medium"
            }`}
          >
            <Users className="size-5" />
            {role === "agent" ? "Agent Directory" : "Agents"}
          </Link>
          <Link 
            href="/dashboard/payments" 
            onClick={closeSidebar}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-colors ${
              pathname.startsWith("/dashboard/payments") 
                ? "bg-brand-50 text-brand-700" 
                : "text-ink-500 hover:bg-ink-50 hover:text-ink-900 font-medium"
            }`}
          >
            <CreditCard className="size-5" />
            Payments
          </Link>
        </nav>

        <p className="px-4 text-xs font-bold text-ink-400 uppercase tracking-widest mb-4 mt-10">General</p>
        <nav className="space-y-1">
          <Link 
            href="/dashboard/settings" 
            onClick={closeSidebar}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-colors ${
              pathname.startsWith("/dashboard/settings") 
                ? "bg-brand-50 text-brand-700" 
                : "text-ink-500 hover:bg-ink-50 hover:text-ink-900 font-medium"
            }`}
          >
            <Settings className="size-5" />
            Settings
          </Link>
          <Link 
            href="/dashboard/help"
            onClick={closeSidebar}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-colors ${
              pathname.startsWith("/dashboard/help") 
                ? "bg-brand-50 text-brand-700" 
                : "text-ink-500 hover:bg-ink-50 hover:text-ink-900 font-medium"
            }`}
          >
            <HelpCircle className="size-5" />
            Help
          </Link>
          <Link 
            href="/profile"
            onClick={closeSidebar}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-colors ${
              pathname.startsWith("/profile") 
                ? "bg-brand-50 text-brand-700" 
                : "text-ink-500 hover:bg-ink-50 hover:text-ink-900 font-medium"
            }`}
          >
            <User className="size-5" />
            Profile
          </Link>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-ink-500 hover:bg-ink-50 hover:text-ink-900 font-medium transition-colors"
          >
            <LogOut className="size-5" />
            Logout
          </button>
        </nav>
      </div>
    </>
  );

  return (
    <div className="flex h-screen w-full bg-[#f6f8fa] overflow-hidden font-sans text-ink-900">
      
      {/* Mobile Toggle Button */}
      <button 
        onClick={() => setSidebarOpen(true)}
        className="fixed bottom-6 right-6 z-40 p-4 bg-brand-600 text-white rounded-full shadow-lg lg:hidden flex items-center justify-center hover:bg-brand-700 transition-colors"
        aria-label="Open sidebar"
      >
        <Menu className="size-6" />
      </button>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeSidebar}
              className="fixed inset-0 bg-ink-900/40 z-50 lg:hidden backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 w-64 bg-white flex flex-col shrink-0 border-r border-ink-100 z-50 lg:hidden shadow-2xl"
            >
              <div className="absolute top-8 right-4 z-50">
                <button onClick={closeSidebar} className="p-2 text-ink-500 hover:text-ink-900 hover:bg-ink-50 rounded-xl transition-colors">
                  <X className="size-5" />
                </button>
              </div>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="w-64 bg-white flex flex-col shrink-0 border-r border-ink-100 z-10 relative hidden lg:flex">
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <DashboardTopbar />
        
        <main className="flex-1 overflow-y-auto flex flex-col">
          <div className="flex-1">
            {children}
          </div>
          
          <footer className="mx-6 sm:mx-10 mb-6 mt-12 bg-white rounded-xl p-6 sm:px-8 sm:py-6 shadow-sm border border-ink-100 flex flex-col md:flex-row items-center justify-between gap-6 shrink-0">
            <div className="flex items-center gap-4 text-sm font-medium text-ink-500 text-center md:text-left">
              <div className="size-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0 hidden md:flex">
                <ShieldCheck className="size-6" />
              </div>
              <p>
                &copy; 2026 Bankole. Verified people, milestone-locked funds,<br className="hidden md:block"/>
                independent proof of progress.
              </p>
            </div>
            
            <div className="flex items-center gap-6 text-sm font-bold text-ink-600">
              <Link href="/dashboard" className="hover:text-ink-900 transition-colors">Dashboard</Link>
              <Link href="/dashboard/agents" className="hover:text-ink-900 transition-colors">Verified agents</Link>
              {role !== "agent" && (
                <Link href="/projects/new" className="hover:text-ink-900 transition-colors">Start a project</Link>
              )}
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
