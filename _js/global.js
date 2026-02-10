(() => {
  // ----------------------------
  // Footer year
  // ----------------------------
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // ----------------------------
  // Back to top
  // ----------------------------
  const backTop = document.querySelector(".hs-backTop");

  const onScroll = () => {
    if (!backTop) return;
    if (window.scrollY > 300) backTop.classList.add("show");
    else backTop.classList.remove("show");
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ----------------------------
  // Featured rotation (daily, local midnight)
  // ----------------------------
  const featuredWrap = document.querySelector('[data-feature="wrap"]');
  if (!featuredWrap) return;

  const featuredImg = featuredWrap.querySelector('[data-feature="img"]');
  const featuredName = featuredWrap.querySelector('[data-feature="name"]');
  const featuredText = featuredWrap.querySelector('[data-feature="text"]');
  const featuredCta = featuredWrap.querySelector('[data-feature="cta"]');

  const FEATURED_ITEMS = [
    {
      href: "_dossiers/llew.html",
      img: "_img/wide-hs-llew.jpg",
      name: "LLEWELLYN",
      text:
        "The leader of the Ne'er-do-wells and main pilot of Cidermayer. This final mission may test the limits of their friendships and their fate.",
      alt: "Featured character: Llewellyn",
      aria: "Open dossier: Llewellyn",
      cta: "Open dossier →",
    },
    {
      href: "_dossiers/sad.html",
      img: "_img/wide-hs-sad.jpg",
      name: "SADIE",
      text:
        "The rookie of the Ne'er-do-wells and guidance coordinator of Cidermayer. This final mission may test the limits of their friendships and their fate.",
      alt: "Featured character: Sadie",
      aria: "Open dossier: Sadie",
      cta: "Open dossier →",
    },
    {
      href: "_dossiers/blac.html",
      img: "_img/wide-hs-blac.jpg",
      name: "BLAC",
      text:
        'The brute of the Ne\'er-do-wells and "dirty tricks" programmer of Cidermayer. This final mission may test the limits of their friendships and their fate.',
      alt: "Featured character: Blac",
      aria: "Open dossier: Blac",
      cta: "Open dossier →",
    },
    {
      href: "_dossiers/star.html",
      img: "_img/wide-hs-star.jpg",
      name: "STARLOT",
      text:
        "The gunner of the Ne'er-do-wells and arsenal engineer of Cidermayer. This final mission may test the limits of their friendships and their fate.",
      alt: "Featured character: Starlot",
      aria: "Open dossier: Starlot",
      cta: "Open dossier →",
    },
    {
      href: "_dossiers/rufus.html",
      img: "_img/wide-hs-rufus.jpg",
      name: "RUFUS",
      text:
        "The blonde blade of the Ne'er-do-wells and blade smith of Cidermayer. This final mission may test the limits of their friendships and their fate.",
      alt: "Featured character: Rufus",
      aria: "Open dossier: Rufus",
      cta: "Open dossier →",
    },
  ];

  const pad2 = (n) => String(n).padStart(2, "0");

  // Local YYYY-MM-DD (stable per local day)
  const localDayKey = (() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = pad2(d.getMonth() + 1);
    const day = pad2(d.getDate());
    return `${y}-${m}-${day}`;
  })();

  // Deterministic daily index (no randomness needed)
  const dayNumberLocalMidnight = (() => {
    const d = new Date();
    const midnight = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return Math.floor(midnight.getTime() / 86400000);
  })();

  const storageKeyDate = "hs_featured_date";
  const storageKeyIndex = "hs_featured_index";

  let chosenIndex = dayNumberLocalMidnight % FEATURED_ITEMS.length;

  try {
    const storedDate = localStorage.getItem(storageKeyDate);
    const storedIndexRaw = localStorage.getItem(storageKeyIndex);

    if (storedDate === localDayKey && storedIndexRaw != null) {
      const storedIndex = Number(storedIndexRaw);
      if (Number.isInteger(storedIndex) && storedIndex >= 0 && storedIndex < FEATURED_ITEMS.length) {
        chosenIndex = storedIndex;
      }
    } else {
      // Store today's deterministic choice (helps consistency across refreshes)
      localStorage.setItem(storageKeyDate, localDayKey);
      localStorage.setItem(storageKeyIndex, String(chosenIndex));
    }
  } catch (_) {
    // If storage is blocked, just fall back to deterministic index above
  }

  const item = FEATURED_ITEMS[chosenIndex];

  // Apply to DOM
  featuredWrap.href = item.href;
  featuredWrap.setAttribute("aria-label", item.aria);

  if (featuredImg) {
    featuredImg.src = item.img;
    featuredImg.alt = item.alt;
  }

  if (featuredName) featuredName.textContent = item.name;
  if (featuredText) featuredText.textContent = item.text;
  if (featuredCta) featuredCta.textContent = item.cta;
})();