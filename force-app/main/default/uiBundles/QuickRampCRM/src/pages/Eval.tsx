/**
 * Eval — AI-readability findings for Multi-Framework, rendered inside a
 * Multi-Framework app.
 *
 * Two-axis test: same 7 variants × two task surfaces (GA Salesforce vs
 * Multi-Framework). 108 runs total. The meta-shape: this page is built
 * on Multi-Framework, displaying findings about how AI agents consume
 * Multi-Framework (and GA Salesforce) docs.
 */
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type Verdict = 'win' | 'partial' | 'fail';

interface ComparisonRow {
  variant: string;
  what: string;
  ga: { pct: number; fraction: string; verdict: Verdict; winner?: boolean };
  mf: { pct: number; fraction: string; verdict: Verdict; winner?: boolean };
}

// The two-axis comparison: same variants, two surfaces.
const COMPARISON: ComparisonRow[] = [
  {
    variant: 'Curated SKILL.md',
    what: 'Hand-curated, agent-targeted patterns prepended to the prompt',
    ga: { pct: 67, fraction: '6 / 9', verdict: 'partial' },
    mf: { pct: 100, fraction: '9 / 9', verdict: 'win', winner: true },
  },
  {
    variant: 'With docs (Beta MDX)',
    what: '97 KB beta MDX prepended to the prompt',
    ga: { pct: 78, fraction: '7 / 9', verdict: 'win' },
    mf: { pct: 66, fraction: '6 / 9', verdict: 'partial' },
  },
  {
    variant: 'No docs (baseline)',
    what: 'Just the model — pure training data, no extras',
    ga: { pct: 78, fraction: '7 / 9', verdict: 'win' },
    mf: { pct: 0, fraction: '0 / 9', verdict: 'fail' },
  },
  {
    variant: 'Forced GitHub fetch',
    what: 'Directed to fetch recipes-repo AGENT.md before answering',
    ga: { pct: 100, fraction: '9 / 9', verdict: 'win', winner: true },
    mf: { pct: 33, fraction: '3 / 9', verdict: 'fail' },
  },
  {
    variant: 'Tightest baseline',
    what: 'No Edit, no WebFetch, no extras',
    ga: { pct: 66, fraction: '6 / 9', verdict: 'partial' },
    mf: { pct: 0, fraction: '0 / 9', verdict: 'fail' },
  },
  {
    variant: 'WebFetch (offered)',
    what: 'WebFetch tool available, agent decides whether to use it',
    ga: { pct: 44, fraction: '4 / 9', verdict: 'fail' },
    mf: { pct: 0, fraction: '0 / 9', verdict: 'fail' },
  },
];

interface PerTaskRow {
  task: string;
  category: string;
  surface: 'GA' | 'MF';
  baseline: string;
  noTools: string;
  betaDocs: string;
  skill: string;
  webfetch: string;
  forced: string;
}

const GA_TASKS: PerTaskRow[] = [
  {
    task: 'apex-account-trigger',
    category: 'Apex',
    surface: 'GA',
    baseline: '3 / 3',
    noTools: '3 / 3',
    betaDocs: '3 / 3',
    skill: '2 / 3',
    webfetch: '0 / 3',
    forced: '3 / 3',
  },
  {
    task: 'lwc-contact-list',
    category: 'LWC',
    surface: 'GA',
    baseline: '3 / 3',
    noTools: '0 / 3',
    betaDocs: '1 / 3',
    skill: '1 / 3',
    webfetch: '1 / 3',
    forced: '3 / 3',
  },
  {
    task: 'soql-recent-opps',
    category: 'SOQL',
    surface: 'GA',
    baseline: '1 / 3',
    noTools: '3 / 3',
    betaDocs: '3 / 3',
    skill: '3 / 3',
    webfetch: '3 / 3',
    forced: '3 / 3',
  },
];

const MF_TASKS: PerTaskRow[] = [
  {
    task: 'mfw-graphql-account-query',
    category: 'Data SDK',
    surface: 'MF',
    baseline: '0 / 3',
    noTools: '0 / 3',
    betaDocs: '3 / 3',
    skill: '3 / 3',
    webfetch: '0 / 3',
    forced: '0 / 3',
  },
  {
    task: 'mfw-ui-bundle-scaffold',
    category: 'Metadata',
    surface: 'MF',
    baseline: '0 / 3',
    noTools: '0 / 3',
    betaDocs: '3 / 3',
    skill: '3 / 3',
    webfetch: '0 / 3',
    forced: '3 / 3',
  },
  {
    task: 'mfw-react-router-detail',
    category: 'Routing',
    surface: 'MF',
    baseline: '0 / 3',
    noTools: '0 / 3',
    betaDocs: '0 / 3',
    skill: '3 / 3',
    webfetch: '0 / 3',
    forced: '0 / 3',
  },
];

function fractionVerdict(fraction: string): Verdict {
  if (fraction === '3 / 3') return 'win';
  if (fraction === '2 / 3') return 'partial';
  return 'fail';
}

