/**
 * lib/robots.mjs - robots.txt parsing and URL matching with the semantics Google documents
 * (RFC 9309 plus Google's notes). Node 18+, no dependencies. Used by diagnose.mjs.
 *
 *  - groups: one or more user-agent lines followed by rules; a user-agent line after a rule
 *    starts a new group; groups naming the same agent are merged
 *  - a crawler obeys the group(s) that name its product token (case-insensitive), else '*'
 *  - the longest matching rule wins; on a tie, allow wins; '*' and a trailing '$' are wildcards
 *  - only the first 500 KiB are read; /robots.txt itself is always allowed
 * Source: https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt
 */

export const GOOGLE_MAX_ROBOTS_BYTES = 500 * 1024;
export const GOOGLEBOT = 'googlebot';

// Directives Google documents as unsupported (noindex/nofollow in robots.txt since 2019-09-01)
// plus other engines' extensions. Recorded so a report can say "this line does nothing in Google".
const NOT_GOOGLE = new Set(['noindex', 'nofollow', 'crawl-delay', 'host', 'clean-param', 'request-rate', 'visit-time']);

const UNRESERVED = /[A-Za-z0-9\-._~]/;

// Percent-encode non-ASCII, upper-case escapes, and decode escapes of unreserved characters,
// so 'café', 'caf%c3%a9' and 'caf%C3%A9' compare equal and '%7E' equals '~' (RFC 9309 2.2.2).
export function normalisePath(s) {
  let out = '';
  for (const ch of String(s)) {
    const cp = ch.codePointAt(0);
    out += cp > 0x7e || cp < 0x21 ? encodeURIComponent(ch) : ch;
  }
  return out.replace(/%([0-9a-fA-F]{2})/g, (m, h) => {
    const c = String.fromCharCode(parseInt(h, 16));
    return UNRESERVED.test(c) ? c : `%${h.toUpperCase()}`;
  });
}

function agentToken(value) {
  const v = value.trim();
  if (v === '*') return '*';
  const m = /^[A-Za-z_-]+/.exec(v);
  return (m ? m[0] : v).toLowerCase();
}

function compileRule(pattern) {
  let p = normalisePath(pattern);
  const anchored = p.endsWith('$');
  if (anchored) p = p.slice(0, -1);
  const body = p.split('*').map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*');
  return new RegExp(`^${body}${anchored ? '$' : ''}`);
}

/** Parse robots.txt text. Never throws; malformed lines are collected in `invalid`. */
export function parseRobots(text) {
  const raw = String(text ?? '').replace(/^﻿/, '');
  const bytes = Buffer.byteLength(raw, 'utf8');
  const body = bytes > GOOGLE_MAX_ROBOTS_BYTES ? Buffer.from(raw, 'utf8').subarray(0, GOOGLE_MAX_ROBOTS_BYTES).toString('utf8') : raw;
  const out = { groups: [], sitemaps: [], unsupported: [], invalid: [], bytes, truncated: bytes > GOOGLE_MAX_ROBOTS_BYTES, looksLikeHtml: /<(!doctype|html|head|body)\b/i.test(body.slice(0, 2000)) };
  let cur = null;
  const lines = body.split(/\r\n|\r|\n/);
  lines.forEach((line0, i) => {
    const line = line0.replace(/#.*$/, '').trim();
    if (!line) return;
    const m = /^([A-Za-z][A-Za-z_-]*)\s*:\s*(.*)$/.exec(line);
    if (!m) { out.invalid.push({ line: i + 1, text: line.slice(0, 120) }); return; }
    const key = m[1].toLowerCase();
    const value = m[2].trim();
    if (key === 'user-agent' || key === 'useragent' || key === 'user agent') {
      if (!cur || cur.ruleLines > 0) out.groups.push((cur = { agents: [], rules: [], ruleLines: 0, crawlDelay: null, line: i + 1 }));
      cur.agents.push(agentToken(value));
      return;
    }
    if (key === 'allow' || key === 'disallow') {
      if (!cur) { out.invalid.push({ line: i + 1, text: `${line.slice(0, 100)} (rule before any user-agent line)` }); return; }
      cur.ruleLines++;
      if (!value) return; // an empty Disallow allows everything; an empty Allow does nothing
      cur.rules.push({ allow: key === 'allow', pattern: value, len: normalisePath(value).length, re: compileRule(value), line: i + 1 });
      return;
    }
    if (key === 'sitemap') { out.sitemaps.push({ value, absolute: /^https?:\/\//i.test(value), line: i + 1 }); return; }
    if (key === 'crawl-delay' && cur) { const n = Number(value); if (Number.isFinite(n) && n >= 0) cur.crawlDelay = n; }
    if (NOT_GOOGLE.has(key)) { out.unsupported.push({ directive: key, value: value.slice(0, 120), line: i + 1 }); return; }
    out.invalid.push({ line: i + 1, text: line.slice(0, 120) });
  });
  return out;
}

/**
 * The rules one crawler obeys: every group naming one of its tokens (first token that matches
 * any group wins), merged; else every '*' group, merged; else nothing (all allowed).
 */
export function rulesFor(robots, tokens) {
  const list = (Array.isArray(tokens) ? tokens : [tokens]).map((t) => t.toLowerCase());
  for (const t of list) {
    const groups = robots.groups.filter((g) => g.agents.includes(t));
    if (groups.length) return { agent: t, rules: groups.flatMap((g) => g.rules), crawlDelay: groups.map((g) => g.crawlDelay).find((d) => d != null) ?? null };
  }
  const star = robots.groups.filter((g) => g.agents.includes('*'));
  if (star.length) return { agent: '*', rules: star.flatMap((g) => g.rules), crawlDelay: star.map((g) => g.crawlDelay).find((d) => d != null) ?? null };
  return { agent: null, rules: [], crawlDelay: null };
}

/** Is `url` allowed for the rule set from rulesFor()? Returns { allowed, rule }. */
export function isAllowed(ruleSet, url) {
  let u;
  try { u = new URL(url); } catch { return { allowed: true, rule: null }; }
  if (u.pathname === '/robots.txt') return { allowed: true, rule: null };
  const path = normalisePath(u.pathname + u.search);
  let best = null;
  for (const r of ruleSet.rules) {
    if (!r.re.test(path)) continue;
    if (!best || r.len > best.len || (r.len === best.len && r.allow && !best.allow)) best = r;
  }
  return { allowed: !best || best.allow, rule: best ? `${best.allow ? 'Allow' : 'Disallow'}: ${best.pattern} (line ${best.line})` : null };
}

/** True when the rule set blocks the whole site (the home page is disallowed). */
export function blocksEverything(ruleSet, origin) {
  return !isAllowed(ruleSet, `${origin}/`).allowed;
}
