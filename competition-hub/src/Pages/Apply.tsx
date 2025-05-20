import { Link, useParams } from "react-router-dom";
import PageTitle from "../Components/PageTitle";
import Task from "../Components/Task";
import './Apply.css';
import { useEffect, useState } from "react";
import { TaskType } from "../types";
import { useKeycloak } from "../KeycloakProvider";

export default function Apply() {
    const { id } = useParams<{ id: string }>();
    const [task, setTask] = useState<TaskType | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [message, setMessage] = useState("");
    const { user, isAuthenticated, hasRole, logout } = useKeycloak();

    useEffect(() => {
        fetch(`http://localhost:8081/api/tasks/${id}`)
            .then((res) => {
                if (!res.ok) throw new Error("Request for task was unsuccessful");
                return res.json();
            })
            .then((data) => setTask(data))
            .catch((err) => console.error("Error: ", err));
    }, [id]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) {
            setFile(e.target.files[0]);
        }
    };

    const handleApply = async () => {
        if (!file || !id || !user) return;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("keycloakUserId", user.id);

        try {
            const res = await fetch(`http://localhost:8081/api/applications/${id}`, {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                setMessage("File uploaded successfully!");
                alert("File uploaded successfully!");
            } else {
                const errText = await res.text();
                setMessage("Error: " + errText);
                alert("Error: " + errText);
            }
        } catch (error) {
            setMessage("Error occured during file upload");
            alert("Error occured during file upload");
        }
    };

    return (
        <div className="page-container">
            <div className="menu-container">
                <button className="custom-button">
                    <Link to="/">Main Page</Link>
                </button>
                <button className="custom-button">
                    <Link to="/profile">Profile</Link>
                </button>
                <button className="custom-button" onClick={logout}>Logout</button>
            </div>
            <div className="page-title-container">
                <h2 className="page-title">{task?.title}</h2>
            </div>
            {task && <Task
                id={task.id}
                title={task.title}
                descr={task.description}
                date={task.applicationDeadline}
                rounds={task.rounds}
                applications={task.applications}
                editable={user?.username === task.creator}
            />}
            {task?.applications?.some(app => app.keycloakUserId === user?.id) && (
                <>
                    <p>You have already applied for this task.</p>
                    <a className="download-button-a"
                        href={`http://localhost:8081/api/applications/download/${task?.applications?.find(app => app.keycloakUserId === user?.id)?.id}`}
                        download
                    >
                        <button className="custom-button">Download file</button>
                    </a>
                    {task?.applications?.find(app => app.keycloakUserId === user?.id)?.review && (
                        <>
                            <h4>Review:</h4>
                            <p>{task?.applications?.find(app => app.keycloakUserId === user?.id)?.review}</p>
                        </>
                    )}
                </>

            )}
            {task?.creator !== user?.username && !!!task?.applications?.some(app => app.keycloakUserId === user?.id) && (<>
                <div className="upload-section">
                    <h4>Upload a file:</h4>
                    <button className="custom-button">
                        <label htmlFor="fileInput">Choose a file...</label>
                        <input type="file" id="fileInput" accept=".zip" style={{ display: 'none' }} onChange={handleFileChange} />
                    </button>
                    <h4>(Expected file format: .zip)</h4>
                </div>
                <button className="custom-button" onClick={handleApply}>Apply</button>
            </>
            )}
        </div>
    );
}