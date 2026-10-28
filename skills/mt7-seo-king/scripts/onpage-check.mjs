#!/usr/bin/env node
/**
 * onpage-check.mjs - raw-HTML on-page SEO check. Node 18+, no dependencies.
 *
 * Fetches a URL the way a non-rendering crawler does (no JavaScript executed) and reports:
 *   status + redirect chain, title, meta description, canonical, meta robots / X-Robots-Tag,
 *   h1 count, JSON-LD @types, hreflang, images missing alt, visible-text word count with a
 *   JavaScript-dependence flag (AI crawlers may not render JS), Open Graph basics, html lang,
 *   viewport, and uncompressed HTML size against Googlebot's 2 MB fetch limit.
 *
 * Usage:
 *   node onpage-check.mjs <url> [--json] [--ua "<user agent>"] [--timeout <ms>] [--max-hops <n>]
 *
 * Exit codes: 0 = ran (WARNs allowed), 1 = at least one FAIL, 2 = could not fetch / bad arguments.
 * Limits: regex HTML parsing (good enough for head/meta/img), whitespace word counting (undercounts
 * CJK), and it sees only what the server sends to this user agent.
 */

const DEFAULT_UA = 'Mozilla/5.0 (compatible; onpage-check/1.0; mt7-seo-king; Node fetch)';

function parseArgs(argv) {
  const opts = { url: null, json: false, ua: DEFAULT_UA, timeout: 15000, maxHops: 10, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') opts.json = true;
    else if (a === '--ua') opts.ua = argv[++i] ?? opts.ua;
    else if (a === '--timeout') opts.timeout = Number(argv[++i]) || opts.timeout;
    else if (a === '--max-hops') opts.maxHops = Number(argv[++i]) || opts.maxHops;
    else if (a === '-h' || a === '--help') opts.help = true;
    else if (!opts.url) opts.url = a;
  }
  return opts;
}

const NAMED_ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  ndash: '–', mdash: '—', hellip: '…', copy: '©', reg: '®', trade: '™',
  lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', laquo: '«', raquo: '»',
  middot: '·', bull: '•', times: '×', deg: '°', eacute: 'é', rupee: '₹'
};

function decode(s) {
  return String(s).replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (m, e) => {
    if (e[0] === '#') {
      const code = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : m;
    }
    const k = e.toLowerCase();
    return k in NAMED_ENTITIES ? NAMED_ENTITIES[k] : m;
  });
}

const clean = (s) => decode(s).replace(/\s+/g, ' ').trim();

