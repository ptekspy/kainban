"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { projectQueryKeys } from "@repo/fe-api/Projects/queryKeys";

const API_BASE_URL =
	process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4001";

const getWebSocketUrl = () => {
	const apiUrl = new URL(API_BASE_URL);
	apiUrl.protocol = apiUrl.protocol === "https:" ? "wss:" : "ws:";
	apiUrl.pathname = "/ws";
	return apiUrl.toString();
};

export const useProjectRealtime = (enabled: boolean) => {
	const queryClient = useQueryClient();

	useEffect(() => {
		if (!enabled) {
			return;
		}

		const socket = new WebSocket(getWebSocketUrl());

		socket.addEventListener("message", (event) => {
			const payload = JSON.parse(event.data) as { entity?: string };

			if (
				payload.entity === "project" ||
				payload.entity === "epic" ||
				payload.entity === "task"
			) {
				void queryClient.invalidateQueries({
					queryKey: projectQueryKeys.all(),
				});
			}
		});

		return () => {
			socket.close();
		};
	}, [enabled, queryClient]);
};
