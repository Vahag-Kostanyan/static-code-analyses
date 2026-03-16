# Web Report Viewer

This folder contains the frontend dashboard for viewing the latest security scan report.

## What It Uses

- Static files served by `server/server.js`
- Report fetch endpoint: `GET /report`
- Fallback compatibility endpoint: `GET /api/report`

## Prerequisites

- Node.js 18+
- Generated report file at `reports/report.json`

## Run

From repository root:

```bash
npm install
npm run analyze
npm start
```

Open:

- `http://localhost:3000/`

## API Endpoints Used by UI

- `GET /report` -> full report payload (`web/app.js` uses this)
- `GET /summary` -> summary-only payload
- `GET /issues` -> flattened issue list

## Data Expectations

The UI expects report JSON to include:

- `codeIssues` (array)
- `dependencyIssues` (array)
- `summary` (object)

## Troubleshooting

- If UI shows `Unable to load report`, confirm `reports/report.json` exists.
- If the API returns 404, run `npm run analyze` first.
- If report shape changes, update `web/app.js` rendering logic accordingly.
