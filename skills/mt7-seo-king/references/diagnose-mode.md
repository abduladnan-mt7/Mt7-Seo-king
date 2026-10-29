# Diagnose mode: a deep, verified site crawl

`scripts/diagnose.mjs` crawls a site the way a polite, non-rendering crawler does and returns ranked findings with per-URL evidence: crawl graph, indexability conflicts, duplicates, hreflang, structured data, server health, sitemaps and page basics. This file is the workflow for using it: when to run it, how to read it, how to **verify each finding class before you report it**, how to combine it with data the crawler cannot see, and how to rank what it finds. Tags as in SKILL.md. Written 2026-10-30; Google sources checked 2026-10-29/30.

A finding from this tool is a lead with evidence, not a verdict. The tool already re-fetches before reporting anything severe, but you still verify before you report, because the owner acts on what you write.

## 1. When to use it

- Full audit or "why isn't my site showing up", as part of Phase 0 (diagnose) and Phase 1 (technical foundations).
- After a migration, a redesign, a CMS or template change, or a robots.txt / sitemap change.
- After a traffic drop, once you have the drop's first day (see section 7). Run it with `--save` so the next audit can compare.
- Before you claim anything about orphans, sitemaps, canonicals, redirects or duplicates. Those claims need fetched evidence.
- Use the smaller scripts for narrower questions: one page -> `scripts/onpage-check.mjs`; "is everything in the sitemap indexable?" -> `scripts/sitemap-audit.mjs`; "does that backlink count?" -> `scripts/link-check.mjs`.

## 2. Run it

```
node "<skill-dir>/scripts/diagnose.mjs" https://www.example.com
node "<skill-dir>/scripts/diagnose.mjs" https://www.example.com --limit 400 --repeat 2 --save diagnose-2026-10-30.json
node "<skill-dir>/scripts/diagnose.mjs" https://www.example.com --scope blog/ --limit 150
node "<skill-dir>/scripts/diagnose.mjs" https://www.example.com --psi --psi-urls 3
node "<skill-dir>/scripts/diagnose.mjs" https://crawler-test.com --json > report.json
```

| Option | Default | What it does |
|---|---|---|
| `--limit N` | 150 | URLs fetched in the crawl (20% is reserved for sitemap URLs the links never reach) |
| `--concurrency N` | 2 (max 4) | parallel workers |
| `--delay ms` | 500 (min 250) | pause between each worker's requests; doubled on 429/503, recovers after healthy responses |
| `--repeat N` | 1 (max 3) | re-fetch every HTML page N-1 more times to expose intermittent 5xx |
| `--scope path/` | none | fetch only URLs under this path (repeatable; also accepts a full URL). In Git Bash write `blog/`, not `/blog/`: Git Bash rewrites arguments that start with `/` into Windows paths |
| `--no-sitemap` | off | skip sitemaps |
| `--max-sitemaps N`, `--max-sitemap-mb N` | 50, 10 | caps on sitemap files read and on the size downloaded per file |
| `--verify-limit N`, `--resource-limit N` | 40, 15 | canonical/hreflang targets and same-site CSS/JS checked outside the crawl |
| `--psi`, `--psi-urls N` | off, 3 | PageSpeed Insights lab + field data for the home page and the most-linked pages (no API key) |
| `--json`, `--save file.json` | | machine output on stdout / to a file |
| `--max-minutes N`, `--timeout ms`, `--max-evidence N`, `--quiet`, `--ua "..."` | 20, 15000, 8 | time budget, per-request timeout, evidence lines per finding in text mode, no progress lines, user agent |

Exit codes: 0 = no critical/high finding; 1 = at least one critical or high; 2 = could not run (bad arguments, start URL unreachable, robots.txt disallows this crawler).

Politeness is built in: GET only, never a form; robots.txt obeyed for every host (token `mt7-seo-king`, otherwise the `*` group); Retry-After honoured; the crawl stops when the server keeps answering 429/503 or timing out and the home page fails a health check. Budget: about 0.5 to 1 second per request at the defaults, so a 150-URL run takes 2 to 4 minutes. Run it on sites you own or are hired to audit, keep runs few, and do not raise concurrency on someone else's server.

