"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Modal from "@/components/admin/Modal";

const STATUS_STYLES = {
  active: "bg-success/10 text-success",
  inactive: "bg-slate/10 text-slate",
  archived: "bg-rule text-slate",
};

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [sessionSaving, setSessionSaving] = useState(false);
  const [sessionError, setSessionError] = useState("");

  const [semesterModalOpen, setSemesterModalOpen] = useState(false);
  const [semesterForm, setSemesterForm] = useState({
    name: "first",
    session: "",
  });
  const [semesterSaving, setSemesterSaving] = useState(false);
  const [semesterError, setSemesterError] = useState("");

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [{ sessions }, { semesters }] = await Promise.all([
        api.get("/sessions"),
        api.get("/semesters"),
      ]);
      setSessions(sessions);
      setSemesters(semesters);
    } catch (err) {
      setError(err.message || "Failed to load sessions/semesters");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  // ── Sessions ────────────────────────────────────────────────
  function openSessionModal() {
    setSessionName("");
    setSessionError("");
    setSessionModalOpen(true);
  }

  async function handleCreateSession(e) {
    e.preventDefault();
    setSessionSaving(true);
    setSessionError("");
    try {
      await api.post("/sessions", { name: sessionName });
      setSessionModalOpen(false);
      await loadAll();
    } catch (err) {
      setSessionError(err.message || "Something went wrong");
    } finally {
      setSessionSaving(false);
    }
  }

  async function handleActivateSession(session) {
    try {
      await api.put(`/sessions/${session._id}/activate`, {});
      await loadAll();
    } catch (err) {
      alert(err.message || "Failed to activate session");
    }
  }

  async function handleArchiveSession(session) {
    if (
      !confirm(
        `Archive ${session.name}? It will no longer be usable for new timetables.`,
      )
    )
      return;
    try {
      await api.put(`/sessions/${session._id}/archive`, {});
      await loadAll();
    } catch (err) {
      alert(err.message || "Failed to archive session");
    }
  }

  async function handleDeleteSession(session) {
    if (!confirm(`Delete ${session.name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/sessions/${session._id}`);
      await loadAll();
    } catch (err) {
      alert(err.message || "Failed to delete session");
    }
  }

  // ── Semesters ───────────────────────────────────────────────
  function openSemesterModal() {
    setSemesterForm({ name: "first", session: sessions[0]?._id || "" });
    setSemesterError("");
    setSemesterModalOpen(true);
  }

  async function handleCreateSemester(e) {
    e.preventDefault();
    setSemesterSaving(true);
    setSemesterError("");
    try {
      await api.post("/semesters", semesterForm);
      setSemesterModalOpen(false);
      await loadAll();
    } catch (err) {
      setSemesterError(err.message || "Something went wrong");
    } finally {
      setSemesterSaving(false);
    }
  }

  async function handleActivateSemester(semester) {
    try {
      await api.put(`/semesters/${semester._id}/activate`, {});
      await loadAll();
    } catch (err) {
      alert(err.message || "Failed to activate semester");
    }
  }

  async function handleDeleteSemester(semester) {
    if (!confirm(`Delete this semester?`)) return;
    try {
      await api.delete(`/semesters/${semester._id}`);
      await loadAll();
    } catch (err) {
      alert(err.message || "Failed to delete semester");
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">
        Sessions & Semesters
      </h1>
      <p className="mt-1 text-sm text-slate">
        Only one session and one semester are active system-wide at a time —
        that's what courses and the generator use as "now."
      </p>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-sm bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {error}
        </p>
      )}

      {/* ── Sessions ── */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-ink">
            Sessions
          </h2>
          <button
            onClick={openSessionModal}
            className="rounded-sm bg-board px-4 py-2 text-sm font-medium text-chalk transition hover:bg-board-dark"
          >
            + Add Session
          </button>
        </div>

        <div className="mt-4 overflow-x-auto rounded-sm border border-rule bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-chalk text-xs uppercase tracking-wide text-slate">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-slate">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && sessions.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-slate">
                    No sessions yet. Add one, e.g. 2025/2026.
                  </td>
                </tr>
              )}
              {sessions.map((session) => (
                <tr key={session._id} className="border-t border-rule">
                  <td className="px-5 py-3 text-ink">{session.name}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-sm px-2 py-1 text-xs font-medium capitalize ${STATUS_STYLES[session.status]}`}
                    >
                      {session.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {session.status !== "active" &&
                      session.status !== "archived" && (
                        <button
                          onClick={() => handleActivateSession(session)}
                          className="mr-3 text-sm text-board hover:underline"
                        >
                          Activate
                        </button>
                      )}
                    {session.status === "active" && (
                      <button
                        onClick={() => handleArchiveSession(session)}
                        className="mr-3 text-sm text-slate hover:underline"
                      >
                        Archive
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteSession(session)}
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
      </section>

      {/* ── Semesters ── */}
      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-ink">
            Semesters
          </h2>
          <button
            onClick={openSemesterModal}
            disabled={sessions.length === 0}
            className="rounded-sm bg-board px-4 py-2 text-sm font-medium text-chalk transition hover:bg-board-dark disabled:opacity-50"
          >
            + Add Semester
          </button>
        </div>
        {sessions.length === 0 && (
          <p className="mt-2 text-sm text-slate">
            Add a session first before creating semesters.
          </p>
        )}

        <div className="mt-4 overflow-x-auto rounded-sm border border-rule bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-chalk text-xs uppercase tracking-wide text-slate">
              <tr>
                <th className="px-5 py-3">Semester</th>
                <th className="px-5 py-3">Session</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && semesters.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-slate">
                    No semesters yet.
                  </td>
                </tr>
              )}
              {semesters.map((semester) => (
                <tr key={semester._id} className="border-t border-rule">
                  <td className="px-5 py-3 capitalize text-ink">
                    {semester.name} semester
                  </td>
                  <td className="px-5 py-3 text-slate">
                    {semester.session?.name}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-sm px-2 py-1 text-xs font-medium ${
                        semester.active
                          ? STATUS_STYLES.active
                          : STATUS_STYLES.inactive
                      }`}
                    >
                      {semester.active ? "active" : "inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {!semester.active && (
                      <button
                        onClick={() => handleActivateSemester(semester)}
                        className="mr-3 text-sm text-board hover:underline"
                      >
                        Activate
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteSemester(semester)}
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
      </section>

      {sessionModalOpen && (
        <Modal title="Add Session" onClose={() => setSessionModalOpen(false)}>
          <form onSubmit={handleCreateSession} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm text-ink">
              Session name
              <input
                required
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="e.g. 2025/2026"
                className="rounded-sm border border-rule px-3 py-2 outline-none focus:border-board"
              />
            </label>
            {sessionError && (
              <p
                role="alert"
                className="rounded-sm bg-danger/10 px-3 py-2 text-sm text-danger"
              >
                {sessionError}
              </p>
            )}
            <button
              type="submit"
              disabled={sessionSaving}
              className="mt-2 rounded-sm bg-board px-4 py-2.5 text-sm font-medium text-chalk transition hover:bg-board-dark disabled:opacity-60"
            >
              {sessionSaving ? "Saving…" : "Add session"}
            </button>
          </form>
        </Modal>
      )}

      {semesterModalOpen && (
        <Modal title="Add Semester" onClose={() => setSemesterModalOpen(false)}>
          <form onSubmit={handleCreateSemester} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm text-ink">
              Session
              <select
                value={semesterForm.session}
                onChange={(e) =>
                  setSemesterForm({ ...semesterForm, session: e.target.value })
                }
                className="rounded-sm border border-rule bg-white px-3 py-2 outline-none focus:border-board"
              >
                {sessions.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-sm text-ink">
              Semester
              <select
                value={semesterForm.name}
                onChange={(e) =>
                  setSemesterForm({ ...semesterForm, name: e.target.value })
                }
                className="rounded-sm border border-rule bg-white px-3 py-2 outline-none focus:border-board"
              >
                <option value="first">First</option>
                <option value="second">Second</option>
              </select>
            </label>

            {semesterError && (
              <p
                role="alert"
                className="rounded-sm bg-danger/10 px-3 py-2 text-sm text-danger"
              >
                {semesterError}
              </p>
            )}

            <button
              type="submit"
              disabled={semesterSaving}
              className="mt-2 rounded-sm bg-board px-4 py-2.5 text-sm font-medium text-chalk transition hover:bg-board-dark disabled:opacity-60"
            >
              {semesterSaving ? "Saving…" : "Add semester"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
