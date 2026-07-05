(function () {
  const $ = (id) => document.getElementById(id);
  const params = new URLSearchParams(window.location.search);
  const cards = window.CARD_BOTTLE_DEFAULTS || [];
  const card = cards.find((item) => item.id === params.get("id")) || cards[0];
  const cardIndex = Math.max(0, cards.findIndex((item) => item.id === card.id));
  let lang = localStorage.getItem("hllc-card-bottle-lang") || "th";
  let side = "front";
  let switching = false;
  let atroposInstance = null;
  let fontsRequested = false;

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
    const [meaning = "", story = ""] = String(message || "").split(/\n\n/);
    const meaningText = meaning.replace(/^Meaning:\s*|^ความหมาย:\s*/i, "");
    const storyText = story.replace(/^Story:\s*|^เรื่องราว:\s*/i, "");

    return `
      <article class="blessing-card ${side === "front" ? "front" : "back"} ${side === "front" && card.frontImage ? "has-image" : ""} accent-${look.accent}" style="--card-accent: ${look.color}">
        <div class="card-corner top-left"></div>
        <div class="card-corner top-right"></div>
        <div class="card-corner bottom-left"></div>
        <div class="card-corner bottom-right"></div>
        <div class="number-badge" data-atropos-offset="7">${number}</div>
        ${side === "front" && card.frontImage ? `
          <div class="front-image-face">
            <img class="front-image-bg" src="${escapeAttr(card.frontImage)}" alt="" data-atropos-offset="-8">
            <img class="front-image-main" src="${escapeAttr(card.frontImage)}" alt="${escapeAttr(title)}" data-atropos-offset="6" decoding="async" fetchpriority="high">
          </div>
        ` : side === "front" ? `
          <div class="sky-glow" data-atropos-offset="-3" aria-hidden="true"></div>
          <div class="lanna-sigil" data-atropos-offset="11" aria-hidden="true">${look.sigil}</div>
          <div class="card-landscape" data-atropos-offset="-4" aria-hidden="true">
            <span class="mountain m1" data-atropos-offset="-7"></span>
            <span class="mountain m2" data-atropos-offset="-5"></span>
            <span class="sun" data-atropos-offset="3"></span>
            <span class="temple" data-atropos-offset="5"></span>
            <span class="flower-bed" data-atropos-offset="8"></span>
          </div>
          <h2 data-atropos-offset="9">${escapeHtml(title)}</h2>
          <div class="card-ornament" data-atropos-offset="6" aria-hidden="true">✦</div>
        ` : `
          <h2 data-atropos-offset="8">${escapeHtml(title)}</h2>
          <div class="phonetic" data-atropos-offset="5">${escapeHtml(lang === "th" ? "คำอวยพรล้านนา" : "Lanna blessing")}</div>
          <section data-atropos-offset="3">
            <strong>${lang === "th" ? "ความหมาย" : "Meaning"}</strong>
            <p>${escapeHtml(meaningText)}</p>
          </section>
          <section data-atropos-offset="3">
            <strong>${lang === "th" ? "เรื่องราว" : "Story"}</strong>
            <p>${escapeHtml(storyText)}</p>
          </section>
          <div class="tap-note" data-atropos-offset="5">${lang === "th" ? "แตะเพื่อกลับหน้าการ์ด" : "Tap to flip"}</div>
        `}
      </article>
    `;
  }

  function render() {
    document.documentElement.lang = lang;
    $("title").textContent = lang === "th" ? card.titleTh : card.titleEn;
    $("thBtn").classList.toggle("is-active", lang === "th");
    $("enBtn").classList.toggle("is-active", lang === "en");
    $("frontBtn").classList.toggle("is-active", side === "front");
    $("backBtn").classList.toggle("is-active", side === "back");
    if (atroposInstance) {
      atroposInstance.destroy();
      atroposInstance = null;
    }
    $("stage").innerHTML = `
      <div class="full-card ${switching ? "is-switching" : ""}">
        <div class="atropos card-atropos">
          <div class="atropos-scale">
            <div class="atropos-rotate">
              <div class="atropos-inner">
                ${renderCardMarkup(card, lang, side)}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    $("stage").querySelector(".blessing-card")?.addEventListener("click", toggleSide);
    if (window.Atropos) {
      atroposInstance = window.Atropos({
        el: ".card-atropos",
        activeOffset: 22,
        shadowOffset: 28,
        shadowScale: 0.9,
        rotateXMax: 5,
        rotateYMax: 5,
        rotateTouch: "scroll-y",
        highlight: true,
        shadow: true,
        duration: 360,
      });
    }
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
      side = "front";
      render();
    });
    $("backBtn").addEventListener("click", () => {
      side = "back";
      render();
    });
    render();
    requestFonts();
  });

  function requestFonts() {
    if (fontsRequested) return;
    fontsRequested = true;
    const load = () => {
      const preconnectGoogle = document.createElement("link");
      preconnectGoogle.rel = "preconnect";
      preconnectGoogle.href = "https://fonts.googleapis.com";
      document.head.appendChild(preconnectGoogle);

      const preconnectGstatic = document.createElement("link");
      preconnectGstatic.rel = "preconnect";
      preconnectGstatic.href = "https://fonts.gstatic.com";
      preconnectGstatic.crossOrigin = "anonymous";
      document.head.appendChild(preconnectGstatic);

      const stylesheet = document.createElement("link");
      stylesheet.rel = "stylesheet";
      stylesheet.href = "https://fonts.googleapis.com/css2?family=Charmonman:wght@400;700&family=Noto+Sans+Tai+Tham:wght@400;700&family=Noto+Serif+Thai:wght@500;700;900&display=swap";
      document.head.appendChild(stylesheet);
    };
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(load, { timeout: 1200 });
    } else {
      window.setTimeout(load, 400);
    }
  }

  function toggleSide() {
    if (switching) return;
    switching = true;
    $("stage").querySelector(".full-card")?.classList.add("is-switching");
    side = side === "front" ? "back" : "front";
    setTimeout(() => {
      render();
      setTimeout(() => {
        switching = false;
        $("stage").querySelector(".full-card")?.classList.remove("is-switching");
      }, 220);
    }, 150);
  }
})();
