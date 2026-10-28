# Keyword research and ranking mechanics (tier 1 + tier 2)

Last verified 2026-10-20. Tags: `[G]` Google official; `[DATA]` study (sample size and date given - nearly all are correlational and vendor-run: Ahrefs, Semrush, Backlinko (Semrush-owned), AWR); `[CLAIM]` practitioner consensus without data; `[INFERENCE]` this skill's own reasoning. The underlying research used a US-centric SERP view; verify local SERPs (e.g. google.co.in) by hand.

## 1. Search intent comes first

- `[G]` Raters judge "Needs Met": interpret intent first, then how fully a result satisfies it. [QRG, 2025-09](https://guidelines.raterhub.com/searchqualityevaluatorguidelines.pdf)
- `[CLAIM]` Four intents (informational / commercial / transactional / navigational); Ahrefs' "3 Cs": match the content type, format and angle of what already ranks. Single case: +516% traffic after adding the free tool the query expected. [Ahrefs, 2024-10](https://ahrefs.com/blog/search-intent/)
- `[DATA]` n = 8,000 results / 800 US queries: directories hold 31% of local-intent top-10s and 37% of informational; "best attorney" = 68% directories; business sites own 61% of transactional results. Read: "best X" belongs to listicles/directories, "X service in city" to business sites. [BrightLocal, 2024-10](https://www.brightlocal.com/research/business-listings-visibility-study/)
- `[DATA]` ~14B pages: 96.55% get zero Google traffic; causes = no demand, no backlinks, intent mismatch (e.g. a product page for a "best" query). [Ahrefs, 2023-12](https://ahrefs.com/blog/search-traffic-study/)
- `[INFERENCE]` Before writing any page, search the target query on the local Google domain in a private window and record the SERP format (business pages, directories, listicles, videos, AI Overview). Build the format that wins; do not fight it.

## 2. Keyword difficulty - what the numbers mean

- `[DATA]` Ahrefs KD = referring domains to the current top 10 only, non-linear (KD 40 ~ 56 RDs, 60 ~ 129, 90 ~ 756). [Ahrefs KD](https://ahrefs.com/keyword-difficulty) Ahrefs admits KD ignores your authority, intent, freshness and weak SERPs; "no metric accurately predicts". [Ahrefs, 2025-12](https://ahrefs.com/blog/keyword-difficulty/)
- `[DATA]` Semrush KD = median RDs of top 10 + dofollow/nofollow ratio + median Authority Score + SERP features; 0-14 very easy, 15-29 easy, 30-49 possible. [Semrush KB](https://www.semrush.com/kb/1158-what-is-kd) "Personal KD" adds topical relevance of your domain. [Semrush KB](https://de.semrush.com/kb/1434-how-is-personal-keyword-difficulty-calculated)
- Moz KD: page-1 PA/DA weighted by expected CTR (weak sourcing: old forum replies).
- `[DATA]` ~93% of US keywords get < 10 searches/month. [Ahrefs, 2026-05](https://ahrefs.com/blog/long-tail-keywords-research/) Of ~20M pages with zero referring domains only 1 in 6,671 gets > 1K visits/month - and those are on low-competition topics. [Ahrefs, 2023-12](https://ahrefs.com/blog/search-traffic-study/)
- `[CLAIM]` Low-authority sites: target specific modifiers (stack, industry, city, "cost", "for X") and SERPs where low-DR or outdated pages already rank.

## 3. Backlinks

- `[DATA]` n = 11.8M results (2020 data, updated 2025-04): the #1 result has 3.8x more backlinks than #2-10; ~95% of pages have no backlinks; Domain Rating correlates, page-level URL Rating only weakly. [Backlinko](https://backlinko.com/search-engine-ranking)
- `[DATA]` n = 44,589 keywords: links from pages that get traffic did not correlate better than total links. [Ahrefs, 2019-02](https://ahrefs.com/blog/links-with-traffic-study/)
- `[DATA]` n = 75K brands: branded web mentions correlate 0.664 with AI Overview mentions vs backlinks 0.218 and referring domains 0.295. [Ahrefs, 2025-05](https://ahrefs.com/blog/ai-overview-brand-correlation/)
- `[G]` Links are "a signal when determining the relevancy of pages"; PageRank is still a named core system. `[REPORTED]` Illyes: links are not a top-3 factor. [SEL, 2023-09](https://searchengineland.com/links-google-search-ranking-factor-gary-illyes-432422) `[G]` Paid or widely distributed footer links are link spam.
- `[G]` nofollow / sponsored / ugc are "hints" (ranking since 2019-09, crawl/index since 2020-03-01). [Google, 2019-09](https://developers.google.com/search/blog/2019/09/evolving-nofollow-new-ways-to-identify)
- `[INFERENCE]` Client-site credit links ("Built by X") must be brand-anchored and `rel="nofollow"` or `sponsored`; a keyword-anchored footer link on every client site is the textbook pattern Google names as link spam.

## 4. Topical focus and internal linking

- `[G]` The only named "topic authority" system is for news. [Google, 2023-05](https://developers.google.com/search/blog/2023/05/understanding-news-topic-authority)
- 2024 API leak: `siteFocusScore` and `siteRadius` exist; weights unknown. [SEL, 2024-05](https://searchengineland.com/unpacking-googles-massive-search-documentation-leak-442716)
- `[DATA]` (weak, secondhand) Zyppy, 23M internal links across 1,800 sites: anchor-text variety tracked traffic; diminishing returns beyond ~45 links per page. [Wix recap, 2022-08](https://wix.com/seo/learn/resource/internal-linking-webinar) `[DATA]` Zyppy 400+ sites: tight topical focus correlated with winning, r = 0.25. [Zyppy, 2026-04](https://signal.zyppy.com/p/winning-google)
- `[G]` "Every page you care about should have a link from at least one other page"; use descriptive anchors. [Links crawlable](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)
- Verdict: topic clustering as a tactic = `[CLAIM]`; deliberate internal linking with descriptive anchors = `[G]`.

## 5. How long ranking takes

- `[DATA]` 1M new URLs: 1.74% reached the top 10 within a year (6.11% in a filtered 2M English sample); 40.82% of those that made it did so in month 1; 13.7% of top-10 pages are < 1 year old (22% in 2017); 72.9% are > 3 years old; the average #1 is 5 years old. Advice: update pages not in the top 10 after ~6 months. [Ahrefs, 2025-05](https://ahrefs.com/blog/how-long-does-it-take-to-rank/) 2017 study: 5.7%, typically 61-182 days.
- `[G]` Changes take "a few hours" to "several months". [SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- `[INFERENCE]` Plan in 6-12 month horizons; judge a page at 6 months, then update or consolidate it.

## 6. CTR by position and zero-click (figures age fast - re-verify)

- `[DATA]` > 1.75M US SERPs/month, Jul 2026: desktop #1 20.02% (9.69% with an AI Overview), #2 10.36%, #3 3.89%; mobile #1 35.74%; AIO on 43% of desktop SERPs; zero-click 74.3% with AIO vs 53.6% without; commercial #1 11.91% -> 3.51% with AIO; branded #1 27.32% vs unbranded 19.38%. [AWR, 2026-09](https://www.advancedwebranking.com/seo/organic-ctr)
- `[DATA]` 300K keywords, desktop GSC: AIO associated with 58% lower #1 CTR (Dec 2025); 34.5% in the Apr 2025 run. [Ahrefs, 2026-02](https://ahrefs.com/blog/ai-overviews-reduce-clicks-update/)
- `[DATA]` 3,119 informational queries, 42 clients: AIO-query CTR 1.76% -> 0.61%; brands cited in the AIO 0.70% vs uncited 0.52%. [Seer, 2025-11](https://www.seerinteractive.com/insights/aio-impact-on-google-ctr-september-2025-update)
- `[DATA]` 900 adults, 68,879 searches: 8% clicked a result when an AI summary showed vs 15% without; 1% clicked a link inside the summary; question queries triggered summaries 60% of the time. [Pew, 2025-07](https://www.pewresearch.org/short-reads/2025/07/22/google-users-are-less-likely-to-click-on-links-when-an-ai-summary-appears-in-the-results/)
- `[DATA]` 68.01% of US searches were zero-click Jan-Apr 2026 (60.45% in 2024; panels differ); 276 clicks per 1,000 searches reach the open web. [SparkToro, 2026-06](https://sparktoro.com/blog/in-2026-less-than-one-third-of-google-searches-still-send-a-click/) via [SER](https://www.seroundtable.com/google-zero-click-searches-fall-41475.html)
- Counter-evidence `[DATA]`: Semrush (10M+ keywords) AIO trigger rate 6.49% -> 24.61% -> 15.69% across 2025; same-keyword zero-click fell 33.75% -> 31.53% after an AIO appeared. [Semrush, 2025-12](https://www.semrush.com/blog/semrush-ai-overviews-study/) `[G]` Google: clicks "relatively stable", no data published. [Google, 2025-08](https://blog.google/products/search/ai-search-driving-more-queries-higher-quality-clicks/) First Page Sage's 39.8% #1 CTR is opaque - weak.
- India: AI Mode launched July 2025 (first international market) [9to5Google, 2025-07](https://9to5google.com/2025/07/07/google-ai-mode-india/); 7 Indian languages added Oct 2025 [TechCrunch, 2025-10](https://techcrunch.com/2025/10/08/googles-search-live-comes-to-india-ai-mode-gets-more-languages). No India CTR study found.

## 7. Brand and navigational queries (name collisions)

- `[G]` Organization markup helps Google "disambiguate your organization"; `sameAs` lists profiles. [Organization, 2026-09](https://developers.google.com/search/docs/appearance/structured-data/organization) Site names come from the home page and "references to it that appear on the web"; consistent naming and `alternateName` for variants. [Site names, 2025-12](https://developers.google.com/search/docs/appearance/site-names) Knowledge panels are automatic; claimable only once they exist. [Google](https://support.google.com/knowledgepanel/answer/9163198)
- `[REPORTED]` Mueller: pick a name you can reasonably rank for; generic names compete with directories. [SEJ, 2025](https://www.searchenginejournal.com/google-cautions-businesses-against-generic-keyword-domains/553290/)
- `[CLAIM]` When the bare brand term collides with bigger entities (e.g. a short brand that is also a motorbike model, a brake part and a chipset), win "brand + modifier" queries (software, city, agency, reviews, domain) first; `[DATA]` section 3 shows brand mentions drive brand visibility.

## 8. Freshness, titles, descriptions, length

- `[G]` Freshness systems apply only where freshness is expected; changing dates without substantial change is a warning sign. [Creating helpful content, 2026-10](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- `[DATA]` 17M citations: AI assistants cite content 25.7% fresher than organic results; AI Overviews skew oldest. [Ahrefs, 2025-07](https://ahrefs.com/blog/do-ai-assistants-prefer-to-cite-fresh-content/)
- `[G]` Title links are built from `<title>`, h1, og:title, anchors; rewritten when half-empty, obsolete, inaccurate, boilerplate or ambiguous. [Title links](https://developers.google.com/search/docs/appearance/title-link) `[DATA]` 80,959 titles / 2,370 sites: 61.6% rewritten; > 70 chars rewritten 99.9%; 51-60 chars best. [Zyppy, 2022-01](https://zyppy.com/seo/google-title-rewrites/) Ahrefs measured 33.4%. [Ahrefs, 2022](https://ahrefs.com/blog/title-tags-study)
- `[G]` Snippets come from content; the meta description is used only if more accurate. [Snippets, 2026-04](https://developers.google.com/search/docs/appearance/snippet) `[DATA]` 192,656 pages: 62.78% of meta descriptions rewritten. [Ahrefs, 2020](https://ahrefs.com/blog/meta-description-study/)
- `[G]` "The length of the content alone doesn't matter for ranking purposes." `[DATA]` Average top-10 page 1,447 words but no relationship with position; keyword-in-title ~ zero correlation; page speed ~ zero correlation. [Backlinko, 2025-04](https://backlinko.com/search-engine-ranking)

## 9. Free keyword-research workflow (no paid tools)

1. Search Console: Queries x Pages; regex filters for questions and long queries; list queries at positions 8-20 (striking distance). `[DATA]` ~46.77% of clicks come from anonymized queries, worse on small sites (22B clicks, 887,534 properties). [Ahrefs, 2026-02](https://ahrefs.com/blog/gsc-anonymized-queries/)
2. Google Keyword Planner (free; set country/city; very low volumes hidden; no-spend accounts see ranges). [Google Ads help](https://support.google.com/google-ads/answer/7337243)
3. Bing Webmaster Tools Keyword Research (free, country filter). [Practical Ecommerce](https://www.practicalecommerce.com/using-bings-keyword-research-tool)
4. Ahrefs Webmaster Tools / free tiers (own verified sites only).
5. Autocomplete, People Also Ask, Related searches - private window on the local Google domain `[CLAIM]`.
6. Competitor service pages and directory category names (Clutch, GoodFirms, G2, Yelp, Justdial - whichever your category uses) to mirror buyer phrasing; Google Trends for relative comparison.
7. Rough volume `[CLAIM]`: your top-10 impressions ~ the demand you are exposed to; multiply by the AWR CTR curve for a click forecast; a one-week exact-match Google Ads test gives real impression counts (the only paid step, optional).

Record results in `assets/keyword-intent-map.csv`.

## 10. What SERPs looked like for agency queries (US proxy, 2026-10; verify locally)

- "web development company in <city>": agency city landing pages, directory city pages (e.g. GoodFirms ~750 firms with sponsored slots), UGC/press-release platforms.
- "best software company in <city>": employer/job lists = job-seeker intent, not buyer intent - skip.
- "AI agent development company": vendor "Top 10 ... 2026" listicles and AI-agent directories.
- No credible public volume exists for these in India; use the free workflow above.

## 11. Myths the data contradicts

- Longer content ranks better (`[G]` no; `[DATA]` Backlinko no relationship).
- KD tells your odds (ignores your site and intent).
- Nofollow links are ignored (hints since 2019-20).
- #1 gets 30-40% of clicks (`[DATA]` AWR: 20% desktop, 9.7% with AIO).
- Google uses my meta description (`[DATA]` rewrites ~63%).
- Updating the date signals freshness (`[G]` warning sign).
- E-E-A-T / topical authority are confirmed ranking factors (`[G]` E-E-A-T is not; topic authority is news-only).
- Page speed / Lighthouse scores move rankings (`[DATA]` ~zero correlation) - sell performance as UX/conversion, not SEO.
- AI Overviews make everything zero-click (mixed; Semrush same-keyword data shows no rise).

## Could not verify

Seer's 2026 recovery figures (secondhand), Zyppy's primary internal-link write-up, Google India SERP composition, Keyword Planner India volumes.
