# Panwar Knitwear — project guide

Static marketing site for a knitwear manufacturer in Ludhiana, Punjab, India.
Five pages, no build step, no dependencies. Content is modelled on the real
business at panwarknitwear.com; the design is our own.

The business runs two labels: **ZONIXA** (everyday top wear) and **MSP Sports**
(active and team wear). Buyers are wholesale — 50–150+ pieces per style — and
the whole funnel ends in a WhatsApp conversation. There is no e-commerce, no
pricing on the site, and no backend.

## Layout

```
index.html      Home
products.html   Catalogue + filters + lookbook
about.html      Story, craftsmanship timeline, gallery, leadership
contact.html    Enquiry form + contact details
quote.html      Quote review + send  (noindex; reached from the quote drawer)
css/style.css   All styling (single file, numbered sections)
js/script.js    All behaviour (single IIFE, feature-gated per page)
```

Open a page directly, or serve the folder:

```bash
python -m http.server 8899
```

Serve over HTTP rather than opening `file://` when testing anything that
touches `localStorage` — the theme choice and the quote both do, and `file://`
behaviour is inconsistent (Safari throws).

## How to work in here

**Every page carries its own copy of the header and footer.** There is no
templating. Change one and you must change all five. In `<head>` that now means
**four** things per page — the Outfit/Inter font `<link>`, the two
`theme-color` metas, the inline theme-resolution script, and the stylesheet link
— plus the theme-toggle button in `.header__actions`. Grep before you assume a
change is done:

```bash
grep -c 'id="themeToggle"' *.html      # 5
grep -c 'pk-theme' *.html              # 5
grep -c 'family=Outfit' *.html         # 5
grep -l 'Bodoni' *.html                # empty
```

**Two headers legitimately differ.** `contact.html`'s `.header__cta` is "Call
now" / a `tel:` link, and `quote.html`'s is "Browse styles" — do not homogenise
them. Nav `is-active` / `aria-current` also differ by design.

**The catalogue lives in one place.** `PRODUCTS` at the top of `js/script.js` is
the single source for the home page's featured strip (`#featuredGrid`, first
four) and the products page grid (`#productGrid`, all of them). Add a style by
adding one object; don't hand-write product markup in HTML.

Each entry needs a stable **`id`** and a numeric **`moqMin`**. The `id` is never
derived from `name` — names are marketing copy that gets edited, and a
name-derived key would orphan every saved quote line. `moqMin` is what
validation uses; `moq` is only ever displayed.

**Every JS block is optional.** `script.js` runs on all five pages and guards
each feature on its DOM anchor existing (`if (productGrid) { … }`). Keep that
pattern — a new feature must not throw on pages that lack its markup. Note the
ordering trap this creates: the product grids render (block 5/6) **before** the
quote store is built (block 12), so anything the renderer calls must tolerate
`quote` being undefined. `syncCards()` has an explicit guard for exactly this.

**CSS is one numbered file.** Sections run `/* ---------- 12. TIMELINE ---------- */`
and so on, with `1b`/`1c`/`1d`/`6b`/`16b`/`16c`/`18b`/`18c`/`20b`/`20c` inserts.
Put new rules in the matching section rather than at the bottom.

## Themes

Light is the designed default; dark is an override. Both are first-class.

- **Where the attribute is set:** an inline `<script>` in every `<head>`, placed
  **before** the stylesheet link. It reads `localStorage["pk-theme"]`, falls back
  to `matchMedia("(prefers-color-scheme: dark)")`, and writes
  `data-theme="light"|"dark"` on `<html>`. It must always write an **explicit**
  value — leaving the attribute unset means section 1d never matches.
- **Where the tokens live:** `1c. THEME — LIGHT` on bare `:root`, `1d. THEME — DARK`
  on `:root[data-theme="dark"]`. Section 1 holds only theme-invariant tokens
  (fonts, radii, spacing, easing, type scale). `1b. ACCENT TONES` is untouched by
  either theme.
- **Where the toggle lives:** JS block 11, guarded on `#themeToggle`. It writes
  `localStorage`, flips the attribute, syncs `aria-pressed`/`aria-label`, and
  **rewrites both `theme-color` metas** — a media-scoped `theme-color` does not
  respond to an attribute override, and skipping this is the most visible
  wrong-theme symptom on Android. A `matchMedia` listener follows the OS only
  while no explicit choice is stored.
- The toggle's sun/moon state comes from **CSS**, not JS, so it is correct on
  first paint with no scripting involved.

**Three rules that are load-bearing:**

1. **The `--on-tone` invariant.** Every accent is *dark in light* and *light in
   dark*, so one `--on-tone` works for text sitting on any accent. Six things
   depend on it: `.btn--primary`, `.filter.is-active`, `.product__ask:hover`,
   `.product__badge`, `.panel__badge`, `.skip-link` and `::selection`. Add a
   mid-tone accent and they go illegible.
