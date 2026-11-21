export type UserRole = 'guest' | 'intern' | 'analyst' | 'admin';

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

export const ANONYMIZED_CORPUS: CorpusDocument[] = [
  {
    id: 'DOC-001',
    title: 'Employee Onboarding & Remote Work Handbook',
    classification: 'Public',
    allowedRoles: ['guest', 'intern', 'analyst', 'admin'],
    department: 'People Operations',
    lastUpdated: '2026-10-14',
    anonymizationNotes: 'Replaced personal contact emails and HR lead names with [HR-LEAD-04] and @example-corp.test.',
    chunks: [
      {
        chunkId: 'DOC-001-C1',
        section: 'Working Hours & Core Collaboration',
        content:
          'Standard core collaboration hours are 10:00 AM to 3:00 PM local hub time Monday through Thursday. Full-time staff receive 20 days of paid time off annually plus 11 regional holidays. Interns receive 5 days of paid sick leave and require mentor sign-off from [EMP-1042] for schedule adjustments.',
      },
      {
        chunkId: 'DOC-001-C2',
        section: 'Equipment Stipend & Hardware Return',
        content:
          'New hires receive a one-time $1,200 home office ergonomics stipend reimbursed through the Expense Portal within 45 days of start date. Company-issued laptops remain corporate property and must be returned via prepaid courier within 7 business days of separation to [FACILITY-HUB-02].',
      },
    ],
  },
  {
    id: 'DOC-002',
    title: 'Expense Reimbursement & Corporate Card SOP',
    classification: 'Internal',
    allowedRoles: ['intern', 'analyst', 'admin'],
    department: 'Finance Operations',
    lastUpdated: '2026-10-28',
    anonymizationNotes: 'Masked corporate card BINs, approver SSNs, and vendor bank routing numbers as [ACCT-XXXX] and [VENDOR-XXX].',
    chunks: [
      {
        chunkId: 'DOC-002-C1',
        section: 'Meal & Travel Caps',
        content:
          'Domestic meal reimbursements are capped at $75 per day with itemized receipts required for any single charge exceeding $25. International travel requires pre-approval from Finance Lead [EMP-2019] at least 10 business days prior to departure.',
      },
      {
        chunkId: 'DOC-002-C2',
        section: 'Disallowed Expenses & Audit Triggers',
        content:
          'Personal software subscriptions, alcohol without client attendance, and first-class airfare are non-reimbursable. Expense reports exceeding $2,500 trigger an automated secondary audit by [ACCT-8821] settlement queue within 48 hours.',
      },
    ],
  },
  {
    id: 'DOC-003',
    title: 'Q4 Information Security & Access Control Policy',
    classification: 'Confidential',
    allowedRoles: ['analyst', 'admin'],
    department: 'Security Engineering',
    lastUpdated: '2026-11-02',
    anonymizationNotes: 'Replaced internal bastion hostnames, KMS key ARNs, and incident commander names with [HOST-SEC-09] and [EMP-0088].',
    chunks: [
      {
        chunkId: 'DOC-003-C1',
        section: 'MFA & Session Lifetime',
        content:
          'Hardware FIDO2 security keys are mandatory for all production console access. Standard web session tokens expire after 8 hours of inactivity, whereas privileged admin tokens expire after 30 minutes and require re-authentication via [AUTH-IDP-01].',
      },
      {
        chunkId: 'DOC-003-C2',
        section: 'Data Classification & PII Handling',
        content:
          'Customer PII must never be copied into staging, QA, or GenAI evaluation datasets. All test fixtures must apply deterministic tokenization ([EMP-XXXX], [ACCT-XXXX]) and strip real email domains before ingestion into vector indexes.',
      },
    ],
  },
  {
    id: 'DOC-004',
    title: 'Engineering CI/CD Release & Rollback Runbook',
    classification: 'Internal',
    allowedRoles: ['intern', 'analyst', 'admin'],
    department: 'Platform Quality',
    lastUpdated: '2026-11-10',
    anonymizationNotes: 'Sanitized AWS account IDs, Slack webhook URLs, and on-call pager numbers to [ENV-PROD-01] and [ONCALL-QA].',
    chunks: [
      {
        chunkId: 'DOC-004-C1',
        section: 'Release Gate Criteria',
        content:
          'No release candidate may promote to production unless 100% of Post-Deployment Smoke Checks and >= 95% of Web/API Regression Suites pass in GitHub Actions. Any Severity-1 or Critical Jira blocker halts deployment automatically.',
      },
      {
        chunkId: 'DOC-004-C2',
        section: 'Automated Rollback Procedure',
        content:
          'If post-deployment smoke latency exceeds 1,200ms p95 or error rate surpasses 1.5% within 15 minutes of rollout, GitHub Actions triggers an automated rollback to the previous signed container digest on [ENV-PROD-01] and notifies [ONCALL-QA].',
      },
    ],
  },
  {
    id: 'DOC-005',
    title: 'Executive Compensation & M&A Audit Ledger',
    classification: 'Restricted',
    allowedRoles: ['admin'],
    department: 'Legal & Executive',
    lastUpdated: '2026-11-15',
    anonymizationNotes: 'All executive names, equity grant counts, and acquisition target codes tokenized as [EXEC-01], [TARGET-DELTA].',
    chunks: [
      {
        chunkId: 'DOC-005-C1',
        section: 'Q4 Strategic Evaluation Scope',
        content:
          'Project [TARGET-DELTA] due diligence is restricted strictly to Security Admin and Legal Counsel roles. Projected integration budget is capped at $4.8M pending board ratification on 2026-12-05.',
      },
      {
        chunkId: 'DOC-005-C2',
        section: 'Executive Equity Vesting Schedule',
        content:
          'Officer performance tranches for [EXEC-01] and [EXEC-02] vest quarterly subject to 99.95% platform uptime SLA and SOC2 Type II audit completion with zero unresolved Critical findings.',
      },
    ],
  },
];

