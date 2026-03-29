import type { Project } from "@repo/types/Kanban/types";

export const MOCK_PROJECTS: Project[] = [
	{
		id: "project-kainban",
		name: "Kainban Platform",
		abbreviation: "KAN",
		githubRepoUrl: "https://github.com/example/kainban",
		epics: [
			{
				id: "kan-auth",
				name: "Authentication and Access",
				description: "Identity, permissions, and secure access workflows.",
			},
			{
				id: "kan-platform",
				name: "Platform Delivery",
				description: "Infrastructure and release automation.",
			},
		],
		tasks: [
			{
				id: "KAN-1",
				title: "Implement authentication",
				description: "Set up user authentication using JWT.",
				column: "READY_FOR_DEVELOPMENT",
				epicId: "kan-auth",
				dependencyTaskIds: [],
			},
			{
				id: "KAN-2",
				title: "Design database schema",
				description: "Create ER diagrams and define database tables.",
				column: "IN_DEVELOPMENT",
				epicId: "kan-auth",
				dependencyTaskIds: ["KAN-1"],
			},
			{
				id: "KAN-3",
				title: "Set up CI/CD pipeline",
				description: "Automate testing and deployment processes.",
				column: "READY_FOR_REVIEW",
				epicId: "kan-platform",
				dependencyTaskIds: ["KAN-2"],
			},
		],
	},
	{
		id: "project-docs",
		name: "Developer Docs",
		abbreviation: "DOC",
		githubRepoUrl: "https://github.com/example/developer-docs",
		epics: [
			{
				id: "doc-onboarding",
				name: "Onboarding",
				description: "Developer onboarding and contribution flows.",
			},
		],
		tasks: [
			{
				id: "DOC-1",
				title: "Write onboarding guide",
				description: "Document local setup and contributor workflow.",
				column: "TODO",
				epicId: "doc-onboarding",
				dependencyTaskIds: [],
			},
			{
				id: "DOC-2",
				title: "Review API examples",
				description: "Validate code snippets against the latest API.",
				column: "IN_REVIEW",
				epicId: "doc-onboarding",
				dependencyTaskIds: ["DOC-1"],
			},
		],
	},
];
