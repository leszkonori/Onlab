import React, { ReactNode } from "react";
import './Button.css';

export default function Button({children, className}: {children: ReactNode, className?: string}) {
    return <button className={className}>{children}</button>;
}