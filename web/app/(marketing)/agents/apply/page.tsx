"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck, ArrowRight, Loader2, CheckCircle2, ChevronLeft, MapPin, User, Building } from "lucide-react";
import { registerSchema, Role, type RegisterInput } from "@/lib/schemas";
import { ASSET_TYPE_LABEL } from "@/lib/models";
import { useAuth } from "@/lib/auth-context";
import { toast } from "react-toastify";
import { apiClient, TokenManager } from "@/lib/api-client";

export default function RegisterPage() {
  const { mutateUser } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema) as any,
    defaultValues: {
      role: Role.AGENT, // Default to Agent to show the wizard by default
      country: "",
    },
  });

  const selectedRole = watch("role");
  const isSender = selectedRole === Role.SENDER;

  // Agent flow needs more visual steps, Sender flow is just 1 step.
  const totalSteps = isSender ? 1 : 4;

  const handleNext = async () => {
    // Validate current step before moving forward
    let isValid = false;
    if (step === 1) {
      isValid = await trigger(["fullName", "email", "password"]);
    } else if (step === 2) {
      isValid = await trigger(["country", "phoneNumber"]);
    } else if (step === 3) {
      // In a real app we would validate the extra agent fields here
      isValid = true; 
    }

    if (isValid) {
      setStep((s) => Math.min(s + 1, totalSteps));
    }
  };

  const handlePrev = () => setStep((s) => Math.max(s - 1, 1));

  const toggleSpecialty = (spec: string) => {
    const current = watch("specialties") || [];
    if (current.includes(spec)) {
      setValue("specialties", current.filter(s => s !== spec));
    } else {
      setValue("specialties", [...current, spec]);
    }
  };

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    try {
      const response = await apiClient("/auth/register", {
        method: "POST",
        body: {
          fullName: data.fullName,
          email: data.email,
          password: data.password,
          role: data.role,
          country: data.country,
          phoneNumber: data.phoneNumber || undefined,
        },
        requireAuth: false
      });
      const token = response.accessToken || response.access_token || response.token;
      const refresh = response.refreshToken || response.refresh_token;

      if (!token) {
        throw new Error("Registration succeeded but no token was returned by the server.");
      }

      TokenManager.setTokens({
        accessToken: token,
        refreshToken: refresh,
      });
      
      const authUser = response.user || response.data?.user || response.data;
      if (authUser && authUser.id) {
        TokenManager.setCachedUser(authUser);
      }
      
      if (data.role === Role.AGENT && (data.companyName || data.yearsExperience || data.specialties)) {
        await apiClient("/auth/me", {
          method: "PATCH",
          body: {
            companyName: data.companyName,
            yearsExperience: data.yearsExperience,
            specialties: data.specialties
          }
        });
      }

      mutateUser();
      toast.success("Account created successfully! Welcome to Bankole.");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Registration failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-16 sm:py-24 bg-[#f6f8fa] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-1/2 -right-1/4 w-[1000px] h-[1000px] rounded-full bg-brand-50 blur-3xl opacity-50" />
        <div className="absolute -bottom-1/2 -left-1/4 w-[800px] h-[800px] rounded-full bg-blue-50 blur-3xl opacity-50" />
      </div>

      <div className="w-full max-w-xl relative z-10">
        
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <ShieldCheck className="size-8 text-brand-600" />
            <span className="text-2xl font-bold text-ink-900 tracking-tight">Bankole</span>
          </Link>
          <h1 className="text-3xl font-black text-ink-900 mb-2">
            {isSender ? "Register to start funding" : "Apply as a Verified Agent"}
          </h1>
          <p className="text-ink-500">
            {isSender ? "Create your sender account to manage projects back home." : "Join our network of trusted professionals and build your portfolio."}
          </p>
        </div>

        {/* Role Toggle Switcher */}
        <div className="mb-8 flex bg-white rounded-xl shadow-sm border border-ink-100 p-1">
          <button
            type="button"
            onClick={() => {
              setValue("role", Role.AGENT, { shouldValidate: true });
              setStep(1);
            }}
            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-colors ${
              !isSender 
                ? "bg-brand-50 text-brand-700 shadow-sm" 
                : "text-ink-500 hover:text-ink-900 hover:bg-ink-50"
            }`}
          >
            Apply as Agent
          </button>
          <button
            type="button"
            onClick={() => {
              setValue("role", Role.SENDER, { shouldValidate: true });
              setStep(1);
            }}
            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-colors ${
              isSender 
                ? "bg-brand-50 text-brand-700 shadow-sm" 
                : "text-ink-500 hover:text-ink-900 hover:bg-ink-50"
            }`}
          >
            Register as Sender
          </button>
        </div>

        {/* Progress Bar (Only for Agents) */}
        {!isSender && (
          <div className="mb-10">
            <div className="h-2 w-full bg-ink-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand-500 transition-all duration-700 ease-out rounded-full" 
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs font-bold text-ink-400">
              <span>Step {step} of {totalSteps}</span>
              <span>
                {step === 1 && "Basic Info"}
                {step === 2 && "Location Details"}
                {step === 3 && "Professional Info"}
                {step === 4 && "Review & Submit"}
              </span>
            </div>
          </div>
        )}

        {/* Animated Form Container */}
        <div className="bg-white rounded-xl shadow-xl border border-ink-100 relative overflow-hidden transition-all duration-500" style={{ minHeight: isSender ? '450px' : '400px' }}>
          
          <form onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col">
            
            {/* ── SENDER FLOW (Single Step) ── */}
            {isSender ? (
              <div className="p-8 sm:p-10 space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold text-ink-700 mb-1">Full Name</label>
                    <input
                      {...register("fullName")}
                      type="text"
                      placeholder="Kwabena Owusu"
                      className={`w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all ${
                        errors.fullName ? "border-rose-500 bg-rose-50" : "border-ink-200"
                      }`}
                    />
                    {errors.fullName && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.fullName.message}</p>}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold text-ink-700 mb-1">Email Address</label>
                    <input
                      {...register("email")}
                      type="email"
                      placeholder="hello@example.com"
                      className={`w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all ${
                        errors.email ? "border-rose-500 bg-rose-50" : "border-ink-200"
                      }`}
                    />
                    {errors.email && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.email.message}</p>}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold text-ink-700 mb-1">Password</label>
                    <input
                      {...register("password")}
                      type="password"
                      placeholder="••••••••"
                      className={`w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all ${
                        errors.password ? "border-rose-500 bg-rose-50" : "border-ink-200"
                      }`}
                    />
                    {errors.password && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.password.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-ink-700 mb-1">Country (ISO)</label>
                    <input
                      {...register("country")}
                      type="text"
                      maxLength={2}
                      placeholder="NG, GH, GB"
                      className={`w-full uppercase rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all ${
                        errors.country ? "border-rose-500 bg-rose-50" : "border-ink-200"
                      }`}
                    />
                    {errors.country && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.country.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-ink-700 mb-1">Phone Number <span className="font-normal text-ink-400">(Optional)</span></label>
                    <input
                      {...register("phoneNumber")}
                      type="tel"
                      placeholder="+234..."
                      className={`w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all ${
                        errors.phoneNumber ? "border-rose-500 bg-rose-50" : "border-ink-200"
                      }`}
                    />
                    {errors.phoneNumber && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.phoneNumber.message}</p>}
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-ink-900 text-white font-bold hover:bg-ink-800 transition-all shadow-md disabled:opacity-70"
                  >
                    {isLoading ? <Loader2 className="size-5 animate-spin" /> : "Create Account"} 
                    {!isLoading && <ArrowRight className="size-4" />}
                  </button>
                </div>
              </div>
            ) : (
              /* ── AGENT FLOW (Multi-Step) ── */
              <div className="relative flex-1">
                
                {/* Step 1: Basic Info */}
                <div className={`absolute inset-0 p-8 sm:p-10 transition-all duration-500 transform ${step === 1 ? "translate-x-0 opacity-100 relative z-10" : "-translate-x-full opacity-0 pointer-events-none absolute"}`}>
                  <h2 className="text-xl font-bold text-ink-900 mb-6 flex items-center gap-2">
                    <User className="size-5 text-brand-500" /> Account Details
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-ink-700 mb-1">Full Name</label>
                      <input 
                        {...register("fullName")}
                        type="text" 
                        placeholder="Kwabena Owusu" 
                        className={`w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all ${errors.fullName ? "border-rose-500 bg-rose-50" : "border-ink-200"}`} 
                      />
                      {errors.fullName && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.fullName.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-ink-700 mb-1">Email Address</label>
                      <input 
                        {...register("email")}
                        type="email" 
                        placeholder="kwabena@example.com" 
                        className={`w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all ${errors.email ? "border-rose-500 bg-rose-50" : "border-ink-200"}`} 
                      />
                      {errors.email && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.email.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-ink-700 mb-1">Password</label>
                      <input 
                        {...register("password")}
                        type="password" 
                        placeholder="••••••••" 
                        className={`w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all ${errors.password ? "border-rose-500 bg-rose-50" : "border-ink-200"}`} 
                      />
                      {errors.password && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.password.message}</p>}
                    </div>
                  </div>
                </div>

                {/* Step 2: Location */}
                <div className={`absolute inset-0 p-8 sm:p-10 transition-all duration-500 transform ${step === 2 ? "translate-x-0 opacity-100 relative z-10" : step < 2 ? "translate-x-full opacity-0 pointer-events-none absolute" : "-translate-x-full opacity-0 pointer-events-none absolute"}`}>
                  <h2 className="text-xl font-bold text-ink-900 mb-6 flex items-center gap-2">
                    <MapPin className="size-5 text-brand-500" /> Regional Settings
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-ink-700 mb-1">Country (ISO)</label>
                      <input 
                        {...register("country")}
                        type="text" 
                        maxLength={2}
                        placeholder="NG, GH" 
                        className={`w-full uppercase rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all ${errors.country ? "border-rose-500 bg-rose-50" : "border-ink-200"}`} 
                      />
                      {errors.country && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.country.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-ink-700 mb-1">Phone Number <span className="font-normal text-ink-400">(Optional)</span></label>
                      <input 
                        {...register("phoneNumber")}
                        type="tel" 
                        placeholder="+234 800 000 0000" 
                        className={`w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all ${errors.phoneNumber ? "border-rose-500 bg-rose-50" : "border-ink-200"}`} 
                      />
                      {errors.phoneNumber && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.phoneNumber.message}</p>}
                    </div>
                  </div>
                </div>

                {/* Step 3: Agent Professional Details */}
                <div className={`absolute inset-0 p-8 sm:p-10 transition-all duration-500 transform ${step === 3 ? "translate-x-0 opacity-100 relative z-10" : step < 3 ? "translate-x-full opacity-0 pointer-events-none absolute" : "-translate-x-full opacity-0 pointer-events-none absolute"}`}>
                  <h2 className="text-xl font-bold text-ink-900 mb-6 flex items-center gap-2">
                    <Building className="size-5 text-brand-500" /> Professional Background
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-ink-700 mb-1">Company / Agency Name <span className="font-normal text-ink-400">(Optional)</span></label>
                      <input {...register("companyName")} type="text" placeholder="Owusu Builders Ltd" className="w-full rounded-xl border border-ink-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-ink-700 mb-1">Years of Experience <span className="font-normal text-ink-400">(Optional)</span></label>
                      <input {...register("yearsExperience")} type="number" placeholder="10" className="w-full rounded-xl border border-ink-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-ink-700 mb-2">Specialties</label>
                      <div className="flex flex-wrap gap-2">
                        {(Object.entries(ASSET_TYPE_LABEL) as [string, string][]).map(([value, label]) => {
                          const isSelected = (watch("specialties") || []).includes(value);
                          return (
                            <button 
                              key={value} 
                              type="button" 
                              onClick={() => toggleSpecialty(value)}
                              className={`px-3 py-1.5 rounded-2xl border text-sm font-medium transition-colors ${
                                isSelected 
                                  ? "bg-brand-50 border-brand-500 text-brand-700" 
                                  : "border-ink-200 text-ink-600 hover:border-brand-500 hover:text-brand-600 focus:bg-brand-50 focus:border-brand-500 focus:text-brand-700"
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 4: Final Success/Review */}
                <div className={`absolute inset-0 p-8 sm:p-10 transition-all duration-500 transform ${step === 4 ? "translate-x-0 opacity-100 relative z-10" : step < 4 ? "translate-x-full opacity-0 pointer-events-none absolute" : "-translate-x-full opacity-0 pointer-events-none absolute"}`}>
                  <div className="flex flex-col items-center justify-center text-center h-full min-h-[250px]">
                    <div className="size-16 rounded-full bg-brand-100 flex items-center justify-center mb-6">
                      <CheckCircle2 className="size-8 text-brand-600" />
                    </div>
                    <h2 className="text-2xl font-black text-ink-900 mb-2">Ready to submit?</h2>
                    <p className="text-ink-500 mb-8 max-w-sm">
                      Your profile will be reviewed by our compliance team before you receive the Verified Badge.
                    </p>
                  </div>
                </div>

                {/* Navigation Controls */}
                <div className="mt-auto p-6 border-t border-ink-100 flex items-center justify-between bg-ink-50/50">
                  {step > 1 ? (
                    <button 
                      type="button"
                      onClick={handlePrev}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-ink-600 font-bold hover:bg-ink-100 transition-colors"
                    >
                      <ChevronLeft className="size-4" /> Back
                    </button>
                  ) : <div />}
                  
                  {step === totalSteps ? (
                    <button 
                      type="submit"
                      disabled={isLoading}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-ink-900 text-white font-bold hover:bg-ink-800 hover:-translate-y-0.5 transition-all shadow-md disabled:opacity-70 disabled:hover:translate-y-0"
                    >
                      {isLoading ? <Loader2 className="size-5 animate-spin" /> : "Complete Setup"} 
                      {!isLoading && <ArrowRight className="size-4" />}
                    </button>
                  ) : (
                    <button 
                      type="button"
                      onClick={handleNext}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-ink-900 text-white font-bold hover:bg-ink-800 hover:-translate-y-0.5 transition-all shadow-md"
                    >
                      Continue <ArrowRight className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

          </form>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-ink-500 font-medium pt-2">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-600 hover:text-brand-700 font-bold">
              Log in
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
