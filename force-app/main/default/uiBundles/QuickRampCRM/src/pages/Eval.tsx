/**
 * Eval — AI-readability findings for Multi-Framework, rendered inside a
 * Multi-Framework app.
 *
 * The meta-shape: this page displays empirical findings about how AI coding
 * agents consume Salesforce Multi-Framework docs — and the page itself is
 * built on Multi-Framework, querying nothing from Salesforce (it's static
 * eval data), but rendered through the same React + UI Bundle pipeline.
 *
 * Two run rounds: salesforce-mdx-bypass (5 variants, 45 runs) plus the
 * salesforce-tools-audit follow-up (2 new variants, 18 runs).
 */
import {
  Card,
  CardContent,
  CardDescription,
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
import { Badge } from '@/components/ui/badge';

type Verdict = 'win' | 'partial' | 'fail';

interface VariantSummary {
  key: string;
  label: string;
  blurb: string;
  pass: number;
  total: number;
  verdict: Verdict;
  highlighted?: boolean;
}

interface TaskRow {
  task: string;
  category: string;
  baseline: string;
  noTools: string;
  betaDocs: string;
  mcp: string;
  skill: string;
  webfetch: string;
  forced: string;
}

// All variants ranked by pass rate descending. The forced-fetch variant is
// highlighted as the headline result.
const VARIANTS: VariantSummary[] = [
  {
    key: 'forced',
    label: 'Forced GitHub fetch',
    blurb:
      'Agent directed to fetch raw.githubusercontent.com/.../AGENT.md before answering. Did so on every run. Beats every other variant.',
    pass: 9,
    total: 9,
    verdict: 'win',
    highlighted: true,
  },
  {
    key: 'baseline',
    label: 'No docs (baseline)',
    blurb: "Just the agent's training data. Audit confirmed: zero network calls in any of 9 runs.",
    pass: 7,
    total: 9,
    verdict: 'win',
  },
  {
    key: 'beta-docs',
    label: 'Beta MDX as context',
    blurb: '97 KB of trimmed beta docs prepended to the prompt. Bypasses the WAF.',
    pass: 7,
    total: 9,
    verdict: 'win',
  },
  {
    key: 'mcp',
    label: 'MCP (live docs)',
    blurb: 'Agent retrieves docs via MCP server during the run.',
    pass: 6,
    total: 9,
    verdict: 'partial',
  },
  {
    key: 'skill',
    label: 'Curated SKILL.md',
    blurb: '9 KB hand-curated skill file giving the agent task-specific patterns up front.',
    pass: 6,
    total: 9,
    verdict: 'partial',
  },
  {
    key: 'no-tools',
    label: 'Tightest baseline (no Edit, no MCP)',
    blurb:
      'Apex 3/3 + SOQL 3/3 from training data alone. LWC 0/3 — multi-file output truncated.',
    pass: 6,
    total: 9,
    verdict: 'partial',
  },
  {
    key: 'webfetch',
    label: 'WebFetch (offered, declined)',
    blurb: 'Tool available, but Sonnet never called it. 44% is mostly truncation noise, not WAF effect.',
    pass: 4,
    total: 9,
    verdict: 'fail',
  },
];

const PER_TASK: TaskRow[] = [
  {
    task: 'apex-account-trigger',
    category: 'Apex',
    baseline: '3 / 3',
    noTools: '3 / 3',
    betaDocs: '3 / 3',
    mcp: '0 / 3',
    skill: '2 / 3',
    webfetch: '0 / 3',
    forced: '3 / 3',
  },
  {
    task: 'lwc-contact-list',
    category: 'LWC',
    baseline: '3 / 3',
    noTools: '0 / 3',
    betaDocs: '1 / 3',
    mcp: '3 / 3',
    skill: '1 / 3',
    webfetch: '1 / 3',
    forced: '3 / 3',
  },
  {
    task: 'soql-recent-opps',
    category: 'SOQL',
    baseline: '1 / 3',
    noTools: '3 / 3',
    betaDocs: '3 / 3',
    mcp: '3 / 3',
    skill: '3 / 3',
    webfetch: '3 / 3',
    forced: '3 / 3',
  },
];

function badgeForVerdict(verdict: Verdict, label: string) {
  if (verdict === 'win') return <Badge className="bg-green-600 hover:bg-green-700">{label}</Badge>;
  if (verdict === 'partial') return <Badge className="bg-amber-500 hover:bg-amber-600">{label}</Badge>;
  return <Badge className="bg-red-600 hover:bg-red-700">{label}</Badge>;
}

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

function VariantCard({ v }: { v: VariantSummary }) {
  return (
    <Card
      className={
        v.highlighted ? 'border-blue-600 border-2 shadow-md bg-blue-50' : ''
      }
    >
      <CardHeader className="pb-2">
        <CardDescription className="text-xs uppercase tracking-wide">{v.label}</CardDescription>
        <CardTitle className="text-3xl tabular-nums">
          {Math.round((v.pass / v.total) * 100)}%
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {badgeForVerdict(v.verdict, `${v.pass} / ${v.total} pass`)}
        <p className="text-xs text-gray-600 leading-snug">{v.blurb}</p>
      </CardContent>
    </Card>
  );
}

export default function Eval() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-gray-900">AI-Readability Eval</h1>
        <p className="text-sm text-gray-600 max-w-3xl">
          What happens when AI coding agents try to write real Salesforce code
          (Apex trigger, LWC component, SOQL query) under seven different
          documentation conditions. 63 runs on Sonnet 4.6, 3 repeats per
          task &times; variant.
        </p>
        <p className="text-xs text-gray-500">
          Rendered inside a Salesforce Multi-Framework React app, displaying
          findings about how AI agents consume Salesforce Multi-Framework docs.
          Meta-narrative intended.
        </p>
      </header>

      <section className="bg-blue-50 border-l-4 border-blue-600 rounded-md p-4 space-y-2">
        <h2 className="text-sm font-bold text-blue-900 uppercase tracking-wide">The headline</h2>
        <p className="text-sm text-gray-800">
          When the agent is <strong>directed to fetch the recipes-repo <code className="bg-blue-100 px-1 rounded text-blue-900">AGENT.md</code> first</strong>,
          pass rate hits <strong>100% (9/9)</strong> — the strongest single result across every variant tested.
          The standard <code className="bg-blue-100 px-1 rounded text-blue-900">with-docs-fetch</code> variant
          sits at 44% because Sonnet declines to fetch on GA-Salesforce tasks even when WebFetch is offered.
        </p>
        <p className="text-xs text-gray-700">
          The fix isn't access; it's the directive. <em>"Have WebFetch"</em> ≠ <em>"use WebFetch."</em>
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          Pass rate by variant
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {VARIANTS.map(v => (
            <VariantCard key={v.key} v={v} />
          ))}
        </div>
      </section>

      <section className="bg-green-50 border-l-4 border-green-600 rounded-md p-4 space-y-2">
        <h2 className="text-sm font-bold text-green-900 uppercase tracking-wide">
          Methodology audit — what the agent actually did
        </h2>
        <p className="text-sm text-gray-800">
          A methodology question worth verifying: <em>is the "no docs" baseline really pure training data,
          or is the agent sneaking out to GitHub via Bash without being marked as a docs variant?</em>{' '}
          <strong>Verified by transcript audit: zero network calls in any of 9 baseline runs.</strong> The
          78% baseline is genuinely pure-training-data.
        </p>
        <ul className="text-sm text-gray-800 list-disc list-inside space-y-1">
          <li>
            <strong>Baseline:</strong> Write (the answer file) + Bash (only <code className="bg-green-100 px-1 rounded">mkdir</code>{' '}
            for the LWC bundle directory). Zero WebFetch, zero curl, zero gh.
          </li>
          <li>
            <strong>with-docs-fetch surprise:</strong> the variant that <em>offers</em> WebFetch also
            recorded zero WebFetch calls. Sonnet declined the offer for these GA tasks. The 44% score is
            a harness truncation artifact (3 Apex runs had Write tool calls cut off mid-content).
          </li>
          <li>
            <strong>with-fetch-forced verified:</strong> all 9 runs successfully fetched the AGENT.md.
            100% pass rate. The directive worked.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Per-task breakdown</h2>
        <div className="bg-white rounded-md border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-center">No docs</TableHead>
                <TableHead className="text-center">No-tools</TableHead>
                <TableHead className="text-center text-blue-700">Beta MDX</TableHead>
                <TableHead className="text-center">MCP</TableHead>
                <TableHead className="text-center">SKILL.md</TableHead>
                <TableHead className="text-center">WebFetch</TableHead>
                <TableHead className="text-center text-blue-700 font-bold">Forced fetch</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PER_TASK.map(row => (
                <TableRow key={row.task}>
                  <TableCell className="font-medium text-gray-900">{row.task}</TableCell>
                  <TableCell className="text-xs uppercase tracking-wide text-gray-500">
                    {row.category}
                  </TableCell>
                  <TableCell className="text-center">{fractionCell(row.baseline)}</TableCell>
                  <TableCell className="text-center">{fractionCell(row.noTools)}</TableCell>
                  <TableCell className="text-center">{fractionCell(row.betaDocs)}</TableCell>
                  <TableCell className="text-center">{fractionCell(row.mcp)}</TableCell>
                  <TableCell className="text-center">{fractionCell(row.skill)}</TableCell>
                  <TableCell className="text-center">{fractionCell(row.webfetch)}</TableCell>
                  <TableCell className="text-center">{fractionCell(row.forced)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-blue-50">
                <TableCell className="font-semibold text-gray-900">Overall</TableCell>
                <TableCell></TableCell>
                <TableCell className="text-center">{fractionCell('7 / 9')}</TableCell>
                <TableCell className="text-center">{fractionCell('6 / 9')}</TableCell>
                <TableCell className="text-center">{fractionCell('7 / 9')}</TableCell>
                <TableCell className="text-center">{fractionCell('6 / 9')}</TableCell>
                <TableCell className="text-center">{fractionCell('6 / 9')}</TableCell>
                <TableCell className="text-center">{fractionCell('4 / 9')}</TableCell>
                <TableCell className="text-center font-bold">{fractionCell('9 / 9')}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Four findings worth landing</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-t-4 border-blue-600">
            <CardHeader>
              <CardTitle className="text-base">1. The bypass works when the agent is directed to use it (100%)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-700">
              <p>
                The single strongest result across every variant: <strong>directing the agent to fetch the
                recipes-repo AGENT.md before answering yields 9/9 pass.</strong> Beats baseline (78%), Beta
                MDX (78%), MCP (67%), curated SKILL.md (67%), and standard WebFetch (44%).
              </p>
              <p className="text-xs text-gray-500">
                <em>Access alone isn't enough.</em> The 44% WebFetch run had the tool available; Sonnet declined
                to use it. The difference between 44% and 100% is the prompt directive.
              </p>
            </CardContent>
          </Card>
          <Card className="border-t-4 border-gray-600">
            <CardHeader>
              <CardTitle className="text-base">2. Baseline is genuinely pure training data — no leakage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-700">
              <p>
                Transcript audit confirmed <strong>zero <code>curl</code>, <code>gh</code>, or WebFetch
                calls</strong> across all 9 baseline runs. Only Write and <code>mkdir</code>. The 78% is
                honest pure-training-data behavior.
              </p>
              <p className="text-xs text-gray-500">
                The agent's GA-Salesforce training knowledge is genuinely strong. Bulk beta context yields
                no lift because the model already has the GA patterns.
              </p>
            </CardContent>
          </Card>
          <Card className="border-t-4 border-amber-600">
            <CardHeader>
              <CardTitle className="text-base">3. Bulk beta context yields no lift on an established platform</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-700">
              <p>
                97 KB of Multi-Framework beta MDX tied with <em>nothing at all</em> at <strong>78%</strong>.
                The model already covers the GA surface well.
              </p>
              <p className="text-xs text-gray-500">
                Strategic content lesson: "publish more docs" is not winning for AI consumers on an
                established platform. The wedge is content the agent is <em>directed</em> to read.
              </p>
            </CardContent>
          </Card>
          <Card className="border-t-4 border-red-600">
            <CardHeader>
              <CardTitle className="text-base">4. Bulk context can hurt; small-N harness noise can dominate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-700">
              <p>
                <strong>LWC dropped from 3/3 (baseline) to 1/3 with beta MDX.</strong> And the
                with-docs-fetch 44% was mostly truncation noise from 3 Apex runs with cut-off Write calls,
                not docs effect.
              </p>
              <p className="text-xs text-gray-500">
                Methodology: always audit transcripts before declaring a finding. "WebFetch lost to WAF"
                was wrong; Sonnet never tried. Honest reporting matters more than a clean narrative.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="border-t border-gray-200 pt-4 text-xs text-gray-500 space-y-1">
        <p>
          <strong>Harness:</strong> <code>skill-eval</code> (project-skill-runner), Claude runner, Modal
          sandboxes, LLM-as-judge grader.
        </p>
        <p>
          <strong>Rounds:</strong> <code>salesforce-mdx-bypass</code> (5 variants, 45 runs, $3.03) +
          <code>salesforce-tools-audit</code> (2 new variants, 18 runs, $1.18). <strong>Total: 63 runs,
          $4.21, all on Claude Sonnet 4.6.</strong>
        </p>
        <p>
          <strong>Source:</strong> All data captured 2026-05-15 to 2026-05-17. Findings are directional,
          not production. Full methodology, raw transcripts, and the harness patch in the repo README.
        </p>
      </footer>
    </div>
  );
}
