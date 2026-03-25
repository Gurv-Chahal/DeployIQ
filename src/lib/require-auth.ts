import { auth } from "@/lib/auth";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export type AuthenticatedUser = {
    id: number;
    email: string;
    name: string | null;
    githubUsername: string | null;
    githubAccessToken: string | null;
};

/**
 * Validates the session and returns the authenticated user from the database.
 * Returns a NextResponse error if unauthenticated.
 */
export async function requireAuth(): Promise<
    | { user: AuthenticatedUser; error: null }
    | { user: null; error: NextResponse }
> {
    const session = await auth();

    if (!session?.user?.id) {
        return {
            user: null,
            error: NextResponse.json(
                { ok: false, error: "Unauthorized" },
                { status: 401 }
            ),
        };
    }

    const dbUser = await db.query.users.findFirst({
        where: eq(users.id, Number(session.user.id)),
    });

    if (!dbUser) {
        return {
            user: null,
            error: NextResponse.json(
                { ok: false, error: "User not found" },
                { status: 401 }
            ),
        };
    }

    return {
        user: {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            githubUsername: dbUser.githubUsername,
            githubAccessToken: dbUser.githubAccessToken,
        },
        error: null,
    };
}
