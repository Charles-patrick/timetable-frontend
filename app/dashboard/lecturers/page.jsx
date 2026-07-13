"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Modal from "@/components/admin/Modal";

const EMPTY_FORM = { name: "", email: "", department: "", password: "" };

export default function LecturersPage() {
  const [lecturers, setLecturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = creating, otherwise the lecturer being edited
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadLecturers(searchTerm = "") {
    setLoading(true);
    setError("");
    try {
      const { lecturers } = await api.get(
        `/lecturers${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ""}`,
      );
      setLecturers(lecturers);
    } catch (err) {
      setError(err.message || "Failed to load lecturers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLecturers();
  }, []);

  // Debounced search-as-you-type
  useEffect(() => {
    const timer = setTimeout(() => loadLecturers(search), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function openCreateModal() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(lecturer) {
    setEditing(lecturer);
    setForm({
      name: lecturer.name,
      email: lecturer.email,
      department: lecturer.department,
      password: "",
    });
    setFormError("");
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setFormError("");

    try {
      if (editing) {
        const payload = {
          name: form.name,
          email: form.email,
          department: form.department,
        };
        if (form.password) payload.password = form.password;
        await api.put(`/lecturers/${editing._id}`, payload);
      } else {
        await api.post("/lecturers", form);
      }
      setModalOpen(false);
      await loadLecturers(search);
    } catch (err) {
      setFormError(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(lecturer) {
    if (
      !confirm(
        `Delete ${lecturer.name}? This also removes their login account.`,
      )
    )
      return;
    try {
      await api.delete(`/lecturers/${lecturer._id}`);
      await loadLecturers(search);
    } catch (err) {
      alert(err.message || "Failed to delete lecturer");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">
            Lecturers
          </h1>
          <p className="mt-1 text-sm text-slate">
            Manage lecturer profiles and login accounts.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="rounded-sm bg-board px-5 py-2.5 text-sm font-medium text-chalk transition hover:bg-board-dark"
        >
          + Add Lecturer
        </button>
      </div>

      <input
        type="text"
        placeholder="Search by name, email, or department…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mt-6 w-full max-w-sm rounded-sm border border-rule bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-board"
      />

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
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Department</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-slate">
                  Loading…
                </td>
              </tr>
            )}

            {!loading && lecturers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-slate">
                  No lecturers yet. Add one to get started.
                </td>
              </tr>
            )}

            {lecturers.map((lecturer) => (
              <tr key={lecturer._id} className="border-t border-rule">
                <td className="px-5 py-3 text-ink">{lecturer.name}</td>
                <td className="px-5 py-3 text-slate">{lecturer.email}</td>
                <td className="px-5 py-3 text-slate">{lecturer.department}</td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => openEditModal(lecturer)}
                    className="mr-3 text-sm text-board hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(lecturer)}
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
          title={editing ? "Edit Lecturer" : "Add Lecturer"}
          onClose={() => setModalOpen(false)}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm text-ink">
              Full name
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="rounded-sm border border-rule px-3 py-2 outline-none focus:border-board"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm text-ink">
              Email
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="rounded-sm border border-rule px-3 py-2 outline-none focus:border-board"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm text-ink">
              Department
              <input
                required
                value={form.department}
                onChange={(e) =>
                  setForm({ ...form, department: e.target.value })
                }
                className="rounded-sm border border-rule px-3 py-2 outline-none focus:border-board"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm text-ink">
              {editing
                ? "New password (leave blank to keep current)"
                : "Password"}
              <input
                type="password"
                required={!editing}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="rounded-sm border border-rule px-3 py-2 outline-none focus:border-board"
              />
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
              {saving ? "Saving…" : editing ? "Save changes" : "Add lecturer"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
