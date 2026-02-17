(() => {
  if (typeof Swiper !== "function") return;

  const swiperEl = document.querySelector(".hs-swiper");
  if (!swiperEl) return;

  const jumpButtons = Array.from(document.querySelectorAll(".hs-jump"));

  const swiper = new Swiper(swiperEl, {
    speed: 500,
    autoHeight: true,
    navigation: {
      nextEl: ".hs-next",
      prevEl: ".hs-prev"
    },
    on: {
      init() {
        setActiveButton(this.activeIndex);
      },
      slideChange() {
        setActiveButton(this.activeIndex);
      }
    }
  });

  function setActiveButton(index) {
    jumpButtons.forEach((btn, i) => {
      if (i === index) {
        btn.classList.remove("btn-outline-light");
        btn.classList.add("btn-light", "active");
      } else {
        btn.classList.remove("btn-light", "active");
        btn.classList.add("btn-outline-light");
      }
    });
  }

  jumpButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const index = parseInt(btn.dataset.hsJump, 10);
      swiper.slideTo(index);
    });
  });

})();