# Phase 05: Dynamic Attribute Engine & Category-Attribute Matrix

---

## 1. Domain Overview & Problem Statement

### The Problem
Traditional e-commerce architectures often hardcode product fields as database columns (e.g., adding `size` and `color` columns). When new categories like **Skincare** (requiring *SPF, Volume, Skin Type*) or **Electronics** (requiring *Wattage, Connector Type, Voltage*) are introduced, developers are forced to alter database tables and change application code.

### The Solution: Dynamic Attribute Engine
We implement an **Entity-Attribute-Value (EAV) Specification Engine** that enables administrators to define arbitrary attributes and map them to specific categories:
1. **Attribute Definition**: Defines the specification name, data type, allowed options, measurement unit group, and behavioral flags.
2. **Category Mapping**: Attaches relevant attributes to specific categories, configuring whether each is required, its display section, and sort order.
3. **Product Values**: Stores the typed specification value for a product or variant without modifying database schema.

---

## 2. Supported Data Types & Unit Groups

| Attribute Data Type | Example Use Cases | Supported Input Control |
|---|---|---|
| `TEXT` | Model Number, Pattern, Fabric Composition | `TextInput` |
| `NUMBER` | Warranty Months, Battery Cells | `NumberInput` |
| `BOOLEAN` | Organic Certified, Water Resistant, Wireless | `Switch` |
| `SINGLE_SELECT` | Fit (Slim / Regular / Loose), Finish (Matte / Glossy) | `SelectInput` |
| `MULTI_SELECT` | Compatible Devices, Ingredients, Skin Concerns | `MultiSelect` |
| `MEASUREMENT` | Net Volume (ml/L), Weight (g/kg), Length (cm/inch) | `UOMInput` / `UOMMultiSelect` |
| `DATE` | Release Date, Vintage Year | `DatePicker` |

### Key Flags
- `isVariantAxis`: When `true`, this attribute can be selected during Step 5 of the Product Wizard to generate combinatorial variants (e.g., *Color*, *Size*).
- `isFilterable`: When `true`, this attribute automatically appears in storefront category sidebar faceted filters.
- `isSearchable`: Included in customer full-text search indexing.

---

## 3. Directory & Component Layout

```
src/
├── app/
│   ├── (admin)/
│   │   ├── attributes/
│   │   │   ├── page.tsx               # Server entry point
│   │   │   ├── AttributesClient.tsx   # Definitions DataTable with type badges & allowed options
│   │   │   └── form/
│   │   │       └── page.tsx           # 65% Form + 35% Live Customer Specification Table Preview
│   │   └── categories/
│   │       └── [id]/
│   │           └── attributes/
│   │               └── page.tsx       # Drag-and-drop category attribute mapper & group organizer
│   └── api/
│       └── admin/
│           ├── attributes/
│           │   ├── route.ts           # GET & POST attribute definitions
│           │   └── [id]/
│           │       └── route.ts       # GET, PUT, DELETE attribute definition
│           └── categories/
│               └── [id]/
│                   └── attributes/
│                       └── route.ts   # GET & PUT category attribute mappings
└── lib/
    └── validations/
        └── attribute.ts               # Zod schemas for attribute definitions and category mappings
```

---

## 4. UI/UX Specifications

### Attribute Definition Form (`/attributes/form`)
- **Left Panel (65%)**:
  - Name (e.g., "Liquid Volume") & unique code (`vol_ml`).
  - Data Type selector (`TEXT`, `NUMBER`, `BOOLEAN`, `SINGLE_SELECT`, `MULTI_SELECT`, `MEASUREMENT`).
  - If `SINGLE_SELECT` or `MULTI_SELECT`: Tag-based chip creator to add allowed options (e.g., `S`, `M`, `L`, `XL`, `XXL`).
  - If `MEASUREMENT`: Unit group selector (Length, Weight, Volume, Area, Power) using our existing `UOMMultiSelect`.
  - Flags: `Can define product variants?` (Toggle), `Show in faceted filters?` (Toggle), `Searchable?` (Toggle).
- **Right Panel (35% Live Preview)**:
  - Renders a live "Product Specifications Table" showing how this attribute will look to customers on the storefront product page.
