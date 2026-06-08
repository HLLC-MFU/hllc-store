import { z } from "zod";
import { productResponseSchema } from "@/lib/validation/response-schemas";

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
  discount?: number;
  imageUrl?: string;
  imageUrls?: string[];
  options?: unknown[];
  active: boolean;
};
