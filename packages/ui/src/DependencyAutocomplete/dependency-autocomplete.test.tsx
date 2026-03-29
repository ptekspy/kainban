// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DependencyAutocomplete } from "./dependency-autocomplete";

afterEach(() => {
	cleanup();
});

describe("DependencyAutocomplete", () => {
	it("filters options from the search value", () => {
		render(
			<DependencyAutocomplete
				options={[
					{ id: "KAN-1", label: "Implement authentication" },
					{ id: "KAN-2", label: "Design database schema" },
				]}
				search="auth"
				selectedIds={[]}
				setSearch={vi.fn()}
				onChange={vi.fn()}
			/>,
		);

		expect(screen.getByText("KAN-1")).toBeInTheDocument();
		expect(screen.queryByText("KAN-2")).not.toBeInTheDocument();
	});

	it("matches task id and description in search results", () => {
		render(
			<DependencyAutocomplete
				options={[
					{
						id: "KAN-1",
						label: "Implement authentication",
						description: "Platform",
					},
					{
						id: "KAN-2",
						label: "Design database schema",
						description: "Billing",
					},
				]}
				search="bill"
				selectedIds={[]}
				setSearch={vi.fn()}
				onChange={vi.fn()}
			/>,
		);

		expect(screen.getByText("KAN-2")).toBeInTheDocument();
		expect(screen.queryByText("KAN-1")).not.toBeInTheDocument();
	});

	it("adds and removes selected dependencies", () => {
		const onChange = vi.fn();
		const setSearch = vi.fn();

		const { rerender } = render(
			<DependencyAutocomplete
				options={[{ id: "KAN-1", label: "Implement authentication" }]}
				search=""
				selectedIds={[]}
				setSearch={setSearch}
				onChange={onChange}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: /KAN-1/i }));
		expect(onChange).toHaveBeenCalledWith(["KAN-1"]);
		expect(setSearch).toHaveBeenCalledWith("");

		rerender(
			<DependencyAutocomplete
				options={[{ id: "KAN-1", label: "Implement authentication" }]}
				search=""
				selectedIds={["KAN-1"]}
				setSearch={setSearch}
				onChange={onChange}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "KAN-1 x" }));
		expect(onChange).toHaveBeenCalledWith([]);
	});
});
