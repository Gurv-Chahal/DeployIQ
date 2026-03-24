import { NextRequest, NextResponse } from "next/server";
import { indexRepositoryFiles } from "@/agents/indexing";

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

        const body = (await req.json()) as {
            repoFullName: string;
            files: Array<{ path: string; content: string }>;
        };

        if (!body.repoFullName || !body.files || body.files.length === 0) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Missing required fields: repoFullName, files",
                },
                { status: 400 }
            );
        }

        const result = await indexRepositoryFiles(
            body.repoFullName,
            body.files
        );

        return NextResponse.json({
            ok: true,
            indexed: result.indexed,
            message: `Indexed ${result.indexed} chunks from ${body.files.length} files`,
        });
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Unknown error";

        console.error("Indexing error:", message);

        return NextResponse.json(
            { ok: false, error: message },
            { status: 500 }
        );
    }
}
