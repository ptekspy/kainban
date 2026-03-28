// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { KanbanTaskCard } from "./kanban-task-card";

afterEach(() => {
	cleanup();
});

describe("KanbanTaskCard", () => {
	it("renders the task title and description", () => {
		render(
			<KanbanTaskCard
				task={{
					id: "task-1",
					title: "Implement authentication",
					description: "Set up user authentication using JWT.",
					column: "READY_FOR_DEVELOPMENT",
				}}
				onDragStart={vi.fn()}
				onDragEnd={vi.fn()}
			/>,
		);

		expect(screen.getByText("Implement authentication")).toBeInTheDocument();
		expect(
			screen.getByText("Set up user authentication using JWT."),
		).toBeInTheDocument();
	});

	it("forwards drag handlers", () => {
		const handleDragStart = vi.fn();
		const handleDragEnd = vi.fn();

		const { container } = render(
			<KanbanTaskCard
				task={{
					id: "task-1",
					title: "Implement authentication",
					column: "READY_FOR_DEVELOPMENT",
				}}
				onDragStart={handleDragStart}
				onDragEnd={handleDragEnd}
			/>,
		);

		const taskCard = container.querySelector("li");

		expect(taskCard).not.toBeNull();

		fireEvent.dragStart(taskCard!);
		fireEvent.dragEnd(taskCard!);

		expect(handleDragStart).toHaveBeenCalledTimes(1);
		expect(handleDragEnd).toHaveBeenCalledTimes(1);
	});
});
