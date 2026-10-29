/**
 * lib/http.mjs - a polite GET-only fetcher for diagnose.mjs. Node 18+, no dependencies.
 *
 * - GET only, never follows redirects by itself (each hop is recorded by the caller)
 * - one honest user agent; no Accept-Language (Googlebot sends none either)
 * - bodies are streamed with a byte cap; non-HTML bodies can be skipped after the headers
 * - time-to-headers (TTFB as seen from this machine) and total time per request
 * - 429/503 honour Retry-After (capped); repeated pushback raises the delay for every worker
 */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// The redirect codes Google documents following; 304 means "not modified", 300/305/306 are not followed.
export const REDIRECT_CODES = [301, 302, 303, 307, 308];

function retryAfterMs(value) {
  if (!value) return null;
  const s = Number(value);
  if (Number.isFinite(s)) return Math.max(0, s * 1000);
  const t = Date.parse(value);
  return Number.isFinite(t) ? Math.max(0, t - Date.now()) : null;
}

function sniffCharset(buf, contentType) {
  const fromHeader = /charset\s*=\s*["']?([\w.:-]+)/i.exec(contentType || '');
  if (fromHeader) return fromHeader[1].toLowerCase();
  const head = buf.subarray(0, 2048).toString('latin1');
  const m = /<meta[^>]+charset\s*=\s*["']?([\w.:-]+)/i.exec(head);
  return m ? m[1].toLowerCase() : 'utf-8';
}

export function decodeBody(buf, contentType) {
  const label = sniffCharset(buf, contentType);
  try { return new TextDecoder(label).decode(buf); } catch { return new TextDecoder('utf-8').decode(buf); }
}

export class Fetcher {
  constructor({ ua, timeout = 15000, delay = 500, maxDelay = 8000, log = () => {} } = {}) {
    this.ua = ua;
    this.timeout = timeout;
    this.baseDelay = delay;
    this.delay = delay;
    this.maxDelay = maxDelay;
    this.pauseUntil = 0;
    this.requests = 0;
    this.byStatus = new Map();
    this.pushback = []; // recent outcomes: true when 429/503/timeout/network error
    this.okStreak = 0;
    this.stopped = null;
    this.log = log;
  }

  /** Wait for any global pause (Retry-After / back-off) before a request. */
  async gate() {
    while (Date.now() < this.pauseUntil) await sleep(Math.min(1000, this.pauseUntil - Date.now()));
  }

  /** The per-worker pause between requests, raised when the server pushes back. */
  async rest() { await sleep(this.delay); }

  recentPushback(window = 10) {
    const last = this.pushback.slice(-window);
    return { count: last.filter(Boolean).length, of: last.length, consecutive: (() => { let n = 0; for (let i = this.pushback.length - 1; i >= 0 && this.pushback[i]; i--) n++; return n; })() };
  }

  /**
   * GET one URL without following redirects.
   * opts.maxBytes: stop reading after this many bytes (truncated=true)
   * opts.body: 'auto' (read HTML/XML/text, skip others), 'always', 'never'
   */
  async get(url, { maxBytes = 4 * 1048576, body = 'auto', skipIfLargerThan = null, identity = false, accept = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' } = {}) {
    if (this.stopped) return { url, status: null, error: `not fetched: ${this.stopped}`, skipped: true };
    await this.gate();
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this.timeout);
    const t0 = performance.now();
    const out = { url, status: null, headers: {}, location: null, ttfb: null, ms: null, bytes: 0, truncated: false, body: null, error: null, contentType: '' };
    this.requests++;
    try {
      // identity: ask for an uncompressed body so Content-Length is the real (uncompressed) size.
      const headers = identity ? { 'user-agent': this.ua, accept, 'accept-encoding': 'identity' } : { 'user-agent': this.ua, accept };
      const res = await fetch(url, { redirect: 'manual', signal: ctrl.signal, headers });
      out.ttfb = Math.round(performance.now() - t0);
      out.status = res.status;
      res.headers.forEach((v, k) => { out.headers[k] = v; });
      out.location = res.headers.get('location');
      out.contentType = (res.headers.get('content-type') || '').toLowerCase();
      const textual = !out.contentType || /html|xml|text\/plain|json|gzip|x-gzip|octet-stream/.test(out.contentType);
      const declared = Number(res.headers.get('content-length'));
      if (Number.isFinite(declared) && declared > 0) out.contentLength = declared;
      const isRedirect = res.status >= 300 && res.status < 400;
      // 'html': page fetches read only HTML bodies, so a linked PDF or installer is never downloaded.
      let read = body === 'always' || (body === 'auto' && textual && !isRedirect) || (body === 'html' && (!out.contentType || /html/.test(out.contentType)) && !isRedirect);
      if (read && skipIfLargerThan && out.contentLength > skipIfLargerThan) { read = false; out.skippedLarge = true; }
      if (read && res.body) {
        const reader = res.body.getReader();
        const chunks = [];
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          out.bytes += value.length;
          if (out.bytes > maxBytes) {
            out.truncated = true;
            chunks.push(value.subarray(0, Math.max(0, value.length - (out.bytes - maxBytes))));
            try { await reader.cancel(); } catch { /* already closed */ }
            break;
          }
          chunks.push(value);
        }
        out.body = Buffer.concat(chunks);
      } else if (res.body) {
        try { await res.body.cancel(); } catch { /* ignore */ }
      }
    } catch (e) {
      const cause = e && e.cause;
      const msg = e && e.name === 'AbortError' ? 'timeout' : (cause && (cause.code || cause.message)) || (e && e.message) || String(e);
      // After the headers arrived the server did answer: a slow or broken body is not a server error.
      if (out.status != null) { out.bodyError = msg; out.truncated = true; } else out.error = msg;
      if (out.ttfb == null) out.ttfb = null;
    } finally {
      clearTimeout(timer);
      out.ms = Math.round(performance.now() - t0);
    }
    this.byStatus.set(out.status ?? out.error, (this.byStatus.get(out.status ?? out.error) || 0) + 1);
    const pushed = out.status === 429 || out.status === 503 || out.error === 'timeout' || (out.error && out.status == null);
    this.pushback.push(Boolean(pushed));
    // Recover slowly: after 10 healthy responses in a row, halve a raised delay (never below the base).
    if (pushed) this.okStreak = 0;
    else if (++this.okStreak >= 10 && this.delay > this.baseDelay) { this.delay = Math.max(this.baseDelay, Math.round(this.delay / 2)); this.okStreak = 0; }
    if (this.pushback.length > 50) this.pushback.shift();
    if (out.status === 429 || out.status === 503) {
      const ra = retryAfterMs(out.headers['retry-after']);
      if (ra != null && ra > 120000) {
        this.stopped = `server asked to retry after ${Math.round(ra / 1000)} s (Retry-After)`;
      } else {
        const wait = Math.max(ra ?? 0, 5000);
        this.pauseUntil = Math.max(this.pauseUntil, Date.now() + wait);
        this.delay = Math.min(this.maxDelay, this.delay * 2);
        this.log(`server returned ${out.status} for ${url}; pausing ${Math.round(wait / 1000)} s, delay now ${this.delay} ms`);
      }
    }
    return out;
  }

  /** GET following up to `hops` redirects (robots.txt and sitemaps); returns the final response plus the chain. */
  async getFollow(url, opts = {}, hops = 5) {
    const chain = [];
    let cur = url;
    for (let i = 0; i <= hops; i++) {
      const r = await this.get(cur, opts);
      chain.push({ url: cur, status: r.status, error: r.error });
      if (REDIRECT_CODES.includes(r.status) && r.location) {
        try { cur = new URL(r.location, cur).href; } catch { return { ...r, chain }; }
        continue;
      }
      return { ...r, chain, finalUrl: cur };
    }
    return { url, status: null, error: `more than ${hops} redirects`, chain };
  }
}

export { sleep };
