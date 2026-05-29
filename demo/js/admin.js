/* ============================================
   HLLC E-Commerce — Admin Portal Controller
   Login auth, dashboard metrics, orders manager, actions
   ============================================ */

/* ─── ADMIN DASHBOARD OPERATIONS ──────────────────────── */
function handleAdminLogin(e) {
  e.preventDefault();
  const user = document.getElementById("admin-user-field").value.trim();
  const pass = document.getElementById("admin-pass-field").value.trim();
  
  if (user === "admin" && pass === "password") {
    State.adminIsLoggedIn = true;
    document.getElementById("admin-login-cover").classList.add("hide");
    State.save();
    renderAdminDashboard();
  } else {
    const err = document.getElementById("admin-login-error");
    err.classList.remove("hide");
    setTimeout(() => err.classList.add("hide"), 3000);
  }
}

function switchAdminTab(tabName) {
  State.adminTab = tabName;
  
  const btnO = document.getElementById("admin-tab-btn-orders");
  const btnP = document.getElementById("admin-tab-btn-products");
  
  const tabO = document.getElementById("admin-content-orders");
  const tabP = document.getElementById("admin-content-products");

  if (tabName === "orders") {
    btnO.classList.add("active");
    btnP.classList.remove("active");
    tabO.classList.remove("hide");
    tabP.classList.add("hide");
  } else {
    btnO.classList.remove("active");
    btnP.classList.add("active");
    tabO.classList.add("hide");
    tabP.classList.remove("hide");
  }
  
  renderAdminDashboard();
}

function setAdminShippingFilter(filter) {
  State.adminShippingFilter = filter;
  document.getElementById("ship-filter-all").className = filter === "all" ? "active" : "";
  document.getElementById("ship-filter-delivery").className = filter === "delivery" ? "active" : "";
  document.getElementById("ship-filter-pickup").className = filter === "pickup" ? "active" : "";
  renderAdminOrders();
}

function setAdminStatusFilter(status) {
  State.adminStatusFilter = status;
  renderStatusFilterChips();
  renderAdminOrders();
}

function handleAdminSearch(val) {
  State.adminSearchQuery = val;
  renderAdminOrders();
}

/* Dynamic UI rendering indicators for orders statuses */
const ORDER_STATUS_KEYS = ["all", "payment_review", "shipped", "completed", "cancelled"];

function renderStatusFilterChips() {
  const container = document.getElementById("admin-status-chips");
  if (!container) return;
  let html = "";
  
  ORDER_STATUS_KEYS.forEach(k => {
    const count = k === "all" ? State.orders.length : State.orders.filter(o => o.status === k).length;
    // Don't render empty category count chips
    if (count === 0 && k !== "all") return;

    const isSelected = State.adminStatusFilter === k;
    const label = k === "all" ? t("admin.orders.filter_all") : t(`admin.status.${k}`);
    
    html += `<button onclick="setAdminStatusFilter('${k}')" class="${isSelected ? 'active' : ''}">
      ${label} (${count})
    </button>`;
  });
  container.innerHTML = html;
}


/* Main Administration view drawing */
function renderAdminDashboard() {
  if (!State.adminIsLoggedIn) return;

  // KPIs metrics computations
  const revenue = State.orders.reduce((sum, o) => ["shipped", "completed"].includes(o.status) ? sum + o.total : sum, 0);
  const pendingSlips = State.orders.filter(o => o.slip.status === "pending").length;
  const activeShips = State.orders.filter(o => ["shipped"].includes(o.status)).length;
  const totalOrders = State.orders.length;

  document.getElementById("kpi-revenue").innerText = moneyFormat(revenue);
  document.getElementById("kpi-pending").innerText = pendingSlips;
  document.getElementById("kpi-active").innerText = activeShips;
  document.getElementById("kpi-total").innerText = totalOrders;

  // Pulse alerts classes
  const pendingKpi = document.getElementById("kpi-card-pending");
  if (pendingSlips > 0) {
    pendingKpi.classList.add("alert-ping");
  } else {
    pendingKpi.classList.remove("alert-ping");
  }

  // Core badges counters
  const titleSubtitle = document.getElementById("admin-stats-summary-subtitle");
  titleSubtitle.innerText = t("admin.stats_summary", { orders: totalOrders, products: State.products.length });
  
  const badgeContainer = document.getElementById("admin-badge-pending-container");
  const badgeText = document.getElementById("admin-badge-pending-text");
  const tabBadge = document.getElementById("admin-tab-badge-orders-count");

  if (pendingSlips > 0) {
    badgeContainer.classList.remove("hide");
    badgeText.innerText = t("admin.pending_badge", { count: pendingSlips });
    tabBadge.classList.remove("hide");
    tabBadge.innerText = pendingSlips;
  } else {
    badgeContainer.classList.add("hide");
    tabBadge.classList.add("hide");
  }

  // Draw active Tab layouts
  if (State.adminTab === "orders") {
    renderStatusFilterChips();
    renderAdminStatusOverviewGauge();
    renderAdminOrders();
  } else {
    renderAdminProductCategoryChips();
    renderAdminProducts();
  }
}

