import MainTitle from "../Components/MainTitle";
import './MainPage.css';
import Button from "../Components/Button";
import ListCard from "../Components/ListCard";
import { Link } from "react-router-dom";

export default function MainPage() {
    return (
        <>
            <MainTitle>Competition Hub</MainTitle>
            <h2>Aktualitások</h2>
            <div className="flex justify-between ml-8 mr-8">
                <Button>Profil</Button>
                <Button>
                    <Link to="/active-tasks">Aktív feladatkiírások</Link>
                </Button>
            </div>
            <div className="flex flex-col gap-3 mt-10">
                <ListCard title="Új feladat!" descr="Lorem ipsum" link="/"/>
                <ListCard title="Eredmények" descr="Lorem ipsum Lorem ipsum" link="/"/>
            </div>
        </>
    );
}