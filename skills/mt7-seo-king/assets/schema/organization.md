# Organization

Source `[G]`: [Organization structured data, 2026-09-08](https://developers.google.com/search/docs/appearance/structured-data/organization). Recommended properties: `name`, `alternateName`, `url`, `logo`, `sameAs`, `address`, `contactPoint`, `legalName`, `taxID`, `vatID`; use the most specific subtype (`Organization`, `Corporation`, `LocalBusiness` only with a physical address). No guaranteed feature; the point is disambiguation (a short brand name vs bigger products that share it) and the logo/knowledge-panel data.

Guidance
- `name` = the brand exactly as written everywhere else; `alternateName` = the forms people type (domain, lowercase, long form). `[G]` site names use consistent naming.
- `sameAs` = every real profile you control (LinkedIn, YouTube, GitHub, X, Instagram, Clutch, GoodFirms, G2, Trustpilot, Crunchbase, GBP share link). Only pages that actually exist.
- `legalName`, `taxID`, `vatID`, `address`: include only what you are willing to publish. Omitting them is fine; faking them is not.
- `logo`: a crawlable image URL, at least 112x112 px, on a stable URL `[G]`.
- Put this on the home page (or About) once; other pages may reference `"@id": "https://www.example.com/#org"`.

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://www.example.com/#org",
  "name": "<FILL: Brand>",
  "alternateName": ["<FILL: example.com>", "<FILL: Brand Technologies>"],
  "legalName": "<FILL or delete: Brand Technologies Private Limited>",
  "url": "https://www.example.com/",
  "logo": "https://www.example.com/logo.png",
  "description": "<FILL: one sentence - what the company does, for whom, where>",
  "foundingDate": "<FILL or delete: 2025-01-15>",
  "email": "<FILL or delete: hello@example.com>",
  "telephone": "<FILL or delete: +91-XXXXXXXXXX>",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "<FILL: City>",
    "addressRegion": "<FILL: State>",
    "addressCountry": "<FILL: IN>"
  },
  "contactPoint": [{
    "@type": "ContactPoint",
    "contactType": "sales",
    "telephone": "<FILL: +91-XXXXXXXXXX>",
    "email": "<FILL: hello@example.com>",
    "availableLanguage": ["en", "<FILL or delete: hi>"]
  }],
  "sameAs": [
    "https://www.linkedin.com/company/<FILL>",
    "https://www.youtube.com/@<FILL>",
    "https://github.com/<FILL>",
    "https://clutch.co/profile/<FILL>",
    "https://www.goodfirms.co/company/<FILL>",
    "https://www.trustpilot.com/review/<FILL>",
    "https://www.instagram.com/<FILL>",
    "https://x.com/<FILL>"
  ]
}
```

Do not add `aggregateRating` or `review` here `[G]` (self-serving). If the address is a private residence or an unstaffed registered office, delete `address` rather than publish it, and do not switch to `LocalBusiness` `[G]`.
