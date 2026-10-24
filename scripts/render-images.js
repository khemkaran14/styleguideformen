// Builds the site's images and public/assets/js/photos.js.
//
//   node scripts/render-images.js                 draw illustrations for any look/hairstyle/beard that lacks one
//   node scripts/render-images.js --force         redraw all illustrations, icons and the share image
//   node scripts/render-images.js --import DIR    import a ChatGPT photo package (a folder or .zip with
//                                                 looks/, hair/, beards/ and optional extras/), resized
//
// Real photos live in public/assets/img/photos/{looks,hair,beards}/<id>.jpg and always win over
// illustrations in public/assets/img/ill/. Needs Playwright (dev only; not needed on the server).
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const PUB = path.join(ROOT, 'public');
const IMG = path.join(PUB, 'assets/img');
const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const IMPORT = args.includes('--import') ? args[args.indexOf('--import') + 1] : null;

const ctx = {};
vm.createContext(ctx);
for (const f of ['data.js', 'engine.js']) vm.runInContext(fs.readFileSync(path.join(PUB, 'assets/js', f), 'utf8'), ctx);
vm.runInContext('globalThis.__d={L,HAIR,BEARDS,SKINS,headSVG,figure};', ctx);
const { L, HAIR, BEARDS, SKINS } = ctx.__d; ctx.headSVG = ctx.__d.headSVG; ctx.figure = ctx.__d.figure;
const SIZE = { looks: [720, 900], hair: [600, 600], beards: [600, 600] };
const mk = d => fs.mkdirSync(d, { recursive: true });
const exists = f => fs.existsSync(f);

function chromium() {
  try { return require('playwright').chromium; } catch (e) {
    console.error('Playwright is needed for this script: npm i -D playwright && npx playwright install chromium');
    process.exit(1);
  }
}

const BG = 'radial-gradient(circle at 50% 38%,#FFFFFF,#ECE6DC 75%)';
const pageFor = (inner, w, h) => `<html><head><style>html,body{margin:0;width:${w}px;height:${h}px;overflow:hidden;background:${BG}}
.c{width:${w}px;height:${h}px;display:grid;place-items:center}.c svg{display:block}</style></head><body><div class="c">${inner}</div></body></html>`;

async function drawIllustrations(page) {
  const jobs = [];
  for (const o of L) jobs.push(['looks', o.id, () => ctx.figure(Object.assign({ label: o.n }, o.fig)).replace('<svg ', '<svg height="880" ')]);
  for (const h of HAIR) jobs.push(['hair', h.id, () => ctx.headSVG({ hair: h.id, bust: true, beard: 'short', skin: SKINS[2], hc: '#1A1210', shirt: '#2E3440' }, 600)]);
  for (const b of BEARDS) jobs.push(['beards', b.id, () => ctx.headSVG({ hair: 'crew', bust: true, beard: b.id, skin: SKINS[2], hc: '#1A1210', shirt: '#2E3440' }, 600)]);
  let n = 0;
  for (const [kind, id, svg] of jobs) {
    const out = path.join(IMG, 'ill', kind, id + '.jpg');
    if (exists(out) && !FORCE) continue;
    mk(path.dirname(out));
    const [w, h] = SIZE[kind];
    await page.setViewportSize({ width: w, height: h });
    await page.setContent(pageFor(svg(), w, h));
    await page.screenshot({ path: out, type: 'jpeg', quality: 86 });
    n++;
  }
  console.log(`Illustrations drawn: ${n}`);
}

async function importPhotos(page, src) {
  let dir = path.resolve(src);
  if (dir.endsWith('.zip')) {
    const tmp = path.join(require('os').tmpdir(), 'sg-import-' + Date.now());
    mk(tmp);
    execFileSync('unzip', ['-q', '-o', dir, '-d', tmp]);
    dir = tmp;
  }
  // find files anywhere inside: <kind>/<id>.<ext>
  const files = [];
  (function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (/\.(jpe?g|png|webp)$/i.test(f)) files.push(p); } })(dir);
  const ids = { looks: new Set(L.map(o => o.id)), hair: new Set(HAIR.map(h => h.id)), beards: new Set(BEARDS.map(b => b.id)) };
  let n = 0; const skipped = [];
  for (const f of files) {
    const kind = path.basename(path.dirname(f)).toLowerCase(), id = path.basename(f).replace(/\.[^.]+$/, '').toLowerCase();
    let out, w, h;
    if (ids[kind] && ids[kind].has(id)) { [w, h] = SIZE[kind].map(x => Math.round(x * 1.5)); out = path.join(IMG, 'photos', kind, id + '.jpg'); }
    else if (kind === 'extras' && (id === 'og' || id === 'hero')) { [w, h] = id === 'og' ? [1200, 630] : [1920, 1080]; out = path.join(IMG, id === 'og' ? 'og.jpg' : 'hero.jpg'); }
    else { skipped.push(path.relative(dir, f)); continue; }
    mk(path.dirname(out));
    const data = fs.readFileSync(f).toString('base64');
    const mime = /png$/i.test(f) ? 'image/png' : /webp$/i.test(f) ? 'image/webp' : 'image/jpeg';
    await page.setViewportSize({ width: w, height: h });
    await page.setContent(`<html><body style="margin:0;width:${w}px;height:${h}px;overflow:hidden;background:#ECEAE6"><img src="data:${mime};base64,${data}" style="width:${w}px;height:${h}px;object-fit:cover;object-position:50% ${kind === 'looks' ? '40%' : '30%'};display:block"></body></html>`);
    await page.waitForFunction(() => document.images[0].complete);
    await page.screenshot({ path: out, type: 'jpeg', quality: 84 });
    n++;
  }
  console.log(`Photos imported: ${n}`);
  if (skipped.length) console.log('Skipped (name not recognised):\n  ' + skipped.join('\n  '));
}

