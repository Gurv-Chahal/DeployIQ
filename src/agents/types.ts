export interface ReviewRequest {
    repoFullName: string;
    prNumber: number;
    prTitle: string;
    prBody: string;
    diff: string;
    changedFiles: string[];
    baseBranch: string;
    headBranch: string;
}

export type RetrievalStatus = "ok" | "empty" | "degraded";

export interface RetrievalMeta {
    status: RetrievalStatus;
    codeMatchCount: number;
    reviewMatchCount: number;
    codeError: string | null;
    reviewError: string | null;
}

export interface ReviewResponse {
    riskScore: number;
    riskLevel: "Low" | "Medium" | "High" | "Critical";
    riskFactors: string[];
    blastRadius: {
        filesAffected: number;
        servicesAffected: string[];
    };
    deploymentRecommendations: string[];
    codeObservations: string[];
    reviewBody: string;
    retrieval?: RetrievalMeta;
}

export interface CodeChunk {
    content: string;
    filePath: string;
    chunkIndex: number;
    language: string;
}

export interface RetrievedCodeMatch {
    content: string;
    filePath: string;
    relevance?: number;
    score?: number;
}

export interface RetrievedReviewMatch {
    content: string;
    prTitle: string;
    relevance?: number;
    score?: number;
}

export interface RetrievedContext {
    relevantCode: RetrievedCodeMatch[];
    pastReviews: RetrievedReviewMatch[];
    meta: RetrievalMeta;
}

export const EMPTY_RETRIEVAL_META: RetrievalMeta = {
    status: "empty",
    codeMatchCount: 0,
    reviewMatchCount: 0,
    codeError: null,
    reviewError: null,
};

export function createEmptyRetrievedContext(): RetrievedContext {
    return {
        relevantCode: [],
        pastReviews: [],
        meta: { ...EMPTY_RETRIEVAL_META },
    };
}

// LangGraph state
export interface ReviewGraphState {
    request: ReviewRequest;
    diffSummary: string;
    retrievedContext: RetrievedContext;
    review: ReviewResponse | null;
    error: string | null;
}
