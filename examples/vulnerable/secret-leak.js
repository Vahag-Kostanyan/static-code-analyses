function debugSecrets(req, res) {
  // Vulnerable: exposing secrets in response
  res.json({
    dbPassword: process.env.DB_PASSWORD,
    token: process.env.API_TOKEN
  });
}

module.exports = { debugSecrets };
