const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3456;
const reportPath = path.join(__dirname, "..", "reports", "report.json");

function loadReport() {
  if (!fs.existsSync(reportPath)) {
    const error = new Error("Report not found");
    error.statusCode = 404;
    throw error;
  }

  try {
    return JSON.parse(fs.readFileSync(reportPath, "utf8"));
  } catch (error) {
    const parseError = new Error(`Invalid report.json: ${error.message}`);
    parseError.statusCode = 500;
    throw parseError;
  }
}

function buildIssuesList(report) {
  const codeIssues = (report.codeIssues || []).flatMap(fileIssue =>
    (fileIssue.findings || []).map(issue => ({
      type: "code",
      file: fileIssue.file,
      ...issue
    }))
  );

  const dependencyIssues = (report.dependencyIssues || []).map(issue => ({
    type: "dependency",
    package: issue.package,
    version: issue.version || "unknown",
    severity: issue.severity,
    advisory: issue.advisory || issue.title || issue.via?.[0]?.title || "Vulnerability"
  }));

  return [...codeIssues, ...dependencyIssues];
}

function sendReportSection(res, selector) {
  try {
    const report = loadReport();
    res.json(selector(report));
  } catch (error) {
    res.status(error.statusCode || 500).json({
      error: error.message,
      path: reportPath
    });
  }
}

// Serve the report UI
app.use(express.static(path.join(__dirname, "..", "web")));

// Backward-compatible endpoint
app.get("/api/report", (req, res) => {
  sendReportSection(res, report => report);
});

// New report endpoints for web dashboard integrations.
app.get("/report", (req, res) => {
  sendReportSection(res, report => report);
});

app.get("/summary", (req, res) => {
  sendReportSection(res, report => report.summary || {});
});

app.get("/issues", (req, res) => {
  sendReportSection(res, report => buildIssuesList(report));
});

// Fallback for SPA routing
app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "web", "index.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
  console.log(`🔍 Report API: http://localhost:${PORT}/report`);
});
