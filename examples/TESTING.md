# Testing Examples

This folder contains runnable examples to test the new architecture features.

## 1) Run base scan (rules + config + report + console output)

```bash
npm run analyze
```

What you should see:
- Findings from `examples/test1.js` (`no-eval`, `no-hardcoded-secret`)
- Findings from `examples/test2.js` (`no-unsafe-query`, `no-eval` via string-based `setTimeout`)
- `reports/report.json` updated with `codeIssues`, `dependencyIssues`, and summary counts
- Non-zero exit code because vulnerabilities are detected

## 2) Verify worker-thread parallel scanning

`parallelThreshold` in `.sca.config.js` is `20` and this folder now includes more than 20 `.js` files (`examples/parallel/*`), so `core/worker-scanner.js` should be used automatically.

To force worker mode even on smaller sets:

```js
// .sca.config.js
parallelThreshold: 1
```

## 3) Test plugin rule loading

A plugin rule exists at:
- `examples/plugins/no-console-log.js`

It flags `console.log(...)`, and target code exists in:
- `examples/test-plugin-target.js`

To test plugin loading:

1. Replace root `.sca.config.js` content with `examples/configs/sca.plugin.config.example.js`
2. Run:

```bash
npm run analyze
```

You should see findings with rule name `no-console-log`.

## 4) Test severity threshold filtering

A medium-threshold config sample exists at:
- `examples/configs/sca.threshold-medium.config.example.js`

To test threshold behavior:

1. Replace root `.sca.config.js` with this config
2. Run `npm run analyze`
3. Confirm low-severity findings are filtered out (if any)

## 5) Test web APIs

Generate report first:

```bash
npm run analyze
```

Start server:

```bash
npm start
```

Then test endpoints:

- `GET http://localhost:3000/report`
- `GET http://localhost:3000/summary`
- `GET http://localhost:3000/issues`
- (Backward compatible) `GET http://localhost:3000/api/report`
