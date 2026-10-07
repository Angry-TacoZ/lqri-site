import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const interactive = new Set(['models/index.html', 'charts/index.html', 'archive/index.html']);
const files = (await readdir('dist', { recursive: true })).map(path => path.replaceAll('\\', '/'));
let staticPages = 0;
for (const path of files.filter(path => path.endsWith('.html'))) {
  const html = await readFile(join('dist', path), 'utf8');
  assert.match(html, /<h1[ >]/, `${path} must contain prerendered content`);
  if (interactive.has(path)) {
    assert.match(html, /<astro-island /, `${path} must hydrate its comparison controls`);
    assert.match(html, /<a[^>]+href="\/models\//, `${path} must include model links before hydration`);
  } else {
    assert.doesNotMatch(html, /<script\b|<astro-island\b/, `${path} must work without browser JavaScript`);
    staticPages++;
  }
}
assert.ok(staticPages >= 4, 'Expected static reading pages');
const scripts = await Promise.all(files.filter(path => path.endsWith('.js')).map(path => readFile(join('dist', path))));
const raw = scripts.reduce((sum, script) => sum + script.length, 0);
const gzip = scripts.reduce((sum, script) => sum + gzipSync(script).length, 0);
// Baseline after migration: ~203 kB raw / 64 kB gzip. Leave room for
// comparison features, while catching accidental restoration of the full app.
assert.ok(raw <= 300_000, `Browser JS budget exceeded: ${raw} > 300000 bytes`);
assert.ok(gzip <= 100_000, `Gzip JS budget exceeded: ${gzip} > 100000 bytes`);
const bundle = Buffer.concat(scripts).toString();
let evidenceChecks = 0;
for (const directory of ['src/data/reports', 'src/data/transcripts']) {
  for (const path of (await readdir(directory, { recursive: true })).filter(path => path.endsWith('.md'))) {
    const markdown = await readFile(join(directory, path), 'utf8');
    // Distinctive long ASCII passages catch raw evidence being imported into JS.
    for (const passage of markdown.match(/[A-Za-z][A-Za-z0-9 ,.;:()?!'-]{139,}/g) ?? []) {
      assert.ok(!bundle.includes(passage), `Evidence leaked into browser JS: ${path}`);
      evidenceChecks++;
    }
  }
}
assert.ok(evidenceChecks > 0, 'Expected preserved evidence to check');
console.log(`PASS: ${staticPages} static pages without JS; ${evidenceChecks} evidence passages excluded; browser JS ${raw} bytes / ${gzip} gzip bytes`);
