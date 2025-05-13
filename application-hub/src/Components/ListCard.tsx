import React from 'react';
import './ListCard.css';

export default function ListCard({ title, descr }: { title: string, descr: string }) {
    return (
        <div className="flex justify-center ml-16 mr-16">
            <div className="card">
                <h3>{title}</h3>
                <p>{descr}</p>
                <button>Tovább</button>
            </div>
        </div>);
}