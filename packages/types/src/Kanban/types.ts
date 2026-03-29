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
	sourceId?: string;
	title: string;
	description?: string;
	column: KanbanColumnKey;
	epicId: string;
	dependencyTaskIds: string[];
}

export interface Epic {
	id: string;
	name: string;
	description?: string;
}

export interface Project {
	id: string;
	name: string;
	abbreviation: string;
	githubRepoUrl: string;
	epics: Epic[];
	tasks: Task[];
}

export interface KanbanBoardState {
	activeProjectId: string | null;
	projects: Project[];
}
