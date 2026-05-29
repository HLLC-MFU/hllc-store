/* ============================================
   HLLC E-Commerce — Checkout & Logistics
   Order sheet, receipt slip uploads, customer tracking timeline
   ============================================ */

/* ─── CHECKOUT MODAL OPERATIONS (ORDER SHEET) ─────────── */
function openCheckout(productId) {
  const product = State.products.find(p => p.id === productId);
  if (!product) return;

  State.checkoutProduct = product;
  State.checkoutStep = 1;
  State.checkoutQty = 1;
  State.checkoutDeliveryMode = "delivery";
  State.checkoutProvince = "";
  State.checkoutSlipPreview = null;
  State.checkoutSlipFile = null;
  State.createdOrderId = null;
  
  State.checkoutSelectedVariants = {};
  
  // Carry over variant selection from card if exists
  if (cardSelectedVariants[productId]) {
    State.checkoutSelectedVariants = { ...cardSelectedVariants[productId] };
  }
  
  // Default to first option for any remaining variants
  if (product.variants && product.variants.length > 0) {
    product.variants.forEach(v => {
      if (!State.checkoutSelectedVariants[v.name]) {
        State.checkoutSelectedVariants[v.name] = v.options[0];
      }
    });
  }

  // Check shown active image on card to set gallery start view
  const cardImg = document.getElementById(`shop-card-img-${productId}`);
  if (cardImg && product.imageUrls && product.imageUrls.includes(cardImg.src)) {
    State.checkoutActiveImageUrl = cardImg.src;
  } else {
    State.checkoutActiveImageUrl = null;
  }

  // Unblock scroll
  document.body.style.overflow = "hidden";
  
  document.getElementById("checkout-modal").classList.remove("hide");
  
  // Initialize inputs fields
  document.getElementById("field-firstname").value = "";
  document.getElementById("field-lastname").value = "";
  document.getElementById("field-street").value = "";
  document.getElementById("field-district").value = "";
  document.getElementById("field-postal").value = "";
  document.getElementById("field-phone").value = "";
  
  document.getElementById("field-pickup-name").value = "";
  document.getElementById("field-pickup-time").value = "";
  document.getElementById("field-pickup-phone").value = "";
  
  updateCheckoutModalUI();
}

function closeCheckout() {
  document.getElementById("checkout-modal").classList.add("hide");
  document.body.style.overflow = "";
  State.checkoutProduct = null;
}

