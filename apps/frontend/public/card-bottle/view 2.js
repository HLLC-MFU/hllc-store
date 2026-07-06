(function () {
  const $ = (id) => document.getElementById(id);
  const params = new URLSearchParams(window.location.search);
  const defaults = window.CARD_BOTTLE_DEFAULTS || [];
  const id = params.get("id") || "";
  const fallback = defaults.find((card) => card.id === id) || defaults[0] || {};
  const card = {
    titleTh: params.get("titleTh") || fallback.titleTh || "Blessing Card",
    titleEn: params.get("titleEn") || fallback.titleEn || "Blessing Card",
    messageTh: params.get("messageTh") || fallback.messageTh || "",
    messageEn: params.get("messageEn") || fallback.messageEn || "",
    frontImage: params.get("front") || fallback.frontImage || "",
    backImage: params.get("back") || fallback.backImage || ""
  };
  let lang = localStorage.getItem("hllc-card-bottle-lang") || "th";
  let side = "front";

  function currentTitle() {
    return lang === "th" ? card.titleTh : card.titleEn;
  }

  function currentMessage() {
    return lang === "th" ? card.messageTh : card.messageEn;
  }

  function currentImage() {
    return side === "front" ? card.frontImage : card.backImage;
  }

  function render() {
    document.documentElement.lang = lang;
    $("title").textContent = currentTitle();
    $("thBtn").classList.toggle("is-active", lang === "th");
    $("enBtn").classList.toggle("is-active", lang === "en");
    $("frontBtn").classList.toggle("is-active", side === "front");
    $("backBtn").classList.toggle("is-active", side === "back");
    $("backBtn").disabled = !card.backImage;
    const image = currentImage();
    $("stage").innerHTML = image
      ? `<div class="full-card"><img src="${escapeHtml(image)}" alt="${escapeHtml(currentTitle())}"></div>`
      : `<div class="fallback-card"><h1>${escapeHtml(currentTitle())}</h1><p>${escapeHtml(currentMessage() || "ยังไม่ได้ใส่รูปการ์ด")}</p></div>`;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
  }

  window.addEventListener("DOMContentLoaded", () => {
    $("thBtn").addEventListener("click", () => {
      lang = "th";
      localStorage.setItem("hllc-card-bottle-lang", lang);
      render();
    });
    $("enBtn").addEventListener("click", () => {
      lang = "en";
      localStorage.setItem("hllc-card-bottle-lang", lang);
      render();
    });
    $("frontBtn").addEventListener("click", () => {
      side = "front";
      render();
    });
    $("backBtn").addEventListener("click", () => {
      side = "back";
      render();
    });
    render();
  });
})();
