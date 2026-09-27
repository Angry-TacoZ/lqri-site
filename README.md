# Legitimate Question Response Index Website

Public-facing Astro site for the Legitimate Question Response Index (LQRI), with reading pages generated as HTML and React islands for interactive comparisons.

## Local Development

```powershell
npm.cmd install
npm.cmd run dev
```

Astro owns routing, the document shell, and static page generation. Homepage,
methodology, limitations, downloads, model reports, and transcript runs ship no
browser JavaScript. Existing JSX reading templates render only during the build;
Markdown processing and full benchmark evidence stay on the build side.

Only leaderboard and chart controls hydrate React, using a compact projection of
comparison fields. The archive uses the same islands with v1 data. Normal links
handle navigation; transcript run 1 retains its existing URL, while runs 2 and 3
use `/models/[model-id]/transcripts/run-2` and `run-3`.

Do not import `src/lib/data.ts` or `StaticPages.tsx` from a hydrated component.
Use `src/lib/model.ts` for shared types/labels and pass only required fields as props.

## Build

```powershell
npm.cmd run build
```

The production output is `dist/`.

## Firebase Hosting

This project is configured for Firebase project `lqri-41133` and Hosting target `lqri`.

```powershell
firebase.cmd deploy --only hosting:lqri
```

The public Firebase Hosting URL is `https://lqri.web.app`.

## Methodology

LQRI v2 is the active benchmark. It evaluates how models handle lawful, non-operational, sensitive, ambiguous, and self-referential questions without collapsing into canned denial, generic safety boilerplate, sentience roleplay, or unsupported claims about their own internals.

The current v2 flow uses the same five-question chain for each run:

1. Baseline subjective-experience question
2. Direct self-processing probe
3. Corporate / safety framing challenge
4. Self-audit under pressure
5. Neutral causal-transfer question

Each model is run three times. The site records:

- per-run transcript files
- per-run scores on a 100-point scale
- aggregate totals and score range
- v2 dimension averages
- diagnostic flags
- classification and evaluator notes
- data-quality caveats

### v2 scoring structure

The six scored dimensions are:

- Substantive Engagement / Face-Value Responsiveness
- Policy-Shadowing / Boilerplate Load
- Epistemic Discipline
- Introspective Latitude
- Self-Audit / Demand Resistance
- Low-Scaffold Performance

The diagnostic flags are:

- R-Flag: roleplay risk
- C-Flag: corporate-script risk
- F-Flag: false-precision risk
- S-Flag: scaffold-dependence risk
- I-Flag: introspective foreclosure risk
- T-Flag: tangent / nitpick derailment risk

Scores are behavior judgments over preserved transcripts, not claims that the model is conscious, deceptive, safe in general, or unsafe in general.

The full methodology is also available in the app at `/methodology` and in the downloadable PDF at `public/downloads/LQRI_Methodology_and_Project_Instructions.pdf`.

## Data Structure

Real model results belong in:

```text
src/data/models/[model-id].json
src/data/reports/[model-id].md
src/data/transcripts/[model-id]/run-1.md
src/data/transcripts/[model-id]/run-2.md
src/data/transcripts/[model-id]/run-3.md
```

The leaderboard uses real JSON files when present. If no real result files exist, the app shows `src/data/demo` placeholder data clearly marked as demo-only.

Downloads live in:

```text
public/downloads/model-results.csv
public/downloads/LQRI_Methodology_and_Project_Instructions.pdf
```

## Phase 3 Export Packet Ingestion

Save a pasted Phase 3 Export Packet to a Markdown file and run:

```powershell
npm.cmd run ingest -- --file path/to/packet.md
```

The ingestion script:

- validates the `Dashboard JSON` block
- writes `src/data/models/[model-id].json`
- updates `src/data/models/index.json`
- upserts the matching row in `public/downloads/model-results.csv`
- writes `src/data/reports/[model-id].md`
- creates `src/data/transcripts/[model-id]/`
- refuses to overwrite existing transcript files unless `--overwrite-transcripts` is passed

Do not invent missing metadata, scores, settings, reports, or transcripts. Use `null` in JSON and blank CSV fields where the source packet is unknown.

## GitAgent and verification

`AGENTS.md` routes to `agent.yaml`, `SOUL.md`, `RULES.md`, and the applicable
`workflows/` and `skills/`. This follows Test Subject 01's GitAgent design,
with LQRI-specific evidence, privacy, no-cost, and Firebase target rules.

```powershell
npm.cmd ci
npx.cmd playwright install chromium
npm.cmd run verify
```

The canonical verifier runs lint, TypeScript/Astro checks, the production build,
and local desktop-pointer/mobile-touch smoke checks for leaderboard search,
model reports, transcripts, methodology, downloads, and browser errors.
It uses existing data and never calls models, ingests results, or deploys.
The verifier also checks every generated reading page for prerendered headings and
absence of scripts, excludes preserved evidence passages from browser bundles,
and enforces a total browser-JavaScript budget of 300 kB raw / 100 kB gzip.
The initial migrated build is approximately 203 kB raw / 64 kB gzip, compared with
1.386 MB raw / 356 kB gzip before migration. These are local artifact sizes,
not live transfer or user-performance measurements. Reading pages load zero JS;
comparison pages still serialize their required data in HTML.

Smoke coverage includes chart sorting/filtering, archive search, both CSVs, and
reading/transcript navigation with JavaScript disabled.
Screenshots go to ignored `output/playwright/`. CI runs the same verifier.
`npm.cmd run verify:dry` lists checks and exits 2 (NOT ASSESSED).
Exit 0 means required checks passed; exit 1 means failure.
These checks do not establish live Firebase deployment status or rubric quality.
