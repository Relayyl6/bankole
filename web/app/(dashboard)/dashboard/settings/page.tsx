"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Settings as SettingsIcon, Bell, Shield, CreditCard, User, Globe, Mail, X } from "lucide-react";
import { toast } from "react-toastify";
import { apiClient } from "@/lib/api-client";
import { motion, AnimatePresence } from "framer-motion";

function PasswordModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return toast.error("Fill all fields");
    setLoading(true);
    try {
      await apiClient("/auth/password", { method: "POST", body: { currentPassword, newPassword } });
      toast.success("Password updated successfully");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 sm:pt-14 md:pt-16 overflow-y-auto bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl p-8 relative w-full max-w-sm">
        <button onClick={onClose} className="absolute top-4 right-4"><X className="size-5 text-ink-500" /></button>
        <h2 className="text-xl font-bold mb-4 text-ink-900">Update Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-bold block mb-1">Current Password</label>
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full px-4 py-2 border rounded-xl" />
          </div>
          <div>
            <label className="text-sm font-bold block mb-1">New Password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-4 py-2 border rounded-xl" />
          </div>
          <button disabled={loading} type="submit" className="w-full py-2 bg-brand-600 text-white rounded-xl font-bold">Update</button>
        </form>
      </div>
    </motion.div>
  );
}

import { useNotifications } from "@/lib/notification-context";

