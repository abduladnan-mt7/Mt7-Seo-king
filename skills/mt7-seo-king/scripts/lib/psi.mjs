/**
 * lib/psi.mjs - optional PageSpeed Insights API v5 lookups for diagnose.mjs (--psi).
 * Node 18+, no dependencies, no API key: the keyless quota is small and shared, so a 429 ends
 * the lookups cleanly and the report says so. Field data (CrUX) is real-user data at the 75th
 * percentile; lab data is one synthetic Lighthouse run and is not what Google ranks on.
 * API: https://developers.google.com/speed/docs/insights/v5/get-started
 */

const ENDPOINT = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
const FIELD = { LARGEST_CONTENTFUL_PAINT_MS: 'LCP', INTERACTION_TO_NEXT_PAINT: 'INP', CUMULATIVE_LAYOUT_SHIFT_SCORE: 'CLS', FIRST_CONTENTFUL_PAINT_MS: 'FCP', EXPERIMENTAL_TIME_TO_FIRST_BYTE: 'TTFB' };

function fieldOf(le, scope) {
  if (!le || !le.metrics || !Object.keys(le.metrics).length) return null;
  const metrics = {};
  for (const [k, name] of Object.entries(FIELD)) {
    const m = le.metrics[k];
    if (!m) continue;
    const display = name === 'CLS' ? (m.percentile / 100).toFixed(2) : m.percentile >= 1000 ? `${(m.percentile / 1000).toFixed(1)} s` : `${m.percentile} ms`;
    metrics[name] = { p75: m.percentile, display, category: m.category };
  }
  return { scope, overall: le.overall_category || null, metrics };
}

export async function runPsi(urls, { ua, timeout = 90000, log = () => {} } = {}) {
  const results = [];
  for (const url of urls) {
    const api = `${ENDPOINT}?url=${encodeURIComponent(url)}&strategy=mobile&category=performance`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeout);
    log(`PageSpeed Insights: ${url}`);
    try {
      const res = await fetch(api, { signal: ctrl.signal, headers: { 'user-agent': ua } });
      const body = await res.json().catch(() => null);
      if (res.status === 429 || body?.error?.code === 429) { results.push({ url, error: 'PSI quota exhausted for keyless requests; remaining URLs skipped' }); break; }
      if (!res.ok) { results.push({ url, error: `PSI HTTP ${res.status}: ${String(body?.error?.message || '').slice(0, 140)}` }); continue; }
      const le = body.loadingExperience;
      const urlLevel = le && le.metrics && Object.keys(le.metrics).length && !le.origin_fallback;
      const field = urlLevel ? fieldOf(le, 'URL field data') : fieldOf(body.originLoadingExperience, 'origin field data (no URL-level data)');
      const lh = body.lighthouseResult;
      const lab = lh ? {
        score: lh.categories?.performance?.score != null ? Math.round(lh.categories.performance.score * 100) : null,
        lcp: lh.audits?.['largest-contentful-paint']?.displayValue ?? null,
        cls: lh.audits?.['cumulative-layout-shift']?.displayValue ?? null,
        tbt: lh.audits?.['total-blocking-time']?.displayValue ?? null,
      } : null;
      results.push({ url, field, lab });
    } catch (e) {
      results.push({ url, error: e?.name === 'AbortError' ? `PSI timed out after ${timeout / 1000} s` : `PSI request failed: ${e?.cause?.code || e?.message}` });
    } finally { clearTimeout(timer); }
    await new Promise((r) => setTimeout(r, 1500));
  }
  return { results };
}