function parseAttrs(inside) {
  const out = {};
  const re = /([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m;
  while ((m = re.exec(inside))) {
    const name = m[1].toLowerCase();
    const val = m[2] ?? m[3] ?? m[4] ?? '';
    if (!(name in out)) out[name] = decode(val);
  }
  return out;
}

function findTags(html, name) {
  const re = new RegExp(`<${name}\\b([^>]*?)\\/?>`, 'gi');
  const list = [];
  let m;
  while ((m = re.exec(html))) list.push(parseAttrs(m[1]));
  return list;
}

function metaContent(metas, key, val) {
  const hits = metas.filter((m) => (m[key] || '').toLowerCase() === val);
  return hits.length ? hits.map((m) => clean(m.content || '')) : [];
}

function visibleText(html) {
  let s = html.replace(/<!--[\s\S]*?-->/g, ' ');
  s = s.replace(/<(script|style|noscript|template|svg|head|iframe|canvas|select)\b[\s\S]*?<\/\1\s*>/gi, ' ');
  s = s.replace(/<[^>]+>/g, ' ');
  return clean(s);
}

function collectTypes(node, out) {
  if (Array.isArray(node)) { node.forEach((n) => collectTypes(n, out)); return; }
  if (node && typeof node === 'object') {
    const t = node['@type'];
    if (t) (Array.isArray(t) ? t : [t]).forEach((x) => out.push(String(x)));
    for (const [k, v] of Object.entries(node)) if (k !== '@type' && v && typeof v === 'object') collectTypes(v, out);
  }
}

function jsonLd(html) {
  const re = /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script\s*>/gi;
  const top = [];
  const all = [];
  const errors = [];
  let m;
  let n = 0;
  while ((m = re.exec(html))) {
    n++;
    try {
      const data = JSON.parse(m[1].trim());
      const items = Array.isArray(data) ? data : data && data['@graph'] ? data['@graph'] : [data];
      for (const it of items) {
        const t = it && it['@type'];
        if (t) (Array.isArray(t) ? t : [t]).forEach((x) => top.push(String(x)));
      }
      collectTypes(data, all);
    } catch (e) {
      errors.push(`block ${n}: ${String(e.message).slice(0, 70)}`);
    }
  }
  const uniq = (a) => [...new Set(a)];
  const topU = uniq(top);
  return { blocks: n, top: topU, nested: uniq(all).filter((t) => !topU.includes(t)), errors };
}

async function fetchChain(startUrl, opts) {
  const chain = [];
  let current = startUrl;
  for (let hop = 0; hop <= opts.maxHops; hop++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), opts.timeout);
    let res;
    try {
      res = await fetch(current, {
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'user-agent': opts.ua,
          accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
          'accept-language': 'en',
          connection: 'close'
        }
      });
    } finally {
      clearTimeout(timer);
    }
    const status = res.status;
    const location = res.headers.get('location');
    chain.push({ url: current, status, location: location || null });
    if (status >= 300 && status < 400 && location) {
      current = new URL(location, current).href;
      continue;
    }
    const html = await res.text();
    return { chain, res, html, finalUrl: current };
  }
  throw new Error(`too many redirects (more than ${opts.maxHops})`);
}

