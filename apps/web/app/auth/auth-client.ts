"use client";

import { createAuthClient } from "better-auth/react";

const AUTH_BASE_URL =
	process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4001";

export const authClient: ReturnType<typeof createAuthClient> = createAuthClient(
	{
		baseURL: AUTH_BASE_URL,
		fetchOptions: {
			credentials: "include",
		},
	},
);
