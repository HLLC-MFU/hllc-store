/* ============================================
   HLLC E-Commerce — Global Utilities
   Toasts, custom dialogs, countdown, lightbox, formatter
   ============================================ */

/* ─── Toast Alerts ────────────────────────────────────── */
function showToast(msg) {
  const container = document.getElementById("toast-wrapper");
  const box = document.createElement("div");
  box.className = "toast-box";
  box.innerHTML = `<i data-lucide="check-circle" style="width: 16px; height: 16px; color:#10b981;"></i> <span>${msg}</span>`;
  container.appendChild(box);
  lucide.createIcons();
  
  setTimeout(() => {
    box.style.animation = "fadeIn 0.2s reverse forwards";
    setTimeout(() => box.remove(), 200);
  }, 2500);
}


/* ─── Dialog Confirmation Engine ─────────────────────── */
function showDialog(icon, title, desc, callback) {
  const modal = document.getElementById("dialog-modal");
  const badge = document.getElementById("dialog-icon-badge");
  
  badge.className = `dialog-icon ${icon === 'trash-2' || icon === 'x-circle' ? 'danger' : 'info'}`;
  badge.innerHTML = `<i data-lucide="${icon}"></i>`;
  
  document.getElementById("dialog-modal-title").innerText = title;
  document.getElementById("dialog-modal-desc").innerText = desc;
  
  State.dialogCallback = callback;
  modal.classList.remove("hide");
  lucide.createIcons();
}

function closeDialog() {
  document.getElementById("dialog-modal").classList.add("hide");
  State.dialogCallback = null;
}

// Bind global click to confirmation button
document.getElementById("dialog-confirm-btn").addEventListener("click", () => {
  if (State.dialogCallback) {
    State.dialogCallback();
  }
  closeDialog();
});


/* ─── Flash Sale countdown simulation timer ──────────── */
function startFlashSaleCountdown() {
  let seconds = 2 * 3600 + 12 * 60 + 56;
  setInterval(() => {
    if (seconds > 0) seconds--;
    const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    document.getElementById("countdown-timer").innerText = `${h} : ${m} : ${s}`;
  }, 1000);
}


/* ─── Product Card Name & Translation Helper ─────────── */
function getDisplayProductName(p) {
  const key = `product.${p.id}.name`;
  const val = t(key);
  return val === key ? p.name : val;
}

function getDisplayProductDesc(p) {
  const key = `product.${p.id}.desc`;
  const val = t(key);
  return val === key ? (p.description || "") : val;
}

function moneyFormat(value) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0
  }).format(value);
}


/* ─── Lightbox expands ────────────────────────────────── */
function openLightbox(url) {
  const light = document.getElementById("lightbox-modal");
  document.getElementById("lightbox-img").src = url;
  light.classList.remove("hide");
}

function closeLightbox() {
  document.getElementById("lightbox-modal").classList.add("hide");
}

