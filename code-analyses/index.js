const glob = require("glob");
const path = require("path");

const { scanFile } = require("./scanner");
const { generateReport } = require("./reporter");
const { scanDependencies } = require("./dependency-scanner");

const rules = [
  require("./rules/no-eval"),
  require("./rules/no-hardcoded-secret"),
  require("./rules/no-unsafe-query")
];

const files = glob.sync("**/*.js", {
  ignore: ["node_modules/**", "reports/**", ".github/**", ".husky/**"]
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

if (codeFindings.length > 0 || dependencyReport.issues.length > 0) {
  console.log("❌ Security issues detected");
  process.exit(1);
}

console.log("✅ No vulnerabilities detected");
process.exit(0);