"use client";

import type { FormEvent } from "react";
import React from "react";
import { authClient } from "./auth-client";

interface SignInFormProps {
	onSuccess: () => Promise<void> | void;
}

export const SignInForm = ({ onSuccess }: SignInFormProps) => {
	const [email, setEmail] = React.useState("");
	const [password, setPassword] = React.useState("");
	const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = React.useState(false);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setErrorMessage(null);
		setIsSubmitting(true);

		try {
			const result = await authClient.signIn.email({
				email,
				password,
			});

			if (result.error) {
				setErrorMessage(result.error.message ?? "Unable to sign in.");
				return;
			}

			await onSuccess();
		} catch (error) {
			setErrorMessage(
				error instanceof Error ? error.message : "Unable to sign in.",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#e0f2fe_0%,#f8fafc_45%,#e2e8f0_100%)] px-6 py-12">
			<div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white/95 p-8 shadow-[0_32px_120px_rgba(15,23,42,0.16)] backdrop-blur">
				<p className="text-sm uppercase tracking-[0.28em] text-cyan-700">
					Kainban
				</p>
				<h1 className="mt-3 text-3xl font-semibold text-slate-950">
					Sign in to your workspace
				</h1>
				<p className="mt-3 text-sm text-slate-600">
					Use the admin credentials from the repo environment to access the
					project boards.
				</p>
				<form className="mt-8 space-y-4" onSubmit={handleSubmit}>
					<label className="block text-sm">
						<span className="mb-1 block font-medium text-slate-700">Email</span>
						<input
							type="email"
							value={email}
							onChange={(event) => setEmail(event.target.value)}
							placeholder="admin@kainban.dev"
							className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-950 outline-none focus:border-cyan-500"
						/>
					</label>
					<label className="block text-sm">
						<span className="mb-1 block font-medium text-slate-700">
							Password
						</span>
						<input
							type="password"
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							placeholder="Enter your password"
							className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-950 outline-none focus:border-cyan-500"
						/>
					</label>
					{errorMessage ? (
						<p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-700">
							{errorMessage}
						</p>
					) : null}
					<button
						type="submit"
						disabled={isSubmitting}
						className="w-full rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-cyan-400"
					>
						{isSubmitting ? "Signing in..." : "Sign in"}
					</button>
				</form>
			</div>
		</div>
	);
};
