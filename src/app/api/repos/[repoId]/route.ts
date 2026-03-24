import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/require-auth";
import { db } from "@/server/db/client";
import { repositories } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
    params: Promise<{ repoId: string }>;
};

// GET /api/repos/:repoId — get repo details
export async function GET(_req: Request, ctx: RouteContext) {
    const { repoId } = await ctx.params;
    const { user, error } = await requireAuth();
    if (error) return error;

    const repo = await db.query.repositories.findFirst({
        where: and(
            eq(repositories.id, Number(repoId)),
            eq(repositories.userId, user.id)
        ),
    });

    if (!repo) {
        return NextResponse.json(
            { ok: false, error: "Repository not found" },
            { status: 404 }
        );
    }

    return NextResponse.json({ ok: true, repo });
}

// DELETE /api/repos/:repoId — disconnect a repository
export async function DELETE(_req: Request, ctx: RouteContext) {
    const { repoId } = await ctx.params;
    const { user, error } = await requireAuth();
    if (error) return error;

    const repo = await db.query.repositories.findFirst({
        where: and(
            eq(repositories.id, Number(repoId)),
            eq(repositories.userId, user.id)
        ),
    });

    if (!repo) {
        return NextResponse.json(
            { ok: false, error: "Repository not found" },
            { status: 404 }
        );
    }

    await db
        .update(repositories)
        .set({ isActive: false })
        .where(eq(repositories.id, repo.id));

    return NextResponse.json({ ok: true, message: "Repository disconnected" });
}
