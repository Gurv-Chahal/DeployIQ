import { pgTable, serial, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";

// where we define our tables

export const deploymentReports = pgTable("deployment_reports", {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    status: text("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const prReviews = pgTable("pr_reviews", {
    id: serial("id").primaryKey(),
    repoFullName: text("repo_full_name").notNull(),
    prNumber: integer("pr_number").notNull(),
    prTitle: text("pr_title").notNull(),
    reviewBody: text("review_body").notNull(),
    riskScore: integer("risk_score").notNull(),
    riskFactors: jsonb("risk_factors").$type<string[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
