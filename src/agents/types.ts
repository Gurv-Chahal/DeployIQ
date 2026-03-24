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
}

export interface CodeChunk {
    content: string;
    filePath: string;
    chunkIndex: number;
    language: string;
}

export interface RetrievedContext {
    relevantCode: Array<{ content: string; filePath: string; score: number }>;
    pastReviews: Array<{ content: string; prTitle: string; score: number }>;
}

// LangGraph state
export interface ReviewGraphState {
    request: ReviewRequest;
    diffSummary: string;
    retrievedContext: RetrievedContext;
    review: ReviewResponse | null;
    error: string | null;
}
