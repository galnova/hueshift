(() => {
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();

const backTop = document.querySelector('.hs-backTop');

window.addEventListener('scroll', () => {
  if (window.scrollY > 300) {
    backTop.classList.add('show');
  } else {
    backTop.classList.remove('show');
  }
});