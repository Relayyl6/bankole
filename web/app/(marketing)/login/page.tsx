"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { loginSchema, type LoginInput } from "@/lib/schemas";
import { useAuth } from "@/lib/auth-context";
import { apiClient, TokenManager } from "@/lib/api-client";

function LoginForm() {
  const { mutateUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/dashboard";
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    try {
      const response = await apiClient("/auth/login", {
        method: "POST",
        body: data,
        requireAuth: false,
      });
      const token = response.accessToken || response.access_token || response.token;
      const refresh = response.refreshToken || response.refresh_token;

      if (!token) {
        throw new Error("Login succeeded but no token was returned by the server.");
      }

      TokenManager.setTokens({
        accessToken: token,
        refreshToken: refresh,
      });
      
      // Cache user from response if present (e.g. from register/login body)
      const authUser = response.user || response.data?.user || response.data;
      if (authUser && authUser.id) {
        TokenManager.setCachedUser(authUser);
      }

      await mutateUser();
      toast.success("Welcome back!");
      router.push(redirectTarget);
    } catch (err: any) {
      toast.error(err.message || "Failed to log in.");
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

      <div className="w-full max-w-md relative z-10">
        <div className="mb-8 text-center">
          {/* <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <ShieldCheck className="size-8 text-brand-600" />
            <span className="text-2xl font-bold text-ink-900 tracking-tight">Bankole</span>
          </Link> */}
          <h1 className="text-3xl font-black text-ink-900 mb-2">Welcome back</h1>
          <p className="text-ink-500">Log in to manage your projects.</p>
        </div>

        <div className="bg-white rounded-xl shadow-xl border border-ink-100 p-8 sm:p-10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-ink-700 mb-1">Email Address</label>
              <input
                {...register("email")}
                type="email"
                placeholder="hello@example.com"
                className={`w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all ${
                  errors.email ? "border-rose-500 bg-rose-50" : "border-ink-200 bg-white"
                }`}
              />
              {errors.email && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-ink-700 mb-1">Password</label>
              <input
                {...register("password")}
                type="password"
                placeholder="••••••••"
                className={`w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all ${
                  errors.password ? "border-rose-500 bg-rose-50" : "border-ink-200 bg-white"
                }`}
              />
              {errors.password && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between pb-2">
              <label className="flex items-center gap-2 text-sm text-ink-500 cursor-pointer">
                <input type="checkbox" className="rounded text-brand-600 focus:ring-brand-500" />
                Remember me
              </label>
              <Link href="#" className="text-sm font-bold text-brand-600 hover:text-brand-700">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-ink-900 text-white font-bold hover:bg-ink-800 transition-all shadow-md disabled:opacity-70"
            >
              {isLoading ? <Loader2 className="size-5 animate-spin" /> : "Sign in"} 
              {!isLoading && <ArrowRight className="size-4" />}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-ink-500 font-medium">
            Don't have an account?{" "}
            <Link href="/agents/apply" className="text-brand-600 hover:text-brand-700 font-bold">
              Register now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-ink-500">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
