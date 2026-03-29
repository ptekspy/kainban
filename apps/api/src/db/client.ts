import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { getDatabaseUrl } from "./get-database-url.js";

const pool = new Pool({
	connectionString: getDatabaseUrl(),
	max: 10,
	connectionTimeoutMillis: 5_000,
	idleTimeoutMillis: 300_000,
});
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
