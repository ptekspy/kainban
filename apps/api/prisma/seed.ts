import { auth } from "../src/auth/auth.js";
import { databasePool, prisma } from "../src/db/client.js";

const projectSnapshots = [
	{
		id: "cmnbv14va0000yjs6s1ecswnb",
		name: "Bot Market",
		abbreviation: "BTM",
		githubRepoUrl: "https://github.com/ptekspy/bot-market",
		epics: [
			{
				id: "cmnbv1m3a0001yjs6b9nbew40",
				name: "Project Initialisation",
				description: null,
			},
		],
		tasks: [
			{
				id: "cmnbv254v0002yjs6414svmmc",
				ticketNumber: 1,
				title: "Set up Nextjs",
				description:
					"Set up the repo to use nextjs, make sure to use the latest version\npnpm\ntailwind4",
				status: "READY_FOR_DEVELOPMENT" as const,
				epicId: "cmnbv1m3a0001yjs6b9nbew40",
				dependencyIds: [],
			},
			{
				id: "cmnbv2zfy0003yjs617st4ebr",
				ticketNumber: 2,
				title: "Verify Only tailwindv4",
				description:
					"Make sure tailwind v4 is implemented correctly\nRemove any custom css or *.module.css files and replace with tailwind4",
				status: "TODO" as const,
				epicId: "cmnbv1m3a0001yjs6b9nbew40",
				dependencyIds: ["cmnbv254v0002yjs6414svmmc"],
			},
		],
	},
];

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

	const adminUser = await prisma.user.findUnique({
		where: {
			email: adminEmail,
		},
	});

	if (!adminUser) {
		throw new Error("Expected seeded admin user to exist after auth sign-up.");
	}

	for (const projectSnapshot of projectSnapshots) {
		await prisma.project.create({
			data: {
				id: projectSnapshot.id,
				name: projectSnapshot.name,
				abbreviation: projectSnapshot.abbreviation,
				githubRepoUrl: projectSnapshot.githubRepoUrl,
				ownerId: adminUser.id,
			},
		});

		for (const epicSnapshot of projectSnapshot.epics) {
			await prisma.epic.create({
				data: {
					id: epicSnapshot.id,
					name: epicSnapshot.name,
					description: epicSnapshot.description,
					projectId: projectSnapshot.id,
				},
			});
		}

		for (const taskSnapshot of projectSnapshot.tasks) {
			await prisma.task.create({
				data: {
					id: taskSnapshot.id,
					ticketNumber: taskSnapshot.ticketNumber,
					title: taskSnapshot.title,
					description: taskSnapshot.description,
					status: taskSnapshot.status,
					projectId: projectSnapshot.id,
					epicId: taskSnapshot.epicId,
				},
			});
		}

		for (const taskSnapshot of projectSnapshot.tasks) {
			if (taskSnapshot.dependencyIds.length === 0) {
				continue;
			}

			await prisma.task.update({
				where: {
					id: taskSnapshot.id,
				},
				data: {
					dependencies: {
						connect: taskSnapshot.dependencyIds.map((dependencyId) => ({
							id: dependencyId,
						})),
					},
				},
			});
		}
	}
};

seed()
	.then(async () => {
		await prisma.$disconnect();
		await databasePool.end();
	})
	.catch(async (error) => {
		console.error("Seeding failed:", error);
		await prisma.$disconnect();
		await databasePool.end();
		process.exit(1);
	});
