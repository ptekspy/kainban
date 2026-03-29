"use client";

import { getTaskQueueOverviewQuery } from "@repo/fe-api/Task/getQueue/query";
import type { ApiTaskQueueItem } from "@repo/fe-api/shared/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { authClient } from "../auth/auth-client";
import { SignInForm } from "../auth/sign-in-form";

const statusTone = {
	HUMAN_INTERVENTION: "border-rose-200 bg-rose-50 text-rose-700",
	IN_DEVELOPMENT: "border-amber-200 bg-amber-50 text-amber-700",
	READY_FOR_DEVELOPMENT: "border-emerald-200 bg-emerald-50 text-emerald-700",
} as const;

const renderTaskCard = (task: ApiTaskQueueItem) => (
	<article
		key={task.id}
		className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60"
	>
		<div className="flex flex-wrap items-start justify-between gap-3">
			<div>
				<p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
					{task.project.abbreviation}-{task.ticketNumber}
				</p>
				<h2 className="mt-2 text-lg font-semibold text-slate-900">{task.title}</h2>
				<p className="mt-1 text-sm text-slate-500">
					{task.project.name} · {task.metric.epicName}
				</p>
			</div>
			<span
				className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${statusTone[task.status as keyof typeof statusTone]}`}
			>
				{task.status.replaceAll("_", " ")}
			</span>
		</div>
		{task.description ? (
			<p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-600">
				{task.description}
			</p>
		) : null}
		<div className="mt-4 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
			<div>
				<p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
					Branch
				</p>
				<p className="mt-1 break-all font-mono text-xs text-slate-700">
					{task.branchName ?? "Not assigned yet"}
				</p>
			</div>
			<div>
				<p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
					Worktree
				</p>
				<p className="mt-1 break-all font-mono text-xs text-slate-700">
					{task.worktreePath ?? "Not created yet"}
				</p>
			</div>
			<div>
				<p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
					Dependencies
				</p>
				<p className="mt-1 text-slate-700">
					{task.dependencyIds.length > 0 ? task.dependencyIds.length : "None"}
				</p>
			</div>
		</div>
	</article>
);

export const QueuePage = () => {
	const queryClient = useQueryClient();
	const session = authClient.useSession();
	const { data, error, isLoading } = useQuery({
		...getTaskQueueOverviewQuery(),
		enabled: !!session.data?.user,
		refetchInterval: 5_000,
	});

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
						queryKey: [...getTaskQueueOverviewQuery().queryKey],
					});
				}}
			/>
		);
	}

	if (isLoading && !data) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-50">
				Loading worker queue...
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-rose-50 px-6 text-center text-rose-700">
				Unable to load the worker queue right now.
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.12),_transparent_24%),linear-gradient(180deg,_#f8fafc_0%,_#e2e8f0_100%)] px-4 py-8 text-slate-950 sm:px-6 lg:px-10">
			<div className="mx-auto max-w-7xl">
				<div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-white/70 bg-white/85 px-6 py-5 shadow-lg shadow-slate-300/30 backdrop-blur">
					<div>
						<p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-600">
							Dev Worker Queue
						</p>
						<h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
							Current work and ready backlog
						</h1>
						<p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
							Monitor which tasks are actively being worked on, which ones are ready for development, and whether any tasks need human intervention.
						</p>
					</div>
					<div className="flex items-center gap-3">
						<Link
							href="/"
							className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
						>
							Board view
						</Link>
						<button
							type="button"
							onClick={async () => {
								await authClient.signOut();
								await session.refetch();
							}}
							className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
						>
							Sign out
						</button>
					</div>
				</div>

				<section className="mb-8 grid gap-4 md:grid-cols-3">
					<div className="rounded-[1.75rem] border border-amber-200 bg-white/90 p-5 shadow-sm shadow-amber-200/40">
						<p className="text-sm font-medium text-slate-500">Active now</p>
						<p className="mt-3 text-4xl font-semibold text-slate-900">{data.summary.activeCount}</p>
						<p className="mt-2 text-sm text-slate-600">Tasks currently locked by a worker.</p>
					</div>
					<div className="rounded-[1.75rem] border border-emerald-200 bg-white/90 p-5 shadow-sm shadow-emerald-200/40">
						<p className="text-sm font-medium text-slate-500">Ready queue</p>
						<p className="mt-3 text-4xl font-semibold text-slate-900">{data.summary.queuedCount}</p>
						<p className="mt-2 text-sm text-slate-600">Tasks waiting to be claimed for development.</p>
					</div>
					<div className="rounded-[1.75rem] border border-rose-200 bg-white/90 p-5 shadow-sm shadow-rose-200/40">
						<p className="text-sm font-medium text-slate-500">Needs human input</p>
						<p className="mt-3 text-4xl font-semibold text-slate-900">{data.summary.blockedCount}</p>
						<p className="mt-2 text-sm text-slate-600">Tasks blocked in `HUMAN_INTERVENTION`.</p>
					</div>
				</section>

				<div className="grid gap-8 xl:grid-cols-[1.2fr_1fr]">
					<section>
						<div className="mb-4 flex items-center justify-between">
							<h2 className="text-xl font-semibold text-slate-900">Currently in development</h2>
							<p className="text-sm text-slate-500">Refreshed every 5 seconds</p>
						</div>
						<div className="grid gap-4">
							{data.activeTasks.length > 0 ? (
								data.activeTasks.map(renderTaskCard)
							) : (
								<div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white/70 p-8 text-sm text-slate-500">
									No tasks are currently in development.
								</div>
							)}
						</div>
					</section>

					<div className="grid gap-8">
						<section>
							<h2 className="mb-4 text-xl font-semibold text-slate-900">Ready queue</h2>
							<div className="grid gap-4">
								{data.queuedTasks.length > 0 ? (
									data.queuedTasks.map(renderTaskCard)
								) : (
									<div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white/70 p-8 text-sm text-slate-500">
										No tasks are waiting in `READY_FOR_DEVELOPMENT`.
									</div>
								)}
							</div>
						</section>

						<section>
							<h2 className="mb-4 text-xl font-semibold text-slate-900">Needs human intervention</h2>
							<div className="grid gap-4">
								{data.blockedTasks.length > 0 ? (
									data.blockedTasks.map(renderTaskCard)
								) : (
									<div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white/70 p-8 text-sm text-slate-500">
										No tasks are currently blocked.
									</div>
								)}
							</div>
						</section>
					</div>
				</div>
			</div>
		</div>
	);
};