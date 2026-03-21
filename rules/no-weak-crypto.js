module.exports = {
  meta: {
    name: "no-weak-crypto",
    severity: "HIGH",
    description: "Detects weak cryptographic algorithms."
  },

  create(context) {
    const WEAK_HASHES = new Set(["md5", "sha1"]);
    const WEAK_CIPHER_MARKERS = ["des", "rc2", "rc4", "3des"];

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

    function getFirstStringArg(node) {
      if (!node.arguments || node.arguments.length === 0) {
        return null;
      }

      const firstArg = node.arguments[0];
      return firstArg.type === "StringLiteral" ? firstArg.value.toLowerCase() : null;
    }

    return {
      CallExpression(path) {
        const { node } = path;
        if (node.callee.type !== "MemberExpression") {
          return;
        }

        const methodName = getMemberName(node.callee);
        if (!methodName) {
          return;
        }

        const algorithm = getFirstStringArg(node);
        if (!algorithm) {
          return;
        }

        if (methodName === "createHash" && WEAK_HASHES.has(algorithm)) {
          context.report(node, {
            rule: "no-weak-crypto",
            severity: "HIGH",
            message: `Weak hash algorithm detected (${algorithm}). Use SHA-256 or stronger.`
          });
          return;
        }

        if (
          ["createCipher", "createCipheriv", "createHmac"].includes(methodName) &&
          WEAK_CIPHER_MARKERS.some(marker => algorithm.includes(marker))
        ) {
          context.report(node, {
            rule: "no-weak-crypto",
            severity: "HIGH",
            message: `Weak crypto algorithm detected (${algorithm}). Use modern, secure algorithms.`
          });
        }
      }
    };
  }
};
