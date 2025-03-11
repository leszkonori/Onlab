import { Link } from "react-router-dom";
import Button from "../Components/Button";
import PageTitle from "../Components/PageTitle";

export default function Apply() {
    return (
        <>
            <div className="flex justify-between">
                <div>
                    <Button>
                        <Link to="/">Főoldal</Link>
                    </Button>
                    <Button>Profil</Button>
                </div>
                <div>
                    <Button>
                        <Link to="/active-tasks">Aktív feladatkiírások</Link>
                    </Button>
                </div>
            </div>
            <PageTitle>Jelentkezés</PageTitle>
        </>
    );
}