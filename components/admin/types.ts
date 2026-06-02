export type OrderStatus =
  | "pending_payment" | "payment_review" | "paid"
  | "packing" | "shipped" | "completed" | "cancelled";

export type SlipStatus = "none" | "pending" | "approved" | "rejected";

export type ProductOption = { label: string; imageUrl?: string };

export type LocalizedText = {
  th: string;
  en?: string;
};

export type Product = {
  id: string; name: LocalizedText; slug: string;
  description?: LocalizedText; price: number; stock: number;
  discount?: number; // percent 0-100
  category?: string;
  options?: ProductOption[];
  imageUrl?: string;
  imageUrls?: string[];
  active: boolean;
};

export type Order = {
  id: string;
  customer: { name: string; phone: string; address: string };
  items: { productId: string; name: string; price: number; quantity: number; subtotal: number }[];
  total: number;
  status: OrderStatus;
  slip: { imageUrl?: string; status: SlipStatus; paidAt?: string };
  trackingNumber?: string;
  cancellationReason?: string;
  adminNotes?: { text: string; by: string; at: string; action: string }[];
  createdAt: string;
};

export const ORDER_STATUSES: OrderStatus[] = [
  "payment_review", "packing", "shipped", "completed",
];

export const STATUS_COLOR: Record<OrderStatus, string> = {
  pending_payment: "bg-amber-50 text-amber-700 border-amber-200/60",
  payment_review: "bg-rose-50 text-rose-600 border-rose-200/60",
  paid: "bg-rose-50 text-rose-600 border-rose-200/60",
  packing: "bg-yellow-50 text-yellow-700 border-yellow-200/60",
  shipped: "bg-sky-50 text-sky-600 border-sky-200/60",
  completed: "bg-teal-50 text-teal-700 border-teal-200/60",
  cancelled: "bg-red-50 text-red-700 border-red-200/60",
};