function analyse({ chain, res, html, finalUrl }) {
  const rows = [];
  const row = (label, level, msg) => rows.push({ label, level, msg });
  const out = { finalUrl, chain, rows };

  const status = res.status;
  const ctype = (res.headers.get('content-type') || '').toLowerCase();
  out.status = status;
  out.contentType = ctype;
  const hops = chain.length - 1;
  const chainStr = chain.map((c) => `${c.url} [${c.status}]`).join(' -> ');
  row('Fetch', status === 200 ? 'PASS' : 'FAIL', `${status} ${ctype || '(no content-type)'}`);
  row('Redirects', hops === 0 ? 'PASS' : hops === 1 ? 'INFO' : 'WARN', hops === 0 ? 'none' : `${hops} hop(s): ${chainStr}`);
  if (!/html|xml/.test(ctype)) {
    row('HTML', 'FAIL', 'response is not HTML; nothing else checked');
    return out;
  }
  // Googlebot indexes only the first 2 MB of uncompressed HTML; anything after the cut is never seen.
  const bytes = Buffer.byteLength(html, 'utf8');
  out.htmlBytes = bytes;
  const mb = (bytes / 1048576).toFixed(2);
  if (bytes > 2 * 1048576) row('HTML size', 'FAIL', `${mb} MB uncompressed; Googlebot reads only the first 2 MB`);
  else if (bytes > 1048576) row('HTML size', 'WARN', `${mb} MB uncompressed; close to Googlebot's 2 MB cut - move inline data/scripts out`);
  else row('HTML size', 'PASS', `${mb} MB uncompressed`);

  // Title (prefer <head>, so inline-SVG <title> elements in the body are not mistaken for it)
  const head = (html.match(/<head\b[\s\S]*?<\/head\s*>/i) || [''])[0];
  const tm = (head || html).match(/<title[^>]*>([\s\S]*?)<\/title\s*>/i) || html.match(/<title[^>]*>([\s\S]*?)<\/title\s*>/i);
  const title = tm ? clean(tm[1]) : '';
  out.title = title;
  if (!title) row('Title', 'FAIL', 'missing');
  else if (title.length < 30) row('Title', 'WARN', `"${title}" (${title.length} chars; short - say what the page is)`);
  else if (title.length <= 60) row('Title', 'PASS', `"${title}" (${title.length} chars)`);
  else if (title.length <= 70) row('Title', 'WARN', `"${title}" (${title.length} chars; may be truncated/rewritten)`);
  else row('Title', 'WARN', `"${title}" (${title.length} chars; >70 is rewritten 99.9% of the time per Zyppy)`);

  const metas = findTags(html, 'meta');
  const links = findTags(html, 'link');

  // Description
  const descs = metaContent(metas, 'name', 'description');
  const desc = descs[0] || '';
  out.metaDescription = desc;
  if (!desc) row('Description', 'WARN', 'missing (Google rewrites ~63% anyway, but write one for humans)');
  else if (descs.length > 1) row('Description', 'WARN', `${descs.length} description tags; keep one`);
  else if (desc.length < 70) row('Description', 'WARN', `${desc.length} chars (short): "${desc}"`);
  else if (desc.length <= 160) row('Description', 'PASS', `${desc.length} chars: "${desc}"`);
  else row('Description', 'WARN', `${desc.length} chars (long; will be cut): "${desc.slice(0, 120)}..."`);

  // Canonical
  const canon = links.filter((l) => (l.rel || '').toLowerCase().split(/\s+/).includes('canonical')).map((l) => l.href).filter(Boolean);
  out.canonical = canon;
  const norm = (u) => { try { const x = new URL(u, finalUrl); x.hash = ''; return x.href; } catch { return u; } };
  if (canon.length === 0) row('Canonical', 'WARN', 'missing (add a self-referencing canonical)');
  else if (canon.length > 1) row('Canonical', 'FAIL', `${canon.length} canonical tags: ${canon.join(' | ')} (conflicting signals)`);
  else if (norm(canon[0]) === norm(finalUrl)) row('Canonical', 'PASS', `${canon[0]} (self-referencing)`);
  else row('Canonical', 'WARN', `${canon[0]} differs from final URL ${finalUrl} (intentional? check host/trailing slash)`);

  // Robots meta + X-Robots-Tag
  const robots = [...metaContent(metas, 'name', 'robots'), ...metaContent(metas, 'name', 'googlebot')];
  const robotsJoined = robots.join(', ').toLowerCase();
  out.metaRobots = robots;
  if (!robots.length) row('Robots meta', 'PASS', 'none (indexable by default)');
  else if (/noindex/.test(robotsJoined)) row('Robots meta', 'FAIL', `noindex present: ${robots.join(' | ')}`);
  else if (/nofollow/.test(robotsJoined)) row('Robots meta', 'WARN', `nofollow present: ${robots.join(' | ')}`);
  else row('Robots meta', 'PASS', robots.join(' | '));
  row('max-image-preview', /max-image-preview:\s*large/.test(robotsJoined) ? 'PASS' : 'INFO', /max-image-preview:\s*large/.test(robotsJoined) ? 'large (Discover/large previews allowed)' : 'not set to large (matters for Discover and image previews)');
  const xr = res.headers.get('x-robots-tag') || '';
  out.xRobotsTag = xr || null;
  if (!xr) row('X-Robots-Tag', 'PASS', 'none');
  else if (/noindex/i.test(xr)) row('X-Robots-Tag', 'FAIL', `noindex in header: ${xr}`);
  else row('X-Robots-Tag', 'INFO', xr);

  // H1
  const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1\s*>/gi)].map((m) => clean(m[1].replace(/<[^>]+>/g, ' ')));
  out.h1 = h1s;
  if (h1s.length === 0) row('H1', 'WARN', 'no h1 found');
  else if (h1s.length === 1) row('H1', 'PASS', `1: "${h1s[0].slice(0, 90)}"`);
  else row('H1', 'WARN', `${h1s.length} h1 tags: ${h1s.map((h) => `"${h.slice(0, 40)}"`).join(', ')}`);

  // JSON-LD
  const ld = jsonLd(html);
  out.jsonLd = ld;
  if (ld.errors.length) row('JSON-LD', 'FAIL', `invalid JSON in ${ld.errors.length} block(s): ${ld.errors.join('; ')}`);
  else if (ld.blocks === 0) row('JSON-LD', 'WARN', 'none (hygiene: Organization + WebSite on the home page, Breadcrumb/Article where relevant)');
  else row('JSON-LD', 'PASS', `${ld.top.join(', ') || '(no top-level @type)'}${ld.nested.length ? ` (nested: ${ld.nested.join(', ')})` : ''}`);
  const allTypes = [...ld.top, ...ld.nested];
  if (allTypes.some((t) => /^(FAQPage|HowTo)$/i.test(t))) row('JSON-LD note', 'INFO', 'FAQPage/HowTo present: they earn no rich result (FAQ deprecated 2026-05-07, HowTo 2023-09)');
  if (allTypes.some((t) => /^AggregateRating$/i.test(t))) row('JSON-LD note', 'INFO', 'AggregateRating present: self-serving ratings on Organization/LocalBusiness pages are ineligible');

  // hreflang
  const hl = links.filter((l) => (l.rel || '').toLowerCase() === 'alternate' && l.hreflang).map((l) => `${l.hreflang}=${l.href}`);
  out.hreflang = hl;
  row('hreflang', 'INFO', hl.length ? `${hl.length}: ${hl.slice(0, 6).join(', ')}${hl.length > 6 ? ' ...' : ''}${hl.some((h) => h.startsWith('x-default=')) ? '' : ' (no x-default)'}` : 'none');

  // Images
  const imgs = findTags(html, 'img');
  const missingAlt = imgs.filter((i) => !('alt' in i));
  const emptyAlt = imgs.filter((i) => 'alt' in i && i.alt.trim() === '');
  out.images = { total: imgs.length, missingAlt: missingAlt.length, emptyAlt: emptyAlt.length, missingAltSrc: missingAlt.map((i) => i.src || i['data-src'] || '?').slice(0, 10) };
  if (imgs.length === 0) row('Images', 'INFO', 'no <img> tags in raw HTML (CSS/JS-only images are not indexed by Google Images)');
  else if (missingAlt.length) row('Images', 'WARN', `${missingAlt.length} of ${imgs.length} <img> have no alt attribute (${emptyAlt.length} decorative alt=""): ${out.images.missingAltSrc.join(', ')}`);
  else row('Images', 'PASS', `${imgs.length} <img>, all with alt (${emptyAlt.length} decorative alt="")`);

  // Visible text + JS dependence
  const text = visibleText(html);
  const words = text ? text.split(' ').length : 0;
  out.words = words;
  out.textSample = text.slice(0, 160);
  const shell = /<(div|main|body)\b[^>]*\bid\s*=\s*["'](root|app|__next|__nuxt|app-root|___gatsby)["'][^>]*>\s*<\/\1\s*>/i.test(html);
  const noscriptJs = /<noscript\b[^>]*>[\s\S]*?(enable|requires?|turn on)\s+javascript[\s\S]*?<\/noscript\s*>/i.test(html);
  const scripts = (html.match(/<script\b/gi) || []).length;
  out.jsDependence = { emptyAppShell: shell, noscriptJsMessage: noscriptJs, scriptTags: scripts };
  if (shell || noscriptJs) row('Text / JS', 'FAIL', `${words} words in raw HTML; empty app shell or "enable JavaScript" notice found - main content needs JavaScript. ChatGPT/Claude/Perplexity crawlers did not render JS in GSQi's 2026-10 test`);
  else if (words < 150) row('Text / JS', 'WARN', `${words} words of visible text in raw HTML (${scripts} script tags) - thin, or rendered by JavaScript; AI crawlers may see nothing`);
  else row('Text / JS', 'PASS', `${words} words of visible text in raw HTML (${scripts} script tags)`);

  // Open Graph
  const og = {};
  for (const k of ['og:title', 'og:description', 'og:image', 'og:url', 'og:site_name', 'og:type']) og[k] = metaContent(metas, 'property', k)[0] || metaContent(metas, 'name', k)[0] || '';
  const twCard = metaContent(metas, 'name', 'twitter:card')[0] || '';
  out.openGraph = { ...og, 'twitter:card': twCard };
  const ogMissing = ['og:title', 'og:description', 'og:image', 'og:url'].filter((k) => !og[k]);
  if (ogMissing.length === 4) row('Open Graph', 'WARN', 'none of og:title/description/image/url');
  else if (ogMissing.length) row('Open Graph', 'WARN', `missing ${ogMissing.join(', ')}${og['og:image'] ? `; image: ${og['og:image']}` : ''}`);
  else row('Open Graph', 'PASS', `title/description/image/url set; image: ${og['og:image']}${twCard ? `; twitter:card=${twCard}` : ''}`);
  if (og['og:url'] && canon[0] && norm(og['og:url']) !== norm(canon[0])) row('OG vs canonical', 'WARN', `og:url ${og['og:url']} != canonical ${canon[0]}`);

  // Lang + viewport + charset
  const htmlTag = findTags(html, 'html')[0] || {};
  out.lang = htmlTag.lang || '';
  row('Lang', out.lang ? 'PASS' : 'WARN', out.lang || 'html lang attribute missing');
  const viewport = metaContent(metas, 'name', 'viewport')[0];
  row('Viewport', viewport ? 'PASS' : 'WARN', viewport || 'meta viewport missing (mobile rendering)');

  return out;
}

