import { Check, Copy, Play } from 'lucide-react';
import { useState } from 'react';
import type { PipelineRunRecord } from '../types';
import { TestStatusLabel } from './StatusText';

interface PipelinesViewProps {
  runs: PipelineRunRecord[];
  workflowYaml: string;
  benchmarks: {
    manualRegressionMin: number;
    automatedSuiteMin: number;
    ciParallelMin: number;
    reductionPct: number;
  };
  runningStage: string | null;
  onTriggerPipeline: (stage: PipelineRunRecord['stage'], branch: string) => Promise<void>;
}

export function PipelinesView({
  runs,
  workflowYaml,
  benchmarks,
  runningStage,
  onTriggerPipeline,
}: PipelinesViewProps) {
  const [branch, setBranch] = useState('main');
  const [copiedYaml, setCopiedYaml] = useState(false);

  const handleCopyYaml = async () => {
    try {
      await navigator.clipboard.writeText(workflowYaml);
      setCopiedYaml(true);
      setTimeout(() => setCopiedYaml(false), 1800);
    } catch {
      // Ignore clipboard failure
    }
  };

  const stages: Array<{
    stage: PipelineRunRecord['stage'];
    scope: string;
    trigger: string;
    testCount: string;
  }> = [
    {
      stage: 'Post-Deployment Smoke',
      scope: 'Critical health, auth token TTL, RBAC public/restricted checks, and chatbot input guard.',
      trigger: 'On deployment_status == success',
      testCount: '11 smoke tests',
    },
    {
      stage: 'Release Candidate',
      scope: 'Smoke checks + release gate RBAC matrix, audit triggers, and corpus anonymization checks.',
      trigger: 'On git tag v*-rc*',
      testCount: '19 release tests',
    },
    {
      stage: 'PR Regression',
      scope: 'Full 44 Web & REST API tests across Playwright JS, Selenium C#, and Postman suites.',
      trigger: 'On pull_request to main',
      testCount: '44 full tests',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Regression Time Reduction Comparison */}
      <section className="bg-white border border-slate-200 rounded-md p-6 space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              CI/CD Regression Efficiency Benchmark
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated regression, release, and post-deployment smoke gates reduced manual QA regression time by 60%.
            </p>
          </div>
          <div className="font-mono text-sm font-semibold text-blue-700 tabular-nums">
            -{benchmarks.reductionPct}% Manual Regression Time
          </div>
        </div>

        <div className="space-y-3 pt-1">
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-700">Manual Regression Cycle (Baseline)</span>
              <span className="font-mono text-slate-700 tabular-nums">{benchmarks.manualRegressionMin} min</span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-sm overflow-hidden">
              <div className="h-full bg-slate-400" style={{ width: '100%' }} />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-700">Hybrid Manual + Automated Verification (60% Reduction)</span>
              <span className="font-mono text-blue-700 tabular-nums">{benchmarks.automatedSuiteMin} min</span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-sm overflow-hidden">
              <div className="h-full bg-blue-700" style={{ width: '40%' }} />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-700">Unattended CI Parallel Execution (Playwright + C# + Postman)</span>
              <span className="font-mono text-emerald-700 tabular-nums">{benchmarks.ciParallelMin} min</span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-sm overflow-hidden">
              <div className="h-full bg-emerald-600" style={{ width: '4%' }} />
            </div>
          </div>
        </div>
      </section>

      {/* Pipeline Stage Dispatchers */}
      <section className="bg-white border border-slate-200 rounded-md p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-base font-semibold text-slate-900">
              Dispatch Live Pipeline Stage
            </h3>
            <p className="text-xs text-slate-500">
              Trigger a real GitHub Actions stage against the running System Under Test.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <label htmlFor="branch-input" className="text-slate-600 font-medium">
              Target Branch:
            </label>
            <input
              id="branch-input"
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="px-2.5 py-1.5 font-mono text-xs border border-slate-300 rounded-md w-44 focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stages.map((item) => {
            const isRunning = runningStage === item.stage;
            return (
              <div key={item.stage} className="border border-slate-200 rounded-md p-4 flex flex-col justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{item.trigger}</span>
                    <span className="font-mono text-slate-700">{item.testCount}</span>
                  </div>
                  <div className="font-display text-sm font-semibold text-slate-900">{item.stage}</div>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.scope}</p>
                </div>

                <button
                  type="button"
                  disabled={runningStage !== null}
                  onClick={() => onTriggerPipeline(item.stage, branch)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{isRunning ? 'Executing Stage...' : `Run ${item.stage}`}</span>
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Run History & Workflow YAML */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-7 bg-white border border-slate-200 rounded-md p-5 space-y-4">
          <h3 className="font-display text-base font-semibold text-slate-900">Pipeline Execution History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-medium text-slate-500">
                  <th className="py-2 pr-3">Run ID</th>
                  <th className="py-2 px-3">Stage &amp; Branch</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3 text-right">Pass / Total</th>
                  <th className="py-2 pl-3 text-right">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {runs.map((run) => (
                  <tr key={run.id} className="h-11">
                    <td className="py-2 pr-3 font-mono font-medium text-slate-800 tabular-nums whitespace-nowrap">
                      {run.id}
                    </td>
                    <td className="py-2 px-3">
                      <div className="font-medium text-slate-900">{run.stage}</div>
                      <div className="font-mono text-[11px] text-slate-500">
                        {run.branch} · {run.commitSha} · {run.trigger}
                      </div>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <TestStatusLabel status={run.status} />
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-700 whitespace-nowrap">
                      {run.passedTests}/{run.totalTests}
                    </td>
                    <td className="py-2 pl-3 text-right font-mono tabular-nums text-slate-600 whitespace-nowrap">
                      {run.durationSec}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="xl:col-span-5 bg-white border border-slate-200 rounded-md p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-medium text-slate-800">
              .github/workflows/qa-automation.yml
            </span>
            <button
              type="button"
              onClick={handleCopyYaml}
              className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900"
            >
              {copiedYaml ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Copy YAML</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-3.5 bg-slate-900 text-slate-100 rounded text-[11px] font-mono overflow-x-auto leading-relaxed max-h-[460px]">
            {workflowYaml}
          </pre>
        </div>
      </div>
    </div>
  );
}
