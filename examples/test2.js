function findUserById(db, userInput) {
  db.query("SELECT * FROM users WHERE id=" + userInput);
  db.query(`SELECT * FROM users WHERE id = ${userInput}`);
}

setTimeout("console.log('scheduled string execution')", 1000);

module.exports = { findUserById };
