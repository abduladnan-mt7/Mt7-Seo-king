# Site architecture and internal linking

How pages are organised and linked decides what crawlers find, how importance flows, and whether a new page starts life orphaned. Tags as in SKILL.md. Added 2026-10-29; structure adapted from marketing-skills' `site-architecture` (MIT, see THIRD_PARTY_NOTICES.md), with every rule re-sourced to Google or marked as reasoning.

## 1. URLs `[G]`

Source: [URL structure best practices](https://developers.google.com/search/docs/crawling-indexing/url-structure).
- Simple, descriptive words; hyphens between words, not underscores; UTF-8 where non-ASCII is needed `[G]`.
- Avoid session IDs and parameters that don't change content; use the standard `?key=value&key=value` form when parameters are needed `[G]`.
- Fragments (`#...`) don't create separate pages for Google; never use them to change content `[G]`.
- URLs are case-sensitive and `/a` vs `/a/` are different URLs: pick one form, redirect the other, link only to the chosen one `[G]` (duplicate consolidation) `[INFERENCE]` on the policy.
- No dates or IDs in evergreen slugs; short over exhaustive `[INFERENCE]`.
- Change a URL only for a real reason. When you do: one-hop 301/308 to the exact new URL, update internal links and the sitemap `[G]` ([redirects](https://developers.google.com/search/docs/crawling-indexing/301-redirects)).

## 2. Hierarchy: hubs and spokes

- Every indexable page is reachable through HTML links from at least one other indexable page. A sitemap helps discovery, but a page that only the sitemap knows about gets no internal importance `[G]` ([links](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)) `[INFERENCE]` on the importance part.
- Hub (category, topic or tool-family page) links to every spoke; each spoke links back to its hub and to closely related siblings `[PROVEN]`.
- Money pages sit close to the home page in clicks. The "3-click rule" is folklore; aim for "few clicks, linked from strong pages", not a number `[INFERENCE]`.
- Related-item modules (related tools, related posts) need data to score on. Items with no tags or categories score zero against everything and become dead ends `[INFERENCE]`.
- A hub needs its own substance (an intro that helps choose between the spokes). An empty list page is a thin page `[G]` (helpful content) `[INFERENCE]` on the application.

## 3. Crawlable links and anchors `[G]`

Source: [Link best practices](https://developers.google.com/search/docs/crawling-indexing/links-crawlable).
- Google follows `<a href="...">` links. JavaScript click handlers without an `href`, and `<span>` or `<button>` "links", are not reliably followed `[G]`.
- Anchor text: descriptive and concise, about the target. Not "click here", and not a keyword-stuffed string `[G]`.
- Navigation rendered only after JavaScript runs is invisible to crawlers that don't render, which includes most AI crawlers `[CLAIM]`. Keep the header, footer and breadcrumbs in the server HTML.
- "Header links pass more value", "5-10 links per 1,000 words" and "4-7 nav items" have no source. Treat them as UX preferences, not ranking rules `[INFERENCE]`.

## 4. Breadcrumbs

- Mirror the real hierarchy (Home > Hub > Page). Every crumb except the current page is a link `[INFERENCE]`.
- `BreadcrumbList` structured data matches the visible trail `[G]` ([breadcrumb](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb); template `assets/schema/breadcrumb.md`).

## 5. Pagination, infinite scroll, facets `[G]`

Sources: [pagination and incremental loading](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading), [faceted navigation](https://developers.google.com/search/docs/crawling-indexing/crawling-managing-faceted-navigation).
- Each paginated page has its own URL and links to the next. Don't canonicalise page 2+ to page 1 `[G]`.
- Infinite scroll or "load more" needs paginated URLs behind it, or the items past the first batch aren't discoverable `[G]`.
- Filter and sort combinations multiply into near-infinite URLs. If filtered pages shouldn't be indexed, keep crawlers out (robots.txt disallow on the parameter pattern, or URL fragments for filters). Index only the facets with real search demand and real content `[G]`.

## 6. Internal-link audit (quarterly, or after any template change)

Free tools: `scripts/sitemap-audit.mjs` (sitemap URLs: status, noindex, canonical, inlinks from other sitemap pages); Screaming Frog free tier (500 URLs) `[OFFICIAL]`; Ahrefs Webmaster Tools site audit for verified sites `[OFFICIAL]`; GSC Links report `[G]`.
- [ ] Orphans: indexable URLs with zero internal inlinks. Link them from their hub, or noindex/remove them if they shouldn't exist.
- [ ] Broken internal links (4xx) fixed at the source.
- [ ] Internal links that hit a redirect updated to the final URL.
- [ ] Every case study, article or tool links to its hub/service page with a descriptive anchor `[G]`.
- [ ] The pages you most want to rank are the most linked-to internally `[INFERENCE]`.
- [ ] Before reporting "orphan" from a raw-HTML crawl, check that the navigation isn't JavaScript-rendered, or the crawl will under-count inlinks site-wide.

## 7. Planning output

When planning or restructuring, produce:
1. A URL map table: page | URL | parent hub | nav location (header/footer/hub only) | priority.
2. An indented tree of the hierarchy.
3. A redirect map (old -> new) for every URL that changes.
