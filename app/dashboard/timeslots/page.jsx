"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Modal from "@/components/admin/Modal";
import { formatTime12 } from "@/lib/format";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const EMPTY_FORM = { day: "Monday", startTime: "08:00", endTime: "10:00" };

export default function TimeSlotsPage() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dayFilter, setDayFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadSlots(day = "") {
    setLoading(true);
    setError("");
    try {
      const { timeSlots } = await api.get(
        `/timeslots${day ? `?day=${day}` : ""}`,
      );
      setSlots(timeSlots);
    } catch (err) {
      setError(err.message || "Failed to load time slots");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSlots(dayFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayFilter]);

  function openCreateModal() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(slot) {
    setEditing(slot);
    setForm({
      day: slot.day,
      startTime: slot.startTime,
      endTime: slot.endTime,
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
        await api.put(`/timeslots/${editing._id}`, form);
      } else {
        await api.post("/timeslots", form);
      }
      setModalOpen(false);
      await loadSlots(dayFilter);
    } catch (err) {
      setFormError(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(slot) {
    if (
      !confirm(
        `Delete ${slot.day} ${formatTime12(slot.startTime)}–${formatTime12(slot.endTime)}?`,
      )
    )
      return;
    try {
      await api.delete(`/timeslots/${slot._id}`);
      await loadSlots(dayFilter);
    } catch (err) {
      alert(err.message || "Failed to delete time slot");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">
            Time Slots
          </h1>
          <p className="mt-1 text-sm text-slate">
            The periods courses can be scheduled into.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="rounded-sm bg-board px-5 py-2.5 text-sm font-medium text-chalk transition hover:bg-board-dark"
        >
          + Add Time Slot
        </button>
      </div>

      <select
        value={dayFilter}
        onChange={(e) => setDayFilter(e.target.value)}
        className="mt-6 w-full max-w-xs rounded-sm border border-rule bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-board"
      >
        <option value="">All days</option>
        {DAYS.map((d) => (
          <option key={d} value={d}>
            {d}
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

      <div className="mt-6 overflow-x-auto rounded-sm border border-rule bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-chalk text-xs uppercase tracking-wide text-slate">
            <tr>
              <th className="px-5 py-3">Day</th>
              <th className="px-5 py-3">Start</th>
              <th className="px-5 py-3">End</th>
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

            {!loading && slots.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-slate">
                  No time slots yet. Add one to get started.
                </td>
              </tr>
            )}

            {slots.map((slot) => (
              <tr key={slot._id} className="border-t border-rule">
                <td className="px-5 py-3 text-ink">{slot.day}</td>
                <td className="px-5 py-3 text-slate">
                  {formatTime12(slot.startTime)}
                </td>
                <td className="px-5 py-3 text-slate">
                  {formatTime12(slot.endTime)}
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => openEditModal(slot)}
                    className="mr-3 text-sm text-board hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(slot)}
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
          title={editing ? "Edit Time Slot" : "Add Time Slot"}
          onClose={() => setModalOpen(false)}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm text-ink">
              Day
              <select
                value={form.day}
                onChange={(e) => setForm({ ...form, day: e.target.value })}
                className="rounded-sm border border-rule bg-white px-3 py-2 outline-none focus:border-board"
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex gap-4">
              <label className="flex flex-1 flex-col gap-1.5 text-sm text-ink">
                Start time
                <input
                  type="time"
                  required
                  value={form.startTime}
                  onChange={(e) =>
                    setForm({ ...form, startTime: e.target.value })
                  }
                  className="rounded-sm border border-rule px-3 py-2 outline-none focus:border-board"
                />
              </label>

              <label className="flex flex-1 flex-col gap-1.5 text-sm text-ink">
                End time
                <input
                  type="time"
                  required
                  value={form.endTime}
                  onChange={(e) =>
                    setForm({ ...form, endTime: e.target.value })
                  }
                  className="rounded-sm border border-rule px-3 py-2 outline-none focus:border-board"
                />
              </label>
            </div>

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
              {saving ? "Saving…" : editing ? "Save changes" : "Add time slot"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
