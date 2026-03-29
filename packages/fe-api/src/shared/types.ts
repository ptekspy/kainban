export interface ApiUser {
	id: string;
	email: string;
	name: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface ApiProject {
	id: string;
	name: string;
	abbreviation: string;
	githubRepoUrl: string;
	ownerId: string;
	createdAt: string;
	updatedAt: string;
}

export interface ApiProjectOwner {
	id: string;
	email: string;
	name: string | null;
}

export interface ApiEpic {
	id: string;
	name: string;
	description: string | null;
	projectId: string;
	createdAt: string;
	updatedAt: string;
}

export type ApiTaskStatus =
	| "TODO"
	| "READY_FOR_DEVELOPMENT"
	| "IN_DEVELOPMENT"
	| "READY_FOR_REVIEW"
	| "IN_REVIEW"
	| "READY_FOR_RELEASE"
	| "IN_RELEASE"
	| "HUMAN_INTERVENTION"
	| "RELEASED";

export interface ApiTask {
	id: string;
	ticketNumber: number;
	title: string;
	description: string | null;
	status: ApiTaskStatus;
	projectId: string;
	epicId: string;
	createdAt: string;
	updatedAt: string;
}

export interface ApiTaskReference {
	id: string;
	ticketNumber: number;
}

export interface ApiTaskRecord extends ApiTask {
	dependencies: ApiTaskReference[];
}

export interface ApiProjectRecord extends ApiProject {
	epics: ApiEpic[];
	owner: ApiProjectOwner;
	tasks: ApiTaskRecord[];
}

export interface GetByIdInput {
	id: string;
}

export interface DeleteInput {
	id: string;
}

export interface UserPostInput {
	email: string;
	name?: string | null;
}

export interface UserPatchInput extends DeleteInput {
	email?: string;
	name?: string | null;
}

export interface ProjectPostInput {
	name: string;
	abbreviation: string;
	githubRepoUrl: string;
	ownerId: string;
}

export interface ProjectPatchInput extends DeleteInput {
	name?: string;
	abbreviation?: string;
	githubRepoUrl?: string;
	ownerId?: string;
}

export interface EpicPostInput {
	name: string;
	description?: string | null;
	projectId: string;
}

export interface EpicPatchInput extends DeleteInput {
	name?: string;
	description?: string | null;
	projectId?: string;
}

export interface TaskPostInput {
	title: string;
	description?: string | null;
	status?: ApiTaskStatus;
	projectId: string;
	epicId: string;
	dependencyIds?: string[];
}

export interface TaskPatchInput extends DeleteInput {
	title?: string;
	description?: string | null;
	status?: ApiTaskStatus;
	projectId?: string;
	epicId?: string;
	dependencyIds?: string[];
}
