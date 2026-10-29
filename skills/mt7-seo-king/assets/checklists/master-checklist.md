# Master SEO checklist (any site category)

Copy this file into the project, delete sections that don't apply, keep the tags. Tags: `[G]` Google official; `[OFFICIAL]` other platform's docs; `[DATA]` study; `[PROVEN]` community-proven; `[CLAIM]` community claim; `[WARNED]` penalised; `[INFERENCE]` sensible practice the research does not cover. Last verified 2026-10-20 - re-check dated items (see SKILL.md re-verification protocol).

## A. Day-0 foundations (once per site)

- [ ] Search Console: domain property verified (covers http/https, www/non-www, subdomains) `[G]`
- [ ] Bing Webmaster Tools verified; IndexNow key hosted `[OFFICIAL]` (Bing feeds Copilot; one case of ChatGPT citations tracking Bing `[PROVEN]`)
- [ ] One canonical host: every other variant 301s to it (apex vs www, http -> https) `[G]`
- [ ] Self-referencing `<link rel="canonical">` on every indexable page; no conflicting canonical/redirect/sitemap signals `[G]`
- [ ] XML sitemap lists only canonical, 200, indexable URLs; submitted in GSC and Bing `[G]`
- [ ] robots.txt allows Googlebot, Bingbot, OAI-SearchBot, PerplexityBot; training bots are a deliberate choice (`assets/robots-and-crawlers.md`) `[OFFICIAL]`
- [ ] No accidental `noindex` / `X-Robots-Tag` on money pages (run `scripts/onpage-check.mjs` on each) `[G]`
- [ ] Main content present in raw HTML (not JS-only) - AI crawlers may not render JS `[CLAIM]`
- [ ] Organization JSON-LD on home/About: name, alternateName, url, logo, sameAs (every real profile), contactPoint; LocalBusiness only with a physical address `[G]`
- [ ] WebSite JSON-LD with the site name on every home-page variant `[G]`
- [ ] Brand name spelled identically on site, profiles, directories, social `[G]`
- [ ] NAP (name, address, phone) identical on site and every listing; one phone number, no per-listing tracking numbers `[PROVEN]` (47-expert survey: [Whitespark, 2025-11](https://whitespark.ca/local-search-ranking-factors/))
- [ ] GA4 (or equivalent) with the AI-referrer channel group (`assets/ai-visibility-measurement.md`) `[OFFICIAL]`
- [ ] Core Web Vitals within thresholds (LCP <= 2.5 s, INP < 200 ms, CLS < 0.1) - a tie-breaker, not a lever `[G]`
- [ ] HTTPS everywhere, no mixed content; mobile layout works `[G]`
- [ ] Server errors near zero: 5xx and 429 make Google's crawlers slow down, and URLs that keep failing are eventually dropped from the index `[G]` ([HTTP errors](https://developers.google.com/search/docs/crawling-indexing/http-network-errors)). One fetch misses intermittent failures; probe with `scripts/sitemap-audit.mjs --repeat 3` and read GSC Crawl stats
- [ ] Real status codes: a missing page returns 404/410, not a 200 "not found" page (soft 404) `[G]`
- [ ] HTML under 2 MB uncompressed: Googlebot indexes only the first 2 MB of a page (64 MB for PDFs) `[G]` ([Googlebot](https://developers.google.com/search/docs/crawling-indexing/googlebot)); `scripts/onpage-check.mjs` reports the size
- [ ] No script (yours, an ad network's, a "retention" widget) interferes with the browser's back button or history; back-button hijacking is a named spam practice `[G]` ([spam policies](https://developers.google.com/search/docs/essentials/spam-policies))
- [ ] Redirects are one hop, no chains or loops; internal links point at the final URL `[G]`
- [ ] Parameter, filter, sort and session URLs can't multiply into crawl traps; infinite scroll has paginated URLs behind it (`references/site-architecture.md` section 5) `[G]`
- [ ] One URL form: trailing slash and letter case consistent, the other form redirects `[G]` `[INFERENCE]`
- [ ] Indexed vs expected: the GSC Pages report "indexed" count compared with the sitemap URL count; a large gap is the first thing to explain `[G]` `[INFERENCE]`
- [ ] About page with real, verifiable people (names, roles, photos, LinkedIn) - no stock faces or invented credentials `[G]`
- [ ] Privacy/contact/legal pages reachable from the footer `[INFERENCE]`
- [ ] Remove or ignore FAQ/HowTo schema expectations - they earn no rich result since 2026-05 / 2023-09 `[G]`
- [ ] Baseline recorded: GSC 28-day clicks/impressions, indexed pages, top queries, branded vs non-branded `[INFERENCE]`

## B. Per-page publish gate (every new or rewritten page)

- [ ] The page serves one distinct intent, verified against the live SERP format (business page? directory? listicle? tool?) `[DATA]` ([BrightLocal, 2024-10](https://www.brightlocal.com/research/business-listings-visibility-study/)) `[G]` Needs Met
- [ ] Page type is legitimate per the decision table in SKILL.md (no doorway, no name-swap, no scaled variant) `[G]`
- [ ] Unique `<title>` 50-60 chars, specific, brand last; > 70 chars is rewritten 99.9% of the time `[DATA]` ([Zyppy, 2022-01](https://zyppy.com/seo/google-title-rewrites/))
- [ ] Meta description written for humans (Google rewrites ~63% anyway) `[DATA]` ([Ahrefs, 2020](https://ahrefs.com/blog/meta-description-study/))
- [ ] One h1 that matches the intent; headings describe sections, not keyword repeats `[G]` title-link sources
- [ ] Answer-first opening: the question the page exists for is answered in the first paragraph in plain HTML `[CLAIM]` `[INFERENCE]`
- [ ] Specific, dated, quotable facts (numbers, prices, names) in visible text, not only in PDFs/JSON-LD `[DATA]` AI citation behaviour ([Ahrefs, 2025-12](https://ahrefs.com/blog/ai-vs-made-up-brand-experiment/))
- [ ] Real author/owner named where expertise matters; no fabricated bylines `[G]`
- [ ] Internal links: at least one inbound link from a relevant page; outbound links to related pages with descriptive anchors `[G]`
- [ ] Images: descriptive alt, compressed, sized; real photos over stock where trust matters `[G]` `[INFERENCE]`
- [ ] Structured data matches the visible content; validated; no self-serving AggregateRating `[G]`
- [ ] Canonical self-referencing; indexable; in the sitemap `[G]`
- [ ] AI-generated drafts fact-checked by a human, including titles, descriptions, alt text, schema `[G]`
- [ ] Mobile and desktop checked in a browser; `scripts/onpage-check.mjs <url>` run on the live URL `[INFERENCE]`
- [ ] Request indexing in GSC (optional) and submit via IndexNow `[OFFICIAL]`

## C. Monthly (30-60 minutes)

- [ ] GSC Performance, last 28 days vs previous: clicks, impressions, CTR, average position; branded vs non-branded split (`assets/gsc-monthly-review.md`) `[INFERENCE]`
- [ ] Striking-distance list: queries at positions 8-20 with impressions -> retitle / strengthen the page `[CLAIM]` (a convention, not a study: [Clearscope](https://www.clearscope.io/blog/what-are-striking-distance-keywords))
- [ ] Pages report: new "Not indexed" reasons on money pages; canonical chosen by Google = yours `[G]`
- [ ] Manual actions and Security issues: empty `[G]`
- [ ] Search Status Dashboard: any update that overlaps a change in traffic `[G]`
- [ ] Review flow: new reviews this month on GBP + the category's directories; every review replied to `[PROVEN]`
- [ ] AI visibility panel run (`assets/ai-visibility-panel.csv`): % of runs mentioning the brand `[DATA]` consistency rule ([SparkToro, 2026-01](https://sparktoro.com/blog/new-research-ais-are-highly-inconsistent-when-recommending-brands-or-products-marketers-should-take-care-when-tracking-ai-visibility/))
- [ ] Bing Webmaster: AI Performance citations; index coverage `[OFFICIAL]`
- [ ] One new proof asset shipped (case study, data piece, tool, video) `[CLAIM]` `[INFERENCE]`
- [ ] Outreach log updated: list inclusions pitched/won, mentions earned (`assets/outreach-kit.md`) `[PROVEN]`

## D. Quarterly

- [ ] Re-verify time-sensitive facts in this skill (update dates, deprecations, CTR figures, AI features) against Search Central / Status Dashboard `[INFERENCE]`
- [ ] Pages not in the top 10 after ~6 months: update, merge or prune `[DATA]` ([Ahrefs, 2025-05](https://ahrefs.com/blog/how-long-does-it-take-to-rank/))
- [ ] Prune/noindex thin pages (programmatic leftovers, empty categories, tag pages) `[PROVEN]`
- [ ] Internal-link audit: orphan pages, anchor variety, every case/article links to its service/category page `[G]`
- [ ] Profiles audit: NAP, categories, hours, photos unchanged and correct (avoid needless GBP edits) `[WARNED]`
- [ ] Schema re-validated after any template change `[G]`
- [ ] Backlink profile glance: referring domains rising while traffic falls = warning sign of toxic legacy links `[WARNED]`
- [ ] Core Web Vitals field data (CrUX in GSC) still green `[G]`
- [ ] Keyword-intent map refreshed (`assets/keyword-intent-map.csv`); kill targets whose SERP format you can't win `[DATA]` ([BrightLocal, 2024-10](https://www.brightlocal.com/research/business-listings-visibility-study/))

## E. Site move / domain change

See `assets/site-move-checklist.md` for the full sequence. Minimum:
- [ ] Every old URL 301/308s to its exact new counterpart, one hop `[G]`
- [ ] New site: self-canonicals, new sitemap, internal links updated `[G]`
- [ ] Change of Address filed from every verified old domain property (apex and www are separate properties) `[G]`
- [ ] Old redirects kept >= 1 year; expect 1-3 months to settle `[G]` `[REPORTED]`

## F. Recovery after a core or spam update

- [ ] Confirm the drop lines up with a dated event on the Search Status Dashboard; rule out logging anomalies, site changes, manual actions, security issues `[G]`. `node scripts/google-updates.mjs --around <first day of the drop>` lists the overlapping updates from a dated ledger; check the dashboard for anything newer than the ledger
- [ ] Use the date breakdown in GSC Performance, not the 3-month total, to find the first day of the drop; a big pre-drop period hides it `[INFERENCE]`
- [ ] Site-level or page-level? If pages you asked Google to re-crawl were crawled with the new content and still show "Crawled - currently not indexed", the verdict is site-level: stop requesting indexing and work on what Google evaluates (pruning, earned links, first-hand substance) `[INFERENCE]`
- [ ] Order the fixes by what changes Google's evaluation: server errors, pruning/noindexing the weak tail and earned links come before on-page polish while a site-level verdict holds. A diagnostic (a dashboard lookup, a re-check) is a step, not an action, so it never fills a Top-5 slot `[INFERENCE]`
- [ ] Manual action? Fix exactly what is named, then request reconsideration `[G]`
- [ ] No manual action: expect no quick fix - recovery is rare, partial, and arrives at a later core update `[PROVEN]`
- [ ] Audit for the named policies: scaled content, doorway pages, site reputation abuse, link spam, self-ranking listicles `[G]` `[WARNED]`
- [ ] Prune or noindex thin, off-topic or unreviewed YMYL pages; strengthen About/trust; add first-hand proof `[CLAIM]`
- [ ] Do not disavow without a manual action or a documented paid-link history `[G]` `[CLAIM]`
- [ ] Log the changes with dates so the next update's effect can be attributed `[INFERENCE]`

## G. Local / Google Business Profile

- [ ] Eligible: in-person contact with customers during stated hours; no virtual office; no online-only business `[G]`
- [ ] Name = exact business name, no keywords or city `[G]`
- [ ] Primary category = the most specific match; secondary categories added `[PROVEN]`
- [ ] Address shown if customers visit; service-area business hides it and lists areas within ~2 h `[G]`
- [ ] Google's predefined services selected `[PROVEN]`
- [ ] Website URL = canonical home or location page, no tracking parameters `[WARNED]`
- [ ] Hours, phone, photos real and current; avoid repeated edits `[WARNED]`
- [ ] One profile per location; no duplicates `[G]`
- [ ] Review asks: same message to every real customer, no incentives, no gating, no suggested wording (`assets/reviews-kit.md`) `[G]` `[OFFICIAL]`
- [ ] Reply to every review; steady cadence, never a burst `[PROVEN]` `[WARNED]`
- [ ] Website NAP identical to GBP; 10-20 core listings identical `[PROVEN]` (47-expert survey: [Whitespark, 2025-11](https://whitespark.ca/local-search-ranking-factors/))
- [ ] Location page on the site per staffed location; city pages elsewhere only with real local proof `[G]`

## H. AI-search visibility

- [ ] Page indexed and snippet-eligible = already eligible for AI Overviews / AI Mode; nothing extra required `[G]`
- [ ] Dedicated pages rank for the fan-out sub-queries (service + stack / industry / city / "cost") `[G]` `[PROVEN]`
- [ ] Main content in raw HTML; `scripts/onpage-check.mjs` word count not flagged `[CLAIM]`
- [ ] robots.txt allows OAI-SearchBot and PerplexityBot (search inclusion); GPTBot / Google-Extended / ClaudeBot decided deliberately `[OFFICIAL]`
- [ ] Real reviews on the profiles engines cite for the category `[DATA]` ([BrightLocal, 2026-08](https://www.brightlocal.com/resources/ai-directory-sources/))
- [ ] Earned inclusion in independent "best/top X" lists; no self-crowning list `[PROVEN]` `[WARNED]`
- [ ] Founder/author long-form on LinkedIn and videos on YouTube with the brand name in titles `[DATA]` ([Semrush, 2026-03](https://www.semrush.com/blog/linkedin-ai-visibility-study/); [Ahrefs, 2025-12](https://ahrefs.com/blog/ai-brand-visibility-correlations/))
- [ ] Specific, dated facts quotable in HTML `[DATA]` ([Ahrefs, 2025-12](https://ahrefs.com/blog/ai-vs-made-up-brand-experiment/))
- [ ] Measurement set up: GSC Generative AI report, Bing AI Performance, GA4 AI channel, monthly prompt panel `[OFFICIAL]` `[DATA]` ([SparkToro, 2026-01](https://sparktoro.com/blog/new-research-ais-are-highly-inconsistent-when-recommending-brands-or-products-marketers-should-take-care-when-tracking-ai-visibility/))
- [ ] No llms.txt effort beyond keeping an accurate one if it exists `[G]` `[DATA]` ([SE Ranking, 2026-10](https://seranking.com/blog/llms-txt/))
- [ ] No seeded Reddit/forum mentions `[WARNED]`

## I. Image SEO (for image search, Lens, Discover, shares - not web rankings `[G]`)

Full notes: `references/image-seo.md`.
- [ ] Content images in `<img>` / `<picture>`, never CSS backgrounds ("Google doesn't index CSS images") `[G]`
- [ ] Contextual alt text, no stuffing (stuffed alt "can be treated as spam"); `alt=""` on decorative images `[G]`
- [ ] Descriptive hyphenated filenames; extension matches the real type `[G]`
- [ ] Images beside the text they illustrate; captions where natural `[G]`
- [ ] Responsive: `srcset` + `sizes` (Next.js: `sizes` on every responsive `next/image`) with an `<img src>` fallback `[G]` `[OFFICIAL]`
- [ ] WebP default, AVIF if build cost allows; served at display size `[OFFICIAL]`
- [ ] LCP image eager / `fetchPriority="high"`; everything else natively lazy; no scroll-triggered loading `[G]`
- [ ] One stable URL per image `[G]`
- [ ] `max-image-preview:large` site-wide `[G]`
- [ ] A preferred image per page: real photo, 16:9, >= 1200 px, no text/logo (`primaryImageOfPage` or `og:image`); OG text cards are for social only `[G]` `[INFERENCE]`
- [ ] Original screenshots/photos on case studies, reviews and team pages (originals > AI > stock as a preference, not a penalty) `[G]`
- [ ] Image sitemap (`image:loc` only) for images not reachable by crawl; CDN domain verified in GSC `[G]`
- [ ] Inline SVG labelled with `<title>`; license metadata only if you license images `[G]`
- [ ] Rendered `src` checked with URL Inspection `[G]`
- [ ] Reports read correctly: GSC Image and Multimodal search types separately; image packs inflate Web impressions and crush CTR `[G]` `[PROVEN]`

## J. On-page improvement and "boring" keywords (rank without paid marketing)

Full notes: `references/boring-keywords-and-onpage.md`.
- [ ] GSC queries pulled for 3-16 months, branded excluded; positions 8-30 with impressions listed; queries no page targets listed `[PROVEN]`
- [ ] Bottom-of-funnel patterns mined from sales calls, emails, PAA, autocomplete, forums: cost / vs / alternatives / "for [industry]" / integration / error strings `[PROVEN]`
- [ ] Each candidate SERP checked by hand; winnable = forums, stale pages, off-intent results, low-RD pages in the top 10 `[PROVEN]`
- [ ] One query cluster -> one page; merge only true near-duplicates (several pages for one query "doesn't seem problematic") `[G]`
- [ ] Title written in the searcher's words, brand at the end; no extra keywords (split tests: they did not help) `[G]` `[DATA]` ([SearchPilot, 2025-09](https://www.searchpilot.com/resources/case-studies/expanding-your-title-tag-testing-strategy))
- [ ] First passage answers the query; first-hand detail follows (real prices, screenshots, process) `[G]`
- [ ] Internal links from the strongest pages with varied descriptive anchors (+25% in one split test) `[DATA]` ([SearchPilot, 2020-08](https://www.searchpilot.com/resources/case-studies/seo-split-test-lessons-increasing-internal-linking))
- [ ] Ship, hold 4-8 weeks, compare in GSC; substantive refresh at ~6 months if not top 10; never bump dates `[DATA]` ([Ahrefs, 2025-05](https://ahrefs.com/blog/how-long-does-it-take-to-rank/)) `[G]`
- [ ] Old content improved, not deleted ("not a thing"); prune only scaled/programmatic leftovers `[G]` `[PROVEN]`
- [ ] One free tool or original-data page per cluster as the linkable asset `[CLAIM]`
- [ ] Expectation set with the owner: zero links win long-tail and bottom-of-funnel, not head terms; 1.74% of new pages reach the top 10 within a year; nobody can guarantee #1 `[DATA]` ([Ahrefs, 2025-05](https://ahrefs.com/blog/how-long-does-it-take-to-rank/)) `[G]`

## K. Free link building (no paid marketing)

Catalogue with link attributes, approximate authority and fit per category: `references/free-link-sources.md` and `assets/free-link-sources.csv`. Most free sources are nofollow or mention-only; `[G]` nofollow is a hint and `[DATA]` mentions correlate with AI visibility more than links do ([Ahrefs, 2025-05](https://ahrefs.com/blog/ai-overview-brand-correlation/)) - still worth doing, but budget followed-link effort on journalist platforms, original data and tools.
- [ ] Case studies published; each client asked for an editorial mention on their about/case page (never a contract clause; nofollow any site-wide credit) `[G]`
- [ ] Local profiles with identical details: GBP only if genuinely eligible, Bing Places, Apple Business Connect `[G]` `[CLAIM]`
- [ ] Category review profiles complete and reviewed by real clients: Clutch + GoodFirms (agencies), G2/Capterra (software), Trustpilot (any) - nofollow, value = referral, trust, AI citation `[G]` `[DATA]` ([SE Ranking, 2026-01](https://seranking.com/blog/review-platforms-in-ai-overviews/))
- [ ] Entity profiles as consistent `sameAs` nodes: LinkedIn page + founder, YouTube, Crunchbase, GitHub org `[DATA]` ([Ahrefs, 2025-12](https://ahrefs.com/blog/ai-brand-visibility-correlations/))
- [ ] Journalist-source platforms joined and answered as a real expert: Source of Sources, Qwoted Free, MentionMatch, HARO digest (21.9-40% of requests offer some link) `[DATA]` ([BuzzStream, 2025-07](https://www.buzzstream.com/blog/journalist-request-platform-study/))
- [ ] One original-data study per half-year, published with method and raw table, pitched (`assets/outreach-kit.md`) `[DATA]` ([Muck Rack, 2026](https://muckrack.com/research/state-of-journalism))
- [ ] Free tool or resource per cluster + resource-page outreach (reply baseline ~8.5%) `[CLAIM]` `[DATA]` ([Backlinko, 2019](https://backlinko.com/email-outreach-study))
- [ ] Tools site: Show HN, Product Hunt, SaaSHub (verified), AlternativeTo; re-verify listings quarterly `[DATA]` ([SaaSCity, 2026-10](https://saascity.io/directories))
- [ ] Technical posts republished on Dev.to with `canonical_url` only if the syndication risk is accepted (Google recommends noindex for syndicated copies) `[DATA]` ([HackerNoon, 2026-10](https://hackernoon.com/i-checked-the-rel-attribute-on-20-platforms-most-backlinks-pass-nothing)) `[G]`
- [ ] Broken-link outreach run on your best topic: dead pages in your niche that still have links -> a live replacement you genuinely have -> one short email per linking page (`assets/outreach-kit.md` section F) `[PROVEN]` method, `[DATA]` supply ([Ahrefs](https://ahrefs.com/blog/link-rot-study))
- [ ] Unlinked mentions found and asked for a link once mentions exist `[PROVEN]`
- [ ] Testimonials for vendors you use (your host, database, email or payments provider...) offered without making a link the condition `[CLAIM]` `[G]`
- [ ] Talks, meetups, podcasts logged as mentions `[CLAIM]`
- [ ] Any paid placement carries `rel="sponsored"` and a visible label `[G]`
- [ ] Never: "300+ high-DA profile" lists, Web 2.0 blogs, bookmarking/PDF blasts, forum signatures/comment spam, "DA 90+ backlink" gigs, paid "dofollow" launch listings, badge-for-listing exchanges, contract-required footer credits, guest-post networks, reviews-for-links `[WARNED]` `[G]`
- [ ] Wikipedia not attempted without significant independent coverage; Wikidata only once references exist, with COI disclosed `[G]`
- [ ] Honest expectation logged with the owner: zero-link sites plateau on competitive terms; nobody can guarantee #1 `[DATA]` ([Ahrefs, 2023-12](https://ahrefs.com/blog/search-traffic-study/)) `[G]`
