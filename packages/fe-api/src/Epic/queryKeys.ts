export const epicQueryKeys = {
	all: () => ["epics"] as const,
	byId: (id: string) => ["epics", id] as const,
};
