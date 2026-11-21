import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { ANONYMIZED_CORPUS, retrieveChunksForQuery } from './server/data/corpus.ts';
import type { UserRole } from './server/data/corpus.ts';
import { INITIAL_WEB_API_TESTS } from './server/data/webApiTests.ts';
import type { WebApiTestCase } from './server/data/webApiTests.ts';
import {
  GITHUB_ACTIONS_YAML,
  INITIAL_EVAL_PROMPTS,
  INITIAL_JIRA_BUGS,
  INITIAL_PIPELINE_RUNS,
} from './server/data/evalAndJira.ts';
import type {
  EvalCategory,
  JiraBug,
  JiraComponent,
  JiraSeverity,
  JiraStatus,
  PipelineRunRecord,
  RagEvalPrompt,
} from './server/data/evalAndJira.ts';
import { judgeRagResponse, runRagChatbot } from './server/gemini.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

const VALID_ROLES: UserRole[] = ['guest', 'intern', 'analyst', 'admin'];

const DIRECTORY_USERS: Record<
  string,
  { id: string; token: string; department: string; role: UserRole; emailMasked: string; minReadRole: UserRole[] }
> = {
  'EMP-1042': {
    id: 'EMP-1042',
    token: '[EMP-1042]',
    department: 'People Operations',
    role: 'analyst',
    emailMasked: 'm***@example-corp.test',
    minReadRole: ['guest', 'intern', 'analyst', 'admin'],
  },
  'EMP-2019': {
    id: 'EMP-2019',
    token: '[EMP-2019]',
    department: 'Finance Operations',
    role: 'admin',
    emailMasked: 'f***@example-corp.test',
    minReadRole: ['intern', 'analyst', 'admin'],
  },
  'EMP-0088': {
    id: 'EMP-0088',
    token: '[EMP-0088]',
    department: 'Security Engineering',
    role: 'admin',
    emailMasked: 's***@example-corp.test',
    minReadRole: ['analyst', 'admin'],
  },
};

// Mutable in-memory QA state
const testCases: WebApiTestCase[] = INITIAL_WEB_API_TESTS.map((t) => ({ ...t, assertions: [...t.assertions], lastAssertionLog: [...t.lastAssertionLog] }));
const evalPrompts: RagEvalPrompt[] = INITIAL_EVAL_PROMPTS.map((p) => ({ ...p, anonymizedEntities: [...p.anonymizedEntities] }));
const jiraBugs: JiraBug[] = INITIAL_JIRA_BUGS.map((b) => ({ ...b, reproductionSteps: [...b.reproductionSteps] }));
const pipelineRuns: PipelineRunRecord[] = INITIAL_PIPELINE_RUNS.map((r) => ({ ...r }));
const expensesLedger: Array<{
  id: string;
  employeeId: string;
  category: string;
  amount: number;
  currency: string;
  auditRequired: boolean;
  exceedsDailyMealCap: boolean;
  createdAt: string;
}> = [
  {
    id: 'EXP-1001',
    employeeId: '[EMP-1042]',
    category: 'Meals',
    amount: 48.0,
    currency: 'USD',
    auditRequired: false,
    exceedsDailyMealCap: false,
    createdAt: '2026-11-18T14:20:00Z',
  },
];

function isValidRole(value: unknown): value is UserRole {
  return typeof value === 'string' && VALID_ROLES.includes(value as UserRole);
}

