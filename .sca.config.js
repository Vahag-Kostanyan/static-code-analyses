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
    "no-open-redirect": "off"
  },
  severityThreshold: "low",
  plugins: [],
  parallelThreshold: 20
};
