// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Modal } from "./modal";

afterEach(() => {
	cleanup();
});

describe("Modal", () => {
	it("renders dialog content when open", () => {
		render(
			<Modal
				isOpen
				onClose={vi.fn()}
				title="Create project"
				description="Add a new project workspace."
			>
				<div>Modal body</div>
			</Modal>,
		);

		expect(
			screen.getByRole("dialog", { name: "Create project" }),
		).toBeInTheDocument();
		expect(
			screen.getByText("Add a new project workspace."),
		).toBeInTheDocument();
		expect(screen.getByText("Modal body")).toBeInTheDocument();
	});

	it("does not render when closed", () => {
		render(
			<Modal isOpen={false} onClose={vi.fn()} title="Create project">
				<div>Modal body</div>
			</Modal>,
		);

		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	it("calls onClose from the close button and backdrop", () => {
		const onClose = vi.fn();
		render(
			<Modal isOpen onClose={onClose} title="Create project">
				<div>Modal body</div>
			</Modal>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Close modal" }));
		fireEvent.click(screen.getByRole("dialog"));

		expect(onClose).toHaveBeenCalledTimes(2);
	});
});
