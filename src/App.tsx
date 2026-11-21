import { useCallback, useEffect, useState } from 'react';
import { GenAiEvalView } from './components/GenAiEvalView';
import { JiraBugsView } from './components/JiraBugsView';
import { OverviewView } from './components/OverviewView';
import { PipelinesView } from './components/PipelinesView';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { WebApiTestsView } from './components/WebApiTestsView';
import type {
  BugDraft,
  CorpusDocument,
  EvalCategory,
  JiraBug,
  JiraStatus,
  NavSection,
  PipelineRunRecord,
  RagEvalPrompt,
  SuiteSummary,
  TestFramework,
  WebApiTestCase,
} from './types';

export default function App() {
  const [activeSection, setActiveSection] = useState<NavSection>('overview');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SuiteSummary | null>(null);
  const [tests, setTests] = useState<WebApiTestCase[]>([]);
  const [prompts, setPrompts] = useState<RagEvalPrompt[]>([]);
  const [corpus, setCorpus] = useState<CorpusDocument[]>([]);
  const [bugs, setBugs] = useState<JiraBug[]>([]);
  const [runs, setRuns] = useState<PipelineRunRecord[]>([]);
  const [workflowYaml, setWorkflowYaml] = useState('');
  const [benchmarks, setBenchmarks] = useState({
    manualRegressionMin: 180,
    automatedSuiteMin: 72,
    ciParallelMin: 4,
    reductionPct: 60,
  });

  const [runningTopAction, setRunningTopAction] = useState<'smoke' | 'regression' | null>(null);
  const [runningTestIds, setRunningTestIds] = useState<Set<string>>(new Set());
  const [evaluatingIds, setEvaluatingIds] = useState<Set<string>>(new Set());
  const [evalError, setEvalError] = useState<string | null>(null);
  const [runningStage, setRunningStage] = useState<string | null>(null);
  const [bugDraft, setBugDraft] = useState<BugDraft | null>(null);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  const refreshSummary = useCallback(async () => {
    const res = await fetch('/api/suite/summary');
    if (res.ok) {
      const data = (await res.json()) as SuiteSummary;
      setSummary(data);
    }
  }, []);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, testsRes, evalRes, corpusRes, pipeRes, jiraRes] = await Promise.all([
        fetch('/api/suite/summary'),
        fetch('/api/tests'),
        fetch('/api/eval/prompts'),
        fetch('/api/corpus'),
        fetch('/api/pipelines'),
        fetch('/api/jira'),
      ]);

      if (sumRes.ok) setSummary((await sumRes.json()) as SuiteSummary);
      if (testsRes.ok) {
        const d = (await testsRes.json()) as { tests: WebApiTestCase[] };
        setTests(d.tests);
      }
      if (evalRes.ok) {
        const d = (await evalRes.json()) as { prompts: RagEvalPrompt[] };
        setPrompts(d.prompts);
      }
      if (corpusRes.ok) {
        const d = (await corpusRes.json()) as { documents: CorpusDocument[] };
        setCorpus(d.documents);
      }
      if (pipeRes.ok) {
        const d = (await pipeRes.json()) as {
          runs: PipelineRunRecord[];
          workflowYaml: string;
          benchmarks: typeof benchmarks;
        };
        setRuns(d.runs);
        setWorkflowYaml(d.workflowYaml);
        setBenchmarks(d.benchmarks);
      }
      if (jiraRes.ok) {
        const d = (await jiraRes.json()) as { bugs: JiraBug[] };
        setBugs(d.bugs);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const showToast = (msg: string) => {
    setBannerMessage(msg);
    setTimeout(() => {
      setBannerMessage((curr) => (curr === msg ? null : curr));
    }, 5000);
  };

  const handleRunTests = async (params: {
    testIds?: string[];
    stage?: 'smoke' | 'regression' | 'release';
    framework?: TestFramework;
  }) => {
    const targetIds = params.testIds ?? tests.map((t) => t.id);
    setRunningTestIds(new Set(targetIds));
    try {
      const res = await fetch('/api/tests/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          executedCount: number;
          passedCount: number;
          failedCount: number;
          tests: WebApiTestCase[];
        };
        setTests(data.tests);
        await refreshSummary();
        showToast(
          `Executed ${data.executedCount} automated tests: ${data.passedCount} passed, ${data.failedCount} failed.`
        );
      }
    } finally {
      setRunningTestIds(new Set());
    }
  };

  const handleTopAction = async (mode: 'smoke' | 'regression') => {
    setRunningTopAction(mode);
    try {
      const stageName = mode === 'smoke' ? 'Post-Deployment Smoke' : 'PR Regression';
      const res = await fetch('/api/pipelines/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: stageName, branch: 'main' }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          run: PipelineRunRecord;
          runs: PipelineRunRecord[];
          tests: WebApiTestCase[];
        };
        setRuns(data.runs);
        setTests(data.tests);
        await refreshSummary();
        showToast(
          `${data.run.stage} (${data.run.id}) completed in ${data.run.durationSec}s: ${data.run.passedTests}/${data.run.totalTests} passed.`
        );
      }
    } finally {
      setRunningTopAction(null);
    }
  };

  const handleRunEval = async (params: { promptIds?: string[]; category?: EvalCategory }) => {
    const ids = params.promptIds ?? prompts.slice(0, 3).map((p) => p.id);
    setEvaluatingIds(new Set(ids));
    setEvalError(null);
    try {
      const res = await fetch('/api/eval/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = (await res.json()) as {
        evaluatedIds?: string[];
        prompts?: RagEvalPrompt[];
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? `Evaluation request failed (${res.status})`);
      }
      if (data.prompts) {
        setPrompts(data.prompts);
      }
      await refreshSummary();
      showToast(`Live Gemini evaluation completed for ${data.evaluatedIds?.length ?? ids.length} prompt(s).`);
    } catch (err) {
      setEvalError(err instanceof Error ? err.message : 'Live evaluation failed.');
    } finally {
      setEvaluatingIds(new Set());
    }
  };

  const handleTriggerPipeline = async (stage: PipelineRunRecord['stage'], branch: string) => {
    setRunningStage(stage);
    try {
      const res = await fetch('/api/pipelines/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage, branch }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          run: PipelineRunRecord;
          runs: PipelineRunRecord[];
          tests: WebApiTestCase[];
        };
        setRuns(data.runs);
        setTests(data.tests);
        await refreshSummary();
        showToast(
          `Pipeline ${data.run.id} (${data.run.stage}) finished: ${data.run.passedTests}/${data.run.totalTests} passed.`
        );
      }
    } finally {
      setRunningStage(null);
    }
  };

  const handleCreateBug = async (draft: BugDraft) => {
    const res = await fetch('/api/jira', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    if (res.ok) {
      const data = (await res.json()) as { bug: JiraBug; bugs: JiraBug[] };
      setBugs(data.bugs);
      await refreshSummary();
      showToast(`Logged Jira defect ${data.bug.id}: ${data.bug.title}`);
    }
  };

  const handleUpdateBugStatus = async (bugId: string, status: JiraStatus) => {
    const res = await fetch(`/api/jira/${bugId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const data = (await res.json()) as { bugs: JiraBug[] };
      setBugs(data.bugs);
      await refreshSummary();
    }
  };

  const openJiraFormWithDraft = (draft: BugDraft) => {
    setBugDraft(draft);
    setActiveSection('jira');
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <Sidebar activeSection={activeSection} onSelect={setActiveSection} summary={summary} />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar
          activeSection={activeSection}
          runningAction={runningTopAction}
          onRunSmoke={() => handleTopAction('smoke')}
          onRunRegression={() => handleTopAction('regression')}
        />

        <main className="flex-1 p-6 max-w-[1360px] w-full mx-auto space-y-6">
          {bannerMessage && (
            <div
              role="status"
              className="px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-md text-xs font-medium text-blue-900 flex items-center justify-between"
            >
              <span>{bannerMessage}</span>
              <button
                type="button"
                onClick={() => setBannerMessage(null)}
                className="text-blue-700 hover:text-blue-900 text-xs font-medium"
              >
                Dismiss
              </button>
            </div>
          )}

          {activeSection === 'overview' && (
            <OverviewView summary={summary} loading={loading} onNavigate={setActiveSection} />
          )}

          {activeSection === 'tests' && (
            <WebApiTestsView
              tests={tests}
              runningTestIds={runningTestIds}
              onRunTests={handleRunTests}
              onCreateBugFromTest={openJiraFormWithDraft}
            />
          )}

          {activeSection === 'eval' && (
            <GenAiEvalView
              prompts={prompts}
              corpus={corpus}
              evaluatingIds={evaluatingIds}
              evalError={evalError}
              onRunEval={handleRunEval}
              onCreateBugFromEval={openJiraFormWithDraft}
            />
          )}

          {activeSection === 'pipelines' && (
            <PipelinesView
              runs={runs}
              workflowYaml={workflowYaml}
              benchmarks={benchmarks}
              runningStage={runningStage}
              onTriggerPipeline={handleTriggerPipeline}
            />
          )}

          {activeSection === 'jira' && (
            <JiraBugsView
              bugs={bugs}
              initialDraft={bugDraft}
              onClearDraft={() => setBugDraft(null)}
              onCreateBug={handleCreateBug}
              onUpdateBugStatus={handleUpdateBugStatus}
            />
          )}
        </main>
      </div>
    </div>
  );
}
