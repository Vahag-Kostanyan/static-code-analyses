// src/rules/no-eval.js

module.exports = {
  meta: {
    name: "no-eval",
    severity: "HIGH",
    description: "Avoid using eval(), new Function(), or string-based execution functions."
  },

  create(context) {
    return {
      CallExpression(path) {
        const { node } = path;

        // Detect eval()
        if (
          node.callee.type === "Identifier" &&
          node.callee.name === "eval"
        ) {
          context.report(node, {
            rule: "no-eval",
            severity: "HIGH",
            message: "Avoid using eval() — it can lead to code injection."
          });
        }

        // Detect setTimeout("string")
        if (
          node.callee.type === "Identifier" &&
          ["setTimeout", "setInterval"].includes(node.callee.name) &&
          node.arguments.length > 0 &&
          node.arguments[0].type === "StringLiteral"
        ) {
          context.report(node, {
            rule: "no-eval",
            severity: "HIGH",
            message: "Avoid passing string to setTimeout/setInterval."
          });
        }
      },

      NewExpression(path) {
        const { node } = path;

        // Detect new Function()
        if (
          node.callee.type === "Identifier" &&
          node.callee.name === "Function"
        ) {
          context.report(node, {
            rule: "no-eval",
            severity: "HIGH",
            message: "Avoid using new Function() — dynamic code execution risk."
          });
        }
      }
    };
  }
};