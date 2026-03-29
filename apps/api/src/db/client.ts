import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { getDatabaseUrl } from "./get-database-url.js";

export const databasePool = new Pool({
	connectionString: getDatabaseUrl(),
	max: 10,
	connectionTimeoutMillis: 5_000,
	idleTimeoutMillis: 300_000,
});
const adapter = new PrismaPg(databasePool);

export const prisma = new PrismaClient({ adapter });
