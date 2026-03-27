import { NextRequest, NextResponse } from "next/server";
import { runReview } from "@/agents/review-graph";
import type { ReviewRequest } from "@/agents/types";
import { db } from "@/server/db/client";
import { repositories } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        // Validate API key — per-repo key lookup with legacy fallback
        const apiKey = req.headers.get("authorization")?.replace("Bearer ", "");
        if (!apiKey) {
            return NextResponse.json(
                { ok: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        let repositoryId: number | null = null;

        // Try per-repo API key first
        const repo = await db.query.repositories.findFirst({
            where: eq(repositories.apiKey, apiKey),
        });

        if (repo && repo.isActive) {
            repositoryId = repo.id;
        } else if (apiKey !== process.env.DEPLOYIQ_API_KEY) {
            // Fallback to legacy env var for backward compatibility
            return NextResponse.json(
                { ok: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = (await req.json()) as ReviewRequest;

        // Basic validation
        if (!body.diff || !body.repoFullName || !body.prNumber) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Missing required fields: diff, repoFullName, prNumber",
                },
                { status: 400 }
            );
        }

        const review = await runReview(body, repositoryId);

        if (review.retrieval?.status === "degraded") {
            console.warn("Review generated with degraded retrieval", {
                repoFullName: body.repoFullName,
                prNumber: body.prNumber,
                repositoryId,
                retrieval: review.retrieval,
            });
        } else {
            console.info("Review generated", {
                repoFullName: body.repoFullName,
                prNumber: body.prNumber,
                repositoryId,
                retrievalStatus: review.retrieval?.status ?? "unknown",
            });
        }

        return NextResponse.json({
            ok: true,
            review,
        });
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Unknown error";

        console.error("Review error:", message);

        return NextResponse.json(
            { ok: false, error: message },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({
        ok: true,
        service: "DeployIQ Review API",
        status: "healthy",
    });
}
