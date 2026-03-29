export const taskQueryKeys = {
	all: () => ["tasks"] as const,
	byId: (id: string) => ["tasks", id] as const,
};
