"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Camera, Save, User, MapPin, Building2, Briefcase, 
  ChevronRight, Lock, Bell, CreditCard, LayoutDashboard, ArrowLeft,
  ExternalLink, Globe, Phone, DollarSign, Link as LinkIcon, Clock,
  Wrench, Loader2, CheckCircle2, AlertCircle, Shield, Key, Upload, Trash2, Image as ImageIcon
} from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Avatar from "@/components/avatar";
import { updateProfileSchema, type UpdateProfileInput } from "@/lib/schemas";
import { useNotifications } from "@/lib/notification-context";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { toast } from "react-toastify";

type Role = "sender" | "agent";
type Tab = "personal" | "portfolio" | "security" | "notifications" | "billing";

function ProfilePageContent() {
  const searchParams = useSearchParams();
  const [role, setRole] = useState<Role>("agent");
  const [activeTab, setActiveTab] = useState<Tab>("personal");
  const [isSaving, setIsSaving] = useState(false);
  const [specialtiesText, setSpecialtiesText] = useState("house, community, borehole");
  const { notifications, markAllRead, addNotification } = useNotifications();
  const { user, mutateUser } = useAuth();

  // Avatar Upload State
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState("");

  // Password state for Security tab
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Credentials State
  const [credLabel, setCredLabel] = useState("");
  const [credIssuer, setCredIssuer] = useState("");
  const [credDate, setCredDate] = useState("");
  const [isAddingCred, setIsAddingCred] = useState(false);

  // Portfolio State
  const [portTitle, setPortTitle] = useState("");
  const [portAssetType, setPortAssetType] = useState("house");
  const [portLocation, setPortLocation] = useState("");
  const [portSummary, setPortSummary] = useState("");
  const [portImageUrl, setPortImageUrl] = useState("");
  const [isAddingPort, setIsAddingPort] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema) as any,
  });

  useEffect(() => {
    const tab = searchParams.get("tab") as Tab;
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      setRole((user.role as Role) || "agent");
      const specs = user.agentDetails?.specialties || [];
      const specsStr = specs.length > 0 ? specs.join(", ") : "house, community, borehole";
      setSpecialtiesText(specsStr);
      setAvatarPreview(user.avatarUrl || "");

      reset({
        fullName: user.fullName || "",
        country: user.country || "NG",
        phoneNumber: user.phoneNumber || "",
        currencyPreference: user.currencyPreference || (user.agentDetails as any)?.currencyPreference || "NGN",
        timezone: user.timezone || (user.agentDetails as any)?.timezone || "Africa/Lagos",
        companyName: user.agentDetails?.companyName || "",
        bio: user.agentDetails?.bio || "",
        yearsExperience: user.agentDetails?.yearsExperience ?? 2,
        specialties: specs,
        portfolioUrl: user.agentDetails?.portfolioUrl || "",
        availabilityStatus: user.agentDetails?.availabilityStatus || "Available",
        avatarUrl: user.avatarUrl || "",
      });
    }
  }, [user, reset]);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file (PNG, JPG, WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size must be less than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxSize = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const optimizedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
          setAvatarPreview(optimizedDataUrl);
          setValue("avatarUrl", optimizedDataUrl, { shouldDirty: true });
          toast.success("Photo selected! Click 'Save Changes' to update your profile.");
        } else {
          setAvatarPreview(result);
          setValue("avatarUrl", result, { shouldDirty: true });
          toast.success("Photo selected! Click 'Save Changes' to update your profile.");
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview("");
    setValue("avatarUrl", "", { shouldDirty: true });
    if (avatarInputRef.current) avatarInputRef.current.value = "";
    toast.info("Profile photo removed. Click 'Save Changes' to apply.");
  };

  const handleApplyUrl = () => {
    if (!customUrl.trim()) return;
    setAvatarPreview(customUrl.trim());
    setValue("avatarUrl", customUrl.trim(), { shouldDirty: true });
    setShowUrlInput(false);
    toast.success("Avatar URL applied! Click 'Save Changes' to update your profile.");
  };

  const onInvalid = (errorsObj: any) => {
    const firstKey = Object.keys(errorsObj)[0];
    const firstErr = errorsObj[firstKey];
    toast.error(`Validation error on ${firstKey}: ${firstErr?.message || "Invalid input"}`);
  };

  const onSubmit = async (data: UpdateProfileInput) => {
    setIsSaving(true);
    try {
      const specsArray = specialtiesText
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

      const payload = {
        fullName: data.fullName?.trim() || undefined,
        country: data.country?.trim() ? data.country.trim().toUpperCase() : undefined,
        phoneNumber: data.phoneNumber?.trim() || undefined,
        currencyPreference: data.currencyPreference || "NGN",
        timezone: data.timezone || "Africa/Lagos",
        avatarUrl: data.avatarUrl?.trim() || undefined,
        ...(role === "agent" ? {
          companyName: data.companyName?.trim() || undefined,
          bio: data.bio?.trim() || undefined,
          yearsExperience: Number(data.yearsExperience) || 0,
          specialties: specsArray,
          portfolioUrl: data.portfolioUrl?.trim() || undefined,
          availabilityStatus: data.availabilityStatus || "Available",
        } : {})
      };

      await apiClient("/auth/me", {
        method: "PATCH",
        body: payload
      });

      toast.success("Profile updated successfully!");
      addNotification({
        title: "Profile Updated",
        desc: "Your profile details and credentials have been updated successfully.",
        type: "success",
      });
      mutateUser();
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error("Please enter both current and new password.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    setIsUpdatingPassword(true);
    try {
      await apiClient("/auth/password", {
        method: "POST",
        body: { currentPassword, newPassword }
      });
      toast.success("Password updated successfully!");
      addNotification({
        title: "Security Password Changed",
        desc: "Your account password was updated successfully.",
        type: "info",
      });
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to update password.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleAddCredential = async () => {
    if (!credLabel.trim() || !credIssuer.trim() || !credDate) {
      toast.error("Please fill in all credential fields.");
      return;
    }
    if (!user?.id) return;
    setIsAddingCred(true);
    try {
      await apiClient(`/agents/${user.id}/credentials`, {
        method: "POST",
        body: {
          label: credLabel.trim(),
          issuer: credIssuer.trim(),
          verifiedOn: credDate,
        },
      });
      toast.success("Credential added successfully!");
      addNotification({
        title: "Credential Added",
        desc: `Added verified certification "${credLabel.trim()}" issued by ${credIssuer.trim()}.`,
        type: "success",
        targetRole: "agent",
      });
      setCredLabel("");
      setCredIssuer("");
      setCredDate("");
      mutateUser();
    } catch (err: any) {
      toast.error(err.message || "Failed to add credential.");
    } finally {
      setIsAddingCred(false);
    }
  };

  const handleAddPortfolio = async () => {
    if (!portTitle.trim() || !portLocation.trim() || !portSummary.trim()) {
      toast.error("Please fill in project title, location, and summary.");
      return;
    }
    if (!user?.id) return;
    setIsAddingPort(true);
    try {
      await apiClient(`/agents/${user.id}/portfolio`, {
        method: "POST",
        body: {
          title: portTitle.trim(),
          assetType: portAssetType,
          location: portLocation.trim(),
          summary: portSummary.trim(),
          imageUrl: portImageUrl.trim() || undefined,
        },
      });
      toast.success("Portfolio project added successfully!");
      addNotification({
        title: "Past Project Added",
        desc: `Added "${portTitle.trim()}" to your verified project portfolio.`,
        type: "success",
        targetRole: "agent",
      });
      setPortTitle("");
      setPortLocation("");
      setPortSummary("");
      setPortImageUrl("");
      mutateUser();
    } catch (err: any) {
      toast.error(err.message || "Failed to add portfolio project.");
    } finally {
      setIsAddingPort(false);
    }
  };

  const navItems = [
    { id: "personal", icon: User, label: "Personal Information" },
    ...(role === "agent" ? [{ id: "portfolio", icon: LayoutDashboard, label: "Portfolio & Credentials" }] : []),
    { id: "security", icon: Lock, label: "Security & Password" },
    { id: "notifications", icon: Bell, label: "Notifications" },
    { id: "billing", icon: CreditCard, label: "Billing & Payments" },
  ] as const;

  const currentFullName = watch("fullName") || user?.fullName || "User Profile";
  const currentCountry = watch("country") || user?.country || "NG";

  return (
    <div className="min-h-screen bg-[#ebeff3] py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        
        {/* Role Preview Toggle */}
        <div className="flex justify-end mb-4">
          {/* <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-ink-200 shadow-sm">
            <button
              type="button"
              onClick={() => {
                setRole("sender");
                if (activeTab === "portfolio") setActiveTab("personal");
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
                role === "sender" ? "bg-ink-900 text-white" : "text-ink-500 hover:text-ink-900"
              }`}
            >
              Sender View
            </button>
            <button
              type="button"
              onClick={() => setRole("agent")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
                role === "agent" ? "bg-ink-900 text-white" : "text-ink-500 hover:text-ink-900"
              }`}
            >
              Agent View
            </button>
          </div> */}
        </div>

        <div className="grid gap-6 lg:grid-cols-12 items-start">
          
          {/* Left Sidebar */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="rounded-[20px] bg-white border border-ink-100 shadow-sm overflow-hidden">
              
              {/* Header */}
              <div className="p-6 border-b border-ink-100">
                <div className="flex items-center gap-3 text-sm font-medium text-ink-500 mb-6">
                  <Link href="/dashboard" className="flex items-center gap-1.5 hover:text-ink-900 transition-colors">
                    <ArrowLeft className="size-4" />
                    Back to Dashboard
                  </Link>
                </div>

                {/* Hidden File Input for Avatar */}
                <input
                  type="file"
                  ref={avatarInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarFileChange}
                />

                <div className="flex items-start gap-4">
                  <div 
                    onClick={() => avatarInputRef.current?.click()}
                    className="relative group cursor-pointer shrink-0"
                    title="Click to upload profile photo"
                  >
                    <Avatar 
                      initials={currentFullName.substring(0, 2).toUpperCase()} 
                      avatarUrl={avatarPreview || watch("avatarUrl") || user?.avatarUrl} 
                      size="lg" 
                    />
                    <div className="absolute inset-0 rounded-full bg-ink-900/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      <Camera className="size-5 text-white" />
                      <span className="text-[9px] text-white font-bold tracking-tight mt-0.5">Upload</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl font-bold text-ink-900">{currentFullName}</h2>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-xl text-[10px] font-bold uppercase tracking-wide bg-brand-50 text-brand-700 border border-brand-200">
                        {role === "agent" ? "Verified Agent" : "Sender"}
                      </span>
                    </div>
                    <p className="text-xs text-ink-500 mb-1">{user?.email || "user@bankole.com"}</p>
                    <p className="text-xs text-ink-500">Country: <span className="font-bold text-ink-800">{currentCountry}</span></p>
                  </div>
                </div>

                {role === "agent" && user?.id && (
                  <div className="mt-6 flex gap-3">
                    <Link href={`/agents/${user.id}`} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-50 px-4 py-2.5 text-xs font-bold text-brand-700 hover:bg-brand-100 transition-colors">
                      <ExternalLink className="size-3.5" />
                      View Public Profile
                    </Link>
                  </div>
                )}
              </div>

              {/* Navigation Menu */}
              <nav className="p-3 space-y-1">
                {navItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id as Tab)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-bold transition-colors ${
                        isActive 
                          ? "bg-brand-50 text-brand-700" 
                          : "text-ink-600 hover:bg-ink-50 hover:text-ink-900"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={`size-4 ${isActive ? "text-brand-600" : "text-ink-400"}`} />
                        {item.label}
                      </div>
                      <ChevronRight className={`size-4 ${isActive ? "text-brand-600" : "text-ink-300"}`} />
                    </button>
                  );
                })}
              </nav>

            </div>
          </div>

          {/* Right Content */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {activeTab === "personal" && (
              <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="rounded-[20px] bg-white border border-ink-100 shadow-sm overflow-hidden flex flex-col h-full min-h-[600px]">
                <div className="p-6 sm:p-8 border-b border-ink-100">
                  <h3 className="text-xl font-bold text-ink-900">Personal Information</h3>
                  <p className="mt-1 text-sm text-ink-500">Update your profile information and professional details.</p>
                </div>

                <div className="p-6 sm:p-8 space-y-8 flex-1">

                  {/* Profile Picture Upload Section */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 sm:p-5 rounded-2xl bg-ink-50/60 border border-ink-100">
                    <div 
                      onClick={() => avatarInputRef.current?.click()}
                      className="relative group cursor-pointer shrink-0"
                      title="Click to upload profile photo"
                    >
                      <Avatar 
                        initials={currentFullName.substring(0, 2).toUpperCase()} 
                        avatarUrl={avatarPreview || watch("avatarUrl") || user?.avatarUrl} 
                        size="xl" 
                      />
                      <div className="absolute inset-0 rounded-full bg-ink-900/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                        <Camera className="size-6 text-white" />
                        <span className="text-[10px] text-white font-bold mt-1">Change</span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-2 w-full">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-ink-900">Profile Photo</h4>
                          <p className="text-xs text-ink-500">Upload a headshot or avatar image (PNG, JPG, WebP up to 5MB).</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => avatarInputRef.current?.click()}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-ink-200 text-xs font-bold text-ink-700 hover:bg-ink-50 shadow-sm transition-colors"
                          >
                            <Upload className="size-3.5 text-brand-600" />
                            Upload Photo
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowUrlInput(!showUrlInput)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-ink-200 text-xs font-bold text-ink-700 hover:bg-ink-50 shadow-sm transition-colors"
                          >
                            <LinkIcon className="size-3.5 text-ink-400" />
                            Image URL
                          </button>
                          {(avatarPreview || watch("avatarUrl") || user?.avatarUrl) && (
                            <button
                              type="button"
                              onClick={handleRemoveAvatar}
                              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-50 border border-rose-100 text-xs font-bold text-rose-600 hover:bg-rose-100 transition-colors"
                            >
                              <Trash2 className="size-3.5" />
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {showUrlInput && (
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-ink-200">
                          <input
                            type="url"
                            value={customUrl}
                            onChange={(e) => setCustomUrl(e.target.value)}
                            placeholder="https://example.com/my-photo.jpg"
                            className="flex-1 rounded-xl border border-ink-200 bg-white px-3 py-1.5 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                          />
                          <button
                            type="button"
                            onClick={handleApplyUrl}
                            className="px-3 py-1.5 rounded-xl bg-ink-900 text-white text-xs font-bold hover:bg-ink-800 transition-colors"
                          >
                            Apply URL
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* General Info */}
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-ink-900">Full Name</label>
                      <input
                        {...register("fullName")}
                        type="text"
                        className={`w-full rounded-xl border px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm ${
                          errors.fullName ? "border-rose-500 bg-rose-50 text-rose-900" : "border-ink-200 bg-white text-ink-900 focus:border-brand-500"
                        }`}
                      />
                      {errors.fullName && <p className="text-rose-500 text-xs font-medium">{errors.fullName.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-ink-900">Email Address</label>
                      <input
                        type="email"
                        value={user?.email || ""}
                        disabled
                        className="w-full rounded-xl border border-ink-100 bg-ink-50 px-4 py-2.5 text-sm font-medium text-ink-400 cursor-not-allowed shadow-inner"
                      />
                      <p className="text-xs text-ink-400">Account login email cannot be changed.</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-ink-900 flex items-center gap-2">
                        <Phone className="size-4 text-ink-400" />
                        Phone Number
                      </label>
                      <input
                        {...register("phoneNumber")}
                        type="tel"
                        className="w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-medium text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm"
                        placeholder="+234 800 000 0000"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-ink-900 flex items-center gap-2">
                        <Globe className="size-4 text-ink-400" />
                        Country Code (ISO 2-letter)
                      </label>
                      <input
                        {...register("country")}
                        type="text"
                        maxLength={2}
                        className={`w-full uppercase rounded-xl border px-4 py-2.5 text-sm font-medium transition-all shadow-sm ${
                          errors.country ? "border-rose-500 bg-rose-50 text-rose-900" : "border-ink-200 bg-white text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
                        }`}
                        placeholder="NG"
                      />
                      {errors.country && <p className="text-rose-500 text-xs font-medium">{errors.country.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-ink-900 flex items-center gap-2">
                        <DollarSign className="size-4 text-ink-400" />
                        Currency Preference
                      </label>
                      <select
                        {...register("currencyPreference")}
                        className="w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-medium text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm"
                      >
                        <option value="NGN">NGN (₦)</option>
                        <option value="USD">USD ($)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="EUR">EUR (€)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-ink-900 flex items-center gap-2">
                        <Globe className="size-4 text-ink-400" />
                        Timezone
                      </label>
                      <select
                        {...register("timezone")}
                        className="w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-medium text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm"
                      >
                        <option value="Africa/Lagos">Lagos (WAT, UTC+1)</option>
                        <option value="Africa/Accra">Accra (GMT)</option>
                        <option value="Europe/London">London (GMT/BST)</option>
                        <option value="America/New_York">Eastern Time (ET)</option>
                      </select>
                    </div>
                  </div>

                  {/* Agent Specific Info */}
                  {role === "agent" && (
                    <>
                      <div className="h-px w-full bg-ink-100" />
                      
                      <div className="space-y-6">
                        <h4 className="text-base font-bold text-ink-900 flex items-center gap-2">
                          <Briefcase className="size-4 text-ink-400" />
                          Professional Details &amp; Agency
                        </h4>

                        <div className="grid gap-6 sm:grid-cols-2">
                          <div className="space-y-2 sm:col-span-2">
                            <label className="text-sm font-bold text-ink-900 flex items-center gap-2">
                              <Building2 className="size-4 text-ink-400" />
                              Company or Agency Name
                            </label>
                            <input
                              {...register("companyName")}
                              type="text"
                              className="w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-medium text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm"
                              placeholder="e.g. Bankole Engineering & Construction Ltd"
                            />
                          </div>

                          <div className="space-y-2 sm:col-span-2">
                            <label className="text-sm font-bold text-ink-900">Biography</label>
                            <textarea
                              {...register("bio")}
                              rows={3}
                              className="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm font-medium text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all resize-none shadow-sm"
                              placeholder="Tell diaspora clients about your supervision expertise, past builds, and standards..."
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-bold text-ink-900">Years of Experience</label>
                            <input
                              {...register("yearsExperience", { valueAsNumber: true })}
                              type="number"
                              min="0"
                              className="w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-medium text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-bold text-ink-900">Specialties (comma-separated)</label>
                            <input
                              type="text"
                              value={specialtiesText}
                              onChange={(e) => setSpecialtiesText(e.target.value)}
                              className="w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-medium text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm"
                              placeholder="house, clinic, borehole, community"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-bold text-ink-900 flex items-center gap-2">
                              <LinkIcon className="size-4 text-ink-400" />
                              External Portfolio URL
                            </label>
                            <input
                              {...register("portfolioUrl")}
                              type="url"
                              className={`w-full rounded-xl border px-4 py-2.5 text-sm font-medium transition-all shadow-sm ${
                                errors.portfolioUrl ? "border-rose-500 bg-rose-50 text-rose-900" : "border-ink-200 bg-white text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
                              }`}
                              placeholder="https://github.com/..."
                            />
                            {errors.portfolioUrl && <p className="text-rose-500 text-xs font-medium">{errors.portfolioUrl.message}</p>}
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-bold text-ink-900 flex items-center gap-2">
                              <Clock className="size-4 text-ink-400" />
                              Availability Status
                            </label>
                            <select
                              {...register("availabilityStatus")}
                              className="w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-medium text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm"
                            >
                              <option value="Available">Available for new projects</option>
                              <option value="Busy">Currently busy</option>
                              <option value="Unavailable">Not accepting clients</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                </div>
                
                {/* Form Actions */}
                <div className="bg-ink-50 p-6 flex items-center justify-end gap-3 border-t border-ink-100">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-700 transition-colors disabled:opacity-70"
                  >
                    {isSaving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            )}

            {/* Portfolio & Credentials Tab */}
            {activeTab === "portfolio" && (
              <div className="rounded-[20px] bg-white border border-ink-100 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 sm:p-8 border-b border-ink-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-ink-900">Portfolio &amp; Credentials</h3>
                    <p className="mt-1 text-sm text-ink-500">Showcase past builds and verified industry certifications to win diaspora trust.</p>
                  </div>
                </div>
                <div className="p-6 sm:p-8 space-y-8 flex-1">
                  
                  {/* Add Credential Section */}
                  <div>
                    <h4 className="text-base font-bold text-ink-900 mb-4">Add Verified Credential</h4>
                    <div className="bg-ink-50 p-5 rounded-2xl border border-ink-100 grid gap-4 sm:grid-cols-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-ink-700">Credential Name</label>
                        <input 
                          type="text" 
                          value={credLabel} 
                          onChange={(e) => setCredLabel(e.target.value)} 
                          placeholder="e.g. COREN Registered Engineer"
                          className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-ink-700">Issuer / Organization</label>
                        <input 
                          type="text" 
                          value={credIssuer} 
                          onChange={(e) => setCredIssuer(e.target.value)} 
                          placeholder="e.g. Council of Registered Engineers"
                          className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-ink-700">Date Verified</label>
                        <input 
                          type="date" 
                          value={credDate} 
                          onChange={(e) => setCredDate(e.target.value)} 
                          className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" 
                        />
                      </div>
                      <div className="sm:col-span-3 flex justify-end">
                        <button 
                          type="button" 
                          disabled={isAddingCred}
                          onClick={handleAddCredential} 
                          className="px-5 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 disabled:opacity-50 flex items-center gap-2"
                        >
                          {isAddingCred && <Loader2 className="size-3.5 animate-spin" />}
                          + Save Credential
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Add Portfolio Section */}
                  <div>
                    <h4 className="text-base font-bold text-ink-900 mb-4">Add Past Supervised Project</h4>
                    <div className="bg-ink-50 p-5 rounded-2xl border border-ink-100 grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-xs font-bold text-ink-700">Project Title</label>
                        <input 
                          type="text" 
                          value={portTitle} 
                          onChange={(e) => setPortTitle(e.target.value)} 
                          placeholder="e.g. 4-Bedroom Duplex, Lekki"
                          className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-ink-700">Asset Type</label>
                        <select 
                          value={portAssetType} 
                          onChange={(e) => setPortAssetType(e.target.value)} 
                          className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                        >
                          <option value="house">House</option>
                          <option value="shop">Shop</option>
                          <option value="clinic">Clinic</option>
                          <option value="borehole">Borehole</option>
                          <option value="school">School</option>
                          <option value="land">Land</option>
                          <option value="community">Community Project</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-ink-700">Location</label>
                        <input 
                          type="text" 
                          value={portLocation} 
                          onChange={(e) => setPortLocation(e.target.value)} 
                          placeholder="e.g. Lekki Phase 1, Lagos"
                          className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" 
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-xs font-bold text-ink-700">Summary &amp; Role</label>
                        <textarea 
                          rows={2} 
                          value={portSummary} 
                          onChange={(e) => setPortSummary(e.target.value)} 
                          placeholder="Supervised structural foundation, roofing, and finishing with 100% milestone proof verification..."
                          className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none resize-none"
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-xs font-bold text-ink-700">Image URL (Optional)</label>
                        <input 
                          type="url" 
                          value={portImageUrl} 
                          onChange={(e) => setPortImageUrl(e.target.value)} 
                          placeholder="https://images.unsplash.com/..." 
                          className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" 
                        />
                      </div>
                      <div className="sm:col-span-2 flex justify-end">
                        <button 
                          type="button" 
                          disabled={isAddingPort}
                          onClick={handleAddPortfolio} 
                          className="px-5 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 disabled:opacity-50 flex items-center gap-2"
                        >
                          {isAddingPort && <Loader2 className="size-3.5 animate-spin" />}
                          + Save Portfolio Project
                        </button>
                      </div>
                    </div>
                  </div>
                  
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="rounded-[20px] bg-white border border-ink-100 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 sm:p-8 border-b border-ink-100">
                  <h3 className="text-xl font-bold text-ink-900">Security &amp; Password</h3>
                  <p className="mt-1 text-sm text-ink-500">Manage your account authentication and access credentials.</p>
                </div>
                <div className="p-6 sm:p-8 space-y-6">
                  <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-md">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider mb-2 block text-ink-700">Current Password</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-medium text-ink-900 focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider mb-2 block text-ink-700">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 8 characters"
                        className="w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-medium text-ink-900 focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isUpdatingPassword || !currentPassword || !newPassword}
                      className="px-6 py-2.5 bg-brand-600 text-white font-bold text-xs rounded-xl hover:bg-brand-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isUpdatingPassword && <Loader2 className="size-3.5 animate-spin" />}
                      Update Password
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div className="rounded-[20px] bg-white border border-ink-100 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 sm:p-8 border-b border-ink-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-ink-900">Notifications</h3>
                    <p className="mt-1 text-sm text-ink-500">Manage your alerts and see recent activity on your account.</p>
                  </div>
                  {notifications.length > 0 && (
                    <button type="button" onClick={markAllRead} className="text-xs font-bold text-brand-600 hover:text-brand-700">
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                      <div className="size-14 rounded-2xl bg-ink-50 flex items-center justify-center mb-4 border border-ink-100">
                        <Bell className="size-6 text-ink-400" />
                      </div>
                      <h3 className="text-base font-bold text-ink-900 mb-1">You're all caught up</h3>
                      <p className="text-xs text-ink-500 max-w-sm">
                        You have no new notifications. We'll alert you when there is milestone proof or project activity.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-ink-100">
                      {notifications.map((n) => (
                        <div key={n.id} className={`p-5 sm:p-6 flex items-start gap-4 hover:bg-ink-50/50 transition-colors ${n.read ? 'opacity-60' : ''}`}>
                          <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${
                            n.type === 'success' ? 'bg-emerald-50 text-emerald-600' :
                            n.type === 'error' ? 'bg-rose-50 text-rose-500' :
                            n.type === 'warning' ? 'bg-amber-50 text-amber-600' :
                            'bg-brand-50 text-brand-600'
                          }`}>
                            {n.type === 'success' ? <CheckCircle2 className="size-4" /> :
                             n.type === 'error' ? <AlertCircle className="size-4" /> :
                             <Bell className="size-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-ink-900 mb-0.5">{n.title}</h4>
                            <p className="text-xs text-ink-600 mb-1.5 leading-relaxed">{n.desc}</p>
                            <p className="text-[11px] font-medium text-ink-400 flex items-center gap-1">
                              <Clock className="size-3" />
                              {new Date(n.time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Billing Tab */}
            {activeTab === "billing" && (
              <div className="rounded-[20px] bg-white border border-ink-100 shadow-sm overflow-hidden flex flex-col p-8 text-center">
                <CreditCard className="size-10 mx-auto text-brand-500 mb-3" />
                <h3 className="text-lg font-bold text-ink-900 mb-2">Billing &amp; Payments</h3>
                <p className="text-xs text-ink-500 max-w-md mx-auto mb-6">
                  Manage your linked cards, Nigerian bank accounts, and wallet payouts directly in the dedicated Payments portal.
                </p>
                <Link
                  href="/dashboard/payments"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-700 transition-colors mx-auto"
                >
                  Open Payments &amp; Wallet Portal <ChevronRight className="size-4" />
                </Link>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-sm font-bold text-ink-600">Loading profile...</div>}>
      <ProfilePageContent />
    </Suspense>
  );
}
