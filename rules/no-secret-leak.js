module.exports = {
  meta: {
    name: "no-secret-leak",
    severity: "CRITICAL",
    description: "Detects potential secret leakage in logs and HTTP responses."
  },

  create(context) {
    const SECRET_WORDS = [
      "password",
      "secret",
      "token",
      "apikey",
      "api_key",
      "jwt",
      "privatekey",
      "private_key",
      "credential",
      "dbpassword",
      "db_password"
    ];

    const LEAK_SINKS = new Set(["log", "info", "debug", "warn", "error", "json", "send", "end", "write"]);

    function isSecretLikeName(name = "") {
      const normalized = name.toLowerCase();
      return SECRET_WORDS.some(word => normalized.includes(word));
    }

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

    function containsProcessEnv(node) {
      if (!node || typeof node !== "object") {
        return false;
      }

      if (
        node.type === "MemberExpression" &&
        node.object &&
        node.object.type === "MemberExpression" &&
        node.object.object &&
        node.object.object.type === "Identifier" &&
        node.object.object.name === "process" &&
        getMemberName(node.object) === "env"
      ) {
        return true;
      }

      for (const key of Object.keys(node)) {
        const value = node[key];
        if (Array.isArray(value)) {
          if (value.some(item => containsProcessEnv(item))) {
            return true;
          }
        } else if (value && typeof value === "object" && containsProcessEnv(value)) {
          return true;
        }
      }

      return false;
    }

    function containsSecretObject(node) {
      if (!node || node.type !== "ObjectExpression") {
        return false;
      }

      return node.properties.some(prop => {
        if (!prop || prop.type !== "ObjectProperty") {
          return false;
        }

        const keyName =
          prop.key.type === "Identifier"
            ? prop.key.name
            : prop.key.type === "StringLiteral"
              ? prop.key.value
              : "";

        return isSecretLikeName(keyName) || containsProcessEnv(prop.value);
      });
    }

    return {
      CallExpression(path) {
        const { node } = path;
        if (node.callee.type !== "MemberExpression") {
          return;
        }

        const sinkName = getMemberName(node.callee);
        if (!sinkName || !LEAK_SINKS.has(sinkName) || node.arguments.length === 0) {
          return;
        }

        const leaksSecret = node.arguments.some(arg => containsProcessEnv(arg) || containsSecretObject(arg));
        if (leaksSecret) {
          context.report(node, {
            rule: "no-secret-leak",
            severity: "CRITICAL",
            message:
              "Possible secret leak: avoid exposing secrets in logs or HTTP responses."
          });
        }
      }
    };
  }
};
