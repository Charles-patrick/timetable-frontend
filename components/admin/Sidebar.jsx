"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/departments", label: "Departments" },
  { href: "/dashboard/courses", label: "Courses" },
  { href: "/dashboard/lecturers", label: "Lecturers" },
  { href: "/dashboard/venues", label: "Venues" },
  { href: "/dashboard/timeslots", label: "Time Slots" },
  { href: "/dashboard/sessions", label: "Sessions" },
  { href: "/dashboard/timetable", label: "Timetable" },
  { href: "/dashboard/conflicts", label: "Conflict Reports" },
];

export default function Sidebar({ userName, open, onClose }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await api.post("/auth/logout");
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex h-screen w-64 flex-col justify-between bg-board text-chalk transition-transform duration-200 lg:static lg:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div>
        <div className="border-b border-rule-dark px-6 py-6">
          <div className="text-xs uppercase tracking-[0.2em] text-amber">
            Admin
          </div>
          <div className="mt-1 font-display text-lg font-semibold">
            Timetable System
          </div>
        </div>

        <nav className="flex flex-col gap-1 px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`rounded-sm px-3 py-2.5 text-sm transition ${
                  active
                    ? "bg-amber text-board-dark font-medium"
                    : "text-chalk/80 hover:bg-board-dark hover:text-chalk"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-rule-dark px-6 py-5">
        {userName && (
          <div className="mb-3 text-sm text-chalk/70">
            Signed in as {userName}
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full rounded-sm border border-chalk/25 px-3 py-2 text-left text-sm text-chalk transition hover:border-chalk"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
