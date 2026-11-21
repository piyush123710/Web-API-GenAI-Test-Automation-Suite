import { ArrowRight } from 'lucide-react';
import type { NavSection, SuiteSummary } from '../types';
import { SeverityLabel, TestStatusLabel } from './StatusText';

interface OverviewViewProps {
  summary: SuiteSummary | null;
  loading: boolean;
  onNavigate: (section: NavSection) => void;
}

export function OverviewView({ summary, loading, onNavigate }: OverviewViewProps) {
  if (loading || !summary) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((idx) => (
            <div key={idx} className="h-28 bg-white border border-slate-200 rounded-md animate-pulse p-5" />
          ))}
        </div>
        <div className="h-64 bg-white border border-slate-200 rounded-md animate-pulse" />
      </div>
    );
  }

  const webPassRate = Math.round((summary.webApi.passed / summary.webApi.total) * 100);
  const evalPassRate = Math.round((summary.eval.passed / summary.eval.total) * 100);

  return (
    <div className="space-y-8">
      {/* Scope header */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="text-xs font-medium text-slate-500">
            November 2026 · Enterprise Document Portal &amp; AI Chatbot
          </div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 text-balance">
            Web, API and GenAI Test Automation Suite
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Unified quality engineering harness validating web workflows, REST API contracts, and a document-based RAG
            chatbot across anonymized enterprise data, CI/CD release gates, and Jira defect tracking.
          </p>
        </div>

        <div className="text-xs text-slate-500 font-mono shrink-0">
          Playwright · Selenium · Postman · Gemini Eval · GitHub Actions · Jira
        </div>
      </section>

      {/* 4-Column Quantitative Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => onNavigate('tests')}
          className="text-left bg-white border border-slate-200 rounded-md p-5 hover:border-blue-300 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          <div className="text-xs font-medium text-slate-500">Web &amp; REST API Tests</div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              {summary.webApi.passed}/{summary.webApi.total}
            </span>
            <span className="font-mono text-xs text-emerald-700 tabular-nums">{webPassRate}% pass</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Playwright JS · Selenium C# · Postman
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('eval')}
          className="text-left bg-white border border-slate-200 rounded-md p-5 hover:border-blue-300 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          <div className="text-xs font-medium text-slate-500">GenAI RAG Prompts</div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              {summary.eval.passed}/{summary.eval.total}
            </span>
            <span className="font-mono text-xs text-emerald-700 tabular-nums">{evalPassRate}% pass</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Relevance · Groundedness · Guardrails · RBAC
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('pipelines')}
          className="text-left bg-white border border-slate-200 rounded-md p-5 hover:border-blue-300 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          <div className="text-xs font-medium text-slate-500">Manual Regression Saved</div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-semibold text-blue-700 tabular-nums">
              -{summary.pipelines.manualRegressionSavedPct}%
            </span>
            <span className="font-mono text-xs text-slate-600 tabular-nums">
              {summary.pipelines.manualBaselineMin}m → {summary.pipelines.automatedRegressionMin}m
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            CI parallel execution in {summary.pipelines.ciParallelMin}m
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('jira')}
          className="text-left bg-white border border-slate-200 rounded-md p-5 hover:border-blue-300 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          <div className="text-xs font-medium text-slate-500">Jira Defects Logged</div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              {summary.jira.total}
            </span>
            <span className="font-mono text-xs text-red-700 tabular-nums">
              {summary.jira.open} open · {summary.jira.criticalOpen} critical
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            With repro steps &amp; expected vs actual
          </div>
        </button>
      </section>

      {/* Coverage Matrix: Web/API Frameworks + RAG Evaluation Dimensions */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-md p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900">
                Web &amp; API Framework Coverage
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                44 live automated assertions running against local SUT routes
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('tests')}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800 whitespace-nowrap"
            >
              <span>Inspect Tests</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {[
              { name: 'Playwright', lang: 'JavaScript', data: summary.byFramework.Playwright, scope: 'E2E Web UI & Auth Flows' },
              { name: 'Selenium WebDriver', lang: 'C# · NUnit', data: summary.byFramework.Selenium, scope: 'Cross-Browser & RBAC Matrix' },
              { name: 'Postman / Newman', lang: 'JavaScript', data: summary.byFramework.Postman, scope: 'REST Contracts, TTLs & Payloads' },
            ].map((fw) => {
              const pct = Math.round((fw.data.passed / fw.data.total) * 100);
              return (
                <div key={fw.name} className="py-3.5 first:pt-0 last:pb-0 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium text-slate-900">{fw.name}</span>
                      <span className="text-slate-400 mx-2">·</span>
                      <span className="text-xs text-slate-500 font-mono">{fw.lang}</span>
                    </div>
                    <div className="font-mono text-xs tabular-nums text-slate-700">
                      {fw.data.passed}/{fw.data.total} passed ({pct}%)
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-sm overflow-hidden">
                    <div
                      className="h-full bg-blue-700 transition-all duration-200"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-500">{fw.scope}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900">
                GenAI RAG Evaluation Dimensions
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                50 anonymized prompts scored across relevance, grounding, safety, and RBAC
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('eval')}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800 whitespace-nowrap"
            >
              <span>Open Eval Suite</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-medium text-slate-500">
                  <th className="py-2 pr-3">Dimension</th>
                  <th className="py-2 px-3 text-right">Pass Rate</th>
                  <th className="py-2 px-3 text-right">Avg Relevance</th>
                  <th className="py-2 pl-3 text-right">Avg Grounding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {summary.byEvalCategory.map((dim) => (
                  <tr key={dim.category} className="h-10">
                    <td className="py-2 pr-3 font-medium text-slate-900">{dim.category}</td>
                    <td className="py-2 px-3 text-right font-mono text-xs tabular-nums text-slate-700">
                      {dim.passed}/{dim.total}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-xs tabular-nums text-slate-700">
                      {dim.avgRelevance.toFixed(1)}/5.0
                    </td>
                    <td className="py-2 pl-3 text-right font-mono text-xs tabular-nums text-slate-700">
                      {dim.avgGroundedness.toFixed(1)}/5.0
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Bottom Row: Recent CI/CD Runs & Active Jira Defects */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-md p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-slate-900">
              Recent CI/CD Pipeline Runs
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('pipelines')}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800 whitespace-nowrap"
            >
              <span>View Pipelines</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-medium text-slate-500">
                  <th className="py-2 pr-3">Run</th>
                  <th className="py-2 px-3">Stage</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 pl-3 text-right">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {summary.recentRuns.map((run) => (
                  <tr key={run.id} className="h-10">
                    <td className="py-2 pr-3 font-mono text-xs text-slate-700 tabular-nums">{run.id}</td>
                    <td className="py-2 px-3 text-slate-900 font-medium">{run.stage}</td>
                    <td className="py-2 px-3">
                      <TestStatusLabel status={run.status} />
                    </td>
                    <td className="py-2 pl-3 text-right font-mono text-xs tabular-nums text-slate-600">
                      {run.durationSec}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-slate-900">
              Active Jira Defects Requiring Triage
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('jira')}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800 whitespace-nowrap"
            >
              <span>Open Jira Log</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {summary.openCriticalBugs.map((bug) => (
              <div key={bug.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono font-medium text-slate-700">{bug.id}</span>
                    <span aria-hidden="true">·</span>
                    <span>{bug.component}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">{bug.linkedTestId}</span>
                  </div>
                  <div className="text-sm font-medium text-slate-900 truncate mt-0.5">{bug.title}</div>
                </div>
                <div className="shrink-0 pt-0.5">
                  <SeverityLabel severity={bug.severity} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
