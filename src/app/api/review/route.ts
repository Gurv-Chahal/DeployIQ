import { NextRequest, NextResponse } from "next/server";
import { runReview } from "@/agents/review-graph";
import type { ReviewRequest } from "@/agents/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        // Validate API key
        const apiKey = req.headers.get("authorization")?.replace("Bearer ", "");
        if (!apiKey || apiKey !== process.env.DEPLOYIQ_API_KEY) {
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

        const review = await runReview(body);

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
