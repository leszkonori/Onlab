"use client"

import type React from "react"

import { useParams } from "react-router-dom"
import Task from "../Components/Task"
import "./Apply.css"
import { useEffect, useState } from "react"
import type { ApplicationType, RoundType, TaskType } from "../types"
import { useKeycloak } from "../KeycloakProvider"
import AppHeader from "../Components/AppHeader"
import httpClient from "../HttpClient"

export default function Apply() {
  const { id } = useParams<{ id: string }>()
  const [task, setTask] = useState<TaskType | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState("")
  const [message, setMessage] = useState("")
  const { user, isAuthenticated, hasRole, logout } = useKeycloak()

  const fetchTask = () => {
    httpClient.get(`/tasks/${id}`)
      .then((res) => {
        const data = res.data
        
        const directApps = data.applications || []
        const roundApps = data.rounds?.flatMap((r: RoundType) => r.applications || []) || []

        const uniqueMap = new Map<number, ApplicationType>()
        ;[...directApps, ...roundApps].forEach((app) => {
          if (typeof app === "object" && app !== null && "id" in app) {
            uniqueMap.set(app.id, app as ApplicationType)
          }
        })

        const combinedApplications = Array.from(uniqueMap.values())
        setTask({ ...data, applications: combinedApplications })
      })
      .catch((err) => {
        console.error("Error: ", err)
      })
  }

  useEffect(() => {
    if (id) fetchTask()
  }, [id])

  const handleDownload = async (applicationId: number) => {
    try {
        const response = await httpClient.get(`/applications/download/${applicationId}`, {
            responseType: 'blob', 
        });

        const contentDisposition = response.headers['content-disposition'];
        let filename = `application_${applicationId}.zip`;
        if (contentDisposition) {
            const matches = /filename="?([^"]+)"?/.exec(contentDisposition);
            if (matches && matches[1]) {
                filename = matches[1];
            }
        }
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename); 
        
        document.body.appendChild(link);
        link.click();
        
        link.remove();
        window.URL.revokeObjectURL(url);

    } catch (error) {
        console.error("Download error:", error);
        alert("A fájl letöltése nem sikerült. Lehet, hogy nincs jogosultsága, vagy hálózati hiba történt.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setFile(e.target.files[0])
      setFileName(e.target.files[0].name)
    } else {
      setFile(null)
      setFileName("")
    }
  }

  const handleApply = async () => {
    if (!file || !id || !user) return

    const formData = new FormData()
    formData.append("file", file)
    formData.append("keycloakUserId", user.id)
    formData.append("keycloakUserName", user.username)

    try {
      const res = await httpClient.post(`/applications/${id}`, formData)

      setMessage("File uploaded successfully!")
      alert("File uploaded successfully!")
      fetchTask()
      setFile(null)
      setFileName("")
      
    } catch (error: any) {
      const errText = error.response?.data || "Error occured during file upload"
      setMessage("Error: " + errText)
      alert("Error: " + errText)
    }
  }

  const myApplication = task?.applications?.find((app) => app.keycloakUserId === user?.id) || null

  const renderMyReview = () => {
    if (!myApplication || !task?.evaluationType) return null

    const { reviewText, reviewPoints } = myApplication as any
    const et: "TEXT" | "POINTS" | "BOTH" = task.evaluationType

    if (et === "TEXT") {
      return reviewText ? (
        <div className="review-section">
          <div className="review-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h4>Your Review</h4>
          </div>
          <p className="review-text">{reviewText}</p>
        </div>
      ) : null
    }

    if (et === "POINTS") {
      return reviewPoints != null ? (
        <div className="review-section">
          <div className="review-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h4>Your Review</h4>
          </div>
          <div className="review-points">
            <span className="points-value">{reviewPoints}</span>
            <span className="points-max">/10</span>
          </div>
        </div>
      ) : null
    }

    return reviewText || reviewPoints != null ? (
      <div className="review-section">
        <div className="review-header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h4>Your Review</h4>
        </div>
        {reviewText && <p className="review-text">{reviewText}</p>}
        {reviewPoints != null && (
          <div className="review-points">
            <span className="points-value">{reviewPoints}</span>
            <span className="points-max">/10</span>
          </div>
        )}
      </div>
    ) : null
  }

  return (
    <div className="apply-page">
      <AppHeader />

      <div className="apply-content">
        {task && (
          <Task
            id={task.id}
            title={task.title}
            descr={task.description}
            date={task.applicationDeadline}
            rounds={task.rounds}
            applications={task.applications}
            editable={user?.username === task.creator}
            onSave={fetchTask}
            evaluationType={task.evaluationType as any}
          />
        )}

        {myApplication && (!task?.rounds || task.rounds.length === 0) && (
          <div className="application-status-card">
            <div className="status-header">
              <div className="status-icon success">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="status-title">Application Submitted</h3>
                <p className="status-subtitle">You have already applied for this task</p>
              </div>
            </div>

            <div className="status-actions">
              <button 
                className="download-button"
                onClick={() => handleDownload(myApplication.id)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download Your Submission
              </button>
            </div>

            {renderMyReview()}
          </div>
        )}

        {task?.creator !== user?.username &&
          !!!task?.applications?.some((app) => app.keycloakUserId === user?.id) &&
          task?.rounds?.length == 0 && (
            <div className="upload-card">
              <div className="upload-header">
                <div className="upload-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <div>
                  <h3 className="upload-title">Submit Your Application</h3>
                  <p className="upload-subtitle">Upload your work as a .zip file</p>
                </div>
              </div>

              <div className="upload-area">
                <label htmlFor="fileInput" className="file-input-label">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span className="file-input-text">{fileName ? fileName : "Click to choose a file"}</span>
                  <span className="file-input-hint">Expected format: .zip</span>
                </label>
                <input
                  type="file"
                  id="fileInput"
                  accept=".zip"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
              </div>

              <button className="submit-application-button" onClick={handleApply} disabled={!file}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                Submit Application
              </button>
            </div>
          )}
      </div>
    </div>
  )
}