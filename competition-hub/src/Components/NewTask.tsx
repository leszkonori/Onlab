import { useState } from "react";
import { useKeycloak } from "../KeycloakProvider";
import { RoundType } from "../types";

export default function NewTask() {
    const { user, isAuthenticated, hasRole, logout } = useKeycloak();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [deadline, setDeadline] = useState("");
    const [rounds, setRounds] = useState<RoundType[]>([]);

    const handleAddRound = () => {
        setRounds([...rounds, { description: "", deadline: "" }]);
    };

    const handleRoundChange = (index: number, name: keyof RoundType, value: string) => {
        setRounds(rounds.map((round, i) =>
            i === index ? { ...round, [name]: value } : round
        ));
        console.log(rounds);
    };

    const handleSubmit = () => {
        const task = {
            title,
            description,
            applicationDeadline: deadline,
            creator: user?.username,
            rounds: rounds,
        };
        console.log(task);

        fetch("http://localhost:8081/api/tasks", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(task),
        })
            .then((res) => {
                if (!res.ok) throw new Error("Save unsuccessful");
                return res.json();
            })
            .then((data) => {
                alert("Save successful!");
                setTitle("");
                setDescription("");
                setDeadline("");
            })
            .catch((err) => {
                alert("Error: " + err.message);
            });
    };

    const handleRemoveRound = (index: number) => {
        setRounds(rounds.filter((_, i) => i !== index));
    };

    return (
        <div className="task-container">
            <div className="grid-wrapper">
                <div className="task-grid">
                    <h4 className="flex justify-end">Task name:</h4>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <h4 className="flex justify-end">Description:</h4>
                    <textarea
                        className="w-80 h-40"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <h4 className="flex justify-end">Application deadline:</h4>
                    <input
                        type="date"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                    />
                    <h3>Fordulók:</h3>
                    {rounds.map((round, index) => (
                        <div key={index} className="round-input">
                            <h4>Forduló {index + 1}:</h4>
                            <label>Leírás:</label>
                            <textarea
                                value={round.description}
                                onChange={(e) => handleRoundChange(index, "description", e.target.value)}
                            />
                            <label>Határidő:</label>
                            <input
                                type="datetime-local"
                                value={round.deadline}
                                onChange={(e) => handleRoundChange(index, "deadline", e.target.value)}
                            />
                            <button onClick={() => handleRemoveRound(index)}>Eltávolítás</button>
                        </div>
                    ))}
                    <button onClick={handleAddRound}>Új forduló hozzáadása</button>
                </div>
            </div>

            <button className="flex justify-self-center" onClick={handleSubmit}>Save</button>
        </div>

    );
}