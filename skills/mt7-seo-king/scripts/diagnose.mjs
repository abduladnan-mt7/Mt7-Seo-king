#!/usr/bin/env node
/**
 * diagnose.mjs - deep, bounded site diagnosis from raw HTML. Node 18+, no dependencies.
 *
 * Crawls a site the way a polite, non-rendering crawler does - home page and sitemaps first, then
 * internal links breadth-first up to --limit URLs - and reports ranked findings with evidence:
 *   crawl graph (click depth, orphans, links to redirects/4xx/5xx, redirect chains and loops,
 *   http/https, www/non-www and trailing-slash duplicates), indexability conflicts verified per URL
 *   (noindex vs sitemap, canonical to non-200/redirect/noindex/blocked URLs, canonical chains,
 *   robots.txt blocking listed or linked URLs and CSS/JS, soft 404s), duplicate and templated
 *   titles/descriptions/H1s, thin and JavaScript-dependent pages, hreflang return links and codes,
 *   JSON-LD parse errors and required properties for rich results Google still shows, server
 *   health (status mix, intermittent 5xx with --repeat, TTFB, 2 MB HTML limit, mixed content),
 *   sitemap hygiene and page basics. Optional --psi adds PageSpeed Insights lab + field data.
 *
 * Usage:
 *   node diagnose.mjs <site-url> [--limit 150] [--concurrency 2] [--delay 500] [--repeat 1]
 *        [--scope blog/ ...] [--no-sitemap] [--max-sitemaps 50] [--max-sitemap-mb 10]
 *        [--verify-limit 40] [--resource-limit 15] [--timeout 15000] [--max-minutes 20]
 *        [--psi] [--psi-urls 3] [--json] [--save report.json] [--max-evidence 8] [--quiet] [--ua "..."]
 *
 * --scope limits fetching to paths under a prefix (repeatable; "blog/", "/blog/" or a full URL; in Git
 * Bash write it without the leading slash, which Git Bash would rewrite into a Windows path).
 * Exit codes: 0 = ran, no critical/high findings; 1 = at least one critical or high finding;
 *             2 = could not run (bad arguments, start URL unreachable, robots.txt disallows this crawler).
 * Politeness: GET only, robots.txt obeyed for every host (this crawler's token is "mt7-seo-king",
 * otherwise the "*" group), at most 4 workers with >= 250 ms between each worker's requests,
 * Retry-After honoured, the crawl stops when the server keeps pushing back (429/503/timeouts).
 * Requests made: about --limit (x --repeat) plus robots.txt files, sitemap files, ~10 probes,
 * --verify-limit target checks, --resource-limit CSS/JS checks and up to 30 confirmation fetches.
 * Limits: no JavaScript is executed (see the "cannot see" section of every report); regex-based
 * HTML parsing; one vantage point for timings; findings are leads to verify, not verdicts.
 */

import { writeFileSync } from 'node:fs';
import { Fetcher } from './lib/http.mjs';
import { Crawler, createState } from './lib/crawl.mjs';
import { buildFindings } from './lib/checks.mjs';
import { runPsi } from './lib/psi.mjs';

const VERSION = '1.0';
const DEFAULT_UA = `Mozilla/5.0 (compatible; diagnose/${VERSION}; mt7-seo-king; Node fetch)`;
const SEVERITIES = ['critical', 'high', 'medium', 'low', 'info'];

