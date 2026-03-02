const glob = require("glob");
const { scanFile } = require("./scanner");
const { generateReport } = require("./reporter");

const rules = [
  require("./rules/no-eval"),
  require("./rules/no-hardcoded-secret"),
  require("./rules/no-unsafe-query")
];

const files = glob.sync("**/*.js", {
  ignore: ["node_modules/**"]
});

let allFindings = [];

files.forEach(file => {
  const findings = scanFile(file, rules);
  if (findings.length) {
    allFindings.push({ file, findings });
  }
});

generateReport(allFindings);

if (allFindings.length > 0) {
  console.log("❌ Security issues found!");
  process.exit(1);
} else {
  console.log("✅ Code is secure!");
}