"use client";

import { postEpicMutation } from "@repo/fe-api/Epic/post/query";
import { getAllProjectsQuery } from "@repo/fe-api/Projects/getAll/query";
import { mapApiProjectToProject } from "@repo/fe-api/Projects/map-project";
import { postProjectMutation } from "@repo/fe-api/Projects/post/query";
import { projectQueryKeys } from "@repo/fe-api/Projects/queryKeys";
import { patchTaskMutation } from "@repo/fe-api/Task/patch/query";
import { postTaskMutation } from "@repo/fe-api/Task/post/query";
import type { KanbanColumnKey, Project } from "@repo/types/Kanban/types";
import { KanbanBoard } from "@repo/ui/KanbanBoard";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authClient } from "./auth/auth-client";
import { SignInForm } from "./auth/sign-in-form";
import { useProjectRealtime } from "./use-project-realtime";

const appendProject = (
	projects: Project[] | undefined,
	project: Project,
): Project[] => [...(projects ?? []), project];

const applyTaskColumnChanges = (
	projects: Project[] | undefined,
	projectId: string,
	changes: Array<{ column: KanbanColumnKey; taskId: string }>,
) =>
	(projects ?? []).map((project) =>
		project.id === projectId
			? {
					...project,
					tasks: project.tasks.map((task) => {
						const change = changes.find(
							(candidateChange) => candidateChange.taskId === task.id,
						);

						return change
							? {
									...task,
									column: change.column,
								}
							: task;
					}),
				}
			: project,
	);

export const KanbanBoardPage = () => {
	const queryClient = useQueryClient();
	const session = authClient.useSession();
	useProjectRealtime(!!session.data?.user);
	const {
		data = [],
		error,
		isLoading,
	} = useQuery({
		...getAllProjectsQuery(),
		enabled: !!session.data?.user,
	});
	const createProjectMutation = useMutation(postProjectMutation);
	const createEpicMutation = useMutation(postEpicMutation);
	const createTaskMutation = useMutation(postTaskMutation);
	const moveTaskMutation = useMutation(patchTaskMutation);

	const handleCreateProject = async (input: {
		name: string;
		abbreviation: string;
		githubRepoUrl: string;
	}) => {
		const createdProject = await createProjectMutation.mutateAsync({
			...input,
			ownerId: session.data?.user.id ?? "",
		});
		const mappedProject = mapApiProjectToProject({
			...createdProject,
			owner: {
				id: createdProject.ownerId,
				email: session.data?.user.email ?? "",
				name: session.data?.user.name ?? null,
			},
			epics: [],
			tasks: [],
		});

		queryClient.setQueryData<Project[]>(
			projectQueryKeys.all(),
			(currentProjects) => appendProject(currentProjects, mappedProject),
		);

		return { id: createdProject.id };
	};

	const handleCreateEpic = async (
		input: { description?: string; name: string },
		project: Project,
	) => {
		const createdEpic = await createEpicMutation.mutateAsync({
			...input,
			description: input.description?.trim() || null,
			projectId: project.id,
		});

		queryClient.setQueryData<Project[]>(
			projectQueryKeys.all(),
			(currentProjects) =>
				(currentProjects ?? []).map((currentProject) =>
					currentProject.id === project.id
						? {
								...currentProject,
								epics: [
									...currentProject.epics,
									{
										id: createdEpic.id,
										name: createdEpic.name,
										description: createdEpic.description ?? undefined,
									},
								],
							}
						: currentProject,
				),
		);
	};

	const handleCreateTask = async (
		input: {
			dependencyTaskIds: string[];
			description?: string;
			epicId: string;
			title: string;
		},
		project: Project,
	) => {
		const dependencyIds = input.dependencyTaskIds
			.map(
				(dependencyTaskId) =>
					project.tasks.find((task) => task.id === dependencyTaskId)?.sourceId,
			)
			.filter(
				(dependencyId): dependencyId is string => dependencyId !== undefined,
			);
		const createdTask = await createTaskMutation.mutateAsync({
			title: input.title,
			description: input.description?.trim() || null,
			epicId: input.epicId,
			projectId: project.id,
			dependencyIds,
		});

		queryClient.setQueryData<Project[]>(
			projectQueryKeys.all(),
			(currentProjects) =>
				(currentProjects ?? []).map((currentProject) =>
					currentProject.id === project.id
						? {
								...currentProject,
								tasks: [
									...currentProject.tasks,
									{
										id: `${currentProject.abbreviation}-${createdTask.ticketNumber}`,
										sourceId: createdTask.id,
										title: createdTask.title,
										description: createdTask.description ?? undefined,
										column: createdTask.status,
										epicId: createdTask.epicId,
										dependencyTaskIds: input.dependencyTaskIds,
									},
								],
							}
						: currentProject,
				),
		);
	};

	const handleMoveTasks = async (
		changes: Array<{ column: KanbanColumnKey; taskId: string }>,
		project: Project,
	) => {
		const previousProjects =
			queryClient.getQueryData<Project[]>(projectQueryKeys.all()) ?? [];

		queryClient.setQueryData<Project[]>(
			projectQueryKeys.all(),
			(currentProjects) =>
				applyTaskColumnChanges(currentProjects, project.id, changes),
		);

		try {
			await Promise.all(
				changes.map(async (change) => {
					const task = project.tasks.find(
						(candidateTask) => candidateTask.id === change.taskId,
					);

					if (!task?.sourceId) {
						throw new Error(`Missing source task id for ${change.taskId}.`);
					}

					await moveTaskMutation.mutateAsync({
						id: task.sourceId,
						status: change.column,
					});
				}),
			);
		} catch (error) {
			queryClient.setQueryData<Project[]>(
				projectQueryKeys.all(),
				previousProjects,
			);
			throw error;
		}
	};

	const handleSignOut = async () => {
		await authClient.signOut();
		queryClient.removeQueries({
			queryKey: projectQueryKeys.all(),
		});
		await session.refetch();
	};

	if (session.isPending) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-50">
				Checking session...
			</div>
		);
	}

	if (!session.data?.user) {
		return (
			<SignInForm
				onSuccess={async () => {
					await session.refetch();
					await queryClient.invalidateQueries({
						queryKey: projectQueryKeys.all(),
					});
				}}
			/>
		);
	}

	if (isLoading && data.length === 0) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-50">
				Loading project boards...
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-rose-50 px-6 text-center text-rose-700">
				Unable to load project boards right now.
			</div>
		);
	}

	return (
		<div>
			<div className="absolute right-6 top-6 z-20 flex items-center gap-3 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm text-slate-700 shadow-sm backdrop-blur">
				<span>{session.data.user.email}</span>
				<button
					type="button"
					onClick={handleSignOut}
					className="rounded-full border border-slate-300 px-3 py-1 font-medium transition hover:border-slate-400 hover:text-slate-950"
				>
					Sign out
				</button>
			</div>
			<KanbanBoard
				initialProjects={data}
				isCreatingEpic={createEpicMutation.isPending}
				isCreatingProject={createProjectMutation.isPending}
				isCreatingTask={createTaskMutation.isPending}
				onCreateEpic={handleCreateEpic}
				onMoveTasks={handleMoveTasks}
				onCreateProject={handleCreateProject}
				onCreateTask={handleCreateTask}
			/>
		</div>
	);
};
