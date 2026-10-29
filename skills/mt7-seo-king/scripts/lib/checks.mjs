/**
 * lib/checks.mjs - turn a finished crawl into ranked findings. Node 18+, no dependencies.
 *
 * Calibration rules this file follows (false positives cost more than misses):
 *  - a finding is made only from a fetched response; severe ones are re-fetched first
 *  - severity is the likely effect on crawling, indexing, ranking or users, never cosmetics
 *  - "orphan" only when the link crawl finished; "thin" never for pages that need JavaScript
 *  - nested JSON-LD entities are not duplicates; FAQ/HowTo are information, not gaps
 *  - Cache-Control, title length, llms.txt and the like are not ranking verdicts
 */

import { createHash } from 'node:crypto';
import { hreflangProblem } from './hreflang.mjs';
import { lastmodStats, SITEMAP_MAX_URLS, SITEMAP_MAX_BYTES } from './sitemaps.mjs';
import { urlKey } from './html.mjs';
import { isAllowed } from './robots.mjs';
import { GOOGLE_HTML_LIMIT } from './crawl.mjs';

export const DOC = {
  sitemaps: 'https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap',
  sitemapsOverview: 'https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview',
  canonical: 'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls',
  canonicalMistakes: 'https://developers.google.com/search/blog/2013/04/5-common-mistakes-with-relcanonical',
  robotsTxt: 'https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec',
  robotsIntro: 'https://developers.google.com/search/docs/crawling-indexing/robots/intro',
  robotsMeta: 'https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag',
  noindexRobotsTxt: 'https://developers.google.com/search/blog/2019/07/a-note-on-unsupported-rules-in-robotstxt',
  httpErrors: 'https://developers.google.com/crawling/docs/troubleshooting/http-status-codes',
  soft404: 'https://developers.google.com/search/docs/crawling-indexing/troubleshoot-crawling-errors',
  siteMove: 'https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes',
  sitemapHelp: 'https://support.google.com/webmasters/answer/7451001',
  vitals: 'https://web.dev/articles/vitals',
  redirects: 'https://developers.google.com/search/docs/crawling-indexing/301-redirects',
  googlebot: 'https://developers.google.com/search/docs/crawling-indexing/googlebot',
  links: 'https://developers.google.com/search/docs/crawling-indexing/links-crawlable',
  hreflang: 'https://developers.google.com/search/docs/specialty/international/localized-versions',
  titles: 'https://developers.google.com/search/docs/appearance/title-link',
  snippets: 'https://developers.google.com/search/docs/appearance/snippet',
  sdGallery: 'https://developers.google.com/search/docs/appearance/structured-data/search-gallery',
  sdGeneral: 'https://developers.google.com/search/docs/appearance/structured-data/sd-policies',
  reviewSnippet: 'https://developers.google.com/search/docs/appearance/structured-data/review-snippet',
  js: 'https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics',
  crawlBudget: 'https://developers.google.com/crawling/docs/crawl-budget',
  cwv: 'https://developers.google.com/search/docs/appearance/core-web-vitals',
  ttfb: 'https://web.dev/articles/ttfb',
  mixed: 'https://web.dev/articles/what-is-mixed-content',
  helpful: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content',
  starter: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide',
  images: 'https://developers.google.com/search/docs/appearance/google-images',
  mobile: 'https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing',
  multiRegional: 'https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites',
  updates: 'https://developers.google.com/search/updates',
};

const SEV = ['critical', 'high', 'medium', 'low', 'info'];
const pct = (a, b) => (b ? `${((100 * a) / b).toFixed(1)}%` : '0%');
const short = (s, n = 90) => { const t = String(s ?? ''); return t.length > n ? `${t.slice(0, n - 3)}...` : t; };
const quantile = (arr, q) => { if (!arr.length) return null; const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(q * (s.length - 1) + 0.5))]; };

