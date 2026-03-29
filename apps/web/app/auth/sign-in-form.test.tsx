// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SignInForm } from "./sign-in-form";

const { signInEmail } = vi.hoisted(() => ({
	signInEmail: vi.fn(),
}));

vi.mock("./auth-client", () => ({
	authClient: {
		signIn: {
			email: signInEmail,
		},
	},
}));

afterEach(() => {
	cleanup();
	signInEmail.mockReset();
});

describe("SignInForm", () => {
	it("submits credentials and calls onSuccess", async () => {
		const onSuccess = vi.fn();
		signInEmail.mockResolvedValue({
			data: {
				user: {
					id: "user-1",
				},
			},
			error: null,
		});

		render(React.createElement(SignInForm, { onSuccess }));

		fireEvent.change(screen.getByPlaceholderText("admin@kainban.dev"), {
			target: { value: "admin@kainban.dev" },
		});
		fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
			target: { value: "ChangeMe123!" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

		await waitFor(() => {
			expect(signInEmail).toHaveBeenCalledWith({
				email: "admin@kainban.dev",
				password: "ChangeMe123!",
			});
		});
		await waitFor(() => {
			expect(onSuccess).toHaveBeenCalledTimes(1);
		});
	});

	it("shows an auth error when sign-in fails", async () => {
		signInEmail.mockResolvedValue({
			data: null,
			error: {
				message: "Invalid credentials",
			},
		});

		render(React.createElement(SignInForm, { onSuccess: vi.fn() }));

		fireEvent.change(screen.getByPlaceholderText("admin@kainban.dev"), {
			target: { value: "admin@kainban.dev" },
		});
		fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
			target: { value: "wrong-password" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

		await waitFor(() => {
			expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
		});
	});
});
