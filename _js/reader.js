(() => {
  const escHtml = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const stopYouTubeIframes = (wrapper) => {
    if (!wrapper) return;
    wrapper.querySelectorAll("iframe[data-yt='1']").forEach((ifr) => {
      const src = ifr.getAttribute("src");
      if (src) ifr.setAttribute("src", src);
    });
  };

  const getYouTubeId = (input) => {
    const raw = String(input || "").trim();
    if (!raw) return "";

    if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;

    try {
      const u = new URL(raw, window.location.href);
      const host = (u.hostname || "").replace(/^www\./, "");

      if (host === "youtu.be") {
        const id = (u.pathname || "").split("/").filter(Boolean)[0] || "";
        return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : "";
      }

      if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
        const p = u.pathname || "";

        if (p.startsWith("/shorts/")) {
          const id = p.split("/shorts/")[1]?.split("/")[0] || "";
          return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : "";
        }

        if (p.startsWith("/embed/")) {
          const id = p.split("/embed/")[1]?.split("/")[0] || "";
          return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : "";
        }

        const v = u.searchParams.get("v") || "";
        return /^[a-zA-Z0-9_-]{11}$/.test(v) ? v : "";
      }
    } catch (_e) {}

    const m = raw.match(/(?:shorts\/|embed\/|v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : "";
  };

  const buildSlideHtml = (btn, fallbackLabel) => {
    const type = (btn.getAttribute("data-type") || "image").toLowerCase();

    if (type === "youtube") {
      const vidRaw = btn.getAttribute("data-video") || "";
      const vid = getYouTubeId(vidRaw);
      const title = btn.getAttribute("aria-label") || "YouTube video";
      const isVertical = (btn.getAttribute("data-aspect") || "").toLowerCase() === "9x16";

      const src = vid
        ? `https://www.youtube.com/embed/${encodeURIComponent(vid)}?rel=0&modestbranding=1&playsinline=1`
        : "";

      return (
        `<div class="hs-pageFrame">` +
        `<div class="ratio ${isVertical ? "ratio-9x16" : "ratio-16x9"} w-100">` +
        `<iframe data-yt="1" ` +
        `src="${escHtml(src)}" ` +
        `title="${escHtml(title)}" ` +
        `allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" ` +
        `allowfullscreen></iframe>` +
        `</div>` +
        `</div>`
      );
    }

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
    groupAttr = "data-group"
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
    let currentKey = null;

    const createSwiper = () => {
      if (typeof Swiper !== "function") return null;

      const s = new Swiper(swiperEl, {
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
        navigation: { nextEl: nextBtn, prevEl: prevBtn }
      });

      s.on("slideChange", () => stopYouTubeIframes(wrapper));
      return s;
    };

    const resetSwiper = () => {
      if (swiper) {
        try { swiper.destroy(true, true); } catch (_e) {}
        swiper = null;
      }
      swiper = createSwiper();
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

      tilesForModal.forEach((btn) => {
        const slide = document.createElement("div");
        slide.className = "swiper-slide";
        slide.innerHTML = buildSlideHtml(btn, label);
        wrapper.appendChild(slide);
      });

      resetSwiper();
    };

    const openFromTrigger = (trigger) => {
      const allTiles = getTiles();
      if (!allTiles.length) return;

      const key = computeKey(trigger);
      const tilesForModal = filterTilesByKey(allTiles, key);
      if (!tilesForModal.length) return;

      const startIndex = Math.max(0, tilesForModal.indexOf(trigger));

      if (currentKey !== key || !swiper) {
        rebuildSlides(tilesForModal);
        currentKey = key;
      } else {
        swiper.update();
        if (swiper.navigation && typeof swiper.navigation.update === "function") swiper.navigation.update();
      }

      requestAnimationFrame(() => {
        swiper.update();
        if (swiper.navigation && typeof swiper.navigation.update === "function") swiper.navigation.update();
        swiper.slideTo(startIndex, 0);
      });

      if (typeof bootstrap !== "undefined" && bootstrap.Modal) {
        bootstrap.Modal.getOrCreateInstance(modalEl).show();
      }
    };

    document.addEventListener("click", (e) => {
      const tile = e.target.closest(tileSelector);
      if (!tile) return;
      e.preventDefault();
      openFromTrigger(tile);
    });

    modalEl.addEventListener("hidden.bs.modal", () => {
      stopYouTubeIframes(wrapper);
      if (!swiper) return;
      swiper.slideTo(0, 0);
    });
  };

  initReader({
    modalId: "extraReader",
    wrapperId: "hsExtrasWrapper",
    tileSelector: ".hs-extraTile",
    label: "Image",
    groupAttr: "data-group"
  });

  initReader({
    modalId: "pageReader",
    wrapperId: "hsPagesWrapper",
    tileSelector: ".hs-pageTile[data-bs-target='#pageReader']",
    label: "Page",
    groupAttr: null
  });
})();