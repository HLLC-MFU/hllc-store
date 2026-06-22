import type { NextRequest } from "next/server";
import * as orderController from "./order-controller";

type OrderRouteContext = {
  params: Promise<{
    orderId: string;
  }>;
};

export const orderRouter = {
  GET: orderController.listCustomerOrders,
  POST: orderController.createOrder,
};

export const orderByIdRouter = {
  async GET(_request: NextRequest, context: OrderRouteContext) {
    const { orderId } = await context.params;

    return orderController.getPublicOrder(orderId);
  },

  async PATCH(request: NextRequest, context: OrderRouteContext) {
    const { orderId } = await context.params;

    return orderController.attachPaymentSlip(request, orderId);
  },
};

export const adminOrderRouter = {
  GET: orderController.listAdminOrders,
};

export const adminOrderByIdRouter = {
  async GET(request: NextRequest, context: OrderRouteContext) {
    const { orderId } = await context.params;

    return orderController.getAdminOrder(request, orderId);
  },

  async PATCH(request: NextRequest, context: OrderRouteContext) {
    const { orderId } = await context.params;

    return orderController.updateAdminOrder(request, orderId);
  },

  async POST(request: NextRequest, context: OrderRouteContext) {
    const { orderId } = await context.params;
    const url = new URL(request.url);
    if (url.searchParams.get("action") === "resend-email") {
      return orderController.resendOrderEmail(request, orderId);
    }
    return new Response("Not found", { status: 404 });
  },
};

export const adminOrdersPendingRouter = {
  GET: orderController.getPendingOrdersCount,
};
