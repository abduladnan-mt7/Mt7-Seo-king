/**
 * lib/crawl.mjs - the bounded, robots-respecting crawl behind diagnose.mjs. Node 18+, no dependencies.
 *
 * Order of work (every step counts its requests; nothing runs unbounded):
 *   1. start URL and its redirect hops -> the final host becomes the crawl scope
 *   2. robots.txt of that origin (5xx/429/unreachable = stop, as Google would treat the site)
 *   3. sitemaps declared in robots.txt (else /sitemap.xml), indexes followed, size-capped
 *   4. breadth-first crawl of internal <a href> links up to the page budget
 *   5. sitemap URLs the links never reached (orphan candidates), with the reserved budget
 *   6. probes: host/protocol variants, trailing-slash twins, two random URLs (soft 404)
 *   7. canonical and hreflang targets the crawl did not fetch (verify budget)
 *   8. same-site CSS/JS: robots.txt for Googlebot, and their status
 *   9. --repeat passes, then one confirmation fetch for every URL behind a severe finding
 */

import { createHash, randomBytes } from 'node:crypto';
import { decodeBody, sleep, REDIRECT_CODES } from './http.mjs';
import { parseRobots, rulesFor, isAllowed, GOOGLEBOT } from './robots.mjs';
import { extractPage, robotsDirectives, urlKey, resolveUrl, collapse, countWords } from './html.mjs';
import { readSitemaps } from './sitemaps.mjs';
import { analyseJsonLd } from './schema.mjs';

export const OUR_TOKENS = ['mt7-seo-king'];
// Second-level public suffixes common enough to matter when deciding whether a host is an apex domain.
const SECOND_LEVEL = new Set(['co.uk', 'org.uk', 'ac.uk', 'gov.uk', 'ltd.uk', 'plc.uk', 'me.uk', 'net.uk', 'com.au', 'net.au', 'org.au', 'edu.au', 'gov.au', 'co.nz', 'org.nz', 'net.nz', 'co.in', 'net.in', 'org.in', 'gen.in', 'firm.in', 'ind.in', 'co.jp', 'ne.jp', 'or.jp', 'co.za', 'org.za', 'com.br', 'net.br', 'org.br', 'com.mx', 'org.mx', 'com.tr', 'com.sg', 'edu.sg', 'com.my', 'com.cn', 'net.cn', 'org.cn', 'com.hk', 'com.tw', 'co.kr', 'or.kr', 'com.ar', 'com.co', 'com.pe', 'com.ph', 'com.pk', 'com.ng', 'com.eg', 'com.sa', 'com.vn', 'co.id', 'or.id', 'co.il', 'co.th', 'in.th', 'com.ua', 'com.pl', 'co.at', 'or.at', 'com.es', 'com.pt', 'co.ke']);
/** The www/non-www twin worth probing: bare host for www.x, www.x for an apex domain, none for other subdomains. */
export function counterpartHost(hostname) {
  if (/^\d+\.\d+\.\d+\.\d+$|^\[|^localhost$/i.test(hostname)) return null;
  if (hostname.startsWith('www.')) return hostname.slice(4);
  const parts = hostname.split('.');
  if (parts.length === 2 || (parts.length === 3 && SECOND_LEVEL.has(parts.slice(1).join('.')))) return `www.${hostname}`;
  return null;
}
const HTML_READ_CAP = 3 * 1048576;
export const GOOGLE_HTML_LIMIT = 2 * 1048576;
const hash = (s) => createHash('md5').update(s).digest('hex').slice(0, 16);
const normText = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim();

export function parseLinkHeader(value) {
  const out = [];
  if (!value) return out;
  for (const m of String(value).matchAll(/<([^>]*)>\s*((?:;\s*[^;,]*)*)/g)) {
    const params = {};
    for (const p of m[2].split(';')) {
      const kv = /^\s*([a-z*-]+)\s*=\s*"?([^"]*)"?\s*$/i.exec(p);
      if (kv) params[kv[1].toLowerCase()] = kv[2];
    }
    out.push({ href: m[1].trim(), rel: (params.rel || '').toLowerCase().split(/\s+/).filter(Boolean), hreflang: params.hreflang || null });
  }
  return out;
}

