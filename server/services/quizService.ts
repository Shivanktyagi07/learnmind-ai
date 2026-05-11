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

interface GenerateQuizParams {
  userId: string;
  documentId: string;
}

export const generateQuizService = async ({
  userId,
  documentId,
}: GenerateQuizParams) => {
  try {
    // 1. Query Pinecone for all document chunks
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

    // 2. Combine chunks into context
    const context = queryResponse.matches
      ?.map((match) => match.metadata?.text)
      .filter(Boolean)
      .join("\n\n");

    if (!context) {
      throw new Error("No document context found");
    }

    // 3. Create GPT prompt
    const prompt = `
You are an AI teacher.

Using the provided context, generate exactly 10 multiple-choice questions.

Return ONLY valid JSON in this exact format:

{
  "questions": [
    {
      "question": "string",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "string",
      "explanation": "string"
    }
  ]
}

Rules:
- Generate exactly 10 questions
- Each question must have 4 options
- correctAnswer must exactly match one option
- Keep explanations concise
- Return only JSON
- Do not add markdown

Context:
${context}
`;

    // 4. Call GPT-4o
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert MCQ generator.",
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

    // 5. Parse JSON response
    const rawContent = completion.choices[0].message.content;

    if (!rawContent) {
      throw new Error("Empty GPT response");
    }

    const parsedResponse = JSON.parse(rawContent);

    // 6. Save questions in PostgreSQL
    const savedQuestions = await prisma.quiz.create({
      data: {
        questions: parsedResponse.questions,
        documentId: parseInt(documentId),
        userId: parseInt(userId),
      },
    });

    // 7. Return response
    return {
      success: true,
      count: parsedResponse.questions.length,
      questions: parsedResponse.questions,
      savedQuestions,
    };
  } catch (error) {
    console.error("Generate Quiz Service Error:", error);

    throw error;
  }
};
