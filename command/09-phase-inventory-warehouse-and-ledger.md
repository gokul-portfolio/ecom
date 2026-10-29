# Phase 09: Inventory Management, Multi-Warehouse Operations & Stock Ledger

---

## 1. Mathematical Formulation & Concurrency Guarantee

### A. The Core Inventory Equation
For every product variant across every warehouse location:

$$\text{Available Stock} = \text{On-Hand Stock} - \text{Reserved Stock}$$

- **On-Hand Stock**: Physical count of units present in the warehouse.
- **Reserved Stock**: Units allocated to confirmed customer checkout orders that have not yet been packed and shipped.
- **Available Stock**: The exact quantity that can be sold to new shoppers on the storefront.

### B. Concurrency Safety & Atomicity
To eliminate race conditions, negative inventory, and double-selling under high concurrent traffic:
1. Every stock-changing operation executes inside an atomic database transaction: `prisma.$transaction()`.
2. Quantity checks verify $\text{Available} \ge \text{Requested}$ before committing reservations.
3. Every change generates an immutable **Stock Movement Ledger Entry** detailing the timestamp, actor, reference order or PO number, and reason.
4. **No Silent Overwrites**: Stock corrections never silently edit past balances. They record traceable compensating adjustments (e.g., `MANUAL_AUDIT_CORRECTION`).

---

## 2. Directory & Component Layout

```
src/
├── app/
│   ├── (admin)/
│   │   ├── warehouses/
│   │   │   ├── page.tsx               # Warehouses DataTable
│   │   │   └── form/
│   │   │       └── page.tsx           # 65% Warehouse Form + 35% Live Address Preview
│   │   └── inventory/
│   │       ├── page.tsx               # Inventory Master Dashboard (Stock balances across SKUs & Warehouses)
│   │       ├── ledger/
│   │       │   └── page.tsx           # Immutable Movement Audit Log with filters by SKU, Warehouse & Reason
│   │       ├── adjust/
│   │       │   └── page.tsx           # Quick Stock Adjustment Modal / Drawer
│   │       └── alerts/
│   │           └── page.tsx           # Low-Stock Alert Monitor with 1-click acknowledgement
│   └── api/
│       └── admin/
│           ├── warehouses/
│           │   ├── route.ts           # GET & POST warehouses
│           │   └── [id]/
│           │       └── route.ts       # GET, PUT, DELETE warehouse
│           └── inventory/
│               ├── balances/
│               │   └── route.ts       # GET aggregated variant stock balances
│               ├── adjust/
│               │   └── route.ts       # POST atomic adjustment with movement record
│               ├── transfer/
│               │   └── route.ts       # POST warehouse-to-warehouse stock transfer
│               ├── movements/
│               │   └── route.ts       # GET immutable movement audit ledger
│               └── alerts/
│                   ├── route.ts       # GET low-stock alerts
│                   └── [id]/ack/
│                       └── route.ts   # POST acknowledge alert
└── lib/
    ├── services/
    │   └── inventory.service.ts       # Centralized business logic for atomic stock movements
    └── validations/
        └── inventory.ts               # Zod validation schemas for adjustments & transfers
```

---

## 3. Concurrency-Safe Transaction Service

```typescript
// src/lib/services/inventory.service.ts

import { prisma } from "@/lib/prisma";
import { broadcastSocketEvent } from "@/lib/socket-notify";
import { StockMovementType } from "@/generated/client";

export interface StockAdjustmentParams {
  variantId: string;
  warehouseId: string;
  quantityDelta: number; // Positive (addition) or Negative (deduction)
  type: StockMovementType;
  reason?: string;
  referenceNumber?: string;
  actorId?: string;
}

export async function adjustInventoryStock(params: StockAdjustmentParams) {
  const { variantId, warehouseId, quantityDelta, type, reason, referenceNumber, actorId } = params;

  return await prisma.$transaction(async (tx) => {
    // 1. Fetch current balance or create initial balance row
    let balance = await tx.inventoryBalance.findUnique({
      where: {
        warehouseId_variantId: { warehouseId, variantId },
      },
    });

    if (!balance) {
      balance = await tx.inventoryBalance.create({
        data: {
          warehouseId,
          variantId,
          onHand: 0,
          reserved: 0,
          available: 0,
        },
      });
    }

    const newOnHand = balance.onHand + quantityDelta;
    if (newOnHand < 0) {
      throw new Error(`Insufficient stock. Current on-hand is ${balance.onHand}, cannot deduct ${Math.abs(quantityDelta)}.`);
    }

    const newAvailable = newOnHand - balance.reserved;
    if (newAvailable < 0) {
      throw new Error(`Cannot complete adjustment. Reserved stock (${balance.reserved}) exceeds resulting on-hand (${newOnHand}).`);
    }

    // 2. Update Balance Record
    const updatedBalance = await tx.inventoryBalance.update({
      where: { id: balance.id },
      data: {
        onHand: newOnHand,
        available: newAvailable,
      },
      include: {
        variant: {
          select: { id: true, sku: true, title: true, product: { select: { title: true } } },
        },
        warehouse: { select: { id: true, name: true } },
      },
    });

    // 3. Create Immutable Movement Ledger Entry
    await tx.stockMovement.create({
      data: {
        variantId,
        toWarehouseId: warehouseId,
        type,
        quantity: quantityDelta,
        resultingOnHand: newOnHand,
        reason: reason || "Manual adjustment",
        referenceNumber,
        actorId,
      },
    });

    // 4. Low-Stock Detection
    if (newAvailable <= balance.lowStockThreshold) {
      await tx.lowStockAlert.upsert({
        where: { id: `${warehouseId}-${variantId}` },
        update: {
          currentStock: newAvailable,
          isAcknowledged: false,
        },
        create: {
          id: `${warehouseId}-${variantId}`,
          warehouseId,
          variantId,
          currentStock: newAvailable,
          threshold: balance.lowStockThreshold,
        },
      });

      // Real-time Socket Notification to Warehouse Managers
      broadcastSocketEvent("inventory:low_stock", {
        sku: updatedBalance.variant.sku,
        productName: updatedBalance.variant.product.title,
        variantTitle: updatedBalance.variant.title,
        warehouseName: updatedBalance.warehouse.name,
        available: newAvailable,
        threshold: balance.lowStockThreshold,
      });
    }

    return updatedBalance;
  });
}
```

---

## 4. UI/UX: Real-Time Inventory Control Center

### A. Inventory Master Dashboard (`/inventory`)
- Metric summary cards:
  - Total SKUs in Catalog
  - Aggregate On-Hand Stock Units
  - Total Stock Reserved in Active Carts/Orders
  - Low Stock SKU Alerts Count
- Filterable table: Search by SKU, Barcode, Product Name, Category, or Warehouse.
- Color-coded badges:
  - `In Stock` (Emerald green, $> 10$ units)
  - `Low Stock` (Amber yellow, $\le 5$ units)
  - `Out of Stock` (Rose red, $0$ units)
- Inline action: **Quick Adjust** opens drawer to record incoming inventory or damage write-offs with mandatory reason notes.

### B. Movement Ledger (`/inventory/ledger`)
- Chronological, searchable audit trail.
- Columns: Timestamp, SKU, Movement Type badge, Delta quantity ($+50$ green, $-5$ red), Resulting on-hand balance, Reason, Reference #, Actor.
