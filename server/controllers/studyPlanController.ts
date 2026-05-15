import { Request, Response } from "express";
import { generateStudyPlan } from "../services/studyPlanService";

export const generateStudyPlanController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { userId, examDate } = req.body;

    if (!userId || !examDate) {
      return res.status(400).json({ error: "userId and examDate required" });
    }

    const result = await generateStudyPlan({ userId, examDate });
    return res.status(200).json(result);
  } catch (error) {
    console.error("Quiz Controller Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
