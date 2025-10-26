import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Task.css';
import { ApplicationType, EvaluationType, RoundType } from '../types';
import { useKeycloak } from '../KeycloakProvider';

// Nézetek
import TaskApplicantView from './TaskApplicantView';
import TaskCreatorView from './TaskCreatorView';

// Új: utilok a TaskUtils-ból
import {
  formatDateOnly,
  getNextUpcomingDeadline,
  isBeforeToday,
} from './TaskUtils';

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

  // Eliminálás
  const [eliminatedApplicants, setEliminatedApplicants] = useState<string[]>([]);
  const [selectedToEliminate, setSelectedToEliminate] = useState<Set<string>>(new Set());

  // Feltöltés (applicant)
  const [selectedFiles, setSelectedFiles] = useState<{ [roundId: number]: File | null }>({});

  // Review szerkesztés (creator)
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [originalReviewCache, setOriginalReviewCache] = useState<string | undefined | null>(undefined);
  const isAnyReviewEditing = editingReviewId !== null;

  const navigate = useNavigate();

  // Creator/applicant jelző „megtekintve”
  useEffect(() => {
    if (editable) {
      fetch(`http://localhost:8081/api/tasks/${id}/touch-view`, { method: 'PUT' }).catch(() => {});
    }
    if (!editable && user?.username) {
      fetch(`http://localhost:8081/api/applications/tasks/${id}/touch-review-view/${user?.username}`, {
        method: 'PUT',
      }).catch(() => {});
    }
  }, [id, editable, user?.username]);

  // Eliminált felhasználók betöltése
  useEffect(() => {
    async function loadEliminated() {
      try {
        const res = await fetch(`http://localhost:8081/api/tasks/${id}`);
        if (!res.ok) return;
        const taskJson = await res.json();
        setEliminatedApplicants(taskJson.eliminatedApplicants ?? []);
      } catch (e) {
        console.error('Failed to load eliminated applicants', e);
      }
    }
    loadEliminated();
  }, [id]);

  // Aktív forduló és társai
  const activeRound = (roundsValue || []).find((r) => (r as any).isActive) || null;
  const activeRoundApplications = activeRound
    ? (applicationStates || []).filter((app) => app.round?.id === activeRound.id)
    : [];
  const activeRoundUsernames = Array.from(new Set(activeRoundApplications.map((a) => a.keycloakUserName))).sort();

  const currentUserEliminated = user?.username ? eliminatedApplicants.includes(user.username) : false;

  // ---------- Műveletek ----------
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

  const handleRoundChange = (index: number, field: 'description' | 'deadline', value: string) => {
    const updatedRounds = [...roundsValue];
    updatedRounds[index] = { ...updatedRounds[index], [field]: value };
    setRoundsValue(updatedRounds);
  };

  async function handleSave() {
    try {
      const cleanedRounds = roundsValue.map(({ applications: _apps, ...rest }) => ({
        ...rest,
        deadline: (rest.deadline as string | undefined)?.slice(0, 10) || '',
      }));

      const payload: any = {
        title: titleValue,
        description: descrValue,
        rounds: cleanedRounds,
        ...(cleanedRounds.length === 0 ? { applicationDeadline: (dateValue || '').slice(0, 10) } : {}),
      };

      const response = await fetch(`http://localhost:8081/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to update task');

      alert('Task updated successfully!');
      setEditing(false);
      onSave?.();
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task');
    }
  }

  async function handleSaveReview(appId: number, text: string | null, points: number | null) {
    try {
      const response = await fetch(`http://localhost:8081/api/applications/${appId}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, points }),
      });
      if (!response.ok) throw new Error('Failed to update review');

      alert('Review updated successfully!');
      setEditingReviewId(null);
      setOriginalReviewCache(undefined);

      setApplicationStates((prev) =>
        prev.map((app) => (app.id === appId ? { ...app, reviewText: text ?? undefined, reviewPoints: points } : app))
      );
      onSave?.();
    } catch (error) {
      console.error('Error updating review:', error);
      alert('Failed to update review');
    }
  }

  const handleCancelReviewEdit = (appId: number) => {
    const originalReview = originalReviewCache === null ? undefined : originalReviewCache;
    setApplicationStates((prev) => prev.map((app) => (app.id === appId ? { ...app, review: originalReview } : app)));
    setOriginalReviewCache(undefined);
    setEditingReviewId(null);
  };

  const handleReviewTextChange = (id: number, newText: string) => {
    setApplicationStates((prev) => prev.map((app) => (app.id === id ? { ...app, reviewText: newText } : app)));
  };

  const handleReviewPointsChange = (id: number, newPointsStr: string) => {
    const val = newPointsStr === '' ? null : Math.max(0, Math.min(10, Number(newPointsStr)));
    setApplicationStates((prev) => prev.map((app) => (app.id === id ? { ...app, reviewPoints: val } : app)));
  };

  function toggleSelect(username: string) {
    setSelectedToEliminate((prev) => {
      const next = new Set(prev);
      if (next.has(username)) next.delete(username);
      else next.add(username);
      return next;
    });
  }

  async function saveElimination() {
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
      } else {
        const msg = await res.text();
        alert('Nem sikerült menteni: ' + msg);
      }
    } catch (e) {
      console.error(e);
      alert('Hálózati hiba az eliminálás mentése közben.');
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm('Are you sure you want to delete this task?');
    if (!confirmed) return;
    try {
      const response = await fetch(`http://localhost:8081/api/tasks/${id}`, { method: 'DELETE' });
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

  async function activateNextRound() {
    const res = await fetch(`http://localhost:8081/api/tasks/${id}/activate-next`, { method: 'PUT' });
    if (res.ok) {
      alert('Next round activated.');
      onSave?.();
    } else {
      const txt = await res.text();
      alert('Cannot activate next round: ' + txt);
    }
  }

  // ---------- Render ----------
  return (
    <div className="task-container">
      {/* Fejléc blokk */}
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

      {/* Nézetek szétválasztva */}
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

      {/* Láb: műveleti gombok a creator számára */}
      {editable && (
        <>
          {!editing && !isAnyReviewEditing && (
            <div className="buttons-container">
              <button
                className="custom-button"
                onClick={() => {
                  setEditing(true);
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
              {/* csak ha lejárt (nem ma) */}
              {isBeforeToday(activeRound.deadline) && (
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