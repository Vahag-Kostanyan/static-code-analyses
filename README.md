# Static Code Analyses

A Node.js-based static code analysis tool for detecting security vulnerabilities in JavaScript code. It scans for issues like eval usage, hardcoded secrets, unsafe SQL queries, and dependency vulnerabilities via npm audit.

## Features

- **AST-based scanning**: Uses Babel parser to analyze JavaScript code for security issues
- **Custom rules**: Detects eval, hardcoded secrets, and unsafe queries
- **Dependency auditing**: Integrates with npm audit for package vulnerabilities
- **Multiple reporters**: JSON, console, and HTML output
- **Web UI**: Built-in Express server with a simple web interface to view reports
- **CLI tool**: Easy to integrate into CI/CD pipelines

## Project Structure

```
static-code-analyses/
├── cli/                     # CLI entry point
│   └── index.js
├── core/                    # Core scanning engine
│   ├── scanner.js
│   ├── dependency-scanner.js
│   └── rule-runner.js
├── rules/                   # Security rules (AST visitors)
│   ├── no-eval.js
│   ├── no-hardcoded-secret.js
│   └── no-unsafe-query.js
├── reporters/               # Report generators
│   ├── json-reporter.js
│   ├── console-reporter.js
│   └── html-reporter.js
├── server/                  # Web API server
│   └── server.js
├── web/                     # Report viewer UI
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   └── README.md
├── examples/                # Test files with vulnerabilities
│   ├── test1.js
│   ├── test2.js
│   └── example-entry.js
├── reports/                 # Generated reports
│   └── report.json
├── package.json
├── Dockerfile
└── README.md
```

## Installation

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd static-code-analyses
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

### Analyze Code

Run the analyzer on the current directory:

```bash
npm run analyze
```

This scans all `.js` files (excluding `node_modules/`, `reports/`, etc.), audits dependencies, and generates `reports/report.json`.

### Start Web Server

Launch the built-in server to view reports in a web UI:

```bash
npm start
```

Open `http://localhost:3000/` in your browser to view the latest report.

### CLI Tool

Install globally or use npx:

```bash
npx analyese
```

Or link locally:

```bash
npm link
analyese
```

## Rules

The tool includes these security rules:

- **no-eval**: Detects `eval()`, `new Function()`, and string-based `setTimeout`/`setInterval`
- **no-hardcoded-secret**: Finds hardcoded secrets in variables/properties (password, token, etc.)
- **no-unsafe-query**: Flags SQL injection via string concatenation in `.query()` calls

## Reporters

- **JSON**: Default output to `reports/report.json`
- **Console**: Print summary to terminal
- **HTML**: Generate `reports/report.html` for standalone viewing

## Docker

Build and run with Docker:

```bash
docker build -t static-analyses .
docker run -p 3000:3000 static-analyses
```

## Configuration

- Modify `cli/index.js` to add custom rules or reporters
- Update ignore patterns in the glob config
- Customize server port with `PORT` environment variable

## Examples

Test files in `examples/` demonstrate detected vulnerabilities:

- `examples/test1.js`: Hardcoded password and eval
- `examples/test2.js`: Multiple evals, unsafe query, and secret
- `examples/example-entry.js`: Clean file

Run analysis to see them in the report.

## Contributing

1. Add new rules in `rules/`
2. Implement reporters in `reporters/`
3. Update tests in `examples/`
4. Submit a PR

## License

ISC