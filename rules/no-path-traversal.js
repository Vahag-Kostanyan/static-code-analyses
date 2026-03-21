module.exports = {
  meta: {
    name: "no-path-traversal",
    severity: "HIGH",
    description: "Detects possible path traversal in file-system operations."
  },

  create(context) {
    const FILE_SYSTEM_SINKS = new Set([
      "readFile",
      "readFileSync",
      "writeFile",
      "writeFileSync",
      "appendFile",
      "appendFileSync",
      "createReadStream",
      "createWriteStream",
      "open",
      "openSync",
      "unlink",
      "unlinkSync"
    ]);

    function getMemberName(memberExpr) {
      if (!memberExpr || memberExpr.type !== "MemberExpression") {
        return null;
      }

      if (!memberExpr.computed && memberExpr.property.type === "Identifier") {
        return memberExpr.property.name;
      }

      if (memberExpr.computed && memberExpr.property.type === "StringLiteral") {
        return memberExpr.property.value;
      }

      return null;
    }

    function isDynamicInput(node) {
      if (!node) {
        return false;
      }

      if (node.type === "TemplateLiteral") {
        return node.expressions.length > 0;
      }

      if (["BinaryExpression", "LogicalExpression", "Identifier", "MemberExpression", "CallExpression"].includes(node.type)) {
        return true;
      }

      return false;
    }

    function isUnsafePathBuilder(node) {
      if (!node || node.type !== "CallExpression" || node.callee.type !== "MemberExpression") {
        return false;
      }

      const calleeObject = node.callee.object;
      const calleeName = getMemberName(node.callee);

      if (
        !calleeName ||
        calleeObject.type !== "Identifier" ||
        calleeObject.name !== "path" ||
        !["join", "resolve", "normalize"].includes(calleeName)
      ) {
        return false;
      }

      return node.arguments.some(arg => isDynamicInput(arg));
    }

    return {
      CallExpression(path) {
        const { node } = path;
        if (node.callee.type !== "MemberExpression") {
          return;
        }

        const sinkName = getMemberName(node.callee);
        if (!sinkName || !FILE_SYSTEM_SINKS.has(sinkName) || node.arguments.length === 0) {
          return;
        }

        const filePathArg = node.arguments[0];
        if (isDynamicInput(filePathArg) || isUnsafePathBuilder(filePathArg)) {
          context.report(node, {
            rule: "no-path-traversal",
            severity: "HIGH",
            message:
              "Possible path traversal: avoid using untrusted input in filesystem path operations."
          });
        }
      }
    };
  }
};
