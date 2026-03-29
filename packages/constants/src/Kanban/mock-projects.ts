import type { Project } from "@repo/types/Kanban/types";

export const MOCK_PROJECTS: Project[] = [
	{
		id: "project-kainban",
		name: "Kainban Platform",
		abbreviation: "KAN",
		githubRepoUrl: "https://github.com/example/kainban",
		tasks: [
			{
				id: "KAN-1",
				title: "Implement authentication",
				description: "Set up user authentication using JWT.",
				column: "READY_FOR_DEVELOPMENT",
			},
			{
				id: "KAN-2",
				title: "Design database schema",
				description: "Create ER diagrams and define database tables.",
				column: "IN_DEVELOPMENT",
			},
			{
				id: "KAN-3",
				title: "Set up CI/CD pipeline",
				description: "Automate testing and deployment processes.",
				column: "READY_FOR_REVIEW",
			},
		],
	},
	{
		id: "project-docs",
		name: "Developer Docs",
		abbreviation: "DOC",
		githubRepoUrl: "https://github.com/example/developer-docs",
		tasks: [
			{
				id: "DOC-1",
				title: "Write onboarding guide",
				description: "Document local setup and contributor workflow.",
				column: "TODO",
			},
			{
				id: "DOC-2",
				title: "Review API examples",
				description: "Validate code snippets against the latest API.",
				column: "IN_REVIEW",
			},
		],
	},
];
