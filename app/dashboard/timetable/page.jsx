"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { api, API_URL } from "@/lib/api";
import { formatTime12 } from "@/lib/format";
import Modal from "@/components/admin/Modal";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const LEVELS = [100, 200, 300, 400, 500];

export default function TimetablePage() {
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState("");
  const [departments, setDepartments] = useState([]);
  const [department, setDepartment] = useState("");
  const [level, setLevel] = useState(100);

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [generating, setGenerating] = useState(false);
  const [generateResult, setGenerateResult] = useState(null);

  const [lecturers, setLecturers] = useState([]);
  const [venues, setVenues] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [courses, setCourses] = useState([]);

  // One shared modal for both "add to empty cell" and "reassign existing entry"
  const [cellModal, setCellModal] = useState(null); // { mode: "add"|"edit", day, slot, entry? }
  const [form, setForm] = useState({ course: "", lecturer: "", venue: "", timeSlot: "" });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // ── Load semesters + shared dropdown data once ───────────────
  useEffect(() => {
    async function init() {
      try {
        const [{ semesters }, { lecturers }, { venues }, { timeSlots }, { departments }] =
          await Promise.all([
            api.get("/semesters"),
            api.get("/lecturers"),
            api.get("/venues"),
            api.get("/timeslots"),
            api.get("/departments"),
          ]);
        setSemesters(semesters);
        setLecturers(lecturers);
        setVenues(venues);
        setTimeSlots(timeSlots);
        setDepartments(departments);

        const active = semesters.find((s) => s.active);
        setSelectedSemester(active?._id || semesters[0]?._id || "");
        setDepartment(departments[0]?._id || "");
      } catch (err) {
        setError(err.message || "Failed to load setup data");
      }
    }
    init();
  }, []);

async function loadEntries(silent = false) {
  if (!selectedSemester || !department) {
    setEntries([]);
    return;
  }
  if (!silent) setLoading(true);
  if (!silent) setError("");
  try {
    const params = new URLSearchParams({
      semester: selectedSemester,
      level,
      department,
    });
    const { entries } = await api.get(`/timetable?${params}`);
    setEntries(entries);
  } catch (err) {
    if (!silent) setError(err.message || "Failed to load timetable");
  } finally {
    if (!silent) setLoading(false);
  }
}

  async function loadCourses() {
    if (!selectedSemester || !department) return;
    try {
      const params = new URLSearchParams({ semester: selectedSemester, level, department });
      const { courses } = await api.get(`/courses?${params}`);
      setCourses(courses);
    } catch (err) {
      // non-fatal — the "add" modal just won't have options
    }
  }

useEffect(() => {
  loadEntries();
  loadCourses();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [selectedSemester, level, department]);

// ── Real-time-ish updates: quietly re-check the server every 20s so an
// admin viewing the same slice someone else just edited sees the change
// without refreshing. Paused while a cell's modal is open so it can never
// pull the grid out from under a form you're mid-way through filling in.
const cellModalRef = useRef(null);
useEffect(() => {
  cellModalRef.current = cellModal;
}, [cellModal]);

useEffect(() => {
  if (!selectedSemester || !department) return;
  const interval = setInterval(() => {
    if (!cellModalRef.current) {
      loadEntries(true);
    }
  }, 20000);
  return () => clearInterval(interval);
}, [selectedSemester, level, department]);

  // ── Build the grid: rows = distinct time ranges, columns = days ──
  const timeRanges = useMemo(() => {
    const set = new Set(timeSlots.map((t) => `${t.startTime}|${t.endTime}`));
    return Array.from(set).sort();
  }, [timeSlots]);

  // slotLookup["Monday|08:00|10:00"] = TimeSlot doc (if that slot exists)
  const slotLookup = useMemo(() => {
    const map = {};
    timeSlots.forEach((t) => {
      map[`${t.day}|${t.startTime}|${t.endTime}`] = t;
    });
    return map;
  }, [timeSlots]);

  // entryLookup[timeSlotId] = timetable entry (if that slot is filled)
  const entryLookup = useMemo(() => {
    const map = {};
    entries.forEach((e) => {
      map[e.timeSlot._id] = e;
    });
    return map;
  }, [entries]);

  async function handleGenerate() {
    if (!selectedSemester) return;
    if (
      !confirm(
        "Generate a fresh timetable for this semester? This schedules every course across every level and department. Previous entries stay saved as history."
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

  // Lecturer options for the modal are scoped to whichever course is
  // selected — a course may only be teachable by 2 of your 10 lecturers.
  function lecturerOptionsFor(course) {
    if (course?.lecturers?.length) return course.lecturers;
    return lecturers; // fallback, shouldn't normally happen
  }

  function openCell(day, range) {
    const [startTime, endTime] = range.split("|");
    const slot = slotLookup[`${day}|${startTime}|${endTime}`];
    if (!slot) return; // no such time slot exists for this day — nothing to do

    const entry = entryLookup[slot._id];
    setFormError("");

    if (entry) {
      setCellModal({ mode: "edit", day, slot, entry });
      setForm({
        course: entry.course._id,
        lecturer: entry.lecturer._id,
        venue: entry.venue._id,
        timeSlot: slot._id,
      });
    } else {
      setCellModal({ mode: "add", day, slot });
      setForm({
        course: "",
        lecturer: "",
        venue: venues[0]?._id || "",
        timeSlot: slot._id,
      });
    }
  }

  function handleCourseChange(courseId) {
    const course = courses.find((c) => c._id === courseId);
    setForm((f) => ({
      ...f,
      course: courseId,
      lecturer: course?.lecturers?.[0]?._id || "",
    }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      if (cellModal.mode === "add") {
        await api.post("/timetable", {
          course: form.course,
          lecturer: form.lecturer,
          venue: form.venue,
          timeSlot: form.timeSlot,
          semester: selectedSemester,
        });
      } else {
        await api.put(`/timetable/${cellModal.entry._id}`, {
          lecturer: form.lecturer,
          venue: form.venue,
          timeSlot: form.timeSlot,
        });
      }
      setCellModal(null);
      await loadEntries();
    } catch (err) {
      setFormError(err.message || "That slot conflicts with another entry");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    if (!confirm(`Remove ${cellModal.entry.course.courseCode} from this slot?`)) return;
    try {
      await api.delete(`/timetable/${cellModal.entry._id}`);
      setCellModal(null);
      await loadEntries();
    } catch (err) {
      alert(err.message || "Failed to remove entry");
    }
  }

  function exportUrl(format) {
    const params = new URLSearchParams({ semester: selectedSemester, level, department });
    return `${API_URL}/timetable/export${format === "excel" ? "/excel" : ""}?${params}`;
  }

  const activeCourse =
    cellModal?.mode === "add" ? courses.find((c) => c._id === form.course) : cellModal?.entry?.course;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Timetable</h1>
          <p className="mt-1 text-sm text-slate">
            One department and level at a time — click any empty cell to assign a course yourself.
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating || !selectedSemester}
          className="rounded-sm bg-amber px-5 py-2.5 text-sm font-medium text-board-dark transition hover:bg-amber-dark disabled:opacity-50"
        >
          {generating ? "Generating…" : "⚡ Generate for all levels"}
        </button>
      </div>

      {generateResult && (
        <div className="mt-4 rounded-sm border border-rule bg-white p-4 text-sm">
          <p className="text-ink">
            Scheduled <strong>{generateResult.scheduledCount}</strong> of{" "}
            <strong>{generateResult.totalCourses}</strong> courses across the semester.
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
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="rounded-sm border border-rule bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-board"
        >
          {departments.length === 0 && <option value="">No departments yet</option>}
          {departments.map((d) => (
            <option key={d._id} value={d._id}>
              {d.name}
            </option>
          ))}
        </select>

        <select
          value={level}
          onChange={(e) => setLevel(Number(e.target.value))}
          className="rounded-sm border border-rule bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-board"
        >
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {l} Level
            </option>
          ))}
        </select>

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

      {timeSlots.length === 0 ? (
        <p className="mt-8 text-sm text-slate">
          No time slots have been set up yet — add some under Time Slots first.
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
                  <td colSpan={DAYS.length + 1} className="px-5 py-8 text-center text-slate">
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
                        const slot = slotLookup[`${day}|${startTime}|${endTime}`];
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
                            onClick={() => openCell(day, range)}
                            className={`cursor-pointer border border-rule px-4 py-3 align-top transition hover:bg-amber/10 ${
                              entry ? "bg-white" : "bg-chalk"
                            }`}
                          >
                            {entry ? (
                              <div>
                                <div className="font-medium text-ink">{entry.course.courseCode}</div>
                                <div className="text-xs text-slate">{entry.lecturer.name}</div>
                                <div className="text-xs text-slate">{entry.venue.name}</div>
                              </div>
                            ) : (
                              <div className="text-center text-slate">+</div>
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

      {cellModal && (
        <Modal
          title={
            cellModal.mode === "add"
              ? `Assign a course — ${cellModal.day}`
              : `${cellModal.entry.course.courseCode} — ${cellModal.day}`
          }
          onClose={() => setCellModal(null)}
        >
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            {cellModal.mode === "add" ? (
              <label className="flex flex-col gap-1.5 text-sm text-ink">
                Course
                <select
                  required
                  value={form.course}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  className="rounded-sm border border-rule bg-white px-3 py-2 outline-none focus:border-board"
                >
                  <option value="">Select a course…</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.courseCode} — {c.courseTitle}
                    </option>
                  ))}
                </select>
                {courses.length === 0 && (
                  <span className="text-xs text-slate">
                    No courses found for this department/level/semester combination.
                  </span>
                )}
              </label>
            ) : (
              <p className="text-sm text-slate">{cellModal.entry.course.courseTitle}</p>
            )}

            <label className="flex flex-col gap-1.5 text-sm text-ink">
              Lecturer
              <select
                required
                value={form.lecturer}
                onChange={(e) => setForm({ ...form, lecturer: e.target.value })}
                className="rounded-sm border border-rule bg-white px-3 py-2 outline-none focus:border-board"
              >
                <option value="">Select a lecturer…</option>
                {lecturerOptionsFor(activeCourse).map((l) => (
                  <option key={l._id} value={l._id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-sm text-ink">
              Venue
              <select
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
                className="rounded-sm border border-rule bg-white px-3 py-2 outline-none focus:border-board"
              >
                {venues.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </label>

            {formError && (
              <p role="alert" className="rounded-sm bg-danger/10 px-3 py-2 text-sm text-danger">
                {formError}
              </p>
            )}

            <div className="mt-2 flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-sm bg-board px-4 py-2.5 text-sm font-medium text-chalk transition hover:bg-board-dark disabled:opacity-60"
              >
                {saving ? "Saving…" : cellModal.mode === "add" ? "Assign course" : "Save changes"}
              </button>
              {cellModal.mode === "edit" && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="rounded-sm border border-danger/30 px-4 py-2.5 text-sm text-danger transition hover:bg-danger/10"
                >
                  Remove
                </button>
              )}
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}