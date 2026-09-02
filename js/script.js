/* ==========================================================================
   PANWAR KNITWEAR — shared behaviour
   Vanilla JS, no dependencies. Every block is optional per page.
   ========================================================================== */
(function () {
  "use strict";

  var WA_NUMBER = "919876045457"; // +91 98760 45457

  /* ---------- helpers ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  var toastEl = $("#toast");
  var toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-visible"); }, 3200);
  }

  function waLink(text) {
    return "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(text);
  }

  /* ---------- photography ----------
     Hosted stock photos (Pexels CDN, free for commercial use, no attribution
     required). `photo(id)` builds the URL; swap these ids for real product
     shots when you have them — nothing else needs to change. */
  function photo(id, w) {
    return "https://images.pexels.com/photos/" + id + "/pexels-photo-" + id +
           ".jpeg?auto=compress&cs=tinysrgb&w=" + (w || 900);
  }

  /* ---------- product catalogue (shared by home + products page) ---------- */
  var PRODUCTS = [
    {
      name: "Heavy 320 GSM Round Neck Hoodie",
      brand: "Zonixa", cat: "hoodies", badge: "Bestseller",
      meta: ["320 GSM", "Spun Fleece", "Logo ready"], moq: "MOQ 50 pcs",
      art: "hoodie", pic: 28701959, tone: "gold"
    },
    {
      name: "Two Thread Fleece Round Neck Hoodie",
      brand: "Zonixa", cat: "hoodies", badge: "",
      meta: ["240 GSM", "Two thread", "All sizes"], moq: "MOQ 50 pcs",
      art: "hoodie", pic: 1482476, tone: "teal"
    },
    {
      name: "320 GSM Hoodie with Chest Print",
      brand: "Zonixa", cat: "hoodies", badge: "Custom print",
      meta: ["320 GSM", "Screen print", "Russian Fleece"], moq: "MOQ 100 pcs",
      art: "hoodie", pic: 17281224, tone: "coral"
    },
    {
      name: "Heavy Zip Hoodie 320 GSM",
      brand: "Zonixa", cat: "hoodies", badge: "",
      meta: ["320 GSM", "YKK-style zip", "Kangaroo pocket"], moq: "MOQ 50 pcs",
      art: "zip", pic: 8217415, tone: "sky"
    },
    {
      name: "Dry Fit Ben Collar Half Sleeve T-Shirt",
      brand: "Zonixa", cat: "tshirts", badge: "Quick dry",
      meta: ["Dry Fit", "Ben collar", "Sublimation"], moq: "MOQ 100 pcs",
      art: "tee", pic: 11671964, tone: "lime"
    },
    {
      name: "100% Cotton Round Neck T-Shirt",
      brand: "Zonixa", cat: "tshirts", badge: "",
      meta: ["180 GSM", "Bio-washed", "20 shades"], moq: "MOQ 100 pcs",
      art: "tee", pic: 4440566, tone: "violet"
    },
    {
      name: "Honeycomb Lycra Polo T-Shirt",
      brand: "MSP Sports", cat: "tshirts", badge: "",
      meta: ["Honeycomb", "Lycra blend", "Tipped collar"], moq: "MOQ 100 pcs",
      art: "polo", pic: 3779453, tone: "coral"
    },
    {
      name: "Crew Neck Sweatshirt — Russian Fleece",
      brand: "Zonixa", cat: "sweatshirts", badge: "Winter",
      meta: ["280 GSM", "Russian Fleece", "Rib cuff"], moq: "MOQ 50 pcs",
      art: "sweat", pic: 29765480, tone: "gold"
    },
    {
      name: "NS Bonded Winter Sweatshirt",
      brand: "Zonixa", cat: "sweatshirts", badge: "",
      meta: ["NS Bonded", "Sherpa lined", "Wind resistant"], moq: "MOQ 50 pcs",
      art: "sweat", pic: 102129, tone: "teal"
    },
    {
      name: "Slim Fit Track Pant — Cotton Lycra",
      brand: "MSP Sports", cat: "bottoms", badge: "",
      meta: ["Cotton Lycra", "Zip pockets", "Taped side"], moq: "MOQ 100 pcs",
      art: "pant", pic: 4571832, tone: "sky"
    },
    {
      name: "Fleece Lower with Side Panels",
      brand: "MSP Sports", cat: "bottoms", badge: "Sports",
      meta: ["Spun Fleece", "Elastic waist", "Custom panel"], moq: "MOQ 100 pcs",
      art: "pant", pic: 18060021, tone: "violet"
    },
    {
      name: "Dry Fit Training Shorts",
      brand: "MSP Sports", cat: "bottoms", badge: "",
      meta: ["Dry Fit", "Drawcord", "Team colours"], moq: "MOQ 150 pcs",
      art: "short", pic: 11001131, tone: "lime"
    }
  ];

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
    var meta = p.meta.map(function (m) { return "<li>" + m + "</li>"; }).join("");
    var badge = p.badge ? '<span class="product__badge">' + p.badge + "</span>" : "";
    return '' +
      '<article class="product reveal" data-cat="' + p.cat + '" data-tone="' + (p.tone || "gold") + '">' +
        '<div class="product__media">' +
          '<img src="' + photo(p.pic, 700) + '" alt="' + p.name + '" loading="lazy" decoding="async" width="700" height="875" />' +
          badge +
          '<span class="product__glyph" aria-hidden="true">' + (ART[p.art] || ART.tee) + '</span>' +
        '</div>' +
        '<div class="product__body">' +
          '<p class="product__brand">' + p.brand + '</p>' +
          '<h3 class="product__name">' + p.name + '</h3>' +
          '<ul class="product__meta">' + meta + '</ul>' +
          '<div class="product__foot">' +
            '<span class="product__moq">' + p.moq + '</span>' +
            '<button class="product__ask" type="button" data-enquire="' + p.name + '">Enquire</button>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function renderProducts(grid, list) {
    grid.innerHTML = list.map(productCard).join("");
    observeReveals(grid);
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
      if (e.target.closest("a")) {
        nav.classList.remove("is-open");
        burger.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) burger.click();
    });
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
      var r = el.getBoundingClientRect();
      if (r.top < limit && r.bottom > 0) show(el);
    });
  }

  function queueReveals() {
    if (revealQueued) return;
    revealQueued = true;
    requestAnimationFrame(checkReveals);
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
  if (featured) {
    renderProducts(featured, PRODUCTS.slice(0, 4));
  }

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

  /* ---------- 7. enquire buttons -> WhatsApp ---------- */
  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-enquire]");
    if (!btn) return;
    var item = btn.dataset.enquire;
    window.open(
      waLink("Hello Panwar Knitwear, I'd like a quote for: " + item + ". Please share pricing and MOQ."),
      "_blank",
      "noopener"
    );
    toast("Opening WhatsApp for “" + item + "”");
  });

  /* ---------- 8. enquiry form ---------- */
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
      if (!/^[+\d][\d\s-]{7,}$/.test(phone)) {
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

  /* ---------- init ---------- */
  observeReveals(document);
})();
