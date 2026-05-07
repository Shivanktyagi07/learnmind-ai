import { Request, Response } from "express";
import { chatService } from "../services/chatService";

export const chatController = async (req: Request, res: Response) => {
  try {
    const { question, userId, documentId, conversationHistory } = req.body;

    //Valditaong Request..
    if (!question || !userId || !documentId) {
      return res.status(400).json({
        success: false,
        message: "OOP's!....quetion, userid and document are requires",
      });
    }

    //Call chat service:
    const stream = await chatService({
      question,
      userId,
      documentId,
      conversationHistory,
    });

    //Set SSE Headers:
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "Keep-alive");
    res.flushHeaders();

    //Stream token to frontend:
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta.content;

      if (content) {
        res.write(`data: ${content}\n\n`);
      }
    }

    //End response:
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error("Chat Controller Error", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error !...",
    });
  }
};
