import { Bug, Check, Copy, Play, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { BugDraft, TestFramework, TestLanguage, TestStatus, WebApiTestCase } from '../types';
import { TestStatusLabel } from './StatusText';

interface WebApiTestsViewProps {
  tests: WebApiTestCase[];
  runningTestIds: Set<string>;
  onRunTests: (params: { testIds?: string[]; framework?: TestFramework }) => Promise<void>;
  onCreateBugFromTest: (draft: BugDraft) => void;
}

export function WebApiTestsView({
  tests,
  runningTestIds,
  onRunTests,
  onCreateBugFromTest,
}: WebApiTestsViewProps) {
  const [frameworkFilter, setFrameworkFilter] = useState<'All' | TestFramework>('All');
  const [languageFilter, setLanguageFilter] = useState<'All' | TestLanguage>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | TestStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string>(tests[0]?.id ?? 'TC-001');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredTests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tests.filter((t) => {
      if (frameworkFilter !== 'All' && t.framework !== frameworkFilter) return false;
      if (languageFilter !== 'All' && t.language !== languageFilter) return false;
      if (statusFilter !== 'All' && t.status !== statusFilter) return false;
      if (q) {
        const hay = `${t.id} ${t.name} ${t.targetPath} ${t.framework} ${t.language}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [tests, frameworkFilter, languageFilter, statusFilter, searchQuery]);

  const selectedTest = useMemo(
    () => tests.find((t) => t.id === selectedId) ?? filteredTests[0] ?? null,
    [tests, selectedId, filteredTests]
  );

  const passedCount = filteredTests.filter((t) => t.status === 'Passed').length;
  const failedCount = filteredTests.filter((t) => t.status === 'Failed').length;

  const handleCopyCode = async (tc: WebApiTestCase) => {
    try {
      await navigator.clipboard.writeText(tc.codeSnippet);
      setCopiedId(tc.id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // Clipboard fallback ignored cleanly
    }
  };

  return (
    <div className="space-y-5">
      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-md p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Framework Segmented Buttons */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md">
            {(['All', 'Playwright', 'Selenium', 'Postman'] as const).map((fw) => (
              <button
                key={fw}
                type="button"
                onClick={() => setFrameworkFilter(fw)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                  frameworkFilter === fw
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {fw}
              </button>
            ))}
          </div>

          {/* Language Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md">
            {(['All', 'JavaScript', 'C#'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguageFilter(lang)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                  languageFilter === lang
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md">
            {(['All', 'Passed', 'Failed'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search test ID or endpoint..."
              aria-label="Search Web and API tests"
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md w-56 focus:outline-none focus:border-blue-600"
            />
          </div>

          <button
            type="button"
            disabled={filteredTests.length === 0 || runningTestIds.size > 0}
            onClick={() => onRunTests({ testIds: filteredTests.map((t) => t.id) })}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
          >
            <Play className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Run Filtered ({filteredTests.length})</span>
          </button>
        </div>
      </div>

      {/* Summary line */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <div>
          Showing <span className="font-mono font-medium text-slate-800 tabular-nums">{filteredTests.length}</span> of{' '}
          <span className="font-mono tabular-nums">{tests.length}</span> automated tests
          <span className="mx-2">·</span>
          <span className="font-mono text-emerald-700 tabular-nums">{passedCount} passed</span>
          <span className="mx-2">·</span>
          <span className="font-mono text-red-700 tabular-nums">{failedCount} failed</span>
        </div>
        <div>Click any row to inspect live HTTP assertions and source script</div>
      </div>

      {/* Main Split: Test Table + Inspector */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-7 bg-white border border-slate-200 rounded-md overflow-hidden">
          {filteredTests.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <div className="text-sm font-medium text-slate-900">No tests match current filters</div>
              <p className="text-xs text-slate-500">Adjust the framework, language, or search query to view tests.</p>
              <button
                type="button"
                onClick={() => {
                  setFrameworkFilter('All');
                  setLanguageFilter('All');
                  setStatusFilter('All');
                  setSearchQuery('');
                }}
                className="px-3 py-1.5 text-xs font-medium text-blue-700 border border-blue-200 rounded-md hover:bg-blue-50"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[640px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500 z-10">
                  <tr>
                    <th className="py-2.5 px-4">ID</th>
                    <th className="py-2.5 px-3">Test Case</th>
                    <th className="py-2.5 px-3">Stack</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-4 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredTests.map((tc) => {
                    const isSelected = selectedTest?.id === tc.id;
                    const isRunning = runningTestIds.has(tc.id);
                    return (
                      <tr
                        key={tc.id}
                        onClick={() => setSelectedId(tc.id)}
                        className={`h-11 cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-2 px-4 font-mono font-medium text-slate-700 tabular-nums whitespace-nowrap">
                          {tc.id}
                        </td>
                        <td className="py-2 px-3">
                          <div className="font-medium text-slate-900 line-clamp-1">{tc.name}</div>
                          <div className="font-mono text-[11px] text-slate-400 truncate max-w-xs">
                            {tc.targetMethod} {tc.targetPath}
                          </div>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap text-slate-600">
                          {tc.framework} · {tc.language}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          {isRunning ? (
                            <span className="font-mono text-xs text-blue-700">Running...</span>
                          ) : (
                            <TestStatusLabel status={tc.status} />
                          )}
                        </td>
                        <td className="py-2 px-4 text-right font-mono text-slate-600 tabular-nums whitespace-nowrap">
                          {tc.durationMs}ms
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Detail Inspector */}
        <div className="xl:col-span-5 bg-white border border-slate-200 rounded-md p-5 space-y-5">
          {selectedTest ? (
            <>
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono font-semibold text-slate-800">{selectedTest.id}</span>
                    <span aria-hidden="true">·</span>
                    <span>{selectedTest.framework} ({selectedTest.language})</span>
                    <span aria-hidden="true">·</span>
                    <span className="capitalize">{selectedTest.stage}</span>
                  </div>
                  <h3 className="font-display text-base font-semibold text-slate-900">
                    {selectedTest.name}
                  </h3>
                </div>

                <button
                  type="button"
                  disabled={runningTestIds.has(selectedTest.id)}
                  onClick={() => onRunTests({ testIds: [selectedTest.id] })}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  <Play className="w-3 h-3" aria-hidden="true" />
                  <span>{runningTestIds.has(selectedTest.id) ? 'Running...' : 'Run Test'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                  <div className="text-slate-500">Target Endpoint</div>
                  <div className="font-mono text-slate-900 mt-1 break-all">
                    {selectedTest.targetMethod} {selectedTest.targetPath}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                  <div className="text-slate-500">Status &amp; Latency</div>
                  <div className="mt-1 flex items-center justify-between">
                    <TestStatusLabel status={selectedTest.status} />
                    <span className="font-mono text-slate-700 tabular-nums">
                      HTTP {selectedTest.expectedStatus} · {selectedTest.durationMs}ms
                    </span>
                  </div>
                </div>
              </div>

              {selectedTest.requestBody && (
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-slate-700">Request Payload</div>
                  <pre className="p-3 bg-slate-900 text-slate-100 rounded text-xs font-mono overflow-x-auto">
                    {JSON.stringify(selectedTest.requestBody, null, 2)}
                  </pre>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700">Live Assertion Output</span>
                  {selectedTest.linkedJiraId && (
                    <span className="font-mono text-xs text-red-700">
                      Linked Jira: {selectedTest.linkedJiraId}
                    </span>
                  )}
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1.5 font-mono text-xs">
                  {selectedTest.lastAssertionLog.map((line, idx) => (
                    <div
                      key={idx}
                      className={line.startsWith('FAIL') ? 'text-red-700 font-medium' : 'text-emerald-800'}
                    >
                      {line}
                    </div>
                  ))}
                </div>
              </div>

              {selectedTest.status === 'Failed' && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      onCreateBugFromTest({
                        title: `${selectedTest.id} failure: ${selectedTest.name}`,
                        severity: 'High',
                        component: selectedTest.suite === 'REST API' ? 'REST API' : 'Web UI',
                        linkedTestId: selectedTest.id,
                        expectedResult: `HTTP ${selectedTest.expectedStatus} and assertions: ${selectedTest.assertions.join('; ')}`,
                        actualResult: selectedTest.lastAssertionLog.join(' '),
                        reproductionSteps: [
                          `1. Execute ${selectedTest.framework} test ${selectedTest.id}.`,
                          `2. Send ${selectedTest.targetMethod} ${selectedTest.targetPath}.`,
                          '3. Observe assertion failure log.',
                        ],
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100"
                  >
                    <Bug className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>File New Jira Bug from Failure</span>
                  </button>
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700">
                    {selectedTest.framework} Test Script ({selectedTest.language})
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(selectedTest)}
                    className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900"
                  >
                    {copiedId === selectedTest.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded text-xs font-mono overflow-x-auto leading-relaxed">
                  {selectedTest.codeSnippet}
                </pre>
              </div>
            </>
          ) : (
            <div className="text-xs text-slate-500 py-8 text-center">Select a test case to inspect details.</div>
          )}
        </div>
      </div>
    </div>
  );
}
