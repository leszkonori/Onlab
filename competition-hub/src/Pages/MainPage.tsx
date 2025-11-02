import './MainPage.css';
import ActiveTasks from './ActiveTasks';
import AppHeader from '../Components/AppHeader';

export default function MainPage() {
  return (
    <div className="page-container">
      <AppHeader mainPageButton={false} />

      <div className="page-hero">
        <div className="page-hero-content">
          <h1 className="page-hero-title">Active Tasks</h1>
          <p className="page-hero-subtitle">Explore and apply to available competitions</p>
        </div>
      </div>

      <ActiveTasks />
    </div>
  )
}