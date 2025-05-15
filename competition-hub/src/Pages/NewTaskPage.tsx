import { Link, Navigate } from "react-router-dom";
import PageTitle from "../Components/PageTitle";
import NewTask from "../Components/NewTask";
import { useKeycloak } from "../KeycloakProvider";

export default function NewTaskPage() {
    const { user, isAuthenticated, hasRole, logout } = useKeycloak();

    if (hasRole('admin')) {
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
                    <h2 className="page-title">Create a new task</h2>
                </div>
                <NewTask />
            </div>
        );
    } else {
        return <Navigate to="/" />;
    }

}