import { z } from "zod";
import {
  orderResponseSchema,
  publicOrderResponseSchema,
} from "@hllc/shared/validation/response-schemas";

export { orderResponseSchema, publicOrderResponseSchema };

export type Order = z.infer<typeof orderResponseSchema>;
export type PublicOrder = z.infer<typeof publicOrderResponseSchema>;
export type OrderStatus = Order["status"];

export type CreateOrderInput = {
  customer: { name: string; phone: string; email: string; address: string };
  items: { productId: string; quantity: number; selectedOption?: string; customName?: string }[];
  deliveryMode: "delivery" | "pickup";
  lang?: "th" | "en";
};

export type UpdateAdminOrderInput =
  | { status: OrderStatus }
  | { trackingNumber: string }
  | { cancel: true; reason: string };
