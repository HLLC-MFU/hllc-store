import { z } from "zod";
import { productResponseSchema } from "@hllc/shared/validation/response-schemas";

export { productResponseSchema };

export type Product = z.infer<typeof productResponseSchema>;

export type ProductInput = {
  name: { th: string; en?: string };
  slug: string;
  description: { th: string; en?: string };
  price: number;
  stock: number;
  shippingFirstItem: number;
  shippingAdditionalItem: number;
  remoteShippingFirstItem?: number;
  remoteShippingAdditionalItem?: number;
  islandShippingFirstItem?: number;
  islandShippingAdditionalItem?: number;
  discount?: number;
  category?: string;
  group?: string;
  charmType?: string;
  allowCustomName?: boolean;
  customNameMaxLength?: number;
  imageUrl?: string;
  imageUrls?: string[];
  options?: unknown[];
  active: boolean;
};
