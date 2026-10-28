# Worked example: a young web agency (fictional composite)

**Everything here is invented** to show the method end to end: the business, its clients and its numbers. The shape of the problem is common, so the reasoning carries over to any young service business. Tags as in SKILL.md.

## 1. Snapshot

- "Northwind Studio": a 14-month-old web/software/AI agency. Team in a large Indian metro; company registered in the founder's smaller home town. Next.js site, ~25 indexable pages, case studies with measured performance numbers.
- Search Console, last 28 days: ~25 impressions/day, almost all on the brand. Brand query "northwind" at average position ~7 with ~1 click: the name collides with a famous sample database, a few hotels and a clothing label. Non-brand queries are close to zero.
- Moved from a country-code domain to a `.io` six weeks ago. Redirects are in place; **Change of Address not filed**. Google's canonical for some pages is still the `www` host.
- Profiles exist on GBP, Clutch, GoodFirms and Trustpilot, each with **zero reviews**.
- Clients (all willing to be named): a two-property resort group, a dental clinic, an education start-up, and two D2C brands based in the home town.

Owner rules (they override generic advice):
1. City pages only where a client exists.
2. Hospitality proof lives on an industry page, not on a page named after the resort's town.
3. Never call ourselves "the best"; earn third-party lists.
4. No registered address or client revenue figures in public copy without permission.
5. Performance scores are sold as UX/conversion proof (90+ only), never as an SEO lever.

## 2. Diagnosis (Phase 0)

| Finding | Evidence | Reading |
|---|---|---|
| Brand at ~7 with 1 click | GSC, date view | A short, shared name doesn't rank by default for that query `[REPORTED]`. Win "Northwind + modifier" (studio, agency, reviews, city) first `[CLAIM]` |
| Non-brand ~0 | GSC | No page targets a buyer query in buyer words; zero reviews keeps the brand off the directory pages that own "best X in city" `[DATA]`; the ccTLD move dropped a country signal `[G]`. Not a penalty; Manual actions empty |
| Mixed canonicals (apex vs www) | URL Inspection | Consolidation drag; `sitemap-audit.mjs` shows every sitemap URL 200 and self-canonical, so the remaining lag is Google's, expected to settle `[G]` |
| Change of Address unfiled | owner | Signals are forwarded for 180 days only after filing; file from each old property (apex and www separately) `[G]` |
| No update overlap | `google-updates.mjs --around <move date>` | Nothing ranking-related within 14 days, so the dip after the move is consolidation, not an update `[G]` |
| Zero reviews everywhere | owner | Reviews drive directory placement and are heavily cited in AI answers for agencies `[DATA]` `[OFFICIAL]` |

Not measured: competitors' backlink profiles (no paid tool), CrUX field data (too little traffic).

## 3. Foundations (Phase 1)

- Organization JSON-LD: `name` "Northwind Studio", `alternateName` ["Northwind", "northwind.io"], `logo`, `sameAs` (LinkedIn, GitHub, Clutch, GoodFirms, Trustpilot, GBP share link) `[G]`. City-level address only (rule 4); never a fake one.
- WebSite JSON-LD with the site name on both host variants `[G]`.
- File Change of Address; keep old-domain redirects at least a year `[G]`.
- Restore the country signal with content: local phone, INR pricing, named local clients, one GBP `[G]`.
- Save a baseline: `sitemap-audit.mjs --save baseline.json`.

## 4. Intent map (Phase 2)

| Query family | SERP | Decision |
|---|---|---|
| "northwind" + modifier | own site + profiles | P0: entity work + reviews |
| "web development company in <metro>" | agency pages + directory city pages | P1: a real city page (it passes the gate: four local clients) |
| "best web development company in <metro>" | directories + listicles | Don't build a page; get reviews and pitch independent lists `[DATA]` `[WARNED]` |
| "AI chatbot development company India" | vendor pages + listicles | P1: one service page per real offering `[PROVEN]` |
| "website cost in India" | guides + pricing pages | P1: a priced guide with real INR ranges `[PROVEN]` |
| "hotel booking engine India" | vendor pages | P1: hospitality industry page anchored on the resort case (rule 2) |
| "clinic website design" | vendor pages | P2: healthcare industry page anchored on the dental case |
| "D2C website development <home town>" | thin | P2: home-town page with the two D2C cases, if it passes the gate |

## 5. Pages (Phase 3) with gates

- **Service pages:** web development, software/product, AI agents, mobile apps. One each, answer-first, with approved price ranges (`assets/templates/service-page.md`).
- **Industry pages:** hospitality (resort case), healthcare (dental case), D2C (two cases). Each is anchored on a real, measured case (`industry-page.md`).
- **City pages:** the metro passes (named local clients, in-person meetings, a NAP that matches GBP). The home town passes only with the two D2C cases and a description of how engagements actually run. The resort's town is never built (rule 2).
- **Guides:** "How much does a website cost in India" and "How to choose a web agency in <metro>". These are the honest substitute for a "best X" page.
- **About/team:** real names, roles and LinkedIn profiles (`about-team-page.md`).
- Every new template batch goes through `references/programmatic-seo.md` section 2. Here that means none: every page is hand-built.

## 6. Local and reviews (Phase 4)

- GBP named exactly "Northwind Studio". If clients don't visit the office, set it up as a service-area business with the address hidden `[G]`.
- Ask all clients the same way, one platform each, spread over 6-8 weeks, with no incentives and no suggested wording (`assets/reviews-kit.md`) `[G]`. Order: Google, Clutch, GoodFirms, then Trustpilot.
- No `AggregateRating` markup on the site `[G]`.

## 7. Links (Phase 5), at no cost

In order:
1. Case studies, plus an editorial mention from each client, with any footer credit nofollowed `[G]`.
2. Identical local profiles.
3. Clutch and GoodFirms reviews.
4. Journalist-source platforms as an Indian SMB tech source `[DATA]`.
5. One original-data piece per half-year, such as anonymised performance across client sites `[DATA]`.
6. Broken-link outreach on one topic where the agency has a real replacement page (`outreach-kit.md` section F).
7. Pitch independent "agencies in <metro>" lists.

Track every link earned with `link-check.mjs`.

## 8. 90-day plan

| Window | Builder | Owner |
|---|---|---|
| Days 1-14 | Canonicals and 308s on every route; Organization + WebSite JSON-LD; robots.txt; Bing + IndexNow; `onpage-check.mjs` on all pages; `sitemap-audit.mjs --save` | File Change of Address; GBP eligibility and category; client-naming permissions; approve publishable prices |
| Days 15-45 | Service pages, hospitality + D2C industry pages, About, metro city page, internal links from cases | Review asks begin; GoodFirms profile to 100%; join source platforms; first LinkedIn long-form |
| Days 46-90 | Healthcare page, cost guide, how-to-choose guide, home-town page if it passes; monthly GSC review; `sitemap-audit.mjs --compare baseline.json` | Reply to every review; pitch 5 list publishers; decide on the data study; read the day-90 report |

## 9. Success at day 90 (process, not rankings)

- Google's canonical is the apex everywhere, and Change of Address is accepted.
- "Northwind + modifier" queries are climbing, and brand clicks are above a handful a month.
- 10+ real Google reviews, plus 3+ each on Clutch and GoodFirms.
- New pages indexed, with non-brand impressions appearing (positions 20-50 are normal at this stage) `[DATA]`.
- No #1 promised. Nobody can guarantee one `[G]`, and 1.74% of new pages reach the top 10 within a year `[DATA]`.
