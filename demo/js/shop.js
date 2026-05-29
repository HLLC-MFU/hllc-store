/* ============================================
   HLLC E-Commerce — Shop Operations
   Category filters, product search, catalog grid
   ============================================ */

/* ─── SHOP OPERATIONS: Category filters ────────────────── */
const CATEGORIES_MAPPING = [
  { labelKey: "shop.cat.umbrella", category: "ร่ม", icon: "umbrella" },
  { labelKey: "shop.cat.raincoat", category: "เสื้อกันฝน", icon: "shirt" },
  { labelKey: "shop.cat.rainsuit", category: "ชุดกันฝน", icon: "layers" },
  { labelKey: "shop.cat.shoes", category: "รองเท้า", icon: "footprints" }
];

function renderCategoryLists() {
  const desktopSidebar = document.getElementById("shop-category-list");
  const mobileScroll = document.getElementById("shop-mobile-categories");
  
  // Render Desktop sidebar category items list
  let sidebarHtml = `<button onclick="filterShopByCategory(null)" class="category-btn ${!State.shopSelectedCategory ? 'active' : ''}">
    <i data-lucide="store" style="width: 16px; height: 16px;"></i> ${t("shop.all_products")}
  </button>`;
  
  CATEGORIES_MAPPING.forEach(item => {
    const isActive = State.shopSelectedCategory === item.category;
    sidebarHtml += `<button onclick="filterShopByCategory('${item.category}')" class="category-btn ${isActive ? 'active' : ''}">
      <i data-lucide="${item.icon}" style="width: 16px; height: 16px;"></i> ${t(item.labelKey)}
    </button>`;
  });
  desktopSidebar.innerHTML = sidebarHtml;

  // Render Mobile category scroll chips
  let mobileHtml = `<button onclick="filterShopByCategory(null)" class="${!State.shopSelectedCategory ? 'active' : ''}">
    ${t("shop.all_products")}
  </button>`;
  
  CATEGORIES_MAPPING.forEach(item => {
    const isActive = State.shopSelectedCategory === item.category;
    mobileHtml += `<button onclick="filterShopByCategory('${item.category}')" class="${isActive ? 'active' : ''}">
      ${t(item.labelKey)}
    </button>`;
  });
  mobileScroll.innerHTML = mobileHtml;
  
  lucide.createIcons();
}

function filterShopByCategory(cat) {
  State.shopSelectedCategory = cat;
  renderCategoryLists();
  renderShopProductsGrid();
}

function handleShopSearch(query) {
  State.shopSearchQuery = query;
  renderShopProductsGrid();
}


/* ─── SHOP OPERATIONS: Products catalog grid rendering ──── */
function renderShopProductsGrid() {
  const grid = document.getElementById("shop-products-grid");
  const countBadge = document.getElementById("shop-product-count");
  const categoryTitle = document.getElementById("shop-active-category-label");
  
  // Calculate category header name translations
  let currentCategoryHeader = t("shop.all_products");
  if (State.shopSelectedCategory) {
    const matched = CATEGORIES_MAPPING.find(c => c.category === State.shopSelectedCategory);
    currentCategoryHeader = matched ? t(matched.labelKey) : State.shopSelectedCategory;
  }
  categoryTitle.innerText = currentCategoryHeader;

  // Filter catalog products
  const filtered = State.products.filter(p => {
    if (!p.active) return false;
    const matchCat = !State.shopSelectedCategory || p.category === State.shopSelectedCategory;
    const matchSearch = !State.shopSearchQuery || getDisplayProductName(p).toLowerCase().includes(State.shopSearchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  countBadge.innerText = `(${filtered.length} ${t("shop.items_count")})`;

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty-products">
      <i data-lucide="package" style="width: 48px; height: 48px; margin: 0 auto 12px auto; display:block;"></i>
      <p>${State.shopSearchQuery ? t("shop.no_results") : t("shop.no_category")}</p>
    </div>`;
    lucide.createIcons();
    return;
  }

  let cardsHtml = "";
  filtered.forEach(p => {
    const discountRate = p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;
    const isOutOfStock = p.stock < 1;
    
    // Single image setup (No dots switcher or pills on the shop card itself!)
    let imageHtml = "";
    if (p.imageUrl) {
      imageHtml = `<img id="shop-card-img-${p.id}" src="${p.imageUrl}" class="product-img" alt="${getDisplayProductName(p)}" onerror="handleImgError(this, '${p.gradient || 'from-slate-400 to-slate-600'}', '${p.emoji || '📦'}')">`;
    } else {
      imageHtml = `
        <div class="product-gradient-placeholder bg-gradient-to-br ${p.gradient || 'from-slate-400 to-slate-600'}">
          <span class="product-emoji">${p.emoji || '📦'}</span>
        </div>
      `;
    }
    
    cardsHtml += `<div class="product-card fade-in">
      <div class="product-img-wrapper">
        ${imageHtml}
        ${discountRate > 0 ? `<span class="badge-discount">-${discountRate}%</span>` : ''}
      </div>
      <div class="product-body">
        <h4 class="product-name">${getDisplayProductName(p)}</h4>
        <p class="product-desc">${getDisplayProductDesc(p)}</p>
        <div class="product-footer" style="margin-top: 12px; border-top: 1px solid #f1f5f9; padding-top: 12px;">
          <div class="product-prices">
            <span class="price-current">${moneyFormat(p.price)}</span>
            ${p.originalPrice ? `<span class="price-original">${moneyFormat(p.originalPrice)}</span>` : ''}
          </div>
          <button onclick="openCheckout('${p.id}')" ${isOutOfStock ? 'disabled' : ''} class="btn btn-primary btn-buy">
            ${isOutOfStock ? t("shop.out_of_stock") : t("shop.order_now")}
          </button>
        </div>
      </div>
    </div>`;
  });
  grid.innerHTML = cardsHtml;
  lucide.createIcons();
}

// Handles pic image fallback with gorgeous CSS gradient wrappers and custom emojis
function handleImgError(img, gradient, emoji) {
  const parent = img.parentElement;
  if (!parent) return;
  img.remove();
  const fallback = document.createElement("div");
  fallback.className = `product-gradient-placeholder bg-gradient-to-br ${gradient}`;
  fallback.innerHTML = `<span class="product-emoji">${emoji}</span>`;
  parent.appendChild(fallback);
}

