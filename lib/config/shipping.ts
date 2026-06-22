// Shipping = store-wide default rates (normal / remote / island), which each
// product may override. "First item" is charged once for the whole order
// (the line with the highest first-item rate); remaining items pay the
// additional rate only. Priority: island > remote > normal.

export type ShippingRates = {
  normalFirstItem: number;
  normalAdditionalItem: number;
  remoteFirstItem: number;
  remoteAdditionalItem: number;
  islandFirstItem: number;
  islandAdditionalItem: number;
  pickupLocation?: string;
  pickupHours?: string;
};

export const DEFAULT_SHIPPING_RATES: ShippingRates = {
  normalFirstItem: 50,
  normalAdditionalItem: 10,
  remoteFirstItem: 80,
  remoteAdditionalItem: 15,
  islandFirstItem: 100,
  islandAdditionalItem: 15,
  pickupLocation: "",
  pickupHours: "",
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

  const lineRates = lines
    .filter((l) => l.quantity > 0)
    .map((line) => {
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
      return { first, additional, quantity: line.quantity };
    });

  if (lineRates.length === 0) return 0;

  // Charge "first item" only once — the line with the highest first-item rate
  // pays it; every other item across all lines pays the additional rate only.
  lineRates.sort((a, b) => b.first - a.first);
  const [anchor, ...rest] = lineRates;
  let total = anchor.first + anchor.additional * (anchor.quantity - 1);
  for (const line of rest) {
    total += line.additional * line.quantity;
  }
  return total;
}
