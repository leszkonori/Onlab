import { Link } from "react-router-dom";
import Button from "../Components/Button";
import PageTitle from "../Components/PageTitle";
import Task from "../Components/Task";
import './Apply.css';

export default function Apply() {
    return (
        <div className="apply-container">
            <div className="apply-header">
                <div>
                    <Button>
                        <Link to="/">Főoldal</Link>
                    </Button>
                    <Button>
                        <Link to="/profile">Profile</Link>
                    </Button>
                </div>
                <div>
                    <Button>
                        <Link to="/active-tasks">Aktív feladatkiírások</Link>
                    </Button>
                </div>
            </div>
            <PageTitle>Jelentkezés</PageTitle>
            <Task title="Test Title"
                descr="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
                date="2025/12/12"
            />
            <div className="upload-section">
                <h4>Upload a file:</h4>
                <button>
                    <label htmlFor="fileInput">Choose a file...</label>
                    <input type="file" id="fileInput" accept=".zip" style={{ display: 'none' }} />
                </button>
                <h4>(Expected file format: .zip)</h4>
            </div>
            <Button className="apply-button">Apply</Button>
        </div>
    );
}