/**
 * Eval — AI-readability findings for Multi-Framework, rendered inside a
 * Multi-Framework app.
 *
 * The meta-shape: this page displays empirical findings about how AI coding
 * agents consume Salesforce Multi-Framework docs — and the page itself is
 * built on Multi-Framework, querying nothing from Salesforce (it's static
 * eval data), but rendered through the same React + UI Bundle pipeline.
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
  betaDocs: string;
  mcp: string;
  skill: string;
  webfetch: string;
}

const VARIANTS: VariantSummary[] = [
  {
    key: 'baseline',
    label: 'No docs (baseline)',
    blurb: "Just the agent's training data. The number to beat.",
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
    highlighted: true,
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
    blurb: '9 KB hand-curated skill. Best variant in the prior run; mid-pack here.',
    pass: 6,
    total: 9,
    verdict: 'partial',
  },
  {
    key: 'webfetch',
    label: 'WebFetch (WAF-blocked)',
    blurb: 'Live WebFetch against developer.salesforce.com. Hits 403s and noise.',
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
    betaDocs: '3 / 3',
    mcp: '0 / 3',
    skill: '2 / 3',
    webfetch: '0 / 3',
  },
  {
    task: 'lwc-contact-list',
    category: 'LWC',
    baseline: '3 / 3',
    betaDocs: '1 / 3',
    mcp: '3 / 3',
    skill: '1 / 3',
    webfetch: '1 / 3',
  },
  {
    task: 'soql-recent-opps',
    category: 'SOQL',
    baseline: '1 / 3',
    betaDocs: '3 / 3',
    mcp: '3 / 3',
    skill: '3 / 3',
    webfetch: '3 / 3',
  },
];

function badgeForVerdict(verdict: Verdict, label: string) {
  if (verdict === 'win') return <Badge className="bg-green-600 hover:bg-green-700">{label}</Badge>;
  if (verdict === 'partial') return <Badge className="bg-amber-500 hover:bg-amber-600">{label}</Badge>;
  return <Badge className="bg-red-600 hover:bg-red-700">{label}</Badge>;
}

function fractionVerdict(fraction: string): Verdict {
  if (fraction === '3 / 3') return 'win';
  if (fraction === '2 / 3' || fraction === '1 / 3') return fraction === '2 / 3' ? 'partial' : 'fail';
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

export default function Eval() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-gray-900">AI-Readability Eval</h1>
        <p className="text-sm text-gray-600 max-w-3xl">
          What happens when AI coding agents try to write real Salesforce code
          (Apex trigger, LWC component, SOQL query) under five different
          documentation conditions. 45 runs, Sonnet 4.6, 3 repeats per
          task &times; variant.
        </p>
        <p className="text-xs text-gray-500">
          Rendered inside a Salesforce Multi-Framework React app, displaying
          findings about how AI agents consume Salesforce Multi-Framework docs.
          Meta-narrative intended.
        </p>
      </header>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          Pass rate by variant
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {VARIANTS.map(v => (
            <Card
              key={v.key}
              className={
                v.highlighted
                  ? 'border-blue-600 border-2 shadow-md bg-blue-50'
                  : ''
              }
            >
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase tracking-wide">
                  {v.label}
                </CardDescription>
                <CardTitle className="text-3xl tabular-nums">
                  {Math.round((v.pass / v.total) * 100)}%
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {badgeForVerdict(v.verdict, `${v.pass} / ${v.total} pass`)}
                <p className="text-xs text-gray-600 leading-snug">{v.blurb}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          Per-task breakdown
        </h2>
        <div className="bg-white rounded-md border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-center">No docs</TableHead>
                <TableHead className="text-center text-blue-700">Beta MDX</TableHead>
                <TableHead className="text-center">MCP</TableHead>
                <TableHead className="text-center">SKILL.md</TableHead>
                <TableHead className="text-center">WebFetch</TableHead>
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
                  <TableCell className="text-center">{fractionCell(row.betaDocs)}</TableCell>
                  <TableCell className="text-center">{fractionCell(row.mcp)}</TableCell>
                  <TableCell className="text-center">{fractionCell(row.skill)}</TableCell>
                  <TableCell className="text-center">{fractionCell(row.webfetch)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-blue-50">
                <TableCell className="font-semibold text-gray-900">Overall</TableCell>
                <TableCell></TableCell>
                <TableCell className="text-center">{fractionCell('7 / 9' as string)}</TableCell>
                <TableCell className="text-center">{fractionCell('7 / 9' as string)}</TableCell>
                <TableCell className="text-center">{fractionCell('6 / 9' as string)}</TableCell>
                <TableCell className="text-center">{fractionCell('6 / 9' as string)}</TableCell>
                <TableCell className="text-center">{fractionCell('4 / 9' as string)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          Three findings worth landing
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-t-4 border-blue-600">
            <CardHeader>
              <CardTitle className="text-base">
                1. Bypass confirmed (with a footnote)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-700">
              <p>
                Feeding the actual beta-docs content doubles WebFetch's score
                (44% → 78%). On Apex specifically: 0/3 → 3/3. The WAF really
                is the problem.
              </p>
              <p className="text-xs text-gray-500">
                Footnote: 78% is also what baseline scored. Closing the WAF
                gap recovers value; it doesn't add new value the model
                doesn't already have.
              </p>
            </CardContent>
          </Card>
          <Card className="border-t-4 border-gray-600">
            <CardHeader>
              <CardTitle className="text-base">
                2. Bulk context = no lift on an established platform
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-700">
              <p>
                97 KB of beta MDX tied with nothing at all, both at 78%. For
                an established platform like Salesforce, the model's training
                data already covers the GA surface well.
              </p>
              <p className="text-xs text-gray-500">
                The wedge isn't "publish more docs" — it's per-task retrieval
                that disambiguates the beta surface from the GA surface.
              </p>
            </CardContent>
          </Card>
          <Card className="border-t-4 border-red-600">
            <CardHeader>
              <CardTitle className="text-base">
                3. Bulk context can actively hurt
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-700">
              <p>
                LWC dropped from 3/3 (baseline) to 1/3 with the beta MDX in
                context. The Multi-Framework vocabulary distracts the agent
                from the GA LWC patterns it already knows.
              </p>
              <p className="text-xs text-gray-500">
                Retrieval that's task-relevant beats bulk context every time.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="border-t border-gray-200 pt-4 text-xs text-gray-500 space-y-1">
        <p>
          <strong>Harness:</strong> <code>skill-eval</code>{' '}
          (project-skill-runner), Claude runner, Modal sandboxes, LLM-as-judge
          grader. Run name: <code>salesforce-mdx-bypass</code>. 45 runs total
          cost $3.03 on Claude Sonnet 4.6.
        </p>
        <p>
          <strong>Source:</strong> Eval data captured 2026-05-15. Findings are
          directional, not production. Full methodology + raw artifacts in the
          repo README.
        </p>
      </footer>
    </div>
  );
}
