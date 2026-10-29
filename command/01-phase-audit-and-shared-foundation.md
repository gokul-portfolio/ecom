# Phase 01: Architecture Audit, Shared Component Inventory & Foundation

---

## 1. Codebase Audit & Inspection Findings

### A. Existing Architecture
The existing codebase is structured cleanly around the Next.js App Router with separated concerns:
- **Server Actions & API Routes**: Under `src/app/api/admin/[module]/route.ts` and `[id]/route.ts`.
- **Admin Views**: Under `src/app/(admin)/[module]/page.tsx` (server entry) and `[Module]Client.tsx` (client container).
- **Forms**: Under `src/app/(admin)/[module]/form/page.tsx` adhering to the **65% Form + 35% Live Preview Panel** standard.
- **Validation**: Centralized in `src/lib/validations/[module].ts` using Zod schemas with `.safeParse()`.
- **Database Access**: Single-instance Prisma Client exported from `src/lib/prisma.ts`.
- **Real-Time Sync**: Node Socket.io server integrated via `src/lib/socket-notify.ts` and `src/components/providers/SocketProvider.tsx`.

### B. Crucial Entity Distinction
> **Critical Rule**: Departments and Product Categories are completely different business domains and must NOT be coupled.
> - **Department**: Organizational hierarchy for internal staff, payroll, shift scheduling, and role assignments (`EXECUTIVE`, `FINANCE`, `OPERATIONS`).
> - **Product Category**: Customer-facing taxonomic classification for merchandise (`Apparel > Men's Wear > Shirts`, `Electronics > Audio > Headphones`).

---

## 2. Reusable Component Inventory

The project already contains an enterprise suite of components ready to be reused directly:

| Component | Path | Use in Product Catalog |
|---|---|---|
| `DataTable` | `src/components/ui/table/DataTable.tsx` | Products, Categories, Brands, Warehouses, and Inventory Ledger tables |
| `Pagination` | `src/components/ui/table/Pagination.tsx` | Auto-hiding pagination with page size controls |
| `ImageUpload` | `src/components/ui/form/ImageUpload.tsx` | Brand logos, Category icons, Product thumbnails |
| `UOMInput` | `src/components/ui/form/UOMInput.tsx` | Weight, Dimensions, Volume, Storage measurements with unit conversion |
| `UOMMultiSelect` | `src/components/ui/form/UOMMultiSelect.tsx` | Multi-select units of measure for dynamic attribute definitions |
| `SelectInput` | `src/components/ui/form/SelectInput.tsx` | Single-select dropdowns with keyboard search and filtering |
| `SearchableSelect`| `src/components/ui/form/SearchableSelect.tsx` | Large options sets (Brands, Parent Categories, Tax Slabs, Warehouses) |
| `Switch` | `src/components/ui/form/Switch.tsx` | Active/Inactive toggles, Tax Inclusive flags, Variant defining flags |
| `SlugInput` | `src/components/ui/form/SlugInput.tsx` | Auto-slug generation from names with manual override |
| `Modal` & `DeleteConfirmDialog` | `src/components/ui/modal/` | Safe deletion dialogs with dependency warning displays |
| `useServerTable` | `src/hooks/useServerTable.ts` | Server-driven pagination, sorting, search, and URL param synchronization |
| `useKeyboardNavigation` | `src/hooks/useKeyboardNavigation.ts` | Form field traversal (<kbd>Enter</kbd>, <kbd>↑</kbd> <kbd>↓</kbd>), <kbd>Ctrl+S</kbd> save |

---

## 3. Identified Architectural Gaps & Required Foundations

1. **Catalog & Inventory Navigation Groups**:
   - `src/config/navigation.ts` currently only has `Overview` and `Organization & Access`.
   - Must add `Catalog Management` (Products, Categories, Brands, Attributes) and `Inventory & Warehouses` (Inventory, Warehouses, Stock Ledger).

2. **Granular Permissions Matrix**:
   - `src/config/permissions.ts` must be extended with:
     - `catalog:read`, `catalog:write`, `catalog:delete`
     - `categories:read`, `categories:write`, `categories:delete`
     - `brands:read`, `brands:write`
     - `attributes:read`, `attributes:write`
     - `inventory:read`, `inventory:write`, `inventory:adjust`, `inventory:transfer`

3. **Backend Cloudinary Signature Endpoint**:
   - Cloudinary credentials must NEVER be sent to the browser.
   - An authenticated signing endpoint `POST /api/admin/media/sign` must be established to sign client uploads safely.

4. **Tax Classes & Configuration**:
   - A centralized Tax Class table supporting standard GST rates (0%, 5%, 12%, 18%, 28%) with HSN/SAC code tracking.
