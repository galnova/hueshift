(() => {
  if (typeof Swiper === "undefined") return;

  const chapterSwiperEl = document.querySelector(".hs-swiper");
  if (!chapterSwiperEl) return;

  const chapterSwiper = new Swiper(chapterSwiperEl, {
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
      const index = Number.parseInt(btn.getAttribute("data-hs-jump") || "0", 10);
      if (!Number.isNaN(index)) chapterSwiper.slideTo(index);
    });
  });
})();