2. **Never express a theme difference as `[data-theme] <bare element>`.**
   Redefine a token; if a token cannot express it, scope to a `__block` class.
   See the specificity trap below.
3. **Section 20b must stay above section 21**, so the reduced-motion block's
   `transition-duration: .001ms !important` wins over 20b's `!important`.
   And 20b's property list must **never** include `opacity` or `transform` —
   `opacity` would re-animate every `.reveal` mid-scroll on a theme switch.

**Photo scrims are whole-gradient tokens**, not percentages: `--scrim-hero`,
`--scrim-brand`, `--scrim-cat`, `--scrim-media`, `--scrim-shot`, plus
`--glass-chip` / `--chip-blur` for chips that float over photographs. Light
needs a different gradient *shape*, not an inverted one — an 88%-opaque white
wash over a photo is a milky ruin. Photo brightness goes through `--img-filter` /
`--img-filter-hover`: light mode wants **bright** photos, dark wants them dimmed.

To make the site darker or lighter overall, move `--bg`, `--bg-2`, `--surface`
and `--surface-2` together and adjust `--grain-opacity` to match (grain is `0`
in light on purpose — on an off-white ground it reads as a dirty scan).

## The `--tone` accent system

`--tone` defaults to `--gold`. Add `data-tone="teal"` (or `gold`, `violet`,
`coral`, `sky`, `lime`, `ember`) to any card, tile, filter or section header and
every accented part of it — icon, border, hover glow, badge, underline — follows
that colour. Lists that cycle the palette (fabric chips, timeline stages, FAQ
rows, contact rows, gallery figures) do it with `nth-child`, so a new item picks
up the next colour on its own.

Build new components against `var(--tone)`, never a hard-coded accent. To flatten
the site to one accent, point every accent variable at `var(--gold)` — no markup
changes needed.

**Specificity trap:** a bare descendant selector like `.cat span` will
out-specify a component class like `.cat__art` and silently kill its tone
colour. Scope descendant selectors (`.cat__body span`). This has already bitten
once, and `.contact-item span` / `strong` are live precedents that already
out-specify nearby class rules.

**Token redefinition is the only approach that reaches inline styles.**
`about.html` has four `style="color:var(--gold)"` leadership captions (plus two
more inline token references). Inline styles cannot be overridden by any rule
short of `!important`, so never introduce a new accent name and leave `--gold`
behind — those captions would keep the old colour forever.

## The quote builder

A hybrid: a drawer for collecting, `quote.html` for review and send.

- **Both surfaces render the same editors.** `lineHTML()` builds one line;
  `renderLines()` paints it into both `#qbBody` (drawer) and `#qbReview`
  (`quote.html`). Document-delegated handlers keyed on `data-lid` work in either.
- **The drawer and header badge are JS-injected**, so the feature costs zero
  edits across the duplicated headers. The badge goes in as `.header__actions`'
  **first child**, giving badge → theme toggle → CTA → burger.
- **State:** `localStorage["pk_quote_v1"]`. Persists **only** `id` + `lid` +
  user input. Everything else is re-derived through `productById()` on read, so a
  catalogue edit can never be contradicted by a stale cached value. `hydrate()`
  clamps hard (24 lines, 200 chars/field, qty 0–999999, known branding codes) and
  drops lines whose `id` no longer resolves. State is authoritative **in memory**;
  storage is a mirror, and a blocked `setItem` degrades to a working-but-unsaved
  builder with one toast.
- `lid` is a per-line handle, so the same style can appear twice (two colourways
  at different quantities is a real bulk pattern) and DOM ids stay stable.
- **Text edits do not re-render** — they mutate state and debounce a save, so
  focus is never lost mid-typing. Only structural changes (add/remove/clear/
  cross-tab) call `renderLines()`.
- **`esc()` on every interpolation, and input values assigned in JS** rather than
  interpolated into `value="…"`. That is a deliberate divergence from the file's
  string-concat convention: colours/sizes/notes are user text that gets
  re-rendered, so it is a security boundary.
- **The add and enquire buttons are SIBLINGS**, never nested. The add handler has
  an `if (add.closest("[data-enquire]")) return;` guard so a future refactor that
  nests them fails loudly instead of double-firing.
- **Message length:** `wa.me` encodes every newline as `%0A` and every space as
  `%20` — 3× each — so the budget is on the whole URL (`MAX_URL = 1800`), not the
  plain text. Three tiers: full → compact (`|` separators, short branding codes)
  → summary + clipboard with the full text revealed in `#qbText`. A 12-style
  quote genuinely exceeds the budget; this is not theoretical.
