"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { user } = await api.post("/auth/login", { email, password });
      router.push(user.role === "admin" ? "/dashboard" : "/my-timetable");
      router.refresh();
    } catch (err) {
      setError(err.message || "Login failed. Check your details and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Left: ruled chalkboard panel, echoes the landing page signature */}
      <div className="relative hidden overflow-hidden bg-board text-chalk lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(246,243,233,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(246,243,233,0.08) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        <div className="relative text-sm uppercase tracking-[0.2em] text-amber">
          Online Timetable Generating System
        </div>
        <div className="relative">
          <p className="font-display text-3xl italic leading-snug">
            "The clash-free schedule the registrar used to build by hand —
            now generated in seconds."
          </p>
        </div>
      </div>

      {/* Right: login form */}
      <div className="flex items-center justify-center bg-chalk px-6 py-16">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-2xl font-semibold text-ink">Sign in</h1>
          <p className="mt-1 text-sm text-slate">
            Admin and lecturer accounts only.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
            <label className="flex flex-col gap-1.5 text-sm text-ink">
              Email
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-sm border border-rule bg-white px-3 py-2.5 text-ink outline-none focus:border-board"
                placeholder="you@timetable.edu"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm text-ink">
              Password
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-sm border border-rule bg-white px-3 py-2.5 text-ink outline-none focus:border-board"
                placeholder="••••••••"
              />
            </label>

            {error && (
              <p role="alert" className="rounded-sm bg-danger/10 px-3 py-2 text-sm text-danger">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 rounded-sm bg-board px-4 py-3 text-sm font-medium text-chalk transition hover:bg-board-dark disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
