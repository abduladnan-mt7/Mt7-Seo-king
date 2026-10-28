# Product + Offer (e-commerce product page)

`[G]` Product snippets and merchant listings are listed features. Required for merchant listings: `name`, `image`, `offers` with `price`, `priceCurrency`, `availability`; recommended `sku`, `gtin`/`mpn`, `brand`, `description`, `shippingDetails`, `hasMerchantReturnPolicy`. Reviews on a product you sell but did not make can be eligible for stars; reviews of your own brand/company are self-serving `[G]`. Everything must match the visible page and, if used, Merchant Center data `[G]`.

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "@id": "https://www.example.com/products/<slug>#product",
  "name": "<FILL: Product name as shown>",
  "image": [
    "https://www.example.com/images/<slug>-1x1.jpg",
    "https://www.example.com/images/<slug>-4x3.jpg",
    "https://www.example.com/images/<slug>-16x9.jpg"
  ],
  "description": "<FILL: unique description, not the manufacturer's boilerplate>",
  "sku": "<FILL>",
  "gtin13": "<FILL or delete>",
  "mpn": "<FILL or delete>",
  "brand": { "@type": "Brand", "name": "<FILL: Brand of the product>" },
  "offers": {
    "@type": "Offer",
    "url": "https://www.example.com/products/<slug>",
    "price": "<FILL: 1999.00>",
    "priceCurrency": "INR",
    "priceValidUntil": "<FILL or delete: 2026-12-31>",
    "availability": "https://schema.org/InStock",
    "itemCondition": "https://schema.org/NewCondition",
    "seller": { "@id": "https://www.example.com/#org" },
    "shippingDetails": {
      "@type": "OfferShippingDetails",
      "shippingRate": { "@type": "MonetaryAmount", "value": "<FILL: 0>", "currency": "INR" },
      "shippingDestination": { "@type": "DefinedRegion", "addressCountry": "IN" },
      "deliveryTime": {
        "@type": "ShippingDeliveryTime",
        "handlingTime": { "@type": "QuantitativeValue", "minValue": 0, "maxValue": 1, "unitCode": "DAY" },
        "transitTime": { "@type": "QuantitativeValue", "minValue": 2, "maxValue": 7, "unitCode": "DAY" }
      }
    },
    "hasMerchantReturnPolicy": {
      "@type": "MerchantReturnPolicy",
      "applicableCountry": "IN",
      "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
      "merchantReturnDays": "<FILL: 7>",
      "returnMethod": "https://schema.org/ReturnByMail",
      "returnFees": "https://schema.org/FreeReturn"
    }
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "<FILL only from genuine buyer reviews of THIS product shown on the page, else delete the whole block>",
    "reviewCount": "<FILL>"
  }
}
```

Rules
- Variants: one Product per canonical variant page, or `ProductGroup` with `hasVariant` on the parent `[G]` (check the current docs for `ProductGroup` support in your market).
- Out of stock: change `availability`, never delete the page `[INFERENCE]`.
- Price shown and marked up must be the same number, same currency `[G]`.
