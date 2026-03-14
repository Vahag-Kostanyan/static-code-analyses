const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3433;

// Serve the static web UI
app.use(express.static(path.join(__dirname, "web")));

// API endpoint to return the latest generated report
app.get("/api/report", (req, res) => {
  const reportPath = path.join(__dirname, "../reports", "report.json");

  if (!fs.existsSync(reportPath)) {
    return res.status(404).json({ error: "Report not found", path: reportPath });
  }

  res.sendFile(reportPath);
});

// Fallback single-page support (optional)
// app.get("/*", (req, res) => {
//   // res.sendFile(path.join(__dirname, "reports", "report.json"));
// });

app.listen(PORT, () => {
  console.log(`🚀 Server running: http://localhost:${PORT}`);
  console.log("🔎 API endpoint: /api/report");
});
