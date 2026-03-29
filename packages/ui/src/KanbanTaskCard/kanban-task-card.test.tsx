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
				dependencyTaskIds={[]}
				epicName="Authentication and Access"
				task={{
					id: "task-1",
					title: "Implement authentication",
					description: "Set up user authentication using JWT.",
					column: "READY_FOR_DEVELOPMENT",
					epicId: "epic-1",
					dependencyTaskIds: [],
				}}
				onDragStart={vi.fn()}
				onDragEnd={vi.fn()}
			/>,
		);

		expect(screen.getByText("Implement authentication")).toBeInTheDocument();
		expect(screen.getByText("Authentication and Access")).toBeInTheDocument();
		expect(
			screen.getByText("Set up user authentication using JWT."),
		).toBeInTheDocument();
	});

	it("forwards drag handlers", () => {
		const handleDragStart = vi.fn();
		const handleDragEnd = vi.fn();

		const { container } = render(
			<KanbanTaskCard
				dependencyTaskIds={["task-0"]}
				epicName="Authentication and Access"
				task={{
					id: "task-1",
					title: "Implement authentication",
					column: "READY_FOR_DEVELOPMENT",
					epicId: "epic-1",
					dependencyTaskIds: ["task-0"],
				}}
				onDragStart={handleDragStart}
				onDragEnd={handleDragEnd}
			/>,
		);

		const taskCard = container.querySelector("li");

		expect(taskCard).not.toBeNull();

		fireEvent.dragStart(taskCard!);
		fireEvent.dragEnd(taskCard!);

		expect(screen.getByText("Depends on task-0")).toBeInTheDocument();
		expect(handleDragStart).toHaveBeenCalledTimes(1);
		expect(handleDragEnd).toHaveBeenCalledTimes(1);
	});
});
