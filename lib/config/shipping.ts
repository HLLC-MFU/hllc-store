// Shipping = store-wide default rates (normal / remote / island), which each
// product may override. Computed per product line: first item + additional × (qty-1).
// Priority: island > remote > normal.

export type ShippingRates = {
  normalFirstItem: number;
  normalAdditionalItem: number;
  remoteFirstItem: number;
  remoteAdditionalItem: number;
  islandFirstItem: number;
  islandAdditionalItem: number;
};

export const DEFAULT_SHIPPING_RATES: ShippingRates = {
  normalFirstItem: 50,
  normalAdditionalItem: 10,
  remoteFirstItem: 80,
  remoteAdditionalItem: 15,
  islandFirstItem: 100,
  islandAdditionalItem: 15,
};

// Per-product line. Any rate left 0/undefined falls back to the store default.
export type ShippingLine = {
  quantity: number;
  shippingFirstItem?: number;
  shippingAdditionalItem?: number;
  remoteShippingFirstItem?: number;
  remoteShippingAdditionalItem?: number;
  islandShippingFirstItem?: number;
  islandShippingAdditionalItem?: number;
};

const effective = (override: number | undefined, fallback: number) =>
  typeof override === "number" && override > 0 ? override : fallback;

export function calcShippingFee(
  lines: ShippingLine[],
  deliveryMode: "delivery" | "pickup",
  options: { remote?: boolean; island?: boolean; rates: ShippingRates },
): number {
  if (deliveryMode === "pickup") return 0;
  const { remote, island, rates } = options;
  return lines.reduce((sum, line) => {
    if (line.quantity <= 0) return sum;
    let first: number;
    let additional: number;
    if (island) {
      first = effective(line.islandShippingFirstItem, rates.islandFirstItem);
      additional = effective(line.islandShippingAdditionalItem, rates.islandAdditionalItem);
    } else if (remote) {
      first = effective(line.remoteShippingFirstItem, rates.remoteFirstItem);
      additional = effective(line.remoteShippingAdditionalItem, rates.remoteAdditionalItem);
    } else {
      first = effective(line.shippingFirstItem, rates.normalFirstItem);
      additional = effective(line.shippingAdditionalItem, rates.normalAdditionalItem);
    }
    return sum + first + additional * (line.quantity - 1);
  }, 0);
}
