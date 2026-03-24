import { StateGraph, Annotation, END } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { retrieveContext } from "./retrieval";
import { indexReview } from "./indexing";
import {
    REVIEW_PROMPT,
    formatCodeContext,
    formatReviewContext,
    formatReviewMarkdown,
} from "./prompts";
import { db } from "@/server/db/client";
import { prReviews } from "@/server/db/schema";
import type { ReviewRequest, ReviewResponse, RetrievedContext } from "./types";

// Define the graph state using LangGraph Annotation
// reducer: (_, b) => b means "replace old value with new value"
const ReviewState = Annotation.Root({
    request: Annotation<ReviewRequest>,
    diffSummary: Annotation<string>({
        reducer: (_, b) => b,
        default: () => "",
    }),
    retrievedContext: Annotation<RetrievedContext>({
        reducer: (_, b) => b,
        default: () => ({ relevantCode: [], pastReviews: [] }),
    }),
    review: Annotation<ReviewResponse | null>({
        reducer: (_, b) => b,
        default: () => null,
    }),
    error: Annotation<string | null>({
        reducer: (_, b) => b,
        default: () => null,
    }),
});

const llm = new ChatOpenAI({
    model: "gpt-5.4",
    temperature: 0.1,
    openAIApiKey: process.env.OPENAI_API_KEY,
});

// Node 1: Parse and summarize the PR diff
async function parsePr(
    state: typeof ReviewState.State
): Promise<Partial<typeof ReviewState.State>> {
    try {
        const { request } = state;

        // Use LLM to create a concise summary for retrieval
        const summaryResponse = await llm.invoke([
            {
                role: "system",
                content:
                    "Summarize this code diff in 2-3 sentences focusing on what changed functionally. This summary will be used to search for relevant code context.",
            },
            {
                role: "user",
                content: `PR: ${request.prTitle}\n\nDiff:\n${request.diff.slice(0, 3000)}`,
            },
        ]);

        return {
            diffSummary:
                typeof summaryResponse.content === "string"
                    ? summaryResponse.content
                    : "",
        };
    } catch (err) {
        return {
            error: `Failed to parse PR: ${err instanceof Error ? err.message : "Unknown error"}`,
        };
    }
}

// Node 2: Retrieve relevant context via RAG
async function retrieveCtx(
    state: typeof ReviewState.State
): Promise<Partial<typeof ReviewState.State>> {
    try {
        const { request, diffSummary } = state;

        const query = `${diffSummary}\n\nChanged files: ${request.changedFiles.join(", ")}`;
        const context = await retrieveContext(query, request.repoFullName);

        return { retrievedContext: context };
    } catch (err) {
        // Non-fatal: proceed without context if retrieval fails
        console.warn("Retrieval failed, proceeding without context:", err);
        return {
            retrievedContext: { relevantCode: [], pastReviews: [] },
        };
    }
}

// Node 3: Generate the review using GPT-4o
async function generate(
    state: typeof ReviewState.State
): Promise<Partial<typeof ReviewState.State>> {
    try {
        const { request, retrievedContext } = state;

        const formattedPrompt = await REVIEW_PROMPT.formatMessages({
            prTitle: request.prTitle,
            prBody: request.prBody || "No description provided.",
            baseBranch: request.baseBranch,
            headBranch: request.headBranch,
            changedFiles: request.changedFiles.join(", "),
            diff: request.diff.slice(0, 8000), // Limit diff size for token budget
            codeContext: formatCodeContext(retrievedContext.relevantCode),
            reviewContext: formatReviewContext(retrievedContext.pastReviews),
        });

        const response = await llm.invoke(formattedPrompt);

        const content =
            typeof response.content === "string" ? response.content : "";

        // Parse the JSON response — strip markdown code fences if present
        const jsonStr = content
            .replace(/```json\n?/g, "")
            .replace(/```\n?/g, "")
            .trim();

        const parsed = JSON.parse(jsonStr) as Omit<ReviewResponse, "reviewBody">;

        const reviewBody = formatReviewMarkdown(parsed);

        return {
            review: {
                ...parsed,
                reviewBody,
            },
        };
    } catch (err) {
        return {
            error: `Failed to generate review: ${err instanceof Error ? err.message : "Unknown error"}`,
        };
    }
}

// Node 4: Store review in Postgres + ChromaDB
async function store(
    state: typeof ReviewState.State
): Promise<Partial<typeof ReviewState.State>> {
    try {
        const { request, review } = state;

        if (!review) {
            return { error: "No review to store" };
        }

        // Store in Postgres
        await db.insert(prReviews).values({
            repoFullName: request.repoFullName,
            prNumber: request.prNumber,
            prTitle: request.prTitle,
            reviewBody: review.reviewBody,
            riskScore: review.riskScore,
            riskFactors: review.riskFactors,
        });

        // Index in ChromaDB for future RAG
        await indexReview(
            request.repoFullName,
            request.prNumber,
            request.prTitle,
            review.reviewBody
        );

        return {};
    } catch (err) {
        // Non-fatal: the review was generated, just storage failed
        console.error("Failed to store review:", err);
        return {};
    }
}

// Route: skip remaining nodes if there's an error
function shouldContinue(state: typeof ReviewState.State): string {
    if (state.error) {
        return END;
    }
    return "continue";
}

// Build the graph
const workflow = new StateGraph(ReviewState)
    .addNode("parse_pr", parsePr)
    .addNode("retrieve_ctx", retrieveCtx)
    .addNode("generate", generate)
    .addNode("store", store)
    .addEdge("__start__", "parse_pr")
    .addConditionalEdges("parse_pr", shouldContinue, {
        continue: "retrieve_ctx",
        [END]: END,
    })
    .addConditionalEdges("retrieve_ctx", shouldContinue, {
        continue: "generate",
        [END]: END,
    })
    .addConditionalEdges("generate", shouldContinue, {
        continue: "store",
        [END]: END,
    })
    .addEdge("store", END);

const reviewGraph = workflow.compile();

// Main entry point
export async function runReview(
    request: ReviewRequest
): Promise<ReviewResponse> {
    const result = await reviewGraph.invoke({ request });

    if (result.error) {
        throw new Error(result.error);
    }

    if (!result.review) {
        throw new Error("Review generation produced no output");
    }

    return result.review;
}
