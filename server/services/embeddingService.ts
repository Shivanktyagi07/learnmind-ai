import dotenv from "dotenv";
dotenv.config();

import pdfParse from "pdf-parse-fork";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";

/*
 * Validate environment variables
 */
if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is missing in .env");
}

if (!process.env.PINECONE_API_KEY) {
  throw new Error("PINECONE_API_KEY is missing in .env");
}

if (!process.env.PINECONE_INDEX_NAME) {
  throw new Error("PINECONE_INDEX_NAME is missing in .env");
}

/*
 * OpenAI client
 */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/*
 * Pinecone client
 */
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const index = pinecone.index(process.env.PINECONE_INDEX_NAME);

/*
 * Main Service
 */
export const processPdfAndStoreEmbeddings = async (
  fileBuffer: Buffer,
  documentId: string,
  userId: string,
) => {
  try {
    /*
     * STEP 1 — Extract text from PDF
     */
    const pdfData = await pdfParse(fileBuffer);

    const rawText = pdfData.text;

    if (!rawText || rawText.trim().length === 0) {
      throw new Error("No text found in PDF");
    }

    /*
     * STEP 2 — Split text into chunks
     */
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 2000, // ~500 tokens
      chunkOverlap: 200,
    });

    const chunks = await splitter.splitText(rawText);

    /*
     * STEP 3 — Generate embeddings
     */
    const vectors = await Promise.all(
      chunks.map(async (chunk: string, indexPosition: number) => {
        const embeddingResponse = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: chunk,
        });

        return {
          id: `${documentId}-${indexPosition}`,
          values: embeddingResponse.data[0].embedding,
          metadata: {
            text: chunk,
            documentId,
            userId,
            chunkIndex: indexPosition,
          },
        };
      }),
    );

    /*
     * STEP 4 — Store embeddings in Pinecone
     */
    await index.namespace(`user_${userId}`).upsert(
      vectors.map((vector) => ({
        id: vector.id,
        values: vector.values,
        metadata: vector.metadata,
      })) as any,
    );

    return {
      success: true,
      chunksStored: vectors.length,
    };
  } catch (error) {
    console.error("Embedding Service Error:", error);
    throw error;
  }
};
