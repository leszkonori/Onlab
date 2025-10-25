import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Task.css';
import { ApplicationType, EvaluationType, RoundType } from '../types';
import { useKeycloak } from '../KeycloakProvider';

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
  id: number;
  title: string;
  descr: string;
  date: string;
  rounds?: RoundType[];
  applications?: ApplicationType[];
  editable: boolean;
  onSave?: () => void;
  evaluationType: EvaluationType;
}) {
  const [editing, setEditing] = useState(false);
  const [titleValue, setTitleValue] = useState(title);
  const [descrValue, setDescrValue] = useState(descr);
  const [dateValue, setDateValue] = useState(date);
  const [roundsValue, setRoundsValue] = useState(rounds || []);
  const [applicationStates, setApplicationStates] = useState(applications || []);
  const { user } = useKeycloak();

  const [eliminatedApplicants, setEliminatedApplicants] = useState<string[]>([]);
  const [selectedToEliminate, setSelectedToEliminate] = useState<Set<string>>(new Set());

  const [selectedFiles, setSelectedFiles] = useState<{ [roundId: number]: File | null }>({});
  // Új state a review szerkesztéséhez
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);

  // Új state a review szerkesztés MELLETT: itt tároljuk az eredeti, mentett review-t a Cancel-hez.
  const [originalReviewCache, setOriginalReviewCache] = useState<string | undefined | null>(undefined);

  // Segédváltozó, amely mutatja, hogy éppen szerkesztés alatt van-e valamelyik review
  const isAnyReviewEditing = editingReviewId !== null;

  // ÉRTESÍTÉS FRISSÍTŐ EFFECT
  useEffect(() => {
    // 1. Task Creator View (Új Application-ök eltüntetése)
    if (editable) {
      async function touchCreatorView() {
        try {
          await fetch(`http://localhost:8081/api/tasks/${id}/touch-view`, {
            method: 'PUT',
          });
        } catch (error) {
          console.error("Error touching creator view:", error);
        }
      }
      touchCreatorView();
    }

    // 2. Applicant View (Új Review-k eltüntetése)
    // Ha NEM a Task creator nézi (editable: false), és be van jelentkezve, frissítjük a Review nézettséget.
    if (!editable && user?.username) {
      async function touchApplicantReviewView() {
        try {
          // Meghívjuk az új ApplicationController-beli endpointot
          await fetch(`http://localhost:8081/api/applications/tasks/${id}/touch-review-view/${user?.username}`, {
            method: 'PUT',
          });
        } catch (error) {
          console.error("Error touching applicant review view:", error);
        }
      }
      touchApplicantReviewView();
    }

  }, [id, editable, user?.username]); // user.username függőség kell!

  useEffect(() => {
    async function loadEliminated() {
      try {
        const res = await fetch(`http://localhost:8081/api/tasks/${id}`);
        if (!res.ok) return;
        const taskJson = await res.json();
        setEliminatedApplicants(taskJson.eliminatedApplicants ?? []);
      } catch (e) {
        console.error("Failed to load eliminated applicants", e);
      }
    }
    loadEliminated();
  }, [id]);

  async function uploadToRound(roundId: number) {
    if (!user) return;

    const file = selectedFiles[roundId];
    if (!file) {
      alert('Please select a file first.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('keycloakUserId', user.id);
    formData.append('keycloakUserName', user.username);

    try {
      const response = await fetch(`http://localhost:8081/api/applications/${id}/round/${roundId}`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.text();
      alert(result);
      window.location.reload();

    } catch (e) {
      console.error('Upload error:', e);
      alert('Upload failed.');
    }
  }

  // ---- DÁTUM KEZELÉS: LocalDate ("YYYY-MM-DD") ----

  /** Biztonságos parse 'YYYY-MM-DD' → helyi éjfél, zónaeltolás nélkül. */
  function parseLocalDate(d: string) {
    const [y, m, day] = (d || '').slice(0, 10).split('-').map(Number);
    return new Date(y || 1970, (m || 1) - 1, day || 1);
  }

  /** Csak dátum formázása (óra nélkül). */
  function formatDateOnly(localDateString: string) {
    const d = parseLocalDate(localDateString);
    return new Intl.DateTimeFormat('hu-HU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  }

  /** Dátum + idő formázása – pl. Application.applicationDate-hez. */
  function formatDate(isoString: string | number | Date) {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('hu-HU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  }

  /** Következő (ma vagy jövőbeli) round dátuma LocalDate stringként, ha van. */
  function getNextUpcomingDeadline(rs: RoundType[]): string | null {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = (rs || [])
      .filter((r) => !!r?.deadline)
      .map((r) => ({ raw: (r.deadline as string).slice(0, 10), parsed: parseLocalDate(r.deadline as string) }))
      .filter((r) => r.parsed.getTime() >= today.getTime())
      .sort((a, b) => a.parsed.getTime() - b.parsed.getTime());

    return upcoming.length > 0 ? upcoming[0].raw : null;
  }

  const navigate = useNavigate();

  // Aktív kör (ma vagy későbbi legközelebbi)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingRounds = roundsValue
    .filter((r) => !!r?.deadline)
    .map((r) => ({ ...r, parsed: parseLocalDate(r.deadline as string) }))
    .filter((r) => r.parsed.getTime() >= today.getTime())
    .sort((a, b) => a.parsed.getTime() - b.parsed.getTime());
  const activeRound = (roundsValue || []).find(r => (r as any).isActive) || null;

  // Az aktív fordulóhoz beadott jelentkezések (ha van aktív forduló)
  const activeRoundApplications = activeRound
    ? (applicationStates || []).filter(app => app.round?.id === activeRound.id)
    : [];

  // Egyedi felhasználónév lista (ha esetleg több feltöltése lenne valakinek)
  const activeRoundUsernames = Array.from(
    new Set(activeRoundApplications.map(a => a.keycloakUserName))
  ).sort();

  const currentUserEliminated = user?.username
    ? eliminatedApplicants.includes(user.username)
    : false;

  function toggleSelect(username: string) {
    setSelectedToEliminate(prev => {
      const next = new Set(prev);
      if (next.has(username)) next.delete(username);
      else next.add(username);
      return next;
    });
  }

  async function saveElimination() {
    // A kérés szerint: az aktív forduló kijelölései MOSTANTÓL ne pályázhassanak tovább.
    // Ez praktikusan: hozzáadjuk őket az eddigi eliminált listához (nem visszavonás).
    const updated = Array.from(new Set([...eliminatedApplicants, ...Array.from(selectedToEliminate)]));

    try {
      const res = await fetch(`http://localhost:8081/api/tasks/${id}/eliminate-applicants`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        setEliminatedApplicants(updated);
        setSelectedToEliminate(new Set());
        alert('Eliminálás mentve. A kijelöltek a következő fordulókra már nem pályázhatnak.');
        // ha akarsz, frissítheted a taskot is: onSave?.();
      } else {
        const msg = await res.text();
        alert('Nem sikerült menteni: ' + msg);
      }
    } catch (e) {
      console.error(e);
      alert('Hálózati hiba az eliminálás mentése közben.');
    }
  }

  async function handleSave() {
    try {
      // Takarítsuk le az applications mezőt a roundokról, és vágjuk 10 karakternél a dátumot.
      const cleanedRounds = roundsValue.map(({ applications: _apps, ...rest }) => ({
        ...rest,
        deadline: (rest.deadline as string | undefined)?.slice(0, 10) || '',
      }));

      const payload: any = {
        title: titleValue,
        description: descrValue,
        rounds: cleanedRounds,
        // Ha VAN legalább egy round, NEM küldünk applicationDeadline-t.
        ...(cleanedRounds.length === 0 ? { applicationDeadline: (dateValue || '').slice(0, 10) } : {}),
      };

      const response = await fetch(`http://localhost:8081/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      alert('Task updated successfully!');
      setEditing(false);
      if (onSave) onSave();
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task');
    }
  }

  // Új funkció egyetlen review mentéséhez
  async function handleSaveReview(appId: number, text: string | null, points: number | null) {
    try {
      // 1. A review küldése az API-nak (itt string | null a jó)
      const response = await fetch(`http://localhost:8081/api/applications/${appId}/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, points }),
      });

      if (!response.ok) {
        throw new Error('Failed to update review');
      }

      alert('Review updated successfully!');
      setEditingReviewId(null);
      setOriginalReviewCache(undefined); // Töröljük a cache-t, mivel az új érték most már mentettnek számít.

      setApplicationStates(prev =>
        prev.map(app => app.id === appId ? { ...app, reviewText: text ?? undefined, reviewPoints: points } : app)
      );

      // Jelzés a szülőnek, hogy frissítheti az adatokat (opcionális, de jó gyakorlat)
      if (onSave) onSave();

    } catch (error) {
      console.error('Error updating review:', error);
      alert('Failed to update review');
    }
  }

  const handleRoundChange = (index: number, field: 'description' | 'deadline', value: string) => {
    const updatedRounds = [...roundsValue];
    updatedRounds[index] = { ...updatedRounds[index], [field]: value };
    setRoundsValue(updatedRounds);
  };

  async function handleDelete() {
    const confirmed = window.confirm('Are you sure you want to delete this task?');

    if (!confirmed) return;

    try {
      const response = await fetch(`http://localhost:8081/api/tasks/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Task deleted successfully!');
        navigate('/');
      } else {
        alert('Error: Could not delete the task!');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('There was an error while deleting the task.');
    }
  }

  const handleReviewChange = (id: number, newReview: string) => {
    const updated = applicationStates.map((app) => (app.id === id ? { ...app, review: newReview } : app));
    setApplicationStates(updated);
  };

  const handleCancelReviewEdit = (appId: number) => {
    // Használjuk a szerkesztés megkezdésekor cachelt értéket. (null/undefined jöhet be)
    const originalReview = originalReviewCache === null ? undefined : originalReviewCache;

    setApplicationStates((prev) =>
      prev.map((app) =>
        app.id === appId ? { ...app, review: originalReview } : app
      )
    );
    setOriginalReviewCache(undefined); // Töröljük a cache-t
    setEditingReviewId(null);
  };

  const handleReviewTextChange = (id: number, newText: string) => {
    setApplicationStates(prev =>
      prev.map(app => app.id === id ? { ...app, reviewText: newText } : app)
    );
  };

  const handleReviewPointsChange = (id: number, newPointsStr: string) => {
    const val = newPointsStr === "" ? null : Math.max(0, Math.min(10, Number(newPointsStr)));
    setApplicationStates(prev =>
      prev.map(app => app.id === id ? { ...app, reviewPoints: val } : app)
    );
  };

  function isBeforeToday(dateStr: string) {
    const d = new Date(dateStr);
    const dd = new Date(d.getFullYear(), d.getMonth(), d.getDate()); // 00:00 helyi idő
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return dd.getTime() < today.getTime();
  }

  async function activateNextRound() {
    const res = await fetch(`http://localhost:8081/api/tasks/${id}/activate-next`, {
      method: 'PUT',
    });
    if (res.ok) {
      alert('Next round activated.');
      if (onSave) onSave();
      // vagy window.location.reload();
    } else {
      const txt = await res.text();
      alert('Cannot activate next round: ' + txt);
    }
  }

  return (
    <div className="task-container">
      <div className="task-grid">
        <h4>Task name:</h4>
        {editing ? (
          <input type="text" value={titleValue} onChange={(e) => setTitleValue(e.target.value)} />
        ) : (
          <p>{title}</p>
        )}

        <h4>Description:</h4>
        {editing ? (
          <textarea value={descrValue} onChange={(e) => setDescrValue(e.target.value)} />
        ) : (
          <p>{descr}</p>
        )}

        <h4>{roundsValue.length === 0 ? 'Deadline:' : 'Current round deadline:'}</h4>
        {editing ? (
          // Csak akkor mutassuk a task application deadline inputot, ha nincs egyetlen round sem
          roundsValue.length === 0 ? (
            <input
              type="date"
              value={(dateValue || '').slice(0, 10)}
              onChange={(e) => setDateValue(e.target.value)}
            />
          ) : (
            <p>{getNextUpcomingDeadline(roundsValue) ? formatDateOnly(getNextUpcomingDeadline(roundsValue)!) : '—'}</p>
          )
        ) : (
          <p>
            {getNextUpcomingDeadline(roundsValue)
              ? formatDateOnly(getNextUpcomingDeadline(roundsValue)!)
              : formatDateOnly(dateValue)}
          </p>
        )}
      </div>

      {roundsValue.length > 0 && (
        <div className="rounds-container">
          <h4>Rounds:</h4>
          <div className="add-round-container">
            {roundsValue.map((round, index) => {
              const hasAppliedToThisRound = applicationStates.some(
                (app) => app.keycloakUserId === user?.id && app.round?.id === round.id
              );
              const userApplicationForRound = applicationStates.find(
                (app) => app.keycloakUserId === user?.id && app.round?.id === round.id
              );

              return (
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
                    <>
                      {hasAppliedToThisRound && (
                        <>
                          <h4>You have already applied for this round.</h4>
                          <a
                            className="download-button-a"
                            href={`http://localhost:8081/api/applications/download/${userApplicationForRound?.id}`}
                            download
                          >
                            <button className="custom-button">Download file</button>
                          </a>
                        </>
                      )}
                      <div className="task-grid">
                        <h4>Description:</h4>
                        <p>{round.description}</p>
                        <h4>Deadline:</h4>
                        <p>
                          {round.deadline
                            ? formatDateOnly((round.deadline as string).slice(0, 10))
                            : '—'}
                        </p>
                        <h4>Review:</h4>
                        <p>
                          {(evaluationType === "TEXT" || evaluationType === "BOTH")
                            ? (userApplicationForRound?.reviewText ? userApplicationForRound.reviewText : 'no review yet')
                            : (userApplicationForRound?.reviewPoints != null ? `${userApplicationForRound.reviewPoints}/10` : 'no review yet')}
                          {evaluationType === "BOTH" && userApplicationForRound?.reviewPoints != null && (
                            <> ({userApplicationForRound.reviewPoints}/10)</>
                          )}
                        </p>
                      </div>
                      {!editable && (round as any).isActive && !hasAppliedToThisRound && !currentUserEliminated && (
                        <div className="upload-section">
                          <label htmlFor={`fileInput-${round.id}`} className="custom-button">
                            Choose a file...
                            <input
                              type="file"
                              id={`fileInput-${round.id}`}
                              accept=".zip"
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                setSelectedFiles((prev) => ({
                                  ...prev,
                                  [round.id as number]: file,
                                }));
                              }}
                            />
                          </label>

                          {/* Ha van kiválasztott fájl, mutassuk a nevét */}
                          {selectedFiles[round.id as number] && (
                            <p style={{ marginLeft: '10px' }}>
                              Selected file: {selectedFiles[round.id as number]?.name}
                            </p>
                          )}

                          <button
                            className="custom-button"
                            onClick={() => uploadToRound(round.id as number)}
                            disabled={!selectedFiles[round.id as number]}
                          >
                            Apply
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {editable && applicationStates.length > 0 && (
        <div className="rounds-container">
          <h4>Applications:</h4>
          <div className="add-round-container application">
            {applicationStates.map((application, index) => (
              <div
                key={application.id}
                className={`round-container application${editingReviewId === application.id ? ' editing' : ''}`}
              >
                <h4 className="round-title">Application {index + 1}:</h4>
                <div className="task-grid">
                  <h4>Round:</h4>
                  <p>Round {roundsValue.findIndex((r) => r.id === application.round?.id) + 1}</p>
                  <h4>Uploader:</h4>
                  <p>{application.keycloakUserName}</p>
                  <h4>Application Date:</h4>
                  <p>{formatDate(application.applicationDate)}</p>
                  {editingReviewId === application.id ? (
                    <>
                      <h4>Review:</h4>

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
                            // JAVÍTÁS ITT: undefined-ból null-t csinálunk a híváskor
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
                            // Cache-eljük az aktuális (mentett) értéket a local state-ből a Cancel funkcióhoz
                            setOriginalReviewCache(application.review);
                          }}
                          // Mivel a szülő div már figyel az !editing feltételre, ez már nem szükséges, de biztonsági okból bent hagyom:
                          disabled={editing}
                        >
                          Edit Review
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {editable && activeRound && (
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
                            disabled={alreadyEliminated} // már elimináltat nem kell újra jelölni
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


      {editable && (
        <>
          {/* TASK fő gombok: Csak akkor jelennek meg, ha sem a TASK, sem a REVIEW nincs szerkesztés alatt */}
          {!editing && !isAnyReviewEditing && (
            <div className="buttons-container">
              <button
                className="custom-button"
                onClick={() => {
                  setEditing(true);
                  // Amikor elkezdjük a Task főszerkesztését, bezárjuk a Review szerkesztő ablakot
                  setEditingReviewId(null);
                }}
              >
                Edit
              </button>
              <button className="custom-button" onClick={handleDelete}>
                Delete task
              </button>
            </div>
          )}
          {editing && (
            <div className="buttons-container">
              <button className="custom-button" onClick={handleSave}>
                Save
              </button>
              <button className="custom-button" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          )}
          {editable && activeRound && (
            <div className="buttons-container">
              {/* csak ha lejárt */}
              {isBeforeToday(activeRound.deadline as string) && (
                <button className="custom-button" onClick={activateNextRound}>
                  Activate next round
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}