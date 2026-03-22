import { Pool } from "pg";

declare global {
    var pgPool: Pool | undefined;
}

function requiredEnv(name: string) {
    const value = process.env[name];

    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }

    return value;
}

export function getDbPool() {
    if (global.pgPool) {
        return global.pgPool;
    }

    const pool = new Pool({
        host: requiredEnv("DB_HOST"),
        port: Number(process.env.DB_PORT ?? "5432"),
        database: requiredEnv("DB_NAME"),
        user: requiredEnv("DB_USER"),
        password: requiredEnv("DB_PASSWORD"),
        ssl:
            process.env.NODE_ENV === "production"
                ? { rejectUnauthorized: false }
                : undefined,
        max: 5,
    });

    if (process.env.NODE_ENV !== "production") {
        global.pgPool = pool;
    }

    return pool;
}
