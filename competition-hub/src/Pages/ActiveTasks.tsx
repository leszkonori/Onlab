import { Link } from "react-router-dom";
import Button from "../Components/Button";
import PageTitle from "../Components/PageTitle";
import ListCard from "../Components/ListCard";
import { useKeycloak } from "../KeycloakProvider";
import { useEffect, useState } from "react";
import { TaskType } from "../types";

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
            <div className="apply-header">
                <Button>
                    <Link to="/">Főoldal</Link>
                </Button>
                <Button>
                    <Link to="/profile">Profile</Link>
                </Button>
            </div>
            <PageTitle>Aktív feladatok</PageTitle>
            <div className="flex flex-col gap-3 mt-10">
                {tasks.map((task) => (
                    <ListCard
                        key={task.id}
                        title={task.title}
                        descr={task.description}
                        link={`/apply/${task.id}`} // vagy akár csak /apply ha nincs részletes oldal
                        //link={`/apply`}
                    />
                ))}
            </div>
            {hasRole('admin') &&
                <Button>
                    <Link to="/new-task">Create a new task</Link>
                </Button>}
        </>
    );
}