export type KanbanColumnKey =
	| "TODO"
	| "READY_FOR_DEVELOPMENT"
	| "IN_DEVELOPMENT"
	| "READY_FOR_REVIEW"
	| "IN_REVIEW"
	| "READY_FOR_RELEASE"
	| "IN_RELEASE"
	| "HUMAN_INTERVENTION"
	| "RELEASED";

export interface KanbanColumnSettings {
	statusColor: string;
	backgroundColor: string;
}

export interface KanbanColumnTransitions {
	from: KanbanColumnKey[];
	to: KanbanColumnKey[];
}

export interface Task {
	id: string;
	title: string;
	description?: string;
	column: KanbanColumnKey;
}

export interface Project {
	id: string;
	name: string;
	abbreviation: string;
	githubRepoUrl: string;
	tasks: Task[];
}

export interface KanbanBoardState {
	activeProjectId: string | null;
	projects: Project[];
}
