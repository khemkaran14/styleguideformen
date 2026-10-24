// Server-rendered pages for search engines and sharing: look pages, occasion pages,
// About / Contact / Privacy / Terms, 404, robots.txt and sitemap.xml.
// Look and occasion content comes from public/assets/js/data.js, the same file the app uses.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const PUB = path.join(__dirname, 'public');
const LEGAL_DATE = '24 October 2026';
const LEGAL_ISO = '2026-10-24';

// ---------- load the app's data files ----------
function loadData() {
  const ctx = {};
  vm.createContext(ctx);
  const read = f => fs.readFileSync(path.join(PUB, 'assets/js', f), 'utf8');
  vm.runInContext(read('data.js') + ';globalThis.__d={OCC,L,HAIR,BEARDS,FACEINFO,HTYPES};', ctx);
  vm.runInContext(read('engine.js') + ';globalThis.__f=FACES;', ctx);
  let P = { looks: {}, hair: {}, beards: {}, real: [] };
  try { vm.runInContext(read('photos.js') + ';globalThis.__p=PHOTOS;', ctx); P = ctx.__p; } catch (e) { console.error('photos.js missing: run npm run images'); }
  const { OCC, L, HAIR, BEARDS, FACEINFO, HTYPES } = ctx.__d;
  const FACES = ctx.__f;
  const PHOTOS = P.looks || {}, HPHOTOS = P.hair || {};
  const dataTime = fs.statSync(path.join(PUB, 'assets/js/data.js')).mtime.toISOString().slice(0, 10);
  return { OCC, L, PHOTOS, HPHOTOS, HAIR, BEARDS, FACES, FACEINFO, HTYPES, dataTime };
}
const { OCC, L, PHOTOS, HPHOTOS, HAIR, BEARDS, FACES, FACEINFO, HTYPES, dataTime } = loadData();
const MAINT = { low: 'Low effort', medium: 'Some styling', high: 'Daily styling' };
const lookCols = o => [...new Set([o.fig.layer && o.fig.layer.c, o.fig.top && o.fig.top.c, o.fig.bottom && o.fig.bottom.c, o.fig.shoe && o.fig.shoe.c].filter(Boolean))];
const hairName = id => (HAIR.find(h => h.id === id) || { n: id }).n;
const CATN = { ethnic: 'Ethnic', fusion: 'Fusion / Indo-western', western: 'Western' };
const CAT_ORDER = ['ethnic', 'fusion', 'western'];

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const json = o => JSON.stringify(o).replace(/</g, '\\u003c');
const occName = k => (OCC[k] ? OCC[k].n : k);
const lowerFirst = s => s.charAt(0).toLowerCase() + s.slice(1);

