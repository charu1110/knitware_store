/* ==========================================================================
   PANWAR KNITWEAR — shared behaviour
   Vanilla JS, no dependencies. Every block is guarded on its DOM anchor, so
   this one file drives all five pages.
   ========================================================================== */
(function () {
  "use strict";

  var WA_NUMBER = "919876045457"; // +91 98760 45457
  var THEME_KEY = "pk-theme";
  var QUOTE_KEY = "pk_quote_v1";

  /* wa.me encodes every newline as %0A and every space as %20 — 3x each — so
     budget the whole URL, not the plain text. Android intent limits and
     in-app browsers truncate around 2k. */
  var MAX_URL = 1800;

  /* ---------- helpers ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* Every interpolation into markup goes through this. The quote builder
     re-renders user-supplied text (colours, sizes, notes), so escaping is a
     security boundary, not a nicety. */
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* one regex, shared by the contact form and the quote builder */
  var PHONE_RE = /^[+\d][\d\s-]{7,}$/;

  function uid() { return "l" + Math.random().toString(36).slice(2, 8); }

  function photo(id, w) {
    return "https://images.pexels.com/photos/" + id + "/pexels-photo-" + id +
           ".jpeg?auto=compress&cs=tinysrgb&w=" + (w || 900);
  }

  function waLink(text) {
    return "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(text);
  }

  var toastEl = $("#toast");
  var toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-visible"); }, 4200);
  }

  /* ---------- product catalogue (shared by home, products and the quote) ----------
     `id` is stable and NEVER derived from `name` — names are marketing copy
     that gets edited, and a name-derived key would orphan saved quote lines.
     `moqMin` is the authoritative number; `moq` is only ever displayed. */
  var PRODUCTS = [
    {
      id: "hoodie-320-rn", name: "Heavy 320 GSM Round Neck Hoodie",
      brand: "Zonixa", cat: "hoodies", badge: "Bestseller",
      meta: ["320 GSM", "Spun Fleece", "Logo ready"], moq: "MOQ 50 pcs", moqMin: 50,
      art: "hoodie", pic: 28701959, tone: "gold"
    },
    {
      id: "hoodie-240-2t", name: "Two Thread Fleece Round Neck Hoodie",
      brand: "Zonixa", cat: "hoodies", badge: "",
      meta: ["240 GSM", "Two thread", "All sizes"], moq: "MOQ 50 pcs", moqMin: 50,
      art: "hoodie", pic: 1482476, tone: "teal"
    },
    {
      id: "hoodie-320-print", name: "320 GSM Hoodie with Chest Print",
      brand: "Zonixa", cat: "hoodies", badge: "Custom print",
      meta: ["320 GSM", "Screen print", "Russian Fleece"], moq: "MOQ 100 pcs", moqMin: 100,
      art: "hoodie", pic: 17281224, tone: "coral"
    },
    {
      id: "hoodie-320-zip", name: "Heavy Zip Hoodie 320 GSM",
      brand: "Zonixa", cat: "hoodies", badge: "",
      meta: ["320 GSM", "YKK-style zip", "Kangaroo pocket"], moq: "MOQ 50 pcs", moqMin: 50,
      art: "zip", pic: 8217415, tone: "sky"
    },
    {
      id: "tee-dryfit-ben", name: "Dry Fit Ben Collar Half Sleeve T-Shirt",
      brand: "Zonixa", cat: "tshirts", badge: "Quick dry",
      meta: ["Dry Fit", "Ben collar", "Sublimation"], moq: "MOQ 100 pcs", moqMin: 100,
      art: "tee", pic: 11671964, tone: "lime"
    },
    {
      id: "tee-cotton-rn", name: "100% Cotton Round Neck T-Shirt",
      brand: "Zonixa", cat: "tshirts", badge: "",
      meta: ["180 GSM", "Bio-washed", "20 shades"], moq: "MOQ 100 pcs", moqMin: 100,
      art: "tee", pic: 4440566, tone: "violet"
    },
    {
      id: "polo-honeycomb", name: "Honeycomb Lycra Polo T-Shirt",
      brand: "MSP Sports", cat: "tshirts", badge: "",
      meta: ["Honeycomb", "Lycra blend", "Tipped collar"], moq: "MOQ 100 pcs", moqMin: 100,
      art: "polo", pic: 3779453, tone: "coral"
    },
    {
      id: "sweat-crew-russian", name: "Crew Neck Sweatshirt — Russian Fleece",
      brand: "Zonixa", cat: "sweatshirts", badge: "Winter",
      meta: ["280 GSM", "Russian Fleece", "Rib cuff"], moq: "MOQ 50 pcs", moqMin: 50,
      art: "sweat", pic: 29765480, tone: "gold"
    },
    {
      id: "sweat-ns-bonded", name: "NS Bonded Winter Sweatshirt",
      brand: "Zonixa", cat: "sweatshirts", badge: "",
      meta: ["NS Bonded", "Sherpa lined", "Wind resistant"], moq: "MOQ 50 pcs", moqMin: 50,
      art: "sweat", pic: 102129, tone: "teal"
    },
    {
      id: "pant-track-lycra", name: "Slim Fit Track Pant — Cotton Lycra",
      brand: "MSP Sports", cat: "bottoms", badge: "",
      meta: ["Cotton Lycra", "Zip pockets", "Taped side"], moq: "MOQ 100 pcs", moqMin: 100,
      art: "pant", pic: 4571832, tone: "sky"
    },
    {
      id: "lower-fleece-panel", name: "Fleece Lower with Side Panels",
      brand: "MSP Sports", cat: "bottoms", badge: "Sports",
      meta: ["Spun Fleece", "Elastic waist", "Custom panel"], moq: "MOQ 100 pcs", moqMin: 100,
      art: "pant", pic: 18060021, tone: "violet"
    },
    {
      id: "short-dryfit", name: "Dry Fit Training Shorts",
      brand: "MSP Sports", cat: "bottoms", badge: "",
      meta: ["Dry Fit", "Drawcord", "Team colours"], moq: "MOQ 150 pcs", moqMin: 150,
      art: "short", pic: 11001131, tone: "lime"
    }
  ];

  var BY_ID = {};
  (function indexProducts() {
    for (var i = 0; i < PRODUCTS.length; i++) {
      var p = PRODUCTS[i];
      if (BY_ID[p.id] && window.console) {
        console.warn("PANWAR: duplicate product id '" + p.id + "' — one entry is shadowing another.");
      }
      BY_ID[p.id] = p;
    }
  })();

  function productById(id) { return BY_ID[id] || null; }

  /* prefer the numeric field; fall back to parsing the display string so a
     style added without moqMin still validates instead of throwing */
  function moqOf(p) {
    if (!p) return 50;
    if (typeof p.moqMin === "number" && p.moqMin > 0) return p.moqMin;
    var m = String(p.moq || "").match(/\d+/);
    return m ? parseInt(m[0], 10) : 50;
  }

  /* branding stored as stable codes; labels live here only */
  var BRANDING = [
    { code: "screen",  label: "Screen print", short: "SP" },
    { code: "sublim",  label: "Sublimation",  short: "SUB" },
    { code: "embroid", label: "Embroidery",   short: "EMB" },
    { code: "woven",   label: "Woven label",  short: "WL" },
    { code: "hangtag", label: "Hang tag",     short: "HT" }
  ];
  function brandingByCode(code) {
    for (var i = 0; i < BRANDING.length; i++) if (BRANDING[i].code === code) return BRANDING[i];
    return null;
  }
  function brandingNames(codes, useShort) {
    var out = [];
    for (var i = 0; i < (codes || []).length; i++) {
      var b = brandingByCode(codes[i]);
      if (b) out.push(useShort ? b.short : b.label);
    }
    return out.join(", ");
  }

  /* ---------- inline SVG art per garment type ---------- */
  var ART = {
    hoodie: '<svg viewBox="0 0 200 240" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"><path d="M70 34 40 52 22 96l26 12 8-18v112h88V90l8 18 26-12-18-44-30-18z"/><path d="M70 34c0 16 13 26 30 26s30-10 30-26"/><path d="M100 60v52"/><path d="M74 132h52v34a26 26 0 0 1-52 0z" opacity=".55"/></svg>',
    zip:    '<svg viewBox="0 0 200 240" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"><path d="M70 34 40 52 22 96l26 12 8-18v112h88V90l8 18 26-12-18-44-30-18z"/><path d="M70 34c0 16 13 26 30 26s30-10 30-26"/><path d="M100 46v156" stroke-dasharray="7 6"/><circle cx="100" cy="120" r="6"/></svg>',
    tee:    '<svg viewBox="0 0 200 240" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"><path d="M74 40 40 56 22 104l28 12 8-16v96h84v-96l8 16 28-12-18-48-34-16z"/><path d="M74 40c0 15 12 24 26 24s26-9 26-24"/></svg>',
    polo:   '<svg viewBox="0 0 200 240" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"><path d="M74 40 40 56 22 104l28 12 8-16v96h84v-96l8 16 28-12-18-48-34-16z"/><path d="M78 40 100 68l22-28"/><path d="M92 68v34" stroke-dasharray="6 6"/></svg>',
    sweat:  '<svg viewBox="0 0 200 240" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"><path d="M74 40 40 56 22 104l28 12 8-16v84h84v-84l8 16 28-12-18-48-34-16z"/><path d="M74 40c0 15 12 24 26 24s26-9 26-24"/><path d="M58 184h84v16H58z"/></svg>',
    pant:   '<svg viewBox="0 0 200 240" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"><path d="M60 30h80v22l-8 158h-28l-4-104-4 104H68l-8-158z"/><path d="M60 52h80"/><path d="M78 60v122M122 60v122" opacity=".5"/></svg>',
    short:  '<svg viewBox="0 0 200 240" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"><path d="M58 60h84v18l-8 84h-28l-6-54-6 54H66l-8-84z"/><path d="M58 78h84"/><path d="M100 86v50" opacity=".5"/></svg>'
  };

  function productCard(p) {
    var meta = p.meta.map(function (m) { return "<li>" + esc(m) + "</li>"; }).join("");
    var badge = p.badge ? '<span class="product__badge">' + esc(p.badge) + "</span>" : "";
    return '' +
      '<article class="product reveal" data-cat="' + esc(p.cat) + '" data-id="' + esc(p.id) + '" data-tone="' + esc(p.tone || "gold") + '">' +
        '<div class="product__media">' +
          '<img src="' + photo(p.pic, 700) + '" alt="' + esc(p.name) + '" loading="lazy" decoding="async" width="700" height="875" />' +
          badge +
          '<span class="product__glyph" aria-hidden="true">' + (ART[p.art] || ART.tee) + '</span>' +
        '</div>' +
        '<div class="product__body">' +
          '<p class="product__brand">' + esc(p.brand) + '</p>' +
          '<h3 class="product__name">' + esc(p.name) + '</h3>' +
          '<ul class="product__meta">' + meta + '</ul>' +
          '<div class="product__foot">' +
            '<span class="product__moq">' + esc(p.moq) + '</span>' +
            '<span class="product__acts">' +
              '<button class="product__ask product__ask--add" type="button" data-quote-add="' + esc(p.id) + '">Add to quote</button>' +
              '<button class="product__ask" type="button" data-enquire="' + esc(p.name) + '">Enquire</button>' +
            '</span>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function renderProducts(grid, list) {
    grid.innerHTML = list.map(productCard).join("");
    observeReveals(grid);
    syncCards();
  }

  /* ---------- 1. sticky header ---------- */
  var header = $("#header");
  if (header) {
    var onScrollHeader = function () {
      header.classList.toggle("is-stuck", window.scrollY > 12);
    };
    onScrollHeader();
    window.addEventListener("scroll", onScrollHeader, { passive: true });
  }

  /* ---------- 2. mobile nav ---------- */
  var burger = $("#burger");
  var nav = $("#nav");
  if (burger && nav) {
    burger.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      burger.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeNav();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) closeNav();
    });
  }
  function closeNav() {
    if (!nav || !burger) return;
    nav.classList.remove("is-open");
    burger.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
  }

  /* ---------- 3. reveal on scroll ----------
     IntersectionObserver is the primary trigger, but it stays silent when the
     page is rendered inside a hidden container (some preview panes, background
     tabs). A rect-based pass on scroll/resize is the safety net, so content can
     never end up stuck at opacity 0. */
  var pending = [];
  var io = null;

  function show(el) {
    el.classList.add("is-in");
    if (io) io.unobserve(el);
    var i = pending.indexOf(el);
    if (i > -1) pending.splice(i, 1);
  }

  if ("IntersectionObserver" in window) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) show(entry.target);
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -40px" });
  }

  var revealQueued = false;
  function checkReveals() {
    revealQueued = false;
    var limit = (window.innerHeight || 800) - 40;
    pending.slice().forEach(function (el) {
      /* drop nodes destroyed by a re-render, or they leak into pending forever */
      if (!el.isConnected) {
        var k = pending.indexOf(el);
        if (k > -1) pending.splice(k, 1);
        if (io) io.unobserve(el);
        return;
      }
      var r = el.getBoundingClientRect();
      if (r.top < limit && r.bottom > 0) show(el);
    });
  }

  function queueReveals() {
    if (revealQueued) return;
    revealQueued = true;
    /* requestAnimationFrame is paused while the document is hidden — which is
       exactly when the IntersectionObserver is silent too. Without a timeout
       path both routes stall and content stays stranded at opacity 0. */
    if (document.hidden) setTimeout(checkReveals, 0);
    else requestAnimationFrame(checkReveals);
  }

  function observeReveals(root) {
    $$(".reveal", root || document).forEach(function (el, i) {
      if (el.classList.contains("is-in") || pending.indexOf(el) > -1) return;
      el.style.transitionDelay = Math.min(i % 8, 6) * 60 + "ms";
      pending.push(el);
      if (io) io.observe(el);
    });
    queueReveals();
  }

  window.addEventListener("scroll", queueReveals, { passive: true });
  window.addEventListener("resize", queueReveals);
  window.addEventListener("load", queueReveals);
  document.addEventListener("visibilitychange", queueReveals);

  /* ---------- 4. animated counters ---------- */
  var counters = $$("[data-count]");
  if (counters.length) {
    var runCounter = function (el) {
      var target = parseFloat(el.dataset.count) || 0;
      var suffix = el.dataset.suffix || "";
      var start = performance.now();
      var dur = 1500;
      var step = function (now) {
        var t = Math.min((now - start) / dur, 1);
        var eased = 1 - Math.pow(1 - t, 3);
        var val = Math.round(target * eased);
        el.textContent = (val >= 1000 ? val.toLocaleString("en-IN") : val) + suffix;
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    if ("IntersectionObserver" in window) {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          runCounter(entry.target);
          cio.unobserve(entry.target);
        });
      }, { threshold: 0.5 });
      counters.forEach(function (el) { cio.observe(el); });
    } else {
      counters.forEach(runCounter);
    }
  }

  /* ---------- 5. home page: featured products ---------- */
  var featured = $("#featuredGrid");
  if (featured) renderProducts(featured, PRODUCTS.slice(0, 4));

  /* ---------- 6. products page: full grid + filters ---------- */
  var productGrid = $("#productGrid");
  if (productGrid) {
    renderProducts(productGrid, PRODUCTS);

    var empty = $("#gridEmpty");
    var filterBar = $("#filters");

    if (filterBar) {
      filterBar.addEventListener("click", function (e) {
        var btn = e.target.closest(".filter");
        if (!btn) return;

        $$(".filter", filterBar).forEach(function (b) {
          var on = b === btn;
          b.classList.toggle("is-active", on);
          b.setAttribute("aria-selected", String(on));
        });

        var cat = btn.dataset.filter;
        var shown = 0;
        $$(".product", productGrid).forEach(function (card) {
          var match = cat === "all" || card.dataset.cat === cat;
          card.hidden = !match;
          if (match) shown++;
        });
        if (empty) empty.hidden = shown !== 0;
      });
    }
  }

  /* ---------- 7. enquire buttons -> WhatsApp (single item) ---------- */
  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-enquire]");
    if (!btn) return;
    var item = btn.dataset.enquire;
    window.open(
      waLink("Hello Panwar Knitwear, I'd like a quote for: " + item + ". Please share pricing and MOQ."),
      "_blank",
      "noopener"
    );
    toast("Opening WhatsApp for " + item);
  });

  /* ---------- 8. contact enquiry form ---------- */
  var form = $("#enquiryForm");
  if (form) {
    var msg = $("#formMsg");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = new FormData(form);
      var name = (data.get("name") || "").toString().trim();
      var phone = (data.get("phone") || "").toString().trim();
      var product = (data.get("product") || "").toString().trim();
      var note = (data.get("message") || "").toString().trim();

      if (name.length < 2) {
        msg.textContent = "Please tell us your name.";
        msg.classList.add("is-error");
        return;
      }
      if (!PHONE_RE.test(phone)) {
        msg.textContent = "Please enter a valid phone number.";
        msg.classList.add("is-error");
        return;
      }

      msg.classList.remove("is-error");
      msg.textContent = "Thanks " + name + " — opening WhatsApp with your enquiry.";

      var text = "New enquiry\nName: " + name + "\nPhone: " + phone +
                 "\nInterested in: " + (product || "General") +
                 (note ? "\nDetails: " + note : "");
      window.open(waLink(text), "_blank", "noopener");
      form.reset();
    });
  }

  /* ---------- 9. back to top ---------- */
  var toTop = $("#toTop");
  if (toTop) {
    var onScrollTop = function () {
      toTop.classList.toggle("is-visible", window.scrollY > 500);
    };
    onScrollTop();
    window.addEventListener("scroll", onScrollTop, { passive: true });
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------- 10. year ---------- */
  var year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- 11. theme ----------
     The <head> script already resolved and applied the theme before first
     paint. This only handles the toggle and the OS-preference listener. */
  var themeBtn = $("#themeToggle");

  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function storedTheme() {
    try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }

  function syncThemeBtn() {
    if (!themeBtn) return;
    var dark = currentTheme() === "dark";
    themeBtn.setAttribute("aria-pressed", String(dark));
    themeBtn.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
  }

  function applyTheme(t) {
    var root = document.documentElement;
    /* transient class so the cross-fade does not clobber component transitions */
    root.classList.add("is-theming");
    setTimeout(function () { root.classList.remove("is-theming"); }, 340);
    root.setAttribute("data-theme", t);
    syncThemeBtn();
    /* a media-scoped theme-color does NOT respond to an attribute override,
       so point both metas at the active colour */
    $$('meta[name="theme-color"]').forEach(function (m) {
      m.setAttribute("content", t === "dark" ? "#16181F" : "#FBFAF7");
    });
  }

  if (themeBtn) {
    syncThemeBtn();
    themeBtn.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
      applyTheme(next);
    });
  }

  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    var onMq = function (e) {
      var s = storedTheme();
      if (s === "light" || s === "dark") return; // explicit choice wins
      applyTheme(e.matches ? "dark" : "light");
    };
    if (mq.addEventListener) mq.addEventListener("change", onMq);
    else if (mq.addListener) mq.addListener(onMq);
  }

  /* ==========================================================================
     12. QUOTE STORE
     Persists only ids + user input. Everything else is re-derived from
     PRODUCTS on read, so a catalogue edit can never be contradicted by a
     stale cached value. State is authoritative in memory; storage is a mirror.
     ========================================================================== */
  var listeners = [];
  var persistOK = true;
  var warnedStorage = false;

  function blankQuote() {
    return { v: 1, updated: 0, lines: [], meta: { name: "", phone: "", deadline: "", notes: "" } };
  }

  function isArray(x) { return Object.prototype.toString.call(x) === "[object Array]"; }
  function clampText(s, n) { return String(s == null ? "" : s).slice(0, n); }

  function hydrate() {
    var raw = null;
    try { raw = localStorage.getItem(QUOTE_KEY); }
    catch (e) { persistOK = false; return blankQuote(); }
    if (!raw) return blankQuote();

    var data;
    try { data = JSON.parse(raw); } catch (e) { return blankQuote(); }
    if (!data || data.v !== 1) return blankQuote();

    var out = blankQuote();
    var m = data.meta || {};
    out.meta.name = clampText(m.name, 80);
    out.meta.phone = clampText(m.phone, 30);
    out.meta.deadline = clampText(m.deadline, 10);
    out.meta.notes = clampText(m.notes, 500);

    var lines = isArray(data.lines) ? data.lines : [];
    var dropped = 0;
    for (var i = 0; i < lines.length && out.lines.length < 24; i++) {
      var l = lines[i] || {};
      var p = productById(l.id);
      if (!p) { dropped++; continue; }
      var codes = [];
      var b = isArray(l.brand) ? l.brand : [];
      for (var j = 0; j < b.length; j++) if (brandingByCode(b[j])) codes.push(b[j]);
      out.lines.push({
        lid: /^l[a-z0-9]{1,10}$/.test(String(l.lid)) ? String(l.lid) : uid(),
        id: p.id,
        qty: Math.max(0, Math.min(999999, parseInt(l.qty, 10) || 0)),
        colours: clampText(l.colours, 200),
        sizes: clampText(l.sizes, 200),
        note: clampText(l.note, 200),
        brand: codes
      });
    }
    if (dropped) {
      setTimeout(function () {
        toast(dropped === 1
          ? "1 style is no longer in the catalogue and was removed from your quote."
          : dropped + " styles are no longer in the catalogue and were removed from your quote.");
      }, 900);
    }
    return out;
  }

  var quote = hydrate();

  function notify() { for (var i = 0; i < listeners.length; i++) listeners[i](); }
  function subscribe(fn) { listeners.push(fn); }

  function writeQuote() {
    quote.updated = Date.now();
    try { localStorage.setItem(QUOTE_KEY, JSON.stringify(quote)); }
    catch (e) {
      persistOK = false;
      if (!warnedStorage) {
        warnedStorage = true;
        toast("Your browser is blocking storage — this quote will be lost if you reload.");
      }
    }
    notify(); // listeners run whether or not storage worked
  }

  function findLine(lid) {
    for (var i = 0; i < quote.lines.length; i++) if (quote.lines[i].lid === lid) return quote.lines[i];
    return null;
  }

  function addLine(id) {
    var p = productById(id);
    if (!p) return null;
    if (quote.lines.length >= 24) { toast("A quote can hold 24 styles — send this one first."); return null; }
    /* qty starts at the MOQ so a fresh line is valid by default */
    var line = { lid: uid(), id: p.id, qty: moqOf(p), colours: "", sizes: "", note: "", brand: [] };
    quote.lines.push(line);
    return line.lid;
  }

  function removeLine(lid) {
    for (var i = 0; i < quote.lines.length; i++) {
      if (quote.lines[i].lid === lid) { quote.lines.splice(i, 1); return true; }
    }
    return false;
  }

  function totalPcs() {
    var n = 0;
    for (var i = 0; i < quote.lines.length; i++) n += quote.lines[i].qty || 0;
    return n;
  }

  function lineIsValid(l) {
    var p = productById(l.id);
    return !!p && l.qty >= moqOf(p);
  }

  /* cross-tab sync — never re-render over a focused input */
  window.addEventListener("storage", function (e) {
    if (e.key !== QUOTE_KEY) return;
    var a = document.activeElement;
    if (a && a.closest && a.closest("[data-qb-input], [data-qb-check], [data-qb-meta]")) {
      toast("This quote was also changed in another tab.");
      return;
    }
    quote = hydrate();
    renderLines();
  });

  /* ==========================================================================
     13. QUOTE SURFACES — header badge, drawer, per-line editors
     ========================================================================== */
  var qbOpenBtn, qbDrawer, qbBackdrop, qbBody, qbCount, qbCountSr, qbTotal, qbReviewLink, qbEmptyEl;
  var lastFocus = null;
  var reviewHost = $("#qbReview");

  function buildBadge() {
    var actions = $(".header__actions");
    if (!actions) return;

    var btn = document.createElement("button");
    btn.className = "btn qb-open";
    btn.id = "qbOpen";
    btn.type = "button";
    btn.setAttribute("aria-controls", "qbDrawer");
    btn.setAttribute("aria-expanded", "false");
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M4 4h3l2.2 11.2a2 2 0 0 0 2 1.6h7.4a2 2 0 0 0 2-1.6L22 8H7"/><circle cx="10" cy="20" r="1.3"/><circle cx="19" cy="20" r="1.3"/></svg>' +
      '<span class="qb-open__label">Quote</span>' +
      '<span class="qb-badge" id="qbCount" aria-hidden="true">0</span>';
    /* first child so it reads badge -> theme toggle -> CTA -> burger */
    actions.insertBefore(btn, actions.firstChild);
    qbOpenBtn = btn;
    qbCount = $("#qbCount");

    /* the live region lives OUTSIDE every re-rendered subtree */
    qbCountSr = document.createElement("p");
    qbCountSr.className = "sr-only";
    qbCountSr.id = "qbCountSr";
    qbCountSr.setAttribute("role", "status");
    qbCountSr.setAttribute("aria-live", "polite");
    document.body.appendChild(qbCountSr);

    btn.addEventListener("click", openDrawer);
  }

  function buildDrawer() {
    qbBackdrop = document.createElement("div");
    qbBackdrop.className = "qb-backdrop";
    qbBackdrop.id = "qbBackdrop";
    qbBackdrop.hidden = true;
    document.body.appendChild(qbBackdrop);

    qbDrawer = document.createElement("aside");
    qbDrawer.className = "qb-drawer";
    qbDrawer.id = "qbDrawer";
    qbDrawer.setAttribute("role", "dialog");
    qbDrawer.setAttribute("aria-modal", "true");
    qbDrawer.setAttribute("aria-labelledby", "qbTitle");
    qbDrawer.hidden = true;
    qbDrawer.innerHTML =
      '<header class="qb-drawer__head">' +
        '<h2 class="qb-drawer__title" id="qbTitle">Your quote</h2>' +
        '<button class="qb-close" id="qbClose" type="button" aria-label="Close quote">' +
          '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>' +
        '</button>' +
      '</header>' +
      '<div class="qb-drawer__body" id="qbBody"></div>' +
      '<footer class="qb-drawer__foot">' +
        '<p class="qb-total" id="qbTotal"></p>' +
        '<a class="btn btn--primary btn--block" id="qbReviewLink" href="quote.html">Review &amp; send</a>' +
        '<button class="qb-clear" id="qbClear" type="button">Clear quote</button>' +
      '</footer>';
    document.body.appendChild(qbDrawer);

    qbBody = $("#qbBody");
    qbTotal = $("#qbTotal");
    qbReviewLink = $("#qbReviewLink");

    $("#qbClose").addEventListener("click", closeDrawer);
    qbBackdrop.addEventListener("click", closeDrawer);
    $("#qbClear").addEventListener("click", function () {
      if (!quote.lines.length) return;
      quote.lines = [];
      writeQuote();
      renderLines();
      toast("Quote cleared.");
    });

    qbDrawer.addEventListener("keydown", trapTab);
  }

  function drawerIsOpen() { return qbDrawer && !qbDrawer.hidden; }

  function focusables(root) {
    return $$('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])', root)
      .filter(function (el) { return el.offsetParent !== null; });
  }

  function trapTab(e) {
    if (e.key !== "Tab") return;
    var f = focusables(qbDrawer);
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function setInert(on) {
    ["header.header", "main", "footer.footer", ".topbar", ".wa-float", ".to-top"].forEach(function (sel) {
      var el = $(sel);
      if (!el) return;
      if (on) el.setAttribute("inert", "");
      else el.removeAttribute("inert");
    });
  }

  function openDrawer() {
    if (!qbDrawer || drawerIsOpen()) return;
    closeNav(); // otherwise one Escape closes both
    lastFocus = document.activeElement;
    qbBackdrop.hidden = false;
    qbDrawer.hidden = false;
    void qbDrawer.offsetWidth; // reflow, or .is-open cannot transition from display:none
    qbBackdrop.classList.add("is-open");
    qbDrawer.classList.add("is-open");
    document.body.classList.add("qb-locked");
    setInert(true);
    if (qbOpenBtn) qbOpenBtn.setAttribute("aria-expanded", "true");
    var close = $("#qbClose");
    if (close) close.focus();
  }

  var closeTimer = null;
  function closeDrawer() {
    if (!drawerIsOpen()) return;
    qbDrawer.classList.remove("is-open");
    qbBackdrop.classList.remove("is-open");
    document.body.classList.remove("qb-locked");
    setInert(false);
    if (qbOpenBtn) qbOpenBtn.setAttribute("aria-expanded", "false");

    clearTimeout(closeTimer);
    /* transitionend can be skipped entirely under reduced motion */
    closeTimer = setTimeout(function () {
      qbDrawer.hidden = true;
      qbBackdrop.hidden = true;
    }, 400);

    if (lastFocus && lastFocus.isConnected) lastFocus.focus();
    else if (qbOpenBtn) qbOpenBtn.focus();
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && drawerIsOpen()) closeDrawer();
  });

  /* ---------- per-line editor markup (used by drawer AND quote.html) ---------- */
  function lineHTML(l, index) {
    var p = productById(l.id);
    if (!p) return "";
    var min = moqOf(p);
    var checks = BRANDING.map(function (b) {
      return '<label class="qb-check">' +
        '<input type="checkbox" data-qb-check="' + b.code + '" data-lid="' + esc(l.lid) + '" id="qb-br-' + esc(l.lid) + '-' + b.code + '" />' +
        '<span>' + esc(b.label) + '</span>' +
      '</label>';
    }).join("");

    return '' +
    '<fieldset class="qb-line" data-lid="' + esc(l.lid) + '" data-tone="' + esc(p.tone || "gold") + '">' +
      '<legend class="sr-only">Line ' + (index + 1) + ' — ' + esc(p.name) + '</legend>' +
      '<div class="qb-line__head">' +
        '<img class="qb-line__thumb" src="' + photo(p.pic, 200) + '" alt="" width="72" height="90" loading="lazy" decoding="async" />' +
        '<div class="qb-line__id">' +
          '<p class="qb-line__brand">' + esc(p.brand) + '</p>' +
          '<p class="qb-line__name">' + esc(p.name) + '</p>' +
          '<p class="qb-line__moq">Minimum ' + min + ' pcs</p>' +
        '</div>' +
        '<button class="qb-remove" type="button" data-qb-remove="' + esc(l.lid) + '" aria-label="Remove ' + esc(p.name) + ' from your quote">' +
          '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>' +
        '</button>' +
      '</div>' +
      '<div class="form__row">' +
        '<div class="field">' +
          '<label for="qb-qty-' + esc(l.lid) + '">Quantity (pcs)</label>' +
          '<input id="qb-qty-' + esc(l.lid) + '" data-qb-input="qty" data-lid="' + esc(l.lid) + '" type="number" min="' + min + '" step="1" inputmode="numeric" aria-describedby="qb-err-' + esc(l.lid) + '" />' +
          '<p class="qb-err" id="qb-err-' + esc(l.lid) + '" hidden></p>' +
        '</div>' +
        '<div class="field">' +
          '<label for="qb-col-' + esc(l.lid) + '">Colours</label>' +
          '<input id="qb-col-' + esc(l.lid) + '" data-qb-input="colours" data-lid="' + esc(l.lid) + '" type="text" placeholder="Black, Olive" />' +
        '</div>' +
      '</div>' +
      '<div class="field">' +
        '<label for="qb-siz-' + esc(l.lid) + '">Size breakdown or note</label>' +
        '<input id="qb-siz-' + esc(l.lid) + '" data-qb-input="sizes" data-lid="' + esc(l.lid) + '" type="text" placeholder="S-20 M-50 L-50 XL-30, or standard set" />' +
      '</div>' +
      '<fieldset class="qb-brand">' +
        '<legend>Branding</legend>' +
        '<div class="qb-checks">' + checks + '</div>' +
      '</fieldset>' +
    '</fieldset>';
  }

  var EMPTY_HTML =
    '<div class="qb-empty">' +
      '<p class="qb-empty__title">Nothing in your quote yet</p>' +
      '<p>Add any style from the catalogue and set your quantities here.</p>' +
      '<a class="btn btn--primary" href="products.html">Browse the catalogue</a>' +
    '</div>';

  /* Values are assigned in JS, never interpolated into value="..." — that
     removes the largest class of escaping mistakes structurally. */
  function fillValues(host) {
    $$("[data-qb-input]", host).forEach(function (input) {
      var l = findLine(input.dataset.lid);
      if (!l) return;
      input.value = l[input.dataset.qbInput];
    });
    $$("[data-qb-check]", host).forEach(function (box) {
      var l = findLine(box.dataset.lid);
      if (!l) return;
      box.checked = l.brand.indexOf(box.dataset.qbCheck) > -1;
    });
    $$(".qb-line", host).forEach(function (fs) {
      var l = findLine(fs.dataset.lid);
      if (l) flagLine(fs, l, false);
    });
  }

  function renderLines() {
    var html = quote.lines.length
      ? quote.lines.map(lineHTML).join("")
      : EMPTY_HTML;

    [qbBody, reviewHost].forEach(function (host) {
      if (!host) return;
      host.innerHTML = html;
      fillValues(host);
    });
    updateChrome();
  }

  function flagLine(fs, l, announce) {
    var input = $("[data-qb-input='qty']", fs);
    var err = $(".qb-err", fs);
    var p = productById(l.id);
    var min = moqOf(p);
    var bad = l.qty < min;
    fs.classList.toggle("is-invalid", bad);
    if (input) input.setAttribute("aria-invalid", String(bad));
    if (err) {
      err.hidden = !bad;
      err.textContent = bad ? "Minimum " + min + " pcs for this style." : "";
    }
    if (bad && announce && input) input.focus();
    return !bad;
  }

  function updateChrome() {
    var n = quote.lines.length;
    var pcs = totalPcs();

    if (qbCount) {
      qbCount.textContent = String(n);
      qbCount.hidden = n === 0;
    }
    if (qbCountSr) {
      qbCountSr.textContent = n === 0
        ? "Your quote is empty."
        : n + (n === 1 ? " style" : " styles") + " in your quote, " + pcs + " pieces.";
    }
    if (qbTotal) {
      qbTotal.textContent = n === 0 ? "" :
        n + (n === 1 ? " style" : " styles") + " · " + pcs.toLocaleString("en-IN") + " pcs";
    }
    if (qbReviewLink) qbReviewLink.hidden = n === 0;

    var clearBtn = $("#qbClear");
    if (clearBtn) clearBtn.hidden = n === 0;

    syncCards();
    updateReviewChrome();
  }

  /* card buttons reflect whether that style is already in the quote.
     The product grids render (block 5/6) before the store is built (block 12),
     so this can legitimately run before `quote` exists — init re-syncs. */
  function syncCards() {
    if (!quote) return;
    $$("[data-quote-add]").forEach(function (btn) {
      var inQuote = false;
      for (var i = 0; i < quote.lines.length; i++) {
        if (quote.lines[i].id === btn.dataset.quoteAdd) { inQuote = true; break; }
      }
      btn.classList.toggle("is-added", inQuote);
      btn.textContent = inQuote ? "Edit in quote" : "Add to quote";
    });
  }

  /* ---------- add / remove / edit handlers (document-delegated) ---------- */
  document.addEventListener("click", function (e) {
    var add = e.target.closest("[data-quote-add]");
    if (!add) return;
    /* invariant: the add and enquire buttons are SIBLINGS, never nested.
       If a future refactor nests them, this fails loudly instead of double-firing. */
    if (add.closest("[data-enquire]")) return;

    var id = add.dataset.quoteAdd;
    var existingLid = null;
    for (var i = 0; i < quote.lines.length; i++) {
      if (quote.lines[i].id === id) { existingLid = quote.lines[i].lid; break; }
    }

    if (existingLid) {
      openDrawer();
      focusLine(existingLid);
      return;
    }

    var lid = addLine(id);
    if (!lid) return;
    writeQuote();
    renderLines();
    var p = productById(id);
    toast((p ? p.name : "Style") + " added — set your quantity in the quote panel.");
    openDrawer();
    focusLine(lid);
  });

  function focusLine(lid) {
    /* a hash link would fight scroll-behavior: smooth + scroll-padding-top */
    setTimeout(function () {
      var host = drawerIsOpen() ? qbDrawer : document;
      var fs = $('.qb-line[data-lid="' + lid + '"]', host);
      if (!fs) return;
      if (fs.scrollIntoView) fs.scrollIntoView({ block: "nearest" });
      var qty = $("[data-qb-input='qty']", fs);
      if (qty) { qty.focus(); qty.select(); }
    }, 120);
  }

  document.addEventListener("click", function (e) {
    var rm = e.target.closest("[data-qb-remove]");
    if (!rm) return;
    var lid = rm.dataset.qbRemove;
    var host = rm.closest(".qb-drawer__body, #qbReview");
    var all = host ? $$(".qb-line", host) : [];
    var idx = -1;
    for (var i = 0; i < all.length; i++) if (all[i].dataset.lid === lid) idx = i;

    if (!removeLine(lid)) return;
    writeQuote();
    renderLines();

    /* move focus deliberately — a detached node drops the user to <body> */
    var newHost = drawerIsOpen() ? qbBody : reviewHost;
    var next = newHost ? $$(".qb-line [data-qb-remove]", newHost) : [];
    if (next.length) next[Math.min(idx, next.length - 1)].focus();
    else if (drawerIsOpen()) { var t = $("#qbTitle"); if (t) { t.setAttribute("tabindex", "-1"); t.focus(); } }
    else if (qbOpenBtn) qbOpenBtn.focus();

    toast("Removed from your quote.");
  });

  /* text + number fields: debounced, no re-render (so focus is never lost) */
  var saveTimer = null;
  document.addEventListener("input", function (e) {
    var input = e.target.closest("[data-qb-input]");
    if (!input) return;
    var l = findLine(input.dataset.lid);
    if (!l) return;
    var key = input.dataset.qbInput;

    if (key === "qty") {
      /* validate the raw string — type=number yields "" for garbage input */
      var raw = input.value.trim();
      var n = /^\d+$/.test(raw) ? parseInt(raw, 10) : 0;
      l.qty = Math.max(0, Math.min(999999, n));
      var fs = input.closest(".qb-line");
      if (fs) flagLine(fs, l, false);
    } else {
      l[key] = clampText(input.value, 200);
    }

    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () { writeQuote(); }, 250);
  });

  document.addEventListener("change", function (e) {
    var box = e.target.closest("[data-qb-check]");
    if (!box) return;
    var l = findLine(box.dataset.lid);
    if (!l) return;
    var code = box.dataset.qbCheck;
    var at = l.brand.indexOf(code);
    if (box.checked && at === -1) l.brand.push(code);
    else if (!box.checked && at > -1) l.brand.splice(at, 1);
    writeQuote();
  });

  /* ==========================================================================
     14. QUOTE REVIEW PAGE (quote.html only)
     ========================================================================== */
  var qbForm = $("#qbForm");
  var qbMsg = $("#qbMsg");
  var qbSteps = $("#qbSteps");
  var qbText = $("#qbText");

  function updateReviewChrome() {
    if (!reviewHost) return;
    var has = quote.lines.length > 0;
    if (qbForm) qbForm.hidden = !has;
    if (qbSteps) qbSteps.hidden = !has;
    if (qbText) qbText.value = has ? composeFull(quote) : "";
    var wrap = $("#qbTextWrap");
    if (wrap) wrap.hidden = !has;
  }

  if (reviewHost) {
    /* meta fields keep their values even when the basket empties */
    $$("[data-qb-meta]").forEach(function (el) {
      var key = el.dataset.qbMeta;
      el.value = quote.meta[key] || "";
      el.addEventListener("input", function () {
        quote.meta[key] = clampText(el.value, key === "notes" ? 500 : 80);
        clearTimeout(saveTimer);
        saveTimer = setTimeout(function () { writeQuote(); }, 250);
      });
    });

    var dateEl = $('[data-qb-meta="deadline"]');
    if (dateEl) {
      var t = new Date();
      dateEl.min = t.getFullYear() + "-" +
        String(t.getMonth() + 1).padStart(2, "0") + "-" +
        String(t.getDate()).padStart(2, "0");
    }

    var copyBtn = $("#qbCopy");
    if (copyBtn && qbText) {
      copyBtn.addEventListener("click", function () {
        qbText.select();
        var done = false;
        try { done = document.execCommand("copy"); } catch (e) {}
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(qbText.value).then(function () { toast("Quote text copied."); },
            function () { if (!done) toast("Select the text and press Ctrl+C to copy."); });
        } else {
          toast(done ? "Quote text copied." : "Select the text and press Ctrl+C to copy.");
        }
      });
    }
  }

  if (qbForm) {
    qbForm.addEventListener("submit", function (e) {
      e.preventDefault();
      sendQuote();
    });
  }

  /* ---------- message composition ---------- */
  function prettyDate(iso) {
    if (!iso) return "";
    var d = new Date(iso + "T00:00:00");
    if (isNaN(d.getTime())) return iso;
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear();
  }

  function composeFull(q) {
    var out = ["QUOTE REQUEST — Panwar Knitwear"];
    if (q.meta.name) out.push("Name: " + q.meta.name);
    if (q.meta.phone) out.push("Phone: " + q.meta.phone);
    if (q.meta.deadline) out.push("Deadline: " + prettyDate(q.meta.deadline));
    out.push("");

    for (var i = 0; i < q.lines.length; i++) {
      var l = q.lines[i];
      var p = productById(l.id);
      if (!p) continue;
      out.push((i + 1) + ") " + p.name + " (" + p.brand + ")");
      var bits = ["Qty: " + l.qty + " pcs"];
      if (l.colours) bits.push("Colours: " + l.colours);
      out.push("   " + bits.join(" · "));
      if (l.sizes) out.push("   Sizes: " + l.sizes);
      var br = brandingNames(l.brand);
      if (br) out.push("   Branding: " + br);
      if (l.note) out.push("   Note: " + l.note);
      out.push("");
    }

    out.push("Total: " + q.lines.length + (q.lines.length === 1 ? " style" : " styles") + " · " + totalPcs() + " pcs");
    if (q.meta.notes) out.push("Notes: " + q.meta.notes);
    return out.join("\n");
  }

  function composeCompact(q) {
    var head = ["QUOTE — Panwar Knitwear"];
    if (q.meta.name) head.push(q.meta.name);
    if (q.meta.phone) head.push(q.meta.phone);
    if (q.meta.deadline) head.push("by " + prettyDate(q.meta.deadline));
    var out = [head.join(" | ")];

    for (var i = 0; i < q.lines.length; i++) {
      var l = q.lines[i];
      var p = productById(l.id);
      if (!p) continue;
      var row = [(i + 1) + ". " + p.name + " x" + l.qty];
      if (l.colours) row.push(l.colours);
      if (l.sizes) row.push(l.sizes);
      var br = brandingNames(l.brand, true);
      if (br) row.push(br);
      out.push(row.join(" | "));
    }

    out.push("Total " + q.lines.length + " styles / " + totalPcs() + " pcs");
    if (q.meta.notes) out.push("Notes: " + q.meta.notes.slice(0, 160));
    return out.join("\n");
  }

  function composeSummary(q) {
    var head = ["QUOTE — Panwar Knitwear"];
    if (q.meta.name) head.push(q.meta.name);
    if (q.meta.phone) head.push(q.meta.phone);
    if (q.meta.deadline) head.push("by " + prettyDate(q.meta.deadline));
    var out = [head.join(" | ")];
    out.push(q.lines.length + " styles / " + totalPcs() + " pcs");

    for (var i = 0; i < Math.min(3, q.lines.length); i++) {
      var l = q.lines[i];
      var p = productById(l.id);
      if (p) out.push((i + 1) + ". " + p.name + " x" + l.qty);
    }
    out.push("...full itemised list follows — pasted below.");
    return out.join("\n");
  }

  function sendQuote() {
    if (!qbMsg) return;

    if (!quote.lines.length) {
      qbMsg.textContent = "Add at least one style before sending.";
      qbMsg.classList.add("is-error");
      return;
    }

    /* every line must clear its MOQ */
    var firstBad = null;
    $$(".qb-line", reviewHost).forEach(function (fs) {
      var l = findLine(fs.dataset.lid);
      if (!l) return;
      if (!flagLine(fs, l, false) && !firstBad) firstBad = fs;
    });
    if (firstBad) {
      qbMsg.textContent = "One or more lines are below the minimum order quantity.";
      qbMsg.classList.add("is-error");
      var qty = $("[data-qb-input='qty']", firstBad);
      if (qty) qty.focus();
      return;
    }

    var nameEl = $('[data-qb-meta="name"]');
    var phoneEl = $('[data-qb-meta="phone"]');
    if ((quote.meta.name || "").trim().length < 2) {
      qbMsg.textContent = "Please tell us your name.";
      qbMsg.classList.add("is-error");
      if (nameEl) nameEl.focus();
      return;
    }
    if (!PHONE_RE.test((quote.meta.phone || "").trim())) {
      qbMsg.textContent = "Please enter a valid phone number.";
      qbMsg.classList.add("is-error");
      if (phoneEl) phoneEl.focus();
      return;
    }

    qbMsg.classList.remove("is-error");

    var full = composeFull(quote);
    var text = full;
    var overflow = false;

    if (waLink(text).length > MAX_URL) text = composeCompact(quote);
    if (waLink(text).length > MAX_URL) { text = composeSummary(quote); overflow = true; }

    /* Open WhatsApp FIRST. Awaiting the clipboard promise before this consumes
       the user-gesture window and the popup blocker eats the tab. */
    window.open(waLink(text), "_blank", "noopener");

    if (overflow) {
      var wrap = $("#qbTextWrap");
      if (wrap) { wrap.hidden = false; wrap.open = true; }
      if (qbText) { qbText.value = full; qbText.focus(); qbText.select(); }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(full).then(
          function () { toast("Quote is long — the full list is copied. Paste it as your second message."); },
          function () { toast("Quote is long — the full list is below, ready to copy."); }
        );
      } else {
        toast("Quote is long — the full list is below, ready to copy.");
      }
      qbMsg.textContent = "Opening WhatsApp. Paste the full list as a second message.";
    } else {
      qbMsg.textContent = "Opening WhatsApp with your itemised quote.";
    }
  }

  /* ---------- init ---------- */
  buildBadge();
  buildDrawer();
  subscribe(updateChrome);
  renderLines();
  observeReveals(document);
})();
