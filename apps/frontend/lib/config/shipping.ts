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

export type ShippingLine = {
  quantity: number;
};

export function calcShippingFee(
  lines: ShippingLine[],
  deliveryMode: "delivery" | "pickup",
  options: { remote?: boolean; island?: boolean; rates: ShippingRates },
): number {
  if (deliveryMode === "pickup") return 0;
  const { remote, island, rates } = options;

  let first: number;
  let additional: number;
  if (island) {
    first = rates.islandFirstItem;
    additional = rates.islandAdditionalItem;
  } else if (remote) {
    first = rates.remoteFirstItem;
    additional = rates.remoteAdditionalItem;
  } else {
    first = rates.normalFirstItem;
    additional = rates.normalAdditionalItem;
  }

  const lineRates = lines
    .filter((l) => l.quantity > 0)
    .map((line) => ({ first, additional, quantity: line.quantity }));

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
