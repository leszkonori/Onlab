import { Link } from "react-router-dom"
import "./ListCard.css"
import { ArrowRight } from "lucide-react"

export default function ListCard({ title, descr, link }: { title: string; descr: string; link: string }) {
  return (
    <div className="card-container">
      <div className="card-content">
        <h3 className="card-title">{title}</h3>
        <p className="card-description">{descr}</p>
      </div>
      <Link to={link} className="card-button">
        <span>View Details</span>
        <ArrowRight size={18} className="card-button-icon" />
      </Link>
    </div>
  )
}