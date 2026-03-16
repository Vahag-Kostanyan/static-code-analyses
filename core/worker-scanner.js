const os = require("os");
const { Worker, isMainThread, parentPort, workerData } = require("worker_threads");

function chunkFiles(files, chunkCount) {
  const chunks = Array.from({ length: chunkCount }, () => []);

  files.forEach((file, index) => {
    chunks[index % chunkCount].push(file);
  });

  return chunks.filter(chunk => chunk.length > 0);
}

function scanChunk(files, config, workerOptions) {
  const { loadRules } = require("./plugin-loader");
  const { scanFile } = require("./scanner");

  const rules = loadRules(workerOptions);
  const findingsByFile = [];

  files.forEach(file => {
    const findings = scanFile(file, rules, config);
    if (findings.length > 0) {
      findingsByFile.push({ file, findings });
    }
  });

  return findingsByFile;
}

function runWorkerChunk(files, config, workerOptions) {
  return new Promise((resolve, reject) => {
    let settled = false;

    const worker = new Worker(__filename, {
      workerData: {
        files,
        config,
        workerOptions
      }
    });

    worker.once("message", message => {
      settled = true;
      if (message.ok) {
        resolve(message.results || []);
      } else {
        reject(new Error(message.error || "Worker scanning failed."));
      }
    });

    worker.once("error", error => {
      if (!settled) {
        settled = true;
        reject(error);
      }
    });

    worker.once("exit", code => {
      if (!settled && code !== 0) {
        settled = true;
        reject(new Error(`Worker exited with code ${code}`));
      }
    });
  });
}

async function scanFilesInParallel({ files, config = {}, workerOptions = {} }) {
  if (!Array.isArray(files) || files.length === 0) {
    return [];
  }

  const cpuCount = os.cpus()?.length || 1;
  const requestedWorkers = Number.isInteger(workerOptions.maxWorkers)
    ? workerOptions.maxWorkers
    : Number.isInteger(config.maxWorkers)
      ? config.maxWorkers
      : cpuCount;

  const workerCount = Math.max(1, Math.min(requestedWorkers, files.length));

  if (workerCount === 1) {
    // Fast path for tiny scans or constrained environments.
    return scanChunk(files, config, workerOptions);
  }

  // Split files evenly so workers finish around the same time.
  const chunks = chunkFiles(files, workerCount);
  const results = await Promise.all(
    chunks.map(chunk => runWorkerChunk(chunk, config, workerOptions))
  );

  return results.flat();
}

async function workerMain() {
  const { files = [], config = {}, workerOptions = {} } = workerData || {};

  try {
    const results = scanChunk(files, config, workerOptions);
    parentPort.postMessage({ ok: true, results });
  } catch (error) {
    parentPort.postMessage({ ok: false, error: error.message });
  }
}

if (!isMainThread) {
  workerMain();
}

module.exports = { scanFilesInParallel };
