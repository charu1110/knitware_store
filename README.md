# Panwar Knitwear — dual-theme website

A static, mobile-friendly site for **Panwar Knitwear**, the Ludhiana knitwear
manufacturer behind the **ZONIXA** and **MSP Sports** labels. Content is modelled
on panwarknitwear.com; the design is a modern take with two first-class themes —
light "bold & bright" (off-white ground, ink borders, hard offset shadows,
sticker badges) and dark "sleek glass" (deep charcoal, frosted chips, glowing
accents) — set in **Outfit** over **Inter**, with real photography throughout.

## Pages

| File | What's on it |
|---|---|
| `index.html` | Home — hero, fabric marquee, the two brand labels, category grid, sample styles, why-us, floor gallery, fabric library, quote, FAQ, CTA |
| `products.html` | Full catalogue with category filters, spec/options, lookbook gallery |
| `about.html` | Story, six-stage craftsmanship timeline, floor gallery, leadership, listings |
| `contact.html` | Enquiry form, phone lines, address, hours |
| `quote.html` | Quote review and send (reached from the quote drawer) |

Shared assets: `css/style.css`, `js/script.js`. No build step, no dependencies.

## Running it locally

```bash
python -m http.server 8899
```

Then visit http://127.0.0.1:8899/ — use HTTP rather than opening the files
directly, since the theme choice and the quote builder both use `localStorage`.

## Themes

Light is the default; dark is an override. With nothing stored the site follows
the OS preference, and the toggle in the header stores an explicit choice that
then wins. An inline script in each `<head>` resolves the theme **before first
paint**, so there is no flash of the wrong one.

Colour works in two layers. The **base** is a set of semantic tokens — `--bg`,
`--surface`, `--text`, `--line` and friends — defined twice: `1c. THEME — LIGHT`
on `:root`, `1d. THEME — DARK` on `:root[data-theme="dark"]`.

On top sits a **per-block accent** called `--tone`. Put `data-tone="teal"` (or
`gold`, `violet`, `coral`, `sky`, `lime`, `ember`) on any card, tile, filter or
section header and every accented part of it — icon, border, hover glow, badge,
underline — follows that colour. Lists that should cycle the palette (fabric
chips, timeline stages, FAQ rows, contact rows) do it with `nth-child` rules, so
adding an item picks up the next colour automatically. Defaults stay gold.

Every accent is deliberately **dark in the light theme and light in the dark
theme**, so a single `--on-tone` token works for text sitting on any accent.

## The quote builder

Bulk buyers order several styles at once, so alongside the per-style "Enquire"
button there is a quote basket:

1. **Add to quote** on any catalogue card — the quantity pre-fills to that
   style's MOQ, so a new line is valid by default.
2. A **drawer** (available on every page) holds per-line quantity, colours, size
   breakdown and branding options. Quantities are validated against the MOQ.
3. **`quote.html`** reviews the whole list, takes your name, phone, deadline and
   notes, and sends **one itemised WhatsApp message** covering every line.

Progress survives reloads and navigation via `localStorage`. Long quotes degrade
in three tiers — full format, then a compact one-line-per-style format, then a
summary with the full list copied to the clipboard and shown in a text box — so
a 12-style order never silently truncates in the `wa.me` URL.

## Images

Photography is hotlinked from the **Pexels CDN** (free for commercial use, no
attribution required) — nothing is stored in the repo. `photo(id, width)` in
`js/script.js` builds product URLs from the `pic` id on each catalogue entry;
page-level images are plain `<img>` tags with `loading="lazy"`, explicit
`width`/`height` to avoid layout shift, and the hero marked `fetchpriority="high"`.

To swap in your own product shots, drop them in an `img/` folder and replace the
`pic` ids with paths — the card markup doesn't change.

## Editing

Product data is a single `PRODUCTS` array at the top of `js/script.js`; both the
home page's featured strip and the products page render from it, so adding a
style means adding one object (with a stable `id` and a numeric `moqMin`).

All colours, fonts, radii and spacing are CSS custom properties at the top of
`css/style.css`. Changing `--gold` and `--bg` re-skins the site; the accent set
sits right below. To go back to a flatter, single-accent look, point every
accent variable at `var(--gold)` — no markup changes needed.

The WhatsApp number lives in `WA_NUMBER` in `js/script.js` **and** in hardcoded
`wa.me` links in the five HTML files; both must change together.

See `CLAUDE.md` for the conventions, the load-bearing invariants, and the
gotchas worth knowing before editing.
