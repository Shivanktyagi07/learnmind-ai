// server/services/studyPlanService.ts

import prisma from "../lib/prisma";
import OpenAI from "openai";
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface GenerateStudyPlanParams {
  userId: string;
  examDate: string; // format: YYYY-MM-DD
}

export const generateStudyPlan = async ({
  userId,
  examDate,
}: GenerateStudyPlanParams) => {
  try {
    // 1. Fetch user's quiz results
    const quizResults = await prisma.quizResult.findMany({
      where: {
        userId: parseInt(userId),
      },
      select: {
        topicScores: true,
        score: true,
      },
    });

    if (!quizResults.length) {
      throw new Error("No quiz results found for this user");
    }

    // 2. Identify weak topics (score < 60)
    const weakTopics = quizResults
      .filter((quiz) => quiz.score < 60)
      .map((quiz) => ({
        topic: quiz.topicScores,
        score: quiz.score,
      }));

    if (!weakTopics.length) {
      throw new Error("No weak topics found. User is performing well.");
    }

    // 3. Build GPT prompt
    const prompt = `
You are an expert academic mentor.

Create a detailed day-by-day study plan for a student.

Exam Date: ${examDate}

Weak Topics:
${weakTopics
  .map((topic, index) => `${index + 1}. ${topic.topic} (${topic.score}%)`)
  .join("\n")}

Instructions:
- Create a practical daily study schedule.
- Prioritize weakest topics first.
- Include revision days.
- Include practice/mock test days.
- Keep study sessions realistic for college students.
- Return ONLY valid JSON.

Output format:
{
  "studyPlan": [
    {
      "day": "Day 1",
      "focus": "Topic Name",
      "tasks": [
        "Task 1",
        "Task 2"
      ]
    }
  ]
}
`;

    // 4. Call GPT-4o
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful AI study planner that returns only JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    // 5. Parse GPT response
    const parsedPlan = JSON.parse(content);

    // 6. Save to PostgreSQL
    const savedPlan = await prisma.studyPlan.create({
      data: {
        userId: parseInt(userId),
        examDate: new Date(examDate),
        plan: parsedPlan.studyPlan,
      },
    });

    return {
      success: true,
      weakTopics,
      studyPlan: savedPlan,
    };
  } catch (error: any) {
    console.error("Study Plan Service Error:", error.message);

    throw new Error(error.message || "Failed to generate study plan");
  }
};
