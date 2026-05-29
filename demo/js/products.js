/* ============================================
   HLLC E-Commerce — Admin Product CRUD
   Add/edit products, stock status, variants, image gallery
   ============================================ */

function handleProductImgPreview(formType) {
  const inputId = formType === 'add' ? 'add-prod-img' : 'edit-prod-img';
  const previewId = formType === 'add' ? 'add-prod-img-preview' : 'edit-prod-img-preview';
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  if (!input || !preview) return;

  const url = input.value.trim();
  if (url) {
    preview.innerHTML = `<img src="${url}" style="width:100%; height:100%; object-fit:cover;" onerror="this.nextElementSibling.style.display='block'; this.style.display='none';">
                         <span style="display:none; font-size:8px; color:#ef4444; font-weight:700;">Invalid Image</span>`;
  } else {
    preview.innerHTML = `<span>No Preview</span>`;
  }
}


/* ─── ADMIN: PRODUCT INVENTORY MANAGEMENT CRUD ────────── */
function renderAdminProducts() {
  const container = document.getElementById("admin-products-grid-container");
  
  let html = "";
  State.products.forEach(p => {
    html += `<div class="admin-prod-card fade-in">
      <div class="product-img-wrapper" style="aspect-ratio: 1.5;">
        ${p.imageUrl ? `<img src="${p.imageUrl}" class="product-img" onerror="handleImgError(this, '${p.gradient || 'from-slate-400 to-slate-600'}', '${p.emoji || '📦'}')">` : `
          <div class="product-gradient-placeholder bg-gradient-to-br ${p.gradient || 'from-slate-400 to-slate-600'}">
            <span class="product-emoji" style="font-size:32px;">${p.emoji || '📦'}</span>
          </div>
        `}
        ${!p.active ? `<span class="badge-discount" style="background:#475569; right:12px; left:auto;">Inactive</span>` : ''}
      </div>
      <div class="admin-prod-card-body">
        <h4 class="admin-prod-card-name">${getDisplayProductName(p)}</h4>
        <div class="admin-prod-card-price">${moneyFormat(p.price)}</div>
        <div class="admin-prod-card-stock">
          <span>สต็อก: <strong>${p.stock}</strong> ${t("admin.products.edit.units")}</span>
        </div>
        <div class="admin-prod-card-actions">
          <button class="btn btn-secondary" onclick="openProductEditor('${p.id}')" style="padding:6px;"><i data-lucide="pencil" style="width:12px; height:12px;"></i></button>
          <button class="btn btn-danger" onclick="deleteAdminProduct('${p.id}')" style="padding:6px;"><i data-lucide="trash-2" style="width:12px; height:12px;"></i></button>
        </div>
      </div>
    </div>`;
  });
  container.innerHTML = html;
  lucide.createIcons();
}

// CREATE
let uploadedProductImageUrls = [];

window.triggerProductFileInput = function() {
  document.getElementById("product-file-input").click();
}

window.handleProductFileSelect = function(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;
  readProductFiles(files);
}

window.handleProductFileDrop = function(event) {
  event.preventDefault();
  const dropzone = document.getElementById("product-upload-dropzone");
  dropzone.style.borderColor = "#cbd5e1";
  dropzone.style.background = "#f8fafc";
  
  const files = event.dataTransfer.files;
  if (!files || files.length === 0) return;
  readProductFiles(files);
}

function readProductFiles(files) {
  const allowedFiles = Array.from(files).filter(file => file.type.startsWith("image/"));
  if (allowedFiles.length === 0) return;
  
  let loadedCount = 0;
  allowedFiles.forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedProductImageUrls.push(e.target.result);
      loadedCount++;
      if (loadedCount === allowedFiles.length) {
        updateProductUploadPreviews();
      }
    };
    reader.readAsDataURL(file);
  });
}

