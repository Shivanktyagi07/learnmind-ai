import "dotenv/config";
import express from "express";
import cors from "cors";
import documentRoutes from "./routes/documentRoutes";
import chatRoutes from "./routes/chatRoutes";
import quizRoutes from "./routes/quizRoutes";
import flashcardRoutes from "./routes/flashcardRoutes";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/documents", documentRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/flashcards", flashcardRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => process.stdout.write(`Server running on ${PORT}\n`));

export default app;
