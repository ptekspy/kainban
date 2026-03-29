import type { Prisma } from "../generated/prisma/client.js";
import { projectWorkspaceService } from "./project-workspace.js";
import { type createProjectRepository, projectRepository } from "./repository.js";

export interface ProjectCreateInput extends Prisma.ProjectUncheckedCreateInput {
	githubPat?: string;
}

export const createProjectService = (
	repository: ReturnType<typeof createProjectRepository>,
	workspaceService: Pick<typeof projectWorkspaceService, "cloneProjectWorkspace"> = projectWorkspaceService,
) => ({
	getAll: () => repository.getAll(),
	getById: (id: string) => repository.getById(id),
	create: async (data: ProjectCreateInput) => {
		const { githubPat, ...projectData } = data;
		const workspace = await workspaceService.cloneProjectWorkspace({
			projectName: projectData.name,
			githubRepoUrl: projectData.githubRepoUrl,
			githubPat,
		});

		try {
			return await repository.create(projectData);
		} catch (error) {
			await workspace.cleanup();
			throw error;
		}
	},
	update: (id: string, data: Prisma.ProjectUncheckedUpdateInput) => repository.update(id, data),
	delete: (id: string) => repository.delete(id),
});

export const projectService = createProjectService(projectRepository);
