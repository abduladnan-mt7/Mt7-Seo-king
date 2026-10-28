#!/usr/bin/env node
/**
 * link-check.mjs - does a page really link to you, and does that link count? Node 18+, no dependencies.
 *
 * For each source page: fetches the raw HTML and reports every <a href> pointing at your domain with
 * its anchor text and rel (nofollow / sponsored / ugc), plus whether the page itself can pass anything:
 * HTTP status, noindex (header or meta), canonical pointing elsewhere, and robots.txt blocking Googlebot.
 * Use it to track outreach (did they add the link?) and to settle "unverified" link attributes in
 * references/free-link-sources.md before relying on them.
 *
 * Usage:
 *   node link-check.mjs <your-domain> <source-url> [<source-url> ...]
 *   node link-check.mjs <your-domain> --file sources.txt        one URL per line, # comments allowed
 *   add --json for machine output; --timeout <ms>; --ua "<user agent>"
 *
 * Exit codes: 0 = ran, 1 = at least one source has no link to you, 2 = bad arguments.
 * Limits: raw HTML only - a link injected by JavaScript shows as "not found" (re-check in a browser
 * before chasing the site owner); robots.txt matching is the simple prefix/wildcard subset.
 */

import { readFileSync } from 'node:fs';

const DEFAULT_UA = 'Mozilla/5.0 (compatible; link-check/1.0; mt7-seo-king; Node fetch)';

