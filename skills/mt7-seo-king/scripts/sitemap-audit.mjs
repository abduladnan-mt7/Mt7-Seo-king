#!/usr/bin/env node
/**
 * sitemap-audit.mjs - verify what a sitemap actually lists before making claims about it.
 * Node 18+, no dependencies.
 *
 * Finds the sitemap (robots.txt "Sitemap:" lines, else /sitemap.xml; sitemap indexes, .gz and plain-text
 * sitemaps are followed; files over Google's 50 MB limit are reported, not downloaded in full), then
 * fetches each listed URL WITHOUT following redirects (robots.txt is obeyed for this tool) and reports:
 *   - URLs that are not 200 (a redirect, 4xx or 5xx in a sitemap is the finding itself)
 *   - URLs robots.txt disallows for Googlebot (listed but uncrawlable)
 *   - URLs that are noindexed (X-Robots-Tag header or meta robots/googlebot, "none" included) - verified
 *   - URLs whose canonical points elsewhere
 *   - exact-duplicate titles/descriptions and near-duplicate (templated) descriptions
 *   - orphans: listed URLs no other audited page links to (only when every URL was audited)
 *   - intermittent server errors when --repeat > 1 (5xx/429/network failures across fetches)
 *   - lastmod hygiene: missing, and bulk-stamped dates (most URLs sharing one day)
 *
 * Usage:
 *   node sitemap-audit.mjs <site-url | sitemap-url> [--limit 200] [--repeat 1] [--concurrency 3]
 *                          [--delay 250] [--timeout 15000] [--ua "<user agent>"] [--json]
 *                          [--save snapshot.json] [--compare snapshot.json]
 *
 * --save writes each URL's status/noindex/canonical/title/description; --compare diffs the
 * current run against an older snapshot, so "did WE change something before the drop?" has an
 * answer before anyone blames an update.
 *
 * Exit codes: 0 = ran (WARNs allowed), 1 = at least one FAIL, 2 = no sitemap / bad arguments.
 * Limits: raw HTML only (links or meta tags added by JavaScript are invisible, so a JS-rendered
 * nav makes everything look orphaned); regex parsing; be polite - keep --concurrency low.
 */

import { gunzipSync } from 'node:zlib';
import { readFileSync, writeFileSync } from 'node:fs';
import { parseRobots, rulesFor, isAllowed } from './lib/robots.mjs';
import { parseSitemap, SITEMAP_MAX_BYTES } from './lib/sitemaps.mjs';

const DEFAULT_UA = 'Mozilla/5.0 (compatible; sitemap-audit/1.0; mt7-seo-king; Node fetch)';
const OUR_TOKENS = ['mt7-seo-king'];

