module.exports = {
  meta: {
    name: "no-open-redirect",
    severity: "HIGH",
    description: "Detects potential open redirect vulnerabilities."
  },

  create(context) {
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

    function isDynamicUrl(node) {
      if (!node) {
        return false;
      }

      if (node.type === "TemplateLiteral") {
        return node.expressions.length > 0;
      }

      return ["Identifier", "MemberExpression", "CallExpression", "BinaryExpression", "LogicalExpression"].includes(node.type);
    }

    return {
      CallExpression(path) {
        const { node } = path;
        if (node.callee.type !== "MemberExpression" || node.arguments.length === 0) {
          return;
        }

        const methodName = getMemberName(node.callee);
        const firstArg = node.arguments[0];

        if (methodName === "redirect" && isDynamicUrl(firstArg)) {
          context.report(node, {
            rule: "no-open-redirect",
            severity: "HIGH",
            message:
              "Possible open redirect: validate or whitelist redirect targets."
          });
        }
      }
    };
  }
};
