#!/usr/bin/env node
/**
 * google-updates.mjs - query the dated Google Search update ledger. Node 18+, no dependencies.
 *
 * Reads ../data/google-updates.json (every entry cites a Google-owned URL; third-party-only
 * claims sit apart in unverified[]). The ledger was compiled by AgriciDaniel/claude-seo (MIT);
 * this is an independent Node port with an --around mode added for traffic-drop attribution.
 *
 * Usage:
 *   node google-updates.mjs                          latest 10 entries
 *   node google-updates.mjs --since 2026-03          entries on/after yyyy, yyyy-mm or yyyy-mm-dd
 *   node google-updates.mjs --kind core --kind spam  filter by kind (repeatable)
 *   node google-updates.mjs --around 2026-08-16      ranking updates whose rollout is within
 *                                                    --window days (default 14) of a drop's first day,
 *                                                    plus Search Console data anomalies near it
 *   node google-updates.mjs --unverified             third-party claims awaiting primary confirmation
 *   add --json for machine output, --limit <n> to change the count
 *
 * Exit codes: 0 = ran, 2 = bad arguments or unreadable ledger.
 * The ledger is a snapshot: when last_verified is older than 30 days it warns you to check
 * status.search.google.com, because anything released since then is missing.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const LEDGER = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'google-updates.json');
const KINDS = ['core', 'spam', 'core+spam', 'policy', 'qrg', 'product', 'schema', 'cwv', 'discover', 'documentation'];
// Kinds that move rankings; documentation and product launches don't explain a drop on their own.
const RANKING_KINDS = ['core', 'spam', 'core+spam', 'discover', 'policy'];
const STALE_AFTER_DAYS = 30;
const STATUS_URL = 'https://status.search.google.com/';
const DAY = 86400000;

function parseArgs(argv) {
  const opts = { since: null, kinds: [], limit: 10, around: null, window: 14, unverified: false, json: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') opts.json = true;
    else if (a === '--unverified') opts.unverified = true;
    else if (a === '--since') opts.since = argv[++i] ?? null;
    else if (a === '--kind') opts.kinds.push(argv[++i]);
    // Explicit checks: "--window 0" (the drop's own day only) must not silently become 14.
    else if (a === '--limit') { const n = Number(argv[++i]); if (!Number.isInteger(n) || n < 1) throw new Error('--limit must be a whole number of 1 or more'); opts.limit = n; }
    else if (a === '--around') opts.around = argv[++i] ?? null;
    else if (a === '--window') { const n = Number(argv[++i]); if (!Number.isFinite(n) || n < 0) throw new Error('--window must be a number of days, 0 or more'); opts.window = n; }
    else if (a === '-h' || a === '--help') opts.help = true;
    else throw new Error(`unknown argument: ${a}`);
  }
  for (const k of opts.kinds) if (!KINDS.includes(k)) throw new Error(`--kind must be one of: ${KINDS.join(', ')}`);
  return opts;
}

// Dates are whole UTC days; parsing 'yyyy-mm-dd' as UTC keeps the arithmetic free of DST drift.
function toDay(s) {
  const m = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/.exec(String(s ?? ''));
  const t = m && Date.UTC(+m[1], (+m[2] || 1) - 1, +m[3] || 1);
  // Date.UTC rolls 2026-13-45 over into 2027; a round trip catches it.
  if (!m || (m[2] && new Date(t).getUTCMonth() + 1 !== +m[2]) || (m[3] && new Date(t).getUTCDate() !== +m[3])) {
    throw new Error(`not a date (want yyyy, yyyy-mm or yyyy-mm-dd): ${s}`);
  }
  return t;
}
const iso = (t) => new Date(t).toISOString().slice(0, 10);

function rolloutEnd(u) {
  if (u.end) return { end: toDay(u.end), known: true };
  if (u.rollout_days) return { end: toDay(u.date) + u.rollout_days * DAY, known: true };
  return { end: toDay(u.date), known: false };
}

function freshness(lastVerified, now = Date.now()) {
  let age;
  try { age = Math.floor((now - toDay(lastVerified)) / DAY); } catch { age = null; }
  const stale = age === null || age > STALE_AFTER_DAYS;
  return {
    age_days: age,
    stale,
    warning: stale
      ? `Ledger last verified ${age ?? '?'} days ago (${lastVerified}). Updates released since then are missing; check ${STATUS_URL} before attributing a recent change.`
      : null,
  };
}

function filterKinds(updates, kinds) {
  if (!kinds.length) return updates;
  const wanted = new Set(kinds);
  // A combined core+spam rollout is both, so asking for either one includes it.
  if (wanted.has('core') || wanted.has('spam')) wanted.add('core+spam');
  return updates.filter((u) => wanted.has(u.kind));
}

function around(updates, dropDay, windowDays) {
  const w = windowDays * DAY;
  const out = [];
  for (const u of updates) {
    const start = toDay(u.date);
    const { end, known } = rolloutEnd(u);
    if (dropDay < start - w || dropDay > end + w) continue;
    const days = Math.round(Math.abs(dropDay - (dropDay < start ? start : end)) / DAY);
    let relation;
    if (dropDay < start) relation = `drop began ${days} day(s) BEFORE this rollout started`;
    else if (dropDay <= end) relation = `drop began on day ${Math.round((dropDay - start) / DAY) + 1} of the rollout`;
    else relation = known ? `drop began ${days} day(s) AFTER this rollout completed` : `drop began ${days} day(s) after the announcement (rollout end not in the ledger)`;
    out.push({ ...u, rollout: `${u.date} -> ${known ? iso(end) : '?'}`, relation });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

function main() {
  let opts, data;
  try {
    opts = parseArgs(process.argv.slice(2));
    if (opts.help) {
      console.log('Usage: node google-updates.mjs [--since yyyy[-mm[-dd]]] [--kind k]... [--limit n] [--around yyyy-mm-dd [--window days]] [--unverified] [--json]');
      return;
    }
    data = JSON.parse(readFileSync(LEDGER, 'utf8'));
  } catch (e) {
    console.error(`google-updates: ${e.message}`);
    process.exitCode = 2;
    return;
  }

  const fresh = freshness(data.last_verified);
  if (fresh.stale && !opts.json) console.error(`WARNING: ${fresh.warning}`);
  const header = { source_of_truth: data.source_of_truth, last_verified: data.last_verified, freshness: fresh };

  if (opts.unverified) {
    const items = data.unverified ?? [];
    if (opts.json) return void console.log(JSON.stringify({ ...header, unverified: items }, null, 2));
    console.log(`Source of truth: ${data.source_of_truth}\nLast verified:   ${data.last_verified}\n`);
    if (!items.length) console.log('(no unverified third-party claims tracked)');
    for (const u of items) {
      console.log(`  ${u.date}: ${u.claim}\n    status: ${u.status}`);
      for (const s of u.third_party_sources ?? []) console.log(`    third-party: ${s}`);
      console.log(`    primary check: ${u.primary_source_check}\n`);
    }
    return;
  }

  if (opts.around) {
    let dropDay;
    try { dropDay = toDay(opts.around); } catch (e) { console.error(`google-updates: ${e.message}`); process.exitCode = 2; return; }
    const pool = filterKinds(data.updates, opts.kinds.length ? opts.kinds : RANKING_KINDS);
    const hits = around(pool, dropDay, opts.window);
    // A Search Console logging error near the date can fake a drop that never happened in Search.
    const w = opts.window * DAY;
    const anomalies = (data.data_anomalies ?? []).filter((a) => dropDay >= toDay(a.start) - w && dropDay <= toDay(a.end) + w);
    const note = 'Correlation, not cause. Rule out site changes, tracking breaks, manual actions, security issues and host/canonical moves first (Phase 0). A drop that starts days before a rollout began is unlikely to be that rollout; look for what changed earlier.';
    if (opts.json) return void console.log(JSON.stringify({ ...header, around: opts.around, window_days: opts.window, count: hits.length, updates: hits, data_anomalies: anomalies, note }, null, 2));
    console.log(`Ranking updates within ${opts.window} days of ${opts.around} (ledger verified ${data.last_verified}):\n`);
    if (!hits.length) console.log('  none in the ledger - see the note below, then check the dashboard for anything newer.\n');
    for (const u of hits) {
      console.log(`  ${u.rollout}  [${u.kind}]  ${u.name}\n      ${u.relation}\n      source: ${u.source}\n      notes:  ${u.notes}\n`);
    }
    if (anomalies.length) {
      console.log(`Search Console data anomalies near ${opts.around} (reporting errors, not ranking changes):
`);
      for (const a of anomalies) console.log(`  ${a.start} -> ${a.end}  ${a.report}: ${a.metrics}
      ${a.notes}
      source: ${a.source}
`);
    }
    console.log(note);
    return;
  }

  let list = filterKinds(data.updates, opts.kinds);
  if (opts.since) {
    let since;
    try { since = toDay(opts.since); } catch (e) { console.error(`google-updates: ${e.message}`); process.exitCode = 2; return; }
    list = list.filter((u) => toDay(u.date) >= since);
  }
  list = [...list].sort((a, b) => b.date.localeCompare(a.date)).slice(0, opts.limit);

  if (opts.json) return void console.log(JSON.stringify({ ...header, filter: { since: opts.since, kinds: opts.kinds }, count: list.length, updates: list }, null, 2));
  console.log(`Source of truth: ${data.source_of_truth}\nLast verified:   ${data.last_verified}`);
  console.log(`Showing ${list.length} updates${opts.since ? ` since ${opts.since}` : ''}${opts.kinds.length ? ` kind=${opts.kinds.join('/')}` : ''}\n`);
  for (const u of list) {
    const { end, known } = rolloutEnd(u);
    const span = known && iso(end) !== u.date ? ` -> ${iso(end)}` : '';
    console.log(`  ${u.date}${span}  [${u.kind.padEnd(13)}]  ${u.name}\n      source: ${u.source}\n      notes:  ${u.notes}\n`);
  }
}

main();
