import { Request, Response } from "express";
import { flashcardService } from "../services/flashCardService";

export const flashcardController = async (req: Request, res: Response) => {
  try {
    const { userId, documentId } = req.body;

    if (!userId || !documentId) {
      return res.status(400).json({ error: "userId and documentId required" });
    }

    const result = await flashcardService({ userId, documentId });
    return res.status(200).json(result);
  } catch (error) {
    console.error("Quiz Controller Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
