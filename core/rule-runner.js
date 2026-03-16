const traverse = require("@babel/traverse").default;
const { SEVERITY_RANK, normalizeSeverity } = require("./plugin-loader");

function shouldIncludeByThreshold(severity, threshold) {
  const issueRank = SEVERITY_RANK[normalizeSeverity(severity)] || SEVERITY_RANK.medium;
  const thresholdRank = SEVERITY_RANK[normalizeSeverity(threshold)] || SEVERITY_RANK.low;
  return issueRank >= thresholdRank;
}

function normalizeRuleLevel(level) {
  if (typeof level !== "string") {
    return "error";
  }

  const normalized = level.toLowerCase().trim();
  if (["off", "warn", "error"].includes(normalized)) {
    return normalized;
  }

  return "error";
}

function inferVisitorMode(visitorFn) {
  const fnSource = visitorFn.toString();
  const match = fnSource.match(/^[^(]*\(\s*([^,\s\)]*)/);
  const firstParam = match && match[1] ? match[1].toLowerCase() : "";

  if (firstParam.includes("path")) {
    return "path";
  }

  if (firstParam.includes("node")) {
    return "node";
  }

  return fnSource.includes(".node") ? "path" : "node";
}

function wrapVisitorHandler(handler) {
  if (typeof handler !== "function") {
    return handler;
  }

  const mode = inferVisitorMode(handler);

  return function wrappedVisitor(path) {
    if (mode === "path") {
      return handler(path);
    }

    return handler(path.node, path);
  };
}

function adaptVisitors(visitors = {}) {
  return Object.keys(visitors).reduce((acc, key) => {
    const visitor = visitors[key];

    if (typeof visitor === "function") {
      acc[key] = wrapVisitorHandler(visitor);
      return acc;
    }

    if (visitor && typeof visitor === "object") {
      acc[key] = {
        ...visitor,
        enter: wrapVisitorHandler(visitor.enter),
        exit: wrapVisitorHandler(visitor.exit)
      };
      return acc;
    }

    acc[key] = visitor;
    return acc;
  }, {});
}

function runRules(ast, rules, config = {}) {
  const findings = [];
  const rulesConfig = config.rules || {};
  const severityThreshold = config.severityThreshold || "low";

  rules.forEach(rule => {
    const ruleName = rule.meta?.name || "unknown-rule";
    const configuredLevel = normalizeRuleLevel(rulesConfig[ruleName]);

    if (configuredLevel === "off") {
      return;
    }

    const context = {
      report(nodeOrPath, payload) {
        const node = nodeOrPath && nodeOrPath.node ? nodeOrPath.node : nodeOrPath;
        const data = typeof payload === "string" ? { message: payload } : (payload || {});

        const severity = normalizeSeverity(data.severity || rule.meta?.severity);
        if (!shouldIncludeByThreshold(severity, severityThreshold)) {
          return;
        }

        findings.push({
          rule: data.rule || ruleName,
          description: rule.meta?.description || "",
          level: configuredLevel,
          severity: severity.toUpperCase(),
          message: data.message || `Issue detected by ${ruleName}.`,
          line: node?.loc?.start?.line || null,
          column: node?.loc?.start?.column || null
        });
      }
    };

    try {
      const visitors = adaptVisitors(rule.create(context) || {});
      traverse(ast, visitors);
    } catch (error) {
      findings.push({
        rule: ruleName,
        description: rule.meta?.description || "",
        level: configuredLevel,
        severity: "HIGH",
        message: `Rule execution failed: ${error.message}`,
        line: null,
        column: null
      });
    }
  });

  return findings;
}

module.exports = { runRules };
