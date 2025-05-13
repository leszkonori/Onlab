import React from "react";
import MainTitle from "../Components/MainTitle";
import './MainPage.css';
import Button from "../Components/Button";
import ListCard from "../Components/ListCard";

export default function MainPage() {
    return (
        <>
            <MainTitle>Competition Hub</MainTitle>
            <h2>Aktualitások</h2>
            <div className="flex justify-between ml-8 mr-8">
                <Button>Profil</Button>
                <Button>Aktív feladatkiírások</Button>
            </div>
            <div className="flex flex-col gap-3 mt-10">
                <ListCard title="Új feladat!" descr="Lorem ipsum"/>
                <ListCard title="Eredmények" descr="Lorem ipsum Lorem ipsum"/>
            </div>
        </>
    );
}