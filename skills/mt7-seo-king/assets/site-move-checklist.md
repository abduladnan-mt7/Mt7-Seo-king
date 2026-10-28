# Site move / domain change checklist

Source of truth: `[G]` [Site moves with URL changes, 2026-08-20](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes) and `[G]` [Change of Address help](https://support.google.com/webmasters/answer/9370220). Last verified 2026-10-20. Covers domain moves (old.com -> new.com), protocol/host moves and URL restructures. Replace `OLD` / `NEW`.

## 0. Before anything

- [ ] Both OLD and NEW verified in Search Console as **domain properties** (the Change of Address tool works on domain-level properties only; it "does not move any subdomains... (including www)") `[G]`
- [ ] Export from OLD: all indexed URLs (GSC Pages report + sitemap + crawl), top queries/pages (Performance), external links (Links report) `[INFERENCE]`
- [ ] URL map prepared: every OLD URL -> exact NEW counterpart (not the homepage) `[G]`
- [ ] NEW site live and crawlable on its own first: self-referencing canonicals, sitemap, internal links pointing at NEW, robots.txt allows crawling `[G]`
- [ ] Analytics and Search Console annotations: record the move date `[INFERENCE]`

## 1. Redirects

- [ ] 301 or 308 from every OLD URL to its NEW URL, one hop (no chains, no redirect to home) - 301/308 "don't cause a loss in PageRank" `[G]`
- [ ] OLD homepage 301s to NEW homepage (required by the Change of Address tool) `[G]`
- [ ] All OLD variants redirect: http and https, www and apex `[G]`
- [ ] Redirects tested by script on the full URL map (status, Location, final 200) `[INFERENCE]`
- [ ] Keep the redirects for **at least 1 year**; longer if links still point at OLD `[G]`

## 2. Canonicals, sitemaps, signals

- [ ] NEW pages carry self-referencing canonicals; no page on NEW points its canonical at OLD `[G]`
- [ ] Sitemap of NEW URLs submitted on the NEW property; optionally keep an OLD sitemap listing the redirecting URLs briefly to speed discovery `[G]` (sitemaps are a "weak" signal; redirects and canonicals are "strong") `[G]`
- [ ] No conflicting signals: a URL must not both redirect and be canonical somewhere else; hreflang updated if used `[G]`
- [ ] WebSite JSON-LD with the site name on every NEW home-page variant `[G]`
- [ ] Organization `url` and `sameAs` updated; every profile (GBP, directories, social) now links to NEW `[INFERENCE]`

## 3. Change of Address (domain moves only)

- [ ] Filed from **every verified OLD domain property** (e.g. `old.com` and, if separately verified, `www.old.com`) - "for all verified variants of the old domain" `[G]`
- [ ] Not used for www/non-www or http/https switches - those are redirect-only `[G]`
- [ ] Google forwards signals for **180 days**; the tool can be undone within that window `[G]`
- [ ] No deadline is stated for filing, but every week unfiled is a week of slower consolidation `[G]` `[INFERENCE]`
- [ ] Bing: use Bing Webmaster Tools "Site Move" as well `[INFERENCE]`

## 4. After the move

- [ ] GSC on NEW: Pages report shows NEW URLs indexed; OLD property shows "Page with redirect" rising `[G]`
- [ ] URL Inspection on key NEW pages: Google-selected canonical = NEW URL. Google "might hold pages in a duplicate cluster for up to two weeks" after a fix `[G]`
- [ ] Ask the biggest linkers to update links to NEW (optional; redirects carry the value) `[G]` `[INFERENCE]`
- [ ] Watch for mixed canonicals (some pages still attributed to OLD): re-crawl, check the redirect on that exact URL `[G]`

## 5. Timeline expectations (set them with the owner)

- Small-medium site: "a few weeks for most pages to move" `[G]`
- Typical settle for a domain move: 1-3 months `[REPORTED]` (Illyes, 2026-10-02)
- A country-code TLD -> generic TLD move drops the country signal; restore locale through content: local address/phone, currency, local links, a Business Profile `[G]`
- Rankings can wobble while both hosts are in the index; don't make other large changes in the same window so the effect stays attributable `[INFERENCE]`

## 6. Rollback / sanity

- [ ] Keep the OLD domain registered and DNS-served for at least a year (redirects need it) `[G]`
- [ ] Monitor OLD domain for expiry; an expired domain picked up by a third party loses you the redirects `[INFERENCE]`
