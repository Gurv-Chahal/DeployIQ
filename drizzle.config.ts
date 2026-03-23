import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// tells drizzle where schema is and how to connect the database

export default defineConfig({
    out: "./drizzle",
    schema: "./src/server/db/schema.ts",
    dialect: "postgresql",
    dbCredentials: {
        host: process.env.DB_HOST!,
        port: Number(process.env.DB_PORT ?? "5432"),
        user: process.env.DB_USER!,
        password: process.env.DB_PASSWORD!,
        database: process.env.DB_NAME!,
        ssl: true,
    },
});
