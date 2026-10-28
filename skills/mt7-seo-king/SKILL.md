---
name: mt7-seo-king
description: Mt7 SEO King - evidence-tiered SEO for any category of website (local, agency, SaaS, e-commerce, publisher, tools, app, marketplace, clinic). Use whenever the user mentions SEO, ranking on Google, keyword research, an SEO audit, local SEO, Google Business Profile, reviews, city/service/industry pages, backlinks or free link building, a traffic drop or Google update, a site migration, site architecture or internal linking, programmatic pages at scale, hreflang/international, structured data, Core Web Vitals, image SEO, Search Console, llms.txt, or visibility in AI Overviews, AI Mode, ChatGPT, Perplexity or Gemini (GEO/AEO) - including vague asks like "why isn't my site showing up". Google's docs first, large studies second, community tactics only when proven; every recommendation carries its evidence tier. Ships checklists, gated page templates, JSON-LD, outreach kits, a dated Google-update ledger and four zero-dependency Node scripts.
---

# Mt7 SEO King

A method for ranking any website as high as it honestly can go - on Google, Bing and the AI answer engines - without paid marketing and without the tactics that get sites demoted. Core research verified **2026-10-20**; additions and corrections **2026-10-29**. Nobody can guarantee a #1 ranking; Google says so and so does this skill `[G]`.

## The evidence rule (read first)

Every rule in this skill carries a tag. Keep the tags in everything you produce with it.

| Tag | Meaning | Weight |
|---|---|---|
| `[G]` | Google's own documentation, Status Dashboard, or a Google staff statement on an official channel | Tier 1 - decides conflicts |
| `[OFFICIAL]` | Another platform's own docs (GBP Help, Bing, OpenAI, Perplexity, Anthropic, Trustpilot, Clutch, GA4) | Tier 1 for that platform |
| `[REPORTED]` | Google staff quoted by trade press, not in docs | Tier 1.5 - cite the date |
| `[DATA]` | A large study - always note sample size and date; nearly all are vendor-run and correlational | Tier 2 |
| `[PROVEN]` | Several independent practitioners report specifics and it does not contradict `[G]` | Tier 3, accepted |
| `[CLAIM]` | Anecdote, vendor case, single source - "second until proved" | Tier 3, use with care |
| `[WARNED]` | Widely reported to cause demotion, deindexing, suspension or review removal | Do not do |
| `[INFERENCE]` | Sensible practice the research does not cover; this skill's own reasoning | Say so |

Precedence: `[G]` beats everything. Where community evidence conflicts with Google, follow Google and say so (the conflicts table is in `references/community-evidence.md` section 9). Never state something the references do not support; if you add a practice, tag it `[INFERENCE]`.

## Verify before you report (audit hygiene)

A wrong finding costs more than a missed one: the owner acts on it. In a blind test of three SEO skills on one live site, every false positive came from asserting something that one fetch would have disproved. So:
- **Report only what you observed** on a fetched URL, header, or report, and say which. If you didn't check, it goes under "Not measured", not under findings.
- **Sitemap claims need `scripts/sitemap-audit.mjs`.** Never say a sitemap "lists noindexed pages" or "sends contradictory signals", and never recommend shrinking it, until each URL's status, robots and canonical were fetched. A sitemap should list every canonical, indexable URL; there is no ideal size `[G]`.
- **"No schema" needs the rendered page** (JS-injected JSON-LD is invisible to raw fetches), and **nested `parentOrganization`/`subOrganization`/`brand` nodes are not duplicates** (`assets/schema/README.md`).
- **"Orphan" or "no About page" needs the navigation checked**, including JS-rendered menus and the footer.
- **A drop needs a date before a cause.** Find the first day in GSC's date view, check `scripts/google-updates.mjs --around <date>` (updates and Search Console logging errors), and rule out site changes (`scripts/sitemap-audit.mjs --compare`) before naming an algorithm.
- **No invented thresholds.** "Keep location pages under 50", "60% unique", "1,500 words for a blog" have no source; don't present numbers like these as rules.

## Where to start

