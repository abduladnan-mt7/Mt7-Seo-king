# BreadcrumbList

`[G]` Breadcrumb is a listed rich-result feature (gallery, 2026-10-16). The markup must mirror a visible breadcrumb trail on the page and the site's real hierarchy - which is also the "clearly defined, browseable hierarchy" the doorway policy asks for `[G]`.

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.example.com/" },
    { "@type": "ListItem", "position": 2, "name": "<FILL: Section, e.g. Services>", "item": "https://www.example.com/services" },
    { "@type": "ListItem", "position": 3, "name": "<FILL: Page name>", "item": "https://www.example.com/services/<slug>" }
  ]
}
```

Rules
- The last item may omit `item` (current page) but including the canonical URL is fine.
- Names are human labels, not keyword strings.
- Generate it from the real route tree so it cannot drift from the visible trail `[INFERENCE]`.
