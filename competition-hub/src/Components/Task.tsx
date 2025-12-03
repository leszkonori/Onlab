"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import "./Task.css"
import type { ApplicationType, EvaluationType, RoundType } from "../types"
import { useKeycloak } from "../KeycloakProvider"
import httpClient from "../HttpClient" // ⬅️ ÚJ IMPORT

// Views
import TaskApplicantView from "./TaskApplicantView"
import TaskCreatorView from "./TaskCreatorView"

// Utils
import { formatDateOnly, getNextUpcomingDeadline, isBeforeToday } from "./TaskUtils"

export default function Task({
  id,
  title,
  descr,
  date,
  rounds,
  applications,
  editable,
  onSave,
  evaluationType,
}: {
  id: number
  title: string
  descr: string
  date: string
  rounds?: RoundType[]
  applications?: ApplicationType[]
  editable: boolean
  onSave?: () => void
  evaluationType: EvaluationType
}) {
  const [editing, setEditing] = useState(false)
  const [titleValue, setTitleValue] = useState(title)
  const [descrValue, setDescrValue] = useState(descr)
  const [dateValue, setDateValue] = useState(date)
  const [roundsValue, setRoundsValue] = useState(rounds || [])
  const [applicationStates, setApplicationStates] = useState(applications || [])
  const { user } = useKeycloak()

  const [eliminatedApplicants, setEliminatedApplicants] = useState<string[]>([])
  const [selectedToEliminate, setSelectedToEliminate] = useState<Set<string>>(new Set())
  const [selectedFiles, setSelectedFiles] = useState<{ [roundId: number]: File | null }>({})
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null)
  const [originalReviewCache, setOriginalReviewCache] = useState<string | undefined | null>(undefined)
  const isAnyReviewEditing = editingReviewId !== null

  const navigate = useNavigate()

  useEffect(() => {
    if (editable) {
      // 1. Kérés: tasks/{id}/touch-view (PUT)
      httpClient.put(`/tasks/${id}/touch-view`).catch(() => { })
    }
    if (!editable && user?.username) {
      // 2. Kérés: applications/tasks/{id}/touch-review-view/{user} (PUT)
      httpClient.put(`/applications/tasks/${id}/touch-review-view/${user?.username}`).catch(() => { })
      // 3. Kérés: applications/tasks/{id}/touch-elimination-view/{user} (PUT)
      httpClient.put(`/applications/tasks/${id}/touch-elimination-view/${user.username}`).catch(() => { })
      // 4. Kérés: applications/tasks/{id}/touch-round-activation-view/{user} (PUT)
      httpClient.put(`/applications/tasks/${id}/touch-round-activation-view/${user.username}`).catch(() => { })
    }
  }, [id, editable, user?.username])

  useEffect(() => {
    if (rounds) {
      setRoundsValue(rounds)
    }
  }, [rounds])

  useEffect(() => {
    async function loadEliminated() {
      try {
        // 5. Kérés: tasks/{id} (GET)
        const res = await httpClient.get(`/tasks/${id}`)
        const taskJson = res.data
        setEliminatedApplicants(taskJson.eliminatedApplicants ?? [])
      } catch (e: any) {
        // Axios dob hibát, ha a válasz nem 2xx. Ha a 404-et is elkapjuk, az is OK.
        if (e.response?.status !== 404) {
            console.error("Failed to load eliminated applicants", e)
        }
      }
    }
    loadEliminated()
  }, [id])

  const activeRound = (roundsValue || []).find((r) => (r as any).isActive) || null
  const activeRoundApplications = activeRound
    ? (applicationStates || []).filter((app) => app.round?.id === activeRound.id)
    : []
  const activeRoundUsernames = Array.from(new Set(activeRoundApplications.map((a) => a.keycloakUserName))).sort()

  const currentUserEliminated = user?.username ? eliminatedApplicants.includes(user.username) : false

  async function uploadToRound(roundId: number) {
    if (!user) return
    const file = selectedFiles[roundId]
    if (!file) {
      alert("Please select a file first.")
      return
    }
    const formData = new FormData()
    formData.append("file", file)
    formData.append("keycloakUserId", user.id)
    formData.append("keycloakUserName", user.username)

    try {
      // 6. Kérés: applications/{id}/round/{roundId} (POST FormData)
      // Mivel FormData-t küldünk, a Content-Type-ot a böngésző állítja be (multipart/form-data).
      // A tokent az httpClient automatikusan hozzáadja.
      const response = await httpClient.post(
        `/applications/${id}/round/${roundId}`, 
        formData
      )
      
      const result = response.data // Axios esetén a válasz tartalmát a data property tartalmazza
      alert(result)
      window.location.reload()
    } catch (e) {
      console.error("Upload error:", e)
      alert("Upload failed.")
    }
  }

  const handleRoundChange = (index: number, field: "description" | "deadline", value: string) => {
    const updatedRounds = [...roundsValue]
    updatedRounds[index] = { ...updatedRounds[index], [field]: value }
    setRoundsValue(updatedRounds)
  }

  async function handleSave() {
    try {
      const cleanedRounds = roundsValue.map(({ applications: _apps, ...rest }) => ({
        ...rest,
        deadline: (rest.deadline as string | undefined)?.slice(0, 10) || "",
      }))

      const payload: any = {
        title: titleValue,
        description: descrValue,
        rounds: cleanedRounds,
        ...(cleanedRounds.length === 0 ? { applicationDeadline: (dateValue || "").slice(0, 10) } : {}),
      }

      // 7. Kérés: tasks/{id} (PUT JSON)
      const response = await httpClient.put(`/tasks/${id}`, payload)

      alert("Task updated successfully!")
      setEditing(false)
      onSave?.()
    } catch (error) {
      console.error("Error updating task:", error)
      alert("Failed to update task")
    }
  }

  async function handleSaveReview(appId: number, text: string | null, points: number | null) {
    try {
      // 8. Kérés: applications/{appId}/review (PUT JSON)
      const response = await httpClient.put(`/applications/${appId}/review`, { text, points })

      alert("Review updated successfully!")
      setEditingReviewId(null)
      setOriginalReviewCache(undefined)

      setApplicationStates((prev) =>
        prev.map((app) => (app.id === appId ? { ...app, reviewText: text ?? undefined, reviewPoints: points } : app)),
      )
      onSave?.()
    } catch (error) {
      console.error("Error updating review:", error)
      alert("Failed to update review")
    }
  }

  const handleCancelReviewEdit = (appId: number) => {
    const originalReview = originalReviewCache === null ? undefined : originalReviewCache
    setApplicationStates((prev) => prev.map((app) => (app.id === appId ? { ...app, review: originalReview } : app)))
    setOriginalReviewCache(undefined)
    setEditingReviewId(null)
  }

  const handleReviewTextChange = (id: number, newText: string) => {
    setApplicationStates((prev) => prev.map((app) => (app.id === id ? { ...app, reviewText: newText } : app)))
  }

  const handleReviewPointsChange = (id: number, newPointsStr: string) => {
    const val = newPointsStr === "" ? null : Math.max(0, Math.min(10, Number(newPointsStr)))
    setApplicationStates((prev) => prev.map((app) => (app.id === id ? { ...app, reviewPoints: val } : app)))
  }

  function toggleSelect(username: string) {
    setSelectedToEliminate((prev) => {
      const next = new Set(prev)
      if (next.has(username)) next.delete(username)
      else next.add(username)
      return next
    })
  }

  async function saveElimination() {
    const updated = Array.from(new Set([...eliminatedApplicants, ...Array.from(selectedToEliminate)]))
    try {
      // 9. Kérés: tasks/{id}/eliminate-applicants (PUT JSON)
      const res = await httpClient.put(`/tasks/${id}/eliminate-applicants`, updated)
      
      setEliminatedApplicants(updated)
      setSelectedToEliminate(new Set())
      alert("Eliminálás mentve. A kijelöltek a következő fordulókra már nem pályázhatnak.")
    } catch (e: any) {
      console.error(e)
      const msg = e.response?.data || "Hálózati hiba az eliminálás mentése közben."
      alert("Nem sikerült menteni: " + msg)
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm("Are you sure you want to delete this task?")
    if (!confirmed) return
    try {
      // 10. Kérés: tasks/{id} (DELETE)
      const response = await httpClient.delete(`/tasks/${id}`)
      
      alert("Task deleted successfully!")
      navigate("/")
    } catch (error: any) {
      console.error("Error deleting task:", error)
      alert("Error: Could not delete the task! " + (error.response?.data || error.message))
    }
  }

  async function activateNextRound() {
    // 11. Kérés: tasks/{id}/activate-next (PUT)
    try {
        const res = await httpClient.put(`/tasks/${id}/activate-next`)
        alert("Next round activated.")
        onSave?.()
    } catch (e: any) {
        const txt = e.response?.data || "Ismeretlen hiba."
        alert("Cannot activate next round: " + txt)
    }
  }

  return (
// ... (JSX rész változatlan)
    <div className="task-container">
      <div className="task-header">
        <div className="task-header-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h2 className="task-header-title">Task Details</h2>
      </div>

      <div className="task-info-section">
        <div className="task-info-grid">
          <div className="info-label">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span>Task name:</span>
          </div>
          {editing ? (
            <input
              type="text"
              className="task-input"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
            />
          ) : (
            <p className="info-value">{title}</p>
          )}

          <div className="info-label">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            <span>Description:</span>
          </div>
          {editing ? (
            <textarea className="task-textarea" value={descrValue} onChange={(e) => setDescrValue(e.target.value)} />
          ) : (
            <p className="info-value">{descr}</p>
          )}

          <div className="info-label">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>{roundsValue.length === 0 ? "Deadline:" : "Current round deadline:"}</span>
          </div>
          {editing ? (
            roundsValue.length === 0 ? (
              <input
                type="date"
                className="task-input"
                value={(dateValue || "").slice(0, 10)}
                onChange={(e) => setDateValue(e.target.value)}
              />
            ) : (
              <p className="info-value">
                {getNextUpcomingDeadline(roundsValue) ? formatDateOnly(getNextUpcomingDeadline(roundsValue)!) : "—"}
              </p>
            )
          ) : (
            <p className="info-value">
              {getNextUpcomingDeadline(roundsValue)
                ? formatDateOnly(getNextUpcomingDeadline(roundsValue)!)
                : formatDateOnly(dateValue)}
            </p>
          )}
        </div>
      </div>

      {editable ? (
        <TaskCreatorView
          roundsValue={roundsValue}
          applicationStates={applicationStates}
          editing={editing}
          editingReviewId={editingReviewId}
          setEditingReviewId={setEditingReviewId}
          setOriginalReviewCache={setOriginalReviewCache}
          handleRoundChange={handleRoundChange}
          handleSaveReview={handleSaveReview}
          handleCancelReviewEdit={handleCancelReviewEdit}
          handleReviewTextChange={handleReviewTextChange}
          handleReviewPointsChange={handleReviewPointsChange}
          activeRound={activeRound}
          activeRoundUsernames={activeRoundUsernames}
          eliminatedApplicants={eliminatedApplicants}
          selectedToEliminate={selectedToEliminate}
          toggleSelect={toggleSelect}
          saveElimination={saveElimination}
          evaluationType={evaluationType}
        />
      ) : (
        <TaskApplicantView
          roundsValue={roundsValue}
          applicationStates={applicationStates}
          selectedFiles={selectedFiles}
          setSelectedFiles={setSelectedFiles}
          uploadToRound={uploadToRound}
          currentUserEliminated={currentUserEliminated}
          evaluationType={evaluationType}
        />
      )}

      {editable && (
        <>
          {!editing && !isAnyReviewEditing && (
            <div className="task-actions">
              <button
                className="action-button primary"
                onClick={() => {
                  setEditing(true)
                  setEditingReviewId(null)
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit Task
              </button>
              <button className="action-button danger" onClick={handleDelete}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
                Delete Task
              </button>
            </div>
          )}
          {editing && (
            <div className="task-actions">
              <button className="action-button success" onClick={handleSave}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Save Changes
              </button>
              <button className="action-button secondary" onClick={() => setEditing(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                Cancel
              </button>
            </div>
          )}
          {editable && !editing && activeRound && (
            <div className="task-actions">
              {isBeforeToday(activeRound.deadline) && (
                <button className="action-button primary" onClick={activateNextRound}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="13 17 18 12 13 7" />
                    <polyline points="6 17 11 12 6 7" />
                  </svg>
                  Activate Next Round
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}