- Full audit or "why isn't my site showing up" -> Phase 0, then every phase in order; report with the format at the end of this file.
- Pick the site's category first: `references/category-playbooks.md` tells you which page types, directories and pitfalls apply before you plan anything.
- Keyword research only -> Phase 2 (run Phase 0 first if Search Console access exists). Schema -> `assets/schema/README.md`. Site move -> `assets/site-move-checklist.md`. Reviews -> `assets/reviews-kit.md`. Links without budget -> Phase 5. AI visibility -> Phase 6 (it is Phases 1-5 wearing a different hat). A single page -> `scripts/onpage-check.mjs` plus the matching template.
- Traffic dropped -> Phase 0 with `scripts/google-updates.mjs --around <first day>` and master-checklist section F. Site structure or internal links -> `references/site-architecture.md`. Pages at scale (tools, conversions, locations, comparisons) -> `references/programmatic-seo.md`. Several languages or countries -> `references/international-seo.md`. Checking links you earned -> `scripts/link-check.mjs`.
- A worked end-to-end example (a fictional young agency): `examples/worked-example-agency.md`.

## Workflow

Run the phases in order on any site. Each has what to do, the gate to pass, and the file to open. Skip a phase only when its gate is already met.

### Phase 0 - Diagnose
- Do: Search Console (domain property) - 28-day clicks/impressions, branded vs non-branded, Pages report, Manual actions, Security issues, URL Inspection on the home page and 3 money pages; `site:` search for stray hosts; Search Status Dashboard for events overlapping any drop `[G]` (`scripts/google-updates.mjs --around <date>` checks a dated ledger of updates and Search Console logging errors first). Run `scripts/onpage-check.mjs` on the home page and each money page and `scripts/sitemap-audit.mjs --repeat 3` on the site; save its snapshot (`--save`) so the next audit can diff against it.
- Gate: you can state, with evidence, why the site gets the traffic it gets (indexing, canonical, intent coverage, reviews, links, age). A drop that matches no dashboard event is a logging anomaly, a site change, a manual action, a security issue or domain consolidation before it is "an algorithm" `[G]`. GSC impressions from 2025-05-13 to 2026-04-27 were mis-logged (clicks were fine), so compare clicks across that boundary `[G]`. Pages re-crawled with new content that stay "Crawled - currently not indexed" mean a site-level verdict, not a discovery problem `[INFERENCE]`.
- Open: `assets/gsc-monthly-review.md`, `references/google-official.md` section 5.

### Phase 1 - Technical and entity foundations
- Do: one canonical host with 301/308 from every variant; self-canonicals; sitemap of canonical 200 URLs; robots.txt allowing search and answer-engine crawlers; Organization + WebSite JSON-LD with `alternateName` and `sameAs`; consistent brand spelling and NAP; Bing Webmaster Tools + IndexNow; server errors (5xx/429) near zero, because Google slows crawling when it sees them; HTML under Googlebot's 2 MB fetch limit; Core Web Vitals within thresholds (a tie-breaker, not a lever) `[G]`. Main content in raw HTML, not JS-only `[CLAIM]`. Crawlable `<a href>` navigation and a hub-and-spoke structure (`references/site-architecture.md`) `[G]` `[PROVEN]`.
- Gate: `assets/checklists/master-checklist.md` section A all ticked; Google-selected canonical = yours on inspected pages.
- Open: `assets/schema/README.md`, `assets/robots-and-crawlers.md`; for a domain move, `assets/site-move-checklist.md`.

### Phase 2 - Intent and keyword map
- Do: free workflow - GSC queries (positions 8-30 = striking distance), Keyword Planner, Bing keyword research, autocomplete/PAA on the local Google domain, competitor and directory category phrasing; check every SERP by hand and record its format `[DATA]` `[PROVEN]`. Prefer "boring" bottom-of-funnel patterns: "[service] for [industry]", "[A] vs [B]", "[thing] cost in [country]", "how to [task]", local + service `[PROVEN]`.
- Gate: every target has an intent, a SERP format you can match, one page (existing or planned), and a priority; "best X" queries owned by directories/listicles are marked "pitch lists", not "build page" `[DATA]`.
- Open: `assets/keyword-intent-map.csv`, `references/keyword-and-ranking.md`, `references/boring-keywords-and-onpage.md`.

### Phase 3 - Page types and content
- Do: one page per distinct intent, answer-first, with first-hand specifics (real numbers, dated prices, named people, original images) `[G]`; choose the page type with the decision table below; pass the template's gate; title in the searcher's words, 50-60 chars, brand last `[DATA]`; internal links with descriptive anchors from the strongest pages `[G]` `[DATA]`; human fact-check of anything AI-drafted `[G]`.
- Gate: master-checklist section B for every page; no page is a name-swapped or templated variant `[G]`.
- Open: `assets/templates/` (service, industry, city-location, case-study, comparison, how-to-choose-guide, about-team, content-brief), `references/category-playbooks.md` for the site's category, `references/programmatic-seo.md` before any page type built from a template, `references/international-seo.md` for other languages, `references/image-seo.md` for image-heavy sites.

