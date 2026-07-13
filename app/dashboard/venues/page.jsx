"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Modal from "@/components/admin/Modal";

const EMPTY_FORM = { name: "", capacity: "", type: "lecture_hall" };

const TYPE_LABELS = {
  lecture_hall: "Lecture Hall",
  laboratory: "Laboratory",
};

export default function VenuesPage() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadVenues(searchTerm = "") {
    setLoading(true);
    setError("");
    try {
      const { venues } = await api.get(
        `/venues${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ""}`,
      );
      setVenues(venues);
    } catch (err) {
      setError(err.message || "Failed to load venues");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVenues();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadVenues(search), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function openCreateModal() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(venue) {
    setEditing(venue);
    setForm({ name: venue.name, capacity: venue.capacity, type: venue.type });
    setFormError("");
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setFormError("");

    try {
      const payload = { ...form, capacity: Number(form.capacity) };
      if (editing) {
        await api.put(`/venues/${editing._id}`, payload);
      } else {
        await api.post("/venues", payload);
      }
      setModalOpen(false);
      await loadVenues(search);
    } catch (err) {
      setFormError(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(venue) {
    if (!confirm(`Delete ${venue.name}?`)) return;
    try {
      await api.delete(`/venues/${venue._id}`);
      await loadVenues(search);
    } catch (err) {
      alert(err.message || "Failed to delete venue");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">
            Venues
          </h1>
          <p className="mt-1 text-sm text-slate">
            Lecture halls and laboratories available for scheduling.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="rounded-sm bg-board px-5 py-2.5 text-sm font-medium text-chalk transition hover:bg-board-dark"
        >
          + Add Venue
        </button>
      </div>

      <input
        type="text"
        placeholder="Search by venue name…"
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
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Capacity</th>
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

            {!loading && venues.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-slate">
                  No venues yet. Add one to get started.
                </td>
              </tr>
            )}

            {venues.map((venue) => (
              <tr key={venue._id} className="border-t border-rule">
                <td className="px-5 py-3 text-ink">{venue.name}</td>
                <td className="px-5 py-3 text-slate">
                  {TYPE_LABELS[venue.type] || venue.type}
                </td>
                <td className="px-5 py-3 text-slate">{venue.capacity}</td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => openEditModal(venue)}
                    className="mr-3 text-sm text-board hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(venue)}
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
          title={editing ? "Edit Venue" : "Add Venue"}
          onClose={() => setModalOpen(false)}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm text-ink">
              Venue name
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. LT1, Chemistry Lab 2"
                className="rounded-sm border border-rule px-3 py-2 outline-none focus:border-board"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm text-ink">
              Type
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="rounded-sm border border-rule bg-white px-3 py-2 outline-none focus:border-board"
              >
                <option value="lecture_hall">Lecture Hall</option>
                <option value="laboratory">Laboratory</option>
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-sm text-ink">
              Capacity
              <input
                type="number"
                min="1"
                required
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
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
              {saving ? "Saving…" : editing ? "Save changes" : "Add venue"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
