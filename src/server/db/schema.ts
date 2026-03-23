import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

// where we define our tables

export const deploymentReports = pgTable("deployment_reports", {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    status: text("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
