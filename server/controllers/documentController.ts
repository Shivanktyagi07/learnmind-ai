import dotenv from "dotenv";
dotenv.config();

import { Request, Response } from "express";
import { processPdfAndStoreEmbeddings } from "../services/embeddingService";
import prisma from "../lib/prisma";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

export const uploadDocument = async (req: MulterRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { userId } = req.body;

    const document = await prisma.document.create({
      data: {
        name: req.file.originalname,
        fileUrl: req.file.originalname,
        status: "processing",
        userId: parseInt(userId),
      },
    });

    const result = await processPdfAndStoreEmbeddings(
      req.file.buffer,
      document.id.toString(),
      userId,
    );

    await prisma.document.update({
      where: { id: document.id },
      data: { status: "ready" },
    });

    return res.status(200).json({
      success: true,
      documentId: document.id,
      chunksStored: result.chunksStored,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
