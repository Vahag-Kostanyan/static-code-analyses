const glob = require("glob");
const path = require("path");

const { scanFile } = require("../core/scanner");
const { generateReport } = require("../reporters/json-reporter");
const { scanDependencies } = require("../core/dependency-scanner");

const rules = [
  require("../rules/no-eval"),
  require("../rules/no-hardcoded-secret"),
  require("../rules/no-unsafe-query")
];

const files = glob.sync("**/*.js", {
  ignore: [
    "node_modules/**",
    "reports/**",
    "web/**",
    "server/**",
    "core/**",
    "reporters/**",
    "cli/**",
    ".github/**",
    ".husky/**"
  ]
});

let codeFindings = [];

for (const file of files) {
  const findings = scanFile(path.resolve(file), rules);

  if (findings.length > 0) {
    codeFindings.push({
      file,
      findings
    });
  }
}

console.log("🔍 Checking dependencies...");
const dependencyReport = scanDependencies();

const finalReport = {
  codeIssues: codeFindings,
  dependencyIssues: dependencyReport.issues,
  summary: dependencyReport.vulnerabilities
};

generateReport(finalReport);

/* -----------------------------
   PRINT CODE ISSUES IN CONSOLE
--------------------------------*/
if (codeFindings.length > 0) {
  console.log("\n🚨 Code Vulnerabilities Found:\n");

  codeFindings.forEach(fileIssue => {
    console.log(`📄 File: ${fileIssue.file}`);

    fileIssue.findings.forEach(f => {
      console.log(
        `   [${f.severity}] ${f.rule} -> ${f.message} (line ${f.line})`
      );
    });

    console.log("");
  });
}

/* -----------------------------
   PRINT DEPENDENCY ISSUES
--------------------------------*/
if (dependencyReport.issues.length > 0) {
  console.log("\n📦 Dependency Vulnerabilities:\n");

  dependencyReport.issues.forEach(dep => {
    console.log(
      `   ${dep.package} | severity: ${dep.severity} | ${dep.title || "Vulnerability"}`
    );
  });

  console.log("");
}

/* -----------------------------
   FINAL STATUS
--------------------------------*/
if (codeFindings.length > 0 || dependencyReport.issues.length > 0) {
  console.log("❌ Security issues detected");
  process.exit(1);
}

console.log("✅ No vulnerabilities detected");
process.exit(0);