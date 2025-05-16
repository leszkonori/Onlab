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
                <h4>Application deadline:</h4>
                {editing ? (
                    <input type="date" value={dateValue} onChange={(e) => setDateValue(e.target.value)} />
                ) : (
                    <p>{date}</p>
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
                                        <p>{round.deadline}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {applications && applications.length > 0 && (
                <div className="mt-4">
                    <h4 className="flex justify-end">Applications:</h4>
                    <div>
                        {applications.map((application, index) => (
                            <div key={index} className="application-container">
                                <p>File Path: {application.filePath}</p>
                                <p>Application Date: {new Date(application.applicationDate).toLocaleDateString()}</p>
                                <a
                                    href={`http://localhost:8081/uploads/${application.filePath}`} // A filePath elérhetősége a szerveren
                                    download
                                    style={{ color: "black" }}
                                >
                                    Download
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {editable && (
                <>
                    {!editing && (
                        <>
                            <button className="custom-button" onClick={() => setEditing((prev) => !prev)}>Edit</button>
                            <button className="custom-button" onClick={handleDelete}>Delete task</button>
                        </>
                    )}
                    {editing && (
                        <>
                            <button className="custom-button" onClick={handleSave}>Save</button>
                            <button className="custom-button" onClick={() => setEditing(false)}>Cancel</button>
                        </>
                    )}
                </>
            )}
        </div>
    );
}