export type TaskType = {
    id: number;
    title: string;
    description: string;
    applicationDeadline: string;
    creator: string;
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
    user: any; // A User típusa, ha van
    filePath: string;
    applicationDate: string;
}