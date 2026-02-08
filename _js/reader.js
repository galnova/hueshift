(() => {
  if (typeof Swiper !== "function") return;
  if (typeof bootstrap === "undefined") return;

  const escHtml = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const buildSlideHtml = (btn, fallbackLabel) => {
    const thumbImg = btn.querySelector("img");
    const fullSrc = btn.getAttribute("data-full") || (thumbImg ? thumbImg.getAttribute("src") : "");
    const alt = thumbImg ? (thumbImg.getAttribute("alt") || fallbackLabel) : fallbackLabel;

    return (
      `<div class="hs-pageFrame">` +
      `<img src="${escHtml(fullSrc)}" alt="${escHtml(alt)}" class="hs-pageImg" loading="lazy" decoding="async">` +
      `</div>`
    );
  };

  const initReader = ({
    modalId,
    wrapperId,
    tileSelector,
    label = "Image",
    groupAttr = "data-group" // set to null to disable grouping
  }) => {
    const modalEl = document.getElementById(modalId);
    const wrapper = document.getElementById(wrapperId);

    if (!modalEl || !wrapper) return;

    const swiperEl = modalEl.querySelector(".hs-readerSwiper");
    if (!swiperEl) return;

    const nextBtn = modalEl.querySelector(".hs-readerNext");
    const prevBtn = modalEl.querySelector(".hs-readerPrev");
    const pagEl = modalEl.querySelector(".hs-readerPagination");

    let swiper = null;
    let currentKey = null; // group key (or "__all__")

    const ensureSwiper = () => {
      if (swiper) return swiper;

      swiper = new Swiper(swiperEl, {
        loop: false,
        slidesPerView: 1,
        spaceBetween: 16,
        centeredSlides: true,
        keyboard: { enabled: true },
        a11y: { enabled: true },
        pagination: {
          el: pagEl,
          type: "custom",
          renderCustom: (_s, current, total) => `${label} ${current} / ${total}`
        },
        navigation: {
          nextEl: nextBtn,
          prevEl: prevBtn
        }
      });

      // NOTE:
      // Do NOT add manual click handlers to nextBtn/prevBtn.
      // Swiper navigation already binds them. Double-binding causes skipping.

      return swiper;
    };

    const getTiles = () => Array.from(document.querySelectorAll(tileSelector));

    const computeKey = (trigger) => {
      if (!groupAttr) return "__all__";
      const key = trigger ? trigger.getAttribute(groupAttr) : null;
      return key || "__all__";
    };

    const filterTilesByKey = (tiles, key) => {
      if (!groupAttr || key === "__all__") return tiles;
      return tiles.filter((t) => (t.getAttribute(groupAttr) || "__all__") === key);
    };

    const rebuildSlides = (tilesForModal) => {
      wrapper.innerHTML = "";

      const slideEls = tilesForModal.map((btn) => {
        const slide = document.createElement("div");
        slide.className = "swiper-slide";
        slide.innerHTML = buildSlideHtml(btn, label);
        return slide;
      });

      slideEls.forEach((el) => wrapper.appendChild(el));
    };

    modalEl.addEventListener("show.bs.modal", (event) => {
      const trigger = event.relatedTarget;

      const allTiles = getTiles();
      if (!allTiles.length) return;

      const key = computeKey(trigger);
      const tilesForModal = filterTilesByKey(allTiles, key);
      if (!tilesForModal.length) return;

      // Which slide index inside THIS group?
      let startIndex = 0;
      if (trigger) {
        const idx = tilesForModal.indexOf(trigger);
        startIndex = idx >= 0 ? idx : 0;
      }

      // Rebuild slides ONLY when group changed, or if swiper isn't created yet
      const s = ensureSwiper();
      if (!s) return;

      if (currentKey !== key) {
        rebuildSlides(tilesForModal);
        currentKey = key;
      }

      requestAnimationFrame(() => {
        s.update();
        if (s.navigation && typeof s.navigation.update === "function") s.navigation.update();
        s.slideTo(startIndex, 0);
      });
    });

    modalEl.addEventListener("shown.bs.modal", () => {
      if (!swiper) return;
      swiper.update();
      if (swiper.navigation && typeof swiper.navigation.update === "function") swiper.navigation.update();
    });

    modalEl.addEventListener("hidden.bs.modal", () => {
      if (!swiper) return;
      swiper.slideTo(0, 0);
    });
  };

  // Extras reader (GROUPED by data-group)
  initReader({
    modalId: "extraReader",
    wrapperId: "hsExtrasWrapper",
    tileSelector: ".hs-extraTile",
    label: "Image",
    groupAttr: "data-group"
  });

  // Chapter page reader (no grouping; keep all pages together)
  initReader({
    modalId: "pageReader",
    wrapperId: "hsPagesWrapper",
    tileSelector: ".hs-pageTile[data-bs-target='#pageReader']",
    label: "Page",
    groupAttr: null
  });
})();