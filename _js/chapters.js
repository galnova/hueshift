(function () {
  if (typeof Swiper === "undefined") return;
  if (typeof bootstrap === "undefined") return;

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const chapterSwiperEl = document.querySelector(".hs-swiper");
  let chapterSwiper = null;

  if (chapterSwiperEl) {
    chapterSwiper = new Swiper(chapterSwiperEl, {
      loop: false,
      speed: 450,
      spaceBetween: 14,
      grabCursor: true,
      keyboard: { enabled: true },
      pagination: {
        el: ".hs-pagination",
        clickable: true
      },
      navigation: {
        nextEl: ".hs-next",
        prevEl: ".hs-prev"
      }
    });

    document.querySelectorAll("[data-hs-jump]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const index = parseInt(btn.getAttribute("data-hs-jump"), 10);
        if (!Number.isNaN(index)) chapterSwiper.slideTo(index);
      });
    });
  }

  const readerModal = document.getElementById("pageReader");
  const readerSwiperEl = document.querySelector(".hs-readerSwiper");

  let readerSwiper = null;
  let pendingIndex = 0;

  if (readerModal && readerSwiperEl) {
    document.querySelectorAll(".hs-pageTile[data-page]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = parseInt(btn.getAttribute("data-page"), 10);
        pendingIndex = Number.isNaN(i) ? 0 : i;
      });
    });

    readerModal.addEventListener("shown.bs.modal", () => {
      if (!readerSwiper) {
        readerSwiper = new Swiper(readerSwiperEl, {
          loop: false,
          speed: 350,
          spaceBetween: 12,
          grabCursor: true,
          keyboard: { enabled: true },
          pagination: {
            el: ".hs-readerPagination",
            clickable: true
          },
          navigation: {
            nextEl: ".hs-readerNext",
            prevEl: ".hs-readerPrev"
          }
        });
      }
      readerSwiper.slideTo(pendingIndex, 0);
    });

    readerModal.addEventListener("hidden.bs.modal", () => {
      pendingIndex = 0;
    });
  }
})();