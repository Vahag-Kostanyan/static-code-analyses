const REPORT_PATH = "http://localhost:3000/api/report";

function createBadge(text, type) {
  const badge = document.createElement("span");
  badge.className = `badge badge--${type}`;
  badge.textContent = text;
  return badge;
}

function createIssueNode(issue) {
  const wrapper = document.createElement("li");
  wrapper.className = "issue";

  const meta = document.createElement("div");
  meta.className = "issue__meta";

  const message = document.createElement("p");
  message.className = "issue__message";
  message.textContent = issue.message;

  const location = document.createElement("p");
  location.className = "issue__location";
  location.textContent = `Line ${issue.line || "?"}${
    issue.column != null ? `, Col ${issue.column}` : ""
  }`;

  meta.append(message, location);

  const severity = document.createElement("div");
  const normalized = (issue.severity || "info").toLowerCase();
  const severityType = ["critical", "high"].includes(normalized)
    ? normalized
    : "info";

  severity.className = `issue__severity issue__severity--${severityType}`;
  severity.textContent = (issue.severity || "INFO").toUpperCase();

  wrapper.append(meta, severity);
  return wrapper;
}

function renderDependencyIssues(dependencyIssues) {
  const section = document.createElement("section");
  section.className = "report";

  const heading = document.createElement("h2");
  heading.textContent = "Dependency Issues";
  section.appendChild(heading);

  if (!Array.isArray(dependencyIssues) || dependencyIssues.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "No dependency issues detected.";
    empty.style.color = "var(--muted)";
    section.appendChild(empty);
    return section;
  }

  dependencyIssues.forEach(dep => {
    const card = document.createElement("article");
    card.className = "file-card";

    const header = document.createElement("h3");
    header.textContent = dep.package;

    const badge = createBadge(`${dep.via?.length || 0} vuln(s)`,
      (dep.severity || "info").toLowerCase() === "high" ? "high" : "info"
    );
    header.appendChild(badge);

    const list = document.createElement("ul");
    list.className = "issue-list";

    (dep.via || []).forEach(vuln => {
      const item = document.createElement("li");
      item.className = "issue";

      const meta = document.createElement("div");
      meta.className = "issue__meta";

      const title = document.createElement("p");
      title.className = "issue__message";
      title.textContent = vuln.title;

      const details = document.createElement("p");
      details.className = "issue__location";
      details.textContent = `${vuln.severity.toUpperCase()} • ${vuln.range || "unknown range"}`;

      const link = document.createElement("a");
      link.href = vuln.url;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.textContent = "Details";
      link.style.fontSize = "0.85rem";
      link.style.color = "var(--accent)";

      meta.append(title, details, link);

      const severity = document.createElement("div");
      const normalized = (vuln.severity || "info").toLowerCase();
      const severityType = ["critical", "high"].includes(normalized)
        ? normalized
        : "info";

      severity.className = `issue__severity issue__severity--${severityType}`;
      severity.textContent = vuln.severity.toUpperCase();

      item.append(meta, severity);
      list.appendChild(item);
    });

    card.append(header, list);
    section.appendChild(card);
  });

  return section;
}

function renderReport(report) {
  const reportContainer = document.getElementById("report");
  const totalFilesEl = document.getElementById("total-files");
  const totalIssuesEl = document.getElementById("total-issues");
  const criticalCountEl = document.getElementById("critical-count");
  const highCountEl = document.getElementById("high-count");
  const depIssuesCountEl = document.getElementById("dep-issues-count");

  reportContainer.innerHTML = "";

  const files = Array.isArray(report.codeIssues) ? report.codeIssues : [];
  const dependencyIssues = Array.isArray(report.dependencyIssues)
    ? report.dependencyIssues
    : [];

  let totalIssues = 0;
  let critical = 0;
  let high = 0;

  files.forEach(fileItem => {
    const issues = Array.isArray(fileItem.findings) ? fileItem.findings : [];
    totalIssues += issues.length;

    issues.forEach(issue => {
      const severity = (issue.severity || "").toUpperCase();
      if (severity === "CRITICAL") critical += 1;
      if (severity === "HIGH") high += 1;
    });
  });

  const depHigh = dependencyIssues.filter(i => (i.severity || "").toLowerCase() === "high").length;

  totalFilesEl.textContent = files.length;
  totalIssuesEl.textContent = totalIssues;
  criticalCountEl.textContent = critical;
  highCountEl.textContent = high + depHigh;
  depIssuesCountEl.textContent = dependencyIssues.length;

  const hasCodeIssues = files.length > 0;
  const hasDepIssues = dependencyIssues.length > 0;

  if (!hasCodeIssues && !hasDepIssues) {
    const empty = document.createElement("p");
    empty.textContent = "No issues found (or report data missing).";
    empty.style.color = "var(--muted)";
    reportContainer.appendChild(empty);
    return;
  }

  if (hasCodeIssues) {
    files.forEach(fileItem => {
      const card = document.createElement("article");
      card.className = "file-card";

      const header = document.createElement("h3");
      header.textContent = fileItem.file;

      const badge = createBadge(`${fileItem.findings.length} issue(s)`,
        fileItem.findings.some(i => i.severity === "CRITICAL") ? "critical" : "high"
      );

      header.appendChild(badge);

      const list = document.createElement("ul");
      list.className = "issue-list";

      (fileItem.findings || []).forEach(issue => {
        list.appendChild(createIssueNode(issue));
      });

      card.append(header, list);
      reportContainer.appendChild(card);
    });
  }

  if (hasDepIssues) {
    reportContainer.appendChild(renderDependencyIssues(dependencyIssues));
  }
}

function showError(error) {
  const reportContainer = document.getElementById("report");
  reportContainer.innerHTML = "";

  const message = document.createElement("p");
  message.textContent = `Unable to load report: ${error.message}`;
  message.style.color = "var(--danger)";

  reportContainer.appendChild(message);

  document.getElementById("total-files").textContent = "—";
  document.getElementById("total-issues").textContent = "—";
  document.getElementById("critical-count").textContent = "—";
  document.getElementById("high-count").textContent = "—";
}

async function init() {
  try {
    const response = await fetch(REPORT_PATH, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    const report = await response.json();
    renderReport(report);
  } catch (error) {
    showError(error);
  }
}

window.addEventListener("load", init);
