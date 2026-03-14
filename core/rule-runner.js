// A small helper to run a set of rule modules against a file AST.
// This file is not strictly required for current behavior but is provided
// as an example of how rule execution could be centralized.

function runRules(rules, context, visitors) {
  rules.forEach(rule => {
    const ruleVisitors = rule.create(context);
    visitors(ruleVisitors);
  });
}

module.exports = { runRules };
