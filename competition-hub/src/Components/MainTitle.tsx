import { ReactNode } from 'react';
import './MainTitle.css';

export default function MainTitle({children}: {children: ReactNode}) {
    return <h1>{children}</h1>
}