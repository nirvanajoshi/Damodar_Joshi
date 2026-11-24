/* ==========================================================================
   Damodar Joshi — Personal Networking Portfolio
   main.js: small, dependency-free scripts shared by every page.
   Loaded with `defer`, so the HTML is already parsed when it runs.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {
  initTheme();
  initBackground();
  initNavToggle();
  initContactForm();
  initScrollEffects();
  initScrollReveal();
  initCardSpotlight();
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
  var progress = createScrollProgress();

  function update() {
    var scrolled = window.scrollY || window.pageYOffset;

    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.setProperty("--progress", max > 0 ? Math.min(scrolled / max, 1).toFixed(4) : 0);
    }

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

/* Thin bar at the top of the window that fills as the page is read. */
function createScrollProgress() {
  var bar = document.createElement("div");
  bar.className = "scroll-progress";
  bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);
  window.addEventListener("resize", function () {
    window.dispatchEvent(new Event("scroll"));
  }, { passive: true });
  return bar;
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

  Array.prototype.forEach.call(targets, function (element) {
    element.classList.add("reveal");

    // Stagger by position inside the parent, so each row of a grid ripples in
    // from left to right instead of everything popping at once.
    var position = 0;
    var sibling = element.previousElementSibling;
    while (sibling && position < 6) {
      position++;
      sibling = sibling.previousElementSibling;
    }
    element.style.setProperty("--reveal-delay", (position % 3) * 110 + "ms");
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

/* --------------------------------------------------------------------------
   Theme (light / dark)
   Order of precedence:
     1. the visitor's saved choice (localStorage "theme"), set by the switch
     2. otherwise the system setting (prefers-color-scheme), kept live: if the
        phone or computer flips between light and dark, the site follows
   An inline script in every <head> applies the theme before first paint; this
   function wires up the switch and keeps everything else in sync.
   -------------------------------------------------------------------------- */
function initTheme() {
  var root = document.documentElement;
  var query = window.matchMedia ? window.matchMedia("(prefers-color-scheme: light)") : null;
  var buttons = document.querySelectorAll(".theme-toggle");
  var colors = { dark: "#0a0b0d", light: "#f6f8fb" };
  var animTimer = null;

  function saved() {
    try {
      var value = localStorage.getItem("theme");
      return value === "light" || value === "dark" ? value : null;
    } catch (error) {
      return null; // storage blocked (private mode, strict settings)
    }
  }

  function system() {
    return query && query.matches ? "light" : "dark";
  }

  function apply(theme, animate) {
    if (animate && !prefersReducedMotion()) {
      root.classList.add("theme-anim");
      window.clearTimeout(animTimer);
      animTimer = window.setTimeout(function () {
        root.classList.remove("theme-anim");
      }, 450);
    }

    root.setAttribute("data-theme", theme);
    root.style.colorScheme = theme;

    // Browser UI color (address bar on phones) follows the chosen theme
    Array.prototype.forEach.call(
      document.querySelectorAll('meta[name="theme-color"]'),
      function (meta) {
        meta.removeAttribute("media");
        meta.setAttribute("content", colors[theme]);
      }
    );

    Array.prototype.forEach.call(buttons, function (button) {
      button.setAttribute(
        "aria-label",
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
      );
      button.setAttribute("title", theme === "dark" ? "Light mode" : "Dark mode");
    });
  }

  apply(root.getAttribute("data-theme") || saved() || system(), false);

  Array.prototype.forEach.call(buttons, function (button) {
    button.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      apply(next, true);
      try {
        localStorage.setItem("theme", next);
      } catch (error) {
        /* not saved, but the switch still works for this visit */
      }
    });
  });

  // Follow the system only while the visitor hasn't picked a theme themselves
  function onSystemChange() {
    if (!saved()) apply(system(), true);
  }

  if (query) {
    if (query.addEventListener) query.addEventListener("change", onSystemChange);
    else if (query.addListener) query.addListener(onSystemChange);
  }

  // A choice made in another tab applies here too
  window.addEventListener("storage", function (event) {
    if (event.key === "theme") apply(saved() || system(), true);
  });
}

