// TaskCreatorView.tsx

import React from 'react';
import { ApplicationType, EvaluationType, RoundType } from '../types';
import { formatDate } from './TaskUtils';
// Új CSS fájl a komponensre specifikus stílusokhoz (lásd a javaslatot)
import './TaskCreatorView.css'; 

/**
 * Task Létrehozó/Szerkesztő nézet komponens.
 * Megjeleníti a fordulók szerkesztését, a pályázatokat, a review szerkesztést és az eliminációs panelt.
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
  roundsValue: RoundType[];
  applicationStates: ApplicationType[];
  editing: boolean; // Task fő szerkesztés alatt van-e
  editingReviewId: number | null; // Melyik review szerkesztés alatt van
  setEditingReviewId: React.Dispatch<React.SetStateAction<number | null>>;
  setOriginalReviewCache: React.Dispatch<React.SetStateAction<string | undefined | null>>;
  handleRoundChange: (index: number, field: 'description' | 'deadline', value: string) => void;
  handleSaveReview: (appId: number, text: string | null, points: number | null) => Promise<void>;
  handleCancelReviewEdit: (appId: number) => void;
  handleReviewTextChange: (id: number, newText: string) => void;
  handleReviewPointsChange: (id: number, newPointsStr: string) => void;
  activeRound: RoundType | null;
  activeRoundUsernames: string[];
  eliminatedApplicants: string[];
  selectedToEliminate: Set<string>;
  toggleSelect: (username: string) => void;
  saveElimination: () => Promise<void>;
  evaluationType: EvaluationType;
}) {
  return (
    <>
      {/* 1. Fordulók szerkesztése / megjelenítése */}
      {roundsValue.length > 0 && (
        <div className="rounds-container">
          <h4>Rounds:</h4>
          <div className="add-round-container">
            {roundsValue.map((round, index) => (
              <div key={index} className="round-container">
                <h4 className="round-title">Round {index + 1}:</h4>
                {editing ? (
                  <div className="task-grid edit">
                    <textarea
                      value={round.description}
                      onChange={(e) => handleRoundChange(index, 'description', e.target.value)}
                    />
                    {/* LocalDate → csak dátum */}
                    <input
                      type="date"
                      value={(round.deadline as string | undefined)?.slice(0, 10) || ''}
                      onChange={(e) => handleRoundChange(index, 'deadline', e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="task-grid">
                    <h4>Description:</h4>
                    <p>{round.description}</p>
                    <h4>Deadline:</h4>
                    <p>
                      {round.deadline
                        ? (round.deadline as string).slice(0, 10) // Csak a dátum megjelenítése
                        : '—'}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Application-ök listázása és Review szerkesztés */}
      {applicationStates.length > 0 && (
        <div className="rounds-container">
          <h4>Applications:</h4>
          <div className="add-round-container application">
            {applicationStates.map((application, index) => {
              const currentRoundIndex = roundsValue.findIndex((r) => r.id === application.round?.id);

              return (
                <div
                  key={application.id}
                  className={`round-container application${editingReviewId === application.id ? ' editing' : ''}`}
                >
                  <h4 className="round-title">Application {index + 1}:</h4>
                  <div className="task-grid">
                    <h4>Round:</h4>
                    <p>Round {currentRoundIndex !== -1 ? currentRoundIndex + 1 : 'N/A'}</p>
                    <h4>Uploader:</h4>
                    <p>{application.keycloakUserName}</p>
                    <h4>Application Date:</h4>
                    <p>{formatDate(application.applicationDate)}</p>

                    {/* Review szerkesztő UI */}
                    {editingReviewId === application.id ? (
                      <>
                        {/* A "Review:" címke itt hiányzik, de a design miatt (Task.tsx) nem adom hozzá */}

                        {(evaluationType === "TEXT" || evaluationType === "BOTH") && (
                          <>
                            <label>Text</label>
                            <textarea
                              value={application.reviewText || ''}
                              onChange={(e) => handleReviewTextChange(application.id, e.target.value)}
                            />
                          </>
                        )}

                        {(evaluationType === "POINTS" || evaluationType === "BOTH") && (
                          <>
                            <label>Points (0–10)</label>
                            <input
                              type="number"
                              min={0}
                              max={10}
                              value={application.reviewPoints ?? ''}
                              onChange={(e) => handleReviewPointsChange(application.id, e.target.value)}
                            />
                          </>
                        )}
                      </>
                    ) : (
                      // Review megjelenítés
                      <>
                        <h4>Review:</h4>
                        <p>
                          {(evaluationType === "TEXT" || evaluationType === "BOTH")
                            ? (application.reviewText ? application.reviewText : 'not reviewed')
                            : (application.reviewPoints != null ? `${application.reviewPoints}/10` : 'not reviewed')
                          }
                          {evaluationType === "BOTH" && (
                            <>
                              {" "}
                              {application.reviewPoints != null ? `(${application.reviewPoints}/10)` : ''}
                            </>
                          )}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Fájl letöltés gomb */}
                  <a
                    className="download-button-a"
                    href={`http://localhost:8081/api/applications/download/${application.id}`}
                    download
                  >
                    <button className="custom-button">Download file</button>
                  </a>

                  {/* Review szerkesztés gombok */}
                  <div className="review-buttons-container">
                    {/* CSAK AKKOR jelenítjük meg a review gombokat, ha a TASK NINCS szerkesztés alatt */}
                    {!editing && (
                      <>
                        {editingReviewId === application.id ? (
                          <>
                            <button
                              className="custom-button"
                              onClick={() => handleSaveReview(
                                application.id,
                                application.reviewText ?? null,
                                application.reviewPoints ?? null
                              )}
                            >
                              Save Review
                            </button>
                            <button
                              className="custom-button"
                              onClick={() => handleCancelReviewEdit(application.id)}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            className="custom-button"
                            onClick={() => {
                              setEditingReviewId(application.id);
                              // Cache-eljük az aktuális (mentett) értéket
                              setOriginalReviewCache(application.reviewText || application.reviewPoints?.toString() || null);
                            }}
                          >
                            Edit Review
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Eliminációs Panel (aktív forduló) */}
      {activeRound && (
        <div className="rounds-container">
          <h4>Active round applicants – elimination</h4>
          {activeRoundUsernames.length === 0 ? (
            <p>Nincs beadott pályázat az aktív fordulóra.</p>
          ) : (
            <>
              <div className="add-round-container application">
                {activeRoundUsernames.map((uname) => {
                  const alreadyEliminated = eliminatedApplicants.includes(uname);
                  return (
                    <div key={uname} className="application-container">
                      <div className="application-info">
                        <strong>{uname}</strong>
                        {alreadyEliminated && (
                          <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.75 }}>
                            (már eliminálva)
                          </span>
                        )}
                      </div>
                      <div className="application-buttons">
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input
                            type="checkbox"
                            disabled={alreadyEliminated}
                            checked={selectedToEliminate.has(uname)}
                            onChange={() => toggleSelect(uname)}
                          />
                          Eliminálandó
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="buttons-container" style={{ marginTop: 8 }}>
                <button
                  className="custom-button"
                  onClick={saveElimination}
                  disabled={selectedToEliminate.size === 0}
                >
                  Mentés (eliminálás)
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}