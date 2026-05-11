import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";
import prisma from "../lib/prisma";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const index = pinecone.index(process.env.PINECONE_INDEX_NAME!);

interface GenerateFlashcardParams {
  userId: string;
  documentId: string;
}

export const flashcardService = async ({
  userId,
  documentId,
}: GenerateFlashcardParams) => {
  try {
    // ----------------------------------------
    // 1. Query Pinecone for document chunks
    // ----------------------------------------

    const namespace = `user_${userId}`;

    const queryResponse = await index.namespace(namespace).query({
      vector: Array(1536).fill(0),
      topK: 100,
      includeMetadata: true,
      filter: {
        documentId: {
          $eq: documentId,
        },
      },
    });

    // ----------------------------------------
    // 2. Combine chunks into context
    // ----------------------------------------

    const context = queryResponse.matches
      ?.map((match) => match.metadata?.text)
      .filter(Boolean)
      .join("\n\n");

    if (!context) {
      throw new Error("No document context found");
    }

    // ----------------------------------------
    // 3. Create GPT prompt
    // ----------------------------------------

    const prompt = `
You are an AI study assistant.

Using the provided context, generate concise educational flashcards.

Return ONLY valid JSON in this exact format:

{
  "flashcards": [
    {
      "front": "string",
      "back": "string"
    }
  ]
}

Rules:
- Generate important concepts only
- Keep flashcards concise
- Front side should contain the question/concept
- Back side should contain the explanation/answer
- Return only JSON
- Do not add markdown

Context:
${context}
`;

    // ----------------------------------------
    // 4. Call GPT-4o
    // ----------------------------------------

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert flashcard generator.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_object",
      },
    });

    // ----------------------------------------
    // 5. Parse JSON response
    // ----------------------------------------

    const rawContent = completion.choices[0].message.content;

    if (!rawContent) {
      throw new Error("Empty GPT response");
    }

    const parsedResponse = JSON.parse(rawContent);

    // ----------------------------------------
    // 6. Save flashcards to PostgreSQL
    // ----------------------------------------

    const savedFlashcards = await prisma.flashcard.createMany({
      data: parsedResponse.flashcards.map((card: any) => ({
        front: card.front,
        back: card.back,
        userId: parseInt(userId),
        documentId: parseInt(documentId),
      })),
    });

    // ----------------------------------------
    // 7. Return response
    // ----------------------------------------

    return {
      success: true,
      count: parsedResponse.flashcards.length,
      flashcards: parsedResponse.flashcards,
      savedFlashcards,
    };
  } catch (error) {
    console.error("Flashcard Service Error:", error);

    throw error;
  }
};