/* --------------------------------------------------------------------------
   Card spotlight
   A soft glow follows the mouse across a card. We only store the pointer
   position in two CSS variables; the CSS does the drawing.
   -------------------------------------------------------------------------- */
function initCardSpotlight() {
  if (!window.matchMedia || !window.matchMedia("(hover: hover)").matches) return;

  document.addEventListener("pointermove", function (event) {
    if (event.pointerType && event.pointerType !== "mouse") return;

    var card = event.target.closest ? event.target.closest(".card, .skill-group") : null;
    if (!card) return;

    var rect = card.getBoundingClientRect();
    card.style.setProperty("--mx", event.clientX - rect.left + "px");
    card.style.setProperty("--my", event.clientY - rect.top + "px");
  }, { passive: true });
}

/* --------------------------------------------------------------------------
   Live background: one scene per page
     Home      "packet rain"     columns of hex bytes falling like raw traffic
     About     "radar"           a sweep that lights up blips as it passes
     Projects  "circuit traces"  traces grow along a board grid and turn
     Contact   "ping ripples"    rings spread out like pings (click to ping)
   Every scene is drawn on the same canvas and uses the theme colors from the
   CSS tokens, so it re-colors itself when the theme changes.

   Care taken so it stays cheap:
   - it pauses while the tab is hidden
   - fewer elements on phones
   - with reduced motion it draws a single still frame and never loops
   -------------------------------------------------------------------------- */
var TAU = Math.PI * 2;

function rgba(rgb, alpha) {
  return "rgba(" + rgb + "," + alpha.toFixed(3) + ")";
}

/* ---- Home: packet rain ---- */
function sceneRain() {
  var cols = [];
  var size = 16;
  var w = 0;
  var h = 0;
  var HEX = "0123456789ABCDEF";

  function pick() {
    return HEX.charAt(Math.floor(Math.random() * 16));
  }

  function reset(col, first) {
    col.len = 6 + Math.floor(Math.random() * 10);
    col.speed = 0.45 + Math.random() * 1.0;
    col.y = first ? Math.random() * h : -Math.random() * h * 0.5;
    col.chars = [];
    for (var i = 0; i < col.len; i++) col.chars.push(pick());
  }

  return {
    init: function (width, height) {
      w = width;
      h = height;
      size = w < 700 ? 14 : 16;
      var gap = size * 2;
      cols = [];
      for (var x = gap / 2; x < w; x += gap) {
        if (Math.random() < 0.4) continue; // leave gaps so it stays calm
        var col = { x: x, tick: Math.random() * 10 };
        reset(col, true);
        cols.push(col);
      }
    },
    step: function (scale) {
      for (var i = 0; i < cols.length; i++) {
        var col = cols[i];
        col.y += col.speed * scale;
        col.tick += scale;
        if (col.tick > 9) {
          col.tick = 0;
          col.chars[Math.floor(Math.random() * col.len)] = pick();
        }
        if (col.y - col.len * size > h) reset(col, false);
      }
    },
    draw: function (ctx, c, gain) {
      ctx.font = size + 'px "JetBrains Mono", ui-monospace, monospace';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (var i = 0; i < cols.length; i++) {
        var col = cols[i];
        for (var j = 0; j < col.len; j++) {
          var y = col.y - j * size;
          if (y < -size || y > h + size) continue;

          if (j === 0) {
            ctx.fillStyle = rgba(c.alt, Math.min(0.5 * gain, 0.8));
          } else {
            ctx.fillStyle = rgba(c.main, (1 - j / col.len) * 0.18 * gain);
          }
          ctx.fillText(col.chars[j], col.x, y);
        }
      }
    }
  };
}

