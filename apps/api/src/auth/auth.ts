import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "../db/client.js";

const betterAuthSecret = process.env.BETTER_AUTH_SECRET;
const betterAuthUrl = process.env.BETTER_AUTH_URL;
const webOrigin = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:4000";
const trustedLoopbackOrigin = (() => {
	try {
		const url = new URL(webOrigin);
		return `http://127.0.0.1:${url.port || "4000"}`;
	} catch {
		return "http://127.0.0.1:4000";
	}
})();

if (!betterAuthSecret) {
	throw new Error("BETTER_AUTH_SECRET must be defined before starting the API.");
}

if (!betterAuthUrl) {
	throw new Error("BETTER_AUTH_URL must be defined before starting the API.");
}

export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	baseURL: betterAuthUrl,
	secret: betterAuthSecret,
	trustedOrigins: [webOrigin, trustedLoopbackOrigin],
	emailAndPassword: {
		enabled: true,
	},
});
