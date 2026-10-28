# Article (with a real author)

`[G]` Article is a listed feature. The `author` must be a real person or the organization; `[G]` fabricated creator profiles are deceptive (Creating helpful content, 2026-10-05). `dateModified` changes only with a substantive update - date-bumping is a warning sign `[G]`. Use `BlogPosting` for blog posts, `NewsArticle` only for news, `Article` for case studies and guides.

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "@id": "https://www.example.com/blog/<slug>#article",
  "mainEntityOfPage": "https://www.example.com/blog/<slug>",
  "headline": "<FILL: the visible h1, max ~110 chars>",
  "description": "<FILL: one-sentence summary>",
  "image": [
    "https://www.example.com/images/<slug>-16x9.jpg",
    "https://www.example.com/images/<slug>-4x3.jpg",
    "https://www.example.com/images/<slug>-1x1.jpg"
  ],
  "datePublished": "<FILL: 2026-10-20T09:00:00+05:30>",
  "dateModified": "<FILL: same as published until a real update>",
  "author": [{
    "@type": "Person",
    "name": "<FILL: Real full name>",
    "jobTitle": "<FILL: role>",
    "url": "https://www.example.com/about#<person-slug>",
    "sameAs": ["https://www.linkedin.com/in/<FILL>"]
  }],
  "publisher": { "@id": "https://www.example.com/#org" },
  "inLanguage": "en",
  "about": ["<FILL or delete: topic>"],
  "isAccessibleForFree": true
}
```

Rules
- `image`: real images, >= 1200 px wide, provided in 16:9, 4:3 and 1:1 when possible `[G]`; no text cards as the main image for Search/Discover `[G]`.
- For a case study, `author` = the people who did the work; `about` can name the client organization only with permission `[INFERENCE]`.
- An author page for each recurring author (ProfilePage is a listed feature) strengthens the person entity `[G]` `[INFERENCE]`.
