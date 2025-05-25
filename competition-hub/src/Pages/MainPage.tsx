import './MainPage.css';
import { Link } from "react-router-dom";
import { useKeycloak } from "../KeycloakProvider";
import ActiveTasks from './ActiveTasks';

export default function MainPage() {

    const { user, isAuthenticated, hasRole, logout } = useKeycloak();

    return (
        <div className="page-container">
            <div className="main-title-container">
                <h1 className="main-title">Competition Hub</h1>
            </div>
            <div className="page-title-container">
                <h2 className="page-title">Active tasks</h2>
            </div>
            <div className="menu-container">
                <button className="custom-button">
                    <Link to="/profile">Profile</Link>
                </button>
                <button className="custom-button" onClick={logout}>Logout</button>
            </div>
            <ActiveTasks/>
        </div>
    );
}