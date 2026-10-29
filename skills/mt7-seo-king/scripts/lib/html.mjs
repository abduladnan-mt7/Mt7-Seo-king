/**
 * lib/html.mjs - raw-HTML extraction for diagnose.mjs. Node 18+, no dependencies.
 *
 * A small quote-aware tokenizer (not a full HTML5 parser) that keeps track of where the <head>
 * really ends: an element that is not allowed in <head> (a <div>, <img>, <iframe>, stray text)
 * ends it early, exactly as a browser - and Google's renderer - would, so a canonical or hreflang
 * written after it lands in <body>. It extracts what the checks need: title, meta, canonical,
 * robots, hreflang, links, resources, JSON-LD, headings, text blocks and JavaScript signals.
 * Limits: no JavaScript is executed; whitespace word counting undercounts CJK text.
 */

const NAMED = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', hellip: '…',
  copy: '©', reg: '®', trade: '™', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”',
  laquo: '«', raquo: '»', middot: '·', bull: '•', times: '×', deg: '°', eacute: 'é',
  euro: '€', pound: '£', yen: '¥', rupee: '₹', shy: '', zwnj: '', zwj: '', thinsp: ' ', ensp: ' ', emsp: ' ',
};

export function decodeEntities(s) {
  if (!s || s.indexOf('&') === -1) return s || '';
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);?/gi, (m, e) => {
    if (e[0] === '#') {
      const code = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : m;
    }
    const k = e.toLowerCase();
    return k in NAMED ? NAMED[k] : m;
  });
}

export const collapse = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
export const countWords = (s) => (s ? s.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length : 0);

// Elements the HTML parser keeps inside <head>; any other start tag (or text) ends it.
const HEAD_OK = new Set(['html', 'head', 'base', 'basefont', 'bgsound', 'link', 'meta', 'title', 'noscript', 'noframes', 'style', 'script', 'template']);
// Raw-text elements: their content is not markup.
const RAW = new Set(['script', 'style', 'textarea', 'title', 'xmp', 'iframe', 'noembed', 'noframes', 'noscript', 'plaintext']);
const BLOCK = new Set(['address', 'article', 'aside', 'blockquote', 'body', 'br', 'dd', 'details', 'dialog', 'div', 'dl', 'dt', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'li', 'main', 'nav', 'ol', 'p', 'pre', 'section', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'ul', 'summary', 'option', 'caption', 'legend', 'menu', 'center', 'a', 'button', 'label']);
const TRACK = ['nav', 'header', 'footer', 'aside', 'a', 'h1', 'svg', 'select', 'template', 'main', 'article', 'button', 'form'];
const SHELL_IDS = new Set(['root', 'app', '__next', '__nuxt', 'app-root', '___gatsby', 'svelte', 'q-app']);

const isWs = (c) => c === 32 || c === 9 || c === 10 || c === 13 || c === 12;
const closeRe = new Map();

function readStartTag(html, lt) {
  const n = html.length;
  let i = lt + 1;
  let j = i;
  while (j < n && /[A-Za-z0-9:_-]/.test(html[j])) j++;
  const name = html.slice(i, j).toLowerCase();
  const attrs = {};
  i = j;
  while (i < n) {
    while (i < n && (isWs(html.charCodeAt(i)) || html[i] === '/')) {
      if (html[i] === '/' && html[i + 1] === '>') return { name, attrs, end: i + 2, selfClosing: true };
      i++;
    }
    if (i >= n) break;
    if (html[i] === '>') return { name, attrs, end: i + 1, selfClosing: false };
    let k = i;
    while (k < n && !isWs(html.charCodeAt(k)) && html[k] !== '/' && html[k] !== '>' && html[k] !== '=') k++;
    if (k === i) k++; // a stray character; step over it
    const an = html.slice(i, k).toLowerCase();
    i = k;
    while (i < n && isWs(html.charCodeAt(i))) i++;
    let val = '';
    if (html[i] === '=') {
      i++;
      while (i < n && isWs(html.charCodeAt(i))) i++;
      const q = html[i];
      if (q === '"' || q === "'") {
        const e = html.indexOf(q, i + 1);
        val = html.slice(i + 1, e === -1 ? n : e);
        i = e === -1 ? n : e + 1;
      } else {
        let e = i;
        while (e < n && !isWs(html.charCodeAt(e)) && html[e] !== '>') e++;
        val = html.slice(i, e);
        i = e;
      }
    }
    if (an && !(an in attrs)) attrs[an] = decodeEntities(val);
  }
  return { name, attrs, end: n, selfClosing: false };
}

