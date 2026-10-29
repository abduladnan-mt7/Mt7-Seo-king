# Service

`[INFERENCE]` Google lists no dedicated rich result for `Service`; the markup only makes the service entity and its provider explicit. Add it to a service page when the fields are real; skip it otherwise - nothing is lost. Never attach `aggregateRating` to it `[G]`.

```json
{
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": "https://www.example.com/services/<slug>#service",
  "name": "<FILL: Service name as buyers say it>",
  "serviceType": "<FILL: e.g. Web development>",
  "description": "<FILL: one sentence, same as the page's answer-first passage>",
  "provider": { "@id": "https://www.example.com/#org" },
  "areaServed": ["<FILL or delete: country>", "<FILL or delete: city>"],
  "url": "https://www.example.com/services/<slug>",
  "offers": {
    "@type": "Offer",
    "priceCurrency": "INR",
    "price": "<FILL or delete: starting price actually shown on the page>",
    "priceSpecification": {
      "@type": "PriceSpecification",
      "minPrice": "<FILL or delete>",
      "maxPrice": "<FILL or delete>",
      "priceCurrency": "INR"
    },
    "availability": "https://schema.org/InStock"
  },
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "<FILL or delete: What is included>",
    "itemListElement": [
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "<FILL: deliverable 1>" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "<FILL: deliverable 2>" } }
    ]
  }
}
```

Rules
- Prices in markup must appear in the visible text `[G]`; delete `offers` if the page shows no price.
- `areaServed` lists places you genuinely serve; it does not create local rankings `[CLAIM]` (service areas are "visual" only in Sterling Sky's small test centred on its own listing: [Sterling Sky, 2023](https://www.sterlingsky.ca/does-the-service-area-in-google-my-business-impact-ranking/)).
