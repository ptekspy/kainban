import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@kainban.dev";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";
const API_BASE_URL =
	process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4001";

const signIn = async (page: Page) => {
	await page.goto("/");
	const newProjectButton = page.getByRole("button", { name: "New Project" });
	const emailInput = page.getByPlaceholder("admin@kainban.dev");

	await Promise.race([
		newProjectButton.waitFor({ state: "visible" }),
		emailInput.waitFor({ state: "visible" }),
	]);

	if (await newProjectButton.isVisible()) {
		return;
	}

	await emailInput.fill(ADMIN_EMAIL);
	await page.getByPlaceholder("Enter your password").fill(ADMIN_PASSWORD);
	await page.getByRole("button", { name: "Sign in" }).click();
	await expect(newProjectButton).toBeVisible();
};

const getAuthenticatedUserId = async (page: Page) => {
	const response = await page.context().request.get(
		`${API_BASE_URL}/api/auth/get-session`,
	);
	expect(response.ok()).toBeTruthy();
	const session = (await response.json()) as {
		user: { id: string };
	};
	return session.user.id;
};

const createProject = async (page: Page, suffix: string) => {
	await page.getByRole("button", { name: "New Project" }).click();
	const dialog = page.getByRole("dialog", { name: "Create project" });
	await expect(dialog).toBeVisible();
	await dialog.getByPlaceholder("Project Phoenix").fill(`Playwright ${suffix}`);
	await dialog.getByPlaceholder("PHX").fill(`pw${suffix}`);
	await dialog
		.getByPlaceholder("https://github.com/org/repo")
		.fill(`https://github.com/example/playwright-${suffix.toLowerCase()}`);
	await dialog.getByRole("button", { name: "Create", exact: true }).click();
	await expect(
		page.getByRole("heading", { name: `Playwright ${suffix}` }),
	).toBeVisible();
	await expect(dialog).not.toBeVisible();
};

const createEpic = async (page: Page, name: string) => {
	await page.getByRole("button", { name: "New Epic" }).click();
	const dialog = page.getByRole("dialog", { name: "Create epic" });
	await expect(dialog).toBeVisible();
	await dialog.getByPlaceholder("Checkout Experience").fill(name);
	await dialog.getByRole("button", { name: "Create epic" }).click();
	await expect(dialog).not.toBeVisible();
};

const createTask = async (
	page: Page,
	input: {
		title: string;
		epicName: string;
		dependencies?: string[];
	},
) => {
	await page.getByRole("button", { name: "New Task" }).click();
	const dialog = page.getByRole("dialog", { name: "Create task" });
	await expect(dialog).toBeVisible();
	await dialog.getByPlaceholder("Implement billing webhook").fill(input.title);
	await dialog.getByRole("combobox").selectOption({
		label: input.epicName,
	});

	if (input.dependencies) {
		for (const dependencyId of input.dependencies) {
			await dialog
				.getByPlaceholder("Search by task ID, title, or epic")
				.fill(dependencyId);
			await dialog
				.getByRole("button", { name: new RegExp(dependencyId) })
				.click();
		}
	}

	await dialog.getByRole("button", { name: "Create task" }).click();
	await expect(dialog).not.toBeVisible();
};

const taskCard = (page: Page, taskTitle: string) =>
	page.getByText(taskTitle).locator("xpath=ancestor::li[1]");

const lane = (page: Page, name: string) => page.getByLabel(`${name} tasks`);

const moveTask = async (
	page: Page,
	taskTitle: string,
	targetLane: string,
	options?: {
		shouldSucceed?: boolean;
	},
) => {
	const task = taskCard(page, taskTitle);
	const target = lane(page, targetLane);

	await task.scrollIntoViewIfNeeded();
	await target.scrollIntoViewIfNeeded();
	await task.dragTo(target);

	if (options?.shouldSucceed !== false) {
		await expect(target.getByText(taskTitle)).toBeVisible();
	}
};

test.describe.configure({ mode: "serial" });

