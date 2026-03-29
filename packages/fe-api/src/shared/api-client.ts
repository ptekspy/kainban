const API_BASE_URL =
	process.env["NEXT_PUBLIC_API_BASE_URL"] ?? "http://localhost:4001";

interface ApiRequestOptions {
	body?: unknown;
	headers?: HeadersInit;
	method?: "DELETE" | "GET" | "PATCH" | "POST";
}

export class ApiError extends Error {
	code?: string;
	details?: unknown;
	status: number;

	constructor(
		message: string,
		status: number,
		input?: {
			code?: string;
			details?: unknown;
		},
	) {
		super(message);
		this.name = "ApiError";
		this.code = input?.code;
		this.details = input?.details;
		this.status = status;
	}
}

export const apiRequest = async <TResponse>(
	path: string,
	options: ApiRequestOptions = {},
) => {
	const response = await fetch(`${API_BASE_URL}${path}`, {
		method: options.method ?? "GET",
		headers:
			options.body === undefined
				? options.headers
				: {
						"Content-Type": "application/json",
						...options.headers,
					},
		body: options.body === undefined ? undefined : JSON.stringify(options.body),
		cache: "no-store",
		credentials: "include",
	});

	if (!response.ok) {
		let message = `Request failed with status ${response.status}`;
		let apiError: ApiError | null = null;

		try {
			const errorBody = (await response.json()) as {
				code?: string;
				details?: unknown;
				message?: string;
			};
			if (errorBody.message) {
				message = errorBody.message;
			}

			apiError = new ApiError(message, response.status, {
				code: errorBody.code,
				details: errorBody.details,
			});
		} catch {
			// Ignore JSON parsing errors for empty responses.
		}

		throw apiError ?? new ApiError(message, response.status);
	}

	if (response.status === 204) {
		return null as TResponse;
	}

	return (await response.json()) as TResponse;
};
