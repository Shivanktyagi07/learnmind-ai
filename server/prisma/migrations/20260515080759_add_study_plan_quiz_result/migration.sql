-- CreateTable
CREATE TABLE "StudyPlan" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "plan" JSONB NOT NULL,
    "examDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudyPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizResult" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "quizId" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "topicScores" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudyPlan_userId_idx" ON "StudyPlan"("userId");

-- CreateIndex
CREATE INDEX "QuizResult_userId_idx" ON "QuizResult"("userId");

-- AddForeignKey
ALTER TABLE "StudyPlan" ADD CONSTRAINT "StudyPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizResult" ADD CONSTRAINT "QuizResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizResult" ADD CONSTRAINT "QuizResult_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;
