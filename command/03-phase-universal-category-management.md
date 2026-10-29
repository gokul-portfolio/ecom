# Phase 03: Universal Category Management System

---

## 1. Domain Overview & Requirements

Product Categories form the spine of the e-commerce catalog. Unlike rigid hardcoded catalogs, this module enables administrators to dynamically create arbitrarily deep taxonomic trees:
- **Apparel** $\rightarrow$ **Men's Wear** $\rightarrow$ **Casual Shirts**
- **Beauty** $\rightarrow$ **Skincare** $\rightarrow$ **Face Serums**
- **Food & Grocery** $\rightarrow$ **Packaged Food** $\rightarrow$ **Organic Snacks**
- **Electronics** $\rightarrow$ **Audio** $\rightarrow$ **Wireless Earbuds**
- **Home** $\rightarrow$ **Furniture** $\rightarrow$ **Ergonomic Chairs**

### Core Safety & Integrity Rules
1. **Cycle Prevention**: A category can **never** be made a parent or child of itself or any of its own descendants.
2. **Safe Move**: Moving a category automatically recalculates the `level` of all its nested child categories.
3. **Safe Deletion**: A category with active children or linked products cannot be deleted unless children are safely reassigned or orphaned with explicit administrator consent.
4. **Automatic Breadcrumbs**: Every category dynamically generates its full ancestor hierarchy: `Home > Apparel > Men's Wear > Casual Shirts`.

---

## 2. Directory & Component Layout

```
src/
├── app/
│   ├── (admin)/
│   │   └── categories/
│   │       ├── page.tsx               # Server component (SEO & initial tree fetch)
│   │       ├── CategoriesClient.tsx   # Dual-view: Interactive Tree View & Searchable DataTable
│   │       └── form/
│   │           └── page.tsx           # 65% Form + 35% Live Storefront Breadcrumb Preview
│   └── api/
│       └── admin/
│           └── categories/
│               ├── route.ts           # GET (?view=tree or flat) & POST (create + slug check)
│               └── [id]/
│                   └── route.ts       # GET (with ancestors), PUT (cycle check), DELETE (safe check)
├── lib/
│   ├── validations/
│   │   └── category.ts                # Zod schemas (categorySchema, categoryUpdateSchema)
│   └── utils/
│       └── category-tree.ts           # Tree build, cycle check, breadcrumbs generator
```

---

## 3. Key Algorithms & Implementation Details

### A. Cycle Prevention & Safe Hierarchy Move
```typescript
// src/lib/utils/category-tree.ts
export async function wouldCreateCycle(
  categoryId: string,
  proposedParentId: string | null,
  prisma: any
): Promise<boolean> {
  if (!proposedParentId) return false;
  if (categoryId === proposedParentId) return true;

  let currentParentId: string | null = proposedParentId;
  const visited = new Set<string>([categoryId]);

  while (currentParentId) {
    if (visited.has(currentParentId)) {
      return true; // Cycle detected
    }
    visited.add(currentParentId);

    const parent: { parentId: string | null } | null = await prisma.category.findUnique({
      where: { id: currentParentId },
      select: { parentId: true },
    });

    currentParentId = parent ? parent.parentId : null;
  }

  return false;
}
```

### B. Dynamic Breadcrumb Generation
```typescript
export async function getCategoryBreadcrumbs(
  categoryId: string,
  prisma: any
): Promise<Array<{ id: string; name: string; slug: string }>> {
  const breadcrumbs = [];
  let currentId: string | null = categoryId;

  while (currentId) {
    const cat: { id: string; name: string; slug: string; parentId: string | null } | null =
      await prisma.category.findUnique({
        where: { id: currentId },
        select: { id: true, name: true, slug: true, parentId: true },
      });

    if (!cat) break;
    breadcrumbs.unshift({ id: cat.id, name: cat.name, slug: cat.slug });
    currentId = cat.parentId;
  }

  return breadcrumbs;
}
```

---

## 4. UI/UX Specifications
- **Left Panel (65%)**:
  - Name, auto-slug generator, parent category selector (with tree indent indentation `— — Subcategory`), description.
  - Media: Category Icon upload (small square) and Category Banner upload (wide 16:9 banner via Cloudinary).
  - SEO: Meta Title, Meta Description, Canonical URL override.
- **Right Panel (35% Live Preview)**:
  - Visual Storefront Category Header Simulation.
  - Live breadcrumb preview (`Home > Electronics > Audio`).
  - Active status indicator badge.