Choosing `--limit`: orphan detection and "missing from the sitemap" need the link crawl to finish, so cover the whole site when it is small enough. For a large site, run once unscoped (shape of the site, templates, host-level problems), then once per important section with `--scope`.

## 3. Read the report

- **Header lines.** `Crawl ... link crawl complete` or `NOT complete (N discovered URLs not fetched)`: claims that need full coverage (orphans, missing from sitemap) are only made when it is complete. `Sitemaps ... (sitemap set not read completely)`: some file failed, was capped or exceeded the file limit. `Requests ... raised to N ms after pushback`: the server answered 429/503 at some point.
- **Findings by severity**, each with an id (`{redirect-chain}`), why it matters, the source (tag plus Google URL), observed evidence (URL plus value), and a `Verify:` line for the severe ones.
- **Checked and fine.** What was tested and passed (http -> https redirect, soft-404 probes returning 404, sitemap URLs all indexable...). Report these too; they are evidence.
- **Not checked / cannot see.** Copy it into the audit's "Not measured" section (SKILL.md report format, section 8).
- There is no score out of 100. Do not invent one; count and rank findings instead.

## 4. Severity: what each level means

Rank by the likely effect on crawling, then indexing, then ranking, then users. A cosmetic item is never above low.

| Level | Meaning | Examples |
|---|---|---|
| critical | The whole site, or its home page, cannot be crawled or indexed | robots.txt blocks Googlebot from `/`; robots.txt answers 5xx; home page noindexed or erroring |
| high | Verified per URL: pages you want indexed are blocked, contradicted, unreachable or duplicated site-wide | sitemap URLs noindexed or robots-blocked; canonical to a 4xx/5xx, noindexed or blocked URL; redirect loops and chains over 10 hops; recurring 5xx; HTML over 2 MB; made-up URLs answering 200; a www twin serving the site |
| medium | Real crawl/index waste or a mixed signal that Google may resolve against you | broken internal links; redirect chains; canonical conflicts or in `<body>`; duplicate titles across indexable pages; duplicate pages without a canonical; hreflang errors; JSON-LD that does not parse; orphan pages (complete crawl only); main content only after JavaScript |
| low | Worth fixing in normal work; small effect | links to redirects; paginated titles; thin pages to review; missing H1; deep pages; missing viewport; slow TTFB from one location; properties a rich result needs |
| info | Inventory and context, never a problem statement on its own | noindexed pages, title/description lengths, structured data types, FAQ/HowTo markup, Open Graph, alt text, crawl-delay lines |

The tool assigns these levels; you can lower one with a reason (for example, a section that is deliberately noindexed), but raise one only with evidence from Search Console.

## 5. Finding classes: what they mean and how to verify them

Verify every critical/high item by hand and a sample of the rest. The general method: re-fetch the URL (`curl -sI <url>` for headers and status, `curl -sL <url>` for the body), view the page source for tags, and use Search Console URL Inspection (Test live URL) for what Googlebot gets. A finding that does not reproduce is not reported.

### 5.1 Site level and robots.txt

