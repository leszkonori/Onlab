import { Link } from "react-router-dom";
import ListCard from "../Components/ListCard";
import { useKeycloak } from "../KeycloakProvider";
import { useEffect, useMemo, useState } from "react";
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

    const activeVisibleTasks = useMemo(() => {
        const now = new Date();

        return tasks.filter((task) => {
            // 1) deadline check
            // ha nincs deadline mező, akkor biztonság kedvéért engedjük át
            const deadlineOk = task.applicationDeadline
                ? new Date(task.applicationDeadline) > now
                : true;

            // 2) első round isActive check
            const firstRound = task.rounds && task.rounds[0];
            const firstRoundActive = firstRound ? firstRound.isActive === true : false;

            return deadlineOk && firstRoundActive;
        });
    }, [tasks]);

    return (
        <>
            <ul className="task-list-container">
                {activeVisibleTasks.map((task) => (
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