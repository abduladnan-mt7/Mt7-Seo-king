/**
 * lib/sitemaps.mjs - read XML, gzip and plain-text sitemaps (and sitemap indexes) for diagnose.mjs.
 * Node 18+, no dependencies.
 *
 * Polite by construction: robots.txt is checked before every sitemap fetch, files whose declared
 * size exceeds the cap are judged from their headers instead of downloaded, and at most
 * `maxFiles` files are read. Records per file what Google's sitemap limits care about
 * (50,000 URLs / 50 MB uncompressed per file) and per URL its lastmod and xhtml:link alternates.
 */

import { gunzipSync } from 'node:zlib';
import { decodeEntities } from './html.mjs';

export const SITEMAP_MAX_URLS = 50000;
export const SITEMAP_MAX_BYTES = 50 * 1048576;
const W3C_DATE = /^\d{4}(-\d{2}(-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?)?)?$/;

const stripCdata = (s) => String(s).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
const text = (s) => decodeEntities(stripCdata(s)).trim();

function attrsOf(inside) {
  const out = {};
  for (const m of inside.matchAll(/([^\s"'<>\/=]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g)) out[m[1].toLowerCase()] = decodeEntities(m[2] ?? m[3] ?? m[4] ?? '');
  return out;
}

/** Parse one sitemap body. Returns { kind, entries|children, notes }. */
export function parseSitemap(body, url) {
  const s = body.replace(/^﻿/, '');
  const trimmed = s.replace(/<\?xml[\s\S]*?\?>/g, '').replace(/<!--[\s\S]*?-->/g, '').trim();
  const root = /<([A-Za-z_][\w.-]*:)?(urlset|sitemapindex)\b/i.exec(trimmed);
  if (!root) {
    if (/<(!doctype\s+html|html|head|body)\b/i.test(trimmed.slice(0, 3000))) return { kind: 'html', entries: [], children: [], notes: ['the URL returns an HTML page, not a sitemap'] };
    const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length && lines.every((l) => /^https?:\/\/\S+$/i.test(l))) return { kind: 'text', entries: lines.map((loc) => ({ loc, lastmod: null, alternates: [] })), children: [], notes: [] };
    if (trimmed.startsWith('<')) return { kind: 'invalid', entries: [], children: [], notes: ['XML without a <urlset> or <sitemapindex> root'] };
    return { kind: 'invalid', entries: [], children: [], notes: [lines.length ? 'not XML and not a plain list of absolute URLs' : 'empty response'] };
  }
  // Child tags may carry the root's prefix or none (a prefixed root with unprefixed children exists in the wild).
  const p0 = (root[1] || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const p = p0 ? `(?:${p0})?` : '';
  const notes = [];
  if (root[2].toLowerCase() === 'sitemapindex') {
    const children = [];
    for (const m of trimmed.matchAll(new RegExp(`<${p}sitemap\\b[^>]*>([\\s\\S]*?)</${p}sitemap\\s*>`, 'gi'))) {
      const loc = new RegExp(`<${p}loc\\b[^>]*>([\\s\\S]*?)</${p}loc\\s*>`, 'i').exec(m[1]);
      if (loc) children.push(text(loc[1]));
    }
    if (!children.length) notes.push('sitemap index lists no <sitemap><loc> entries');
    return { kind: 'index', entries: [], children, notes };
  }
  const entries = [];
  const urlRe = new RegExp(`<${p}url\\b[^>]*>([\\s\\S]*?)</${p}url\\s*>`, 'gi');
  const locRe = new RegExp(`<${p}loc\\b[^>]*>([\\s\\S]*?)</${p}loc\\s*>`, 'i');
  const lmRe = new RegExp(`<${p}lastmod\\b[^>]*>([\\s\\S]*?)</${p}lastmod\\s*>`, 'i');
  for (const m of trimmed.matchAll(urlRe)) {
    // Take the page <loc> only: image:loc / video:loc live in other namespaces.
    const inner = m[1].replace(/<([A-Za-z_][\w.-]*):(image|video|news)\b[\s\S]*?<\/\1:\2\s*>/gi, ' ');
    const loc = locRe.exec(inner);
    if (!loc) continue;
    const lm = lmRe.exec(inner);
    const alternates = [];
    for (const l of inner.matchAll(/<(?:[A-Za-z_][\w.-]*:)?link\b([^>]*)\/?>/gi)) {
      const a = attrsOf(l[1]);
      if ((a.rel || '').toLowerCase() === 'alternate' && a.hreflang && a.href) alternates.push({ lang: a.hreflang, href: a.href });
    }
    entries.push({ loc: text(loc[1]), lastmod: lm ? text(lm[1]) : null, alternates });
  }
  if (!entries.length) notes.push('urlset contains no <url><loc> entries');
  return { kind: 'urlset', entries, children: [], notes, url };
}

/**
 * Read sitemaps breadth-first from `starts` ([{ url, via }]).
 * ctx: { fetcher, allowedForUs(url) -> {allowed, rule}, allowedForGoogle(url) -> {allowed}, maxFiles, maxBytes, concurrency }
 */
export async function readSitemaps(starts, ctx) {
  const maxFiles = ctx.maxFiles ?? 50;
  const maxBytes = ctx.maxBytes ?? 10 * 1048576;
  const files = [];
  const urls = new Map();
  const seen = new Set();
  const queue = starts.map((s) => ({ ...s, depth: 0 }));
  let skippedFiles = 0;

  const one = async (item) => {
    const rec = { url: item.url, via: item.via, depth: item.depth, status: null, error: null, kind: null, urlCount: 0, bytes: 0, uncompressedBytes: null, gz: false, truncated: false, notes: [], children: 0, ms: null };
    files.push(rec);
    let u;
    try { u = new URL(item.url); } catch { rec.error = 'not an absolute URL'; return; }
    if (!/^https?:$/.test(u.protocol)) { rec.error = 'not an http(s) URL'; return; }
    const us = await ctx.allowedForUs(item.url);
    const g = await ctx.allowedForGoogle(item.url);
    rec.googleBlocked = g && !g.allowed;
    if (!us.allowed) { rec.error = `not fetched: robots.txt disallows this crawler (${us.rule || 'robots.txt unavailable'})`; rec.blockedForUs = true; return; }
    const r = await ctx.fetcher.getFollow(item.url, { maxBytes, body: 'always', skipIfLargerThan: maxBytes, identity: true, accept: 'application/xml,text/xml,application/x-gzip,text/plain;q=0.9,*/*;q=0.5' });
    rec.status = r.status;
    rec.ms = r.ms;
    rec.finalUrl = r.finalUrl || item.url;
    if (r.chain && r.chain.length > 1) rec.notes.push(`redirected: ${r.chain.map((c) => `${c.url} [${c.status ?? c.error}]`).join(' -> ')}`);
    rec.contentType = r.contentType;
    if (r.error) { rec.error = r.error === 'timeout' ? `timed out after ${Math.round(ctx.fetcher.timeout / 1000)} s` : r.error; return; }
    if (r.status !== 200) { rec.error = `HTTP ${r.status}`; return; }
    if (r.skippedLarge) {
      rec.bytes = r.contentLength;
      rec.truncated = true;
      rec.notes.push(`not downloaded: declared size ${(r.contentLength / 1048576).toFixed(1)} MB exceeds this tool's ${Math.round(maxBytes / 1048576)} MB cap`);
      if (r.contentLength > SITEMAP_MAX_BYTES && !/gzip/.test(r.contentType || '') && !/\.gz$/i.test(u.pathname)) rec.overSize = r.contentLength;
      return;
    }
    let buf = r.body || Buffer.alloc(0);
    rec.bytes = buf.length;
    if (r.truncated) { rec.truncated = true; rec.notes.push(`only the first ${Math.round(maxBytes / 1048576)} MB were read (size cap; the server sent no Content-Length)`); }
    if (buf[0] === 0x1f && buf[1] === 0x8b) {
      rec.gz = true;
      try { buf = gunzipSync(buf, { maxOutputLength: SITEMAP_MAX_BYTES + 1 }); }
      catch (e) {
        if (e && e.code === 'ERR_BUFFER_TOO_LARGE') { rec.overSize = SITEMAP_MAX_BYTES + 1; rec.notes.push('decompresses to more than 50 MB'); }
        else rec.error = r.truncated ? 'gzip truncated by the size cap' : `gzip error: ${e.message}`;
        return;
      }
    } else if (/\.gz$/i.test(u.pathname)) rec.notes.push('named .gz but served uncompressed');
    rec.uncompressedBytes = buf.length;
    if (buf.length > SITEMAP_MAX_BYTES) rec.overSize = buf.length;
    const parsed = parseSitemap(buf.toString('utf8'), item.url);
    // A capped read is incomplete, not invalid: keep what parsed, never call it broken.
    if (rec.truncated && (parsed.kind === 'invalid' || parsed.kind === 'html')) { rec.kind = 'partial'; return; }
    rec.kind = parsed.kind;
    rec.notes.push(...parsed.notes);
    if (parsed.kind === 'index') {
      rec.children = parsed.children.length;
      if (item.depth >= 1) rec.nestedIndex = true;
      for (const c of parsed.children) {
        if (item.depth < 2) queue.push({ url: c, via: `index ${item.url}`, depth: item.depth + 1 });
      }
      return;
    }
    rec.urlCount = parsed.entries.length;
    for (const e of parsed.entries) {
      const key = e.loc;
      const prev = urls.get(key);
      if (prev) { prev.files.push(item.url); if (!prev.lastmod && e.lastmod) prev.lastmod = e.lastmod; prev.alternates.push(...e.alternates); continue; }
      urls.set(key, { loc: e.loc, lastmod: e.lastmod, files: [item.url], alternates: e.alternates });
    }
  };

  let active = 0;
  const workers = Array.from({ length: Math.max(1, ctx.concurrency ?? 2) }, async () => {
    for (;;) {
      const item = queue.shift();
      if (!item) {
        if (active === 0) return;
        await new Promise((r) => setTimeout(r, 50));
        continue;
      }
      if (seen.has(item.url)) continue;
      if (seen.size >= maxFiles) { skippedFiles++; continue; }
      seen.add(item.url);
      active++;
      try { await one(item); } finally { active--; }
      await ctx.fetcher.rest();
    }
  });
  await Promise.all(workers);
  return { files, urls, skippedFiles, complete: skippedFiles === 0 && files.every((f) => !f.truncated && !f.error) };
}

/** lastmod hygiene across all sitemap URLs. */
export function lastmodStats(urls, now = Date.now()) {
  const all = [...urls.values()];
  const withLm = all.filter((u) => u.lastmod);
  const invalid = withLm.filter((u) => !W3C_DATE.test(u.lastmod));
  const future = withLm.filter((u) => W3C_DATE.test(u.lastmod) && Date.parse(u.lastmod.length === 4 ? `${u.lastmod}-01-01` : u.lastmod) > now + 2 * 86400000);
  const byDay = new Map();
  for (const u of withLm) byDay.set(u.lastmod.slice(0, 10), (byDay.get(u.lastmod.slice(0, 10)) || 0) + 1);
  const [topDay, topCount] = [...byDay].sort((a, b) => b[1] - a[1])[0] || [null, 0];
  return { total: all.length, missing: all.length - withLm.length, invalid, future, topDay, topCount, distinctDays: byDay.size };
}
