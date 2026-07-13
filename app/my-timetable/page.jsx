"use client";

import { useEffect, useState } from "react";
import { api, API_URL } from "@/lib/api";
import { formatTime12 } from "@/lib/format";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function MyTimetablePage() {
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
          "No active semester has been set yet. Ask an admin to activate one.",
        );
        setLoading(false);
      }
    })
    .catch(() => {
      setError("Could not determine the current semester");
      setLoading(false);
    });
}, []);useEffect(() => {
  api
    .get("/semesters/active")
    .then(({ semester }) => {
      setSemester(semester);
      if (!semester) {
        setError(
          "No active semester has been set yet. Ask an admin to activate one.",
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
    const params = new URLSearchParams({ semester: semester._id });
    if (dayFilter) params.set("day", dayFilter);
    if (search) params.set("search", search);

    api
      .get(`/timetable/my?${params}`)
      .then(({ entries }) => setEntries(entries))
      .catch((err) => setError(err.message || "Failed to load your timetable"))
      .finally(() => setLoading(false));
  }, [semester, dayFilter, search]);

  function exportUrl(format) {
    if (!semester) return "#";
    const params = new URLSearchParams({ semester: semester._id });
    return `${API_URL}/timetable/my/export${format === "excel" ? "/excel" : ""}?${params}`;
  }

  const sorted = [...entries].sort((a, b) => {
    const dayDiff = DAYS.indexOf(a.timeSlot.day) - DAYS.indexOf(b.timeSlot.day);
    if (dayDiff !== 0) return dayDiff;
    return a.timeSlot.startTime.localeCompare(b.timeSlot.startTime);
  });

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">
        My Timetable
      </h1>
      {semester && (
        <p className="mt-1 text-sm text-slate">
          {semester.session?.name} · {semester.name} semester
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <select
          value={dayFilter}
          onChange={(e) => setDayFilter(e.target.value)}
          className="rounded-sm border border-rule bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-board"
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
          placeholder="Search course or venue…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs rounded-sm border border-rule bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-board"
        />

        <a
          href={exportUrl("pdf")}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto rounded-sm border border-rule bg-white px-4 py-2.5 text-sm text-ink transition hover:border-board"
        >
          Print / PDF
        </a>
        <a
          href={exportUrl("excel")}
          className="rounded-sm border border-rule bg-white px-4 py-2.5 text-sm text-ink transition hover:border-board"
        >
          Export Excel
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
              <th className="px-5 py-3">Level</th>
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
                  Nothing scheduled for you yet this semester.
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
                <td className="px-5 py-3 text-slate">{entry.level}</td>
                <td className="px-5 py-3 text-slate">{entry.venue.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}