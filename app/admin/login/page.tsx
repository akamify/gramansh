"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  User,
} from "lucide-react";
import { adminLogin } from "@/app/lib/apiClient";
import { setAdminSession } from "@/app/lib/adminSession";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const onLogin = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();

    if (loading) return;

    const cleanUsername = username.trim();

    if (!cleanUsername || !password) {
      setMessage("Username and password are required.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const data = await adminLogin(cleanUsername, password);
      const token = String(data.token || "");

      if (!token) throw new Error("Admin token missing");

      setAdminSession(token, String(data.username || cleanUsername));
      window.location.href = "/admin";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(225,205,160,0.28),transparent_26%),linear-gradient(180deg,#fcf8f0_0%,#f4ead8_100%)] text-slate-950">
      <div className="grid min-h-screen place-items-center px-4 py-8">
        <section className="w-full max-w-md overflow-hidden rounded-[24px] border border-[#dccaa7] bg-[linear-gradient(180deg,#fffdf8_0%,#f8f0e0_100%)] shadow-[0_28px_80px_rgba(87,64,26,0.14)]">
          <div className="border-b border-[#dccaa7] bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(249,241,226,0.85))] px-6 py-5">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-[#8f7d5f] transition hover:text-[#234a22]"
            >
              <ArrowLeft size={14} strokeWidth={2.7} />
              Back to Store
            </Link>

            <div className="mt-6 flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] bg-[linear-gradient(135deg,#234a22,#3a6a2e)] text-white shadow-[0_14px_30px_rgba(35,74,34,0.22)]">
                <ShieldCheck size={22} strokeWidth={2.6} />
              </div>

              <div className="min-w-0">

                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#9a6a2f]">
                  Gram Ansh
                </p>
                <h1 className="mt-1 text-3xl font-black tracking-[-0.05em] text-[#234a22] md:text-4xl">
                  Admin Access
                </h1>
              </div>
            </div>
          </div>

          <form onSubmit={onLogin} className="grid gap-4 px-6 py-6">
            <label className="grid gap-2">
              <span className="text-xs font-black text-slate-600">
                Username
              </span>

              <div className="relative">
                <User
                  size={17}
                  strokeWidth={2.6}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Enter username"
                  autoComplete="username"
                  disabled={loading}
                  className="h-12 w-full rounded-[14px] border border-[#d8c6a5] bg-[#fffaf1] pl-10 pr-4 text-sm font-bold text-slate-950 outline-none transition placeholder:text-[#8f7d5f] focus:border-[#b28a49] focus:ring-4 focus:ring-[#b28a49]/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-black text-slate-600">
                Password
              </span>

              <div className="relative">
                <LockKeyhole
                  size={17}
                  strokeWidth={2.6}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  disabled={loading}
                  className="h-12 w-full rounded-[14px] border border-[#d8c6a5] bg-[#fffaf1] pl-10 pr-11 text-sm font-bold text-slate-950 outline-none transition placeholder:text-[#8f7d5f] focus:border-[#b28a49] focus:ring-4 focus:ring-[#b28a49]/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  disabled={loading}
                  className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-[9px] text-slate-400 transition hover:bg-slate-100 hover:text-slate-950 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff size={17} strokeWidth={2.6} />
                  ) : (
                    <Eye size={17} strokeWidth={2.6} />
                  )}
                </button>
              </div>
            </label>

            {message ? (
              <div className="rounded-[14px] border border-[#b35a4a]/20 bg-[#fff1ee] px-4 py-3 text-sm font-bold text-[#a34b3d]">
                {message}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-[linear-gradient(135deg,#234a22,#3a6a2e)] text-sm font-black uppercase tracking-[0.12em] text-white transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Signing In...
                </>
              ) : (
                "Login"
              )}
            </button>

            <p className="text-center text-[11px] font-bold text-slate-400">
              Press Enter after filling credentials to login.
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
