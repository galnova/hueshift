// Shared footer links — edit here to update every page.
// Renders into any <nav data-footer-links></nav> on the page.
(() => {
  const FOOTER_SECTIONS = [
    {
      id: "footer-prints",
      title: "Support Me",
      extraClass: "border-md-end border-light border-opacity-10",
      links: [
        { label: "Hue Shift Book - Print", href: "https://svc.lulu.com/?items=b6ca61cd-b8cd-4258-b7b1-eba754d1d917" },
        { label: "Hue Shift Book - Digital", href: "https://www.patreon.com/greyvoth/posts/hue-shift-one-26-162609979?source=storefront" },
        { label: "Hue Shift Prints", href: "https://www.teepublic.com/user/greyvoth" },
        // { label: "My PayPal", href: "https://www.paypal.me/greyvoth" },
        { label: "Patreon", href: "https://www.patreon.com/greyvoth" },
      ],
    },
    {
      id: "footer-more",
      title: "My Other Projects",
      links: [
        { label: "Greyvoth.com", href: "https://greyvoth.com" },
        { label: "Gods V. Men", href: "https://godsvmen.com" },
      ],
    },
    {
      id: "footer-social",
      title: "My Socials",
      links: [
        { label: "TikTok", href: "https://www.tiktok.com/@greyvoth" },
        { label: "YouTube", href: "https://www.youtube.com/user/riotgear2007" },
        { label: "Instagram", href: "https://www.instagram.com/greyvoth" },
      ],
    },
  ];

  const LINK_CLASS = "link-light link-underline-opacity-0 link-underline-opacity-100-hover";

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const html = `
    <div class="row g-0 align-items-stretch">
      ${FOOTER_SECTIONS.map(
        (s) => `
        <section class="col-12 col-md-4 py-2 border-top border-light border-opacity-10 border-md-top-0 ${s.extraClass || ""}">
          <h3 class="h6 m-0 mb-2 text-uppercase small opacity-75" id="${s.id}">${esc(s.title)}</h3>
          <ul class="list-unstyled m-0 d-grid gap-2" aria-labelledby="${s.id}">
            ${s.links
              .map(
                (l) =>
                  `<li><a class="${LINK_CLASS}" href="${esc(l.href)}" target="_blank" rel="noopener noreferrer">${esc(l.label)}</a></li>`
              )
              .join("")}
          </ul>
        </section>`
      ).join("")}
    </div>`;

  document.querySelectorAll("[data-footer-links]").forEach((nav) => {
    nav.innerHTML = html;
  });
})();
