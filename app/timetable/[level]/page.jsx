"use client";

import { useEffect, useMemo, useState } from "react";
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
  const [semesterError, setSemesterError] = useState("");

  const [departments, setDepartments] = useState([]);
  const [department, setDepartment] = useState("");

  const [timeSlots, setTimeSlots] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ── Load semester, departments, time slots once ──────────────
  useEffect(() => {
    api
      .get("/semesters/active")
      .then(({ semester }) => {
        setSemester(semester);
        if (!semester) {
          setSemesterError(
            "No active semester has been set yet. Please check back later.",
          );
          setLoading(false);
        }
      })
      .catch(() => {
        setSemesterError("Could not determine the current semester");
        setLoading(false);
      });

    api
      .get("/departments/public")
      .then(({ departments }) => {
        setDepartments(departments);
        setDepartment(departments[0]?._id || "");
      })
      .catch(() => setError("Could not load departments"));

    api
      .get("/timeslots/public")
      .then(({ timeSlots }) => setTimeSlots(timeSlots))
      .catch(() => setError("Could not load time slots"));
  }, []);

  // ── Load entries whenever semester/level/department is known ─
  async function loadEntries(silent = false) {
    if (!semester || !department) return;
    if (!silent) setLoading(true);
    if (!silent) setError("");
    const params = new URLSearchParams({
      semester: semester._id,
      level,
      department,
    });

    try {
      const { entries } = await api.get(`/timetable/public?${params}`);
      setEntries(entries);
    } catch (err) {
      if (!silent) setError(err.message || "Failed to load timetable");
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semester, level, department]);

  // Real-time-ish updates: this page has no login and no way to know when
  // an admin publishes a change, so it just quietly re-checks every 20s.
  useEffect(() => {
    if (!semester || !department) return;
    const interval = setInterval(() => loadEntries(true), 20000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semester, level, department]);

  // ── Build the grid: rows = distinct time ranges, columns = days ──
  const timeRanges = useMemo(() => {
    const set = new Set(timeSlots.map((t) => `${t.startTime}|${t.endTime}`));
    return Array.from(set).sort();
  }, [timeSlots]);

  const slotLookup = useMemo(() => {
    const map = {};
    timeSlots.forEach((t) => {
      map[`${t.day}|${t.startTime}|${t.endTime}`] = t;
    });
    return map;
  }, [timeSlots]);

  const entryLookup = useMemo(() => {
    const map = {};
    entries.forEach((e) => {
      map[e.timeSlot._id] = e;
    });
    return map;
  }, [entries]);

  function exportUrl(format) {
    if (!semester || !department) return "#";
    const params = new URLSearchParams({
      semester: semester._id,
      level,
      department,
    });
    return `${API_URL}/timetable/public/export${format === "excel" ? "/excel" : ""}?${params}`;
  }

  return (
    <main className="min-h-screen bg-chalk">
      <header className="border-b border-rule bg-board px-6 py-8 text-chalk">
        <div className="mx-auto max-w-6xl">
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

      <div className="mx-auto max-w-6xl px-6 py-8">
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
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="ml-auto rounded-sm border border-rule bg-white px-3 py-2 text-sm text-ink outline-none focus:border-board"
          >
            {departments.length === 0 && (
              <option value="">No departments yet</option>
            )}
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>
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

        {(error || semesterError) && (
          <p
            role="alert"
            className="mt-4 rounded-sm bg-danger/10 px-4 py-3 text-sm text-danger"
          >
            {error || semesterError}
          </p>
        )}

        {timeSlots.length === 0 ? (
          <p className="mt-8 text-sm text-slate">
            No time slots have been published yet.
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-sm border border-rule bg-white">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-board text-chalk">
                  <th className="border border-rule-dark px-4 py-3 text-xs uppercase tracking-wide">
                    Time
                  </th>
                  {DAYS.map((day) => (
                    <th
                      key={day}
                      className="border border-rule-dark px-4 py-3 text-xs uppercase tracking-wide"
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td
                      colSpan={DAYS.length + 1}
                      className="px-5 py-8 text-center text-slate"
                    >
                      Loading…
                    </td>
                  </tr>
                )}

                {!loading &&
                  timeRanges.map((range) => {
                    const [startTime, endTime] = range.split("|");
                    return (
                      <tr key={range}>
                        <td className="whitespace-nowrap border border-rule bg-chalk px-4 py-3 font-medium text-ink">
                          {formatTime12(startTime)} – {formatTime12(endTime)}
                        </td>
                        {DAYS.map((day) => {
                          const slot =
                            slotLookup[`${day}|${startTime}|${endTime}`];
                          const entry = slot ? entryLookup[slot._id] : null;

                          if (!slot) {
                            return (
                              <td
                                key={day}
                                className="border border-rule bg-rule/20 px-4 py-3 text-center text-slate"
                              >
                                —
                              </td>
                            );
                          }

                          return (
                            <td
                              key={day}
                              className="border border-rule bg-white px-4 py-3 align-top"
                            >
                              {entry ? (
                                <div>
                                  <div className="font-medium text-ink">
                                    {entry.course.courseCode}
                                  </div>
                                  <div className="text-xs text-slate">
                                    {entry.lecturer.name}
                                  </div>
                                  <div className="text-xs text-slate">
                                    {entry.venue.name}
                                  </div>
                                </div>
                              ) : (
                                <div>&nbsp;</div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}