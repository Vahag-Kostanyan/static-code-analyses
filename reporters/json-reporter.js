const fs = require("fs");
const path = require("path");

function generateReport(results) {
  const reportsDir = path.join(process.cwd(), "reports");

  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir);
  }

  const file = path.join(reportsDir, "report.json");

  fs.writeFileSync(file, JSON.stringify(results, null, 2));

  console.log("📄 Security report created:", file);
}

module.exports = { generateReport };