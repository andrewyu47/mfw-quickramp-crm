# QuickRamp CRM

A two-page React app deployed natively on the Agentforce 360 Platform using **Salesforce Multi-Framework (Beta)** — built in a Saturday afternoon as a hands-on study of the new React-on-Salesforce runtime.

## What it is

A customer-management dashboard a QuickRamp CSM would actually open every morning: a list of customer healthcare orgs (Accounts where `Industry = "Healthcare"`, sorted by clinician count) with drill-through to each clinic's clinicians (Contacts with title, email, phone). Lives entirely inside the scratch org as a `UIBundle`, queries live data via GraphQL UIAPI, and runs under the user's Salesforce session permissions automatically.

## Stack

- **Runtime:** Salesforce Multi-Framework (Beta) on the Agentforce 360 Platform
- **Frontend:** React 19 + TypeScript + Vite + Tailwind + shadcn/ui
- **Data:** `@salesforce/sdk-data` + GraphQL UIAPI (no raw REST, no manual auth)
- **Routing:** React Router 7 with route params for the detail page
- **Deploy:** `sf project deploy start` — pure metadata, no separate build pipeline

## What's in here

```
top-accounts/
├── config/project-scratch-def.json            # Multi-Framework enabled via UIBundleSettings.webAppOptIn
├── data/accounts.json + contacts.json         # 10 healthcare orgs + 22 clinicians
├── data/quickramp-plan.json                   # sf data import tree plan
└── force-app/main/default/uiBundles/QuickRampCRM/
    ├── QuickRampCRM.uibundle-meta.xml
    ├── ui-bundle.json                          # routing + SPA fallback config
    └── src/
        ├── api/graphqlClient.ts                # executeGraphQL helper around createDataSDK
        ├── routes.tsx                          # React Router config with /clinics + /clinics/:id
        ├── pages/Home.tsx
        ├── pages/Clinics.tsx                   # List view — GraphQL TopClinics query
        └── pages/Clinic.tsx                    # Detail — parameterized ClinicDetail query
```

## Quickstart

Assumes a Dev Hub already authorized. From scratch:

```bash
# 1. Install the CLI + plugin
npm install -g @salesforce/cli
sf plugins install @salesforce/plugin-ui-bundle-dev

# 2. Authorize a Dev Hub (one-time)
sf org login web --set-default-dev-hub --alias DevHub

# 3. Clone this repo
git clone https://github.com/andrewyu47/mfw-quickramp-crm.git
cd mfw-quickramp-crm

# 4. Spin a fresh scratch org with Multi-Framework auto-enabled
sf org create scratch -f config/project-scratch-def.json \
   --alias mfw-scratch --duration-days 30 --set-default

# 5. Seed sample data + install + build the React app
sf data import tree --plan data/quickramp-plan.json --target-org mfw-scratch
cd force-app/main/default/uiBundles/QuickRampCRM
npm install
npm run build

# 6. Deploy and open
cd ../../../../..
sf project deploy start --target-org mfw-scratch
sf org open --target-org mfw-scratch
```

Open the **App Launcher** (9-dot grid, top-left), search "QuickRamp," click in. Navigate to **Customer Clinics** from the hamburger menu.

## Companion docs

A docs page in the Salesforce Multi-Framework beta-docs house voice — written alongside the build to capture every step at the resolution a real customer would need:

→ **[`docs/quickramp-crm-quickstart.md`](./docs/quickramp-crm-quickstart.md)**

## Three things the beta docs could explain better

Real friction encountered while building this app, all fixable in days:

→ **[`docs/beta-docs-feedback.md`](./docs/beta-docs-feedback.md)**

## The interesting parts (for code reviewers)

- **`src/pages/Clinics.tsx`** — inline `gql` template literal, explicit response interface, the canonical `edges → node → { value }` unwrap pattern. Recipes-repo style: query lives in the same file as the component that uses it.
- **`src/pages/Clinic.tsx`** — same shape, but with a GraphQL variable (`$accountId: ID!`) bound from the URL via `useParams`, plus two queries (Account + Contacts) in a single GraphQL request.
- **`config/project-scratch-def.json`** — the cleanest way to enable Multi-Framework in a scratch org is the `UIBundleSettings.webAppOptIn: true` setting, not a feature flag. The recipes repo uses the same pattern.

## Why this exists

A hands-on study of the Multi-Framework runtime — built to learn the data SDK, the UIBundle deploy loop, and the GraphQL UIAPI patterns by actually using them, and to ship the same shape of artifact the team itself ships (a working React-on-Salesforce app paired with a docs page that walks through it).

## Built

May 2026.
