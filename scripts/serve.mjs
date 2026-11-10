import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import config from '../vercel.json' with { type: 'json' };

const root = fileURLToPath(new URL('../dist', import.meta.url));
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8', '.mp4': 'video/mp4',
};
const headers = Object.fromEntries(config.headers[0].headers.map(({ key, value }) => [key, value]));

createServer(async (request, response) => {
  try {
    const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = resolve(root, `.${path}${path.endsWith('/') ? 'index.html' : ''}`);
    if (!file.startsWith(root + sep)) throw new Error('Outside web root');
    const contents = await readFile(file);
    response.writeHead(200, { ...headers, 'Content-Type': types[extname(file)] ?? 'application/octet-stream' });
    response.end(request.method === 'HEAD' ? undefined : contents);
  } catch {
    response.writeHead(404, { ...headers, 'Content-Type': types['.html'] });
    response.end(await readFile(resolve(root, '404.html')).catch(() => 'Page not found. Run npm run build first.'));
  }
}).listen(process.env.PORT || 4173, '127.0.0.1', function () {
  console.log(`Portfolio running at http://127.0.0.1:${this.address().port}`);
});