export function createState(opts) {
  return {
    opts, startedAt: new Date(), pages: new Map(), robots: new Map(), sitemap: null, sitemapDeclared: [],
    resources: new Map(), externalHosts: new Map(), probes: { variants: [], slash: [], soft404: [] },
    fetchCount: 0, verifyCount: 0, linkCrawlComplete: false, stopped: null, notes: [], scope: null, psi: null,
  };
}

export class Crawler {
  constructor(state, fetcher, log) {
    this.s = state;
    this.f = fetcher;
    this.log = log;
    this.queue = [];
    this.active = 0;
    this.probesLeft = 3;
  }

  // ---------- scope and robots ----------

  classify(u) {
    const sc = this.s.scope;
    if (!sc) return 'internal';
    if (u.host === sc.host && u.protocol === sc.protocol) return 'internal';
    if (u.host === sc.host || sc.variantHosts.has(u.host)) return 'variant';
    return 'external';
  }

  inScopePath(u) {
    const prefixes = this.s.opts.scope;
    if (!prefixes || !prefixes.length) return true;
    return u.pathname === '/' || prefixes.some((p) => u.pathname.startsWith(p));
  }

  async robotsFor(origin) {
    if (!this.s.robots.has(origin)) this.s.robots.set(origin, this.loadRobots(origin));
    return this.s.robots.get(origin);
  }

  async loadRobots(origin) {
    const r = await this.f.getFollow(`${origin}/robots.txt`, { maxBytes: 600 * 1024, body: 'always', accept: 'text/plain,*/*;q=0.8' });
    const rec = { origin, url: `${origin}/robots.txt`, status: r.status, error: r.error, chain: r.chain, finalUrl: r.finalUrl, state: null, parsed: null };
    if (r.error || r.status == null) rec.state = 'unreachable';
    else if (r.status >= 200 && r.status < 300) {
      rec.state = 'ok';
      rec.parsed = parseRobots(decodeBody(r.body || Buffer.alloc(0), r.contentType));
      rec.us = rulesFor(rec.parsed, OUR_TOKENS);
      rec.google = rulesFor(rec.parsed, [GOOGLEBOT]);
    } else if (r.status === 429 || r.status >= 500) rec.state = 'server-error';
    else rec.state = 'missing'; // 4xx: Google treats as "no restrictions"
    await this.f.rest();
    return rec;
  }

  async allowed(url, who) {
    let u;
    try { u = new URL(url); } catch { return { allowed: false, rule: 'invalid URL' }; }
    const rob = await this.robotsFor(u.origin);
    if (rob.state === 'missing') return { allowed: true, rule: null };
    if (rob.state !== 'ok') return { allowed: false, rule: `robots.txt ${rob.state === 'unreachable' ? `unreachable (${rob.error})` : `HTTP ${rob.status}`}` };
    return isAllowed(who === 'google' ? rob.google : rob.us, url);
  }

  // ---------- page records ----------

  page(u, init = {}) {
    const key = urlKey(u);
    if (!key) return null;
    let p = this.s.pages.get(key);
    if (!p) {
      const url = new URL(key);
      p = { key, url: key, depth: null, via: init.via || null, scope: this.classify(url), inScope: this.inScopePath(url), inlinks: new Map(), fetches: [], fetched: false, blockedUs: null, blockedGoogle: null, status: null };
      this.s.pages.set(key, p);
      // Googlebot's robots.txt verdict needs no fetch, so every known same-origin URL gets it (budget and --scope aside).
      const sr = this.s.scopeRobots;
      if (sr && sr.state === 'ok' && url.origin === this.s.scope.origin) { const g = isAllowed(sr.google, key); if (!g.allowed) p.blockedGoogle = g.rule || 'disallowed'; }
    }
    if (init.depth != null && (p.depth == null || init.depth < p.depth)) p.depth = init.depth;
    return p;
  }

  enqueue(u, depth, via, front = false) {
    const p = this.page(u, { depth, via });
    if (!p || p.queued || p.fetched) return p;
    if (p.scope === 'external') return p;
    if (p.scope === 'internal' && !p.inScope) return p;
    p.queued = true;
    (front ? this.queue.unshift.bind(this.queue) : this.queue.push.bind(this.queue))({ key: p.key, via });
    return p;
  }

  // ---------- fetching one URL ----------

