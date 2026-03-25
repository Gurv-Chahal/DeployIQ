import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/require-auth";
import { db } from "@/server/db/client";
import { repositories } from "@/server/db/schema";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/repos — list current user's repositories
export async function GET() {
    const { user, error } = await requireAuth();
    if (error) return error;

    const repos = await db.query.repositories.findMany({
        where: eq(repositories.userId, user.id),
        orderBy: [desc(repositories.createdAt)],
    });

    return NextResponse.json({ ok: true, repos });
}

// POST /api/repos — connect a new repository
export async function POST(req: NextRequest) {
    const { user, error } = await requireAuth();
    if (error) return error;

    const body = await req.json();
    const { repoFullName } = body as { repoFullName?: string };

    if (!repoFullName || !repoFullName.includes("/")) {
        return NextResponse.json(
            { ok: false, error: "Invalid repository name. Expected format: owner/repo" },
            { status: 400 }
        );
    }

    // Check if already connected
    const existing = await db.query.repositories.findFirst({
        where: eq(repositories.repoFullName, repoFullName),
    });

    if (existing && existing.userId === user.id) {
        return NextResponse.json(
            { ok: false, error: "Repository is already connected" },
            { status: 409 }
        );
    }

    const apiKey = randomUUID();

    const [repo] = await db
        .insert(repositories)
        .values({
            userId: user.id,
            repoFullName,
            apiKey,
        })
        .returning();

    return NextResponse.json({
        ok: true,
        repoId: repo.id,
        apiKey,
        repoFullName,
    });
}
