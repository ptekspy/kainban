export const userQueryKeys = {
	all: () => ["users"] as const,
	byId: (id: string) => ["users", id] as const,
};