function parseArgs(argv) {
  const o = { target: null, limit: 150, concurrency: 2, delay: 500, repeat: 1, scope: [], noSitemap: false, maxSitemaps: 50, maxSitemapMb: 10, verifyLimit: 40, resourceLimit: 15, timeout: 15000, maxMinutes: 20, psi: false, psiUrls: 3, json: false, save: null, maxEvidence: 8, quiet: false, ua: DEFAULT_UA, help: false };
  const num = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    switch (a) {
      case '--limit': o.limit = Math.min(2000, Math.max(1, num(next(), o.limit))); break;
      case '--concurrency': o.concurrency = Math.min(4, Math.max(1, num(next(), o.concurrency))); break;
      case '--delay': o.delay = Math.max(250, num(next(), o.delay)); break;
      case '--repeat': o.repeat = Math.min(3, Math.max(1, num(next(), 1))); break;
      case '--scope': {
        const v = next();
        if (!v) break;
        // Git Bash rewrites arguments that start with "/" into Windows paths (C:/Program Files/Git/...).
        if (/^[A-Za-z]:[\\/]/.test(v)) throw new Error(`--scope ${v} looks like a Windows path (Git Bash rewrites arguments starting with "/"); write it without the leading slash, e.g. --scope ${v.split(/[\\/]/).filter(Boolean).slice(-1)[0]}/`);
        let sp = v;
        if (/^https?:\/\//i.test(v)) { try { sp = new URL(v).pathname; } catch { throw new Error(`--scope: not a URL: ${v}`); } }
        o.scope.push(sp.startsWith('/') ? sp : `/${sp}`);
        break;
      }
      case '--no-sitemap': o.noSitemap = true; break;
      case '--max-sitemaps': o.maxSitemaps = Math.min(500, Math.max(1, num(next(), o.maxSitemaps))); break;
      case '--max-sitemap-mb': o.maxSitemapMb = Math.min(60, Math.max(1, num(next(), o.maxSitemapMb))); break;
      case '--verify-limit': o.verifyLimit = Math.min(500, Math.max(0, num(next(), o.verifyLimit))); break;
      case '--resource-limit': o.resourceLimit = Math.min(200, Math.max(0, num(next(), o.resourceLimit))); break;
      case '--timeout': o.timeout = Math.min(120000, Math.max(2000, num(next(), o.timeout))); break;
      case '--max-minutes': o.maxMinutes = Math.min(240, Math.max(1, num(next(), o.maxMinutes))); break;
      case '--psi': o.psi = true; break;
      case '--psi-urls': o.psiUrls = Math.min(5, Math.max(1, num(next(), o.psiUrls))); break;
      case '--json': o.json = true; break;
      case '--save': o.save = next() ?? null; break;
      case '--max-evidence': o.maxEvidence = Math.max(1, num(next(), o.maxEvidence)); break;
      case '--quiet': o.quiet = true; break;
      case '--ua': o.ua = next() ?? o.ua; break;
      case '-h': case '--help': o.help = true; break;
      default:
        if (a.startsWith('--')) throw new Error(`unknown option ${a}`);
        if (!o.target) o.target = a; else throw new Error(`unexpected argument ${a}`);
    }
  }
  o.maxSitemapBytes = o.maxSitemapMb * 1048576;
  return o;
}

const fmtMs = (ms) => (ms >= 60000 ? `${Math.floor(ms / 60000)}m ${String(Math.round((ms % 60000) / 1000)).padStart(2, '0')}s` : `${(ms / 1000).toFixed(1)}s`);

