import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Cognito from "next-auth/providers/cognito";
import GitHub from "next-auth/providers/github";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const authConfig: NextAuthConfig = {
    providers: [
        Cognito({
            clientId: process.env.COGNITO_CLIENT_ID!,
            clientSecret: process.env.COGNITO_CLIENT_SECRET!,
            issuer: process.env.COGNITO_ISSUER!,
        }),
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
            if (!user.email) return false;

            if (account?.provider === "cognito") {
                // Upsert user on Cognito login
                const existing = await db.query.users.findFirst({
                    where: eq(users.cognitoSub, account.providerAccountId),
                });

                if (!existing) {
                    await db.insert(users).values({
                        cognitoSub: account.providerAccountId,
                        email: user.email,
                        name: user.name ?? null,
                    });
                }
            }

            if (account?.provider === "github") {
                // This is a "Link GitHub" flow — update the existing user's GitHub token
                // The user must already be logged in via Cognito for this to work
                // We store the token on the user record matched by email
                const { encrypt } = await import("@/lib/crypto");
                const encryptedToken = encrypt(account.access_token ?? "");

                await db
                    .update(users)
                    .set({
                        githubAccessToken: encryptedToken,
                        githubUsername: (profile as { login?: string })?.login ?? null,
                        updatedAt: new Date(),
                    })
                    .where(eq(users.email, user.email));
            }

            return true;
        },

        async jwt({ token, account }) {
            // On first sign-in, look up the DB user and attach their ID
            if (account?.provider === "cognito") {
                const dbUser = await db.query.users.findFirst({
                    where: eq(users.cognitoSub, account.providerAccountId),
                });
                if (dbUser) {
                    token.userId = dbUser.id;
                    token.githubUsername = dbUser.githubUsername;
                }
            }

            // If GitHub was just linked, refresh GitHub username in token
            if (account?.provider === "github") {
                token.githubLinked = true;
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
            (session.user as unknown as Record<string, unknown>).githubLinked = !!token.githubLinked || !!token.githubUsername;
            return session;
        },
    },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
