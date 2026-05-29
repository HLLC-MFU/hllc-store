import type { NextRequest } from "next/server";
import * as productController from "./product-controller";

type ProductRouteContext = {
  params: Promise<{
    productId: string;
  }>;
};

export const productRouter = {
  GET: productController.listStoreProducts,
};

export const adminProductRouter = {
  GET: productController.listAdminProducts,
  POST: productController.createProduct,
};

export const adminProductByIdRouter = {
  async PATCH(request: NextRequest, context: ProductRouteContext) {
    const { productId } = await context.params;

    return productController.updateProduct(request, productId);
  },

  async DELETE(_request: NextRequest, context: ProductRouteContext) {
    const { productId } = await context.params;

    return productController.deleteProduct(productId);
  },
};
