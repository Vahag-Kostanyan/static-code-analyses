const { execSync } = require("child_process");

function scanDependencies() {
  try {
    const result = execSync("npm audit --json", {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"]
    });

    const audit = JSON.parse(result);

    return {
      vulnerabilities: audit.metadata?.vulnerabilities || {},
      issues: []
    };
  } catch (error) {
    try {
      const output = JSON.parse(error.stdout);

      const issues = [];

      if (output.vulnerabilities) {
        Object.keys(output.vulnerabilities).forEach(pkg => {
          const vuln = output.vulnerabilities[pkg];

          issues.push({
            package: pkg,
            severity: vuln.severity,
            title: vuln.title,
            via: vuln.via
          });
        });
      }

      return {
        vulnerabilities: output.metadata?.vulnerabilities || {},
        issues
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