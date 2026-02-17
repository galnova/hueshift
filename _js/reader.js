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
      ifr.removeAttribute("src");
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

  const normalizeYouTubeEmbedSrc = (raw) => {
    const input = String(raw || "").trim();
    if (!input) return "";

    if (/^https?:\/\//i.test(input)) {
      try {
        const u = new URL(input);
        const host = (u.hostname || "").replace(/^www\./, "");

        if (host === "youtube.com" || host === "m.youtube.com") u.hostname = "www.youtube.com";

        if (u.pathname.startsWith("/embed/")) {
          const sp = u.searchParams;
          if (!sp.has("rel")) sp.set("rel", "0");
          if (!sp.has("modestbranding")) sp.set("modestbranding", "1");
          if (!sp.has("playsinline")) sp.set("playsinline", "1");
          sp.delete("autoplay");
          return u.toString();
        }
      } catch (_e) {}
    }

    const id = getYouTubeId(input);
    if (!id) return "";
    return `https://www.youtube.com/embed/${encodeURIComponent(id)}?rel=0&modestbranding=1&playsinline=1`;
  };

  const buildSlideHtml = (btn, fallbackLabel) => {
    const type = (btn.getAttribute("data-type") || "image").toLowerCase();

    if (type === "youtube") {
      const vidRaw = btn.getAttribute("data-video") || "";
      const title = btn.getAttribute("aria-label") || "YouTube video";
      const dataSrc = normalizeYouTubeEmbedSrc(vidRaw);

      return (
        `<div class="hs-pageFrame">` +
        `<div class="ratio ratio-16x9 w-100">` +
        `<iframe data-yt="1" ` +
        `class="nuke" ` +
        `width="100%" height="305" ` +
        `data-src="${escHtml(dataSrc)}" ` +
        `src="" ` +
        `title="${escHtml(title)}" ` +
        `frameborder="0" ` +
        `allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" ` +
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
    groupAttr = "data-group",
    ignoreGroupFor = null
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
    let pendingIndex = 0;

    const ensureSwiper = () => {
      if (swiper) return swiper;
      if (typeof Swiper !== "function") return null;

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
        navigation: { nextEl: nextBtn, prevEl: prevBtn }
      });

      swiper.on("slideChange", () => {
        stopYouTubeIframes(wrapper);
        const active = wrapper.querySelector(".swiper-slide-active iframe[data-yt='1']");
        if (active) {
          const ds = active.getAttribute("data-src") || "";
          if (ds) active.setAttribute("src", ds);
        }
      });

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
    };

    const rebindNav = (s) => {
      if (!s || !s.navigation) return;
      if (typeof s.navigation.destroy === "function") s.navigation.destroy();
      if (typeof s.navigation.init === "function") s.navigation.init();
      if (typeof s.navigation.update === "function") s.navigation.update();
    };

    const shouldIgnoreGroup = (trigger) => {
      if (!ignoreGroupFor || !trigger) return false;
      return ignoreGroupFor(trigger);
    };

    const openFromTrigger = (trigger) => {
      const allTiles = getTiles();
      if (!allTiles.length) return;

      const s = ensureSwiper();
      if (!s) return;

      let key = "__all__";
      let tilesForModal = [];

      if (shouldIgnoreGroup(trigger)) {
        tilesForModal = allTiles.filter(ignoreGroupFor);
        key = "__ignoregroup__";
      } else {
        key = computeKey(trigger);
        tilesForModal = filterTilesByKey(allTiles, key);
      }

      if (!tilesForModal.length) return;

      pendingIndex = Math.max(0, tilesForModal.indexOf(trigger));

      if (currentKey !== key) {
        rebuildSlides(tilesForModal);
        currentKey = key;
      }

      if (typeof bootstrap !== "undefined" && bootstrap.Modal) {
        bootstrap.Modal.getOrCreateInstance(modalEl).show();
      }
    };

    document.addEventListener(
      "click",
      (e) => {
        const tile = e.target.closest(tileSelector);
        if (!tile) return;

        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();

        openFromTrigger(tile);
      },
      true
    );

    modalEl.addEventListener("shown.bs.modal", () => {
      const s = ensureSwiper();
      if (!s) return;

      requestAnimationFrame(() => {
        s.update();
        rebindNav(s);
        s.slideTo(pendingIndex, 0);

        stopYouTubeIframes(wrapper);
        const active = wrapper.querySelector(".swiper-slide-active iframe[data-yt='1']");
        if (active) {
          const ds = active.getAttribute("data-src") || "";
          if (ds) active.setAttribute("src", ds);
        }
      });
    });

    modalEl.addEventListener("hidden.bs.modal", () => {
      stopYouTubeIframes(wrapper);
      if (!swiper) return;
      swiper.slideTo(0, 0);
    });
  };

  const isYouTubeTile = (el) =>
    String(el?.getAttribute("data-type") || "").toLowerCase() === "youtube";

  initReader({
    modalId: "extraReader",
    wrapperId: "hsExtrasWrapper",
    tileSelector: ".hs-extraTile",
    label: "Image",
    groupAttr: "data-group",
    ignoreGroupFor: isYouTubeTile
  });

  initReader({
    modalId: "pageReader",
    wrapperId: "hsPagesWrapper",
    tileSelector: ".hs-pageTile[data-bs-target='#pageReader']",
    label: "Page",
    groupAttr: null,
    ignoreGroupFor: null
  });
})();