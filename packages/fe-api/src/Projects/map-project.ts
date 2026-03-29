import type { Project } from "@repo/types/Kanban/types";
import type { ApiProjectRecord } from "../shared/types";

export const mapApiProjectToProject = (project: ApiProjectRecord): Project => ({
	id: project.id,
	name: project.name,
	abbreviation: project.abbreviation,
	githubRepoUrl: project.githubRepoUrl,
	epics: project.epics.map((epic) => ({
		id: epic.id,
		name: epic.name,
		description: epic.description ?? undefined,
	})),
	tasks: project.tasks.map((task) => ({
		id: `${project.abbreviation}-${task.ticketNumber}`,
		sourceId: task.id,
		title: task.title,
		description: task.description ?? undefined,
		column: task.status,
		epicId: task.epicId,
		dependencyTaskIds: task.dependencies.map(
			(dependency) => `${project.abbreviation}-${dependency.ticketNumber}`,
		),
	})),
});
