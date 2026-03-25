import { getCodeChunksStore, getReviewHistoryStore } from "./vectorstore";
import type { RetrievedContext } from "./types";

export async function retrieveContext(
    query: string,
    repoFullName: string
): Promise<RetrievedContext> {
    const [codeStore, reviewStore] = await Promise.all([
        getCodeChunksStore(),
        getReviewHistoryStore(),
    ]);

    // Retrieve relevant code chunks using MMR for diversity
    const codeRetriever = codeStore.asRetriever({
        searchType: "mmr",
        k: 10,
        searchKwargs: {
            fetchK: 20,
            lambda: 0.7, // balance between relevance and diversity
        },
        filter: { repoFullName },
    });

    // Retrieve past reviews for similar changes
    const reviewRetriever = reviewStore.asRetriever({
        searchType: "mmr",
        k: 5,
        searchKwargs: {
            fetchK: 10,
            lambda: 0.7,
        },
        filter: { repoFullName },
    });

    const [codeResults, reviewResults] = await Promise.allSettled([
        codeRetriever.invoke(query),
        reviewRetriever.invoke(query),
    ]);

    const codeDocs = codeResults.status === "fulfilled" ? codeResults.value : [];
    const reviewDocs = reviewResults.status === "fulfilled" ? reviewResults.value : [];

    if (codeResults.status === "rejected") {
        console.error("Code retrieval failed:", codeResults.reason);
    }
    if (reviewResults.status === "rejected") {
        console.error("Review retrieval failed:", reviewResults.reason);
    }

    console.log(`Retrieved ${codeDocs.length} code chunks, ${reviewDocs.length} past reviews for ${repoFullName}`);

    return {
        relevantCode: codeDocs.map((doc) => ({
            content: doc.pageContent,
            filePath: (doc.metadata.filePath as string) ?? "unknown",
            score: (doc.metadata.score as number) ?? 0,
        })),
        pastReviews: reviewDocs.map((doc) => ({
            content: doc.pageContent,
            prTitle: (doc.metadata.prTitle as string) ?? "unknown",
            score: (doc.metadata.score as number) ?? 0,
        })),
    };
}