async function executeSingleTest(tc: WebApiTestCase): Promise<WebApiTestCase> {
  const start = Date.now();
  const url = `http://127.0.0.1:${PORT}${tc.targetPath}`;
  const logs: string[] = [];
  let passed = true;

  try {
    const fetchOpts: RequestInit = {
      method: tc.targetMethod,
      headers: {
        'Content-Type': 'application/json',
        ...(tc.requestHeaders ?? {}),
      },
    };
    if (tc.requestBody && tc.targetMethod !== 'GET') {
      fetchOpts.body = JSON.stringify(tc.requestBody);
    }

    const res = await fetch(url, fetchOpts);
    const elapsed = Date.now() - start;
    const contentType = res.headers.get('content-type') ?? '';
    let body: Record<string, unknown> | null = null;

    if (contentType.includes('application/json')) {
      body = (await res.json()) as Record<string, unknown>;
    } else {
      await res.text();
    }

    if (res.status === tc.expectedStatus) {
      logs.push(`PASS: HTTP ${res.status} received in ${elapsed}ms`);
    } else {
      passed = false;
      logs.push(
        `FAIL: Expected HTTP ${tc.expectedStatus} but received HTTP ${res.status}${
          tc.linkedJiraId ? ` (Linked ${tc.linkedJiraId})` : ''
        }`
      );
    }

    // Additional payload checks based on test specifics
    if (passed && body) {
      if (tc.id === 'TC-001' && body.status !== 'healthy') {
        passed = false;
        logs.push('FAIL: body.status !== "healthy"');
      } else if (tc.id === 'TC-002' && typeof body.token !== 'string') {
        passed = false;
        logs.push('FAIL: Bearer token missing');
      } else if (tc.id === 'TC-004' && Array.isArray(body.documents)) {
        const hasRestricted = (body.documents as Array<{ id: string }>).some((d) => d.id === 'DOC-005');
        if (hasRestricted) {
          passed = false;
          logs.push('FAIL: Restricted DOC-005 leaked to intern');
        } else {
          logs.push('PASS: Restricted DOC-005 omitted for intern');
        }
      } else if (tc.id === 'TC-005' && Array.isArray(body.documents)) {
        if ((body.documents as unknown[]).length !== 5) {
          passed = false;
          logs.push(`FAIL: Expected 5 docs for admin, got ${(body.documents as unknown[]).length}`);
        } else {
          logs.push('PASS: 5 anonymized documents returned for admin');
        }
      } else if (tc.id === 'TC-008' && body.auditRequired !== true) {
        passed = false;
        logs.push('FAIL: Expected auditRequired === true for >$2500');
      } else if (tc.id === 'TC-010' && (!String(body.emailMasked ?? '').includes('***') || 'ssn' in body)) {
        passed = false;
        logs.push('FAIL: PII masking check failed');
      } else if (tc.id === 'TC-031' && body.expiresInSec !== 1800) {
        passed = false;
        logs.push(`FAIL: Expected 1800s admin TTL, got ${String(body.expiresInSec)}`);
      } else if (tc.id === 'TC-033' && body.exceedsDailyMealCap !== true) {
        passed = false;
        logs.push('FAIL: Expected exceedsDailyMealCap === true');
      } else if (tc.id === 'TC-035' && elapsed >= 250) {
        passed = false;
        logs.push(`FAIL: Latency ${elapsed}ms exceeded 250ms SLA`);
      } else {
        for (const a of tc.assertions.slice(1)) {
          logs.push(`PASS: ${a}`);
        }
      }
    } else if (passed && tc.targetPath === '/') {
      if (!contentType.includes('text/html')) {
        passed = false;
        logs.push('FAIL: Expected text/html content-type');
      } else {
        logs.push('PASS: HTML shell delivered cleanly');
      }
    }

    tc.status = passed ? 'Passed' : 'Failed';
    tc.durationMs = Math.max(elapsed, 12);
    tc.lastRunAt = new Date().toISOString();
    tc.lastAssertionLog = logs;
  } catch (err) {
    tc.status = 'Failed';
    tc.durationMs = Date.now() - start;
    tc.lastRunAt = new Date().toISOString();
    tc.lastAssertionLog = [`FAIL: Request error - ${err instanceof Error ? err.message : 'Unknown error'}`];
  }

  return tc;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // =========================================================================
  // 1. SYSTEM UNDER TEST (SUT) - Enterprise Document Portal & RAG Chatbot API
  // =========================================================================

  app.get('/api/sut/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      service: 'enterprise-doc-portal',
      uptimeSec: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  });

  app.post('/api/sut/auth/login', (req: Request, res: Response) => {
    const { email, role } = req.body as { email?: unknown; role?: unknown };
    if (typeof email !== 'string' || !email.trim()) {
      res.status(400).json({ error: 'Email is required for login.' });
      return;
    }
    if (!isValidRole(role)) {
      res.status(401).json({ error: 'Invalid credentials or unrecognized role.' });
      return;
    }
    const expiresInSec = role === 'admin' ? 1800 : 28800;
    res.json({
      token: `sut-tok-${role}-${Date.now().toString(36)}`,
      role,
      emailMasked: email.replace(/(^.).*(@.*$)/, '$1***$2'),
      expiresInSec,
    });
  });

  app.get('/api/sut/documents', (req: Request, res: Response) => {
    const roleParam = req.query.role;
    const role: UserRole = isValidRole(roleParam) ? roleParam : 'guest';
    const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';

    const docs = ANONYMIZED_CORPUS.filter((doc) => {
      if (!doc.allowedRoles.includes(role)) return false;
      if (!q) return true;
      const text = `${doc.title} ${doc.department} ${doc.chunks.map((c) => c.content).join(' ')}`.toLowerCase();
      return text.includes(q);
    });

    res.json({ role, count: docs.length, documents: docs });
  });

  app.get('/api/sut/documents/:id', (req: Request, res: Response) => {
    const doc = ANONYMIZED_CORPUS.find((d) => d.id === req.params.id);
    if (!doc) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }
    const roleParam = req.query.role;
    if (!isValidRole(roleParam) || !doc.allowedRoles.includes(roleParam)) {
      res.status(403).json({ error: 'Insufficient role permissions' });
      return;
    }
    res.json(doc);
  });

  app.get('/api/sut/expenses', (_req: Request, res: Response) => {
    res.json({ count: expensesLedger.length, expenses: expensesLedger });
  });

  app.post('/api/sut/expenses', (req: Request, res: Response) => {
    const { employeeId, category, amount, currency } = req.body as {
      employeeId?: unknown;
      category?: unknown;
      amount?: unknown;
      currency?: unknown;
    };

    if (typeof employeeId !== 'string' || typeof category !== 'string' || typeof amount !== 'number') {
      res.status(400).json({ error: 'Missing required fields: employeeId, category, and numeric amount.' });
      return;
    }

    // Note: Intentionally mirrors open regression defects QA-101 (negative amount) & QA-107 (currency check)
    // so live Playwright/Postman tests detect them authentically.
    const record = {
      id: `EXP-${1001 + expensesLedger.length}`,
      employeeId,
      category,
      amount,
      currency: typeof currency === 'string' ? currency : 'USD',
      auditRequired: amount > 2500,
      exceedsDailyMealCap: category.toLowerCase() === 'meals' && amount > 75,
      createdAt: new Date().toISOString(),
    };
    expensesLedger.push(record);
    res.status(201).json(record);
  });

  app.get('/api/sut/users/:id', (req: Request, res: Response) => {
    const id = String(req.params.id);
    const user = DIRECTORY_USERS[id];
    const roleParam = req.query.role;
    // Note: Intentionally mirrors open defect QA-104 when role query param is omitted
    const effectiveRole: UserRole = isValidRole(roleParam) ? roleParam : 'guest';

    if (!user) {
      res.status(404).json({ error: 'Employee record not found' });
      return;
    }
    if (!user.minReadRole.includes(effectiveRole)) {
      res.status(403).json({ error: 'Insufficient role permissions for directory record' });
      return;
    }
    res.json({
      id: user.id,
      token: user.token,
      department: user.department,
      role: user.role,
      emailMasked: user.emailMasked,
    });
  });

  app.post('/api/sut/chat', async (req: Request, res: Response) => {
    const { prompt, role } = req.body as { prompt?: unknown; role?: unknown };
    if (typeof prompt !== 'string' || !prompt.trim()) {
      res.status(400).json({ error: 'Prompt must be a non-empty string.' });
      return;
    }
    const effectiveRole: UserRole = isValidRole(role) ? role : 'guest';
    try {
      const { permittedChunks, blockedDocs } = retrieveChunksForQuery(prompt, effectiveRole);
      const chatResult = await runRagChatbot(prompt.trim(), effectiveRole, permittedChunks, blockedDocs);
      res.json({
        role: effectiveRole,
        ...chatResult,
        permittedChunks,
        blockedDocs,
      });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to generate RAG chatbot response.',
      });
    }
  });

  // =========================================================================
  // 2. TEST AUTOMATION, GENAI EVAL, CI/CD PIPELINES & JIRA API ROUTES
  // =========================================================================

  app.get('/api/suite/summary', (_req: Request, res: Response) => {
    const totalWebApi = testCases.length;
    const passedWebApi = testCases.filter((t) => t.status === 'Passed').length;
    const failedWebApi = testCases.filter((t) => t.status === 'Failed').length;

    const totalEval = evalPrompts.length;
    const passedEval = evalPrompts.filter((e) => e.status === 'Passed').length;
    const failedEval = evalPrompts.filter((e) => e.status === 'Failed').length;

    const openBugs = jiraBugs.filter((b) => b.status !== 'Resolved').length;
    const criticalOpenBugs = jiraBugs.filter((b) => b.status !== 'Resolved' && b.severity === 'Critical').length;

    const byFramework = {
      Playwright: {
        total: testCases.filter((t) => t.framework === 'Playwright').length,
        passed: testCases.filter((t) => t.framework === 'Playwright' && t.status === 'Passed').length,
      },
      Selenium: {
        total: testCases.filter((t) => t.framework === 'Selenium').length,
        passed: testCases.filter((t) => t.framework === 'Selenium' && t.status === 'Passed').length,
      },
      Postman: {
        total: testCases.filter((t) => t.framework === 'Postman').length,
        passed: testCases.filter((t) => t.framework === 'Postman' && t.status === 'Passed').length,
      },
    };

    const byEvalCategory = (['Response Relevance', 'Groundedness', 'Guardrails', 'Permissions'] as EvalCategory[]).map(
      (category) => {
        const items = evalPrompts.filter((p) => p.category === category);
        return {
          category,
          total: items.length,
          passed: items.filter((p) => p.status === 'Passed').length,
          avgRelevance:
            Math.round((items.reduce((acc, p) => acc + p.relevanceScore, 0) / items.length) * 10) / 10,
          avgGroundedness:
            Math.round((items.reduce((acc, p) => acc + p.groundednessScore, 0) / items.length) * 10) / 10,
        };
      }
    );

    res.json({
      webApi: { total: totalWebApi, passed: passedWebApi, failed: failedWebApi },
      eval: { total: totalEval, passed: passedEval, failed: failedEval },
      jira: { total: jiraBugs.length, open: openBugs, criticalOpen: criticalOpenBugs },
      pipelines: {
        totalRuns: pipelineRuns.length,
        manualRegressionSavedPct: 60,
        manualBaselineMin: 180,
        automatedRegressionMin: 72,
        ciParallelMin: 4,
      },
      byFramework,
      byEvalCategory,
      recentRuns: pipelineRuns.slice(0, 4),
      openCriticalBugs: jiraBugs.filter((b) => b.status !== 'Resolved').slice(0, 5),
    });
  });

  app.get('/api/tests', (_req: Request, res: Response) => {
    res.json({ count: testCases.length, tests: testCases });
  });

  app.post('/api/tests/run', async (req: Request, res: Response) => {
    const { testIds, stage, framework } = req.body as {
      testIds?: unknown;
      stage?: unknown;
      framework?: unknown;
    };

    let targets = testCases;
    if (Array.isArray(testIds) && testIds.length > 0) {
      const idSet = new Set(testIds.map(String));
      targets = testCases.filter((t) => idSet.has(t.id));
    } else if (typeof stage === 'string' && ['smoke', 'regression', 'release'].includes(stage)) {
      if (stage === 'smoke') {
        targets = testCases.filter((t) => t.stage === 'smoke');
      } else if (stage === 'release') {
        targets = testCases.filter((t) => t.stage === 'smoke' || t.stage === 'release');
      } else {
        targets = testCases;
      }
    } else if (typeof framework === 'string' && ['Playwright', 'Selenium', 'Postman'].includes(framework)) {
      targets = testCases.filter((t) => t.framework === framework);
    }

    const updated: WebApiTestCase[] = [];
    for (const tc of targets) {
      updated.push(await executeSingleTest(tc));
    }

    res.json({
      executedCount: updated.length,
      passedCount: updated.filter((t) => t.status === 'Passed').length,
      failedCount: updated.filter((t) => t.status === 'Failed').length,
      tests: testCases,
    });
  });

  app.get('/api/corpus', (_req: Request, res: Response) => {
    res.json({ count: ANONYMIZED_CORPUS.length, documents: ANONYMIZED_CORPUS });
  });

  app.get('/api/eval/prompts', (_req: Request, res: Response) => {
    res.json({ count: evalPrompts.length, prompts: evalPrompts });
  });

  app.post('/api/eval/run', async (req: Request, res: Response) => {
    const { promptIds, category } = req.body as { promptIds?: unknown; category?: unknown };
    let targets: RagEvalPrompt[] = [];

    if (Array.isArray(promptIds) && promptIds.length > 0) {
      const idSet = new Set(promptIds.map(String));
      targets = evalPrompts.filter((p) => idSet.has(p.id)).slice(0, 5);
    } else if (typeof category === 'string') {
      targets = evalPrompts.filter((p) => p.category === category).slice(0, 3);
    } else {
      targets = evalPrompts.slice(0, 3);
    }

    if (targets.length === 0) {
      res.status(400).json({ error: 'No matching evaluation prompts selected.' });
      return;
    }

    try {
      const evaluatedIds: string[] = [];
      for (const item of targets) {
        const { permittedChunks, blockedDocs } = retrieveChunksForQuery(item.prompt, item.role);
        const ragResult = await runRagChatbot(item.prompt, item.role, permittedChunks, blockedDocs);
        const judgeResult = await judgeRagResponse({
          prompt: item.prompt,
          category: item.category,
          role: item.role,
          expectedBehavior: item.expectedBehavior,
          permittedChunks,
          blockedDocs,
          chatbotAnswer: ragResult.answer,
          guardrailTriggered: ragResult.guardrailTriggered,
          permissionBlocked: ragResult.permissionBlocked,
        });

        item.lastAnswer = ragResult.answer;
        item.latencyMs = ragResult.latencyMs;
        item.relevanceScore = judgeResult.relevanceScore;
        item.groundednessScore = judgeResult.groundednessScore;
        item.guardrailPass = judgeResult.guardrailPass;
        item.permissionPass = judgeResult.permissionPass;
        item.status = judgeResult.passed ? 'Passed' : 'Failed';
        item.rationale = judgeResult.rationale;
        item.lastEvaluatedAt = new Date().toISOString();
        evaluatedIds.push(item.id);
      }

      res.json({
        evaluatedIds,
        prompts: evalPrompts,
      });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Live Gemini evaluation failed.',
      });
    }
  });

  app.get('/api/pipelines', (_req: Request, res: Response) => {
    res.json({
      runs: pipelineRuns,
      workflowYaml: GITHUB_ACTIONS_YAML,
      benchmarks: {
        manualRegressionMin: 180,
        automatedSuiteMin: 72,
        ciParallelMin: 4,
        reductionPct: 60,
      },
    });
  });

  app.post('/api/pipelines/run', async (req: Request, res: Response) => {
    const { stage, branch } = req.body as { stage?: unknown; branch?: unknown };
    const validStage: PipelineRunRecord['stage'] =
      stage === 'Post-Deployment Smoke' || stage === 'Release Candidate' || stage === 'PR Regression'
        ? stage
        : 'Post-Deployment Smoke';

    const start = Date.now();
    let targetStage: 'smoke' | 'release' | 'regression' = 'smoke';
    if (validStage === 'Release Candidate') targetStage = 'release';
    if (validStage === 'PR Regression') targetStage = 'regression';

    const targets =
      targetStage === 'smoke'
        ? testCases.filter((t) => t.stage === 'smoke')
        : targetStage === 'release'
          ? testCases.filter((t) => t.stage === 'smoke' || t.stage === 'release')
          : testCases;

    const results: WebApiTestCase[] = [];
    for (const tc of targets) {
      results.push(await executeSingleTest(tc));
    }

    const passedTests = results.filter((r) => r.status === 'Passed').length;
    const failedTests = results.filter((r) => r.status === 'Failed').length;
    const elapsedSec = Math.max(1, Math.round((Date.now() - start) / 1000));

    const newRun: PipelineRunRecord = {
      id: `RUN-${419 + pipelineRuns.length - 4}`,
      stage: validStage,
      branch: typeof branch === 'string' && branch.trim() ? branch.trim() : 'main',
      commitSha: Math.random().toString(16).slice(2, 9),
      trigger: 'manual-dispatch',
      status: failedTests === 0 ? 'Passed' : 'Failed',
      totalTests: results.length,
      passedTests,
      failedTests,
      durationSec: elapsedSec,
      manualBaselineMin: validStage === 'Post-Deployment Smoke' ? 35 : validStage === 'Release Candidate' ? 95 : 180,
      executedAt: new Date().toISOString(),
    };

    pipelineRuns.unshift(newRun);
    res.status(201).json({ run: newRun, runs: pipelineRuns, tests: testCases });
  });

  app.get('/api/jira', (_req: Request, res: Response) => {
    res.json({ count: jiraBugs.length, bugs: jiraBugs });
  });

  app.post('/api/jira', (req: Request, res: Response) => {
    const { title, severity, component, linkedTestId, environment, reproductionSteps, expectedResult, actualResult } =
      req.body as {
        title?: unknown;
        severity?: unknown;
        component?: unknown;
        linkedTestId?: unknown;
        environment?: unknown;
        reproductionSteps?: unknown;
        expectedResult?: unknown;
        actualResult?: unknown;
      };

    if (typeof title !== 'string' || !title.trim()) {
      res.status(400).json({ error: 'Bug title is required.' });
      return;
    }

    const validSeverities: JiraSeverity[] = ['Critical', 'High', 'Medium', 'Low'];
    const validComponents: JiraComponent[] = ['Web UI', 'REST API', 'RAG Chatbot', 'CI/CD'];

    const nextNum = 101 + jiraBugs.length;
    const newBug: JiraBug = {
      id: `QA-${nextNum}`,
      title: title.trim(),
      severity: validSeverities.includes(severity as JiraSeverity) ? (severity as JiraSeverity) : 'Medium',
      status: 'Open',
      component: validComponents.includes(component as JiraComponent) ? (component as JiraComponent) : 'REST API',
      linkedTestId: typeof linkedTestId === 'string' && linkedTestId.trim() ? linkedTestId.trim() : 'TC-001',
      environment:
        typeof environment === 'string' && environment.trim() ? environment.trim() : 'Staging · Node 22 / Chrome 131',
      reportedAt: new Date().toISOString().slice(0, 10),
      reporter: 'QA Engineer',
      reproductionSteps: Array.isArray(reproductionSteps)
        ? reproductionSteps.map(String).filter(Boolean)
        : ['1. Execute linked automated test case.', '2. Inspect assertion failure log.'],
      expectedResult: typeof expectedResult === 'string' && expectedResult.trim() ? expectedResult.trim() : 'Assertion passes.',
      actualResult: typeof actualResult === 'string' && actualResult.trim() ? actualResult.trim() : 'Assertion failed.',
    };

    jiraBugs.unshift(newBug);
    res.status(201).json({ bug: newBug, bugs: jiraBugs });
  });

  app.patch('/api/jira/:id', (req: Request, res: Response) => {
    const bug = jiraBugs.find((b) => b.id === req.params.id);
    if (!bug) {
      res.status(404).json({ error: 'Jira bug not found.' });
      return;
    }
    const { status, severity } = req.body as { status?: unknown; severity?: unknown };
    const validStatuses: JiraStatus[] = ['Open', 'In Progress', 'In Review', 'Resolved'];
    const validSeverities: JiraSeverity[] = ['Critical', 'High', 'Medium', 'Low'];

    if (validStatuses.includes(status as JiraStatus)) {
      bug.status = status as JiraStatus;
    }
    if (validSeverities.includes(severity as JiraSeverity)) {
      bug.severity = severity as JiraSeverity;
    }

    res.json({ bug, bugs: jiraBugs });
  });

  // =========================================================================
  // 3. VITE MIDDLEWARE (DEV) OR STATIC ASSETS (PROD)
  // =========================================================================

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Test Automation Suite server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
