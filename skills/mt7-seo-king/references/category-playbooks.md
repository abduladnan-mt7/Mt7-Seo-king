# Category playbooks

Last verified 2026-10-20. The research behind this skill was run for a B2B agency; where a category's specifics come from that research they carry the usual tags (`[G]`, `[DATA]`, `[PROVEN]`, `[CLAIM]`, `[WARNED]`). Everything extrapolated to another category is `[INFERENCE]` - sensible, but check the SERP yourself before committing. The generic rules (one page per intent, directories win "best X", reviews are earned not bought, no doorway pages, hygiene schema only) apply to every category.

Contents: 1 Local service business - 2 B2B agency / consultancy - 3 SaaS / software product - 4 E-commerce store - 5 Content / publisher / blog - 6 Free tools / utility site - 7 Mobile app - 8 Marketplace / directory - 9 Hospitality - 10 Healthcare / clinic (YMYL).

---

## 1. Local service business (plumber, dentist, lawyer, salon, repair)

- SERP shape: map pack + directories (Justdial/Yelp-type) + a few business sites. `[DATA]` Directories hold 31% of local-intent top-10s; "best <profession>" goes 68% to directories. [BrightLocal, 2024-10](https://www.brightlocal.com/research/business-listings-visibility-study/)
- Levers in order: `[PROVEN]` primary GBP category, real address in the city, steady text reviews, Google's predefined services; `[PROVEN]` one page per service; `[DATA]` website NAP identical to GBP. See local-reviews-directories.md.
- Pages: home (NAP, hours, service list), one page per service, About with real staff, one location page per staffed location only, reviews page quoting real reviews without self-serving star schema `[G]`.
- City pages: only for a city where you actually work and can show it (`assets/templates/city-location-page.md`). Service-area businesses: hide the address per policy, list areas within ~2 h `[G]`.
- Avoid: keyword in GBP name, review bursts/QR drives, a GBP at a virtual office, per-listing tracking numbers. `[WARNED]`
- Measure: GBP insights (calls, directions), GSC queries containing the city, review velocity.

## 2. B2B agency / consultancy (the research's home category)

- SERP shape: "best/top X in city" = directory city pages (Clutch, GoodFirms, DesignRush, Justdial) and listicles; "X company in city" = agency landing pages + directories; "best software company in city" = job-seeker lists (skip). [keyword-and-ranking.md section 10]
- Levers: `[PROVEN]` one page per service answering buyer questions; `[DATA]` real reviews on the directories AI engines cite (Clutch most, then DesignRush, GoodFirms) plus GBP; `[PROVEN]` earned inclusion in independent lists; `[DATA]` founder-led LinkedIn long-form and YouTube with the brand name; `[CLAIM]` case studies with measured numbers as linkable assets.
- Pages: service pages (one per service), industry pages anchored on a real case each (`[DATA]` "dedicated page per service" = #1 local-organic factor), case studies with difficulty and metrics, About/team with verifiable people, city page only where real clients exist, pricing or "how much does X cost" page with real ranges (quotable facts).
- Brand: Organization + WebSite schema with `alternateName` and `sameAs` to every profile `[G]`; win "brand + modifier" queries first if the bare name collides with bigger entities `[CLAIM]`.
- Avoid: a self-ranking "Top 10 agencies" page `[WARNED]`; keyword-anchored footer credit links on client sites `[G]` link spam; paying directories for placement without `rel="sponsored"` disclosure `[G]`.
- Example applied end-to-end: `examples/worked-example-agency.md`.

## 3. SaaS / software product `[INFERENCE]` unless tagged

- SERP shape: category queries ("<category> software") go to G2/Capterra-type directories and vendor listicles; "<competitor> alternative" and "<product> vs <product>" are won by vendor comparison pages and review sites; feature/integration queries by docs and help pages.
- Pages: product/feature pages, honest comparison pages (name competitors fairly; never crown yourself - `[WARNED]` self-ranking listicles), integration pages only where the integration exists and has unique content (`[G]` scaled-content rule applies to templated integration pages), pricing page with real numbers in HTML (AI engines quote it), docs/help indexable, changelog.
- Schema: SoftwareApplication with real `offers` (`assets/schema/software-application.md`); no self-serving AggregateRating `[G]`.
- Reviews: G2/Capterra/Product Hunt are the cited sources for this category `[INFERENCE from the directory data]`; same no-incentive rule - most platforms allow a disclosed small thank-you, Google's and Trustpilot's rules forbid incentives on their platforms `[G]` `[OFFICIAL]`.
- AI visibility: specific feature + price facts in HTML; founder LinkedIn long-form `[DATA]`; a YouTube demo per core use case `[DATA]`.
- Measure: signups by landing page, GSC for "alternative"/"vs" queries, Bing Webmaster AI Performance.

## 4. E-commerce store `[INFERENCE]` unless tagged

- SERP shape: category queries = marketplaces (Amazon, Flipkart) + large retailers + Google Shopping; long-tail product/spec queries are where a small store can win; "best <product type>" = publisher listicles.
- Pages: category pages with real descriptive copy and faceted navigation controlled (canonical to the base category, noindex or robots on filter combinations with no unique demand `[G]` consolidate-duplicates guidance); product pages with unique descriptions, specs, real photos, stock/price in HTML; buying guides ("how to choose a <product>") that link to categories; brand pages.
- Schema: Product + Offer with price, currency, availability (`assets/schema/product-offer.md`); merchant listings need accurate data; BreadcrumbList; Organization with `sameAs`.
- Reviews: product reviews from real buyers through a review platform are eligible for product star snippets; business reviews about the store itself are not self-serving-eligible on the Organization page `[G]`. Same no-incentive, no-gating rule for Google.
- Technical: index bloat is the usual killer - check Pages report for "Crawled - currently not indexed" and "Duplicate without user-selected canonical" `[G]` categories; XML sitemaps per type; image alt and filenames (see references/image-seo.md when present).
- Avoid: manufacturer boilerplate on thousands of products `[G]` scaled content risk; doorway "<product> in <city>" pages `[G]`; fake review counts.
- Measure: revenue by landing page, category impressions/CTR in GSC, Merchant Center diagnostics.

## 5. Content / publisher / blog `[INFERENCE]` unless tagged

- SERP shape: informational, heavily affected by AI Overviews (`[DATA]` question queries trigger summaries 60% of the time; AIO cuts #1 CTR by ~50% - keyword-and-ranking.md section 6). Plan for lower clicks per impression and for citations.
- Levers: original reporting, first-hand data, named authors with real credentials (`[G]` fabricated profiles are deceptive), tight topical focus (`[DATA]` Zyppy r = 0.25), freshness only where the topic expects it (`[G]`), internal linking between related pieces (`[G]`).
- Pages: pillar + supporting articles, author pages (ProfilePage is a listed feature `[G]`), About with editorial policy, a clear browseable hierarchy (`[G]` the opposite of doorway pages).
- Schema: Article with real `author` (`assets/schema/article.md`), BreadcrumbList; FAQ and HowTo earn nothing now `[G]`.
- Avoid: mass AI articles without review `[G]`; hosting third-party commercial content for ranking (site reputation abuse) `[G]`; self-promotional listicles `[WARNED]`; date-bumping `[G]`.
- Recovery after an update: `[PROVEN]` rare and partial, arrives at a later core update; fix business-level trust, prune thin or off-topic pages, then wait (community-evidence.md section 7).

## 6. Free tools / utility site (calculators, converters, generators) `[INFERENCE]` unless tagged

- SERP shape: tool-intent queries want the tool above the fold; `[CLAIM]` Ahrefs' +516% case came from adding the tool the query expected. [Ahrefs, 2024-10](https://ahrefs.com/blog/search-intent/)
- Pages: one page per tool with the tool rendered in HTML (not a blank shell hydrated by JS - `[CLAIM]` AI crawlers can't read JS-only content; run `scripts/onpage-check.mjs`), an explanation of what it computes, worked examples, limits, a short "how we calculate" section (quotable facts), related tools interlinked.
- Programmatic tool variants ("<unit> to <unit>", "<tax> calculator <year>"): legitimate only when each page carries distinct data and demand `[PROVEN]` pruning rule; noindex the long tail `[PROVEN]`. Gate and launch rules: `references/programmatic-seo.md`.
- Before building a tool, score it 1-5 on: search demand, audience fit, uniqueness vs the tools already ranking, a natural path to your product or other tools, build effort (inverse), maintenance burden (inverse), link potential (would a teacher, forum or resource page link it?), shareability. Build the 25+ scores first `[INFERENCE]` (scorecard adapted from marketing-skills `free-tools`, MIT).
- Each tool page needs its own substance around the widget: what it computes and how, worked examples, limits, and where the user's file or data goes. A tail of widget-only pages holds back the good ones `[INFERENCE]`.
- Schema: SoftwareApplication/WebApplication with `offers` price 0 (`assets/schema/software-application.md`).
- Links: tools earn links naturally if embeddable and credited; a brand-anchored embed credit with `rel="nofollow"`-or-not is the site owner's call but never keyword-stuffed `[G]`.
- Measure: tool uses (event), GSC per tool page, referring domains.

## 7. Mobile app `[INFERENCE]` unless tagged

- App Store Optimization is a separate discipline: title/subtitle keywords, screenshots, ratings, conversion rate in the store. Point the owner to ASO guidance; this skill covers the web side.
- Web side: a landing page per app with the store links, real screenshots, feature list in HTML, a support/FAQ page (plain HTML, no FAQ schema needed `[G]`), a privacy policy URL the stores require, SoftwareApplication schema with `applicationCategory`, `operatingSystem`, `offers` (`assets/schema/software-application.md`).
- Trust: the developer account name in the store should match the company; a personal developer account does not corroborate the company.
- Avoid: ranking "best <category> apps" with your own app at #1 `[WARNED]`.
- Measure: store page views from web referrals, GSC for "<app name>" and "<app name> + modifier".

## 8. Marketplace / directory `[INFERENCE]` unless tagged

- You are the page type that wins "best X in city" (`[DATA]` directories = 31-68% of those SERPs), which is also why Google's scaled-content and doorway policies are written with you in mind.
- Pages: category x city pages only where listings exist in real numbers (a page with 0-2 listings is thin; noindex it until it has substance `[PROVEN]` pruning rule); listing pages with unique owner-supplied content; editorial "best of" pages with disclosed methodology and sponsored labels (`[G]` `rel="sponsored"` on paid links).
- Structured data: ItemList for lists, LocalBusiness/Product per listing only with real data; reviews on listing pages can be eligible for stars because they are about a third party (`[G]` review snippet rules).
- Avoid: auto-generated pages for every city x category permutation `[G]` `[WARNED]`; selling positions without labelling them `[G]`; UGC spam (moderate it - `[G]` ugc hint for links).
- Measure: indexed-page ratio (Pages report), leads per listing page, query coverage per city.

## 9. Hospitality (hotel, resort, homestay, restaurant) `[INFERENCE]` unless tagged

- SERP shape: Google Hotel/Travel modules, OTAs (Booking, MakeMyTrip, Agoda), TripAdvisor, map pack; restaurants = map pack + Zomato/Swiggy-type platforms.
- Levers: GBP with the right category, real photos, steady guest reviews with replies (`[PROVEN]` review velocity; `[G]` no incentives); direct-booking pages with real rates and availability in HTML; location content that is genuinely about the place (how to reach, nearby, seasons) rather than "resort in <city>" doorways `[G]`.
- Pages: property page, room/experience pages, dining, events, a "how to reach" page, seasonal guides; an industry case for a provider of hospitality software belongs on the provider's industry page, not on a city page.
- Schema: LodgingBusiness / Hotel / Restaurant (LocalBusiness subtypes) with the physical address `[G]`; don't add self-serving AggregateRating `[G]`.
- Avoid: fake "guest reviews" on the site; OTA-duplicated descriptions as the only copy; booking widgets that render no HTML.
- Measure: direct bookings, GBP actions, OTA review counts, branded queries ("<resort name> booking").

## 10. Healthcare / clinic (YMYL) `[INFERENCE]` unless tagged

- `[G]` YMYL pages are held to the highest trust standard by raters (QRG 2025-09); `[G]` fabricated credentials are deceptive; `[CLAIM]` recovered sites noindexed YMYL pages that lacked expertise (community-evidence.md section 7).
- Pages: doctor/practitioner pages with real names, qualifications, registration numbers, photos (`[G]` real people); service/treatment pages written or reviewed by the named clinician with a "reviewed by" line and date; location page per clinic with NAP matching GBP; patient-information pages that cite sources.
- Local: GBP category = the specific practice type; Practo/Justdial-type profiles with identical NAP `[DATA]` accuracy over volume; reviews under Google's rules - no incentives, no gating, respond to every review without disclosing patient details (privacy law).
- Schema: MedicalClinic/Physician (LocalBusiness subtypes) with address; Person for practitioners; no AggregateRating on your own pages `[G]`.
- Avoid: condition pages at scale without clinical review `[G]` scaled content and YMYL trust; city x treatment doorways `[G]`; testimonials with health claims that breach local advertising law (`[INFERENCE]` - check regulation).
- Measure: appointment requests per page, GSC for "<treatment> in <area>" and branded queries, review velocity.
