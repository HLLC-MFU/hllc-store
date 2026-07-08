(function () {
  const $ = (id) => document.getElementById(id);
  const params = new URLSearchParams(window.location.search);
  const cards = window.CARD_BOTTLE_DEFAULTS || [];
  const card = cards.find((item) => item.id === params.get("id")) || cards[0];
  const cardIndex = Math.max(0, cards.findIndex((item) => item.id === card.id));
  let lang = localStorage.getItem("hllc-card-bottle-lang") || "th";
  let side = "front";

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

  function renderCardMarkup(card, lang, side) {
    const title = lang === "th" ? card.titleTh : card.titleEn;
    const message = lang === "th" ? card.messageTh : card.messageEn;
    const look = cardLooks[cardIndex] || cardLooks[0];
    const number = cardIndex + 1;
    const { meaningText, storyText } = splitMessage(message);

    return `
      <article class="blessing-card card-face ${side === "front" ? "front image-front card-face-front" : "back card-face-back"} accent-${look.accent}" style="--card-accent: ${look.color}; --card-back-image: url('${escapeAttr(card.backImage || "./cards/backofcard.png")}')">
        ${side === "front" ? `
          ${card.frontImage ? `<img class="card-front-image" src="${escapeAttr(card.frontImage)}" alt="${escapeAttr(title)}" decoding="async" fetchpriority="high">` : ""}
          ${renderFrontBlessing(title, lang)}
        ` : `
          <div class="back-copy">
            <div class="back-number">${number}</div>
            <h2>${escapeHtml(title)}</h2>
            <div class="phonetic">${escapeHtml(lang === "th" ? "คำอวยพรล้านนา" : "Lanna blessing")}</div>
            <section>
              <strong>${lang === "th" ? "ความหมาย" : "Meaning"}</strong>
              <p>${escapeHtml(meaningText)}</p>
            </section>
            <section>
              <strong>${lang === "th" ? "เรื่องราว" : "Story"}</strong>
              <p>${escapeHtml(storyText)}</p>
            </section>
          </div>
        `}
      </article>
    `;
  }

  function renderFrontBlessing(title, lang) {
    return `
      <div class="front-blessing-panel" aria-label="${escapeAttr(lang === "th" ? "คำอวยพร" : "Blessing")}">
        <h2 class="front-blessing-title">${escapeHtml(title)}</h2>
      </div>
    `;
  }

  function render() {
    document.documentElement.lang = lang;
    $("title").textContent = lang === "th" ? card.titleTh : card.titleEn;
    $("stage").innerHTML = `
      <div class="full-card">
        <div class="card-atropos">
          ${renderCardMarkup(card, lang, "front")}
          ${renderCardMarkup(card, lang, "back")}
        </div>
      </div>
    `;
    $("stage").querySelectorAll(".blessing-card").forEach((face) => {
      face.addEventListener("click", toggleSide);
    });
    updateControls();
  }

  function preloadCardAssets() {
    [card.frontImage, card.backImage || "./cards/backofcard.png"].filter(Boolean).forEach((src) => {
      const image = new Image();
      image.decoding = "async";
      image.src = src;
    });
  }

  function updateControls() {
    $("thBtn").classList.toggle("is-active", lang === "th");
    $("enBtn").classList.toggle("is-active", lang === "en");
    $("frontBtn").classList.toggle("is-active", side === "front");
    $("backBtn").classList.toggle("is-active", side === "back");
    $("stage").querySelector(".card-atropos")?.classList.toggle("is-back", side === "back");
  }

  function setSide(nextSide) {
    if (side === nextSide) return;
    side = nextSide;
    updateControls();
  }

  function splitMessage(message) {
    const [meaning = "", story = ""] = String(message || "").split(/\n\s*\n/);
    return {
      meaningText: stripMessageLabel(meaning),
      storyText: stripMessageLabel(story),
    };
  }

  function stripMessageLabel(value) {
    return String(value || "").replace(/^[^:：]{1,28}[:：]\s*/, "").trim();
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
  }

  function escapeAttr(value) {
    return escapeHtml(value);
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
      setSide("front");
    });
    $("backBtn").addEventListener("click", () => {
      setSide("back");
    });
    preloadCardAssets();
    render();
  });

  function toggleSide() {
    setSide(side === "front" ? "back" : "front");
  }
})();
