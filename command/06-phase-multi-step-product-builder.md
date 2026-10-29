# Phase 06: Multi-Step Product Builder (Steps 1 to 4)

---

## 1. Domain Overview & Wizard Architecture

Creating and maintaining complex e-commerce merchandise requires balancing dozens of parameters: marketing descriptions, pricing tiers, GST tax slabs, barcodes, stock policies, media galleries, variant options, and SEO metadata.

To prevent cognitive overload, we implement a **6-Step Interactive Wizard** following our **65% Form + 35% Live Storefront Card Preview** standard.

### Stepper Overview
1. **Step 1: General Details & Categorization** (Title, Rich Description, Type, Category Tree, Brand, Manufacturer, Status).
2. **Step 2: Pricing, Cost & Taxation** (Base Price, Compare-at Price, Cost per Item, Tax Inclusion, GST Class).
3. **Step 3: Inventory Tracking & Identifiers** (SKU, Barcode/GTIN, Default Warehouse, Low-Stock Alert Threshold).
4. **Step 4: Media Gallery & Assets** (Multiple Cloudinary Uploads, Drag-and-Drop Reordering, Primary Thumbnail).
5. **Step 5: Dynamic Attributes & Variant Matrix** (Addressed in Phase 07).
6. **Step 6: SEO Preview & Publishing Checklist** (Addressed in Phase 10).

---

## 2. Directory & Component Layout

```
src/
├── app/
│   ├── (admin)/
│   │   └── products/
│   │       ├── page.tsx               # Server entry point (Product Catalog DataTable)
│   │       ├── ProductsClient.tsx     # Client DataTable with thumbnails, stock status badges & quick actions
│   │       └── form/
│   │           ├── page.tsx           # Multi-step Product Wizard master container
│   │           └── components/
│   │               ├── Step1General.tsx
│   │               ├── Step2Pricing.tsx
│   │               ├── Step3Inventory.tsx
│   │               ├── Step4Media.tsx
│   │               ├── Step5Variants.tsx
│   │               ├── Step6SEO.tsx
│   │               └── ProductLivePreview.tsx # 35% Sticky Interactive Storefront Product Card
│   └── api/
│       └── admin/
│           ├── products/
│           │   ├── route.ts           # GET (paginated catalog) & POST (create draft/published)
│           │   └── [id]/
│           │       └── route.ts       # GET, PUT, DELETE
│           └── tax-classes/
│               └── route.ts           # GET tax classes (GST 0%, 5%, 12%, 18%)
└── lib/
    └── validations/
        └── product.ts                 # Comprehensive Zod schema with step-by-step partial validators
```

---

## 3. Step Breakdown & Implementation Specifics

### Step 1: General Details
- **Product Title**: Minimum 3 characters, max 200.
- **Slug**: Real-time auto-generated from title using `SlugInput` with manual override and uniqueness check.
- **Rich Text Description**: Clean editor with bold, italic, bullet lists, tables, and links. Output sanitized via DOMPurify before saving.
- **Product Type**: `PHYSICAL` (requires shipping/inventory) or `DIGITAL` (downloadable file/license key).
- **Category Tree Selector**: Multi-category selection with primary category designation.
- **Brand & Manufacturer**: Searchable dropdown selectors.

### Step 2: Pricing & Taxation
- **Base / Regular Price (₹)**: Selling price of the item.
- **Compare-at Price (₹)**: Optional strikethrough original price (must be $\ge$ Base Price).
- **Cost per Item (₹)**: Internal metric to calculate profit margin and gross margin percentage in real-time.
- **Tax Classification**:
  - `Tax-Inclusive Pricing` toggle (Customer price includes tax).
  - Configurable Tax Class dropdown:
    - *Exempt (0%)* — Agricultural goods, raw produce.
    - *Reduced GST (5%)* — Packaged food, apparel under ₹1000.
    - *Standard GST (12%)* — Processed food, standard goods.
    - *Standard GST (18%)* — Electronics, cosmetics, personal care.
    - *Luxury GST (28%)* — High-end appliances, luxury automobiles.
  - HSN / SAC Code input for tax compliance.

### Step 3: Inventory & Identifiers
- **Master SKU**: Auto-generated sequential candidate (`PRD-APP-001`) with configurable prefixes.
- **Barcode / GTIN**: Supports EAN-13, UPC-A, or ISBN with format verification.
- **Inventory Tracking Policy**: `TRACKED` (stock decrements on order) vs `NOT_TRACKED`.
- **Low Stock Threshold**: Warning trigger level (Default: 5 units).

### Step 4: Media Gallery
- Multiple image upload via Cloudinary CDN.
- Drag-and-drop sortable thumbnail grid to adjust storefront display order.
- "Set as Primary Thumbnail" star button.
- Alt text input per image for accessibility and SEO image search ranking.
- Orphan asset cleanup when images are removed.