function TwoFactorModal({ onClose, onVerified }: { onClose: () => void; onVerified?: () => void }) {
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const { addNotification } = useNotifications();

  useEffect(() => {
    apiClient<{ qrCodeUrl: string; secret: string }>("/auth/2fa/enable", { method: "POST" })
      .then((res) => {
        setQr(res.qrCodeUrl);
        setSecret(res.secret);
      })
      .catch((err) => {
        toast.error(err.message || "Failed to initiate 2FA");
        onClose();
      });
  }, [onClose]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim() || verificationCode.trim().length < 6) {
      toast.error("Please enter a valid 6-digit verification code");
      return;
    }
    setIsVerifying(true);
    try {
      await apiClient("/auth/2fa/verify", {
        method: "POST",
        body: {
          code: verificationCode.trim(),
          token: verificationCode.trim(),
        },
      });

      toast.success("Two-factor authentication successfully enabled!");
      addNotification({
        title: "Two-Factor Authentication Enabled",
        desc: "Your account is now protected with 2FA authenticator verification.",
        type: "success",
      });
      onVerified?.();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Invalid 2FA code. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 sm:pt-14 md:pt-16 overflow-y-auto bg-black/50 backdrop-blur-sm"
    >
      <div className="bg-white rounded-3xl p-6 sm:p-8 relative w-full max-w-md shadow-2xl border border-ink-100">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 size-8 rounded-full bg-ink-50 text-ink-400 hover:text-ink-900 flex items-center justify-center transition-colors"
        >
          <X className="size-4" />
        </button>
        <h2 className="text-xl font-black mb-2 text-ink-900">Enable Two-Factor Authentication</h2>
        <p className="text-xs text-ink-500 mb-6">
          Scan the QR code below using Google Authenticator, Authy, or 1Password.
        </p>

        {qr ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="p-3 bg-white border-2 border-brand-100 rounded-2xl shadow-sm">
              <img src={qr} alt="2FA QR Code" className="size-44 object-contain rounded-lg" />
            </div>
            
            <div className="text-center w-full">
              <p className="text-[11px] font-bold text-ink-400 uppercase tracking-wider mb-1">Manual Setup Key</p>
              <p className="text-xs font-mono font-bold bg-ink-50 text-ink-700 px-3 py-1.5 rounded-xl border border-ink-200/60 select-all break-all">
                {secret}
              </p>
            </div>

            <form onSubmit={handleVerify} className="w-full space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1.5 text-left">
                  Enter 6-Digit Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  inputMode="numeric"
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ""))}
                  className="w-full px-4 py-3 border border-ink-200 rounded-xl text-center text-xl font-mono font-bold tracking-widest outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <button
                disabled={isVerifying}
                type="submit"
                className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-sm shadow-soft hover:-translate-y-0.5 transition-all disabled:opacity-50"
              >
                {isVerifying ? "Verifying Token..." : "Verify & Enable 2FA"}
              </button>
            </form>
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center gap-3">
            <div className="size-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-ink-500 font-medium">Generating secure 2FA keys...</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function SettingsPage() {
  const { role, user } = useAuth();
  const { addNotification } = useNotifications();
  
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [country, setCountry] = useState("NG");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [timezone, setTimezone] = useState("Africa/Lagos");
  const [currencyPreference, setCurrencyPreference] = useState("NGN");
  const [companyName, setCompanyName] = useState("");
  const [bio, setBio] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [inAppAlerts, setInAppAlerts] = useState(true);
  const [autoReleaseEscrow, setAutoReleaseEscrow] = useState("never");
  
  const [showPassword, setShowPassword] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.name || user.fullName || "");
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient("/auth/me", {
        method: "PATCH",
        body: {
          fullName, country, phoneNumber, timezone, currencyPreference,
          ...(role === "agent" ? { companyName, bio, portfolioUrl } : {})
        }
      });
      await apiClient("/auth/preferences", {
        method: "PATCH",
        body: { emailNotifications, inAppAlerts, autoReleaseEscrow }
      });
      toast.success("Settings saved successfully!");
      addNotification({
        title: "Account Settings Saved",
        desc: "Your notification and account preferences have been saved.",
        type: "success",
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 lg:p-10">
      <AnimatePresence>
        {showPassword && <PasswordModal onClose={() => setShowPassword(false)} />}
        {show2FA && <TwoFactorModal onClose={() => setShow2FA(false)} />}
      </AnimatePresence>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-ink-900 flex items-center gap-3">
          <SettingsIcon className="size-8 text-brand-600" />
          Settings
        </h1>
        <p className="text-sm font-medium text-ink-500 mt-2">
          Manage your account preferences and configurations.
        </p>
      </div>

      <div className="bg-white rounded-xl p-6 lg:p-8 shadow-soft border border-ink-100">
        <form onSubmit={handleSave} className="space-y-8">
          
          {/* Section 1: Profile & Account */}
          <section>
            <h2 className="text-lg font-bold text-ink-900 flex items-center gap-2 mb-4 border-b border-ink-100 pb-2">
              <User className="size-5 text-brand-600" />
              Account Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-ink-900 mb-1">Full Name</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-ink-900 mb-1">Email Address</label>
                <input type="email" readOnly defaultValue={user?.email || (role === "agent" ? "kwabena@example.com" : "user@example.com")} className="w-full rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 bg-ink-50 text-ink-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-ink-900 mb-1">Phone Number</label>
                <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="w-full rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-ink-900 mb-1">Country</label>
                <select value={country} onChange={e => setCountry(e.target.value)} className="w-full rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500">
                  <option value="GH">Ghana</option>
                  <option value="NG">Nigeria</option>
                  <option value="US">United States</option>
                  <option value="UK">United Kingdom</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-ink-900 mb-1">Timezone</label>
                <select value={timezone} onChange={e => setTimezone(e.target.value)} className="w-full rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500">
                  <option value="Africa/Accra">Africa/Accra (GMT)</option>
                  <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-ink-900 mb-1">Currency Preference</label>
                <select value={currencyPreference} onChange={e => setCurrencyPreference(e.target.value)} className="w-full rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500">
                  <option value="USD">USD ($)</option>
                  <option value="NGN">NGN (₦)</option>
                  <option value="GHS">GHS (₵)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>
          </section>

          {/* Section 2: Notifications */}
          <section>
            <h2 className="text-lg font-bold text-ink-900 flex items-center gap-2 mb-4 border-b border-ink-100 pb-2">
              <Bell className="size-5 text-brand-600" />
              Notification Preferences
            </h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-xl border border-ink-100 bg-ink-50/50 hover:bg-ink-50 cursor-pointer">
                <input type="checkbox" checked={emailNotifications} onChange={e => setEmailNotifications(e.target.checked)} className="size-4 text-brand-600 rounded border-ink-300 focus:ring-brand-500" />
                <div>
                  <p className="text-sm font-bold text-ink-900">Email Notifications</p>
                  <p className="text-xs font-medium text-ink-500">Receive daily summaries and critical alerts via email.</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-xl border border-ink-100 bg-ink-50/50 hover:bg-ink-50 cursor-pointer">
                <input type="checkbox" checked={inAppAlerts} onChange={e => setInAppAlerts(e.target.checked)} className="size-4 text-brand-600 rounded border-ink-300 focus:ring-brand-500" />
                <div>
                  <p className="text-sm font-bold text-ink-900">In-App Alerts</p>
                  <p className="text-xs font-medium text-ink-500">Show toasts and badge counters for new activity.</p>
                </div>
              </label>
            </div>
          </section>

          {/* Section 3: Role Specific (Sender vs Agent) */}
          {role === "sender" ? (
            <section>
              <h2 className="text-lg font-bold text-ink-900 flex items-center gap-2 mb-4 border-b border-ink-100 pb-2">
                <CreditCard className="size-5 text-brand-600" />
                Payment & Escrow
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-ink-900 mb-1">Auto-release Escrow</label>
                  <select value={autoReleaseEscrow} onChange={e => setAutoReleaseEscrow(e.target.value)} className="w-full rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500">
                    <option value="never">Never (Require manual approval)</option>
                    <option value="3days">After 3 days of no flags</option>
                    <option value="7days">After 7 days of no flags</option>
                  </select>
                </div>
                <div>
                  <p className="text-sm font-bold text-ink-900 mb-1">Default Payment Method</p>
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-ink-100 bg-ink-50/50">
                    <div className="size-10 bg-brand-100 text-brand-700 rounded-2xl flex items-center justify-center font-bold">VISA</div>
                    <div>
                      <p className="text-sm font-bold text-ink-900">Visa ending in 4242</p>
                      <p className="text-xs font-medium text-ink-500">Expires 12/28</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <section>
              <h2 className="text-lg font-bold text-ink-900 flex items-center gap-2 mb-4 border-b border-ink-100 pb-2">
                <Globe className="size-5 text-brand-600" />
                Public Profile Visibility & Details
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-ink-900 mb-1">Company / Agency Name</label>
                  <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-ink-900 mb-1">Professional Bio</label>
                  <textarea rows={3} value={bio} onChange={e => setBio(e.target.value)} className="w-full rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-ink-900 mb-1">Portfolio URL</label>
                  <input type="url" value={portfolioUrl} onChange={e => setPortfolioUrl(e.target.value)} className="w-full rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
                </div>
                
                <label className="flex items-center gap-3 p-3 rounded-xl border border-ink-100 bg-ink-50/50 hover:bg-ink-50 cursor-pointer">
                  <input type="checkbox" defaultChecked className="size-4 text-brand-600 rounded border-ink-300 focus:ring-brand-500" />
                  <div>
                    <p className="text-sm font-bold text-ink-900">Show Profile in Directory</p>
                    <p className="text-xs font-medium text-ink-500">Allow new clients to discover you.</p>
                  </div>
                </label>
              </div>
            </section>
          )}
          {/* Section 4: Security */}
          <section>
            <h2 className="text-lg font-bold text-ink-900 flex items-center gap-2 mb-4 border-b border-ink-100 pb-2">
              <Shield className="size-5 text-brand-600" />
              Security & Privacy
            </h2>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-ink-100 bg-ink-50/50">
                <div>
                  <p className="text-sm font-bold text-ink-900">Password</p>
                  <p className="text-xs font-medium text-ink-500">Last changed 3 months ago.</p>
                </div>
                <button type="button" onClick={() => setShowPassword(true)} className="px-4 py-2 rounded-2xl bg-white border border-ink-200 text-sm font-bold text-ink-700 hover:bg-ink-50">
                  Update Password
                </button>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-ink-100 bg-ink-50/50">
                <div>
                  <p className="text-sm font-bold text-ink-900">Two-Factor Authentication (2FA)</p>
                  <p className="text-xs font-medium text-ink-500">Add an extra layer of security to your account.</p>
                </div>
                <button type="button" onClick={() => setShow2FA(true)} className="px-4 py-2 rounded-2xl bg-brand-50 border border-brand-200 text-sm font-bold text-brand-700 hover:bg-brand-100">
                  Enable 2FA
                </button>
              </div>
            </div>
          </section>


          <div className="pt-4 border-t border-ink-100 flex justify-end">
            <button type="submit" className="px-6 py-3 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 transition-colors shadow-soft">
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
