// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
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
		expect(screen.getAllByText("Authentication and Access").length).toBeGreaterThan(
			0,
		);
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

	it("uses the external move callback when provided", async () => {
		const onMoveTasks = vi.fn().mockResolvedValue(undefined);

		render(<KanbanBoard onMoveTasks={onMoveTasks} />);

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

		await waitFor(() => {
			expect(onMoveTasks).toHaveBeenCalledWith(
				[
					{
						taskId: "KAN-1",
						column: "IN_DEVELOPMENT",
					},
				],
				expect.objectContaining({
					id: "project-kainban",
				}),
			);
		});
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
		expect(
			screen.getByRole("dialog", { name: "Create project" }),
		).toBeInTheDocument();
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
		expect(
			screen.queryByRole("dialog", { name: "Create project" }),
		).not.toBeInTheDocument();
	});

	it("creates an epic and the first task without dependencies", () => {
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

		fireEvent.click(screen.getByRole("button", { name: "New Epic" }));
		fireEvent.change(screen.getByPlaceholderText("Checkout Experience"), {
			target: { value: "Portal Foundations" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Create epic" }));

		fireEvent.click(screen.getByRole("button", { name: "New Task" }));
		fireEvent.change(screen.getByPlaceholderText("Implement billing webhook"), {
			target: { value: "Set up workspace shell" },
		});
		fireEvent.change(screen.getByRole("combobox"), {
			target: { value: "cp-portal-foundations" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Create task" }));

		expect(screen.getByText("CP-1")).toBeInTheDocument();
		expect(
			screen.getByText("First task in dependency chain"),
		).toBeInTheDocument();
	});

	it("requires dependency selection for tasks after the first one", () => {
		render(<KanbanBoard />);

		fireEvent.click(screen.getByRole("button", { name: "New Task" }));
		fireEvent.change(screen.getByPlaceholderText("Implement billing webhook"), {
			target: { value: "Ship audit log" },
		});
		fireEvent.change(screen.getByRole("combobox"), {
			target: { value: "kan-platform" },
		});

		expect(screen.getByRole("button", { name: "Create task" })).toBeDisabled();

		fireEvent.change(
			screen.getByPlaceholderText("Search by task ID, title, or epic"),
			{
				target: { value: "pipeline" },
			},
		);
		fireEvent.click(screen.getByRole("button", { name: /KAN-3/i }));
		fireEvent.click(screen.getByRole("button", { name: "Create task" }));

		expect(screen.getByText("KAN-4")).toBeInTheDocument();
		expect(screen.getByText("Depends on KAN-3")).toBeInTheDocument();
	});

	it("uses the external project create callback when provided", async () => {
		const onCreateProject = vi
			.fn()
			.mockResolvedValue({ id: "project-client-portal" });

		render(<KanbanBoard onCreateProject={onCreateProject} />);

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

		await waitFor(() => {
			expect(onCreateProject).toHaveBeenCalledWith({
				name: "Client Portal",
				abbreviation: "CP",
				githubRepoUrl: "https://github.com/example/client-portal",
			});
		});
	});

	it("uses the external epic and task callbacks when provided", async () => {
		const onCreateEpic = vi.fn().mockResolvedValue(undefined);
		const onCreateTask = vi.fn().mockResolvedValue(undefined);

		render(
			<KanbanBoard
				onCreateEpic={onCreateEpic}
				onCreateTask={onCreateTask}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "New Epic" }));
		fireEvent.change(screen.getByPlaceholderText("Checkout Experience"), {
			target: { value: "Release Prep" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Create epic" }));

		await waitFor(() => {
			expect(onCreateEpic).toHaveBeenCalledWith(
				{
					name: "Release Prep",
					description: "",
				},
				expect.objectContaining({
					id: "project-kainban",
				}),
			);
		});

		fireEvent.click(screen.getByRole("button", { name: "New Task" }));
		fireEvent.change(screen.getByPlaceholderText("Implement billing webhook"), {
			target: { value: "Ship audit log" },
		});
		fireEvent.change(screen.getByRole("combobox"), {
			target: { value: "kan-platform" },
		});
		fireEvent.change(
			screen.getByPlaceholderText("Search by task ID, title, or epic"),
			{
				target: { value: "pipeline" },
			},
		);
		fireEvent.click(screen.getByRole("button", { name: /KAN-3/i }));
		fireEvent.click(screen.getByRole("button", { name: "Create task" }));

		await waitFor(() => {
			expect(onCreateTask).toHaveBeenCalledWith(
				{
					title: "Ship audit log",
					description: "",
					epicId: "kan-platform",
					dependencyTaskIds: ["KAN-3"],
				},
				expect.objectContaining({
					id: "project-kainban",
				}),
			);
		});
	});
});
