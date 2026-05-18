/**
 * Eval — AI-readability findings for Salesforce Multi-Framework, rendered
 * inside a Multi-Framework app.
 *
 * Tests whether AI coding agents can correctly write Multi-Framework code
 * (React + GraphQL UIAPI + UIBundle metadata) under six different
 * documentation conditions. The meta-shape: this page is itself built on
 * Multi-Framework, displaying findings about how AI agents consume
 * Multi-Framework docs.
 */
import { Link } from 'react-router';
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

interface VariantRow {
  key: string;
  label: string;
  what: string;
  pct: number;
  fraction: string;
  verdict: Verdict;
  winner?: boolean;
}

// Variants ranked by pass rate. Curated SKILL.md is the clear winner.
const VARIANTS: VariantRow[] = [
  {
    key: 'with-skill',
    label: 'Curated SKILL.md',
    what: 'Hand-curated, agent-targeted patterns prepended to the prompt',
    pct: 100,
    fraction: '9 / 9',
    verdict: 'win',
    winner: true,
  },
  {
    key: 'with-docs',
    label: 'Beta MDX prepended',
    what: '97 KB beta-docs MDX prepended as prompt context',
    pct: 66,
    fraction: '6 / 9',
    verdict: 'partial',
  },
  {
    key: 'with-fetch-forced',
    label: 'Forced GitHub fetch',
    what: 'Agent directed to fetch recipes-repo AGENT.md before answering',
    pct: 33,
    fraction: '3 / 9',
    verdict: 'fail',
  },
  {
    key: 'without-skill',
    label: 'No docs (baseline)',
    what: 'Just the model — pure training data, no extras',
    pct: 0,
    fraction: '0 / 9',
    verdict: 'fail',
  },
  {
    key: 'with-docs-fetch',
    label: 'WebFetch (offered)',
    what: 'WebFetch tool available, agent decides whether to use it',
    pct: 0,
    fraction: '0 / 9',
    verdict: 'fail',
  },
];

interface PerTaskRow {
  task: string;
  category: string;
  skill: string;
  betaDocs: string;
  forced: string;
  baseline: string;
  webfetch: string;
}