function updateCheckoutModalUI() {
  const p = State.checkoutProduct;
  if (!p) return;

  const currentStep = State.checkoutStep;
  
  // Update Stepper progresses
  document.getElementById("checkout-step-stepper").className = `step-bar step-current-${currentStep}`;
  for (let i = 1; i <= 3; i++) {
    const node = document.getElementById(`checkout-step-node-${i}`);
    if (node) {
      node.className = `step-item ${currentStep === i ? 'active' : (currentStep > i || currentStep === 'success' ? 'done' : '')}`;
    }
  }

  // Hide or show Step view segments
  document.getElementById("checkout-step-stepper").classList.remove("hide");
  document.getElementById("checkout-back-btn").style.opacity = currentStep === 1 ? "0.3" : "1";
  document.getElementById("checkout-back-btn").style.pointerEvents = currentStep === 1 ? "none" : "auto";

  document.getElementById("checkout-step-1").classList.add("hide");
  document.getElementById("checkout-step-2").classList.add("hide");
  document.getElementById("checkout-step-3").classList.add("hide");
  document.getElementById("checkout-step-success").classList.add("hide");

  if (currentStep === 1) {
    document.getElementById("checkout-step-1").classList.remove("hide");
    
    // Render item metadata
    const imgContainer = document.getElementById("checkout-item-image-container");
    const images = p.imageUrls && p.imageUrls.length > 0 ? p.imageUrls : (p.imageUrl ? [p.imageUrl] : []);
    const activeImg = State.checkoutActiveImageUrl || (images.length > 0 ? images[0] : null);
    
    if (images.length > 0) {
      let carouselHtml = `
        <div class="checkout-gallery-wrapper">
          <img id="checkout-main-gallery-img" src="${activeImg}" class="checkout-product-img" alt="${getDisplayProductName(p)}" onerror="handleImgError(this, '${p.gradient || 'from-slate-400 to-slate-600'}', '${p.emoji || '📦'}')">
      `;
      if (images.length > 1) {
        carouselHtml += `<div class="checkout-gallery-thumbnails">`;
        images.forEach((imgUrl, index) => {
          const isSelected = imgUrl === activeImg;
          carouselHtml += `
            <div class="checkout-gallery-thumb ${isSelected ? 'active' : ''}" onclick="switchCheckoutGalleryImage(this, '${imgUrl}')">
              <img src="${imgUrl}" onerror="this.src='https://picsum.photos/seed/error/40/40';">
            </div>
          `;
        });
        carouselHtml += `</div>`;
      }
      carouselHtml += `</div>`;
      imgContainer.innerHTML = carouselHtml;
    } else {
      imgContainer.innerHTML = `<div class="checkout-product-placeholder bg-gradient-to-br ${p.gradient || 'from-slate-400 to-slate-600'}"><span style="font-size:24px;">${p.emoji || '📦'}</span></div>`;
    }
    
    document.getElementById("checkout-item-name").innerText = getDisplayProductName(p);
    document.getElementById("checkout-item-desc").innerText = getDisplayProductDesc(p);
    document.getElementById("checkout-item-price").innerText = moneyFormat(p.price);
    document.getElementById("checkout-item-qty").innerText = State.checkoutQty;

    // Render product variants if any
    const varContainer = document.getElementById("checkout-variants-container");
    if (varContainer) {
      if (p.variants && p.variants.length > 0) {
        let varHtml = "";
        p.variants.forEach((v, vIdx) => {
          varHtml += `
            <div class="input-group" style="margin-bottom: 0;">
              <label class="input-label" style="margin-bottom: 4px; font-weight: 800;">เลือก ${v.name}</label>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          `;
          v.options.forEach(opt => {
            const isSelected = State.checkoutSelectedVariants && State.checkoutSelectedVariants[v.name] === opt;
            varHtml += `
              <button type="button" class="variant-pill-btn" onclick="selectCheckoutVariant('${v.name}', '${opt}')" style="
                border: 1px solid ${isSelected ? 'hsl(var(--primary))' : '#cbd5e1'};
                background: ${isSelected ? 'rgba(133, 36, 31, 0.05)' : 'white'};
                color: ${isSelected ? 'hsl(var(--primary))' : '#1e293b'};
                padding: 6px 12px;
                border-radius: 8px;
                font-size: 12px;
                font-weight: 700;
                cursor: pointer;
                transition: var(--transition-fast);
              ">
                ${opt}
              </button>
            `;
          });
          varHtml += `
              </div>
            </div>
          `;
        });
        varContainer.innerHTML = varHtml;
        varContainer.classList.remove("hide");
      } else {
        varContainer.innerHTML = "";
        varContainer.classList.add("hide");
      }
    }
    
    // Calculate breakdowns
    const total = p.price * State.checkoutQty;
    const discountVal = p.originalPrice ? (p.originalPrice - p.price) * State.checkoutQty : 0;
    
    const discRow = document.getElementById("checkout-row-discount");
    if (discountVal > 0) {
      discRow.classList.remove("hide");
      document.getElementById("checkout-val-discount").innerText = `-${moneyFormat(discountVal)}`;
    } else {
      discRow.classList.add("hide");
    }
    
    document.getElementById("checkout-val-total").innerText = moneyFormat(total);
    
    // Setup Button Action labels
    document.getElementById("checkout-action-btn").innerHTML = `<span>${t("checkout.continue")}</span>`;
    document.getElementById("checkout-modal-footer").classList.remove("hide");

  } else if (currentStep === 2) {
    document.getElementById("checkout-step-2").classList.remove("hide");
    const total = p.price * State.checkoutQty;
    document.getElementById("checkout-qr-total").innerText = moneyFormat(total);
    
    // Check slip preview boxes
    const input = document.getElementById("slip-file-input");
    const dropzone = document.getElementById("slip-upload-dropzone");
    const card = document.getElementById("slip-preview-card");
    
    if (State.checkoutSlipPreview) {
      dropzone.classList.add("hide");
      card.classList.remove("hide");
      document.getElementById("slip-preview-img").src = State.checkoutSlipPreview;
    } else {
      dropzone.classList.remove("hide");
      card.classList.add("hide");
    }
    
    // Step button enabled validations check
    const btn = document.getElementById("checkout-action-btn");
    btn.disabled = !State.checkoutSlipFile;
    btn.innerHTML = `<span>${t("checkout.continue")}</span>`;
    document.getElementById("checkout-modal-footer").classList.remove("hide");

  } else if (currentStep === 3) {
    document.getElementById("checkout-step-3").classList.remove("hide");
    
    // Build searchable provinces dropdown
    renderProvinceDropdown();

    // Setup delivery/pickup states inputs toggling
    setDeliveryMode(State.checkoutDeliveryMode);

    const btn = document.getElementById("checkout-action-btn");
    btn.disabled = false;
    const total = p.price * State.checkoutQty;
    btn.innerHTML = `<span>${t("checkout.confirm_button")} · ${moneyFormat(total)}</span>`;
    document.getElementById("checkout-modal-footer").classList.remove("hide");

  } else if (currentStep === "success") {
    document.getElementById("checkout-step-stepper").classList.add("hide");
    document.getElementById("checkout-modal-footer").classList.add("hide");
    document.getElementById("checkout-step-success").classList.remove("hide");
    
    // Populate tracking receipt summaries
    const order = State.orders.find(o => o.id === State.createdOrderId);
    if (order) {
      document.getElementById("tracking-order-id").innerText = `ORDER ID: #${order.id}`;
      document.getElementById("tracking-short-code").innerText = `CODE: #${order.id.slice(-6)}`;
      document.getElementById("tracking-receipt-address").innerText = order.customer.address;
      document.getElementById("tracking-receipt-phone").innerText = order.customer.phone;
      
      const isPickup = order.customer.address.includes("รับเอง");
      const modeTag = document.getElementById("tracking-shipping-tag");
      const addressLabel = document.getElementById("tracking-receipt-address-label");
      
      modeTag.innerText = isPickup ? t("admin.order.pickup_label") : t("admin.order.shipping_label");
      addressLabel.innerText = isPickup ? t("admin.order.pickup_details") : t("admin.order.address");
      
      const shippedLabel = document.getElementById("timeline-label-shipped");
      if (shippedLabel) {
        shippedLabel.innerText = isPickup ? (State.lang === 'th' ? 'รอรับของ' : 'Ready for Pickup') : (State.lang === 'th' ? 'จัดส่งแล้ว' : 'Shipped');
      }

      // Stepper timelines highlights
      updateTrackingTimelineUI(order.status);
      
      const item = order.items[0];
      document.getElementById("tracking-purchased-name").innerText = `${item.name} × ${item.quantity}`;
      document.getElementById("tracking-purchased-total").innerText = moneyFormat(order.total);
    }
  }

  lucide.createIcons();
}

