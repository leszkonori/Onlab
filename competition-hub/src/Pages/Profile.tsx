import { Link } from "react-router-dom";
import button from "../Components/button";
import PageTitle from "../Components/PageTitle";
import { useKeycloak } from "../KeycloakProvider";
import '../styles/Profile.css';
import { useEffect, useState } from "react";
import { ApplicationType, TaskType } from "../types";

export default function Profile() {
    const { user, isAuthenticated, hasRole, logout } = useKeycloak();

    const [tasks, setTasks] = useState<TaskType[]>([]);
    const [appliedTasks, setAppliedTasks] = useState<TaskType[]>([]);

    useEffect(() => {
        fetch("http://localhost:8081/api/tasks")
            .then((res) => res.json())
            .then((data) => setTasks(data))
            .catch((err) => console.error("Error loading the tasks:", err));


        fetch(`http://localhost:8081/api/users/applications/${user?.username}`)
            .then((res) => res.json())
            .then((data: ApplicationType[]) => {
                // Kivesszük a Task objektumokat a Application listából
                const appliedTasksData = data.map(application => application.task);
                setAppliedTasks(appliedTasksData);
            })
            .catch((err) => console.error("Error loading applied tasks:", err));

    }, [isAuthenticated, user?.username]);

    return (
        <>
            <div className="flex justify-between">
                <div>
                    <button>
                        <Link to="/">Főoldal</Link>
                    </button>
                </div>
                <div>
                    <button>
                        <Link to="/active-tasks">Aktív feladatkiírások</Link>
                    </button>
                </div>
            </div>
            <PageTitle>Your profile</PageTitle>
            <div className="profile-content">
                <h4 className="flex justify-end">Username:</h4>
                <p>{user?.username}</p>
                <h4 className="flex justify-end">Tasks you applied for:</h4>
                <ul>
                    {appliedTasks.map(task => (
                        <li key={task.id}>
                            <Link to={`/task/${task.id}`}>{task.title}</Link>
                        </li>
                    ))}
                </ul>
                <h4 className="flex justify-end">Your tasks:</h4>
                <ul>
                    {tasks.filter(t => t.creator === user?.username).map(t => (
                        <li key={t.id}>
                            <Link to={`/apply/${t.id}`}>{t.title}</Link>
                        </li>
                    ))}
                </ul>
            </div>
        </>
    );
}