function cannotSee(state, stats) {
  const pages = [...state.pages.values()];
  const blockedUs = pages.filter((p) => p.blockedUs && p.scope !== 'external');
  const notFetched = pages.filter((p) => !p.fetched && !p.blockedUs && p.scope === 'internal' && p.inScope);
  const extHl = pages.filter((p) => !p.fetched && p.scope === 'external' && [...state.pages.values()].some((q) => q.a && q.a.hreflang.some((h) => h.key === p.key)));
  const jsPages = pages.filter((p) => p.jsDependent).length;
  const out = [
    `JavaScript is not executed: links, text, canonicals, meta robots and JSON-LD added by scripts are invisible here, while Google renders pages (most AI crawlers do not).${jsPages ? ` ${jsPages} page(s) look JavaScript-dependent.` : ''}`,
    'What Google actually indexed, the canonical Google selected, Googlebot\'s own crawl errors, manual actions and security issues: Search Console (Page indexing report, URL Inspection, Crawl stats, Manual actions, Security issues).',
    'Rankings, impressions, clicks and queries: Search Console Performance and Bing Webmaster Tools. A traffic change needs its first day and scripts/google-updates.mjs --around <date>.',
    'What Googlebot is served: this crawler identifies itself honestly, so a CDN, firewall or bot rule that treats Googlebot differently (better or worse) is not visible here.',
    'Backlinks, external link targets (outbound links are counted, not fetched), images, video and PDF files.',
    'Content quality, search intent, first-hand experience and trust - and whether a short page is genuinely thin - need a person reading the page.',
    state.psi ? 'Core Web Vitals for pages beyond the --psi sample.' : 'Core Web Vitals field data (run with --psi, or check Search Console > Core Web Vitals).',
    'Anything behind a login or a form (forms are never submitted), server logs and CDN configuration.',
  ];
  if (notFetched.length) out.push(`${notFetched.length} discovered internal URL(s) were not fetched (page budget --limit ${state.opts.limit}); findings cover only fetched URLs.`);
  if (blockedUs.length) out.push(`${blockedUs.length} URL(s) were not fetched because robots.txt disallows this crawler${blockedUs.some((p) => !p.blockedGoogle) ? ' (some are allowed for Googlebot, so Google sees content this tool cannot)' : ''}.`);
  if (extHl.length) out.push(`${extHl.length} hreflang target(s) on other hosts were not verified (verify budget).`);
  if (state.sitemap && !state.sitemap.complete && (state.sitemapDeclared.length || state.sitemap.urls.size)) out.push('The sitemap set was not read completely (errors, size cap or file limit), so "missing from the sitemap" and orphan checks are partial or skipped.');
  if (state.stopped) out.push(`The crawl stopped early: ${state.stopped}.`);
  const psiErr = state.psi ? state.psi.results.filter((x) => x.error) : [];
  if (psiErr.length) out.push(`PageSpeed Insights: ${psiErr.map((x) => `${x.url}: ${x.error}`).join('; ')}.`);
  return out;
}

