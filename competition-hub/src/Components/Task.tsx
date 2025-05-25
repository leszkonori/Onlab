import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Task.css';
import { ApplicationType, RoundType } from '../types';
import { useKeycloak } from '../KeycloakProvider';

export default function Task({ id, title, descr, date, rounds, applications, editable, onSave }: { id: number, title: string, descr: string, date: string, rounds?: RoundType[], applications?: ApplicationType[], editable: boolean, onSave?: () => void; }) {

    const [editing, setEditing] = useState(false);
    const [titleValue, setTitleValue] = useState(title);
    const [descrValue, setDescrValue] = useState(descr);
    const [dateValue, setDateValue] = useState(date);
    const [roundsValue, setRoundsValue] = useState(rounds || []);
    const [applicationStates, setApplicationStates] = useState(applications || []);
    const { user, isAuthenticated, hasRole, logout } = useKeycloak();

    const [selectedFiles, setSelectedFiles] = useState<{ [roundId: number]: File | null }>({});

    async function uploadToRound(roundId: number) {
        if (!user) return;

        const file = selectedFiles[roundId];
        if (!file) {
            alert("Please select a file first.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("keycloakUserId", user.id);
        formData.append("keycloakUserName", user.username);

        try {
            const response = await fetch(`http://localhost:8081/api/applications/${id}/round/${roundId}`, {
                method: 'POST',
                body: formData,
            });

            const result = await response.text();
            alert(result);
        } catch (e) {
            console.error("Upload error:", e);
            alert("Upload failed.");
        }
    }

    function formatDate(isoString: string | number | Date) {
        const date = new Date(isoString);

        return new Intl.DateTimeFormat('hu-HU', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    }

    function getNextUpcomingDeadline(rounds: RoundType[]): string | null {
        const now = new Date();

        const upcoming = rounds
            .map(round => ({ ...round, parsedDate: new Date(round.deadline) }))
            .filter(round => round.parsedDate > now)
            .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());

        return upcoming.length > 0 ? upcoming[0].deadline : null;
    }


    const navigate = useNavigate();

    const now = new Date();
    const upcomingRounds = roundsValue
        .filter(r => new Date(r.deadline) > now)
        .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    const activeRound = upcomingRounds.length > 0 ? upcomingRounds[0] : null;

    async function handleSave() {
        try {
            const cleanedRounds = roundsValue.map(({ applications, ...rest }) => rest);

            const response = await fetch(`http://localhost:8081/api/tasks/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: titleValue,
                    description: descrValue,
                    applicationDeadline: dateValue,
                    rounds: cleanedRounds
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to update task');
            }

            for (const app of applicationStates) {
                if (app.review != null) {
                    await fetch(`http://localhost:8081/api/applications/${app.id}/review`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ review: app.review }),
                    });
                }
            }

            alert('Task updated successfully!');
            setEditing(false);
            if(onSave) onSave();
        } catch (error) {
            console.error('Error updating task:', error);
            alert('Failed to update task');
        }
    }

    const handleRoundChange = (index: number, field: 'description' | 'deadline', value: string) => {
        const updatedRounds = [...roundsValue];
        updatedRounds[index] = { ...updatedRounds[index], [field]: value };
        setRoundsValue(updatedRounds);
    };

    const handleReviewChange = (index: number, newReview: string) => {
        const updated = [...applicationStates];
        updated[index] = { ...updated[index], review: newReview };
        setApplicationStates(updated);
    };

    const saveReview = async (appId: number, review: string) => {
        try {
            const res = await fetch(`http://localhost:8081/api/applications/${appId}/review`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ review }),
            });

            if (!res.ok) throw new Error('Failed to save review');
            alert('Review saved!');
        } catch (error) {
            console.error('Error saving review:', error);
            alert('Could not save review');
        }
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
        const updated = applicationStates.map((app) =>
            app.id === id ? { ...app, review: newReview } : app
        );
        setApplicationStates(updated);
    };


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
                <h4>{!rounds || rounds.length == 0 ? "Deadline:" : "Current round deadline:"}</h4>
                {editing ? (
                    <input type="date" value={dateValue} onChange={(e) => setDateValue(e.target.value)} />
                ) : (
                    <p>
                        {getNextUpcomingDeadline(roundsValue)
                            ? formatDate(getNextUpcomingDeadline(roundsValue)!)
                            : date}
                    </p>
                )}
            </div>
            {rounds && rounds.length > 0 && (
                <div className="rounds-container">
                    <h4>Rounds:</h4>
                    <div className="add-round-container">
                        {roundsValue.map((round, index) => {
                            const hasAppliedToThisRound = applicationStates.some(
                                app => app.keycloakUserId === user?.id && app.round?.id === round.id
                            );
                            const userApplicationForRound = applicationStates.find(
                                app => app.keycloakUserId === user?.id && app.round?.id === round.id
                            );

                            return (
                                <div key={index} className="round-container">
                                    <h4 className="round-title">Round {index + 1}:</h4>
                                    {editing ? (
                                        <div className="task-grid edit">
                                            <textarea
                                                value={round.description}
                                                onChange={(e) =>
                                                    handleRoundChange(index, 'description', e.target.value)
                                                }
                                            />
                                            <input
                                                type="datetime-local"
                                                value={round.deadline}
                                                onChange={(e) =>
                                                    handleRoundChange(index, 'deadline', e.target.value)
                                                }
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            {
                                                hasAppliedToThisRound && (
                                                    <>
                                                        <h4>You have already applied for this round.</h4>
                                                        <a className="download-button-a"
                                                            href={`http://localhost:8081/api/applications/download/${userApplicationForRound?.id}`}
                                                            download
                                                        >
                                                            <button className="custom-button">Download file</button>
                                                        </a>
                                                    </>
                                                )
                                            }
                                            <div className="task-grid">
                                                <h4>Description:</h4>
                                                <p>{round.description}</p>
                                                <h4>Deadline:</h4>
                                                <p>{formatDate(round.deadline)}</p>
                                                <h4>Review:</h4>
                                                <p>{userApplicationForRound?.review ? userApplicationForRound.review : "no review yet"}</p>
                                            </div>
                                            {!editable &&
                                                activeRound &&
                                                round.id === activeRound.id &&
                                                !hasAppliedToThisRound && (
                                                    <div className="upload-section">
                                                        <label htmlFor={`fileInput-${round.id}`} className="custom-button">
                                                            Choose a file...
                                                            <input
                                                                type="file"
                                                                id={`fileInput-${round.id}`}
                                                                accept=".zip"
                                                                style={{ display: 'none' }}
                                                                onChange={(e) =>
                                                                    setSelectedFiles(prev => ({
                                                                        ...prev,
                                                                        [round.id]: e.target.files?.[0] || null
                                                                    }))
                                                                }
                                                            />
                                                        </label>
                                                        <button
                                                            className="custom-button"
                                                            onClick={() => uploadToRound(round.id)}
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
                            <div key={application.id} className={`round-container application${editing ? " editing" : ""}`}
                            >
                                <h4 className="round-title">Application {index + 1}:</h4>
                                <div className="task-grid">
                                    <h4>Round:</h4>
                                    <p>
                                        Round {roundsValue.findIndex(r => r.id === application.round?.id) + 1}
                                    </p>
                                    <h4>Uploader:</h4>
                                    <p>{application.keycloakUserName}</p>
                                    <h4>Application Date:</h4>
                                    <p>{formatDate(application.applicationDate)}</p>
                                    {editing ? (
                                        <>
                                            <h4>Review:</h4>
                                            <textarea
                                                value={application.review || ''}
                                                onChange={(e) => handleReviewChange(application.id, e.target.value)}
                                            />
                                        </>

                                    ) : (
                                        <>
                                            <h4>Review:</h4>
                                            <p>{application.review ? application.review : "not reviewed"}</p>
                                        </>

                                    )}
                                </div>
                                <a className="download-button-a"
                                    href={`http://localhost:8081/api/applications/download/${application.id}`}
                                    download
                                >
                                    <button className="custom-button">Download file</button>
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {editable && (
                <>
                    {!editing && (
                        <div className="buttons-container">
                            <button className="custom-button" onClick={() => setEditing((prev) => !prev)}>Edit</button>
                            <button className="custom-button" onClick={handleDelete}>Delete task</button>
                        </div>
                    )}
                    {editing && (
                        <div className="buttons-container">
                            <button className="custom-button" onClick={handleSave}>Save</button>
                            <button className="custom-button" onClick={() => setEditing(false)}>Cancel</button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}