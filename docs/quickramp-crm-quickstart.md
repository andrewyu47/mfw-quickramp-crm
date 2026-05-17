# Build a CRM-Style React App with Multi-Framework (Beta)

> **Beta Feature.** This feature is a beta service that is subject to the Beta Services Terms at Agreements - Salesforce.com or a written Unified Pilot Agreement, if executed by Customer, and applicable terms in the Product Terms Directory. Use of this beta service is at the Customer's sole discretion. The Non-GA Services are used in conjunction with GA Services which consume paid credits or entitlements ("entitlements"). Any corresponding consumption of entitlements arising from Customer's use of the Non-GA Services shall not give rise to any refund or credit rights.

This quickstart walks you through building a customer-management dashboard in React, deployed natively on the Agentforce 360 Platform using Salesforce Multi-Framework (Beta). The finished app — *QuickRamp CRM* — lists customer healthcare orgs (Accounts) and lets a user drill into each one to see the clinicians (Contacts) being onboarded there. By the end you'll have a working `UIBundle` running in your scratch org, deployed via the standard `sf` CLI.

The app exercises three of the core Multi-Framework APIs in one self-contained example: `createDataSDK`, a GraphQL UIAPI query with `where` filters and `orderBy`, and a parameterized GraphQL query with the `$accountId` URL variable.

## What You'll Build

A two-page React app inside a `UIBundle` metadata package:

- **Customer Clinics** — Lists the top 10 Accounts where `Industry = "Healthcare"`, sorted by `NumberOfEmployees` descending, rendered as a clickable shadcn `<Table>`.
- **Clinic detail** — A dynamic route at `/clinics/:id` that queries the selected Account plus all related Contacts in a single GraphQL request, rendered as a shadcn `<Card>` plus a clinician roster.

The repository structure follows the standard Multi-Framework layout:

```
top-accounts/
└── force-app/main/default/uiBundles/QuickRampCRM/
    ├── QuickRampCRM.uibundle-meta.xml
    ├── ui-bundle.json
    ├── package.json
    └── src/
        ├── api/graphqlClient.ts        (executeGraphQL helper)
        ├── pages/Clinics.tsx           (list view)
        ├── pages/Clinic.tsx            (detail view)
        └── routes.tsx                  (React Router config)
```

## Before You Begin

You need the following:

- **Salesforce CLI v2.130.7 or later** with the `@salesforce/plugin-ui-bundle-dev` plugin installed.
- **Node.js v22 or later.**
- **An authenticated Dev Hub** (see *Set Up a Free Dev Hub* in the Multi-Framework Developer Guide).
- **A scratch org with Multi-Framework enabled.**

> **Important.** Enabling Multi-Framework in an org is a **one-way switch** — once enabled, it cannot be disabled. Enable it only in scratch orgs and sandboxes you intend to keep, never in your Dev Hub or any production org.

### Enable Multi-Framework declaratively in the scratch-org definition

The cleanest pattern is to enable Multi-Framework when the scratch org is created, rather than toggling it post-hoc through the Setup UI. Add the `UIBundleSettings.webAppOptIn` setting to your `config/project-scratch-def.json`:

```json
{
  "orgName": "QuickRamp CRM Demo",
  "edition": "developer",
  "language": "en_US",
  "features": ["EnableSetPasswordInApi"],
  "settings": {
    "lightningExperienceSettings": { "enableS1DesktopEnabled": true },
    "UIBundleSettings": { "webAppOptIn": true },
    "mobileSettings": { "enableS1EncryptedStoragePref2": false }
  }
}
```

> **Note.** The `"language": "en_US"` setting is required. As of the beta, Multi-Framework apps do not render correctly in orgs whose default language is not English.

## Steps

### 1. Create the DX Project and Scratch Org

```bash
sf project generate --name top-accounts --template standard
cd top-accounts
# Edit config/project-scratch-def.json to add UIBundleSettings.webAppOptIn
sf org create scratch -f config/project-scratch-def.json \
   --alias mfw-scratch --duration-days 30 --set-default
```

Expected output: `Your scratch org is ready.` along with the new org's username and 15-character Org Id. The scratch org is now automatically authenticated and set as your default for subsequent CLI commands.

### 2. Generate the React Application

```bash
sf template generate ui-bundle \
   --name QuickRampCRM \
   --output-dir force-app/main/default/uiBundles \
   --template reactbasic
cd force-app/main/default/uiBundles/QuickRampCRM
npm install
```