export function buildFindings(state) {
  const findings = [];
  const fine = [];
  const add = (f) => { f.count = f.count ?? f.evidence?.length ?? 0; findings.push(f); };
  const P = state.pages;
  const pages = [...P.values()];
  const fetched = pages.filter((p) => p.fetched);
  const internal = fetched.filter((p) => p.scope === 'internal');
  const html200 = internal.filter((p) => p.status === 200 && p.isHtml && p.a);
  const home = P.get(state.homeKey);
  const ev = (url, detail) => ({ url, detail });

  // ----- helpers -----
  const ok200 = (p) => p && p.fetches.some((f) => f.status === 200);
  const allBad = (p, test) => p && p.fetches.length > 0 && p.fetches.every(test);
  const noindexConfirmed = (p) => {
    if (!p?.a?.robots.noindex) return false;
    if (!p.recheck || !p.recheck.length) return true;
    return p.recheck.every((r) => r.noindex);
  };
  const effCanon = (p) => {
    if (!p.a) return { key: null, conflict: false, honored: [] };
    const honored = p.a.canonicals.filter((c) => c.key && (c.source === 'http-header' || c.inHead));
    const keys = [...new Set(honored.map((c) => c.key))];
    return { key: keys.length === 1 ? keys[0] : null, conflict: keys.length > 1, honored, keys };
  };
  const selfCanon = (p) => { const c = effCanon(p); return !c.conflict && (!c.key || c.key === p.key); };
  const indexable = (p) => p.status === 200 && p.isHtml && p.a && !p.a.robots.noindex && !p.blockedGoogle;
  const canonicalIndexable = (p) => indexable(p) && selfCanon(p);
  const follow = (startKey) => {
    const hops = [startKey];
    let cur = P.get(startKey);
    const seen = new Set([startKey]);
    while (cur && (cur.redirectTo || (cur.refresh && cur.refresh.delay === 0 && cur.status === 200))) {
      const next = cur.redirectTo || cur.refresh.url;
      if (seen.has(next)) return { hops: [...hops, next], loop: true, final: null };
      seen.add(next);
      hops.push(next);
      cur = P.get(next);
      if (!cur || !cur.fetched) return { hops, loop: false, final: cur || null, unknown: true };
    }
    return { hops, loop: false, final: cur };
  };
  const statusOf = (p) => (p ? (p.status ?? p.error ?? (p.blockedUs ? 'not fetched (robots.txt)' : 'not fetched')) : 'not fetched');
  const inl = (p) => p.inlinks.size;
  const sampleSources = (p, n = 2) => [...p.inlinks.keys()].slice(0, n).join(', ');

  // ----- JS-dependence (decides whether thin/orphan claims may be made) -----
  for (const p of html200) {
    const a = p.a;
    const inlineHeavy = a.scripts.inlineBytes > 5 * Math.max(1, a.textBytes) + 4000;
    // A noscript notice on a page that already has its text in the HTML is not JavaScript dependence.
    p.jsDependent = ((a.appShell || a.noscriptJs) && a.visibleWords < 150) || (a.visibleWords < 60 && (inlineHeavy || a.scripts.external >= 4));
  }
  const jsShare = html200.length ? html200.filter((p) => p.jsDependent).length / html200.length : 0;

  // ----- boilerplate removal: blocks repeated across many pages are template -----
  const blockFreq = new Map();
  for (const p of html200) for (const h of new Set(p.a.blocks.map((b) => b.h))) blockFreq.set(h, (blockFreq.get(h) || 0) + 1);
  const boilerMin = Math.max(3, Math.ceil(html200.length * 0.4));
  for (const p of html200) {
    const main = p.a.blocks.filter((b) => !b.boiler && blockFreq.get(b.h) < boilerMin);
    p.mainWords = main.reduce((n, b) => n + b.w, 0);
    p.mainText = main.map((b) => b.full).join(' ').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  // ================= 1. Site-level blockers =================
  const sr = state.scopeRobots;
  if (state.stopped && /robots\.txt returned/.test(state.stopped)) {
    add({ id: 'robots-unavailable', severity: 'critical', title: 'robots.txt returns a server error or cannot be reached', why: 'For a robots.txt that returns 5xx, Google stops crawling the site for the first 12 hours, then falls back to the last good copy for up to 30 days. This crawler stops too.', tag: `[G] ${DOC.robotsTxt}`, evidence: [ev(sr?.url, `${sr?.status ?? sr?.error}`)], verify: 'curl -sI <origin>/robots.txt several times; Search Console > Settings > robots.txt report.' });
  }
  if (sr && sr.state === 'ok' && sr.google && !isAllowed(sr.google, `${state.scope.origin}/`).allowed) {
    add({ id: 'robots-blocks-site', severity: 'critical', title: 'robots.txt blocks Googlebot from the home page', why: 'Google cannot crawl what robots.txt disallows; a disallowed home page usually means the whole site is blocked.', tag: `[G] ${DOC.robotsTxt}`, evidence: [ev(`${state.scope.origin}/`, `Googlebot group "${sr.google.agent}": blocked`)], verify: 'Search Console robots.txt report, or test the rule in the URL Inspection tool.' });
  }
  if (home && home.fetched) {
    const codes = home.fetches.map((f) => f.status ?? f.error);
    if (!ok200(home)) {
      const botWall = home.fetches.every((f) => [401, 403, 429, 503].includes(f.status));
      add({ id: 'home-not-200', severity: botWall ? 'high' : 'critical', title: 'The home page does not return 200', why: botWall ? 'Every fetch was refused (401/403/429/503). That may be bot protection aimed at this tool rather than at Googlebot, so check what Googlebot gets before acting.' : 'The home page anchors the site; if it errors, crawling and the site name/sitelinks suffer.', tag: `[G] ${DOC.httpErrors}`, evidence: [ev(home.url, `fetches: ${codes.join(', ')}`)], verify: 'URL Inspection > Test live URL on the home page.' });
    }
    if (home.a && noindexConfirmed(home)) add({ id: 'home-noindex', severity: 'critical', title: 'The home page carries noindex', why: 'noindex removes the page from Google Search.', tag: `[G] ${DOC.robotsMeta}`, evidence: [ev(home.url, home.a.robots.noindexVia.join(' | '))], verify: 'View source and response headers of the home page; URL Inspection.' });
  }

  // ================= 2. robots.txt hygiene =================
  if (sr) {
    if (sr.state === 'missing') fine.push(`robots.txt: HTTP ${sr.status} - Google treats a missing robots.txt as "no restrictions" [G]`);
    if (sr.state === 'ok') {
      const pr = sr.parsed;
      if (pr.looksLikeHtml) add({ id: 'robots-html', severity: 'medium', title: 'robots.txt serves an HTML page', why: 'An HTML page has no valid rules, so whatever the site meant to restrict is not restricted (and the sitemap line is lost).', tag: `[G] ${DOC.robotsTxt}`, evidence: [ev(sr.url, `HTTP ${sr.status}, content looks like HTML`)], verify: 'Open /robots.txt in a browser.' });
      if (pr.truncated) add({ id: 'robots-too-large', severity: 'medium', title: 'robots.txt is larger than 500 KiB', why: 'Google reads only the first 500 KiB; rules after the cut are ignored.', tag: `[G] ${DOC.robotsTxt}`, evidence: [ev(sr.url, `${(pr.bytes / 1024).toFixed(0)} KiB`)], verify: 'curl -s <origin>/robots.txt | wc -c' });
      const noidx = pr.unsupported.filter((u) => u.directive === 'noindex' || u.directive === 'nofollow');
      if (noidx.length) add({ id: 'robots-noindex-directive', severity: 'medium', title: 'robots.txt uses Noindex/Nofollow lines, which Google ignores', why: 'Google stopped supporting noindex in robots.txt on 2019-09-01; the URLs these lines name are still indexable. Use a robots meta tag or X-Robots-Tag header instead.', tag: `[G] ${DOC.noindexRobotsTxt}`, evidence: noidx.map((u) => ev(sr.url, `line ${u.line}: ${u.directive}: ${u.value}`)), verify: 'Read robots.txt; check one named URL with URL Inspection.' });
      const other = pr.unsupported.filter((u) => !['noindex', 'nofollow'].includes(u.directive));
      if (other.length) add({ id: 'robots-ignored-lines', severity: 'info', title: 'robots.txt lines Google ignores', why: 'Google ignores crawl-delay, host and clean-param; they are harmless but do nothing for Google (other engines may read them).', tag: `[G] ${DOC.robotsTxt}`, evidence: other.slice(0, 10).map((u) => ev(sr.url, `line ${u.line}: ${u.directive}: ${u.value}`)) });
      if (pr.invalid.length) add({ id: 'robots-invalid-lines', severity: 'low', title: 'robots.txt lines that are not valid rules', why: 'Unparseable lines are skipped; if one was meant as a rule, it is not in force.', tag: `[G] ${DOC.robotsTxt}`, evidence: pr.invalid.slice(0, 10).map((l) => ev(sr.url, `line ${l.line}: ${l.text}`)) });
      const rel = pr.sitemaps.filter((x) => !x.absolute);
      if (rel.length) add({ id: 'robots-relative-sitemap', severity: 'low', title: 'robots.txt Sitemap lines with relative URLs', why: 'The Sitemap field takes a fully-qualified URL; a relative path may not be fetched.', tag: `[G] ${DOC.robotsTxt}`, evidence: rel.map((x) => ev(sr.url, `line ${x.line}: Sitemap: ${x.value}`)) });
      if (!pr.sitemaps.length) add({ id: 'robots-no-sitemap', severity: 'info', title: 'robots.txt declares no sitemap', why: 'Not required if the sitemap is submitted in Search Console, but declaring it lets every engine find it.', tag: `[G] ${DOC.sitemaps}`, evidence: [ev(sr.url, 'no Sitemap: line')] });
    }
  }

  // ================= 3. Status codes, server health =================
  const dist = new Map();
  for (const p of internal) { const k = p.status ?? p.error ?? 'error'; dist.set(k, (dist.get(k) || 0) + 1); }
  const allFetches = internal.flatMap((p) => p.fetches);
  const isFail = (f) => f.error || f.status === 429 || f.status >= 500;
  const intermittent = internal.filter((p) => p.fetches.some((f) => f.status === 200) && p.fetches.some(isFail));
  const failEvents = intermittent.reduce((n, p) => n + p.fetches.filter(isFail).length, 0);
  if (intermittent.length) {
    const rate = failEvents / Math.max(1, allFetches.length);
    add({ id: 'intermittent-errors', severity: failEvents >= 2 || rate >= 0.01 ? 'high' : 'medium', title: 'Intermittent server errors (the same URL returned 200 and an error)', why: 'Google slows crawling when it sees 5xx/429 responses and timeouts; recurring errors on good pages also risk them dropping out. A single event can be noise, so compare with Search Console Crawl Stats (By response).', tag: `[G] ${DOC.httpErrors}`, evidence: intermittent.map((p) => ev(p.url, `fetches: ${p.fetches.map((f) => f.status ?? f.error).join(', ')}`)), note: `${failEvents} failed of ${allFetches.length} fetches to internal URLs (${pct(failEvents, allFetches.length)})`, verify: 'Search Console > Settings > Crawl stats > By response (5xx share); server/CDN logs for the timestamps.' });
  } else if (allFetches.length) fine.push(`no intermittent errors: no URL returned both 200 and 5xx/429/timeout across ${allFetches.length} fetches${state.opts.repeat > 1 ? ` (--repeat ${state.opts.repeat})` : ''}`);

  const unreachable = internal.filter((p) => p.fetches.length && p.fetches.every((f) => f.error));
  if (unreachable.length) add({ id: 'unreachable', severity: 'medium', title: 'URLs that timed out or failed on every fetch', why: 'Googlebot sees the same failure as a server error and slows down; a URL that never answers cannot be indexed.', tag: `[G] ${DOC.httpErrors}`, evidence: unreachable.map((p) => ev(p.url, `${p.fetches.map((f) => f.error).join(', ')}; linked from ${inl(p)} page(s)`)), verify: 'curl -m 30 -sI <url>; check server logs.' });

  const linkedErr = (test) => internal.filter((p) => inl(p) > 0 && allBad(p, (f) => f.status != null && test(f.status)));
  const l5 = linkedErr((s) => s >= 500);
  if (l5.length) add({ id: 'links-to-5xx', severity: 'high', title: 'Internal links to URLs that return 5xx on every fetch', why: 'Persistent server errors on linked URLs waste crawling and make Google slow down for the whole host.', tag: `[G] ${DOC.httpErrors}`, evidence: l5.map((p) => ev(p.url, `${p.fetches.map((f) => f.status).join(', ')} <- linked from ${inl(p)} page(s), e.g. ${sampleSources(p)}`)), verify: 'curl -sI <url> twice; fix the error or remove the links.' });
  const l4 = linkedErr((s) => s >= 400 && s < 500 && ![401, 403].includes(s));
  if (l4.length) add({ id: 'links-to-4xx', severity: 'medium', title: 'Broken internal links (4xx)', why: 'Users hit dead ends, and Google does not index URLs that return 4xx; crawl effort is spent on URLs that cannot be indexed.', tag: `[G] ${DOC.httpErrors}`, evidence: l4.sort((a, b) => inl(b) - inl(a)).map((p) => ev(p.url, `${p.status} <- linked from ${inl(p)} page(s), e.g. ${sampleSources(p)}`)), verify: 'Open the source page, find the link, curl -sI the target.' });
  const l403 = linkedErr((s) => s === 401 || s === 403);
  if (l403.length) add({ id: 'links-to-401-403', severity: 'low', title: 'Internal links to URLs that refuse access (401/403)', why: 'Google cannot index a page it is refused; fine for account pages, a problem if the page was meant to be public (or if a firewall is refusing this tool but not Googlebot).', tag: `[G] ${DOC.httpErrors}`, evidence: l403.map((p) => ev(p.url, `${p.status} <- linked from ${inl(p)} page(s)`)), verify: 'Open the URL logged out in a browser; URL Inspection for one of them.' });

  // TTFB
  const ttfbs = html200.map((p) => p.fetches[0]?.ttfb).filter((n) => Number.isFinite(n));
  if (ttfbs.length >= 5) {
    const p50 = quantile(ttfbs, 0.5); const p75 = quantile(ttfbs, 0.75); const p90 = quantile(ttfbs, 0.9); const max = Math.max(...ttfbs);
    const slow = html200.filter((p) => p.fetches[0]?.ttfb > 1800).sort((a, b) => b.fetches[0].ttfb - a.fetches[0].ttfb);
    const summary = `time to first byte from this machine: p50 ${p50} ms, p75 ${p75} ms, p90 ${p90} ms, max ${max} ms over ${ttfbs.length} HTML pages`;
    if (p75 > 800) add({ id: 'slow-ttfb', severity: p75 > 1800 ? 'medium' : 'low', title: 'Slow server response (TTFB)', why: 'web.dev rates a TTFB of 0.8 s or less as good and over 1.8 s as poor (TTFB is not a Core Web Vital). Slow responses delay every page view, and Google lowers its crawl capacity for slow hosts (which matters mostly for large sites). Measured from one machine and network, so treat it as a lead and check field data.', tag: `[G] ${DOC.ttfb} ; ${DOC.crawlBudget}`, evidence: (slow.length ? slow : [...html200].sort((a, b) => b.fetches[0].ttfb - a.fetches[0].ttfb).slice(0, 5)).map((p) => ev(p.url, `TTFB ${p.fetches[0].ttfb} ms`)), note: summary, verify: 'PageSpeed Insights field TTFB; run again from another network.' });
    else fine.push(summary);
  }
  // HTML size
  const big = html200.filter((p) => p.bytes > GOOGLE_HTML_LIMIT || p.truncated);
  if (big.length) add({ id: 'html-over-2mb', severity: 'high', title: 'HTML larger than Googlebot\'s 2 MB fetch limit', why: 'Googlebot indexes only the first 2 MB of an HTML file (uncompressed); anything after the cut - text, links, structured data - is not seen.', tag: `[G] ${DOC.googlebot}`, evidence: big.map((p) => ev(p.url, p.truncated ? `more than ${(p.bytes / 1048576).toFixed(1)} MB (read stopped at the cap)` : `${(p.bytes / 1048576).toFixed(2)} MB`)), verify: 'curl -s --compressed <url> | wc -c' });
  const nearBig = html200.filter((p) => p.bytes > 1048576 && p.bytes <= GOOGLE_HTML_LIMIT && !p.truncated);
  if (nearBig.length) add({ id: 'html-near-2mb', severity: 'low', title: 'HTML between 1 and 2 MB', why: 'Not cut yet, but close to the 2 MB limit; inline data and scripts usually account for it.', tag: `[G] ${DOC.googlebot}`, evidence: nearBig.map((p) => ev(p.url, `${(p.bytes / 1048576).toFixed(2)} MB`)) });
  // Mixed content
  const act = html200.filter((p) => p.a.mixed.active.length);
  if (act.length) add({ id: 'mixed-content-active', severity: 'medium', title: 'Mixed content: scripts/styles/iframes loaded over http:// on https pages', why: 'Browsers block active mixed content, so these resources do not load for users (and the page may render broken).', tag: `[G] ${DOC.mixed}`, evidence: act.map((p) => ev(p.url, p.a.mixed.active.slice(0, 3).join(' | '))), verify: 'Open the page with DevTools console open; look for "Mixed Content" errors.' });
  const pas = html200.filter((p) => p.a.mixed.passive.length && !p.a.mixed.active.length);
  if (pas.length) add({ id: 'mixed-content-passive', severity: 'low', title: 'Mixed content: images/media referenced over http:// on https pages', why: 'Chrome upgrades these requests to https and they fail if the file is not available over https; other browsers may warn.', tag: `[G] ${DOC.mixed}`, evidence: pas.map((p) => ev(p.url, p.a.mixed.passive.slice(0, 3).join(' | '))) });
  const forms = html200.filter((p) => p.a.insecureForms.length);
  if (forms.length) add({ id: 'insecure-forms', severity: 'info', title: 'Forms on https pages that submit to http://', why: 'Browsers warn users before sending such a form; a user-trust issue, not a ranking one.', tag: `[INFERENCE]`, evidence: forms.map((p) => ev(p.url, p.a.insecureForms.slice(0, 2).join(' | '))) });
  // CSS/JS resources
  const res = [...state.resources.values()].filter((r) => r.sameSite);
  // Analytics/ads/tag scripts do not change what the page shows, so blocking them is harmless for rendering.
  const tracking = (u) => /analytics|gtag|googletagmanager|gtm\.js|tagmanager|pixel|track|stats?\.|statcounter|plausible|matomo|piwik|segment|hotjar|clarity|doubleclick|adservice|adsbygoogle|beacon|insights|metrics|consent|cookie/i.test(u);
  const blockedTracking = res.filter((r) => r.blockedGoogle && r.kind === 'js' && tracking(r.url));
  if (blockedTracking.length) add({ id: 'robots-blocks-tracking', severity: 'info', title: 'robots.txt blocks analytics/tracking scripts', why: 'Harmless for indexing: these scripts do not change what the page shows. Listed so the block is a deliberate choice.', tag: `[G] ${DOC.robotsIntro}`, evidence: blockedTracking.map((r) => ev(r.url, `used on ${r.pages} page(s); ${r.blockedGoogle}`)) });
  const blockedRes = res.filter((r) => r.blockedGoogle && !blockedTracking.includes(r));
  if (blockedRes.length) add({ id: 'robots-blocks-resources', severity: 'medium', title: 'robots.txt blocks CSS/JS that pages use', why: 'Google renders pages with their CSS and JavaScript and does not render JavaScript from blocked files; if a blocked resource makes the page harder to understand, Google says not to block it. Unimportant resources may stay blocked.', tag: `[G] ${DOC.robotsIntro}`, evidence: blockedRes.map((r) => ev(r.url, `${r.kind}, used on ${r.pages} page(s); ${r.blockedGoogle}`)), verify: 'URL Inspection > Test live URL > More info > Page resources ("blocked by robots.txt").' });
  const brokenRes = res.filter((r) => r.status >= 400);
  if (brokenRes.length) add({ id: 'broken-resources', severity: brokenRes.some((r) => r.pages >= Math.max(2, html200.length / 2)) ? 'medium' : 'low', title: 'CSS/JS files that return an error', why: 'A missing stylesheet or script can break layout or functionality for users and for Google\'s renderer.', tag: `[INFERENCE]`, evidence: brokenRes.map((r) => ev(r.url, `${r.kind} -> ${r.status}, referenced on ${r.pages} page(s)`)) });

  // ================= 4. Redirects =================
  const redirecting = fetched.filter((p) => p.scope !== 'external' && (p.redirectTo || (p.refresh && p.refresh.delay === 0 && p.status === 200)));
  const chains = []; const loops = []; const toError = []; const toBlocked = [];
  for (const p of redirecting) {
    const c = follow(p.key);
    if (c.loop) { loops.push({ p, c }); continue; }
    const last = P.get(c.hops[c.hops.length - 1]);
    if (last && last.blockedGoogle) toBlocked.push({ p, c, last });
    else if (last && last.fetched && (last.status >= 400 || last.error)) toError.push({ p, c });
    if (c.hops.length >= 3) chains.push({ p, c });
  }
  const chainStr = (c) => c.hops.map((k) => { const x = P.get(k); return `${k} [${x ? (x.redirectStatus || (x.refresh && x.status === 200 ? 'refresh' : statusOf(x))) : '?'}]`; }).join(' -> ');
  // A chain or loop is reported from every URL people or crawlers actually enter it by.
  const entry = (p) => inl(p) > 0 || p.inSitemap || p.via === 'start';
  const inOther = (list, p) => list.some(({ c }) => c.hops.indexOf(p.key) > 0);
  const loopHeads = loops.filter(({ p }) => entry(p) || !inOther(loops, p));
  if (loopHeads.length) add({ id: 'redirect-loop', severity: 'high', title: 'Redirect loops (server or meta refresh)', why: 'A loop never reaches a page; browsers show an error and Google cannot index anything at that URL.', tag: `[G] ${DOC.httpErrors}`, evidence: loopHeads.map(({ p, c }) => ev(p.url, `${chainStr(c)}${inl(p) ? `; linked from ${inl(p)} page(s)` : ''}`)), verify: 'curl -sIL --max-redirs 12 <url> (and view-source for a meta refresh)' });
  const chainHeads = chains.filter(({ p }) => entry(p) || !inOther(chains, p));
  const overTen = chainHeads.filter(({ c }) => c.hops.length - 1 > 10);
  if (overTen.length) add({ id: 'redirect-chain-over-10', severity: 'high', title: 'Redirect chains longer than 10 hops', why: 'Googlebot follows up to 10 redirect hops, so the target of a longer chain is never reached.', tag: `[G] ${DOC.httpErrors}`, evidence: overTen.map(({ p, c }) => ev(p.url, `${c.hops.length - 1} hops, ends at ${c.hops[c.hops.length - 1]}`)) });
  const normalChains = chainHeads.filter(({ c }) => c.hops.length - 1 <= 10);
  if (normalChains.length) add({ id: 'redirect-chain', severity: 'medium', title: 'Redirect chains (two or more hops)', why: 'Googlebot follows up to 10 hops, but every hop is another fetch and another chance to fail, and users wait for each one. Point links and the first redirect straight at the final URL.', tag: `[G] ${DOC.httpErrors}`, evidence: normalChains.map(({ p, c }) => ev(p.url, `${c.hops.length - 1} hops: ${chainStr(c)}`)), verify: 'curl -sIL <url> | grep -i -E "^(HTTP|location)"' });
  if (toError.length) add({ id: 'redirect-to-error', severity: 'medium', title: 'Redirects that end on an error page', why: 'The redirect sends users and crawlers to a 4xx/5xx, so neither reaches content.', tag: `[G] ${DOC.redirects}`, evidence: toError.map(({ p, c }) => ev(p.url, chainStr(c))) });
  if (toBlocked.length) add({ id: 'redirect-to-blocked', severity: 'medium', title: 'Redirects into URLs robots.txt blocks for Googlebot', why: 'Google cannot fetch the redirect target, so nothing at the end of the redirect can be crawled or indexed with its content.', tag: `[G] ${DOC.robotsIntro}`, evidence: toBlocked.map(({ p, c, last }) => ev(p.url, `${chainStr(c)}; ${last.blockedGoogle}`)) });
  const invalidR = fetched.filter((p) => p.redirectInvalid != null);
  if (invalidR.length) add({ id: 'redirect-invalid', severity: 'medium', title: '3xx responses without a usable Location', why: 'A redirect status with no valid target leads nowhere for users or crawlers.', tag: `[G] ${DOC.redirects}`, evidence: invalidR.map((p) => ev(p.url, `${p.status}, Location: ${p.redirectInvalid}`)) });
  const odd = fetched.filter((p) => p.odd3xx && p.scope !== 'external');
  if (odd.length) add({ id: 'unusual-3xx', severity: 'low', title: '3xx statuses Google does not treat as redirects (300, 304, 305, 306)', why: 'Google documents following 301, 302, 303, 307 and 308; 304 means "not modified". With these codes the Location target may never be reached and the URL itself has no content to index.', tag: `[G] ${DOC.httpErrors}`, evidence: odd.map((p) => ev(p.url, `${p.odd3xx.status}${p.odd3xx.location ? `, Location: ${p.odd3xx.location}` : ''}; linked from ${inl(p)} page(s)`)) });
  const reported = new Set([...loopHeads, ...chainHeads].map(({ p }) => p));
  const linkedRedirects = redirecting.filter((p) => p.redirectTo && inl(p) > 0 && p.scope === 'internal' && !reported.has(p));
  if (linkedRedirects.length) add({ id: 'links-to-redirects', severity: 'low', title: 'Internal links that point at a redirect', why: 'Each one costs users and Googlebot an extra hop; linking to the final URL is cleaner. Not an indexing problem on its own.', tag: `[G] ${DOC.redirects}`, evidence: linkedRedirects.sort((a, b) => inl(b) - inl(a)).map((p) => { const c = follow(p.key); return ev(p.url, `${p.redirectStatus} -> ${c.hops[c.hops.length - 1]}; linked from ${inl(p)} page(s)`); }) });
  const variantLinks = internal.length ? fetched.filter((p) => p.scope === 'variant' && inl(p) > 0) : [];
  if (variantLinks.length) add({ id: 'links-to-other-host', severity: 'low', title: 'Internal links to the other protocol or www/non-www host', why: 'Links should use the canonical host; otherwise every click and crawl goes through a redirect (or reaches a duplicate if there is none).', tag: `[G] ${DOC.canonical}`, evidence: variantLinks.map((p) => ev(p.url, `${statusOf(p)}${p.redirectTo ? ` -> ${p.redirectTo}` : ''}; linked from ${inl(p)} page(s)`)) });
  const temp = redirecting.filter((p) => [302, 303, 307].includes(p.redirectStatus) && p.scope === 'internal' && (inl(p) > 0 || p.inSitemap));
  // (302/307 are a weak canonical signal; 301/308 a strong one.)
  if (temp.length) add({ id: 'temporary-redirects', severity: 'info', title: 'Temporary redirects (302/303/307) on linked URLs', why: 'Fine for genuinely temporary moves; for permanent moves use 301/308, which Google treats as a strong canonical signal.', tag: `[G] ${DOC.redirects}`, evidence: temp.map((p) => ev(p.url, `${p.redirectStatus} -> ${p.redirectTo}`)) });
  const refresh = fetched.filter((p) => p.refresh && p.status === 200 && p.scope !== 'external');
  if (refresh.length) add({ id: 'refresh-redirects', severity: 'low', title: 'Meta refresh / Refresh-header redirects', why: 'Google treats an instant meta refresh as a permanent redirect and a delayed one as temporary; a server-side 301/308 is clearer for every crawler.', tag: `[G] ${DOC.redirects}`, evidence: refresh.map((p) => ev(p.url, `${p.refresh.source}, delay ${p.refresh.delay}s -> ${p.refresh.url}`)) });

  // ================= 5. Host, protocol and duplicate-URL variants =================
  for (const v of state.probes.variants) {
    const last = v.hops[v.hops.length - 1];
    if (!last || last.error && v.hops.length === 1) {
      const why = last?.error || 'no response';
      if (/ENOTFOUND|EAI_AGAIN|resolve/i.test(why)) fine.push(`${v.url}: host does not resolve (nothing to consolidate)`);
      else if (/CERT|TLS|SSL/i.test(why)) add({ id: 'variant-tls-error', severity: 'low', title: 'A host variant fails with a TLS certificate error', why: 'People who type that address see a certificate warning instead of the site; it does not affect indexing of the canonical host.', tag: '[INFERENCE]', evidence: [ev(v.url, why)] });
      else fine.push(`${v.url}: not checked (${why})`);
      continue;
    }
    const redirects = v.hops.filter((h) => h.status >= 300 && h.status < 400).length;
    if (v.endsAtScope && redirects >= 1) {
      if (redirects >= 2) add({ id: 'variant-multi-hop', severity: 'low', title: 'A host/protocol variant reaches the site in more than one redirect', why: 'Each hop is an extra request; one 301/308 straight to the canonical URL is best.', tag: `[G] ${DOC.redirects}`, evidence: [ev(v.url, v.hops.map((h) => `${h.url} [${h.status ?? h.error}]`).join(' -> '))] });
      else fine.push(`${v.url} -> ${v.hops[0].status} -> ${v.finalUrl}`);
      continue;
    }
    if (v.finalStatus === 200 && redirects === 0) {
      const vu = new URL(v.url);
      const isHttp = vu.protocol === 'http:' && state.scope.protocol === 'https:' && vu.host === state.scope.host;
      const consolidated = v.canonical && new URL(v.canonical).origin === state.scope.origin;
      const insecureHttps = isHttp && html200.some((p) => p.a.mixed.active.length);
      const sev = consolidated ? 'low' : isHttp ? (insecureHttps ? 'high' : 'medium') : 'high';
      add({ id: 'variant-serves-content', severity: sev, title: isHttp ? 'http:// serves the site without redirecting to https://' : 'The www/non-www twin serves the site without redirecting', why: consolidated ? 'It answers 200 but its canonical points to the main host, so Google can consolidate; a 301/308 is still the clearer signal and protects users.' : isHttp ? `Google prefers the HTTPS version as canonical when both exist, except when there are conflicting signals such as insecure scripts or styles on the HTTPS pages${insecureHttps ? ' - which this site has (see mixed content)' : ''}. Visitors on http:// get an unencrypted copy and links split between two URLs. Redirect http:// to https:// with a 301/308.` : 'The same site answers on two hosts with no redirect and no canonical to one of them - a duplicate site that splits links and signals. Redirect one host to the other with a 301/308.', tag: `[G] ${DOC.canonical}`, evidence: [ev(v.url, `200 without redirect; canonical: ${v.canonical || 'none'}`)], verify: `curl -sI ${v.url}` });
      continue;
    }
    if (v.finalStatus >= 400 || (last.error && redirects > 0)) add({ id: 'variant-error', severity: 'low', title: 'A host/protocol variant ends in an error', why: 'People who type that address get an error instead of the site; it does not affect indexing of the canonical host.', tag: '[INFERENCE]', evidence: [ev(v.url, v.hops.map((h) => `${h.url} [${h.status ?? h.error}]`).join(' -> '))] });
    else if (v.finalUrl && !v.endsAtScope) add({ id: 'variant-elsewhere', severity: 'info', title: 'A host/protocol variant redirects somewhere other than the start host', why: 'Check that this is intended.', tag: '[INFERENCE]', evidence: [ev(v.url, v.hops.map((h) => `${h.url} [${h.status ?? h.error}]`).join(' -> '))] });
  }
  const slashDup = state.probes.slash.filter((s) => !s.fromCrawl && s.status === 200 && (s.title || '') === (s.originalTitle || '') && s.canonical !== s.original && s.originalCanonical !== s.url && !(s.canonical && s.canonical === s.originalCanonical && s.canonical !== s.url));
  if (slashDup.length) add({ id: 'slash-duplicates', severity: 'medium', title: 'Trailing-slash twins both return 200 without consolidation', why: '/a and /a/ are different URLs to Google; if both answer 200 with no redirect or shared canonical, every page exists twice.', tag: `[G] ${DOC.canonical}`, evidence: slashDup.map((s) => ev(s.url, `200 (canonical: ${s.canonical || 'none'}) - twin of ${s.original}`)), verify: 'curl -sI both forms.' });
  for (const s of state.probes.slash) if (!slashDup.includes(s)) fine.push(`trailing-slash twin ${s.url}: ${s.status ?? s.error}${s.location ? ` -> ${s.location}` : ''}${s.status === 200 ? ` (canonical ${s.canonical})` : ''}`);
  // duplicate URL spellings found in the crawl itself
  const dupKey = (k) => { const u = new URL(k); let path = u.pathname.toLowerCase().replace(/\/(index|default)\.(html?|php|aspx?)$/, '/').replace(/\/+$/, '') || '/'; const q = [...u.searchParams].filter(([n]) => !/^(utm_|gclid|fbclid|ref$|tracking|sessionid|sid$|phpsessid|jsessionid)/i.test(n)); return `${u.host}${path}?${q.map(([a, b]) => `${a}=${b}`).sort().join('&')}`; };
  // A spelling variant is "the same page" only if it also serves the same page: equal title and first H1.
  // (/dir/, /dir/index.htm and /dir/default.htm can be three different pages.)
  const fingerprint = (p) => `${(p.a.title || '').toLowerCase().replace(/\s+/g, ' ').trim()}|${(p.a.h1[0] || '').toLowerCase().replace(/\s+/g, ' ').trim()}`;
  const groups = new Map();
  for (const p of html200.filter((x) => indexable(x))) { const k = `${dupKey(p.key)}#${fingerprint(p)}`; groups.set(k, [...(groups.get(k) || []), p]); }
  const urlDups = [...groups.values()].filter((g) => g.length > 1 && fingerprint(g[0]) !== '|').filter((g) => new Set(g.map((p) => effCanon(p).key || p.key)).size > 1);
  if (urlDups.length) add({ id: 'duplicate-urls', severity: 'medium', title: 'The same page answers at several URL spellings without a shared canonical', why: 'Case, trailing-slash, index-file and tracking-parameter variants are separate URLs to Google; without a redirect or a common canonical they compete as duplicates.', tag: `[G] ${DOC.canonical}`, evidence: urlDups.map((g) => ev(g[0].url, g.map((p) => `${p.key} (canonical: ${effCanon(p).key || 'none'})`).join('  |  '))) });

  // ================= 6. Soft 404 =================
  for (const s of state.probes.soft404) {
    const hopStr = s.hops.map((h) => `${h.url} [${h.status ?? h.error}]`).join(' -> ');
    if (s.finalStatus === 200 && !s.redirected) {
      const saysMissing = /not\s*found|\b404\b|doesn.?t exist|does not exist|no longer (available|exists)|cannot be found|can.?t be found|page (is )?missing/i.test(`${s.title || ''} ${s.text || ''}`);
      add({ id: 'soft-404', severity: saysMissing ? 'medium' : 'high', title: saysMissing ? 'Missing pages say "not found" but return 200 (soft 404)' : 'Made-up URLs return a normal page with 200 (soft 404)', why: saysMissing ? 'Google calls a "page does not exist" response with a 200 status a soft 404: it stays out of the index but still costs crawling and hides real errors. Return 404 or 410.' : 'Any made-up URL answers 200 with a normal-looking page, so typos, dead links and spam links become duplicate pages Google has to crawl and classify. Return 404 or 410 for unknown URLs.', tag: `[G] ${DOC.soft404}`, evidence: [ev(s.url, `200; title "${short(s.title, 60)}", ${s.words} words`)], verify: `curl -sI ${s.url}` });
    } else if (s.finalStatus === 200 && s.redirected) {
      add({ id: 'soft-404-redirect', severity: 'low', title: 'Made-up URLs redirect to a real page', why: 'Redirecting missing URLs (often to the home page) instead of returning 404 "might be treated as a soft 404" by Google, and it confuses visitors who followed a broken link.', tag: `[G] ${DOC.siteMove}`, evidence: [ev(s.url, hopStr)] });
    } else if (s.finalStatus === 404 || s.finalStatus === 410) fine.push(`soft-404 probe ${s.url}: ${s.redirected ? `${hopStr}` : s.finalStatus}`);
    else fine.push(`soft-404 probe ${s.url}: ${hopStr}`);
  }

  // ================= 7. Indexability conflicts (sitemap, canonical, noindex) =================
  const smPages = pages.filter((p) => p.inSitemap);
  const smFetched = smPages.filter((p) => p.fetched);
  const smNoindex = smFetched.filter((p) => p.a && p.a.robots.noindex);
  const smNoindexConfirmed = smNoindex.filter(noindexConfirmed);
  const smNoindexFlaky = smNoindex.filter((p) => !noindexConfirmed(p));
  if (smNoindexConfirmed.length) add({ id: 'sitemap-noindex', severity: 'high', title: 'Sitemap lists URLs that are noindexed (verified per URL)', why: 'A sitemap asks Google to index its URLs; noindex says the opposite. Either the page should be indexed (remove noindex) or it should leave the sitemap.', tag: `[G] ${DOC.sitemaps}`, evidence: smNoindexConfirmed.map((p) => ev(p.url, `${p.a.robots.noindexVia.join(' | ')}${p.recheck?.length ? ' (confirmed on re-fetch)' : ''}`)), verify: 'curl -sI <url> | grep -i x-robots-tag; view-source and search for noindex; URL Inspection.' });
  if (smNoindexFlaky.length) add({ id: 'noindex-flapping', severity: 'medium', title: 'noindex present on one fetch and absent on another', why: 'An inconsistent noindex (often a cache or A/B layer) can drop pages unpredictably.', tag: `[G] ${DOC.robotsMeta}`, evidence: smNoindexFlaky.map((p) => ev(p.url, `first fetch: ${p.a.robots.noindexVia.join(' | ')}; re-fetch: ${p.recheck.map((r) => (r.noindex ? 'noindex' : 'indexable')).join(', ')}`)) });
  const smInt = smFetched.filter((p) => p.scope !== 'external');
  const sm3 = smInt.filter((p) => p.redirectTo);
  if (sm3.length) add({ id: 'sitemap-redirects', severity: 'medium', title: 'Sitemap lists URLs that redirect', why: 'A sitemap should list final, canonical URLs; redirects are a mixed signal and cost a fetch each.', tag: `[G] ${DOC.sitemaps}`, evidence: sm3.map((p) => ev(p.url, `${p.redirectStatus} -> ${follow(p.key).hops.slice(-1)[0]}`)) });
  const sm4 = smInt.filter((p) => allBad(p, (f) => f.status >= 400 && f.status < 500));
  if (sm4.length) add({ id: 'sitemap-4xx', severity: 'medium', title: 'Sitemap lists URLs that return 4xx', why: 'Google is asked to crawl pages that do not exist (or are refused); remove them or fix them.', tag: `[G] ${DOC.sitemaps}`, evidence: sm4.map((p) => ev(p.url, `${p.fetches.map((f) => f.status).join(', ')}`)) });
  const sm5 = smInt.filter((p) => allBad(p, (f) => f.status >= 500 || f.error));
  if (sm5.length) add({ id: 'sitemap-5xx', severity: 'high', title: 'Sitemap URLs that fail with 5xx/timeouts on every fetch', why: 'Listed pages that keep failing cannot be indexed, and the errors slow crawling.', tag: `[G] ${DOC.httpErrors}`, evidence: sm5.map((p) => ev(p.url, p.fetches.map((f) => f.status ?? f.error).join(', '))) });
  const smCanon = smFetched.filter((p) => p.status === 200 && p.a && !p.a.robots.noindex && effCanon(p).key && effCanon(p).key !== p.key);
  if (smCanon.length) add({ id: 'sitemap-non-canonical', severity: 'medium', title: 'Sitemap lists URLs whose canonical points elsewhere', why: 'The sitemap says "index this URL" while rel=canonical says "index that one"; Google calls sitemaps a weak canonical signal and canonicals strong, so list the canonical URL instead.', tag: `[G] ${DOC.canonical}`, evidence: smCanon.map((p) => ev(p.url, `canonical -> ${effCanon(p).key}`)) });
  const smBlocked = smPages.filter((p) => p.blockedGoogle && p.scope !== 'external');
  if (smBlocked.length) add({ id: 'sitemap-blocked', severity: 'high', title: 'Sitemap lists URLs that robots.txt blocks for Googlebot', why: 'Google is told to crawl URLs it is forbidden to fetch; they cannot be crawled (and may be indexed without content if linked).', tag: `[G] ${DOC.robotsIntro}`, evidence: smBlocked.map((p) => ev(p.url, p.blockedGoogle)), verify: 'Search Console robots.txt report / URL Inspection.' });
  if (smFetched.length && !smNoindex.length && !smCanon.length) fine.push(`${smFetched.length} sitemap URLs fetched: none noindexed, none canonicalised elsewhere`);

  // canonical checks on every fetched HTML page
  const canonBody = []; const canonConflict = []; const canonTo = { blocked: [], error: [], redirect: [], noindex: [], chain: [], external: [] }; const canonRel = []; const noidxCanon = [];
  for (const p of html200) {
    const c = effCanon(p);
    const body = p.a.canonicals.filter((x) => x.source === 'html' && !x.inHead);
    if (body.length && !c.honored.length) canonBody.push(p);
    if (c.conflict) canonConflict.push({ p, c });
    if (p.a.canonicals.some((x) => x.relative)) canonRel.push(p);
    if (!c.key || c.key === p.key) continue;
    if (p.a.robots.noindex) noidxCanon.push({ p, c });
    const t = P.get(c.key);
    if (!t) continue;
    if (t.scope === 'external' && !t.fetched) { canonTo.external.push({ p, c }); continue; }
    if (t.blockedGoogle) { canonTo.blocked.push({ p, c, t }); continue; }
    if (!t.fetched) continue;
    if (t.redirectTo) canonTo.redirect.push({ p, c, t });
    else if (allBad(t, (f) => f.error || f.status >= 400)) canonTo.error.push({ p, c, t });
    else if (t.a && noindexConfirmed(t)) canonTo.noindex.push({ p, c, t });
    else if (t.a && effCanon(t).key && effCanon(t).key !== t.key) canonTo.chain.push({ p, c, t });
  }
  if (canonTo.error.length) add({ id: 'canonical-to-error', severity: 'high', title: 'Canonical points to a URL that returns 4xx/5xx', why: 'The page nominates a broken URL as the one to index, so Google is likely to ignore the canonical (or pick a URL you did not choose).', tag: `[G] ${DOC.canonical}`, evidence: canonTo.error.map(({ p, c, t }) => ev(p.url, `canonical ${c.key} -> ${t.fetches.map((f) => f.status ?? f.error).join(', ')}`)) });
  if (canonTo.noindex.length) add({ id: 'canonical-to-noindex', severity: 'high', title: 'Canonical points to a noindexed URL', why: 'Contradictory: "index that URL instead" plus "do not index that URL". Neither page may end up indexed as intended.', tag: `[G] ${DOC.canonical}`, evidence: canonTo.noindex.map(({ p, c, t }) => ev(p.url, `canonical ${c.key} carries ${t.a.robots.noindexVia.join(' | ')}`)) });
  if (canonTo.blocked.length) add({ id: 'canonical-to-blocked', severity: 'high', title: 'Canonical points to a URL robots.txt blocks for Googlebot', why: 'Google cannot fetch the nominated URL to confirm it, so the canonical is unlikely to be followed.', tag: `[G] ${DOC.canonical}`, evidence: canonTo.blocked.map(({ p, c, t }) => ev(p.url, `canonical ${c.key}: ${t.blockedGoogle}`)) });
  if (canonTo.redirect.length) add({ id: 'canonical-to-redirect', severity: 'medium', title: 'Canonical points to a URL that redirects', why: 'A canonical should name the final URL; pointing at a redirect is a mixed signal.', tag: `[G] ${DOC.canonical}`, evidence: canonTo.redirect.map(({ p, c, t }) => ev(p.url, `canonical ${c.key} -> ${t.redirectStatus} -> ${follow(t.key).hops.slice(-1)[0]}`)) });
  if (canonTo.chain.length) add({ id: 'canonical-chain', severity: 'medium', title: 'Canonical chains (A -> B, and B -> C)', why: 'Google may not follow a chain of canonicals; point every page straight at the final canonical.', tag: `[G] ${DOC.canonical}`, evidence: canonTo.chain.map(({ p, c, t }) => ev(p.url, `${p.key} -> ${c.key} -> ${effCanon(t).key}`)) });
  if (canonConflict.length) add({ id: 'canonical-conflict', severity: 'medium', title: 'Several different canonicals on one page', why: 'Two canonical tags (or an HTML tag and an HTTP Link header) naming different URLs is the "multiple declarations" mistake; Google is likely to ignore all of them.', tag: `[G] ${DOC.canonicalMistakes}`, evidence: canonConflict.map(({ p, c }) => ev(p.url, c.honored.map((x) => `${x.source}: ${x.key}`).join(' | '))) });
  if (canonBody.length) add({ id: 'canonical-outside-head', severity: 'medium', title: 'rel=canonical only outside <head>', why: 'Google accepts rel=canonical only in the <head>; one in <body> (or pushed there by invalid head markup) is ignored.', tag: `[G] ${DOC.canonicalMistakes}`, evidence: canonBody.map((p) => ev(p.url, `canonical in body: ${p.a.canonicals.filter((x) => !x.inHead).map((x) => x.key).join(', ')}${p.a.headBreak ? `; <head> ended early at ${p.a.headBreak.by}` : ''}`)) });
  const displaced = html200.filter((p) => p.a.displaced.length && !canonBody.includes(p));
  if (displaced.length) add({ id: 'head-broken', severity: 'medium', title: '<head> ends early, pushing canonical/hreflang tags into <body>', why: 'An element that is not allowed in <head> (a div, img, iframe or stray text) closes it, so rel=canonical and hreflang links written after it end up in <body>, where Google ignores them (a robots meta tag there is still honoured).', tag: `[G] ${DOC.canonical} ; ${DOC.hreflang}`, evidence: displaced.map((p) => ev(p.url, `${p.a.headBreak.by} ended <head>; displaced: ${p.a.displaced.join(', ')}`)), verify: 'View source: find the first non-head element inside <head>; the rendered DOM (DevTools Elements) shows where the tags ended up.' });
  if (canonTo.external.length) add({ id: 'canonical-cross-domain', severity: 'info', title: 'Canonicals pointing to another host', why: 'Legitimate for syndicated content; otherwise it hands this page\'s indexing to the other site. Confirm each is intended.', tag: `[G] ${DOC.canonical}`, evidence: canonTo.external.map(({ p, c }) => ev(p.url, `canonical -> ${c.key}`)) });
  if (noidxCanon.length) add({ id: 'noindex-plus-canonical', severity: 'low', title: 'noindex combined with a canonical to another URL', why: 'Mixed signals; Google recommends rel=canonical (not noindex) to pick a canonical within a site, because noindex removes the page outright.', tag: `[G] ${DOC.canonical}`, evidence: noidxCanon.map(({ p, c }) => ev(p.url, `${p.a.robots.noindexVia.join(' | ')}; canonical -> ${c.key}`)) });
  if (canonRel.length) add({ id: 'canonical-relative', severity: 'info', title: 'Relative canonical URLs', why: 'Allowed, but Google recommends absolute URLs; relative ones break when the page is served under another host or path.', tag: `[G] ${DOC.canonical}`, evidence: canonRel.map((p) => ev(p.url, p.a.canonicals.filter((x) => x.relative).map((x) => `"${x.href}"`).join(', '))) });
  const missingCanon = html200.filter((p) => indexable(p) && !p.a.canonicals.length);
  if (html200.length && missingCanon.length === 0 && !canonConflict.length) fine.push(`every indexable HTML page declares a canonical (${html200.filter((p) => selfCanon(p)).length} self-referencing)`);

  const noidx = html200.filter((p) => p.a.robots.noindex && !p.inSitemap && p.key !== state.homeKey);
  if (noidx.length) add({ id: 'noindex-pages', severity: 'info', title: 'Noindexed pages (not in the sitemap)', why: 'Usually deliberate. Listed so you can confirm none of them should rank; the most-linked come first.', tag: `[G] ${DOC.robotsMeta}`, evidence: noidx.sort((a, b) => inl(b) - inl(a)).map((p) => ev(p.url, `${p.a.robots.noindexVia.join(' | ')}; linked from ${inl(p)} page(s)`)) });
  const nofollowPages = html200.filter((p) => p.a.robots.nofollow);
  if (nofollowPages.length) add({ id: 'meta-nofollow', severity: 'info', title: 'Pages with a page-level nofollow', why: 'Google may not use the links on these pages for discovery or ranking signals.', tag: `[G] ${DOC.robotsMeta}`, evidence: nofollowPages.map((p) => ev(p.url, p.a.robots.nofollowVia.join(' | '))) });
  const linkedBlocked = pages.filter((p) => p.blockedGoogle && inl(p) > 0 && p.scope === 'internal' && !p.inSitemap);
  if (linkedBlocked.length) add({ id: 'links-to-blocked', severity: 'info', title: 'Internal links to URLs robots.txt blocks for Googlebot', why: 'Usually deliberate (carts, search, admin). A blocked URL can still be indexed without its content if it is linked; use noindex (and allow crawling) to keep a page out of results.', tag: `[G] ${DOC.robotsIntro}`, evidence: linkedBlocked.sort((a, b) => inl(b) - inl(a)).map((p) => ev(p.url, `${p.blockedGoogle}; linked from ${inl(p)} page(s)`)) });

  // ================= 8. Crawl graph =================
  // Depth: shortest click path from the home page over links (redirects/refresh cost no click).
  const depth = new Map();
  if (home) {
    const dq = [[home.key, 0]];
    depth.set(home.key, 0);
    while (dq.length) {
      const [k, d] = dq.shift();
      const p = P.get(k);
      if (!p) continue;
      const nexts = [];
      if (p.redirectTo) nexts.push([p.redirectTo, d]);
      if (p.refresh) nexts.push([p.refresh.url, d]);
      if (p.outlinks && p.scope === 'internal') for (const l of p.outlinks) nexts.push([l.key, d + 1]);
      for (const [nk, nd] of nexts) if (!depth.has(nk) || depth.get(nk) > nd) { depth.set(nk, nd); dq.push([nk, nd]); }
    }
  }
  for (const p of pages) p.clickDepth = depth.has(p.key) ? depth.get(p.key) : null;
  const depthDist = new Map();
  for (const p of html200) { const d = p.clickDepth ?? 'not reached'; depthDist.set(d, (depthDist.get(d) || 0) + 1); }
  const deep = html200.filter((p) => canonicalIndexable(p) && p.clickDepth != null && p.clickDepth >= 5);
  if (deep.length) add({ id: 'deep-pages', severity: 'low', title: 'Indexable pages five or more clicks from the home page', why: 'Pages buried deep get crawled less often and receive less internal link value. There is no Google threshold; this is a prompt to link important pages from hubs.', tag: `[INFERENCE] (from [G] ${DOC.links})`, evidence: deep.sort((a, b) => b.clickDepth - a.clickDepth).map((p) => ev(p.url, `depth ${p.clickDepth}`)) });
  const scoped = state.opts.scope && state.opts.scope.length;
  const smIndexable = html200.filter((p) => p.inSitemap && canonicalIndexable(p));
  if (state.sitemap) {
    if (!state.linkCrawlComplete || scoped) {
      add({ id: 'orphans-not-judged', severity: 'info', title: 'Orphan pages: not judged', why: scoped ? 'A --scope crawl does not see links from outside the scope.' : `The link crawl stopped at the page budget (${state.unfetchedQueued ?? 0} discovered URLs were never fetched), so "nothing links here" cannot be claimed. Raise --limit to cover the site.`, tag: '[INFERENCE]', evidence: [] });
    } else if (jsShare > 0.3) {
      add({ id: 'orphans-not-judged', severity: 'info', title: 'Orphan pages: not judged', why: `${Math.round(jsShare * 100)}% of pages look JavaScript-rendered; links added by JavaScript are invisible here, so orphan claims would be unreliable.`, tag: '[INFERENCE]', evidence: [] });
    } else {
      const orphans = smIndexable.filter((p) => p.clickDepth == null);
      if (orphans.length) add({ id: 'orphan-pages', severity: 'medium', title: 'Sitemap pages no crawled page links to (orphans)', why: 'Google wants every page you care about linked from at least one other page; a page known only from the sitemap gets no internal link signals. The link crawl from the home page finished, so these were not reachable through raw-HTML links.', tag: `[G] ${DOC.links}`, evidence: orphans.map((p) => ev(p.url, `in sitemap, 0 links from the ${html200.length} crawled pages`)), verify: 'Check the rendered navigation (JS menus) and site search; confirm in a browser that no page links here.' });
      else fine.push(`orphans: every indexable sitemap page fetched (${smIndexable.length}) is reachable by links from the home page`);
    }
    const smKnown = state.sitemap.urls.size;
    if (state.sitemap.complete && smKnown) {
      const notListed = html200.filter((p) => canonicalIndexable(p) && !p.inSitemap && p.clickDepth != null);
      if (notListed.length) add({ id: 'not-in-sitemap', severity: 'low', title: 'Indexable pages found by links but missing from the sitemap', why: 'A sitemap should list every canonical, indexable URL you want in Search; missing ones rely on link discovery alone.', tag: `[G] ${DOC.sitemaps}`, evidence: notListed.sort((a, b) => a.clickDepth - b.clickDepth).map((p) => ev(p.url, `depth ${p.clickDepth}, linked from ${inl(p)} page(s)`)) });
    }
  }
  const utm = html200.flatMap((p) => (p.outlinks || []).filter((l) => l.utm).map((l) => ({ p, l })));
  if (utm.length) add({ id: 'tracking-params-in-links', severity: 'low', title: 'Internal links carrying tracking or session parameters', why: 'Each parameter variant is a separate URL to crawl and a duplicate to consolidate; analytics parameters belong on external campaign links only.', tag: `[G] ${DOC.canonical}`, evidence: utm.slice(0, 50).map(({ p, l }) => ev(p.url, `links to ${l.key}`)) });
  const nofollowInternal = html200.flatMap((p) => (p.outlinks || []).filter((l) => l.nofollow).map((l) => ({ p, l })));
  if (nofollowInternal.length) add({ id: 'internal-nofollow', severity: 'info', title: 'rel="nofollow" on internal links', why: 'Nofollow on your own links does not "sculpt" PageRank; it only makes Google less likely to use those links. Usually unnecessary.', tag: `[G] ${DOC.links}`, evidence: nofollowInternal.slice(0, 30).map(({ p, l }) => ev(p.url, `-> ${l.key}`)) });
  const jsLinks = html200.reduce((n, p) => n + p.a.anchorsWithoutHref, 0);
  if (jsLinks) add({ id: 'anchors-without-href', severity: 'info', title: '<a> elements without an href', why: 'Google reliably follows only <a href> links; "links" driven by click handlers are not crawled. Fine for buttons, a problem for navigation.', tag: `[G] ${DOC.links}`, evidence: html200.filter((p) => p.a.anchorsWithoutHref).sort((a, b) => b.a.anchorsWithoutHref - a.a.anchorsWithoutHref).map((p) => ev(p.url, `${p.a.anchorsWithoutHref} <a> without href`)) });

  // ================= 9. Titles, descriptions, headings, content =================
  const ci = html200.filter(canonicalIndexable);
  // One page reachable at several URLs (spelling variants, or identical main content) is reported once,
  // under duplicate-urls / duplicate-content, not again as duplicate titles, descriptions and H1s.
  const spelling = new Map();
  urlDups.forEach((g, i) => g.forEach((p) => spelling.set(p.key, i)));
  const spellingOnly = (ps) => ps.every((p) => spelling.has(p.key) && spelling.get(p.key) === spelling.get(ps[0].key));
  const contentGroups = new Map();
  for (const p of ci) if (p.mainWords >= 20 && !p.jsDependent) { const h = createHash('md5').update(p.mainText).digest('hex'); contentGroups.set(h, [...(contentGroups.get(h) || []), p]); }
  const exactDup = [...contentGroups.values()].filter((g) => g.length > 1 && !spellingOnly(g));
  const pageId = new Map();
  let gid = 0;
  for (const g of [...urlDups, ...exactDup]) { const known = g.map((p) => pageId.get(p.key)).find((x) => x != null); const id = known ?? gid++; for (const p of g) pageId.set(p.key, id); }
  // Group by value, then keep one representative per "same page" set, so a page served at five spellings counts once.
  const dupGroups = (vals) => {
    const m = new Map();
    for (const [p, v] of vals) if (v) { const k = v.toLowerCase().replace(/\s+/g, ' ').trim(); m.set(k, [...(m.get(k) || []), p]); }
    const out = [];
    for (const [k, ps] of m) {
      const seen = new Set();
      const reps = ps.filter((p) => { const id = pageId.has(p.key) ? `g${pageId.get(p.key)}` : p.key; if (seen.has(id)) return false; seen.add(id); return true; });
      if (reps.length > 1) out.push([k, reps]);
    }
    return out;
  };
  // A paginated series (page 2, 3... of one listing) sharing a title is a smaller issue than two different pages sharing one.
  const paginated = (p) => /([?&](page|p|pg|paged)=\d+|\/page[-/]?\d+(\.[a-z]+)?\/?$|[-_]page[-_]?\d+)/i.test(p.key);
  const dtAll = dupGroups(ci.map((p) => [p, p.a.title]));
  const isSeries = ([, ps]) => ps.some(paginated) && ps.filter((p) => !paginated(p)).length <= 1;
  const dt = dtAll.filter((g) => !isSeries(g));
  const dtSeries = dtAll.filter(isSeries);
  if (dt.length) add({ id: 'duplicate-titles', severity: 'medium', title: 'Duplicate titles across indexable, self-canonical pages', why: 'Google asks for a distinct, descriptive <title> on each page and to avoid repeated or boilerplate titles; identical titles make pages hard to tell apart in results and hint at duplicate pages.', tag: `[G] ${DOC.titles}`, evidence: dt.map(([t, ps]) => ev(ps[0].url, `${ps.length} pages share "${short(t, 70)}": ${ps.slice(0, 4).map((p) => p.key).join(', ')}${ps.length > 4 ? ' ...' : ''}`)), count: dt.reduce((n, [, ps]) => n + ps.length, 0) });
  if (dtSeries.length) add({ id: 'duplicate-titles-paginated', severity: 'low', title: 'Paginated pages that repeat the first page\'s title', why: 'Page 2, 3... of a listing are separate URLs; adding the page number to the title keeps them distinguishable. A small fix, not a duplicate-content problem.', tag: `[G] ${DOC.titles}`, evidence: dtSeries.map(([t, ps]) => ev(ps[0].url, `${ps.length} pages share "${short(t, 70)}": ${ps.slice(0, 4).map((p) => p.key).join(', ')}`)), count: dtSeries.reduce((n, [, ps]) => n + ps.length, 0) });
  const dd = dupGroups(ci.map((p) => [p, p.a.descriptions[0]]));
  if (dd.length) add({ id: 'duplicate-descriptions', severity: 'low', title: 'Duplicate meta descriptions', why: 'Google often writes its own snippet, but a unique description is the one you control; duplicates are usually a template default.', tag: `[G] ${DOC.snippets}`, evidence: dd.map(([t, ps]) => ev(ps[0].url, `${ps.length} pages share "${short(t, 70)}": ${ps.slice(0, 4).map((p) => p.key).join(', ')}`)), count: dd.reduce((n, [, ps]) => n + ps.length, 0) });
  const titleSets = new Set(dtAll.map(([, ps]) => ps.map((p) => p.key).sort().join('|')));
  const dh = dupGroups(ci.map((p) => [p, p.a.h1[0]])).filter(([, ps]) => !titleSets.has(ps.map((p) => p.key).sort().join('|')));
  if (dh.length) add({ id: 'duplicate-h1', severity: 'low', title: 'Duplicate H1 headings', why: 'Pages with the same main heading are hard to tell apart for users and may be duplicates.', tag: '[INFERENCE]', evidence: dh.map(([t, ps]) => ev(ps[0].url, `${ps.length} pages share "${short(t, 70)}": ${ps.slice(0, 4).map((p) => p.key).join(', ')}`)), count: dh.reduce((n, [, ps]) => n + ps.length, 0) });
  // templated descriptions (near-identical but not equal)
  const wordset = (s) => new Set(String(s).toLowerCase().match(/[\p{L}\p{N}]+/gu) || []);
  const jacc = (a, b) => { let i = 0; for (const w of a) if (b.has(w)) i++; return i / (a.size + b.size - i || 1); };
  const descItems = ci.filter((p) => (p.a.descriptions[0] || '').length > 40).map((p) => ({ p, w: wordset(p.a.descriptions[0]), d: p.a.descriptions[0] }));
  const parent = descItems.map((_, i) => i);
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  if (descItems.length <= 1500) for (let i = 0; i < descItems.length; i++) for (let j = i + 1; j < descItems.length; j++) if (descItems[i].d !== descItems[j].d && jacc(descItems[i].w, descItems[j].w) >= 0.8) parent[find(i)] = find(j);
  const tg = new Map();
  descItems.forEach((it, i) => tg.set(find(i), [...(tg.get(find(i)) || []), it.p]));
  const templ = [...tg.values()].filter((g) => g.length > 2 && new Set(g.map((p) => p.a.descriptions[0])).size > 1);
  if (templ.length) add({ id: 'templated-descriptions', severity: 'low', title: 'Templated meta descriptions (one sentence with a word swapped)', why: 'Near-identical descriptions read as boilerplate; Google is then more likely to rewrite the snippet. Fine when the swapped word is the real difference, weak otherwise.', tag: `[G] ${DOC.snippets}`, evidence: templ.map((g) => ev(g[0].url, `${g.length} pages, e.g. "${short(g[0].a.descriptions[0], 80)}"`)), count: templ.reduce((n, g) => n + g.length, 0) });
  const noTitle = html200.filter((p) => indexable(p) && !p.a.title);
  if (noTitle.length) add({ id: 'missing-title', severity: 'low', title: 'Indexable pages without a <title>', why: 'Google asks for a descriptive <title> on every page; without one it builds the title link from other text on the page (headings, anchors), which you do not control.', tag: `[G] ${DOC.titles}`, evidence: noTitle.map((p) => ev(p.url, p.a.titleCount ? 'empty <title>' : 'no <title> in <head>')) });
  const multiTitle = html200.filter((p) => p.a.titleCount > 1);
  if (multiTitle.length) add({ id: 'multiple-titles', severity: 'low', title: 'More than one <title> in <head>', why: 'Ambiguous; browsers use the first, and a template bug usually sits behind it.', tag: `[G] ${DOC.titles}`, evidence: multiTitle.map((p) => ev(p.url, `${p.a.titleCount} title elements`)) });
  const multiDesc = html200.filter((p) => p.a.descriptions.length > 1);
  if (multiDesc.length) add({ id: 'multiple-descriptions', severity: 'low', title: 'More than one meta description', why: 'Usually a template bug; which one is used is undefined.', tag: '[INFERENCE]', evidence: multiDesc.map((p) => ev(p.url, `${p.a.descriptions.length} description tags`)) });
  const noDesc = ci.filter((p) => !p.a.descriptions.length || !p.a.descriptions[0]);
  if (noDesc.length) add({ id: 'missing-description', severity: 'info', title: 'Pages without a meta description', why: 'Optional: Google builds snippets from page content anyway. Worth writing for important pages.', tag: `[G] ${DOC.snippets}`, evidence: noDesc.map((p) => ev(p.url, 'no meta description')) });
  const noH1 = ci.filter((p) => p.a.h1Count === 0 && !p.jsDependent);
  if (noH1.length) add({ id: 'missing-h1', severity: 'low', title: 'Indexable pages without an <h1>', why: 'Not a Google requirement, but a visible main heading helps users and is one of the sources Google uses for title links.', tag: `[G] ${DOC.titles}`, evidence: noH1.map((p) => ev(p.url, 'no <h1> in raw HTML')) });
  const multiH1 = ci.filter((p) => p.a.h1Count > 1);
  if (multiH1.length) add({ id: 'multiple-h1', severity: 'info', title: 'Pages with more than one <h1>', why: 'Allowed in HTML and not a Google problem; listed only so it is a deliberate choice.', tag: '[INFERENCE]', evidence: multiH1.map((p) => ev(p.url, `${p.a.h1Count} h1: ${p.a.h1.slice(0, 3).map((h) => `"${short(h, 30)}"`).join(', ')}`)) });
  const tl = ci.map((p) => (p.a.title || '').length).filter(Boolean);
  const tOut = ci.filter((p) => p.a.title && (p.a.title.length > 70 || p.a.title.length < 10)).sort((a, b) => b.a.title.length - a.a.title.length);
  if (tl.length) add({ id: 'title-lengths', severity: 'info', title: 'Title length distribution (information, not a ranking factor)', why: 'Long titles get truncated in results and very short ones are often rewritten; length itself is not ranked. Outliers listed for review.', tag: `[G] ${DOC.titles}`, evidence: tOut.map((p) => ev(p.url, `${p.a.title.length} chars: "${short(p.a.title, 80)}"`)), count: tOut.length, note: `${tl.length} titles: min ${Math.min(...tl)}, median ${quantile(tl, 0.5)}, max ${Math.max(...tl)} characters; over 70: ${tl.filter((n) => n > 70).length}, under 20: ${tl.filter((n) => n < 20).length}` });
  const dl = ci.map((p) => (p.a.descriptions[0] || '').length).filter(Boolean);
  const dOut = ci.filter((p) => p.a.descriptions[0] && (p.a.descriptions[0].length > 160 || p.a.descriptions[0].length < 50)).sort((a, b) => b.a.descriptions[0].length - a.a.descriptions[0].length);
  if (dl.length) add({ id: 'description-lengths', severity: 'info', title: 'Meta description length distribution (information only)', why: 'Descriptions are trimmed to fit the device and Google often writes its own snippet; length is not a ranking factor. Outliers listed for review.', tag: `[G] ${DOC.snippets}`, evidence: dOut.map((p) => ev(p.url, `${p.a.descriptions[0].length} chars`)), count: dOut.length, note: `${dl.length} descriptions: min ${Math.min(...dl)}, median ${quantile(dl, 0.5)}, max ${Math.max(...dl)} characters` });

  // thin pages and JS dependence
  const shells = html200.filter((p) => indexable(p) && (p.a.appShell || p.a.noscriptJs) && p.a.visibleWords < 150);
  if (shells.length) add({ id: 'js-required', severity: 'medium', title: 'Main content needs JavaScript (empty app shell in the raw HTML)', why: 'Google renders JavaScript, but rendering can lag, and crawlers that do not run JavaScript (most AI answer-engine crawlers) see an empty page. Server-render the main content.', tag: `[G] ${DOC.js} ; [CLAIM] for AI crawlers`, evidence: shells.map((p) => ev(p.url, `${p.a.visibleWords} words in raw HTML; ${p.a.appShell ? 'empty #root/#app container' : '"enable JavaScript" notice'}; ${p.a.scripts.external} external scripts`)), verify: 'Compare view-source with the rendered DOM; URL Inspection > View crawled page > HTML.' });
  const jsHeavy = html200.filter((p) => indexable(p) && p.jsDependent && !shells.includes(p));
  if (jsHeavy.length) add({ id: 'js-probable', severity: 'info', title: 'Little raw-HTML text but heavy scripts (content probably injected by JavaScript)', why: 'These pages are not judged thin here, because their text likely arrives through JavaScript; check the rendered page.', tag: `[G] ${DOC.js}`, evidence: jsHeavy.map((p) => ev(p.url, `${p.a.visibleWords} words, ${(p.a.scripts.inlineBytes / 1024).toFixed(0)} KB inline script, ${p.a.scripts.external} external scripts`)) });
  // Utility pages (contact, login, legal, cart...) are short by nature; length says nothing about them.
  const utility = (p) => /\/(contact|contact-us|login|log-in|signin|sign-in|signup|sign-up|register|account|cart|basket|checkout|privacy|privacy-policy|terms|terms-of-service|tos|legal|cookies?|cookie-policy|imprint|impressum|disclaimer|search|sitemap|404)(\/|$|\.|-|\?)/i.test(new URL(p.key).pathname + new URL(p.key).search);
  const thin = ci.filter((p) => !p.jsDependent && p.mainWords < 50 && p.key !== state.homeKey && !utility(p));
  if (thin.length) add({ id: 'thin-pages', severity: 'low', title: 'Pages with very little unique text in the raw HTML', why: 'Length alone is not a ranking factor; a short page that fully answers its query is fine. Listed because pages with almost no unique text (after removing text repeated across the template) are often stubs, placeholders or near-duplicates. Judge each one by whether it satisfies its intent.', tag: `[G] ${DOC.starter} ; heuristic [INFERENCE]`, evidence: thin.sort((a, b) => a.mainWords - b.mainWords).map((p) => ev(p.url, `${p.mainWords} unique words (${p.a.visibleWords} total visible)`)), note: 'threshold: under 50 words that do not repeat across 40% of crawled pages - a review filter, not a rule' });
  // duplicate main content (groups computed above)
  if (exactDup.length) add({ id: 'duplicate-content', severity: 'medium', title: 'Pages with identical main content and no shared canonical', why: 'Google picks one URL per duplicate cluster; without a canonical or redirect you do not control which, and signals split.', tag: `[G] ${DOC.canonical}`, evidence: exactDup.map((g) => ev(g[0].url, `${g.length} pages: ${g.slice(0, 4).map((p) => p.key).join(', ')} (${g[0].mainWords} words)`)), count: exactDup.reduce((n, g) => n + g.length, 0) });
  const shingles = (t) => { const w = t.split(' '); const s = new Set(); for (let i = 0; i + 4 < w.length; i++) s.add(createHash('md5').update(w.slice(i, i + 5).join(' ')).digest().readUInt32LE(0)); return s; };
  const nd = ci.filter((p) => p.mainWords >= 80 && !p.jsDependent && !exactDup.some((g) => g.includes(p))).map((p) => ({ p, s: shingles(p.mainText) }));
  const near = [];
  const samePage = (a, b) => pageId.has(a.key) && pageId.get(a.key) === pageId.get(b.key);
  if (nd.length <= 600) for (let i = 0; i < nd.length; i++) for (let j = i + 1; j < nd.length; j++) { if (samePage(nd[i].p, nd[j].p)) continue; const jv = jacc(nd[i].s, nd[j].s); if (jv >= 0.9) near.push([nd[i].p, nd[j].p, jv]); }
  if (near.length) add({ id: 'near-duplicate-content', severity: 'low', title: 'Near-duplicate main content (90%+ of 5-word phrases shared)', why: 'Pages this similar compete with each other and can read as templated; merge, differentiate, or canonicalise.', tag: `[G] ${DOC.helpful} ; similarity heuristic [INFERENCE]`, evidence: near.slice(0, 40).map(([a, b, jv]) => ev(a.url, `${(jv * 100).toFixed(0)}% similar to ${b.key}`)) });

  // ================= 10. hreflang =================
  const withHl = html200.filter((p) => p.a.hreflang.length);
  if (withHl.length) {
    const bad = []; const noSelf = []; const noReturn = []; const badTarget = []; const dupLang = []; const relHl = []; const noXd = [];
    for (const p of withHl) {
      // The same annotation in the HTML and the Link header counts once.
      const hl = [...new Map(p.a.hreflang.filter((h) => h.inHead || h.source === 'http-header').map((h) => [`${h.lang.toLowerCase()}|${h.key}`, h])).values()];
      for (const lang of new Set(hl.map((h) => h.lang))) { const why = hreflangProblem(lang); if (why) bad.push(ev(p.url, `hreflang="${lang}": ${why}`)); }
      if (hl.some((h) => h.relative)) relHl.push(ev(p.url, hl.filter((h) => h.relative).map((h) => `${h.lang}="${h.href}"`).join(', ')));
      const byLang = new Map();
      for (const h of hl) { const k = h.lang.toLowerCase(); byLang.set(k, new Set([...(byLang.get(k) || []), h.key])); }
      for (const [l, set] of byLang) if (set.size > 1) dupLang.push(ev(p.url, `hreflang="${l}" names ${set.size} URLs: ${[...set].join(', ')}`));
      if (hl.length && !hl.some((h) => h.key === p.key || h.key === effCanon(p).key)) noSelf.push(ev(p.url, `${hl.length} annotations, none for this URL`));
      if (hl.length && !byLang.has('x-default')) noXd.push(p);
      for (const h of hl) {
        if (!h.key || h.key === p.key) continue;
        const t = P.get(h.key);
        if (!t || !t.fetched) continue;
        if (t.redirectTo || allBad(t, (f) => f.error || f.status >= 400)) { badTarget.push(ev(p.url, `${h.lang} -> ${h.key} returns ${t.redirectTo ? `${t.redirectStatus} redirect` : t.fetches.map((f) => f.status ?? f.error).join(',')}`)); continue; }
        if (t.a && t.a.robots.noindex) { badTarget.push(ev(p.url, `${h.lang} -> ${h.key} is noindexed`)); continue; }
        if (t.a && effCanon(t).key && effCanon(t).key !== t.key) { badTarget.push(ev(p.url, `${h.lang} -> ${h.key} canonicalises to ${effCanon(t).key}`)); continue; }
        if (t.a && !t.a.hreflang.some((x) => x.key === p.key || x.key === effCanon(p).key)) noReturn.push(ev(p.url, `${h.lang} -> ${h.key} does not link back`));
      }
    }
    if (bad.length) add({ id: 'hreflang-invalid', severity: 'medium', title: 'Invalid hreflang values', why: 'Google needs an ISO 639-1 language, optionally with an ISO 3166-1 alpha-2 region (or x-default); invalid values are ignored.', tag: `[G] ${DOC.hreflang}`, evidence: bad });
    if (noReturn.length) add({ id: 'hreflang-no-return', severity: 'medium', title: 'hreflang without a return link', why: 'If two pages do not both point to each other, Google ignores the annotation pair.', tag: `[G] ${DOC.hreflang}`, evidence: noReturn });
    if (badTarget.length) add({ id: 'hreflang-bad-target', severity: 'medium', title: 'hreflang pointing to redirects, errors, noindexed or non-canonical URLs', why: 'Alternates must be indexable, canonical URLs that return 200, or the annotation is wasted.', tag: `[G] ${DOC.hreflang}`, evidence: badTarget });
    if (dupLang.length) add({ id: 'hreflang-duplicate-lang', severity: 'medium', title: 'One hreflang value mapped to several URLs on the same page', why: 'Conflicting annotations for one locale; Google may ignore them.', tag: `[G] ${DOC.hreflang}`, evidence: dupLang });
    if (noSelf.length) add({ id: 'hreflang-no-self', severity: 'low', title: 'hreflang sets that do not include the page itself', why: 'Google asks each language version to list itself as well as every other version.', tag: `[G] ${DOC.hreflang}`, evidence: noSelf });
    if (relHl.length) add({ id: 'hreflang-relative', severity: 'low', title: 'hreflang with relative URLs', why: 'Google requires fully-qualified URLs in hreflang annotations.', tag: `[G] ${DOC.hreflang}`, evidence: relHl });
    if (noXd.length) add({ id: 'hreflang-no-x-default', severity: 'info', title: 'hreflang sets without x-default', why: 'Optional; x-default names the page for users whose language matches none of the versions.', tag: `[G] ${DOC.hreflang}`, evidence: noXd.map((p) => ev(p.url, `${p.a.hreflang.length} annotations, no x-default`)) });
    const bodyHl = withHl.filter((p) => p.a.hreflang.some((h) => h.source === 'html' && !h.inHead));
    if (bodyHl.length) add({ id: 'hreflang-outside-head', severity: 'medium', title: 'hreflang link elements outside <head>', why: 'hreflang <link> elements belong in the <head>; ones in <body> are ignored.', tag: `[G] ${DOC.hreflang}`, evidence: bodyHl.map((p) => ev(p.url, p.a.hreflang.filter((h) => !h.inHead).map((h) => h.lang).join(', '))) });
  }

  // ================= 11. Structured data =================
  const sdPages = html200.filter((p) => p.a.jsonld.blocks);
  const sdErr = sdPages.filter((p) => p.a.jsonld.errors.length);
  if (sdErr.length) add({ id: 'jsonld-invalid', severity: 'medium', title: 'JSON-LD blocks that fail to parse', why: 'A block that is not valid JSON is ignored entirely - every entity in it (Organization, Breadcrumb, Product...) is lost.', tag: `[G] ${DOC.sdGeneral}`, evidence: sdErr.map((p) => ev(p.url, p.a.jsonld.errors.join(' | '))), verify: 'Paste the block into the Schema Markup Validator or Rich Results Test.' });
  const sdMissing = sdPages.filter((p) => p.a.jsonld.issues.length);
  if (sdMissing.length) add({ id: 'jsonld-missing-required', severity: 'low', title: 'Structured data missing properties Google requires for its rich result', why: 'Without the required properties the page is not eligible for that rich result (the markup is otherwise harmless). Only add values that are true and visible on the page; ratings must come directly from real users, never written or curated by you.', tag: `[G] ${DOC.sdGallery}`, evidence: sdMissing.map((p) => ev(p.url, p.a.jsonld.issues.map((i) => `${i.type}: ${i.missing.join(', ')}`).join(' | '))), verify: 'Rich Results Test on one URL per template.' });
  const sdCtx = sdPages.filter((p) => p.a.jsonld.noContext);
  if (sdCtx.length) add({ id: 'jsonld-no-context', severity: 'low', title: 'JSON-LD without a schema.org @context', why: 'Without @context the types are not schema.org types and Google cannot use them.', tag: `[G] ${DOC.sdGeneral}`, evidence: sdCtx.map((p) => ev(p.url, `${p.a.jsonld.noContext} entity/entities without @context`)) });
  const retired = sdPages.filter((p) => p.a.jsonld.retired.length);
  if (retired.length) add({ id: 'jsonld-retired', severity: 'info', title: 'Markup for rich results Google no longer shows', why: 'Harmless to keep and not a gap to fill: it earns no rich result.', tag: `[G] ${DOC.updates}`, evidence: [ev(retired[0].url, `${retired.length} page(s); ${[...new Set(retired.flatMap((p) => p.a.jsonld.retired))].join('; ')}`)] });
  const selfServ = sdPages.filter((p) => p.a.jsonld.selfServing.length);
  if (selfServ.length) add({ id: 'jsonld-self-serving-rating', severity: 'info', title: 'Ratings/reviews attached to the site\'s own Organization/LocalBusiness', why: 'Self-serving reviews of an organisation are not eligible for review stars.', tag: `[G] ${DOC.reviewSnippet}`, evidence: selfServ.map((p) => ev(p.url, p.a.jsonld.selfServing.join(', '))) });
  const typeCount = new Map();
  for (const p of sdPages) for (const t of p.a.jsonld.top) typeCount.set(t, (typeCount.get(t) || 0) + 1);
  const nestedCount = new Map();
  for (const p of sdPages) for (const t of p.a.jsonld.nested) nestedCount.set(t, (nestedCount.get(t) || 0) + 1);
  if (sdPages.length) add({ id: 'jsonld-types', severity: 'info', title: 'Structured data types found (raw HTML)', why: 'Inventory only. Nested entities (e.g. a parentOrganization inside an Organization) are related entities, not duplicates.', tag: `[G] ${DOC.sdGallery}`, evidence: [], note: `${sdPages.length} of ${html200.length} pages have JSON-LD. Top-level: ${[...typeCount].sort((a, b) => b[1] - a[1]).map(([t, n]) => `${t} (${n})`).join(', ')}${nestedCount.size ? `. Nested: ${[...nestedCount].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([t, n]) => `${t} (${n})`).join(', ')}` : ''}` });
  if (home && home.a && !home.a.jsonld.blocks) add({ id: 'home-no-jsonld', severity: 'info', title: 'No JSON-LD in the home page\'s raw HTML', why: 'Organization and WebSite markup on the home page help Google with the site name and logo. Markup injected by JavaScript is invisible to this tool, so check the rendered page before calling it missing.', tag: `[G] ${DOC.sdGallery}`, evidence: [ev(home.url, home.jsDependent ? 'page looks JavaScript-rendered' : 'no application/ld+json script')] });

  // ================= 12. Sitemap hygiene =================
  if (state.sitemap) {
    const sm = state.sitemap;
    const files = sm.files;
    const readable = files.filter((f) => f.kind === 'urlset' || f.kind === 'index' || f.kind === 'text');
    if (!sm.urls.size && !files.some((f) => f.kind === 'index')) add({ id: 'sitemap-none', severity: files.some((f) => f.via && f.via.startsWith('robots')) ? 'medium' : 'info', title: 'No usable sitemap found', why: 'Sitemaps are optional for small, well-linked sites but help Google find new and deep pages on larger ones.', tag: `[G] ${DOC.sitemapsOverview}`, evidence: files.map((f) => ev(f.url, f.error || f.kind || `HTTP ${f.status}`)) });
    const defaultMiss = (f) => f.via && f.via.startsWith('default') && /^HTTP 4\d\d$/.test(f.error || '');
    const failed = files.filter((f) => f.error && !f.blockedForUs && !defaultMiss(f));
    if (failed.length) add({ id: 'sitemap-unreadable', severity: 'medium', title: 'Sitemap files that could not be fetched', why: 'Search Console reports these as "couldn\'t fetch"; the URLs inside are not submitted.', tag: `[G] ${DOC.sitemaps}`, evidence: failed.map((f) => ev(f.url, `${f.error}${f.via ? ` (declared via ${f.via})` : ''}`)) });
    const notSitemap = files.filter((f) => !f.error && (f.kind === 'html' || f.kind === 'invalid'));
    if (notSitemap.length) add({ id: 'sitemap-invalid', severity: 'medium', title: 'Sitemap URLs that do not return a sitemap', why: 'An HTML page or malformed XML at a sitemap address is rejected; nothing in it is submitted.', tag: `[G] ${DOC.sitemaps}`, evidence: notSitemap.map((f) => ev(f.url, `${f.notes.join('; ')} (content-type ${f.contentType || 'none'})`)) });
    const tooBig = files.filter((f) => f.urlCount > SITEMAP_MAX_URLS || f.overSize);
    if (tooBig.length) add({ id: 'sitemap-too-large', severity: 'high', title: 'Sitemap files over Google\'s limits (50,000 URLs or 50 MB uncompressed)', why: 'Google rejects a sitemap file over either limit; split it and list the parts in a sitemap index.', tag: `[G] ${DOC.sitemaps}`, evidence: tooBig.map((f) => ev(f.url, f.urlCount > SITEMAP_MAX_URLS ? `${f.urlCount} URLs` : `${(f.overSize / 1048576).toFixed(1)} MB${f.gz ? ' after decompression' : ''}`)) });
    const capped = files.filter((f) => f.truncated && !f.overSize);
    if (capped.length) add({ id: 'sitemap-not-fully-read', severity: 'info', title: 'Sitemap files this tool did not read completely', why: 'Size cap for politeness; the URLs inside were not all checked.', tag: '[INFERENCE]', evidence: capped.map((f) => ev(f.url, f.notes.join('; '))) });
    const nested = files.filter((f) => f.nestedIndex);
    if (nested.length) add({ id: 'sitemap-nested-index', severity: 'low', title: 'Sitemap index files listed inside another sitemap index', why: 'A sitemap index file can list only sitemap files, not other index files; Search Console reports this as an error.', tag: `[G] ${DOC.sitemapHelp}`, evidence: nested.map((f) => ev(f.url, `index listed by ${f.via}`)) });
    const smBlockedFiles = files.filter((f) => f.googleBlocked);
    if (smBlockedFiles.length) add({ id: 'sitemap-file-blocked', severity: 'medium', title: 'Sitemap files robots.txt blocks for Googlebot', why: 'Google respects robots.txt when fetching sitemaps, so a disallowed sitemap is not read.', tag: `[G] ${DOC.sitemapHelp}`, evidence: smBlockedFiles.map((f) => ev(f.url, 'disallowed for Googlebot')) });
    const otherHost = [...sm.urls.keys()].filter((loc) => { try { const u = new URL(loc); return u.origin !== state.scope.origin; } catch { return true; } });
    if (otherHost.length) {
      const sameSite = otherHost.filter((l) => { try { return state.scope.variantHosts.has(new URL(l).host) || new URL(l).host === state.scope.host; } catch { return false; } });
      add({ id: 'sitemap-other-host', severity: sameSite.length ? 'medium' : 'low', title: 'Sitemap URLs on a different host or protocol than the site', why: sameSite.length ? 'URLs on the non-canonical protocol/host redirect or duplicate; list canonical URLs only.' : 'Search Console treats URLs on a different domain than the sitemap file as not valid for it, unless the other site has verified the cross-submission.', tag: `[G] ${DOC.sitemapHelp}`, evidence: otherHost.slice(0, 30).map((l) => ev(l, 'listed in sitemap')), count: otherHost.length });
    }
    const outsideDir = [];
    for (const f of files.filter((x) => x.kind === 'urlset' || x.kind === 'text')) {
      let dir;
      try { const u = new URL(f.finalUrl || f.url); dir = `${u.origin}${u.pathname.replace(/[^/]*$/, '')}`; } catch { continue; }
      if (new URL(dir).pathname === '/') continue;
      const n = [...sm.urls.values()].filter((e) => e.files.includes(f.url) && !e.loc.startsWith(dir)).length;
      if (n) outsideDir.push(ev(f.url, `${n} URL(s) outside ${dir}`));
    }
    if (outsideDir.length) add({ id: 'sitemap-outside-path', severity: 'low', title: 'Sitemaps listing URLs outside their own directory', why: 'Unless the sitemap is submitted through Search Console, it affects only URLs under its own directory; URLs "at a higher level" than the sitemap file are not valid for it. Host sitemaps at the root, or submit them in Search Console.', tag: `[G] ${DOC.sitemaps} ; ${DOC.sitemapHelp}`, evidence: outsideDir });
    if (sm.urls.size) {
      const lm = lastmodStats(sm.urls);
      if (lm.missing === lm.total) add({ id: 'lastmod-missing', severity: 'info', title: 'No <lastmod> in the sitemap', why: 'Optional; Google uses lastmod only when it is consistently accurate, so it helps re-crawl changed pages.', tag: `[G] ${DOC.sitemaps}`, evidence: [], note: `${lm.total} URLs, none with lastmod` });
      if (lm.invalid.length) add({ id: 'lastmod-invalid', severity: 'low', title: 'lastmod values not in W3C Datetime format', why: 'Unparseable dates are ignored.', tag: `[G] ${DOC.sitemaps}`, evidence: lm.invalid.slice(0, 10).map((u) => ev(u.loc, `lastmod "${u.lastmod}"`)), count: lm.invalid.length });
      if (lm.future.length) add({ id: 'lastmod-future', severity: 'low', title: 'lastmod dates in the future', why: 'Impossible dates make Google trust the site\'s lastmod values less.', tag: `[G] ${DOC.sitemaps}`, evidence: lm.future.slice(0, 10).map((u) => ev(u.loc, `lastmod ${u.lastmod}`)), count: lm.future.length });
      if (lm.total >= 20 && lm.topCount / lm.total > 0.5 && lm.distinctDays <= Math.max(3, lm.total * 0.05)) add({ id: 'lastmod-bulk', severity: 'low', title: 'Most lastmod dates are the same day (bulk-stamped)', why: 'Google uses lastmod only if it is verifiably accurate; stamping every URL with the build date teaches it to ignore the field. Stamp only pages whose content changed.', tag: `[G] ${DOC.sitemaps}`, evidence: [], note: `${lm.topCount} of ${lm.total} URLs share ${lm.topDay}` });
      const multi = [...sm.urls.values()].filter((e) => new Set(e.files).size > 1);
      if (multi.length) add({ id: 'sitemap-duplicates', severity: 'info', title: 'URLs listed in more than one sitemap file', why: 'Harmless but untidy; lastmod can disagree between copies.', tag: '[INFERENCE]', evidence: multi.slice(0, 10).map((e) => ev(e.loc, `${new Set(e.files).size} files`)), count: multi.length });
    }
    if (readable.length && !failed.length && !notSitemap.length && !tooBig.length) fine.push(`${readable.length} sitemap file(s) read, ${sm.urls.size} URLs`);
  }

  // ================= 13. Page basics (information) =================
  const noLang = ci.filter((p) => !p.a.lang);
  if (noLang.length) add({ id: 'lang-missing', severity: 'info', title: 'Pages without <html lang>', why: 'Google detects language from the visible content, not this attribute; screen readers and other engines do use it.', tag: `[G] ${DOC.multiRegional}`, evidence: noLang.map((p) => ev(p.url, 'no lang attribute')) });
  const noVp = ci.filter((p) => !p.a.viewport);
  if (noVp.length) add({ id: 'viewport-missing', severity: 'low', title: 'Pages without a meta viewport', why: 'Without it phones render the desktop layout zoomed out; Google indexes and ranks the mobile version of content.', tag: `[G] ${DOC.mobile} ; viewport rendering [INFERENCE]`, evidence: noVp.map((p) => ev(p.url, 'no <meta name="viewport">')) });
  const altPages = ci.filter((p) => p.a.images.missingAlt);
  if (altPages.length) add({ id: 'images-missing-alt', severity: 'info', title: 'Images without an alt attribute', why: 'Alt text matters for accessibility and Google Images, not for web ranking.', tag: `[G] ${DOC.images}`, evidence: altPages.sort((a, b) => b.a.images.missingAlt - a.a.images.missingAlt).map((p) => ev(p.url, `${p.a.images.missingAlt} of ${p.a.images.total} <img> without alt`)), count: altPages.reduce((n, p) => n + p.a.images.missingAlt, 0) });
  const noOg = ci.filter((p) => !p.a.og.title || !p.a.og.image);
  if (noOg.length) add({ id: 'open-graph-missing', severity: 'info', title: 'Pages missing og:title or og:image', why: 'Open Graph controls link previews on social and chat apps; it is not a Google ranking signal.', tag: '[INFERENCE]', evidence: noOg.map((p) => ev(p.url, `missing ${[!p.a.og.title && 'og:title', !p.a.og.image && 'og:image'].filter(Boolean).join(', ')}`)) });

  // ================= 14. PageSpeed Insights (optional) =================
  if (state.psi) {
    for (const r of state.psi.results) {
      if (r.error) continue;
      const field = r.field;
      if (field && field.metrics) {
        const poor = Object.entries(field.metrics).filter(([k, m]) => ['LCP', 'INP', 'CLS'].includes(k) && m.category === 'SLOW');
        const ni = Object.entries(field.metrics).filter(([k, m]) => ['LCP', 'INP', 'CLS'].includes(k) && m.category === 'AVERAGE');
        const detail = Object.entries(field.metrics).map(([k, m]) => `${k} ${m.display} (${m.category})`).join(', ');
        if (poor.length) add({ id: 'cwv-poor', severity: 'medium', title: 'Core Web Vitals "poor" in real-user field data', why: 'Real users have a poor experience on this metric. Core Web Vitals are used in ranking but act as a tie-breaker; fix for users and conversions first.', tag: `[G] ${DOC.cwv}`, evidence: [ev(r.url, `${field.scope}: ${detail}`)] });
        else if (ni.length) add({ id: 'cwv-needs-improvement', severity: 'low', title: 'Core Web Vitals "needs improvement" in field data', why: 'Close to the thresholds (LCP 2.5 s, INP 200 ms, CLS 0.1; judged at the 75th percentile of page loads).', tag: `[G] ${DOC.cwv} ; ${DOC.vitals}`, evidence: [ev(r.url, `${field.scope}: ${detail}`)] });
        else fine.push(`CWV field data (${field.scope}) for ${r.url}: ${detail}`);
      }
      if (r.lab) add({ id: 'psi-lab', severity: 'info', title: 'Lighthouse lab metrics (one synthetic mobile run)', why: 'Lab numbers vary run to run and are not what Google uses for ranking; field data is. (Google has said it plans to stop including CrUX field data in the PSI API, so field data may be absent.)', tag: `[G] ${DOC.cwv}`, evidence: [ev(r.url, `score ${r.lab.score}, LCP ${r.lab.lcp}, CLS ${r.lab.cls}, TBT ${r.lab.tbt}${r.field ? '' : '; no field data for this URL or origin'}`)] });
    }
  }

  // ----- merge findings with the same id, sort by severity -----
  const merged = new Map();
  for (const f of findings) {
    const m = merged.get(f.id);
    if (!m) { merged.set(f.id, { ...f, evidence: [...(f.evidence || [])] }); continue; }
    m.evidence.push(...(f.evidence || []));
    m.count = (m.count || 0) + (f.count || 0);
    if (SEV.indexOf(f.severity) < SEV.indexOf(m.severity)) m.severity = f.severity;
  }
  const list = [...merged.values()].sort((a, b) => SEV.indexOf(a.severity) - SEV.indexOf(b.severity) || (b.count || 0) - (a.count || 0));
  const stats = {
    statusDistribution: Object.fromEntries([...dist].sort((a, b) => String(a[0]).localeCompare(String(b[0])))),
    depthDistribution: Object.fromEntries([...depthDist].sort((a, b) => (a[0] === 'not reached' ? 1 : b[0] === 'not reached' ? -1 : a[0] - b[0]))),
    htmlPages: html200.length, indexable: html200.filter(indexable).length, jsDependentShare: Number(jsShare.toFixed(2)),
  };
  return { findings: list, fine, stats };
}
