# Image SEO: Google Images, Lens, Discover, Open Graph, Next.js

Last verified 2026-10-20. Tags: `[G]` Google docs or staff; `[DATA]` study with n; `[PROVEN]` several practitioners; `[CLAIM]` anecdote/vendor; `[WARNED]` demotion; `[INFERENCE]` this skill's reasoning. Framing first: `[G]` images do not lift web rankings (Mueller: "we don't really care if it's a gray square or ... a beach" [SER, 2021-10](https://www.seroundtable.com/google-web-search-images-32318.html); alt text "really helps ... for image search" [Infidigit, 2022-03](https://www.infidigit.com/news/alt-text-does-not-impact-web-search-rankings-says-google/)). Do image SEO for image search, Lens, Discover, shares, accessibility and page speed - not for web rankings.

## 1. Google's image best practices `[G]`

Source: [Google Images SEO, 2026-03](https://developers.google.com/search/docs/appearance/google-images)
- Images are indexed from `<img src>`, including inside `<picture>`. "Google doesn't index CSS images" - never deliver a content image as a CSS background.
- Responsive: `srcset` + `sizes` or `<picture>`, always with an `<img src>` fallback. Supported formats: BMP, GIF, JPEG, PNG, WebP, SVG, AVIF; the file extension must match the real type.
- Alt text is "the most important metadata": describe the image in page context ("Dalmatian puppy playing fetch"); keyword-stuffed alt "can be treated as spam"; inline SVG uses `<title>`.
- Filenames short and descriptive (not `IMG00023.jpg`), translated on localized pages; place images near the text they illustrate; captions are used; reference one image by the same URL everywhere.
- Preferred image per page: schema.org `primaryImageOfPage`, the image on `mainEntity` / `mainEntityOfPage`, or `og:image`; avoid logos, text-in-image and extreme aspect ratios (guidance added March 2026).
- Image sitemaps: only `<image:loc>` is used (<= 1,000 per URL); caption/title/geo/license tags deprecated in 2022; CDN-hosted images are fine when both domains are verified. [Image sitemaps, 2025-12](https://developers.google.com/search/docs/crawling-indexing/sitemaps/image-sitemaps)
- Lazy loading: `loading="lazy"` or IntersectionObserver is fine; never require scroll or click (Google does not interact); do not lazy-load above the fold; check the rendered `src` with URL Inspection. [Lazy loading, 2025-12](https://developers.google.com/search/docs/crawling-indexing/javascript/lazy-loading)
- Licensable images: `license`, `acquireLicensePage`, `creator`, `creditText`, `copyrightNotice` or IPTC -> "Licensable" badge in Google Images; structured data wins on conflict; only if you actually license images. [Image license metadata](https://developers.google.com/search/docs/appearance/structured-data/image-license-metadata)
- `max-image-preview:large` allows viewport-width previews in web search, Images and Discover. [Robots meta, 2026-03](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag)

## 2. Traffic reality - who benefits

- `[G]` Lens: "nearly 20 billion visual searches every month", 20% shopping-related. [Google, 2024-10](https://blog.google/products-and-platforms/products/shopping/visual-search-lens-shopping/) Claims above 25B are unverified. `[CLAIM]` Google Images ~10.62% of search share (Datos Q2 2025, second-hand). [Foursets](https://www.foursets.com/blog/google-search-statistics)
- `[DATA]` n = 1 site: image search was 64% of impressions but 11% of clicks (CTR 0.14% vs 0.78% web). [Suganthan, 2026-08](https://suganthan.com/blog/gsc-mcp-image-seo-tools/)
- `[PROVEN]` Image packs inside web results are reported as Web search type at the block's position -> inflated impressions and crushed CTR in GSC. [GSQi, 2020-10](https://www.gsqi.com/marketing-blog/image-pack-rankings-in-google-web-search/)
- `[G]` Search Console now splits Web into Text-based and Multimodal (Lens, Circle to Search, uploads, Chrome "Search this image"); Multimodal carries no query data. [Google, 2026-09](https://developers.google.com/search/blog/2026/09/web-multimodal-in-sc)
- `[G]` Lens product visibility comes through Merchant Center plus the image best practices - e-commerce territory; B2B service sites get little revenue from image search. [E-commerce on Google](https://developers.google.com/search/docs/specialty/ecommerce/where-ecommerce-data-can-appear-on-google)
- `[INFERENCE]` Priority by category: e-commerce, recipes/food, travel/hospitality, real estate, design portfolios = high; B2B services, SaaS, tools = low (do the hygiene, then stop).

## 3. Original photos vs stock vs AI

- `[G]` Mueller: "Original photos > AI photos > stock photos" - a preference, not a ranking update. [LinkedIn, 2023-12](https://www.linkedin.com/posts/johnmu_showerthought-ai-midjourney-activity-7146025394947764224-9psK) "Uniqueness isn't equivalent to higher quality". [SER, 2021-08](https://www.seroundtable.com/google-images-uniqueness-higher-quality-32053.html)
- `[DATA]` n = 10 new .co.uk sites over 3 months: original-image sites ranked better in ~80% of positions; tiny sample, no effect size. [Plagiarism Today, 2019-10](https://www.plagiarismtoday.com/2019/10/22/duplicate-images-and-google/)
- Bottom line: no stock penalty; originals matter for image search and as first-hand evidence on case studies, reviews and team pages (`[G]` fabricated creator imagery is deceptive - google-official.md section 2).

## 4. Discover, Open Graph, AI answers

- `[G]` Discover wants images >= 1200 px wide, > 300K pixels, 16:9; `max-image-preview:large` (or AMP); avoid logos and text-heavy images; treat Discover as supplemental traffic. [Discover, 2026-03](https://developers.google.com/search/docs/appearance/google-discover) `[DATA]` (self-reported) large previews: +30% CTR / +332% clicks over 6 months for one publisher, +79% CTR for a food blog. [Google case study, 2021-08](https://developers.google.com/search/case-studies/large-images-case-study)
- `[G]` AI Overviews / AI Mode: "no additional requirements... nor other special optimizations"; support text "with high-quality images". [AI features](https://developers.google.com/search/docs/appearance/ai-features) Related-article links in AI Mode are gaining "image thumbnails". [Google, 2026-10](https://blog.google/products-and-platforms/products/search/updates-ai-mode-overviews-explore-web/) `[CLAIM]` Thumbnails likely use the preferred-image signals above.
- `[INFERENCE]` Two images per page serve two audiences: an OG text card for social shares and a real 16:9 photo as `primaryImageOfPage` for Search/Discover. If you can only have one, make `og:image` a real photo.

## 5. Next.js `next/image` specifics `[OFFICIAL]` (vendor docs)

Source: [Next.js Image, 2026-09](https://nextjs.org/docs/app/api-reference/components/image); [opengraph-image, 2026-07](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image)
- `alt` is required (`alt=""` for decorative).
- `sizes` drives a width-based `srcset`; without it only 1x/2x are emitted -> always set `sizes` on responsive images.
- Default loading is lazy. Next 16 deprecated `priority` in favour of `preload`; the LCP image needs `loading="eager"` or `fetchPriority="high"`.
- WebP by default; AVIF opt-in (~20% smaller, slower encode); `qualities` defaults to `[75]`.
- `opengraph-image.(jpg|png|tsx)` emits `og:image` with width/height/alt.
- `/_next/image?url=...&w=...` creates width-specific URLs: keep the source path stable and use one component everywhere so each image keeps one canonical URL `[INFERENCE]`.
- Conflict to resolve `[INFERENCE]`: Next's examples render 1200x630 text cards, but Google advises against text images as the preferred image - point `primaryImageOfPage` at a real photo where Search/Discover matter.

## 6. Image SEO checklist (20 items)

1. Content images in `<img>` / `<picture>`, never CSS backgrounds. `[G]`
2. Contextual alt text, no stuffing; `alt=""` for decorative. `[G]`
3. Descriptive hyphenated filenames; extension matches type. `[G]`
4. Images beside the text they illustrate; captions where natural. `[G]`
5. `sizes` on every responsive `next/image` (or correct `srcset`/`sizes` elsewhere). `[OFFICIAL]`
6. WebP by default; AVIF if build cost allows. `[OFFICIAL]`
7. LCP image eager / `fetchPriority="high"`, never lazy. `[G]`
8. Native lazy-load the rest; no scroll-triggered JS loading. `[G]`
9. One stable URL per image. `[G]`
10. `max-image-preview:large` site-wide. `[G]`
11. A preferred image per page: 16:9, >= 1200 px, no text/logo (`primaryImageOfPage` or `og:image`). `[G]`
12. OG text cards for social; a real photo for Search. `[INFERENCE]`
13. Original screenshots/photos on case studies, reviews and team pages. `[G]` preference, `[DATA]` small
14. Image sitemap (`image:loc` only) for images not discoverable by crawl. `[G]`
15. Crawlable image paths; CDN domain verified in GSC. `[G]`
16. Inline SVG labelled with `<title>`. `[G]`
17. License metadata only if you license images. `[G]`
18. Check the rendered `src` with URL Inspection. `[G]`
19. Watch GSC Image and Multimodal search types separately. `[G]`
20. Remember image packs distort Web CTR when reading reports. `[PROVEN]`

## 7. Myths

- Alt text or images lift web rankings (image search only). `[G]`
- Stock photos are penalised (no). `[G]`
- Image sitemaps need captions/titles (deprecated 2022). `[G]`
- Lazy-load everything (never the LCP image). `[G]`
- Text OG cards are ideal for Google (avoid text as the preferred image). `[G]`