### Phase 4 - Local and reviews (if the business meets customers)
- Do: GBP only if eligible (in-person contact; no virtual office); exact name, best primary category, predefined services, address shown or hidden per policy; steady real reviews with replies; identical NAP on 10-20 core listings `[G]` `[PROVEN]` `[DATA]`.
- Gate: master-checklist section G; review requests follow `assets/reviews-kit.md` (same ask to everyone, no incentives, no gating, no wording).
- Open: `references/local-reviews-directories.md`.

### Phase 5 - Links and earned mentions, without paid marketing
- Do, in this order: publish proof assets (case studies, original data, free tools) `[CLAIM]` `[DATA]`; claim and complete every real profile as consistent `sameAs` nodes (mostly nofollow - fine: nofollow is a hint `[G]` and mentions correlate with AI visibility more than links `[DATA]`); answer journalist-source platforms as a real expert (21.9-40% of requests offer a link) `[DATA]`; pitch independent "best X" lists with specifics `[PROVEN]`; ask clients for editorial mentions, nofollow any site-wide credit `[G]`; broken-link outreach where you have a genuine replacement (`assets/outreach-kit.md` section F) `[PROVEN]`; reclaim unlinked mentions `[PROVEN]`. Check every earned link with `scripts/link-check.mjs` (present? followed? on an indexable page?).
- Honest ceiling: on-page work and boring long-tail queries win low-competition searches; competitive terms need earned links and mentions. In the one zero-backlink test, 50 interlinked posts reached ~1,500 visits/month by month 6 while the main term stuck on page 2-3 `[CLAIM]`; of ~20M pages with zero referring domains, 1 in 6,671 gets more than 1K visits/month `[DATA]`; 1.74% of new pages reach the top 10 within a year `[DATA]`. Say this to the owner before promising anything.
- Gate: master-checklist section K; every paid placement carries `rel="sponsored"` `[G]`; nothing from the "looks free, is spam" table.
- Open: `references/free-link-sources.md`, `assets/free-link-sources.csv`, `assets/outreach-kit.md`.

### Phase 6 - AI-search visibility
- Do: nothing special - indexed + snippet-eligible is the whole requirement `[G]`. Then: dedicated pages for the fan-out sub-queries `[G]`; reviews on the profiles engines cite for the category `[DATA]`; inclusion in independent lists `[PROVEN]`; founder LinkedIn long-form and YouTube with the brand in titles `[DATA]`; quotable dated facts in visible HTML `[DATA]`; robots.txt allowing OAI-SearchBot and PerplexityBot `[OFFICIAL]`; rank in Bing too `[PROVEN]`.
- Gate: master-checklist section H; no llms.txt effort, no "AI schema", no seeded forum mentions `[G]` `[DATA]` `[WARNED]`.
- Open: `references/ai-search-visibility.md`, `assets/ai-visibility-measurement.md`, `assets/ai-visibility-panel.csv`.

### Phase 7 - Measure and iterate
- Do: monthly GSC review (retitle striking-distance pages, one change per page, hold 4-8 weeks); quarterly re-verification and pruning only of scaled leftovers; judge a page at 6 months, then refresh substantively or merge `[DATA]` `[G]`. Track AI visibility as % of runs mentioning the brand, never a rank `[DATA]`.
- Gate: master-checklist sections C and D; a dated log of changes so the next core update can be attributed `[INFERENCE]`.
- Open: `assets/gsc-monthly-review.md`.

## Page-type decision table

