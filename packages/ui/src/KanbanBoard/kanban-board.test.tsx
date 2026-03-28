// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
	cleanup,
	fireEvent,
	render,
	screen,
	within,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { KanbanBoard } from "./kanban-board";

afterEach(() => {
	cleanup();
});

const createDataTransfer = () => {
	const values = new Map<string, string>();

	return {
		dropEffect: "none",
		effectAllowed: "all",
		getData: (key: string) => values.get(key) ?? "",
		setData: (key: string, value: string) => values.set(key, value),
	};
};

describe("KanbanBoard", () => {
	it("renders the board heading and starter columns", () => {
		render(<KanbanBoard />);

		expect(screen.getByText("Kanban Board")).toBeInTheDocument();
		expect(
			screen.getByLabelText("Ready for Development tasks"),
		).toBeInTheDocument();
		expect(screen.getByLabelText("In Development tasks")).toBeInTheDocument();
	});

	it("moves a task between valid columns using drag and drop", () => {
		render(<KanbanBoard />);

		const readyForDevelopment = screen.getByLabelText(
			"Ready for Development tasks",
		);
		const sourceTask = within(readyForDevelopment)
			.getByText("Implement authentication")
			.closest("li");
		const inDevelopment = screen.getByLabelText("In Development tasks");
		const dataTransfer = createDataTransfer();

		expect(sourceTask).not.toBeNull();

		fireEvent.dragStart(sourceTask!, { dataTransfer });
		fireEvent.dragOver(inDevelopment, { dataTransfer });
		fireEvent.drop(inDevelopment, { dataTransfer });
		fireEvent.dragEnd(sourceTask!, { dataTransfer });

		expect(
			within(readyForDevelopment).queryByText("Implement authentication"),
		).not.toBeInTheDocument();
		expect(
			within(inDevelopment).getByText("Implement authentication"),
		).toBeInTheDocument();
	});
});
