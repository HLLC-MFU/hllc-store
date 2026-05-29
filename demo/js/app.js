/* ============================================
   HLLC E-Commerce — Bootstrap Launcher
   Application initialization and event triggers
   ============================================ */

/* ─── INITIALIZATION BOOTSTRAPPER ──────────────────────── */
window.addEventListener("DOMContentLoaded", () => {
  // 1. Load LocalStorage States
  State.load();
  
  // 2. Setup visual language defaults
  translateAllElements();
  
  // 3. Simple Hash router mappings
  const h = window.location.hash;
  if (h === "#shop") {
    navigate("shop");
  } else if (h === "#admin") {
    navigate("admin");
  } else {
    navigate("select");
  }

  // 4. Start promo flash countdown clock
  startFlashSaleCountdown();
});