function printText(report, maxEv) {
  const L = [];
  const r = report;
  L.push(`diagnose  ${r.target}  (${r.startedAt.slice(0, 16).replace('T', ' ')} UTC, mt7-seo-king ${VERSION})`);
  if (r.fatal) { L.push(`\nCould not run: ${r.fatal}`); return L.join('\n'); }
  L.push(`Scope     ${r.scope.origin}${r.options.scope.length ? `  paths: ${r.options.scope.join(', ')}` : ''}${r.startChain.length > 1 ? `  (start redirected: ${r.startChain.map((h) => `${h.url} [${h.status}]`).join(' -> ')})` : ''}`);
  L.push(`Crawl     ${r.crawl.fetched} URLs crawled (limit ${r.options.limit}) + ${r.crawl.checks} probe/target/confirmation fetches; ${r.stats.htmlPages} HTML pages with 200, ${r.stats.indexable} indexable; link crawl ${r.crawl.linkCrawlComplete ? 'complete' : `NOT complete (${r.crawl.unfetchedQueued} discovered URLs not fetched)`}`);
  if (r.sitemaps && r.sitemaps.none) L.push(`Sitemaps  none found (robots.txt declares none; ${r.sitemaps.fileList[0]?.url} -> ${r.sitemaps.fileList[0]?.error || r.sitemaps.fileList[0]?.kind})`);
  else if (r.sitemaps) L.push(`Sitemaps  ${r.sitemaps.files} file(s) via ${r.sitemaps.via}; ${r.sitemaps.urls} URLs listed; ${r.sitemaps.fetched} of them fetched${r.sitemaps.complete ? '' : ' (sitemap set not read completely)'}`);
  L.push(`Robots    ${r.robots.url}: ${r.robots.summary}`);
  L.push(`Requests  ${r.crawl.requests} in ${fmtMs(r.durationMs)} (concurrency ${r.options.concurrency}, ${r.options.delay} ms between requests per worker${r.crawl.finalDelay !== r.options.delay ? `, raised to ${r.crawl.finalDelay} ms after pushback` : ''})`);
  L.push(`Statuses  ${Object.entries(r.stats.statusDistribution).map(([k, v]) => `${k} x${v}`).join(', ')}`);
  L.push(`Depth     ${Object.entries(r.stats.depthDistribution).map(([k, v]) => `${k}: ${v}`).join(', ')} (clicks from the home page, HTML 200 pages)`);
  const counts = SEVERITIES.map((s) => `${s.toUpperCase()} ${r.summary[s]}`).join('   ');
  L.push(`\n${counts}`);
  for (const sev of SEVERITIES) {
    const list = r.findings.filter((f) => f.severity === sev);
    if (!list.length) continue;
    L.push(`\n== ${sev.toUpperCase()} ==`);
    for (const f of list) {
      L.push(`\n[${sev}] ${f.title}${f.count ? ` (${f.count})` : ''}   {${f.id}}`);
      L.push(`  Why: ${f.why}`);
      L.push(`  Source: ${f.tag}`);
      if (f.note) L.push(`  Observed: ${f.note}`);
      const cut = (s, n) => (s && s.length > n ? `${s.slice(0, n - 3)}...` : s || '');
      for (const e of f.evidence.slice(0, sev === 'info' ? Math.min(5, maxEv) : maxEv)) L.push(`  - ${cut(e.url, 150)}${e.detail ? `  ${cut(e.detail, 400)}` : ''}`);
      if (f.evidence.length > (sev === 'info' ? Math.min(5, maxEv) : maxEv)) L.push(`  ... ${f.evidence.length - (sev === 'info' ? Math.min(5, maxEv) : maxEv)} more (--json for all)`);
      if (f.verify) L.push(`  Verify: ${f.verify}`);
    }
  }
  if (r.fine.length) { L.push('\n== Checked and fine =='); for (const x of r.fine) L.push(`  - ${x}`); }
  L.push('\n== Not checked / cannot see ==');
  for (const x of r.cannotSee) L.push(`  - ${x}`);
  L.push(`\nNo score is computed: counts and evidence only. Verify each critical/high item before acting (the "Verify" lines), then rank fixes by what blocks crawling and indexing first.`);
  return L.join('\n');
}

