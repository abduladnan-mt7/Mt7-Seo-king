# Search Console monthly review worksheet

Takes 30-60 minutes. Copy, date it, fill the blanks, keep the history. Tags as in SKILL.md. Last verified 2026-10-20.

## 0. Caveats to remember while reading the numbers
- `[DATA]` ~46.77% of clicks come from anonymized queries, and the share is worse on small sites (Ahrefs 2026-02, 22B clicks / 887,534 properties) - the query table understates demand; the Pages tab is the complete view.
- `[PROVEN]` Image packs inside web results count as Web impressions at the block's position - impressions up, CTR down, nothing changed.
- `[G]` AI Mode is inside Performance (Web) since 2025-06; the Generative AI report is impressions only and may be blank for small sites.
- `[G]` Averages hide the mix: a new query at position 40 lowers "average position" while nothing got worse. Compare per query/page.
- `[G]` Data anomalies page before panicking: logging issues happen (e.g. Aug 13-17 2026). `node scripts/google-updates.mjs --around <date>` also lists the recorded anomalies.
- `[G]` Impressions, CTR and average position from **2025-05-13 to 2026-04-27** were affected by a logging error (clicks were not); after the fix, impressions can look lower. Any comparison that straddles 2026-04-27 compares two different measurements - use clicks for that span ([Data anomalies](https://support.google.com/webmasters/answer/6211453), entry of 2026-04-03).

## 1. Headline (28 days vs previous 28 days)
| Metric | This period | Previous | Delta | Note |
|---|---|---|---|---|
| Clicks | | | | |
| Impressions | | | | |
| CTR | | | | |
| Avg position | | | | |
| Branded clicks / impressions (use the branded filter, 2026-03) | | | | |
| Non-branded clicks / impressions | | | | |
| Pages with >= 1 click | | | | |

## 2. Events that could explain movement
- Search Status Dashboard entries overlapping the period: ...
- Site changes shipped (with dates): ...
- Manual actions / Security issues: none / ...
- Pages report: new "Not indexed" reasons on money pages: ...

## 3. Canonical checks `[G]`
- URL Inspection on the home page and 3 key pages: Google-selected canonical = declared canonical?  yes / no (which)
- Any page attributed to a host variant you retired (www vs apex, http vs https)?  ...
- Sitemap last read date and discovered URL count: ...

## 4. Striking-distance list (positions 8-20, then 21-30) `[PROVEN]`
Filter: Queries, last 3 months, exclude branded, position between 8 and 20, impressions >= 20 (adjust to the site's scale).

| Query | Impr | Pos | Page | Does the title use the searcher's words? | Action (retitle / strengthen first passage / add internal links / new page) | Done on |
|---|---|---|---|---|---|---|
| | | | | | | |

Retitle rule `[G]` `[DATA]`: unique, 50-60 chars, query words first, brand last, no extra keywords (SearchPilot: extra keywords did not help). Change one thing per page so the effect is attributable; hold 4-8 weeks.

## 5. Queries with impressions but no fitting page
| Query | Impr | Intent | SERP format seen | Page type to build (or skip) |
|---|---|---|---|---|
| | | | | |

## 6. Pages that lost clicks (> 30% drop)
| Page | Clicks before / after | Top query lost | Hypothesis (update / competitor / intent shift / cannibal / technical) | Action |
|---|---|---|---|---|
| | | | | |

## 7. Pages older than 6 months not in the top 10 for their primary query `[DATA]`
| Page | Primary query | Pos | Decision: refresh substantively / merge into ... / leave |
|---|---|---|---|
| | | | |

## 8. AI and Bing
- Generative AI report impressions (if present): ...
- Bing Webmaster Tools: indexed pages, AI Performance citations / grounding queries: ...
- GA4 AI Assistant channel sessions (+ custom group incl. Perplexity): ...
- Prompt panel this month (`assets/ai-visibility-panel.csv`): % of runs mentioning the brand = ...

## 9. Decisions carried into next month
1. ...
2. ...
3. ...
