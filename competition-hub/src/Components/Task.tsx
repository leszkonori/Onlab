import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Task.css';

export default function Task({ id, title, descr, date, editable }: { id: number, title: string, descr: string, date: string, editable: boolean }) {

    const [editing, setEditing] = useState(false);
    const [titleValue, setTitleValue] = useState(title);
    const [descrValue, setDescrValue] = useState(descr);
    const [dateValue, setDateValue] = useState(date);

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
                            < input type="text" value={titleValue} onChange={(e) => setTitleValue(e.target.value)} />
                        ) : (
                            <h4>{title}</h4>
                        )
                        }
                    </div>
                    <h4 className="flex justify-end">Description:</h4>
                    <div className="flex items-center gap-1.5">

                        {editing ? (
                            < textarea value={descrValue} onChange={(e) => setDescrValue(e.target.value)} />
                        ) : (
                            <p>{descr}</p>
                        )
                        }
                    </div>
                    <h4 className="flex justify-end">Application deadline:</h4>
                    <div className="flex gap-1.5">

                        {editing ? (
                            < input type="date" value={dateValue} onChange={(e) => setDateValue(e.target.value)} />
                        ) : (
                            <p>{date}</p>
                        )
                        }
                    </div>
                </div>
            </div>
            {editable && (
                <>
                    {!editing && <>
                        <button onClick={() => setEditing(prev => !prev)}>Edit</button>
                        <button onClick={handleDelete}>Delete task</button>
                    </>}
                    {editing && <>
                        <button onClick={handleSave}>Save</button>
                        <button onClick={() => setEditing(false)}>Cancel</button>
                    </>
                    }
                </>
            )}
        </div>
    );
}