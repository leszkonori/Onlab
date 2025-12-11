"use client"

import { useState } from "react"
import { useKeycloak } from "../KeycloakProvider"
import type { EvaluationType, RoundType } from "../types"
import "./NewTask.css"
import httpClient from "../HttpClient"

export default function NewTask() {
  const { user } = useKeycloak()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [deadline, setDeadline] = useState("")
  const [rounds, setRounds] = useState<RoundType[]>([])
  const [evaluationType, setEvaluationType] = useState<EvaluationType>("TEXT")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const today = new Date()
  const minDate = today.toISOString().split("T")[0]

  const handleAddRound = () => {
    setRounds([...rounds, { description: "", deadline: "" }])
  }

  const handleRoundChange = (index: number, name: keyof RoundType, value: string) => {
    setRounds(rounds.map((round, i) => (i === index ? { ...round, [name]: value } : round)))
  }

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      alert("Please fill in all required fields")
      return
    }

    if (rounds.length === 0 && !deadline) {
      alert("Please set an application deadline")
      return
    }

    setIsSubmitting(true)

    const task = {
      title,
      description,
      applicationDeadline: rounds.length === 0 ? deadline : null,
      creator: user?.username,
      rounds: rounds,
      evaluationType,
    }

    try {
      const res = await httpClient.post("/tasks", task);
      alert("Task created successfully!");

      // Reset form
      setTitle("");
      setDescription("");
      setDeadline("");
      setRounds([]);
      setEvaluationType("TEXT");
    } catch (error) {
      const errorMessage = (error as any).response?.data?.message || (error as Error).message;
      alert("Error: " + errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleRemoveRound = (index: number) => {
    setRounds(rounds.filter((_, i) => i !== index))
  }

  return (
    <div className="new-task-container">
      <div className="new-task-hero">
        <div className="new-task-hero-content">
          <div className="hero-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
          <h1 className="new-task-hero-title">Create New Task</h1>
          <p className="new-task-hero-subtitle">Set up a new competition task with rounds and evaluation criteria</p>
        </div>
      </div>

      <div className="new-task-content">
        <div className="form-card">
          <div className="form-section">
            <h3 className="section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              Basic Information
            </h3>

            <div className="form-group">
              <label className="form-label">
                Task Name <span className="required">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter a descriptive task name"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Description <span className="required">*</span>
              </label>
              <textarea
                className="form-textarea"
                placeholder="Provide detailed information about the task requirements and objectives"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
              />
            </div>

            {rounds.length === 0 && (
              <div className="form-group">
                <label className="form-label">
                  Application Deadline <span className="required">*</span>
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={deadline}
                  min={minDate}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                Evaluation Type <span className="required">*</span>
              </label>
              <select
                className="form-select"
                value={evaluationType}
                onChange={(e) => setEvaluationType(e.target.value as EvaluationType)}
              >
                <option value="TEXT">Text Feedback</option>
                <option value="POINTS">Points Only</option>
                <option value="BOTH">Text + Points</option>
              </select>
            </div>
          </div>

          <div className="form-section">
            <div className="section-header">
              <h3 className="section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Competition Rounds
              </h3>
              <button className="add-round-button" onClick={handleAddRound}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Add Round
              </button>
            </div>

            {rounds.length === 0 ? (
              <div className="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <p className="empty-state-text">No rounds added yet</p>
                <p className="empty-state-hint">Add rounds to create a multi-stage competition</p>
              </div>
            ) : (
              <div className="rounds-list">
                {rounds.map((round, index) => (
                  <div key={index} className="round-card">
                    <div className="round-header">
                      <h4 className="round-title">Round {index + 1}</h4>
                      <button
                        className="remove-round-button"
                        onClick={() => handleRemoveRound(index)}
                        title="Remove round"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Round Description</label>
                      <textarea
                        className="form-textarea"
                        placeholder="Describe what participants need to do in this round"
                        value={round.description}
                        onChange={(e) => handleRoundChange(index, "description", e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Round Deadline</label>
                      <input
                        type="date"
                        className="form-input"
                        value={round.deadline}
                        min={minDate}
                        onChange={(e) => handleRoundChange(index, "deadline", e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button className="submit-button" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <svg
                    className="spinner"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Creating Task...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Create Task
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
