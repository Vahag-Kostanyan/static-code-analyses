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
    "no-command-exec": "error",
    "no-path-traversal": "error",
    "no-weak-crypto": "error",
    "no-prototype-pollution": "error",
    "no-open-redirect": "error",
    "no-secret-leak": "error"
  },
  severityThreshold: "low",
  plugins: [],
  parallelThreshold: 20
};
