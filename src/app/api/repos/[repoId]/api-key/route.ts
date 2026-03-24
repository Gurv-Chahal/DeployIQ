import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/require-auth";
import { db } from "@/server/db/client";
import { repositories } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
    params: Promise<{ repoId: string }>;
};

// POST /api/repos/:repoId/api-key — regenerate the per-repo API key
export async function POST(_req: Request, ctx: RouteContext) {
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

    const newApiKey = randomUUID();

    await db
        .update(repositories)
        .set({ apiKey: newApiKey })
        .where(eq(repositories.id, repo.id));

    return NextResponse.json({ ok: true, apiKey: newApiKey });
}