function findClose(html, from, name) {
  let re = closeRe.get(name);
  if (!re) closeRe.set(name, (re = new RegExp(`</${name}[\\s/>]`, 'gi')));
  re.lastIndex = from;
  const m = re.exec(html);
  return m ? m.index : html.length;
}

/** Tokens: {t:'start', name, attrs, raw?, pos} | {t:'end', name, pos} | {t:'text', v, pos} */
export function* tokenize(html) {
  const n = html.length;
  let i = 0;
  const endRe = /<\/([A-Za-z][A-Za-z0-9:_-]*)[^>]*>/y;
  while (i < n) {
    const lt = html.indexOf('<', i);
    if (lt === -1) { yield { t: 'text', v: html.slice(i), pos: i }; return; }
    if (lt > i) yield { t: 'text', v: html.slice(i, lt), pos: i };
    const c = html[lt + 1] || '';
    if (html.startsWith('<!--', lt)) { const e = html.indexOf('-->', lt + 4); i = e === -1 ? n : e + 3; continue; }
    if (c === '!' || c === '?') { const e = html.indexOf('>', lt + 2); i = e === -1 ? n : e + 1; continue; }
    if (c === '/') {
      endRe.lastIndex = lt;
      const m = endRe.exec(html);
      if (m) { yield { t: 'end', name: m[1].toLowerCase(), pos: lt }; i = lt + m[0].length; continue; }
      const e = html.indexOf('>', lt + 2);
      i = e === -1 ? n : e + 1;
      continue;
    }
    if (/[A-Za-z]/.test(c)) {
      const tag = readStartTag(html, lt);
      if (RAW.has(tag.name) && !tag.selfClosing) {
        const close = findClose(html, tag.end, tag.name);
        yield { t: 'start', name: tag.name, attrs: tag.attrs, raw: html.slice(tag.end, close), pos: lt };
        yield { t: 'end', name: tag.name, pos: close };
        const gt = html.indexOf('>', close);
        i = gt === -1 ? n : gt + 1;
        continue;
      }
      yield { t: 'start', name: tag.name, attrs: tag.attrs, selfClosing: tag.selfClosing, pos: lt };
      i = tag.end;
      continue;
    }
    yield { t: 'text', v: '<', pos: lt };
    i = lt + 1;
  }
}

export function resolveUrl(href, base) {
  if (href == null) return null;
  // Browsers strip leading/trailing ASCII whitespace and drop tabs/newlines inside URLs.
  const h = String(href).replace(/[\t\n\r]/g, '').trim();
  if (!h || /^(javascript|mailto|tel|data|sms|fax|callto|about|blob|file|ftp):/i.test(h)) return null;
  try {
    const u = new URL(h, base);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    // Cloudflare's email obfuscation: its script turns these into mailto: links, so they are not pages.
    if (u.pathname.startsWith('/cdn-cgi/l/email-protection')) return null;
    return u;
  } catch { return null; }
}

/** Normalised key for a URL: no fragment, upper-case percent escapes, '/' for an empty path. */
export function urlKey(u) {
  try {
    const x = u instanceof URL ? new URL(u.href) : new URL(u);
    x.hash = '';
    return x.href.replace(/%[0-9a-f]{2}/gi, (m) => m.toUpperCase());
  } catch { return null; }
}

const relTokens = (v) => String(v || '').toLowerCase().split(/[\s,]+/).filter(Boolean);

