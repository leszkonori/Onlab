import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css'
import MainPage from "./Pages/MainPage";
import ActiveTasks from "./Pages/ActiveTasks";
import Apply from "./Pages/Apply";
import Profile from "./Pages/Profile";
import NewTaskPage from "./Pages/NewTaskPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" index element={<MainPage />} />
        <Route path="*" element={<MainPage />} />
        <Route path="/active-tasks" element={<ActiveTasks />} />
        <Route path="/apply/:id" element={<Apply />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/new-task" element={<NewTaskPage />} />
      </Routes>
    </BrowserRouter>
  );
}
