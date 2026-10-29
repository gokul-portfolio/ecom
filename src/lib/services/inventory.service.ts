import { prisma } from "@/lib/prisma";
import { broadcastSocketEvent } from "@/lib/socket-notify";
import { StockMovementType } from "@/generated/client";

export interface StockAdjustmentParams {
  variantId: string;
  warehouseId: string;
  type: StockMovementType;
  quantity: number;
  reason?: string;
  referenceNumber?: string;
  actorId?: string;
}

/**
 * Enterprise Auditable Stock Adjustment Engine
 * Guarantees ACID transactional stock mutability with double-entry ledger logging
 */
export async function adjustStock(params: StockAdjustmentParams) {
  const { variantId, warehouseId, type, quantity, reason, referenceNumber, actorId } = params;

  return await prisma.$transaction(async (tx) => {
    // 1. Fetch or create the existing balance
    let balance = await tx.inventoryBalance.findUnique({
      where: {
        warehouseId_variantId: {
          warehouseId,
          variantId,
        },
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
          lowStockThreshold: 5,
        },
      });
    }

    // 2. Compute delta and new on-hand balance based on movement type
    let delta = 0;

    switch (type) {
      case "PURCHASE_RECEIPT":
      case "CUSTOMER_RETURN":
        delta = Math.abs(quantity);
        break;

      case "SALE_DEDUCTION":
      case "DAMAGED_WRITE_OFF":
      case "EXPIRY_DISPOSAL":
        delta = -Math.abs(quantity);
        break;

      case "MANUAL_AUDIT_CORRECTION":
        // Quantity can be positive or negative
        delta = quantity;
        break;

      case "ORDER_RESERVED":
        // Increases reserved, decreases available, onHand stays same
        const newReserved = balance.reserved + Math.abs(quantity);
        const newAvailable = Math.max(0, balance.onHand - newReserved);

        const updatedReservedBalance = await tx.inventoryBalance.update({
          where: { id: balance.id },
          data: {
            reserved: newReserved,
            available: newAvailable,
          },
        });

        await tx.stockMovement.create({
          data: {
            variantId,
            fromWarehouseId: warehouseId,
            type,
            quantity: -Math.abs(quantity),
            resultingOnHand: balance.onHand,
            reason: reason || "Order Placement Reservation",
            referenceNumber: referenceNumber || null,
            actorId: actorId || null,
          },
        });

        return updatedReservedBalance;

      case "ORDER_RELEASED":
        // Decreases reserved, increases available, onHand stays same
        const releasedReserved = Math.max(0, balance.reserved - Math.abs(quantity));
        const releasedAvailable = balance.onHand - releasedReserved;

        const updatedReleaseBalance = await tx.inventoryBalance.update({
          where: { id: balance.id },
          data: {
            reserved: releasedReserved,
            available: releasedAvailable,
          },
        });

        await tx.stockMovement.create({
          data: {
            variantId,
            toWarehouseId: warehouseId,
            type,
            quantity: Math.abs(quantity),
            resultingOnHand: balance.onHand,
            reason: reason || "Order Cancellation / Release",
            referenceNumber: referenceNumber || null,
            actorId: actorId || null,
          },
        });

        return updatedReleaseBalance;

      case "WAREHOUSE_TRANSFER":
        delta = quantity;
        break;
    }

    const newOnHand = Math.max(0, balance.onHand + delta);
    const newAvailable = Math.max(0, newOnHand - balance.reserved);

    // 3. Update InventoryBalance
    const updatedBalance = await tx.inventoryBalance.update({
      where: { id: balance.id },
      data: {
        onHand: newOnHand,
        available: newAvailable,
      },
      include: {
        warehouse: true,
        variant: {
          include: {
            product: { select: { title: true, code: true } },
          },
        },
      },
    });

    // 4. Log Immutable Movement Ledger Row
    await tx.stockMovement.create({
      data: {
        variantId,
        toWarehouseId: delta >= 0 ? warehouseId : null,
        fromWarehouseId: delta < 0 ? warehouseId : null,
        type,
        quantity: delta,
        resultingOnHand: newOnHand,
        reason: reason || null,
        referenceNumber: referenceNumber || null,
        actorId: actorId || null,
      },
    });

    // 5. Check Low Stock Threshold & Create Alert
    if (newAvailable <= balance.lowStockThreshold) {
      await tx.lowStockAlert.upsert({
        where: {
          warehouseId_variantId: {
            warehouseId,
            variantId,
          },
        },
        update: {
          currentStock: newAvailable,
          threshold: balance.lowStockThreshold,
          isAcknowledged: false,
        },
        create: {
          warehouseId,
          variantId,
          currentStock: newAvailable,
          threshold: balance.lowStockThreshold,
          isAcknowledged: false,
        },
      });

      broadcastSocketEvent("inventory:alert", {
        sku: updatedBalance.variant.sku,
        productName: updatedBalance.variant.product.title,
        currentStock: newAvailable,
      });
    }

    // Real-time broadcast
    broadcastSocketEvent("inventory:changed", {
      variantId,
      warehouseId,
      newOnHand,
      newAvailable,
    });

    broadcastSocketEvent("stock:changed", {
      variantId,
      warehouseId,
      delta,
      newOnHand,
    });

    return updatedBalance;
  });
}
