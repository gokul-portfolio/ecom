# Universal E-Commerce Product Catalog & Inventory Management System
## Master Architecture & Phase Implementation Roadmap

---

## 1. System Vision & Objective

The objective of this system is to build an **Enterprise-Grade, Dynamic, Universal Product Catalog and Inventory Management Architecture** capable of supporting any current and future product category—including **Apparel, Footwear, Skincare, Cosmetics, Packaged Food & Grocery, Consumer Electronics, Furniture, Home Decor, and Digital Goods**—without requiring code changes or database schema modifications whenever a new category or attribute is introduced.

### Architectural Core Principles
1. **Dynamic Category Tree**: Arbitrary nesting depth with safe parent-child cycle prevention, slug generation, breadcrumbs, and category-level SEO.
2. **Dynamic EAV-Style Attribute Engine**: Strongly-typed attribute definitions (Text, Number, Boolean, Single-Select, Multi-Select, Measurement Units) mapped to categories with filterable, searchable, and variant-defining flags.
3. **Multi-Step Product Wizard**: A 6-step interactive product creation and editing wizard adhering to the established 65% form / 35% live preview standard.
4. **Cartesian Product Variant Matrix**: Automatic combinatorial generation of variants (e.g., Color $\times$ Size), editable matrix, individual SKU/Barcode generation, variant-level image mapping, and stock assignments.
5. **Auditable Concurrency-Safe Inventory**: Warehouse and storage location tracking, stock formulas ($Available = On\_Hand - Reserved$), atomic database transactions, compensating movement ledgers, and real-time Socket.IO low-stock alerts.
6. **SEO-First Storefront**: Server-rendered product and category pages, BreadcrumbList structured data, Product & Offer JSON-LD schema, canonical URLs, 301 slug redirect history, and XML sitemaps.

---

## 2. Phase-by-Phase Roadmap Index

| Phase | File | Focus Area | Deliverables |
|---|---|---|---|
| **Phase 01** | `01-phase-audit-and-shared-foundation.md` | Architecture Audit & Reusable Assets | Component audit, gaps, navigation config, shared tokens |
| **Phase 02** | `02-phase-database-schema-and-api-contracts.md` | Database Schema & REST Contracts | Complete Prisma schema models, compound indexes, REST endpoints |
| **Phase 03** | `03-phase-universal-category-management.md` | Category Tree Management | Tree UI, cycle detection, slug/breadcrumbs, Cloudinary assets |
| **Phase 04** | `04-phase-brands-and-manufacturers.md` | Brands & Manufacturers | Independent CRUD, logos, origin country, SEO metadata |
| **Phase 05** | `05-phase-dynamic-attribute-engine.md` | Dynamic Attribute Engine | Attribute definitions, units, category mappings, variant axes |
| **Phase 06** | `06-phase-multi-step-product-builder.md` | Product Builder (Steps 1–4) | 6-Step wizard: General, Pricing & GST, Inventory, Media gallery |
| **Phase 07** | `07-phase-dynamic-variant-cartesian-matrix.md` | Variant Engine (Step 5) | Cartesian generator, matrix table, per-variant SKU/barcode/stock |
| **Phase 08** | `08-phase-cloudinary-media-security.md` | Cloudinary Media Security | Backend signing endpoint, direct client upload, variant linking |
| **Phase 09** | `09-phase-inventory-warehouse-and-ledger.md` | Inventory & Movement Ledger | Warehouses, atomic ledger, low-stock alerts, audit logging |
| **Phase 10** | `10-phase-seo-storefront-structured-data-and-testing.md` | SEO & Storefront | JSON-LD schema, breadcrumbs, sitemap, automated test suite |

---

## 3. Technology Stack Alignment

- **Runtime & Framework**: Next.js 16 (App Router, Turbopack, React 19, TypeScript).
- **Database & ORM**: PostgreSQL with Prisma ORM (v6).
- **Validation**: Zod schema validation (`src/lib/validations/`).
- **Real-Time Notifications**: Socket.IO server (`broadcastSocketEvent`).
- **Media CDN**: Cloudinary with backend cryptographic signature generation.
- **Styling**: Tailwind CSS with custom glassmorphism design tokens and dark mode support.
- **Navigation & Shortcuts**: Unified keyboard navigation (<kbd>Ctrl+S</kbd>, <kbd>Esc</kbd>, <kbd>Enter</kbd> traversal).
