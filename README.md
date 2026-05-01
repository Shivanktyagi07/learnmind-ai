# 🧠 LearnMind AI

> An intelligent learning platform where students upload their study material and get a personalized AI tutor that answers questions, creates quizzes, builds study plans, and tracks their understanding over time.

[![CI](https://github.com/Shivanktyagi07/learnmind-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/Shivanktyagi07/learnmind-ai/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://typescriptlang.org)

---

## 📌 Table of Contents

- [About the Project](#-about-the-project)
- [Core Features](#-core-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Database Schema](#-database-schema)
- [API Reference](#-api-reference)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Build Phases](#-build-phases)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🚀 About the Project

**LearnMind AI** is a SaaS learning platform built for students. Users upload their own study materials — PDFs, notes, DOCX files — and the platform creates a personal AI tutor grounded exclusively in their documents.

### The Problem

- Students read notes passively and think they understand, but cannot recall when tested
- Generic AI tools (ChatGPT) answer from the internet — not from the student's own material
- No single tool connects: upload notes → AI chat → quiz → track weak areas → plan revision

### The Solution

LearnMind uses **Retrieval-Augmented Generation (RAG)** to ground every AI response in the student's uploaded documents. LangChain.js agents automate quiz generation, flashcard creation, and study planning.

---

## ✨ Core Features

| Feature                        | Description                                                 | Status         |
| ------------------------------ | ----------------------------------------------------------- | -------------- |
| 🧠 **AI Tutor Chat**           | RAG-powered chat grounded in student's own uploaded notes   | 🚧 In Progress |
| 📝 **Smart Quiz Generator**    | LangChain agent auto-generates MCQ + short answer questions | 🚧 In Progress |
| 📅 **Personalized Study Plan** | Agent builds day-by-day revision schedule from quiz history | 📋 Planned     |
| 📊 **Knowledge Gap Tracker**   | Tracks weak topics over time with visual dashboard          | 📋 Planned     |
| 📁 **Document Vault**          | Upload PDFs/DOCX, auto-chunked and embedded into vector DB  | 🚧 In Progress |
| ⚡ **Flashcard Generator**     | Extracts key concepts and creates spaced repetition cards   | 📋 Planned     |

---

## 🛠 Tech Stack

### Frontend

| Technology              | Purpose                                                |
| ----------------------- | ------------------------------------------------------ |
| Next.js 15 (App Router) | SSR, file-based routing, best DX for SaaS              |
| TypeScript              | Type safety across full stack                          |
| Tailwind CSS            | Utility-first styling                                  |
| Zustand                 | Lightweight global state management                    |
| React Query             | Server state, caching, background refetch              |
| Clerk                   | Authentication — social login, JWT, session management |

### Backend

| Technology        | Purpose                                      |
| ----------------- | -------------------------------------------- |
| Node.js + Express | REST API server                              |
| TypeScript        | Type safety                                  |
| Multer            | PDF/DOCX file upload handling                |
| BullMQ + Redis    | Background job queues for embedding pipeline |
| Zod               | Runtime request validation                   |
| Stripe            | Subscription billing                         |

### AI Layer

| Technology        | Purpose                                    |
| ----------------- | ------------------------------------------ |
| LangChain.js      | RAG chains, agents, prompt templates       |
| OpenAI GPT-4o     | Chat completions                           |
| OpenAI Embeddings | text-embedding-3-small for vector creation |
| Pinecone          | Vector database for RAG embeddings         |
| LangSmith         | Trace and debug LangChain runs             |

### Data Layer

| Technology            | Purpose                                 |
| --------------------- | --------------------------------------- |
| PostgreSQL (Supabase) | Relational data — users, quizzes, plans |
| Prisma ORM            | Type-safe DB queries and migrations     |
| Redis                 | BullMQ job queue + response caching     |
| Supabase Storage      | PDF/DOCX file storage                   |

### DevOps & CI/CD

| Technology          | Purpose                                      |
| ------------------- | -------------------------------------------- |
| GitHub Actions      | Automated lint, test, build on every PR      |
| Docker              | Containerized backend for consistent deploys |
| Vercel              | Next.js frontend deployment                  |
| Render              | Dockerized Express backend                   |
| Husky + lint-staged | Pre-commit quality gates                     |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Actions CI/CD                      │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│              Client — Next.js 15 (Vercel)                   │
│   SentimentForm │ ResultCard │ HistoryList │ Dashboard       │
└─────────────────────────────────────────────────────────────┘
                              │ HTTP REST / SSE
┌─────────────────────────────────────────────────────────────┐
│            Server — Node.js + Express (Render)              │
│      Routes → Controllers → Services → Middleware           │
└─────────────────────────────────────────────────────────────┘
              │                              │
┌─────────────────────┐      ┌──────────────────────────────┐
│   Data Layer        │      │        AI Layer               │
│  PostgreSQL         │      │  LangChain.js RAG Pipeline   │
│  Prisma ORM         │      │  OpenAI GPT-4o + Embeddings  │
│  Pinecone (vectors) │      │  Pinecone Vector Search      │
│  Redis (queue)      │      │  LangSmith (tracing)         │
│  Supabase Storage   │      └──────────────────────────────┘
└─────────────────────┘
```

### Request Lifecycle — AI Tutor Chat

```
1. Student types question → React sends POST /api/chat
2. Express validates request + checks usage limits
3. Service embeds question via OpenAI Embeddings
4. Pinecone semantic search → returns top-5 relevant chunks
5. LangChain builds prompt: system + context + history + question
6. GPT-4o streams response via SSE
7. React renders tokens as they arrive
8. Message saved to PostgreSQL on completion
```

### Document Upload & Embedding Pipeline

```
1. Student uploads PDF → Multer receives file buffer
2. File stored in Supabase Storage
3. BullMQ job queued: { documentId, userId, fileUrl }
4. Worker parses PDF → extracts raw text
5. Text split into 500-char chunks (50 overlap)
6. Each chunk embedded via OpenAI text-embedding-3-small
7. Vectors upserted to Pinecone under user_{userId} namespace
8. Document status updated to "ready" in PostgreSQL
```

---

## 📁 Project Structure

```
learnmind-ai/
├── .github/
│   └── workflows/
│       ├── ci.yml              # Runs on every PR — lint + build
│       └── cd.yml              # Runs on merge to main — deploy
├── .husky/
│   └── pre-commit              # Runs lint-staged before every commit
├── client/                     # Next.js 15 frontend
│   ├── app/
│   │   ├── layout.tsx          # Root layout with ClerkProvider
│   │   ├── page.tsx            # Home page
│   │   └── sign-in/
│   │       └── [[...sign-in]]/
│   │           └── page.tsx    # Clerk sign-in page
│   ├── components/             # Reusable React components
│   ├── hooks/                  # Custom React hooks
│   ├── public/                 # Static assets
│   ├── proxy.ts                # Clerk middleware
│   ├── .env.local              # Frontend environment variables
│   ├── next.config.ts          # Next.js configuration
│   ├── tailwind.config.ts      # Tailwind configuration
│   └── package.json
├── server/                     # Node.js + Express backend
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── migrations/         # Migration history
│   ├── routes/                 # Express route definitions
│   ├── controllers/            # Request handlers
│   ├── services/               # Business logic
│   │   └── embeddingService.ts # PDF parsing + RAG embedding pipeline
│   ├── middleware/             # Express middleware
│   │   └── upload.ts           # Multer file upload config
│   ├── index.js                # Express server entry point
│   ├── prisma.config.ts        # Prisma configuration
│   ├── .env                    # Backend environment variables
│   └── package.json
├── .eslintrc.json              # Root ESLint config
├── .gitignore                  # Git ignore rules
├── package.json                # Root workspace config
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm 9.x or higher
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Shivanktyagi07/learnmind-ai.git
cd learnmind-ai
```

### 2. Install dependencies

```bash
npm install
```

This installs dependencies for both `client/` and `server/` via npm workspaces.

### 3. Set up environment variables

```bash
# Server
cp server/.env.example server/.env

# Client
cp client/.env.example client/.env.local
```

Fill in your actual keys — see [Environment Variables](#-environment-variables) below.

### 4. Set up the database

```bash
cd server
npx prisma migrate dev
npx prisma generate
```

### 5. Run the development servers

```bash
# Run both client and server
npm run dev

# Or run individually
cd client && npm run dev    # http://localhost:3000
cd server && npm run dev    # http://localhost:5000
```

---

## 🔑 Environment Variables

### `server/.env`

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Clerk Auth
CLERK_SECRET_KEY=sk_test_...

# OpenAI
OPENAI_API_KEY=sk-...

# Pinecone
PINECONE_API_KEY=...
PINECONE_INDEX_NAME=learnmind

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Server
PORT=5000
NODE_ENV=development
```

### `client/.env.local`

```env
# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# API
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## 🗄 Database Schema

```prisma
model User {
  id        Int        @id @default(autoincrement())
  clerkId   String     @unique
  email     String     @unique
  plan      String     @default("free")
  createdAt DateTime   @default(now())
  documents Document[]
  messages  Message[]
  quizzes   Quiz[]
}

model Document {
  id        Int       @id @default(autoincrement())
  userId    Int
  name      String
  fileUrl   String
  status    String    @default("processing")
  createdAt DateTime  @default(now())
  user      User      @relation(fields: [userId], references: [id])
  messages  Message[]
  quizzes   Quiz[]
}

model Message {
  id         Int      @id @default(autoincrement())
  userId     Int
  documentId Int
  role       String
  content    String
  createdAt  DateTime @default(now())
}

model Quiz {
  id         Int      @id @default(autoincrement())
  userId     Int
  documentId Int
  questions  Json
  createdAt  DateTime @default(now())
}
```

---

## 📡 API Reference

### Health Check

```http
GET /health
```

```json
{ "status": "ok" }
```

### Documents

```http
POST /api/documents/upload
Content-Type: multipart/form-data

file: <PDF file>
userId: <string>
```

```json
{
  "success": true,
  "documentId": "123",
  "chunksStored": 42
}
```

### Chat _(coming in Phase 4)_

```http
POST /api/chat
Content-Type: application/json

{
  "question": "What is photosynthesis?",
  "documentId": "123",
  "userId": "456"
}
```

### Quizzes _(coming in Phase 5)_

```http
POST /api/quiz/generate
Content-Type: application/json

{
  "documentId": "123",
  "userId": "456",
  "numQuestions": 10
}
```

---

## ⚙️ CI/CD Pipeline

Every pull request to `main` triggers the CI pipeline automatically.

### On Pull Request (CI)

```
lint job
  ├── Checkout code
  ├── Setup Node.js 20.x
  ├── npm install
  └── npm run lint (ESLint across all workspaces)

build job (runs after lint passes)
  ├── Checkout code
  ├── Setup Node.js 20.x
  ├── npm install
  └── npm run build
```

### On Merge to Main (CD) _(Phase 8)_

```
CI jobs run first
  ↓
Docker image built + tagged with git SHA
  ↓
Image pushed to DockerHub
  ↓
Render deployment triggered
  ↓
Smoke test on staging URL
```

### Branch Protection Rules

- Direct push to `main` is blocked
- All changes must go through a Pull Request
- CI must pass before merge is allowed

---

## 📋 Build Phases

| Phase       | What We Build                                  | Status         |
| ----------- | ---------------------------------------------- | -------------- |
| **Phase 1** | Monorepo + Git + GitHub Actions CI skeleton    | ✅ Complete    |
| **Phase 2** | Clerk Auth + Supabase + Prisma Schema          | ✅ Complete    |
| **Phase 3** | File Upload + PDF Parsing + Pinecone Embedding | 🚧 In Progress |
| **Phase 4** | RAG Pipeline — AI Tutor Chat                   | 📋 Planned     |
| **Phase 5** | Quiz Generator + Flashcard Agents              | 📋 Planned     |
| **Phase 6** | Study Plan Agent + Knowledge Gap Dashboard     | 📋 Planned     |
| **Phase 7** | Stripe Billing + Usage Limits                  | 📋 Planned     |
| **Phase 8** | Docker + Full CI/CD Pipeline                   | 📋 Planned     |
| **Phase 9** | Deploy to Vercel + Render + Custom Domain      | 📋 Planned     |

---

## 🤝 Contributing

This is a personal SaaS project currently in active development.

If you find a bug or have a suggestion:

1. Open an issue describing the problem
2. Fork the repository
3. Create a feature branch: `git checkout -b feat/your-feature`
4. Commit your changes: `git commit -m "feat: add your feature"`
5. Push to the branch: `git push origin feat/your-feature`
6. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built with ❤️ by [Shivank Tyagi](https://github.com/Shivanktyagi07)

⭐ Star this repo if you find it useful

</div>
