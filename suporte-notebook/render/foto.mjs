import { chromium } from 'playwright-core';
import http from 'http'; import fs from 'fs'; import path from 'path';
const raiz = path.dirname(new URL(import.meta.url).pathname);
const srv = http.createServer((q, s) => {
  const f = path.join(raiz, decodeURIComponent(q.url.split('?')[0]));
  fs.readFile(f, (e, d) => { if (e) { s.writeHead(404); s.end(); return; }
    s.writeHead(200, { 'Content-Type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.html') ? 'text/html' : 'application/octet-stream' }); s.end(d); });
}).listen(8765);
const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const jobs = JSON.parse(fs.readFileSync(path.resolve(raiz, process.argv[2] || 'vistas.json')));
for (const [saida, qs] of Object.entries(jobs)) {
  const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
  p.on('console', m => console.log('[pg]', m.text())); p.on('pageerror', e => console.log('[err]', e.message));
  await p.goto('http://localhost:8765/cena.html?' + qs);
  await p.waitForFunction(() => window.PRONTO === true, null, { timeout: 240000 });
  await p.locator('canvas').screenshot({ path: path.resolve(raiz, saida) }); await p.close(); console.log('ok', saida);
}
await b.close(); srv.close();