module.exports = function pages(app, opts) {
  const { cfg, hiddenLooks, saveMessage } = opts;
  const base = req => cfg.PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
  const visible = () => { const h = hiddenLooks(); return L.filter(o => PHOTOS[o.id] && !h.includes(o.id)); };
  const findLook = id => visible().find(o => o.id === id);
  const NAME = cfg.SITE_NAME;

  // ---------- layout ----------
  function layout(req, { title, description, pathName, body, image, jsonld = [], noindex = false, type = 'website' }) {
    const url = base(req) + pathName;
    const img = base(req) + (image || '/assets/img/og.jpg');
    const fullTitle = title ? `${title} | ${NAME}` : NAME;
    return `<!doctype html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex, follow">' : `<link rel="canonical" href="${esc(url)}">`}
<meta property="og:site_name" content="${esc(NAME)}">
<meta property="og:type" content="${type}">
<meta property="og:title" content="${esc(title || NAME)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:locale" content="en_IN">
<meta name="twitter:card" content="summary_large_image">
${headCommon()}
<link rel="stylesheet" href="/assets/css/pages.css?v=1">
<link rel="stylesheet" href="/assets/css/footer.css?v=1">
${jsonld.map(j => `<script type="application/ld+json">${json(j)}</script>`).join('\n')}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="top"><div class="wrap">
  <a class="brand" href="/">${brandHTML()}</a>
  <nav class="links" aria-label="Main">
    <a href="/looks"${pathName.startsWith('/looks') ? ' aria-current="page"' : ''}>Looks</a>
    <a href="/occasions"${pathName.startsWith('/occasions') ? ' aria-current="page"' : ''}>Occasions</a>
    <a href="/hairstyles"${pathName.startsWith('/hairstyles') ? ' aria-current="page"' : ''}>Hairstyles</a>
    <a href="/#quiz">Style Quiz</a>
    <a href="/#studio">Dressing Room</a>
  </nav>
  <a class="btn alt" href="/">Open the guide</a>
</div></header>
<main id="main" class="wrap">
${body}
</main>
${footerHTML()}
</body>
</html>`;
  }
  function brandHTML() {
    const m = /^The (.+)$/.exec(NAME);
    return m ? `<i>The</i> ${esc(m[1])}` : esc(NAME);
  }
  function headCommon() {
    return `<meta name="theme-color" content="#D6246E">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
${cfg.GOOGLE_SITE_VERIFICATION ? `<meta name="google-site-verification" content="${esc(cfg.GOOGLE_SITE_VERIFICATION)}">` : ''}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,700;0,9..144,800;0,9..144,900;1,9..144,500&family=Manrope:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap">`;
  }
  function footerHTML() {
    return `<footer class="site-foot"><div class="wrap">
  <div class="fcols">
    <div><a class="brand" href="/">${brandHTML()}</a><p>Men’s outfits for every occasion, hairstyles for every face shape, and a Dressing Room to restyle any look.</p></div>
    <nav aria-label="Explore"><b>Explore</b><a href="/looks">All looks</a><a href="/occasions">Occasions</a><a href="/hairstyles">Hairstyles</a><a href="/#quiz">Style quiz</a><a href="/#colours">Colour combos</a><a href="/#studio">Dressing Room</a></nav>
    <nav aria-label="Popular"><b>Popular</b><a href="/occasions/wedding">Wedding outfits</a><a href="/occasions/office">Office wear</a><a href="/looks/navysuit">Navy suit</a><a href="/looks/navybandhgala">Bandhgala</a><a href="/hairstyles/quiff">Quiff haircut</a></nav>
    <nav aria-label="About"><b>About</b><a href="/about">About us</a><a href="/contact">Contact</a><a href="/privacy">Privacy policy</a><a href="/terms">Terms of use</a></nav>
  </div>
  <p class="fine">© ${new Date().getFullYear()} ${esc(NAME)}. Images are illustrations and AI-generated photos for styling inspiration.</p>
</div></footer>`;
  }
  // exposed so the home page can share the footer and head tags
  app.locals.footerHTML = footerHTML;
  app.locals.headCommon = headCommon;

  const crumbs = (req, items) => ({
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, p], i) => ({ '@type': 'ListItem', position: i + 1, name, item: base(req) + p }))
  });
  const crumbNav = items => `<nav class="crumbs" aria-label="Breadcrumb">${items.map(([n, p], i) => i < items.length - 1 ? `<a href="${p}">${esc(n)}</a><span aria-hidden="true">›</span>` : `<span aria-current="page">${esc(n)}</span>`).join('')}</nav>`;
  const card = o => `<a class="lcard" href="/looks/${o.id}">
    <img src="${PHOTOS[o.id]}" alt="${esc(o.n)}" width="720" height="900" loading="lazy">
    <span class="tag ${o.c}">${esc(CATN[o.c].split(' ')[0])}</span>
    <b>${esc(o.n)}</b><small>${esc(o.occ.slice(0, 3).map(occName).join(' · '))}</small></a>`;
  const send = (res, html, status = 200) => res.status(status).set('Cache-Control', status === 200 ? 'public, max-age=300' : 'no-store').type('html').send(html);

  // ---------- look pages ----------
  app.get('/looks', (req, res) => {
    const V = visible();
    const body = `${crumbNav([['Home', '/'], ['Looks', '/looks']])}
<section class="phead"><span class="eyebrow">The Lookbook</span><h1>${V.length} men’s outfits, <em>ethnic to western</em></h1>
<p class="lede">Sherwanis, bandhgalas, kurtas, Nehru jackets, dhotis, suits, tuxedos and smart casual. Open any look for the pieces, footwear, accessories, colours and a stylist tip, then restyle it in the Dressing Room.</p></section>
${CAT_ORDER.map(c => { const g = V.filter(o => o.c === c); return g.length ? `<section class="block"><h2>${esc(CATN[c])} <em>looks</em></h2><div class="lgrid">${g.map(card).join('')}</div></section>` : ''; }).join('')}`;
    send(res, layout(req, {
      title: 'Men’s outfit ideas: sherwanis, kurtas, suits and casual looks', pathName: '/looks',
      description: `Browse ${V.length} men's outfit ideas: sherwanis, bandhgalas, kurta pyjamas, Nehru jackets, Indo-western, suits, tuxedos and smart casual, each with styling tips.`,
      body, jsonld: [crumbs(req, [['Home', '/'], ['Looks', '/looks']]), {
        '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'All looks', url: base(req) + '/looks',
        mainEntity: { '@type': 'ItemList', numberOfItems: V.length, itemListElement: V.map((o, i) => ({ '@type': 'ListItem', position: i + 1, url: `${base(req)}/looks/${o.id}`, name: o.n })) }
      }]
    }));
  });

  app.get('/looks/:id', (req, res, next) => {
    const o = findLook(req.params.id);
    if (!o) return next();
    const V = visible();
    const related = V.filter(x => x.id !== o.id).map(x => [x, (x.c === o.c ? 2 : 0) + x.occ.filter(k => o.occ.includes(k)).length]).sort((a, b) => b[1] - a[1]).slice(0, 4).map(x => x[0]);
    const desc = `${o.d} What to wear with it, footwear, jewellery and a stylist tip.`.slice(0, 300);
    const body = `${crumbNav([['Home', '/'], ['Looks', '/looks'], [o.n, '/looks/' + o.id]])}
<article class="look">
  <div class="lpic"><img src="${PHOTOS[o.id]}" alt="${esc(o.n)}: ${esc(o.cn)}" width="720" height="900" fetchpriority="high"></div>
  <div class="lbody">
    <div class="tags"><span class="tag ${o.c}">${esc(CATN[o.c])}</span><span class="tag">${esc(o.r)}</span><span class="tag">${esc(o.m)}</span></div>
    <h1>${esc(o.n)}</h1>
    <p class="lede">${esc(o.d)}</p>
    <dl>
      <dt>The pieces</dt><dd><ul>${o.pc.map(x => `<li>${esc(x)}</li>`).join('')}</ul></dd>
      <dt>Footwear</dt><dd>${esc(o.ft)}</dd>
      <dt>Accessories</dt><dd>${esc(o.ac)}</dd>
      <dt>Hair &amp; beard</dt><dd><a href="/hairstyles/${o.fig.hair}">${esc(hairName(o.fig.hair))}</a>${o.fig.beard && o.fig.beard !== 'clean' ? ', ' + esc(((BEARDS.find(b => b.id === o.fig.beard) || { n: '' }).n).toLowerCase()) : ', clean shaven'}</dd>
      <dt>Colours</dt><dd><span class="sws">${lookCols(o).map(c => `<i style="background:${esc(c)}"></i>`).join('')}</span> ${esc(o.cn)}</dd>
      <dt>Wear it to</dt><dd>${o.occ.map(k => `<a href="/occasions/${k}">${esc(occName(k))}</a>`).join(', ')}</dd>
    </dl>
    <div class="tipbox"><b>Stylist tip:</b> ${esc(o.tip)}</div>
    <div class="row"><a class="btn alt" href="/?try=${o.id}#studio">Try it on in the Dressing Room</a><a class="btn ghost" href="/?look=${o.id}">Save this look</a></div>
  </div>
</article>
<section class="block"><h2>You might <em>also like</em></h2><div class="lgrid">${related.map(card).join('')}</div></section>`;
    send(res, layout(req, {
      title: `${o.n}: how to style it`, pathName: '/looks/' + o.id, description: desc, image: PHOTOS[o.id], type: 'article', body,
      jsonld: [crumbs(req, [['Home', '/'], ['Looks', '/looks'], [o.n, '/looks/' + o.id]]), {
        '@context': 'https://schema.org', '@type': 'Article', headline: `${o.n}: how to style it`, description: o.d,
        image: [base(req) + PHOTOS[o.id]], dateModified: dataTime, mainEntityOfPage: base(req) + '/looks/' + o.id,
        author: { '@type': 'Organization', name: NAME, url: base(req) + '/' },
        publisher: { '@type': 'Organization', name: NAME, logo: { '@type': 'ImageObject', url: base(req) + '/icon-512.png' } },
        keywords: [o.n, CATN[o.c], ...o.occ.map(occName)].join(', ')
      }]
    }));
  });

  // ---------- occasion pages ----------
  app.get('/occasions', (req, res) => {
    const body = `${crumbNav([['Home', '/'], ['Occasions', '/occasions']])}
<section class="phead"><span class="eyebrow">Occasion guide</span><h1>What to wear, <em>where</em></h1>
<p class="lede">From weddings, sangeet and haldi to office days, interviews, date nights and beach holidays: what works, what to skip, the colours that suit each occasion, and looks to copy.</p></section>
<div class="ogrid">${Object.entries(OCC).map(([k, v]) => `<a class="otile" href="/occasions/${k}" style="--c:${esc(v.c)}"><b>${esc(v.n)}</b><small>${esc(v.s)}</small></a>`).join('')}</div>`;
    send(res, layout(req, {
      title: 'What to wear for every occasion', pathName: '/occasions', body,
      description: 'What men should wear to a wedding, sangeet, mehendi, haldi, festival, pooja, office, interview, date night, party, cocktail, travel or beach, with outfit ideas for each.',
      jsonld: [crumbs(req, [['Home', '/'], ['Occasions', '/occasions']])]
    }));
  });

  app.get('/occasions/:k', (req, res, next) => {
    const k = req.params.k, v = Object.prototype.hasOwnProperty.call(OCC, k) ? OCC[k] : null;
    if (!v) return next();
    const looks = visible().filter(o => o.occ.includes(k));
    const body = `${crumbNav([['Home', '/'], ['Occasions', '/occasions'], [v.n, '/occasions/' + k]])}
<section class="phead occhead" style="--c:${esc(v.c)}"><span class="eyebrow">${esc(v.s)}</span><h1>What to wear: <em>${esc(v.n)}</em></h1>
<p class="lede">${esc(v.d)}</p></section>
<div class="occinfo">
  <div><h2 class="h4">Wear</h2><p>${esc(v.w)}</p></div>
  <div><h2 class="h4">Avoid</h2><p>${esc(v.a)}</p></div>
  <div><h2 class="h4">Colours that work</h2><p>${esc(v.t)}</p></div>
</div>
${looks.length ? `<section class="block"><h2>${looks.length} looks for <em>${esc(lowerFirst(v.n))}</em></h2><div class="lgrid">${looks.map(card).join('')}</div></section>` : ''}
<section class="block more"><h2 class="h4">More occasions</h2><p>${Object.entries(OCC).filter(([x]) => x !== k).map(([x, o]) => `<a href="/occasions/${x}">${esc(o.n)}</a>`).join(' · ')}</p></section>`;
    send(res, layout(req, {
      title: `${v.n} outfits: what to wear`, pathName: '/occasions/' + k, body,
      description: `${v.d} Wear: ${v.w}`.slice(0, 300),
      image: looks[0] ? PHOTOS[looks[0].id] : undefined,
      jsonld: [crumbs(req, [['Home', '/'], ['Occasions', '/occasions'], [v.n, '/occasions/' + k]]), {
        '@context': 'https://schema.org', '@type': 'ItemList', name: `${v.n} outfit ideas`,
        itemListElement: looks.map((o, i) => ({ '@type': 'ListItem', position: i + 1, url: `${base(req)}/looks/${o.id}`, name: o.n }))
      }]
    }));
  });

  // ---------- hairstyle pages ----------
  const himg = h => HPHOTOS[h.id] || '/assets/img/og.jpg';
  const hcard = h => `<a class="lcard sq" href="/hairstyles/${h.id}">
    <img src="${himg(h)}" alt="${esc(h.n)} hairstyle" width="600" height="600" loading="lazy">
    <b>${esc(h.n)}</b><small>${esc(h.len[0].toUpperCase() + h.len.slice(1))} · ${MAINT[h.maint]}</small></a>`;
  app.get('/hairstyles', (req, res) => {
    const body = `${crumbNav([['Home', '/'], ['Hairstyles', '/hairstyles']])}
<section class="phead"><span class="eyebrow">Hairstyles &amp; grooming</span><h1>${HAIR.length} men’s haircuts, <em>for every face</em></h1>
<p class="lede">Short, medium and long styles for straight, wavy, curly and coily hair. Each one tells you exactly what to ask your barber, how to style it and which face shapes it suits. Not sure of your face shape? Use the <a href="/#hair">face-shape finder</a>.</p></section>
${['short', 'medium', 'long'].map(len => { const g = HAIR.filter(h => h.len === len); return `<section class="block"><h2>${len[0].toUpperCase() + len.slice(1)} <em>hairstyles</em></h2><div class="lgrid">${g.map(hcard).join('')}</div></section>`; }).join('')}
<section class="block" id="face-shapes"><h2>Which haircut suits <em>your face shape?</em></h2><div class="facecards">${Object.entries(FACEINFO).map(([k, f]) => `<div id="${k}"><h3>${esc(FACES[k].n)} face</h3><p>${esc(f.d)}</p><p><b>Best:</b> ${esc(f.best)}</p><p><b>Avoid:</b> ${esc(f.avoid)}</p><p><b>Beard:</b> ${esc(f.beard)}</p><p>${HAIR.filter(h => h.faces.includes(k)).slice(0, 6).map(h => `<a href="/hairstyles/${h.id}">${esc(h.n)}</a>`).join(' · ')}</p></div>`).join('')}</div></section>
<section class="block"><h2>Beard <em>styles</em></h2><div class="facecards">${BEARDS.map(b => `<div><h3>${esc(b.n)}</h3><p>${esc(b.d)}</p><p><b>Suits:</b> ${b.faces.map(f => FACES[f].n).join(', ')}</p><p><b>Upkeep:</b> ${esc(b.upkeep)}</p></div>`).join('')}</div></section>`;
    send(res, layout(req, {
      title: 'Men’s hairstyles for every face shape, with barber instructions', pathName: '/hairstyles', body,
      description: `${HAIR.length} men's haircuts (crew cut, quiff, fade, side part, curly top and more) with what to tell your barber, how to style them, face-shape advice and beard styles.`,
      image: HPHOTOS.quiff,
      jsonld: [crumbs(req, [['Home', '/'], ['Hairstyles', '/hairstyles']]), {
        '@context': 'https://schema.org', '@type': 'ItemList', name: 'Men’s hairstyles',
        itemListElement: HAIR.map((h, i) => ({ '@type': 'ListItem', position: i + 1, url: `${base(req)}/hairstyles/${h.id}`, name: h.n }))
      }]
    }));
  });
  app.get('/hairstyles/:id', (req, res, next) => {
    const h = HAIR.find(x => x.id === req.params.id);
    if (!h) return next();
    const related = HAIR.filter(x => x.id !== h.id).map(x => [x, x.faces.filter(f => h.faces.includes(f)).length + (x.len === h.len ? 1 : 0)]).sort((a, b) => b[1] - a[1]).slice(0, 4).map(x => x[0]);
    const looks = visible().filter(o => o.fig.hair === h.id);
    const body = `${crumbNav([['Home', '/'], ['Hairstyles', '/hairstyles'], [h.n, '/hairstyles/' + h.id]])}
<article class="look">
  <div class="lpic sq"><img src="${himg(h)}" alt="${esc(h.n)} hairstyle" width="600" height="600" fetchpriority="high"></div>
  <div class="lbody">
    <div class="tags"><span class="tag">${esc(h.len)}</span><span class="tag">${MAINT[h.maint]}</span><span class="tag">cut every ${h.cut} weeks</span></div>
    <h1>${esc(h.n)}</h1>
    <p class="lede">${esc(h.d)}</p>
    <dl>
      <dt>Face shapes</dt><dd>${h.faces.map(f => `<a href="/hairstyles#${f}">${esc(FACES[f].n)}</a>`).join(', ')}</dd>
      <dt>Hair types</dt><dd>${h.types.map(t => HTYPES[t]).join(', ')}</dd>
      <dt>Good for</dt><dd>${h.occ.map(k => OCC[k] ? `<a href="/occasions/${k}">${esc(OCC[k].n)}</a>` : k).join(', ')}</dd>
      <dt>Products</dt><dd>${esc(h.prod)}</dd>
    </dl>
    <div class="tipbox"><b>Tell your barber:</b> “${esc(h.ask)}”</div>
    <div><b>How to style it:</b> ${esc(h.style)}</div>
    <div class="row"><a class="btn alt" href="/?hair=${h.id}#studio">Try it on in the Dressing Room</a><a class="btn ghost" href="/#hair">Find your face shape</a></div>
  </div>
</article>
${looks.length ? `<section class="block"><h2>Looks with <em>this cut</em></h2><div class="lgrid">${looks.map(card).join('')}</div></section>` : ''}
<section class="block"><h2>Similar <em>hairstyles</em></h2><div class="lgrid">${related.map(hcard).join('')}</div></section>`;
    send(res, layout(req, {
      title: `${h.n}: what to ask your barber and how to style it`, pathName: '/hairstyles/' + h.id, type: 'article', image: HPHOTOS[h.id], body,
      description: `${h.d} Best for ${h.faces.map(f => FACES[f].n.toLowerCase()).join(', ')} faces. What to tell your barber and how to style it.`.slice(0, 300),
      jsonld: [crumbs(req, [['Home', '/'], ['Hairstyles', '/hairstyles'], [h.n, '/hairstyles/' + h.id]]), {
        '@context': 'https://schema.org', '@type': 'Article', headline: `${h.n}: what to ask your barber and how to style it`, description: h.d,
        image: HPHOTOS[h.id] ? [base(req) + HPHOTOS[h.id]] : undefined, dateModified: dataTime, mainEntityOfPage: base(req) + '/hairstyles/' + h.id,
        author: { '@type': 'Organization', name: NAME, url: base(req) + '/' },
        publisher: { '@type': 'Organization', name: NAME, logo: { '@type': 'ImageObject', url: base(req) + '/icon-512.png' } }
      }]
    }));
  });

  // ---------- about / contact / legal ----------
  const contactLine = () => cfg.CONTACT_EMAIL
    ? `email <a href="mailto:${esc(cfg.CONTACT_EMAIL)}">${esc(cfg.CONTACT_EMAIL)}</a> or use the <a href="/contact">contact form</a>`
    : 'use the <a href="/contact">contact form</a>';
  const textPage = (req, res, p, title, description, inner, extra = {}) => send(res, layout(req, Object.assign({
    title, description, pathName: p,
    body: `${crumbNav([['Home', '/'], [title, p]])}<article class="prose">${inner}</article>`,
    jsonld: [crumbs(req, [['Home', '/'], [title, p]])]
  }, extra)));

  app.get('/about', (req, res) => textPage(req, res, '/about', 'About us',
    `${NAME} is a free style guide for Indian men: outfits for every occasion, hairstyles for every face shape, a style quiz and a Dressing Room.`, `
<span class="eyebrow">About</span><h1>About ${esc(NAME)}</h1>
<p class="lede">A free, practical style guide for men who wear everything from a sherwani to a sharp navy suit, and want the haircut to match.</p>
<h2>What you’ll find here</h2>
<ul>
<li><a href="/looks">The Lookbook</a>: ${visible().length} ethnic, fusion and western looks, each broken down into the pieces, footwear, accessories, colours and a stylist tip.</li>
<li><a href="/occasions">The Occasion Guide</a>: what to wear (and what to skip) for weddings, festivals, pooja, the office, interviews, date nights, travel and more.</li>
<li><a href="/hairstyles">Hairstyles &amp; grooming</a>: ${HAIR.length} haircuts with exactly what to tell your barber, a face-shape finder, and ${BEARDS.length} beard styles.</li>
<li><a href="/#quiz">The Style Quiz</a>: answer four questions and get looks picked for you.</li>
<li><a href="/#studio">The Dressing Room</a>: change colours, prints, jackets, shoes, accessories, hairstyle, beard, skin tone and body type on the model, then save or download your look.</li>
</ul>
<h2>About the images</h2>
<p>The looks are shown with illustrations drawn by the site and, where available, AI-generated photos of a model. They are not photos of products for sale, and colours and details may differ from real garments. Dressing Room edits happen in your browser.</p>
<h2>Free accounts</h2>
<p>You can use everything without an account. A free account keeps your saved looks, hairstyles, Dressing Room outfits and style profile in sync across your devices, and gives you looks and haircuts picked for you. See our <a href="/privacy">privacy policy</a> for what we store.</p>
<h2>Get in touch</h2>
<p>Ideas, corrections or a look you’d like to see? Please ${contactLine()}.</p>`));

  function contactPage(req, res, { sent = false, error = '', values = {} } = {}) {
    const inner = sent ? `<span class="eyebrow">Contact</span><h1>Thank you!</h1>
<p class="lede">Your message has been sent. We read every message and reply by email when a reply is needed.</p>
<p><a class="btn alt" href="/">Back to the guide</a></p>` : `<span class="eyebrow">Contact</span><h1>Get in touch</h1>
<p class="lede">Questions, ideas, a correction or a privacy request? Send us a message${cfg.CONTACT_EMAIL ? ` or email <a href="mailto:${esc(cfg.CONTACT_EMAIL)}">${esc(cfg.CONTACT_EMAIL)}</a>` : ''}.</p>
${error ? `<div class="notice" role="alert">${esc(error)}</div>` : ''}
<form class="cform" method="post" action="/contact">
  <label>Your name<input name="name" required maxlength="80" autocomplete="name" value="${esc(values.name)}"></label>
  <label>Email<input name="email" type="email" required maxlength="200" autocomplete="email" value="${esc(values.email)}"></label>
  <label>Subject<select name="topic">${['General question', 'Style idea or look request', 'Account help', 'Privacy or data request', 'Report a problem'].map(t => `<option${values.topic === t ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
  <label>Message<textarea name="message" required minlength="10" maxlength="4000" rows="6">${esc(values.message)}</textarea></label>
  <label class="hp" aria-hidden="true">Leave this empty<input name="website" tabindex="-1" autocomplete="off"></label>
  <button class="btn alt" type="submit">Send message</button>
  <p class="small">We use your details only to reply to you. See our <a href="/privacy">privacy policy</a>.</p>
</form>`;
    send(res, layout(req, {
      title: 'Contact us', pathName: '/contact', description: `Contact ${NAME}: questions, style ideas, account help or privacy requests.`,
      body: `${crumbNav([['Home', '/'], ['Contact', '/contact']])}<article class="prose">${inner}</article>`, noindex: sent,
      jsonld: [crumbs(req, [['Home', '/'], ['Contact', '/contact']])]
    }), error ? 400 : 200);
  }
  app.get('/contact', (req, res) => contactPage(req, res));
  app.post('/contact', opts.contactLimiter, async (req, res) => {
    const b = req.body || {};
    const values = { name: String(b.name || '').trim().slice(0, 80), email: String(b.email || '').trim().toLowerCase().slice(0, 200), topic: String(b.topic || '').slice(0, 60), message: String(b.message || '').trim().slice(0, 4000) };
    if (b.website) return contactPage(req, res, { sent: true }); // bots fill the hidden field
    if (!values.name) return contactPage(req, res, { error: 'Please enter your name.', values });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email)) return contactPage(req, res, { error: 'Please enter a valid email address.', values });
    if (values.message.length < 10) return contactPage(req, res, { error: 'Please write a little more in your message.', values });
    await saveMessage(values, req);
    contactPage(req, res, { sent: true });
  });

  app.get('/privacy', (req, res) => textPage(req, res, '/privacy', 'Privacy policy',
    `How ${NAME} collects, uses and protects your personal data, and the choices you have.`, `
<span class="eyebrow">Legal</span><h1>Privacy policy</h1>
<p class="small">Last updated: ${LEGAL_DATE}</p>
<p>This policy explains what personal data ${esc(NAME)} (“we”, “us”) collects when you use this website, why, and the choices you have. We have tried to keep it short and plain. We follow India’s Digital Personal Data Protection Act, 2023 and respect equivalent rights under laws such as the GDPR for visitors from elsewhere.</p>

<h2>The short version</h2>
<ul>
<li>You can browse the whole guide without an account and without giving us any personal data.</li>
<li>If you create an account we store your name, email, a scrambled (hashed) password, and the looks and style preferences you save.</li>
<li>We don’t sell your data, show ads, or use advertising or analytics trackers.</li>
<li>You can delete your account and everything in it at any time from <b>My account</b>.</li>
</ul>

<h2>What we collect</h2>
<h3>When you just browse</h3>
<ul>
<li><b>Saved items on your device.</b> Hearts and Dressing Room looks you save without an account are kept in your own browser (local storage). They never reach our server unless you sign in.</li>
<li><b>Server logs.</b> Like nearly every website, our server records technical details of each request (IP address, date and time, page requested, browser type). We use these only to keep the site secure and working, and they are deleted automatically within 30 days.</li>
</ul>
<h3>When you create an account</h3>
<ul>
<li><b>Account details:</b> your name, email address and password. The password is stored only as a secure hash, so we can’t see it.</li>
<li><b>What you save:</b> your hearted looks, Dressing Room looks (including a small preview image), and the style profile you choose (style, body type, face shape, hair type and occasions).</li>
<li><b>Activity dates:</b> the date you joined and the date you were last active.</li>
</ul>
<h3>When you contact us</h3>
<p>Your name, email address and message, so we can reply.</p>

<h2>Why we use it</h2>
<ul>
<li>To run your account: signing you in, syncing your saved looks across devices and picking looks for your style profile (based on your consent when you sign up).</li>
<li>To send emails you ask for, such as password-reset links, and to answer your messages.</li>
<li>To keep the site secure, prevent abuse, and fix problems (our legitimate interest in running a safe service).</li>
<li>To understand, in aggregate, which looks members save most, so we can improve the guide. Site admins can see member names, emails, join and last-active dates, and saved looks for this purpose and to help with account problems.</li>
</ul>
<p>We don’t send marketing emails, and we never sell or rent personal data.</p>

<h2>Cookies and local storage</h2>
<p>We use one cookie, <code>sg_session</code>, which keeps you signed in. It is strictly necessary, so it doesn’t need consent. It lasts up to 60 days, or until you sign out. We also use your browser’s local storage to remember your hearts, saved looks and preferences on your device. We don’t use advertising, tracking or analytics cookies.</p>

<h2>Who else handles your data</h2>
<ul>
<li><b>Hosting:</b> the site and its database run on a virtual private server provided by Hostinger.</li>
<li><b>Email:</b> if email is enabled, password-reset and reply emails are sent through our email provider.</li>
<li><b>Fonts:</b> the site loads its fonts from Google Fonts, which means your browser connects to Google’s servers and shares your IP address with Google. See <a href="https://policies.google.com/privacy" rel="noopener">Google’s privacy policy</a>.</li>
</ul>
<p>We may disclose data if the law requires it. Our providers may store data outside India, with protections required by applicable law.</p>

<h2>How long we keep it</h2>
<ul>
<li>Account data: until you delete your account, or an admin removes it. Deleted accounts are removed from our database straight away and disappear from backups within 14 days.</li>
<li>Password-reset links: they expire after 60 minutes (24 hours for links an admin creates) and are deleted.</li>
<li>Contact messages: up to 12 months, or less once dealt with.</li>
<li>Server logs: up to 30 days.</li>
</ul>

<h2>Security</h2>
<p>Connections are encrypted with HTTPS. Passwords are hashed with scrypt, sign-in attempts are rate-limited, session cookies are HTTP-only and secure, and only admins can see member data. No system is perfectly secure, so please use a unique password for this site.</p>

<h2>Your rights and choices</h2>
<ul>
<li><b>See and correct:</b> view and edit your name, style profile and saved looks in <b>My account</b>, or ask us for a copy of your data.</li>
<li><b>Delete:</b> use <b>Delete my account</b> in <b>My account</b>, or ask us to do it.</li>
<li><b>Withdraw consent:</b> deleting your account withdraws your consent for us to process your account data.</li>
<li><b>Complain:</b> contact our grievance contact below first. If you’re not satisfied, you may complain to the Data Protection Board of India or your local data protection authority.</li>
</ul>
<p>To make a request, ${contactLine()} (choose “Privacy or data request”). We reply within 30 days.</p>

<h2>Children</h2>
<p>Accounts are for people aged 18 and over. We don’t knowingly collect personal data from children. If you believe a child has created an account, contact us and we will delete it.</p>

<h2>Changes to this policy</h2>
<p>If we make important changes, we’ll update the date above and, where appropriate, show a notice on the site.</p>

<h2>Contact and grievance officer</h2>
<p>For any privacy question or complaint, ${contactLine()}.</p>`,
    { type: 'website' }));

  app.get('/terms', (req, res) => textPage(req, res, '/terms', 'Terms of use',
    `The terms for using ${NAME}, including accounts, acceptable use and the images on the site.`, `
<span class="eyebrow">Legal</span><h1>Terms of use</h1>
<p class="small">Last updated: ${LEGAL_DATE}</p>
<p>These terms apply when you use ${esc(NAME)} (the “site”). By using the site you agree to them. If you don’t agree, please don’t use the site.</p>

<h2>1. What the site is</h2>
<p>The site is a free style guide offering outfit ideas, occasion advice, a style quiz, colour combinations and a Dressing Room tool. It is for personal, non-commercial inspiration. We don’t sell clothing, and nothing on the site is professional, medical or cultural-religious advice. Customs differ between families, communities and places of worship, so check with hosts or organisers when in doubt.</p>

<h2>2. Accounts</h2>
<ul>
<li>You must be 18 or older to create an account.</li>
<li>Give accurate details, keep your password private, and tell us if you think someone else has used your account.</li>
<li>You are responsible for activity on your account.</li>
<li>You can delete your account at any time from <b>My account</b>. We may suspend or delete accounts that break these terms, or that have been inactive for a long time.</li>
</ul>

<h2>3. Acceptable use</h2>
<p>Please don’t:</p>
<ul>
<li>break the law, or use the site to harass, impersonate or harm anyone;</li>
<li>try to get into other people’s accounts or our systems, or interfere with the site’s security or performance;</li>
<li>scrape, copy or republish the site’s content or images in bulk, or use automated tools that put unreasonable load on the site;</li>
<li>send spam or harmful content through the contact form.</li>
</ul>

<h2>4. Images and content</h2>
<ul>
<li>Looks are shown with <b>illustrations</b> and, where available, <b>AI-generated photos</b> of a model. They do not show real products for sale, and colours, fabrics and details may differ from real garments.</li>
<li>The site’s text, images, design and code belong to us or our licensors. You may save, share links to, and print looks for your own personal use. Any other use needs our written permission.</li>
<li>Looks you create in the Dressing Room are yours to keep for personal use. By saving them to your account you let us store them so we can show them back to you.</li>
<li>The Dressing Room can produce a text prompt you may copy into third-party AI tools. Your use of those tools is governed by their own terms.</li>
</ul>

<h2>5. Availability</h2>
<p>We provide the site free of charge and “as is”. We work to keep it running and accurate, but we don’t promise it will always be available, error-free, or that saved data can never be lost. Keep your own copies of anything important.</p>

<h2>6. Liability</h2>
<p>To the extent the law allows, we are not liable for indirect or consequential losses, or for losses caused by relying on the site’s styling suggestions. Nothing in these terms limits liability that cannot be limited by law.</p>

<h2>7. Links</h2>
<p>The site may link to other websites. We are not responsible for their content or practices.</p>

<h2>8. Privacy</h2>
<p>Our <a href="/privacy">privacy policy</a> explains how we handle personal data.</p>

<h2>9. Changes</h2>
<p>We may update these terms. We’ll change the date above, and for important changes we’ll show a notice on the site. Continuing to use the site after a change means you accept the new terms.</p>

<h2>10. Law</h2>
<p>These terms are governed by the laws of India, and the courts of India have jurisdiction over any dispute, without affecting any mandatory consumer rights you have where you live.</p>

<h2>11. Contact</h2>
<p>Questions about these terms? Please ${contactLine()}.</p>`));

  // ---------- robots, sitemap, manifest ----------
  app.get('/robots.txt', (req, res) => {
    res.type('text/plain').set('Cache-Control', 'public, max-age=3600').send(
      `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /*?reset=\n\nSitemap: ${base(req)}/sitemap.xml\n`);
  });
  app.get('/sitemap.xml', (req, res) => {
    const b = base(req);
    const u = (p, lastmod, pri, imgs = []) => `<url><loc>${esc(b + p)}</loc><lastmod>${lastmod}</lastmod><priority>${pri}</priority>${imgs.map(([src, t]) => `<image:image><image:loc>${esc(b + src)}</image:loc><image:title>${esc(t)}</image:title></image:image>`).join('')}</url>`;
    const V = visible();
    const urls = [
      u('/', dataTime, '1.0', V.slice(0, 8).map(o => [PHOTOS[o.id], o.n])),
      u('/looks', dataTime, '0.9'),
      ...V.map(o => u('/looks/' + o.id, dataTime, '0.8', [[PHOTOS[o.id], o.n]])),
      u('/occasions', dataTime, '0.9'),
      ...Object.keys(OCC).map(k => u('/occasions/' + k, dataTime, '0.8')),
      u('/hairstyles', dataTime, '0.9'),
      ...HAIR.map(h => u('/hairstyles/' + h.id, dataTime, '0.8', HPHOTOS[h.id] ? [[HPHOTOS[h.id], h.n + ' hairstyle']] : [])),
      u('/about', LEGAL_ISO, '0.5'), u('/contact', LEGAL_ISO, '0.4'),
      u('/privacy', LEGAL_ISO, '0.3'), u('/terms', LEGAL_ISO, '0.3')
    ];
    res.type('application/xml').set('Cache-Control', 'public, max-age=3600').send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.join('\n')}\n</urlset>\n`);
  });
  app.get('/site.webmanifest', (req, res) => {
    res.type('application/manifest+json').set('Cache-Control', 'public, max-age=86400').send(JSON.stringify({
      name: NAME, short_name: NAME.replace(/^The /, '').slice(0, 20), start_url: '/', display: 'standalone',
      background_color: '#FFF4F8', theme_color: '#D6246E',
      icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }, { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }]
    }));
  });

  // ---------- 404 ----------
  return function notFound(req, res) {
    send(res, layout(req, {
      title: 'Page not found', pathName: req.path, description: 'This page doesn’t exist.', noindex: true,
      body: `<article class="prose nf"><span class="eyebrow">Error 404</span><h1>This page has <em>wandered off</em></h1>
<p class="lede">The page you’re looking for doesn’t exist or has moved. Try one of these instead:</p>
<div class="row"><a class="btn alt" href="/">Home</a><a class="btn ghost" href="/looks">All looks</a><a class="btn ghost" href="/occasions">Occasions</a></div></article>`
    }), 404);
  };
};
module.exports.data = { OCC, L, PHOTOS, HAIR };
