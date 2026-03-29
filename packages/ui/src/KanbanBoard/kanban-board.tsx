"use client";

import {
	KANBAN_COLUMN_KEYS,
	KANBAN_COLUMN_SETTINGS,
	KANBAN_COLUMN_TITLES,
} from "@repo/constants/Kanban/board";
import { useKanbanBoard } from "@repo/lib/Kanban/use-kanban-board";
import { useState } from "react";
import { Button } from "../Button/button";
import { DependencyAutocomplete } from "../DependencyAutocomplete/dependency-autocomplete";
import { EpicList } from "../EpicList/epic-list";
import { KanbanColumn } from "../KanbanColumn/kanban-column";
import { KanbanTaskCard } from "../KanbanTaskCard/kanban-task-card";
import { Modal } from "../Modal/modal";

interface KanbanBoardProps {
	id?: string;
}

export const KanbanBoard = ({ id = "kanban-board" }: KanbanBoardProps) => {
	const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
	const [isCreateEpicOpen, setIsCreateEpicOpen] = useState(false);
	const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
	const [projectForm, setProjectForm] = useState({
		name: "",
		abbreviation: "",
		githubRepoUrl: "",
	});
	const [epicForm, setEpicForm] = useState({
		name: "",
		description: "",
	});
	const [taskForm, setTaskForm] = useState({
		title: "",
		description: "",
		epicId: "",
		dependencyTaskIds: [] as string[],
	});
	const [dependencySearch, setDependencySearch] = useState("");
	const [taskFormError, setTaskFormError] = useState<string | null>(null);
	const {
		activeDropColumn,
		activeProject,
		getDependencyOptions,
		getEpicById,
		getCountForColumn,
		getTasksForColumn,
		handleCreateEpic,
		handleCreateProject,
		handleCreateTask,
		handleDragEnd,
		handleDragLeave,
		handleDragOver,
		handleDragStart,
		handleDrop,
		handleSelectProject,
		projects,
	} = useKanbanBoard();

	const isCreateDisabled =
		projectForm.name.trim().length === 0 ||
		projectForm.abbreviation.trim().length === 0 ||
		projectForm.githubRepoUrl.trim().length === 0;
	const isCreateEpicDisabled = epicForm.name.trim().length === 0;
	const taskRequiresDependency = (activeProject?.tasks.length ?? 0) > 0;
	const isCreateTaskDisabled =
		taskForm.title.trim().length === 0 ||
		taskForm.epicId.length === 0 ||
		(taskRequiresDependency && taskForm.dependencyTaskIds.length === 0);

	const handleSubmitProject = () => {
		if (isCreateDisabled) {
			return;
		}

		handleCreateProject(projectForm);
		setProjectForm({
			name: "",
			abbreviation: "",
			githubRepoUrl: "",
		});
		setIsCreateProjectOpen(false);
	};

	const handleSubmitEpic = () => {
		if (isCreateEpicDisabled) {
			return;
		}

		handleCreateEpic(epicForm);
		setEpicForm({
			name: "",
			description: "",
		});
		setIsCreateEpicOpen(false);
	};

	const handleSubmitTask = () => {
		const outcome = handleCreateTask(taskForm);

		if (!outcome.success) {
			setTaskFormError(outcome.reason);
			return;
		}

		setTaskForm({
			title: "",
			description: "",
			epicId: "",
			dependencyTaskIds: [],
		});
		setDependencySearch("");
		setTaskFormError(null);
		setIsCreateTaskOpen(false);
	};

	const epicCards =
		activeProject?.epics.map((epic) => ({
			...epic,
			taskCount: activeProject.tasks.filter((task) => task.epicId === epic.id)
				.length,
		})) ?? [];
	const dependencyOptions = getDependencyOptions("");

	return (
		<section
			id={id}
			className="flex min-h-screen flex-col bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] lg:flex-row"
		>
			<aside className="border-b border-slate-200 bg-slate-950 px-4 py-6 text-slate-50 lg:w-80 lg:border-r lg:border-b-0">
				<div className="flex items-center justify-between gap-4">
					<div>
						<p className="text-sm uppercase tracking-[0.3em] text-slate-400">
							Projects
						</p>
						<h1 className="mt-2 text-2xl font-semibold">Workspace Boards</h1>
					</div>
					<Button
						type="button"
						size="small"
						onClick={() => setIsCreateProjectOpen((current) => !current)}
					>
						New Project
					</Button>
				</div>
				<p className="mt-4 text-sm text-slate-300">
					Each project keeps its own repository link and ticket namespace.
				</p>
				<div className="mt-6 space-y-3">
					{projects.map((project) => {
						const isActiveProject = project.id === activeProject?.id;

						return (
							<button
								key={project.id}
								type="button"
								onClick={() => handleSelectProject(project.id)}
								className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
									isActiveProject
										? "border-cyan-300 bg-cyan-100 text-slate-950 shadow-lg"
										: "border-slate-800 bg-slate-900/80 text-slate-100 hover:border-slate-700 hover:bg-slate-900"
								}`}
							>
								<div className="flex items-center justify-between gap-3">
									<p className="font-semibold">{project.name}</p>
									<span className="rounded-full bg-slate-950/10 px-2 py-1 text-xs font-semibold tracking-wide">
										{project.abbreviation}
									</span>
								</div>
								<p className="mt-2 text-sm text-inherit/80">
									{project.tasks.length} tasks
								</p>
							</button>
						);
					})}
				</div>
			</aside>
			<div className="flex-1 px-4 py-6 lg:px-8">
				<div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
					<div className="flex flex-col gap-3 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
						<div>
							<p className="text-sm uppercase tracking-[0.25em] text-cyan-700">
								{activeProject?.abbreviation ?? "No Project"}
							</p>
							<h2 className="mt-2 text-3xl font-semibold text-slate-950">
								{activeProject?.name ?? "Select a project"}
							</h2>
							<p className="mt-3 max-w-2xl text-sm text-slate-600">
								Every board is now scoped to a single project, so task flow,
								ticket IDs, and repository context stay together.
							</p>
						</div>
						<div className="flex flex-wrap gap-3">
							{activeProject ? (
								<>
									<Button
										type="button"
										intent="secondary"
										onClick={() => setIsCreateEpicOpen(true)}
									>
										New Epic
									</Button>
									<Button
										type="button"
										onClick={() => {
											setTaskForm((current) => ({
												...current,
												epicId: activeProject.epics[0]?.id ?? "",
											}));
											setTaskFormError(null);
											setIsCreateTaskOpen(true);
										}}
									>
										New Task
									</Button>
									<a
										href={activeProject.githubRepoUrl}
										target="_blank"
										rel="noreferrer"
										className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
									>
										Open GitHub Repository
									</a>
								</>
							) : null}
						</div>
					</div>
					<div className="mt-6">
						<div className="mb-3 flex items-center justify-between gap-3">
							<div>
								<h3 className="text-lg font-semibold text-slate-950">Epics</h3>
								<p className="text-sm text-slate-600">
									Tasks belong to an epic and can depend on earlier work.
								</p>
							</div>
							{activeProject ? (
								<span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
									{activeProject.epics.length} epics
								</span>
							) : null}
						</div>
						<EpicList epics={epicCards} />
					</div>
					<div className="mt-6 flex gap-4 overflow-x-auto pb-2">
						{KANBAN_COLUMN_KEYS.map((columnKey) => (
							<KanbanColumn
								key={columnKey}
								backgroundColor={
									KANBAN_COLUMN_SETTINGS[columnKey].backgroundColor
								}
								isActiveDropColumn={activeDropColumn === columnKey}
								onDragLeave={() => handleDragLeave(columnKey)}
								onDragOver={(event) => handleDragOver(event, columnKey)}
								onDrop={(event) => handleDrop(event, columnKey)}
								taskCount={getCountForColumn(columnKey)}
								title={KANBAN_COLUMN_TITLES[columnKey]}
							>
								{getTasksForColumn(columnKey).map((task) => (
									<KanbanTaskCard
										key={task.id}
										dependencyTaskIds={task.dependencyTaskIds}
										epicName={getEpicById(task.epicId)?.name ?? "Unknown Epic"}
										task={task}
										onDragStart={(event) => handleDragStart(event, task.id)}
										onDragEnd={handleDragEnd}
									/>
								))}
								{getTasksForColumn(columnKey).length === 0 ? (
									<li className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-4 text-sm text-slate-500">
										No tasks in this lane yet.
									</li>
								) : null}
							</KanbanColumn>
						))}
					</div>
				</div>
			</div>
			<Modal
				isOpen={isCreateProjectOpen}
				onClose={() => setIsCreateProjectOpen(false)}
				title="Create project"
				description="Add a project name, ticket abbreviation, and GitHub repository URL."
			>
				<div className="space-y-3">
					<label className="block text-sm">
						<span className="mb-1 block text-slate-700">Name</span>
						<input
							value={projectForm.name}
							onChange={(event) =>
								setProjectForm((current) => ({
									...current,
									name: event.target.value,
								}))
							}
							placeholder="Project Phoenix"
							className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-950 outline-none placeholder:text-slate-400 focus:border-cyan-500"
						/>
					</label>
					<label className="block text-sm">
						<span className="mb-1 block text-slate-700">Abbreviation</span>
						<input
							value={projectForm.abbreviation}
							onChange={(event) =>
								setProjectForm((current) => ({
									...current,
									abbreviation: event.target.value.toUpperCase(),
								}))
							}
							placeholder="PHX"
							className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-950 uppercase outline-none placeholder:text-slate-400 focus:border-cyan-500"
						/>
					</label>
					<label className="block text-sm">
						<span className="mb-1 block text-slate-700">GitHub repo URL</span>
						<input
							type="url"
							value={projectForm.githubRepoUrl}
							onChange={(event) =>
								setProjectForm((current) => ({
									...current,
									githubRepoUrl: event.target.value,
								}))
							}
							placeholder="https://github.com/org/repo"
							className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-950 outline-none placeholder:text-slate-400 focus:border-cyan-500"
						/>
					</label>
				</div>
				<div className="mt-6 flex gap-3">
					<Button
						type="button"
						onClick={handleSubmitProject}
						disabled={isCreateDisabled}
					>
						Create
					</Button>
					<Button
						type="button"
						intent="secondary"
						onClick={() => setIsCreateProjectOpen(false)}
					>
						Cancel
					</Button>
				</div>
			</Modal>
			<Modal
				isOpen={isCreateEpicOpen}
				onClose={() => setIsCreateEpicOpen(false)}
				title="Create epic"
				description="Create a reusable epic grouping for related tasks."
			>
				<div className="space-y-3">
					<label className="block text-sm">
						<span className="mb-1 block text-slate-700">Epic name</span>
						<input
							value={epicForm.name}
							onChange={(event) =>
								setEpicForm((current) => ({
									...current,
									name: event.target.value,
								}))
							}
							placeholder="Checkout Experience"
							className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-950 outline-none placeholder:text-slate-400 focus:border-cyan-500"
						/>
					</label>
					<label className="block text-sm">
						<span className="mb-1 block text-slate-700">Description</span>
						<textarea
							value={epicForm.description}
							onChange={(event) =>
								setEpicForm((current) => ({
									...current,
									description: event.target.value,
								}))
							}
							placeholder="Shared business outcome or release stream."
							className="min-h-24 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-950 outline-none placeholder:text-slate-400 focus:border-cyan-500"
						/>
					</label>
				</div>
				<div className="mt-6 flex gap-3">
					<Button
						type="button"
						onClick={handleSubmitEpic}
						disabled={isCreateEpicDisabled}
					>
						Create epic
					</Button>
					<Button
						type="button"
						intent="secondary"
						onClick={() => setIsCreateEpicOpen(false)}
					>
						Cancel
					</Button>
				</div>
			</Modal>
			<Modal
				isOpen={isCreateTaskOpen}
				onClose={() => setIsCreateTaskOpen(false)}
				title="Create task"
				description="Choose an epic and add at least one dependency unless this is the first task on the project."
			>
				<div className="space-y-3">
					<label className="block text-sm">
						<span className="mb-1 block text-slate-700">Task title</span>
						<input
							value={taskForm.title}
							onChange={(event) =>
								setTaskForm((current) => ({
									...current,
									title: event.target.value,
								}))
							}
							placeholder="Implement billing webhook"
							className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-950 outline-none placeholder:text-slate-400 focus:border-cyan-500"
						/>
					</label>
					<label className="block text-sm">
						<span className="mb-1 block text-slate-700">Description</span>
						<textarea
							value={taskForm.description}
							onChange={(event) =>
								setTaskForm((current) => ({
									...current,
									description: event.target.value,
								}))
							}
							placeholder="Optional implementation details."
							className="min-h-24 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-950 outline-none placeholder:text-slate-400 focus:border-cyan-500"
						/>
					</label>
					<label className="block text-sm">
						<span className="mb-1 block text-slate-700">Epic</span>
						<select
							value={taskForm.epicId}
							onChange={(event) =>
								setTaskForm((current) => ({
									...current,
									epicId: event.target.value,
								}))
							}
							className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-950 outline-none focus:border-cyan-500"
						>
							<option value="">Select an epic</option>
							{activeProject?.epics.map((epic) => (
								<option key={epic.id} value={epic.id}>
									{epic.name}
								</option>
							))}
						</select>
					</label>
					<div className="text-sm">
						<div className="mb-1 flex items-center justify-between gap-3">
							<span className="block text-slate-700">Dependencies</span>
							<span className="text-xs text-slate-500">
								{taskRequiresDependency
									? "Required after the first task"
									: "Optional for the first task"}
							</span>
						</div>
						<DependencyAutocomplete
							options={dependencyOptions.map((task) => ({
								id: task.id,
								label: task.title,
								description: getEpicById(task.epicId)?.name,
							}))}
							search={dependencySearch}
							setSearch={setDependencySearch}
							selectedIds={taskForm.dependencyTaskIds}
							onChange={(nextSelection) =>
								setTaskForm((current) => ({
									...current,
									dependencyTaskIds: nextSelection,
								}))
							}
							placeholder="Search by task ID, title, or epic"
						/>
					</div>
					{activeProject?.epics.length === 0 ? (
						<p className="rounded-2xl border border-dashed border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">
							Create an epic before adding tasks to this project.
						</p>
					) : null}
					{taskFormError ? (
						<p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-700">
							{taskFormError}
						</p>
					) : null}
				</div>
				<div className="mt-6 flex gap-3">
					<Button
						type="button"
						onClick={handleSubmitTask}
						disabled={
							isCreateTaskDisabled || (activeProject?.epics.length ?? 0) === 0
						}
					>
						Create task
					</Button>
					<Button
						type="button"
						intent="secondary"
						onClick={() => setIsCreateTaskOpen(false)}
					>
						Cancel
					</Button>
				</div>
			</Modal>
		</section>
	);
};