test.describe("kanban browser flow", () => {
	test("creates a project, epic, and first task through modals", async ({
		page,
	}) => {
		await signIn(page);
		await createProject(page, "Create");
		await createEpic(page, "Playwright Epic");
		await createTask(page, {
			title: "Playwright First Task",
			epicName: "Playwright Epic",
		});

		await expect(page.getByText("PWCREATE-1")).toBeVisible();
		await expect(
			page.getByText("First task in dependency chain"),
		).toBeVisible();
	});

	test("enforces dependency release rules and auto-unblocks tasks", async ({
		page,
	}) => {
		await signIn(page);
		await createProject(page, "Flow");
		await createEpic(page, "Playwright Flow Epic");

		await createTask(page, {
			title: "Dependency A",
			epicName: "Playwright Flow Epic",
		});
		await createTask(page, {
			title: "Dependency B",
			epicName: "Playwright Flow Epic",
			dependencies: ["PWFLOW-1"],
		});
		await createTask(page, {
			title: "Blocked Task",
			epicName: "Playwright Flow Epic",
			dependencies: ["PWFLOW-1", "PWFLOW-2"],
		});

		await moveTask(page, "Dependency B", "Ready for Development", {
			shouldSucceed: false,
		});
		await expect(lane(page, "To Do").getByText("Dependency B")).toBeVisible();

		await moveTask(page, "Dependency A", "Ready for Development");
		await moveTask(page, "Dependency A", "In Development");
		await moveTask(page, "Dependency A", "Ready for Review");
		await moveTask(page, "Dependency A", "In Review");
		await moveTask(page, "Dependency A", "Ready for Release");
		await moveTask(page, "Dependency A", "In Release");

		await moveTask(page, "Dependency B", "Ready for Development");
		await expect(
			lane(page, "Ready for Development").getByText("Dependency B"),
		).toBeVisible();
		await page.reload();
		await page.getByRole("button", { name: /Playwright Flow/i }).click();
		await expect(
			lane(page, "Ready for Development").getByText("Dependency B"),
		).toBeVisible();

		await moveTask(page, "Dependency A", "Released");
		await expect(lane(page, "To Do").getByText("Blocked Task")).toBeVisible();

		await moveTask(page, "Dependency B", "In Development");
		await moveTask(page, "Dependency B", "Ready for Review");
		await moveTask(page, "Dependency B", "In Review");
		await moveTask(page, "Dependency B", "Ready for Release");
		await moveTask(page, "Dependency B", "In Release");
		await moveTask(page, "Dependency B", "Released");

		await expect(
			lane(page, "Ready for Development").getByText("Blocked Task"),
		).toBeVisible();
	});

	test("updates a second tab in realtime when projects epics and tasks change", async ({
		page,
	}) => {
		const observerPage = await page.context().newPage();

		await signIn(page);
		await signIn(observerPage);

		await createProject(page, "Realtime");
		await expect(
			observerPage.getByRole("button", { name: /Playwright Realtime/i }),
		).toBeVisible();

		await observerPage
			.getByRole("button", { name: /Playwright Realtime/i })
			.click();
		await expect(
			observerPage.getByRole("heading", { name: "Playwright Realtime" }),
		).toBeVisible();

		await createEpic(page, "Realtime Epic");
		await expect(observerPage.getByText("Realtime Epic")).toBeVisible();

		await createTask(page, {
			title: "Realtime Task",
			epicName: "Realtime Epic",
		});
		await expect(observerPage.getByText("Realtime Task")).toBeVisible();

		await observerPage.close();
	});

	test("updates the browser when the api changes outside the ui", async ({
		page,
	}) => {
		await signIn(page);
		const ownerId = await getAuthenticatedUserId(page);

		const projectResponse = await page.context().request.post(
			`${API_BASE_URL}/projects`,
			{
				data: {
					name: "Playwright External",
					abbreviation: "PWE",
					githubRepoUrl: "https://github.com/example/playwright-external",
					ownerId,
				},
			},
		);
		expect(projectResponse.ok()).toBeTruthy();
		const project = (await projectResponse.json()) as { id: string };

		await expect(
			page.getByRole("button", { name: /Playwright External/i }),
		).toBeVisible();
		await page.getByRole("button", { name: /Playwright External/i }).click();

		const epicResponse = await page.context().request.post(
			`${API_BASE_URL}/epics`,
			{
				data: {
					name: "External Epic",
					description: "Created outside the browser ui.",
					projectId: project.id,
				},
			},
		);
		expect(epicResponse.ok()).toBeTruthy();
		const epic = (await epicResponse.json()) as { id: string };

		await expect(page.getByText("External Epic")).toBeVisible();

		const taskResponse = await page.context().request.post(
			`${API_BASE_URL}/tasks`,
			{
				data: {
					title: "External Task",
					description: "Created through the api request context.",
					projectId: project.id,
					epicId: epic.id,
				},
			},
		);
		expect(taskResponse.ok()).toBeTruthy();

		await expect(page.getByText("PWE-1")).toBeVisible();
		await expect(page.getByText("External Task")).toBeVisible();
	});
});
