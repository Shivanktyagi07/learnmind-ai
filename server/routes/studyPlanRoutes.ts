import express from "express";
import { generateStudyPlanController } from "../controllers/studyPlanController";

const router = express.Router();

router.post("/", generateStudyPlanController);
export default router;