window.updateProductUploadPreviews = function() {
  const previewContainer = document.getElementById("add-prod-imgs-preview-container");
  if (!previewContainer) return;
  
  if (uploadedProductImageUrls.length === 0) {
    previewContainer.innerHTML = `<span style="font-size: 11px; color: #94a3b8;">ยังไม่ได้อัปโหลดรูปภาพ</span>`;
    return;
  }
  
  let html = "";
  uploadedProductImageUrls.forEach((url, index) => {
    html += `
      <div class="form-image-preview-container" style="width: 72px; height: 72px; position: relative; border-radius: 8px; overflow: hidden; border: 1px solid #cbd5e1; box-shadow: var(--shadow-sm);">
        <img src="${url}" style="width: 100%; height: 100%; object-fit: cover;">
        <button type="button" onclick="removeUploadedProductImg(${index})" style="
          position: absolute;
          top: 2px;
          right: 2px;
          background: rgba(239, 68, 68, 0.9);
          color: white;
          border: none;
          width: 18px;
          height: 18px;
          border-radius: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 10px;
          line-height: 1;
        ">✕</button>
      </div>
    `;
  });
  previewContainer.innerHTML = html;
}

window.removeUploadedProductImg = function(index) {
  uploadedProductImageUrls.splice(index, 1);
  updateProductUploadPreviews();
}

function handleProductCreation(e) {
  e.preventDefault();
  
  const name = document.getElementById("add-prod-name").value.trim();
  const price = parseFloat(document.getElementById("add-prod-price").value);
  const stock = parseInt(document.getElementById("add-prod-stock").value);
  const discount = parseInt(document.getElementById("add-prod-discount").value) || undefined;
  const desc = document.getElementById("add-prod-desc").value.trim();

  // Extract multiple image URLs from uploaded array
  const imageUrls = [...uploadedProductImageUrls];
  const firstImg = imageUrls.length > 0 ? imageUrls[0] : undefined;

  // Extract variants
  const variants = [];
  const variantRows = document.querySelectorAll(".variant-input-row");
  variantRows.forEach(row => {
    const vName = row.querySelector(".variant-name-input").value.trim();
    const vOptsRaw = row.querySelector(".variant-options-input").value.trim();
    if (vName && vOptsRaw) {
      const vOpts = vOptsRaw.split(",")
                            .map(o => o.trim())
                            .filter(o => o.length > 0);
      if (vOpts.length > 0) {
        variants.push({ name: vName, options: vOpts });
      }
    }
  });

  const colors = ["from-sky-400 to-sky-600", "from-teal-400 to-teal-600", "from-indigo-500 to-indigo-700", "from-cyan-500 to-blue-600"];
  const randColor = colors[Math.floor(Math.random() * colors.length)];

  const newP = {
    id: "mock-" + (State.products.length + 1) + "-" + Math.floor(Math.random()*100),
    name: name,
    description: desc,
    price: price,
    originalPrice: discount ? Math.round(price / (1 - discount/100)) : undefined,
    stock: stock,
    category: "อื่นๆ",
    gradient: randColor,
    emoji: "🌂",
    imageUrl: firstImg,
    imageUrls: imageUrls,
    variants: variants,
    active: true
  };

  State.products.push(newP);
  State.save();
  showToast(t("admin.toast.product_added"));
  
  // Reset forms
  document.getElementById("admin-add-product-form").reset();
  
  // Reset uploaded files state
  uploadedProductImageUrls = [];
  updateProductUploadPreviews();
  
  document.getElementById("add-prod-variants-list").innerHTML = "";
  
  renderAdminDashboard();
}

