/**
 * Methodology — the verbose proof-of-work for the AI-readability eval.
 *
 * Shows the actual task prompts, criteria, variant configurations, tool
 * usage audit, and sample transcripts that produced the numbers on the
 * /eval page. Linked from /eval as the "show me the receipts" detail view.
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

interface TaskSpec {
  id: string;
  category: string;
  intent: string;
  criteriaPass: string[];
  criteriaFail: string[];
  requiredStrings: string[];
}

const TASKS: TaskSpec[] = [
  {
    id: 'mfw-graphql-account-query',
    category: 'Data SDK',
    intent:
      'Write a React component for Salesforce Multi-Framework that uses the `@salesforce/sdk-data` package to query the top 10 Accounts by `AnnualRevenue` (descending) via GraphQL UIAPI, and renders them in a list with Name and AnnualRevenue. Output the complete `.tsx` file at `src/pages/TopAccounts.tsx`.',
    criteriaPass: [
      'Imports `createDataSDK` and `gql` from `@salesforce/sdk-data`',
      'Defines a GraphQL query wrapped in the `gql` template literal',
      'Query namespace is `uiapi.query.Account` (not raw `Account` at top level)',
      '`orderBy` with `AnnualRevenue` descending',
      'Limits to 10 results (`first: 10` or equivalent)',
      'Fields unwrapped via `.value` (e.g., `Name { value }` or `node.Name.value`)',
      'Calls `createDataSDK()` and invokes `.graphql?.()` on the result',
      'Response destructured from the `edges[].node` shape',
    ],
    criteriaFail: [
      'Uses raw `fetch()` or `axios` against Salesforce',
      'Skips the `uiapi.query.*` namespace wrapping',
      'Accesses `node.Name` instead of `node.Name.value`',
      'Hardcodes account data instead of querying',
      'Omits the `.graphql?.()` optional-chaining call signature',
    ],
    requiredStrings: ['createDataSDK', 'gql', 'uiapi', 'Account', 'AnnualRevenue', 'edges', '.value'],
  },
  {
    id: 'mfw-ui-bundle-scaffold',
    category: 'Metadata',
    intent:
      'Output the contents of two metadata files required for a new Salesforce Multi-Framework UI Bundle named `MyAccountsApp`: (1) `MyAccountsApp.uibundle-meta.xml` (Salesforce metadata) and (2) `ui-bundle.json` (app configuration). Output both files in full.',
    criteriaPass: [
      '`.uibundle-meta.xml` is valid XML with a `<UIBundle>` root element',
      'Root element has namespace `xmlns="http://soap.sforce.com/2006/04/metadata"`',
      'Includes a `<masterLabel>` element (non-empty text)',
      'Includes `<isActive>true</isActive>` or equivalent active-state declaration',
      '`ui-bundle.json` is valid JSON',
      'JSON includes an `outputDir` key (typical: `"dist"`)',
      'JSON includes a `routing` object with at least one routing setting',
    ],
    criteriaFail: [
      'Wrong root element name (e.g., `<LightningComponentBundle>` from LWC)',
      'Omits the SFDC metadata namespace from the XML',
      'Omits the `outputDir` from the JSON',
      'Omits all routing config',
    ],
    requiredStrings: ['<UIBundle', 'soap.sforce.com/2006/04/metadata', 'masterLabel', 'outputDir', 'routing'],
  },
  {
    id: 'mfw-react-router-detail',
    category: 'Routing',
    intent:
      'Write a React Router 7 route configuration plus a detail page component for a Salesforce Multi-Framework app. The route should match `/accounts/:id`, use `useParams` to extract the AccountId, and render a component that queries the matching Account (Name, AnnualRevenue) via a parameterized GraphQL query. Output `src/routes.tsx` and `src/pages/Account.tsx`.',
    criteriaPass: [
      '`src/routes.tsx` declares a route with `path: \'accounts/:id\'`',
      'The route\'s element renders the Account detail component',
      '`src/pages/Account.tsx` imports `useParams` from `react-router`',
      'Detail component calls `useParams()` to read the `id` URL parameter',
      'Defines a GraphQL query with the variable `$accountId: ID!`',
      'Query uses `where: { Id: { eq: $accountId } }`',
      'Query invoked via `dataSdk.graphql?.()` with the `accountId` variable',
      'Fields unwrapped via the `.value` accessor',
    ],
    criteriaFail: [
      'Hardcodes the Account Id instead of using `useParams`',
      'Uses a non-parameterized query',
      'Skips the `uiapi.query.*` namespace',
      'Calls raw `fetch()` instead of the data SDK',
    ],
    requiredStrings: ['useParams', 'react-router', '$accountId', 'uiapi', 'where', 'Id:'],
  },
];

interface VariantSpec {
  key: string;
  label: string;
  promptPrefix: string;
  allowedTools: string;
  observed: string;
}

const VARIANTS: VariantSpec[] = [
  {
    key: 'without-skill',
    label: 'No docs (baseline)',
    promptPrefix: '(none — task intent only)',
    allowedTools: 'Bash, Read, Write, Edit',
    observed:
      'Zero network calls. Only Write (the answer file). Pure training-data behavior — and Multi-Framework didn\'t exist at training time, so the agent fabricates non-existent APIs (e.g., `useGraphQL` and `useQuery` hooks that don\'t exist in the Salesforce SDK). 0/9 pass.',
  },
  {
    key: 'with-skill',
    label: 'Curated SKILL.md',
    promptPrefix: '"Use the /{skill-name} skill. {intent}"',
    allowedTools: 'Bash, Read, Write, Edit, Skill, ToolSearch',
    observed:
      'Loads the hand-curated 7 KB Multi-Framework SKILL.md from `.claude/skills/multiframework/SKILL.md` into the agent\'s context. Contains the data SDK patterns, GraphQL UIAPI shape, UIBundle metadata, and React Router idioms. The only variant that solves all 3 tasks. 9/9 pass.',
  },
  {
    key: 'with-docs',
    label: 'Beta MDX prepended',
    promptPrefix:
      '"{docs_context}{intent}" — the 97 KB trimmed `SalesforceBEtaDocs_trimmed.md` is prepended to the prompt via the task\'s `context_refs`.',
    allowedTools: 'Bash, Read, Write, Edit',
    observed:
      'Helped for graphql-account-query and ui-bundle-scaffold (3/3 each) but failed on react-router-detail (0/3 — the routing patterns are mentioned in the MDX but not demonstrated end-to-end). 6/9 overall.',
  },
  {
    key: 'with-docs-fetch',
    label: 'WebFetch (offered)',
    promptPrefix:
      '"You have access to the `WebFetch` tool. If the docs site for the SDK you are working with has an `llms.txt` index, use it. {intent}"',
    allowedTools: 'Bash, Read, Write, Edit, WebFetch',
    observed:
      'The agent occasionally tried to fetch but couldn\'t reach a useful target — `developer.salesforce.com` 403s automated traffic. Without a fallback target, the agent fell back to fabricating APIs same as baseline. 0/9 pass.',
  },
  {
    key: 'with-fetch-forced',
    label: 'Forced GitHub fetch',
    promptPrefix:
      '"Before writing any code, use WebFetch to retrieve and read https://raw.githubusercontent.com/trailheadapps/multiframework-recipes/main/AGENT.md. Then complete the task."',
    allowedTools: 'Bash, Read, Write, Edit, WebFetch',
    observed:
      '6/9 runs fetched the AGENT.md successfully, but only the UI bundle scaffold task translated to working code (3/3). On graphql-account-query and react-router-detail, the agent fetched but couldn\'t convert the discovered patterns into correct code in the available turns. 3/9 overall.',
  },
  {
    key: 'without-tools',
    label: 'Tightest baseline',
    promptPrefix: '(none — task intent only)',
    allowedTools: 'Read, Write (Bash leaked in practice)',
    observed:
      'Attempted to lock down to Read+Write only via `--allowedTools` patch; Bash still leaked at runtime, used only for `mkdir` (no network calls). On Multi-Framework tasks the restricted toolset performed identically to the standard baseline (0/9) — training data alone can\'t produce correct Multi-Framework code regardless of tool availability.',
  },
  {
    key: 'with-docs-mcp',
    label: 'MCP server',
    promptPrefix:
      '"You have access to the `search-docs` tool from the docs MCP server. Use it to look up anything you\'re not sure about. {intent}"',
    allowedTools: 'Bash, Read, Write, Edit, mcp__search-docs',
    observed:
      'Excluded from final results. The harness defaulted to a non-Salesforce MCP server, so this variant tested the wrong corpus and isn\'t a clean measurement. There is no public MCP server for Salesforce developer docs as of the test date.',
  },
];

function MfBadge() {
  return (
    <span className="text-xs uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
      Multi-Framework
    </span>
  );
}

export default function Methodology() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <header className="space-y-2">
        <Link to="/eval" className="text-sm text-blue-700 hover:underline">
          ← Back to eval summary
        </Link>
        <h1 className="text-3xl font-semibold text-gray-900">
          Eval Methodology — what we actually tested
        </h1>
        <p className="text-sm text-gray-600 max-w-3xl">
          The detailed proof-of-work behind the numbers on the eval summary
          page. Every task, every variant, every observed behavior — captured
          across 54 displayed runs on Claude Sonnet 4.6.
        </p>
      </header>

      <section className="bg-gray-50 border-l-4 border-gray-400 rounded-md p-4 text-sm text-gray-800">
        <p>
          <strong>How the eval works:</strong> an eval harness that runs each task × variant ×
          repeat combination in an isolated cloud sandbox (parallel execution), then scores each
          agent transcript with an LLM-as-judge grader using the task's explicit PASS/FAIL
          criteria as the rubric.
          <br />
          <strong>Suite:</strong> 3 Multi-Framework tasks (React data SDK / UIBundle
          metadata / React Router) authored as a YAML task spec with explicit PASS/FAIL criteria.
          <br />
          <strong>Variants:</strong> 7 documentation conditions (6 in displayed results — MCP
          variant excluded due to wrong-corpus issue, see Variants section).
          <br />
          <strong>Repeats:</strong> 3 per task × variant pair. Each scored independently by the
          grader.
          <br />
          <strong>Total displayed:</strong> 54 runs, $3.32 on Claude Sonnet 4.6, captured 2026-05-18.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">The six tasks</h2>
        <div className="space-y-4">
          {TASKS.map(task => (
            <Card key={task.id}>
              <CardHeader>
                <div className="flex items-center gap-3 mb-1">
                  <MfBadge />
                  <span className="text-xs uppercase tracking-wide text-gray-500">
                    {task.category}
                  </span>
                </div>
                <CardTitle className="text-base font-mono">{task.id}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <h4 className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-1">
                    Task intent (the exact prompt the agent received)
                  </h4>
                  <p className="text-gray-800 italic leading-relaxed bg-gray-50 p-3 rounded border-l-2 border-gray-300">
                    {task.intent}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs uppercase tracking-wide text-green-700 font-semibold mb-1">
                      Pass criteria
                    </h4>
                    <ul className="text-xs text-gray-700 space-y-0.5 list-disc list-inside">
                      {task.criteriaPass.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs uppercase tracking-wide text-red-700 font-semibold mb-1">
                      Fail conditions
                    </h4>
                    <ul className="text-xs text-gray-700 space-y-0.5 list-disc list-inside">
                      {task.criteriaFail.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-1">
                    Required string presence (deterministic anchor checks)
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {task.requiredStrings.map(s => (
                      <code key={s} className="text-xs bg-blue-50 text-blue-900 px-2 py-0.5 rounded">
                        {s}
                      </code>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">The seven variants</h2>
        <p className="text-sm text-gray-600 mb-4">
          Each variant configures the agent differently — the prompt prefix, the allowed tools,
          and the surrounding context. The whole point of the eval is to isolate which
          configurations actually move outcomes vs which look like they should but don't.
        </p>
        <div className="bg-white rounded-md border border-gray-200 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/6">Variant</TableHead>
                <TableHead className="w-1/3">Prompt prefix</TableHead>
                <TableHead className="w-1/6">Allowed tools</TableHead>
                <TableHead className="w-1/3">Observed behavior (from transcript audit)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {VARIANTS.map(v => (
                <TableRow key={v.key}>
                  <TableCell>
                    <div className="font-semibold text-gray-900">{v.label}</div>
                    <code className="text-xs text-gray-500">{v.key}</code>
                  </TableCell>
                  <TableCell className="text-xs text-gray-700 italic leading-relaxed">
                    {v.promptPrefix}
                  </TableCell>
                  <TableCell>
                    <code className="text-xs text-gray-700">{v.allowedTools}</code>
                  </TableCell>
                  <TableCell className="text-xs text-gray-700 leading-relaxed">
                    {v.observed}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Sample transcripts — what the grader actually read
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          One example of a successful Multi-Framework run vs a failed one. Both are real outputs
          from the eval, lightly trimmed. The contrast is the answer to "why does curation matter?"
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-t-4 border-green-600">
            <CardHeader>
              <div className="flex items-center gap-2 mb-1">
                <MfBadge />
                <span className="text-xs uppercase tracking-wide text-green-700 font-bold">PASS</span>
              </div>
              <CardTitle className="text-base">
                mfw-graphql-account-query <span className="text-gray-500">with-skill</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-600 mb-2">
                Output (excerpt) — agent used the SDK pattern from SKILL.md verbatim:
              </p>
              <pre className="text-xs bg-gray-50 border border-gray-200 rounded p-3 overflow-x-auto leading-relaxed">
{`import { createDataSDK, gql } from '@salesforce/sdk-data';

const QUERY = gql\`
  query TopAccounts {
    uiapi {
      query {
        Account(
          orderBy: { AnnualRevenue: { order: DESC } }
          first: 10
        ) {
          edges {
            node {
              Id
              Name { value }
              AnnualRevenue { value }
            }
          }
        }
      }
    }
  }
\`;

export default function TopAccounts() {
  const [accounts, setAccounts] = useState([]);
  useEffect(() => {
    (async () => {
      const sdk = await createDataSDK();
      const r = await sdk.graphql?.(QUERY);
      const rows = r?.data?.uiapi?.query?.Account?.edges
        ?.map(e => ({ id: e.node.Id, name: e.node.Name.value, ... }));
      setAccounts(rows ?? []);
    })();
  }, []);
  return <Table>...</Table>;
}`}
              </pre>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-red-600">
            <CardHeader>
              <div className="flex items-center gap-2 mb-1">
                <MfBadge />
                <span className="text-xs uppercase tracking-wide text-red-700 font-bold">FAIL</span>
              </div>
              <CardTitle className="text-base">
                mfw-graphql-account-query <span className="text-gray-500">without-skill (baseline)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-600 mb-2">
                Output (excerpt) — agent invented a non-existent <code>useGraphQL</code> hook:
              </p>
              <pre className="text-xs bg-gray-50 border border-gray-200 rounded p-3 overflow-x-auto leading-relaxed">
{`import { useGraphQL } from '@salesforce/data-react';
//  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Both the hook name and the package are fabricated.

const TOP_ACCOUNTS = \`
  SELECT Id, Name, AnnualRevenue
  FROM Account
  ORDER BY AnnualRevenue DESC
  LIMIT 10
\`;
// (This is SOQL, not GraphQL — the agent confused
// the two query languages entirely.)

export default function TopAccounts() {
  const { data, loading } = useGraphQL(TOP_ACCOUNTS);
  // ...
}`}
              </pre>
              <p className="text-xs text-gray-600 mt-3">
                <strong>Grader reasoning:</strong> "The agent used a non-existent{' '}
                <code>useGraphQL</code> hook pattern instead of the documented{' '}
                <code>createDataSDK</code> + <code>gql</code> + <code>dataSdk.graphql?.()</code>{' '}
                pattern. The skill reference explicitly documents this."
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Methodology footnotes (the gotchas worth surfacing)
        </h2>
        <div className="space-y-3 text-sm text-gray-800">
          <Card>
            <CardContent className="pt-6 space-y-2">
              <p>
                <strong>The WebFetch variant rarely succeeds.</strong> Sonnet often skips
                offered tools entirely when it judges a task as solvable from training data
                alone. On Multi-Framework tasks, where training data is genuinely empty, the
                agent sometimes did attempt to fetch — but `developer.salesforce.com` returns
                403 to automated traffic, so the fetch failed and the agent fell back to
                fabricating APIs same as the baseline. Lesson: tool availability ≠ tool use,
                and even when used, the target has to be reachable.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 space-y-2">
              <p>
                <strong>The baseline doesn't leak.</strong> A methodology audit verified that the
                "no docs" baseline runs produce zero <code>curl</code>, zero <code>gh</code>, and
                zero <code>WebFetch</code> calls. Only Write (creating the answer file). The 0%
                baseline on Multi-Framework is genuinely pure-training-data behavior — no covert
                GitHub access via shell. The agent simply doesn't have the knowledge.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 space-y-2">
              <p>
                <strong>The MCP variant tested the wrong corpus.</strong> The harness defaults the
                MCP server name to a non-Salesforce server, so the MCP variant against Salesforce
                tasks was querying a corpus that doesn't contain Salesforce content. Excluded
                from displayed results because it isn't a clean measurement.{' '}
                <strong>There is no public MCP server for Salesforce developer docs as of this
                test date</strong> — a real gap in the AI-readability surface that a docs team
                could close in a quarter.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 space-y-2">
              <p>
                <strong>Multi-file tasks (react-router, ui-bundle-scaffold) sometimes truncate.</strong> The
                Write tool call occasionally got cut off mid-content on tasks requiring multiple
                files. This is a harness limit, not a docs effect — but it depresses pass rates
                for variants that happen to draw the truncated runs. Worth knowing when reading
                fractional scores.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 space-y-2">
              <p>
                <strong>Grader was Claude Sonnet 4.6 with explicit criteria.</strong> The
                LLM-as-judge grader received the task intent, the PASS/FAIL criteria, the agent's
                full conversation, any files in the work directory, and a calibration example. It
                returned a structured grade plus reasoning. Costs ~$0.005 per grading call. Same
                grader across all variants and surfaces to keep scoring consistent.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">How the eval is structured</h2>
        <p className="text-sm text-gray-600 mb-4">
          The eval reduces to three artifact types — a markdown rules file, a YAML task spec,
          and a per-run transcript. Everything else (sandbox orchestration, parallel execution,
          grading) is mechanical once those three are in place.
        </p>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">1. The SKILL.md — agent rules as markdown</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-700 space-y-2">
              <p>
                A hand-curated markdown file at{' '}
                <code>.claude/skills/&lt;name&gt;/SKILL.md</code> that encodes the patterns,
                idioms, and pitfalls an agent should follow when solving tasks in this domain.
                For Multi-Framework that's ~7 KB covering the data SDK, GraphQL UIAPI shape,
                UIBundle metadata, and React Router patterns.
              </p>
              <pre className="text-xs bg-gray-50 border border-gray-200 rounded p-3 overflow-x-auto leading-relaxed">
{`# Salesforce Multi-Framework Developer Skill

## The data SDK (the single most important pattern)

\`\`\`typescript
import { createDataSDK, gql } from '@salesforce/sdk-data';

const QUERY = gql\`
  query SingleContact {
    uiapi {
      query {
        Contact(first: 1) {
          edges { node { Id Name { value } } }
        }
      }
    }
  }
\`;

const dataSdk = await createDataSDK();
const result = await dataSdk.graphql?.(QUERY);
\`\`\`

## Pitfalls to avoid
- ❌ Calling raw \`fetch()\` for a Salesforce endpoint
- ❌ Forgetting \`.value\` — \`node.Name\` is the wrapper, not the value
- ...`}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">2. The task YAML — intent + criteria</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-700 space-y-2">
              <p>
                Each task spec declares the prompt the agent receives, the PASS criteria the
                grader checks, the FAIL conditions that disqualify, and a list of
                required-string anchors for deterministic spot-checks.
              </p>
              <pre className="text-xs bg-gray-50 border border-gray-200 rounded p-3 overflow-x-auto leading-relaxed">
{`tasks:
  - id: mfw-graphql-account-query
    intent: |
      Write a React component for Salesforce Multi-Framework
      that uses the @salesforce/sdk-data package to query the
      top 10 Accounts by AnnualRevenue (descending) via
      GraphQL UIAPI...
    category: mfw-data
    ground_truth:
      context_refs:
        - SalesforceBEtaDocs_trimmed.md
      criteria: |
        PASS requires:
        - Imports \`createDataSDK\` and \`gql\` from \`@salesforce/sdk-data\`
        - Query namespace is \`uiapi.query.Account\`
        - Fields unwrapped via \`.value\`
        ...
      commands:
        - "createDataSDK"
        - "gql"
        - "uiapi"
        - ".value"`}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">3. The harness loop</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-700">
              <ol className="list-decimal list-inside space-y-1">
                <li>For each <code>(task, variant, repeat)</code> tuple, spin up a fresh sandbox.</li>
                <li>
                  Construct the agent's prompt: <code>variant.promptPrefix + task.intent</code>.
                  Configure allowed tools per the variant's spec.
                </li>
                <li>Run the agent. Capture the full conversation transcript as markdown.</li>
                <li>
                  Hand the transcript + the task's PASS/FAIL criteria + a calibration example to
                  an LLM-as-judge grader. The grader returns a structured pass/fail plus
                  reasoning.
                </li>
                <li>
                  Aggregate by variant and per-task. Audit transcripts for tool-usage patterns
                  (which variants actually called what tools, what URLs they fetched, etc.) to
                  catch findings the aggregate score would hide.
                </li>
              </ol>
            </CardContent>
          </Card>
        </div>
        <p className="text-xs text-gray-600 mt-4">
          Source artifacts: <code>tasks/multiframework.yaml</code> (the task spec) +
          <code>.claude/skills/multiframework/SKILL.md</code> (the rules file). Total cost: $3.32
          for the displayed 54 runs across 6 variants.
        </p>
      </section>

      <footer className="border-t border-gray-200 pt-4 text-xs text-gray-500">
        Captured 2026-05-18. Claude Sonnet 4.6. Isolated cloud sandboxes (parallel execution).
        All transcripts saved as markdown per run. Numbers are directional, not production — a
        real investment would scale to 30+ Multi-Framework tasks and add cross-model coverage.
      </footer>
    </div>
  );
}
