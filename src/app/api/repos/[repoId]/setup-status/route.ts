import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/require-auth";
import { db } from "@/server/db/client";
import { repositories } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { decrypt } from "@/lib/crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
    params: Promise<{ repoId: string }>;
};

// GET /api/repos/:repoId/setup-status — check if workflow file exists in the repo
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

    // Need the user's GitHub token to check the repo
    if (!user.githubAccessToken) {
        return NextResponse.json({
            ok: true,
            workflowExists: false,
            message: "GitHub not connected — cannot verify workflow",
        });
    }

    try {
        const token = decrypt(user.githubAccessToken);

        // Check for any workflow file that contains "deployiq" in the name
        const res = await fetch(
            `https://api.github.com/repos/${repo.repoFullName}/contents/.github/workflows`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                },
            }
        );

        if (!res.ok) {
            return NextResponse.json({
                ok: true,
                workflowExists: false,
                message: "No .github/workflows directory found",
            });
        }

        const files = (await res.json()) as Array<{ name: string }>;
        const hasDeployIQ = files.some(
            (f) =>
                f.name.toLowerCase().includes("deployiq") ||
                f.name.toLowerCase().includes("deploy-iq") ||
                f.name.toLowerCase().includes("code-review")
        );

        return NextResponse.json({
            ok: true,
            workflowExists: hasDeployIQ,
        });
    } catch (err) {
        console.error("Failed to check setup status:", err);
        return NextResponse.json({
            ok: true,
            workflowExists: false,
            message: "Failed to verify — please check manually",
        });
    }
}
