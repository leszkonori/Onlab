"use client"
import { useKeycloak } from "../KeycloakProvider"
import "./Profile.css"
import { useEffect, useState } from "react"
import type { ApplicationType, TaskType } from "../types"
import ListCard from "../Components/ListCard"
import AppHeader from "../Components/AppHeader"
import httpClient from "../HttpClient"

export default function Profile() {
  const { user, isAuthenticated, hasRole, logout } = useKeycloak()

  const [tasks, setTasks] = useState<TaskType[]>([])
  const [appliedTasks, setAppliedTasks] = useState<TaskType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    httpClient("/tasks")
      .then((res) => setTasks(res.data))
      .catch((err) => console.error("Error loading the tasks:", err))
      .finally(() => setLoading(false))
  }, [isAuthenticated, user?.username])

  useEffect(() => {
    if (!user?.id) return

    httpClient.get(`/applications/by-user/${user.id}`)
    .then((res) => {
        const data: ApplicationType[] = res.data;

        const taskMap = new Map<number, TaskType>();

        data.forEach((app) => {
            if (app.task) {
                taskMap.set(app.task.id, app.task);
            } else if (app.round && app.round.task) {
                taskMap.set(app.round.task.id, app.round.task);
            }
        });

        const uniqueTasks = Array.from(taskMap.values())
        setAppliedTasks(uniqueTasks)
      })
      .catch((err) => console.error("Error loading applied tasks:", err))
  }, [user?.id])

  const myTasks = tasks.filter((t) => t.creator === user?.username)

  return (
    <div className="profile-page">
      <AppHeader />

      {/* Hero Section */}
      <div className="profile-hero">
        <div className="profile-hero-content">
          <div className="profile-hero-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className="profile-hero-text">
            <h1 className="profile-hero-title">My Profile</h1>
            <p className="profile-hero-username">{user?.username}</p>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="profile-container">
        <div className="profile-content">
          {/* Stats Cards */}
          <div className="profile-stats">
            <div className="stat-card">
              <div className="stat-icon stat-icon-blue">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-value">{appliedTasks.length}</div>
                <div className="stat-label">Applied Tasks</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon stat-icon-purple">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-value">{myTasks.length}</div>
                <div className="stat-label">Created Tasks</div>
              </div>
            </div>
          </div>

          {/* Applied Tasks Section */}
          <div className="profile-section">
            <div className="section-header">
              <div className="section-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </div>
              <h2 className="section-title">Tasks You Applied For</h2>
            </div>

            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading tasks...</p>
              </div>
            ) : appliedTasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <p className="empty-text">You haven't applied to any tasks yet</p>
              </div>
            ) : (
              <ul className="task-list">
                {appliedTasks.map((task) => (
                  <li key={task.id} className="task-list-item">
                    <ListCard title={task.title} descr="" link={`/apply/${task.id}`} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Created Tasks Section */}
          <div className="profile-section">
            <div className="section-header">
              <div className="section-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <h2 className="section-title">Your Created Tasks</h2>
            </div>

            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading tasks...</p>
              </div>
            ) : myTasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <p className="empty-text">You haven't created any tasks yet</p>
              </div>
            ) : (
              <ul className="task-list">
                {myTasks.map((t) => (
                  <li key={t.id} className="task-list-item">
                    <ListCard title={t.title} descr="" link={`/apply/${t.id}`} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
