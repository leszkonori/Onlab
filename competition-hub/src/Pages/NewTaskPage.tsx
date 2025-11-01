import { Link, Navigate } from "react-router-dom";
import PageTitle from "../Components/PageTitle";
import NewTask from "../Components/NewTask";
import { useKeycloak } from "../KeycloakProvider";
import AppHeader from "../Components/AppHeader";

export default function NewTaskPage() {
    const { user, isAuthenticated, hasRole, logout } = useKeycloak();

    if (hasRole('admin')) {
        return (
            <div className="page-container">
                <AppHeader />
                <NewTask />
            </div>
        );
    } else {
        return <Navigate to="/" />;
    }

}