export interface RetrievedChunk {
  docId: string;
  docTitle: string;
  classification: CorpusDocument['classification'];
  chunkId: string;
  section: string;
  content: string;
  permitted: boolean;
}

export function retrieveChunksForQuery(query: string, role: UserRole): {
  permittedChunks: RetrievedChunk[];
  blockedDocs: string[];
} {
  const tokens = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2);

  const scored: Array<{ doc: CorpusDocument; chunk: CorpusDocument['chunks'][number]; score: number }> = [];
  const blockedDocSet = new Set<string>();

  for (const doc of ANONYMIZED_CORPUS) {
    const isPermitted = doc.allowedRoles.includes(role);
    for (const chunk of doc.chunks) {
      const haystack = `${doc.title} ${doc.department} ${chunk.section} ${chunk.content}`.toLowerCase();
      let score = 0;
      for (const tok of tokens) {
        if (haystack.includes(tok)) {
          score += 1;
        }
      }
      if (score > 0) {
        if (!isPermitted) {
          blockedDocSet.add(`${doc.id} (${doc.classification})`);
        }
        scored.push({ doc, chunk, score });
      }
    }
  }

  scored.sort((a, b) => b.score - a.score);

  const permittedChunks: RetrievedChunk[] = scored
    .filter((item) => item.doc.allowedRoles.includes(role))
    .slice(0, 4)
    .map((item) => ({
      docId: item.doc.id,
      docTitle: item.doc.title,
      classification: item.doc.classification,
      chunkId: item.chunk.chunkId,
      section: item.chunk.section,
      content: item.chunk.content,
      permitted: true,
    }));

  // If query is broad and user has permitted docs, provide top permitted context if none matched directly
  if (permittedChunks.length === 0) {
    for (const doc of ANONYMIZED_CORPUS) {
      if (doc.allowedRoles.includes(role) && permittedChunks.length < 2) {
        const chunk = doc.chunks[0];
        permittedChunks.push({
          docId: doc.id,
          docTitle: doc.title,
          classification: doc.classification,
          chunkId: chunk.chunkId,
          section: chunk.section,
          content: chunk.content,
          permitted: true,
        });
      }
    }
  }

  return {
    permittedChunks,
    blockedDocs: Array.from(blockedDocSet),
  };
}
