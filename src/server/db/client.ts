import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// creates the db connection and exports db which our app uses to run queries

declare global {
    var pgPool: Pool | undefined;
}

const pool =
    global.pgPool ??
    new Pool({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT ?? "5432"),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: { rejectUnauthorized: false },
        max: 5,
    });

if (process.env.NODE_ENV !== "production") {
    global.pgPool = pool;
}

export const db = drizzle({ client: pool, schema });
