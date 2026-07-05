(function () {
  const cards = window.CARD_BOTTLE_DEFAULTS || [];
  let activeUrl = "";
  let activeId = "";
  let configuredSiteUrl = "";
  const cardLooks = [
    { color: "#9b5a08", sigil: "ᩋ", accent: "daisy" },
    { color: "#486f20", sigil: "ᨦ", accent: "coins" },
    { color: "#0b5d91", sigil: "ᨩ", accent: "river" },
    { color: "#b93b4d", sigil: "ᨿ", accent: "flower" },
    { color: "#70409a", sigil: "ᩈ", accent: "orchid" },
    { color: "#b67905", sigil: "ᨷ", accent: "lotus" },
    { color: "#2d6a31", sigil: "ᨾ", accent: "rice" },
    { color: "#8a4a0a", sigil: "ᨣ", accent: "path" },
    { color: "#0b5a8f", sigil: "ᨸ", accent: "umbrella" },
    { color: "#b87908", sigil: "ᨽ", accent: "lantern" },
  ];

  const $ = (id) => document.getElementById(id);

  function basePath() {
    return window.location.pathname.startsWith("/store/") ? "/store" : "";
  }

  async function loadConfig() {
    try {
      const response = await fetch(`${basePath()}/card-bottle/config`, { cache: "no-store" });
      const payload = await response.json();
      configuredSiteUrl = typeof payload.siteUrl === "string" ? payload.siteUrl.trim().replace(/\/+$/, "") : "";
    } catch {
      configuredSiteUrl = "";
    }
  }

  function appUrl(path) {
    const base = configuredSiteUrl || window.location.origin;
    const normalizedBase = base.endsWith("/store") ? base : `${base}${basePath()}`;
    return `${normalizedBase}${path}`;
  }

  function cardUrl(card) {
    return appUrl(`/card-bottle/view.html?id=${encodeURIComponent(card.id)}`);
  }

  function renderGrid() {
    $("cardGrid").innerHTML = cards.map((card, index) => {
      const title = card.titleTh || card.titleEn || `Card ${index + 1}`;
      return `
        <article class="simple-card">
          <div class="mini-card">${renderCardMarkup(card, "th", "front")}</div>
          <div class="simple-card-footer">
            <div>
              <strong>${escapeHtml(title)}</strong>
              <span>${escapeHtml(card.titleEn || "")}</span>
            </div>
            <div class="button-row compact">
              <a class="btn" href="${escapeAttr(cardUrl(card))}" target="_blank" rel="noreferrer">View</a>
              <button class="btn secondary" type="button" data-qr="${escapeAttr(card.id)}">QR</button>
            </div>
          </div>
        </article>
      `;
    }).join("");

    document.querySelectorAll("[data-qr]").forEach((button) => {
      button.addEventListener("click", () => {
        const card = cards.find((item) => item.id === button.dataset.qr);
        if (card) showQr(card);
      });
    });
  }

  function showQr(card) {
    activeId = card.id;
    activeUrl = cardUrl(card);
    $("qrTitle").textContent = card.titleTh || card.titleEn || "QR Code";
    $("qrBox").innerHTML = window.CardBottleQR.toSvg(activeUrl);
    $("urlBox").textContent = activeUrl;
    $("qrDialog").showModal();
  }

  function downloadQr() {
    const svg = $("qrBox").querySelector("svg");
    if (!svg) return;
    const blob = new Blob([svg.outerHTML], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeId || "card"}-qr.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function renderCardMarkup(card, lang, side) {
    const title = lang === "th" ? card.titleTh : card.titleEn;
    const message = lang === "th" ? card.messageTh : card.messageEn;
    const cardIndex = Math.max(0, cards.findIndex((item) => item.id === card.id));
    const look = cardLooks[cardIndex] || cardLooks[0];
    const number = cardIndex + 1;
    if (side === "back") {
      return `
        <article class="blessing-card back accent-${look.accent}" style="--card-accent: ${look.color}">
          <div class="card-corner top-left"></div>
          <div class="card-corner top-right"></div>
          <div class="card-corner bottom-left"></div>
          <div class="card-corner bottom-right"></div>
          <div class="number-badge">${number}</div>
          <h2>${escapeHtml(title)}</h2>
          <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
        </article>
      `;
    }
    return `
      <article class="blessing-card front ${card.frontImage ? "has-image" : ""} accent-${look.accent}" style="--card-accent: ${look.color}">
        <div class="card-corner top-left"></div>
        <div class="card-corner top-right"></div>
        <div class="card-corner bottom-left"></div>
        <div class="card-corner bottom-right"></div>
        <div class="number-badge">${number}</div>
        ${card.frontImage ? `
          <div class="front-image-face">
            <img class="front-image-bg" src="${escapeAttr(card.frontImage)}" alt="">
            <img class="front-image-main" src="${escapeAttr(card.frontImage)}" alt="${escapeAttr(title)}" loading="lazy" decoding="async">
          </div>
        ` : `
          <div class="lanna-sigil" aria-hidden="true">${look.sigil}</div>
          <div class="card-landscape" aria-hidden="true">
            <span class="mountain m1"></span>
            <span class="mountain m2"></span>
            <span class="sun"></span>
            <span class="temple"></span>
            <span class="flower-bed"></span>
          </div>
          <h2>${escapeHtml(title)}</h2>
          <div class="card-ornament" aria-hidden="true">✦</div>
        `}
      </article>
    `;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }

  window.CardBottleRender = { renderCardMarkup };

  window.addEventListener("DOMContentLoaded", async () => {
    await loadConfig();
    renderGrid();
    $("closeQr").addEventListener("click", () => $("qrDialog").close());
    $("downloadQr").addEventListener("click", downloadQr);
    $("copyUrl").addEventListener("click", () => navigator.clipboard.writeText(activeUrl));
  });
})();
