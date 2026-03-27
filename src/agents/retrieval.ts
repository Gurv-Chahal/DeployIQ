import { getCodeChunksStore, getReviewHistoryStore } from "./vectorstore";
import {
    createEmptyRetrievedContext,
    type RetrievalStatus,
    type RetrievedCodeMatch,
    type RetrievedContext,
    type RetrievedReviewMatch,
} from "./types";

const CODE_MATCH_LIMIT = 10;
const REVIEW_MATCH_LIMIT = 5;

type SearchDocument = {
    pageContent: string;
    metadata: Record<string, unknown>;
};

type SimilarityStore = Pick<
    Awaited<ReturnType<typeof getCodeChunksStore>>,
    "similaritySearchWithScore"
>;

type SearchResult = [SearchDocument, number];

export interface RetrievalStores {
    codeStore: SimilarityStore;
    reviewStore: SimilarityStore;
}

export function normalizeDistanceToRelevance(distance: number): number {
    const sanitizedDistance = Number.isFinite(distance)
        ? Math.max(distance, 0)
        : 0;

    return Number((1 / (1 + sanitizedDistance)).toFixed(4));
}

export function getRetrievalConfigError(): string | null {
    if (process.env.NODE_ENV === "production" && !process.env.CHROMA_URL) {
        return "CHROMA_URL is not configured for production retrieval.";
    }

    return null;
}

function toErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }

    return String(error);
}

function getRetrievalStatus(
    relevantCode: RetrievedCodeMatch[],
    pastReviews: RetrievedReviewMatch[],
    codeError: string | null,
    reviewError: string | null
): RetrievalStatus {
    if (codeError || reviewError) {
        return "degraded";
    }

    if (relevantCode.length > 0 || pastReviews.length > 0) {
        return "ok";
    }

    return "empty";
}

function buildContext(
    relevantCode: RetrievedCodeMatch[],
    pastReviews: RetrievedReviewMatch[],
    codeError: string | null,
    reviewError: string | null
): RetrievedContext {
    const status = getRetrievalStatus(
        relevantCode,
        pastReviews,
        codeError,
        reviewError
    );

    return {
        relevantCode,
        pastReviews,
        meta: {
            status,
            codeMatchCount: relevantCode.length,
            reviewMatchCount: pastReviews.length,
            codeError,
            reviewError,
        },
    };
}

function logRetrievedContext(repoFullName: string, context: RetrievedContext) {
    const payload = {
        repoFullName,
        status: context.meta.status,
        codeMatchCount: context.meta.codeMatchCount,
        reviewMatchCount: context.meta.reviewMatchCount,
        codeError: context.meta.codeError,
        reviewError: context.meta.reviewError,
    };

    if (context.meta.status === "degraded") {
        console.warn("Context retrieval degraded", payload);
        return;
    }

    console.info("Context retrieval completed", payload);
}

function mapCodeResults(results: SearchResult[]): RetrievedCodeMatch[] {
    return results.map(([doc, distance]) => ({
        content: doc.pageContent,
        filePath: (doc.metadata.filePath as string) ?? "unknown",
        relevance: normalizeDistanceToRelevance(distance),
    }));
}

function mapReviewResults(results: SearchResult[]): RetrievedReviewMatch[] {
    return results.map(([doc, distance]) => ({
        content: doc.pageContent,
        prTitle: (doc.metadata.prTitle as string) ?? "unknown",
        relevance: normalizeDistanceToRelevance(distance),
    }));
}

async function resolveStores(): Promise<RetrievalStores> {
    const [codeStore, reviewStore] = await Promise.all([
        getCodeChunksStore(),
        getReviewHistoryStore(),
    ]);

    return { codeStore, reviewStore };
}

export async function retrieveContext(
    query: string,
    repoFullName: string,
    stores?: RetrievalStores
): Promise<RetrievedContext> {
    const configError = getRetrievalConfigError();
    if (configError) {
        const context = buildContext([], [], configError, configError);
        logRetrievedContext(repoFullName, context);
        return context;
    }

    const emptyContext = createEmptyRetrievedContext();

    try {
        const { codeStore, reviewStore } = stores ?? (await resolveStores());
        const [codeResults, reviewResults] = await Promise.allSettled([
            codeStore.similaritySearchWithScore(query, CODE_MATCH_LIMIT, {
                repoFullName,
            }),
            reviewStore.similaritySearchWithScore(query, REVIEW_MATCH_LIMIT, {
                repoFullName,
            }),
        ]);

        const relevantCode =
            codeResults.status === "fulfilled"
                ? mapCodeResults(codeResults.value)
                : emptyContext.relevantCode;
        const pastReviews =
            reviewResults.status === "fulfilled"
                ? mapReviewResults(reviewResults.value)
                : emptyContext.pastReviews;
        const codeError =
            codeResults.status === "rejected"
                ? toErrorMessage(codeResults.reason)
                : null;
        const reviewError =
            reviewResults.status === "rejected"
                ? toErrorMessage(reviewResults.reason)
                : null;

        const context = buildContext(
            relevantCode,
            pastReviews,
            codeError,
            reviewError
        );

        logRetrievedContext(repoFullName, context);

        return context;
    } catch (error) {
        const errorMessage = toErrorMessage(error);
        const context = buildContext([], [], errorMessage, errorMessage);

        logRetrievedContext(repoFullName, context);

        return context;
    }
}
