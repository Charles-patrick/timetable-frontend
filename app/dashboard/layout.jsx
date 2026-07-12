"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Sidebar from "@/components/admin/Sidebar";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [status, setStatus] = useState("checking"); // "checking" | "ready"
  const [user, setUser] = useState(null);

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
    <div className="flex min-h-screen bg-chalk">
      <Sidebar userName={user?.name} />
      <main className="flex-1 overflow-y-auto px-10 py-10">{children}</main>
    </div>
  );
}
