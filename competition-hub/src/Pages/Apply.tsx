import { Link, useParams } from "react-router-dom";
import PageTitle from "../Components/PageTitle";
import Task from "../Components/Task";
import './Apply.css';
import { useEffect, useState } from "react";
import { ApplicationType, RoundType, TaskType } from "../types";
import { useKeycloak } from "../KeycloakProvider";
import AppHeader from "../Components/AppHeader";

export default function Apply() {
  const { id } = useParams<{ id: string }>();
  const [task, setTask] = useState<TaskType | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [message, setMessage] = useState("");
  const { user, isAuthenticated, hasRole, logout } = useKeycloak();

  const fetchTask = () => {
    fetch(`http://localhost:8081/api/tasks/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Request for task was unsuccessful");
        return res.json();
      })
      .then((data) => {
        const directApps = data.applications || [];
        const roundApps =
          data.rounds?.flatMap((r: RoundType) => r.applications || []) || [];

        const uniqueMap = new Map<number, ApplicationType>();
        [...directApps, ...roundApps].forEach((app) => {
          if (typeof app === "object" && app !== null && "id" in app) {
            uniqueMap.set(app.id, app as ApplicationType);
          }
        });

        const combinedApplications = Array.from(uniqueMap.values());

        // FONTOS: a TaskType-nek tartalmaznia kell az evaluationType-ot
        setTask({ ...data, applications: combinedApplications });
      })
      .catch((err) => console.error("Error: ", err));
  };

  useEffect(() => {
    if (id) fetchTask();
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setFile(e.target.files[0]);
      setFileName(e.target.files[0].name);
    } else {
      setFile(null);
      setFileName("");
    }
  };

  const handleApply = async () => {
    if (!file || !id || !user) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("keycloakUserId", user.id);
    formData.append("keycloakUserName", user.username);

    try {
      const res = await fetch(
        `http://localhost:8081/api/applications/${id}`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (res.ok) {
        setMessage("File uploaded successfully!");
        alert("File uploaded successfully!");
        fetchTask();
        setFile(null);
        setFileName("");
      } else {
        const errText = await res.text();
        setMessage("Error: " + errText);
        alert("Error: " + errText);
      }
    } catch (error) {
      setMessage("Error occured during file upload");
      alert("Error occured during file upload");
    }
  };

  // Kisegítő: adott user application-je (ha van)
  const myApplication =
    task?.applications?.find((app) => app.keycloakUserId === user?.id) || null;

  // Review megjelenítés a Task értékeléstípusának megfelelően
  const renderMyReview = () => {
    if (!myApplication || !task?.evaluationType) return null;

    const { reviewText, reviewPoints } = myApplication as any; // backendben: Application.reviewText, reviewPoints
    const et: "TEXT" | "POINTS" | "BOTH" = task.evaluationType;

    if (et === "TEXT") {
      return reviewText ? (
        <>
          <h4>Review:</h4>
          <p>{reviewText}</p>
        </>
      ) : null;
    }

    if (et === "POINTS") {
      return reviewPoints != null ? (
        <>
          <h4>Review:</h4>
          <p>{reviewPoints}/10</p>
        </>
      ) : null;
    }

    // BOTH
    return reviewText || reviewPoints != null ? (
      <>
        <h4>Review:</h4>
        <p>
          {reviewText ? reviewText : ""}
          {reviewText && reviewPoints != null ? " " : ""}
          {reviewPoints != null ? `(${reviewPoints}/10)` : ""}
        </p>
      </>
    ) : null;
  };

  return (
    <div className="page-container">
      <AppHeader />

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
          // ÚJ: átadjuk az értékelési típust a Task komponensnek
          evaluationType={task.evaluationType as any}
        />
      )}

      {/* Ha a user már pályázott és nincs rounds, mutatjuk a letöltést és a review-t */}
      {myApplication && (!task?.rounds || task.rounds.length === 0) && (
        <>
          <p>You have already applied for this task.</p>
          <a
            className="download-button-a"
            href={`http://localhost:8081/api/applications/download/${myApplication.id}`}
            download
          >
            <button className="custom-button">Download file</button>
          </a>

          {/* ÚJ: review megjelenítés evaluationType alapján */}
          {renderMyReview()}
        </>
      )}

      {/* Ha nem a creator és még nem pályázott, és nincs rounds, feltöltő UI */}
      {task?.creator !== user?.username &&
        !!!task?.applications?.some((app) => app.keycloakUserId === user?.id) &&
        task?.rounds?.length == 0 && (
          <>
            <div className="upload-section">
              <h4>Upload a file:</h4>
              <button className="custom-button">
                <label htmlFor="fileInput">Choose a file...</label>
                <input
                  type="file"
                  id="fileInput"
                  accept=".zip"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
              </button>
              {fileName && <p>Selected file: {fileName}</p>}
              <h4>(Expected file format: .zip)</h4>
            </div>
            <button
              className="custom-button"
              onClick={handleApply}
              disabled={!file}
            >
              Apply
            </button>
          </>
        )}
    </div>
  );
}