function fractionCell(fraction: string) {
  const v = fractionVerdict(fraction);
  const color =
    v === 'win'
      ? 'text-green-700 font-semibold'
      : v === 'partial'
        ? 'text-amber-600 font-semibold'
        : 'text-red-700 font-semibold';
  return <span className={`tabular-nums ${color}`}>{fraction}</span>;
}

function pctClass(verdict: Verdict) {
  if (verdict === 'win') return 'text-green-700';
  if (verdict === 'partial') return 'text-amber-600';
  return 'text-red-700';
}

function PerTaskTable({ tasks }: { tasks: PerTaskRow[] }) {
  return (
    <div className="bg-white rounded-md border border-gray-200">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Task</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-center">No docs</TableHead>
            <TableHead className="text-center">No-tools</TableHead>
            <TableHead className="text-center text-blue-700">Beta MDX</TableHead>
            <TableHead className="text-center">SKILL.md</TableHead>
            <TableHead className="text-center">WebFetch</TableHead>
            <TableHead className="text-center text-blue-700">Forced fetch</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map(row => (
            <TableRow key={row.task}>
              <TableCell className="font-medium text-gray-900">{row.task}</TableCell>
              <TableCell className="text-xs uppercase tracking-wide text-gray-500">
                {row.category}
              </TableCell>
              <TableCell className="text-center">{fractionCell(row.baseline)}</TableCell>
              <TableCell className="text-center">{fractionCell(row.noTools)}</TableCell>
              <TableCell className="text-center">{fractionCell(row.betaDocs)}</TableCell>
              <TableCell className="text-center">{fractionCell(row.skill)}</TableCell>
              <TableCell className="text-center">{fractionCell(row.webfetch)}</TableCell>
              <TableCell className="text-center">{fractionCell(row.forced)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function Eval() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-gray-900">AI-Readability Eval &mdash; Two-Axis Test</h1>
        <p className="text-sm text-gray-600 max-w-3xl">
          What happens when AI coding agents try to write real Salesforce code under seven different
          documentation conditions, across <strong>two task surfaces</strong>: GA Salesforce (Apex,
          LWC, SOQL) and Multi-Framework (React, GraphQL UIAPI, UIBundle metadata). 108 runs on
          Sonnet 4.6.
        </p>
        <p className="text-xs text-gray-500">
          Rendered inside a Salesforce Multi-Framework React app, displaying findings about how AI
          agents consume Salesforce Multi-Framework docs. Meta-narrative intended.
        </p>
      </header>

      <section className="bg-blue-50 border-l-4 border-blue-600 rounded-md p-4 space-y-2">
        <h2 className="text-sm font-bold text-blue-900 uppercase tracking-wide">The headline</h2>
        <p className="text-sm text-gray-800">
          The winning strategy is <strong>opposite on each surface</strong>. On GA tasks, a directed
          GitHub fetch wins (<strong>100%</strong>). On Multi-Framework tasks, a curated SKILL.md
          wins (<strong>100%</strong>) — while the baseline drops from 78% to <strong>0%</strong>{' '}
          because the runtime didn't exist at training time.
        </p>
        <p className="text-sm text-gray-700">
          The unifying lesson: <strong>hand-curated, agent-targeted content is the highest-leverage
          intervention on either surface</strong> — delivered as a directed fetch on established
          platforms, as prepended SKILL.md on new ones.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          Two-axis comparison &mdash; GA vs Multi-Framework
        </h2>
        <div className="bg-white rounded-md border border-gray-200 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Variant</TableHead>
                <TableHead className="hidden md:table-cell">What it tests</TableHead>
                <TableHead className="text-center">
                  GA tasks
                  <div className="text-xs font-normal text-gray-500">Apex / LWC / SOQL</div>
                </TableHead>
                <TableHead className="text-center">
                  MF tasks
                  <div className="text-xs font-normal text-gray-500">React / GraphQL / UIBundle</div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {COMPARISON.map(row => (
                <TableRow
                  key={row.variant}
                  className={row.ga.winner || row.mf.winner ? 'bg-blue-50' : ''}
                >
                  <TableCell className="font-medium text-gray-900">{row.variant}</TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-gray-600">
                    {row.what}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className={`text-lg font-semibold tabular-nums ${pctClass(row.ga.verdict)}`}>
                      {row.ga.pct}%
                      {row.ga.winner && <span className="ml-1">🏆</span>}
                    </div>
                    <div className="text-xs text-gray-500">{row.ga.fraction}</div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className={`text-lg font-semibold tabular-nums ${pctClass(row.mf.verdict)}`}>
                      {row.mf.pct}%
                      {row.mf.winner && <span className="ml-1">🏆</span>}
                    </div>
                    <div className="text-xs text-gray-500">{row.mf.fraction}</div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-gray-600 mt-3">
          <strong>The pattern reversal is the headline.</strong> On GA, training data is strong
          (baseline 78%) — the agent just needs task-specific examples (forced fetch → 100%). On
          MF, training data is zero (baseline 0%) because the runtime didn't exist at training
          time — the agent needs explicit pattern-teaching (SKILL.md → 100%). <strong>Curation
          wins on both, just for different reasons.</strong>
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          GA Tasks — per-task breakdown
        </h2>
        <PerTaskTable tasks={GA_TASKS} />
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          MF Tasks — per-task breakdown
        </h2>
        <PerTaskTable tasks={MF_TASKS} />
        <p className="text-xs text-gray-600 mt-3">
          <strong>SKILL.md is the only variant that solves react-router-detail.</strong> Beta MDX
          covers React Router in passing but not end-to-end; the curated SKILL.md includes the
          exact pattern. Forced fetch only worked on UI bundle scaffold (where AGENT.md has direct
          copy-pasteable examples); on the other tasks, the agent fetched but couldn't translate
          to working code.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          Four findings (unified across both surfaces)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-t-4 border-blue-600">
            <CardHeader>
              <CardTitle className="text-base">
                1. Curated content wins on both surfaces (just delivered differently)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-700">
              <p>
                <strong>On GA: forced fetch wins (100%)</strong> because the model already knows GA
                patterns and just needs task-specific examples. <strong>On MF: curated SKILL.md
                wins (100%)</strong> because the model knows nothing about the new runtime and
                needs explicit pattern-teaching.
              </p>
              <p className="text-xs text-gray-500">
                The unifying truth: <strong>hand-curated, agent-targeted content is the
                highest-leverage docs investment on both surfaces.</strong>
              </p>
            </CardContent>
          </Card>
          <Card className="border-t-4 border-red-600">
            <CardHeader>
              <CardTitle className="text-base">
                2. On Multi-Framework, the model invents non-existent APIs (0% baseline)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-700">
              <p>
                Baseline on MF tasks is <strong>0/9</strong> — not "low," <em>zero</em>. The grader
                noted runs where the agent generated code using <code>useGraphQL</code> and{' '}
                <code>useQuery</code> hooks — plausible-looking React patterns that don't exist in
                the Salesforce SDK at all.
              </p>
              <p className="text-xs text-gray-500">
                Without docs, agents on Multi-Framework produce confidently wrong code. The
                training-data fallback that saves them on GA Salesforce doesn't exist for a
                runtime that didn't exist at training time.
              </p>
            </CardContent>
          </Card>
          <Card className="border-t-4 border-amber-600">
            <CardHeader>
              <CardTitle className="text-base">3. Bulk beta context helps MF but hurts GA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-700">
              <p>
                Same 97 KB of beta MDX: <strong>66% on MF tasks</strong> (real lift from 0%),{' '}
                <strong>78% on GA tasks tied with baseline</strong> (no lift). On LWC specifically,
                the bulk MF context actively <em>hurt</em> — baseline 3/3 to with-docs 1/3, because
                Multi-Framework vocabulary distracts from established LWC patterns.
              </p>
              <p className="text-xs text-gray-500">
                Per-surface retrieval beats bulk context every time. MF docs should serve a
                specific question on demand, not bolt onto every prompt.
              </p>
            </CardContent>
          </Card>
          <Card className="border-t-4 border-gray-600">
            <CardHeader>
              <CardTitle className="text-base">4. Methodology discipline matters: audit before declaring</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-700">
              <p>
                Two findings from transcript audits that changed the narrative: (a) the "no docs"
                baseline made <strong>zero network calls</strong> across all 9 GA runs — pure
                training data, no GitHub leakage. (b) the "WebFetch (offered)" variant{' '}
                <strong>never actually called WebFetch</strong> on most runs — the 44% score
                isn't about WAF blocking; it's about Sonnet declining to fetch.
              </p>
              <p className="text-xs text-gray-500">
                Tool availability ≠ tool use. Honest reporting catches "WebFetch lost to WAF" as
                wrong; the real story is "Sonnet doesn't try unless directed."
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="border-t border-gray-200 pt-4 text-xs text-gray-500 space-y-1">
        <p>
          <strong>Harness:</strong> <code>skill-eval</code> (project-skill-runner), Claude runner,
          Modal sandboxes, LLM-as-judge grader.
        </p>
        <p>
          <strong>Rounds:</strong> <code>salesforce-mdx-bypass</code> (5 GA variants, 45 runs) +
          <code>salesforce-tools-audit</code> (2 new variants on GA, 18 runs) +
          <code>multiframework-eval</code> (3 MF tasks × 7 variants, 63 runs).
          <strong> Total: 108 displayed runs (126 actual minus 18 MCP runs excluded), Claude
          Sonnet 4.6.</strong>
        </p>
        <p>
          <strong>Source:</strong> Captured 2026-05-15 → 05-18. Findings are directional, not
          production. Full methodology + raw transcripts in the repo README.
        </p>
      </footer>
    </div>
  );
}
