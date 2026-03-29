import type { IncomingMessage } from "node:http";
import { WebSocketServer, type WebSocket } from "ws";

type EntityType = "epic" | "project" | "task";
type EventAction = "created" | "deleted" | "updated";

export interface RealtimeEvent {
	action: EventAction;
	entity: EntityType;
	entityId: string;
	projectId?: string;
	type: `${EntityType}.${EventAction}`;
}

export interface RealtimePublisher {
	publish: (event: RealtimeEvent) => void;
}

const serializeEvent = (event: RealtimeEvent) =>
	JSON.stringify({
		...event,
		timestamp: new Date().toISOString(),
	});

export const createRealtimeServer = () => {
	const clients = new Set<WebSocket>();
	const webSocketServer = new WebSocketServer({
		noServer: true,
	});

	webSocketServer.on("connection", (socket: WebSocket) => {
		clients.add(socket);

		socket.send(
			JSON.stringify({
				type: "connected",
				timestamp: new Date().toISOString(),
			}),
		);

		socket.on("close", () => {
			clients.delete(socket);
		});
	});

	const handleUpgrade = (
		request: IncomingMessage,
		socket: Parameters<WebSocketServer["handleUpgrade"]>[1],
		head: Parameters<WebSocketServer["handleUpgrade"]>[2],
		onAccepted: (websocket: WebSocket) => void,
	) => {
		webSocketServer.handleUpgrade(
			request,
			socket,
			head,
			(websocket: WebSocket) => {
			webSocketServer.emit("connection", websocket, request);
			onAccepted(websocket);
			},
		);
	};

	const publish = (event: RealtimeEvent) => {
		const message = serializeEvent(event);

		for (const client of clients) {
			if (client.readyState === client.OPEN) {
				client.send(message);
			}
		}
	};

	return {
		handleUpgrade,
		publish,
		webSocketServer,
	};
};
