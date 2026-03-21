module.exports = {
  meta: {
    name: "no-prototype-pollution",
    severity: "HIGH",
    description: "Detects patterns that may lead to prototype pollution."
  },

  create(context) {
    const DANGEROUS_KEYS = new Set(["__proto__", "prototype", "constructor"]);

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

    function isDynamicObjectInput(node) {
      if (!node) {
        return false;
      }

      return ["Identifier", "MemberExpression", "CallExpression"].includes(node.type);
    }

    return {
      AssignmentExpression(path) {
        const { node } = path;
        if (node.left.type !== "MemberExpression") {
          return;
        }

        const keyName = getMemberName(node.left);
        if (keyName && DANGEROUS_KEYS.has(keyName)) {
          context.report(node, {
            rule: "no-prototype-pollution",
            severity: "HIGH",
            message:
              "Possible prototype pollution via assignment to __proto__/prototype/constructor."
          });
          return;
        }

        if (node.left.computed && node.left.property.type !== "StringLiteral") {
          context.report(node, {
            rule: "no-prototype-pollution",
            severity: "HIGH",
            message:
              "Possible prototype pollution via dynamic object property assignment."
          });
        }
      },

      CallExpression(path) {
        const { node } = path;
        if (node.callee.type !== "MemberExpression") {
          return;
        }

        const objectName = node.callee.object.type === "Identifier" ? node.callee.object.name : null;
        const methodName = getMemberName(node.callee);

        if (objectName === "Object" && methodName === "assign" && node.arguments.length >= 2) {
          const sourceArg = node.arguments[1];
          if (isDynamicObjectInput(sourceArg)) {
            context.report(node, {
              rule: "no-prototype-pollution",
              severity: "HIGH",
              message:
                "Possible prototype pollution: avoid Object.assign with untrusted object input."
            });
          }
        }
      }
    };
  }
};
