import { getAllProjectsQuery } from "@repo/fe-api/Projects/getAll/query";
import {
	dehydrate,
	HydrationBoundary,
	QueryClient,
} from "@tanstack/react-query";
import { headers } from "next/headers";
import { getServerSession } from "./auth/get-session";
import { KanbanBoardPage } from "./kanban-board-page";

export default async function Home() {
	const queryClient = new QueryClient();
	const session = await getServerSession();

	if (session) {
		const requestHeaders = await headers();
		const cookieHeader = requestHeaders.get("cookie");

		await queryClient.prefetchQuery(
			getAllProjectsQuery({
				headers: cookieHeader
					? {
							cookie: cookieHeader,
						}
					: undefined,
			}),
		);
	}

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<KanbanBoardPage />
		</HydrationBoundary>
	);
}
