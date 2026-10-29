import { PrismaClient } from "@/generated/client";

export interface CategoryTreeItem {
  id: string;
  code: string;
  name: string;
  slug: string;
  description: string | null;
  level: number;
  sortOrder: number;
  isActive: boolean;
  iconUrl: string | null;
  bannerUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    children?: number;
    productCategories?: number;
    categoryAttributes?: number;
  };
  children?: CategoryTreeItem[];
}

/**
 * Organizes a flat list of categories into a nested hierarchical tree structure
 */
export function buildCategoryTree(categories: any[]): CategoryTreeItem[] {
  const map = new Map<string, CategoryTreeItem>();
  const roots: CategoryTreeItem[] = [];

  // Initialize map
  categories.forEach((cat) => {
    map.set(cat.id, { ...cat, children: [] });
  });

  // Assemble parent-child relations
  categories.forEach((cat) => {
    const item = map.get(cat.id);
    if (!item) return;

    if (cat.parentId && map.has(cat.parentId)) {
      const parent = map.get(cat.parentId);
      parent?.children?.push(item);
    } else {
      roots.push(item);
    }
  });

  // Sort by sortOrder then name
  const sortTree = (items: CategoryTreeItem[]) => {
    items.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    items.forEach((child) => {
      if (child.children && child.children.length > 0) {
        sortTree(child.children);
      }
    });
  };

  sortTree(roots);
  return roots;
}

/**
 * Flattens tree with hierarchical visual indentation for dropdown selectors
 * e.g. "Apparel", "— Men's Wear", "— — Casual Shirts"
 */
export function getFlattenedTreeWithIndent(
  tree: CategoryTreeItem[],
  currentLevel = 0,
  excludeId?: string
): Array<{ value: string; label: string; level: number }> {
  const result: Array<{ value: string; label: string; level: number }> = [];

  for (const node of tree) {
    if (excludeId && node.id === excludeId) continue;

    const prefix = currentLevel > 0 ? `${"— ".repeat(currentLevel)} ` : "";
    result.push({
      value: node.id,
      label: `${prefix}${node.name}`,
      level: currentLevel,
    });

    if (node.children && node.children.length > 0) {
      result.push(
        ...getFlattenedTreeWithIndent(node.children, currentLevel + 1, excludeId)
      );
    }
  }

  return result;
}

/**
 * Cycle Detection: Verifies that setting proposedParentId will not cause a loop
 * A category can NEVER be made a child of itself or any of its own descendants.
 */
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

    if (!parent) break;
    currentParentId = parent.parentId;
  }

  return false;
}

/**
 * Traverses upwards to generate full breadcrumb path from root to current category
 */
export async function getCategoryBreadcrumbs(
  categoryId: string,
  prisma: any
): Promise<Array<{ id: string; name: string; slug: string }>> {
  const breadcrumbs: Array<{ id: string; name: string; slug: string }> = [];
  let currentId: string | null = categoryId;
  const visited = new Set<string>();

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);

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
