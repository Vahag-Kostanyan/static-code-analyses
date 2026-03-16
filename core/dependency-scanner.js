const { execSync } = require("child_process");

function normalizeVia(via) {
  if (!Array.isArray(via)) {
    return [];
  }

  return via.filter(entry => entry && typeof entry === "object");
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

function scanDependencies() {
  try {
    const result = execSync("npm audit --json", {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"]
    });

    const audit = JSON.parse(result);

    return {
      vulnerabilities: audit.metadata?.vulnerabilities || {},
      issues: buildDependencyIssues(audit.vulnerabilities || {})
    };
  } catch (error) {
    try {
      const output = JSON.parse(error.stdout || "{}");

      return {
        vulnerabilities: output.metadata?.vulnerabilities || {},
        issues: buildDependencyIssues(output.vulnerabilities || {})
      };
    } catch {
      return {
        vulnerabilities: {},
        issues: []
      };
    }
  }
}

module.exports = { scanDependencies };
