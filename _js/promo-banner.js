// Shared book promo banners — edit here to update every page.
// Renders into any <div data-promo-banner></div> on the page.
//
// - Each entry in BOOKS becomes its own banner, stacked in the order listed.
// - To show only specific books on a page, list their ids:
//     <div data-promo-banner="ch1"></div>   or   data-promo-banner="ch1 ch2"
// - In each book's `links`, the first link is the main (yellow) button;
//   any others are outlined secondary buttons.
(() => {
  const BOOKS = [
    {
      id: "ch1",
      kicker: "Now in Print & Digital",
      title: "Hue Shift — Chapter One: Atrocities",
      sub: "Own the full chapter and support the series.",
      links: [
        {
          label: "Get the Print Copy",
          href: "https://svc.lulu.com/?items=b6ca61cd-b8cd-4258-b7b1-eba754d1d917",
          ariaLabel: "Buy the Hue Shift Chapter One: Atrocities print copy on Lulu",
        },
        {
          label: "Digital on Patreon",
          href: "https://www.patreon.com/greyvoth/posts/hue-shift-one-26-162609979?source=storefront",
          ariaLabel: "Get the Hue Shift Chapter One: Atrocities digital copy on Patreon",
        },
      ],
    },
    // Next book — copy the block above, give it a new id, and fill it in:
    // {
    //   id: "ch2",
    //   kicker: "Now in Print & Digital",
    //   title: "Hue Shift — Chapter Two: ...",
    //   sub: "...",
    //   links: [
    //     { label: "Get the Print Copy", href: "https://...", ariaLabel: "..." },
    //     { label: "Digital on Patreon", href: "https://...", ariaLabel: "..." },
    //   ],
    // },
  ];

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const renderBook = (b) => `
    <div class="hs-promoBanner">
      <div class="hs-promoBanner-body">
        ${b.kicker ? `<span class="hs-promoBanner-kicker">${esc(b.kicker)}</span>` : ""}
        <span class="hs-promoBanner-title">${esc(b.title)}</span>
        ${b.sub ? `<span class="hs-promoBanner-sub">${esc(b.sub)}</span>` : ""}
      </div>
      <div class="hs-promoBanner-actions">
        ${b.links
          .map(
            (l, i) =>
              `<a class="hs-promoBanner-cta${i > 0 ? " hs-promoBanner-cta--secondary" : ""}" href="${esc(l.href)}" target="_blank" rel="noopener noreferrer"${l.ariaLabel ? ` aria-label="${esc(l.ariaLabel)}"` : ""}>${esc(l.label)}</a>`
          )
          .join("")}
      </div>
    </div>`;

  document.querySelectorAll("[data-promo-banner]").forEach((el) => {
    const ids = el.dataset.promoBanner.trim().split(/\s+/).filter(Boolean);
    const books = ids.length ? BOOKS.filter((b) => ids.includes(b.id)) : BOOKS;
    el.classList.add("d-grid", "gap-3");
    el.innerHTML = books.map(renderBook).join("");
  });
})();
