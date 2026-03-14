const fs = require("fs");
const path = require("path");

function generateHtmlReport(report, outputPath) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Security Report</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 1.5rem; }
    pre { background: #f5f5f5; padding: 1rem; border-radius: 8px; }
  </style>
</head>
<body>
  <h1>Security Report</h1>
  <pre>${JSON.stringify(report, null, 2)}</pre>
</body>
</html>`;

  fs.writeFileSync(outputPath, html, "utf8");
}

module.exports = { generateHtmlReport };