| Page type | Legitimate when | Becomes doorway / scaled abuse when | Template |
|---|---|---|---|
| Service page | One page per real service, answering buyer questions; SERP shows business pages `[PROVEN]` `[DATA]` | Cloned per synonym or city `[G]` | `service-page.md` |
| Industry page | Anchored on a real case in that industry with industry-specific substance `[PROVEN]` | Industry names swapped over one template `[G]` | `industry-page.md` |
| City / location page | Real local proof (clients, staff, staffed office), unique copy, in the nav hierarchy `[INFERENCE]` from `[G]` | City name swapped; cities you have never worked in; 20+ at once `[G]` `[WARNED]` | `city-location-page.md` (gate blocks it) |
| Case study | Permission, measured dated results, a real difficulty `[G]` original content | Invented results, stock imagery, client numbers without consent | `case-study.md` |
| Comparison page | First-hand experience with every option; useful even to non-buyers; names peers fairly `[PROVEN]` | Ranks the publisher #1 or is generated per competitor `[WARNED]` `[G]` | `comparison-page.md` |
| "How to choose a provider in city" guide | Criteria from real engagements; reader could hire a competitor with it `[G]` | A ranked list with yourself on top; cloned per city `[WARNED]` `[G]` | `how-to-choose-guide.md` |
| Listicle ("best X") | Independent, disclosed methodology, sponsored slots labelled - usually someone else's page `[DATA]` | Self-crowning; undisclosed paid positions `[WARNED]` `[G]` | pitch via `outreach-kit.md` |
| Blog / answer page | One distinct question, first-hand answer, named author, tight topical focus `[G]` `[DATA]` | Mass AI articles, date-bumping, hosting third-party content for rankings `[G]` | `content-brief.md` |
| Product page | Unique description, real price/stock in HTML, Product+Offer schema `[G]` | Manufacturer boilerplate at scale; fake reviews | `schema/product-offer.md` |
| Category / collection page | Real descriptive copy, buying guidance, facets canonicalised to the base category `[G]` | Every filter permutation indexed; "category in city" clones `[G]` | `category-playbooks.md` section 4 |
| Programmatic pages | Unique data and demand per page; the long tail noindexed `[PROVEN]` | Variant pages for query fan-out; thin permutations `[G]` `[WARNED]` | `references/programmatic-seo.md` (gate first) |

## Never do (tier-tagged)

- City or query-variant pages at scale; "substantially similar pages" `[G]` `[WARNED]` (Aug 2026 spam cases lost 14K-200K+ queries).
- Mass AI content without human review; fabricated authors, AI headshots, invented credentials `[G]`.
- A "Top 10 X" list ranking yourself #1 `[WARNED]` (contested, but the downside is large).
- Buying links or list positions without `rel="sponsored"`; PBNs, link insertions, guest-post networks, "300+ high-DA profile" lists, bookmarking blasts, forum-signature links, badge-for-listing exchanges, contract-required footer credits, reviews-for-links `[G]` `[WARNED]`.
- Keyword-anchored site-wide credit links on client sites `[G]`.
- Keywords or city in the GBP name; a GBP at a virtual office or unstaffed address; duplicate profiles; tracking parameters in the GBP website field; needless profile edits `[G]` `[WARNED]`.
- Review incentives, gating, staff/family/partner reviews, swaps, purchased reviews, bursts `[G]` `[OFFICIAL]` `[WARNED]`.
- Self-serving `AggregateRating` / review stars on your own Organization/LocalBusiness pages `[G]`.
- Hosting third-party content mainly for your ranking signals (site reputation abuse); expired-domain tricks `[G]`.
- Seeding Reddit/forums/Medium to influence LLMs `[WARNED]` `[G]`.
- Conflicting canonical signals (redirect one way, canonical another); www/apex split `[G]`.
- Date-bumping without substantive change; writing to a word count `[G]`.
- Scripts that hijack the back button or rewrite browser history (often ad or "retention" widgets) `[G]`.
- Promising a ranking or a timeline you cannot evidence `[G]`.

## Myths to refuse

- "E-E-A-T is a ranking factor" - `[G]` "No, it's not"; trust matters, raters don't rank pages.
- "Longer content ranks better" - `[G]` length alone doesn't matter; `[DATA]` no relationship with position.
- "Keyword difficulty tells your odds" - `[DATA]` it ignores your site and intent.
- "Nofollow links are worthless" - `[G]` hints since 2019-20; `[DATA]` mentions matter for AI visibility.
- "#1 gets 30-40% of clicks" - `[DATA]` AWR Jul 2026: 20% desktop, 9.7% with an AI Overview.
- "Google uses my meta description" - `[DATA]` ~63% rewritten; write it for humans.
- "Page speed / Lighthouse 100 moves rankings" - `[G]` tie-breaker; `[DATA]` ~zero correlation. Sell performance as UX/conversion.
- "Images and alt text lift web rankings" - `[G]` image search only.
- "llms.txt / special AI schema / chunking gets you into AI answers" - `[G]` nothing extra is required; `[DATA]` no correlation.
- "Backlinks are dead, mentions cause citations" - `[DATA]` correlational only; both matter.
- "Zero search volume = zero demand" - `[G]` ~15% of daily queries are new.
- "Delete old content to rank" - `[G]` "not a thing"; improve it. (Pruning IS right for scaled programmatic leftovers `[PROVEN]`.)
- "Cannibalization is always bad" - `[REPORTED]` Mueller 2025: several pages for one query "doesn't seem problematic".
- "Hundreds of citations / an office in every city / Google Posts move local rankings" - `[DATA]` accuracy beats volume; posts rank #148 of 187 factors.
- "FAQ schema earns rich results" - `[G]` gone since 2026-05-07 (HowTo since 2023-09).
- "AI content is penalised for being AI" - `[G]` judged on value, not origin.
- "Stock photos are penalised" - `[G]` no; originals are preferred, not required.
- "Someone can guarantee #1" - `[G]` no.

