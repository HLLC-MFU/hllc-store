import { ok } from "@/lib/backend/http";

export function GET() {
  return ok({
    name: "HLLC Store Backend",
    version: "rough-0.1",
    endpoints: {
      products: "GET /api/backend/products",
      adminProducts: "GET|POST /api/backend/admin/products",
      createOrder: "POST /api/backend/orders",
      userOrders: "GET /api/backend/orders?customerPhone=0800000000",
      orderDetail: "GET /api/backend/orders/:orderId",
      attachSlip: "PATCH /api/backend/orders/:orderId",
      adminOrders: "GET /api/backend/admin/orders",
      adminUpdateOrder: "PATCH /api/backend/admin/orders/:orderId",
      adminReviewSlip: "POST /api/backend/admin/slips/:orderId",
    },
  });
}
