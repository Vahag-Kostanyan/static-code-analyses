// src/rules/no-unsafe-query.js

module.exports = {
  meta: {
    name: "no-unsafe-query",
    severity: "HIGH",
    description: "Detects possible SQL injection via string concatenation or template literals."
  },

  create(context) {
    return {
      CallExpression(path) {
        const { node } = path;

        // Detect something.query(...)
        if (
          node.callee.type === "MemberExpression" &&
          node.callee.property &&
          node.callee.property.name === "query" &&
          node.arguments.length > 0
        ) {
          const firstArg = node.arguments[0];

          // Case 1: String concatenation
          if (firstArg.type === "BinaryExpression") {
            context.report(node, {
              rule: "no-unsafe-query",
              severity: "HIGH",
              message:
                "Possible SQL injection via string concatenation in query."
            });
          }

          // Case 2: Template literal with interpolation
          if (
            firstArg.type === "TemplateLiteral" &&
            firstArg.expressions.length > 0
          ) {
            context.report(node, {
              rule: "no-unsafe-query",
              severity: "HIGH",
              message:
                "Possible SQL injection via template literal interpolation in query."
            });
          }
        }
      }
    };
  }
};