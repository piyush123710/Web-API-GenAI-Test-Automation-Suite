import { Play, Zap } from 'lucide-react';
import type { NavSection } from '../types';

interface TopBarProps {
  activeSection: NavSection;
  runningAction: 'smoke' | 'regression' | null;
  onRunSmoke: () => void;
  onRunRegression: () => void;
}

const SECTION_LABELS: Record<NavSection, string> = {
  overview: 'Suite Overview',
  tests: 'Web & REST API Automation',
  eval: 'GenAI RAG Chatbot Evaluation',
  pipelines: 'CI/CD Pipeline & Smoke Gates',
  jira: 'Jira Defect Log',
};

export function TopBar({ activeSection, runningAction, onRunSmoke, onRunRegression }: TopBarProps) {
  return (
    <header className="h-16 px-6 border-b border-slate-200 bg-white flex items-center justify-between gap-8 shrink-0">
      <div className="flex items-center gap-2 text-sm min-w-0">
        <span className="text-slate-500 whitespace-nowrap">Automation Suite</span>
        <span className="text-slate-300" aria-hidden="true">/</span>
        <h1 className="font-display font-semibold text-slate-900 truncate">
          {SECTION_LABELS[activeSection]}
        </h1>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onRunSmoke}
          disabled={runningAction !== null}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          <Zap className="w-3.5 h-3.5 text-slate-600 shrink-0" aria-hidden="true" />
          <span>{runningAction === 'smoke' ? 'Running Smoke...' : 'Run Smoke Check'}</span>
        </button>

        <button
          type="button"
          onClick={onRunRegression}
          disabled={runningAction !== null}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          <Play className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{runningAction === 'regression' ? 'Running Regression...' : 'Run Full Suite'}</span>
        </button>
      </div>
    </header>
  );
}
