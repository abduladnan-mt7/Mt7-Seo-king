# What Google itself says (tier 1)

Last verified 2026-10-20. Tags: `[G]` Google documentation, Status Dashboard or staff statement on an official channel; `[REPORTED]` Google staff quoted by trade press (not in docs). Re-check any dated item against Search Central and the Search Status Dashboard before relying on it (see the re-verification protocol in SKILL.md).

## 1. Crawl, index, rank

- `[G]` Pipeline: crawl (links, sitemaps, JS rendering) -> index (analyse, pick one canonical per duplicate cluster) -> serve/rank. "Indexing isn't guaranteed." Google "doesn't accept payment to rank pages higher". [How Search Works, 2025-12-18](https://developers.google.com/search/docs/fundamentals/how-search-works)
- `[G]` Named ranking systems: BERT, crisis information, deduplication, exact match domain, freshness, link analysis/PageRank, local news, MUM, neural matching, original content, removal-based demotion, passage ranking, RankBrain, reliable information, reviews, site diversity, spam detection (SpamBrain). [Ranking systems guide, 2025-12-10](https://developers.google.com/search/docs/appearance/ranking-systems-guide)
- `[G]` The "helpful content system" no longer exists separately: "In March 2024, it evolved and became part of our core ranking systems." (same guide)
- `[REPORTED]` Illyes, Search Central Live Barcelona 2026-10-02: a new URL is typically discovered in ~20 h and indexed ~1.5 h after that; slow cases (tied to quality) take "months or never". [PPC Land, 2026-10-03](https://ppc.land/google-says-new-pages-take-about-20-hours-to-be-found-some-never-are/)
- `[G]` "It can take a few weeks for Google to notice a new site". [Get on Google](https://developers.google.com/search/docs/fundamentals/get-on-google) Changes take "a few hours" to "several months"; wait "a few weeks" before judging a change. [SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide) The old "four months to a year" line for new sites was removed. [Do you need an SEO?, 2026-06-05](https://developers.google.com/search/docs/fundamentals/do-i-need-seo)

## 2. E-E-A-T and the Quality Rater Guidelines

- `[G]` "While E-E-A-T itself isn't a specific ranking factor..."; "Of these aspects, trust is most important." Raters assess main content on effort, originality, talent/skill, accuracy. Changing dates without substantial change is called out as a warning sign; mass AI text "without manual oversight or curation" is little/no effort; fabricated creator profiles (AI headshots, false credentials) are deceptive. [Creating helpful content, 2026-10-05](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- `[G]` "Search raters have no control over how pages rank. Rater data is not used directly in our ranking algorithms." (same page)
- `[G]` Latest QRG edition 2025-09-11. [raterhub PDF](https://guidelines.raterhub.com/searchqualityevaluatorguidelines.pdf) `[REPORTED]` Changelog: updated YMYL definitions (election/civic), AI Overview examples added; previous edition 2025-01-23 (170 -> 181 pages, aligned with spam policies). [SER, 2025-09-12](https://www.seroundtable.com/google-search-quality-raters-guidelines-update-40092.html) Claims of a "2026 edition" were not reflected in the hosted document on 2026-10-20.
- `[G]` Raters judge "Needs Met": interpret intent first, then how fully a result satisfies it (QRG 2025-09).

## 3. Spam policies that bite ordinary businesses

Source: `[G]` [Spam policies, 2026-08-28](https://developers.google.com/search/docs/essentials/spam-policies)

- Doorway abuse: pages "created to rank for specific, similar search queries" that "lead users to intermediate pages that aren't as useful as the final destination". Named examples: "multiple domain names or pages targeted at specific regions or cities that funnel users to one page"; "substantially similar pages that are closer to search results than a clearly defined, browseable hierarchy".
- Scaled content abuse: "many pages are generated for the primary purpose of manipulating search rankings and not helping users... no matter how it's created" (generative AI explicitly included).
- Site reputation abuse: third-party content published "mainly because of" the host's ranking signals. `[G]` Since Aug 2026, manual actions under this policy don't apply to EEA searches. [Search Central Blog, 2026-08](https://developers.google.com/search/blog/2026/08/update-site-reputation-policy)
- Expired domain abuse: a bought expired domain repurposed "primarily to manipulate search rankings by hosting content that provides little to no value".
- Link spam: links "primarily for the purpose of manipulating search rankings" - buying/selling, "excessive link exchanges", automated link building, widely distributed footer/widget links.
- `[REPORTED]` Mueller on 1,300 keyword+city pages: "That sounds like doorway pages, not something I'd recommend". [SER, 2019-12-12](https://www.seroundtable.com/google-city-landing-pages-doorway-pages-28670.html) No newer statement found.

## 4. AI-generated content

- `[G]` Not banned. Generating "many pages without adding value" may be scaled content abuse. "It is critical to manually factcheck and review all AI-generated content" including titles, meta descriptions, structured data and alt text. [Using generative AI content, 2026-10-01](https://developers.google.com/search/docs/fundamentals/using-gen-ai-content)
- `[G]` "Rewarding high-quality content, however it is produced". [Blog, 2023-02-08](https://developers.google.com/search/blog/2023/02/google-search-and-ai-content)

## 5. Update history, 2024 to Oct 2026

Source: `[G]` [Search Status Dashboard history](https://status.search.google.com/products/rGHU1u87FJnkP6W2GwMi/history)

| Year | Core updates | Spam updates | Other |
|---|---|---|---|
| 2024 | Mar 5 (~45 d), Aug 15 -> ~Sep 3, Nov 11 -> ~Dec 5, Dec 12 -> 18 | Mar 5 -> 20, Jun 20 -> 27, Dec 19 -> 26 | |
| 2025 | Mar 13 -> 27, Jun 30 -> Jul 17, Dec 11 -> 29 | Aug 26 -> ~Sep 21 | |
| 2026 | Mar 27 (12 d), May 21 (11 d) | Mar 24 (19.5 h), Jun 24 (2 d), Aug 18 -> 21, Sep 24 -> Oct 8 | Discover update Feb 5 |

- `[G]` Google also runs unannounced "smaller core updates"; recovery "could take several months". [Core updates, 2025-12-10](https://developers.google.com/search/docs/appearance/core-updates) Spam systems learn compliance "over a period of months". [Spam updates](https://developers.google.com/search/docs/appearance/spam-updates)
- `[G]` Aug 2026 specifics: spam update 2026-08-18 09:28 PT -> 08-21, global, all languages. [Incident](https://status.search.google.com/incidents/LEubPCm2octf2uMqCFKE) Search Console logging errors Aug 13-17 (Generative AI report) and Aug 13 (Discover) were data-only. [Data anomalies](https://support.google.com/webmasters/answer/6211453) `[REPORTED]` Mueller: Aug 12-13 drop "just a logging issue". [SER, 2026-08-17](https://www.seroundtable.com/google-search-console-performance-reports-drop-41884.html) `[DATA]` SE Ranking: 16.71% of top-10 URLs dropped past 100 in that spam update (snippet only). [SEL](https://searchengineland.com/google-august-2026-spam-update-ranking-impact-485980)
- Diagnostic lesson: a traffic drop that matches no dashboard event is a logging anomaly, a site change, a manual action, a security issue, or domain consolidation - check those before blaming an algorithm.

## 6. Site moves, redirects, canonicals

- `[G]` 301/308 "don't cause a loss in PageRank"; keep redirects "at least 1 year"; self-referencing canonicals on new URLs; new sitemap; update internal links; small-medium sites take "a few weeks for most pages to move"; file Change of Address "for all verified variants of the old domain". [Site moves with URL changes, 2026-08-20](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes)
- `[G]` Change of Address tool: own both properties; old homepage must 301 to the new homepage; domain-level properties only; "does not move any subdomains... (including www)"; signals forwarded for 180 days; not for www/non-www switches; no stated filing deadline. [Change of Address help](https://support.google.com/webmasters/answer/9370220)
- `[REPORTED]` Illyes: moves typically settle in 1-3 months. [PPC Land, 2026-10-03](https://ppc.land/google-says-new-pages-take-about-20-hours-to-be-found-some-never-are/)
- `[G]` Redirects and rel=canonical are "strong" canonical signals, sitemaps "weak"; never send conflicting signals. [Consolidate duplicate URLs, 2026-07-10](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) Google "might hold pages in a duplicate cluster for up to two weeks" after a fix. [Canonicalization troubleshooting, 2026-08-21](https://developers.google.com/search/docs/crawling-indexing/canonicalization-troubleshooting)
- `[G]` Put the same WebSite structured data on every home-page duplicate (www and non-www). [Site names, 2025-12-10](https://developers.google.com/search/docs/appearance/site-names)

## 7. Page experience and Core Web Vitals

- `[G]` "Core Web Vitals are used by our ranking systems", but "Google Search always seeks to show the most relevant content, even if the page experience is sub-par"; "There is no single signal"; chasing perfect scores for SEO alone may not be worthwhile. [Page experience, 2026-09-22](https://developers.google.com/search/docs/appearance/page-experience)
- `[G]` Thresholds: LCP <= 2.5 s, INP < 200 ms, CLS < 0.1; INP replaced FID 2024-03-12. [Core Web Vitals, 2025-12-10](https://developers.google.com/search/docs/appearance/core-web-vitals)
- Practical reading: fix CWV because it is a tie-breaker and a conversion lever; never sell it as the reason a page will rank.

## 8. Structured data

- `[G]` Search gallery lists 25 features incl. Organization, Local business, Article, Breadcrumb, Software app, Review snippet, Video, Profile page. FAQ and HowTo are gone. [Gallery, 2026-10-16](https://developers.google.com/search/docs/appearance/structured-data/search-gallery)
- `[G]` FAQ rich results deprecated 2026-05-07, docs removed 2026-06-15. [Docs changelog](https://developers.google.com/search/updates) `[REPORTED]` Mueller: "No need to change anything, but if you did it for search, you can remove the markup". [SER, 2026-05-11](https://www.seroundtable.com/google-drops-faq-rich-results-41298.html) HowTo deprecated Sept 2023.
- `[G]` Organization: on the home or About page; recommended `name`, `alternateName`, `url`, `logo`, `sameAs`, `address`, `contactPoint`, `legalName`, `taxID`, `vatID`; use the most specific subtype; LocalBusiness only for a physical location; no guaranteed feature. [Organization, 2026-09-08](https://developers.google.com/search/docs/appearance/structured-data/organization) LocalBusiness requires `name` + a physical `address`. [Local business, 2026-09-08](https://developers.google.com/search/docs/appearance/structured-data/local-business)
- `[G]` Review snippet: an entity that controls reviews about itself (own site or third-party widget) is ineligible for star snippets on its LocalBusiness/Organization pages. [Review snippet, 2026-09](https://developers.google.com/search/docs/appearance/structured-data/review-snippet)
- `[G]` Title links are built from `<title>`, h1, og:title, anchors and links; rewritten when half-empty, obsolete, inaccurate, boilerplate or ambiguous. [Title links](https://developers.google.com/search/docs/appearance/title-link) Snippets come from page content; the meta description is used only if it is more accurate. [Snippets, 2026-04](https://developers.google.com/search/docs/appearance/snippet)
- `[G]` "The length of the content alone doesn't matter for ranking purposes." [SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- `[G]` Links: "Every page you care about should have a link from at least one other page"; descriptive anchors; links are "a signal when determining the relevancy of pages". [Links crawlable, 2025-12](https://developers.google.com/search/docs/crawling-indexing/links-crawlable) `[G]` nofollow / sponsored / ugc are "hints" for ranking since 2019-09 and for crawl/index since 2020-03-01. [Evolving nofollow, 2019-09](https://developers.google.com/search/blog/2019/09/evolving-nofollow-new-ways-to-identify)
- `[G]` Freshness systems apply only where freshness is expected (ranking systems guide). The only named "topic authority" system is for news. [News topic authority, 2023-05](https://developers.google.com/search/blog/2023/05/understanding-news-topic-authority)

## 9. Google Business Profile rules (official)

- `[G]` "Local results are mainly based on relevance, distance, and popularity"; prominence draws on "how many websites link to your business and how many reviews you have"; "There's no way to request or pay for a better local ranking". [GBP Help](https://support.google.com/business/answer/7091)
- `[G]` Eligibility: "a business must make in-person contact with customers during its stated hours"; "online-only businesses" are ineligible. [GBP eligibility](https://support.google.com/business/answer/13763036)
- `[G]` Virtual offices ineligible; a service-area business hides its address, up to 20 service areas within roughly a 2-hour drive of its base; co-working needs signage, own staff and customers received during hours; "Do not create more than one page for each location". [GBP guidelines](https://support.google.com/business/answer/3038177) [Service areas](https://support.google.com/business/answer/9157481)
- `[G]` The name must not include "Service or product information" or "Location information" (suspension risk). (GBP guidelines, above)
- `[G]` Review policy prohibits incentives ("payment, discounts, free goods and/or services"), gating ("Discourage or prohibit negative reviews, or selectively solicit positive reviews"), conflict-of-interest reviews (incl. "a contractual or consultory relationship") and staff quotas. [Contribution policy](https://support.google.com/contributionpolicy/answer/7400114) Penalties: new reviews blocked, existing ones unpublished, a consumer warning. [Restrictions, GBP help](https://support.google.com/business/answer/14114287?hl=en)
- `[G]` Knowledge panels are generated automatically and can be claimed only once they exist. [Knowledge panel help](https://support.google.com/knowledgepanel/answer/9163198)

## 10. Brand and site names

- `[G]` Site names come from the home page and "references to it that appear on the web"; use consistent naming and `alternateName` for variants. [Site names, 2025-12-10](https://developers.google.com/search/docs/appearance/site-names)
- `[REPORTED]` Mueller: "think about what's reasonable for 'your site's name'"; a generic-word name is "not something that uniquely identifies your homepage". [SER, 2025-12-26](https://www.seroundtable.com/google-reasonable-site-name-seo-rank-40660.html) Having a brand name "doesn't mean you'll rank for that query by default". [SER, 2019-03-05](https://www.seroundtable.com/not-rank-own-brand-name-in-google-27206.html) Generic keyword domains compete with directories. [SEJ, 2025](https://www.searchenginejournal.com/google-cautions-businesses-against-generic-keyword-domains/553290/)
- `[G]` `.io` is a generic TLD (no country targeting). Locale signals are a local address/phone, currency, local links and a Business Profile. [Multi-regional sites](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites)

## 11. AI features in Search (official)

- `[G]` To appear in AI Overviews / AI Mode a page needs only to be indexed and snippet-eligible: "There are no additional requirements... nor other special optimizations necessary." [AI features, 2025-12](https://developers.google.com/search/docs/appearance/ai-features)
- `[G]` Google's own AI-optimization guide: GEO/AEO "is still SEO"; structured data "isn't required"; Search ignores llms.txt; no chunking or LLM-only writing; mass query-variant pages can breach scaled content abuse; "Seeking inauthentic 'mentions'... isn't as helpful as it might seem"; no third-party tool has access to Google's ranking or AI systems. [AI optimization guide, 2026-05-15, updated 2026-07](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
- `[G]` Links are chosen via "query fan-out"; AI Overviews and AI Mode may use different models and cite different links. (AI features, above)
- `[G]` Controls: `nosnippet`, `data-nosnippet`, `max-snippet`, `noindex`; since 2026-08-31 a site-wide "Search generative AI control" in Search Console, which "isn't used as a ranking or inclusion signal" elsewhere. [Search Console help, 2026-08](https://support.google.com/webmasters/answer/16908024?hl=en) `Google-Extended` governs Gemini training/grounding, not Search. [Google crawlers, 2026-10](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers)
- `[G]` Reporting: AI Mode is counted in Performance (Web) since 2025-06; a separate Generative AI performance report (impressions only: page, country, device, date; no queries or clicks) reached all sites 2026-08-31 and may not appear for low-volume sites. [Help, 2026-08](https://support.google.com/webmasters/answer/16984139?hl=en) [Blog, 2026-06](https://blog.google/products-and-platforms/products/search/new-controls-website-owners/)
- `[G]` 2026-06-15 changelog: Search doesn't use llms.txt; no ranking effect; fine to keep for other services. [Search Central updates](https://developers.google.com/search/updates)

## 12. Myths Google has explicitly denied

- E-E-A-T is a ranking factor ("No, it's not"). Raters change rankings directly.
- A target word count ("no magical word count target"); meta keywords; keywords in the domain name ("hardly any effect").
- A "duplicate content" manual action.
- llms.txt, "AI text files", chunking, or special schema needed for AI features.
- Paying Google or buying Ads improves organic ranking; a guaranteed #1.
- Perfect Core Web Vitals guarantee top rankings.
- AI content is penalised for being AI.
