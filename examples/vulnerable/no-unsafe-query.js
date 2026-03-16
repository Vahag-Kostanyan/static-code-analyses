function getUser(db, userId) {
  // Vulnerable: SQL injection via concatenation
  return db.query("SELECT * FROM users WHERE id=" + userId);
}

function searchUser(db, name) {
  // Vulnerable: SQL injection via template interpolation
  return db.query(`SELECT * FROM users WHERE name = '${name}'`);
}

module.exports = { getUser, searchUser };
