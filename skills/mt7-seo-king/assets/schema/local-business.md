# LocalBusiness / ProfessionalService (physical location only)

Source `[G]`: [Local business structured data, 2026-09-08](https://developers.google.com/search/docs/appearance/structured-data/local-business). Required: `name` and a physical `address`. Use the most specific subtype that is true (`ProfessionalService`, `Dentist`, `Hotel`, `Restaurant`, `MedicalClinic`, `Store`...). Gate `[G]`: the address must be a real, staffed place where customers can come; a virtual office, a mailbox, or an unstaffed registered address disqualifies the page from this type - use `organization.md` instead. The address, phone and name must match the Google Business Profile exactly `[DATA]` (NAP mismatch is a ranking negative).

```json
{
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "@id": "https://www.example.com/locations/<city>#local",
  "name": "<FILL: Brand - exactly as on GBP, no keywords>",
  "parentOrganization": { "@id": "https://www.example.com/#org" },
  "url": "https://www.example.com/locations/<city>",
  "image": "https://www.example.com/images/<city>-office.jpg",
  "telephone": "<FILL: +91-XXXXXXXXXX - the GBP number>",
  "email": "<FILL or delete>",
  "priceRange": "<FILL or delete: e.g. INR 50000 - INR 500000>",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "<FILL: exactly as on GBP>",
    "addressLocality": "<FILL: City>",
    "addressRegion": "<FILL: State>",
    "postalCode": "<FILL>",
    "addressCountry": "IN"
  },
  "geo": { "@type": "GeoCoordinates", "latitude": "<FILL>", "longitude": "<FILL>" },
  "openingHoursSpecification": [{
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    "opens": "10:00",
    "closes": "18:00"
  }],
  "areaServed": ["<FILL or delete: City>", "<FILL or delete: nearby areas you genuinely serve>"],
  "hasMap": "<FILL or delete: Google Maps share URL>",
  "sameAs": ["<FILL or delete: GBP share link>"]
}
```

Rules
- No `aggregateRating` / `review` - self-serving, ineligible `[G]`.
- Service-area business with a hidden address: `[G]` GBP hides it; on the site you may still state the base city; `[INFERENCE]` keep `address` at locality level only if you do not want the street published, or use `Organization` with `areaServed` instead of `LocalBusiness`.
- One LocalBusiness node per real location, on that location's page, never one per target city `[G]` doorway.
