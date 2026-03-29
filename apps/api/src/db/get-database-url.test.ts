import { afterEach, describe, expect, it, vi } from "vitest";

const originalDatabaseUrl = process.env.DATABASE_URL;

afterEach(() => {
	if (originalDatabaseUrl === undefined) {
		delete process.env.DATABASE_URL;
		return;
	}

	process.env.DATABASE_URL = originalDatabaseUrl;
});

describe("getDatabaseUrl", () => {
	it("returns the configured database url", async () => {
		process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/kainban";
		const { getDatabaseUrl } = await import("./get-database-url.js");

		expect(getDatabaseUrl()).toBe(process.env.DATABASE_URL);
	});

	it("throws when the database url is missing", async () => {
		delete process.env.DATABASE_URL;
		const { getDatabaseUrl } = await import("./get-database-url.js");

		expect(() => getDatabaseUrl()).toThrow(
			"DATABASE_URL must be defined before using PrismaClient.",
		);
	});
});
