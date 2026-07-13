"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, API_URL } from "@/lib/api";
import { formatTime12 } from "@/lib/format";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const LEVELS = [100, 200, 300, 400, 500];

export default function PublicTimetablePage() {
  const params = useParams();
  const level = params.level;

  const [semester, setSemester] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dayFilter, setDayFilter] = useState("");
  const [search, setSearch] = useState("");

useEffect(() => {
  api
    .get("/semesters/active")
    .then(({ semester }) => {
      setSemester(semester);
      if (!semester) {
        setError(
          "No active semester has been set yet. An admin needs to activate one first.",
        );
        setLoading(false);
      }
    })
    .catch(() => {
      setError("Could not determine the current semester");
      setLoading(false);
    });
}, []);

  useEffect(() => {
    if (!semester) return;
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ semester: semester._id, level });
    if (dayFilter) params.set("day", dayFilter);
    if (search) params.set("search", search);

    api
      .get(`/timetable/public?${params}`)
      .then(({ entries }) => setEntries(entries))
      .catch((err) => setError(err.message || "Failed to load timetable"))
      .finally(() => setLoading(false));
  }, [semester, level, dayFilter, search]);

  function exportUrl(format) {
    if (!semester) return "#";
    const params = new URLSearchParams({ semester: semester._id, level });
    return `${API_URL}/timetable/public/export${format === "excel" ? "/excel" : ""}?${params}`;
  }

  const sorted = [...entries].sort((a, b) => {
    const dayDiff = DAYS.indexOf(a.timeSlot.day) - DAYS.indexOf(b.timeSlot.day);
    if (dayDiff !== 0) return dayDiff;
    return a.timeSlot.startTime.localeCompare(b.timeSlot.startTime);
  });

  return (
    <main className="min-h-screen bg-chalk">
      <header className="border-b border-rule bg-board px-6 py-8 text-chalk">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/"
            className="text-xs uppercase tracking-[0.2em] text-amber"
          >
            ← Online Timetable Generating System
          </Link>
          <h1 className="mt-2 font-display text-3xl font-semibold">
            {level} Level Timetable
          </h1>
          {semester && (
            <p className="mt-1 text-sm text-chalk/70">
              {semester.session?.name} · {semester.name} semester
            </p>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2">
            {LEVELS.map((l) => (
              <Link
                key={l}
                href={`/timetable/${l}`}
                className={`rounded-sm px-3 py-1.5 text-sm transition ${
                  String(l) === level
                    ? "bg-board text-chalk"
                    : "border border-rule bg-white text-ink hover:border-board"
                }`}
              >
                {l}
              </Link>
            ))}
          </div>

          <select
            value={dayFilter}
            onChange={(e) => setDayFilter(e.target.value)}
            className="ml-auto rounded-sm border border-rule bg-white px-3 py-2 text-sm text-ink outline-none focus:border-board"
          >
            <option value="">All days</option>
            {DAYS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Search course, lecturer, venue…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-xs rounded-sm border border-rule bg-white px-3 py-2 text-sm text-ink outline-none focus:border-board"
          />
        </div>

        <div className="mt-4 flex gap-3">
          <a
            href={exportUrl("pdf")}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-sm border border-rule bg-white px-4 py-2 text-sm text-ink transition hover:border-board"
          >
            Download PDF
          </a>
          <a
            href={exportUrl("excel")}
            className="rounded-sm border border-rule bg-white px-4 py-2 text-sm text-ink transition hover:border-board"
          >
            Download Excel
          </a>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-sm bg-danger/10 px-4 py-3 text-sm text-danger"
          >
            {error}
          </p>
        )}

        <div className="mt-6 overflow-x-auto rounded-sm border border-rule bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-chalk text-xs uppercase tracking-wide text-slate">
              <tr>
                <th className="px-5 py-3">Day</th>
                <th className="px-5 py-3">Time</th>
                <th className="px-5 py-3">Course</th>
                <th className="px-5 py-3">Lecturer</th>
                <th className="px-5 py-3">Venue</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && sorted.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate">
                    No timetable published for {level} Level yet.
                  </td>
                </tr>
              )}
              {sorted.map((entry) => (
                <tr key={entry._id} className="border-t border-rule">
                  <td className="px-5 py-3 text-ink">{entry.timeSlot.day}</td>
                  <td className="px-5 py-3 text-slate">
                    {formatTime12(entry.timeSlot.startTime)} –{" "}
                    {formatTime12(entry.timeSlot.endTime)}
                  </td>
                  <td className="px-5 py-3 text-slate">
                    <span className="font-medium text-ink">
                      {entry.course.courseCode}
                    </span>
                    <br />
                    <span className="text-xs">{entry.course.courseTitle}</span>
                  </td>
                  <td className="px-5 py-3 text-slate">
                    {entry.lecturer.name}
                  </td>
                  <td className="px-5 py-3 text-slate">{entry.venue.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}