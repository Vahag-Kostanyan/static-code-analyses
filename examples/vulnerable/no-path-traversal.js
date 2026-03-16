const fs = require("fs");
const path = require("path");

function readUserFile(baseDir, fileName) {
  // Vulnerable: path traversal (no sanitization)
  const fullPath = path.join(baseDir, fileName);
  return fs.readFileSync(fullPath, "utf8");
}

module.exports = { readUserFile };
