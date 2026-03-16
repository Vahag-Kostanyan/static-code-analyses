module.exports = {
  ignore: [
    "node_modules",
    "reports",
    "web",
    "server",
    "core",
    "reporters",
    "cli",
    ".github",
    ".husky",
    "dist",
    "build"
  ],
  rules: {
    "no-eval": "error",
    "no-hardcoded-secret": "warn",
    "no-unsafe-query": "error",
    "no-console-log": "warn"
  },
  severityThreshold: "low",
  plugins: ["./examples/plugins/no-console-log.js"],
  parallelThreshold: 20
};
