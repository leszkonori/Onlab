import { Link } from 'react-router-dom';
import './ListCard.css';

export default function ListCard({ title, descr, link }: { title: string, descr: string, link: string }) {
    return (
        <div className="flex justify-center ml-16 mr-16">
            <div className="card">
                <h3>{title}</h3>
                <p className="max-w-xl">{descr}</p>
                <button>
                    <Link to={link}>Tovább</Link>
                </button>
            </div>
        </div>);
}