function parseRefresh(content) {
  const m = /^\s*(\d+(?:\.\d+)?)?\s*(?:[;,]\s*)?(?:url\s*=\s*)?(['"]?)(.*?)\2\s*$/i.exec(String(content || ''));
  if (!m) return null;
  const delay = m[1] == null ? 0 : Number(m[1]);
  const target = (m[3] || '').trim();
  return { delay, target: target || null };
}

/**
 * Analyse one HTML document. `pageUrl` is the URL it was fetched from.
 * Returns plain data; cross-page decisions (boilerplate, duplicates) happen later.
 */
export function extractPage(html, pageUrl) {
  const out = {
    lang: null, titles: [], bodyTitles: [], metas: [], canonicals: [], hreflang: [], robotsMeta: [], base: null,
    metaRefresh: null, h1: [], h1Count: 0, links: [], anchorsWithoutHref: 0, resources: [], images: { total: 0, missingAlt: 0, emptyAlt: 0, sample: [] },
    jsonld: [], microdata: 0, scripts: { total: 0, external: 0, inlineBytes: 0, jsonLdBytes: 0 }, iframes: 0, headBreak: null, displacedHeadTags: [],
    blocks: [], visibleWords: 0, textBytes: 0, noscriptJs: false, appShell: false, frameworks: new Set(), forms: [],
  };
  const depth = Object.fromEntries(TRACK.map((t) => [t, 0]));
  let phase = 'start'; // start -> head -> afterhead -> body
  let explicitHead = false;
  let headClosed = false;
  let buf = [];
  let bufCtx = null;
  let curLink = null;
  let curH1 = null;
  let shellCandidate = null;
  let baseUrl = pageUrl;

  const ctxNow = () => ({ boiler: depth.nav + depth.footer + depth.aside > 0, inLink: depth.a > 0 });
  const flush = () => {
    if (!buf.length) return;
    const text = collapse(buf.join(' '));
    buf = [];
    if (!text) return;
    out.blocks.push({ text, words: countWords(text), boiler: bufCtx?.boiler || false, inLink: bufCtx?.inLink || false });
  };
  const enterBody = (why, pos) => {
    if (phase === 'body') return;
    if (phase === 'head' && explicitHead && !headClosed) out.headBreak = { by: why, pos };
    phase = 'body';
  };
  const inHeadNow = () => phase !== 'body';

  for (const tok of tokenize(html)) {
    if (tok.t === 'text') {
      const v = tok.v;
      if (shellCandidate && /S/.test(v)) shellCandidate = null;
      if (phase !== 'body') {
        if (/\S/.test(v)) enterBody('text', tok.pos);
        else continue;
      }
      if (depth.svg || depth.select || depth.template) continue;
      const text = decodeEntities(v);
      if (!buf.length) bufCtx = ctxNow();
      buf.push(text);
      if (curLink) curLink.text += text;
      if (curH1) curH1.text += text;
      continue;
    }
    const name = tok.name;
    if (tok.t === 'end') {
      if (name === 'head') { headClosed = true; if (phase === 'head' || phase === 'start') phase = 'afterhead'; continue; }
      if (BLOCK.has(name)) flush();
      if (name in depth && depth[name] > 0) depth[name]--;
      if (name === 'a' && curLink) { curLink.text = collapse(curLink.text); curLink = null; }
      if (name === 'h1' && curH1) { out.h1.push(collapse(curH1.text)); curH1 = null; }
      if (shellCandidate && shellCandidate.name === name && shellCandidate.empty) out.appShell = true;
      shellCandidate = null;
      continue;
    }
    // start tag
    const a = tok.attrs;
    if (shellCandidate) shellCandidate = null;
    if (name === 'html') { if (a.lang != null && out.lang == null) out.lang = a.lang.trim(); continue; }
    if (name === 'head') { if (phase === 'start') { phase = 'head'; explicitHead = true; } continue; }
    if (name === 'body') { enterBody('body', tok.pos); continue; }
    if (phase !== 'body') {
      if (HEAD_OK.has(name)) { if (phase === 'start') phase = 'head'; }
      else enterBody(`<${name}>`, tok.pos);
    }
    const inHead = inHeadNow();
    if (phase === 'body' && out.headBreak && !headClosed && ['link', 'meta', 'title', 'base'].includes(name)) {
      // A head-only tag the author wrote inside <head>, but after the element that ended it.
      const rel = relTokens(a.rel);
      // Only these two are head-only for Google (meta robots in <body> is still honoured).
      if (name === 'link' && (rel.includes('canonical') || (rel.includes('alternate') && a.hreflang))) {
        out.displacedHeadTags.push(`link rel=${a.rel}${a.hreflang ? ` hreflang=${a.hreflang}` : ''}`);
      }
    }
    if (BLOCK.has(name)) flush();
    if (name in depth && !tok.selfClosing && !['br'].includes(name)) depth[name]++;

    switch (name) {
      case 'title':
        if (inHead) out.titles.push(collapse(decodeEntities(tok.raw || '')));
        else if (!depth.svg) out.bodyTitles.push(collapse(decodeEntities(tok.raw || '')));
        break;
      case 'base':
        if (out.base == null && a.href) { const u = resolveUrl(a.href, pageUrl); if (u) { out.base = u.href; baseUrl = u.href; } }
        break;
      case 'meta': {
        const m = { name: (a.name || '').toLowerCase(), property: (a.property || '').toLowerCase(), httpEquiv: (a['http-equiv'] || '').toLowerCase(), content: a.content ?? '', charset: a.charset, inHead };
        out.metas.push(m);
        if (m.name === 'robots' || m.name === 'googlebot' || m.name === 'googlebot-news') out.robotsMeta.push({ name: m.name, content: m.content, inHead });
        if (m.httpEquiv === 'refresh' && !out.metaRefresh) { const r = parseRefresh(m.content); if (r) out.metaRefresh = { ...r, source: 'meta' }; }
        break;
      }
      case 'link': {
        const rel = relTokens(a.rel);
        if (rel.includes('canonical')) out.canonicals.push({ href: a.href ?? '', inHead, source: 'html' });
        if (rel.includes('alternate') && a.hreflang != null) out.hreflang.push({ lang: a.hreflang, href: a.href ?? '', inHead, source: 'html' });
        if (rel.includes('stylesheet') && a.href) out.resources.push({ kind: 'css', href: a.href });
        else if (rel.includes('preload') || rel.includes('modulepreload')) { if (a.href && /^(script|style)$/i.test(a.as || (rel.includes('modulepreload') ? 'script' : ''))) out.resources.push({ kind: /style/i.test(a.as || '') ? 'css' : 'js', href: a.href, preload: true }); }
        else if (rel.includes('icon') && a.href) out.resources.push({ kind: 'icon', href: a.href });
        break;
      }
      case 'script': {
        out.scripts.total++;
        const type = (a.type || '').toLowerCase().trim();
        if (a.id === '__NEXT_DATA__') out.frameworks.add('next-pages');
        if (type === 'application/ld+json') { out.jsonld.push(tok.raw || ''); out.scripts.jsonLdBytes += (tok.raw || '').length; break; }
        if (a.src) { out.scripts.external++; out.resources.push({ kind: 'js', href: a.src }); }
        else {
          const body = tok.raw || '';
          if (!/^(application|text)\/(json|template|x-template)|^text\/(html|plain)$/.test(type)) out.scripts.inlineBytes += body.length;
          if (body.includes('self.__next_f')) out.frameworks.add('next-app');
          if (body.includes('window.__NUXT__')) out.frameworks.add('nuxt');
        }
        break;
      }
      case 'noscript':
        if (/(enable|requires?|turn on|need)\s+(your\s+)?javascript|javascript\s+(is\s+)?(required|disabled)/i.test(tok.raw || '')) out.noscriptJs = true;
        break;
      case 'iframe':
        out.iframes++;
        if (a.src) out.resources.push({ kind: 'iframe', href: a.src });
        break;
      case 'a':
      case 'area':
        if (a.href != null && a.href.trim() !== '') {
          const link = { href: a.href, rel: relTokens(a.rel), text: '', boiler: depth.nav + depth.footer + depth.aside > 0, tag: name };
          out.links.push(link);
          if (name === 'a' && !tok.selfClosing) curLink = link;
        } else if (name === 'a') {
          out.anchorsWithoutHref++;
          if (!tok.selfClosing) curLink = null;
        }
        break;
      case 'img': {
        out.images.total++;
        if (!('alt' in a)) { out.images.missingAlt++; if (out.images.sample.length < 5) out.images.sample.push(a.src || a['data-src'] || '?'); }
        else if (!a.alt.trim()) out.images.emptyAlt++;
        else {
          if (curLink) curLink.text += ` ${a.alt}`;
          if (curH1) curH1.text += ` ${a.alt}`;
        }
        if (a.src) out.resources.push({ kind: 'img', href: a.src });
        if (a.srcset) for (const part of a.srcset.split(',')) { const s = part.trim().split(/\s+/)[0]; if (s) out.resources.push({ kind: 'img', href: s }); }
        break;
      }
      case 'source': case 'video': case 'audio': case 'track':
        if (a.src) out.resources.push({ kind: 'media', href: a.src });
        if (a.srcset) for (const part of a.srcset.split(',')) { const s = part.trim().split(/\s+/)[0]; if (s) out.resources.push({ kind: 'img', href: s }); }
        if (a.poster) out.resources.push({ kind: 'img', href: a.poster });
        break;
      case 'embed':
        if (a.src) out.resources.push({ kind: 'object', href: a.src });
        break;
      case 'object':
        if (a.data) out.resources.push({ kind: 'object', href: a.data });
        break;
      case 'form':
        out.forms.push({ action: a.action ?? '', method: (a.method || 'get').toLowerCase() });
        break;
      case 'h1':
        out.h1Count++;
        curH1 = { text: '' };
        break;
      default:
        break;
    }
    if (a.itemtype) out.microdata++;
    if (a['ng-version'] != null) out.frameworks.add('angular');
    if (a['data-reactroot'] != null) out.frameworks.add('react');
    if ((name === 'div' || name === 'main' || name === 'app-root') && (SHELL_IDS.has((a.id || '').toLowerCase()) || name === 'app-root') && !tok.selfClosing) shellCandidate = { name, empty: true };
    if (a.id === '__next') out.frameworks.add('next');
    if (a.id === '__nuxt') out.frameworks.add('nuxt');
  }
  flush();
  if (curH1) out.h1.push(collapse(curH1.text));

  // Resolve URLs against <base href> when present (relative links and canonicals both use it).
  const resolveAll = (list) => list.map((x) => ({ ...x, url: resolveUrl(x.href, baseUrl) }));
  out.links = resolveAll(out.links);
  out.resources = resolveAll(out.resources);
  out.canonicals = out.canonicals.map((c) => ({ ...c, url: resolveUrl(c.href, baseUrl), relative: !/^[a-z][a-z0-9+.-]*:/i.test(String(c.href).trim()) }));
  out.hreflang = out.hreflang.map((h) => ({ ...h, url: resolveUrl(h.href, baseUrl), relative: !/^[a-z][a-z0-9+.-]*:/i.test(String(h.href).trim()) }));
  if (out.metaRefresh?.target) out.metaRefresh.url = resolveUrl(out.metaRefresh.target, baseUrl);
  out.forms = out.forms.map((f) => ({ ...f, url: f.action ? resolveUrl(f.action, baseUrl) : null }));

  const visible = out.blocks.map((b) => b.text).join(' ');
  out.visibleWords = countWords(visible);
  out.textBytes = Buffer.byteLength(visible, 'utf8');
  out.frameworks = [...out.frameworks];
  return out;
}

/** Robots directives (lower-case tokens) that apply to Googlebot from meta tags and X-Robots-Tag values. */
export function robotsDirectives(metaList, xRobotsHeader) {
  const found = [];
  for (const m of metaList) {
    if (m.name !== 'robots' && m.name !== 'googlebot') continue;
    for (const d of String(m.content).toLowerCase().split(/\s*,\s*/).filter(Boolean)) found.push({ d: d.trim(), via: `meta ${m.name}${m.inHead ? '' : ' (in <body>, which Google still reads)'}` });
  }
  if (xRobotsHeader) {
    // "googlebot: noindex, nofollow" applies to Google; "otherbot: noindex" does not; bare directives apply to all.
    let agent = null;
    for (const part0 of String(xRobotsHeader).split(',')) {
      const part = part0.trim();
      if (!part) continue;
      const m = /^([a-z0-9_-]+)\s*:\s*(.*)$/i.exec(part);
      let directive = part;
      if (m && !/^(max-snippet|max-image-preview|max-video-preview|unavailable_after)$/i.test(m[1])) { agent = m[1].toLowerCase(); directive = m[2]; }
      if (!directive) continue;
      if (agent === null || agent === 'googlebot') found.push({ d: directive.trim().toLowerCase(), via: `X-Robots-Tag${agent ? ` (${agent})` : ''}` });
    }
  }
  const has = (x) => found.some((f) => f.d === x || f.d.startsWith(`${x}:`));
  const noindexVia = found.filter((f) => f.d === 'noindex' || f.d === 'none').map((f) => `${f.via}: ${f.d}`);
  const nofollowVia = found.filter((f) => f.d === 'nofollow' || f.d === 'none').map((f) => `${f.via}: ${f.d}`);
  return { noindex: noindexVia.length > 0, noindexVia, nofollow: nofollowVia.length > 0, nofollowVia, nosnippet: has('nosnippet'), all: found };
}
