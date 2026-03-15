const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Serve the report UI
app.use(express.static(path.join(__dirname, "..", "web")));

// API: Return the latest generated report
app.get("/api/report", (req, res) => {
  const reportPath = path.join(__dirname, "..", "reports", "report.json");

  if (!fs.existsSync(reportPath)) {
    return res.status(404).json({ error: "Report not found", path: reportPath });
  }

  res.sendFile(reportPath);
});

// Fallback for SPA routing
app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "web", "index.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
  console.log(`🔍 Report API: http://localhost:${PORT}/api/report`);
});
