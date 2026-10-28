# "Boring" keywords, on-page improvement, and the zero-link ceiling

Last verified 2026-10-20. Tags: `[G]` Google docs or staff; `[DATA]` study with n; `[PROVEN]` several practitioners; `[CLAIM]` anecdote/vendor; `[WARNED]` demotion; `[INFERENCE]` this skill's reasoning. This is the playbook for ranking without paid marketing: it is honest about what on-page work alone can reach.

## 1. Low-volume ("boring") keywords still win

- `[DATA]` 94.74% of keywords get <= 10 searches/month. [Ahrefs SEO statistics](https://ahrefs.com/blog/seo-statistics/)
- `[G]` ~15% of daily queries are brand-new, so a tool showing volume "0" does not mean zero demand. [SEJ / Mueller, 2025-03](https://www.searchenginejournal.com/google-revisits-15-unseen-queries-statistic-in-context-of-ai-search/543160/)
- `[CLAIM]` (vendor) Bottom-of-funnel content converts at 4-5%+ vs < 1% for top-of-funnel. [Grow and Convert](https://www.growandconvert.com/seo/bottom-of-the-funnel-keywords/)
- `[PROVEN]` Winnable patterns for low-authority sites (mostly bottom-of-funnel): "[service] for [industry]", "[A] vs [B]", "[tool] alternatives", "[thing] cost in [country]", integrations, templates, "how to [exact task]", error/problem strings, local + service.
- `[G]` First-hand content on small domains can outrank big sites ("hidden gems"). [SER, 2023-11](https://www.seroundtable.com/google-search-hidden-gems-ranking-algorithm-36388.html)

## 2. Finding and validating them (free)

- `[PROVEN]` Search Console queries with impressions at positions 8-30 ("striking distance" - a convention, not a Google term). [Clearscope](https://www.clearscope.io/blog/what-are-striking-distance-keywords) GSC added a branded-query filter (2026-03) [Practical Ecommerce](https://www.practicalecommerce.com/search-console-adds-brand-filters) and Query Groups (2025-12, trade press only).
- `[G]` Bing Webmaster Tools keyword research is free and uses Bing organic data (UI may have changed). [Bing, 2012-03](https://blogs.bing.com/webmaster/March-2012/4-things-you-may-not-know-about-Bing-Webmaster-too)
- `[PROVEN]` Other sources: People Also Ask, autocomplete, forums, sales calls, customer emails, support tickets.
- `[PROVEN]` Signs of a weak (winnable) SERP: forum/UGC/Q&A pages ranking, outdated results, mismatched intent, thin directories, low-referring-domain pages in the top 10.
- `[DATA]` ~46.77% of GSC clicks come from anonymized queries, worse on small sites - the visible query list understates demand (keyword-and-ranking.md section 9).

## 3. On-page tactics with evidence

- Titles `[G]`: unique, descriptive, concise; brand at one end; no stuffing; title links are built from `<title>`, h1, og:title and anchors. [Title links, 2025-12](https://developers.google.com/search/docs/appearance/title-link) `[DATA]` Google rewrites ~33% of titles (Ahrefs) to 61.6% (Zyppy; > 70 chars rewritten 99.9%).
- `[DATA]` SearchPilot title split tests: 3 positive, 3 negative, 1 inconclusive - titles matching how people search won; adding extra keywords did not help. [SearchPilot, 2025-09](https://www.searchpilot.com/resources/case-studies/expanding-your-title-tag-testing-strategy) `[DATA]` (2019, 5M results) question-style titles +14.1% CTR. [via Top4](https://insights.top4.com.au/2020/06/30/heres-what-we-learned-about-organic-ctr/)
- Refreshes `[DATA]`: HubSpot's own mature blog saw +106% organic views from refreshing old posts. [HubSpot, 2025-06](https://blog.hubspot.com/marketing/historical-blog-seo-conversion-optimization) `[WARNED]` Date changes without substantive change; writing to a word count. [Creating helpful content, 2026-10](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- Pruning `[G]`: deleting old content to rank is "not a thing" - improve it instead. [SEL / Sullivan, 2023-08](https://searchengineland.com/google-warns-against-content-pruning-as-cnet-deletes-thousands-of-pages-430509) Several pages ranking for one query "doesn't seem problematic". [SEJ / Mueller, 2025-09](https://www.searchenginejournal.com/google-answers-seo-question-about-keyword-cannibalization/556472/) -> consolidate only true near-duplicates. Exception: pruning/noindexing IS the fix for scaled programmatic pages (community-evidence.md section 4).
- Internal links `[DATA]`: SearchPilot split test +25% organic from new category links. [SearchPilot, 2020-08](https://www.searchpilot.com/resources/case-studies/seo-split-test-lessons-increasing-internal-linking) Zyppy (23M links): traffic rises with varied anchors, diminishing returns past ~40 links per page. [Zyppy](https://zyppy.com/seo/internal-links-study/)
- Unique value `[G]`: "original information, reporting, research, or analysis", first-hand expertise. `[PROVEN]` Cover the subtopics competitors cover, then add what they lack.
- `[G]` Passage ranking has been live since 2021-02; nothing special is required. [SEJ / Splitt](https://www.searchenginejournal.com/google-passage-ranking-martin-splitt/388206/)
- `[G]` Schema only where it earns a listed feature; FAQ rich results stopped 2026-05-07. [FAQPage](https://developers.google.com/search/docs/appearance/structured-data/faqpage)
- `[WARNED]` Scaled content abuse and city doorway pages. [Spam policies, 2026-08](https://developers.google.com/search/docs/essentials/spam-policies)

## 4. The zero-link ceiling - what a new site can honestly reach

- `[DATA]` Only 1.74% of new pages reach the top 10 within a year (5.7% in 2017); 13.7% of top-10 pages are < 1 year old (1.3M keywords). [Ahrefs, 2025-05](https://ahrefs.com/blog/how-long-does-it-take-to-rank/)
- `[DATA]` Of ~20M pages with zero referring domains only 2,997 get > 1K visits/month (1 in 6,671); 96.55% of 14B pages get no Google traffic. [Ahrefs, 2023-12](https://ahrefs.com/blog/search-traffic-study/)
- `[G]` Illyes: "it is possible to rank without links" [SEL, 2023](https://searchengineland.com/links-google-search-ranking-factor-gary-illyes-432422); Google needs "very few links" (2024-04, later walked back). [SEJ](https://www.searchenginejournal.com/google-needs-very-few-links/514494/)
- `[CLAIM]` (vendor test) 50 interlinked zero-link posts reached ~1,500 visits/month and 400 keywords by month 6; the main term stuck on page 2-3 until links arrived. [VH Info, 2025-12](https://vh-info.com/2025/12/14/zero-backlink-experiment/)
- `[CLAIM]` Honest ceiling: zero links can win long-tail and bottom-of-funnel queries, not head terms; no audited new-domain zero-link case study exists.
- `[G]` Nobody can guarantee a #1 ranking; Google "doesn't accept payment to rank pages higher" and warns against SEOs who promise it. [How Search Works](https://developers.google.com/search/docs/fundamentals/how-search-works) [Do you need an SEO?, 2026-06-05](https://developers.google.com/search/docs/fundamentals/do-i-need-seo)

## 5. Free tools and original data as link magnets

- `[DATA]` (2015, ~1M posts) research-backed content and opinion journalism earned significantly more links; 75% of 100K posts got zero links. [Contently on BuzzSumo/Moz](https://contently.com/2015/09/16/5-ways-content-goes-viral/)
- `[CLAIM]` (agency-reported) Calculators: PrimePay ~100 links from 12 domains; Reply 71 links from 50 domains within a year. [Ranking Raccoon, 2025](https://www.rankingraccoon.com/blog/post/saas-link-building-strategies) Loganix's tool peaked > 19K visits/month then fell.
- No rigorous multi-site study of free tools as link magnets exists; build one per cluster because it is cheap and earns mentions, not because the data proves it.

## 6. The boring-keyword playbook (12 steps)

1. Pull GSC queries for 3-16 months; exclude branded. `[PROVEN]`
2. Flag positions 8-30 with impressions, and queries no page targets. `[PROVEN]`
3. Mine sales calls, emails, PAA, autocomplete and forums for cost / vs / alternatives / "for [industry]" / integration / error queries. `[PROVEN]`
4. Check each SERP by hand: forums, stale pages, off-intent results = winnable. `[PROVEN]`
5. One query cluster -> one page; merge only true duplicates. `[G]`
6. Match the SERP format (comparison table, price range, steps). `[DATA]` intent studies
7. Answer in the first passage, then first-hand detail (real prices, screenshots, process). `[G]` `[CLAIM]`
8. Title in the searcher's words, brand at the end. `[G]` `[DATA]`
9. Internal links from the strongest pages, varied descriptive anchors. `[DATA]` `[G]`
10. Ship; hold 4-8 weeks; compare in GSC. `[INFERENCE]` on the window; `[G]` on patience
11. Substantive refresh at ~6 months if not in the top 10. `[DATA]`
12. One free tool or original-data page per cluster as the linkable asset. `[CLAIM]`

## 7. Myths

- Zero volume = zero demand (15% of queries are new daily). `[G]`
- Delete old content to rank ("not a thing"). `[G]`
- Bump the date (a warning sign). `[G]`
- Cannibalization is always bad (not per Mueller, 2025). `[G]`
- Links don't matter (zero-link pages rarely get traffic). `[DATA]`
- AI Overviews need llms.txt or special schema (no). `[G]`
- FAQ schema earns rich results (gone 2026-05). `[G]`
