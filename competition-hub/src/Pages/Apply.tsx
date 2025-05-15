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
        if (!file || !id) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch(`http://localhost:8081/api/applications/${id}`, {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                setMessage("Fájl sikeresen feltöltve!");
            } else {
                const errText = await res.text();
                setMessage("Hiba: " + errText);
            }
        } catch (error) {
            setMessage("Hiba a feltöltés során.");
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
            {task?.creator !== user?.username && (<>
                <div className="upload-section">
                    <h4>Upload a file:</h4>
                    <button>
                        <label htmlFor="fileInput">Choose a file...</label>
                        <input type="file" id="fileInput" accept=".zip" style={{ display: 'none' }} onChange={handleFileChange} />
                    </button>
                    <h4>(Expected file format: .zip)</h4>
                </div>
                <button className="apply-button" onClick={handleApply}>Apply</button>
            </>
            )}
        </div>
    );
}