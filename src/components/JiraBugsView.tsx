import { Plus, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { BugDraft, JiraBug, JiraComponent, JiraSeverity, JiraStatus } from '../types';
import { JiraStatusLabel, SeverityLabel } from './StatusText';

interface JiraBugsViewProps {
  bugs: JiraBug[];
  initialDraft: BugDraft | null;
  onClearDraft: () => void;
  onCreateBug: (draft: BugDraft) => Promise<void>;
  onUpdateBugStatus: (bugId: string, status: JiraStatus) => Promise<void>;
}

export function JiraBugsView({
  bugs,
  initialDraft,
  onClearDraft,
  onCreateBug,
  onUpdateBugStatus,
}: JiraBugsViewProps) {
  const [severityFilter, setSeverityFilter] = useState<'All' | JiraSeverity>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | JiraStatus>('All');
  const [componentFilter, setComponentFilter] = useState<'All' | JiraComponent>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string>(bugs[0]?.id ?? 'QA-101');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create form state
  const [title, setTitle] = useState('');
  const [severity, setSeverity] = useState<JiraSeverity>('High');
  const [component, setComponent] = useState<JiraComponent>('REST API');
  const [linkedTestId, setLinkedTestId] = useState('TC-009');
  const [expectedResult, setExpectedResult] = useState('');
  const [actualResult, setActualResult] = useState('');
  const [stepsText, setStepsText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialDraft) {
      setTitle(initialDraft.title);
      setSeverity(initialDraft.severity);
      setComponent(initialDraft.component);
      setLinkedTestId(initialDraft.linkedTestId);
      setExpectedResult(initialDraft.expectedResult);
      setActualResult(initialDraft.actualResult);
      setStepsText(initialDraft.reproductionSteps.join('\n'));
      setShowCreateModal(true);
    }
  }, [initialDraft]);

  const filteredBugs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return bugs.filter((b) => {
      if (severityFilter !== 'All' && b.severity !== severityFilter) return false;
      if (statusFilter !== 'All' && b.status !== statusFilter) return false;
      if (componentFilter !== 'All' && b.component !== componentFilter) return false;
      if (q) {
        const hay = `${b.id} ${b.title} ${b.linkedTestId} ${b.component}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [bugs, severityFilter, statusFilter, componentFilter, searchQuery]);

  const selectedBug = useMemo(
    () => bugs.find((b) => b.id === selectedId) ?? filteredBugs[0] ?? null,
    [bugs, selectedId, filteredBugs]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onCreateBug({
        title: title.trim(),
        severity,
        component,
        linkedTestId: linkedTestId.trim() || 'TC-001',
        expectedResult: expectedResult.trim() || 'Expected assertion to pass.',
        actualResult: actualResult.trim() || 'Assertion failed during automated run.',
        reproductionSteps: stepsText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      });
      setShowCreateModal(false);
      onClearDraft();
      setTitle('');
      setExpectedResult('');
      setActualResult('');
      setStepsText('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-md p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            aria-label="Filter by severity"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as 'All' | JiraSeverity)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-600"
          >
            <option value="All">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'All' | JiraStatus)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-600"
          >
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="In Review">In Review</option>
            <option value="Resolved">Resolved</option>
          </select>

          <select
            aria-label="Filter by component"
            value={componentFilter}
            onChange={(e) => setComponentFilter(e.target.value as 'All' | JiraComponent)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-600"
          >
            <option value="All">All Components</option>
            <option value="Web UI">Web UI</option>
            <option value="REST API">REST API</option>
            <option value="RAG Chatbot">RAG Chatbot</option>
            <option value="CI/CD">CI/CD</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search QA-101 or test ID..."
              aria-label="Search Jira defects"
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md w-52 focus:outline-none focus:border-blue-600"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              onClearDraft();
              setTitle('');
              setExpectedResult('');
              setActualResult('');
              setStepsText('1. Navigate to target route.\n2. Submit test input.\n3. Observe response.');
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Log Jira Bug</span>
          </button>
        </div>
      </div>

      {/* Main Split: Bugs Table + Inspector */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-7 bg-white border border-slate-200 rounded-md overflow-hidden">
          <div className="overflow-x-auto max-h-[640px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500 z-10">
                <tr>
                  <th className="py-2.5 px-4">Key</th>
                  <th className="py-2.5 px-3">Summary</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredBugs.map((bug) => {
                  const selected = selectedBug?.id === bug.id;
                  return (
                    <tr
                      key={bug.id}
                      onClick={() => setSelectedId(bug.id)}
                      className={`h-12 cursor-pointer transition-colors ${
                        selected ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-2 px-4 font-mono font-medium text-slate-800 tabular-nums whitespace-nowrap">
                        {bug.id}
                      </td>
                      <td className="py-2 px-3">
                        <div className="font-medium text-slate-900 line-clamp-1">{bug.title}</div>
                        <div className="text-[11px] text-slate-500">
                          {bug.component} · <span className="font-mono">{bug.linkedTestId}</span> · {bug.reportedAt}
                        </div>
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        <SeverityLabel severity={bug.severity} />
                      </td>
                      <td className="py-2 px-4 whitespace-nowrap">
                        <JiraStatusLabel status={bug.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="xl:col-span-5 bg-white border border-slate-200 rounded-md p-5 space-y-5">
          {selectedBug ? (
            <>
              <div className="space-y-2 border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-mono font-semibold text-slate-800">
                    {selectedBug.id} · {selectedBug.component} · {selectedBug.linkedTestId}
                  </span>
                  <SeverityLabel severity={selectedBug.severity} />
                </div>
                <h3 className="font-display text-base font-semibold text-slate-900">{selectedBug.title}</h3>
                <div className="text-xs text-slate-500">
                  {selectedBug.environment} · Reported {selectedBug.reportedAt} by {selectedBug.reporter}
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="block font-medium text-slate-700">Workflow Status</label>
                <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-md">
                  {(['Open', 'In Progress', 'In Review', 'Resolved'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => onUpdateBugStatus(selectedBug.id, st)}
                      className={`py-1.5 text-xs font-medium rounded transition-colors ${
                        selectedBug.status === st
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="font-medium text-slate-700">Reproduction Steps</div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1 text-slate-700 leading-relaxed">
                  {selectedBug.reproductionSteps.map((step, i) => (
                    <div key={i}>{step}</div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 text-xs">
                <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded space-y-1">
                  <div className="font-semibold text-emerald-800">Expected Result</div>
                  <div className="text-slate-800 leading-relaxed">{selectedBug.expectedResult}</div>
                </div>
                <div className="p-3 bg-red-50/60 border border-red-200 rounded space-y-1">
                  <div className="font-semibold text-red-800">Actual Result</div>
                  <div className="text-slate-800 leading-relaxed">{selectedBug.actualResult}</div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-xs text-slate-500 py-8 text-center">Select a Jira defect to inspect details.</div>
          )}
        </div>
      </div>

      {/* Create Jira Bug Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-jira-title"
        >
          <div className="bg-white border border-slate-200 rounded-md w-full max-w-lg p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 id="create-jira-title" className="font-display text-base font-semibold text-slate-900">
                Log New Jira Defect
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  onClearDraft();
                }}
                aria-label="Close modal"
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Summary</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Concise defect summary..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as JiraSeverity)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-md"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Component</label>
                  <select
                    value={component}
                    onChange={(e) => setComponent(e.target.value as JiraComponent)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-md"
                  >
                    <option value="Web UI">Web UI</option>
                    <option value="REST API">REST API</option>
                    <option value="RAG Chatbot">RAG Chatbot</option>
                    <option value="CI/CD">CI/CD</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Linked Test ID</label>
                  <input
                    type="text"
                    value={linkedTestId}
                    onChange={(e) => setLinkedTestId(e.target.value)}
                    className="w-full px-2.5 py-2 font-mono border border-slate-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Reproduction Steps (one per line)</label>
                <textarea
                  rows={3}
                  value={stepsText}
                  onChange={(e) => setStepsText(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Expected Result</label>
                  <textarea
                    rows={2}
                    value={expectedResult}
                    onChange={(e) => setExpectedResult(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Actual Result</label>
                  <textarea
                    rows={2}
                    value={actualResult}
                    onChange={(e) => setActualResult(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    onClearDraft();
                  }}
                  className="px-3.5 py-2 font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !title.trim()}
                  className="px-4 py-2 font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Submit Bug to Jira'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
