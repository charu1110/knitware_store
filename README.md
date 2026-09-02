# Panwar Knitwear — dark editorial website

A static, mobile-friendly site for **Panwar Knitwear**, the Ludhiana knitwear
manufacturer behind the **ZONIXA** and **MSP Sports** labels. Content is modelled
on panwarknitwear.com; the design is a fresh dark-aesthetic take — ink black,
warm ember gold, editorial serif headlines and film grain.

## Pages

| File | What's on it |
|---|---|
| `index.html` | Home — hero, fabric marquee, the two brand labels, category grid, sample styles, why-us, fabric library, quote, CTA |
| `products.html` | Full catalogue with category filters and spec/options section |
| `about.html` | Story, six-stage craftsmanship timeline, leadership, listings |
| `contact.html` | Enquiry form, phone lines, address, hours |

Shared assets: `css/style.css`, `js/script.js`.

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
`css/style.css` (`:root`). Changing `--gold`, `--ember` and `--bg` re-skins the
whole site.
