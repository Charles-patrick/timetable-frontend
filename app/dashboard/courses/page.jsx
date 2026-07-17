"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Modal from "@/components/admin/Modal";

const LEVELS = [100, 200, 300, 400, 500];

const EMPTY_FORM = {
  courseCode: "",
  courseTitle: "",
  courseUnit: "",
  level: 100,
  semester: "",
  departments: [],
  lecturers: [],
  isLab: false,
  expectedClassSize: "",
};

function CheckboxList({ options, selected, onToggle, emptyLabel }) {
  if (options.length === 0) {
    return <p className="text-sm text-slate">{emptyLabel}</p>;
  }
  return (
    <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-sm border border-rule p-2">
      {options.map((opt) => (
        <label
          key={opt._id}
          className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-chalk"
        >
          <input
            type="checkbox"
            checked={selected.includes(opt._id)}
            onChange={() => onToggle(opt._id)}
            className="h-4 w-4 rounded-sm border-rule accent-board"
          />
          {opt.name}
        </label>
      ))}
    </div>
  );
}

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadCourses(searchTerm = "", level = "", department = "") {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set("search", searchTerm);
      if (level) params.set("level", level);
      if (department) params.set("department", department);
      const { courses } = await api.get(
        `/courses${params.toString() ? `?${params}` : ""}`,
      );
      setCourses(courses);
    } catch (err) {
      setError(err.message || "Failed to load courses");
    } finally {
      setLoading(false);
    }
  }

  async function loadDropdownData() {
    try {
      const [{ lecturers }, { semesters }, { departments }] = await Promise.all(
        [api.get("/lecturers"), api.get("/semesters"), api.get("/departments")],
      );
      setLecturers(lecturers);
      setSemesters(semesters);
      setDepartments(departments);
    } catch (err) {
      setError(err.message || "Failed to load lecturers/semesters/departments");
    }
  }

  useEffect(() => {
    loadCourses();
    loadDropdownData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(
      () => loadCourses(search, levelFilter, departmentFilter),
      400,
    );
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, levelFilter, departmentFilter]);

  function openCreateModal() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, semester: semesters[0]?._id || "" });
    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(course) {
    setEditing(course);
    setForm({
      courseCode: course.courseCode,
      courseTitle: course.courseTitle,
      courseUnit: course.courseUnit,
      level: course.level,
      semester: course.semester?._id || "",
      departments: course.departments?.map((d) => d._id) || [],
      lecturers: course.lecturers?.map((l) => l._id) || [],
      isLab: course.isLab || false,
      expectedClassSize: course.expectedClassSize || "",
    });
    setFormError("");
    setModalOpen(true);
  }

  function toggleDepartment(id) {
    setForm((f) => ({
      ...f,
      departments: f.departments.includes(id)
        ? f.departments.filter((d) => d !== id)
        : [...f.departments, id],
    }));
  }

  function toggleLecturer(id) {
    setForm((f) => ({
      ...f,
      lecturers: f.lecturers.includes(id)
        ? f.lecturers.filter((l) => l !== id)
        : [...f.lecturers, id],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.departments.length === 0) {
      setFormError("Select at least one department");
      return;
    }
    if (form.lecturers.length === 0) {
      setFormError("Select at least one lecturer");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const payload = {
        ...form,
        courseUnit: Number(form.courseUnit),
        level: Number(form.level),
        expectedClassSize: form.expectedClassSize
          ? Number(form.expectedClassSize)
          : null,
      };

      if (editing) {
        await api.put(`/courses/${editing._id}`, payload);
      } else {
        await api.post("/courses", payload);
      }
      setModalOpen(false);
      await loadCourses(search, levelFilter, departmentFilter);
    } catch (err) {
      setFormError(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(course) {
    if (!confirm(`Delete ${course.courseCode}?`)) return;
    try {
      await api.delete(`/courses/${course._id}`);
      await loadCourses(search, levelFilter, departmentFilter);
    } catch (err) {
      alert(err.message || "Failed to delete course");
    }
  }

  const noDropdownData =
    lecturers.length === 0 ||
    semesters.length === 0 ||
    departments.length === 0;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">
            Courses
          </h1>
          <p className="mt-1 text-sm text-slate">
            Every course the generator will try to schedule.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          disabled={noDropdownData}
          className="rounded-sm bg-board px-5 py-2.5 text-sm font-medium text-chalk transition hover:bg-board-dark disabled:opacity-50"
        >
          + Add Course
        </button>
      </div>

      {noDropdownData && (
        <p className="mt-2 text-sm text-slate">
          Add at least one department, lecturer, and semester before creating
          courses.
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by course code or title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm rounded-sm border border-rule bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-board"
        />
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
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="rounded-sm border border-rule bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-board"
        >
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d._id} value={d._id}>
              {d.name}
            </option>
          ))}
        </select>
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
              <th className="px-5 py-3">Code</th>
              <th className="px-5 py-3">Title</th>
              <th className="px-5 py-3">Level</th>
              <th className="px-5 py-3">Departments</th>
              <th className="px-5 py-3">Lecturers</th>
              <th className="px-5 py-3">Semester</th>
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
            {!loading && courses.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-slate">
                  No courses yet. Add one to get started.
                </td>
              </tr>
            )}
            {courses.map((course) => (
              <tr key={course._id} className="border-t border-rule">
                <td className="px-5 py-3 font-medium text-ink">
                  {course.courseCode}
                  {course.isLab && (
                    <span className="ml-2 rounded-sm bg-amber/20 px-1.5 py-0.5 text-[10px] font-medium uppercase text-amber-dark">
                      Lab
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-slate">{course.courseTitle}</td>
                <td className="px-5 py-3 text-slate">{course.level}</td>
                <td className="px-5 py-3 text-slate">
                  {course.departments?.map((d) => d.name).join(", ")}
                </td>
                <td className="px-5 py-3 text-slate">
                  {course.lecturers?.map((l) => l.name).join(", ")}
                </td>
                <td className="px-5 py-3 capitalize text-slate">
                  {course.semester?.name}
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => openEditModal(course)}
                    className="mr-3 text-sm text-board hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(course)}
                    className="text-sm text-danger hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <Modal
          title={editing ? "Edit Course" : "Add Course"}
          onClose={() => setModalOpen(false)}
        >
          <form
            onSubmit={handleSubmit}
            className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1"
          >
            <div className="flex gap-4">
              <label className="flex flex-1 flex-col gap-1.5 text-sm text-ink">
                Course code
                <input
                  required
                  value={form.courseCode}
                  onChange={(e) =>
                    setForm({ ...form, courseCode: e.target.value })
                  }
                  placeholder="CSC301"
                  className="rounded-sm border border-rule px-3 py-2 outline-none focus:border-board"
                />
              </label>
              <label className="flex w-28 flex-col gap-1.5 text-sm text-ink">
                Unit
                <input
                  type="number"
                  min="1"
                  required
                  value={form.courseUnit}
                  onChange={(e) =>
                    setForm({ ...form, courseUnit: e.target.value })
                  }
                  className="rounded-sm border border-rule px-3 py-2 outline-none focus:border-board"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1.5 text-sm text-ink">
              Course title
              <input
                required
                value={form.courseTitle}
                onChange={(e) =>
                  setForm({ ...form, courseTitle: e.target.value })
                }
                className="rounded-sm border border-rule px-3 py-2 outline-none focus:border-board"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm text-ink">
              Level
              <select
                value={form.level}
                onChange={(e) => setForm({ ...form, level: e.target.value })}
                className="rounded-sm border border-rule bg-white px-3 py-2 outline-none focus:border-board"
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-sm text-ink">
              Semester
              <select
                required
                value={form.semester}
                onChange={(e) => setForm({ ...form, semester: e.target.value })}
                className="rounded-sm border border-rule bg-white px-3 py-2 outline-none focus:border-board"
              >
                {semesters.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.session?.name} — {s.name} semester
                  </option>
                ))}
              </select>
            </label>

            <div className="flex flex-col gap-1.5 text-sm text-ink">
              Departments offering this course
              <CheckboxList
                options={departments}
                selected={form.departments}
                onToggle={toggleDepartment}
                emptyLabel="Add a department first, under Departments."
              />
            </div>

            <div className="flex flex-col gap-1.5 text-sm text-ink">
              Lecturers who can teach this course
              <CheckboxList
                options={lecturers}
                selected={form.lecturers}
                onToggle={toggleLecturer}
                emptyLabel="Add a lecturer first, under Lecturers."
              />
            </div>

            <label className="flex flex-col gap-1.5 text-sm text-ink">
              Expected class size <span className="text-slate">(optional)</span>
              <input
                type="number"
                min="1"
                value={form.expectedClassSize}
                onChange={(e) =>
                  setForm({ ...form, expectedClassSize: e.target.value })
                }
                placeholder="Used to avoid venues that are too small"
                className="rounded-sm border border-rule px-3 py-2 outline-none focus:border-board"
              />
            </label>

            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={form.isLab}
                onChange={(e) => setForm({ ...form, isLab: e.target.checked })}
                className="h-4 w-4 rounded-sm border-rule accent-board"
              />
              This is a lab course (only laboratory venues will be used)
            </label>

            {formError && (
              <p
                role="alert"
                className="rounded-sm bg-danger/10 px-3 py-2 text-sm text-danger"
              >
                {formError}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="mt-2 rounded-sm bg-board px-4 py-2.5 text-sm font-medium text-chalk transition hover:bg-board-dark disabled:opacity-60"
            >
              {saving ? "Saving…" : editing ? "Save changes" : "Add course"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
