import { projects, site } from '../content/projects.mjs';
import { columns, statuses } from '../public/scripts/address-validation.mjs';

export const escape = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

const paths = {
  right: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  left: '<path d="M20 12H5m6-6-6 6 6 6"/>',
  external: '<path d="M6 18 18 6M8 6h10v10"/>',
  down: '<path d="M12 4v15m-6-6 6 6 6-6"/>',
  table: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18m-12 0v9"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4"/>',
};

export function icon(name) {
  return `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</svg>`;
}

const detailUrl = project => `/projects/${project.slug}/`;
const tags = list => `<ul class="tags" aria-label="Technologies">${list.map(text => `<li>${escape(text)}</li>`).join('')}</ul>`;
const kicker = text => `<p class="kicker"><span class="marker" aria-hidden="true"></span>${escape(text)}</p>`;
const button = (href, label, kind, glyph) => `<a class="button button-${kind}" href="${escape(href)}">${escape(label)}${glyph ? icon(glyph) : ''}</a>`;
const link = (href, label, glyph = 'right', extra = '') => `<a class="text-link ${extra}" href="${escape(href)}">${glyph === 'left' ? icon(glyph) : ''}${escape(label)}${glyph !== 'left' ? icon(glyph) : ''}</a>`;
const image = (shot, eager = false) => `<img src="/assets/${escape(shot.src)}" width="${shot.width}" height="${shot.height}" alt="${escape(shot.alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"'}>`;

function nav() {
  return `<header class="site-header dark"><nav class="wrap site-nav" aria-label="Main">
    <a class="brand" href="/"><span class="monogram" aria-hidden="true">JL</span><span>Juan López</span></a>
    <ul><li><a class="nav-link" href="/#projects">Projects</a></li><li><a class="nav-link" href="/#about">About</a></li><li><a class="nav-link" href="/#contact">Contact</a></li></ul>
  </nav></header>`;
}

function footer() {
  return `<footer class="footer dark"><div class="wrap"><p>Juan López <span aria-hidden="true">·</span> Ontario, Canada</p>${link(site.resume, 'View résumé', 'external')}</div></footer>`;
}

