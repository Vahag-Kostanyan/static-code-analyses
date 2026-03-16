const glob = require("glob");
const path = require("path");

const { loadConfig } = require("../core/config-loader");
const { loadRules } = require("../core/plugin-loader");
const { scanFiles } = require("../core/scanner");
const { scanDependencies } = require("../core/dependency-scanner");
const { generateReport } = require("../reporters/json-reporter");
const { printReport } = require("../reporters/console-reporter");

function toGlobIgnore(pattern) {
  if (typeof pattern !== "string") {
    return null;
  }

  const normalized = pattern.replace(/\\/g, "/").replace(/\/+$/, "").trim();
  if (!normalized) {
    return null;
  }

  return normalized.includes("*") ? normalized : `${normalized}/**`;
}

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

function createSummary(filesScanned, codeIssues, dependencyIssues, dependencyMeta) {
  const summary = {
    filesScanned,
    totalVulnerabilities: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    dependencyAudit: dependencyMeta || {}
  };

  codeIssues.forEach(fileIssue => {
    (fileIssue.findings || []).forEach(issue => {
      const bucket = normalizeSeverityBucket(issue.severity);
      summary[bucket] += 1;
      summary.totalVulnerabilities += 1;
    });
  });

  dependencyIssues.forEach(issue => {
    const bucket = normalizeSeverityBucket(issue.severity);
    summary[bucket] += 1;
    summary.totalVulnerabilities += 1;
  });

  return summary;
}

async function main() {
  const cwd = process.cwd();
  const config = loadConfig(cwd);

  const ruleLoaderOptions = {
    cwd,
    rulesDir: path.join(cwd, "rules"),
    plugins: config.plugins,
    maxWorkers: config.maxWorkers
  };

  const rules = loadRules(ruleLoaderOptions);

  const ignorePatterns = (config.ignore || [])
    .map(toGlobIgnore)
    .filter(Boolean);

  const files = glob.sync("**/*.js", {
    ignore: ignorePatterns,
    nodir: true
  });

  const absoluteFiles = files.map(file => path.resolve(cwd, file));

  const scannedIssues = await scanFiles(absoluteFiles, rules, {
    config,
    useWorkers: true,
    workerOptions: ruleLoaderOptions
  });

  const codeIssues = scannedIssues.map(item => ({
    ...item,
    file: path.relative(cwd, item.file) || item.file
  }));

  console.log("🔍 Checking dependencies...");
  const dependencyReport = scanDependencies();

  const summary = createSummary(
    files.length,
    codeIssues,
    dependencyReport.issues,
    dependencyReport.vulnerabilities
  );

  const finalReport = {
    generatedAt: new Date().toISOString(),
    codeIssues,
    dependencyIssues: dependencyReport.issues,
    summary
  };

  generateReport(finalReport);
  printReport(finalReport);

  if (summary.totalVulnerabilities > 0) {
    process.exit(1);
  }

  process.exit(0);
}

main().catch(error => {
  console.error("Static code analysis failed:", error.message);
  process.exit(1);
});
