import { Document } from "@langchain/core/documents";
import { getCodeChunksStore, getReviewHistoryStore } from "./vectorstore";
import { chunkFiles } from "./chunking";

export async function indexRepositoryFiles(
    repoFullName: string,
    files: Array<{ path: string; content: string }>
): Promise<{ indexed: number }> {
    const store = await getCodeChunksStore();

    // Chunk all files
    const docs = await chunkFiles(files);

    // Add repo metadata to each document
    const docsWithRepo = docs.map(
        (doc) =>
            new Document({
                pageContent: doc.pageContent,
                metadata: {
                    ...doc.metadata,
                    repoFullName,
                },
            })
    );

    if (docsWithRepo.length > 0) {
        await store.addDocuments(docsWithRepo);
    }

    return { indexed: docsWithRepo.length };
}

export async function indexReview(
    repoFullName: string,
    prNumber: number,
    prTitle: string,
    reviewBody: string
): Promise<void> {
    const store = await getReviewHistoryStore();

    const doc = new Document({
        pageContent: reviewBody,
        metadata: {
            repoFullName,
            prNumber,
            prTitle,
            indexedAt: new Date().toISOString(),
        },
    });

    await store.addDocuments([doc]);
}
