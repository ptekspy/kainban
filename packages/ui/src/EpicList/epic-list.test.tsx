// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { EpicList } from "./epic-list";

afterEach(() => {
	cleanup();
});

describe("EpicList", () => {
	it("renders empty-state guidance when there are no epics", () => {
		render(<EpicList epics={[]} />);

		expect(
			screen.getByText("Create an epic before adding tasks to this project."),
		).toBeInTheDocument();
	});

	it("renders epic cards with task counts", () => {
		render(
			<EpicList
				epics={[
					{
						id: "kan-auth",
						name: "Authentication and Access",
						description: "Identity workflows.",
						taskCount: 2,
					},
				]}
			/>,
		);

		expect(screen.getByText("Authentication and Access")).toBeInTheDocument();
		expect(screen.getByText("2 tasks")).toBeInTheDocument();
		expect(screen.getByText("Identity workflows.")).toBeInTheDocument();
	});
});
