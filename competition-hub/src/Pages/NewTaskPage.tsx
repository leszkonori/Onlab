import { Link, Navigate } from "react-router-dom";
import Button from "../Components/Button";
import PageTitle from "../Components/PageTitle";
import NewTask from "../Components/NewTask";
import { useKeycloak } from "../KeycloakProvider";

export default function NewTaskPage() {
    const { user, isAuthenticated, hasRole, logout } = useKeycloak();

    if (hasRole('admin')) {
        return (
            <>
                <div className="apply-header">
                    <Button>
                        <Link to="/">Főoldal</Link>
                    </Button>
                    <Button>
                        <Link to="/profile">Profile</Link>
                    </Button>
                </div>
                <PageTitle>Create a new task</PageTitle>
                <NewTask />
            </>
        );
    } else {
        return <Navigate to="/" />;
    }

}