## Re-verification protocol

SEO facts age in months. This skill was verified on **2026-10-20**. Before relying on any of these, re-check the primary source and update the date in the file you use:
- Update dates and rollouts -> Search Status Dashboard (`status.search.google.com`); add new ones to `data/google-updates.json` with their Google URL and bump `last_verified`.
- Deprecations, new reports, policy wording -> Search Central changelog (`developers.google.com/search/updates`) and the spam policies page.
- AI features, crawler tokens, controls -> `developers.google.com/search/docs/appearance/ai-features`, the Google crawlers list, OpenAI / Perplexity / Anthropic bot docs.
- CTR and zero-click figures, AI citation studies -> re-pull the cited study; note the new date and n.
- Link attributes of directories and platforms -> inspect live HTML; "unverified" stays unverified until you do.
- GBP rules and review policies -> GBP Help and the contribution policy.
If a check contradicts a reference file, follow the primary source, edit the reference with the new date, and tag the change.

## How to report findings

When the skill is used on a site, ALWAYS produce this structure (Markdown; tags on every line that makes a claim):

```
# SEO audit and plan: <site> (<date>; facts verified against sources dated <date>)
## 1. Snapshot
Category, age, stack, indexable pages, GSC 28-day clicks/impressions, branded vs non-branded, profiles and review counts, known constraints/owner rules.
## 2. Diagnosis (evidence-tagged)
Table: finding | evidence (GSC/inspection/script/source) | reading with tag.
## 3. Decisions
What this site will and will not do (page types, city pages, lists, training-bot policy) with the tag and the owner rule behind each.
## 4. Prioritised actions
Table: # | action | phase | owner (Owner / Builder) | effort (L/M/H) | expected effect | how we'd know it failed | evidence tag | due.
P0 = blocks everything (indexing, canonicals, penalties, recurring 5xx); P1 = this month; P2 = this quarter; P3 = later.
Order by what changes Google's evaluation of the site. While a site-level verdict holds, server errors, pruning the weak tail and earned links outrank on-page polish. A diagnostic step (a lookup, a re-check) is not an action and never takes a top slot.
## 5. 90-day plan
Three windows (days 1-14, 15-45, 46-90) with Builder and Owner columns.
## 6. Measurement
What will be read monthly (GSC review, review velocity, prompt panel, Bing AI Performance), and what "good" looks like as process metrics - no ranking promises.
## 7. Don'ts specific to this site
## 8. Not measured and assumptions
What you could not check (no GSC access, JS-rendered nav, rate-limited APIs) and the assumptions the plan rests on.
## 9. Open questions for the owner
```
Keep it short: the owner reads sections 3-5; the builder reads 2 and 4. Point to the asset files rather than pasting them.

## Scripts (Node 18+, no dependencies, nothing to install)

### On-page check

`scripts/onpage-check.mjs` - dependency-free, Node 18+. Fetches the raw HTML (no JavaScript) the way a non-rendering crawler does and prints a compact PASS/WARN/FAIL report.

```
node "<skill-dir>/scripts/onpage-check.mjs" https://example.com/page
node "<skill-dir>/scripts/onpage-check.mjs" https://example.com/page --json
node "<skill-dir>/scripts/onpage-check.mjs" https://example.com/page --ua "Mozilla/5.0 ..." --timeout 20000
```
Reports: status + redirect chain; title and length; meta description and length; canonical (self-referencing?); meta robots and X-Robots-Tag (noindex = FAIL); `max-image-preview`; h1 count; JSON-LD @types (flags FAQPage/HowTo and AggregateRating); hreflang; images missing alt; word count of visible text with a JavaScript-dependence flag (empty app shell or "enable JavaScript" notice = FAIL; < 150 words = WARN); Open Graph basics and og:url vs canonical; html lang; viewport. Exit code 1 if any FAIL, 2 if the fetch failed. Run it on every page before publishing and after any template change. Also reports uncompressed HTML size against Googlebot's 2 MB limit.

