import { pgTable, serial, text, timestamp, integer, jsonb, boolean, uniqueIndex } from "drizzle-orm/pg-core";

// where we define our tables

export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    githubId: text("github_id").unique().notNull(),
    email: text("email").unique().notNull(),
    name: text("name"),
    githubAccessToken: text("github_access_token"),   // encrypted via AES-256-GCM
    githubUsername: text("github_username"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const repositories = pgTable("repositories", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id),
    repoFullName: text("repo_full_name").notNull(),
    apiKey: text("api_key").unique().notNull(),
    indexingStatus: text("indexing_status").notNull().default("pending"),
    lastIndexedAt: timestamp("last_indexed_at", { withTimezone: true }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    uniqueIndex("user_repo_unique").on(table.userId, table.repoFullName),
]);

export const deploymentReports = pgTable("deployment_reports", {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    status: text("status").notNull().default("draft"),
    repositoryId: integer("repository_id").references(() => repositories.id),
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
    repositoryId: integer("repository_id").references(() => repositories.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
