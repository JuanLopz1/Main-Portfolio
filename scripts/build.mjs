import { cp, lstat, mkdir, realpath, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { projects, site } from '../content/projects.mjs';
import { demo, detail, escape, home, notFound } from './templates.mjs';

const root = await realpath(fileURLToPath(new URL('..', import.meta.url)));
const output = join(root, 'dist');
const existingOutput = await lstat(output).catch(error => {
  if (error.code !== 'ENOENT') throw error;
});
if (existingOutput) {
  if (!existingOutput.isDirectory() || await realpath(output) !== output) {
    throw new Error('The build output must be a regular dist directory inside the project.');
  }
  await rm(output, { recursive: true });
}
await mkdir(output);
await cp(join(root, 'public'), output, { recursive: true });

const files = [
  ['/', home()],
  ...projects.map(project => [`/projects/${project.slug}/`, detail(project)]),
  ['/demos/address-migration/', demo()],
];

for (const [path, html] of files) {
  const directory = join(output, path);
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, 'index.html'), html);
}

const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n' +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${files.map(([path]) => `  <url><loc>${escape(site.url + path)}</loc></url>`).join('\n')}\n</urlset>\n`;
await writeFile(join(output, 'sitemap.xml'), sitemap);
await writeFile(join(output, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${site.url}/sitemap.xml\n`);
await writeFile(join(output, '404.html'), notFound());
console.log(`Built ${files.length} pages in ${output}`);
