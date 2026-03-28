// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { KanbanColumn } from "./kanban-column";

afterEach(() => {
	cleanup();
});

describe("KanbanColumn", () => {
	it("renders the column heading, count, and children", () => {
		render(
			<KanbanColumn
				backgroundColor="bg-blue-100"
				isActiveDropColumn={false}
				onDragLeave={vi.fn()}
				onDragOver={vi.fn()}
				onDrop={vi.fn()}
				taskCount={2}
				title="In Development"
			>
				<li>Task A</li>
			</KanbanColumn>,
		);

		expect(screen.getByText("In Development")).toBeInTheDocument();
		expect(screen.getByText("2 tasks")).toBeInTheDocument();
		expect(screen.getByText("Task A")).toBeInTheDocument();
	});

	it("forwards drag events to the task list", () => {
		const onDragOver = vi.fn();
		const onDragLeave = vi.fn();
		const onDrop = vi.fn();

		const { container } = render(
			<KanbanColumn
				backgroundColor="bg-blue-100"
				isActiveDropColumn
				onDragLeave={onDragLeave}
				onDragOver={onDragOver}
				onDrop={onDrop}
				taskCount={1}
				title="In Development"
			>
				<li>Task A</li>
			</KanbanColumn>,
		);

		const taskList = container.querySelector("ul");

		expect(taskList).not.toBeNull();

		fireEvent.dragOver(taskList!);
		fireEvent.dragLeave(taskList!);
		fireEvent.drop(taskList!);

		expect(onDragOver).toHaveBeenCalledTimes(1);
		expect(onDragLeave).toHaveBeenCalledTimes(1);
		expect(onDrop).toHaveBeenCalledTimes(1);
		expect(taskList?.parentElement).toHaveClass("border-slate-500");
	});
});
