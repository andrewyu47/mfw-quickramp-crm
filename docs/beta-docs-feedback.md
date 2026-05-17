# Three things the Multi-Framework beta docs could explain better

Real friction encountered while building [QuickRamp CRM](../README.md) end-to-end — from `sf project generate` to a working app in the App Launcher — in a single Saturday session. All three are fixable in days, not weeks. Each is the kind of rough edge only a fresh developer (or an AI agent like Agentforce Vibes) following the docs literally would surface.

Each would land cleanly as a small docs PR against the *Develop a React App* page, with the empirical evidence from the build as the rationale.

---

## 1. There is no single sentence that says "your UI Bundle is reached via the App Launcher, not via a direct URL."

**What I did:** After `sf project deploy start` reported `Created: QuickRampCRM` (success), I ran `sf org open --target-org mfw-scratch --path /lightning/n/QuickRampCRM` — the standard Lightning navigation pattern for tabs and custom apps.

**What happened:** `Page does not exist. Enter a valid URL and try again.`

**Why I got it wrong:** Every other type of Lightning artifact (CustomTab, FlexiPage, CustomApplication) is reached via `/lightning/n/<DeveloperName>` or `/lightning/n/<TabName>`. The beta docs don't say *"UI Bundles are different — they don't auto-create a navigable tab, so /lightning/n/ won't work. Use the App Launcher (9-dot grid icon, top-left) and search for your app's masterLabel."* The recipes-repo README does say *"Open the scratch org and select the React Recipes app in App Launcher"* — but that's a passing reference, not an explicit *"the direct URL pattern you're used to does not apply here."*

**The fix:** Add a callout block to the *Deploy a React App* doc page:

> **Note.** UI Bundles do not auto-register as Lightning Tabs. After deploy, reach your app via the App Launcher (the 9-dot grid icon in the top-left of the Lightning Experience header), not via `/lightning/n/<bundle-name>`. To pin your app to the navigation bar in a Lightning App, see *Add a UI Bundle to a Lightning App*.

Three sentences. Eliminates the most predictable "is my deploy broken?" moment for every first-time developer.

---

## 2. The `sf template generate ui-bundle --name` flag silently mangles CamelCase into the rendered `masterLabel`.

**What I did:** Ran `sf template generate ui-bundle --name QuickRampCRM --template reactbasic`.

**What happened:** The generated `QuickRampCRM.uibundle-meta.xml` shipped with `<masterLabel>Quick RampCRM</masterLabel>` — a space silently inserted between "Quick" and "Ramp" based on CamelCase heuristics. The folder name and metadata API name were correct; only the human-readable label was mangled. The first appearance of this label is in the App Launcher search results, where it then displays as *"Quick RampCRM"* — a quality bug in the first moment a developer demos their app to anyone.

**Why I got it wrong:** Nothing in the `sf template generate ui-bundle` output flagged that the label had been transformed from the `--name` flag. The transformation is also asymmetric: `QuickRampCRM` → `Quick RampCRM` is wrong (extra space), but `quickrampcrm` → `Quickrampcrm` (no spaces, wrong capitalization) is also wrong. Neither match the developer's intent.

**The fix:** One of two ways:
- (a) Have the generator preserve the exact `--name` value as the default `masterLabel` and only transform if the user passes a `--label` flag explicitly.
- (b) Add a note to the *Generate a Multi-Framework App* doc: *"The `--name` flag controls the bundle's API name and folder. The generated `masterLabel` (displayed in the App Launcher) is derived from `--name` by splitting CamelCase boundaries. Edit `<bundle>/.uibundle-meta.xml` after generation to set a different display label."*

I'd ship option (b) as the immediate doc fix and open a separate ticket for (a) as the code fix.

---

## 3. The `dataSdk.graphql?.()` TypeScript signature accepts `string`, but `gql` returns... nothing the type system recognizes. Every call site needs a `QUERY as unknown as string` cast.

**What I did:** Followed the SDK's recommended import pattern:

```typescript
import { createDataSDK, gql } from '@salesforce/sdk-data';

const QUERY = gql`query Foo { ... }`;
const sdk = await createDataSDK();
const result = await sdk.graphql?.<MyResponse>(QUERY);  // TypeScript: Argument of type 'TypedDocumentNode' is not assignable to parameter of type 'string'.
```

**What happened:** TypeScript red squiggles. The `gql` template literal returns a typed DocumentNode (or some opaque internal type — the export isn't well-documented), and `dataSdk.graphql?.()` declares its first parameter as `string`. The runtime accepts both fine — the SDK normalizes internally — but the type system has no idea.

**Why it matters:** Every developer's first React component using the data SDK hits this. The workaround is either `QUERY as unknown as string` (an obvious code smell) or to stop using `gql` entirely and pass a raw template literal (loses syntax highlighting and the GraphQL Foundation extension's autocomplete). Neither is what the docs recommend.

This will also hit Agentforce Vibes specifically — coding agents look at the TypeScript signatures first. They'll either insert the cast (and the resulting code looks unprofessional) or revert to plain strings (defeats the purpose of the typed schema-first workflow the docs are explicitly promoting).

**The fix:** Update the `graphql()` overload signature in `@salesforce/sdk-data` to accept `string | DocumentNode | TypedDocumentNode<TData, TVariables>` (the standard GraphQL ecosystem pattern). This is a one-line type fix in the SDK plus a regen of the published types. The runtime already handles both.

In the meantime, the docs should call out the cast explicitly in the *Use the Data SDK* doc page rather than letting every developer discover it independently.

---

## Pattern across all three

Each of these is small, concrete, and produces a measurable lift in time-to-first-success for someone (human or agent) following the docs literally. They're the kind of feedback that can only come from actually building with the docs, not just reading them.

---

*Captured while building [QuickRamp CRM](../README.md) against [Salesforce Multi-Framework (Beta)](https://www.salesforce.com/platform/multi-framework/). May 2026.*
