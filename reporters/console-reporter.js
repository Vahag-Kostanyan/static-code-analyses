function printReport(report) {
  console.log("=== Security Report ===");

  (report.codeIssues || []).forEach(file => {
    console.log(`\nFile: ${file.file}`);
    (file.findings || []).forEach(issue => {
      console.log(`  [${issue.severity}] ${issue.rule} - ${issue.message} (line ${issue.line})`);
    });
  });

  if (report.dependencyIssues && report.dependencyIssues.length) {
    console.log("\nDependency Issues:");
    report.dependencyIssues.forEach(dep => {
      console.log(`  ${dep.package} (${dep.severity}): ${dep.via?.[0]?.title || "Vulnerability"}`);
    });
  }

  console.log("\nSummary:", report.summary || {});
}

module.exports = { printReport };
