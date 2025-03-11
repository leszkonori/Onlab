import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css'
import MainPage from "./Pages/MainPage";
import ActiveTasks from "./Pages/ActiveTasks";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" index element={<MainPage />} />
        <Route path="/active-tasks" element={<ActiveTasks />} />
      </Routes>
    </BrowserRouter>
  );
}
