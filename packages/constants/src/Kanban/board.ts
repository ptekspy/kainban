import type {
	KanbanColumnKey,
	KanbanColumnSettings,
	KanbanColumnTransitions,
} from "@repo/types/Kanban/types";

export const KANBAN_COLUMN_KEYS = [
	"TODO",
	"READY_FOR_DEVELOPMENT",
	"IN_DEVELOPMENT",
	"READY_FOR_REVIEW",
	"IN_REVIEW",
	"READY_FOR_RELEASE",
	"IN_RELEASE",
	"HUMAN_INTERVENTION",
	"RELEASED",
] as const satisfies readonly KanbanColumnKey[];

export const KANBAN_COLUMN_TITLES: Record<KanbanColumnKey, string> = {
	TODO: "To Do",
	READY_FOR_DEVELOPMENT: "Ready for Development",
	IN_DEVELOPMENT: "In Development",
	READY_FOR_REVIEW: "Ready for Review",
	IN_REVIEW: "In Review",
	READY_FOR_RELEASE: "Ready for Release",
	IN_RELEASE: "In Release",
	HUMAN_INTERVENTION: "Human Intervention Needed",
	RELEASED: "Released",
};

export const KANBAN_COLUMN_SETTINGS: Record<
	KanbanColumnKey,
	KanbanColumnSettings
> = {
	TODO: { statusColor: "bg-gray-500", backgroundColor: "bg-gray-100" },
	READY_FOR_DEVELOPMENT: {
		statusColor: "bg-yellow-500",
		backgroundColor: "bg-yellow-100",
	},
	IN_DEVELOPMENT: {
		statusColor: "bg-blue-500",
		backgroundColor: "bg-blue-100",
	},
	READY_FOR_REVIEW: {
		statusColor: "bg-purple-500",
		backgroundColor: "bg-purple-100",
	},
	IN_REVIEW: { statusColor: "bg-indigo-500", backgroundColor: "bg-indigo-100" },
	READY_FOR_RELEASE: {
		statusColor: "bg-green-500",
		backgroundColor: "bg-green-100",
	},
	IN_RELEASE: { statusColor: "bg-teal-500", backgroundColor: "bg-teal-100" },
	HUMAN_INTERVENTION: {
		statusColor: "bg-red-500",
		backgroundColor: "bg-red-100",
	},
	RELEASED: { statusColor: "bg-gray-700", backgroundColor: "bg-gray-200" },
};

export const KANBAN_FLOW: Record<KanbanColumnKey, KanbanColumnTransitions> = {
	TODO: {
		from: [],
		to: ["READY_FOR_DEVELOPMENT"],
	},
	READY_FOR_DEVELOPMENT: {
		from: ["TODO"],
		to: ["IN_DEVELOPMENT", "HUMAN_INTERVENTION", "IN_REVIEW"],
	},
	IN_DEVELOPMENT: {
		from: ["READY_FOR_DEVELOPMENT"],
		to: ["READY_FOR_REVIEW", "HUMAN_INTERVENTION"],
	},
	READY_FOR_REVIEW: {
		from: ["IN_DEVELOPMENT"],
		to: ["IN_REVIEW", "HUMAN_INTERVENTION"],
	},
	IN_REVIEW: {
		from: ["READY_FOR_REVIEW"],
		to: ["READY_FOR_RELEASE", "HUMAN_INTERVENTION"],
	},
	READY_FOR_RELEASE: {
		from: ["IN_REVIEW"],
		to: ["IN_RELEASE", "HUMAN_INTERVENTION"],
	},
	IN_RELEASE: {
		from: ["READY_FOR_RELEASE"],
		to: ["RELEASED", "HUMAN_INTERVENTION"],
	},
	HUMAN_INTERVENTION: {
		from: [
			"READY_FOR_DEVELOPMENT",
			"IN_DEVELOPMENT",
			"READY_FOR_REVIEW",
			"IN_REVIEW",
			"READY_FOR_RELEASE",
			"IN_RELEASE",
		],
		to: [
			"READY_FOR_DEVELOPMENT",
			"IN_DEVELOPMENT",
			"READY_FOR_REVIEW",
			"IN_REVIEW",
			"READY_FOR_RELEASE",
			"IN_RELEASE",
		],
	},
	RELEASED: {
		from: ["IN_RELEASE"],
		to: [],
	},
};
