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
  initCliName();
  initPageTransitions();
  initImageFallbacks();
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

/* --------------------------------------------------------------------------
   Missing-image fallback
   The about page shows a monogram behind the profile photo. If the image
   file hasn't been added yet, hide the broken <img> so the monogram shows
   cleanly instead of unstyled alt text.
   -------------------------------------------------------------------------- */
function initImageFallbacks() {
  var images = document.querySelectorAll(".profile-photo img");

  Array.prototype.forEach.call(images, function (img) {
    function hide() {
      img.remove();
    }

    // The error may have fired before this script ran, so check that too.
    if (img.complete && img.naturalWidth === 0) {
      hide();
      return;
    }

    img.addEventListener("error", hide);
  });
}

/* --------------------------------------------------------------------------
   Terminal-style name
   The home and about pages mark the name with data-cli-name. We wrap each
   letter in a span so CSS can fade them in one at a time (a typewriter
   effect) and add a blinking block cursor after it.
   The original text is kept for screen readers via aria-label, and if this
   script or the CSS animation never runs the plain text stays visible.
   -------------------------------------------------------------------------- */
function initCliName() {
  var names = document.querySelectorAll("[data-cli-name]");

  if (!names.length) return;
  if (prefersReducedMotion()) return; // leave the name static

  Array.prototype.forEach.call(names, function (element) {
    var text = element.textContent.trim();

    element.setAttribute("aria-label", text);
    element.textContent = "";

    var fragment = document.createDocumentFragment();
    var index = 0;

    // One wrapper per word, so a narrow screen can wrap between words
    // instead of splitting a letter off in the middle of the name.
    text.split(" ").forEach(function (word, wordIndex) {
      if (wordIndex > 0) fragment.appendChild(document.createTextNode(" "));

      var wordEl = document.createElement("span");
      wordEl.className = "cli-word";

      for (var i = 0; i < word.length; i++) {
        var character = document.createElement("span");
        character.className = "cli-char";
        character.style.setProperty("--i", index);
        character.textContent = word.charAt(i);
        wordEl.appendChild(character);
        index++;
      }

      fragment.appendChild(wordEl);
    });

    // Blinking block cursor, like the one in a terminal. It appears once the
    // last letter is in, so it never floats ahead of the text being typed.
    var caret = document.createElement("span");
    caret.className = "cli-caret";
    caret.style.setProperty("--caret-delay", index * 55 + 80 + "ms");
    caret.setAttribute("aria-hidden", "true");
    fragment.appendChild(caret);

    element.appendChild(fragment);
  });
}

/* --------------------------------------------------------------------------
   Page transitions
   Every page fades its <main> in via CSS. For link clicks we also fade the
   page out for a moment before navigating, so switching pages feels smooth
   instead of flashing. New tabs, downloads, mail links and hash links are
   left to the browser, and visitors with reduced motion get instant loads.
   -------------------------------------------------------------------------- */
function initPageTransitions() {
  // Coming back with the browser's back/forward cache: clear the fade-out
  // class, otherwise the restored page would stay invisible.
  window.addEventListener("pageshow", function () {
    document.documentElement.classList.remove("page-leaving");
  });

  if (prefersReducedMotion()) return;

  document.addEventListener("click", function (event) {
    // Let modified clicks (new tab, new window, download) behave normally
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    var link = event.target.closest ? event.target.closest("a") : null;
    if (!link) return;

    var href = link.getAttribute("href");
    if (!href || link.target === "_blank" || link.hasAttribute("download")) return;
    if (/^(mailto:|tel:|#)/i.test(href)) return;

    // Only animate between pages of this site
    if (link.origin !== window.location.origin) return;

    // Same page with an anchor: let the browser scroll instead
    if (link.pathname === window.location.pathname && link.hash) return;

    event.preventDefault();

    var destination = link.href;
    document.documentElement.classList.add("page-leaving");

    window.setTimeout(function () {
      window.location.href = destination;
    }, 180);
  });
}
