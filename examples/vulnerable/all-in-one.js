const { exec } = require("child_process");
const crypto = require("crypto");

const password = "hardcoded-admin-password";

function insecureHandler(req, res, db) {
  eval(req.body.script);
  db.query("SELECT * FROM users WHERE email='" + req.body.email + "'");
  exec("ls " + req.query.path);

  const token = Math.random().toString(36).slice(2);
  const digest = crypto.createHash("sha1").update(token).digest("hex");

  if (req.query.next) {
    res.redirect(req.query.next);
    return;
  }

  res.json({ password, digest });
}

module.exports = { insecureHandler };
