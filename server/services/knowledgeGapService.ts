import prisma from "../lib/prisma";

export const getKnowledgeGaps = async (userId: string) => {
  try {
    const quizResults = await prisma.quizResult.findMany({
      where: { userId: parseInt(userId) },
      select: { topicScores: true, score: true },
    });

    if (!quizResults.length) {
      return { gaps: [], message: "No quiz results found" };
    }

    // Aggregate topic scores
    const topicMap: Record<string, { total: number; attempts: number }> = {};

    quizResults.forEach((result) => {
      const topics = result.topicScores as Record<string, number>;
      Object.entries(topics).forEach(([topic, score]) => {
        if (!topicMap[topic]) topicMap[topic] = { total: 0, attempts: 0 };
        topicMap[topic].total += score;
        topicMap[topic].attempts += 1;
      });
    });

    // Calculate averages and status
    const gaps = Object.entries(topicMap)
      .map(([topic, data]) => {
        const averageScore = Math.round(data.total / data.attempts);
        return {
          topic,
          averageScore,
          attempts: data.attempts,
          status:
            averageScore < 50
              ? "weak"
              : averageScore < 75
                ? "improving"
                : "strong",
        };
      })
      .sort((a, b) => a.averageScore - b.averageScore);

    return { gaps };
  } catch (error) {
    console.error("Knowledge Gap Service Error:", error);
    throw error;
  }
};
