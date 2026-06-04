export type OrderStatus =
  | "pending_payment"
  | "payment_review"
  | "paid"
  | "packing"
  | "shipped"
  | "completed"
  | "cancelled";

export type SlipStatus = "none" | "pending" | "approved" | "rejected";

export type LocalizedText = {
  th: string;
  en?: string;
};

export type Product = {
  id: string;
  name: LocalizedText;
  slug: string;
  description?: LocalizedText;
  price: number;
  stock: number;
  shippingFirstItem: number;
  shippingAdditionalItem: number;
  category?: string;
  options?: ProductOption[];
  imageUrl?: string;
  imageUrls?: string[];
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ProductOption = {
  label: string;
  imageUrl?: string;
  stock?: number;
};

export type ProductOptionInput = string | ProductOption;

export type CartItemInput = {
  productId: string;
  quantity: number;
  selectedOption?: string;
};

export type CustomerInput = {
  name: string;
  phone: string;
  email: string;
  address: string;
};

export type PaymentSlipInput = {
  imageUrl: string;
  paidAt?: string;
  note?: string;
};

export type OrderItem = {
  productId: string;
  name: LocalizedText;
  price: number;
  quantity: number;
  subtotal: number;
  selectedOption?: string;
};

export type PaymentSlip = {
  imageUrl: string;
  paidAt?: string;
  note?: string;
  status: SlipStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
};

export type Order = {
  id: string;
  customer: CustomerInput;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  deliveryMode: "delivery" | "pickup";
  total: number;
  status: OrderStatus;
  slip: PaymentSlip;
  trackingNumber?: string;
  cancellationReason?: string;
  adminNotes?: { text: string; by: string; at: string; action: string }[];
  createdAt: string;
  updatedAt: string;
};

export type CreateOrderInput = {
  customer: CustomerInput;
  items: CartItemInput[];
  deliveryMode?: "delivery" | "pickup";
};

export type CreateProductInput = {
  name: LocalizedText;
  slug?: string;
  description?: LocalizedText;
  price: number;
  stock: number;
  shippingFirstItem?: number;
  shippingAdditionalItem?: number;
  category?: string;
  options?: ProductOptionInput[] | string;
  imageUrl?: string;
  imageUrls?: string[];
  active?: boolean;
};

export type ReviewSlipInput = {
  approved: boolean;
  reviewedBy: string;
  note?: string;
};
