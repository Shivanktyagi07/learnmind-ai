import express from "express";

import { flashcardController } from "../controllers/flashcardController";

const router = express.Router();

router.post("/generate", flashcardController);

export default router;
