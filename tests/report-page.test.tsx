import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const baseReview = {
    id: 1,
    repoFullName: "Gurv-Chahal/DeployIQ",
    prNumber: 23,
    prTitle: "small theme change",
    prBody: "fixing dark mode bug",
    reviewBody: "body",
    riskScore: 3,
    riskLevel: "Low",
    riskFactors: ["Theme provider default changed"],
    reviewData: {
        blastRadius: {
            filesAffected: 2,
            servicesAffected: ["Web frontend"],
        },
        deploymentRecommendations: ["Validate dark/light toggle behavior."],
        codeObservations: ["Toggle behavior changed."],
    },
    repositoryId: null,
    createdAt: new Date("2026-03-26T12:00:00.000Z"),
};

afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
});

async function renderPage(
    review: typeof baseReview & Record<string, unknown>
) {
    vi.doMock("@/lib/auth", () => ({
        auth: vi.fn().mockResolvedValue({ user: { id: "1" } }),
    }));
    vi.doMock("@/server/db/client", () => ({
        db: {
            query: {
                prReviews: {
                    findFirst: vi.fn().mockResolvedValue(review),
                },
                repositories: {
                    findFirst: vi.fn().mockResolvedValue(null),
                },
            },
        },
    }));
    vi.doMock("@/server/db/schema", () => ({
        prReviews: { id: "id" },
        repositories: { id: "id", userId: "userId" },
    }));
    vi.doMock("drizzle-orm", () => ({
        eq: vi.fn((...args: unknown[]) => ({ eq: args })),
        and: vi.fn((...args: unknown[]) => ({ and: args })),
    }));
    vi.doMock("next/navigation", () => ({
        notFound: vi.fn(() => {
            throw new Error("notFound");
        }),
    }));
    vi.doMock("next/link", () => ({
        default: ({
            href,
            children,
            ...props
        }: {
            href: string;
            children: React.ReactNode;
        }) => React.createElement("a", { href, ...props }, children),
    }));

    const { default: ReportDetailPage } = await import(
        "@/app/(dashboard)/dashboard/reports/[reviewId]/page"
    );
    const jsx = await ReportDetailPage({
        params: Promise.resolve({ reviewId: "1" }),
    });

    return renderToStaticMarkup(jsx);
}

describe("ReportDetailPage", () => {
    it("renders retrieved code matches when context is available", async () => {
        const markup = await renderPage({
            ...baseReview,
            retrievedContext: {
                relevantCode: [
                    {
                        content: "const mode = resolvedTheme;",
                        filePath: "src/components/theme-toggle.tsx",
                        relevance: 0.91,
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
            },
            retrievalMeta: {
                status: "ok",
                codeMatchCount: 1,
                reviewMatchCount: 0,
                codeError: null,
                reviewError: null,
            },
        });

        expect(markup).toContain("Codebase Match");
        expect(markup).toContain("0.91 relevance");
    });

    it("renders the no-match state when retrieval succeeds without matches", async () => {
        const markup = await renderPage({
            ...baseReview,
            retrievedContext: {
                relevantCode: [],
                pastReviews: [],
                meta: {
                    status: "empty",
                    codeMatchCount: 0,
                    reviewMatchCount: 0,
                    codeError: null,
                    reviewError: null,
                },
            },
            retrievalMeta: {
                status: "empty",
                codeMatchCount: 0,
                reviewMatchCount: 0,
                codeError: null,
                reviewError: null,
            },
        });

        expect(markup).toContain(
            "No matching codebase context found for this PR."
        );
        expect(markup).not.toContain("Context retrieval degraded");
    });

    it("renders a degraded warning when retrieval fails", async () => {
        const markup = await renderPage({
            ...baseReview,
            retrievedContext: {
                relevantCode: [],
                pastReviews: [],
                meta: {
                    status: "degraded",
                    codeMatchCount: 0,
                    reviewMatchCount: 0,
                    codeError: "code search failed",
                    reviewError: "review search failed",
                },
            },
            retrievalMeta: {
                status: "degraded",
                codeMatchCount: 0,
                reviewMatchCount: 0,
                codeError: "code search failed",
                reviewError: "review search failed",
            },
        });

        expect(markup).toContain("Context retrieval degraded");
        expect(markup).toContain("Context retrieval failed for this run.");
        expect(markup).toContain("Code search: code search failed");
    });
});
