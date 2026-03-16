module.exports = {
  meta: {
    name: "no-console-log",
    description: "Detects console.log usage that may leak sensitive data.",
    severity: "medium"
  },

  create(context) {
    return {
      CallExpression(path) {
        const callee = path.node.callee;

        if (
          callee &&
          callee.type === "MemberExpression" &&
          callee.object &&
          callee.object.type === "Identifier" &&
          callee.object.name === "console" &&
          callee.property &&
          callee.property.type === "Identifier" &&
          callee.property.name === "log"
        ) {
          context.report(path, {
            message: "Avoid console.log in production code.",
            severity: "medium"
          });
        }
      }
    };
  }
};
