# Phase 02: Database Schema & REST API Contracts

---

## 1. Complete Prisma Database Models (`prisma/schema.prisma`)

```prisma
// =================================================================
// 6. PRODUCT CATALOG TAXONOMY (CATEGORIES, BRANDS & MANUFACTURERS)
// =================================================================

model Category {
  id              String      @id @default(uuid())
  code            String      @unique // e.g. "CAT001"
  name            String      // e.g. "Casual Shirts"
  slug            String      @unique // e.g. "casual-shirts"
  description     String?
  level           Int         @default(0) // Root = 0, Child = 1, Grandchild = 2
  sortOrder       Int         @default(0)
  isActive        Boolean     @default(true)

  // Media Assets (Cloudinary)
  iconUrl         String?
  iconPublicId    String?
  bannerUrl       String?
  bannerPublicId  String?

  // SEO Metadata
  metaTitle       String?
  metaDescription String?
  canonicalUrl    String?

  // Self-referencing Parent-Child Hierarchy
  parentId        String?
  parent          Category?   @relation("CategoryHierarchy", fields: [parentId], references: [id], onDelete: Restrict)
  children        Category[]  @relation("CategoryHierarchy")

  // Relationships
  categoryAttributes CategoryAttribute[]
  productCategories  ProductCategory[]

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@index([slug])
  @@index([parentId])
  @@index([isActive])
}

model Brand {
  id              String      @id @default(uuid())
  code            String      @unique // e.g. "BRD001"
  name            String      @unique // e.g. "Nike", "Sony"
  slug            String      @unique // e.g. "nike", "sony"
  description     String?
  website         String?
  countryOfOrigin String?     @default("India")
  isActive        Boolean     @default(true)

  // Media Assets
  logoUrl         String?
  logoPublicId    String?

  // SEO Metadata
  metaTitle       String?
  metaDescription String?

  products        Product[]

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@index([slug])
  @@index([isActive])
}

model Manufacturer {
  id              String      @id @default(uuid())
  code            String      @unique // e.g. "MNF001"
  companyName     String
  registrationNo  String?     // CIN / Business registration
  email           String?
  phone           String?
  address         String?
  countryOfOrigin String?     @default("India")
  isActive        Boolean     @default(true)

  products        Product[]

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@index([companyName])
}

// =================================================================
// 7. DYNAMIC ATTRIBUTE ENGINE (EAV METRIC SPECIFICATIONS)
// =================================================================

enum AttributeDataType {
  TEXT
  NUMBER
  BOOLEAN
  SINGLE_SELECT
  MULTI_SELECT
  MEASUREMENT
  DATE
}

model AttributeDefinition {
  id              String             @id @default(uuid())
  code            String             @unique // e.g. "apparel_size", "spf_rating", "processor"
  name            String             // e.g. "Size", "SPF Rating", "Processor Model"
  dataType        AttributeDataType  @default(TEXT)
  allowedOptions  Json?              // e.g. ["XS", "S", "M", "L", "XL"] for select types
  unitGroup       String?            // e.g. "LENGTH", "WEIGHT", "VOLUME", "POWER"
  defaultUnit     String?            // e.g. "cm", "kg", "ml", "W"
  isFilterable    Boolean            @default(true)
  isSearchable    Boolean            @default(false)
  isVariantAxis   Boolean            @default(false) // Used to define variants
  isActive        Boolean            @default(true)

  categoryMappings CategoryAttribute[]
  attributeValues  ProductAttributeValue[]

  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt

  @@index([code])
}

model CategoryAttribute {
  id                  String              @id @default(uuid())
  categoryId          String
  category            Category            @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  attributeId         String
  attributeDefinition AttributeDefinition @relation(fields: [attributeId], references: [id], onDelete: Cascade)
  
  isRequired          Boolean             @default(false)
  displayGroup        String?             @default("General Specifications")
  sortOrder           Int                 @default(0)

  createdAt           DateTime            @default(now())
  updatedAt           DateTime            @updatedAt

  @@unique([categoryId, attributeId])
}

// =================================================================
// 8. PRODUCTS, MEDIA & CARTESIAN VARIANTS
// =================================================================

enum ProductType {
  PHYSICAL
  DIGITAL
  SERVICE
}

enum ProductStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

model TaxClass {
  id          String    @id @default(uuid())
  name        String    // e.g. "Standard GST 18%", "Reduced GST 5%"
  code        String    @unique // e.g. "GST_18"
  rate        Float     // e.g. 18.0
  hsnCode     String?   // Harmonized System of Nomenclature
  isDefault   Boolean   @default(false)
  isActive    Boolean   @default(true)

  products    Product[]

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Product {
  id                String        @id @default(uuid())
  code              String        @unique // e.g. "PRD001"
  title             String
  slug              String        @unique
  shortDescription  String?
  description       String?       // Rich text sanitized HTML
  productType       ProductType   @default(PHYSICAL)
  status            ProductStatus @default(DRAFT)
  publishedAt       DateTime?

  // Pricing & Taxation
  basePrice         Float
  compareAtPrice    Float?
  costPrice         Float?
  isTaxInclusive    Boolean       @default(true)
  taxClassId        String?
  taxClass          TaxClass?     @relation(fields: [taxClassId], references: [id], onDelete: SetNull)

  // Reference Relations
  brandId           String?
  brand             Brand?        @relation(fields: [brandId], references: [id], onDelete: SetNull)
  manufacturerId    String?
  manufacturer      Manufacturer? @relation(fields: [manufacturerId], references: [id], onDelete: SetNull)

  // SEO Metadata
  metaTitle         String?
  metaDescription   String?
  canonicalUrl      String?

  // Collections
  categories        ProductCategory[]
  variants          ProductVariant[]
  media             ProductMedia[]
  attributeValues   ProductAttributeValue[]

  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  @@index([slug])
  @@index([status])
  @@index([brandId])
}

model ProductCategory {
  id         String   @id @default(uuid())
  productId  String
  product    Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  categoryId String
  category   Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  isPrimary  Boolean  @default(false)

  @@unique([productId, categoryId])
}

model ProductVariant {
  id             String          @id @default(uuid())
  productId      String
  product        Product         @relation(fields: [productId], references: [id], onDelete: Cascade)
  sku            String          @unique
  barcode        String?         @unique // EAN-13, UPC-A, GTIN
  title          String          // e.g. "Red / XL"
  optionValues   Json            // e.g. {"color": "Red", "size": "XL"}

  // Pricing Overrides
  price          Float
  compareAtPrice Float?
  costPrice      Float?

  // Weight & Logistics
  weight         Float?
  weightUnit     String?         @default("kg")
  
  isDefault      Boolean         @default(false)
  isActive       Boolean         @default(true)

  media          ProductMedia[]
  attributeValues ProductAttributeValue[]
  inventoryBalances InventoryBalance[]
  stockMovements    StockMovement[]
  lowStockAlerts    LowStockAlert[]

  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  @@index([sku])
  @@index([barcode])
  @@index([productId])
}

model ProductMedia {
  id          String          @id @default(uuid())
  productId   String
  product     Product         @relation(fields: [productId], references: [id], onDelete: Cascade)
  variantId   String?
  variant     ProductVariant? @relation(fields: [variantId], references: [id], onDelete: SetNull)

  url         String          // Cloudinary secure_url
  publicId    String          // Cloudinary public_id
  altText     String?
  sortOrder   Int             @default(0)
  isThumbnail Boolean         @default(false)

  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  @@index([productId])
  @@index([variantId])
}

model ProductAttributeValue {
  id                  String              @id @default(uuid())
  productId           String
  product             Product             @relation(fields: [productId], references: [id], onDelete: Cascade)
  variantId           String?
  variant             ProductVariant?     @relation(fields: [variantId], references: [id], onDelete: Cascade)
  attributeId         String
  attributeDefinition AttributeDefinition @relation(fields: [attributeId], references: [id], onDelete: Cascade)

  textValue           String?
  numValue            Float?
  boolValue           Boolean?
  jsonValue           Json?
  unit                String?

  createdAt           DateTime            @default(now())
  updatedAt           DateTime            @updatedAt

  @@index([productId])
  @@index([attributeId])
}

// =================================================================
// 9. INVENTORY, WAREHOUSES & AUDITABLE LEDGER
// =================================================================

model Warehouse {
  id          String             @id @default(uuid())
  code        String             @unique // e.g. "WH-BLR-01"
  name        String             // e.g. "Bengaluru Central Fulfillment"
  address     String?
  city        String?
  state       String?
  country     String             @default("India")
  pincode     String?
  contactPhone String?
  isActive    Boolean            @default(true)

  inventoryBalances InventoryBalance[]
  stockMovementsFrom StockMovement[]   @relation("WarehouseMovementsFrom")
  stockMovementsTo   StockMovement[]   @relation("WarehouseMovementsTo")
  lowStockAlerts    LowStockAlert[]

  createdAt   DateTime           @default(now())
  updatedAt   DateTime           @updatedAt
}

model InventoryBalance {
  id          String         @id @default(uuid())
  warehouseId String
  warehouse   Warehouse      @relation(fields: [warehouseId], references: [id], onDelete: Cascade)
  variantId   String
  variant     ProductVariant @relation(fields: [variantId], references: [id], onDelete: Cascade)

  onHand      Int            @default(0)
  reserved    Int            @default(0)
  available   Int            @default(0) // Generated: onHand - reserved
  lowStockThreshold Int      @default(5)

  updatedAt   DateTime       @updatedAt

  @@unique([warehouseId, variantId])
  @@index([variantId])
}

enum StockMovementType {
  PURCHASE_RECEIPT
  SALE_DEDUCTION
  ORDER_RESERVED
  ORDER_RELEASED
  CUSTOMER_RETURN
  DAMAGED_WRITE_OFF
  EXPIRY_DISPOSAL
  MANUAL_AUDIT_CORRECTION
  WAREHOUSE_TRANSFER
}

model StockMovement {
  id              String            @id @default(uuid())
  variantId       String
  variant         ProductVariant    @relation(fields: [variantId], references: [id], onDelete: Cascade)
  
  fromWarehouseId String?
  fromWarehouse   Warehouse?        @relation("WarehouseMovementsFrom", fields: [fromWarehouseId], references: [id])
  toWarehouseId   String?
  toWarehouse     Warehouse?        @relation("WarehouseMovementsTo", fields: [toWarehouseId], references: [id])

  type            StockMovementType
  quantity        Int               // Positive or negative delta
  resultingOnHand Int
  reason          String?
  referenceNumber String?           // e.g. Order #, PO #, RMA #
  actorId         String?           // Staff ID who performed action

  createdAt       DateTime          @default(now())

  @@index([variantId])
  @@index([createdAt])
}

model LowStockAlert {
  id              String         @id @default(uuid())
  variantId       String
  variant         ProductVariant @relation(fields: [variantId], references: [id], onDelete: Cascade)
  warehouseId     String
  warehouse       Warehouse      @relation(fields: [warehouseId], references: [id], onDelete: Cascade)

  currentStock    Int
  threshold       Int
  isAcknowledged  Boolean        @default(false)
  acknowledgedAt  DateTime?
  acknowledgedById String?

  createdAt       DateTime       @default(now())

  @@index([variantId])
  @@index([isAcknowledged])
}

// =================================================================
// 10. SEO 301 REDIRECTS AUDIT
// =================================================================

model SeoRedirect {
  id         String   @id @default(uuid())
  oldSlug    String   @unique
  newSlug    String
  statusCode Int      @default(301)
  entityType String   // "PRODUCT" | "CATEGORY"
  createdAt  DateTime @default(now())

  @@index([oldSlug])
}
```

