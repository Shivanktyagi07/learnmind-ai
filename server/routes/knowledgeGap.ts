import express from "express";
import { knowledgeGap } from "../controllers/knowledgeGapController";

const router = express.Router();
router.post("/generate", knowledgeGap);
export default router;
