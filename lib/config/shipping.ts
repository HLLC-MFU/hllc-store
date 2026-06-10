// Shipping is taken from each product's own first-item / additional-item fee,
// set when the product is created. Shared by the cart UI and the order service
// so totals always match.

export type ShippingDestination = {
  province?: string;
  postalCode?: string;
};

export type ShippingLine = {
  quantity: number;
  shippingFirstItem?: number;
  shippingAdditionalItem?: number;
};

// Surcharge for remote / special areas (islands, 3 southern border provinces,
// hard-to-reach zones, etc.), looked up by province or postal code.
//
// TODO(remote-area): not implemented yet — returns 0 so current behavior is
// unchanged. When rules are defined, match `destination` here and return the
// extra fee; `calcShippingFee` already passes the destination through.
function remoteAreaSurcharge(destination?: ShippingDestination): number {
  // TODO(remote-area): compute surcharge from destination.province / postalCode.
  void destination;
  return 0;
}

// Base shipping for a single product line: first unit + additional units.
function lineShippingFee(line: ShippingLine): number {
  if (line.quantity <= 0) return 0;
  return (line.shippingFirstItem ?? 0) + (line.shippingAdditionalItem ?? 0) * Math.max(0, line.quantity - 1);
}

export function calcShippingFee(
  lines: ShippingLine[],
  deliveryMode: "delivery" | "pickup",
  destination?: ShippingDestination,
): number {
  if (deliveryMode === "pickup") return 0;
  const base = lines.reduce((sum, line) => sum + lineShippingFee(line), 0);
  return base + remoteAreaSurcharge(destination);
}