const PER_TASK: PerTaskRow[] = [
  {
    task: 'mfw-graphql-account-query',
    category: 'Data SDK',
    skill: '3 / 3',
    betaDocs: '3 / 3',
    forced: '0 / 3',
    baseline: '0 / 3',
    webfetch: '0 / 3',
  },
  {
    task: 'mfw-ui-bundle-scaffold',
    category: 'Metadata',
    skill: '3 / 3',
    betaDocs: '3 / 3',
    forced: '3 / 3',
    baseline: '0 / 3',
    webfetch: '0 / 3',
  },
  {
    task: 'mfw-react-router-detail',
    category: 'Routing',
    skill: '3 / 3',
    betaDocs: '0 / 3',
    forced: '0 / 3',
    baseline: '0 / 3',
    webfetch: '0 / 3',
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

export default function Eval() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-gray-900">
          Multi-Framework AI-Readability Eval
        </h1>
        <p className="text-sm text-gray-600 max-w-3xl">
          What happens when AI coding agents try to write real Salesforce
          Multi-Framework code (React + GraphQL UIAPI + UIBundle metadata)
          under five different documentation conditions. 45 runs on Claude
          Sonnet 4.6, 3 repeats per task × variant.
        </p>
        <p className="text-xs text-gray-500">
          Rendered inside a Salesforce Multi-Framework React app, displaying
          findings about how AI agents consume Salesforce Multi-Framework docs.
          Meta-narrative intended.
        </p>
        <p className="pt-2">
          <Link
            to="/eval/methodology"
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-900 hover:underline"
          >
            View detailed methodology — every task, every variant, every observed behavior →
          </Link>
        </p>
      </header>

      <section className="bg-blue-50 border-l-4 border-blue-600 rounded-md p-4 space-y-2">
        <h2 className="text-sm font-bold text-blue-900 uppercase tracking-wide">The headline</h2>
        <p className="text-sm text-gray-800">
          On Multi-Framework, <strong>training data is zero</strong> — the runtime didn't exist
          at training time, so the baseline agent invents non-existent APIs like{' '}
          <code>useGraphQL</code> hooks. A <strong>curated SKILL.md hits 100%</strong>. Bulk
          beta MDX hits 66%. Live retrieval (offered or even directed) is unreliable.
        </p>
        <p className="text-sm text-gray-700">
          The lesson: <strong>hand-curated, agent-targeted content is the only intervention that
          reliably teaches the agent</strong> a runtime it hasn't seen. Bulk docs help some;
          live retrieval helps when directed at the right resource; but curation wins because
          it's terse, in-context, and authored specifically for agents.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Pass rate by variant</h2>
        <div className="bg-white rounded-md border border-gray-200 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Variant</TableHead>
                <TableHead className="hidden md:table-cell">What it tests</TableHead>
                <TableHead className="text-center">Pass rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {VARIANTS.map(v => (
                <TableRow key={v.key} className={v.winner ? 'bg-blue-50' : ''}>
                  <TableCell className="font-medium text-gray-900">{v.label}</TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-gray-600">
                    {v.what}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className={`text-lg font-semibold tabular-nums ${pctClass(v.verdict)}`}>
                      {v.pct}%
                      {v.winner && <span className="ml-1">🏆</span>}
                    </div>
                    <div className="text-xs text-gray-500">{v.fraction}</div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Per-task breakdown</h2>
        <div className="bg-white rounded-md border border-gray-200 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-center text-blue-700">SKILL.md</TableHead>
                <TableHead className="text-center">Beta MDX</TableHead>
                <TableHead className="text-center">Forced fetch</TableHead>
                <TableHead className="text-center">No docs</TableHead>
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
                  <TableCell className="text-center">{fractionCell(row.skill)}</TableCell>
                  <TableCell className="text-center">{fractionCell(row.betaDocs)}</TableCell>
                  <TableCell className="text-center">{fractionCell(row.forced)}</TableCell>
                  <TableCell className="text-center">{fractionCell(row.baseline)}</TableCell>
                  <TableCell className="text-center">{fractionCell(row.webfetch)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-blue-50">
                <TableCell className="font-semibold text-gray-900">Overall</TableCell>
                <TableCell></TableCell>
                <TableCell className="text-center font-bold">{fractionCell('9 / 9')}</TableCell>
                <TableCell className="text-center">{fractionCell('6 / 9')}</TableCell>
                <TableCell className="text-center">{fractionCell('3 / 9')}</TableCell>
                <TableCell className="text-center">{fractionCell('0 / 9')}</TableCell>
                <TableCell className="text-center">{fractionCell('0 / 9')}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-gray-600 mt-3">
          <strong>SKILL.md is the only variant that solves react-router-detail.</strong> The beta
          MDX covers React Router in passing but not end-to-end; the curated SKILL.md includes
          the exact pattern. Forced fetch only worked on the UI bundle scaffold (where AGENT.md
          has direct copy-pasteable examples); on the other tasks the agent fetched but couldn't
          translate to working code in the available turns.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Three findings</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-t-4 border-blue-600">
            <CardHeader>
              <CardTitle className="text-base">
                1. Curated content is the only reliable lift
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-700">
              <p>
                The hand-curated SKILL.md (a 7 KB cheat sheet covering the data SDK,
                GraphQL UIAPI shape, UIBundle metadata, and React Router patterns) scored{' '}
                <strong>100%</strong> across all three tasks. Bulk MDX hit 66%. Live retrieval
                hit 33% at best.
              </p>
              <p className="text-xs text-gray-500">
                The wedge isn't more content; it's the <em>right</em> content, in-context,
                authored for agents.
              </p>
            </CardContent>
          </Card>
          <Card className="border-t-4 border-red-600">
            <CardHeader>
              <CardTitle className="text-base">
                2. Without docs, the agent invents non-existent APIs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-700">
              <p>
                Baseline is <strong>0/9</strong> — not "low," <em>zero</em>. The grader flagged
                runs where the agent generated code using <code>useGraphQL</code> and{' '}
                <code>useQuery</code> hooks: plausible-looking React patterns that don't exist in
                the Salesforce SDK at all.
              </p>
              <p className="text-xs text-gray-500">
                Multi-Framework didn't exist at training time. The training-data fallback that
                rescues agents on established platforms doesn't exist here.
              </p>
            </CardContent>
          </Card>
          <Card className="border-t-4 border-amber-600">
            <CardHeader>
              <CardTitle className="text-base">
                3. Tool availability ≠ tool use
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-700">
              <p>
                The "WebFetch (offered)" variant scored <strong>0%</strong>. The agent had
                WebFetch and a prompt suggesting it use it. Transcript audit: most runs never
                called WebFetch at all. The "Forced GitHub fetch" variant did better (33%) only
                because the prompt explicitly directed the fetch.
              </p>
              <p className="text-xs text-gray-500">
                The gap between availability and use is the gap between "we have a docs site"
                and "agents actually read it."
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="border-t border-gray-200 pt-4 text-xs text-gray-500 space-y-1">
        <p>
          <strong>How the eval works:</strong> a markdown rules file (the "SKILL.md") plus a
          set of YAML task specs with explicit PASS/FAIL criteria. Each task × variant × repeat
          combination runs in an isolated cloud sandbox; the agent's output is then scored by
          an LLM-as-judge grader using the task's criteria as the rubric. See the methodology
          page for the SKILL.md format and the per-task criteria lists.
        </p>
        <p>
          <strong>Run:</strong> 3 Multi-Framework tasks × 5 variants × 3 repeats = 45 runs.
          Agents: Claude Sonnet 4.6. Grader: Claude Opus 4.7 (one tier above the agent — standard
          methodology hygiene).
        </p>
        <p>
          <strong>Captured:</strong> 2026-05-18. Findings are directional, not production — a
          real investment would scale to 30+ tasks and add cross-model coverage.
        </p>
      </footer>
    </div>
  );
}
