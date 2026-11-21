import { Bug, FlaskConical, GitBranch, LayoutDashboard, ShieldCheck } from 'lucide-react';
import type { NavSection, SuiteSummary } from '../types';

interface SidebarProps {
  activeSection: NavSection;
  onSelect: (section: NavSection) => void;
  summary: SuiteSummary | null;
}

export function Sidebar({ activeSection, onSelect, summary }: SidebarProps) {
  const navItems: Array<{
    id: NavSection;
    label: string;
    icon: typeof LayoutDashboard;
    count?: string;
  }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    {
      id: 'tests',
      label: 'Web & API Tests',
      icon: FlaskConical,
      count: summary ? `${summary.webApi.passed}/${summary.webApi.total}` : '44',
    },
    {
      id: 'eval',
      label: 'GenAI RAG Eval',
      icon: ShieldCheck,
      count: summary ? `${summary.eval.passed}/${summary.eval.total}` : '50',
    },
    {
      id: 'pipelines',
      label: 'CI/CD Pipelines',
      icon: GitBranch,
      count: summary ? String(summary.pipelines.totalRuns) : '4',
    },
    {
      id: 'jira',
      label: 'Jira Bug Log',
      icon: Bug,
      count: summary ? `${summary.jira.open} open` : '22',
    },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white flex flex-col justify-between min-h-screen">
      <div>
        <div className="px-5 h-16 border-b border-slate-200 flex items-center">
          <span className="font-display text-base font-bold tracking-tight text-blue-900 whitespace-nowrap">
            QA Automation Suite
          </span>
        </div>

        <nav aria-label="Primary navigation" className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                  active
                    ? 'bg-blue-50 text-blue-800'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-2.5 whitespace-nowrap">
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-blue-700' : 'text-slate-400'}`} aria-hidden="true" />
                  <span>{item.label}</span>
                </span>
                {item.count && (
                  <span className={`font-mono text-xs tabular-nums ${active ? 'text-blue-700' : 'text-slate-400'}`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-200 text-xs text-slate-500 space-y-1.5">
        <div className="font-medium text-slate-700">Toolchain Scope</div>
        <div>Playwright · Selenium · Postman</div>
        <div>JavaScript · C# · GitHub Actions</div>
        <div>Gemini RAG · Jira Defect Sync</div>
      </div>
    </aside>
  );
}