/* ---- About: radar ---- */
function sceneRadar() {
  var cx = 0;
  var cy = 0;
  var radius = 0;
  var angle = 0;
  var blips = [];

  function placeBlip(blip) {
    blip.a = Math.random() * TAU;
    blip.d = radius * (0.12 + Math.random() * 0.85);
    blip.lit = 0;
  }

  return {
    init: function (w, h) {
      cx = w * 0.5;
      cy = h * 0.5;
      radius = Math.sqrt(w * w + h * h) * 0.55;
      angle = Math.random() * TAU;
      blips = [];
      for (var i = 0; i < (w < 700 ? 12 : 22); i++) {
        var blip = {};
        placeBlip(blip);
        blips.push(blip);
      }
    },
    step: function (scale) {
      angle = (angle + 0.011 * scale) % TAU;

      for (var i = 0; i < blips.length; i++) {
        var blip = blips[i];
        var behind = (((angle - blip.a) % TAU) + TAU) % TAU; // how far the sweep is past it
        if (behind < 0.05) blip.lit = 1;
        blip.lit = Math.max(0, blip.lit - 0.0045 * scale);
        if (blip.lit === 0 && Math.random() < 0.0008 * scale) placeBlip(blip);
      }
    },
    draw: function (ctx, c, gain) {
      var i;

      // Range rings and cross-hair
      ctx.lineWidth = 1;
      ctx.strokeStyle = rgba(c.main, 0.11 * gain);
      for (i = 1; i <= 6; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, (radius * i) / 6, 0, TAU);
        ctx.stroke();
      }
      ctx.strokeStyle = rgba(c.main, 0.07 * gain);
      ctx.beginPath();
      ctx.moveTo(cx - radius, cy);
      ctx.lineTo(cx + radius, cy);
      ctx.moveTo(cx, cy - radius);
      ctx.lineTo(cx, cy + radius);
      ctx.stroke();

      // The sweep: a fan of thin wedges that fade out behind the line
      var slices = 36;
      var width = 0.03;
      for (i = 0; i < slices; i++) {
        var from = angle - (i + 1) * width;
        ctx.fillStyle = rgba(c.main, (1 - i / slices) * 0.13 * gain);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, from, from + width + 0.004);
        ctx.closePath();
        ctx.fill();
      }

      ctx.strokeStyle = rgba(c.alt, 0.5 * gain);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
      ctx.stroke();

      // Blips light up when the sweep passes, then fade
      for (i = 0; i < blips.length; i++) {
        var blip = blips[i];
        if (blip.lit <= 0) continue;

        var bx = cx + Math.cos(blip.a) * blip.d;
        var by = cy + Math.sin(blip.a) * blip.d;

        ctx.fillStyle = rgba(c.alt, Math.min(blip.lit * 0.9 * gain, 1));
        ctx.beginPath();
        ctx.arc(bx, by, 3, 0, TAU);
        ctx.fill();

        ctx.strokeStyle = rgba(c.alt, blip.lit * 0.4 * gain);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(bx, by, 4 + (1 - blip.lit) * 16, 0, TAU);
        ctx.stroke();
      }
    }
  };
}

