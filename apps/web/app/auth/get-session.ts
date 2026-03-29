import { headers } from "next/headers";

const AUTH_BASE_URL =
	process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4001";

interface ServerSession {
	session: {
		id: string;
	};
	user: {
		email: string;
		id: string;
		name: string;
	};
}

export const getServerSession = async () => {
	const requestHeaders = await headers();
	const cookieHeader = requestHeaders.get("cookie");

	if (!cookieHeader) {
		return null;
	}

	const response = await fetch(`${AUTH_BASE_URL}/api/auth/get-session`, {
		headers: {
			cookie: cookieHeader,
		},
		cache: "no-store",
	});

	if (!response.ok) {
		return null;
	}

	const session = (await response.json()) as ServerSession | null;

	return session?.user ? session : null;
};
