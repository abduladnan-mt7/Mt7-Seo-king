# AI-search visibility: AI Overviews, AI Mode, ChatGPT, Perplexity, Gemini, Copilot

Last verified 2026-10-20. Tags: `[G]` Google official; `[OFFICIAL]` OpenAI / Perplexity / Microsoft / Anthropic docs; `[DATA]` study with n; `[PROVEN]`/`[CLAIM]`/`[WARNED]` community tiers; `[INFERENCE]` this skill's reasoning. Everything here ages in months - re-verify before quoting a number.

## 1. Google: what is required (nothing extra)

- `[G]` Requirements to appear in AI Overviews / AI Mode: indexed + snippet-eligible. "There are no additional requirements to appear in AI Overviews or AI Mode, nor other special optimizations necessary." No special schema or "AI text files". [AI features, 2025-12](https://developers.google.com/search/docs/appearance/ai-features)
- `[G]` Google's AI-optimization guide (2026-05-15, updated 2026-07): GEO/AEO "is still SEO"; structured data "isn't required"; Search ignores llms.txt; no chunking or writing specially for AI; mass query-variant pages may breach scaled content abuse; "Seeking inauthentic 'mentions'... isn't as helpful as it might seem"; no third-party tool has access to Google's ranking/AI systems. [AI optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
- `[G]` Links are chosen through "query fan-out" (many related sub-searches); AIO and AI Mode may use different models and therefore different links. Practical consequence: rank for the specific sub-queries (service + stack, service + city, "how much does X cost") and you become citable.
- `[G]` Controls: `nosnippet`, `data-nosnippet`, `max-snippet`, `noindex`; since 2026-08-31 a site-wide "Search generative AI control" in Search Console (excluding removes the site from AIO, AI Mode and Discover AI; "isn't used as a ranking or inclusion signal" elsewhere). [Search Console help, 2026-08](https://support.google.com/webmasters/answer/16908024?hl=en) `Google-Extended` does not affect Search. [Google crawlers, 2026-10](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers)
- `[G]` Reporting: AI Mode counted in Performance (Web) since 2025-06. Separate Generative AI performance report (launched 2026-06, all sites 2026-08-31): impressions only by page, country, device, date - no queries, no clicks - and may not appear for low-volume sites. [Help, 2026-08](https://support.google.com/webmasters/answer/16984139?hl=en) [Google blog, 2026-06](https://blog.google/products-and-platforms/products/search/new-controls-website-owners/)
- `[G]` AI Mode rolling out to everyone in India since 2025-07 (English first). [Google India, 2025-07](https://blog.google/intl/en-in/feed/ai-mode-in-google-search-rolling-out-in-india/)

## 2. How the other engines choose sources

- `[OFFICIAL]` OpenAI: `OAI-SearchBot` governs ChatGPT search inclusion ("Sites that are opted out of OAI-SearchBot will not be shown in ChatGPT search answers", though they may still appear as navigational links); `GPTBot` = training only; `ChatGPT-User` = user-triggered fetches, robots.txt "may not apply", not used for search eligibility; controls are independent and take ~24 h. [OpenAI bots](https://developers.openai.com/api/docs/bots) ChatGPT search uses "third-party search providers" plus partner content; the consumer provider is unnamed. [OpenAI Help](https://help.openai.com/en/articles/12627856) `[CLAIM]` Claims that OpenAI runs its own full index or uses Google results are unverified.
- `[OFFICIAL]` Perplexity: `PerplexityBot` surfaces sites; `Perplexity-User` "generally ignores robots.txt"; changes take <= 24 h. [Perplexity crawlers](https://docs.perplexity.ai/docs/resources/perplexity-crawlers.md) `[DATA]` (allegation, disputed) Cloudflare reported undeclared stealth crawlers. [Cloudflare, 2025-08](https://blog.cloudflare.com/perplexity-is-using-stealth-undeclared-crawlers-to-evade-website-no-crawl-directives/)
- `[OFFICIAL]` Gemini: `Google-Extended` controls training and grounding in Gemini Apps / Vertex AI; blocking it keeps a site out of Gemini-app grounding, not out of AI Overviews. (Google crawlers doc above)
- `[OFFICIAL]` Anthropic (spot-verified 2026-10-20): `ClaudeBot` collects content for training; `Claude-User` fetches when a user asks; `Claude-SearchBot` improves search responses; the page states Anthropic's bots honour robots.txt. [Anthropic help](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler)
- Copilot grounds on Bing. `[REPORTED]` Bing's Fabrice Canel: schema "helps Microsoft's LLMs understand your content"; recommends IndexNow (conference remark). [SEL, 2025-03](https://searchengineland.com/microsoft-bing-copilot-use-schema-for-its-llms-453455) `[PROVEN]` One documented case: ChatGPT citations tracked Bing rankings, not Google. [GSQi, 2026-08-03](https://www.gsqi.com/marketing-blog/surging-in-chatgpt-dead-in-google/) -> verify in Bing Webmaster Tools and submit via IndexNow.

## 3. Who gets cited (data)

- `[DATA]` 863K SERPs / 4M URLs: 38% of AIO-cited URLs rank in the top 10 (76% in Jul 2025 with 1.9M citations); ~31-37% rank outside the top 100 (Ahrefs infers fan-out). [Ahrefs, 2026-03](https://ahrefs.com/blog/ai-overview-citations-top-10/)
- `[DATA]` 75K brands with DR > 40 (Spearman): branded web mentions 0.66-0.71 and YouTube mentions ~0.737 with AI visibility; backlinks "very weak" (DR ~0.27); page count ~0.19. Correlational, established-brand skew. [Ahrefs, 2025-12](https://ahrefs.com/blog/ai-brand-visibility-correlations/)
- `[DATA]` 230K prompts, 100M+ citations, 13 weeks: Reddit and Wikipedia lead in ChatGPT; LinkedIn, YouTube, Reddit lead in AI Mode; Reddit's ChatGPT share fell from ~60% to ~10% within weeks. [Semrush, 2025-11](https://www.semrush.com/blog/most-cited-domains-ai/) Reddit's share fell ~86% again in Aug 2026; trackers disagree ~4x on baselines. [TechRepublic, 2026-08](https://www.techrepublic.com/article/news-chatgpt-reddit-citations-ai-search/)
- `[DATA]` 325K prompts / 89K LinkedIn URLs: LinkedIn cited in ~11% of responses; Pulse long-form = 50-66% of cited LinkedIn content; individual members (59%) cited more than company pages; median cited post 15-25 reactions. [Semrush, 2026-03](https://www.semrush.com/blog/linkedin-ai-visibility-study/)
- `[DATA]` 750 ChatGPT prompts: "best X" listicles = 43.8% of cited page types; for agency prompts the agency's own list appeared in 17.2% of responses recommending it; 35% of cited lists sat on low-authority domains. [Ahrefs, 2025-12](https://ahrefs.com/blog/best-lists-research/)
- `[DATA]` 31 "best agencies for X" prompts: 57% of ChatGPT citations were the agency's own site when a page answered the query directly; lists were 70% of Perplexity citations, 77% Gemini, 59% AI Mode, 48% AIO. [Onely, 2026-10-16](https://www.onely.com/blog/how-chatgpt-decides-which-brands-to-recommend/) (vendor)
- `[DATA]` 30K US commercial keywords: 34.5% of AIOs cited a review platform (Clutch 2.38% of those; 17.1% for "best/top"). [SE Ranking, 2026-01](https://seranking.com/blog/review-platforms-in-ai-overviews/)
- `[DATA]` Referral volume: AI assistants 0.43% of visits vs search 26.8% (115K sites). [Ahrefs, 2026-10](https://ahrefs.com/benchmarks/ai-vs-search) Google sends ~190x ChatGPT's traffic (76K sites). [Ahrefs, 2026-02](https://ahrefs.com/blog/chatgpt-has-12-percent-of-googles-search-volume/) Keep AI visibility in proportion: it is a brand channel, not the traffic channel.
- Click effects: see keyword-and-ranking.md section 6 (Pew, Ahrefs, Seer). `[DATA]` Seer 2026 update (53 brands, 5.47M queries): AIO-query organic CTR 1.31% (Dec 2025) -> 2.36% (Feb 2026) vs 3.82% non-AIO; cited brands 2.07% vs 0.94% uncited. [Seer, 2026-04](https://www.seerinteractive.com/insights/aio-impact-on-google-ctr-2026-update)

## 4. llms.txt - hygiene at most

- `[G]` 2026-06-15: Search doesn't use llms.txt; no ranking effect; fine to keep for other services. [Search Central updates](https://developers.google.com/search/updates) `[REPORTED]` Mueller: "FWIW no AI system currently uses llms.txt". [SER, 2025-06](https://www.seroundtable.com/google-ai-llms-txt-39607.html)
- `[DATA]` 137K domains: 97% of llms.txt files got zero requests in May 2026; the largest fetchers were GPTBot then Claude-Code - the audience is coding agents. [Ahrefs, 2026-06](https://ahrefs.com/blog/llmstxt-study/) `[DATA]` ~300K domains: "No correlation between AI citations and LLMs.txt". [SE Ranking, 2026-10](https://seranking.com/blog/llms-txt/)
- Rule: keep one if it is free and accurate (never let it promise what the site no longer does); never spend effort on it.

## 5. Structured data, entities, mentions

- `[G]` Organization markup helps "disambiguate your organization"; logo in knowledge panels; `sameAs` = "a page on another website with additional information"; no AI mention. [Organization, 2026-09](https://developers.google.com/search/docs/appearance/structured-data/organization)
- `[DATA]` 1,885 pages that added JSON-LD vs ~4,000 controls: AI Mode +2.4%, ChatGPT +2.2% (not significant); AIO -4.6% (significant, not attributable). [Ahrefs, 2026-05](https://ahrefs.com/blog/schema-ai-citations/) Schema is hygiene, not a lever.
- Wikidata requires "serious and publicly available references". [Wikidata notability](https://www.wikidata.org/wiki/Wikidata:Notability) No credible study links it to AI citations - skip until independent press exists.
- `[DATA]` Experiment, 8 AI products, 56 questions: an invented brand seeded with fake Reddit/Medium stories was repeated by Perplexity, Grok, Gemini and AI Mode; ChatGPT mostly used the official FAQ; "The most detailed story wins, even if it's false". [Ahrefs, 2025-12](https://ahrefs.com/blog/ai-vs-made-up-brand-experiment/) Lesson for honest sites: publish the most detailed, specific, dated account of yourself in plain HTML - prices, metrics, who did what - so engines have the real story to repeat.
- `[DATA]` (vendor-commissioned by Trustpilot, 800K responses): no Trustpilot profile ~1% cited, profile 53.5%, 80+ reviews 75.3% - treat as marketing. [PR Newswire, 2026-05](https://tools.prnewswire.com/en-us/live/20813/release/20260512EN56379)
- `[CLAIM]` (strong, self-testable) Serve content as HTML: ChatGPT, Claude and Perplexity could not read client-side-JS-rendered content; Gemini and Copilot partly. [GSQi, 2026-10-19](https://www.gsqi.com/marketing-blog/can-ai-search-platforms-render-javascript/) `scripts/onpage-check.mjs` flags pages whose raw HTML carries little text.
- `[WARNED]` Seeding Reddit/forums for LLMs: Reddit removes ~25K spam posts/day; seeded posts get removed and called out. [Waxy, 2026-06](https://waxy.org/2026/06/companies-are-using-reddit-to-manipulate-chatgpt-and-google-ai-search/) [Lily Ray, 2026-10-04](https://lilyraynyc.substack.com/p/prediction-the-next-massive-google) `[G]` Google says inauthentic mentions don't help and spam policies cover AI responses.

## 6. Measuring AI visibility (small site, free)

- Search Console Generative AI report (impressions only; may be blank at low volume). `[G]`
- Bing Webmaster Tools AI Performance (public preview since 2026-02): citations, "grounding queries", citation share (2026-06). `[OFFICIAL]` [Bing, 2026-02](https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview) [Bing, 2026-06](https://blogs.bing.com/search/June-2026/New-AI-Visibility-Insights-in-Bing-Webmaster-Tools-Intents-Topics-Citation-Share-Compare)
- GA4 "AI Assistant" default channel (from 2026-05-13) covers ChatGPT, Gemini, Deepseek, Copilot, Grok; AIO/AI Mode clicks stay in Organic Search. `[OFFICIAL]` [GA help](https://support.google.com/analytics/answer/9756891?hl=en) Perplexity is not in the list -> add the custom channel group in `assets/ai-visibility-measurement.md`.
- `[DATA]` 2,961 runs of 12 prompts: < 1-in-100 chance of the same brand list twice -> track the % of runs mentioning you, never a "rank". [SparkToro, 2026-01](https://sparktoro.com/blog/new-research-ais-are-highly-inconsistent-when-recommending-brands-or-products-marketers-should-take-care-when-tracking-ai-visibility/)
- `[CLAIM]` Small sites: a manual monthly prompt panel (about 20 prompts x 5 runs x 4 engines, logged in `assets/ai-visibility-panel.csv`) plus the free first-party reports above. Paid "AI visibility scores" have no access to the engines' internals. `[G]`

## 7. What works, in order (synthesis)

1. Rank normally for the specific sub-queries with dedicated pages (`[G]` fan-out; `[PROVEN]` organic rankings carry into AI answers - Gabe). Rank in Bing too.
2. Real reviews on the profiles the engines cite for your category (GBP first; Clutch/GoodFirms for agencies; G2 for SaaS; Yelp/TripAdvisor for local/hospitality - `[DATA]` sources above, `[INFERENCE]` for the mapping).
3. Earn inclusion in independent "best/top X" lists; never publish one crowning yourself.
4. Off-site brand mentions: founder-led LinkedIn long-form (500-2,000 words) and YouTube videos with the brand in the title (`[DATA]` correlations; `[INFERENCE]` on the format).
5. Specific, dated, quotable facts in visible HTML (prices, metrics, outcomes) - not only in PDFs or JSON-LD.
6. Hygiene: Organization/WebSite schema, llms.txt if free, robots.txt allowing OAI-SearchBot, PerplexityBot, Bingbot, Googlebot (GPTBot and Google-Extended are training/Gemini choices - see `assets/robots-and-crawlers.md`).

## 8. GEO claims not supported by evidence

- llms.txt boosts AI visibility; special "AI schema"; chunking or LLM-only pages; "rank #1 in ChatGPT" (answers are near-random run to run); "our score shows how Google's AI sees you"; "backlinks are dead, mentions cause citations" (correlational only); seeding Reddit/Medium (works on some engines for a while, violates Google's policies and Reddit's, gets removed).

## 9. Retrieved, cited, mentioned, recommended `[INFERENCE]`

A framework for reading results; it is not a ranking system anyone has documented. Adapted from marketing-skills `ai-seo` (MIT).
1. **Retrieved:** the engine fetched your page (server logs show `OAI-SearchBot`, `PerplexityBot`, `ChatGPT-User`; `assets/ai-visibility-measurement.md` section 4).
2. **Cited:** your URL appears as a source.
3. **Mentioned:** your brand is named in the answer text.
4. **Recommended:** the answer tells the user to pick you. This rung depends mostly on what the rest of the web says (reviews, independent lists, forums, press), not on your own pages.

Report all four rungs, never one blended score, and note any answer that recommends *against* you. The test for rung 4: if the engine ignored your domain entirely, would the rest of the web still shortlist you? If not, the work is reviews and earned mentions (Phases 4-5), not more on-site content.
Free attribution: add "How did you hear about us?" to signup/contact forms with an "AI assistant (ChatGPT, Gemini...)" option and a free-text "what did you ask?" follow-up `[INFERENCE]`.