/* ---- Projects: circuit traces ---- */
function sceneCircuit() {
  var grid = 56;
  var w = 0;
  var h = 0;
  var traces = [];
  var DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];

  function spawn() {
    var gx = Math.floor((Math.random() * w) / grid);
    var gy = Math.floor((Math.random() * h) / grid);
    var dir = DIRS[Math.floor(Math.random() * 4)];
    return {
      x: gx * grid,
      y: gy * grid,
      dx: dir[0],
      dy: dir[1],
      togo: grid,
      speed: 0.8 + Math.random() * 1.0,
      steps: 7 + Math.floor(Math.random() * 16),
      trail: [{ x: gx * grid, y: gy * grid }],
      fade: 1,
      dead: false,
      alt: Math.random() < 0.3
    };
  }

  return {
    init: function (width, height) {
      w = width;
      h = height;
      grid = w < 700 ? 44 : 56;
      traces = [];
      for (var i = 0; i < (w < 700 ? 8 : 15); i++) traces.push(spawn());
    },
    step: function (scale) {
      for (var i = 0; i < traces.length; i++) {
        var t = traces[i];

        if (t.dead) {
          t.fade -= 0.012 * scale;
          if (t.fade <= 0) traces[i] = spawn();
          continue;
        }

        var move = t.speed * scale;
        t.x += t.dx * move;
        t.y += t.dy * move;
        t.togo -= move;

        if (t.togo <= 0) {
          // Reached a grid point: snap to it, then maybe turn
          t.x = Math.round(t.x / grid) * grid;
          t.y = Math.round(t.y / grid) * grid;
          t.trail.push({ x: t.x, y: t.y });
          if (t.trail.length > 16) t.trail.shift();

          t.steps--;
          if (t.steps <= 0 || t.x < 0 || t.x > w || t.y < 0 || t.y > h) {
            t.dead = true;
          } else {
            if (Math.random() < 0.32) {
              var turn = Math.random() < 0.5 ? 1 : -1;
              var ndx = -t.dy * turn;
              var ndy = t.dx * turn;
              t.dx = ndx;
              t.dy = ndy;
            }
            t.togo = grid;
          }
        }
      }
    },
    draw: function (ctx, c, gain) {
      var i;
      var j;

      // The board: a faint grid of solder points
      ctx.fillStyle = rgba(c.main, 0.13 * gain);
      for (var gx = 0; gx <= w; gx += grid) {
        for (var gy = 0; gy <= h; gy += grid) {
          ctx.fillRect(gx - 1, gy - 1, 2, 2);
        }
      }

      ctx.lineWidth = 1.5;
      ctx.lineJoin = "round";

      for (i = 0; i < traces.length; i++) {
        var t = traces[i];
        var rgb = t.alt ? c.alt : c.main;
        var points = t.trail.slice();
        if (!t.dead) points.push({ x: t.x, y: t.y });

        // Older parts of the trace are fainter
        for (j = 1; j < points.length; j++) {
          var age = j / points.length;
          ctx.strokeStyle = rgba(rgb, age * 0.42 * t.fade * gain);
          ctx.beginPath();
          ctx.moveTo(points[j - 1].x, points[j - 1].y);
          ctx.lineTo(points[j].x, points[j].y);
          ctx.stroke();
        }

        var end = points[points.length - 1];

        if (t.dead) {
          // Finished traces end in a ring, like a via
          ctx.strokeStyle = rgba(rgb, 0.55 * t.fade * gain);
          ctx.beginPath();
          ctx.arc(end.x, end.y, 4, 0, TAU);
          ctx.stroke();
        } else {
          ctx.fillStyle = rgba(rgb, Math.min(0.85 * gain, 1));
          ctx.fillRect(end.x - 2.5, end.y - 2.5, 5, 5);
        }
      }
    }
  };
}

/* ---- Contact: ping ripples ---- */
function sceneRipple() {
  var w = 0;
  var h = 0;
  var ripples = [];
  var timer = 0;

  function ping(x, y) {
    ripples.push({
      x: x,
      y: y,
      t: 0,
      max: 220 + Math.random() * 220,
      alt: Math.random() < 0.4
    });
    if (ripples.length > 14) ripples.shift();
  }

  return {
    init: function (width, height) {
      w = width;
      h = height;
      ripples = [];
      timer = 0;
      for (var i = 0; i < 4; i++) {
        ping(Math.random() * w, Math.random() * h);
        ripples[i].t = Math.random() * 0.7;
      }
    },
    step: function (scale) {
      timer -= scale;
      if (timer <= 0) {
        ping(Math.random() * w, Math.random() * h);
        timer = 55 + Math.random() * 75;
      }

      for (var i = ripples.length - 1; i >= 0; i--) {
        ripples[i].t += 0.0062 * scale;
        if (ripples[i].t >= 1.3) ripples.splice(i, 1);
      }
    },
    draw: function (ctx, c, gain) {
      ctx.lineWidth = 1.5;

      for (var i = 0; i < ripples.length; i++) {
        var r = ripples[i];
        var rgb = r.alt ? c.alt : c.main;

        // Three rings per ping, each one a little behind the last
        for (var k = 0; k < 3; k++) {
          var t = r.t - k * 0.13;
          if (t <= 0 || t >= 1) continue;

          ctx.strokeStyle = rgba(rgb, Math.pow(1 - t, 1.6) * 0.42 * gain);
          ctx.beginPath();
          ctx.arc(r.x, r.y, t * r.max, 0, TAU);
          ctx.stroke();
        }

        if (r.t < 0.35) {
          ctx.fillStyle = rgba(rgb, (1 - r.t / 0.35) * 0.8 * gain);
          ctx.beginPath();
          ctx.arc(r.x, r.y, 3, 0, TAU);
          ctx.fill();
        }
      }
    },
    ping: ping
  };
}