---

## 2. Standardized REST API Contracts

All endpoints return a uniform envelope:
```json
{
  "success": true,
  "data": {},
  "pagination": { "currentPage": 1, "pageSize": 10, "totalItems": 42, "totalPages": 5 },
  "error": null
}
```

| Area | HTTP Method | Endpoint | Description |
|---|---|---|---|
| **Categories** | `GET` | `/api/admin/categories` | Paginated category list or hierarchical tree (`?view=tree`) |
| | `POST` | `/api/admin/categories` | Create category with unique slug & cycle prevention |
| | `GET` | `/api/admin/categories/[id]` | Category detail with mapped dynamic attributes |
| | `PUT` | `/api/admin/categories/[id]` | Update category & track 301 redirect if slug changes |
| | `DELETE` | `/api/admin/categories/[id]` | Safe delete (rejects if descendants or products exist) |
| **Brands** | `GET` / `POST` | `/api/admin/brands` | List & Create Brands |
| | `GET` / `PUT` / `DELETE` | `/api/admin/brands/[id]` | Single Brand detail, update, delete |
| **Attributes** | `GET` / `POST` | `/api/admin/attributes` | List definitions & Create dynamic attributes |
| | `PUT` / `DELETE` | `/api/admin/attributes/[id]` | Update or remove attribute definition |
| | `POST` | `/api/admin/categories/[id]/attributes` | Map attribute definitions to a category |
| **Products** | `GET` | `/api/admin/products` | Paginated product directory with filters |
| | `POST` | `/api/admin/products` | Create multi-step product (draft or published) |
| | `GET` | `/api/admin/products/[id]` | Complete product details with variants & attributes |
| | `PUT` | `/api/admin/products/[id]` | Full product update with atomic variant sync |
| | `DELETE` | `/api/admin/products/[id]` | Soft-delete / Archive product |
| **Media** | `POST` | `/api/admin/media/sign` | Generates secure Cloudinary signature for client |
| **Inventory** | `GET` | `/api/admin/inventory` | Real-time stock balance matrix across warehouses |
| | `POST` | `/api/admin/inventory/adjust` | Concurrency-safe atomic stock adjustment |
| | `POST` | `/api/admin/inventory/transfer` | Warehouse-to-warehouse stock transfer |
| | `GET` | `/api/admin/inventory/movements`| Complete immutable stock movement ledger |
| | `GET` / `POST`| `/api/admin/inventory/alerts` | Low stock alert directory & acknowledgement |
