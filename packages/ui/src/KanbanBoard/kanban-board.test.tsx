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
	it("renders the project sidebar and the active board", () => {
		render(<KanbanBoard />);

		expect(screen.getByText("Workspace Boards")).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { name: "Kainban Platform" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: "Open GitHub Repository" }),
		).toHaveAttribute("href", "https://github.com/example/kainban");
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

	it("switches boards when a different project is selected", () => {
		render(<KanbanBoard />);

		fireEvent.click(screen.getByRole("button", { name: /Developer Docs/i }));

		expect(
			screen.getByRole("heading", { name: "Developer Docs" }),
		).toBeInTheDocument();
		expect(screen.getByText("DOC-1")).toBeInTheDocument();
		expect(
			screen.queryByText("Implement authentication"),
		).not.toBeInTheDocument();
	});

	it("creates a project from the sidebar form", () => {
		render(<KanbanBoard />);

		fireEvent.click(screen.getByRole("button", { name: "New Project" }));
		fireEvent.change(screen.getByPlaceholderText("Project Phoenix"), {
			target: { value: "Client Portal" },
		});
		fireEvent.change(screen.getByPlaceholderText("PHX"), {
			target: { value: "cp" },
		});
		fireEvent.change(
			screen.getByPlaceholderText("https://github.com/org/repo"),
			{
				target: { value: "https://github.com/example/client-portal" },
			},
		);
		fireEvent.click(screen.getByRole("button", { name: "Create" }));

		expect(
			screen.getByRole("heading", { name: "Client Portal" }),
		).toBeInTheDocument();
		expect(screen.getAllByText("CP")).toHaveLength(2);
		expect(
			screen.getByRole("link", { name: "Open GitHub Repository" }),
		).toHaveAttribute("href", "https://github.com/example/client-portal");
	});
});