function handleCheckoutNext() {
  if (State.checkoutStep === 1) {
    State.checkoutStep = 2;
    updateCheckoutModalUI();
  } else if (State.checkoutStep === 2) {
    State.checkoutStep = 3;
    updateCheckoutModalUI();
  } else if (State.checkoutStep === 3) {
    submitNewOrderCheckout();
  }
}

function handleCheckoutBack() {
  if (State.checkoutStep === 2) {
    State.checkoutStep = 1;
    updateCheckoutModalUI();
  } else if (State.checkoutStep === 3) {
    State.checkoutStep = 2;
    updateCheckoutModalUI();
  }
}

function updateCheckoutQty(val) {
  const p = State.checkoutProduct;
  if (!p) return;
  
  const nextQty = State.checkoutQty + val;
  if (nextQty >= 1 && nextQty <= p.stock) {
    State.checkoutQty = nextQty;
    updateCheckoutModalUI();
  }
}

/* ─── CHECKOUT STEP 2: File uploading drag-drops handlers ─ */
function triggerSlipFileInput() {
  document.getElementById("slip-file-input").click();
}

function handleSlipFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  parseSlipFile(file);
}

function parseSlipFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    State.checkoutSlipPreview = e.target.result;
    State.checkoutSlipFile = "uploaded-slip"; // non-empty mockup check
    updateCheckoutModalUI();
  };
  reader.readAsDataURL(file);
}

function removeSelectedSlip() {
  State.checkoutSlipPreview = null;
  State.checkoutSlipFile = null;
  document.getElementById("slip-file-input").value = "";
  updateCheckoutModalUI();
}

/* ─── CHECKOUT STEP 3: Delivery Forms Toggle ──────────── */
function setDeliveryMode(mode) {
  State.checkoutDeliveryMode = mode;
  
  const btnDel = document.getElementById("del-mode-btn-delivery");
  const btnPick = document.getElementById("del-mode-btn-pickup");
  
  const formDel = document.getElementById("form-delivery-inputs");
  const formPick = document.getElementById("form-pickup-inputs");

  if (mode === "delivery") {
    btnDel.classList.add("active");
    btnPick.classList.remove("active");
    formDel.classList.remove("hide");
    formPick.classList.add("hide");
  } else {
    btnDel.classList.remove("active");
    btnPick.classList.add("active");
    formDel.classList.add("hide");
    formPick.classList.remove("hide");
  }
}

