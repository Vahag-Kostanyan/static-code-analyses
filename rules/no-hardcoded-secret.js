// src/rules/no-hardcoded-secret.js

const SECRET_KEYWORDS = [
  "password",
  "secret",
  "token",
  "apiKey",
  "apikey",
  "privateKey",
  "jwt",
  "bearer"
];

function containsSecretKeyword(name = "") {
  return SECRET_KEYWORDS.some(keyword =>
    name.toLowerCase().includes(keyword.toLowerCase())
  );
}

module.exports = {
  meta: {
    name: "no-hardcoded-secret",
    severity: "CRITICAL",
    description: "Detects potential hardcoded secrets in code."
  },

  create(context) {
    return {
      VariableDeclarator(path) {
        const { node } = path;

        if (
          node.id.type === "Identifier" &&
          node.init &&
          node.init.type === "StringLiteral" &&
          containsSecretKeyword(node.id.name)
        ) {
          context.report(node, {
            rule: "no-hardcoded-secret",
            severity: "CRITICAL",
            message: `Possible hardcoded secret detected in variable "${node.id.name}".`
          });
        }
      },

      ObjectProperty(path) {
        const { node } = path;

        if (
          node.key.type === "Identifier" &&
          node.value.type === "StringLiteral" &&
          containsSecretKeyword(node.key.name)
        ) {
          context.report(node, {
            rule: "no-hardcoded-secret",
            severity: "CRITICAL",
            message: `Possible hardcoded secret detected in object property "${node.key.name}".`
          });
        }
      }
    };
  }
};