export function page({ title, description, path, body, stylesheet, script, noindex = false }) {
  const canonical = escape(site.url + path);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#191d26">
  <title>${escape(title)}</title>
  <meta name="description" content="${escape(description)}">
  <link rel="canonical" href="${canonical}">
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="preload" href="/assets/source-serif-4.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/assets/site.css">
  ${stylesheet ? `<link rel="stylesheet" href="/assets/${stylesheet}">` : ''}
  ${noindex ? '<meta name="robots" content="noindex">' : ''}
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Juan López">
  <meta property="og:url" content="${canonical}">
  <meta property="og:title" content="${escape(title)}">
  <meta property="og:description" content="${escape(description)}">
  <meta property="og:image" content="${site.url}/assets/share.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Juan López, software, data and automation. Portfolio of projects from Ontario, Canada.">
  <meta name="twitter:card" content="summary_large_image">
  ${script ? `<script type="module" src="/scripts/${script}"></script>` : ''}
</head>
<body>
  <a class="skip-link" href="#main">Skip to main content</a>
  ${nav()}
  <main id="main" tabindex="-1">${body}</main>
  ${footer()}
</body>
</html>\n`;
}

function card(project) {
  const projectLink = `<a class="text-link" href="${detailUrl(project)}" aria-label="Case study: ${escape(project.title)}">Case study${icon('right')}</a>`;
  return `<article class="project-card">
    <div class="project-shot">${image(project.image)}</div>
    <div class="card-content">
      <p class="kicker">${escape(project.area)}</p>
      <h3>${escape(project.title)}</h3>
      <p>${escape(project.summary)}</p>
      ${tags(project.stack)}
      <div class="actions">${projectLink}${project.demo ? link(project.demo.href, project.demo.label, 'external') : ''}</div>
    </div>
  </article>`;
}

export function home() {
  const [amt] = projects;
  return page({ title: site.title, description: site.description, path: '/', body: `
    <section class="hero dark" aria-labelledby="hero-title">
      <div class="wrap hero-grid">
        <div class="hero-copy">
          ${kicker('Portfolio / Ontario, Canada')}
          <h1 id="hero-title">Juan López</h1>
          <p class="hero-role">IT Coordinator · Software &amp; Data Automation</p>
          <p class="hero-intro">I build tools for checking and moving data, automating repeatable work, and making records easier to manage.</p>
          <div class="actions">
            ${button('#projects', 'Explore projects', 'primary', 'down')}
            ${button(site.resume, 'View résumé', 'outline', 'external')}
            ${button(site.bot, 'Talk to Juan Bot', 'quiet', 'external')}
          </div>
        </div>
        <figure class="hero-visual">
          <div class="hero-frame">
            <div class="frame-top"><span>${icon('table')}Address Migration Toolkit</span><span class="frame-tag">Synthetic demo</span></div>
            ${image(amt.image, true)}
          </div>
          <figcaption class="hero-caption"><span>Sample CSV · Local validation · Report export</span>${link(amt.demo.href, 'Try the demo')}</figcaption>
        </figure>
      </div>
    </section>
    <section id="projects" class="section wrap" aria-labelledby="featured-title">
      <div class="section-title"><div>${kicker('Portfolio')}<h2 id="featured-title">Featured projects</h2></div><p>Public applications and independent demos, with case studies that explain what I built.</p></div>
      <div class="feature-grid">${projects.filter(project => project.featured).map(card).join('')}</div>
    </section>
    <section class="section project-index wrap" aria-labelledby="index-title">
      <div class="section-title"><div>${kicker('Browse the work')}<h2 id="index-title">Project index</h2></div></div>
      <ul class="index-list">${projects.map(project => `<li><a class="index-link" href="${detailUrl(project)}">
        <span><span class="index-title">${escape(project.title)}</span><span class="index-area">${escape(project.area)}</span></span>
        <span class="index-status">${escape(project.status)}</span>${icon('right')}
      </a></li>`).join('')}</ul>
    </section>
    <section id="about" class="section about" aria-labelledby="about-title">
      <div class="wrap about-grid">
        <div>${kicker('Background')}<h2 id="about-title">About me</h2><p class="intro">I’m an IT Coordinator at PenFinancial Credit Union in Welland. I support workplace technology and build Python and SQL workflows for data validation, migration, and reporting. I’m also finishing the Computer Programming and Analysis advanced diploma at Niagara College.</p>${link(site.resume, 'See my experience and education', 'external')}</div>
        <dl class="profile-facts"><div><dt>PenFinancial Credit Union</dt><dd>IT Coordinator · May 2026–Present</dd></div><div><dt>Niagara College</dt><dd>Computer Programming and Analysis · Expected December 2026</dd></div><div><dt>Based in</dt><dd>Ontario, Canada</dd></div></dl>
      </div>
    </section>
    <section id="contact" class="section contact dark" aria-labelledby="contact-title">
      <div class="wrap contact-grid"><div>${kicker('Contact')}<h2 id="contact-title">Get in touch.</h2><p>For questions about my work, projects, or opportunities.</p></div>
      <div class="actions">${button(`mailto:${site.email}`, site.email, 'primary', 'mail')}${button(site.linkedin, 'LinkedIn', 'outline', 'external')}${button(site.bot, 'Juan Bot', 'quiet', 'external')}</div></div>
    </section>` });
}

export function detail(project) {
  const action = project.demo ? button(project.demo.href, project.demo.label, 'primary', project.demo.href.startsWith('/') ? 'right' : 'external') : '';
  const gallery = [project.image, ...(project.gallery ?? [])].filter(Boolean);
  return page({ title: `${project.title} | Juan López`, description: project.summary, path: detailUrl(project), body: `
    <section class="project-hero dark" aria-labelledby="project-title"><div class="wrap">
      ${link('/#projects', 'All projects', 'left', 'back-link')}
      ${kicker(project.context)}
      <h1 id="project-title">${escape(project.title)}</h1>
      <p class="lede">${escape(project.summary)}</p>
      ${action ? `<div class="actions">${action}</div>` : ''}
    </div></section>
    <div class="section wrap detail-layout">
      <div class="detail-content">
        <section><h2>The problem</h2><p>${escape(project.problem)}</p></section>
        <section><h2>My contribution</h2><p>${escape(project.contribution)}</p></section>
        <section><h2>What it does</h2><ul>${project.features.map(feature => `<li>${escape(feature)}</li>`).join('')}</ul></section>
        ${gallery.map(shot => `<figure class="detail-shot">${image(shot)}${shot.caption ? `<figcaption>${escape(shot.caption)}</figcaption>` : ''}</figure>`).join('')}
        ${project.media ? `<figure class="detail-shot"><video controls preload="metadata" width="${project.media.width}" height="${project.media.height}" poster="/assets/${escape(project.image.src)}" aria-label="${escape(project.media.caption)}"><source src="/assets/${escape(project.media.src)}" type="video/mp4"></video><figcaption>${escape(project.media.caption)}</figcaption></figure>` : ''}
        <section><h2>Result and lessons</h2><p>${escape(project.outcome)}</p></section>
      </div>
      <aside class="detail-aside" aria-label="Project facts">
        <section><h2>Stack</h2>${tags(project.stack)}</section>
        <section><h2>${escape(project.status)}</h2><p>${escape(project.instructions)}</p>${project.demo ? link(project.demo.href, project.demo.label, project.demo.href.startsWith('/') ? 'right' : 'external') : ''}</section>
      </aside>
    </div>` });
}

export function demo() {
  return page({ title: 'Address Migration Toolkit Demo | Juan López', description: 'Try local CSV validation, duplicate detection and report export on synthetic address records.', path: '/demos/address-migration/', stylesheet: 'demo.css', script: 'address-demo.mjs', body: `
    <section class="demo-heading dark" aria-labelledby="demo-title"><div class="wrap">
      ${link('/projects/address-migration-toolkit/', 'Project case study', 'left')}
      ${kicker('Browser demo / Synthetic data')}
      <h1 id="demo-title">Address Migration Toolkit</h1>
      <p>Check a sample CSV for missing fields, duplicates, and formatting issues. The browser applies local rules to fictional addresses.</p>
    </div></section>
    <div class="wrap demo-shell">
      <section class="demo-panel controls-panel" aria-labelledby="input-title">
        <div class="panel-heading"><div><h2 id="input-title">1. Load a CSV</h2><p id="input-summary">No CSV loaded</p></div><button class="button button-quiet" type="button" id="reset-demo" disabled>Reset</button></div>
        <div class="actions"><button class="button button-outline" type="button" id="load-sample">Load sample CSV</button><button class="button button-outline" type="button" id="choose-file" aria-describedby="file-guidance">Choose CSV</button><input type="file" id="csv-file" accept=".csv,text/csv" hidden></div>
        <p class="file-guidance" id="file-guidance">Use synthetic records only. Up to 1 MB or 5,000 rows. Files stay in this browser tab.</p>
        <details class="csv-format"><summary>Required CSV format</summary><p>Use the header <code>${columns.join(', ')}</code>. Use <code>NORTH</code>, <code>SOUTH</code>, or <code>WEST</code> for region and <code>DEMO-###</code> for postal code.</p></details>
        <p id="demo-error" class="demo-error" role="alert" hidden></p>
      </section>
      <section class="demo-panel controls-panel" aria-labelledby="check-title">
        <div class="panel-heading"><div><h2 id="check-title">2. Run validation</h2><p id="demo-status" role="status">Load the sample or choose a synthetic CSV to get started.</p></div></div>
        <div class="actions"><button class="button button-primary" type="button" id="run-validation" disabled>Run validation${icon('right')}</button><button class="button button-outline" type="button" id="download-report" disabled>Download report${icon('download')}</button></div>
        <div class="progress-meta"><label for="demo-progress">Processing progress</label><span id="progress-label">0% complete</span></div>
        <progress id="demo-progress" value="0" max="1"></progress>
      </section>
      <section class="demo-panel results-panel" id="results-panel" aria-labelledby="results-title">
        <div class="panel-heading result-heading"><div><h2 id="results-title">3. Review results</h2><p id="result-count">Preview</p></div><label class="filter-label" for="result-filter">Result status<select id="result-filter" disabled><option value="">All statuses</option>${statuses.map(status => `<option>${escape(status)}</option>`).join('')}</select></label></div>
        <dl class="result-stats">${statuses.map((status, index) => `<div class="stat stat-${index}"><dt>${escape(status)}</dt><dd data-result-status="${escape(status)}">0</dd></div>`).join('')}</dl>
        <div class="table-wrap" tabindex="0" role="region" aria-label="Validation results preview">
          <table><caption class="sr-only">First eight records matching the selected status</caption><thead><tr><th scope="col">Record ID</th><th scope="col">Street</th><th scope="col">Status</th><th scope="col">Detail</th></tr></thead><tbody id="result-rows"><tr><td colspan="4">Results will appear here after validation.</td></tr></tbody></table>
        </div>
      </section>
    </div>` });
}

export function notFound() {
  return page({ title: 'Page not found | Juan López', description: 'Return to the portfolio of Juan López.', path: '/404.html', noindex: true, body: `
    <section class="section wrap not-found"><h1>Page not found</h1><p>The page may have moved.</p>${link('/', 'Return to the portfolio', 'left')}</section>` });
}
