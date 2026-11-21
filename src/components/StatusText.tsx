import { AlertCircle, CheckCircle2, Clock, ShieldAlert } from 'lucide-react';
import type { JiraSeverity, JiraStatus, TestStatus } from '../types';

export function TestStatusLabel({ status }: { status: TestStatus | 'Passed' | 'Failed' }) {
  if (status === 'Passed') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        Passed
      </span>
    );
  }
  if (status === 'Failed') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 whitespace-nowrap">
        <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 whitespace-nowrap">
      <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      Pending
    </span>
  );
}

export function SeverityLabel({ severity }: { severity: JiraSeverity }) {
  if (severity === 'Critical') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 whitespace-nowrap">
        <ShieldAlert className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        Critical
      </span>
    );
  }
  if (severity === 'High') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 whitespace-nowrap">
        <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        High
      </span>
    );
  }
  if (severity === 'Medium') {
    return <span className="text-xs font-medium text-slate-700 whitespace-nowrap">Medium</span>;
  }
  return <span className="text-xs font-normal text-slate-500 whitespace-nowrap">Low</span>;
}

export function JiraStatusLabel({ status }: { status: JiraStatus }) {
  if (status === 'Resolved') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        Resolved
      </span>
    );
  }
  if (status === 'Open') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 whitespace-nowrap">
        <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        Open
      </span>
    );
  }
  if (status === 'In Progress') {
    return <span className="text-xs font-medium text-blue-700 whitespace-nowrap">In Progress</span>;
  }
  return <span className="text-xs font-medium text-amber-700 whitespace-nowrap">In Review</span>;
}