This generates a complete Vite + React + TypeScript project preconfigured with the Salesforce Multi-Framework SDK (`@salesforce/sdk-data`), shadcn/ui, Tailwind CSS, Vitest, and a React Router scaffold.

### 3. Seed Sample Data

For QuickRamp CRM, seed your scratch org with 10 healthcare-industry Accounts and a handful of related Contacts. Use `sf data import tree` with a plan file that resolves the parent-child relationships:

```bash
sf data import tree --plan data/quickramp-plan.json --target-org mfw-scratch
```

### 4. Deploy and Open

From the DX project root:

```bash
cd ../../../../..
npm run build
sf project deploy start --target-org mfw-scratch
sf org open --target-org mfw-scratch
```

In the scratch-org browser tab, click the **App Launcher** (the 9-dot grid in the top-left), search for **QuickRamp**, and select the app.

## The GraphQL Query, Annotated

The list-view query in `src/pages/Clinics.tsx` is a good example of the canonical Multi-Framework data shape:

```graphql
query TopClinics {
  uiapi {
    query {
      Account(
        where: { Industry: { eq: "Healthcare" } }
        orderBy: { NumberOfEmployees: { order: DESC, nulls: LAST } }
        first: 10
      ) {
        edges {
          node {
            Id
            Name { value }
            BillingCity { value }
            NumberOfEmployees { value }
          }
        }
      }
    }
  }
}
```

Three things to notice about the response shape, because each is non-obvious the first time you see it:

- **Every query is namespaced under `uiapi.query`.** The same GraphQL endpoint can route to other services in the future; today, all record queries live under the `uiapi` namespace.
- **Results use the Relay-style `edges → node` wrapper.** Each row is a `node`; `edges` is the list of rows. This shape is identical across every SObject.
- **Every scalar field is wrapped in `{ value }`.** This is the most common source of *"why is my field undefined"* — `node.Name.value`, not `node.Name`. The `value` accessor exists because the platform also surfaces field-level metadata (display label, format, formula source) on the same shape; values live under their own key to keep the type system clean.

The component flattens this nested shape into a simple `ClinicRow` interface before passing it to the `<Table>` — a recommended pattern that keeps the render code free of `?.value` chains.

## Why GraphQL, Not Raw fetch()

When you need data from Salesforce inside a Multi-Framework React app, the SDK provides a documented preference order. Follow it in this priority:

1. **`dataSdk.graphql?.()`** — GraphQL queries and mutations. The preferred path for record CRUD against any standard or custom SObject.
2. **`dataSdk.fetch?.()` against UI API REST** — when you need an endpoint not exposed via GraphQL, for example `/services/data/v{v}/ui-api/object-info/Account`.
3. **`dataSdk.fetch?.()` for GraphQL via GET** — for GET-only requirements or CSRF token roundtrips.
4. **`dataSdk.fetch?.()` against an Apex REST endpoint** — for custom server-side logic that GraphQL does not support.

Do not call the browser's native `fetch()` or `axios` directly against Salesforce endpoints. The data SDK's `fetch?.()` wrapper handles CSRF token management, base-path resolution, and 401/403 callback hooks. Calling fetch directly bypasses all three and will break authentication for any user beyond the scratch-org owner.

The optional chaining (`graphql?.`, `fetch?.`) is required, not stylistic. Some runtime environments do not expose the GraphQL endpoint; optional chaining lets the same SDK code degrade gracefully in those contexts.

## Limitations

- **Scratch orgs and sandboxes only.** Multi-Framework is not yet available in Developer Edition orgs, Trailhead Playgrounds, or production orgs. General availability is planned.
- **English-language orgs only.** As of the beta, Multi-Framework apps do not render correctly in orgs whose default language is not `en_US`. The scratch-org definition above sets this explicitly.
- **No drag-and-drop in Lightning App Builder.** React UI Bundles cannot yet be placed on Lightning record pages through App Builder. Planned for GA.
- **Cannot deploy beta apps to production.** Deployments are blocked at the platform level until GA.
- **Micro-frontend embedding** of React components into Lightning pages is a separate roadmap item, in closed pilot for Spring 2027.

## See Also

- **Source code:** [github.com/andrewyu47/mfw-quickramp-crm](https://github.com/andrewyu47/mfw-quickramp-crm)
- *Multi-Framework Developer Guide (Beta)* — Setup, API reference, known limitations
- *trailheadapps/multiframework-recipes* — 20+ working code samples on GitHub
- *Agentforce Vibes* — generate Multi-Framework React apps from natural-language prompts

---

*May 2026 &middot; Written alongside a working `UIBundle` deployment to verify every step.*
