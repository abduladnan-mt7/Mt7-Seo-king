# SoftwareApplication (app, SaaS, free tool)

`[G]` Software app is a listed feature; Google's docs require `name` plus either `offers` (with price - use `0` for free) or `aggregateRating`. For your **own** product, ratings you collect and display yourself are self-serving `[G]` - lean on `offers`. Use `WebApplication` for browser tools, `MobileApplication` for app-store apps, or keep `SoftwareApplication` and set `applicationCategory` / `operatingSystem`.

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
- Do not add `aggregateRating` from your own on-site reviews; ratings from an app store are the store's data - cite them in text with a link rather than in your markup `[INFERENCE]`.
- A mobile app's store listing should be under the company's developer account; a personal account does not corroborate the company `[INFERENCE]`.
