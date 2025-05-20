import { Link } from "react-router-dom";
import PageTitle from "../Components/PageTitle";
import { useKeycloak } from "../KeycloakProvider";
import '../styles/Profile.css';
import { useEffect, useState } from "react";
import { ApplicationType, TaskType } from "../types";
import ListCard from "../Components/ListCard";

export default function Profile() {
    const { user, isAuthenticated, hasRole, logout } = useKeycloak();

    const [tasks, setTasks] = useState<TaskType[]>([]);
    const [appliedTasks, setAppliedTasks] = useState<TaskType[]>([]);

    useEffect(() => {
        fetch("http://localhost:8081/api/tasks")
            .then((res) => res.json())
            .then((data) => setTasks(data))
            .catch((err) => console.error("Error loading the tasks:", err));

    }, [isAuthenticated, user?.username]);

    useEffect(() => {
        if (!user?.id) return;

        fetch(`http://localhost:8081/api/applications/by-user/${user.id}`)
            .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch applications");
                return res.json();
            })
            .then((data: ApplicationType[]) => {
                // Az Application objektum task mezőjét kivesszük
                const appliedTasksData = data
                    .filter(app => app.task !== undefined && app.task !== null)
                    .map(app => app.task);
                setAppliedTasks(appliedTasksData);
                console.log(appliedTasks);
            })
            .catch((err) => console.error("Error loading applied tasks:", err));
    }, [user?.id]);

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
                <h2 className="page-title">Profile</h2>
            </div>
            <div className="profile-container">
                <div className="profile-grid-wrapper">
                    <div className="profile-grid">
                        <h4>Username:</h4>
                        <p>{user?.username}</p>
                        <h4>Tasks you applied for:</h4>
                        <ul className="my-task-list">
                            {appliedTasks.map(task => (
                                <li key={task.id}>
                                    <ListCard title={task.title} descr="" link={`/apply/${task.id}`} />
                                </li>
                            ))}
                        </ul>
                        <h4>Your tasks:</h4>
                        <ul className="my-tasks-list">
                            {tasks.filter(t => t.creator === user?.username).map(t => (
                                <li key={t.id}>
                                    <ListCard title={t.title} descr="" link={`/apply/${t.id}`} />
                                </li>
                            ))}

                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}