// @vitest-environment jsdom

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useProjectRealtime } from "./use-project-realtime";

const invalidateQueries = vi.fn();
const addEventListener = vi.fn();
const close = vi.fn();
class MockWebSocket {
	addEventListener = addEventListener;
	close = close;
}

vi.stubGlobal("WebSocket", MockWebSocket);

const TestHarness = ({ enabled }: { enabled: boolean }) => {
	useProjectRealtime(enabled);
	return null;
};

afterEach(() => {
	invalidateQueries.mockReset();
	addEventListener.mockReset();
	close.mockReset();
});

describe("useProjectRealtime", () => {
	it("subscribes to the websocket when enabled", () => {
		const queryClient = new QueryClient();
		queryClient.invalidateQueries = invalidateQueries as typeof queryClient.invalidateQueries;

		render(
			React.createElement(
				QueryClientProvider,
				{ client: queryClient },
				React.createElement(TestHarness, { enabled: true }),
			),
		);

		expect(WebSocket).toBe(MockWebSocket);
		expect(addEventListener).toHaveBeenCalledWith(
			"message",
			expect.any(Function),
		);
	});
});
