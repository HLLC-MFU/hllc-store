(function () {
  const storageKey = "hllc-card-bottle-cards";
  const cards = loadCards();
  let activeId = cards[0]?.id || "blessing-01";

  const $ = (id) => document.getElementById(id);

  function basePath() {
    return window.location.pathname.startsWith("/store/") ? "/store" : "";
  }

  function absoluteAsset(path) {
    if (!path) return "";
    if (/^https?:\/\//.test(path) || path.startsWith("data:")) return path;
    const normalized = path.startsWith("/") ? path : `/${path}`;
    return normalized.startsWith("/uploads/")
      ? `${basePath()}${normalized}`
      : normalized;
  }

  function appUrl(path) {
    return `${window.location.origin}${basePath()}${path}`;
  }

  function loadCards() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (Array.isArray(saved) && saved.length) return saved;
    } catch {}
    return (window.CARD_BOTTLE_DEFAULTS || []).map((card) => ({ ...card }));
  }

  function saveCards() {
    localStorage.setItem(storageKey, JSON.stringify(cards));
  }

  function activeCard() {
    return cards.find((card) => card.id === activeId) || cards[0];
  }

  function slugify(value) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9ก-๙]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || `card-${Date.now()}`;
  }

  function renderList() {
    $("cardList").innerHTML = cards.map((card, index) => `
      <button class="card-button ${card.id === activeId ? "is-active" : ""}" data-id="${card.id}" type="button">
        <span>${escapeHtml(card.titleTh || card.titleEn || `Card ${index + 1}`)}</span>
        <small>${index + 1}</small>
      </button>
    `).join("");
    $("cardList").querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => {
        activeId = button.dataset.id;
        render();
      });
    });
  }

  function renderEditor() {
    const card = activeCard();
    if (!card) return;
    $("cardId").value = card.id;
    $("titleTh").value = card.titleTh || "";
    $("titleEn").value = card.titleEn || "";
    $("messageTh").value = card.messageTh || "";
    $("messageEn").value = card.messageEn || "";
    $("frontImage").value = card.frontImage || "";
    $("backImage").value = card.backImage || "";
    renderPreviews();
    renderQr("");
  }

  function renderPreviews() {
    const front = $("frontImage").value.trim();
    const back = $("backImage").value.trim();
    $("frontPreview").innerHTML = front ? `<img src="${escapeAttr(front)}" alt="front">` : "Front image";
    $("backPreview").innerHTML = back ? `<img src="${escapeAttr(back)}" alt="back">` : "Back image";
  }

  function readEditor() {
    const card = activeCard();
    const nextId = slugify($("cardId").value);
    card.id = nextId;
    card.titleTh = $("titleTh").value.trim();
    card.titleEn = $("titleEn").value.trim();
    card.messageTh = $("messageTh").value.trim();
    card.messageEn = $("messageEn").value.trim();
    card.frontImage = $("frontImage").value.trim();
    card.backImage = $("backImage").value.trim();
    activeId = nextId;
    saveCards();
    renderList();
    return card;
  }

  function cardUrl(card) {
    const params = new URLSearchParams();
    params.set("id", card.id);
    if (card.frontImage) params.set("front", absoluteAsset(card.frontImage));
    if (card.backImage) params.set("back", absoluteAsset(card.backImage));
    return appUrl(`/card-bottle/view.html?${params.toString()}`);
  }

  function renderQr(url) {
    $("qrBox").innerHTML = url ? window.CardBottleQR.toSvg(url) : "";
    $("urlBox").textContent = url || "กด Gen QR Code เพื่อสร้าง path เต็มของการ์ดนี้";
    $("downloadQr").disabled = !url;
    $("copyUrl").disabled = !url;
  }

  async function uploadImage(file) {
    const body = new FormData();
    body.append("file", file);
    const response = await fetch(`${basePath()}/api/upload`, { method: "POST", body });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Upload failed");
    return payload.url || payload.data?.url || payload.path || "";
  }

  async function handleUpload(inputId, fileInput) {
    const file = fileInput.files?.[0];
    if (!file) return;
    const button = fileInput.closest(".upload-row").querySelector("button");
    const original = button.textContent;
    button.textContent = "Uploading...";
    button.disabled = true;
    try {
      const url = await uploadImage(file);
      $(inputId).value = url;
      renderPreviews();
      readEditor();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      button.textContent = original;
      button.disabled = false;
      fileInput.value = "";
    }
  }

  function downloadQr() {
    const svg = $("qrBox").querySelector("svg");
    const card = activeCard();
    if (!svg || !card) return;
    const blob = new Blob([svg.outerHTML], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${card.id}-qr.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function addCard() {
    const id = `blessing-${String(cards.length + 1).padStart(2, "0")}`;
    cards.push({ id, titleTh: `Blessing Card ${cards.length + 1}`, titleEn: `Blessing Card ${cards.length + 1}`, messageTh: "", messageEn: "", frontImage: "", backImage: "" });
    activeId = id;
    saveCards();
    render();
  }

  function duplicateCard() {
    const source = activeCard();
    if (!source) return;
    const copy = { ...source, id: `${source.id}-copy-${Date.now().toString().slice(-4)}` };
    cards.push(copy);
    activeId = copy.id;
    saveCards();
    render();
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(cards, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "card-bottle-data.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function render() {
    renderList();
    renderEditor();
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }

  window.addEventListener("DOMContentLoaded", () => {
    render();
    ["cardId", "titleTh", "titleEn", "messageTh", "messageEn", "frontImage", "backImage"].forEach((id) => {
      $(id).addEventListener("input", () => {
        renderPreviews();
        readEditor();
        renderQr("");
      });
    });
    $("addCard").addEventListener("click", addCard);
    $("duplicateCard").addEventListener("click", duplicateCard);
    $("exportJson").addEventListener("click", exportJson);
    $("genQr").addEventListener("click", () => renderQr(cardUrl(readEditor())));
    $("openCard").addEventListener("click", () => window.open(cardUrl(readEditor()), "_blank", "noopener"));
    $("copyUrl").addEventListener("click", async () => navigator.clipboard.writeText($("urlBox").textContent || ""));
    $("downloadQr").addEventListener("click", downloadQr);
    $("frontUpload").addEventListener("change", (event) => handleUpload("frontImage", event.currentTarget));
    $("backUpload").addEventListener("change", (event) => handleUpload("backImage", event.currentTarget));
  });
})();
