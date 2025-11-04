"use client"

import { useState } from "react"
import type React from "react"
import type { ApplicationType, EvaluationType, RoundType } from "../types"
import { formatDate } from "./TaskUtils"
import "./TaskCreatorView.css"

/**
 * Task Létrehozó/Szerkesztő nézet komponens.
 * Megjeleníti a fordulókat és a hozzájuk tartozó pályázatokat fordulónként csoportosítva.
 */
export default function TaskCreatorView({
  roundsValue,
  applicationStates,
  editing,
  editingReviewId,
  setEditingReviewId,
  setOriginalReviewCache,
  handleRoundChange,
  handleSaveReview,
  handleCancelReviewEdit,
  handleReviewTextChange,
  handleReviewPointsChange,
  activeRound,
  activeRoundUsernames,
  eliminatedApplicants,
  selectedToEliminate,
  toggleSelect,
  saveElimination,
  evaluationType,
}: {
  roundsValue: RoundType[]
  applicationStates: ApplicationType[]
  editing: boolean
  editingReviewId: number | null
  setEditingReviewId: React.Dispatch<React.SetStateAction<number | null>>
  setOriginalReviewCache: React.Dispatch<React.SetStateAction<string | undefined | null>>
  handleRoundChange: (index: number, field: "description" | "deadline", value: string) => void
  handleSaveReview: (appId: number, text: string | null, points: number | null) => Promise<void>
  handleCancelReviewEdit: (appId: number) => void
  handleReviewTextChange: (id: number, newText: string) => void
  handleReviewPointsChange: (id: number, newPointsStr: string) => void
  activeRound: RoundType | null
  activeRoundUsernames: string[]
  eliminatedApplicants: string[]
  selectedToEliminate: Set<string>
  toggleSelect: (username: string) => void
  saveElimination: () => Promise<void>
  evaluationType: EvaluationType
}) {
  const activeRoundIndex = roundsValue.findIndex((r) => r.id === activeRound?.id)

  const [expandedRoundId, setExpandedRoundId] = useState<number | undefined>(activeRound?.id)

  const getApplicationsForRound = (roundId: number | undefined) => {
    if (!roundId) return []
    return applicationStates.filter((app) => app.round?.id === roundId)
  }

  const toggleRound = (roundId: number | undefined) => {
    setExpandedRoundId(expandedRoundId === roundId ? undefined : roundId)
  }

  return (
    <>
      {roundsValue.length > 0 && (
        <div className="rounds-container">
          <h3 className="section-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Rounds & Applications
          </h3>
          <div className="rounds-grid">
            {roundsValue.map((round, index) => {
              const isActive = round.id === activeRound?.id
              const isRoundEditable = editing && (activeRoundIndex === -1 || index >= activeRoundIndex)
              const roundApplications = getApplicationsForRound(round.id)
              const isExpanded = expandedRoundId === round.id

              return (
                <div
                  key={index}
                  className={`creator-round-card ${isActive ? "active" : ""} ${!isRoundEditable && editing ? "disabled-editing" : ""}`}
                >
                  <div className="round-header-section clickable" onClick={() => toggleRound(round.id)}>
                    <div className="round-header-left">
                      <div className="round-badge">Round {index + 1}</div>

                      {isActive && (
                        <div className="active-badge">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                            <circle cx="12" cy="12" r="8" />
                          </svg>
                          Active
                        </div>
                      )}
                    </div>

                    <svg
                      className={`chevron-icon ${isExpanded ? "expanded" : ""}`}
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>

                  {isExpanded && (
                    <>
                      {isRoundEditable ? (
                        <div className="round-edit-form">
                          <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea
                              className="form-textarea"
                              value={round.description}
                              onChange={(e) => handleRoundChange(index, "description", e.target.value)}
                              placeholder="Enter round description..."
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Deadline</label>
                            <input
                              type="date"
                              className="form-input"
                              value={(round.deadline as string | undefined)?.slice(0, 10) || ""}
                              onChange={(e) => handleRoundChange(index, "deadline", e.target.value)}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="round-info-grid">
                          <div className="info-item">
                            <span className="info-label">
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                              </svg>
                              Description
                            </span>
                            <p className="info-value">{round.description}</p>
                          </div>
                          <div className="info-item">
                            <span className="info-label">
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                              </svg>
                              Deadline
                            </span>
                            <p className="info-value">
                              {round.deadline ? (round.deadline as string).slice(0, 10) : "—"}
                            </p>
                          </div>
                        </div>
                      )}

                      {roundApplications.length > 0 && (
                        <div className="round-applications-section">
                          <h4 className="applications-subtitle">
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                              <circle cx="8.5" cy="7" r="4" />
                              <polyline points="17 11 19 13 23 9" />
                            </svg>
                            Applications ({roundApplications.length})
                          </h4>
                          <div className="applications-grid">
                            {roundApplications.map((application, appIndex) => {
                              const isEliminated = eliminatedApplicants.includes(application.keycloakUserName)
                              const isSelectedForElimination = selectedToEliminate.has(application.keycloakUserName)

                              return (
                                <div
                                  key={application.id}
                                  className={`application-card${editingReviewId === application.id ? " editing" : ""}${isEliminated ? " eliminated" : ""}`}
                                >
                                  <div className="application-header">
                                    <div className="application-badge">Application {appIndex + 1}</div>
                                    {isEliminated && <span className="eliminated-badge">Eliminated</span>}
                                  </div>

                                  <div className="application-info">
                                    <div className="info-row">
                                      <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                      >
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                      </svg>
                                      <span className="info-text">{application.keycloakUserName}</span>
                                    </div>
                                    <div className="info-row">
                                      <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                      >
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                        <line x1="16" y1="2" x2="16" y2="6" />
                                        <line x1="8" y1="2" x2="8" y2="6" />
                                        <line x1="3" y1="10" x2="21" y2="10" />
                                      </svg>
                                      <span className="info-text">{formatDate(application.applicationDate)}</span>
                                    </div>
                                  </div>

                                  {/* Review Section */}
                                  <div className="review-section">
                                    {editingReviewId === application.id ? (
                                      <div className="review-edit-form">
                                        {(evaluationType === "TEXT" || evaluationType === "BOTH") && (
                                          <div className="form-group">
                                            <label className="form-label">Review Text</label>
                                            <textarea
                                              className="form-textarea"
                                              value={application.reviewText || ""}
                                              onChange={(e) => handleReviewTextChange(application.id, e.target.value)}
                                              placeholder="Enter your review..."
                                            />
                                          </div>
                                        )}

                                        {(evaluationType === "POINTS" || evaluationType === "BOTH") && (
                                          <div className="form-group">
                                            <label className="form-label">Points (0–10)</label>
                                            <input
                                              type="number"
                                              className="form-input"
                                              min={0}
                                              max={10}
                                              value={application.reviewPoints ?? ""}
                                              onChange={(e) => handleReviewPointsChange(application.id, e.target.value)}
                                              placeholder="Enter points..."
                                            />
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="review-display">
                                        <span className="review-label">
                                          <svg
                                            width="18"
                                            height="18"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                          >
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                            <polyline points="14 2 14 8 20 8" />
                                            <line x1="16" y1="13" x2="8" y2="13" />
                                            <line x1="16" y1="17" x2="8" y2="17" />
                                            <polyline points="10 9 9 9 8 9" />
                                          </svg>
                                          Review
                                        </span>
                                        <p className="review-text">
                                          {evaluationType === "TEXT" || evaluationType === "BOTH"
                                            ? application.reviewText || "Not reviewed yet"
                                            : application.reviewPoints != null
                                              ? `${application.reviewPoints}/10`
                                              : "Not reviewed yet"}
                                          {evaluationType === "BOTH" && application.reviewPoints != null && (
                                            <span className="review-points"> ({application.reviewPoints}/10)</span>
                                          )}
                                        </p>
                                      </div>
                                    )}
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="application-actions">
                                    <a
                                      className="download-link"
                                      href={`http://localhost:8081/api/applications/download/${application.id}`}
                                      download
                                    >
                                      <button className="action-button secondary">
                                        <svg
                                          width="18"
                                          height="18"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                        >
                                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                          <polyline points="7 10 12 15 17 10" />
                                          <line x1="12" y1="15" x2="12" y2="3" />
                                        </svg>
                                        Download
                                      </button>
                                    </a>

                                    {!editing && (
                                      <>
                                        {editingReviewId === application.id ? (
                                          <>
                                            <button
                                              className="action-button success"
                                              onClick={() =>
                                                handleSaveReview(
                                                  application.id,
                                                  application.reviewText ?? null,
                                                  application.reviewPoints ?? null,
                                                )
                                              }
                                            >
                                              <svg
                                                width="18"
                                                height="18"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                              >
                                                <polyline points="20 6 9 17 4 12" />
                                              </svg>
                                              Save
                                            </button>
                                            <button
                                              className="action-button secondary"
                                              onClick={() => handleCancelReviewEdit(application.id)}
                                            >
                                              <svg
                                                width="18"
                                                height="18"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                              >
                                                <line x1="18" y1="6" x2="6" y2="18" />
                                                <line x1="6" y1="6" x2="18" y2="18" />
                                              </svg>
                                              Cancel
                                            </button>
                                          </>
                                        ) : (
                                          <button
                                            className="action-button primary"
                                            onClick={() => {
                                              setEditingReviewId(application.id)
                                              setOriginalReviewCache(
                                                application.reviewText || application.reviewPoints?.toString() || null,
                                              )
                                            }}
                                          >
                                            <svg
                                              width="18"
                                              height="18"
                                              viewBox="0 0 24 24"
                                              fill="none"
                                              stroke="currentColor"
                                              strokeWidth="2"
                                            >
                                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                            </svg>
                                            Edit Review
                                          </button>
                                        )}
                                      </>
                                    )}
                                  </div>

                                  {/* Elimination Section */}
                                  {isActive && (
                                    <div className="elimination-section">
                                      <label className="elimination-checkbox">
                                        <input
                                          type="checkbox"
                                          disabled={isEliminated}
                                          checked={isSelectedForElimination}
                                          onChange={() => toggleSelect(application.keycloakUserName)}
                                        />
                                        <span className="checkbox-label">
                                          {isEliminated ? "Already eliminated" : "Mark for elimination"}
                                        </span>
                                      </label>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>

                          {/* Save Elimination Button for Active Round */}
                          {isActive && selectedToEliminate.size > 0 && (
                            <div className="elimination-actions">
                              <button className="action-button danger" onClick={saveElimination}>
                                <svg
                                  width="18"
                                  height="18"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                                Save Elimination ({selectedToEliminate.size})
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
