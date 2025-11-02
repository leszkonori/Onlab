import './MainPage.css';
import { Link, useNavigate } from "react-router-dom";
import { useKeycloak } from "../KeycloakProvider";
import ActiveTasks from './ActiveTasks';
import { useState, useEffect, useRef } from 'react';
import AppHeader from '../Components/AppHeader';

export default function MainPage() {

    return (
        <div className="page-container">
            <AppHeader mainPageButton={false} />

            {/* Az "Active tasks" címet a fejléc alá helyezzük */}
            <div className="page-title-container">
                <h2 className="page-title">Active tasks</h2>
            </div>

            <ActiveTasks />
        </div>
    );
}