#!/usr/bin/env node
/**
 * link-check.mjs - does a page really link to you, and does that link count? Node 18+, no dependencies.
 *
 * For each source page: fetches the raw HTML and reports every <a href> pointing at your domain with
 * its anchor text and rel (nofollow / sponsored / ugc), plus whether the page itself can pass anything:
 * HTTP status, noindex and page-level nofollow (header or meta, "none" included), canonical pointing
 * elsewhere, and robots.txt blocking Googlebot (Google's matching rules, via lib/robots.mjs).
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
 * before chasing the site owner).
 */

import { readFileSync } from 'node:fs';
import { parseRobots, rulesFor, isAllowed } from './lib/robots.mjs';

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

// Robots directives that apply to Google from an X-Robots-Tag value: bare directives apply to every
// crawler, "googlebot: noindex" to Google, "otherbot: noindex" to someone else.
function xRobotsForGoogle(value) {
  const out = [];
  let agent = null;
  for (const part0 of String(value || '').split(',')) {
    const part = part0.trim();
    const m = /^([a-z0-9_-]+)\s*:\s*(.*)$/i.exec(part);
    let directive = part;
    if (m && !/^(max-snippet|max-image-preview|max-video-preview|unavailable_after)$/i.test(m[1])) { agent = m[1].toLowerCase(); directive = m[2]; }
    if (directive && (agent === null || agent === 'googlebot')) out.push(directive.trim().toLowerCase());
  }
  return out;
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
    // Whole directives, so "none" (= noindex, nofollow) counts and "max-image-preview:none" does not.
    const directives = [...xRobotsForGoogle(xr), ...metas.filter((m) => /^(robots|googlebot)$/i.test(m.name ?? '')).flatMap((m) => decode(m.content ?? '').toLowerCase().split(',').map((t) => t.trim()))];
    out.noindex = directives.includes('noindex') || directives.includes('none');
    out.pageNofollow = directives.includes('nofollow') || directives.includes('none');
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
        // 2xx: Googlebot's rules; 4xx: no rules; 5xx/429: Google pauses crawling the site, treated as blocked.
        robotsCache.set(origin, r.res.ok ? rulesFor(parseRobots(r.text), ['googlebot']) : r.res.status === 429 || r.res.status >= 500 ? 'unavailable' : 'none');
      } catch { robotsCache.set(origin, null); }
    }
    const rules = robotsCache.get(origin);
    out.robotsBlocked = rules === null ? null : rules === 'unavailable' ? true : rules === 'none' ? false : !isAllowed(rules, res.url).allowed;
  } catch (e) {
    out.error = e.name === 'AbortError' ? 'timeout' : e.message;
  }
  return out;
}

function verdict(r) {
  if (r.error) return `FETCH FAILED (${r.error})`;
  if (r.status !== 200) return `HTTP ${r.status}`;
  if (!r.links.length) return 'NO LINK FOUND (raw HTML; check in a browser if the page is JS-rendered)';
  const followed = !r.pageNofollow && r.links.some((l) => !l.rel.length);
  const blockers = [r.noindex && 'page is noindex', r.robotsBlocked && 'robots.txt blocks Googlebot', r.canonicalElsewhere && `canonical -> ${r.canonicalElsewhere}`].filter(Boolean);
  const kind = followed ? 'FOLLOWED LINK' : r.pageNofollow ? 'LINK (the source page sets a page-level nofollow)' : `LINK (all qualified: ${[...new Set(r.links.flatMap((l) => l.rel))].join('/')})`;
  return `${kind}${blockers.length ? ` - but ${blockers.join('; ')}` : ''}`;
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
