"use client"

import type React from "react"
import type { ApplicationType, EvaluationType, RoundType } from "../types"
import { useKeycloak } from "../KeycloakProvider"
import { formatDateOnly } from "./TaskUtils"
import "./TaskApplicantView.css";

/**
 * Pályázó nézet komponens.
 * Megjeleníti a fordulókat, a pályázatok státuszát, és kezeli a fájlfeltöltést.
 */
export default function TaskApplicantView({
  roundsValue,
  applicationStates,
  selectedFiles,
  setSelectedFiles,
  uploadToRound,
  currentUserEliminated,
  evaluationType,
}: {
  roundsValue: RoundType[]
  applicationStates: ApplicationType[]
  selectedFiles: { [roundId: number]: File | null }
  setSelectedFiles: React.Dispatch<React.SetStateAction<{ [roundId: number]: File | null }>>
  uploadToRound: (roundId: number) => Promise<void>
  currentUserEliminated: boolean
  evaluationType: EvaluationType
}) {
  const { user } = useKeycloak()

  if (roundsValue.length === 0) {
    return null
  }

  return (
    <div className="rounds-container">
      <h3 className="section-title">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        Rounds
      </h3>
      {currentUserEliminated && (
        <div className="eliminated-notice">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div>
            <h4>You have been eliminated from this task.</h4>
            <p>You cannot submit any more applications for the following rounds.</p>
          </div>
        </div>
      )}
      <div className="applicant-rounds-grid">
        {roundsValue.map((round, index) => {
          const hasAppliedToThisRound = applicationStates.some(
            (app) => app.keycloakUserId === user?.id && app.round?.id === round.id,
          )
          const userApplicationForRound = applicationStates.find(
            (app) => app.keycloakUserId === user?.id && app.round?.id === round.id,
          )

          return (
            <div key={index} className={`applicant-round-card ${(round as any).isActive ? 'active' : ''}`}>
              <div className="round-header-section">
                <div className="round-badge">Round {index + 1}</div>
                {(round as any).isActive && (
                  <div className="active-badge">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                      <circle cx="12" cy="12" r="8" />
                    </svg>
                    Active
                  </div>
                )}
              </div>

              <div className="round-info-grid">
                <div className="info-label">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span>Description:</span>
                </div>
                <p className="info-value">{round.description}</p>

                <div className="info-label">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span>Deadline:</span>
                </div>
                <p className="info-value">
                  {round.deadline ? formatDateOnly((round.deadline as string).slice(0, 10)) : "—"}
                </p>
              </div>

              {hasAppliedToThisRound && (
                <div className="application-status-section">
                  <div className="status-header">
                    <div className="status-icon success">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="status-title">Application Submitted</h3>
                      <p className="status-subtitle">You have already applied for this round</p>
                    </div>
                  </div>

                  <div className="status-actions">
                    <a
                      className="download-link"
                      href={`http://localhost:8081/api/applications/download/${userApplicationForRound?.id}`}
                      download
                    >
                      <button className="download-button">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Download Your Submission
                      </button>
                    </a>
                  </div>

                  {(userApplicationForRound?.reviewText || userApplicationForRound?.reviewPoints != null) && (
                    <div className="review-section">
                      <div className="review-header">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h4>Your Review</h4>
                      </div>
                      {(evaluationType === "TEXT" || evaluationType === "BOTH") &&
                        userApplicationForRound?.reviewText && (
                          <p className="review-text">{userApplicationForRound.reviewText}</p>
                        )}
                      {(evaluationType === "POINTS" || evaluationType === "BOTH") &&
                        userApplicationForRound?.reviewPoints != null && (
                          <div className="review-points">
                            <span className="points-value">{userApplicationForRound.reviewPoints}</span>
                            <span className="points-max">/10</span>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              )}

              
              {!hasAppliedToThisRound && (round as any).isActive && !currentUserEliminated && (
                <div className="upload-section-wrapper">
                  <div className="upload-header">
                    <div className="upload-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="upload-title">Submit Your Application</h3>
                      <p className="upload-subtitle">Upload your work as a .zip file</p>
                    </div>
                  </div>

                  <div className="upload-area">
                    <label htmlFor={`fileInput-${round.id}`} className="file-input-label">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      <span className="file-input-text">
                        {selectedFiles[round.id as number]?.name || "Click to choose a file"}
                      </span>
                      <span className="file-input-hint">Expected format: .zip</span>
                    </label>
                    <input
                      type="file"
                      id={`fileInput-${round.id}`}
                      accept=".zip"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null
                        setSelectedFiles((prev) => ({
                          ...prev,
                          [round.id as number]: file,
                        }))
                      }}
                    />
                  </div>

                  <button
                    className="submit-application-button"
                    onClick={() => uploadToRound(round.id as number)}
                    disabled={!selectedFiles[round.id as number]}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    Submit Application
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
