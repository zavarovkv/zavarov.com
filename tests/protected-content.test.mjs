import test from "node:test";
import assert from "node:assert/strict";
import { assertProtectedContent } from "../scripts/lib/protected-content.mjs";
import { prepareTranslation } from "../scripts/lib/translation.mjs";

const source = `Русский текст [ссылка][guide] и ![Описание](/photo.png "Заголовок").

[guide]: https://example.org/a(b)?x=1&y=2 "Руководство"

\`inline()\`

\`\`\`js {linenos=true}
const value = 1;
    run(value);
\`\`\`

{{< callout kind="note" >}}
Заметка.
{{< /callout >}}

{{< mermaid >}}
graph LR
  A --> B
{{< /mermaid >}}

Формула \\(x = 2\\).

$$a + b$$

<p class="note"><a href="/keep?x=1&amp;y=2" title="Русский">Текст</a></p>
<img src="/photo.png" srcset="/photo-2.png 2x" width="512" alt="Описание">
<pre><code>x = 1;</code></pre>
<p>{{< plug version="1" >}} \\(y = 3\\)</p>
`;

test("prose, Markdown labels and HTML text attributes may be translated", () => {
  const translated = source.replaceAll("Русский", "English").replaceAll("Описание", "Description")
    .replaceAll("Заголовок", "Title").replaceAll("Руководство", "Guide")
    .replaceAll("Заметка", "Note").replaceAll("Текст", "Text");
  assert.doesNotThrow(() => assertProtectedContent(source, translated, "example.md"));
  assert.doesNotThrow(() => assertProtectedContent(source, source.replaceAll("\n", "\r\n"), "example.md"));
});

for (const [label, before, after] of [
  ["reference URL", "https://example.org/a(b)", "https://example.org/changed"],
  ["image destination", "![Описание](/photo.png", "![Описание](/wrong.png"],
  ["inline code", "inline()", "changed()"],
  ["code value", "const value = 1", "const value = 2"],
  ["code indentation", "    run(value)", "run(value)"],
  ["code language/options", "js {linenos=true}", "js {linenos=false}"],
  ["shortcode attribute", 'kind="note"', 'kind="warning"'],
  ["diagram code", "A --> B", "A --> C"],
  ["inline formula", "x = 2", "x = 3"],
  ["block formula", "a + b", "a - b"],
  ["HTML target", "/keep?x=1", "/lost?x=1"],
  ["HTML image attribute", 'width="512"', 'width="1024"'],
  ["HTML code", "x = 1;", "x = 2;"],
  ["shortcode inside HTML", 'version="1"', 'version="2"'],
  ["formula inside HTML", "y = 3", "y = 4"],
]) test(`reject changed ${label} before assigning a source hash`, () => {
  const document = body => `+++\ntitle="Example"\n+++\n${body}`;
  assert.throws(() => prepareTranslation(document(source), document(source.replace(before, after)), "example.md"), /changed protected/);
});

test("nested code, escaped Markdown and data URLs have no false URL matches", () => {
  const text = '> - [link](<https://example.org/a%20b>)\n>\n>   ```text\n>   [not a link](missing)\n>   ```\n\n![icon](data:image/png;base64,AAAA)\n\n\\*plain\\*';
  assert.doesNotThrow(() => assertProtectedContent(text, text.replace('plain', 'обычный'), "nested.md"));
  assert.throws(() => assertProtectedContent(text, text.replace('missing', 'changed'), "nested.md"), /protected code/);
  assert.throws(() => assertProtectedContent(text, text.replace('AAAA', 'BBBB'), "nested.md"), /protected links/);
});

test("Mermaid with layout attributes still protects its complete diagram source", () => {
  for (const [open, close] of [['<', '>'], ['%', '%']]) {
    const text = `{{${open} mermaid wide=true caption="A diagram" ${close}}}\ngraph LR\n  A --> B\n{{${open} /mermaid ${close}}}`;
    assert.doesNotThrow(() => assertProtectedContent(text, text, 'diagram.md'));
    assert.throws(() => assertProtectedContent(text, text.replace('A --> B', 'A --> C'), 'diagram.md'), /protected opaque/);
    assert.throws(() => assertProtectedContent(text, text.replace(`{{${open} /mermaid ${close}}}`, ''), 'diagram.md'), /unclosed Mermaid/);
  }
});

test("inline HTML code stays protected across Markdown token boundaries", () => {
  const text = 'Text with <code>x &lt; 2</code> and <span title="Подпись">prose</span>.';
  assert.doesNotThrow(() => assertProtectedContent(text, text.replace('prose', 'текст').replace('Подпись', 'Label'), 'inline.md'));
  assert.throws(() => assertProtectedContent(text, text.replace('x &lt; 2', 'x &lt; 3'), 'inline.md'), /protected html/);
});

test("footnote prose translates while references and nested technical content remain protected", () => {
  const text = 'Текст[^brief] и текст[^details].\n\n[^brief]: Слово.\n\n[^details]: [Источник](https://example.org/note).\n\n    `value()` и \\(x=1\\).\n';
  const translated = text.replaceAll('Текст', 'Text').replaceAll('текст', 'text')
    .replace('Слово', 'Word').replace('Источник', 'Source');
  // Repeated parses must not retain references from the preceding document.
  for (let i = 0; i < 2; i++) assert.doesNotThrow(() => assertProtectedContent(text, translated, 'notes.md'));
  for (const [before, after] of [
    ['https://example.org/note', 'https://example.org/changed'],
    ['value()', 'changed()'],
    ['x=1', 'x=2'],
    ['[^brief]', '[^changed]'],
  ]) assert.throws(() => assertProtectedContent(text, translated.replaceAll(before, after), 'notes.md'), /changed protected/);
});
