"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatTime12 } from "@/lib/format";

function ConflictGroup({ group }) {
  return (
    <div className="rounded-sm border border-danger/30 bg-danger/5 p-4">
      <div className="text-xs text-slate">
        {group[0].timeSlot.day} · {formatTime12(group[0].timeSlot.startTime)} –{" "}
        {formatTime12(group[0].timeSlot.endTime)}
      </div>
      <ul className="mt-2 flex flex-col gap-1">
        {group.map((entry) => (
          <li key={entry._id} className="text-sm text-ink">
            <span className="font-medium">{entry.course.courseCode}</span> —{" "}
            {entry.lecturer.name} in {entry.venue.name}{" "}
            <span className="text-slate">(Level {entry.level})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ConflictSection({ title, description, groups }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
      <p className="mt-1 text-sm text-slate">{description}</p>

      {groups.length === 0 ? (
        <p className="mt-4 rounded-sm bg-success/10 px-4 py-3 text-sm text-success">
          No {title.toLowerCase()} found.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {groups.map((group, i) => (
            <ConflictGroup key={i} group={group} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function ConflictsPage() {
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/semesters")
      .then(({ semesters }) => {
        setSemesters(semesters);
        const active = semesters.find((s) => s.active);
        setSelectedSemester(active?._id || semesters[0]?._id || "");
      })
      .catch((err) => setError(err.message || "Failed to load semesters"));
  }, []);

  async function loadReport() {
    if (!selectedSemester) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ semester: selectedSemester });
      const report = await api.get(`/timetable/conflicts?${params}`);
      setReport(report);
    } catch (err) {
      setError(err.message || "Failed to load conflict report");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSemester]);

  const totalConflicts = report
    ? report.lecturerConflicts.length +
      report.venueConflicts.length +
      report.levelConflicts.length
    : 0;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">
            Conflict Reports
          </h1>
          <p className="mt-1 text-sm text-slate">
            The generator won't create these, but a manual edit could — check
            here after making changes.
          </p>
        </div>
        <button
          onClick={loadReport}
          className="rounded-sm border border-rule bg-white px-4 py-2.5 text-sm text-ink transition hover:border-board"
        >
          Refresh
        </button>
      </div>

      <select
        value={selectedSemester}
        onChange={(e) => setSelectedSemester(e.target.value)}
        className="mt-6 w-full max-w-sm rounded-sm border border-rule bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-board"
      >
        {semesters.length === 0 && <option value="">No semesters yet</option>}
        {semesters.map((s) => (
          <option key={s._id} value={s._id}>
            {s.session?.name} — {s.name} semester{s.active ? " (active)" : ""}
          </option>
        ))}
      </select>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-sm bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {error}
        </p>
      )}

      {loading && (
        <p className="mt-8 text-sm text-slate">Checking for conflicts…</p>
      )}

      {!loading && report && (
        <>
          <div
            className={`mt-6 rounded-sm px-4 py-3 text-sm font-medium ${
              totalConflicts === 0
                ? "bg-success/10 text-success"
                : "bg-danger/10 text-danger"
            }`}
          >
            {totalConflicts === 0
              ? "The current timetable for this semester is clash-free."
              : `${totalConflicts} conflict${totalConflicts === 1 ? "" : "s"} found.`}
          </div>

          <ConflictSection
            title="Lecturer Conflicts"
            description="The same lecturer assigned to two classes at the same time."
            groups={report.lecturerConflicts}
          />
          <ConflictSection
            title="Venue Conflicts"
            description="The same venue assigned to two courses at the same time."
            groups={report.venueConflicts}
          />
          <ConflictSection
            title="Level Conflicts"
            description="Courses in the same level overlapping at the same time."
            groups={report.levelConflicts}
          />
        </>
      )}
    </div>
  );
}
