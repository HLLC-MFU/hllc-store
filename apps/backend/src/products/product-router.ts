import * as productController from "./product-controller";

export const productRouter = {
  GET: productController.listStoreProducts,
};

export const adminProductRouter = {
  GET: productController.listAdminProducts,
  POST: productController.createProduct,
};

export const adminProductByIdRouter = {
  async PATCH(request: Request, productId: string) {
    return productController.updateProduct(request, productId);
  },

  async DELETE(_request: Request, productId: string) {
    return productController.deleteProduct(productId);
  },
};
