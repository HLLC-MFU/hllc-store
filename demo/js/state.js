/* ============================================
   HLLC E-Commerce — Application State
   Client state storage and LocalStorage manager
   ============================================ */

/* ─── Client State Storage System ────────────────────────────────── */
const State = {
  lang: "th",
  currentView: "select",
  products: [],
  orders: [],
  
  // Shop Active Filters
  shopSearchQuery: "",
  shopSelectedCategory: null,
  
  // Admin Active Filters & State
  adminTab: "orders",
  adminIsLoggedIn: false,
  adminSearchQuery: "",
  adminShippingFilter: "all", // all, delivery, pickup
  adminStatusFilter: "all",   // all, paid, packing, shipped, completed, cancelled, pending_payment
  
  // Active checkout session
  checkoutProduct: null,
  checkoutStep: 1, // 1, 2, 3, success
  checkoutQty: 1,
  checkoutDeliveryMode: "delivery", // delivery, pickup
  checkoutProvince: "",
  checkoutSlipPreview: null,
  checkoutSlipFile: null,
  createdOrderId: null,
  
  // Dialog actions callbacks
  dialogCallback: null,

  load() {
    try {
      this.lang = localStorage.getItem("hllc_lang") || "th";
      
      const storedProducts = localStorage.getItem("hllc_products");
      if (storedProducts) {
        let parsed = JSON.parse(storedProducts);
        
        // Force migrate mock-1 and mock-2 to ensure they have the new multi-image & variant properties
        parsed = parsed.map(p => {
          const def = DEFAULT_PRODUCTS.find(d => d.id === p.id);
          if (def) {
            if (!p.imageUrls || p.imageUrls.length <= 1) {
              p.imageUrls = def.imageUrls;
            }
            if (!p.variants || p.variants.length === 0) {
              p.variants = def.variants;
            }
          }
          return p;
        });
        
        // If mock-9 is missing, append it at the beginning so that the new high-fidelity card is immediately visible
        if (!parsed.some(p => p.id === "mock-9")) {
          const mock9 = DEFAULT_PRODUCTS.find(d => d.id === "mock-9");
          if (mock9) {
            parsed.unshift(mock9);
          }
        }
        this.products = parsed;
        // Save migrated state back to local storage
        localStorage.setItem("hllc_products", JSON.stringify(this.products));
      } else {
        this.products = DEFAULT_PRODUCTS;
        localStorage.setItem("hllc_products", JSON.stringify(this.products));
      }
      
      const storedOrders = localStorage.getItem("hllc_orders");
      this.orders = storedOrders ? JSON.parse(storedOrders) : DEFAULT_ORDERS;
      
      const storedSession = sessionStorage.getItem("hllc_admin_auth");
      this.adminIsLoggedIn = storedSession === "true";
    } catch (e) {
      console.error("Local Storage reading error, falling back to mock presets.", e);
      this.products = DEFAULT_PRODUCTS;
      this.orders = DEFAULT_ORDERS;
    }
  },

  save() {
    try {
      localStorage.setItem("hllc_lang", this.lang);
      localStorage.setItem("hllc_products", JSON.stringify(this.products));
      localStorage.setItem("hllc_orders", JSON.stringify(this.orders));
      sessionStorage.setItem("hllc_admin_auth", this.adminIsLoggedIn ? "true" : "false");
    } catch (e) {
      console.error("Local Storage save error", e);
    }
  }
};

