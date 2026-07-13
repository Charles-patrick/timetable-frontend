"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function MyTimetableLayout({ children }) {
  const router = useRouter();
  const [status, setStatus] = useState("checking");
  const [user, setUser] = useState(null);

  useEffect(() => {
    let cancelled = false;

    api
      .get("/auth/me")
      .then(({ user }) => {
        if (cancelled) return;
        if (user.role !== "lecturer") {
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

  async function handleLogout() {
    try {
      await api.post("/auth/logout");
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-chalk text-slate">
        Checking your session…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-chalk">
      <header className="flex items-center justify-between border-b border-rule bg-board px-6 py-5 text-chalk">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-amber">
            Lecturer
          </div>
          <div className="font-display text-lg font-semibold">{user?.name}</div>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-sm border border-chalk/25 px-4 py-2 text-sm text-chalk transition hover:border-chalk"
        >
          Log out
        </button>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
