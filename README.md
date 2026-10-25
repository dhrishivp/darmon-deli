# Darmon Deli

Website for Darmon Deli, 104 Sycamore Road, Amersham HP6 5EN.

A static, single-page site: plain HTML, CSS and JavaScript, no build step.

```
index.html            the site
404.html              not-found page (Netlify serves it automatically)
assets/css/styles.css
assets/js/main.js     mobile menu, live "open now" status, today's hours
assets/img/           photos, favicon, social share image
netlify.toml          publish settings and headers
```

## Deploy on Netlify

1. In Netlify, choose **Add new site → Import an existing project** and pick this repo.
2. Leave the build command empty. The publish directory is `.` (already set in `netlify.toml`).
3. Deploy.

## Run locally

```
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Updating content

- **Opening hours** live in two places: the table in `index.html` (`#visit`) and the
  `HOURS` object near the bottom of `assets/js/main.js`, which drives the
  "Open now / Closed" badge. Update both together. The footer and the JSON-LD block in
  the `<head>` also list the hours.
- **Dishes** are in the `#menu` section of `index.html`.
- **Photos**: drop new images in `assets/img/` and update the `src`, `width` and
  `height` attributes.

## Notes on the mobile menu

The slide-out menu is deliberately placed outside `<header>` and has a solid
background. A `position: fixed` element inside a parent that uses `transform`,
`filter` or `backdrop-filter` gets positioned against that parent instead of the
screen, which is the usual cause of a sidebar that looks clipped or see-through.
When open, the menu locks page scroll, traps keyboard focus, and closes on Escape,
on a tap outside it, or when a link is chosen.