/* Draws active orders grid lists */
let expandedOrders = new Set();

function toggleOrderExpansion(orderId) {
  if (expandedOrders.has(orderId)) {
    expandedOrders.delete(orderId);
  } else {
    expandedOrders.add(orderId);
  }
  renderAdminOrders();
}

function renderAdminOrders() {
  const container = document.getElementById("admin-orders-rows-container");
  
  // Multi-criteria filter mapping
  const filtered = State.orders.filter(o => {
    const matchStatus = State.adminStatusFilter === "all" || o.status === State.adminStatusFilter;
    
    const q = State.adminSearchQuery.toLowerCase().trim();
    const matchSearch = !q || o.customer.name.toLowerCase().includes(q) || o.customer.phone.includes(q) || o.id.toLowerCase().includes(q);

    const isPickup = o.customer.address.includes("รับเอง");
    const matchShipping = State.adminShippingFilter === "all" || 
                         (State.adminShippingFilter === "pickup" && isPickup) ||
                         (State.adminShippingFilter === "delivery" && !isPickup);
                         
    return matchStatus && matchSearch && matchShipping;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-products" style="background:white; border-radius:18px; border:1px solid #f1f5f9; padding:48px 0;">
      <i data-lucide="alert-circle" style="width: 32px; height: 32px; color:#cbd5e1; margin:0 auto 8px auto; display:block;"></i>
      <p>${t("admin.orders.empty")}</p>
    </div>`;
    lucide.createIcons();
    return;
  }

  let html = "";
  filtered.forEach(o => {
    const isExpanded = expandedOrders.has(o.id);
    const isPickup = o.customer.address.includes("รับเอง");
    const relativeTime = calcTimeAgo(o.createdAt);
    
    // Status Stepper Progress indexing calculations
    const currentStageIdx = TIMELINE_ORDER_STAGES.indexOf(o.status === "paid" || o.status === "packing" ? "shipped" : o.status);

    html += `<div class="admin-order-row ${isExpanded ? 'expanded' : ''} fade-in">
      <button class="admin-order-row-btn" onclick="toggleOrderExpansion('${o.id}')">
        <div class="admin-order-meta">
          <span class="admin-order-status-dot ${o.status}"></span>
          <div class="admin-order-info">
            <p class="admin-order-customer">${o.customer.name}</p>
            <div class="admin-order-subtext">
              <span>#${o.id.slice(-8)}</span>
              <span>·</span>
              <span>${isPickup ? '🏪 รับเอง' : '🚚 จัดส่ง'}</span>
              <span>·</span>
              <span>${relativeTime}</span>
            </div>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:12px;">
          <div class="admin-order-amount">${moneyFormat(o.total)}</div>
          <span class="admin-order-badge-status ${o.status}">${getOrderStatusLabel(o)}</span>
          <i data-lucide="${isExpanded ? 'chevron-up' : 'chevron-down'}" style="width:16px; height:16px; color:#94a3b8;"></i>
        </div>
      </button>

      ${isExpanded ? `
        <div class="admin-order-expander">
          <div class="admin-order-grid">
            <!-- Shipping label details column -->
            <div class="admin-label-card">
              <div class="admin-label-card-title">${isPickup ? t("admin.order.pickup_label") : t("admin.order.shipping_label")}</div>
              <div class="admin-label-row">
                <span class="admin-label-row-head">${isPickup ? t("admin.order.pickup_details") : t("admin.order.address")}</span>
                <span class="admin-label-row-val">${o.customer.address}</span>
              </div>
              <div class="admin-label-row">
                <span class="admin-label-row-head">${t("admin.order.phone")}</span>
                <span class="admin-label-row-val admin-label-row-phone">${o.customer.phone}</span>
              </div>
              <div class="admin-label-row" style="margin-bottom:0;">
                <span class="admin-label-row-head">${t("admin.order.item")}</span>
                <span class="admin-label-row-val" style="font-size:12px; color:hsl(var(--primary)); font-weight:800;">
                  ${o.items.map(item => `${item.name} × ${item.quantity}`).join(", ")}
                </span>
              </div>
            </div>

            <!-- Slip Review / Stepper logistics column -->
            <div style="display:flex; flex-direction:column; gap:12px;">
              ${o.status === "payment_review" ? `
                <div class="admin-order-slip-review">
                  <div class="admin-label-card-title">${t("admin.order.slip_status")}</div>
                  <div class="admin-slip-thumbnail" onclick="openLightbox('${o.slip.imageUrl}')">
                    <img src="${o.slip.imageUrl}" alt="slip thumbnail">
                    <div class="admin-slip-zoom-badge">
                      <i data-lucide="eye" style="width:14px; height:14px;"></i>
                      <span>${t("admin.slip.view")}</span>
                    </div>
                  </div>
                  <div class="admin-slip-actions">
                    <button onclick="approveOrderPaymentSlip('${o.id}', false)" class="btn btn-danger" style="flex: 1;">${t("admin.slip.reject")}</button>
                    <button onclick="approveOrderPaymentSlip('${o.id}', true)" class="btn btn-primary" style="background:#10b981; box-shadow:none; flex: 1;">${t("admin.slip.approve")}</button>
                  </div>
                </div>
              ` : `
                <div class="admin-order-lifecycle">
                  <div class="lifecycle-title">การจัดส่ง (Logistics)</div>
                  
                  <div class="lifecycle-stepper">
                    <div class="lifecycle-stepper-active-line" style="width: ${currentStageIdx <= 0 ? '0%' : `${(currentStageIdx / 2) * 88}%`}"></div>
                    <div class="lifecycle-step ${currentStageIdx >= 0 ? 'done' : ''} ${o.status === 'payment_review' ? 'active' : ''}">
                      <div class="lifecycle-node">1</div>
                      <span class="lifecycle-label">รอตรวจสลิป</span>
                    </div>
                    <div class="lifecycle-step ${currentStageIdx > 0 ? 'done' : ''} ${o.status === 'shipped' ? 'active' : ''}">
                      <div class="lifecycle-node">2</div>
                      <span class="lifecycle-label">${isPickup ? 'รอรับของ' : 'จัดส่งแล้ว'}</span>
                    </div>
                    <div class="lifecycle-step ${o.status === 'completed' ? 'done active' : ''}">
                      <div class="lifecycle-node">3</div>
                      <span class="lifecycle-label">สำเร็จ</span>
                    </div>
                  </div>

                  <div class="lifecycle-action-row">
                    ${o.status === 'completed' ? `
                      <span style="font-size:11px; font-weight:700; color:#10b981; display:flex; align-items:center; gap:4px;">
                        <i data-lucide="check-circle2" style="width:14px; height:14px;"></i> ${t("admin.order.is_completed")}
                      </span>
                    ` : o.status === 'cancelled' ? `
                      <span style="font-size:11px; font-weight:700; color:#ef4444;">${t("admin.status.cancelled")}</span>
                    ` : `
                      <button onclick="cancelAdminOrder('${o.id}')" class="btn btn-danger btn-lifecycle" style="padding:6px 10px;">ยกเลิกออเดอร์</button>
                      <div class="lifecycle-action-btn-group">
                        ${o.status === 'shipped' ? `
                          <button onclick="transitionOrderStage('${o.id}', 'payment_review')" class="btn btn-secondary btn-lifecycle">ย้อนกลับ</button>
                          <button onclick="transitionOrderStage('${o.id}', 'completed')" class="btn btn-primary" style="background:#10b981; box-shadow:none; padding:8px 12px; font-size:11px; border-radius:8px;">เสร็จสิ้นออเดอร์</button>
                        ` : ''}
                      </div>
                    `}
                  </div>
                </div>
              `}
            </div>
          </div>
        </div>
      ` : ''}
    </div>`;
  });
  container.innerHTML = html;
  lucide.createIcons();
}

function calcTimeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return State.lang === "th" ? "เมื่อกี้" : "just now";
  if (m < 60) return State.lang === "th" ? `${m} นาทีที่แล้ว` : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return State.lang === "th" ? `${h} ชั่วโมงที่แล้ว` : `${h}h ago`;
  return State.lang === "th" ? `${Math.floor(h / 24)} วันที่แล้ว` : `${Math.floor(h / 24)}d ago`;
}

/* Redesigned Admin Helper Functions */
function renderAdminStatusOverviewGauge() {
  const total = State.orders.length;
  const gauge = document.getElementById("admin-segmented-status-gauge");
  const legend = document.getElementById("admin-status-legend");
  if (!gauge || !legend) return;

  if (total === 0) {
    gauge.innerHTML = `<div class="gauge-segment" style="width: 100%; background: #cbd5e1;" title="No orders"></div>`;
    legend.innerHTML = `<span>${t("admin.orders.empty")}</span>`;
    return;
  }

  // Aggregate counts by status
  const statusCounts = {};
  const statusValue = {};
  ORDER_STATUS_KEYS.forEach(k => {
    if (k === "all") return;
    statusCounts[k] = State.orders.filter(o => o.status === k).length;
    statusValue[k] = State.orders.filter(o => o.status === k).reduce((sum, o) => sum + o.total, 0);
  });

  let gaugeHtml = "";
  let legendHtml = "";

  ORDER_STATUS_KEYS.forEach(k => {
    if (k === "all") return;
    const count = statusCounts[k];
    if (count === 0) return;

    const pct = ((count / total) * 100).toFixed(1);
    const label = t(`admin.status.${k}`);
    const color = k;

    gaugeHtml += `<div class="gauge-segment ${color}" 
      style="width: ${pct}%;" 
      onclick="setAdminStatusFilter('${k}')"
      title="${label}: ${count} ${t("shop.items_count")} (${pct}%) · ${moneyFormat(statusValue[k])}"></div>`;

    legendHtml += `<div class="legend-item" style="cursor: pointer;" onclick="setAdminStatusFilter('${k}')">
      <span class="legend-color-dot ${color}"></span>
      <span>${label} (${count})</span>
    </div>`;
  });

  gauge.innerHTML = gaugeHtml;
  legend.innerHTML = legendHtml;
}

function copyShippingAddressToClipboard(orderId, name, phone, address) {
  const text = `${name}\n${phone}\n${address}`;
  navigator.clipboard.writeText(text).then(() => {
    showToast(t("admin.toast.address_copied"));
  }).catch(err => {
    console.error("Clipboard copy failed, using backup method", err);
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    showToast(t("admin.toast.address_copied"));
  });
}

function openPrintLabelModal(orderId) {
  const order = State.orders.find(o => o.id === orderId);
  if (!order) return;

  const isPickup = order.customer.address.includes("รับเอง");
  
  const printContent = `
    <div class="admin-label-card" style="border: 2px dashed #000; box-shadow: none; margin: 0 auto; max-width: 100%;">
      <div class="admin-label-postal-header">
        <span class="postal-logo">HLLC POSTAL SERVICES</span>
        <span class="postal-class-badge">${isPickup ? "SELF-PICKUP" : "DOMESTIC COURIER"}</span>
      </div>
      <div class="admin-label-address-grid" style="display: grid; grid-template-columns: 1fr 1.5fr; gap: 16px; border-bottom: 1px solid #000; padding-bottom: 12px; margin-bottom: 12px;">
        <div class="address-col-box sender" style="border-right: 1px dashed #000; padding-right: 12px;">
          <span class="address-label-small">${t("admin.label.sender")}</span>
          <div class="address-text-content">
            HLLC Store E-Com Dept.<br>
            456 Brand Center Rd.<br>
            Bangkok, Thailand 10400
          </div>
        </div>
        <div class="address-col-box recipient" style="padding-left: 12px;">
          <span class="address-label-small">${t("admin.label.recipient")}</span>
          <div class="address-text-content" style="font-size: 13px;">
            <strong>${order.customer.name}</strong><br>
            ${order.customer.address}
            <span class="recipient-phone-big" style="color: #000; margin-top: 4px; display: block; font-family: monospace; font-size: 14px; font-weight: 800;">${order.customer.phone}</span>
          </div>
        </div>
      </div>
      <div class="barcode-widget">
        <span></span><span class="thick"></span><span></span><span></span><span class="wide"></span><span></span><span class="thick"></span><span class="wide"></span><span></span><span></span><span class="thick"></span><span></span>
      </div>
      <div class="barcode-value" style="color: #000; font-weight: 800;">#HLLC-${order.id.slice(-8).toUpperCase()}</div>
      <div style="border-top: 1px dashed #000; padding-top: 10px; margin-top: 10px; font-size: 10px;">
        <span class="address-label-small">${t("admin.order.item")}</span>
        <div style="font-weight: 700; color: #000;">
          ${order.items.map(item => `${item.name} × ${item.quantity}`).join(", ")}
        </div>
      </div>
    </div>
  `;

  document.getElementById("print-area-wrapper").innerHTML = printContent;
  document.getElementById("admin-print-modal").classList.remove("hide");
}

function closePrintLabelModal() {
  document.getElementById("admin-print-modal").classList.add("hide");
}

function triggerPhysicalPrint() {
  window.print();
}

// Product CRUD inventory search and filter helpers
function handleAdminProductSearch(val) {
  State.adminProductSearchQuery = val;
  renderAdminProducts();
}

function setAdminProductCategoryFilter(category) {
  State.adminProductCategoryFilter = category;
  renderAdminProductCategoryChips();
  renderAdminProducts();
}

function renderAdminProductCategoryChips() {
  const filterContainer = document.getElementById("admin-product-categories-filter");
  if (!filterContainer) return;

  const uniqueCats = new Set();
  State.products.forEach(p => {
    if (p.category) uniqueCats.add(p.category);
  });

  const catArray = ["all", ...Array.from(uniqueCats)];
  let html = "";

  catArray.forEach(cat => {
    const isSelected = (State.adminProductCategoryFilter || "all") === cat;
    const label = cat === "all" ? t("admin.orders.filter_all") : cat;

    html += `<button type="button" onclick="setAdminProductCategoryFilter('${cat}')" class="${isSelected ? 'active' : ''}" style="border:none; padding:4px 10px; font-size:10px; font-weight:700; border-radius:100px; cursor:pointer; background: transparent; color: #64748b; margin-right: 4px; transition: var(--transition-fast);">
      ${label}
    </button>`;
  });

  filterContainer.innerHTML = html;
  
  // Inject some interactive quick CSS for active buttons directly
  const buttons = filterContainer.querySelectorAll("button");
  buttons.forEach(btn => {
    if (btn.classList.contains("active")) {
      btn.style.background = "hsl(var(--primary))";
      btn.style.color = "white";
    } else {
      btn.style.background = "#f1f5f9";
      btn.style.color = "#475569";
    }
  });
}


/* Approved or Rejects Order payment receipt slips */
function approveOrderPaymentSlip(orderId, approved) {
  const order = State.orders.find(o => o.id === orderId);
  if (!order) return;

  const title = approved ? t("admin.modal.approve_title") : t("admin.modal.reject_title");
  const desc = approved ? t("admin.modal.approve_desc") : t("admin.modal.reject_desc");

  showDialog(approved ? "check-circle" : "x-circle", title, desc, () => {
    if (approved) {
      order.status = "shipped";
      order.slip.status = "approved";
      showToast(t("admin.toast.slip_approved"));
    } else {
      order.status = "cancelled";
      order.slip.status = "rejected";
      showToast(t("admin.toast.slip_rejected"));
    }
    State.save();
    renderAdminDashboard();
    
    // Instant update user active order tracker details
    if (State.checkoutProduct && State.createdOrderId === orderId) {
      updateCheckoutModalUI();
    }
  });
}

/* Advances logistic stages statuses */
function transitionOrderStage(orderId, nextStatus) {
  const order = State.orders.find(o => o.id === orderId);
  if (!order) return;

  const statusDesc = getOrderStatusLabel({ ...order, status: nextStatus });
  showDialog("truck", t("admin.modal.status_title"), t("admin.modal.status_desc", { status: statusDesc }), () => {
    order.status = nextStatus;
    State.save();
    showToast(t("admin.toast.product_updated"));
    renderAdminDashboard();
    
    // Instant update user tracking if viewing the active order checkout
    if (State.checkoutProduct && State.createdOrderId === orderId) {
      updateCheckoutModalUI();
    }
  });
}

/* Cancel and void orders admin tools */
function cancelAdminOrder(orderId) {
  const order = State.orders.find(o => o.id === orderId);
  if (!order) return;

  showDialog("alert-triangle", t("admin.modal.cancel_title"), t("admin.modal.cancel_desc"), () => {
    order.status = "cancelled";
    State.save();
    showToast("ยกเลิกคำสั่งซื้อแล้ว");
    renderAdminDashboard();
    
    if (State.checkoutProduct && State.createdOrderId === orderId) {
      updateCheckoutModalUI();
    }
  });
}