function parseArgs(argv) {
  const opts = { domain: null, sources: [], json: false, timeout: 15000, ua: DEFAULT_UA, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') opts.json = true;
    else if (a === '--timeout') opts.timeout = Number(argv[++i]) || opts.timeout;
    else if (a === '--ua') opts.ua = argv[++i] ?? opts.ua;
    else if (a === '--file') {
      const f = argv[++i];
      opts.sources.push(...readFileSync(f, 'utf8').split(/\r?\n/).map((l) => l.replace(/#.*/, '').trim()).filter(Boolean));
    } else if (a === '-h' || a === '--help') opts.help = true;
    else if (!opts.domain) opts.domain = a;
    else opts.sources.push(a);
  }
  return opts;
}

const decode = (s) => String(s)
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&(amp|lt|gt|quot|apos|nbsp);/g, (_, e) => ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' })[e]);

function attrs(inside) {
  const out = {};
  const re = /([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m;
  while ((m = re.exec(inside))) out[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? '';
  return out;
}

async function get(url, opts) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeout);
  try {
    const res = await fetch(url, { redirect: 'follow', signal: ctrl.signal, headers: { 'user-agent': opts.ua } });
    return { res, text: await res.text() };
  } finally { clearTimeout(timer); }
}

// Googlebot's group if one exists, else '*'; longest matching rule wins, Allow wins a tie.
function robotsBlocks(robotsTxt, path) {
  const groups = [];
  let cur = null;
  for (const raw of robotsTxt.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim();
    const m = /^([a-z-]+)\s*:\s*(.*)$/i.exec(line);
    if (!m) continue;
    const [k, v] = [m[1].toLowerCase(), m[2].trim()];
    if (k === 'user-agent') {
      if (!cur || cur.rules.length) groups.push((cur = { agents: [], rules: [] }));
      cur.agents.push(v.toLowerCase());
    } else if ((k === 'allow' || k === 'disallow') && cur) cur.rules.push({ allow: k === 'allow', path: v });
  }
  const pick = groups.filter((g) => g.agents.includes('googlebot'));
  const rules = (pick.length ? pick : groups.filter((g) => g.agents.includes('*'))).flatMap((g) => g.rules);
  let best = null;
  for (const r of rules) {
    if (!r.path) continue;
    const re = new RegExp('^' + r.path.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$'));
    if (re.test(path) && (!best || r.path.length > best.path.length || (r.path.length === best.path.length && r.allow))) best = r;
  }
  return best ? !best.allow : false;
}

const hostOf = (d) => d.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').replace(/^www\./i, '').toLowerCase();

async function check(source, domain, opts, robotsCache) {
  const out = { source, status: null, finalUrl: null, links: [], noindex: false, canonicalElsewhere: null, robotsBlocked: null, error: null };
  try {
    const { res, text } = await get(source, opts);
    out.status = res.status;
    out.finalUrl = res.url;
    const xr = res.headers.get('x-robots-tag') ?? '';
    const metas = [...text.matchAll(/<meta\b([^>]*)>/gi)].map((m) => attrs(m[1]));
    out.noindex = /noindex/i.test(xr) || metas.some((m) => /^(robots|googlebot)$/i.test(m.name ?? '') && /noindex/i.test(m.content ?? ''));
    const canon = [...text.matchAll(/<link\b([^>]*)>/gi)].map((m) => attrs(m[1])).find((l) => (l.rel ?? '').toLowerCase().split(/\s+/).includes('canonical'));
    if (canon?.href) {
      const c = new URL(canon.href, res.url).href.replace(/#.*$/, '');
      if (c !== res.url.replace(/#.*$/, '')) out.canonicalElsewhere = c;
    }
    for (const m of text.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi)) {
      const a = attrs(m[1]);
      if (!a.href) continue;
      let href;
      try { href = new URL(decode(a.href), res.url); } catch { continue; }
      const h = href.hostname.replace(/^www\./, '').toLowerCase();
      if (h !== domain && !h.endsWith(`.${domain}`)) continue;
      const rel = (a.rel ?? '').toLowerCase().split(/\s+/).filter(Boolean);
      const anchor = decode(m[2].replace(/<img\b([^>]*)>/gi, (_, i) => `[img alt="${attrs(i).alt ?? ''}"]`).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
      out.links.push({ href: href.href, anchor: anchor || '(empty)', rel: rel.filter((r) => ['nofollow', 'sponsored', 'ugc'].includes(r)) });
    }
    const origin = new URL(res.url).origin;
    if (!robotsCache.has(origin)) {
      try {
        const r = await get(`${origin}/robots.txt`, opts);
        robotsCache.set(origin, r.res.ok ? r.text : '');
      } catch { robotsCache.set(origin, null); }
    }
    const robots = robotsCache.get(origin);
    out.robotsBlocked = robots === null ? null : robotsBlocks(robots, new URL(res.url).pathname + new URL(res.url).search);
  } catch (e) {
    out.error = e.name === 'AbortError' ? 'timeout' : e.message;
  }
  return out;
}

function verdict(r) {
  if (r.error) return `FETCH FAILED (${r.error})`;
  if (r.status !== 200) return `HTTP ${r.status}`;
  if (!r.links.length) return 'NO LINK FOUND (raw HTML; check in a browser if the page is JS-rendered)';
  const followed = r.links.some((l) => !l.rel.length);
  const blockers = [r.noindex && 'page is noindex', r.robotsBlocked && 'robots.txt blocks Googlebot', r.canonicalElsewhere && `canonical -> ${r.canonicalElsewhere}`].filter(Boolean);
  return `${followed ? 'FOLLOWED LINK' : 'LINK (all qualified: ' + [...new Set(r.links.flatMap((l) => l.rel))].join('/') + ')'}${blockers.length ? ` - but ${blockers.join('; ')}` : ''}`;
}

async function main() {
  let opts;
  try { opts = parseArgs(process.argv.slice(2)); } catch (e) { console.error(`link-check: ${e.message}`); process.exitCode = 2; return; }
  if (opts.help || !opts.domain || !opts.sources.length) {
    console.log('Usage: node link-check.mjs <your-domain> <source-url>... | --file sources.txt [--json] [--timeout ms] [--ua "..."]');
    process.exitCode = opts.help ? 0 : 2;
    return;
  }
  const domain = hostOf(opts.domain);
  const robotsCache = new Map();
  const results = [];
  for (const s of opts.sources) results.push(await check(/^https?:\/\//i.test(s) ? s : `https://${s}`, domain, opts, robotsCache));
  if (opts.json) console.log(JSON.stringify({ domain, checkedAt: new Date().toISOString(), results }, null, 2));
  else {
    console.log(`link-check  links to ${domain}  (${new Date().toISOString().slice(0, 10)})\n`);
    for (const r of results) {
      console.log(`${r.source}\n  ${verdict(r)}`);
      for (const l of r.links.slice(0, 5)) console.log(`    -> ${l.href}  "${l.anchor.slice(0, 70)}"${l.rel.length ? `  rel=${l.rel.join(' ')}` : ''}`);
      if (r.links.length > 5) console.log(`    ... ${r.links.length - 5} more`);
    }
  }
  process.exitCode = results.some((r) => !r.links.length) ? 1 : 0;
}

main().catch((e) => { console.error(`link-check: ${e.stack ?? e}`); process.exitCode = 2; });
