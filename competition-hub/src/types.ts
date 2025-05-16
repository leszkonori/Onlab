export type RoundType = {
    id?: number;
    description: string;
    deadline: string;
}

export type TaskType = {
    id: number;
    title: string;
    description: string;
    applicationDeadline: string;
    creator: string;
    rounds?: RoundType[];
    applications?: ApplicationType[];
};

export type User = {
    username: string;
    email?: string;
    name?: string;
    roles: string[];
};

export type ApplicationType = {
    id: number;
    task: TaskType;
    user: any;
    filePath: string;
    applicationDate: string;
    review?: string;
}