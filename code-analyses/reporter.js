// src/reporter.js

const fs = require("fs");
const path = require("path");

function generateReport(results) {
  const reportsDir = path.join(process.cwd(), "reports");
  const reportPath = path.join(reportsDir, "report.json");

  // ✅ Create folder if it does not exist
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

  console.log(`📄 Report generated at: ${reportPath}`);
}

module.exports = { generateReport };