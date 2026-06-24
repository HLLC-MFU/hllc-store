export type OrderStatus =
  | "pending_payment" | "payment_review" | "paid"
  | "packing" | "shipped" | "completed" | "cancelled";

export type SlipStatus = "none" | "pending" | "approved" | "rejected";

export type LocalizedText = {
  th: string;
  en?: string;
};

export type Product = {
  id: string; name: LocalizedText; slug: string;
  description?: LocalizedText; subtitle?: LocalizedText; price: number; stock: number;
  discount?: number; // percent 0-100
  category?: string;
  group?: string;
  charmType?: string;
  allowCustomName?: boolean;
  customNameMaxLength?: number;
  options?: ProductOption[];
  imageUrl?: string;
  imageUrls?: string[];
  active: boolean;
  comingSoon?: boolean;
};

export type ProductOption = {
  label: string;
  labelEn?: string;
  imageUrl?: string;
  stock?: number;
};

export type Order = {
  id: string;
  customer: { name: string; phone: string; email?: string; address: string };
  items: {
    productId: string;
    name: LocalizedText;
    price: number;
    quantity: number;
    subtotal: number;
    selectedOption?: string;
    customName?: string;
  }[];
  subtotal?: number;
  shippingFee?: number;
  deliveryMode?: "delivery" | "pickup";
  total: number;
  status: OrderStatus;
  slip: { imageUrl?: string; status: SlipStatus; paidAt?: string | null; reviewNote?: string };
  slipHistory?: { imageUrl?: string; status: SlipStatus; paidAt?: string | null; reviewNote?: string; replacedAt?: string }[];
  trackingNumber?: string;
  cancellationReason?: string;
  adminNotes?: { text: string; by: string; at: string; action: string }[];
  createdAt: string;
};

export const ORDER_STATUSES: OrderStatus[] = [
  "pending_payment", "payment_review", "packing", "shipped", "completed", "cancelled",
];

export const STATUS_BG: Record<OrderStatus, string> = {
  pending_payment: "bg-gray-50 border-gray-200",
  payment_review:  "bg-amber-50/60 border-amber-200",
  paid:            "bg-blue-50/50 border-blue-200",
  packing:         "bg-blue-50/50 border-blue-200",
  shipped:         "bg-sky-50/60 border-sky-200",
  completed:       "bg-emerald-50/60 border-emerald-200",
  cancelled:       "bg-red-50/40 border-red-200",
};

export const STATUS_ICON: Record<OrderStatus, string> = {
  pending_payment: "bg-gray-100 text-gray-400",
  payment_review:  "bg-amber-100 text-amber-600",
  paid:            "bg-blue-100 text-blue-600",
  packing:         "bg-blue-100 text-blue-600",
  shipped:         "bg-sky-100 text-sky-600",
  completed:       "bg-emerald-100 text-emerald-600",
  cancelled:       "bg-red-100 text-red-500",
};

export const STATUS_COLOR: Record<OrderStatus, string> = {
  pending_payment: "bg-gray-100 text-gray-500",
  payment_review:  "bg-amber-50 text-amber-700",
  paid:            "bg-blue-50 text-blue-700",
  packing:         "bg-blue-50 text-blue-700",
  shipped:         "bg-sky-50 text-sky-700",
  completed:       "bg-emerald-50 text-emerald-700",
  cancelled:       "bg-red-50 text-red-700",
};
