import { ReactNode } from "react";
import './PageTitle.css';

export default function PageTitle({children}: {children: ReactNode}) {
    return <h2>
        {children}
    </h2>
}