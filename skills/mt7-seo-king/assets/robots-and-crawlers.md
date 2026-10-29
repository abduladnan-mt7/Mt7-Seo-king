# robots.txt, crawlers, sitemaps, IndexNow, llms.txt

Last verified 2026-10-20. Tags: `[G]` Google docs; `[OFFICIAL]` OpenAI / Perplexity / Anthropic / IndexNow docs; `[INFERENCE]` default choices this skill recommends.

## What each crawler token controls

| Token | Operator | What it does | Default here | Source |
|---|---|---|---|---|
| `Googlebot` | Google | Search index (and therefore AI Overviews / AI Mode eligibility) | Allow | `[G]` [AI features](https://developers.google.com/search/docs/appearance/ai-features) |
| `Google-Extended` | Google | Gemini training and grounding in Gemini Apps / Vertex AI; **does not affect Search** | Allow if you want Gemini-app grounding; blocking does not remove you from AIO | `[G]` [Google crawlers, 2026-10](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers) |
| `Bingbot` | Microsoft | Bing index; grounds Copilot; ChatGPT uses "third-party search providers" | Allow | `[OFFICIAL]` [OpenAI Help](https://help.openai.com/en/articles/12627856) `[REPORTED]` [SEL, 2025-03](https://searchengineland.com/microsoft-bing-copilot-use-schema-for-its-llms-453455) |
| `OAI-SearchBot` | OpenAI | ChatGPT search inclusion: opted-out sites "will not be shown in ChatGPT search answers" | Allow | `[OFFICIAL]` [OpenAI bots](https://developers.openai.com/api/docs/bots) |
| `GPTBot` | OpenAI | Model training only; not search eligibility | Owner's choice | `[OFFICIAL]` (same) |
| `ChatGPT-User` | OpenAI | User-triggered fetches; robots.txt "may not apply"; not used for search eligibility | Allow (blocking is mostly symbolic) | `[OFFICIAL]` (same) |
| `PerplexityBot` | Perplexity | Surfaces sites in Perplexity answers | Allow | `[OFFICIAL]` [Perplexity crawlers](https://docs.perplexity.ai/docs/resources/perplexity-crawlers.md) |
| `Perplexity-User` | Perplexity | User-triggered fetches; "generally ignores robots.txt" | n/a | `[OFFICIAL]` (same) |
| `ClaudeBot` | Anthropic | Training data collection; honours robots.txt | Owner's choice | `[OFFICIAL]` [Anthropic help](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler) (spot-verified 2026-10-20) |
| `Claude-SearchBot` | Anthropic | Improves search responses | Allow | `[OFFICIAL]` (same) |
| `Claude-User` | Anthropic | Fetches when a Claude user asks | Allow | `[OFFICIAL]` (same) |
| `CCBot`, `Bytespider`, `Amazonbot`, `meta-externalagent`, `Applebot-Extended` | Common Crawl, ByteDance, Amazon, Meta, Apple | Mostly training corpora | Owner's choice | `[INFERENCE]` - names from memory; verify each operator's docs before relying on them |

Changes take effect in ~24 h at OpenAI and Perplexity `[OFFICIAL]`. Google-Extended and the Search Console "Search generative AI control" are separate switches: the latter removes the site from AIO / AI Mode / Discover AI and "isn't used as a ranking or inclusion signal" elsewhere `[G]` [Help, 2026-08](https://support.google.com/webmasters/answer/16908024?hl=en).

## robots.txt template (search-visible, training optional)

```
# Search engines and answer engines: allow everything indexable
User-agent: Googlebot
User-agent: Bingbot
User-agent: OAI-SearchBot
User-agent: PerplexityBot
User-agent: Claude-SearchBot
User-agent: Claude-User
User-agent: ChatGPT-User
Allow: /

# Training-only crawlers: decide deliberately. Blocking these does NOT remove
# you from Google Search, AI Overviews, ChatGPT search or Perplexity answers.
# Allowing Google-Extended keeps you available for Gemini-app grounding.
User-agent: GPTBot
User-agent: ClaudeBot
User-agent: Google-Extended
User-agent: CCBot
Allow: /
# ...or, to opt out of training while staying in search:
# Disallow: /

# Everyone else
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /*?*utm_
Disallow: /search

Sitemap: https://www.example.com/sitemap.xml
```

Notes `[INFERENCE]`: never `Disallow: /` for `*` on a site you want found; do not block CSS/JS Google needs to render; a `Disallow` does not de-index an already-indexed URL - use `noindex` for that `[G]`; keep the sitemap line absolute.

## Sitemaps `[G]`

- List only canonical, 200, indexable URLs; `lastmod` only when the content really changed (date-bumping is a warning sign).
- Split by type when large (pages, products, articles, images). Submit in Search Console and Bing Webmaster Tools.
- A sitemap is a "weak" canonical signal; redirects and `rel=canonical` are "strong". [Consolidate duplicates, 2026-07-10](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)

## IndexNow (Bing and partners) `[OFFICIAL]` (spot-verified at indexnow.org, 2026-10-20)

- Key: 8-128 characters (hex / a-z / A-Z / 0-9 / dashes); host it as a UTF-8 text file `https://www.example.com/<key>.txt` containing the key, or elsewhere on the host with `keyLocation`.
- Single URL: `GET https://api.indexnow.org/indexnow?url=<url-encoded URL>&key=<key>`
- Batch: `POST https://api.indexnow.org/indexnow` with `Content-Type: application/json; charset=utf-8` and body `{"host":"www.example.com","key":"<key>","urlList":["https://www.example.com/a","https://www.example.com/b"]}` - up to 10,000 URLs per request.
- Responses: 200 submitted, 202 received (key validation pending), 400 bad format, 403 key invalid, 422 URLs not on the host, 429 too many requests.
- Participating engines share submissions with each other; Google does not participate `[INFERENCE]` - use Search Console's URL Inspection / sitemaps for Google.
- Why bother: Bing feeds Copilot and is a documented path into ChatGPT citations `[PROVEN]` one case; it is free and takes an hour to wire into a deploy hook.

## llms.txt - optional hygiene only

- `[G]` Google Search does not use it (changelog 2026-06-15). `[REPORTED]` Mueller: "no AI system currently uses llms.txt". `[DATA]` 97% of llms.txt files got zero requests in May 2026 (137K domains, [Ahrefs, 2026-06](https://ahrefs.com/blog/llmstxt-study/)); no correlation with AI citations across ~300K domains ([SE Ranking, 2026-10](https://seranking.com/blog/llms-txt/)).
- If you keep one: a short Markdown index of the site's canonical pages with one-line descriptions; keep it accurate (never let it promise things the site no longer offers); never spend more than an hour on it.

## Agent access beyond robots.txt

- Core content and links in the initial HTML; most AI crawlers don't execute JavaScript `[CLAIM]` (`scripts/onpage-check.mjs` flags JS-dependence).
- A firewall or bot-protection rule must not challenge verified search crawlers; verify Googlebot/Bingbot by reverse DNS or the published IP ranges before blocking anything that claims to be them `[G]` `[OFFICIAL]`. Check the WAF logs after enabling any "block AI bots" toggle; some block search fetchers too.
- Real status codes: a 200 "page not found" (soft 404) or a 200 challenge page gets treated as the page's content `[G]`.
- Optional and unproven: serving a Markdown rendition at the same URL for `Accept: text/markdown` (with `Vary: Accept`), or linking one with a `Link` header. Some agent tooling reads it; no engine has documented a ranking or citation benefit `[CLAIM]`.

## Meta robots / X-Robots-Tag quick reference `[G]`

- `noindex` removes from Search (and therefore from AI Overviews). `nosnippet`, `data-nosnippet`, `max-snippet:N` limit what Google may show in snippets and AI features.
- `X-Robots-Tag: noindex` on a response header is easy to leave behind on staging rules - `scripts/onpage-check.mjs` reports both.
