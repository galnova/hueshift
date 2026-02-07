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

  const initReader = ({
    modalId,
    wrapperId,
    tileSelector,
    label = "Image",
    pageAttr = "data-page"
  }) => {
    const modalEl = document.getElementById(modalId);
    const wrapper = document.getElementById(wrapperId);
    const tiles = Array.from(document.querySelectorAll(tileSelector));

    if (!modalEl || !wrapper || !tiles.length) return;

    const swiperEl = modalEl.querySelector(".hs-readerSwiper");
    if (!swiperEl) return;

    let swiper = null;
    let built = false;

    const buildSlidesOnce = () => {
      if (built) return;
      wrapper.innerHTML = "";

      tiles.forEach((btn) => {
        const thumbImg = btn.querySelector("img");
        const fullSrc =
          btn.getAttribute("data-full") ||
          (thumbImg ? thumbImg.getAttribute("src") : "");
        const alt = thumbImg ? (thumbImg.getAttribute("alt") || label) : label;

        const slide = document.createElement("div");
        slide.className = "swiper-slide";
        slide.innerHTML =
          `<div class="hs-pageFrame">` +
          `<img src="${escHtml(fullSrc)}" alt="${escHtml(alt)}" class="hs-pageImg" loading="lazy" decoding="async">` +
          `</div>`;

        wrapper.appendChild(slide);
      });

      built = true;
    };

    const ensureSwiper = () => {
      if (swiper) return swiper;

      const nextBtn = modalEl.querySelector(".hs-readerNext");
      const prevBtn = modalEl.querySelector(".hs-readerPrev");
      const pagEl = modalEl.querySelector(".hs-readerPagination");

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

      // Extra-safe explicit click handlers (keeps HUD buttons reliable)
      if (nextBtn) {
        nextBtn.addEventListener("click", (e) => {
          if (!swiper) return;
          e.preventDefault();
          e.stopPropagation();
          swiper.slideNext();
        });
      }
      if (prevBtn) {
        prevBtn.addEventListener("click", (e) => {
          if (!swiper) return;
          e.preventDefault();
          e.stopPropagation();
          swiper.slidePrev();
        });
      }

      return swiper;
    };

    modalEl.addEventListener("show.bs.modal", (event) => {
      const trigger = event.relatedTarget;

      buildSlidesOnce();
      const s = ensureSwiper();
      if (!s) return;

      const idxAttr = trigger ? trigger.getAttribute(pageAttr) : "0";
      const index = Number.parseInt(idxAttr || "0", 10);

      requestAnimationFrame(() => {
        s.update();
        if (s.navigation && typeof s.navigation.update === "function") s.navigation.update();
        s.slideTo(Number.isFinite(index) ? index : 0, 0);
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

  // Extras reader
  initReader({
    modalId: "extraReader",
    wrapperId: "hsExtrasWrapper",
    tileSelector: ".hs-extraTile",
    label: "Image",
    pageAttr: "data-page"
  });

  // Chapter page reader
  initReader({
    modalId: "pageReader",
    wrapperId: "hsPagesWrapper",
    tileSelector: ".hs-pageTile[data-page]",
    label: "Page",
    pageAttr: "data-page"
  });
})();