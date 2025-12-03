"use client"

import { Link, useNavigate } from "react-router-dom"
import { useKeycloak } from "../KeycloakProvider"
import { useState, useEffect, useRef } from "react"
import { Bell, Plus, User, LogOut, Home } from "lucide-react"
import "./AppHeader.css"
import httpClient from "../HttpClient"

interface Notification {
  taskId: number
  taskTitle: string
  newApplicationsCount: number
  type: "NEW_APPLICATION" | "NEW_REVIEW" | "ELIMINATION" | "ROUND_ACTIVATED"
}

export default function AppHeader({ mainPageButton = true }: { mainPageButton?: boolean }) {
  const { user, isAuthenticated, hasRole, logout } = useKeycloak()
  const navigate = useNavigate()

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const creatorIdentifier = user?.username
  const totalNewCount = notifications.reduce((sum, item) => sum + item.newApplicationsCount, 0)

  const fetchNotifications = async () => {
    if (!isAuthenticated || !creatorIdentifier) {
      setNotifications([])
      return
    }

    try {
      // 1. Kérés: Új jelentkezők értesítései (tasks/notifications)
      const creatorResponse = await httpClient.get(`/tasks/notifications/${creatorIdentifier}`)
      const creatorData: Notification[] = creatorResponse.data.map((n: any) => ({
        ...n,
        type: "NEW_APPLICATION",
        taskTitle: `${n.taskTitle} (New applications)`,
        newApplicationsCount: n.newApplicationsCount,
      }))

      // 2. Kérés: Új bírálatok értesítései (applications/notifications)
      const applicantResponse = await httpClient.get(`/applications/notifications/${creatorIdentifier}`)
      const applicantData: Notification[] = applicantResponse.data.map((n: any) => ({
        ...n,
        type: "NEW_REVIEW",
        taskTitle: `${n.taskTitle} (New reviews)`,
        newApplicationsCount: n.newApplicationsCount,
      }))

      // 3. Kérés: Elimináció értesítései (applications/elimination-notifications)
      const elimResponse = await httpClient.get(
        `/applications/elimination-notifications/${creatorIdentifier}`,
      )
      const elimData: Notification[] = elimResponse.data.map((n: any) => ({
        ...n,
        type: "ELIMINATION" as const,
        taskTitle: `${n.taskTitle} (Eliminated)`,
        newApplicationsCount: n.newApplicationsCount ?? 1,
      }))

      // 4. Kérés: Forduló aktiválás értesítései (applications/round-activation-notifications)
      const roundRes = await httpClient.get(
        `/applications/round-activation-notifications/${creatorIdentifier}`,
      )
      const roundData: Notification[] = roundRes.data.map((n: any) => ({
        taskId: n.taskId,
        taskTitle: `${n.taskTitle} (New round started)`,
        newApplicationsCount: n.newApplicationsCount ?? 1,
        type: "ROUND_ACTIVATED" as const,
      }))

      const mergedNotifications = [...creatorData, ...applicantData, ...elimData, ...roundData]
      setNotifications(mergedNotifications)
    } catch (error) {
      // Axios hibakezelés: ez kapja el a hálózati, 401, 403 hibákat
      console.error("Error fetching notifications:", error)
      setNotifications([])
    }
  }

  const handleTaskClick = async (taskId: number, type?: Notification["type"]) => {
    setIsDropdownOpen(false)

    if (creatorIdentifier) {
      try {
        if (type === "ELIMINATION") {
          // 5. Kérés: Elimináció megtekintve jelzése (tasks/{taskId}/touch-elimination-view)
          await httpClient.put(
            `/applications/tasks/${taskId}/touch-elimination-view/${creatorIdentifier}`,
          )
        } else if (type === "ROUND_ACTIVATED") {
          // 6. Kérés: Forduló aktiválás megtekintve jelzése (tasks/{taskId}/touch-round-activation-view)
          await httpClient.put(
            `/applications/tasks/${taskId}/touch-round-activation-view/${creatorIdentifier}`,
          )
        }
      } catch (e) {
        console.warn("Elimination seen jelzés vagy round-activated seen nem sikerült.", e)
      }
    }

    navigate(`/apply/${taskId}`)
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [isAuthenticated, creatorIdentifier])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <header className="app-header">
      <div className="header-container">
        <div className="header-brand">
          <div className="brand-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 4L4 10L16 16L28 10L16 4Z" fill="currentColor" opacity="0.8" />
              <path d="M4 16L16 22L28 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M4 22L16 28L28 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="brand-title">Competition Hub</h1>
        </div>

        <nav className="header-nav">
          {mainPageButton && (
            <Link to="/" className="nav-button">
              <Home size={18} />
              <span>Home</span>
            </Link>
          )}

          {isAuthenticated && (
            <div ref={dropdownRef} className="notification-container">
              <button
                className="nav-button notification-button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                aria-label="Notifications"
              >
                <Bell size={18} />
                <span>Notifications</span>
                {totalNewCount > 0 && (
                  <span className="notification-badge">{totalNewCount > 99 ? "99+" : totalNewCount}</span>
                )}
              </button>

              {isDropdownOpen && totalNewCount > 0 && (
                <div className="notification-dropdown">
                  <div className="dropdown-header">
                    <span className="dropdown-title">New Notifications</span>
                    <span className="dropdown-count-badge">{totalNewCount}</span>
                  </div>
                  <div className="dropdown-list">
                    {notifications.map((n) => (
                      <button
                        key={`${n.taskId}-${n.type}`}
                        className="dropdown-item"
                        onClick={() => handleTaskClick(n.taskId, n.type)}
                      >
                        <div className="dropdown-item-content">
                          <span className="dropdown-task-title">{n.taskTitle}</span>
                          <span className="dropdown-item-count">{n.newApplicationsCount} new</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {hasRole("admin") && (
            <Link to="/new-task" className="nav-button create-button">
              <Plus size={18} />
              <span>Create Task</span>
            </Link>
          )}

          <Link to="/profile" className="nav-button">
            <User size={18} />
            <span>Profile</span>
          </Link>

          <button className="nav-button logout-button" onClick={logout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </nav>
      </div>
    </header>
  )
}
