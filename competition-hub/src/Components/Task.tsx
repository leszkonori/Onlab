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
                navigate('/active-tasks');
            } else {
                alert('Error: Could not delete the task!');
            }
        } catch (error) {
            console.error('Error deleting task:', error);
            alert('There was an error while deleting the task.');
        }
    }

    return (
        <div className="task-container">
            <div className="grid-wrapper">
                <div className="task-grid">
                    <h4 className="flex justify-end">Task name:</h4>
                    <div className="flex gap-1.5">
                        {editing ? (
                            <input type="text" value={titleValue} onChange={(e) => setTitleValue(e.target.value)} />
                        ) : (
                            <h4>{title}</h4>
                        )}
                    </div>

                    <h4 className="flex justify-end">Description:</h4>
                    <div className="flex items-center gap-1.5">
                        {editing ? (
                            <textarea value={descrValue} onChange={(e) => setDescrValue(e.target.value)} />
                        ) : (
                            <p>{descr}</p>
                        )}
                    </div>

                    <h4 className="flex justify-end">Application deadline:</h4>
                    <div className="flex gap-1.5">
                        {editing ? (
                            <input type="date" value={dateValue} onChange={(e) => setDateValue(e.target.value)} />
                        ) : (
                            <p>{date}</p>
                        )}
                    </div>

                    {/* Fordulók */}
                    {rounds && rounds.length > 0 && (
                        <div className="mt-4">
                            <h4 className="flex justify-end">Rounds:</h4>
                            <div>
                                {roundsValue.map((round, index) => (
                                    <div key={index} className="round-container">
                                        {editing ? (
                                            <>
                                                <input
                                                    type="text"
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
                                            </>
                                        ) : (
                                            <>
                                                <p>Description: {round.description}</p>
                                                <p>Deadline: {round.deadline}</p>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {applicationStates.length > 0 && (
                        <div className="mt-4">
                            <h4 className="flex justify-end">Applications:</h4>
                            <div>
                                {applicationStates.map((application, index) => (
                                    <div key={index} className="application-container">
                                        <p>Applicant: {application.user.username}</p>
                                        <p>File Path: {application.filePath}</p>
                                        <p>Application Date: {new Date(application.applicationDate).toLocaleDateString()}</p>
                                        <a
                                            href={`http://localhost:8081/uploads/${application.filePath}`}
                                            download
                                            style={{ color: 'black' }}
                                        >
                                            Download
                                        </a>

                                        {editable ? (
                                            <div className="review-editor">
                                                <textarea
                                                    value={application.review || ''}
                                                    placeholder="Write review..."
                                                    onChange={(e) => handleReviewChange(index, e.target.value)}
                                                />
                                                <button onClick={() => saveReview(application.id, applicationStates[index].review || '')}>
                                                    Save Review
                                                </button>
                                            </div>
                                        ) : (
                                            application.review && <p><strong>Review:</strong> {application.review}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {editable && (
                    <>
                        {!editing && (
                            <>
                                <button onClick={() => setEditing((prev) => !prev)}>Edit</button>
                                <button onClick={handleDelete}>Delete task</button>
                            </>
                        )}
                        {editing && (
                            <>
                                <button onClick={handleSave}>Save</button>
                                <button onClick={() => setEditing(false)}>Cancel</button>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}