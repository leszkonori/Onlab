import { Link } from 'react-router-dom';
import './ListCard.css';

export default function ListCard({ title, descr, link }: { title: string, descr: string, link: string }) {
    return (
        <div className="card-container">
            <h3>{title}</h3>
            <p className="max-w-xl">{descr}</p>
            <button className="custom-button">
                <Link to={link}>View</Link>
            </button>
        </div>);
}