/* ==========================================================================
   Damodar Joshi — Personal Networking Portfolio
   main.js: small, dependency-free scripts shared by every page.
   Loaded with `defer`, so the HTML is already parsed when it runs.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {
  initNavToggle();
  initContactForm();
  initScrollEffects();
  initScrollReveal();
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

/* --------------------------------------------------------------------------
   Contact form
   Validates the name / email / message fields before anything is sent, shows
   a friendly message under each invalid field, and then posts to Formspree.
   The form's action is a placeholder until a real Formspree ID is added; in
   that case we say so instead of pretending the message was sent.
   -------------------------------------------------------------------------- */
function initContactForm() {
  var form = document.getElementById("contact-form");
  if (!form) return; // not on the contact page

  var status = document.getElementById("form-status");

  var fields = {
    name: {
      input: document.getElementById("name"),
      error: document.getElementById("name-error")
    },
    email: {
      input: document.getElementById("email"),
      error: document.getElementById("email-error")
    },
    message: {
      input: document.getElementById("message"),
      error: document.getElementById("message-error")
    }
  };

  // Each rule returns an error message, or "" when the value is fine.
  var rules = {
    name: function (value) {
      if (!value) return "Please tell me your name.";
      if (value.length < 2) return "That name looks a little short.";
      return "";
    },
    email: function (value) {
      if (!value) return "Please add an email address so I can reply.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return "That email address doesn't look right.";
      }
      return "";
    },
    message: function (value) {
      if (!value) return "Please write a short message.";
      if (value.length < 10) return "Could you add a little more detail? (at least 10 characters)";
      return "";
    }
  };

  function showError(name, message) {
    fields[name].error.textContent = message;
    fields[name].input.setAttribute("aria-invalid", "true");
  }

  function clearError(name) {
    fields[name].error.textContent = "";
    fields[name].input.removeAttribute("aria-invalid");
  }

  // Returns true when the field is valid.
  function validateField(name) {
    var value = fields[name].input.value.trim();
    var message = rules[name](value);

    if (message) {
      showError(name, message);
      return false;
    }

    clearError(name);
    return true;
  }

  function showStatus(message, type) {
    status.textContent = message;
    status.className = "form-status" + (type ? " is-" + type : "");
  }

  // Validate when a field loses focus, and clear the error as it's corrected.
  Object.keys(fields).forEach(function (name) {
    fields[name].input.addEventListener("blur", function () {
      validateField(name);
    });
    fields[name].input.addEventListener("input", function () {
      if (fields[name].error.textContent) clearError(name);
    });
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var firstInvalid = null;

    Object.keys(fields).forEach(function (name) {
      var valid = validateField(name);
      if (!valid && !firstInvalid) firstInvalid = fields[name].input;
    });

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    var action = form.getAttribute("action") || "";

    // No real Formspree endpoint yet: be honest instead of losing the message.
    if (action.indexOf("YOUR_FORM_ID") !== -1) {
      showStatus(
        "This form isn't connected to Formspree yet, so your message wasn't sent. " +
        "Please email me at damodarj36@gmail.com in the meantime.",
        "error"
      );
      return;
    }

    showStatus("Sending your message...", "");

    // Formspree accepts JSON responses when we ask for them this way.
    fetch(action, {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" }
    })
      .then(function (response) {
        if (!response.ok) throw new Error("Request failed");
        form.reset();
        showStatus("Thanks — your message is on its way. I'll get back to you as soon as I can.", "success");
      })
      .catch(function () {
        showStatus(
          "Something went wrong while sending. Please try again, or email me at " +
          "damodarj36@gmail.com.",
          "error"
        );
      });
  });
}

/* --------------------------------------------------------------------------
   Shared motion preference
   Returns true when the visitor asked their system for reduced motion.
   -------------------------------------------------------------------------- */
function prefersReducedMotion() {
  return window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* --------------------------------------------------------------------------
   Scroll effects: navbar shadow + back to top button
   Both react to the same scroll event, so the handler is throttled with
   requestAnimationFrame to keep it cheap.
   -------------------------------------------------------------------------- */
function initScrollEffects() {
  var header = document.querySelector(".site-header");
  var button = createBackToTopButton();

  function update() {
    var scrolled = window.scrollY || window.pageYOffset;

    if (header) header.classList.toggle("is-scrolled", scrolled > 8);
    if (button) button.classList.toggle("is-visible", scrolled > 420);
  }

  var ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      update();
      ticking = false;
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  update();

  if (button) {
    button.addEventListener("click", function () {
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion() ? "auto" : "smooth"
      });
    });
  }
}

/* Builds the floating "back to top" button and adds it to the page. */
function createBackToTopButton() {
  if (document.querySelector(".back-to-top")) return document.querySelector(".back-to-top");

  var button = document.createElement("button");
  button.type = "button";
  button.className = "back-to-top";
  button.setAttribute("aria-label", "Back to top");
  button.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<path d="M12 19V5"></path><path d="M5 12l7-7 7 7"></path></svg>';

  document.body.appendChild(button);
  return button;
}

/* --------------------------------------------------------------------------
   Scroll reveal
   Cards and section blocks fade up the first time they enter the viewport.
   The .reveal-ready class on <html> is what activates the CSS, so if this
   script never runs the content simply stays visible.
   -------------------------------------------------------------------------- */
function initScrollReveal() {
  if (!("IntersectionObserver" in window)) return;
  if (prefersReducedMotion()) return;

  var targets = document.querySelectorAll(
    ".card, .section-title, .connect-panel, .about-intro, .contact-intro, " +
    ".page-header, .skill-group, .timeline-item, .preferred-note"
  );

  if (!targets.length) return;

  document.documentElement.classList.add("reveal-ready");

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target); // reveal once, then stop watching
    });
  }, {
    threshold: 0.12,
    rootMargin: "0px 0px -40px 0px"
  });

  Array.prototype.forEach.call(targets, function (element, index) {
    element.classList.add("reveal");
    // Small stagger so grids don't pop in all at once
    element.style.setProperty("--reveal-delay", (index % 3) * 80 + "ms");
    observer.observe(element);
  });
}
