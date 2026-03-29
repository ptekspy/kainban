// @vitest-environment jsdom

import type { KanbanColumnKey } from "@repo/types/Kanban/types";
import { act, renderHook } from "@testing-library/react";
import type { DragEvent } from "react";
import { describe, expect, it, vi } from "vitest";
import { useKanbanBoard } from "./use-kanban-board";

const createDataTransfer = () => {
	const values = new Map<string, string>();

	return {
		dropEffect: "none",
		effectAllowed: "all",
		getData: vi.fn((key: string) => values.get(key) ?? ""),
		setData: vi.fn((key: string, value: string) => {
			values.set(key, value);
		}),
	} as unknown as DataTransfer;
};

const createListEvent = (dataTransfer: DataTransfer) => {
	return {
		dataTransfer,
		preventDefault: vi.fn(),
	} as unknown as DragEvent<HTMLUListElement>;
};

const createItemEvent = (dataTransfer: DataTransfer) => {
	return {
		dataTransfer,
	} as unknown as DragEvent<HTMLLIElement>;
};

describe("useKanbanBoard", () => {
	it("moves a task through the drag-and-drop lifecycle", () => {
		const { result } = renderHook(() => useKanbanBoard());
		const dataTransfer = createDataTransfer();

		act(() => {
			result.current.handleDragStart(createItemEvent(dataTransfer), "KAN-1");
		});

		act(() => {
			result.current.handleDragOver(
				createListEvent(dataTransfer),
				"IN_DEVELOPMENT",
			);
		});

		expect(result.current.activeDropColumn).toBe("IN_DEVELOPMENT");

		act(() => {
			result.current.handleDrop(
				createListEvent(dataTransfer),
				"IN_DEVELOPMENT",
			);
		});

		expect(
			result.current
				.getTasksForColumn("IN_DEVELOPMENT")
				.some((task) => task.id === "KAN-1"),
		).toBe(true);
		expect(result.current.activeDropColumn).toBeNull();
	});

	it("does not move a task to an invalid column", () => {
		const { result } = renderHook(() => useKanbanBoard());

		act(() => {
			result.current.handleMoveTask("KAN-1", "RELEASED");
		});

		expect(
			result.current
				.getTasksForColumn("READY_FOR_DEVELOPMENT")
				.some((task) => task.id === "KAN-1"),
		).toBe(true);
	});

	it("clears the active drop column when drag leaves the current target", () => {
		const { result } = renderHook(() => useKanbanBoard());
		const dataTransfer = createDataTransfer();
		const column = "IN_DEVELOPMENT" satisfies KanbanColumnKey;

		act(() => {
			result.current.handleDragStart(createItemEvent(dataTransfer), "KAN-1");
			result.current.handleDragOver(createListEvent(dataTransfer), column);
			result.current.handleDragLeave(column);
			result.current.handleDragEnd();
		});

		expect(result.current.activeDropColumn).toBeNull();
	});

	it("switches between project boards", () => {
		const { result } = renderHook(() => useKanbanBoard());

		act(() => {
			result.current.handleSelectProject("project-docs");
		});

		expect(result.current.activeProject?.abbreviation).toBe("DOC");
		expect(result.current.getCountForColumn("TODO")).toBe(1);
		expect(result.current.getCountForColumn("READY_FOR_DEVELOPMENT")).toBe(0);
	});

	it("creates a project and focuses its empty board", () => {
		const { result } = renderHook(() => useKanbanBoard());

		act(() => {
			result.current.handleCreateProject({
				name: "Client Portal",
				abbreviation: "cp",
				githubRepoUrl: "https://github.com/example/client-portal",
			});
		});

		expect(result.current.activeProject).toMatchObject({
			name: "Client Portal",
			abbreviation: "CP",
			githubRepoUrl: "https://github.com/example/client-portal",
		});
		expect(result.current.projects).toHaveLength(3);
		expect(result.current.getCountForColumn("TODO")).toBe(0);
	});

	it("creates an epic on the active project", () => {
		const { result } = renderHook(() => useKanbanBoard());

		act(() => {
			result.current.handleCreateEpic({
				name: "Notifications",
				description: "Email and in-app messaging work.",
			});
		});

		expect(result.current.activeProject?.epics.at(-1)).toMatchObject({
			name: "Notifications",
			description: "Email and in-app messaging work.",
		});
	});

	it("allows the first task on a project to be created without dependencies", () => {
		const { result } = renderHook(() => useKanbanBoard());

		act(() => {
			result.current.handleCreateProject({
				name: "Client Portal",
				abbreviation: "cp",
				githubRepoUrl: "https://github.com/example/client-portal",
			});
		});

		act(() => {
			result.current.handleCreateEpic({
				name: "Portal Foundations",
			});
		});

		const epicId = result.current.activeProject?.epics[0]?.id;

		let outcome:
			| ReturnType<typeof result.current.handleCreateTask>
			| undefined = undefined;

		act(() => {
			outcome = result.current.handleCreateTask({
				title: "Set up workspace shell",
				epicId: epicId ?? "",
				dependencyTaskIds: [],
			});
		});

		expect(outcome).toMatchObject({ success: true });
		expect(result.current.activeProject?.tasks[0]).toMatchObject({
			id: "CP-1",
			dependencyTaskIds: [],
		});
	});

	it("requires dependencies for any task after the first one", () => {
		const { result } = renderHook(() => useKanbanBoard());

		let outcome:
			| ReturnType<typeof result.current.handleCreateTask>
			| undefined = undefined;

		act(() => {
			outcome = result.current.handleCreateTask({
				title: "Ship release notes",
				epicId: "kan-platform",
				dependencyTaskIds: [],
			});
		});

		expect(outcome).toMatchObject({
			success: false,
			reason: "Every task after the first one needs at least one dependency.",
		});
	});

	it("returns dependency search results for autocomplete", () => {
		const { result } = renderHook(() => useKanbanBoard());

		expect(
			result.current.getDependencyOptions("jwt").map((task) => task.id),
		).toEqual(["KAN-1"]);
		expect(
			result.current.getDependencyOptions("platform").map((task) => task.id),
		).toEqual(["KAN-3"]);
	});
});