- **`window.open` is called FIRST, before any clipboard `await`.** Awaiting the
  clipboard promise first consumes the user-gesture window and the popup blocker
  eats the WhatsApp tab. Easiest way to ship this broken.
- Naming: `.quote` and CSS section 13 are already the buyer **testimonial**.
  Everything in the builder is prefixed `.qb-`.

## Scroll reveals

`.reveal` elements fade in via IntersectionObserver, **plus** a rect-based
fallback on scroll / resize / load / visibilitychange. Keep both paths and the
`is-in` class contract if you touch that code — the JS sets
`el.style.transitionDelay` inline, so don't migrate to `@starting-style` or a
keyframe animation. Don't add `content-visibility: auto` or `overflow: clip` to
sections either; it changes the rect geometry the fallback measures.

Nodes destroyed by an `innerHTML` re-render are pruned via `isConnected` — without
that they leak into `pending[]` forever. Keep `.reveal` **off** the drawer and off
re-rendered quote rows: a `.reveal` inside a translated off-screen panel can sit
at `opacity: 0` permanently, since both paths correctly see it as off-screen.

`prefers-reduced-motion` disables the animation entirely.

## Images

Photography is hotlinked from the **Pexels CDN** (free for commercial use, no
attribution required). Nothing is stored in the repo.

- Product shots: the `pic` id on each `PRODUCTS` entry, turned into a URL by
  `photo(id, width)`.
- Page images: plain `<img>` with `loading="lazy"`, explicit `width`/`height` to
  prevent layout shift, and `fetchpriority="high"` on the hero only.

Verify any new image id actually resolves before committing it — construct the
URL and load it, don't trust the id. To move to real product photography, drop
files in an `img/` folder and swap the `pic` ids for paths; card markup is
unchanged.

**Do not put stock photos of people against the named leadership.** Those are
real individuals; the cards use SVG avatars on purpose.

## Content rules

The following are **placeholders, not facts from the business**: founding year
1998, "27+ years", "1,20,000 pieces/season", all MOQ figures, the FAQ lead times,
and the buyer testimonial. Treat them as provisional — flag them rather than
deepening them, and replace with real figures before this goes live.

These **are** from the real business and should stay accurate: the company and
label names, the six product categories, the eight fabrics (Spun Fleece, Dry Fit,
Honeycomb Lycra, 100% Cotton, Cotton Lycra, NS Bonded, Russian Fleece, Sherpa),
the leadership names and roles, the Ludhiana location, and the three phone
numbers.

The owner's standing preference is **add, don't replace** — when extending a
page, keep the existing copy and sections intact.

## Contact details

Three numbers appear in the footer of all five pages. The WhatsApp number
`+91 98760 45457` is duplicated in two forms and both must change together:

- `WA_NUMBER` (digits only, `919876045457`) at the top of `js/script.js`
- hardcoded `https://wa.me/919876045457` links in each of the five HTML files
  (`grep -c 'wa.me/919876045457' *.html` → 5, 5, 3, 4, 3)

"Enquire" buttons, the contact form and the quote builder all open WhatsApp with
the message pre-filled. The contact form and the quote both validate name and
phone against one shared `PHONE_RE` and **never** open WhatsApp on invalid
input — keep that behaviour, and don't fork the regex.

## Verifying changes

Serve the folder and check in a browser. Worth confirming after edits:

- no broken images: `[...document.images].filter(i => i.complete && !i.naturalWidth)`
- no `.reveal` stuck at `opacity: 0` once scrolled past (`top < innerHeight - 40`)
- filters still partition the grid (all 12 / hoodies 4 / tshirts 3 / sweatshirts 2 / bottoms 3)
- the contact form still blocks bad input without opening WhatsApp
- theme: hard reload with the OS in dark and nothing stored → dark, no flash;
  store light, switch the OS to dark → stays light; `localStorage.clear()` →
  follows the OS again
- quote: add on `products.html`, navigate, reload → the badge count survives both
- `assert waLink(text).length <= 1800` for 2-line, 7-line and 12-line quotes
- the mobile burger menu opens, and layout holds at 375px

**Preview-pane gotchas** (the in-app Browser pane, not real browsers):

- It reports `document.hidden === true`. That freezes CSS transitions mid-flight,
  so computed colours read wrong — inject `* { transition: none !important }`
  before reading any computed colour. It also means `requestAnimationFrame`
  never runs and scroll events don't propagate, so scroll reveals cannot be
  verified there; dispatch a `resize` event to force a check instead.
- Screenshots time out when the app window is hidden or minimised. Fall back to
  `get_page_text` / DOM assertions.
- `python -m http.server` occasionally drops a request with
  `net::ERR_CONNECTION_RESET` under rapid reloads. If a page renders with
  UA-default styling (black text, blue links, transparent body), that is the
  cause — check `document.styleSheets` before suspecting the CSS.
