"use client"
import ListCard from "../Components/ListCard"
import { useEffect, useMemo, useState } from "react"
import type { TaskType } from "../types"
import "./ActiveTasks.css"
import { Loader2, AlertCircle } from "lucide-react"

export default function ActiveTasks() {
  const [tasks, setTasks] = useState<TaskType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch("http://localhost:8081/api/tasks")
      .then((res) => res.json())
      .then((data) => {
        setTasks(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Error loading the tasks:", err)
        setError("Failed to load tasks. Please try again later.")
        setLoading(false)
      })
  }, [])

  const activeVisibleTasks = useMemo(() => {
    const now = new Date()

    return tasks.filter((task) => {
      const deadlineOk = task.applicationDeadline ? new Date(task.applicationDeadline) > now : true

      const firstRound = task.rounds && task.rounds[0]
      const firstRoundActive = firstRound ? firstRound.isActive === true : false

      return (deadlineOk && firstRoundActive) || (deadlineOk && !firstRound)
    })
  }, [tasks])

  if (loading) {
    return (
      <div className="task-list-state">
        <Loader2 className="spinner" size={48} />
        <p className="state-message">Loading tasks...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="task-list-state error">
        <AlertCircle size={48} />
        <p className="state-message">{error}</p>
      </div>
    )
  }

  if (activeVisibleTasks.length === 0) {
    return (
      <div className="task-list-state">
        <AlertCircle size={48} />
        <p className="state-message">No active tasks available at the moment.</p>
      </div>
    )
  }

  return (
    <div className="task-list-container">
      {activeVisibleTasks.map((task) => (
        <ListCard key={task.id} title={task.title} descr={task.description} link={`/apply/${task.id}`} />
      ))}
    </div>
  )
}
