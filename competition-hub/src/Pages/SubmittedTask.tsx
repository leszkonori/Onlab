import { Link } from "react-router-dom";
import button from "../Components/button";
import PageTitle from "../Components/PageTitle";

export default function SubmittedTask() {
    return (
        <>
            <div className="flex justify-between">
                <div>
                    <button>
                        <Link to="/">Főoldal</Link>
                    </button>
                    <button>Profil</button>
                </div>
                <div>
                    <button>
                        <Link to="/active-tasks">Aktív feladatkiírások</Link>
                    </button>
                </div>
            </div>
            <PageTitle>Jelentkezés</PageTitle>
        </>
    );
}