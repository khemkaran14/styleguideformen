# The Ultimate Style Guide for Men

A style guide for Indian men: a lookbook of 42 ethnic, fusion and western outfits, an occasion guide, **26 hairstyles with barber instructions**, a face-shape finder, 9 beard styles, a style quiz, colour combinations and a **Dressing Room** where you restyle any outfit, hairstyle and beard on the model. Members can sign up to save looks across devices and get outfits and haircuts picked for them. Admins get a dashboard to manage members and the site.

The companion site for women is [khemkaran14/styleguideforwomen](https://github.com/khemkaran14/styleguideforwomen); both can run on the same VPS.

## Features

- **Lookbook & Occasions**: sherwanis, bandhgalas, kurtas, Nehru jackets, dhotis, mundu, pathani suits, suits, tuxedos, smart casual and more, filtered by style, origin, occasion and search
- **Hairstyles & grooming**: face-shape finder, filters by face shape, hair type, length and effort, barber notes and styling steps for each cut, beard guide, face-shape guide
- **Dressing Room**: change every garment, colour and print, add jackets, shoes and accessories (tie, pocket square, safa, stole, watch…), try any hairstyle, beard, skin tone, body type and face shape; save, download as an image, or copy a prompt to turn it into a real photo with your own picture
- **Style quiz** and **colour combinations**
- **Accounts**: sign up, sign in, forgot password (email or admin link), style profile (style, body type, face shape, hair type, occasions), picks for you, delete account
- **Admin**: members with CSV export, reset links, roles, contact-form inbox, announcement banner, front-page and hidden looks
- **Pages for Google**: a page per look, occasion and hairstyle, About, Contact, Privacy, Terms, 404, `robots.txt`, `sitemap.xml` with images, Open Graph tags, structured data, icons and a share image

## Images

Every look, hairstyle and beard is drawn by the site’s own illustration engine (`public/assets/js/engine.js`), so the site is complete without photos. To use photos of a model, follow `docs/photo-prompts/README.md` and import the package with `npm run photos -- package.zip`; photos replace the illustrations wherever they exist. `npm run images` redraws the illustrations after changing looks in `public/assets/js/data.js`. Both scripts need Playwright (developer machines only).

## Tech

- Node.js 22.13+ with Express 5 and the built-in `node:sqlite` (no native modules)
- Plain HTML/CSS/JS front end in `public/`, no build step
- Optional SMTP (nodemailer) for password-reset and contact emails

## Run locally

```bash
npm ci
COOKIE_SECURE=false PORT=3000 npm start
# open http://127.0.0.1:3000 — the first account becomes admin when ADMIN_EMAILS is unset
```

`bash scripts/smoke-test.sh` runs the automated checks. Settings are listed in `.env.example`.

## Deploy

See **[README-DEPLOY.md](README-DEPLOY.md)** for putting it on a subdomain of a Hostinger VPS with HTTPS, backups and optional auto-deploy.
