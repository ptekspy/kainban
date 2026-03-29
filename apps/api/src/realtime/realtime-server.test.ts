import { describe, expect, it, vi } from "vitest";
import { createRealtimeServer } from "./realtime-server.js";

describe("realtime server", () => {
	it("broadcasts realtime events to connected clients", () => {
		const realtimeServer = createRealtimeServer();
		const socket = {
			OPEN: 1,
			readyState: 1,
			on: vi.fn(),
			send: vi.fn(),
		} as unknown as Parameters<
			typeof realtimeServer.webSocketServer.emit
		>[1];

		realtimeServer.webSocketServer.emit(
			"connection",
			socket,
			{} as Parameters<typeof realtimeServer.webSocketServer.emit>[2],
		);
		socket.send.mockClear();

		realtimeServer.publish({
			action: "updated",
			entity: "task",
			entityId: "task-1",
			projectId: "project-1",
			type: "task.updated",
		});

		expect(socket.send).toHaveBeenCalledWith(
			expect.stringContaining("\"type\":\"task.updated\""),
		);
		expect(socket.send).toHaveBeenCalledWith(
			expect.stringContaining("\"entityId\":\"task-1\""),
		);
	});
});
