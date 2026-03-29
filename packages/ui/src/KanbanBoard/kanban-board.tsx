"use client";

import {
	KANBAN_COLUMN_KEYS,
	KANBAN_COLUMN_SETTINGS,
	KANBAN_COLUMN_TITLES,
} from "@repo/constants/Kanban/board";
import { useKanbanBoard } from "@repo/lib/Kanban/use-kanban-board";
import { useState } from "react";
import { Button } from "../Button/button";
import { KanbanColumn } from "../KanbanColumn/kanban-column";
import { KanbanTaskCard } from "../KanbanTaskCard/kanban-task-card";
import { Modal } from "../Modal/modal";

interface KanbanBoardProps {
	id?: string;
}

export const KanbanBoard = ({ id = "kanban-board" }: KanbanBoardProps) => {
	const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
	const [projectForm, setProjectForm] = useState({
		name: "",
		abbreviation: "",
		githubRepoUrl: "",
	});
	const {
		activeDropColumn,
		activeProject,
		getCountForColumn,
		getTasksForColumn,
		handleCreateProject,
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
						{activeProject && (
							<a
								href={activeProject.githubRepoUrl}
								target="_blank"
								rel="noreferrer"
								className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
							>
								Open GitHub Repository
							</a>
						)}
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
		</section>
	);
};
