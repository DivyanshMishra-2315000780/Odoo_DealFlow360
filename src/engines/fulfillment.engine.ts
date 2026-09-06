export function recommendAllocation(
  requiredItems: Array<{ productId: string; quantity: number }>,
  warehouses: Array<{ id: string; shippingCost: string | number }>,
  inventory: Array<{ productId: string; warehouseId: string; availableQty: number }>
) {
  const allocations: Array<{ productId: string; warehouseId: string; allocatedQty: number; estimatedShippingCost: number }> = [];
  const backorders: Array<{ productId: string; shortageQty: number }> = [];
  
  for (const item of requiredItems) {
    let remainingQty = item.quantity;
    
    // Find inventory for this product, sorted by available stock desc, then shipping cost asc
    const itemInventory = inventory
      .filter(i => i.productId === item.productId && i.availableQty > 0 && warehouses.some(w=>w.id===i.warehouseId))
      .sort((a, b) => {
        if (b.availableQty !== a.availableQty) return b.availableQty - a.availableQty;
        const wA = warehouses.find(w => w.id === a.warehouseId);
        const wB = warehouses.find(w => w.id === b.warehouseId);
        return Number(wA?.shippingCost || 0) - Number(wB?.shippingCost || 0);
      });

    for (const inv of itemInventory) {
      if (remainingQty <= 0) break;

      const allocateQty = Math.min(inv.availableQty, remainingQty);
      
      allocations.push({
        productId: item.productId,
        warehouseId: inv.warehouseId,
        allocatedQty: allocateQty,
        estimatedShippingCost: Number(warehouses.find(w=>w.id===inv.warehouseId)?.shippingCost ?? 0)
      });

      remainingQty -= allocateQty;
    }

    if (remainingQty > 0) {
      backorders.push({
        productId: item.productId,
        shortageQty: remainingQty
      });
    }
  }

  return {
    allocations,
    backorders,
    summary: {
      totalAllocated: allocations.reduce((sum, a) => sum + a.allocatedQty, 0),
      totalBackordered: backorders.reduce((sum, b) => sum + b.shortageQty, 0)
    }
  };
}

export function validateOverride(
  override: { productId: string; warehouseId: string; allocatedQty: number },
  inventory: Array<{ productId: string; warehouseId: string; availableQty: number }>,
) {
  const inv = inventory.find(i => i.productId === override.productId && i.warehouseId === override.warehouseId);
  if (!inv) return { valid: false, reason: 'Inventory not found' };
  
  if (override.allocatedQty > inv.availableQty) {
    return { valid: false, reason: `Requested ${override.allocatedQty} but only ${inv.availableQty} available` };
  }
  
  return { valid: true };
}