// Formats telephone format immediately inside inputs fields
function formatPhoneInput(el) {
  const raw = el.value.replace(/\D/g, "").slice(0, 10);
  if (raw.length <= 3) {
    el.value = raw;
  } else if (raw.length <= 6) {
    el.value = `${raw.slice(0, 3)}-${raw.slice(3)}`;
  } else {
    el.value = `${raw.slice(0, 3)}-${raw.slice(3, 6)}-${raw.slice(6)}`;
  }
}

/* Searchable Provinces Select component scripts */
let provinceSearchQuery = "";

function renderProvinceDropdown() {
  const list = document.getElementById("province-options-list");
  const triggerText = document.getElementById("province-selected-txt");
  const trigger = document.getElementById("province-select-trigger");
  
  if (State.checkoutProvince) {
    triggerText.innerText = State.checkoutProvince;
    trigger.className = "province-btn";
  } else {
    triggerText.innerText = t("checkout.select_province");
    trigger.className = "province-btn placeholder";
  }

  const filtered = PROVINCES.filter(p => p.includes(provinceSearchQuery));
  
  let html = "";
  if (filtered.length === 0) {
    html = `<div style="padding:12px; font-size:12px; color:#cbd5e1; text-align:center;">${t("checkout.no_province")}</div>`;
  } else {
    filtered.forEach(p => {
      const isSelected = State.checkoutProvince === p;
      html += `<button type="button" class="province-option ${isSelected ? 'selected' : ''}" onclick="selectProvinceOption('${p}')">
        <span>${p}</span>
        ${isSelected ? '<span style="color:hsl(var(--primary));">✓</span>' : ''}
      </button>`;
    });
  }
  list.innerHTML = html;
}

function toggleProvinceMenu() {
  const menu = document.getElementById("province-dropdown-menu");
  const isHidden = menu.classList.contains("hide");
  if (isHidden) {
    menu.classList.remove("hide");
    document.getElementById("province-search").focus();
    provinceSearchQuery = "";
    document.getElementById("province-search").value = "";
    renderProvinceDropdown();
  } else {
    menu.classList.add("hide");
  }
}

function selectProvinceOption(p) {
  State.checkoutProvince = p;
  document.getElementById("province-dropdown-menu").classList.add("hide");
  updateCheckoutModalUI();
}

function filterProvinceOptions(val) {
  provinceSearchQuery = val;
  renderProvinceDropdown();
}

// Close province select if click outside
document.addEventListener("mousedown", (e) => {
  const container = document.querySelector(".province-dropdown-container");
  if (container && !container.contains(e.target)) {
    const menu = document.getElementById("province-dropdown-menu");
    if (menu) menu.classList.add("hide");
  }
});

/* ─── TIMELINE ENGINE FOR CLIENT LOGISTICS TRACKER ──────── */
const TIMELINE_ORDER_STAGES = ["payment_review", "shipped", "completed"];

function getOrderStatusLabel(o) {
  if (o.status === "shipped") {
    const isPickup = o.customer.address.includes("รับเอง");
    if (isPickup) {
      return State.lang === "th" ? "รอรับของ" : "Ready for Pickup";
    } else {
      return State.lang === "th" ? "จัดส่งแล้ว" : "Shipped";
    }
  }
  return t(`admin.status.${o.status}`);
}