| id | Meaning | Verify | Source |
|---|---|---|---|
| `robots-unavailable` (critical) | robots.txt answers 5xx or cannot be reached. For a 5xx, Google stops crawling the site for 12 hours, then uses the last good copy for up to 30 days | `curl -sI /robots.txt` several times; Search Console robots.txt report | `[G]` [robots.txt spec](https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec) |
| `robots-blocks-site` (critical) | Googlebot's group disallows `/` | Read the file; check which group applies to Googlebot (a specific group is not combined with `*`) | `[G]` (same) |
| `home-not-200`, `home-noindex` | Home page errors or is noindexed. 401/403/429/503 on every fetch is reported as high, not critical: it may be a firewall reacting to this tool | URL Inspection > Test live URL on the home page | `[G]` [status codes](https://developers.google.com/crawling/docs/troubleshooting/http-status-codes) |
| `robots-noindex-directive` | `Noindex:` lines in robots.txt; Google retired support for them on 2019-09-01, so the named URLs stay indexable | Read the lines; inspect one named URL | `[G]` [unsupported rules, 2019](https://developers.google.com/search/blog/2019/07/a-note-on-unsupported-rules-in-robotstxt) |
| `robots-too-large`, `robots-html`, `robots-invalid-lines`, `robots-relative-sitemap`, `robots-ignored-lines` | File over 500 KiB (the rest is ignored); an HTML page instead of rules; unparseable lines; relative Sitemap URLs; crawl-delay/host lines Google ignores (info) | Read the file | `[G]` [robots.txt spec](https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec) |
| `robots-blocks-resources` | Same-site CSS/JS that robots.txt blocks for Googlebot. Google says not to block resources whose absence makes the page harder to understand; it does not render JavaScript from blocked files. Analytics/tracking scripts are split out as `robots-blocks-tracking` (info) | URL Inspection > Test live URL > page resources | `[G]` [robots.txt intro](https://developers.google.com/search/docs/crawling-indexing/robots/intro); [JS SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics) |
| `links-to-blocked` (info) | Internal links to URLs blocked for Googlebot. Usually deliberate; a blocked URL can still be indexed without content if linked, so use noindex (and allow crawling) to keep one out | Confirm the block is intended | `[G]` [robots.txt intro](https://developers.google.com/search/docs/crawling-indexing/robots/intro) |

The crawler obeys robots.txt for itself, using Google's rules (longest match wins, allow wins a tie, groups for the same agent merged). URLs that robots.txt closes to this crawler but not to Googlebot are listed under "cannot see".

### 5.2 Status codes and server health

| id | Meaning | Verify | Source |
|---|---|---|---|
| `intermittent-errors` | The same URL answered 200 and a 5xx/429/timeout (use `--repeat 2`). Google's crawlers slow down on 5xx and 429 | Search Console > Settings > Crawl stats (crawl responses and host status) for the same days; server logs | `[G]` [status codes](https://developers.google.com/crawling/docs/troubleshooting/http-status-codes); [Crawl Stats help](https://support.google.com/webmasters/answer/9679690) |
| `links-to-5xx`, `links-to-4xx`, `links-to-401-403`, `unreachable` | Linked URLs that error on every fetch. Google does not index 4xx URLs and drops indexed ones that turn 4xx | `curl -sI` the target; find the link on a source page | `[G]` (same) |
| `slow-ttfb` | p75 time to first byte over 0.8 s (low) or 1.8 s (medium), measured from this machine. TTFB is not a Core Web Vital | PageSpeed Insights field TTFB; re-run from another network | `[G]` [web.dev TTFB](https://web.dev/articles/ttfb); [crawl budget](https://developers.google.com/crawling/docs/crawl-budget) (capacity matters mostly for large sites) |
| `html-over-2mb`, `html-near-2mb` | Googlebot crawls the first 2 MB of an HTML file (uncompressed); content after the cut is not seen | `curl -s --compressed <url> \| wc -c` | `[G]` [Googlebot](https://developers.google.com/search/docs/crawling-indexing/googlebot) |
| `mixed-content-active`, `mixed-content-passive`, `insecure-forms` | http:// scripts/styles/iframes on https pages are blocked by browsers; http:// images may be upgraded or fail; forms posting to http:// (info) | Browser console on the page | `[G]` [web.dev mixed content](https://web.dev/articles/what-is-mixed-content) |
| `broken-resources` | Same-site CSS/JS returning an error | `curl -sI` the file | `[INFERENCE]` |

A 429 or 403 sent to this tool does not prove Googlebot gets one: firewalls often treat unknown bots differently. Check Crawl Stats before reporting it as Google's problem.

### 5.3 Redirects

| id | Meaning | Verify | Source |
|---|---|---|---|
| `redirect-loop` | Server or meta-refresh redirects that never end | `curl -sIL --max-redirs 12 <url>` | `[G]` [status codes](https://developers.google.com/crawling/docs/troubleshooting/http-status-codes) |
| `redirect-chain-over-10` (high), `redirect-chain` (medium) | Googlebot follows up to 10 redirect hops; every hop is another fetch | `curl -sIL <url> \| grep -i -E "^(HTTP\|location)"` | `[G]` (same) |
| `redirect-to-error`, `redirect-to-blocked`, `redirect-invalid` | The redirect ends on a 4xx/5xx, on a robots-blocked URL, or has no usable Location | Follow the chain by hand | `[G]` [redirects](https://developers.google.com/search/docs/crawling-indexing/301-redirects) |
| `unusual-3xx` | 300/304/305/306: Google documents following 301, 302, 303, 307 and 308; 304 means "not modified" | `curl -sI` | `[G]` [status codes](https://developers.google.com/crawling/docs/troubleshooting/http-status-codes) |
| `links-to-redirects` (low), `temporary-redirects` (info), `refresh-redirects` (low) | Internal links through a redirect; 302/307 are a weak canonical signal, 301/308 a strong one; Google treats an instant meta refresh as permanent and a delayed one as temporary | `curl -sI`; view source for `http-equiv="refresh"` | `[G]` [redirects](https://developers.google.com/search/docs/crawling-indexing/301-redirects) |

A JavaScript redirect is invisible here (see "cannot see").

### 5.4 Hosts, protocol and duplicate URLs

| id | Meaning | Verify | Source |
|---|---|---|---|
| `variant-serves-content` | http://, www or non-www answers 200 without redirecting. Google prefers the HTTPS version as canonical when both exist, except when there are conflicting signals (such as insecure dependencies on the HTTPS pages), so http:// alone is medium and becomes high with active mixed content; a www/non-www twin without a canonical is high | `curl -sI http://example.com/` | `[G]` [consolidate duplicates](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) |
| `variant-multi-hop`, `variant-error`, `variant-tls-error`, `variant-elsewhere` | A variant needs two or more hops, ends in an error, has a certificate that does not cover it, or goes elsewhere. A twin that does not resolve is fine | `curl -sIL` | `[G]` [redirects](https://developers.google.com/search/docs/crawling-indexing/301-redirects); `[INFERENCE]` for the user-facing ones |
| `slash-duplicates`, `duplicate-urls` | `/a` and `/a/`, case, `index.html`, tracking or session parameters: the same page (same title and H1) at several URLs with no redirect and no shared canonical | Fetch each spelling; compare title, H1 and canonical | `[G]` [consolidate duplicates](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) |
| `tracking-params-in-links` | Internal links carrying utm/session parameters, each a new URL to crawl | View source of the linking page | `[G]` (same) |

Only the www/non-www twin of an apex domain is probed (`www.example.com` <-> `example.com`); `www.` in front of another subdomain is not a real variant.

### 5.5 Soft 404

| id | Meaning | Verify | Source |
|---|---|---|---|
| `soft-404` | A made-up URL answers 200: high when the page looks normal (junk URLs become duplicates), medium when it says "not found" with a 200 | `curl -sI https://example.com/no-such-page-12345` | `[G]` [soft 404](https://developers.google.com/search/docs/crawling-indexing/troubleshoot-crawling-errors) |
| `soft-404-redirect` (low) | Made-up URLs redirect to a real page; Google says redirecting many URLs to an irrelevant page such as the home page "might be treated as a soft 404" | Same | `[G]` [site moves](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes) |

### 5.6 Indexability conflicts (each one verified per URL)

| id | Meaning | Verify | Source |
|---|---|---|---|
| `sitemap-noindex` (high), `noindex-flapping` | A sitemap URL carries noindex (meta robots/googlebot, `none`, or X-Robots-Tag for all bots or googlebot), confirmed on a second fetch; or noindex appears on one fetch only | `curl -sI <url> \| grep -i x-robots`; view source; URL Inspection | `[G]` [sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap); [robots meta](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag) |
| `sitemap-redirects`, `sitemap-4xx`, `sitemap-5xx`, `sitemap-non-canonical`, `sitemap-blocked` | Sitemap lists URLs that redirect, error, canonicalise elsewhere, or that robots.txt blocks for Googlebot (the robots check needs no fetch, so it covers every listed URL) | `curl -sI`; view source for the canonical | `[G]` [sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) |
| `canonical-to-error`, `canonical-to-noindex`, `canonical-to-blocked` (high) | The canonical names a URL that errors, is noindexed, or is blocked | Fetch the canonical target | `[G]` [consolidate duplicates](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) |
| `canonical-to-redirect`, `canonical-chain` | The canonical target redirects, or canonicalises somewhere else | Follow it by hand | `[G]` (same) |
| `canonical-conflict` | Two different canonicals (two tags, or tag vs HTTP Link header); Google ignores multiple declarations | View source and response headers | `[G]` [5 rel=canonical mistakes, 2013](https://developers.google.com/search/blog/2013/04/5-common-mistakes-with-relcanonical) |
| `canonical-outside-head`, `head-broken` | rel=canonical is accepted only in the `<head>`, so the head must be valid HTML; an element such as a `div`, `img` or `iframe` (or stray text) ends the head early and pushes later canonical/hreflang tags into the body. A robots meta tag in the body is still honoured | View source: find the first non-head element inside `<head>`; DevTools shows where the tags landed | `[G]` [consolidate duplicates](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls); [robots meta](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag) |
| `noindex-plus-canonical` (low) | noindex plus a canonical elsewhere; Google does not recommend noindex for choosing a canonical within a site | View source | `[G]` [consolidate duplicates](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) |
| `canonical-relative`, `canonical-cross-domain`, `noindex-pages`, `meta-nofollow` (info) | Relative canonicals (Google recommends absolute); canonicals to another host (fine for syndication, otherwise check); inventory of noindexed and page-level nofollow pages | Confirm intent with the owner | `[G]` (same) |

### 5.7 Crawl graph

| id | Meaning | Verify | Source |
|---|---|---|---|
| `orphan-pages` | Indexable sitemap pages that no crawled page links to. Only claimed when the link crawl from the home page completed, no `--scope` was used, and under 30% of pages look JavaScript-rendered; otherwise `orphans-not-judged` (info) says why | Check rendered menus, footers and site search in a browser before reporting | `[G]` [links](https://developers.google.com/search/docs/crawling-indexing/links-crawlable): "Every page you care about should have a link from at least one other page on your site" |
| `not-in-sitemap` (low) | Indexable, self-canonical pages reached by links but missing from a completely read sitemap | Search the sitemap file | `[G]` [sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) |
| `deep-pages` (low) | Indexable pages five or more clicks from the home page. There is no Google threshold | Click from the home page | `[INFERENCE]` |
| `internal-nofollow`, `anchors-without-href` (info) | nofollow on your own links; `<a>` without `href` (Google can generally crawl only `<a href>`) | View source | `[G]` [links](https://developers.google.com/search/docs/crawling-indexing/links-crawlable) |

Click depth counts links from the home page in raw HTML; redirects cost no click.

### 5.8 Titles, descriptions, headings, content

| id | Meaning | Verify | Source |
|---|---|---|---|
| `duplicate-titles` (medium), `duplicate-titles-paginated` (low), `duplicate-descriptions`, `duplicate-h1`, `templated-descriptions` (low) | Identical (or near-identical) values across **indexable, self-canonical** pages; noindexed and canonicalised pages are excluded, and a page reachable at several spellings counts once | Fetch two pages from the group and compare | `[G]` [title links](https://developers.google.com/search/docs/appearance/title-link); [snippets](https://developers.google.com/search/docs/appearance/snippet) |
| `missing-title`, `multiple-titles`, `multiple-descriptions`, `missing-h1` (low); `missing-description`, `multiple-h1`, `title-lengths`, `description-lengths` (info) | Lengths are reported, never ranked; multiple H1s are allowed | View source | `[G]` [title links](https://developers.google.com/search/docs/appearance/title-link) |
| `duplicate-content` (medium), `near-duplicate-content` (low) | Identical main text (after removing text repeated across 40% of crawled pages), or 90%+ shared 5-word phrases, without a shared canonical | Read both pages | `[G]` [consolidate duplicates](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls); similarity threshold `[INFERENCE]` |
| `thin-pages` (low) | Under 50 unique words in the raw HTML. A review filter, not a rule: length alone is not a ranking factor. Pages that need JavaScript, the home page and utility pages (contact, login, legal, cart) are never listed | Read the page and judge intent | `[G]` [SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide) |
| `js-required` (medium), `js-probable` (info) | An empty app shell or an "enable JavaScript" notice with little raw text; or little text plus heavy scripts. Google renders JavaScript (queued), most AI crawlers do not `[CLAIM]` | Compare view-source with the rendered DOM; URL Inspection > View crawled page | `[G]` [JS SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics) |

### 5.9 hreflang

| id | Meaning | Source |
|---|---|---|
| `hreflang-invalid` | Not ISO 639-1 language [+ ISO 15924 script] [+ ISO 3166-1 alpha-2 region], or x-default (`en-UK`, `jp`, `en_US` fail) | `[G]` [localized versions](https://developers.google.com/search/docs/specialty/international/localized-versions) |
| `hreflang-no-return` | A names B but B does not name A: "If two pages don't both point to each other, the tags will be ignored" | `[G]` (same) |
| `hreflang-bad-target`, `hreflang-duplicate-lang`, `hreflang-outside-head` | Targets that redirect, error, are noindexed or canonicalise elsewhere; one code mapped to two URLs; `<link>` tags outside a well-formed `<head>` | `[G]` (same) |
| `hreflang-no-self`, `hreflang-relative` (low); `hreflang-no-x-default` (info) | Each version must list itself; URLs must be fully qualified; x-default is optional | `[G]` (same) |

Verify by fetching both pages of a pair and listing their annotations (HTML `<link>` and HTTP `Link` header). Return links are checked only for targets the crawl fetched; targets on other hosts are fetched within `--verify-limit`.

### 5.10 Structured data (JSON-LD in raw HTML)

| id | Meaning | Source |
|---|---|---|
| `jsonld-invalid` (medium) | A block that is not valid JSON; everything in it is lost | `[G]` [structured data guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies) |
| `jsonld-missing-required` (low) | A type with a rich result in Google's search gallery lacks a property Google lists as required for it (BreadcrumbList with at least two items, Product, Offer price, SoftwareApplication, LocalBusiness, Event, Recipe, VideoObject, JobPosting, Review, AggregateRating, ProfilePage, DiscussionForumPosting, QAPage). `@id` references are resolved first. Only eligibility is lost; the fix is never a fabricated value or a self-collected rating | `[G]` [search gallery](https://developers.google.com/search/docs/appearance/structured-data/search-gallery); e.g. [software app](https://developers.google.com/search/docs/appearance/structured-data/software-app) requires `aggregateRating` or `review` |
| `jsonld-no-context` (low) | Entities without a schema.org `@context` | `[G]` (guidelines) |
| `jsonld-retired`, `jsonld-self-serving-rating`, `jsonld-types`, `home-no-jsonld` (info) | FAQ rich results were retired for all sites on 2026-05-07 and HowTo on 2023-09-13, so that markup is harmless but earns nothing (never report it missing); an organisation's ratings of itself are ineligible for stars; type inventory; no JSON-LD on the home page | `[G]` [changelog](https://developers.google.com/search/updates); [review snippet](https://developers.google.com/search/docs/appearance/structured-data/review-snippet) |

Nested nodes are related entities: an Organization with a nested `parentOrganization`, `subOrganization`, `publisher` or `brand` is **not** a duplicate Organization, and the tool never reports it as one. JSON-LD injected by JavaScript is invisible here; confirm "no schema" with the Rich Results Test or the rendered DOM. Microdata/RDFa are counted, not validated.

### 5.11 Sitemap hygiene

| id | Meaning | Source |
|---|---|---|
| `sitemap-too-large` (high) | Over 50,000 URLs or 50 MB uncompressed per file. Judged from Content-Length (requested uncompressed) without downloading | `[G]` [build a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) |
| `sitemap-unreadable`, `sitemap-invalid` (medium) | Declared file errors, times out (15 s here), returns HTML or malformed XML. A capped read is reported as `sitemap-not-fully-read` (info), never as invalid | `[G]` [sitemaps report help](https://support.google.com/webmasters/answer/7451001) |
| `sitemap-file-blocked` (medium) | "Google respects robots.txt when fetching sitemaps" | `[G]` (same) |
| `sitemap-other-host`, `sitemap-outside-path`, `sitemap-nested-index` (low/medium) | URLs on another host or protocol; URLs above the sitemap's own directory (valid only if the sitemap is submitted in Search Console); index files listing index files | `[G]` (same); [build a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) |
| `lastmod-bulk`, `lastmod-invalid`, `lastmod-future` (low); `lastmod-missing`, `sitemap-duplicates`, `sitemap-none` (info) | Google uses lastmod only if it is consistently and verifiably accurate; it ignores priority and changefreq. A small, well-linked site may not need a sitemap at all | `[G]` [build a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap); [overview](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview) |

XML, gzip, plain-text sitemaps and sitemap indexes are read; namespace prefixes and CDATA are handled.

### 5.12 Page basics and performance

| id | Meaning | Source |
|---|---|---|
| `viewport-missing` (low) | No meta viewport, so phones render the desktop layout zoomed out `[INFERENCE]`; Google indexes and ranks the mobile version of content | `[G]` [mobile-first indexing](https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing) |
| `lang-missing`, `images-missing-alt`, `open-graph-missing` (info) | Google detects language from content, not `lang`; alt text matters for Google Images and accessibility, not web ranking; Open Graph controls social previews | `[G]` [multi-regional sites](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites); [Google Images](https://developers.google.com/search/docs/appearance/google-images) |
| `cwv-poor` (medium), `cwv-needs-improvement` (low), `psi-lab` (info) | With `--psi`: real-user field data at the 75th percentile against LCP 2.5 s, INP 200 ms (INP replaced FID on 2024-03-12), CLS 0.1. Core Web Vitals are a tie-breaker; sell the fix as UX and conversion. Without a key the PSI quota is small and may be exhausted on the first call, and Google has said it plans to drop CrUX field data from the PSI API; the report says when either happens | `[G]` [Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals); [web.dev vitals](https://web.dev/articles/vitals); [PSI API](https://developers.google.com/speed/docs/insights/v5/get-started) |

## 6. Traps the tool avoids, and you must too

- **"Sitemap lists noindexed pages" without fetching each URL.** Only `sitemap-noindex` (fetched and re-fetched) supports that sentence.
- **Two `"@type":"Organization"`, the second nested as `parentOrganization` or `publisher`, is not a duplicate.**
- **`Cache-Control: private, no-store` is not a ranking problem.** The tool does not judge caching headers; do not add a finding about them.
- **FAQ and HowTo:** no rich results (FAQ gone for all sites since 2026-05-07, HowTo since 2023-09). Never recommend adding them for search, never flag them as missing. **INP, not FID**, since 2024-03-12. **The Indexing API is only for pages with JobPosting or BroadcastEvent embedded in a VideoObject** `[G]` ([quickstart](https://developers.google.com/search/apis/indexing-api/v3/quickstart)). **llms.txt is not used by Google Search** `[G]` ([AI optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)); the tool does not look for it.
- **JavaScript sites:** never call a page thin, orphaned or schema-less from raw HTML when it looks JavaScript-rendered; the tool suppresses those claims and says so.
- **Severity inflation:** multiple H1s, title length, description length, alt text and Open Graph are information. A rich-result property gap is low and never a reason to invent data.
- **Bot-specific responses:** a 403/429 to this tool, or a WAF challenge page, says nothing certain about Googlebot.
- **Cloudflare email links** (`/cdn-cgi/l/email-protection`) are rewritten to `mailto:` by Cloudflare's script; they are not broken links and the tool skips them.
- **Crawl budget** worries apply mostly to very large sites (Google's guide is for about 1M+ pages, or 10K+ pages changing daily) `[G]` ([crawl budget](https://developers.google.com/crawling/docs/crawl-budget)).

## 7. Combine it with what the crawler cannot see

| Source | What to bring in | How it changes a finding |
|---|---|---|
| Search Console Page indexing report `[G]` ([help](https://support.google.com/webmasters/answer/7440203)) | Counts and examples for "URL marked 'noindex'", "Page with redirect", "Duplicate without user-selected canonical", "Duplicate, Google chose different canonical than user", "Alternate page with proper canonical tag", "Soft 404", "URL blocked by robots.txt", "Indexed, though blocked by robots.txt", "Server error (5xx)", "Not found (404)", "Crawled - currently not indexed", "Discovered - currently not indexed" | A crawl finding Google also reports is confirmed. A status with no crawl finding behind it points at something raw HTML cannot show (JavaScript, bot-specific responses) or at pages outside the crawl budget |
| URL Inspection `[G]` | Google-selected canonical, last crawl, rendered HTML, page resources | Settles canonical, JavaScript and blocked-resource questions for one URL |
| Crawl Stats `[G]` ([help](https://support.google.com/webmasters/answer/9679690)) | Crawl responses by type, host status (robots.txt fetch, DNS, server connectivity) | Confirms or refutes `intermittent-errors`, `slow-ttfb` and robots.txt availability from Googlebot's side |
| Performance report `[G]` | Clicks/impressions by page and query; the first day of a drop in the date view | Prioritises: fix findings on pages that earn or used to earn impressions first |
| `scripts/google-updates.mjs --around <first day>` | Updates and Search Console logging anomalies near the drop | Rules a ranking update in or out before you blame a technical finding (or the other way round) |
| Bing Webmaster Tools `[OFFICIAL]` | Site scan, URL inspection, indexed pages, IndexNow status | A second engine's view; Bing grounds Copilot and is used by other answer engines |
| A previous run (`--save`) or `scripts/sitemap-audit.mjs --compare` | What changed between two dates | "Did we change something before the drop?" gets an answer |
| Server/CDN logs | Googlebot's real requests and status codes (verify its IPs) | The only first-hand record of what Googlebot received |

Rule: when the crawl and Search Console disagree, report both and say which one you trust for that question (Google's own report for what Google did; the crawl for what the server sends now).

## 8. Turn findings into the prioritised plan

Use SKILL.md's report format. Mapping:
1. **P0:** every confirmed critical finding; high findings that touch money pages or the whole host (robots/home blockers, sitemap or canonical conflicts on pages that should rank, recurring 5xx, http/www duplicates, soft-404 catch-alls, redirect loops).
2. **P1:** remaining high findings; medium findings that affect many URLs or one template (a template bug shows up as the same finding on many pages: fix the template once).
3. **P2:** medium findings on a few URLs; low findings in templates.
4. **P3 / backlog:** low and info items worth tidying.

Within a level, order by reach (number of URLs and how much traffic they earn) and by how cheap the fix is. A finding the owner already knows and accepts (a deliberately noindexed section) goes under "Decisions", not "Actions". Never pad the list with info items.

## 9. What diagnose mode cannot see

- JavaScript execution: links, text, canonicals, robots meta and JSON-LD added by scripts; JavaScript redirects; client-side 404 handling. Google renders pages; most AI crawlers do not `[CLAIM]`.
- What Google actually indexed, its chosen canonicals, Googlebot's own errors, manual actions and security issues (Search Console only).
- Rankings, impressions, clicks, queries, backlinks, and the status of external link targets.
- What Googlebot is served when a CDN, firewall or bot rule treats it differently from an honest unknown crawler.
- Content quality, intent match, first-hand experience and trust; whether a short page is actually thin.
- Images, video and PDF files (only http:// image URLs on https pages are noted); microdata/RDFa properties.
- Pages beyond `--limit`, URLs robots.txt closes to this crawler, hreflang targets beyond `--verify-limit`, sitemap files beyond the size/file caps.
- Core Web Vitals without `--psi`, and with it beyond the few sampled URLs.
- Anything behind a login or a form, server logs, CDN configuration.
- HTTP 407 responses: Node's fetch turns them into network errors, so they show as "failed on every fetch".

## 10. How well it works (test record)

Tested 2026-10-29/30 against crawler-test.com, a public site built to test SEO crawlers, using a ground-truth list written from the site's own test index before scoring: 160 of 164 listed issues found (three scoped runs plus one default run, at most 200 URLs each). Of the four misses, two were wrong ground-truth entries on re-inspection, one was a 407 reported as a network failure, and one was an orphan that cannot be judged without a complete crawl. A sample of 210 reported items re-checked with independent code found one false positive class, fixed afterwards. On two well-maintained open-source project sites the default run produced no critical or high findings. This is the skill's own test, not an independent study `[INFERENCE]`; re-test after changing the checks.
