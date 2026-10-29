# Local SEO, reviews, directories, city pages

Last verified 2026-10-20. Tags: `[G]` Google official; `[OFFICIAL]` another platform's own rules (Trustpilot, Clutch, Justdial); `[DATA]` study with n; `[PROVEN]` several independent practitioners with specifics, consistent with `[G]`; `[CLAIM]` anecdote or vendor; `[WARNED]` widely reported penalty/suspension; `[INFERENCE]` this skill's reasoning. Research limits: US index (not google.co.in), no map pack observed; moz.com, GoodFirms, Justdial, SEL were partly unreachable. Undated Google Help pages = "accessed 2026-10".

## 1. How Google ranks local results

- `[G]` "Local results are mainly based on relevance, distance, and popularity"; prominence draws on "how many websites link to your business and how many reviews you have"; "There's no way to request or pay for a better local ranking". [GBP Help](https://support.google.com/business/answer/7091)
- `[DATA]` Whitespark Local Search Ranking Factors (47 experts, 187 factors, 2025-11). Local pack top factors by weighted score: primary GBP category (227), proximity (225), keywords in GBP name (223 - but see section 8), physical address in the searched city (213), open at search time (189), 4-5 stars (181), address shown rather than hidden (176), number of Google reviews with text (170), review recency (164), steady review velocity (154), website NAP matching GBP (153). [Whitespark, 2025-11](https://whitespark.ca/local-search-ranking-factors/)
- `[DATA]` Same survey ([Whitespark, 2025-11](https://whitespark.ca/local-search-ranking-factors/)), local organic top factors: dedicated page per service (210), local relevance of content (190), link quality (187), keywords in the GBP landing-page title (179), same-industry links (175), niche focus (169). Review and behaviour signals rose; on-page, links and citations fell. New AI-visibility category: presence on "best of" lists (179), then dedicated service pages (170). (Blog figures "GBP ~32% / reviews ~20%" unverified.)
- `[DATA]` Sterling Sky, 8,186 US home-service businesses in 200 cities: reviews this month beat total reviews; text reviews beat star-only; hidden address correlated negatively. [Sterling Sky, 2025-11](https://www.sterlingsky.ca/what-gets-you-ranking-for-near-me-2025/) Tiny tests: 9 -> 10 reviews gave a visible Maps bump, 10 -> 11 none (n = 3). [Sterling Sky, 2025-04](https://www.sterlingsky.ca/number-of-reviews-impact-ranking/) Keywords in review text did not help (n = 1). [Sterling Sky, 2023-01](https://www.sterlingsky.ca/does-the-text-of-a-google-review-affect-map-pack-rankings/)

## 2. Reviews - rules and evidence

- `[DATA]` BrightLocal 1,002 US consumers (B2C): 97% read reviews; 68% need >= 4 stars; 74% look for reviews from the last 3 months; 47% avoid businesses with < 20 reviews; 89% expect owner replies; 45% use generative AI for local recommendations (up from 6%). [BrightLocal, 2026-02](https://www.brightlocal.com/research/local-consumer-review-survey/) No comparable B2B data.
- `[G]` Prohibited: incentives ("payment, discounts, free goods and/or services"); gating ("Discourage or prohibit negative reviews, or selectively solicit positive reviews"); conflict of interest incl. "a contractual or consultory relationship"; staff quotas. [Contribution policy](https://support.google.com/contributionpolicy/answer/7400114) Penalties: new reviews blocked, existing ones unpublished, consumer warning. [GBP help](https://support.google.com/business/answer/14114287?hl=en) The research notes Google added an incentive-disclosure rule in July 2026 - never offer undisclosed incentives, and better, none at all.
- `[OFFICIAL]` Trustpilot guidelines v7: invite only people "who have had a genuine experience"; invite "everyone in the same way"; no cherry-picking or incentives; no family/staff/shareholders; penalties: Consumer Warning, termination. [Trustpilot, 2025-05](https://legal.trustpilot.com/for-reviewers/guidelines-for-businesses)
- `[WARNED]` Review bursts, in-store QR drives, staff pushes, gating: a business at 2.75x its baseline for 3 months got a 30-day posting block and 57.5% of 595 reviews removed. [Sterling Sky, 2026-09-28](https://www.sterlingsky.ca/review-posting-blocks-are-surging-heres-the-data-plus-the-patterns-behind-them/)
- `[WARNED]` Buying Clutch/Trustpilot reviews: Clutch verifies identity, Trustpilot removes fakes; India's BIS IS 19000:2022 bars purchased reviews (mandatory status unverified).
- `[PROVEN]` What works: ask every real customer the same way, reach a first ~10 reviews, then a steady monthly flow with text; reply to every review; never suggest wording.

## 3. City / location pages

- `[G]` Doorway abuse includes "pages targeted at specific regions or cities that funnel users to one page" and "substantially similar pages that are closer to search results than a clearly defined, browseable hierarchy". [Spam policies, 2026-08](https://developers.google.com/search/docs/essentials/spam-policies) `[REPORTED]` Mueller on 1,300 keyword+city pages: "That sounds like doorway pages". [SER, 2019-12](https://www.seroundtable.com/google-city-landing-pages-doorway-pages-28670.html)
- `[CLAIM]` Sterling Sky's recipe for a legitimate city page: services offered there, local context, local staff/community ties, city-specific case studies and photos; cities without an office "will only be shown organically". [Sterling Sky, 2024-01](https://www.sterlingsky.ca/how-to-create-unique-and-helpful-service-area-pages-for-local-businesses/) 84%-duplicate pages still converted in one case, but thin pages are the risk. [Sterling Sky, 2023-01](https://www.sterlingsky.ca/service-area-pages-duplicate-content/)
- No rigorous evidence exists for service-area businesses without an office in the city - agency anecdotes only.
- `[INFERENCE]` Google never requires an office in the city. A page for a city where you have real clients is legitimate if it shows that work (named clients with permission, what was built, results, how you meet people there). A page that only swaps the city name is a doorway. Use `assets/templates/city-location-page.md`, which blocks the page unless the proof exists.

## 4. Service-area businesses (SAB)

- `[G]` Eligibility: "a business must make in-person contact with customers during its stated hours"; "online-only businesses" are ineligible. [GBP](https://support.google.com/business/answer/13763036)
- `[G]` SAB hides its address; up to 20 service areas within ~2 h drive of the base; virtual offices ineligible; co-working needs signage, own staff and customers received during hours; one profile per business. [GBP guidelines](https://support.google.com/business/answer/3038177?hl=en) [Service areas](https://support.google.com/business/answer/9157481)
- `[CLAIM]` (one listing) A listed service area (Toronto) produced no ranking there - "The only impact that the service area has is visual"; ranking follows the verified address. [Sterling Sky, 2023](https://www.sterlingsky.ca/does-the-service-area-in-google-my-business-impact-ranking/) Hiding the address cut rankings/calls on 2 listings; restoring it brought them back. [Sterling Sky, 2023](https://www.sterlingsky.ca/hiding-address-google-business-ranking/) Whitespark has a counter-case; forum theory says a hidden address widens the radius. [Local Search Forum](https://localsearchforum.com/threads/do-service-areas-impact-local-rankings-darren-says-yes-joy-says-no.59764/)
- Synthesis: no address in a city -> rarely in that city's map pack; the website can still rank organically there. Where policy (hide the address for an SAB) conflicts with the ranking data, follow the policy.

## 5. NAP and citations

- `[DATA]` Whitespark: the citations category keeps losing weight (~0.5 points), but website NAP matching GBP is still #15; penalties include no crawlable NAP on the site (121) and mismatched NAP / tracking numbers (90); experts call citations "a large factor for appearing in AI search"; many focus on 10-20 core listings. [Whitespark, 2025-11](https://whitespark.ca/local-search-ranking-factors/)
- `[DATA]` BrightLocal, 22 experts, 2018: 90% said accurate citations matter; 59% said less than a year earlier. [BrightLocal, 2018-09](https://www.brightlocal.com/research/expert-local-citation-survey/)
- `[DATA]` BrightLocal, 1.97M AI citations across 1,355 US/UK/AU locations: GBP 28.6%, Yelp 9.5%, Trustpilot 0.12%, Clutch 0.05%. [BrightLocal, 2026-08](https://www.brightlocal.com/resources/ai-directory-sources/)
- Verdict: accuracy beats volume; "hundreds of citations" is folklore. Keep 10-20 core listings identical (name, address, phone, URL), one phone number everywhere, no per-listing tracking numbers.

## 6. B2B directories (Clutch, GoodFirms, Trustpilot, G2, Justdial, Sulekha, DesignRush, IndiaMART)

- `[OFFICIAL]` Clutch: the profile link is "not a 'follow' link". [Clutch Help](https://help.clutch.co/en/knowledge/is-link-on-company-profile-follow-link) Directory order = sponsors by tier, then Clutch Verified non-sponsors, then everyone else. [Clutch Help](https://help.clutch.co/en/knowledge/page-position-sponsorship) Within the score, reviews (rating, recency, verification) weigh most. [Clutch Help](https://help.clutch.co/en/knowledge/clutch-rankings-and-research-factors) Verified is paid; Premier Verified needs >= 3 reviews with one in the last 12 months. [Clutch Help](https://help.clutch.co/en/knowledge/get-verified) Observed 2026-10: on the Bengaluru web-dev page a firm with 6 reviews ranked 5th; "We may earn a fee for some placements". [Clutch](https://clutch.co/in/web-developers/bengaluru)
- GoodFirms says sponsorship doesn't change the score yet shows "Sponsored" listings; link attribute unverified. Trustpilot, G2, Justdial, Sulekha link attributes unverified. `[OFFICIAL]` Justdial's investor deck: paid packages "determine placements in search results". [Justdial, 2026-04](https://nsearchives.nseindia.com/corporate/chintan_13042026222656_Investor_Presentation.pdf) DesignRush sells placements on city/category lists. [DesignRush](https://www.designrush.com/agency/software-development/in/bengaluru)
- `[CLAIM]` (mostly negative) Paying for Clutch: agencies report ~$10k spent on 12-month lock-ins for spam/no leads; Clutch says ROI ~12 months. [Trustpilot reviews of Clutch](https://www.trustpilot.com/review/clutch.co) (self-selected). The free profile's value is being a third-party review source.
- `[DATA]` 10 questions x 4 AI assistants: Clutch most cited (20), DesignRush (8), GoodFirms (7) for agency prompts. [Greater Than, 2026-08](https://greaterthanservices.com/blog/ai-search-study-marketing-agencies) `[DATA]` 30K US commercial keywords: 34.5% of AI Overviews cited a review platform; Clutch = 2.38% of those; 17.1% for "best/top". [SE Ranking, 2026-01](https://seranking.com/blog/review-platforms-in-ai-overviews/)
- `[G]` Star snippets: an entity controlling reviews about itself is ineligible for review stars on its own LocalBusiness/Organization pages, including via third-party widgets; the Trustpilot profile page keeps its own stars. [Review snippet, 2026-09](https://developers.google.com/search/docs/appearance/structured-data/review-snippet)
- India: IndiaMART fits manufacturers/B2B product sellers; Justdial fits local services; lead-authenticity complaints are common; no evidence either raises Google rankings - value = consistent NAP citation. [Vedain, 2026](https://vedain.com/blog/indiamart-vs-justdial-which-lead-source-works-better-for-indian-smbs) [Trustpilot on Justdial](https://au.trustpilot.com/review/justdial.com)
- Priority order for an agency `[INFERENCE from the data above]`: GBP first (most AI-cited source), then Clutch (most cited for agency prompts), then GoodFirms; Trustpilot last (least AI weight; its stars won't show on your site anyway). For other categories swap in the directories the SERP shows (Yelp, G2, TripAdvisor, Practo, etc.).

## 7. "Best X in city" strategy

- `[DATA]` 750 ChatGPT prompts: "best X" lists = 43.8% of cited page types; higher list position -> more recommendations. [Ahrefs, 2025-12](https://ahrefs.com/blog/best-lists-research/)
- `[DATA]` BrightLocal: "best X" SERPs are dominated by directories and listicles, so a business page rarely wins the query directly ([BrightLocal, 2024-10](https://www.brightlocal.com/research/business-listings-visibility-study/); section 1 of keyword-and-ranking.md).
- `[CLAIM]` Experts pursue "best of" lists, sometimes paying (Whitespark). `[G]` "buying or selling links for ranking purposes" = link spam -> any paid placement must carry `rel="sponsored"` and be disclosed.
- `[WARNED]` (contested) A page on your own site ranking yourself #1: AI Overviews omitted self-ranking publishers 83% of the time in one 100-query sample, while a larger counter-analysis found 62% of vendor list pages gained traffic. [PPC Land, 2026-10](https://ppc.land/google-ai-overviews-cut-self-ranking-listicle-citations-38-lily-ray-finds/) See community-evidence.md section 2.
- Practical rule: pitch independent list publishers with case studies (`assets/outreach-kit.md`); an honest comparison page that does not crown yourself is fine; never publish "Top 10 X" with yourself at #1.

## 8. GBP name and keyword stuffing - follow Google over the data

- `[G]` The name must not include "Service or product information" or "Location information" -> suspension risk. [GBP guidelines](https://support.google.com/business/answer/3038177?hl=en)
- `[DATA]` Keywords in the name do lift ranking (which is why competitors do it; it is reportable). [Sterling Sky, 2023-08](https://www.sterlingsky.ca/keyword-stuffing-gmb-name/) Experts rank it #3 (Whitespark).
- Rule: name = exact legal/trading name. Report competitors that stuff; never copy them.

## 9. GBP operating cautions

- `[WARNED]` Suspension triggers: profile edits (even phone), tracking strings on the website URL, accounts managing many profiles, prior suspensions; appeals went from ~5 days to ~5 weeks; Product Expert advice: avoid edits during suspension waves. [Local Search Forum, 2025-09/10](https://localsearchforum.com/threads/ive-been-noticing-a-huge-spike-in-suspensions-recently.62779/) [SEJ, 2025-03-21](https://www.searchenginejournal.com/google-business-profile-suspensions-rise-appeals-are-delayed/542602/)
- Myth: Google Posts and owner-seeded Q&A as ranking levers - post frequency ranked #148, seeded Q&A #142 (Whitespark); the Q&A API was switched off 2025-11-03 and replaced by Gemini "Ask Maps". [The HOTH, 2025](https://www.thehoth.com/blog/google-cuts-qa-sections/)
- `[PROVEN]` Google's predefined GBP services help rankings. [Whitespark](https://whitespark.ca/blog/increase-local-seo-rankings-with-predefined-services/)

## 10. Don'ts (penalties / suspensions)

- Keywords or city in the GBP name. `[G]`
- GBP at an unstaffed registered office, a virtual office, an unstaffed co-working desk; duplicate profiles. `[G]`
- Paid or incentivised reviews, gating, staff/family/partner reviews, review swaps, sudden bursts. `[G]` `[WARNED]`
- City pages with only the name swapped; pages at scale. `[G]`
- Self-serving review-star schema. `[G]`
- Buying followed links or listicle slots without disclosure. `[G]`
- Mismatched NAP; per-listing tracking numbers. `[DATA]` ([Whitespark, 2025-11](https://whitespark.ca/local-search-ranking-factors/))