function updateTrackingTimelineUI(status) {
  let mappedStatus = status;
  if (status === "paid" || status === "packing") {
    mappedStatus = "shipped";
  }

  let activeIndex = TIMELINE_ORDER_STAGES.indexOf(mappedStatus);
  const isCancelled = status === "cancelled";
  const timelinesBox = document.querySelector(".timeline-card");
  
  if (isCancelled) {
    timelinesBox.innerHTML = `<div class="timeline-header" data-t="admin.order.slip_status">${t("admin.order.slip_status")}</div>
      <div style="background:#fef2f2; border:1px solid #fee2e2; border-radius:12px; padding:12px; display:flex; align-items:center; gap:8px; color:#b91c1c; font-size:12px; font-weight:700;">
        <i data-lucide="alert-triangle"></i>
        <div>
          <p>${State.lang === 'th' ? 'คำสั่งซื้อถูกยกเลิก' : 'Order Cancelled'}</p>
          <p style="font-size:10px; font-weight:500; opacity:0.8; margin-top:2px;">${State.lang === 'th' ? 'คำสั่งซื้อนี้ถูกยกเลิกแล้วโดยผู้ดูแลระบบ' : 'This order has been cancelled by administrator.'}</p>
        </div>
      </div>`;
    lucide.createIcons();
    return;
  }

  // Standard progress timeline line
  const bar = document.getElementById("timeline-bar-progress");
  if (activeIndex <= 0) {
    bar.style.width = "0%";
  } else {
    bar.style.width = `${(activeIndex / (TIMELINE_ORDER_STAGES.length - 1)) * 90}%`;
  }

  const nodes = [
    document.getElementById("timeline-node-review"),
    document.getElementById("timeline-node-shipped"),
    document.getElementById("timeline-node-completed")
  ];

  nodes.forEach((node, idx) => {
    if (!node) return;
    const num = node.querySelector(".timeline-node");
    if (idx < activeIndex || status === "completed") {
      node.className = "timeline-step done";
      num.innerText = "✓";
    } else if (idx === activeIndex) {
      node.className = "timeline-step active";
      num.innerText = idx + 1;
    } else {
      node.className = "timeline-step";
      num.innerText = idx + 1;
    }
  });
}

// Handles dynamic checkout creation local submissions
function submitNewOrderCheckout() {
  const p = State.checkoutProduct;
  if (!p) return;

  const isPickup = State.checkoutDeliveryMode === "pickup";
  let fullName, phoneNum, fullAddress;

  if (isPickup) {
    const name = document.getElementById("field-pickup-name").value.trim();
    const time = document.getElementById("field-pickup-time").value.trim();
    const phone = document.getElementById("field-pickup-phone").value.replace(/\D/g, "");

    if (!name || !time || phone.length < 9) {
      alert(t("checkout.error.fill_fields"));
      return;
    }
    fullName = name;
    phoneNum = document.getElementById("field-pickup-phone").value;
    fullAddress = `รับเองที่ D1 — เวลา ${time}`;
  } else {
    const fn = document.getElementById("field-firstname").value.trim();
    const ln = document.getElementById("field-lastname").value.trim();
    const street = document.getElementById("field-street").value.trim();
    const dist = document.getElementById("field-district").value.trim();
    const prov = State.checkoutProvince;
    const post = document.getElementById("field-postal").value.trim();
    const phone = document.getElementById("field-phone").value.replace(/\D/g, "");

    if (!fn || !ln || !street || !dist || !prov || !post || phone.length < 9) {
      alert(t("checkout.error.fill_fields"));
      return;
    }
    fullName = `${fn} ${ln}`;
    phoneNum = document.getElementById("field-phone").value;
    fullAddress = `${street}, ${dist}, ${prov} ${post}`;
  }

  // Create local Order instance
  const total = p.price * State.checkoutQty;
  const orderId = "DEMO" + Math.random().toString(36).substring(2, 8).toUpperCase();
  
  // Get the variant details to display next to name
  let displayName = getDisplayProductName(p);
  if (State.checkoutSelectedVariants && Object.keys(State.checkoutSelectedVariants).length > 0) {
    const variantStrings = Object.entries(State.checkoutSelectedVariants).map(([k, v]) => `${k}: ${v}`);
    displayName += ` (${variantStrings.join(", ")})`;
  }

  const newOrder = {
    id: orderId,
    customer: { name: fullName, phone: phoneNum, address: fullAddress },
    items: [{ productId: p.id, name: displayName, price: p.price, quantity: State.checkoutQty, subtotal: total, selectedVariants: State.checkoutSelectedVariants }],
    total: total,
    status: "payment_review",
    slip: { imageUrl: State.checkoutSlipPreview || "https://picsum.photos/seed/slip/400/600", amount: total, status: "pending" },
    createdAt: new Date().toISOString()
  };

  // Subtract inventory stock locally
  p.stock -= State.checkoutQty;

  State.orders.unshift(newOrder);
  State.createdOrderId = orderId;
  State.checkoutStep = "success";
  State.save();

  showToast(State.lang === 'th' ? "สร้างคำสั่งซื้อสำเร็จ!" : "Order placed successfully!");
  updateCheckoutModalUI();
  
  // Auto refresh admin panel metrics if open
  renderAdminDashboard();
}

