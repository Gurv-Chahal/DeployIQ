import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";

const typescriptSplitter = RecursiveCharacterTextSplitter.fromLanguage(
    "js", // LangChain uses "js" for TS/JS
    {
        chunkSize: 1000,
        chunkOverlap: 200,
    }
);

const defaultSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
});

function getLanguage(filePath: string): string {
    const ext = filePath.split(".").pop()?.toLowerCase();
    switch (ext) {
        case "ts":
        case "tsx":
        case "js":
        case "jsx":
            return "typescript";
        case "yml":
        case "yaml":
            return "yaml";
        case "json":
            return "json";
        default:
            return "text";
    }
}

export async function chunkFile(
    filePath: string,
    content: string
): Promise<Document[]> {
    const language = getLanguage(filePath);
    const splitter =
        language === "typescript" ? typescriptSplitter : defaultSplitter;

    const docs = await splitter.createDocuments(
        [content],
        [
            {
                filePath,
                language,
            },
        ]
    );

    return docs.map((doc, index) => ({
        ...doc,
        metadata: {
            ...doc.metadata,
            chunkIndex: index,
        },
    }));
}

export async function chunkFiles(
    files: Array<{ path: string; content: string }>
): Promise<Document[]> {
    const allDocs: Document[] = [];

    for (const file of files) {
        const docs = await chunkFile(file.path, file.content);
        allDocs.push(...docs);
    }

    return allDocs;
}
