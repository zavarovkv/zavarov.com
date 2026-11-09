import postcss from "postcss";
import valueParser from "postcss-value-parser";

// CSS escapes are not URL percent escapes. Decode them before URL resolution.
function unescapeCSS(value) {
  return value.replace(/\\(?:([0-9a-f]{1,6})(?:\r\n|[\t\n\f\r ])?|\r\n|[\n\f\r]|([^\n\f\r]))/gi, (_, hex, char) => {
    if (!hex) return char || "";
    const code = Number.parseInt(hex, 16);
    return code === 0 || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff) ? "\ufffd" : String.fromCodePoint(code);
  });
}

export function cssReferences(css, from) {
  const links = [];
  const add = value => {
    const url = unescapeCSS(value);
    // Fragment-only paint servers belong to the referring SVG/HTML, not CSS.
    if (url && !url.startsWith("#")) links.push(url);
  };
  function inspect(value, isImport = false) {
    const parsed = valueParser(value);
    if (isImport) {
      const first = parsed.nodes.find(node => !["space", "comment"].includes(node.type));
      if (first?.type === "string") add(first.value);
    }
    parsed.walk(node => {
      if (node.type !== "function") return;
      const name = unescapeCSS(node.value).toLowerCase();
      if (name === "url") {
        const parts = node.nodes.filter(part => !["space", "comment"].includes(part.type));
        add(parts.length === 1 ? parts[0].value : valueParser.stringify(parts));
        return false;
      }
      if (["image-set", "-webkit-image-set"].includes(name)) {
        for (const part of node.nodes) if (part.type === "string") add(part.value);
      }
    });
  }
  const ast = postcss.parse(css, { from });
  ast.walkDecls(decl => inspect(decl.value));
  ast.walkAtRules("import", rule => inspect(rule.params, true));
  return links;
}
