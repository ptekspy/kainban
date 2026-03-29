import { access, copyFile, mkdir, stat } from "node:fs/promises";
import { join, normalize, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { glob } from "glob";

const PACKAGE_ROOT = fileURLToPath(new URL("../..", import.meta.url));
const REPO_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const DESTINATION_DIR = join(PACKAGE_ROOT, "coverage/raw");
const SEARCH_PATTERNS = ["apps/*", "packages/*"];

const toDisplayPath = (path: string) => {
	const normalized = normalize(path);
	const parts = normalized.split(sep);
	const filteredParts = parts.filter((part) => part !== ".." && part !== ".");

	return filteredParts.join(sep);
};

const toCoverageFileName = (directoryPath: string) => {
	const relativeDirectoryPath = relative(REPO_ROOT, directoryPath);

	return `${relativeDirectoryPath.split(sep).join("-")}.json`;
};

export const collectCoverageFiles = async () => {
	try {
		await mkdir(DESTINATION_DIR, { recursive: true });
		const directoriesWithCoverage: string[] = [];

		for (const pattern of SEARCH_PATTERNS) {
			const matches = await glob(pattern, {
				absolute: true,
				cwd: REPO_ROOT,
			});

			for (const match of matches.sort()) {
				const matchStats = await stat(match);

				if (!matchStats.isDirectory()) {
					continue;
				}

				const coverageFilePath = join(match, "coverage.json");

				try {
					await access(coverageFilePath);
				} catch {
					continue;
				}

				directoriesWithCoverage.push(match);
				const destinationFilePath = join(DESTINATION_DIR, toCoverageFileName(match));

				await copyFile(coverageFilePath, destinationFilePath);
			}
		}

		if (directoriesWithCoverage.length > 0) {
			console.log(
				`Found coverage.json in: ${directoriesWithCoverage
					.map((directoryPath) => toDisplayPath(relative(REPO_ROOT, directoryPath)))
					.join(", ")}`,
			);
		} else {
			console.log("No coverage.json files found.");
		}

		console.log(`Coverage collected into: ${DESTINATION_DIR}`);
	} catch (error) {
		console.error("Error collecting coverage files:", error);
		process.exitCode = 1;
	}
};

void collectCoverageFiles();
