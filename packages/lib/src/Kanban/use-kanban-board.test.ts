// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import type { DragEvent } from "react";
import { describe, expect, it, vi } from "vitest";
import type { KanbanColumnKey } from "@repo/types/Kanban/types";
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
			result.current.handleDragStart(createItemEvent(dataTransfer), "1");
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
				.some((task) => task.id === "1"),
		).toBe(true);
		expect(result.current.activeDropColumn).toBeNull();
	});

	it("does not move a task to an invalid column", () => {
		const { result } = renderHook(() => useKanbanBoard());

		act(() => {
			result.current.handleMoveTask("1", "RELEASED");
		});

		expect(
			result.current
				.getTasksForColumn("READY_FOR_DEVELOPMENT")
				.some((task) => task.id === "1"),
		).toBe(true);
	});

	it("clears the active drop column when drag leaves the current target", () => {
		const { result } = renderHook(() => useKanbanBoard());
		const dataTransfer = createDataTransfer();
		const column = "IN_DEVELOPMENT" satisfies KanbanColumnKey;

		act(() => {
			result.current.handleDragStart(createItemEvent(dataTransfer), "1");
			result.current.handleDragOver(createListEvent(dataTransfer), column);
			result.current.handleDragLeave(column);
			result.current.handleDragEnd();
		});

		expect(result.current.activeDropColumn).toBeNull();
	});
});