window.addVariantInputRow = function() {
  const list = document.getElementById("add-prod-variants-list");
  const row = document.createElement("div");
  row.className = "variant-input-row";
  row.style.display = "grid";
  row.style.gridTemplateColumns = "120px 1fr 40px";
  row.style.gap = "8px";
  row.style.alignItems = "center";
  row.style.background = "#f8fafc";
  row.style.padding = "10px";
  row.style.borderRadius = "8px";
  row.style.border = "1px solid #e2e8f0";
  
  row.innerHTML = `
    <input type="text" class="input-field variant-name-input" placeholder="ชื่อ (เช่น ขนาด, สี)" style="padding: 8px 12px; font-size: 13px;">
    <input type="text" class="input-field variant-options-input" placeholder="ตัวเลือก (คั่นด้วยจุลภาค เช่น S, M, L หรือ แดง, ดำ)" style="padding: 8px 12px; font-size: 13px;">
    <button type="button" class="btn btn-danger" style="padding: 8px 12px;" onclick="removeVariantInputRow(this)">
      <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
    </button>
  `;
  list.appendChild(row);
  lucide.createIcons();
}

window.removeVariantInputRow = function(btn) {
  const row = btn.closest(".variant-input-row");
  row.remove();
}

window.selectCheckoutVariant = function(varName, optValue) {
  if (!State.checkoutSelectedVariants) {
    State.checkoutSelectedVariants = {};
  }
  State.checkoutSelectedVariants[varName] = optValue;
  updateCheckoutModalUI();
}

window.switchCheckoutGalleryImage = function(thumbElement, imgUrl) {
  document.getElementById("checkout-main-gallery-img").src = imgUrl;
  State.checkoutActiveImageUrl = imgUrl;
  const thumbs = thumbElement.parentElement.querySelectorAll(".checkout-gallery-thumb");
  thumbs.forEach(t => t.classList.remove("active"));
  thumbElement.classList.add("active");
}


// UPDATE
function openProductEditor(id) {
  const p = State.products.find(item => item.id === id);
  if (!p) return;

  document.getElementById("edit-prod-id").value = p.id;
  document.getElementById("edit-prod-name").value = p.name;
  document.getElementById("edit-prod-price").value = p.price;
  document.getElementById("edit-prod-stock").value = p.stock;
  document.getElementById("edit-prod-img").value = p.imageUrl || "";
  document.getElementById("edit-prod-desc").value = p.description || "";
  document.getElementById("edit-prod-active").checked = p.active;
  
  const discPercent = p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : "";
  document.getElementById("edit-prod-discount").value = discPercent;

  document.getElementById("product-edit-modal").classList.remove("hide");
  handleProductImgPreview('edit');
}

function closeProductEditor() {
  document.getElementById("product-edit-modal").classList.add("hide");
}

function handleProductUpdateSubmit(e) {
  e.preventDefault();
  const id = document.getElementById("edit-prod-id").value;
  const p = State.products.find(item => item.id === id);
  if (!p) return;

  p.name = document.getElementById("edit-prod-name").value.trim();
  p.price = parseFloat(document.getElementById("edit-prod-price").value);
  p.stock = parseInt(document.getElementById("edit-prod-stock").value);
  p.imageUrl = document.getElementById("edit-prod-img").value.trim() || undefined;
  p.description = document.getElementById("edit-prod-desc").value.trim() || undefined;
  p.active = document.getElementById("edit-prod-active").checked;
  
  const disc = parseInt(document.getElementById("edit-prod-discount").value);
  if (disc > 0 && disc < 100) {
    p.originalPrice = Math.round(p.price / (1 - disc/100));
  } else {
    p.originalPrice = undefined;
  }

  State.save();
  closeProductEditor();
  showToast(t("admin.toast.product_updated"));
  renderAdminDashboard();
}

// DELETE
function deleteAdminProduct(id) {
  showDialog("trash-2", t("admin.products.edit.delete_confirm"), "ข้อมูลสินค้านี้จะถูกลบออกจากคลังระบบถาวร", () => {
    State.products = State.products.filter(p => p.id !== id);
    State.save();
    showToast(t("admin.toast.product_deleted"));
    renderAdminDashboard();
  });
}

