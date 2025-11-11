import { Navigate } from "react-router-dom"
import NewTask from "../Components/NewTask"
import { useKeycloak } from "../KeycloakProvider"
import AppHeader from "../Components/AppHeader"

export default function NewTaskPage() {
  const { hasRole } = useKeycloak()

  if (hasRole("admin")) {
    return (
      <div className="page-container">
        <AppHeader />
        <NewTask />
      </div>
    )
  } else {
    return <Navigate to="/" />
  }
}
