const fs = require("fs");
const path = require("path");

const VALID_SEVERITIES = new Set(["low", "medium", "high", "critical"]);
const SEVERITY_RANK = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4
};

function normalizeSeverity(value) {
  if (typeof value !== "string") {
    return "medium";
  }

  const normalized = value.toLowerCase().trim();
  if (normalized === "moderate") {
    return "medium";
  }

  return VALID_SEVERITIES.has(normalized) ? normalized : "medium";
}

function asRuleArray(exportedModule) {
  // Support common plugin shapes: single rule, array of rules, or { rules } container.
  if (!exportedModule) {
    return [];
  }

  if (Array.isArray(exportedModule)) {
    return exportedModule;
  }

  if (typeof exportedModule.create === "function") {
    return [exportedModule];
  }

  if (Array.isArray(exportedModule.rules)) {
    return exportedModule.rules;
  }

  if (exportedModule.rules && typeof exportedModule.rules === "object") {
    return Object.values(exportedModule.rules);
  }

  return [];
}

function normalizeRule(ruleModule, sourceLabel) {
  if (!ruleModule || typeof ruleModule !== "object") {
    return null;
  }

  if (typeof ruleModule.create !== "function") {
    return null;
  }

  const meta = ruleModule.meta && typeof ruleModule.meta === "object"
    ? ruleModule.meta
    : {};

  const name = typeof meta.name === "string" ? meta.name.trim() : "";
  if (!name) {
    return null;
  }

  return {
    ...ruleModule,
    meta: {
      name,
      description: typeof meta.description === "string"
        ? meta.description
        : `Security rule loaded from ${sourceLabel}`,
      severity: normalizeSeverity(meta.severity)
    }
  };
}

function requireFresh(modulePath) {
  const resolvedPath = require.resolve(modulePath);
  delete require.cache[resolvedPath];
  return require(resolvedPath);
}

function loadRulesFromDirectory(rulesDir) {
  if (!fs.existsSync(rulesDir)) {
    return [];
  }

  return fs
    .readdirSync(rulesDir)
    .filter(file => file.endsWith(".js"))
    .map(file => {
      const absolutePath = path.join(rulesDir, file);
      try {
        const loaded = requireFresh(absolutePath);
        return normalizeRule(loaded, absolutePath);
      } catch (error) {
        console.warn(`Failed to load rule ${file}: ${error.message}`);
        return null;
      }
    })
    .filter(Boolean);
}

function loadRulesFromPlugin(pluginName, cwd) {
  const isPathPlugin = pluginName.startsWith(".") || pluginName.startsWith("/");
  const pluginPath = isPathPlugin ? path.resolve(cwd, pluginName) : pluginName;

  try {
    const pluginExport = requireFresh(pluginPath);

    return asRuleArray(pluginExport)
      .map(rule => normalizeRule(rule, pluginName))
      .filter(Boolean);
  } catch (error) {
    console.warn(`Failed to load plugin ${pluginName}: ${error.message}`);
    return [];
  }
}

function loadRules(options = {}) {
  const cwd = options.cwd || process.cwd();
  const rulesDir = options.rulesDir || path.join(cwd, "rules");
  const plugins = Array.isArray(options.plugins) ? options.plugins : [];

  const localRules = loadRulesFromDirectory(rulesDir);
  const pluginRules = plugins.flatMap(pluginName => loadRulesFromPlugin(pluginName, cwd));

  // Later rules win by name so plugin rules can override local rules if needed.
  const deduped = new Map();
  [...localRules, ...pluginRules].forEach(rule => {
    deduped.set(rule.meta.name, rule);
  });

  return [...deduped.values()];
}

module.exports = {
  SEVERITY_RANK,
  loadRules,
  normalizeSeverity
};
