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

    const [codeResults, reviewResults] = await Promise.all([
        codeRetriever.invoke(query),
        reviewRetriever.invoke(query),
    ]);

    return {
        relevantCode: codeResults.map((doc) => ({
            content: doc.pageContent,
            filePath: doc.metadata.filePath as string,
            score: (doc.metadata.score as number) ?? 0,
        })),
        pastReviews: reviewResults.map((doc) => ({
            content: doc.pageContent,
            prTitle: doc.metadata.prTitle as string,
            score: (doc.metadata.score as number) ?? 0,
        })),
    };
}
