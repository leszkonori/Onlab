import './MainPage.css';
import { Link, useNavigate } from "react-router-dom";
import { useKeycloak } from "../KeycloakProvider";
import ActiveTasks from './ActiveTasks';
import { useState, useEffect, useRef } from 'react';

// Típusdefiníció az értesítési adatoknak
interface Notification {
    taskId: number;
    taskTitle: string;
    newApplicationsCount: number;
    type: 'NEW_APPLICATION' | 'NEW_REVIEW' | 'ELIMINATION'; // Kétféle értesítés megkülönböztetése
}

export default function MainPage() {

    const { user, isAuthenticated, logout } = useKeycloak();
    const navigate = useNavigate();

    // Taskok listája, amikhez érkezett új application/review
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const creatorIdentifier = user?.username;

    const totalNewCount = notifications.reduce((sum, item) => sum + item.newApplicationsCount, 0);

    // Külön függvény a notifikációk lekérésére
    const fetchNotifications = async () => {
        if (!isAuthenticated || !creatorIdentifier) {
            setNotifications([]);
            return;
        }

        try {
            // 1. Task Creator Notifications (Új Application-ök)
            const creatorResponse = await fetch(`http://localhost:8081/api/tasks/notifications/${creatorIdentifier}`);
            const creatorData: Notification[] = (await creatorResponse.json()).map((n: any) => ({
                ...n,
                type: 'NEW_APPLICATION',
                taskTitle: `${n.taskTitle} (Új jelentkezők)`, // Megkülönböztetés a listában
                newApplicationsCount: n.newApplicationsCount
            }));

            // 2. Applicant Notifications (Új Review-k)
            const applicantResponse = await fetch(`http://localhost:8081/api/applications/notifications/${creatorIdentifier}`);
            const applicantData: Notification[] = (await applicantResponse.json()).map((n: any) => ({
                ...n,
                type: 'NEW_REVIEW',
                taskTitle: `${n.taskTitle} (Új bírálatok)`, // Megkülönböztetés a listában
                newApplicationsCount: n.newApplicationsCount
            }));

            // 3. Eliminált értesítések (új)
            const elimResponse = await fetch(`http://localhost:8081/api/applications/elimination-notifications/${creatorIdentifier}`);
            const elimData: Notification[] = (await elimResponse.json()).map((n: any) => ({
                ...n,
                type: 'ELIMINATION' as const,
                taskTitle: `${n.taskTitle} (Eliminálva)`,
                newApplicationsCount: n.newApplicationsCount ?? 1
            }));

            // Összefűzés és rendezés Task ID szerint
            const mergedNotifications = [...creatorData, ...applicantData, ...elimData];
            setNotifications(mergedNotifications);

        } catch (error) {
            console.error("Error fetching notifications:", error);
            setNotifications([]);
        }
    };

    // ... (useEffect hookok, handleTaskClick változatlan) ...
    useEffect(() => {
        fetchNotifications();

        // Rendszeres frissítés (pl. 30 másodpercenként)
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [isAuthenticated, creatorIdentifier]);

    useEffect(() => {
        // ... (kívülre kattintás logika változatlan) ...
    }, []);

    const handleTaskClick = async (taskId: number, type?: Notification['type']) => {
        setIsDropdownOpen(false);

        if (type === 'ELIMINATION' && creatorIdentifier) {
            try {
                await fetch(`http://localhost:8081/api/applications/tasks/${taskId}/touch-elimination-view/${creatorIdentifier}`, {
                    method: 'PUT'
                });
            } catch (e) {
                console.warn('Elimination seen jelzés nem sikerült.', e);
                // ettől még navigálunk tovább
            }
        }

        navigate(`/apply/${taskId}`);
    };

    return (
        <div className="page-container">
            <div className="main-title-container">
                <h1 className="main-title">Competition Hub</h1>
            </div>
            <div className="page-title-container">
                <h2 className="page-title">Active tasks</h2>
            </div>
            <div className="menu-container">

                {isAuthenticated && (
                    <div ref={dropdownRef} className="notification-dropdown-container">
                        <button
                            className="custom-button notification-button"
                            onClick={() => setIsDropdownOpen(prev => !prev)}
                        >
                            Értesítések
                            {/* Jelvény a teljes számhoz */}
                            {totalNewCount > 0 && (
                                <span className="notification-badge">
                                    {totalNewCount > 99 ? '99+' : totalNewCount}
                                </span>
                            )}
                        </button>

                        {/* A tényleges legördülő lista (tartalom változatlan) */}
                        {isDropdownOpen && totalNewCount > 0 && (
                            <div className="notification-dropdown">
                                {notifications.map((n) => (
                                    <div
                                        key={`${n.taskId}-${n.type}`} // Task ID + Type (kulcsként)
                                        className="dropdown-item"
                                        onClick={() => handleTaskClick(n.taskId, n.type)}
                                    >
                                        <div className="dropdown-task-title">{n.taskTitle}</div>
                                        <div className="dropdown-count">{n.newApplicationsCount} új</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <button className="custom-button">
                    <Link to="/profile">Profile</Link>
                </button>
                <button className="custom-button" onClick={logout}>Logout</button>
            </div>
            <ActiveTasks />
        </div>
    );
}