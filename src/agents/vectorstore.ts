import { Chroma } from "@langchain/community/vectorstores/chroma";
import { OpenAIEmbeddings } from "@langchain/openai";

const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-small",
    openAIApiKey: process.env.OPENAI_API_KEY,
});

const chromaUrl = process.env.CHROMA_URL ?? "http://localhost:8000";

export async function getCodeChunksStore(): Promise<Chroma> {
    return new Chroma(embeddings, {
        collectionName: "code_chunks",
        url: chromaUrl,
    });
}

export async function getReviewHistoryStore(): Promise<Chroma> {
    return new Chroma(embeddings, {
        collectionName: "review_history",
        url: chromaUrl,
    });
}

export { embeddings };
