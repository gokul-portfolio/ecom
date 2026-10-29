# Phase 04: Brands & Manufacturers Management

---

## 1. Domain Overview & Distinction

In professional retail and e-commerce, **Brand** and **Manufacturer** represent distinct legal and business entities:
- **Brand**: The public-facing customer trademark (e.g., *Nike*, *Apple*, *Nestlé*, *Lakmé*). Customers search, filter, and identify products by brand.
- **Manufacturer**: The registered production or assembly facility (e.g., *Foxconn India Pvt Ltd*, *Hindustan Unilever Ltd*). Required for compliance, legal metrology, warranty service, and vendor procurement.

Products must reference both independently:
```prisma
Product {
  brandId        String? -> references Brand
  manufacturerId String? -> references Manufacturer
}
```

---

## 2. Directory & Component Layout

```
src/
├── app/
│   ├── (admin)/
│   │   ├── brands/
│   │   │   ├── page.tsx               # Server entry point
│   │   │   ├── BrandsClient.tsx       # DataTable with brand logo thumbnails & search
│   │   │   └── form/
│   │   │       └── page.tsx           # 65% Form + 35% Live Brand Badge Preview
│   │   └── manufacturers/
│   │       ├── page.tsx               # Server entry point
│   │       ├── ManufacturersClient.tsx# DataTable with compliance IDs & contact info
│   │       └── form/
│   │           └── page.tsx           # 65% Form + 35% Live Compliance Card
│   └── api/
│       └── admin/
│           ├── brands/
│           │   ├── route.ts           # GET & POST
│           │   └── [id]/
│           │       └── route.ts       # GET, PUT, DELETE
│           └── manufacturers/
│               ├── route.ts           # GET & POST
│               └── [id]/
│                   └── route.ts       # GET, PUT, DELETE
└── lib/
    └── validations/
        ├── brand.ts                   # Zod schemas: brandSchema, brandUpdateSchema
        └── manufacturer.ts            # Zod schemas: manufacturerSchema, manufacturerUpdateSchema
```

---

## 3. UI/UX Specifications

### A. Brands Management (`/brands`)
- **Table Columns**:
  - Logo (circle image with fallback initials).
  - Brand Name & Sequential Code (`BRD001`).
  - Website link (opens in new tab with external icon).
  - Country of Origin.
  - Active Products Count (`_count.products`).
  - Status switch & actions (View, Edit, Delete).
- **Form Layout (65% / 35%)**:
  - Logo upload via `ImageUpload` (PNG/SVG with transparency support).
  - Brand Name with auto-slug generator.
  - Official Website URL & Country selection.
  - SEO Meta Title & Meta Description.
  - **Live Preview Panel**: Shows a rendered Storefront Brand Card with logo, website, and active merchandise badge.

### B. Manufacturers Management (`/manufacturers`)
- **Table Columns**:
  - Company Registered Name & Code (`MNF001`).
  - Registration / CIN Number.
  - Support Email & Phone.
  - Country of Origin.
  - Linked Products Count.
- **Form Layout**:
  - Legal business name, business registration number, primary point of contact, postal address.
