# Measuring AI-search visibility (free stack)

Last verified 2026-10-20. Tags as in SKILL.md. `[DATA]` AI assistants send ~0.43% of visits vs 26.8% from search ([Ahrefs, 2026-10](https://ahrefs.com/benchmarks/ai-vs-search), 115K sites) - measure it, but keep it in proportion.

## 1. Monthly prompt panel (`ai-visibility-panel.csv`)
- `[DATA]` 2,961 runs of 12 prompts produced the same brand list < 1 time in 100 ([SparkToro, 2026-01](https://sparktoro.com/blog/new-research-ais-are-highly-inconsistent-when-recommending-brands-or-products-marketers-should-take-care-when-tracking-ai-visibility/)). Track **% of runs that mention the brand** per prompt and engine; never report a "rank".
- Panel: ~20 prompts (category x city, category x industry, "<service> cost", "<brand> reviews", "<A> vs <B>", "who built <client>") x 4 engines (Google AI Mode, ChatGPT, Perplexity, Gemini; add Copilot if Bing matters) x 3-5 runs, in private sessions, same week each month.
- Log cited URLs: they tell you which third-party pages (directories, lists, LinkedIn, YouTube) the engines trust for your category - that is your outreach list.

## 2. First-party reports `[G]` `[OFFICIAL]`
- **Search Console -> Performance -> Generative AI report** (all sites since 2026-08-31): impressions by page/country/device/date; no queries, no clicks; may be empty for low-volume sites. AI Mode clicks also sit inside Performance (Web). [Help](https://support.google.com/webmasters/answer/16984139?hl=en)
- **Bing Webmaster Tools -> AI Performance** (public preview since 2026-02; citation share, grounding queries, topics since 2026-06). Copilot grounds on Bing; one documented case of ChatGPT citations tracking Bing rankings. [Bing, 2026-02](https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview) [Bing, 2026-06](https://blogs.bing.com/search/June-2026/New-AI-Visibility-Insights-in-Bing-Webmaster-Tools-Intents-Topics-Citation-Share-Compare)
- **GA4 "AI Assistant" default channel** (from 2026-05-13): ChatGPT, Gemini, Deepseek, Copilot, Grok. AI Overview / AI Mode clicks stay in Organic Search (they are google.com referrals). Perplexity is not in the default list. [GA help](https://support.google.com/analytics/answer/9756891?hl=en)

## 3. GA4 custom channel group for AI referrers
Admin -> Data display -> Channel groups -> create a copy of the default group -> add a channel **AI Assistants (custom)** above Referral with the condition *Session source matches regex*:

```
^(chat\.openai\.com|chatgpt\.com|.*\.chatgpt\.com|perplexity\.ai|www\.perplexity\.ai|gemini\.google\.com|bard\.google\.com|copilot\.microsoft\.com|claude\.ai|.*\.claude\.ai|chat\.deepseek\.com|deepseek\.com|grok\.com|x\.ai|you\.com|chat\.mistral\.ai|meta\.ai|poe\.com)$
```

- ChatGPT, Gemini, Claude, Perplexity and Meta AI are the assistants Ahrefs' 115K-site referral benchmark tracks `[DATA]` ([Ahrefs, 2026-10](https://ahrefs.com/benchmarks/ai-vs-search)), and Copilot, Deepseek and Grok are in GA4's default AI Assistant channel `[OFFICIAL]`; the hostnames themselves and the other entries are `[INFERENCE]` - prune to what appears in your Referral report.
- Also add the same regex as an exploration segment so historical sessions can be re-cut `[INFERENCE]`.
- Expect small numbers; look at assisted conversions and landing pages, not sessions.

## 4. Server logs (optional, free)
- Grep access logs for `OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `Perplexity-User`, `Claude-User`, `Googlebot`, `Bingbot` to confirm the engines fetch the pages you want cited `[OFFICIAL]` token names; a page never fetched cannot be cited.

## 5. What "good" looks like for a small site `[INFERENCE]`
- Month 1-3: brand mentioned in 0-10% of category-prompt runs; cited URLs are directories you are not on yet -> fix profiles and reviews.
- Month 4-6: own pages appear for cost/comparison prompts; the brand appears in some "best X" runs via third-party lists.
- Any month: a sudden rise or fall of 50%+ is usually engine volatility (Reddit's share swung ~86% in Aug 2026) - look at three months before acting.

## 6. See the sub-queries an answer engine ran (manual, free) `[CLAIM]`

In ChatGPT on the web, open the browser's DevTools Network tab, ask the prompt, and search the response payload for `queries`: the search queries the model ran are often listed. Use them to check which sub-questions you have a page for. Never use them to mass-publish a page per query; that is the scaled-content pattern `[G]`. The payload format is undocumented and changes without notice.
