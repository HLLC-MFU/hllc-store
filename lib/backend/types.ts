export type OrderStatus =
  | "pending_payment"
  | "payment_review"
  | "paid"
  | "packing"
  | "shipped"
  | "completed"
  | "cancelled";

export type SlipStatus = "none" | "pending" | "approved" | "rejected";

export type Product = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  stock: number;
  imageUrl?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CartItemInput = {
  productId: string;
  quantity: number;
};

export type CustomerInput = {
  name: string;
  phone: string;
  address: string;
};

export type PaymentSlipInput = {
  imageUrl: string;
  paidAt?: string;
  amount?: number;
  note?: string;
};

export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
};

export type PaymentSlip = {
  imageUrl: string;
  paidAt?: string;
  amount?: number;
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
  total: number;
  status: OrderStatus;
  slip: PaymentSlip;
  createdAt: string;
  updatedAt: string;
};

export type CreateOrderInput = {
  customer: CustomerInput;
  items: CartItemInput[];
};

export type CreateProductInput = {
  name: string;
  slug?: string;
  description?: string;
  price: number;
  stock: number;
  imageUrl?: string;
  active?: boolean;
};

export type ReviewSlipInput = {
  approved: boolean;
  reviewedBy: string;
  note?: string;
};
