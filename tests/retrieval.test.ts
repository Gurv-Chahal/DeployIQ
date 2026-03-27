import { describe, expect, it, vi } from "vitest";
import {
    normalizeDistanceToRelevance,
    retrieveContext,
    type RetrievalStores,
} from "@/agents/retrieval";

function createStores(overrides?: Partial<RetrievalStores>): RetrievalStores {
    return {
        codeStore: {
            similaritySearchWithScore: vi.fn().mockResolvedValue([]),
        },
        reviewStore: {
            similaritySearchWithScore: vi.fn().mockResolvedValue([]),
        },
        ...overrides,
    };
}

describe("retrieveContext", () => {
    it("returns populated code and review matches with normalized relevance", async () => {
        const stores = createStores({
            codeStore: {
                similaritySearchWithScore: vi.fn().mockResolvedValue([
                    [
                        {
                            pageContent: "export const theme = 'dark';",
                            metadata: { filePath: "src/components/theme-toggle.tsx" },
                        },
                        0.1,
                    ],
                ]),
            },
            reviewStore: {
                similaritySearchWithScore: vi.fn().mockResolvedValue([
                    [
                        {
                            pageContent: "Previous review body",
                            metadata: { prTitle: "Theme follow-up" },
                        },
                        0.4,
                    ],
                ]),
            },
        });

        const context = await retrieveContext(
            "theme toggle",
            "Gurv-Chahal/DeployIQ",
            stores
        );

        expect(context.meta).toEqual({
            status: "ok",
            codeMatchCount: 1,
            reviewMatchCount: 1,
            codeError: null,
            reviewError: null,
        });
        expect(context.relevantCode).toEqual([
            {
                content: "export const theme = 'dark';",
                filePath: "src/components/theme-toggle.tsx",
                relevance: normalizeDistanceToRelevance(0.1),
            },
        ]);
        expect(context.pastReviews).toEqual([
            {
                content: "Previous review body",
                prTitle: "Theme follow-up",
                relevance: normalizeDistanceToRelevance(0.4),
            },
        ]);
    });

    it("preserves partial results and marks retrieval as degraded when one store fails", async () => {
        const stores = createStores({
            codeStore: {
                similaritySearchWithScore: vi
                    .fn()
                    .mockRejectedValue(new Error("code store unavailable")),
            },
            reviewStore: {
                similaritySearchWithScore: vi.fn().mockResolvedValue([
                    [
                        {
                            pageContent: "Past review body",
                            metadata: { prTitle: "Retry queue regression" },
                        },
                        0.25,
                    ],
                ]),
            },
        });

        const context = await retrieveContext(
            "retry queue",
            "Gurv-Chahal/DeployIQ",
            stores
        );

        expect(context.meta).toEqual({
            status: "degraded",
            codeMatchCount: 0,
            reviewMatchCount: 1,
            codeError: "code store unavailable",
            reviewError: null,
        });
        expect(context.relevantCode).toEqual([]);
        expect(context.pastReviews).toHaveLength(1);
    });

    it("returns a degraded empty context when both stores fail", async () => {
        const stores = createStores({
            codeStore: {
                similaritySearchWithScore: vi
                    .fn()
                    .mockRejectedValue(new Error("code search failed")),
            },
            reviewStore: {
                similaritySearchWithScore: vi
                    .fn()
                    .mockRejectedValue(new Error("review search failed")),
            },
        });

        const context = await retrieveContext(
            "dark mode",
            "Gurv-Chahal/DeployIQ",
            stores
        );

        expect(context.meta).toEqual({
            status: "degraded",
            codeMatchCount: 0,
            reviewMatchCount: 0,
            codeError: "code search failed",
            reviewError: "review search failed",
        });
        expect(context.relevantCode).toEqual([]);
        expect(context.pastReviews).toEqual([]);
    });
});
