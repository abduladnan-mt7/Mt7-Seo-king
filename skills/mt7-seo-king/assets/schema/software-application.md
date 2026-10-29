# SoftwareApplication (app, SaaS, free tool)

`[G]` Software app is a listed feature. Google's doc requires `name`, `offers.price` (use `0` for a free app) **and** either `aggregateRating` or `review`; `applicationCategory` and `operatingSystem` are recommended ([Software app, 2026-09](https://developers.google.com/search/docs/appearance/structured-data/software-app)). Markup with `offers` alone is valid but not eligible for the rich result. Ratings must come directly from real users and be visible on the page; the self-serving rule (no stars for reviews an entity controls about itself) covers `LocalBusiness` and `Organization`, not an app's user ratings `[G]` ([Review snippet, 2026-09](https://developers.google.com/search/docs/appearance/structured-data/review-snippet)). With no genuine user ratings, ship the markup without them and accept that the rich result is out of reach. Use `WebApplication` for browser tools, `MobileApplication` for app-store apps, or keep `SoftwareApplication` and set `applicationCategory` / `operatingSystem`.

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": "https://www.example.com/products/<slug>#app",
  "name": "<FILL: Product name>",
  "description": "<FILL: one sentence - what it does, for whom>",
  "url": "https://www.example.com/products/<slug>",
  "image": "https://www.example.com/images/<slug>-screenshot.png",
  "applicationCategory": "<FILL: BusinessApplication | UtilitiesApplication | ...>",
  "operatingSystem": "<FILL: Web | Android | iOS | Windows>",
  "softwareVersion": "<FILL or delete>",
  "offers": {
    "@type": "Offer",
    "price": "<FILL: 0 for free, or the real monthly/one-time price shown on the page>",
    "priceCurrency": "INR",
    "availability": "https://schema.org/InStock",
    "url": "https://www.example.com/products/<slug>#pricing"
  },
  "author": { "@id": "https://www.example.com/#org" },
  "installUrl": "<FILL or delete: Play Store / App Store URL>",
  "screenshot": ["https://www.example.com/images/<slug>-screenshot.png"],
  "featureList": ["<FILL or delete: feature 1>", "<FILL or delete: feature 2>"]
}
```

Rules
- The price in markup must be visible on the page `[G]`.
- Add `aggregateRating` or `review` only from ratings real users gave on your own site, shown on the page with their count; never write, curate or import them `[G]`. Ratings from an app store are the store's data - cite them in text with a link rather than in your markup `[INFERENCE]`.
- A mobile app's store listing should be under the company's developer account; a personal account does not corroborate the company `[INFERENCE]`.
