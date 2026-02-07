(() => {
  // Year
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Back to top
  const backTop = document.querySelector(".hs-backTop");
  if (!backTop) return;

  const onScroll = () => {
    if (window.scrollY > 300) backTop.classList.add("show");
    else backTop.classList.remove("show");
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();