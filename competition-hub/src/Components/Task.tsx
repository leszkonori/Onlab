import './Task.css';

export default function Task({ title, descr, date }: { title: string, descr: string, date: string }) {

    return (
        <div className="task-container">
            <div className="grid-wrapper">
                <div className="task-grid">
                    <h4 className="flex justify-end">Name:</h4>
                    <h4>{title}</h4>
                    <h4 className="flex justify-end">Description:</h4>
                    <p>{descr}</p>
                    <h4 className="flex justify-end">Jelentkezési határidő:</h4>
                    <p>{date}</p>
                </div>
            </div>
        </div>
    );
}