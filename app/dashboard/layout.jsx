"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Sidebar from "@/components/admin/Sidebar";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [status, setStatus] = useState("checking"); // "checking" | "ready"
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    api
      .get("/auth/me")
      .then(({ user }) => {
        if (cancelled) return;
        if (user.role !== "admin") {
          router.replace("/login");
          return;
        }
        setUser(user);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) router.replace("/login");
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-chalk text-slate">
        Checking your session…
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-chalk">
      {/* Backdrop, mobile only, closes the drawer on tap-outside */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-ink/40 lg:hidden"
        />
      )}

      <Sidebar
        userName={user?.name}
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile-only top bar with hamburger — hidden at the lg breakpoint,
            where the sidebar is always visible instead. */}
        <div className="flex items-center justify-between border-b border-rule bg-white px-4 py-3 lg:hidden">
          <button
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
            className="rounded-sm p-2 text-ink hover:bg-chalk"
          >
            ☰
          </button>
          <span className="font-display text-sm font-semibold text-ink">
            Timetable System
          </span>
          <span className="w-9" aria-hidden="true" />
        </div>

        <main className="flex-1 overflow-y-auto px-6 py-8 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
