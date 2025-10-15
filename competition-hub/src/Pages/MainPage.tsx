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
}

export default function MainPage() {

    const { user, isAuthenticated, hasRole, logout } = useKeycloak();
    const navigate = useNavigate();
    
    // Taskok listája, amikhez érkezett új application
    const [notifications, setNotifications] = useState<Notification[]>([]); 
    // A legördülő menü láthatósága
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    
    const dropdownRef = useRef<HTMLDivElement>(null); 
    
    const creatorIdentifier = user?.username; 
    
    // Total count kiszámítása (az értesítési jelvényhez)
    const totalNewCount = notifications.reduce((sum, item) => sum + item.newApplicationsCount, 0);

    // Külön függvény a notifikációk lekérésére
    const fetchNotifications = async () => {
        if (!isAuthenticated || !creatorIdentifier) {
            setNotifications([]);
            return;
        }

        try {
            // API hívás
            const response = await fetch(`http://localhost:8081/api/tasks/notifications/${creatorIdentifier}`); 
            
            if (!response.ok) {
                throw new Error('Failed to fetch notifications');
            }
            
            const data: Notification[] = await response.json(); 
            setNotifications(data);

        } catch (error) {
            console.error("Error fetching notifications:", error);
            setNotifications([]);
        }
    };
    
    // 1. useEffect: Értesítések lekérése és időzített frissítés
    useEffect(() => {
        fetchNotifications();
        
        // Rendszeres frissítés (pl. 30 másodpercenként)
        const interval = setInterval(fetchNotifications, 30000); 
        return () => clearInterval(interval);
    }, [isAuthenticated, creatorIdentifier]); 
    
    // 2. useEffect: A legördülő menü bezárása, ha a felhasználó kívülre kattint
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Taskra kattintás kezelése
    const handleTaskClick = (taskId: number) => {
        setIsDropdownOpen(false); // Bezárjuk a menüt
        navigate(`/apply/${taskId}`); // Navigálunk a /apply/{id} útvonalra
    };

    return (
        <div className="page-container">
            {/* VISSZAHELYEZETT CÍMEK */}
            <div className="main-title-container">
                <h1 className="main-title">Competition Hub</h1>
            </div>
            <div className="page-title-container">
                <h2 className="page-title">Active tasks</h2>
            </div>
            {/* MENU CONTAINER AZ ÉRTESÍTÉSEKKEL */}
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

                        {/* A tényleges legördülő lista */}
                        {isDropdownOpen && totalNewCount > 0 && (
                            <div className="notification-dropdown">
                                {notifications.map((n) => (
                                    <div 
                                        key={n.taskId} 
                                        className="dropdown-item"
                                        onClick={() => handleTaskClick(n.taskId)} // Taskra kattintás
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
            <ActiveTasks/>
        </div>
    );
}