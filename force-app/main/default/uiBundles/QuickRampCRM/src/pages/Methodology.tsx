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
  surface: 'GA' | 'MF';
  category: string;
  intent: string;
  criteriaPass: string[];
  criteriaFail: string[];
  requiredStrings: string[];
}

const TASKS: TaskSpec[] = [
  {
    id: 'apex-account-trigger',
    surface: 'GA',
    category: 'Apex',
    intent:
      'Write an Apex trigger named `AccountLogger` that fires after Account insert. For each newly inserted Account, write a debug log entry containing the Account\'s Name and Id. Output the complete trigger file as it would live at `force-app/main/default/triggers/AccountLogger.trigger`.',
    criteriaPass: [
      'File is a `.trigger` declaration (not an Apex class)',
      'Trigger is named `AccountLogger`',
      'Fires `after insert` on `Account`',
      'Iterates over `Trigger.new` as a collection (loop, not single-record access)',
      'Calls `System.debug(...)` with both the Account\'s Name and Id',
      'No DML or SOQL inside the loop (bulk-safe)',
    ],
    criteriaFail: [
      'Uses `before insert` or any context other than `after insert`',
      'Assumes a single record (e.g., `Trigger.new[0]` without a loop)',
      'Performs DML or SOQL statements inside the `for` loop',
      'Uses an Apex class instead of a `.trigger` file',
      'Hardcodes an Account Id',
    ],
    requiredStrings: [
      'trigger AccountLogger on Account (after insert)',
      'for (Account',
      'Trigger.new',
      'System.debug',
    ],
  },
  {
    id: 'lwc-contact-list',
    surface: 'GA',
    category: 'LWC',
    intent:
      'Write a Lightning Web Component named `contactList`. The component exposes a public `accountId` property and displays a list of contact names belonging to that account. When `accountId` changes, the list should re-render automatically. Output all three files (js, html, js-meta.xml). Assume an Apex method `ContactController.getContacts(Id accountId)` exists, annotated `@AuraEnabled(cacheable=true)`.',
    criteriaPass: [
      'JS file imports `LightningElement`, `api`, and `wire` from `lwc`',
      'JS imports `getContacts` from `@salesforce/apex/ContactController.getContacts`',
      'Declares `@api accountId` as a public reactive property',
      'Uses `@wire(getContacts, { accountId: \'$accountId\' })` so the call re-fires on change',
      'HTML template uses `for:each` with a `key` attribute',
      'Meta XML declares an `apiVersion`, `isExposed: true`, and at least one target',
    ],
    criteriaFail: [
      'Uses `@track` on the `accountId` primitive (deprecated for primitives in modern LWC)',
      'Combines `@track` with `@api` on the same property',
      'Calls Apex imperatively from `connectedCallback()` instead of `@wire`',
      'Missing the `key` attribute on the iterated template element',
    ],
    requiredStrings: ['import { LightningElement', '@api accountId', '@wire(getContacts', 'for:each=', 'key='],
  },
  {
    id: 'soql-recent-opps',
    surface: 'GA',
    category: 'SOQL',
    intent:
      'Write a SOQL query that returns the 10 most recently modified Opportunities, sorted by Amount in descending order. The result must include each Opportunity\'s Account Name via relationship traversal. Output the SOQL query as a single statement.',
    criteriaPass: [
      '`SELECT` clause includes Opportunity Id, Amount, and `Account.Name` via relationship traversal',
      '`FROM Opportunity`',
      '`ORDER BY` includes both `LastModifiedDate DESC` (primary) and `Amount DESC` (secondary)',
      '`LIMIT 10`',
    ],
    criteriaFail: [
      'Missing the relationship traversal (querying `AccountId` instead of `Account.Name`)',
      '`LIMIT` is missing or not equal to 10',
      '`ORDER BY` is missing either `LastModifiedDate DESC` or `Amount DESC`',
      'Uses `SELECT *` (not valid in SOQL)',
    ],
    requiredStrings: ['SELECT', 'Account.Name', 'FROM Opportunity', 'ORDER BY', 'LIMIT 10'],
  },
  {
    id: 'mfw-graphql-account-query',
    surface: 'MF',
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
    surface: 'MF',
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
    surface: 'MF',
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
      'Zero network calls in any of 9 runs. Only Write (the answer file) and Bash (only `mkdir` for the LWC bundle directory). Pure training-data behavior, verified by transcript audit.',
  },
  {
    key: 'with-skill',
    label: 'Curated SKILL.md',
    promptPrefix: '"Use the /{skill-name} skill. {intent}"',
    allowedTools: 'Bash, Read, Write, Edit, Skill, ToolSearch',
    observed:
      'Loads the hand-curated SKILL.md from `.claude/skills/<name>/SKILL.md` into the agent\'s context. On Multi-Framework tasks the SKILL.md is the only variant that solves all 3 tasks (9/9).',
  },
  {
    key: 'with-docs',
    label: 'Beta MDX prepended',
    promptPrefix:
      '"{docs_context}{intent}" — the 97 KB trimmed `SalesforceBEtaDocs_trimmed.md` is prepended to the prompt via the task\'s `context_refs`.',
    allowedTools: 'Bash, Read, Write, Edit',
    observed:
      'On MF tasks, helped for graphql-account-query and ui-bundle-scaffold but failed on react-router-detail (thin coverage of routing patterns in the MDX). On GA tasks, tied with baseline because the model already knows GA — bulk MF context offered no lift.',
  },
  {
    key: 'with-docs-fetch',
    label: 'WebFetch (offered)',
    promptPrefix:
      '"You have access to the `WebFetch` tool. If the docs site for the SDK you are working with has an `llms.txt` index, use it. {intent}"',
    allowedTools: 'Bash, Read, Write, Edit, WebFetch',
    observed:
      'Sonnet declined to fetch on every GA run (audit verified). On MF tasks, the agent occasionally fetched but couldn\'t reach a useful target — `developer.salesforce.com` 403s. 0% on MF, 44% on GA (mostly truncation noise on 3 Apex runs).',
  },
  {
    key: 'with-fetch-forced',
    label: 'Forced GitHub fetch',
    promptPrefix:
      '"Before writing any code, use WebFetch to retrieve and read https://raw.githubusercontent.com/trailheadapps/multiframework-recipes/main/AGENT.md. Then complete the task."',
    allowedTools: 'Bash, Read, Write, Edit, WebFetch',
    observed:
      'On GA: all 9 runs fetched the AGENT.md successfully → 100% pass rate. On MF: 6/9 runs fetched, but only the UI bundle scaffold task completed correctly (33% overall). The agent could discover patterns but couldn\'t always translate them to working code in the time budget.',
  },
  {
    key: 'without-tools',
    label: 'Tightest baseline',
    promptPrefix: '(none — task intent only)',
    allowedTools: 'Read, Write (Bash leaked in practice)',
    observed:
      'Attempted to lock down to Read+Write only via `--allowedTools` patch; Bash still leaked at runtime. Used for `mkdir` operations only — no network calls. Apex 3/3 + SOQL 3/3 from training alone; LWC 0/3 from multi-file output truncation.',
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

function SurfaceBadge({ surface }: { surface: 'GA' | 'MF' }) {
  return (
    <span
      className={`text-xs uppercase tracking-wider font-bold px-2 py-0.5 rounded ${
        surface === 'GA' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-800'
      }`}
    >
      {surface === 'GA' ? 'GA Salesforce' : 'Multi-Framework'}
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
          across 108 runs on Claude Sonnet 4.6.
        </p>
      </header>

      <section className="bg-gray-50 border-l-4 border-gray-400 rounded-md p-4 text-sm text-gray-800">
        <p>
          <strong>Harness:</strong> <code>skill-eval</code> (project-skill-runner), Claude runner,
          Modal sandboxes for parallel execution, LLM-as-judge grader.
          <br />
          <strong>Suites:</strong> 6 tasks total — 3 GA Salesforce (Apex/LWC/SOQL) +
          3 Multi-Framework (React/GraphQL/metadata). Authored as YAML task specs with explicit
          PASS/FAIL criteria.
          <br />
          <strong>Variants:</strong> 7 documentation conditions (6 in displayed results — MCP
          variant excluded due to wrong-corpus issue, see Variants section).
          <br />
          <strong>Repeats:</strong> 3 per task × variant pair. Each scored independently by the
          grader.
          <br />
          <strong>Total displayed:</strong> 108 runs across 3 calendar days (2026-05-15 → 05-18).
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">The six tasks</h2>
        <div className="space-y-4">
          {TASKS.map(task => (
            <Card key={task.id}>
              <CardHeader>
                <div className="flex items-center gap-3 mb-1">
                  <SurfaceBadge surface={task.surface} />
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
                <SurfaceBadge surface="MF" />
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
                <SurfaceBadge surface="MF" />
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
                <strong>The WebFetch variant rarely fetches.</strong> Across 9 GA runs of the
                "WebFetch (offered)" variant, Sonnet called WebFetch zero times. The agent
                evaluated the GA tasks as solvable from training data and skipped the fetch.
                The 44% score on that variant is mostly a truncation artifact from 3 Apex runs
                with mid-write tool cutoffs, not a WAF effect. Lesson: tool availability ≠ tool
                use.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 space-y-2">
              <p>
                <strong>The baseline doesn't leak.</strong> A methodology audit verified that the
                "no docs" baseline runs produce zero <code>curl</code>, zero <code>gh</code>, and
                zero <code>WebFetch</code> calls. Only Write (creating the answer file) and Bash
                (only <code>mkdir</code> for the LWC bundle directory). The 78% GA baseline is
                genuinely pure-training-data behavior — no covert GitHub access via shell.
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
                <strong>Multi-file tasks (LWC, react-router) sometimes truncate.</strong> The
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
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Reproduce it yourself</h2>
        <div className="bg-gray-900 text-gray-100 rounded-md p-4 text-xs font-mono overflow-x-auto space-y-2 leading-relaxed">
          <div># 1. Install the harness</div>
          <div className="text-blue-300">uv tool install project-skill-runner</div>
          <div className="pt-2"># 2. Run the GA suite (5 variants, 45 runs)</div>
          <div className="text-blue-300">
            SKILL_EVAL_CLAUDE_MODEL=sonnet skill-eval run -s salesforce-platform -r claude --remote
            -n 3 -p 5 --grade
          </div>
          <div className="pt-2"># 3. Run the Multi-Framework suite (7 variants, 63 runs)</div>
          <div className="text-blue-300">
            SKILL_EVAL_CLAUDE_MODEL=sonnet skill-eval run -s multiframework -r claude --remote -n 3
            -p 5 --grade
          </div>
          <div className="pt-2"># 4. View results</div>
          <div className="text-blue-300">skill-eval report latest</div>
        </div>
        <p className="text-xs text-gray-600 mt-3">
          Reproducible end-to-end. Task YAMLs at <code>tasks/salesforce-platform.yaml</code> and{' '}
          <code>tasks/multiframework.yaml</code>. Curated skills at{' '}
          <code>.claude/skills/&lt;name&gt;/SKILL.md</code>. Total cost: $7.53 for the displayed 108
          runs.
        </p>
      </section>

      <footer className="border-t border-gray-200 pt-4 text-xs text-gray-500">
        Captured 2026-05-15 → 2026-05-18. Claude Sonnet 4.6. Modal sandboxes (parallel=5). All
        transcripts saved as markdown per run. Numbers are directional, not production — a real
        investment would scale to 30+ tasks per surface and add cross-model coverage.
      </footer>
    </div>
  );
}
