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
import { MOCK_PROJECTS } from "@repo/constants/Kanban/mock-projects";
import { DependencyTimeline } from "./dependency-timeline";

const primaryProject = MOCK_PROJECTS[0]!;

afterEach(() => {
	cleanup();
});

describe("DependencyTimeline", () => {
	it("renders timeline columns by dependency depth", () => {
		render(<DependencyTimeline project={primaryProject} />);

		expect(
			screen.getByRole("heading", { name: "Task flow by dependency depth" }),
		).toBeInTheDocument();
		expect(
			screen.getByLabelText("Starting tasks timeline column"),
		).toBeInTheDocument();
		expect(
			screen.getByLabelText("Depends on 1 step timeline column"),
		).toBeInTheDocument();

		const startingColumn = screen.getByLabelText("Starting tasks timeline column");
		expect(
			within(startingColumn).getByText("Implement authentication"),
		).toBeInTheDocument();
		expect(
			screen.getByLabelText("Dependency flow connections"),
		).toBeInTheDocument();
	});

	it("renders an empty state when there are no tasks", () => {
		render(
			<DependencyTimeline
				project={{
					...primaryProject,
					tasks: [],
				}}
			/>,
		);

		expect(screen.getByText("No tasks yet")).toBeInTheDocument();
	});

	it("highlights the selected task and its dependency chain", () => {
		render(<DependencyTimeline project={primaryProject} />);

		const selectedTask = screen.getByRole("button", {
			name: /KAN-2[\s\S]*Design database schema/i,
		});

		fireEvent.click(selectedTask);

		expect(selectedTask).toHaveAttribute("aria-pressed", "true");
		expect(screen.getByText("Selected task")).toBeInTheDocument();
		expect(screen.getByText("Dependency")).toBeInTheDocument();
		expect(screen.getByText("Dependent")).toBeInTheDocument();
	});

	it("clears the highlight when the selected task is clicked again", () => {
		render(<DependencyTimeline project={primaryProject} />);

		const selectedTask = screen.getByRole("button", {
			name: /KAN-2[\s\S]*Design database schema/i,
		});

		fireEvent.click(selectedTask);
		fireEvent.click(selectedTask);

		expect(selectedTask).toHaveAttribute("aria-pressed", "false");
		expect(screen.queryByText("Selected task")).not.toBeInTheDocument();
	});
});
