// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TaskDetailsModal } from "./task-details-modal";

afterEach(() => {
	cleanup();
});

describe("TaskDetailsModal", () => {
	it("saves edited task details", async () => {
		const onSave = vi.fn().mockResolvedValue(undefined);

		render(
			<TaskDetailsModal
				isOpen
				task={{
					id: "KAN-2",
					title: "Design database schema",
					description: "Existing",
					column: "IN_DEVELOPMENT",
					epicId: "epic-1",
					dependencyTaskIds: ["KAN-1"],
				}}
				epics={[{ id: "epic-1", name: "Platform" }]}
				dependencyOptions={[
					{ id: "KAN-1", label: "Implement auth", description: "Platform" },
				]}
				dependencyTasks={[]}
				dependentTasks={[]}
				onClose={vi.fn()}
				onCreateDependent={vi.fn()}
				onOpenTask={vi.fn()}
				onSave={onSave}
			/>,
		);

		fireEvent.change(screen.getByDisplayValue("Design database schema"), {
			target: { value: "Design schema v2" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Save task" }));

		await waitFor(() => {
			expect(onSave).toHaveBeenCalledWith({
				taskId: "KAN-2",
				title: "Design schema v2",
				description: "Existing",
				epicId: "epic-1",
				dependencyTaskIds: ["KAN-1"],
			});
		});
	});
});
