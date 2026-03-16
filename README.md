# Static Code Analyses

A Node.js static security analyzer for JavaScript projects.

It scans JavaScript source files with AST rules, audits dependencies with `npm audit`, writes a JSON report, prints a readable console report, and serves a web dashboard.

## Features

- AST-based rule scanning with Babel parser/traverse
- Auto rule loading from `rules/`
- Plugin rule support via config (`plugins`)
- Config-driven behavior via `.sca.config.js`
- Optional parallel scanning with `worker_threads`
- Dependency vulnerability scan via `npm audit --json`
- JSON report output to `reports/report.json`
- Console reporter with severity summary
- Web UI + API endpoints (`/report`, `/summary`, `/issues`)

## Project Structure

```text
static-code-analyses/
├── cli/
│   └── index.js
├── core/
│   ├── config-loader.js
│   ├── dependency-scanner.js
│   ├── plugin-loader.js
│   ├── rule-runner.js
│   ├── scanner.js
│   └── worker-scanner.js
├── rules/
│   ├── no-eval.js
│   ├── no-hardcoded-secret.js
│   └── no-unsafe-query.js
├── reporters/
│   ├── console-reporter.js
│   ├── html-reporter.js
│   └── json-reporter.js
├── server/
│   └── server.js
├── web/
│   ├── app.js
│   ├── index.html
│   ├── style.css
│   └── README.md
├── examples/
│   ├── TESTING.md
│   ├── configs/
│   ├── plugins/
│   ├── vulnerable/
│   └── ...
├── reports/
│   └── report.json
├── .sca.config.js
├── Dockerfile
├── package.json
└── README.md
```

## Requirements

- Node.js 18+
- npm

## Install

```bash
npm install
```

## Quick Start

Run analysis:

```bash
npm run analyze
```

Start dashboard server:

```bash
npm start
```

Open:

- `http://localhost:3000/`

## Configuration

The analyzer loads `.sca.config.js` from project root.

Example:

```js
module.exports = {
  ignore: [
    "node_modules",
    "dist",
    "build"
  ],
  rules: {
    "no-eval": "error",
    "no-hardcoded-secret": "warn",
    "no-open-redirect": "off"
  },
  severityThreshold: "low", // low | medium | high | critical
  plugins: ["./examples/plugins/no-console-log.js"],
  parallelThreshold: 20,
  maxWorkers: 4
};
```

## Rule System

Rules are auto-loaded from `rules/*.js`.

Each rule must export:

- `meta.name`
- `meta.description`
- `meta.severity` (`low` | `medium` | `high` | `critical`)
- `create(context)` visitor map

Minimal rule shape:

```js
module.exports = {
  meta: {
    name: "no-eval",
    description: "Detect usage of eval()",
    severity: "high"
  },
  create(context) {
    return {
      CallExpression(path) {
        if (path.node.callee?.name === "eval") {
          context.report(path, "Avoid using eval()");
        }
      }
    };
  }
};
```

## Plugins

External rules can be loaded with `.sca.config.js`:

```js
plugins: ["./path/to/plugin-rule.js", "my-security-plugin"]
```

Supported plugin exports:

- single rule object
- array of rules
- object with `rules` field (array or map)

## Parallel Scanning

When the number of scanned files is greater than or equal to `parallelThreshold`, scanning is distributed using `worker_threads` (`core/worker-scanner.js`).

## Report Output

`npm run analyze` writes `reports/report.json` with shape:

```json
{
  "generatedAt": "2026-03-16T00:00:00.000Z",
  "codeIssues": [],
  "dependencyIssues": [],
  "summary": {
    "filesScanned": 0,
    "totalVulnerabilities": 0,
    "critical": 0,
    "high": 0,
    "medium": 0,
    "low": 0,
    "dependencyAudit": {}
  }
}
```

## Console Output

Console reporter prints issues in readable format:

```text
[HIGH] no-eval
File: src/auth/login.js
Line: 45
Message: Avoid using eval()
```

It also prints dependency issues and a summary block.

## Web API

Server endpoints:

- `GET /report` -> full report JSON
- `GET /summary` -> summary object
- `GET /issues` -> flattened issues list
- `GET /api/report` -> backward-compatible full report endpoint

## Test Examples

Use ready-to-run examples in `examples/`.

- Test guide: `examples/TESTING.md`
- Vulnerable fixtures: `examples/vulnerable/`
- Plugin sample rule: `examples/plugins/no-console-log.js`
- Config samples: `examples/configs/`

## Docker

```bash
docker build -t static-code-analyses .
docker run -p 3000:3000 static-code-analyses
```

## Exit Codes

- `0` => no vulnerabilities found
- `1` => vulnerabilities found or scan failure

## License

ISC
