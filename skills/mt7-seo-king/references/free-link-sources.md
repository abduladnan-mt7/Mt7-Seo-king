# Free, legitimate link and brand-mention sources (vetted catalogue)

Last verified 2026-10-20. Tags: `[G]` official (Google or the platform's own docs); `[DATA]` study or hands-on check (n, date); `[PROVEN]` several independent practitioners with specifics; `[CLAIM]` unproven; `[WARNED]` spam/penalty risk. Value codes: LE = link equity, RT = referral traffic, ENT = entity/trust signal, AI = AI-citation value. The machine-readable version with fit columns is `assets/free-link-sources.csv`.

Verification limits (keep them in mind): Ahrefs/Moz/Semrush checkers could not be run; the fetch tool stripped `rel` attributes, so every link attribute comes from platform docs or a third-party hands-on check, mostly single-source - and two of those checkers run competing directories (SaaSCity, and dev.to author codelong888). "Unverified" means literally unverified. Authority numbers (DR) are as reported by those sources, approximate, not measured.

## 0. Google's line on links `[G]`

- "Link spam is the practice of creating links to or from a site primarily for the purpose of manipulating search rankings." [1] Named examples: "Buying or selling links for ranking purposes" (incl. "Sending someone a product in exchange for them writing about it and including a link"); "Excessive link exchanges"; "Using automated programs or services to create links to your site"; "Requiring a link as part of a Terms of Service, contract, or similar arrangement"; "links with optimized anchor text in articles, guest posts, or press releases distributed on other sites"; "Low-quality directory or bookmark site links"; widget links; "Widely distributed links in the footers or templates of various sites"; "Forum comments with optimized links in the post or signature".
- Paid links are fine when qualified with `sponsored` or `nofollow` [1][2]. `nofollow` / `sponsored` / `ugc` "are treated as hints" (ranking since 2019-09-10, crawling since 2020-03-01) - plan on neither passing nor not passing value [3].
- SpamBrain detects "both sites buying links, and sites used for the purpose of passing outgoing links"; credit is "neutralized" (the usual outcome is zero value); the real penalty is an "Unnatural links" manual action [4][5].
- Since 2026-05-15 the spam policies also cover "attempting to manipulate generative AI responses in Google Search" [1][6].
- `[DATA]` Why nofollow profiles still matter: branded web mentions correlate 0.664 with AI Overview visibility vs 0.218 for backlinks (n = 75k brands DR > 40, 2025-05-26) [7]; YouTube mentions ~0.737 (Dec 2025, secondary coverage) [8].

## 1. Business and entity profiles

| Source | How | Link attr. | Approx. authority | Value | Effort | Risk | Tier + cite |
|---|---|---|---|---|---|---|---|
| Google Business Profile (only if eligible) | A location that receives customers, or you travel to them; virtual offices ineligible | n/a | n/a | ENT, local (prominence partly uses links) | L | M (suspension if ineligible) | `[G]` [9] |
| Bing Places, Apple Business Connect | Identical name/phone/site | n/a | n/a | ENT, local | L | L | `[CLAIM]` |
| LinkedIn page + founder profile | Complete page; founder links it | redirect/nofollow reported, unverified | unverified | ENT (sameAs), AI | L | L | `[CLAIM]` |
| Crunchbase | Free profile | nofollow (archived copies) | DR 91 (Ahrefs via SaaSCity) | ENT | L | L (anyone can edit) | `[DATA]` [10] |
| Wellfound | Free company page | unverified | unverified | ENT, hiring | L | L | `[CLAIM]` |
| Clutch | Free; verified client reviews | nofollow ("No, it's not a 'follow' link") | DR 79 (IdeaProof, Aug 2026) | RT, ENT, AI | M | L | `[G]` [11] |
| GoodFirms | Free (PRO $49/mo) | nofollow | DR 87 (via SaaSCity) | RT, ENT | M | L | `[DATA]` [10] |
| DesignRush | Profile; paid tiers | unverified | unverified | RT | L | L | `[CLAIM]` |
| Trustpilot | Free business profile | nofollow | DR 94 (via SaaSCity) | ENT, reviews | L | L | `[DATA]` [10] |
| G2 / Capterra / GetApp (software only) | Free listing; G2 agreed Jan 2026 to buy Capterra, GetApp, Software Advice from Gartner | no link at all on free profiles | DR 91/91/85 (via SaaSCity) | ENT, reviews | M | L | `[DATA]` [10] `[G]` [12] |
| YouTube channel | Real videos, brand in titles | redirect reported, unverified | n/a | AI, RT | H | L | `[DATA]` [8] |
| X, Facebook, Instagram, Pinterest | Claim handles; list in sameAs | redirect/nofollow reported | n/a | ENT, RT | L | L | Mueller "We're already mostly ignoring those links" (2014) `[G]` [13] |
| Startup India / DPIIT | Free recognition; public profile format unconfirmed | unverified | n/a | ENT (government) | M | L | `[G]` [14] |
| Justdial, Sulekha (services); IndiaMART, TradeIndia (goods) | Free + paid listings | unverified | n/a | local citation, leads | L | L | `[CLAIM]` |
| NASSCOM, chambers (e.g. FKCCI) | PAID membership (NASSCOM associate ~Rs 10k + GST per a third party, unverified) | unverified | n/a | ENT, network | M | L | `[CLAIM]` [15] |
| YourStory | Editorial only (pitch once you have traction; no official form found); paid brand posts must be labelled sponsored | unverified | unverified | ENT, AI, maybe LE | H | M if paid and unlabelled | `[CLAIM]` [1] |

## 2. Developer and tech ecosystem

| Source | How | Link attr. | Approx. authority | Value | Effort | Risk | Tier + cite |
|---|---|---|---|---|---|---|---|
| GitHub org, repos, READMEs | Useful open-source utilities; full org profile | README links nofollow (one curl test); profile link unverified | unverified | ENT, RT, AI | M | L | `[DATA]` [16] |
| Awesome lists | One PR per item per the list's CONTRIBUTING (`[Name](link) - Description.`) | nofollow (GitHub) | n/a | RT, mirrors | M | L unless mass-PR'd | `[G]` [17] |
| Dev.to | Republish with `canonical_url` | in-article links followed (2 independent checks); profile field `ugc` | unverified | small LE, RT | M | M: Google recommends noindex, not canonical, for syndication (May 2023) - the copy may outrank you | `[DATA]` [16][18] `[G]` [19] |
| Hashnode, Medium, Indie Hackers | Cross-post (Medium import and Hashnode set canonical) | nofollow/ugc in checks | n/a | RT | M | L | `[DATA]` [16][18] `[G]` [20] |
| Stack Overflow / Stack Exchange | Answer well; link only when the link is the answer | nofollow default (some trusted posts followed per 2011-12 reports; current rule unverified) | n/a | RT, ENT | H | H if promotional | `[CLAIM]` [5] |
| Show HN | Post a working tool | story link nofollow below ~9-12 points, plain above (one check, 2026-10-07); comments always nofollow | DR 91 (via SaaSCity) | RT, follow-on coverage, maybe LE | M | L | `[DATA]` [21] |
| Product Hunt | Free launch | `noreferrer noopener ugc` (2 checks); 11/20 launch pages noindex | DR 91 (via SaaSCity) | RT, ENT | M | L | `[DATA]` [10][18] |
| SaaSHub | Free; re-verify the listing quarterly | verified listings followed (29/30); unverified nofollow | DR 80 (via SaaSCity) | small LE, RT | L | L | `[DATA]` [10] |
| AlternativeTo | Free queue or $5 priority | new listings nofollow; some established apps followed | DR 81 (via SaaSCity) | RT | L | L | `[DATA]` [10] |
| Vercel partners / Next.js showcase | Apply at vercel.com/partners; certification for existing Solution Partners; the showcase has no public submission (team picks enterprise examples) | unverified | n/a | ENT, leads | H | L | `[G]` [22] (showcase `[CLAIM]`) |
| Shopify / Webflow partner directories | Shopify tier-gated (Plus minimum for guaranteed eligibility); Webflow needs a paid plan + exam + 3 showcased sites + 400 points -> NOT free | unverified | n/a | leads | H | L | `[G]` [23] |
| Razorpay Partner | Referral programme for web developers; no public partner directory found | n/a | n/a | revenue, not links | L | L | `[G]` [24] |
| npm, Chrome Web Store, VS Code Marketplace | Homepage/developer fields | unverified | n/a | ENT, RT | M | L | `[CLAIM]` |

## 3. Earned editorial

| Method | How | Link attr. | Value | Effort | Risk | Tier + cite |
|---|---|---|---|---|---|---|
| Source of Sources | Free (donation), <= 3 digests/day | 36.26% of requests offered follow links | LE, AI | M | L | `[DATA]` [25][29] |
| Qwoted | Free Basic: 2 pitches/month, 2-hour delay | 40.17% offered some link; 70.3% from DR 70+ | LE, AI | M | L | `[G]` [26] `[DATA]` [25] |
| HARO (owned by Featured since Apr 2025) | Relaunched digest, reported free; tiers changed - check | varies | LE, AI | M | M (pre-shutdown 38% of requests from DR 0-9) | `[G]` [27] `[DATA]` [25] |
| Featured.com (ex-Terkel) | Limited free + paid; answers go into roundups | varies | AI, some LE | M | M (roundup site quality) | `[DATA]` [28] 18-20% approval on 573 pitches (vendor test) |
| MentionMatch (ex-Help a B2B Writer) | Free for sources | varies | LE, AI | M | L | `[G]` [29] |
| Digital PR with original data | Publish a real study; pitch it | varies | LE, AI, ENT | H | L | `[DATA]` 48.6% of 518 SEOs rank it the top tactic (Editorial.link, 2026); 34% of 500 (Reporter Outreach); 40% of journalists value original data (Muck Rack 2026, n = 897) [30][31] |
| Free tools as link magnets | Calculators/utilities + resource-page outreach | varies | LE, RT | H | L | `[CLAIM]` vendor anecdotes; outreach reply baseline 8.5% (12M emails, 2019) `[DATA]` [32] |
| Broken-link building | Find dead resources, offer a replacement | varies | LE | H | L | Supply is real: 66.5% of links to 2.06M sites rotted since 2013 `[DATA]` [33]; conversion rates vendor-only `[CLAIM]` |
| Unlinked-mention reclamation | Find mentions, ask for a link | varies | LE | L | L | Method `[PROVEN]` [34]; 5-26% rates unverified |
| Testimonials / vendor customer stories (your host, database, email or payments provider...) | Real testimonial or co-written case study; the vendor decides the link | vendor decides | LE, ENT | L-M | M if a link is your condition (= exchange) | `[CLAIM]` [35] [1] |
| Podcasts, meetups, conference speaker pages | Guest / talk | varies | AI, ENT, RT | M | L | `[CLAIM]` |
| University / alumni features | Alumni story on the college site | varies | ENT, LE | L | L | .edu has no inherent bonus (Mueller, secondhand) `[CLAIM]` [36] |
| Client "built by" credits | Client must know; Mueller: "just put a nofollow on those links" or a domain-name anchor; better: a mention on the client's about/case page | nofollow if sitewide | ENT, RT | L | H if keyword anchor, sitewide, or contract-required | `[G]` [37] [1] |
| Editorial guest posts | Write for the real audience | Mueller (Jun 2020): guest-post links should be nofollow "even if it's a 'natural' link" | AI, ENT, RT; not LE | H | H if done for links (Google 2017 warning signs: keyword links, many sites, writers who don't know the topic, reused content) | `[WARNED]` `[G]` [38][39] |

Only 21.9% of journalist-platform requests explicitly offered follow links [25]; SourceBottle terms unverified.

## 4. Wikipedia and Wikidata

| Source | Rule | Link attr. | Value | Risk | Tier + cite |
|---|---|---|---|---|---|
| Wikipedia | "significant coverage in multiple reliable secondary sources that are independent of the subject"; press releases, funding news, directory listings and "best of" lists don't count; COI: "You should generally refrain from creating articles about yourself"; use Articles for Creation / talk-page requests; disclose paid editing | nofollow on all Wikimedia wikis (since 2007-01-20) | ENT, AI | H (deletion, COI flags) | `[G]` [40] |
| Wikidata | Needs a sitelink, OR a "clearly identifiable conceptual or material entity" with serious public references, OR a structural need; the community can delete | nofollow | ENT (Knowledge Graph use = `[CLAIM]`) | M (thin self-sourced items) | `[G]` [41] |

A young company with no independent press is not Wikipedia-eligible; Wikidata only once independent references exist, with COI disclosed.

## 5. "Free high-DR backlinks" - never do (looks free, is spam)

| Tactic as sold | Why it is spam | Tier + cite |
|---|---|---|
| "300+ high-DA profile sites" lists | Mostly nofollow; manual-action examples include "Posts or profiles that look like advertisements" | `[WARNED]` `[G]` [5] |
| Web 2.0 blogs | Mueller "mostly ignoring"; thin sites built for links = link scheme | `[WARNED]` [13][1] |
| Social bookmarking; PDF/doc-sharing blasts | "Low-quality directory or bookmark site links"; "Using automated programs or services to create links" | `[WARNED]` `[G]` [1] |
| Forum signatures, blog comments, edu/gov comment spam | "Forum comments with optimized links in the post or signature"; user-generated spam | `[WARNED]` `[G]` [1][5][36] |
| "DA 90+ backlink lists"; Fiverr "high-DR backlink" gigs | Buying links; SpamBrain targets buyers and sellers; DA/DR are not Google metrics; Mueller: high DA doesn't guarantee rankings (2020) | `[WARNED]` `[G]` [1][4][42] |
| Paid "dofollow" launch listings (DevHunt paid, Toolify, TAAFT paid) | Paying for ranking-credit links = buying links unless marked | `[WARNED]` `[G]` [1][10][21] |
| "Free listing if you show our badge" (e.g. Fazier free tier) | Link exchange; nofollow the badge if shown | `[WARNED]` `[G]` [1][21] |
| Client contracts requiring footer credits; keyword anchors; sitewide credits | "Requiring a link as part of a Terms of Service, contract..."; "Widely distributed links in the footers..." | `[WARNED]` `[G]` [1][37] |
| Guest-post networks / "guest posting services" | Optimized anchors in guest posts; Google's 2017 warning signs | `[WARNED]` `[G]` [1][38][39] |
| Review/testimonial only in exchange for a followed link | "Sending someone a product in exchange for them writing about it and including a link" | `[WARNED]` `[G]` [1] |

## 6. Top 15 free link/mention sources for a small agency or tools site (priority order)

1. Client case studies on your site + ask clients for an editorial mention on their about/case page (never a contract clause; nofollow any sitewide credit) `[G]` [1][37].
2. Local profiles: GBP only if genuinely eligible; Bing Places; Apple Business Connect - identical details `[G]` [9].
3. Clutch and GoodFirms reviews from real clients (nofollow; value = referral, trust, AI) `[G]` [11] `[DATA]` [10].
4. Journalist platforms: Source of Sources, Qwoted Free, MentionMatch, HARO digest - the founder as an expert source `[DATA]` [25].
5. Free tools + resource-page outreach (the main link magnet for a tools site) `[CLAIM]`.
6. One original-data study per half-year for digital PR `[DATA]` [30][31].
7. Show HN + Product Hunt for tools `[DATA]` [10][21].
8. Dev.to republishing with canonical for technical posts (accept the syndication risk) `[DATA]` [16][18] `[G]` [19].
9. GitHub org, open-source utilities, genuine awesome-list entries (no LE; developer trust + AI) `[DATA]` [16].
10. LinkedIn page, founder profile, YouTube, Crunchbase as consistent sameAs nodes `[DATA]` [7][8].
11. Testimonials/customer stories for the paid stack you use (the vendor chooses the attribute) `[CLAIM]` [35].
12. SaaSHub (verified) + AlternativeTo for tools `[DATA]` [10].
13. Meetup/conference talks, podcast guest spots `[CLAIM]`.
14. Unlinked-mention reclamation once mentions exist `[PROVEN]` [34].
15. Vercel partner application once eligible; Startup India DPIIT recognition `[G]` [22][14].

Not now: Wikipedia, any paid "dofollow" listing, anything in section 5.

## 7. Honest expectations

- Most of what is free is nofollow or a mention. That is still worth doing: `[DATA]` mentions correlate with AI visibility more than links do [7][8], and `[G]` nofollow is a hint, not a wall [3].
- Followed, editorial links come from three places in this catalogue: journalist platforms (21.9-40% of requests offer some link [25]), original data / digital PR [30][31], and tools or resources people cite on their own. Budget effort there.
- `[DATA]` Zero-link sites plateau on competitive terms (references/boring-keywords-and-onpage.md section 4); nobody can guarantee #1 `[G]` [42].

## Sources

[1] https://developers.google.com/search/docs/essentials/spam-policies (2026-08-28)
[2] https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links (2025-12-10)
[3] https://developers.google.com/search/blog/2019/09/evolving-nofollow-new-ways-to-identify (2019-09-10)
[4] https://developers.google.com/search/blog/2022/12/december-22-link-spam-update (2022-12)
[5] https://support.google.com/webmasters/answer/9044175
[6] https://developers.google.com/search/updates (2026-05-15, 2026-08-28)
[7] https://ahrefs.com/blog/ai-overview-brand-correlation/ (2025-05-26)
[8] https://ahrefs.com/blog/ai-brand-visibility-correlations (2025-12); via https://thenextweb.com/news/ahrefs-youtube-mentions-ai-visibility-brand-search
[9] https://support.google.com/business/answer/3038177 ; https://support.google.com/business/answer/7091
[10] SaaSCity hands-on checks 2026-10-07 (competing directory; DR = Ahrefs): https://saascity.io/directories ; https://saascity.io/software-review-sites
[11] https://help.clutch.co/en/knowledge/is-link-on-company-profile-follow-link ; DR: https://ideaproof.io/launch-directories/clutch (2026-08)
[12] https://www.nasdaq.com/press-release/g2-acquire-capterra-software-advice-and-getapp-gartner-2026-01-29
[13] https://www.seroundtable.com/google-ignoring-social-links-18385.html (2014-04-10)
[14] https://www.startupindia.gov.in/content/sih/en/startup-scheme.html
[15] https://www.agileregulatory.com/service/nasscom-membership-registration-in-india (third party)
[16] https://dev.to/chetansanghani/medium-and-github-both-went-nofollow-so-i-built-a-40-line-powershell-backlink-verifier-o41
[17] https://github.com/sindresorhus/awesome (contribution guidelines)
[18] https://hackernoon.com/i-checked-the-rel-attribute-on-20-platforms-most-backlinks-pass-nothing (2026-10-06)
[19] https://searchengineland.com/google-no-longer-recommends-canonical-tags-for-syndicated-content-406491 (2023-05)
[20] https://help.medium.com/hc/en-us/articles/214550207-Import-post ; https://support.hashnode.com/en/articles/6435296-why-should-i-set-a-canonical-url
[21] https://saascity.io/directories/hacker-news (2026-10-07) ; https://dev.to/codelong888/is-your-launch-site-backlink-actually-dofollow-i-checked-24-platforms-1jb7 (2026-10-10)
[22] https://vercel.com/partners ; https://vercel.com/blog/vercel-launches-partner-certification ; https://community.vercel.com/t/how-can-you-submit-something-to-the-vercel-nextjs-showcase-page/27334
[23] https://help.shopify.com/en/partners/directory/join ; https://webflow.com/certified-partners/apply
[24] https://razorpay.com/docs/partners/
[25] https://www.buzzstream.com/blog/journalist-request-platform-study/ (2025-07-25)
[26] https://www.qwoted.com/pricing-toggle/
[27] https://en.wikipedia.org/wiki/Help_a_Reporter_Out
[28] https://www.visibilitystack.ai/academy/content-engineering/best-journalist-query-platforms (2026, vendor)
[29] https://www.superpath.co/blog/superpath-has-acquired-help-a-b2b-writer ; https://www.stork.ai/blog/haro-alternatives-2026
[30] https://www.abnewswire.com/pressreleases/digital-pr-outpolls-guest-posting-486-to-16-in-survey-of-518-linkbuilding-specialists_839050.html ; https://www.reporteroutreach.com/blog/state-of-link-building
[31] https://muckrack.com/research/state-of-journalism ; https://umarcomm.umn.edu/blog/2026/04/13/pitching-journalists-muck-racks-state-journalism-2026
[32] https://backlinko.com/email-outreach-study
[33] https://ahrefs.com/blog/link-rot-study
[34] https://ahrefs.com/blog/unlinked-mentions/
[35] https://gofishdigital.com/blog/12-backlink-strategies/
[36] https://localsearchforum.com/threads/google-ignores-edu-links-because-they-are-spammed-more.53125
[37] https://www.mariehaynes.com/footer-links-and-penalties/
[38] https://searchengineland.com/should-google-not-trust-links-in-all-guest-blog-posts-335905 (2020-06)
[39] https://developers.google.com/search/blog/2017/05/a-reminder-about-links-in-large-scale (2017-05)
[40] https://en.wikipedia.org/wiki/Wikipedia:Conflict_of_interest ; https://en.wikipedia.org/wiki/Wikipedia:Notability_(organizations_and_companies) ; https://meta.wikimedia.org/wiki/Nofollow
[41] https://www.wikidata.org/wiki/Wikidata:Notability
[42] https://www.seroundtable.com/google-guarantee-ranking-29948.html (2020)

UNVERIFIED (needs live HTML inspection before relying on it): link attributes for LinkedIn, Wellfound, DesignRush, Justdial, Sulekha, IndiaMART, Stack Overflow's current rule, npm, VS Code Marketplace, Chrome Web Store, YourStory, Vercel's directory; the Startup India public profile format; NASSCOM and FKCCI fees.
