# Panwar Knitwear — dark editorial website

A static, mobile-friendly site for **Panwar Knitwear**, the Ludhiana knitwear
manufacturer behind the **ZONIXA** and **MSP Sports** labels. Content is modelled
on panwarknitwear.com; the design is a fresh take on a dark theme — a soft
charcoal base (`#16181F`, not black), editorial serif headlines, real
photography, and a six-colour accent set that lights up on interaction.

## Pages

| File | What's on it |
|---|---|
| `index.html` | Home — hero, fabric marquee, the two brand labels, category grid, sample styles, why-us, **floor gallery**, fabric library, quote, **FAQ**, CTA |
| `products.html` | Full catalogue with category filters, spec/options, **lookbook gallery** |
| `about.html` | Story, six-stage craftsmanship timeline, **floor gallery**, leadership, listings |
| `contact.html` | Enquiry form, phone lines, address, hours |

Shared assets: `css/style.css`, `js/script.js`.

## Colour

Two layers. The **base** is a soft charcoal — `--bg` through `--surface-2` in
`:root` — deliberately several steps lighter than black so photographs and text
both sit comfortably on it.

On top, a **per-block accent** called `--tone`. Put `data-tone="teal"` (or
`gold`, `violet`, `coral`, `sky`, `lime`, `ember`) on any card, tile, filter or
section header and every accented part of it — icon, border, hover glow, badge,
underline — follows that colour. Lists that should cycle through the palette
(fabric chips, timeline stages, FAQ rows, contact rows) do it with `nth-child`
rules, so adding an item picks up the next colour automatically.

Defaults stay gold, so anything without a `data-tone` looks exactly as before.

## Images

Photography is hotlinked from the **Pexels CDN** (free for commercial use, no
attribution required) — nothing is stored in the repo. `photo(id, width)` in
`js/script.js` builds product URLs from the `pic` id on each catalogue entry;
page-level images are plain `<img>` tags with `loading="lazy"`, explicit
`width`/`height` to avoid layout shift, and the hero marked `fetchpriority="high"`.

To swap in your own product shots, drop them in an `img/` folder and replace the
`pic` ids with paths — the card markup doesn't change.

## How it works

- **No build step, no dependencies.** Plain HTML/CSS/JS. Fonts come from Google
  Fonts (Bodoni Moda + Inter); every graphic is inline SVG, so there are no
  image files to manage.
- **Product data lives in one place** — the `PRODUCTS` array at the top of
  `js/script.js`. Both the home page's featured strip and the products page
  render from it, so adding a style means adding one object.
- **Enquiries go to WhatsApp.** The "Enquire" button on each card and the
  contact form both open `wa.me` with the message pre-filled. The number is the
  `WA_NUMBER` constant in `js/script.js` — change it there and in the `wa.me`
  links in the HTML.
- **Scroll reveals** use IntersectionObserver with a rect-based fallback, so
  content can never get stuck invisible if the observer stays silent (hidden
  containers, background tabs). `prefers-reduced-motion` disables all of it.

## Running it locally

Open `index.html` directly, or serve the folder:

```bash
python -m http.server 8899
```

Then visit http://127.0.0.1:8899/

## Editing the theme

All colours, fonts, radii and spacing are CSS custom properties at the top of
`css/style.css` (`:root`). Changing `--gold` and `--bg` re-skins the whole site;
the accent set (`--teal`, `--violet`, `--coral`, `--sky`, `--lime`) sits right
below it. To go back to a flatter, single-accent look, set every accent variable
to `var(--gold)` — no markup changes needed.

Want it darker or lighter again? Move `--bg`, `--bg-2`, `--surface` and
`--surface-2` together, and adjust the film-grain `opacity` in the `body::before`
rule to match.
