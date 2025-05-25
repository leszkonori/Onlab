import { Link } from "react-router-dom";
import ListCard from "../Components/ListCard";
import { useKeycloak } from "../KeycloakProvider";
import { useEffect, useState } from "react";
import { TaskType } from "../types";
import './ActiveTasks.css'

export default function ActiveTasks() {
    const { user, isAuthenticated, hasRole, logout } = useKeycloak();

    const [tasks, setTasks] = useState<TaskType[]>([]);

    useEffect(() => {
        fetch("http://localhost:8081/api/tasks")
            .then((res) => res.json())
            .then((data) => setTasks(data))
            .catch((err) => console.error("Error loading the tasks:", err));
    }, []);

    return (
        <>
            <ul className="task-list-container">
                {tasks.map((task) => (
                    <ListCard
                        key={task.id}
                        title={task.title}
                        descr={task.description}
                        link={`/apply/${task.id}`}
                    />
                ))}
            </ul>
            {hasRole('admin') &&
                <div>
                    <button className="custom-button">
                        <Link to="/new-task">Create a new task</Link>
                    </button>
                </div>
            }
        </>
    );
}