async function drawBrand(page) {
  const og = path.join(IMG, 'og.jpg');
  const icons = ['icon-512.png', 'icon-192.png', 'apple-touch-icon.png', 'favicon.ico'].map(f => path.join(PUB, f));
  if (!FORCE && exists(og) && icons.every(exists)) return;
  const font = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,900;1,9..144,500&family=Manrope:wght@600&family=DM+Mono&display=swap">';
  const icon = s => `<html><head>${font}<style>body{margin:0}div{width:${s}px;height:${s}px;background:linear-gradient(135deg,#17202A,#2B3A4A);display:grid;place-items:center;color:#E2B64B;font-family:Fraunces,Georgia,serif;font-style:italic;font-weight:500;font-size:${s * .7}px;line-height:1;padding-bottom:${s * .05}px;box-sizing:border-box}</style></head><body><div>S</div></body></html>`;
  for (const [s, f] of [[512, 'icon-512.png'], [192, 'icon-192.png'], [180, 'apple-touch-icon.png'], [32, 'fav32.png']]) {
    await page.setViewportSize({ width: s, height: s });
    await page.setContent(icon(s)); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(PUB, f) });
  }
  const png = fs.readFileSync(path.join(PUB, 'fav32.png')); fs.unlinkSync(path.join(PUB, 'fav32.png'));
  const hd = Buffer.alloc(22); hd.writeUInt16LE(0, 0); hd.writeUInt16LE(1, 2); hd.writeUInt16LE(1, 4); hd[6] = 32; hd[7] = 32; hd.writeUInt16LE(1, 10); hd.writeUInt16LE(32, 12); hd.writeUInt32LE(png.length, 14); hd.writeUInt32LE(22, 18);
  fs.writeFileSync(path.join(PUB, 'favicon.ico'), Buffer.concat([hd, png]));
  fs.writeFileSync(path.join(PUB, 'favicon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#17202A"/><text x="32" y="46" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="42" fill="#E2B64B">S</text></svg>`);
  if (exists(path.join(IMG, 'og.jpg')) && !FORCE) return;
  const pick = ['groomsherwani', 'navysuit', 'kurtajeans', 'leatherjacket'].map(id => L.find(o => o.id === id));
  const figs = pick.map(o => `<div class="f">${ctx.figure(Object.assign({}, o.fig))}</div>`).join('');
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.setContent(`<html><head>${font}<style>body{margin:0;width:1200px;height:630px;overflow:hidden;font-family:Manrope;color:#17202A;position:relative;background:radial-gradient(circle at 8% 15%,rgba(185,138,30,.35) 0 16%,transparent 40%),radial-gradient(circle at 50% 110%,rgba(31,111,120,.3) 0 22%,transparent 46%),radial-gradient(circle at 95% 0%,rgba(181,72,42,.3) 0 20%,transparent 46%),#ECE6DC}
  .t{position:absolute;left:64px;top:76px;width:520px}.e{font-family:'DM Mono';letter-spacing:.14em;text-transform:uppercase;font-size:17px;color:#5E6670}
  h1{font-family:Fraunces;font-weight:900;font-size:92px;line-height:.92;margin:16px 0 0;letter-spacing:-2px}h1 i{display:block;font-weight:500;font-size:42px;color:#B5482A;letter-spacing:0}
  h1 span{background:linear-gradient(90deg,#B5482A,#B98A1E 55%,#1F6F78);-webkit-background-clip:text;color:transparent}h1 em{display:block;font-weight:500;font-size:40px;color:#5E6670;letter-spacing:0}
  p{font-size:23px;font-weight:600;margin:22px 0 0;color:#3E4650;max-width:470px}.figs{position:absolute;right:20px;bottom:-6px;display:flex;align-items:flex-end}.f{width:150px;margin-left:-14px}.f svg{width:150px;height:300px;display:block}</style></head>
  <body><div class="t"><div class="e">Ethnic · Fusion · Western · Grooming</div><h1><i>The</i><span>Ultimate</span><br>Style Guide<em>for men</em></h1><p>Outfits for every occasion and the haircut that suits your face.</p></div><div class="figs">${figs}</div></body></html>`);
  await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(400);
  await page.screenshot({ path: og, type: 'jpeg', quality: 86 });
}

function writeManifest() {
  const P = { looks: {}, hair: {}, beards: {}, real: [] };
  const lists = { looks: L, hair: HAIR, beards: BEARDS };
  for (const kind of Object.keys(lists)) for (const x of lists[kind]) {
    const photo = path.join(IMG, 'photos', kind, x.id + '.jpg'), ill = path.join(IMG, 'ill', kind, x.id + '.jpg');
    const f = exists(photo) ? photo : exists(ill) ? ill : null;
    if (!f) continue;
    const v = Math.round(fs.statSync(f).mtimeMs / 1000).toString(36);
    P[kind][x.id] = '/' + path.relative(PUB, f).split(path.sep).join('/') + '?v=' + v;
    if (f === photo) P.real.push(kind + '/' + x.id);
  }
  fs.writeFileSync(path.join(PUB, 'assets/js/photos.js'), '/* generated by scripts/render-images.js */\nconst PHOTOS=' + JSON.stringify(P) + ';\n');
  console.log(`photos.js: ${P.real.length} real photos, ${Object.keys(P.looks).length + Object.keys(P.hair).length + Object.keys(P.beards).length - P.real.length} illustrations`);
}

(async () => {
  const browser = await chromium().launch();
  const page = await browser.newPage();
  if (IMPORT) await importPhotos(page, IMPORT);
  await drawIllustrations(page);
  await drawBrand(page);
  await browser.close();
  writeManifest();
})();
