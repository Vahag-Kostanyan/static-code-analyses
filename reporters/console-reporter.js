function normalizeSeverityBucket(input) {
  const normalized = String(input || "low").toLowerCase();

  if (normalized === "moderate") {
    return "medium";
  }

  if (["critical", "high", "medium", "low"].includes(normalized)) {
    return normalized;
  }

  return "low";
}

function computeSummary(report) {
  const summary = {
    filesScanned: (report.codeIssues || []).length,
    totalVulnerabilities: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  };

  (report.codeIssues || []).forEach(fileIssue => {
    (fileIssue.findings || []).forEach(issue => {
      const bucket = normalizeSeverityBucket(issue.severity);
      summary[bucket] += 1;
      summary.totalVulnerabilities += 1;
    });
  });

  (report.dependencyIssues || []).forEach(issue => {
    const bucket = normalizeSeverityBucket(issue.severity);
    summary[bucket] += 1;
    summary.totalVulnerabilities += 1;
  });

  return summary;
}

function printCodeIssues(codeIssues) {
  codeIssues.forEach(fileIssue => {
    (fileIssue.findings || []).forEach(issue => {
      console.log(`[${String(issue.severity || "MEDIUM").toUpperCase()}] ${issue.rule || "unknown-rule"}`);
      console.log(`File: ${fileIssue.file}`);
      console.log(`Line: ${issue.line || "?"}`);
      console.log(`Message: ${issue.message || "Issue detected"}`);
      console.log("");
    });
  });
}

function printDependencyIssues(dependencyIssues) {
  dependencyIssues.forEach(dep => {
    if (dep.kind === "scan-error") {
      console.log("Dependency Scan Error");
      console.log(`Tool: ${dep.package || "npm-audit"}`);
      console.log(`Severity: ${String(dep.severity || "high").toUpperCase()}`);
      console.log(`Message: ${dep.advisory || dep.title || "Dependency scan failed."}`);
      console.log("");
      return;
    }

    console.log("Dependency Vulnerability Detected");
    console.log(`Package: ${dep.package || "unknown"}`);
    console.log(`Version: ${dep.version || "unknown"}`);
    console.log(`Severity: ${String(dep.severity || "unknown").toUpperCase()}`);
    console.log(`Advisory: ${dep.advisory || dep.title || dep.via?.[0]?.title || "Vulnerability"}`);
    console.log("");
  });
}

function printSummary(report) {
  const summary = report.summary || computeSummary(report);

  console.log("## Scan Summary\n");
  console.log(`Files scanned: ${summary.filesScanned || 0}`);
  console.log(`Total vulnerabilities: ${summary.totalVulnerabilities || 0}`);
  console.log("");
  console.log(`Critical: ${summary.critical || 0}`);
  console.log(`High: ${summary.high || 0}`);
  console.log(`Medium: ${summary.medium || 0}`);
  console.log(`Low: ${summary.low || 0}`);
}

function printReport(report) {
  const codeIssues = report.codeIssues || [];
  const dependencyIssues = report.dependencyIssues || [];

  if (codeIssues.length > 0) {
    printCodeIssues(codeIssues);
  }

  if (dependencyIssues.length > 0) {
    printDependencyIssues(dependencyIssues);
  }

  if (codeIssues.length === 0 && dependencyIssues.length === 0) {
    console.log("No vulnerabilities detected.");
    console.log("");
  }

  printSummary(report);
}

module.exports = { printReport };
