import type { Task } from "@repo/types/Kanban/types";

export const MOCK_TASKS: Task[] = [
	{
		id: "1",
		title: "Implement authentication",
		description: "Set up user authentication using JWT.",
		column: "READY_FOR_DEVELOPMENT",
		epicId: "epic-auth",
		dependencyTaskIds: [],
	},
	{
		id: "2",
		title: "Design database schema",
		description: "Create ER diagrams and define database tables.",
		column: "IN_DEVELOPMENT",
		epicId: "epic-auth",
		dependencyTaskIds: ["1"],
	},
	{
		id: "3",
		title: "Set up CI/CD pipeline",
		description: "Automate testing and deployment processes.",
		column: "READY_FOR_REVIEW",
		epicId: "epic-platform",
		dependencyTaskIds: ["2"],
	},
];
