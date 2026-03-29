"use client";

import type { Epic, Task } from "@repo/types/Kanban/types";
import { useEffect, useState } from "react";
import { Button } from "../Button/button";
import { DependencyAutocomplete } from "../DependencyAutocomplete/dependency-autocomplete";
import { Modal } from "../Modal/modal";

interface TaskDetailsModalProps {
	dependencyOptions: Array<{
		description?: string;
		id: string;
		label: string;
	}>;
	dependentTasks: Task[];
	dependencyTasks: Task[];
	epics: Epic[];
	error?: string | null;
	isOpen: boolean;
	isSaving?: boolean;
	onClose: () => void;
	onCreateDependent: () => void;
	onOpenTask: (taskId: string) => void;
	onSave: (input: {
		dependencyTaskIds: string[];
		description?: string;
		epicId: string;
		taskId: string;
		title: string;
	}) => Promise<void> | void;
	task: Task | null;
}

export const TaskDetailsModal = ({
	dependencyOptions,
	dependentTasks,
	dependencyTasks,
	epics,
	error = null,
	isOpen,
	isSaving = false,
	onClose,
	onCreateDependent,
	onOpenTask,
	onSave,
	task,
}: TaskDetailsModalProps) => {
	const [search, setSearch] = useState("");
	const [form, setForm] = useState({
		title: "",
		description: "",
		epicId: "",
		dependencyTaskIds: [] as string[],
	});

	useEffect(() => {
		if (!task) {
			return;
		}

		setForm({
			title: task.title,
			description: task.description ?? "",
			epicId: task.epicId,
			dependencyTaskIds: task.dependencyTaskIds,
		});
		setSearch("");
	}, [task]);

	if (!task) {
		return null;
	}

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={`Task details: ${task.id}`}
			description="Review task metadata, edit dependencies, and jump around the dependency chain."
		>
			<div className="space-y-4">
				<label className="block text-sm">
					<span className="mb-1 block text-slate-700">Task title</span>
					<input
						value={form.title}
						onChange={(event) =>
							setForm((current) => ({
								...current,
								title: event.target.value,
							}))
						}
						className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-950 outline-none focus:border-cyan-500"
					/>
				</label>
				<label className="block text-sm">
					<span className="mb-1 block text-slate-700">Description</span>
					<textarea
						value={form.description}
						onChange={(event) =>
							setForm((current) => ({
								...current,
								description: event.target.value,
							}))
						}
						className="min-h-24 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-950 outline-none focus:border-cyan-500"
					/>
				</label>
				<label className="block text-sm">
					<span className="mb-1 block text-slate-700">Epic</span>
					<select
						value={form.epicId}
						onChange={(event) =>
							setForm((current) => ({
								...current,
								epicId: event.target.value,
							}))
						}
						className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-950 outline-none focus:border-cyan-500"
					>
						<option value="">Select an epic</option>
						{epics.map((epic) => (
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
							Dependencies must stay on this project
						</span>
					</div>
					<DependencyAutocomplete
						options={dependencyOptions}
						search={search}
						setSearch={setSearch}
						selectedIds={form.dependencyTaskIds}
						onChange={(nextSelection) =>
							setForm((current) => ({
								...current,
								dependencyTaskIds: nextSelection,
							}))
						}
						placeholder="Search dependency tasks"
					/>
				</div>
				<div className="grid gap-4 md:grid-cols-2">
					<div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
						<div className="flex items-center justify-between gap-2">
							<h4 className="text-sm font-semibold text-slate-900">
								Dependencies
							</h4>
							<span className="text-xs text-slate-500">
								{dependencyTasks.length}
							</span>
						</div>
						<div className="mt-3 space-y-2">
							{dependencyTasks.length > 0 ? (
								dependencyTasks.map((dependencyTask) => (
									<button
										key={dependencyTask.id}
										type="button"
										onClick={() => onOpenTask(dependencyTask.id)}
										className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
									>
										{dependencyTask.id} {dependencyTask.title}
									</button>
								))
							) : (
								<p className="text-sm text-slate-500">No dependencies.</p>
							)}
						</div>
					</div>
					<div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
						<div className="flex items-center justify-between gap-2">
							<h4 className="text-sm font-semibold text-slate-900">
								Dependents
							</h4>
							<span className="text-xs text-slate-500">
								{dependentTasks.length}
							</span>
						</div>
						<div className="mt-3 space-y-2">
							{dependentTasks.length > 0 ? (
								dependentTasks.map((dependentTask) => (
									<button
										key={dependentTask.id}
										type="button"
										onClick={() => onOpenTask(dependentTask.id)}
										className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
									>
										{dependentTask.id} {dependentTask.title}
									</button>
								))
							) : (
								<p className="text-sm text-slate-500">No dependents yet.</p>
							)}
						</div>
					</div>
				</div>
				{error ? (
					<p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-700">
						{error}
					</p>
				) : null}
			</div>
			<div className="mt-6 flex flex-wrap gap-3">
				<Button
					type="button"
					onClick={() =>
						void onSave({
							taskId: task.id,
							title: form.title,
							description: form.description || undefined,
							epicId: form.epicId,
							dependencyTaskIds: form.dependencyTaskIds,
						})
					}
					disabled={isSaving}
				>
					{isSaving ? "Saving..." : "Save task"}
				</Button>
				<Button type="button" intent="secondary" onClick={onCreateDependent}>
					Create dependent
				</Button>
				<Button type="button" intent="secondary" onClick={onClose}>
					Close
				</Button>
			</div>
		</Modal>
	);
};
