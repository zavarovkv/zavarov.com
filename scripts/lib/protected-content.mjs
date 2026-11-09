import { Marked } from "marked";
import markedFootnote from "marked-footnote";
import { parseFragment } from "parse5";
import { isDeepStrictEqual } from "node:util";

// Hugo shortcodes and the site's Goldmark math delimiters are opaque to
// Markdown parsers. Recognize them before Markdown consumes their escapes.
function protectedToken(src, type) {
  const shortcode = src.match(/^\{\{([<%])/);
  if (shortcode) {
    const close = shortcode[1] === "<" ? ">}}" : "%}}";
    let quote = "";
    for (let i = 3; i < src.length; i++) {
      const char = src[i];
      if (quote) {
        if (char === "\\" && quote !== "`") i++;
        else if (char === quote) quote = "";
      } else if ('"\'`'.includes(char)) quote = char;
      else if (src.startsWith(close, i)) {
        let raw = src.slice(0, i + 3);
        if (/^\{\{[<%]\s*mermaid\s*[>%]\}\}$/.test(raw)) {
          const end = /\{\{[<%]\s*\/mermaid\s*[>%]\}\}/.exec(src.slice(raw.length));
          if (!end) throw new Error("unclosed Mermaid shortcode");
          raw = src.slice(0, raw.length + end.index + end[0].length);
        }
        return { type, raw };
      }
    }
    throw new Error("unclosed Hugo shortcode");
  }
  for (const [open, close] of [["\\(", "\\)"], ["\\[", "\\]"], ["$$", "$$"]]) {
    if (!src.startsWith(open)) continue;
    const end = src.indexOf(close, open.length);
    if (end < 0) throw new Error("unclosed math delimiter");
    return { type, raw: src.slice(0, end + close.length) };
  }
}

const protectedMarkdown = { gfm: true, extensions: ["block", "inline"].map(level => ({
  name: `protected_${level}`,
  level,
  start: src => src.search(/\{\{[<%]|\\[([]|\$\$/),
  tokenizer(src) { return protectedToken(src, `protected_${level}`); },
  renderer() { return ""; },
})) };

const proseAttributes = new Set(["alt", "title", "aria-label", "placeholder"]);

function htmlContract(html) {
  function visit(node, code = false) {
    const opaque = code || ["pre", "code", "script", "style"].includes(node.tagName);
    if (node.nodeName === "#text" && !opaque) {
      const protectedText = [];
      const pattern = /\{\{[<%]|\\[([]|\$\$/g;
      let match;
      while ((match = pattern.exec(node.value))) {
        const token = protectedToken(node.value.slice(match.index), "html_protected");
        if (token) {
          protectedText.push({ source: token.raw });
          pattern.lastIndex = match.index + token.raw.length;
        }
      }
      return protectedText;
    }
    const children = (node.content?.childNodes || node.childNodes || []).flatMap(child => visit(child, opaque));
    if (!node.tagName) return children;
    const attrs = (node.attrs || []).filter(attr => !proseAttributes.has(attr.name))
      .map(({ name, value, namespace }) => [namespace || "", name, value])
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
    const text = node => node.value || (node.childNodes || []).map(text).join("");
    return [{ tag: node.tagName, attrs, children,
      ...(["pre", "code", "script", "style"].includes(node.tagName) ? { source: text(node) } : {}) }];
  }
  return visit(parseFragment(html));
}

export function protectedContent(body) {
  const contract = { code: [], links: [], opaque: [], footnotes: [], references: [], html: [] };
  // Footnote extensions keep per-document state. Use the full parse lifecycle
  // and a fresh instance so short note prose is not mistaken for a link URL.
  const markdown = new Marked(protectedMarkdown, markedFootnote(), {
    hooks: {
      processAllTokens(tokens) {
        // Preserve even unused reference destinations; labels may translate.
        contract.references = Object.values(tokens.links).map(link => link.href).sort();
        return tokens;
      },
    },
    walkTokens(token) {
      if (["code", "codespan"].includes(token.type)) contract.code.push([token.type, token.lang || "", token.text]);
      if (["link", "image"].includes(token.type)) contract.links.push([token.type, token.href]);
      if (token.type.startsWith("protected_")) contract.opaque.push(token.raw);
      if (["footnote", "footnoteRef"].includes(token.type)) contract.footnotes.push([token.type, token.label]);
    },
  });
  // Parse the rendered tree, not isolated HTML tokens: inline <code> content
  // is otherwise separated into text tokens and would escape validation.
  contract.html = htmlContract(markdown.parse(body.replace(/\r\n/g, "\n")));
  return contract;
}

export function assertProtectedContent(source, translated, file) {
  const before = protectedContent(source);
  const after = protectedContent(translated);
  for (const key of Object.keys(before)) {
    if (!isDeepStrictEqual(before[key], after[key])) throw new Error(`${file}: translation changed protected ${key}`);
  }
}
