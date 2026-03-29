import { auth } from "../src/auth/auth.js";
import { prisma } from "../src/db/client.js";
import { TaskStatus } from "../src/generated/prisma/client.js";
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

if (!adminEmail) {
	throw new Error("ADMIN_EMAIL must be defined before running the seed script.");
}

if (!adminPassword) {
	throw new Error("ADMIN_PASSWORD must be defined before running the seed script.");
}

const seed = async () => {
	await prisma.task.deleteMany();
	await prisma.epic.deleteMany();
	await prisma.project.deleteMany();
	await prisma.session.deleteMany();
	await prisma.account.deleteMany();
	await prisma.verification.deleteMany();
	await prisma.user.deleteMany();

	await auth.api.signUpEmail({
		body: {
			email: adminEmail,
			name: "Kainban Admin",
			password: adminPassword,
		},
	});
	const user = await prisma.user.findUniqueOrThrow({
		where: {
			email: adminEmail,
		},
	});

	const kainbanProject = await prisma.project.create({
		data: {
			id: "project-kainban",
			name: "Kainban Platform",
			abbreviation: "KAN",
			githubRepoUrl: "https://github.com/example/kainban",
			ownerId: user.id,
		},
	});

	const docsProject = await prisma.project.create({
		data: {
			id: "project-docs",
			name: "Developer Docs",
			abbreviation: "DOC",
			githubRepoUrl: "https://github.com/example/developer-docs",
			ownerId: user.id,
		},
	});

	const authEpic = await prisma.epic.create({
		data: {
			id: "kan-auth",
			name: "Authentication and Access",
			description: "Identity, permissions, and secure access workflows.",
			projectId: kainbanProject.id,
		},
	});

	const platformEpic = await prisma.epic.create({
		data: {
			id: "kan-platform",
			name: "Platform Delivery",
			description: "Infrastructure and release automation.",
			projectId: kainbanProject.id,
		},
	});

	const onboardingEpic = await prisma.epic.create({
		data: {
			id: "doc-onboarding",
			name: "Onboarding",
			description: "Developer onboarding and contribution flows.",
			projectId: docsProject.id,
		},
	});

	const taskOne = await prisma.task.create({
		data: {
			id: "task-kan-1",
			ticketNumber: 1,
			title: "Implement authentication",
			description: "Set up user authentication using JWT.",
			status: TaskStatus.READY_FOR_DEVELOPMENT,
			projectId: kainbanProject.id,
			epicId: authEpic.id,
		},
	});

	const taskTwo = await prisma.task.create({
		data: {
			id: "task-kan-2",
			ticketNumber: 2,
			title: "Design database schema",
			description: "Create ER diagrams and define database tables.",
			status: TaskStatus.IN_DEVELOPMENT,
			projectId: kainbanProject.id,
			epicId: authEpic.id,
			dependencies: {
				connect: [{ id: taskOne.id }],
			},
		},
	});

	await prisma.task.create({
		data: {
			id: "task-kan-3",
			ticketNumber: 3,
			title: "Set up CI/CD pipeline",
			description: "Automate testing and deployment processes.",
			status: TaskStatus.READY_FOR_REVIEW,
			projectId: kainbanProject.id,
			epicId: platformEpic.id,
			dependencies: {
				connect: [{ id: taskTwo.id }],
			},
		},
	});

	const docsTaskOne = await prisma.task.create({
		data: {
			id: "task-doc-1",
			ticketNumber: 1,
			title: "Write onboarding guide",
			description: "Document local setup and contributor workflow.",
			status: TaskStatus.TODO,
			projectId: docsProject.id,
			epicId: onboardingEpic.id,
		},
	});

	await prisma.task.create({
		data: {
			id: "task-doc-2",
			ticketNumber: 2,
			title: "Review API examples",
			description: "Validate code snippets against the latest API.",
			status: TaskStatus.IN_REVIEW,
			projectId: docsProject.id,
			epicId: onboardingEpic.id,
			dependencies: {
				connect: [{ id: docsTaskOne.id }],
			},
		},
	});
};

seed()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (error) => {
		console.error("Seeding failed:", error);
		await prisma.$disconnect();
		process.exit(1);
	});
