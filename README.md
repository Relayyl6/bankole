# Bankole

**The trust layer between diaspora senders and the people building for them.**

Built for the Intellect Africa Summer Fellowship 2.0 · Demo Day, 8 August 2026.

---

## The problem

Diaspora Africans send money home to build real assets — a family house, a shop, a
clinic, a borehole. The money moves reliably. Everything after that does not.

Once funds land, the sender has no independent way to know what happened to them.
This failure has four distinct shapes, and a solution has to address all four or it
addresses none:

| | Failure | What it looks like |
|---|---|---|
| **A** | **Trust** | No way to verify the person managing the project is legitimate, competent, or still acting in the sender's interest. |
| **B** | **Fragmentation** | Coordination scattered across calls, WhatsApp, and bank transfers, with no shared record either side can rely on. |
| **C** | **Visibility** | No independent view of whether reported progress is actual progress. |
| **D** | **Recourse** | When funds are diverted or work stalls, a sender thousands of miles away has no practical way to intervene. |

This is not a construction problem. It is a verification problem, and it is why
diaspora capital underperforms relative to its volume.

## The solution

Bankole holds funds in **milestone escrow** and releases them only against
**independently verifiable proof** of physical progress, submitted by an
**identity-verified agent** inside a **shared project workspace**.

```
Fund escrow  →  Agent submits geo-tagged proof  →  Sender reviews  →  Stage releases
     │                       │                          │                    │
   held by              EXIF GPS +              same live view          or flagged,
  platform,            timestamp, checked        for both parties         funds stay
  not agent            against site coords                                   held
```

Escrow is the mechanism, not the product. The product is a sender's justified
confidence that money sent from thousands of miles away did what it was sent to do.

## What is built

The frontend is a working prototype. It runs on seeded demonstration data — the
platform has not launched, and has no real users, funds, or completed projects.
Data shown in the interface is illustrative and labelled as such throughout.

| Area | Status |
|---|---|
| Landing page — problem, mechanism, business model | Built |
| Agent directory with search and filtering | Built |
| Agent profiles — credentials, portfolio, reviews | Built |
| Sender dashboard — multi-project overview | Built |
| Project workspace — milestone timeline, budget, proof review | Built |
| Guided project creation flow | Built |
| EXIF-based proof verification | In progress |
| Authentication, messaging, notifications | Specified, not built |

**Live deployment:** https://bankole-app.vercel.app — no login required.

The API the remaining work depends on is fully specified in
**[API-CONTRACT.md](API-CONTRACT.md)**.

## Backend handoff

Start with these two, in order:

1. **[docs/SCREENS.md](docs/SCREENS.md)** — every screen, screenshotted, mapped
   to the endpoints that feed it: what the frontend sends, what logic it
   expects, what it needs back.
2. **[API-CONTRACT.md](API-CONTRACT.md)** — the full spec. Request and response
   shapes, validation rules, error format, auth model, and the exact enum values
   the UI depends on. Tagged P0/P1/P2, with a suggested build order in §13.

The frontend runs on seeded data and keeps working whether or not a backend
exists, so nothing here is a blocker for the demo — anything that lands is
upside.

**Most valuable three endpoints:** `GET /agents`, `GET /projects/:id`,
`POST /milestones/:id/approve`.

## Architecture

```
web/
├── app/                    Next.js App Router
│   ├── page.tsx            Landing
│   ├── dashboard/          Sender dashboard
│   ├── agents/             Directory + [id] profiles
│   └── projects/[id]/      Project workspace
├── components/             Presentational + workspace UI
├── lib/
│   ├── mock-data.ts        Seeded demo data and domain types
│   └── status.ts           Status → label/colour mapping
└── public/images/          Static assets
```

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4.

**Notable decisions:**

- **Server Components by default.** Only two components opt into `"use client"` —
  the agent directory (filtering) and the project workspace (tab state). Everything
  else renders on the server, so the marketing and dashboard pages ship close to
  zero client JavaScript.
- **Domain types are the contract.** `lib/mock-data.ts` defines the domain model
  (`Project`, `Milestone`, `ProgressProof`, `Agent`) as TypeScript interfaces and
  exports seeded instances. It is deliberately the single seam between UI and data,
  so replacing it with live API calls touches no component.
- **Tailwind v4 CSS-first theming.** The design system — brand ramp, ink ramp,
  semantic status colours, elevation — is declared as CSS custom properties in
  `app/globals.css` under `@theme`, not in a JS config.
- **Money as integers.** No floating-point currency anywhere. See the
  API contract for the minor-unit convention.

## Getting started

Requires **Node 20 or later**.

```bash
git clone <repository-url>
cd <repository>/web
npm install
npm run dev
```

The application runs at http://localhost:3000.

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Typecheck |

## Connecting a backend

The frontend is written against a documented API specification. To point it at a
running backend:

```bash
# web/.env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

**[API-CONTRACT.md](API-CONTRACT.md)** specifies every endpoint — request and
response shapes, validation rules, error format, authorisation model, and the exact
enum values the interface depends on.

## Verification design

The mechanism the product rests on is worth stating precisely, because it is the
part that is easy to build insecurely.

A progress proof is a photo or video submitted by an agent. The client extracts
EXIF GPS coordinates and capture timestamp and sends them alongside the file — but
those values are **advisory only**. The server independently re-extracts EXIF from
the uploaded file and verifies against its own values, because a client-supplied
coordinate is exactly what a dishonest agent would forge. Verification compares the
capture location against the project's registered site coordinates within a
configurable radius, and the capture timestamp against the milestone start, then
returns one of four verdicts: verified on site, location mismatch, no GPS data, or
stale timestamp.

Absent GPS data is reported as unverifiable rather than fraudulent. The system is
designed to surface uncertainty honestly, not to manufacture false confidence —
which is the entire point of the product.

## Repository contents

```
web/                                            Frontend application
API-CONTRACT.md                                 API specification
docs/SCREENS.md                                 Screens mapped to endpoints
docs/screenshots/                               Every screen, desktop + mobile
research/SURVEY-FINDINGS.md                     User survey, n = 10
research/Problem_Statement.md                   Problem research
research/Diaspora-Ledger-Field-Report.pdf       Competitor field report
```

This repository is private. The `research/` directory is internal working
material — survey data and competitive analysis — and is not for publication.
