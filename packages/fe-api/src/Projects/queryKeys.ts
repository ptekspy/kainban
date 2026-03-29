export const projectQueryKeys = {
	all: () => ["projects"] as const,
	byId: (id: string) => ["projects", id] as const,
};
