const parser = require("@babel/parser");
const fs = require("fs");

const { runRules } = require("./rule-runner");

function parseAst(code) {
  return parser.parse(code, {
    sourceType: "unambiguous",
    plugins: ["jsx"]
  });
}

function scanFile(filePath, rules, config = {}) {
  try {
    const code = fs.readFileSync(filePath, "utf8");
    const ast = parseAst(code);
    return runRules(ast, rules, config);
  } catch (error) {
    return [
      {
        rule: "parse-error",
        severity: "HIGH",
        level: "error",
        message: `Unable to parse file: ${error.message}`,
        line: error.loc?.line || null,
        column: error.loc?.column || null
      }
    ];
  }
}

async function scanFiles(filePaths, rules, options = {}) {
  const files = Array.isArray(filePaths) ? filePaths : [];
  const config = options.config || {};
  const useWorkers = options.useWorkers !== false;
  const parallelThreshold = Number.isInteger(config.parallelThreshold)
    ? config.parallelThreshold
    : 20;

  if (useWorkers && files.length >= parallelThreshold) {
    try {
      // Worker threads are used only when scans are large enough to offset worker startup cost.
      const { scanFilesInParallel } = require("./worker-scanner");
      return await scanFilesInParallel({
        files,
        config,
        workerOptions: options.workerOptions || {}
      });
    } catch (error) {
      console.warn(`Parallel scanning failed, falling back to sequential scan: ${error.message}`);
    }
  }

  const findingsByFile = [];

  files.forEach(file => {
    const findings = scanFile(file, rules, config);
    if (findings.length > 0) {
      findingsByFile.push({ file, findings });
    }
  });

  return findingsByFile;
}

module.exports = { scanFile, scanFiles };