function currentPageName() {
  var file = window.location.pathname.split("/").pop().replace(/\.html$/, "").toLowerCase();
  if (file === "about" || file === "projects" || file === "contact") return file;
  return "home"; // index.html, "/" and the GitHub Pages repo root
}

function initBackground() {
  if (document.querySelector(".bg-canvas")) return;

  var page = currentPageName();
  var makers = { home: sceneRain, about: sceneRadar, projects: sceneCircuit, contact: sceneRipple };
  var scene = makers[page]();

  var glow = document.createElement("div");
  glow.className = "bg-glow";
  glow.setAttribute("data-scene", page);
  glow.setAttribute("aria-hidden", "true");

  var canvas = document.createElement("canvas");
  canvas.className = "bg-canvas";
  canvas.setAttribute("aria-hidden", "true");

  document.body.insertBefore(canvas, document.body.firstChild);
  document.body.insertBefore(glow, canvas);

  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  var reduced = prefersReducedMotion();
  var width = 0;
  var height = 0;
  var colors = { main: "91, 157, 255", alt: "79, 209, 197", light: false };
  var running = false;
  var lastTime = 0;

  function readColors() {
    var style = window.getComputedStyle(document.documentElement);
    colors.main = style.getPropertyValue("--net-rgb").trim() || colors.main;
    colors.alt = style.getPropertyValue("--net-rgb-2").trim() || colors.alt;
    colors.light = document.documentElement.getAttribute("data-theme") === "light";
  }

  function paint() {
    ctx.clearRect(0, 0, width, height);
    // Light backgrounds need slightly stronger strokes to read the same
    scene.draw(ctx, colors, colors.light ? 1.3 : 1);
  }

  function still() {
    // Reduced motion: let the scene settle for a moment, then draw it once
    for (var i = 0; i < 160; i++) scene.step(1);
    paint();
  }

  function resize() {
    var newWidth = window.innerWidth;
    var newHeight = window.innerHeight;
    var ratio = Math.min(window.devicePixelRatio || 1, 2);

    // Phones fire resize when the address bar hides; don't restart for that
    var restart = newWidth !== width || Math.abs(newHeight - height) > 150;

    width = newWidth;
    height = newHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    if (restart) scene.init(width, height);
    if (reduced) {
      if (restart) still();
      else paint();
    }
  }

  function frame(time) {
    if (!running) return;

    // Cap the step so returning to a tab doesn't make everything jump
    var delta = lastTime ? Math.min(time - lastTime, 50) : 16.7;
    lastTime = time;

    scene.step(delta / 16.7); // 1 at 60fps, so speed is the same on any screen
    paint();
    window.requestAnimationFrame(frame);
  }

  function start() {
    if (running || reduced) return;
    running = true;
    lastTime = 0;
    window.requestAnimationFrame(frame);
  }

  readColors();
  resize();

  // Re-color when the theme changes (switch, system setting, other tab)
  new MutationObserver(function () {
    readColors();
    if (reduced) paint();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  var resizeTimer = null;
  window.addEventListener("resize", function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(resize, 120);
  });

  // Contact page: click or tap anywhere empty to send a ping
  if (scene.ping) {
    window.addEventListener("pointerdown", function (event) {
      if (event.target.closest && event.target.closest("a, button, input, textarea, select, label")) return;
      scene.ping(event.clientX, event.clientY);
      if (reduced) paint();
    });
  }

  // Pause when the tab isn't visible
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) running = false;
    else start();
  });

  // Back/forward cache: the loop was paused with the page, so restart it
  window.addEventListener("pageshow", function () {
    if (!document.hidden) start();
  });

  start();
}
