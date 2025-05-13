import { useState } from "react";
import { useKeycloak } from "../KeycloakProvider";

export default function NewTask() {
    const { user, isAuthenticated, hasRole, logout } = useKeycloak();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [deadline, setDeadline] = useState("");

    const handleSubmit = () => {
        const task = {
            title,
            description,
            applicationDeadline: deadline,
            creator: user?.username,
        };

        fetch("http://localhost:8081/api/tasks", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(task),
        })
            .then((res) => {
                if (!res.ok) throw new Error("Save unsuccessful");
                return res.json();
            })
            .then((data) => {
                alert("Save successful!");
                setTitle("");
                setDescription("");
                setDeadline("");
            })
            .catch((err) => {
                alert("Error: " + err.message);
            });
    };

    return (
        <div className="task-container">
            <div className="grid-wrapper">
                <div className="task-grid">
                    <h4 className="flex justify-end">Task name:</h4>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <h4 className="flex justify-end">Description:</h4>
                    <textarea
                        className="w-80 h-40"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <h4 className="flex justify-end">Application deadline:</h4>
                    <input
                        type="date"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                    />
                </div>
            </div>

            <button className="flex justify-self-center" onClick={handleSubmit}>Save</button>
        </div>

    );
}