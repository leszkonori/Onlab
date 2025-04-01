import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css'
import MainPage from "./Pages/MainPage";
import ActiveTasks from "./Pages/ActiveTasks";
import Apply from "./Pages/Apply";
import Profile from "./Pages/Profile";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" index element={<MainPage />} />
        <Route path="/active-tasks" element={<ActiveTasks />} />
        <Route path="/apply" element={<Apply />} />
        <Route path="/profile" element={<Profile/>} />
      </Routes>
    </BrowserRouter>
  );
}
