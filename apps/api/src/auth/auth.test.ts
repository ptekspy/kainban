import { Hono } from "hono";
import { describe, expect, it, vi } from "vitest";
import { requireAuth } from "./middleware.js";

vi.mock("./auth.js", () => ({
	auth: {
		api: {
			getSession: vi.fn(),
		},
	},
}));

const { auth } = await import("./auth.js");

describe("auth middleware", () => {
	it("returns 401 when no session is present", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValueOnce(null);

		const app = new Hono();
		app.use("/protected", requireAuth);
		app.get("/protected", (c) => c.json({ ok: true }));

		const response = await app.request("/protected");

		expect(response.status).toBe(401);
		expect(await response.json()).toEqual({
			message: "Authentication required",
		});
	});

	it("allows authenticated requests through", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValueOnce({
			session: {
				id: "session-1",
				createdAt: new Date(),
				expiresAt: new Date(Date.now() + 60_000),
				ipAddress: null,
				token: "token-1",
				updatedAt: new Date(),
				userAgent: null,
				userId: "user-1",
			},
			user: {
				id: "user-1",
				createdAt: new Date(),
				email: "admin@example.com",
				emailVerified: true,
				image: null,
				name: "Admin",
				updatedAt: new Date(),
			},
		});

		const app = new Hono();
		app.use("/protected", requireAuth);
		app.get("/protected", (c) => c.json({ ok: true }));

		const response = await app.request("/protected");

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ ok: true });
	});
});
