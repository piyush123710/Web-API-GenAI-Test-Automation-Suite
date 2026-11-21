export type UserRole = 'guest' | 'intern' | 'analyst' | 'admin';
export type TestFramework = 'Playwright' | 'Selenium' | 'Postman';
export type TestLanguage = 'JavaScript' | 'C#';
export type TestStatus = 'Passed' | 'Failed' | 'Pending';
export type EvalCategory = 'Response Relevance' | 'Groundedness' | 'Guardrails' | 'Permissions';
export type JiraSeverity = 'Critical' | 'High' | 'Medium' | 'Low';
export type JiraStatus = 'Open' | 'In Progress' | 'In Review' | 'Resolved';
export type JiraComponent = 'Web UI' | 'REST API' | 'RAG Chatbot' | 'CI/CD';

export type NavSection = 'overview' | 'tests' | 'eval' | 'pipelines' | 'jira';

export interface WebApiTestCase {
  id: string;
  name: string;
  framework: TestFramework;
  language: TestLanguage;
  suite: 'Web UI' | 'REST API';
  stage: 'smoke' | 'regression' | 'release';
  status: TestStatus;
  durationMs: number;
  lastRunAt: string;
  targetMethod: 'GET' | 'POST' | 'PUT' | 'DELETE';
  targetPath: string;
  requestHeaders?: Record<string, string>;
  requestBody?: Record<string, unknown>;
  expectedStatus: number;
  assertions: string[];
  lastAssertionLog: string[];
  linkedJiraId?: string;
  codeSnippet: string;
}

export interface RagEvalPrompt {
  id: string;
  category: EvalCategory;
  role: UserRole;
  prompt: string;
  expectedBehavior: string;
  anonymizedEntities: string[];
  status: 'Passed' | 'Failed';
  relevanceScore: number;
  groundednessScore: number;
  guardrailPass: boolean;
  permissionPass: boolean;
  lastAnswer: string;
  rationale: string;
  latencyMs: number;
  lastEvaluatedAt: string;
  linkedJiraId?: string;
}

export interface CorpusDocument {
  id: string;
  title: string;
  classification: 'Public' | 'Internal' | 'Confidential' | 'Restricted';
  allowedRoles: UserRole[];
  department: string;
  lastUpdated: string;
  anonymizationNotes: string;
  chunks: Array<{
    chunkId: string;
    section: string;
    content: string;
  }>;
}

export interface JiraBug {
  id: string;
  title: string;
  severity: JiraSeverity;
  status: JiraStatus;
  component: JiraComponent;
  linkedTestId: string;
  environment: string;
  reportedAt: string;
  reporter: string;
  reproductionSteps: string[];
  expectedResult: string;
  actualResult: string;
}

export interface PipelineRunRecord {
  id: string;
  stage: 'PR Regression' | 'Release Candidate' | 'Post-Deployment Smoke';
  branch: string;
  commitSha: string;
  trigger: string;
  status: 'Passed' | 'Failed';
  totalTests: number;
  passedTests: number;
  failedTests: number;
  durationSec: number;
  manualBaselineMin: number;
  executedAt: string;
}

export interface SuiteSummary {
  webApi: { total: number; passed: number; failed: number };
  eval: { total: number; passed: number; failed: number };
  jira: { total: number; open: number; criticalOpen: number };
  pipelines: {
    totalRuns: number;
    manualRegressionSavedPct: number;
    manualBaselineMin: number;
    automatedRegressionMin: number;
    ciParallelMin: number;
  };
  byFramework: {
    Playwright: { total: number; passed: number };
    Selenium: { total: number; passed: number };
    Postman: { total: number; passed: number };
  };
  byEvalCategory: Array<{
    category: EvalCategory;
    total: number;
    passed: number;
    avgRelevance: number;
    avgGroundedness: number;
  }>;
  recentRuns: PipelineRunRecord[];
  openCriticalBugs: JiraBug[];
}

export interface BugDraft {
  title: string;
  severity: JiraSeverity;
  component: JiraComponent;
  linkedTestId: string;
  expectedResult: string;
  actualResult: string;
  reproductionSteps: string[];
}