function parseArgs(argv) {
  const opts = { target: null, limit: 200, repeat: 1, concurrency: 3, delay: 250, timeout: 15000, ua: DEFAULT_UA, json: false, save: null, compare: null, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') opts.json = true;
    else if (a === '--limit') opts.limit = Math.max(1, Number(argv[++i]) || opts.limit);
    else if (a === '--repeat') opts.repeat = Math.min(10, Math.max(1, Number(argv[++i]) || 1));
    else if (a === '--concurrency') opts.concurrency = Math.min(8, Math.max(1, Number(argv[++i]) || 1));
    else if (a === '--delay') opts.delay = Math.max(0, Number(argv[++i]) || 0);
    else if (a === '--timeout') opts.timeout = Number(argv[++i]) || opts.timeout;
    else if (a === '--ua') opts.ua = argv[++i] ?? opts.ua;
    else if (a === '--save') opts.save = argv[++i] ?? null;
    else if (a === '--compare') opts.compare = argv[++i] ?? null;
    else if (a === '-h' || a === '--help') opts.help = true;
    else if (!opts.target) opts.target = a;
  }
  return opts;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const decode = (s) => String(s)
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&(amp|lt|gt|quot|apos|nbsp);/g, (_, e) => ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' })[e]);
const clean = (s) => decode(s).replace(/\s+/g, ' ').trim();

function attrs(inside) {
  const out = {};
  const re = /([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m;
  while ((m = re.exec(inside))) out[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? '';
  return out;
}
const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b([^>]*)>`, 'gi'))].map((m) => attrs(m[1]));

function normalise(u, base) {
  try {
    const url = new URL(u, base);
    if (!/^https?:$/.test(url.protocol)) return null;
    url.hash = '';
    return url.href;
  } catch { return null; }
}

// maxBytes: stop reading past this many (decompressed) bytes and report tooLarge instead.
async function get(url, opts, redirect = 'manual', { maxBytes = 0 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeout);
  try {
    const res = await fetch(url, { redirect, signal: ctrl.signal, headers: { 'user-agent': opts.ua, accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' } });
    if (!maxBytes || !res.body) return { res, buf: Buffer.from(await res.arrayBuffer()) };
    const declared = Number(res.headers.get('content-length'));
    // Without content-encoding, Content-Length is the real size: an oversize file is judged without downloading it.
    if (!res.headers.get('content-encoding') && Number.isFinite(declared) && declared > maxBytes) { try { await res.body.cancel(); } catch { /* closed */ } return { res, buf: Buffer.alloc(0), tooLarge: declared }; }
    const reader = res.body.getReader();
    const chunks = [];
    let n = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      n += value.length;
      if (n > maxBytes) { try { await reader.cancel(); } catch { /* closed */ } return { res, buf: Buffer.alloc(0), tooLarge: n }; }
      chunks.push(value);
    }
    return { res, buf: Buffer.concat(chunks) };
  } finally { clearTimeout(timer); }
}

// ---- robots.txt (obeyed for this tool; Googlebot's verdict reported) ----

const robotsCache = new Map();
function robotsFor(origin, opts) {
  if (!robotsCache.has(origin)) robotsCache.set(origin, (async () => {
    try {
      const { res, buf } = await get(`${origin}/robots.txt`, opts, 'follow');
      if (res.ok) { const parsed = parseRobots(buf.toString('utf8')); return { state: 'ok', parsed, url: res.url, us: rulesFor(parsed, OUR_TOKENS), google: rulesFor(parsed, ['googlebot']) }; }
      // 4xx = no rules; 5xx/429 = Google stops crawling the site, so this tool does not crawl it either.
      return { state: res.status === 429 || res.status >= 500 ? 'unavailable' : 'none', status: res.status };
    } catch (e) { return { state: 'unavailable', status: e.name === 'AbortError' ? 'timeout' : e.message }; }
  })());
  return robotsCache.get(origin);
}

// ---- sitemap discovery and parsing ----

async function discover(target, opts) {
  const u = new URL(target);
  if (/\.(xml|txt)(\.gz)?$/i.test(u.pathname)) return { sitemaps: [u.href], via: 'argument' };
  const rob = await robotsFor(u.origin, opts);
  if (rob.state === 'ok' && rob.parsed.sitemaps.length) {
    // Sitemap lines should be absolute; resolve a relative one against robots.txt rather than dropping it.
    const list = rob.parsed.sitemaps.map((s) => { try { return new URL(s.value, rob.url || `${u.origin}/robots.txt`).href; } catch { return null; } }).filter(Boolean);
    const relative = rob.parsed.sitemaps.filter((s) => !s.absolute).map((s) => s.value);
    return { sitemaps: list, via: 'robots.txt', relative };
  }
  return { sitemaps: [`${u.origin}/sitemap.xml`], via: 'default /sitemap.xml (robots.txt lists none)' };
}

async function readSitemaps(start, opts) {
  const urls = new Map(); // loc -> lastmod
  const seen = new Set();
  const errors = [];
  const oversize = [];
  const queue = start.map((s) => ({ url: s, depth: 0 }));
  while (queue.length && seen.size < 50) {
    const { url, depth } = queue.shift();
    if (seen.has(url)) continue;
    seen.add(url);
    let text;
    try {
      const o = new URL(url).origin;
      const rob = await robotsFor(o, opts);
      if (rob.state === 'ok' && !isAllowed(rob.us, url).allowed) { errors.push(`${url} -> not fetched: robots.txt disallows it${isAllowed(rob.google, url).allowed ? '' : ' (Googlebot too - Google respects robots.txt when fetching sitemaps)'}`); continue; }
      const { res, buf, tooLarge } = await get(url, opts, 'follow', { maxBytes: SITEMAP_MAX_BYTES });
      if (!res.ok) { errors.push(`${url} -> HTTP ${res.status}`); continue; }
      if (tooLarge) { oversize.push(`${url} -> more than 50 MB (${(tooLarge / 1048576).toFixed(1)} MB${res.headers.get('content-encoding') ? ' read before stopping' : ' declared'})`); continue; }
      let body = buf;
      if (buf[0] === 0x1f && buf[1] === 0x8b) {
        try { body = gunzipSync(buf, { maxOutputLength: SITEMAP_MAX_BYTES }); }
        catch (e) { if (e.code === 'ERR_BUFFER_TOO_LARGE') { oversize.push(`${url} -> more than 50 MB after decompression`); continue; } throw e; }
      }
      text = body.toString('utf8');
    } catch (e) { errors.push(`${url} -> ${e.name === 'AbortError' ? 'timeout' : e.message}`); continue; }
    const parsed = parseSitemap(text, url);
    if (parsed.kind === 'index') {
      if (depth < 2) for (const c of parsed.children) queue.push({ url: c, depth: depth + 1 });
      continue;
    }
    if (parsed.kind === 'html' || parsed.kind === 'invalid') { errors.push(`${url} -> ${parsed.notes.join('; ')}`); continue; }
    for (const e of parsed.entries) if (!urls.has(e.loc)) urls.set(e.loc, e.lastmod);
  }
  return { urls, sitemapsRead: [...seen], errors, oversize };
}

// ---- per-URL checks ----

function inspectHtml(html, finalUrl) {
  const metas = tags(html, 'meta');
  const robots = metas.filter((m) => /^(robots|googlebot)$/i.test(m.name ?? '')).map((m) => `${m.name}: ${m.content ?? ''}`);
  const canonical = tags(html, 'link').find((l) => (l.rel ?? '').toLowerCase().split(/\s+/).includes('canonical'))?.href;
  const title = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  const desc = metas.find((m) => (m.name ?? '').toLowerCase() === 'description')?.content;
  const host = new URL(finalUrl).host;
  const links = new Set();
  for (const a of tags(html, 'a')) {
    const n = a.href ? normalise(a.href, finalUrl) : null;
    if (n && new URL(n).host === host) links.add(n);
  }
  return {
    metaRobots: robots,
    canonical: canonical ? normalise(canonical, finalUrl) : null,
    title: title ? clean(title[1]) : null,
    description: desc ? clean(desc) : null,
    links,
  };
}

// Whole directives that apply to Google: "none" = noindex + nofollow; "otherbot: noindex" in X-Robots-Tag does not apply.
function googleDirectives(xRobots, metaRobots) {
  const out = [];
  let agent = null;
  for (const part0 of String(xRobots || '').split(',')) {
    const part = part0.trim();
    const m = /^([a-z0-9_-]+)\s*:\s*(.*)$/i.exec(part);
    let d = part;
    if (m && !/^(max-snippet|max-image-preview|max-video-preview|unavailable_after)$/i.test(m[1])) { agent = m[1].toLowerCase(); d = m[2]; }
    if (d && (agent === null || agent === 'googlebot')) out.push(d.trim().toLowerCase());
  }
  for (const m of metaRobots) out.push(...decode(m.slice(m.indexOf(':') + 1)).toLowerCase().split(',').map((t) => t.trim()));
  return out;
}
const isNoindex = (r) => googleDirectives(r.xRobots, r.metaRobots).some((d) => d === 'noindex' || d === 'none');

async function audit(url, opts) {
  const row = { url, key: normalise(url) ?? url, status: null, location: null, xRobots: null, metaRobots: [], canonical: null, title: null, description: null, links: new Set(), fetches: [], error: null };
  let origin;
  try { origin = new URL(url).origin; } catch { row.error = 'not a valid URL'; return row; }
  const rob = await robotsFor(origin, opts);
  if (rob.state === 'ok') {
    if (!isAllowed(rob.google, url).allowed) row.googleBlocked = isAllowed(rob.google, url).rule;
    if (!isAllowed(rob.us, url).allowed) { row.robotsSkipped = true; row.error = 'not fetched: robots.txt disallows this tool'; return row; }
  } else if (rob.state === 'unavailable') { row.robotsSkipped = true; row.error = `not fetched: robots.txt unavailable (${rob.status})`; return row; }
  for (let i = 0; i < opts.repeat; i++) {
    try {
      const { res, buf } = await get(url, opts);
      row.fetches.push(res.status);
      if (i === 0) {
        row.status = res.status;
        row.location = res.headers.get('location');
        row.xRobots = res.headers.get('x-robots-tag');
        if (res.status === 200 && /html/i.test(res.headers.get('content-type') ?? '')) Object.assign(row, inspectHtml(buf.toString('utf8'), url));
      }
    } catch (e) {
      row.fetches.push(e.name === 'AbortError' ? 'timeout' : 'network-error');
      if (i === 0) row.error = e.name === 'AbortError' ? 'timeout' : e.message;
    }
    if (opts.delay) await sleep(opts.delay);
  }
  return row;
}

async function pool(items, n, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i]); }
  }));
  return out;
}

// ---- cross-page analysis ----

const words = (s) => new Set(s.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []);
function jaccard(a, b) {
  let inter = 0;
  for (const w of a) if (b.has(w)) inter++;
  return inter / (a.size + b.size - inter || 1);
}

function duplicates(rows, field) {
  const groups = new Map();
  for (const r of rows) if (r[field]) groups.set(r[field], [...(groups.get(r[field]) ?? []), r.url]);
  return [...groups].filter(([, us]) => us.length > 1).map(([value, us]) => ({ value, urls: us }));
}

// Descriptions that differ only in a word or two are one template with a noun swapped.
// Identical descriptions are reported as duplicates already, so they are not grouped here again.
function nearDuplicates(rows, threshold = 0.8) {
  const items = rows.filter((r) => r.description && r.description.length > 40).map((r) => ({ url: r.url, d: r.description, w: words(r.description) }));
  const parent = items.map((_, i) => i);
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    if (items[i].d !== items[j].d && jaccard(items[i].w, items[j].w) >= threshold) parent[find(i)] = find(j);
  }
  const groups = new Map();
  items.forEach((it, i) => groups.set(find(i), [...(groups.get(find(i)) ?? []), it]));
  return [...groups.values()].filter((g) => g.length > 1 && new Set(g.map((it) => it.d)).size > 1).map((g) => g.map((it) => it.url));
}

function analyse(rows, sitemap, opts) {
  const issues = [];
  const add = (level, check, detail, urls = []) => issues.push({ level, check, detail, urls });
  const ok = rows.filter((r) => r.status === 200);

  const notOk = rows.filter((r) => r.status !== 200);
  for (const [label, test, level] of [
    ['redirects (list the final URL instead)', (r) => r.status >= 300 && r.status < 400, 'WARN'],
    ['client errors (4xx) listed in the sitemap', (r) => r.status >= 400 && r.status < 500, 'FAIL'],
    ['server errors (5xx) on first fetch', (r) => r.status >= 500, 'FAIL'],
    ['fetch failed (timeout/network)', (r) => r.status === null && !r.robotsSkipped, 'FAIL'],
  ]) {
    const hit = notOk.filter(test);
    if (hit.length) add(level, 'status', `${hit.length} ${label}`, hit.map((r) => `${r.url} -> ${r.status ?? r.error}${r.location ? ` -> ${r.location}` : ''}`));
  }

  for (const o of sitemap.oversize ?? []) add('FAIL', 'sitemap', 'sitemap file over Google\'s 50 MB (uncompressed) limit - Google rejects it; split it and list the parts in a sitemap index', [o]);
  if (sitemap.relative?.length) add('WARN', 'sitemap', `robots.txt Sitemap line(s) with a relative URL (must be fully qualified): ${sitemap.relative.join(', ')}`);
  const gBlocked = rows.filter((r) => r.googleBlocked);
  if (gBlocked.length) add('FAIL', 'robots', `${gBlocked.length} sitemap URL(s) are disallowed for Googlebot by robots.txt (listed but uncrawlable)`, gBlocked.map((r) => `${r.url} -> ${r.googleBlocked}`));
  const skipped = rows.filter((r) => r.robotsSkipped);
  if (skipped.length) add('INFO', 'robots', `${skipped.length} URL(s) not fetched because robots.txt disallows this tool`, skipped.map((r) => `${r.url} -> ${r.error}`));

  const noindex = ok.filter(isNoindex);
  if (noindex.length) add('FAIL', 'noindex', `${noindex.length} sitemap URL(s) are noindexed (verified on the fetched response)`, noindex.map((r) => `${r.url} -> ${[r.xRobots && `X-Robots-Tag: ${r.xRobots}`, ...r.metaRobots].filter(Boolean).join(' | ')}`));
  else add('PASS', 'noindex', `0 of ${ok.length} fetched 200 URLs carry noindex (header or meta)`);

  const elsewhere = ok.filter((r) => r.canonical && r.canonical !== r.key);
  if (elsewhere.length) add('WARN', 'canonical', `${elsewhere.length} URL(s) canonicalise to a different URL (list the canonical instead)`, elsewhere.map((r) => `${r.url} -> ${r.canonical}`));
  const noCanon = ok.filter((r) => !r.canonical);
  if (noCanon.length) add('WARN', 'canonical', `${noCanon.length} URL(s) have no rel=canonical`, noCanon.map((r) => r.url));

  for (const [field, label] of [['title', 'titles'], ['description', 'meta descriptions']]) {
    const missing = ok.filter((r) => !r[field]);
    if (missing.length) add('WARN', field, `${missing.length} page(s) missing ${label}`, missing.map((r) => r.url));
    for (const d of duplicates(ok, field)) add('WARN', field, `${d.urls.length} pages share one ${field}: "${d.value.slice(0, 90)}"`, d.urls);
  }
  const near = nearDuplicates(ok);
  if (near.length) {
    const total = near.reduce((n, g) => n + g.length, 0);
    add('WARN', 'templated', `${total} pages in ${near.length} group(s) have near-identical descriptions (>= 80% shared words) - one template with a noun swapped`, near.map((g) => g.join('  |  ')));
  }

  const complete = rows.length === sitemap.urls.size;
  if (ok.length > 1) {
    // Keys are normalised the same way as extracted links, so '/a' in the sitemap matches href="/a#x".
    const inlinks = new Map(ok.map((r) => [r.key, 0]));
    for (const r of ok) for (const l of r.links) if (l !== r.key && inlinks.has(l)) inlinks.set(l, inlinks.get(l) + 1);
    const orphans = [...inlinks].filter(([, n]) => n === 0).map(([u]) => u);
    if (!complete) add('INFO', 'orphans', `not judged: ${rows.length} of ${sitemap.urls.size} URLs audited (raise --limit to audit all); inlinks counted only between audited pages`);
    else if (orphans.length) add('WARN', 'orphans', `${orphans.length} listed URL(s) get no link from any other listed page (check the nav isn't JS-rendered before believing this)`, orphans);
    else add('PASS', 'orphans', 'every audited URL is linked from at least one other listed page');
  }

  if (opts.repeat > 1) {
    const bad = rows.filter((r) => r.fetches.some((s) => s === 'timeout' || s === 'network-error' || s === 429 || s >= 500));
    const fetches = rows.reduce((n, r) => n + r.fetches.length, 0);
    const failed = rows.reduce((n, r) => n + r.fetches.filter((s) => s === 'timeout' || s === 'network-error' || s === 429 || s >= 500).length, 0);
    if (failed) add('FAIL', 'server-errors', `${failed} of ${fetches} fetches (${(100 * failed / fetches).toFixed(1)}%) failed with 5xx/429/timeout - Google slows crawling on these`, bad.map((r) => `${r.url} -> ${r.fetches.join(',')}`));
    else add('PASS', 'server-errors', `0 of ${fetches} fetches failed`);
  }

  const dates = [...sitemap.urls.values()];
  const missingLm = dates.filter((d) => !d).length;
  if (missingLm) add('INFO', 'lastmod', `${missingLm} of ${dates.length} URLs have no <lastmod>`);
  const byDay = new Map();
  for (const d of dates) if (d) byDay.set(d.slice(0, 10), (byDay.get(d.slice(0, 10)) ?? 0) + 1);
  const [topDay, topN] = [...byDay].sort((a, b) => b[1] - a[1])[0] ?? [];
  if (topN && dates.length >= 20 && topN / dates.length > 0.5) add('WARN', 'lastmod', `${topN} of ${dates.length} URLs share lastmod ${topDay}; bulk-stamped dates teach crawlers to ignore lastmod - stamp only pages that changed`);

  return issues;
}

// ---- snapshots ----

function snapshot(rows) {
  const out = {};
  for (const r of rows) {
    out[r.url] = {
      status: r.status,
      noindex: isNoindex(r),
      canonical: r.canonical, title: r.title, description: r.description,
    };
  }
  return out;
}

function diff(before, after) {
  const changes = [];
  for (const url of Object.keys(after)) if (!(url in before)) changes.push({ url, field: 'sitemap', from: '(absent)', to: 'listed' });
  for (const url of Object.keys(before)) if (!(url in after)) changes.push({ url, field: 'sitemap', from: 'listed', to: '(absent or past --limit)' });
  for (const [url, now] of Object.entries(after)) {
    const was = before[url];
    if (!was) continue;
    // A status flip blanks every HTML field; report the cause once instead of four symptoms.
    if (was.status !== now.status) { changes.push({ url, field: 'status', from: was.status, to: now.status }); continue; }
    for (const field of ['noindex', 'canonical', 'title', 'description']) {
      if (String(was[field]) !== String(now[field])) changes.push({ url, field, from: was[field], to: now[field] });
    }
  }
  return changes;
}

function print(report) {
  const { target, via, sitemapsRead, total, audited, issues, sitemapErrors } = report;
  console.log(`Sitemap audit: ${target}`);
  console.log(`  sitemaps (${via}): ${sitemapsRead.join(', ')}`);
  for (const e of sitemapErrors) console.log(`  could not read: ${e}`);
  console.log(`  ${total} URLs listed, ${audited} audited\n`);
  for (const i of issues) {
    console.log(`${i.level.padEnd(4)}  ${i.check.padEnd(13)} ${i.detail}`);
    for (const u of i.urls.slice(0, 10)) console.log(`        ${u}`);
    if (i.urls.length > 10) console.log(`        ... ${i.urls.length - 10} more (use --json for all)`);
  }
  if (report.comparedWith) {
    const { file, takenAt, changes } = report.comparedWith;
    console.log(`
Changes since ${file} (${takenAt}): ${changes.length}`);
    const order = ['noindex', 'status', 'canonical', 'sitemap', 'title', 'description'];
    for (const c of [...changes].sort((a, b) => order.indexOf(a.field) - order.indexOf(b.field)).slice(0, 40)) {
      console.log(`  ${c.field.padEnd(11)} ${c.url}
              ${String(c.from).slice(0, 80)} -> ${String(c.to).slice(0, 80)}`);
    }
    if (changes.length > 40) console.log(`  ... ${changes.length - 40} more (use --json for all)`);
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  // process.exitCode instead of process.exit(): exiting while undici still owns a socket can crash on Windows.
  if (opts.help || !opts.target) {
    console.log('Usage: node sitemap-audit.mjs <site-url | sitemap-url> [--limit 200] [--repeat 1] [--concurrency 3] [--delay 250] [--timeout 15000] [--ua "..."] [--json]');
    process.exitCode = opts.help ? 0 : 2;
    return;
  }
  let target;
  try { target = new URL(/^https?:\/\//i.test(opts.target) ? opts.target : `https://${opts.target}`).href; } catch { console.error(`sitemap-audit: not a URL: ${opts.target}`); process.exitCode = 2; return; }

  const { sitemaps, via, relative = [] } = await discover(target, opts);
  const sitemap = await readSitemaps(sitemaps, opts);
  sitemap.relative = relative;
  if (!sitemap.urls.size) {
    console.error(`sitemap-audit: no URLs found (${[...sitemap.oversize, ...sitemap.errors, `tried: ${sitemaps.join(', ')}`].join('; ')})`);
    process.exitCode = 2;
    return;
  }
  const list = [...sitemap.urls.keys()].slice(0, opts.limit);
  const rows = await pool(list, opts.concurrency, (u) => audit(u, opts));
  const issues = analyse(rows, sitemap, opts);
  const report = { target, via, sitemapsRead: sitemap.sitemapsRead, sitemapErrors: sitemap.errors, total: sitemap.urls.size, audited: rows.length, issues };
  const snap = snapshot(rows);
  if (opts.compare) {
    try {
      const old = JSON.parse(readFileSync(opts.compare, 'utf8'));
      report.comparedWith = { file: opts.compare, takenAt: old.takenAt, changes: diff(old.urls ?? {}, snap) };
    } catch (e) { console.error(`sitemap-audit: cannot read --compare file: ${e.message}`); process.exitCode = 2; return; }
  }
  if (opts.save) writeFileSync(opts.save, JSON.stringify({ target, takenAt: new Date().toISOString(), urls: snap }, null, 2));
  if (opts.json) console.log(JSON.stringify(report, null, 2));
  else print(report);
  process.exitCode = issues.some((i) => i.level === 'FAIL') ? 1 : 0;
}

main().catch((e) => { console.error(`sitemap-audit: ${e.stack ?? e}`); process.exitCode = 2; });
