import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Task.css';
import { ApplicationType, RoundType } from '../types';

export default function Task({ id, title, descr, date, rounds, applications, editable }: { id: number, title: string, descr: string, date: string, rounds?: RoundType[], applications?: ApplicationType[], editable: boolean }) {

    const [editing, setEditing] = useState(false);
    const [titleValue, setTitleValue] = useState(title);
    const [descrValue, setDescrValue] = useState(descr);
    const [dateValue, setDateValue] = useState(date);
    const [roundsValue, setRoundsValue] = useState(rounds || []);
    const [applicationStates, setApplicationStates] = useState(applications || []);


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

    async function handleSave() {
        try {
            const response = await fetch(`http://localhost:8081/api/tasks/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: titleValue,
                    description: descrValue,
                    applicationDeadline: dateValue,
                    rounds: roundsValue,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to update task');
            }

            alert('Task updated successfully!');
            setEditing(false);
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

    async function handleDelete() {
        const confirmed = window.confirm('Are you sure you want to delete this task?');

        if (!confirmed) return;

        try {
            const response = await fetch(`http://localhost:8081/api/tasks/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                alert('Task deleted successfully!');
                navigate('/active-tasks');
            } else {
                alert('Error: Could not delete the task!');
            }
        } catch (error) {
            console.error('Error deleting task:', error);
            alert('There was an error while deleting the task.');
        }
    }

    const handleReviewChange = (id: number, newReview: string) => {
        const updated = applicationStates.map(app =>
            app.id === id ? { ...app, review: newReview } : app
        );
        setApplicationStates(updated);
    };

    const saveReview = async (appId: number, review: string | undefined) => {
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
                        {roundsValue.map((round, index) => (
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
                                    <div className="task-grid">
                                        <h4>Description:</h4>
                                        <p>{round.description}</p>
                                        <h4>Deadline:</h4>
                                        <p>{formatDate(round.deadline)}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {editable && applicationStates.length > 0 && (
                <div className="rounds-container">
                    <h4>Applications:</h4>
                    <div className="add-round-container">
                        {applicationStates.map((application, index) => (
                            <div key={application.id} className="round-container">
                                <h4 className="round-title">Application {index + 1}:</h4>
                                <div className="task-grid">
                                    <h4>Application Date:</h4>
                                    <p>{new Date(application.applicationDate).toLocaleDateString()}</p>
                                </div>
                                <a
                                    href={`http://localhost:8081/api/applications/download/${application.id}`}
                                    download
                                    style={{ color: "black" }}
                                >
                                    <button className="custom-button">Download file</button>
                                </a>
                                {editing ? (
                                    <>
                                        <textarea
                                            value={application.review || ''}
                                            onChange={(e) => handleReviewChange(application.id, e.target.value)}
                                        />
                                        <button onClick={() => saveReview(application.id, application.review)}>Save Review</button>
                                    </>
                                ) : (
                                    application.review && <p>Review: {application.review}</p>
                                )}
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