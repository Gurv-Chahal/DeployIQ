import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const authConfig: NextAuthConfig = {
    providers: [
        GitHub({
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
            authorization: {
                params: {
                    scope: "read:user user:email repo",
                },
            },
        }),
    ],
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            if (!user.email || account?.provider !== "github") return false;

            const githubId = String((profile as { id?: number })?.id ?? account.providerAccountId);
            const { encrypt } = await import("@/lib/crypto");
            const encryptedToken = encrypt(account.access_token ?? "");

            // Upsert: create user if new, update token if existing
            const existing = await db.query.users.findFirst({
                where: eq(users.githubId, githubId),
            });

            if (existing) {
                await db.update(users).set({
                    githubAccessToken: encryptedToken,
                    githubUsername: (profile as { login?: string })?.login ?? null,
                    email: user.email,
                    name: user.name ?? null,
                    updatedAt: new Date(),
                }).where(eq(users.githubId, githubId));
            } else {
                await db.insert(users).values({
                    githubId,
                    email: user.email,
                    name: user.name ?? null,
                    githubAccessToken: encryptedToken,
                    githubUsername: (profile as { login?: string })?.login ?? null,
                });
            }

            return true;
        },

        async jwt({ token, account, profile }) {
            if (account?.provider === "github") {
                const githubId = String((profile as { id?: number })?.id ?? account.providerAccountId);
                const dbUser = await db.query.users.findFirst({
                    where: eq(users.githubId, githubId),
                });
                if (dbUser) {
                    token.userId = dbUser.id;
                    token.githubUsername = dbUser.githubUsername;
                }
            }
            return token;
        },

        async session({ session, token }) {
            if (token.userId) {
                session.user.id = String(token.userId);
            }
            if (token.githubUsername) {
                (session.user as unknown as Record<string, unknown>).githubUsername = token.githubUsername;
            }
            return session;
        },
    },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
