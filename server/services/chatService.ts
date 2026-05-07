import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const index = pinecone.index(process.env.PINECONE_INDEX_NAME!);

interface ChatParams {
  question: string;
  userId: string;
  documentId: string;
  conversationHistory: { role: "user" | "assistant"; content: string }[];
}

export async function chatService({
  question,
  userId,
  documentId,
  conversationHistory,
}: ChatParams) {
  try {
    // 1. Embed the question

    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: question,
    });

    const embedding = embeddingResponse.data[0].embedding;

    // 2. Query Pinecone (RAG retrieval)

    const namespace = `user_${userId}`;

    const queryResponse = await index.namespace(namespace).query({
      vector: embedding,
      topK: 5,
      includeMetadata: true,
      filter: {
        documentId: { $eq: documentId },
      },
    });

    // 3. Extract context

    const context = queryResponse.matches
      ?.map((match) => match.metadata?.text)
      .filter(Boolean)
      .join("\n\n");

    // 4. Build prompt

    const prompt = `
You are an AI assistant. Answer the question ONLY using the context below.

Context:
${context}

Question:
${question}

Answer clearly and concisely.
`;

    // 5. Call GPT-4o with streaming

    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful AI assistant.",
        },
        ...conversationHistory,
        {
          role: "user",
          content: prompt,
        },
      ],
      stream: true,
    });

    return stream;
  } catch (error) {
    console.error("Chat Service Error:", error);
    throw error;
  }
}
