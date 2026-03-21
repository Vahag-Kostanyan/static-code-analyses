const { execSync } = require("child_process");

function ensureText(input) {
  if (!input) {
    return "";
  }

  if (Buffer.isBuffer(input)) {
    return input.toString("utf8");
  }

  return String(input);
}

function extractBalancedJson(raw) {
  const source = ensureText(raw);
  if (!source.trim()) {
    return null;
  }

  let start = source.indexOf("{");

  while (start !== -1) {
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = start; i < source.length; i += 1) {
      const ch = source[i];

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (ch === "\\") {
          escaped = true;
        } else if (ch === "\"") {
          inString = false;
        }
        continue;
      }

      if (ch === "\"") {
        inString = true;
        continue;
      }

      if (ch === "{") {
        depth += 1;
        continue;
      }

      if (ch === "}") {
        depth -= 1;
        if (depth === 0) {
          return source.slice(start, i + 1);
        }
      }
    }

    start = source.indexOf("{", start + 1);
  }

  return null;
}

function parseAuditJson(...parts) {
  const combined = parts.map(ensureText).filter(Boolean).join("\n").trim();
  if (!combined) {
    return null;
  }

  try {
    return JSON.parse(combined);
  } catch {
    const extracted = extractBalancedJson(combined);
    if (!extracted) {
      return null;
    }

    try {
      return JSON.parse(extracted);
    } catch {
      return null;
    }
  }
}

function normalizeVia(via) {
  if (!Array.isArray(via)) {
    return [];
  }

  return via
    .map(entry => {
      if (!entry) {
        return null;
      }

      if (typeof entry === "string") {
        return {
          title: entry,
          severity: "unknown"
        };
      }

      if (typeof entry === "object") {
        return entry;
      }

      return null;
    })
    .filter(Boolean);
}

function buildDependencyIssues(vulnerabilities = {}) {
  return Object.keys(vulnerabilities).map(packageName => {
    const vuln = vulnerabilities[packageName] || {};
    const via = normalizeVia(vuln.via);
    const primary = via[0] || {};

    return {
      package: packageName,
      version: vuln.range || "unknown",
      severity: vuln.severity || "unknown",
      advisory: primary.title || vuln.title || "Vulnerability",
      title: primary.title || vuln.title || "Vulnerability",
      via
    };
  });
}

function buildDependencyIssuesFromAdvisories(advisories = {}) {
  return Object.keys(advisories).map(id => {
    const advisory = advisories[id] || {};

    return {
      package: advisory.module_name || "unknown",
      version: advisory.vulnerable_versions || "unknown",
      severity: advisory.severity || "unknown",
      advisory: advisory.title || "Vulnerability",
      title: advisory.title || "Vulnerability",
      via: [
        {
          source: advisory.source,
          name: advisory.module_name,
          severity: advisory.severity,
          title: advisory.title,
          url: advisory.url
        }
      ]
    };
  });
}

function buildScanErrorIssue(message) {
  return {
    kind: "scan-error",
    package: "npm-audit",
    version: "n/a",
    severity: "high",
    advisory: `Dependency scan failed: ${message}`,
    title: "Dependency scan failed",
    via: []
  };
}

function scanDependencies() {
  const command = "npm audit --json";

  try {
    const result = execSync(command, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"]
    });

    const audit = parseAuditJson(result);
    if (!audit) {
      return {
        vulnerabilities: {},
        issues: [buildScanErrorIssue("Unable to parse npm audit JSON output.")]
      };
    }

    return {
      vulnerabilities: audit.metadata?.vulnerabilities || {},
      issues: buildDependencyIssues(audit.vulnerabilities || {}).concat(
        buildDependencyIssuesFromAdvisories(audit.advisories || {})
      )
    };
  } catch (error) {
    const output = parseAuditJson(error.stdout, error.stderr, error.message);
    if (!output) {
      return {
        vulnerabilities: {},
        issues: [buildScanErrorIssue(error.message || "npm audit execution failed.")]
      };
    }

    const issues = buildDependencyIssues(output.vulnerabilities || {}).concat(
      buildDependencyIssuesFromAdvisories(output.advisories || {})
    );

    if (issues.length === 0 && output.message) {
      return {
        vulnerabilities: output.metadata?.vulnerabilities || {},
        issues: [buildScanErrorIssue(output.message)]
      };
    }

    return {
      vulnerabilities: output.metadata?.vulnerabilities || {},
      issues
    };
  }
}

module.exports = { scanDependencies };
