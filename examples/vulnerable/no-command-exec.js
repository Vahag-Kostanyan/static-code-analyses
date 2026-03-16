const { exec } = require("child_process");

function pingHost(host, cb) {
  // Vulnerable: command injection
  exec("ping -c 1 " + host, cb);
}

module.exports = { pingHost };
