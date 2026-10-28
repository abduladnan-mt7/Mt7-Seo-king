# Programmatic SEO: when pages at scale are legitimate

Templates plus data can produce useful pages ("PDF to Word", "USD to INR", "Notion vs Obsidian") or a scaled-content-abuse problem that drags down the whole site. The difference is whether each page carries something a searcher can't get from its siblings. Tags as in SKILL.md. Added 2026-10-29; the pattern list and data ladder are adapted from marketing-skills' `programmatic-seo` (MIT, see THIRD_PARTY_NOTICES.md). The gates are this skill's own and win on conflict.

## 1. The policy line `[G]`

- Scaled content abuse: "many pages are generated for the primary purpose of manipulating search rankings and not helping users", however they are made (AI, templates, humans) `[G]` ([spam policies](https://developers.google.com/search/docs/essentials/spam-policies#scaled-content)).
- Doorway abuse: multiple similar pages that each target a variation (city, synonym) and funnel to one destination `[G]`.
- "Automated transformations like synonymizing, translating" of content that adds little value are named scaled-content examples `[G]`.
- The August 2026 spam update hit "substantially similar pages" sites hard (SKILL.md "Never do") `[DATA]`.

## 2. The gate (every page type, before the first batch)

A page type passes only if all four are true:
1. **Distinct data per page.** Something on page N (values, worked examples, constraints, a rate, a table, a format quirk) is not on page N+1. Swapping one noun does not count `[G]`.
2. **Real demand per page.** The query exists in GSC, Bing, Keyword Planner or autocomplete. "Zero volume" pages are fine only if they are cheap to keep out of the index `[DATA]` `[INFERENCE]`.
3. **The page does the job.** A converter page converts, a comparison page compares from first-hand use, and a location page has local proof `[G]` (helpful content).
4. **You would build it without search engines.** If the only reason for the page is a keyword, it fails `[G]`.

## 3. How defensible is your data? `[INFERENCE]`

Strongest to weakest: **proprietary** (your measurements, your users' aggregate results) > **product-derived** (what your tool actually computes, its real limits) > **user-generated** (reviews, submissions, moderated) > **licensed** > **public** (government tables, Wikipedia-level facts). Pages built only on public data compete with everyone holding the same table and need the most added value.

## 4. Patterns and what each one must carry

| Pattern | Example URL | Legitimate only when the page carries |
|---|---|---|
| Conversions (tools sites) | `/pdf-to-word`, `/usd-to-inr` | A working tool in HTML, the method or formula, worked examples, edge cases and format limits. Rates and values are dated |
| Comparisons | `/x-vs-y` | First-hand use of both, dated facts, a verdict per use case (`assets/templates/comparison-page.md`) |
| Alternatives | `/x-alternatives` | 4-7 real options with criteria; the publisher not crowned by default `[WARNED]` |
| Integrations | `/integrations/x` | What the integration actually does, setup steps, limits |
| Glossary | `/glossary/term` | A definition plus how it applies in your domain, linked to the tools and pages that use it |
| Templates / examples | `/templates/invoice` | The usable artefact itself, not a description of one |
| Directory / profiles | `/companies/x` | Verified facts per entry, reviews moderated, thin entries noindexed |
| Locations | `/city/service` | Passes `assets/templates/city-location-page.md`, or it isn't built `[G]` |
| Personas ("X for Y") | `/invoicing-for-freelancers` | Content that changes for the persona (features, examples, pricing). A swapped noun is a doorway `[G]` |
| Translations | `/de/...` | Reviewed translation `[INFERENCE]` and hreflang (`references/international-seo.md`) `[G]` |

## 5. Launch and scale

- Ship a small batch of one type first (10-30 pages is this skill's habit, not a sourced number `[INFERENCE]`). Give them their own sitemap so the GSC Pages report can be filtered to that type `[G]` (sitemap filter) `[INFERENCE]` on the method.
- Read the batch after 4-8 weeks, then decide whether to scale `[PROVEN]`:
  - **Indexed and getting impressions:** scale carefully.
  - **"Discovered – currently not indexed":** Google found the URLs and postponed crawling them `[G]` ([Page indexing report](https://support.google.com/webmasters/answer/7440203)). That usually means crawl priority or site-level signals, not the template. Don't add more.
  - **"Crawled – currently not indexed":** Google read the pages and declined them `[G]`. Merge, enrich or noindex before adding anything.
- If pages you asked Google to re-crawl were re-crawled with the new content and still sit at "Crawled – currently not indexed", the verdict is site-level. Stop requesting indexing; prune and earn links instead `[INFERENCE]` (observed pattern).
- Noindex the long tail that lacks demand or distinct data (`noindex, follow` keeps link flow) and leave it out of the sitemap `[PROVEN]`. Pruning scaled leftovers is the exception to "don't delete content" (SKILL.md myths).

## 6. Pre-launch checklist (per page type)

- [ ] Gate in section 2 passed and written down
- [ ] Unique title and meta description built from the page's own data, not "<Noun> - Free Online <Noun> Tool" on every page. Run `scripts/sitemap-audit.mjs`; it flags repeated titles and descriptions
- [ ] Primary content and the tool output in server HTML (`scripts/onpage-check.mjs`)
- [ ] Linked from its hub and from 2+ related pages; breadcrumb trail (`references/site-architecture.md`)
- [ ] In its own sitemap; no URL in that sitemap is noindexed or canonicalised elsewhere (verify with `scripts/sitemap-audit.mjs` before claiming otherwise)
- [ ] Structured data matches visible content; no FAQ/HowTo rich-result expectations `[G]`
- [ ] A kill rule decided up front: e.g. "not indexed after 8 weeks → merge or noindex"
