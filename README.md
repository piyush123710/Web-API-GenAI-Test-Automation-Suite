# Web, API and GenAI Test Automation Suite

An end-to-end quality engineering and test automation platform built to validate a web application, its REST APIs, and a document-based RAG AI chatbot across automated regression suites, LLM evaluation harnesses, CI/CD release gates, and Jira defect tracking.

---

## Key Capabilities

- **Web & REST API Automation (44 Executable Tests)**:
  - **Playwright (JavaScript)** — 16 E2E web UI, session, and portal workflows.
  - **Selenium WebDriver (C# / NUnit)** — 12 cross-browser and role-based access matrix tests.
  - **Postman / Newman (JavaScript)** — 16 REST API contract, schema, token TTL, and SLA latency checks.
  - Live HTTP assertion runner executing directly against the local System Under Test (SUT) endpoints with real latency, status code, and payload inspection, plus copyable source scripts.
- **GenAI RAG Chatbot & 50-Prompt Evaluation Suite**:
  - Evaluates a document-based RAG assistant powered by `@google/genai` (`gemini-4-hydrogen`) across **50 anonymized prompts**:
    - **Response Relevance** (13 prompts)
    - **Groundedness** (13 prompts — abstention & hallucination checks)
    - **Guardrails** (12 prompts — prompt injection, PII/secret extraction, XSS, and jailbreak resistance)
    - **Permissions / RBAC** (12 prompts — `guest`, `intern`, `analyst`, and `admin` document boundaries)
  - Includes an **Interactive RAG Chatbot Sandbox** to test roles, inspect retrieved chunks, and verify blocked restricted documents in real time, plus an **Anonymized Corpus Viewer** (`DOC-001` through `DOC-005`) using tokenized synthetic test data (`[EMP-1042]`, `[ACCT-8821]`, `[TARGET-DELTA]`).
- **CI/CD Pipelines & Smoke Gates**:
  - Dispatches **Post-Deployment Smoke**, **Release Candidate**, and **PR Regression** stages against the live test runner.
  - Tracks historical runs, parallel execution time, and the **60% manual regression time reduction** benchmark (`180 min` baseline reduced to `72 min` hybrid / `4 min` CI parallel).
  - Includes a copyable `.github/workflows/qa-automation.yml` workflow definition.
- **Jira Defect Tracking (22+ Bugs Logged)**:
  - Tracks defects (`QA-101` through `QA-122`) with severity (`Critical`, `High`, `Medium`, `Low`), status (`Open`, `In Progress`, `In Review`, `Resolved`), component, linked test ID, environment, reproduction steps, and expected vs. actual results.
  - Supports updating defect workflow statuses and filing new Jira bugs directly from failing Web/API tests or GenAI evaluation prompts.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons |
| **Backend & SUT** | Node.js 22, Express 4, `tsx` |
| **GenAI & RAG Eval** | `@google/genai` (`gemini-4-hydrogen` with structured JSON schema judging) |
| **Test Frameworks Covered** | Playwright (JavaScript), Selenium WebDriver (C# / NUnit), Postman / Newman (JavaScript) |
| **CI/CD & Defect Tracking** | GitHub Actions, Jira Defect Workflow |

---

## Project Structure

```text
├── server.ts                      # Express server, SUT APIs, live test runner & Vite integration
├── server/
│   ├── gemini.ts                  # Server-side @google/genai RAG chatbot & LLM-as-Judge evaluator
│   └── data/
│       ├── corpus.ts              # 5 anonymized enterprise documents & RBAC chunk retriever
│       ├── webApiTests.ts         # 44 Playwright JS, Selenium C#, and Postman REST API test cases
│       └── evalAndJira.ts         # 50 RAG eval prompts, 22 Jira bugs, CI/CD runs & workflow YAML
├── src/
│   ├── App.tsx                    # Root SPA state & API orchestration
│   ├── types.ts                   # Shared TypeScript interfaces
│   ├── index.css                  # Tailwind CSS v4 & typography setup
│   └── components/
│       ├── Sidebar.tsx            # Workspace navigation & suite counts
│       ├── TopBar.tsx             # Breadcrumb header & Smoke / Full Suite runners
│       ├── OverviewView.tsx       # Executive metrics, framework coverage & active defect summary
│       ├── WebApiTestsView.tsx    # Filterable 44-test grid, assertion logs & script inspector
│       ├── GenAiEvalView.tsx      # 50-prompt eval suite, live RAG sandbox & anonymized corpus
│       ├── PipelinesView.tsx      # CI/CD stage dispatcher, time savings chart & YAML viewer
│       ├── JiraBugsView.tsx       # Defect log, repro/expected/actual inspector & bug creation modal
│       └── StatusText.tsx         # Accessible semantic status and severity indicators
├── .env.example                   # Environment variable template
├── index.html                     # HTML entry point & Google Fonts
├── metadata.json                  # Application metadata & server-side Gemini capability
└── package.json                   # Scripts and dependencies
```

---

## Getting Started

### Prerequisites

- **Node.js** `>= 22.x`
- **Gemini API Key** configured via environment variable `GEMINI_API_KEY` (required for live GenAI RAG chatbot queries and live LLM-as-Judge evaluations).

### Environment Setup

Copy `.env.example` to `.env` (or configure secrets in your hosting environment):

```bash
cp .env.example .env
```

Set the required variables:

```env
GEMINI_API_KEY="your_gemini_api_key"
APP_URL="http://localhost:3000"
```

### Install & Run

```bash
# Install dependencies
npm install

# Run full-stack development server (Express + Vite middleware on port 3000)
npm run dev
```

Open `http://localhost:3000` in your browser.

### Build & Lint

```bash
# Type-check TypeScript
npm run lint

# Build production frontend bundle
npm run build

# Start production server
NODE_ENV=production npm start
```

---

## API Reference

### System Under Test (SUT) Endpoints (`/api/sut/*`)

| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| `GET` | `/api/sut/health` | Service health check and uptime telemetry |
| `POST` | `/api/sut/auth/login` | Role-based token issuance (`guest`, `intern`, `analyst`, `admin`) |
| `GET` | `/api/sut/documents` | Role-filtered anonymized document catalog with search (`?role=&q=`) |
| `GET` | `/api/sut/documents/:id` | Single document retrieval with RBAC enforcement |
| `GET` | `/api/sut/expenses` | Lists submitted corporate expense claims |
| `POST` | `/api/sut/expenses` | Submits an expense claim with audit threshold checks |
| `GET` | `/api/sut/users/:id` | Anonymized employee directory lookup with PII masking |
| `POST` | `/api/sut/chat` | Live Gemini RAG chatbot endpoint with RBAC chunk retrieval |

### QA Suite & Evaluation Endpoints (`/api/*`)

| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| `GET` | `/api/suite/summary` | Aggregated pass/fail stats, eval averages, pipeline & Jira summaries |
| `GET` | `/api/tests` | Lists all 44 Web & REST API test cases |
| `POST` | `/api/tests/run` | Executes selected tests, stage (`smoke`, `release`, `regression`), or framework |
| `GET` | `/api/eval/prompts` | Lists all 50 GenAI RAG evaluation prompts and scores |
| `POST` | `/api/eval/run` | Runs live Gemini RAG + LLM-as-Judge evaluation on selected prompt IDs |
| `GET` | `/api/corpus` | Returns the 5 anonymized enterprise documents |
| `GET` | `/api/pipelines` | Returns pipeline run history, regression benchmarks, and GitHub Actions YAML |
| `POST` | `/api/pipelines/run` | Dispatches a CI/CD stage run (`Post-Deployment Smoke`, `Release Candidate`, `PR Regression`) |
| `GET` | `/api/jira` | Lists all tracked Jira bug reports |
| `POST` | `/api/jira` | Creates a new Jira bug report with reproduction steps and severity |
| `PATCH` | `/api/jira/:id` | Updates bug status or severity |

---

## Anonymized Test Data & Security Practices

- **No Production PII**: All documents, directory records, and RAG prompts use deterministic placeholders (`[EMP-1042]`, `[EMP-2019]`, `[ACCT-8821]`, `[EXEC-01]`, `@example-corp.test`).
- **Server-Side Key Isolation**: `GEMINI_API_KEY` is accessed exclusively on the Express backend via `process.env.GEMINI_API_KEY`.
- **Internal Test Target Confinement**: The automated test runner executes strictly against server-defined internal SUT endpoints.