function printReport(out, startUrl) {
  const pad = (s, n) => (s + ' '.repeat(n)).slice(0, n);
  console.log(`onpage-check  ${startUrl}  (${new Date().toISOString().slice(0, 19)}Z)`);
  if (out.finalUrl !== startUrl) console.log(`final URL     ${out.finalUrl}`);
  for (const r of out.rows) console.log(`${pad(r.label, 19)} ${pad(r.level, 5)} ${r.msg}`);
  const fails = out.rows.filter((r) => r.level === 'FAIL').length;
  const warns = out.rows.filter((r) => r.level === 'WARN').length;
  console.log(`Summary: ${fails} FAIL, ${warns} WARN, ${out.rows.length - fails - warns} PASS/INFO`);
  return fails;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  // process.exitCode instead of process.exit(): exiting while undici still owns a socket
  // trips a libuv assertion on Windows (Node 22/24). The event loop drains on its own.
  if (opts.help || !opts.url) {
    console.error('Usage: node onpage-check.mjs <url> [--json] [--ua "<user agent>"] [--timeout <ms>] [--max-hops <n>]');
    process.exitCode = opts.help ? 0 : 2;
    return;
  }
  let startUrl = opts.url;
  if (!/^https?:\/\//i.test(startUrl)) startUrl = 'https://' + startUrl;
  let fetched;
  try {
    fetched = await fetchChain(startUrl, opts);
  } catch (e) {
    const msg = e && e.name === 'AbortError' ? `timeout after ${opts.timeout} ms` : (e && e.message) || String(e);
    if (opts.json) console.log(JSON.stringify({ url: startUrl, error: msg }, null, 2));
    else console.error(`onpage-check  ${startUrl}\nFetch               FAIL  ${msg}`);
    process.exitCode = 2;
    return;
  }
  const out = analyse(fetched);
  if (opts.json) {
    console.log(JSON.stringify({ url: startUrl, ...out }, null, 2));
    process.exitCode = out.rows.some((r) => r.level === 'FAIL') ? 1 : 0;
    return;
  }
  const fails = printReport(out, startUrl);
  process.exitCode = fails ? 1 : 0;
}

main().catch((e) => {
  console.error(`onpage-check: ${(e && e.message) || e}`);
  process.exitCode = 2;
});
