import * as orderController from "./order-controller";

export const orderRouter = {
  GET: orderController.listCustomerOrders,
  POST: orderController.createOrder,
};

export const orderByIdRouter = {
  async GET(_request: Request, orderId: string) {
    return orderController.getPublicOrder(orderId);
  },

  async PATCH(request: Request, orderId: string) {
    return orderController.attachPaymentSlip(request, orderId);
  },
};

export const adminOrderRouter = {
  GET: orderController.listAdminOrders,
};

export const adminOrderByIdRouter = {
  async GET(request: Request, orderId: string) {
    return orderController.getAdminOrder(request, orderId);
  },

  async PATCH(request: Request, orderId: string) {
    return orderController.updateAdminOrder(request, orderId);
  },

  async POST(request: Request, orderId: string) {
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
