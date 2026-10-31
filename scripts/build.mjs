import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { transform } from 'esbuild';
const root = process.cwd(), out = path.resolve(root, 'dist');
if (out !== path.join(root, 'dist')) throw Error('Unexpected output directory');
const css = await fs.readdir('assets/css'), js = await fs.readdir('assets/js');
const files = [...css.map(f => `assets/css/${f}`), ...js.map(f => `assets/js/${f}`)];
const source = new Map(await Promise.all(files.map(async f => [f, await fs.readFile(f, 'utf8')])));
// One deterministic version includes every source, so dependency changes invalidate importers too.
const version = crypto.createHash('sha256').update([...source.values()].join('\n')).digest('hex').slice(0, 12);
const names = new Map(files.map(f => [f, f.replace(/\.(css|js)$/, `.${version}.$1`)]));
function rewrite(text, file) {
  return text.replace(/(["'`])([^"'`\s]+\.(?:js|css))\1/g, (whole, quote, url) => {
    if (/^(?:https?:|data:)/.test(url)) return whole;
    const target = url.startsWith('/') ? url.slice(1) : path.posix.normalize(path.posix.join(path.posix.dirname(file), url));
    if (!names.has(target)) return whole;
    let replacement = url.startsWith('/') ? '/' + names.get(target) : path.posix.relative(path.posix.dirname(file), names.get(target));
    if (!url.startsWith('/') && !replacement.startsWith('.')) replacement = './' + replacement;
    return quote + replacement + quote;
  });
}
await fs.rm(out, {recursive:true, force:true});
await fs.mkdir(out, {recursive:true});
await fs.cp('assets', path.join(out, 'assets'), {recursive:true});
let before = 0, after = 0;
for (const [file, text] of source) {
  const result = await transform(rewrite(text, file), {loader:file.endsWith('.css')?'css':'js', minify:true, target:'es2020', legalComments:'inline'});
  await fs.writeFile(path.join(out, names.get(file)), result.code);
  // Copied source files are unneeded in the publish artifact; the working sources remain intact.
  await fs.unlink(path.join(out, file));
  before += Buffer.byteLength(text); after += Buffer.byteLength(result.code);
}
for (const file of (await fs.readdir(root)).filter(f => f.endsWith('.html'))) {
  await fs.writeFile(path.join(out, file), rewrite(await fs.readFile(file, 'utf8'), file));
}
await fs.writeFile(path.join(out, 'build-info.json'), JSON.stringify({version, sourceBytes:before, minifiedBytes:after}, null, 2));
console.log(`Publish folder: dist | JS/CSS ${before} -> ${after} bytes | version ${version}`);
