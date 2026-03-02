const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const fs = require("fs");

function scanFile(filePath, rules) {
    const code = fs.readFileSync(filePath, "utf8");

    const ast = parser.parse(code, {
        sourceType: "module",
        plugins: ["jsx"]
    });

    const findings = [];

    const context = {
        report(node, data) {
            findings.push({
                line: node.loc?.start?.line || null,
                column: node.loc?.start?.column || null,
                ...data
            });
        }
    };

    rules.forEach(rule => {
        const visitors = rule.create(context);
        traverse(ast, visitors);
    });

    return findings;
}

module.exports = { scanFile };