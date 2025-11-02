import { Link, useNavigate } from "react-router-dom";
// Útvonal a KeycloakProvider-hez (egy szinttel feljebb a Components mappához képest)
import { useKeycloak } from "../KeycloakProvider";
import { useState, useEffect, useRef } from 'react';
import './AppHeader.css'; // A CSS fájl azonos mappában van

// Típusdefiníció az értesítési adatoknak
interface Notification {
    taskId: number;
    taskTitle: string;
    newApplicationsCount: number;
    type: 'NEW_APPLICATION' | 'NEW_REVIEW' | 'ELIMINATION' | 'ROUND_ACTIVATED';
}

export default function AppHeader({ mainPageButton = true }: { mainPageButton?: boolean }) {
    // HasRole hozzáadva a "Create a new task" gomb miatt
    const { user, isAuthenticated, hasRole, logout } = useKeycloak();
    const navigate = useNavigate();

    // Notifikáció állapotok és logika áthelyezve a MainPage-ből
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
                taskTitle: `${n.taskTitle} (Új jelentkezők)`,
                newApplicationsCount: n.newApplicationsCount
            }));

            // 2. Applicant Notifications (Új Review-k)
            const applicantResponse = await fetch(`http://localhost:8081/api/applications/notifications/${creatorIdentifier}`);
            const applicantData: Notification[] = (await applicantResponse.json()).map((n: any) => ({
                ...n,
                type: 'NEW_REVIEW',
                taskTitle: `${n.taskTitle} (Új bírálatok)`,
                newApplicationsCount: n.newApplicationsCount
            }));

            // 3. Eliminált értesítések
            const elimResponse = await fetch(`http://localhost:8081/api/applications/elimination-notifications/${creatorIdentifier}`);
            const elimData: Notification[] = (await elimResponse.json()).map((n: any) => ({
                ...n,
                type: 'ELIMINATION' as const,
                taskTitle: `${n.taskTitle} (Eliminálva)`,
                newApplicationsCount: n.newApplicationsCount ?? 1
            }));

            // 4. Új forduló aktiválása
            const roundRes = await fetch(`http://localhost:8081/api/applications/round-activation-notifications/${creatorIdentifier}`);
            const roundData: Notification[] = (await roundRes.json()).map((n: any) => ({
                taskId: n.taskId,
                taskTitle: `${n.taskTitle} (Új forduló nyílt)`,
                newApplicationsCount: n.newApplicationsCount ?? 1,
                type: 'ROUND_ACTIVATED' as const,
            }));

            // Összefűzés és rendezés
            const mergedNotifications = [...creatorData, ...applicantData, ...elimData, ...roundData];
            setNotifications(mergedNotifications);

        } catch (error) {
            console.error("Error fetching notifications:", error);
            setNotifications([]);
        }
    };

    const handleTaskClick = async (taskId: number, type?: Notification['type']) => {
        setIsDropdownOpen(false);

        if (creatorIdentifier) {
            try {
                if (type === 'ELIMINATION') {
                    await fetch(`http://localhost:8081/api/applications/tasks/${taskId}/touch-elimination-view/${creatorIdentifier}`, { method: 'PUT' });
                } else if (type === 'ROUND_ACTIVATED') {
                    await fetch(`http://localhost:8081/api/applications/tasks/${taskId}/touch-round-activation-view/${creatorIdentifier}`, { method: 'PUT' });
                }
            } catch (e) {
                console.warn('Elimination seen jelzés vagy round-activated seen nem sikerült.', e);
            }
        }

        navigate(`/apply/${taskId}`);
    };

    // Frissítési logika
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [isAuthenticated, creatorIdentifier]);

    // Kívülre kattintás logika
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);


    return (
        <header className="app-header">
            <h1 className="main-title">Competition Hub</h1>

            <nav className="menu-container">
                {mainPageButton &&
                    <button className="custom-button">
                        <Link to="/">Main Page</Link>
                    </button>
                }
                {isAuthenticated && (
                    <div ref={dropdownRef} className="notification-dropdown-container">
                        <button
                            className="custom-button notification-button"
                            onClick={() => setIsDropdownOpen(prev => !prev)}
                        >
                            Notifications
                            {totalNewCount > 0 && (
                                <span className="notification-badge">
                                    {totalNewCount > 99 ? '99+' : totalNewCount}
                                </span>
                            )}
                        </button>

                        {isDropdownOpen && totalNewCount > 0 && (
                            <div className="notification-dropdown">
                                {notifications.map((n) => (
                                    <div
                                        key={`${n.taskId}-${n.type}`}
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
                {hasRole('admin') &&
                    <button className="custom-button create-task-button">
                        <Link to="/new-task">+ Create a new task</Link>
                    </button>
                }
                <button className="custom-button">
                    <Link to="/profile">Profile</Link>
                </button>
                <button className="custom-button" onClick={logout}>Logout</button>
            </nav>
        </header>
    );
}