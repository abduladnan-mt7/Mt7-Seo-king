# JSON-LD templates - read this first

Last verified 2026-10-20 against Google's structured data docs. Tags as in SKILL.md.

## Rules that apply to every template
- Structured data earns a **listed feature or nothing**; it is not a ranking lever and AI features need none of it `[G]` ([AI features](https://developers.google.com/search/docs/appearance/ai-features); [AI optimization guide, 2026-07](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)). `[DATA]` Adding JSON-LD to 1,885 already-cited pages moved AI citations by +2% (n.s.) and AIO by -4.6% (Ahrefs, 2026-05). Treat schema as hygiene.
- Markup must match the **visible content** of the page; Google can ignore or penalise markup for things not on the page `[G]`.
- **Retired 2025-26** (no rich result; existing markup is harmless): Course Info, Estimated Salary, Learning Video, Special Announcement and Vehicle Listing (docs removed 2025-09-09); Practice Problem (support ended 2026-01). ClaimReview is being phased out of Search results; Dataset now feeds Dataset Search only; Book Actions stays `[G]` ([changelog](https://developers.google.com/search/updates)). Check the changelog before promising any rich result.
- **FAQPage and HowTo no longer produce rich results** (FAQ deprecated 2026-05-07, docs removed 2026-06-15; HowTo Sept 2023). Leave existing markup if free; never add it for search `[G]` ([changelog](https://developers.google.com/search/updates)).
- **Self-serving `AggregateRating` / `Review` is ineligible**: an entity that controls reviews about itself (own site or third-party widget) gets no stars on its LocalBusiness/Organization pages `[G]` ([Review snippet, 2026-09](https://developers.google.com/search/docs/appearance/structured-data/review-snippet)). Ratings of a product or an app can qualify when they come directly from real users and are visible on the page `[G]`, and so can reviews about a third party (a marketplace listing).
- One `Organization` node per site, on the home or About page; reference it elsewhere by `@id` rather than re-declaring different facts `[G]` `[INFERENCE]`.
- `LocalBusiness` (and subtypes such as ProfessionalService, Hotel, MedicalClinic) **requires a physical address**; use plain `Organization` for remote/online businesses `[G]`.
- Put the same `WebSite` node on every home-page variant (www and apex) so the site name is consistent `[G]`.
- Validate with the Rich Results Test (features) and the Schema Markup Validator (syntax); re-validate after every template change.
- **Before reporting "no schema", check the rendered page.** JSON-LD injected by JavaScript is invisible to a raw-HTML fetch (`scripts/onpage-check.mjs`, curl), but Google can read it after rendering `[G]` ([JS-generated structured data](https://developers.google.com/search/docs/appearance/structured-data/generate-structured-data-with-javascript)). Use the Rich Results Test or the browser's rendered DOM. For AI crawlers that don't render, JS-only markup is effectively absent `[CLAIM]`.
- **Nested nodes are not duplicates.** An `Organization` with a nested `parentOrganization`, `subOrganization`, `brand` or `publisher` node describes related entities; it is not "a second Organization". Before calling markup duplicated, compare the `@id`s and what each node describes `[INFERENCE]`.
- Placeholders are written as `<FILL: ...>`. Delete any optional property you cannot fill truthfully - an empty or fake value is worse than none.

## Files
| File | Use on | Feature it can earn |
|---|---|---|
| `organization.md` | home or About page | Organization details / logo in knowledge panel, entity disambiguation |
| `website.md` | every home-page variant | Site name in results |
| `local-business.md` | a page for a physical, staffed location | Local business details (also feeds Maps attributes) |
| `service.md` | service pages | No dedicated rich result; entity clarity only `[INFERENCE]` |
| `breadcrumb.md` | every page below the home page | Breadcrumb trail in results |
| `article.md` | articles, case studies, guides | Article rich result (with real author) |
| `software-application.md` | app / tool / SaaS pages | Software app rich result (needs offers or rating) |
| `product-offer.md` | e-commerce product pages | Product snippets / merchant listings |
