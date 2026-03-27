import { NextRequest, NextResponse } from "next/server";
import { indexRepositoryFiles } from "@/agents/indexing";
import { db } from "@/server/db/client";
import { repositories } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    let repositoryId: number | null = null;
    let repoFullName = "unknown";
    let fileCount = 0;

    try {
        // Validate API key — per-repo key lookup with legacy fallback
        const apiKey = req.headers.get("authorization")?.replace("Bearer ", "");
        if (!apiKey) {
            return NextResponse.json(
                { ok: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Try per-repo API key first
        const repo = await db.query.repositories.findFirst({
            where: eq(repositories.apiKey, apiKey),
        });

        if (!repo?.isActive && apiKey !== process.env.DEPLOYIQ_API_KEY) {
            return NextResponse.json(
                { ok: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = (await req.json()) as {
            repoFullName: string;
            files: Array<{ path: string; content: string }>;
        };

        repoFullName = body.repoFullName ?? repoFullName;
        fileCount = body.files?.length ?? 0;

        if (!body.repoFullName || !body.files || body.files.length === 0) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Missing required fields: repoFullName, files",
                },
                { status: 400 }
            );
        }

        if (process.env.NODE_ENV === "production" && !process.env.CHROMA_URL) {
            const message =
                "CHROMA_URL is not configured for production indexing.";

            if (repo) {
                await db
                    .update(repositories)
                    .set({
                        indexingStatus: "failed",
                    })
                    .where(eq(repositories.id, repo.id));
            }

            console.error("Repository indexing blocked", {
                repoFullName,
                repositoryId: repo?.id ?? null,
                fileCount,
                error: message,
            });

            return NextResponse.json(
                { ok: false, error: message },
                { status: 500 }
            );
        }

        if (repo) {
            repositoryId = repo.id;
            await db
                .update(repositories)
                .set({
                    indexingStatus: "indexing",
                })
                .where(eq(repositories.id, repo.id));
        }

        console.info("Repository indexing started", {
            repoFullName,
            repositoryId,
            fileCount,
        });

        const result = await indexRepositoryFiles(
            body.repoFullName,
            body.files
        );

        if (repositoryId) {
            await db
                .update(repositories)
                .set({
                    indexingStatus: "indexed",
                    lastIndexedAt: new Date(),
                })
                .where(eq(repositories.id, repositoryId));
        }

        console.info("Repository indexing completed", {
            repoFullName,
            repositoryId,
            fileCount,
            indexedChunks: result.indexed,
        });

        return NextResponse.json({
            ok: true,
            indexed: result.indexed,
            message: `Indexed ${result.indexed} chunks from ${body.files.length} files`,
        });
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Unknown error";

        console.error("Repository indexing failed", {
            repoFullName,
            repositoryId,
            fileCount,
            error: message,
        });

        if (repositoryId) {
            try {
                await db
                    .update(repositories)
                    .set({
                        indexingStatus: "failed",
                    })
                    .where(eq(repositories.id, repositoryId));
            } catch (statusError) {
                console.error("Failed to update repository indexing status", {
                    repositoryId,
                    error:
                        statusError instanceof Error
                            ? statusError.message
                            : String(statusError),
                });
            }
        }

        return NextResponse.json(
            { ok: false, error: message },
            { status: 500 }
        );
    }
}