async function main() {
  let o;
  try { o = parseArgs(process.argv.slice(2)); } catch (e) { console.error(`diagnose: ${e.message}`); process.exitCode = 2; return; }
  if (o.help || !o.target) {
    console.log('Usage: node diagnose.mjs <site-url> [--limit 150] [--concurrency 2] [--delay 500] [--repeat 1] [--scope path/] [--no-sitemap] [--psi] [--json] [--save file.json] [--quiet]\nSee the header of this file for every option.');
    process.exitCode = o.help ? 0 : 2;
    return;
  }
  let start;
  try { start = new URL(/^https?:\/\//i.test(o.target) ? o.target : `https://${o.target}`); } catch { console.error(`diagnose: not a URL: ${o.target}`); process.exitCode = 2; return; }
  start.hash = '';
  o.start = start.href;
  const log = o.quiet ? () => {} : (m) => console.error(`[diagnose] ${m}`);
  const fetcher = new Fetcher({ ua: o.ua, timeout: o.timeout, delay: o.delay, log });
  const state = createState(o);
  state.deadline = Date.now() + o.maxMinutes * 60000;
  const crawler = new Crawler(state, fetcher, log);
  const t0 = Date.now();
  log(`start ${o.start} (limit ${o.limit}, concurrency ${o.concurrency}, delay ${o.delay} ms)`);
  await crawler.run();
  if (!state.fatal && o.psi && state.scope) {
    const internalHtml = [...state.pages.values()].filter((p) => p.scope === 'internal' && p.status === 200 && p.isHtml && p.a && !p.a.robots.noindex);
    const ranked = internalHtml.filter((p) => p.key !== state.homeKey).sort((a, b) => b.inlinks.size - a.inlinks.size);
    const urls = [state.homeKey, ...ranked.map((p) => p.key)].filter(Boolean).slice(0, o.psiUrls);
    state.psi = await runPsi(urls, { ua: o.ua, log });
  }
  const finishedAt = new Date();
  const report = { tool: 'mt7-seo-king diagnose', version: VERSION, target: o.start, startedAt: state.startedAt.toISOString(), finishedAt: finishedAt.toISOString(), durationMs: Date.now() - t0, options: { limit: o.limit, concurrency: o.concurrency, delay: o.delay, repeat: o.repeat, scope: o.scope, psi: o.psi, timeout: o.timeout } };
  if (state.fatal) {
    report.fatal = state.fatal;
    if (o.json) console.log(JSON.stringify(report, null, 2)); else console.log(printText(report, o.maxEvidence));
    if (o.save) writeFileSync(o.save, JSON.stringify(report, null, 2));
    process.exitCode = 2;
    return;
  }
  const { findings, fine, stats } = buildFindings(state);
  const sr = state.scopeRobots;
  const robotsSummary = !sr ? 'not fetched' : sr.state === 'ok' ? `HTTP ${sr.status}; this crawler obeys ${sr.us.agent ? `the "${sr.us.agent}" group` : 'no group (all allowed)'}, Googlebot ${sr.google.agent ? `the "${sr.google.agent}" group` : 'no group (all allowed)'}; ${sr.parsed.sitemaps.length} Sitemap line(s)` : sr.state === 'missing' ? `HTTP ${sr.status} (treated as no restrictions)` : `${sr.status ?? sr.error} (${sr.state})`;
  const pages = [...state.pages.values()];
  report.scope = { origin: state.scope.origin, host: state.scope.host };
  report.startChain = state.startChain || [];
  report.robots = { url: sr ? sr.url : null, status: sr ? sr.status : null, state: sr ? sr.state : null, summary: robotsSummary, sitemapLines: sr?.parsed?.sitemaps?.map((x) => x.value) ?? [] };
  report.crawl = { fetched: state.fetchCount, checks: state.verifyCount, requests: fetcher.requests, linkCrawlComplete: state.linkCrawlComplete, unfetchedQueued: state.unfetchedQueued ?? 0, stopped: state.stopped || fetcher.stopped || null, finalDelay: fetcher.delay, discovered: pages.filter((p) => p.scope === 'internal').length };
  if (state.sitemap) report.sitemaps = { none: !state.sitemapDeclared.length && !state.sitemap.urls.size, files: state.sitemap.files.length, via: state.sitemapDeclared.length ? 'robots.txt' : '/sitemap.xml', urls: state.sitemap.urls.size, fetched: pages.filter((p) => p.inSitemap && p.fetched).length, complete: state.sitemap.complete, fileList: state.sitemap.files.map((f) => ({ url: f.url, status: f.status, kind: f.kind, urls: f.urlCount, error: f.error, notes: f.notes })) };
  report.stats = stats;
  report.summary = Object.fromEntries(SEVERITIES.map((s) => [s, findings.filter((f) => f.severity === s).length]));
  report.findings = findings.map((f) => ({ ...f, evidence: f.evidence.slice(0, 200) }));
  report.fine = fine;
  report.cannotSee = cannotSee(state, stats);
  if (state.psi) report.psi = state.psi;
  if (o.save) writeFileSync(o.save, JSON.stringify(report, null, 2));
  if (o.json) console.log(JSON.stringify(report, null, 2));
  else console.log(printText(report, o.maxEvidence));
  process.exitCode = report.summary.critical + report.summary.high > 0 ? 1 : 0;
}

// process.exitCode, never process.exit(): exiting while undici still owns a socket trips a libuv assertion on Windows.
main().catch((e) => { console.error(`diagnose: ${(e && e.stack) || e}`); process.exitCode = 2; });
