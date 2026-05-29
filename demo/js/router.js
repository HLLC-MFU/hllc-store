/* ============================================
   HLLC E-Commerce — Routing Controller
   Simple navigation and page view router
   ============================================ */

/* ─── Routing Navigation Control ───────────────────────── */
function navigate(viewName) {
  State.currentView = viewName;
  
  // Show/Hide page elements
  document.getElementById("view-select").classList.add("hide");
  document.getElementById("view-shop").classList.add("hide");
  document.getElementById("view-admin").classList.add("hide");
  
  document.getElementById(`view-${viewName}`).classList.remove("hide");
  
  if (viewName === "shop") {
    renderCategoryLists();
    renderShopProductsGrid();
  } else if (viewName === "admin") {
    if (!State.adminIsLoggedIn) {
      document.getElementById("admin-login-cover").classList.remove("hide");
    } else {
      document.getElementById("admin-login-cover").classList.add("hide");
      renderAdminDashboard();
    }
  }
  
  // Save route details on browser hash
  window.location.hash = `#${viewName}`;
  State.save();
}

