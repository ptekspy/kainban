import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

const repoRoot = resolve(process.cwd(), "../..");
const localEnvPath = resolve(repoRoot, ".env.local");
const productionEnvPath = resolve(repoRoot, ".env");
const envFilePath = existsSync(localEnvPath) ? localEnvPath : productionEnvPath;

if (existsSync(envFilePath)) {
	const { readFileSync } = await import("node:fs");

	for (const line of readFileSync(envFilePath, "utf8").split("\n")) {
		const trimmedLine = line.trim();

		if (!trimmedLine || trimmedLine.startsWith("#")) {
			continue;
		}

		const separatorIndex = trimmedLine.indexOf("=");

		if (separatorIndex === -1) {
			continue;
		}

		const key = trimmedLine.slice(0, separatorIndex).trim();
		const value = trimmedLine.slice(separatorIndex + 1).trim();

		if (!process.env[key]) {
			process.env[key] = value;
		}
	}
}

const webPort = process.env.WEB_PORT ?? "4000";
const nextBinary = resolve(process.cwd(), "node_modules/next/dist/bin/next");
const child = spawn(process.execPath, [nextBinary, "dev", "--port", webPort], {
	cwd: process.cwd(),
	stdio: "inherit",
	env: process.env,
});

child.on("exit", (code, signal) => {
	if (signal) {
		process.kill(process.pid, signal);
		return;
	}

	process.exit(code ?? 0);
});