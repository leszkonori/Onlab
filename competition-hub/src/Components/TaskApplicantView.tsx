import React from 'react';
import { ApplicationType, EvaluationType, RoundType } from '../types';
import { useKeycloak } from '../KeycloakProvider';
import { formatDateOnly } from './TaskUtils';
// Az alkalmazás specifikus stílusok importálása, még ha nincsenek is szétválasztva a Task.css-ből.
import './Task.css';

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
  roundsValue: RoundType[];
  applicationStates: ApplicationType[];
  selectedFiles: { [roundId: number]: File | null };
  setSelectedFiles: React.Dispatch<React.SetStateAction<{ [roundId: number]: File | null }>>;
  uploadToRound: (roundId: number) => Promise<void>;
  currentUserEliminated: boolean;
  evaluationType: EvaluationType;
}) {
  const { user } = useKeycloak();

  if (roundsValue.length === 0) {
    return null; // Ha nincsenek fordulók, ez a nézet nem mutat semmit, mivel az alapinformációkat a Task.tsx jeleníti meg.
  }

  return (
    <div className="rounds-container">
      <h4>Rounds:</h4>
      <div className="add-round-container">
        {roundsValue.map((round, index) => {
          // Meghatározzuk, hogy a felhasználó pályázott-e már az adott fordulóra
          const hasAppliedToThisRound = applicationStates.some(
            (app) => app.keycloakUserId === user?.id && app.round?.id === round.id
          );
          // Megkeressük a felhasználó adott fordulóra vonatkozó pályázatát a review miatt
          const userApplicationForRound = applicationStates.find(
            (app) => app.keycloakUserId === user?.id && app.round?.id === round.id
          );

          return (
            <div key={index} className="round-container">
              <h4 className="round-title">Round {index + 1}:</h4>
              <>
                {hasAppliedToThisRound && (
                  <>
                    <h4>You have already applied for this round.</h4>
                    {/* Fájl letöltés linkje */}
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
                    {/* A review megjelenítése az evaluationType alapján */}
                    {(evaluationType === "TEXT" || evaluationType === "BOTH")
                      ? (userApplicationForRound?.reviewText ? userApplicationForRound.reviewText : 'no review yet')
                      : (userApplicationForRound?.reviewPoints != null ? `${userApplicationForRound.reviewPoints}/10` : 'no review yet')}
                    {evaluationType === "BOTH" && userApplicationForRound?.reviewPoints != null && (
                      <> ({userApplicationForRound.reviewPoints}/10)</>
                    )}
                  </p>
                </div>
                {/* Feltöltési szekció: Csak akkor jelenik meg, ha:
                    1. Nem a Task creator nézi (ez a TaskApplicantView a nem-szerkeszthető nézet)
                    2. A forduló aktív (isActive: true)
                    3. A felhasználó még nem pályázott erre a fordulóra
                    4. A felhasználó nincs eliminálva */}
                {!hasAppliedToThisRound && (round as any).isActive && !currentUserEliminated && (
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
            </div>
          );
        })}
      </div>
    </div>
  );
}