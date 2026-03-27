import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
});

async function loadRoute(options?: {
    indexResult?: { indexed: number };
    indexError?: Error;
}) {
    const statusUpdates: Array<Record<string, unknown>> = [];
    const whereMock = vi.fn().mockResolvedValue(undefined);
    const setMock = vi.fn((values: Record<string, unknown>) => {
        statusUpdates.push(values);
        return { where: whereMock };
    });
    const findFirst = vi.fn().mockResolvedValue({
        id: 5,
        isActive: true,
    });
    const indexRepositoryFiles = options?.indexError
        ? vi.fn().mockRejectedValue(options.indexError)
        : vi.fn().mockResolvedValue(options?.indexResult ?? { indexed: 6 });

    vi.doMock("@/agents/indexing", () => ({
        indexRepositoryFiles,
    }));
    vi.doMock("@/server/db/client", () => ({
        db: {
            query: {
                repositories: {
                    findFirst,
                },
            },
            update: vi.fn(() => ({
                set: setMock,
            })),
        },
    }));
    vi.doMock("@/server/db/schema", () => ({
        repositories: {
            apiKey: "api_key",
            id: "id",
        },
    }));
    vi.doMock("drizzle-orm", () => ({
        eq: vi.fn((...args: unknown[]) => ({ eq: args })),
    }));

    const route = await import("@/app/api/index-repo/route");

    return {
        POST: route.POST,
        statusUpdates,
        indexRepositoryFiles,
        findFirst,
    };
}

describe("POST /api/index-repo", () => {
    it("marks repositories as indexing, then indexed on success", async () => {
        const { POST, statusUpdates, indexRepositoryFiles } = await loadRoute({
            indexResult: { indexed: 9 },
        });

        const response = await POST(
            new Request("http://localhost/api/index-repo", {
                method: "POST",
                headers: {
                    Authorization: "Bearer repo-key",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    repoFullName: "Gurv-Chahal/DeployIQ",
                    files: [{ path: "src/components/theme-toggle.tsx", content: "x" }],
                }),
            })
        );

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual(
            expect.objectContaining({
                ok: true,
                indexed: 9,
            })
        );
        expect(indexRepositoryFiles).toHaveBeenCalledWith(
            "Gurv-Chahal/DeployIQ",
            [{ path: "src/components/theme-toggle.tsx", content: "x" }]
        );
        expect(statusUpdates[0]).toEqual({ indexingStatus: "indexing" });
        expect(statusUpdates[1]).toEqual(
            expect.objectContaining({
                indexingStatus: "indexed",
                lastIndexedAt: expect.any(Date),
            })
        );
    });

    it("marks repositories as failed when indexing errors", async () => {
        const { POST, statusUpdates } = await loadRoute({
            indexError: new Error("chroma unavailable"),
        });

        const response = await POST(
            new Request("http://localhost/api/index-repo", {
                method: "POST",
                headers: {
                    Authorization: "Bearer repo-key",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    repoFullName: "Gurv-Chahal/DeployIQ",
                    files: [{ path: "src/components/theme-toggle.tsx", content: "x" }],
                }),
            })
        );

        expect(response.status).toBe(500);
        await expect(response.json()).resolves.toEqual(
            expect.objectContaining({
                ok: false,
                error: "chroma unavailable",
            })
        );
        expect(statusUpdates[0]).toEqual({ indexingStatus: "indexing" });
        expect(statusUpdates[1]).toEqual({ indexingStatus: "failed" });
    });
});
