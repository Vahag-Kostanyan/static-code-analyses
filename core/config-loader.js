const fs = require("fs");
const path = require("path");

const CONFIG_FILE_NAME = ".sca.config.js";
const VALID_RULE_LEVELS = new Set(["off", "warn", "error"]);
const VALID_SEVERITIES = new Set(["low", "medium", "high", "critical"]);

const DEFAULT_CONFIG = Object.freeze({
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
  rules: {},
  severityThreshold: "low",
  plugins: [],
  parallelThreshold: 20,
  maxWorkers: null
});

function normalizeRuleLevel(level) {
  if (typeof level !== "string") {
    return "error";
  }

  const normalized = level.toLowerCase().trim();
  return VALID_RULE_LEVELS.has(normalized) ? normalized : "error";
}

function normalizeSeverityThreshold(value) {
  if (typeof value !== "string") {
    return DEFAULT_CONFIG.severityThreshold;
  }

  const normalized = value.toLowerCase().trim();
  return VALID_SEVERITIES.has(normalized)
    ? normalized
    : DEFAULT_CONFIG.severityThreshold;
}

function normalizeConfig(rawConfig = {}) {
  const ignore = Array.isArray(rawConfig.ignore)
    ? rawConfig.ignore
        .filter(entry => typeof entry === "string")
        .map(entry => entry.trim())
        .filter(Boolean)
    : [...DEFAULT_CONFIG.ignore];

  const rawRules = rawConfig && typeof rawConfig.rules === "object"
    ? rawConfig.rules
    : {};

  const rules = Object.keys(rawRules).reduce((acc, ruleName) => {
    acc[ruleName] = normalizeRuleLevel(rawRules[ruleName]);
    return acc;
  }, {});

  const plugins = Array.isArray(rawConfig.plugins)
    ? rawConfig.plugins
        .filter(plugin => typeof plugin === "string")
        .map(plugin => plugin.trim())
        .filter(Boolean)
    : [];

  const parallelThreshold = Number.isInteger(rawConfig.parallelThreshold) && rawConfig.parallelThreshold > 0
    ? rawConfig.parallelThreshold
    : DEFAULT_CONFIG.parallelThreshold;

  const maxWorkers = Number.isInteger(rawConfig.maxWorkers) && rawConfig.maxWorkers > 0
    ? rawConfig.maxWorkers
    : DEFAULT_CONFIG.maxWorkers;

  return {
    ...DEFAULT_CONFIG,
    ignore,
    rules,
    plugins,
    severityThreshold: normalizeSeverityThreshold(rawConfig.severityThreshold),
    parallelThreshold,
    maxWorkers
  };
}

function loadConfig(cwd = process.cwd()) {
  const configPath = path.join(cwd, CONFIG_FILE_NAME);

  if (!fs.existsSync(configPath)) {
    return {
      ...DEFAULT_CONFIG,
      configPath,
      hasConfig: false
    };
  }

  try {
    // Reload config on every run so local edits apply immediately.
    const resolvedPath = require.resolve(configPath);
    delete require.cache[resolvedPath];

    const loadedConfig = require(resolvedPath);

    return {
      ...normalizeConfig(loadedConfig),
      configPath,
      hasConfig: true
    };
  } catch (error) {
    console.warn(`Failed to load ${CONFIG_FILE_NAME}: ${error.message}`);

    return {
      ...DEFAULT_CONFIG,
      configPath,
      hasConfig: false
    };
  }
}

module.exports = {
  CONFIG_FILE_NAME,
  DEFAULT_CONFIG,
  loadConfig,
  normalizeConfig,
  normalizeRuleLevel
};
