# Legitimate Question Response Index Website

Public-facing React/Vite dashboard for the Legitimate Question Response Index (LQRI).

## Local Development

```powershell
npm.cmd install
npm.cmd run dev
```

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
