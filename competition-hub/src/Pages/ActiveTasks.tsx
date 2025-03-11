import { Link } from "react-router-dom";
import Button from "../Components/Button";
import PageTitle from "../Components/PageTitle";
import ListCard from "../Components/ListCard";

export default function ActiveTasks() {
    return (
        <>
            <div>
                <Button>
                    <Link to="/">Főoldal</Link>
                </Button>
                <Button>
                    Profil
                </Button>
            </div>
            <PageTitle>Aktív feladatok</PageTitle>
            <div className="flex flex-col gap-3 mt-10">
                <ListCard title="React feladat" descr="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." 
                    link="/apply"
                />
                <ListCard title="Angular feladat" descr="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
                    link="/apply"
                />
            </div>
        </>
    );
}