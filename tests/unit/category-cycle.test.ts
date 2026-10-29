import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  wouldCreateCycle,
  buildCategoryTree,
  getFlattenedTreeWithIndent,
} from "../../src/lib/utils/category-tree";

describe("Universal Category Tree & Cycle Prevention Engine", () => {
  const mockCategories = [
    { id: "CAT-1", name: "Fashion", parentId: null, sortOrder: 1, level: 0 },
    { id: "CAT-2", name: "Men", parentId: "CAT-1", sortOrder: 1, level: 1 },
    { id: "CAT-3", name: "Footwear", parentId: "CAT-2", sortOrder: 1, level: 2 },
    { id: "CAT-4", name: "Sneakers", parentId: "CAT-3", sortOrder: 1, level: 3 },
    { id: "CAT-5", name: "Electronics", parentId: null, sortOrder: 2, level: 0 },
  ];

  const mockPrisma = {
    category: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        const found = mockCategories.find((c) => c.id === where.id);
        return found ? { parentId: found.parentId } : null;
      },
    },
  };

  describe("wouldCreateCycle()", () => {
    it("should prevent direct self-parenting (A -> A)", async () => {
      const isCycle = await wouldCreateCycle("CAT-1", "CAT-1", mockPrisma);
      assert.equal(isCycle, true);
    });

    it("should prevent indirect circular cycle (CAT-1 -> CAT-4 -> CAT-3 -> CAT-2 -> CAT-1)", async () => {
      const isCycle = await wouldCreateCycle("CAT-1", "CAT-4", mockPrisma);
      assert.equal(isCycle, true);
    });

    it("should prevent 2-hop circular cycle (CAT-2 -> CAT-3 -> CAT-2)", async () => {
      const isCycle = await wouldCreateCycle("CAT-2", "CAT-3", mockPrisma);
      assert.equal(isCycle, true);
    });

    it("should allow valid non-cyclic assignment across distinct tree branches", async () => {
      const isCycle = await wouldCreateCycle("CAT-3", "CAT-5", mockPrisma);
      assert.equal(isCycle, false);
    });

    it("should allow assigning a root parent (null)", async () => {
      const isCycle = await wouldCreateCycle("CAT-4", null, mockPrisma);
      assert.equal(isCycle, false);
    });
  });

  describe("buildCategoryTree()", () => {
    it("should construct a nested recursive tree hierarchy with accurate children counts", () => {
      const tree = buildCategoryTree(mockCategories);

      assert.equal(tree.length, 2); // Fashion and Electronics
      const fashionNode = tree.find((t) => t.id === "CAT-1");
      assert.ok(fashionNode);
      assert.equal(fashionNode.children?.length, 1); // Men

      const menNode = fashionNode.children?.[0];
      assert.ok(menNode);
      assert.equal(menNode.id, "CAT-2");
      assert.equal(menNode.children?.[0]?.id, "CAT-3");
    });
  });

  describe("getFlattenedTreeWithIndent()", () => {
    it("should generate indented visual labels with depth indicators", () => {
      const tree = buildCategoryTree(mockCategories);
      const flattened = getFlattenedTreeWithIndent(tree);

      assert.equal(flattened.length, 5);
      assert.equal(flattened[0].label, "Fashion");
      assert.equal(flattened[1].label, "—  Men");
      assert.equal(flattened[2].label, "— —  Footwear");
      assert.equal(flattened[3].label, "— — —  Sneakers");
      assert.equal(flattened[4].label, "Electronics");
    });
  });
});
