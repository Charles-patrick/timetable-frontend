"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Modal from "@/components/admin/Modal";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadDepartments() {
    setLoading(true);
    setError("");
    try {
      const { departments } = await api.get("/departments");
      setDepartments(departments);
    } catch (err) {
      setError(err.message || "Failed to load departments");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDepartments();
  }, []);

  function openCreateModal() {
    setEditing(null);
    setName("");
    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(department) {
    setEditing(department);
    setName(department.name);
    setFormError("");
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      if (editing) {
        await api.put(`/departments/${editing._id}`, { name });
      } else {
        await api.post("/departments", { name });
      }
      setModalOpen(false);
      await loadDepartments();
    } catch (err) {
      setFormError(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(department) {
    if (
      !confirm(
        `Delete ${department.name}? Courses offered by this department will keep their other departments, if any.`,
      )
    )
      return;
    try {
      await api.delete(`/departments/${department._id}`);
      await loadDepartments();
    } catch (err) {
      alert(err.message || "Failed to delete department");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">
            Departments
          </h1>
          <p className="mt-1 text-sm text-slate">
            A course can be offered by more than one department — set that up
            here first.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="rounded-sm bg-board px-5 py-2.5 text-sm font-medium text-chalk transition hover:bg-board-dark"
        >
          + Add Department
        </button>
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
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={2} className="px-5 py-8 text-center text-slate">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && departments.length === 0 && (
              <tr>
                <td colSpan={2} className="px-5 py-8 text-center text-slate">
                  No departments yet. Add one to get started.
                </td>
              </tr>
            )}
            {departments.map((department) => (
              <tr key={department._id} className="border-t border-rule">
                <td className="px-5 py-3 text-ink">{department.name}</td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => openEditModal(department)}
                    className="mr-3 text-sm text-board hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(department)}
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
          title={editing ? "Edit Department" : "Add Department"}
          onClose={() => setModalOpen(false)}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm text-ink">
              Department name
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Computer Science"
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
              {saving ? "Saving…" : editing ? "Save changes" : "Add department"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
