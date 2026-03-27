import { afterEach, describe, expect, it, vi } from "vitest";
import {
    createEmptyRetrievedContext,
    type RetrievedContext,
} from "@/agents/types";

const request = {
    repoFullName: "Gurv-Chahal/DeployIQ",
    prNumber: 23,
    prTitle: "small theme change",
    prBody: "fixing dark mode bug",
    diff: "diff --git a/src/components/theme-toggle.tsx b/src/components/theme-toggle.tsx",
    changedFiles: ["src/components/theme-toggle.tsx"],
    baseBranch: "main",
    headBranch: "feature/theme-fix",
};

afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
});

async function loadRunReview(context: RetrievedContext) {
    const llmInvoke = vi
        .fn()
        .mockResolvedValueOnce({ content: "Theme toggle logic changed." })
        .mockResolvedValueOnce({
            content: JSON.stringify({
                riskScore: 3,
                riskLevel: "Low",
                riskFactors: ["Theme provider default changed"],
                blastRadius: {
                    filesAffected: 2,
                    servicesAffected: ["Web frontend"],
                },
                deploymentRecommendations: [
                    "Validate dark/light toggle behavior after hydration.",
                ],
                codeObservations: ["The theme toggle now reads resolvedTheme."],
            }),
        });
    const insertedValues = vi.fn().mockResolvedValue(undefined);
    const indexReview = vi.fn().mockResolvedValue(undefined);

    vi.doMock("@langchain/openai", () => ({
        ChatOpenAI: class {
            invoke = llmInvoke;
        },
    }));
    vi.doMock("@/agents/retrieval", () => ({
        retrieveContext: vi.fn().mockResolvedValue(context),
    }));
    vi.doMock("@/agents/indexing", () => ({
        indexReview,
    }));
    vi.doMock("@/server/db/client", () => ({
        db: {
            insert: vi.fn(() => ({
                values: insertedValues,
            })),
        },
    }));
    vi.doMock("@/server/db/schema", () => ({
        prReviews: {},
    }));

    const { runReview } = await import("@/agents/review-graph");

    return { runReview, insertedValues, indexReview };
}

describe("runReview", () => {
    it("stores retrieved context and retrieval meta on successful retrieval", async () => {
        const context: RetrievedContext = {
            relevantCode: [
                {
                    content: "const toggleTheme = () => setTheme('dark');",
                    filePath: "src/components/theme-toggle.tsx",
                    relevance: 0.92,
                },
            ],
            pastReviews: [],
            meta: {
                status: "ok",
                codeMatchCount: 1,
                reviewMatchCount: 0,
                codeError: null,
                reviewError: null,
            },
        };
        const { runReview, insertedValues, indexReview } = await loadRunReview(
            context
        );

        const review = await runReview(request, 7);

        expect(review.retrieval).toEqual(context.meta);
        expect(review.reviewBody).not.toContain("Context retrieval degraded");
        expect(insertedValues).toHaveBeenCalledWith(
            expect.objectContaining({
                repoFullName: request.repoFullName,
                repositoryId: 7,
                retrievedContext: context,
                retrievalMeta: context.meta,
            })
        );
        expect(indexReview).toHaveBeenCalledWith(
            request.repoFullName,
            request.prNumber,
            request.prTitle,
            review.reviewBody
        );
    });

    it("still generates a review and persists degraded retrieval metadata", async () => {
        const context = createEmptyRetrievedContext();
        context.meta = {
            status: "degraded",
            codeMatchCount: 0,
            reviewMatchCount: 0,
            codeError: "CHROMA_URL is not configured for production retrieval.",
            reviewError: "CHROMA_URL is not configured for production retrieval.",
        };

        const { runReview, insertedValues } = await loadRunReview(context);

        const review = await runReview(request, 11);

        expect(review.retrieval).toEqual(context.meta);
        expect(review.reviewBody).toContain("Context retrieval degraded");
        expect(insertedValues).toHaveBeenCalledWith(
            expect.objectContaining({
                repositoryId: 11,
                retrievalMeta: context.meta,
            })
        );
    });
});
