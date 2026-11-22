/* ==========================================================================
   Damodar Joshi — Personal Networking Portfolio
   main.js: small, dependency-free scripts shared by every page.
   Loaded with `defer`, so the HTML is already parsed when it runs.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {
  initNavToggle();
  initFooterYear();
  renderIcons();
});

/* --------------------------------------------------------------------------
   Mobile navigation
   Below 768px the nav links live in a hidden panel that this button opens
   and closes. The button's aria-expanded attribute is the source of truth,
   and it also drives which icon (menu / X) is visible via CSS.
   -------------------------------------------------------------------------- */
function initNavToggle() {
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.getElementById("nav-menu");

  if (!toggle || !menu) return; // not on a page with a navbar

  function setMenu(open) {
    menu.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }

  toggle.addEventListener("click", function () {
    setMenu(toggle.getAttribute("aria-expanded") !== "true");
  });

  // Close after tapping a link, so the panel doesn't cover the page
  menu.addEventListener("click", function (event) {
    if (event.target.closest("a")) setMenu(false);
  });

  // Close with the Escape key
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") setMenu(false);
  });

  // Close when clicking anywhere outside the menu and the button
  document.addEventListener("click", function (event) {
    if (!menu.contains(event.target) && !toggle.contains(event.target)) {
      setMenu(false);
    }
  });

  // If the window grows past the mobile breakpoint, reset to the closed state
  window.addEventListener("resize", function () {
    if (window.innerWidth >= 768) setMenu(false);
  });
}

/* --------------------------------------------------------------------------
   Footer year (keeps the copyright notice from going stale)
   -------------------------------------------------------------------------- */
function initFooterYear() {
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

/* --------------------------------------------------------------------------
   Lucide icons
   The Lucide CDN script loads before this file and swaps every
   <i data-lucide="name"> element for an inline SVG.
   -------------------------------------------------------------------------- */
function renderIcons() {
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
}