  async visit(p, { mode = 'crawl' } = {}) {
    if (p.fetched || p.blockedUs) return;
    const us = await this.allowed(p.url, 'us');
    const g = await this.allowed(p.url, 'google');
    p.blockedGoogle = g.allowed ? null : g.rule || 'disallowed';
    if (!us.allowed) { p.blockedUs = us.rule || 'disallowed'; return; }
    if (this.f.stopped) return;
    p.fetched = true;
    p.fetchMode = mode;
    const r = await this.f.get(p.url, { maxBytes: HTML_READ_CAP, body: 'html' });
    this.record(p, r);
    if (r.error) return;
    const loc = r.location;
    if (r.status >= 300 && r.status < 400) {
      if (!REDIRECT_CODES.includes(r.status)) { p.odd3xx = { status: r.status, location: loc || null }; return; }
      const t = loc ? resolveUrl(loc, p.url) : null;
      if (!t) { p.redirectInvalid = loc ?? '(no Location header)'; return; }
      p.redirectTo = urlKey(t);
      p.redirectStatus = r.status;
      const target = this.page(t, { depth: p.depth, via: 'redirect' });
      target.redirectedFrom = [...(target.redirectedFrom || []), p.key];
      if (mode === 'crawl' || mode === 'sitemap' || mode === 'verify' || mode === 'probe') this.followLater(target, mode);
      return;
    }
    const refresh = r.headers.refresh;
    if (refresh) {
      const m = /^\s*(\d+(?:\.\d+)?)?\s*[;,]?\s*(?:url\s*=\s*)?['"]?([^'"]*)/i.exec(refresh);
      if (m && m[2]) { const t = resolveUrl(m[2].trim(), p.url); if (t) { p.refresh = { delay: Number(m[1] || 0), url: urlKey(t), source: 'Refresh header' }; } }
    }
    const isHtml = /html/.test(r.contentType) || (!r.contentType && r.body && /^\s*</.test(r.body.subarray(0, 200).toString('latin1')));
    p.isHtml = Boolean(isHtml && r.body);
    if (p.isHtml && r.status >= 200 && r.status < 300) this.analyse(p, r, mode);
    if (p.refresh && mode !== 'probe') { const t = this.page(new URL(p.refresh.url), { depth: p.depth, via: 'refresh' }); this.followLater(t, mode); }
  }

  followLater(target, mode) {
    // Redirect and refresh targets are followed even outside --scope: where a redirect ends is part of judging it.
    if (target.fetched || target.queued || target.scope === 'external') return;
    if (mode === 'crawl') { target.queued = true; this.queue.unshift({ key: target.key, via: 'redirect' }); }
    else (this.followUps ||= []).push(target);
  }

  record(p, r) {
    p.fetches.push({ status: r.status, error: r.error, ttfb: r.ttfb, ms: r.ms, at: Date.now() });
    if (p.fetches.length > 1) return;
    p.status = r.status;
    p.error = r.error;
    p.ttfb = r.ttfb;
    p.contentType = r.contentType;
    p.bytes = r.bytes;
    p.truncated = r.truncated;
    p.headers = { xRobots: r.headers['x-robots-tag'] || null, link: r.headers.link || null, encoding: r.headers['content-encoding'] || null, retryAfter: r.headers['retry-after'] || null, hsts: r.headers['strict-transport-security'] || null };
    p.location = r.location || null;
  }

  analyse(p, r, mode) {
    const full = r.body;
    const seen = full.length > GOOGLE_HTML_LIMIT ? full.subarray(0, GOOGLE_HTML_LIMIT) : full;
    const html = decodeBody(seen, r.contentType);
    const x = extractPage(html, p.url);
    const linkHeader = parseLinkHeader(r.headers.link);
    const metaVal = (k, v) => x.metas.filter((m) => m[k] === v).map((m) => collapse(m.content));
    const robots = robotsDirectives(x.robotsMeta, r.headers['x-robots-tag']);
    const canon = [
      ...x.canonicals.map((c) => ({ ...c, key: c.url ? urlKey(c.url) : null })),
      ...linkHeader.filter((l) => l.rel.includes('canonical')).map((l) => { const u = resolveUrl(l.href, p.url); return { href: l.href, url: u, key: u ? urlKey(u) : null, inHead: true, source: 'http-header', relative: !/^[a-z][a-z0-9+.-]*:/i.test(l.href) }; }),
    ];
    const hreflang = [
      ...x.hreflang.map((h) => ({ lang: h.lang, href: h.href, key: h.url ? urlKey(h.url) : null, inHead: h.inHead, source: 'html', relative: h.relative })),
      ...linkHeader.filter((l) => l.rel.includes('alternate') && l.hreflang).map((l) => { const u = resolveUrl(l.href, p.url); return { lang: l.hreflang, href: l.href, key: u ? urlKey(u) : null, inHead: true, source: 'http-header', relative: !/^[a-z][a-z0-9+.-]*:/i.test(l.href) }; }),
    ];
    const https = p.url.startsWith('https:');
    const mixed = { active: [], passive: [] };
    if (https) for (const res of x.resources) if (res.url && res.url.protocol === 'http:') (['css', 'js', 'iframe', 'object'].includes(res.kind) ? mixed.active : mixed.passive).push(`${res.kind} ${res.url.href}`);
    const blocks = x.blocks.map((b) => ({ h: hash(normText(b.text)), w: b.words, boiler: b.boiler, t: b.text.length > 400 ? b.text.slice(0, 400) : b.text, full: b.text }));
    p.a = {
      title: x.titles[0] ?? x.bodyTitles[0] ?? null, titleCount: x.titles.length, titleInBodyOnly: !x.titles.length && x.bodyTitles.length > 0,
      descriptions: metaVal('name', 'description'), viewport: metaVal('name', 'viewport')[0] ?? null, lang: x.lang,
      og: { title: metaVal('property', 'og:title')[0] ?? null, description: metaVal('property', 'og:description')[0] ?? null, image: metaVal('property', 'og:image')[0] ?? metaVal('name', 'og:image')[0] ?? null, url: metaVal('property', 'og:url')[0] ?? null },
      h1: x.h1, h1Count: x.h1Count, robots, robotsMeta: x.robotsMeta, canonicals: canon, hreflang, base: x.base,
      metaRefresh: x.metaRefresh ? { delay: x.metaRefresh.delay, url: x.metaRefresh.url ? urlKey(x.metaRefresh.url) : null, raw: x.metaRefresh.target } : null,
      headBreak: x.headBreak, displaced: x.displacedHeadTags, images: x.images, mixed, insecureForms: https ? x.forms.filter((f) => f.url && f.url.protocol === 'http:').map((f) => f.url.href) : [],
      jsonld: analyseJsonLd(x.jsonld), microdata: x.microdata, scripts: x.scripts, iframes: x.iframes, frameworks: x.frameworks,
      appShell: x.appShell, noscriptJs: x.noscriptJs, visibleWords: x.visibleWords, textBytes: x.textBytes, blocks,
      anchorsWithoutHref: x.anchorsWithoutHref, linkCount: x.links.length,
    };
    if (x.metaRefresh && x.metaRefresh.url) p.refresh = { delay: x.metaRefresh.delay, url: urlKey(x.metaRefresh.url), source: 'meta refresh' };
    // Links: record edges from internal pages (not from a duplicate host), enqueue only in crawl mode.
    const out = new Map();
    for (const l of x.links) {
      if (!l.url) continue;
      const k = urlKey(l.url);
      if (!k || k === p.key) continue;
      const scope = this.classify(l.url);
      if (scope === 'external') { const h = l.url.host; this.s.externalHosts.set(h, (this.s.externalHosts.get(h) || 0) + 1); continue; }
      if (!out.has(k)) out.set(k, { nofollow: l.rel.includes('nofollow'), text: collapse(l.text).slice(0, 80), boiler: l.boiler, utm: /[?&](utm_[a-z]+|gclid|fbclid|sessionid|sid|phpsessid|jsessionid)=/i.test(l.url.search) });
    }
    p.outlinks = [...out].map(([k, v]) => ({ key: k, ...v }));
    if (p.scope !== 'internal') return;
    for (const [k, v] of out) {
      const target = mode === 'crawl' ? this.enqueue(new URL(k), (p.depth ?? 0) + 1, 'link') : this.page(new URL(k), {});
      if (target && !target.inlinks.has(p.key)) target.inlinks.set(p.key, { nofollow: v.nofollow });
    }
    for (const res of x.resources) {
      if (!res.url || !['css', 'js'].includes(res.kind)) continue;
      const k = urlKey(res.url);
      const rec = this.s.resources.get(k) || { url: k, kind: res.kind, pages: 0, host: res.url.host };
      rec.pages++;
      this.s.resources.set(k, rec);
    }
  }

  // ---------- the crawl ----------

  async run() {
    const s = this.s;
    const o = s.opts;
    // 1. start URL and redirects
    let cur = o.start;
    const startChain = [];
    for (let hop = 0; hop < 6; hop++) {
      const u = new URL(cur);
      if (!s.scope) { /* scope is set after the chain resolves */ }
      const us = await this.allowed(cur, 'us');
      if (!us.allowed) { s.fatal = `robots.txt disallows this crawler from ${cur} (${us.rule})`; return; }
      const r = await this.f.get(cur, { maxBytes: HTML_READ_CAP });
      startChain.push({ url: cur, status: r.status, error: r.error, location: r.location });
      if (r.error) { s.fatal = `could not fetch ${cur}: ${r.error}`; return; }
      if (REDIRECT_CODES.includes(r.status) && r.location) { cur = new URL(r.location, cur).href; await this.f.rest(); continue; }
      break;
    }
    s.startChain = startChain;
    const finalStart = new URL(cur);
    const twin = counterpartHost(finalStart.hostname);
    const port = finalStart.port ? `:${finalStart.port}` : '';
    s.scope = { origin: finalStart.origin, host: finalStart.host, protocol: finalStart.protocol, variantHosts: new Set(twin ? [`${twin}${port}`] : []), counterpart: twin ? `${twin}${port}` : null };
    // Start-chain hops become page records (the home page is fetched again below as a normal page).
    const home = this.page(finalStart, { depth: 0, via: 'start' });
    s.homeKey = home.key;
    for (let i = 0; i < startChain.length - 1; i++) {
      const hp = this.page(new URL(startChain[i].url), { via: 'start' });
      if (!hp.fetched) { hp.fetched = true; hp.fetches.push({ status: startChain[i].status, error: null }); hp.status = startChain[i].status; hp.redirectTo = urlKey(new URL(startChain[i + 1].url)); hp.redirectStatus = startChain[i].status; }
    }
    // 2. robots.txt of the scope origin
    const rob = await this.robotsFor(s.scope.origin);
    s.scopeRobots = rob;
    if (rob.state === 'server-error' || rob.state === 'unreachable') {
      s.stopped = `robots.txt returned ${rob.status ?? rob.error}; Google treats that as "crawl nothing" for now, so this crawler stops too`;
      return;
    }
    // 3. sitemaps
    if (!o.noSitemap) {
      const declared = rob.parsed ? rob.parsed.sitemaps : [];
      s.sitemapDeclared = declared;
      const starts = declared.length
        ? declared.map((d) => ({ url: d.absolute ? d.value : (() => { try { return new URL(d.value, rob.finalUrl || rob.url).href; } catch { return d.value; } })(), via: d.absolute ? 'robots.txt' : 'robots.txt (relative path)' }))
        : [{ url: `${s.scope.origin}/sitemap.xml`, via: 'default location (robots.txt declares none)' }];
      this.log(`reading ${starts.length} declared sitemap(s)`);
      s.sitemap = await readSitemaps(starts, { fetcher: this.f, allowedForUs: (u) => this.allowed(u, 'us'), allowedForGoogle: (u) => this.allowed(u, 'google'), maxFiles: o.maxSitemaps, maxBytes: o.maxSitemapBytes, concurrency: o.concurrency });
      for (const [loc, e] of s.sitemap.urls) {
        const u = resolveUrl(loc, s.scope.origin);
        if (!u) continue;
        const p = this.page(u, {});
        if (p) { p.inSitemap = true; p.sitemapLastmod = e.lastmod; p.sitemapAlternates = e.alternates; }
      }
    }
    // 4. breadth-first crawl
    this.enqueue(finalStart, 0, 'start');
    const sitemapPending = () => [...s.pages.values()].filter((p) => p.inSitemap && p.scope === 'internal' && p.inScope && !p.fetched && !p.blockedUs).length;
    const reserve = s.sitemap && sitemapPending() > 0 ? Math.floor(o.limit * 0.2) : 0;
    const crawlBudget = o.limit - reserve;
    await this.drain(() => s.fetchCount < crawlBudget, 'crawl');
    s.linkCrawlComplete = !this.queue.length && !s.stopped && !this.f.stopped;
    s.unfetchedQueued = this.queue.length;
    this.queue.length = 0;
    // 5. sitemap URLs the link crawl did not fetch: undiscovered ones first (orphan candidates)
    if (s.sitemap) {
      const pending = [...s.pages.values()].filter((p) => p.inSitemap && p.scope === 'internal' && p.inScope && !p.fetched && !p.blockedUs);
      pending.sort((a, b) => (a.depth == null ? 0 : 1) - (b.depth == null ? 0 : 1));
      for (const p of pending) { p.queued = true; this.queue.push({ key: p.key, via: 'sitemap' }); }
      await this.drain(() => s.fetchCount < o.limit, 'sitemap');
      s.sitemapUnfetched = this.queue.length;
      this.queue.length = 0;
    }
    if (this.f.stopped || s.stopped) return;
    // 6. probes
    await this.probeVariants();
    await this.probeSlash();
    await this.probeSoft404();
    // 7. canonical / hreflang targets
    await this.verifyTargets();
    // 8. CSS/JS
    await this.checkResources();
    // 9. repeat + confirm
    if (o.repeat > 1) await this.repeatPass();
    await this.confirmPass();
  }

  async drain(budgetOk, mode) {
    const s = this.s;
    let lastLog = 0;
    const worker = async () => {
      for (;;) {
        if (this.f.stopped || s.stopped) return;
        if (Date.now() > s.deadline) { s.stopped = `time budget of ${s.opts.maxMinutes} min reached`; return; }
        const pb = this.f.recentPushback(8);
        if (pb.count >= 4 || pb.consecutive >= 3) await this.healthProbe();
        if (!budgetOk()) return;
        const item = this.queue.shift();
        if (!item) {
          if (this.active === 0) return;
          await sleep(50);
          continue;
        }
        const p = s.pages.get(item.key);
        if (!p || p.fetched || p.blockedUs) continue;
        this.active++;
        try {
          const allowedBefore = p.blockedUs;
          await this.visit(p, { mode });
          if (p.fetched) {
            s.fetchCount++;
            if (s.fetchCount - lastLog >= 25) { lastLog = s.fetchCount; this.log(`${s.fetchCount} URLs fetched, ${this.queue.length} queued`); }
            await this.f.rest();
          } else if (allowedBefore !== p.blockedUs) { /* robots decided; no request made for the page */ }
        } finally { this.active--; }
      }
    };
    await Promise.all(Array.from({ length: s.opts.concurrency }, worker));
  }

  async healthProbe() {
    const s = this.s;
    if (this.probing) { while (this.probing) await sleep(200); return; }
    this.probing = true;
    try {
      if (this.probesLeft <= 0) { this.f.stopped = 'repeated 429/503/timeouts: the server is pushing back, so the crawl stopped early'; return; }
      this.probesLeft--;
      await sleep(Math.min(30000, this.f.delay * 4));
      const r = await this.f.get(`${s.scope.origin}/`, { maxBytes: 65536 });
      this.log(`health check after repeated errors: home page -> ${r.status ?? r.error}`);
      if (r.status !== 200) this.f.stopped = `the home page returned ${r.status ?? r.error} during a burst of 429/503/timeouts; stopped to avoid adding load`;
      this.f.pushback.length = 0;
    } finally { this.probing = false; }
  }

  // ---------- probes ----------

  async chain(url, maxHops = 5) {
    const hops = [];
    let cur = url;
    for (let i = 0; i <= maxHops; i++) {
      const us = await this.allowed(cur, 'us');
      if (!us.allowed) { hops.push({ url: cur, status: null, error: `not fetched (${us.rule})` }); break; }
      const r = await this.f.get(cur, { maxBytes: HTML_READ_CAP });
      this.s.verifyCount++;
      hops.push({ url: cur, status: r.status, error: r.error, location: r.location, r });
      await this.f.rest();
      if (REDIRECT_CODES.includes(r.status) && r.location) {
        try { cur = new URL(r.location, cur).href; } catch { break; }
        if (hops.some((h) => h.url === cur)) { hops.push({ url: cur, status: null, error: 'loop' }); break; }
        continue;
      }
      break;
    }
    return hops;
  }

  async probeVariants() {
    const s = this.s;
    const sc = s.scope;
    const other = sc.protocol === 'https:' ? 'http:' : 'https:';
    const cands = [`${other}//${sc.host}/`, ...(sc.counterpart ? [`${sc.protocol}//${sc.counterpart}/`, `${other}//${sc.counterpart}/`] : [])];
    for (const v of cands) {
      const hops = await this.chain(v);
      const last = hops[hops.length - 1];
      const final = last && last.status === 200 ? last : null;
      let canonical = null;
      if (final && final.r && final.r.body) {
        const x = extractPage(decodeBody(final.r.body, final.r.contentType), last.url);
        canonical = x.canonicals[0]?.url ? urlKey(x.canonicals[0].url) : null;
      }
      s.probes.variants.push({ url: v, hops: hops.map(({ r, ...h }) => h), finalUrl: last ? last.url : null, finalStatus: last ? last.status : null, error: last ? last.error : null, canonical, endsAtScope: Boolean(last && last.status === 200 && new URL(last.url).origin === sc.origin) });
    }
  }

  async probeSlash() {
    const s = this.s;
    const done = new Set();
    const cands = [...s.pages.values()].filter((p) => p.scope === 'internal' && p.status === 200 && p.isHtml && p.a && new URL(p.url).pathname.length > 1 && !new URL(p.url).search);
    for (const p of cands) {
      if (s.probes.slash.length >= 3) break;
      const u = new URL(p.url);
      const seg = u.pathname.split('/')[1];
      if (done.has(seg)) continue;
      done.add(seg);
      const twin = new URL(p.url);
      twin.pathname = u.pathname.endsWith('/') ? u.pathname.replace(/\/+$/, '') || '/' : `${u.pathname}/`;
      const tk = urlKey(twin);
      const known = s.pages.get(tk);
      let rec;
      if (known && known.fetched) rec = { url: tk, status: known.status, location: known.redirectTo || null, canonical: known.a?.canonicals?.[0]?.key ?? null, title: known.a?.title ?? null, fromCrawl: true };
      else {
        const hops = await this.chain(tk, 0);
        const h = hops[0];
        let canonical = null;
        let title = null;
        if (h && h.status === 200 && h.r && h.r.body && /html/.test(h.r.contentType)) {
          const x = extractPage(decodeBody(h.r.body, h.r.contentType), tk);
          canonical = x.canonicals[0]?.url ? urlKey(x.canonicals[0].url) : null;
          title = x.titles[0] ?? null;
        }
        rec = { url: tk, status: h ? h.status : null, error: h ? h.error : null, location: h && h.location ? urlKey(new URL(h.location, tk)) : null, canonical, title };
      }
      rec.original = p.key;
      rec.originalTitle = p.a.title;
      rec.originalCanonical = p.a.canonicals[0]?.key ?? null;
      s.probes.slash.push(rec);
    }
  }

  async probeSoft404() {
    const s = this.s;
    const rand = () => randomBytes(5).toString('hex');
    const firstDir = [...s.pages.values()].map((p) => new URL(p.url)).find((u) => this.classify(u) === 'internal' && u.pathname.split('/').filter(Boolean).length >= 2)?.pathname.split('/')[1];
    const urls = [`${s.scope.origin}/mt7-diagnose-missing-${rand()}`];
    if (firstDir) urls.push(`${s.scope.origin}/${firstDir}/mt7-diagnose-missing-${rand()}`);
    for (const u of urls) {
      const hops = await this.chain(u);
      const last = hops[hops.length - 1];
      let words = null;
      let title = null;
      let text = '';
      if (last && last.status === 200 && last.r && last.r.body) {
        const x = extractPage(decodeBody(last.r.body, last.r.contentType), last.url);
        words = x.visibleWords;
        title = x.titles[0] || null;
        text = x.blocks.map((b) => b.text).join(' ').slice(0, 2000);
      }
      s.probes.soft404.push({ url: u, hops: hops.map(({ r, ...h }) => h), finalUrl: last ? last.url : null, finalStatus: last ? last.status : null, redirected: hops.length > 1, title, words, text });
    }
  }

  // ---------- targets the crawl did not fetch ----------

  async verifyTargets() {
    const s = this.s;
    const want = new Map();
    for (const p of s.pages.values()) {
      if (!p.a) continue;
      for (const c of p.a.canonicals) if (c.key && c.key !== p.key) want.set(c.key, 'canonical');
      for (const h of p.a.hreflang) if (h.key && h.key !== p.key && !want.has(h.key)) want.set(h.key, 'hreflang');
    }
    // canonical chains: a canonical target that itself canonicalises elsewhere is checked one level further
    let budget = s.opts.verifyLimit;
    const queue = [...want].map(([key, why]) => ({ key, why }));
    while (queue.length && budget > 0 && !this.f.stopped) {
      const { key, why } = queue.shift();
      const p = this.page(new URL(key), {});
      if (!p || p.fetched || p.blockedUs) continue;
      if (p.scope === 'external' && why === 'canonical') { p.externalTarget = true; continue; }
      if (p.scope === 'external' && why === 'hreflang' && budget < s.opts.verifyLimit / 2) continue;
      budget--;
      await this.visit(p, { mode: 'verify' });
      if (p.fetched) { s.verifyCount++; await this.f.rest(); }
      for (const t of this.followUps || []) if (!t.fetched) queue.unshift({ key: t.key, why: 'redirect' });
      this.followUps = [];
    }
    s.verifyBudgetLeft = budget;
  }

  async checkResources() {
    const s = this.s;
    const list = [...s.resources.values()].sort((a, b) => b.pages - a.pages);
    let fetched = 0;
    for (const r of list) {
      const u = new URL(r.url);
      const sameSite = this.classify(u) !== 'external' || u.hostname.endsWith(`.${s.scope.host.replace(/^www\./, '')}`);
      r.sameSite = sameSite;
      if (!sameSite) continue;
      const g = await this.allowed(r.url, 'google');
      r.blockedGoogle = g.allowed ? null : g.rule;
      if (fetched >= s.opts.resourceLimit) continue;
      const us = await this.allowed(r.url, 'us');
      if (!us.allowed) { r.blockedUs = us.rule; continue; }
      const res = await this.f.get(r.url, { body: 'never' });
      fetched++;
      r.status = res.status;
      r.error = res.error;
      r.contentType = res.contentType;
      if (res.status >= 300 && res.status < 400 && res.location) r.location = res.location;
      await this.f.rest();
    }
    s.resourcesChecked = fetched;
  }

  // ---------- repeat and confirmation ----------

  async refetch(p, { analyseRobots = false } = {}) {
    const r = await this.f.get(p.url, { maxBytes: HTML_READ_CAP, body: analyseRobots ? 'always' : 'auto' });
    this.s.verifyCount++;
    p.fetches.push({ status: r.status, error: r.error, ttfb: r.ttfb, ms: r.ms, at: Date.now() });
    if (analyseRobots && r.status === 200 && r.body && /html/.test(r.contentType)) {
      const x = extractPage(decodeBody(r.body.subarray(0, GOOGLE_HTML_LIMIT), r.contentType), p.url);
      const rb = robotsDirectives(x.robotsMeta, r.headers['x-robots-tag']);
      (p.recheck ||= []).push({ noindex: rb.noindex, via: rb.noindexVia, canonical: x.canonicals[0]?.url ? urlKey(x.canonicals[0].url) : null });
    }
    await this.f.rest();
  }

  async repeatPass() {
    const s = this.s;
    const pages = [...s.pages.values()].filter((p) => p.fetched && p.scope === 'internal' && p.isHtml);
    for (let i = 1; i < s.opts.repeat; i++) {
      this.log(`repeat pass ${i + 1}/${s.opts.repeat}: ${pages.length} URLs`);
      let idx = 0;
      await Promise.all(Array.from({ length: s.opts.concurrency }, async () => {
        while (idx < pages.length && !this.f.stopped && Date.now() < s.deadline) { const p = pages[idx++]; await this.refetch(p); }
      }));
    }
  }

  async confirmPass() {
    const s = this.s;
    const targets = [];
    const canonTargets = new Set();
    for (const p of s.pages.values()) if (p.a) for (const c of p.a.canonicals) if (c.key && c.key !== p.key) canonTargets.add(c.key);
    for (const p of s.pages.values()) {
      if (!p.fetched || p.scope === 'external') continue;
      const bad = p.fetches.some((f) => f.error || f.status === 429 || f.status >= 500);
      const noindexMatters = p.a && p.a.robots.noindex && (p.inSitemap || canonTargets.has(p.key) || p.key === s.homeKey);
      const homeBad = p.key === s.homeKey && p.status !== 200;
      if ((bad || homeBad) && p.fetches.length < 3) targets.push({ p, robots: false });
      else if (noindexMatters) targets.push({ p, robots: true });
    }
    const cap = 30;
    this.log(`confirming ${Math.min(cap, targets.length)} URL(s) behind severe findings`);
    for (const t of targets.slice(0, cap)) {
      if (this.f.stopped) break;
      await this.refetch(t.p, { analyseRobots: t.robots });
    }
    s.confirmSkipped = Math.max(0, targets.length - cap);
  }
}
