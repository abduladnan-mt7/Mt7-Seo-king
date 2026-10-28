# Service page brief

One page per service, answering buyer questions plainly. `[PROVEN]` "dedicated page per service" is the #1 local-organic factor and #2 AI-visibility factor (Whitespark 2025-11); 57% of ChatGPT citations for "best agencies for X" went to the agency's own page when it answered the query (Onely 2026-10). `[DATA]` Business sites own 61% of transactional SERPs (BrightLocal 2024-10).

## Gate (all must be true before writing)
- [ ] The service is actually offered and has been delivered at least once (proof exists).
- [ ] The target query's SERP shows business/service pages (not only directories or listicles).
- [ ] No existing page already serves this intent (one cluster -> one page `[G]`).

## Fill-in
- Service name as buyers say it: ...
- Primary query (searcher's words): ...  Secondary modifiers (stack / industry / city / cost / "for X"): ...
- Target URL: /services/<slug>
- Title (50-60 chars, query words first, brand last): ...
- Meta description (honest summary, 120-160 chars): ...
- h1: ...

## Page skeleton
1. **Answer-first opening (2-4 sentences):** what you do, for whom, with what outcome, and how engagements start. Plain HTML, no hero-only JS. `[G]` passage ranking needs nothing special; `[CLAIM]` AI crawlers read HTML, not JS.
2. **Who it is for / not for:** honest fit criteria (cuts bad leads, reads as expertise).
3. **What is included:** deliverables, stack/tools, timeline range, how it is priced (real ranges in text - quotable `[DATA]` AI citation behaviour).
4. **Proof:** 1-3 case studies with measured outcomes, linked (`case-study.md`); named clients only with permission; real screenshots.
5. **Process:** the steps a buyer experiences, dated/durations where true.
6. **Buyer questions answered in prose** (the questions you hear on sales calls - cost, timeline, ownership, maintenance, what happens if...). No FAQ schema needed `[G]`.
7. **Who does the work:** named people with roles, linked to About.
8. **CTA:** one clear next step (call, WhatsApp, form) above and below.

## Technical
- Self-canonical; in sitemap; linked from nav and from every related case study with a descriptive anchor `[G]`.
- Service JSON-LD (`assets/schema/service.md`) only if the fields are real; no AggregateRating `[G]`.
- Images: real work screenshots with contextual alt; preferred image a real 16:9 photo `[G]`.
- Run `scripts/onpage-check.mjs <url>` after publish.

## Do not
- Clone this page per city or per synonym (`[G]` doorway / scaled content).
- Pad to a word count (`[G]` length doesn't matter).
- Claim "best"/"#1" (earn third-party lists instead; `[WARNED]` self-crowning).
