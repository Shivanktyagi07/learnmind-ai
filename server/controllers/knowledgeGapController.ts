import { Request, Response } from "express";
import { getKnowledgeGaps } from "../services/knowledgeGapService";

export const knowledgeGap = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: "userId id required!..",
      });
    }

    const result = await getKnowledgeGaps(userId);
    return res.status(200).json(result);
  } catch (error) {
    console.error("knowledge Controller Error", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error !...",
    });
  }
};