### Sitemap audit
`scripts/sitemap-audit.mjs` - finds the sitemap via robots.txt (indexes and `.gz` followed) and fetches every listed URL without following redirects.
```
node "<skill-dir>/scripts/sitemap-audit.mjs" https://example.com --limit 500 --repeat 3
node "<skill-dir>/scripts/sitemap-audit.mjs" https://example.com --save before.json
node "<skill-dir>/scripts/sitemap-audit.mjs" https://example.com --compare before.json
```
Reports non-200 URLs, noindexed URLs (header or meta, verified), canonicals pointing elsewhere, duplicate and templated (near-identical) titles/descriptions, orphans (only when every URL was audited), intermittent 5xx/429 across `--repeat` fetches, and bulk-stamped `lastmod`. `--save`/`--compare` diff status, noindex, canonical, title and description per URL between runs. Exit 1 on any FAIL.

### Link check
`scripts/link-check.mjs` - for each source page: links to your domain with anchor and rel, plus page status, noindex, canonical elsewhere and robots.txt blocking for Googlebot.
```
node "<skill-dir>/scripts/link-check.mjs" example.com https://some-blog.com/resources
node "<skill-dir>/scripts/link-check.mjs" example.com --file earned-links.txt --json
```

### Google update ledger
`scripts/google-updates.mjs` reads `data/google-updates.json`: dated core/spam/policy/documentation updates, each citing a Google-owned URL, plus Search Console data anomalies. The ledger was compiled by claude-seo (MIT) and is checked here; it warns when older than 30 days.
```
node "<skill-dir>/scripts/google-updates.mjs" --around 2026-08-16      # what overlapped a drop
node "<skill-dir>/scripts/google-updates.mjs" --since 2026-01 --kind core --kind spam
node "<skill-dir>/scripts/google-updates.mjs" --unverified             # third-party claims, never used as fact
```

## File map

- `references/google-official.md` - Google's own statements: systems, spam policies, updates 2024-2026, site moves, CWV, schema, GBP rules, AI features, denied myths.
- `references/keyword-and-ranking.md` - intent, difficulty, backlinks, time-to-rank, CTR/zero-click data, titles/descriptions, free keyword workflow.
- `references/boring-keywords-and-onpage.md` - low-volume strategy, striking distance, on-page tests, the zero-link ceiling, the 12-step playbook.
- `references/local-reviews-directories.md` - local ranking factors, review rules, city pages, SABs, NAP, B2B directories, "best X" strategy.
- `references/ai-search-visibility.md` - AI Overviews/AI Mode requirements, other engines' crawlers, citation data, llms.txt, measurement.
- `references/image-seo.md` - Google Images/Lens/Discover rules, Next.js specifics, 20-item image checklist.
- `references/free-link-sources.md` + `assets/free-link-sources.csv` - vetted free link/mention catalogue with link attributes, authority (approximate), fit per category, and the "looks free, is spam" list.
- `references/community-evidence.md` - practitioner evidence by tier, recovery after updates, community-vs-Google conflicts.
- `references/category-playbooks.md` - tailored plans for 10 site categories.
- `references/site-architecture.md` - URLs, hubs and spokes, crawlable links, breadcrumbs, pagination/facets, internal-link audit.
- `references/programmatic-seo.md` - the scaled-content line, the per-page-type gate, patterns and what each must carry, launch-and-read rules.
- `references/international-seo.md` - URL structures, no auto-redirects, hreflang rules, canonicals with locales.
- `data/google-updates.json` - the dated update ledger and Search Console anomalies used by `scripts/google-updates.mjs`.
- `assets/checklists/master-checklist.md` - Day-0, per-page gate, monthly, quarterly, site move, recovery, local/GBP, AI visibility, image SEO, on-page/boring keywords, free link building.
- `assets/templates/` - page briefs with gates; `assets/schema/` - JSON-LD templates; `assets/robots-and-crawlers.md`; `assets/keyword-intent-map.csv`; `assets/gsc-monthly-review.md`; `assets/ai-visibility-panel.csv` + `assets/ai-visibility-measurement.md`; `assets/reviews-kit.md`; `assets/outreach-kit.md`; `assets/site-move-checklist.md`.
- `examples/worked-example-agency.md` - the method applied to a fictional composite agency with a 90-day owner/builder plan.
- `scripts/` - `onpage-check.mjs`, `sitemap-audit.mjs`, `link-check.mjs`, `google-updates.mjs`.
