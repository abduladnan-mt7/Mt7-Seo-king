# WebSite (site name)

Source `[G]`: [Site names, 2025-12-10](https://developers.google.com/search/docs/appearance/site-names). Google picks the site name from the home page's WebSite markup, `<title>`, headings, og:site_name and "references to it that appear on the web". Place the **same** markup on every home-page duplicate (www and non-www, http and https) so every variant agrees `[G]`. `alternateName` carries the short or domain form.

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://www.example.com/#website",
  "url": "https://www.example.com/",
  "name": "<FILL: Brand>",
  "alternateName": ["<FILL: example.com>"],
  "inLanguage": "en",
  "publisher": { "@id": "https://www.example.com/#org" }
}
```

Notes
- `url` must be the canonical home URL (the host every other variant redirects to) `[G]`.
- `potentialAction` / `SearchAction` (sitelinks search box) was retired by Google; leave it out `[INFERENCE]` - verify in the current gallery if you need it.
- Also set `<meta property="og:site_name" content="<Brand>">` and keep `<title>` on the home page starting with the brand `[G]`.
