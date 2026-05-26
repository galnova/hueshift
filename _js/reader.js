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
    const zoomBtn = modalEl.querySelector(".hs-readerZoom");
    const pagEl = modalEl.querySelector(".hs-readerPagination");
    const hudEl = modalEl.querySelector(".hs-readerHud");

    const updateHudVisibility = () => {
      if (!hudEl) return;
      const active = wrapper.querySelector(".swiper-slide-active iframe[data-yt='1']");
      hudEl.style.display = active ? "none" : "";
    };

    const ZOOM_SCALE = 2.5;
    const zoomInSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>';
    const zoomOutSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path><line x1="8" y1="11" x2="14" y2="11"></line></svg>';

    let isZoomed = false;
    let panX = 0, panY = 0;
    let maxPanX = 0, maxPanY = 0;
    let isPanning = false;
    let panStartX = 0, panStartY = 0;
    let panOriginX = 0, panOriginY = 0;

    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
    const getActiveImg = () => modalEl.querySelector(".swiper-slide-active .hs-pageImg");

    const applyTransform = () => {
      const img = getActiveImg();
      if (img) img.style.transform = `scale(${ZOOM_SCALE}) translate(${panX}px, ${panY}px)`;
    };

    const updateZoomBtn = (zoomed) => {
      if (!zoomBtn) return;
      zoomBtn.innerHTML = zoomed ? zoomOutSvg : zoomInSvg;
      zoomBtn.setAttribute("aria-label", zoomed ? "Reset zoom" : "Zoom page");
      zoomBtn.setAttribute("title", zoomed ? "Reset zoom" : "Zoom");
    };

    const resetZoom = () => {
      if (!isZoomed) return;
      isZoomed = false;
      panX = 0; panY = 0;
      modalEl.classList.remove("hs-readerZoomed");
      updateZoomBtn(false);
      if (swiper) swiper.allowTouchMove = true;
      wrapper.querySelectorAll(".hs-pageImg").forEach(img => { img.style.transform = ""; });
    };

    const toggleZoom = () => {
      if (isZoomed) { resetZoom(); return; }
      isZoomed = true;
      panX = 0; panY = 0;
      modalEl.classList.add("hs-readerZoomed");
      updateZoomBtn(true);
      if (swiper) swiper.allowTouchMove = false;
      const img = getActiveImg();
      if (img) {
        const frame = img.closest(".hs-pageFrame");
        if (frame) {
          const fr = frame.getBoundingClientRect();
          const ir = img.getBoundingClientRect();
          maxPanX = Math.max(0, (ir.width  * (ZOOM_SCALE - 1)) / 2 / ZOOM_SCALE);
          maxPanY = Math.max(0, (ir.height * (ZOOM_SCALE - 1)) / 2 / ZOOM_SCALE);
        }
        applyTransform();
      }
    };

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
        initialSlide: pendingIndex,
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
        resetZoom();
        stopYouTubeIframes(wrapper);
        const active = wrapper.querySelector(".swiper-slide-active iframe[data-yt='1']");
        if (active) {
          const ds = active.getAttribute("data-src") || "";
          if (ds) active.setAttribute("src", ds);
        }
        updateHudVisibility();
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

      // Destroy and recreate Swiper to apply new slides and initialSlide
      if (swiper) {
        swiper.destroy(true, true);
        swiper = null;
      }
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

      const s = ensureSwiper();
      if (!s) return;

      s.slideTo(pendingIndex, 0);

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

        updateHudVisibility();
      });
    });

    modalEl.addEventListener("hidden.bs.modal", () => {
      stopYouTubeIframes(wrapper);
      resetZoom();
      if (!swiper) return;
      swiper.slideTo(0, 0);
      updateHudVisibility();
    });

    if (zoomBtn) {
      zoomBtn.addEventListener("click", toggleZoom);
    }

    swiperEl.addEventListener("dblclick", (e) => {
      if (e.target.closest(".hs-pageImg")) toggleZoom();
    });

    modalEl.addEventListener("keydown", (e) => {
      if ((e.key === "z" || e.key === "Z") && !e.ctrlKey && !e.metaKey && !e.altKey) {
        toggleZoom();
      }
    });

    // Mouse drag to pan
    swiperEl.addEventListener("mousedown", (e) => {
      if (!isZoomed) return;
      isPanning = true;
      panStartX = e.clientX; panStartY = e.clientY;
      panOriginX = panX;     panOriginY = panY;
      e.preventDefault();
    });

    modalEl.addEventListener("mousemove", (e) => {
      if (!isPanning) return;
      panX = clamp(panOriginX + (e.clientX - panStartX) / ZOOM_SCALE, -maxPanX, maxPanX);
      panY = clamp(panOriginY + (e.clientY - panStartY) / ZOOM_SCALE, -maxPanY, maxPanY);
      applyTransform();
    });

    const stopPan = () => { isPanning = false; };
    modalEl.addEventListener("mouseup", stopPan);
    modalEl.addEventListener("mouseleave", stopPan);

    // Touch drag to pan
    swiperEl.addEventListener("touchstart", (e) => {
      if (!isZoomed || e.touches.length !== 1) return;
      isPanning = true;
      panStartX = e.touches[0].clientX; panStartY = e.touches[0].clientY;
      panOriginX = panX;                panOriginY = panY;
      e.stopPropagation();
    }, { passive: true });

    swiperEl.addEventListener("touchmove", (e) => {
      if (!isPanning || !isZoomed || e.touches.length !== 1) return;
      panX = clamp(panOriginX + (e.touches[0].clientX - panStartX) / ZOOM_SCALE, -maxPanX, maxPanX);
      panY = clamp(panOriginY + (e.touches[0].clientY - panStartY) / ZOOM_SCALE, -maxPanY, maxPanY);
      applyTransform();
      e.preventDefault();
    }, { passive: false });

    swiperEl.addEventListener("touchend", () => { isPanning = false; });
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