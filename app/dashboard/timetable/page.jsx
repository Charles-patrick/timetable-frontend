"use client";

import { useEffect, useState } from "react";
import { api, API_URL } from "@/lib/api";
import Modal from "@/components/admin/Modal";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const LEVELS = [100, 200, 300, 400, 500];

export default function TimetablePage() {
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [dayFilter, setDayFilter] = useState("");
  const [search, setSearch] = useState("");

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [generating, setGenerating] = useState(false);
  const [generateResult, setGenerateResult] = useState(null);

  // Dropdown data for the manual reassignment modal
  const [lecturers, setLecturers] = useState([]);
  const [venues, setVenues] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editForm, setEditForm] = useState({ lecturer: "", venue: "", timeSlot: "" });
  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // ── Load semesters + dropdown data once ──────────────────────
  useEffect(() => {
    async function init() {
      try {
        const [{ semesters }, { lecturers }, { venues }, { timeSlots }] = await Promise.all([
          api.get("/semesters"),
          api.get("/lecturers"),
          api.get("/venues"),
          api.get("/timeslots"),
        ]);
        setSemesters(semesters);
        setLecturers(lecturers);
        setVenues(venues);
        setTimeSlots(timeSlots);

        const active = semesters.find((s) => s.active);
        setSelectedSemester(active?._id || semesters[0]?._id || "");
      } catch (err) {
        setError(err.message || "Failed to load setup data");
      }
    }
    init();
  }, []);

  async function loadEntries() {
    if (!selectedSemester) {
      setEntries([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ semester: selectedSemester });
      if (levelFilter) params.set("level", levelFilter);
      if (dayFilter) params.set("day", dayFilter);
      if (search) params.set("search", search);
      const { entries } = await api.get(`/timetable?${params}`);
      setEntries(entries);
    } catch (err) {
      setError(err.message || "Failed to load timetable");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSemester]);

  useEffect(() => {
    const timer = setTimeout(loadEntries, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelFilter, dayFilter, search]);

  async function handleGenerate() {
    if (!selectedSemester) return;
    if (
      !confirm(
        "Generate a fresh timetable for this semester? Previous entries stay saved as history, but the timetable view will switch to this new run."
      )
    )
      return;

    setGenerating(true);
    setGenerateResult(null);
    setError("");
    try {
      const result = await api.post("/timetable/generate", { semester: selectedSemester });
      setGenerateResult(result);
      await loadEntries();
    } catch (err) {
      setError(err.message || "Failed to generate timetable");
    } finally {
      setGenerating(false);
    }
  }

  function openEditModal(entry) {
    setEditingEntry(entry);
    setEditForm({
      lecturer: entry.lecturer._id,
      venue: entry.venue._id,
      timeSlot: entry.timeSlot._id,
    });
    setEditError("");
    setEditModalOpen(true);
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    setEditSaving(true);
    setEditError("");
    try {
      await api.put(`/timetable/${editingEntry._id}`, editForm);
      setEditModalOpen(false);
      await loadEntries();
    } catch (err) {
      setEditError(err.message || "This change conflicts with another entry");
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDelete(entry) {
    if (!confirm(`Remove ${entry.course.courseCode} from the timetable?`)) return;
    try {
      await api.delete(`/timetable/${entry._id}`);
      await loadEntries();
    } catch (err) {
      alert(err.message || "Failed to delete entry");
    }
  }

  function exportUrl(format) {
    const params = new URLSearchParams({ semester: selectedSemester });
    if (levelFilter) params.set("level", levelFilter);
    return `${API_URL}/timetable/export${format === "excel" ? "/excel" : ""}?${params}`;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Timetable</h1>
          <p className="mt-1 text-sm text-slate">Generate, review, and fine-tune the schedule.</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating || !selectedSemester}
          className="rounded-sm bg-amber px-5 py-2.5 text-sm font-medium text-board-dark transition hover:bg-amber-dark disabled:opacity-50"
        >
          {generating ? "Generating…" : "⚡ Generate Timetable"}
        </button>
      </div>

      {generateResult && (
        <div className="mt-4 rounded-sm border border-rule bg-white p-4 text-sm">
          <p className="text-ink">
            Scheduled <strong>{generateResult.scheduledCount}</strong> of{" "}
            <strong>{generateResult.totalCourses}</strong> courses.
            {generateResult.unscheduledCount > 0 && (
              <span className="text-danger"> {generateResult.unscheduledCount} could not be placed.</span>
            )}
          </p>
          {generateResult.unscheduled?.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-slate">
              {generateResult.unscheduled.map((u) => (
                <li key={u._id}>
                  {u.course.courseCode} — {u.reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <select
          value={selectedSemester}
          onChange={(e) => setSelectedSemester(e.target.value)}
          className="rounded-sm border border-rule bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-board"
        >
          {semesters.length === 0 && <option value="">No semesters yet</option>}
          {semesters.map((s) => (
            <option key={s._id} value={s._id}>
              {s.session?.name} — {s.name} semester{s.active ? " (active)" : ""}
            </option>
          ))}
        </select>

        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="rounded-sm border border-rule bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-board"
        >
          <option value="">All levels</option>
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {l} Level
            </option>
          ))}
        </select>

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
          placeholder="Search course, lecturer, venue…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] rounded-sm border border-rule bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-board"
        />

        <a
          href={exportUrl("pdf")}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-sm border border-rule bg-white px-4 py-2.5 text-sm text-ink transition hover:border-board"
        >
          Export PDF
        </a>
        <a
          href={exportUrl("excel")}
          className="rounded-sm border border-rule bg-white px-4 py-2.5 text-sm text-ink transition hover:border-board"
        >
          Export Excel
        </a>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-sm bg-danger/10 px-4 py-3 text-sm text-danger">
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
              <th className="px-5 py-3">Lecturer</th>
              <th className="px-5 py-3">Venue</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-slate">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && entries.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-slate">
                  No timetable generated yet for this semester.
                </td>
              </tr>
            )}
            {entries.map((entry) => (
              <tr key={entry._id} className="border-t border-rule">
                <td className="px-5 py-3 text-ink">{entry.timeSlot.day}</td>
                <td className="px-5 py-3 text-slate">
                  {entry.timeSlot.startTime} – {entry.timeSlot.endTime}
                </td>
                <td className="px-5 py-3 text-slate">
                  <span className="font-medium text-ink">{entry.course.courseCode}</span>
                  <br />
                  <span className="text-xs">{entry.course.courseTitle}</span>
                </td>
                <td className="px-5 py-3 text-slate">{entry.level}</td>
                <td className="px-5 py-3 text-slate">{entry.lecturer.name}</td>
                <td className="px-5 py-3 text-slate">{entry.venue.name}</td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => openEditModal(entry)}
                    className="mr-3 text-sm text-board hover:underline"
                  >
                    Reassign
                  </button>
                  <button
                    onClick={() => handleDelete(entry)}
                    className="text-sm text-danger hover:underline"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editModalOpen && (
        <Modal
          title={`Reassign ${editingEntry.course.courseCode}`}
          onClose={() => setEditModalOpen(false)}
        >
          <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm text-ink">
              Lecturer
              <select
                value={editForm.lecturer}
                onChange={(e) => setEditForm({ ...editForm, lecturer: e.target.value })}
                className="rounded-sm border border-rule bg-white px-3 py-2 outline-none focus:border-board"
              >
                {lecturers.map((l) => (
                  <option key={l._id} value={l._id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-sm text-ink">
              Venue
              <select
                value={editForm.venue}
                onChange={(e) => setEditForm({ ...editForm, venue: e.target.value })}
                className="rounded-sm border border-rule bg-white px-3 py-2 outline-none focus:border-board"
              >
                {venues.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-sm text-ink">
              Time slot
              <select
                value={editForm.timeSlot}
                onChange={(e) => setEditForm({ ...editForm, timeSlot: e.target.value })}
                className="rounded-sm border border-rule bg-white px-3 py-2 outline-none focus:border-board"
              >
                {timeSlots.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.day} {t.startTime}–{t.endTime}
                  </option>
                ))}
              </select>
            </label>

            {editError && (
              <p role="alert" className="rounded-sm bg-danger/10 px-3 py-2 text-sm text-danger">
                {editError}
              </p>
            )}

            <button
              type="submit"
              disabled={editSaving}
              className="mt-2 rounded-sm bg-board px-4 py-2.5 text-sm font-medium text-chalk transition hover:bg-board-dark disabled:opacity-60"
            >
              {editSaving ? "Saving…" : "Save reassignment"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}