"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

function StatCard({ label, value, accent }) {
  return (
    <div className="rounded-sm border border-rule bg-white p-6">
      <div className="text-xs uppercase tracking-[0.15em] text-slate">
        {label}
      </div>
      <div
        className={`mt-3 font-display text-4xl font-semibold ${accent ? "text-amber-dark" : "text-ink"}`}
      >
        {value}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/dashboard-stats")
      .then(({ stats }) => setStats(stats))
      .catch((err) => setError(err.message || "Failed to load dashboard stats"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">
        Dashboard
      </h1>
      <p className="mt-1 text-sm text-slate">
        A snapshot of the system as it stands right now.
      </p>

      {loading && <p className="mt-8 text-sm text-slate">Loading stats…</p>}

      {error && (
        <p
          role="alert"
          className="mt-8 rounded-sm bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {error}
        </p>
      )}

      {stats && (
        <>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Courses" value={stats.totalCourses} />
            <StatCard label="Total Lecturers" value={stats.totalLecturers} />
            <StatCard label="Total Venues" value={stats.totalVenues} />
            <StatCard label="Total Time Slots" value={stats.totalTimeSlots} />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Timetable Entries (current)"
              value={stats.totalTimetableEntries}
              accent
            />
            <StatCard
              label="Unscheduled Courses"
              value={stats.totalUnscheduled}
              accent
            />
            <div className="rounded-sm border border-rule bg-white p-6">
              <div className="text-xs uppercase tracking-[0.15em] text-slate">
                Active Session / Semester
              </div>
              {stats.activeSession ? (
                <div className="mt-3 font-display text-xl font-semibold text-ink">
                  {stats.activeSession.name}
                  {stats.activeSemester && (
                    <span className="ml-2 text-base font-normal capitalize text-slate">
                      · {stats.activeSemester.name} semester
                    </span>
                  )}
                </div>
              ) : (
                <div className="mt-3 text-sm text-slate">
                  No active session set yet
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
