import { getTaskQueueOverviewQuery } from "@repo/fe-api/Task/getQueue/query";
import {
	dehydrate,
	HydrationBoundary,
	QueryClient,
} from "@tanstack/react-query";
import { headers } from "next/headers";
import { getServerSession } from "../auth/get-session";
import { QueuePage } from "./queue-page";

export default async function Queue() {
	const queryClient = new QueryClient();
	const session = await getServerSession();

	if (session) {
		const requestHeaders = await headers();
		const cookieHeader = requestHeaders.get("cookie");

		await queryClient.prefetchQuery({
			...getTaskQueueOverviewQuery(),
			queryFn: () =>
				fetch(
					`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4001"}/tasks/queue`,
					{
						cache: "no-store",
						credentials: "include",
						headers: cookieHeader
							? {
								cookie: cookieHeader,
							}
							: undefined,
					},
				).then(async (response) => {
					if (!response.ok) {
						throw new Error(`Failed to load queue with status ${response.status}`);
					}

					return response.json();
				}),
		});
	}

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<QueuePage />
		</HydrationBoundary>
	);
}