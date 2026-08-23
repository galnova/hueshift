(() => {
  const region = document.querySelector(".mech-carousel");
  const track = document.getElementById("mechTrack");
  if (!region || !track) return;

  const slides = Array.from(track.children);
  const prevBtn = region.querySelector(".mech-carousel-prev");
  const nextBtn = region.querySelector(".mech-carousel-next");
  const status = document.getElementById("mechCarouselStatus");
  if (!slides.length || !prevBtn || !nextBtn) return;

  let index = 0;

  const render = (announce) => {
    track.style.transform = `translateX(-${index * 100}%)`;

    slides.forEach((slide, i) => {
      const active = i === index;
      slide.setAttribute("aria-hidden", String(!active));
      if (active) slide.removeAttribute("inert");
      else slide.setAttribute("inert", "");
    });

    prevBtn.hidden = index === 0;
    nextBtn.hidden = index === slides.length - 1;

    if (status && announce) {
      const name = slides[index].dataset.mechName || "";
      status.textContent = `${name}, mech ${index + 1} of ${slides.length}`;
    }
  };

  const focusAvailableBtn = () => {
    (prevBtn.hidden ? nextBtn : prevBtn).focus();
  };

  const goTo = (next) => {
    const clamped = Math.max(0, Math.min(slides.length - 1, next));
    if (clamped === index) return;
    index = clamped;
    render(true);
  };

  prevBtn.addEventListener("click", () => {
    goTo(index - 1);
    focusAvailableBtn();
  });

  nextBtn.addEventListener("click", () => {
    goTo(index + 1);
    focusAvailableBtn();
  });

  region.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(index - 1);
      focusAvailableBtn();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo(index + 1);
      focusAvailableBtn();
    }
  });

  render(false);
})();
