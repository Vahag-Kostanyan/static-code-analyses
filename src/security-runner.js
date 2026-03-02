if (allFindings.length > 0) {
  console.log("❌ Security issues found!");
  process.exit(1); // blocks push
} else {
  console.log("✅ Code is secure!");
  process.exit(0); // push allowed
}