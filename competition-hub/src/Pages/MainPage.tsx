import './MainPage.css';
import { Link } from "react-router-dom";
import { useKeycloak } from "../KeycloakProvider";
import ActiveTasks from './ActiveTasks';
import { useEffect, useState } from 'react';

export default function MainPage() {

    const { user, isAuthenticated, hasRole, logout } = useKeycloak();

    const [newApplicationsCount, setNewApplicationsCount] = useState(0);

    const creatorIdentifier = user?.username;

    // ÚJ EFFECT: Értesítések lekérdezése
    useEffect(() => {
        // Csak bejelentkezett és "creator" szerepkörrel rendelkező felhasználóknak (feltételezzük, hogy ők a Task kiírók)
        if (!isAuthenticated || !creatorIdentifier) {
            setNewApplicationsCount(0);
            return;
        }

        // Hacsak nem csak a 'creator' szerepkörrel rendelkezőknek kell látniuk
        // if (!hasRole('creator')) { return; } 

        async function fetchNotifications() {
            try {
                // Az új API endpoint meghívása
                const response = await fetch(`http://localhost:8081/api/tasks/notifications/new/${creatorIdentifier}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch notifications');
                }

                const totalCount: number = await response.json();
                setNewApplicationsCount(totalCount);

            } catch (error) {
                console.error("Error fetching notifications:", error);
                setNewApplicationsCount(0);
            }
        }

        fetchNotifications();

        // Rendszeres frissítés a háttérben (opcionális: pl. 30 másodpercenként)
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);

    }, [isAuthenticated, creatorIdentifier]); // HasRole-t kivettem, ha minden bejelentkezett felhasználó lehet creator

    return (
        <div className="page-container">
            <div className="main-title-container">

                {/* ÚJ ÉRTESÍTÉSEK GOMB */}
                {isAuthenticated && ( // Ha csak bejelentkezettek lehetnek kiírók
                    <button className="custom-button notification-button">
                        <Link to="/profile" className="notification-link">
                            Értesítések
                            {/* A jelvény megjelenítése, ha van új értesítés */}
                            {newApplicationsCount > 0 && (
                                <span className="notification-badge">
                                    {newApplicationsCount > 99 ? '99+' : newApplicationsCount}
                                </span>
                            )}
                        </Link>
                    </button>
                )}

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
            <ActiveTasks />
        </div>
    );
}