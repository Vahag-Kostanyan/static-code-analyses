module.exports = {
  meta: {
    name: "no-command-exec",
    severity: "HIGH",
    description: "Detects possible command injection in child_process execution calls."
  },

  create(context) {
    function getCalleeName(callee) {
      if (!callee) {
        return null;
      }

      if (callee.type === "Identifier") {
        return callee.name;
      }

      if (
        callee.type === "MemberExpression" &&
        callee.property &&
        callee.property.type === "Identifier"
      ) {
        return callee.property.name;
      }

      return null;
    }

    function isDynamicCommand(arg) {
      if (!arg) {
        return false;
      }

      if (arg.type === "BinaryExpression" || arg.type === "LogicalExpression") {
        return true;
      }

      if (arg.type === "TemplateLiteral") {
        return arg.expressions.length > 0;
      }

      return ["Identifier", "MemberExpression", "CallExpression"].includes(arg.type);
    }

    function hasShellEnabled(node) {
      const optionsArg = node.arguments[2];
      if (!optionsArg || optionsArg.type !== "ObjectExpression") {
        return false;
      }

      return optionsArg.properties.some(prop => {
        if (!prop || prop.type !== "ObjectProperty") {
          return false;
        }

        if (prop.key.type !== "Identifier" || prop.key.name !== "shell") {
          return false;
        }

        return prop.value.type === "BooleanLiteral" && prop.value.value === true;
      });
    }

    return {
      CallExpression(path) {
        const { node } = path;
        const calleeName = getCalleeName(node.callee);
        const firstArg = node.arguments[0];

        if (!calleeName || !firstArg) {
          return;
        }

        if (["exec", "execSync"].includes(calleeName) && isDynamicCommand(firstArg)) {
          context.report(node, {
            rule: "no-command-exec",
            severity: "HIGH",
            message:
              "Possible command injection: avoid dynamic input in child_process exec/execSync."
          });
        }

        if (
          ["spawn", "spawnSync"].includes(calleeName) &&
          hasShellEnabled(node) &&
          isDynamicCommand(firstArg)
        ) {
          context.report(node, {
            rule: "no-command-exec",
            severity: "HIGH",
            message:
              "Possible command injection: dynamic command with shell:true in spawn/spawnSync."
          });
        }
      }
    };
  }
};
