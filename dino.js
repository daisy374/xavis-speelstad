"use strict";
/* Xavi's Dino-opgraving — zand wegvegen, botten tellen, het skelet leggen en de dino tot leven wekken.
   Deel 1 van de dinospellen (race en vulkaan volgen). */

const DKEY = "xavi-dino-v1";
const BF = "#F3ECDC", BS2 = `stroke="${INK}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"`;

/* ---------- botten (middelpunt op 0,0) ---------- */
const rib = (x, k) => `<path d="M${x} -30 q${k * 16} 30 ${k * 7} 56" fill="none" stroke="${INK}" stroke-width="13" stroke-linecap="round"/>
  <path d="M${x} -30 q${k * 16} 30 ${k * 7} 56" fill="none" stroke="${BF}" stroke-width="7" stroke-linecap="round"/>`;
const wervel = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${BF}" ${BS2}/>`;
const BOT = {
  rug: `<rect x="-70" y="-8" width="140" height="16" rx="8" fill="${BF}" ${BS2}/>
    ${[-54, -27, 0, 27, 54].map(x => `<rect x="${x - 5}" y="-22" width="10" height="16" rx="5" fill="${BF}" ${BS2}/>`).join("")}`,
  ribben: `<rect x="-52" y="-36" width="104" height="13" rx="6.5" fill="${BF}" ${BS2}/>
    ${[[-38, -1], [-18, -1], [18, 1], [38, 1]].map(([x, k]) => rib(x, k)).join("")}`,
  nek: `${[[-40, 16], [-16, 4], [8, -6], [32, -14]].map(([x, y], i) => wervel(x, y, 15 - i)).join("")}
    <path d="M-40 16 L32 -14" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>
    ${[[-40, 16], [-16, 4], [8, -6], [32, -14]].map(([x, y], i) => wervel(x, y, 15 - i)).join("")}`,
  poota: `<path d="M-14 -40 q16 -8 26 4 l8 34 q2 10 -6 16 l-4 26 q-1 8 -10 8 q-9 0 -10 -8 l-2 -22 q-16 -6 -14 -22 l6 -30 q2 -8 6 -6z" fill="${BF}" ${BS2}/>
    <path d="M-2 46 h30 q8 0 8 6 q0 6 -8 6 h-34z" fill="${BF}" ${BS2}/>`,
  pootv: `<path d="M-8 -30 q12 -6 18 4 l6 24 q2 8 -6 12 l-4 20 q-1 7 -8 7 q-7 0 -8 -7 l-2 -18 q-12 -4 -10 -16 l5 -22 q1 -6 9 -4z" fill="${BF}" ${BS2}/>
    <path d="M-2 34 h22 q7 0 7 5 q0 5 -7 5 h-26z" fill="${BF}" ${BS2}/>`
};
const KOP = {
  trex: `<path d="M64 -4 q10 4 10 12 q0 10 -14 12 l-52 6 q-30 2 -42 -10 q-12 -12 -8 -30 q4 -18 24 -22 l50 -8 q18 -2 24 12 q4 10 -2 18z" fill="${BF}" ${BS2}/>
    <circle cx="-26" cy="-18" r="7" fill="${INK}"/><path d="M14 -30 q14 2 20 10" fill="none" stroke="${INK}" stroke-width="3"/>
    ${[18, 30, 42, 54].map(x => `<path d="M${x} 18 l4 12 l5 -12z" fill="#fff" ${TH}/>`).join("")}`,
  raptor: `<path d="M62 2 q8 4 6 10 q-2 8 -14 8 l-42 2 q-26 0 -36 -10 q-10 -10 -6 -24 q4 -14 20 -18 l42 -8 q16 -2 20 10 q3 10 -4 16z" fill="${BF}" ${BS2}/>
    <circle cx="-22" cy="-14" r="6" fill="${INK}"/>${[20, 32, 44].map(x => `<path d="M${x} 16 l3 10 l4 -10z" fill="#fff" ${TH}/>`).join("")}`,
  trice: `<path d="M-44 -46 q-34 6 -34 46 q0 40 34 46 q6 -30 6 -46 q0 -16 -6 -46z" fill="${BF}" ${BS2}/>
    ${[-44, -16, 14, 44].map(a => `<circle cx="${-64 + Math.cos(a / 40) * 6}" cy="${a}" r="6" fill="${BF}" ${BS2}/>`).join("")}
    <path d="M-40 -34 q44 -6 62 14 l22 26 q6 8 -2 14 l-26 16 q-14 8 -30 0 q-26 -12 -26 -36z" fill="${BF}" ${BS2}/>
    <path d="M-6 -36 l10 -34 q2 -8 8 -6 q6 2 4 10z" fill="${BF}" ${BS2}/>
    <path d="M26 -24 l12 -30 q3 -8 9 -5 q6 3 3 10z" fill="${BF}" ${BS2}/>
    <circle cx="6" cy="-6" r="6" fill="${INK}"/><path d="M54 30 q14 4 16 14 q-12 6 -22 0z" fill="${BF}" ${BS2}/>`,
  stego: `<path d="M56 2 q8 3 7 9 q-2 7 -13 7 l-40 2 q-22 0 -30 -8 q-8 -9 -5 -20 q4 -12 18 -15 l38 -7 q14 -2 17 8 q2 8 -3 13z" fill="${BF}" ${BS2}/>
    <circle cx="-16" cy="-10" r="5.5" fill="${INK}"/>`,
  brachio: `<path d="M50 -2 q8 3 7 9 q-2 7 -13 7 l-34 2 q-22 0 -29 -9 q-7 -9 -3 -19 q5 -12 18 -14 l32 -6 q13 -2 16 7 q2 8 -3 12z" fill="${BF}" ${BS2}/>
    <path d="M-2 -22 q10 -12 22 -2 q-8 6 -22 2z" fill="${BF}" ${BS2}/><circle cx="-12" cy="-8" r="5.5" fill="${INK}"/>`
};
const STAART = {
  gewoon: `${[-58, -34, -12, 10, 30, 48, 64].map((x, i) => wervel(x, i * 2 - 4, 15 - i * 1.8)).join("")}
    <path d="M-58 -4 L64 10" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
    ${[-58, -34, -12, 10, 30, 48, 64].map((x, i) => wervel(x, i * 2 - 4, 15 - i * 1.8)).join("")}`,
  stekels: `${[-58, -34, -12, 10, 30, 48].map((x, i) => wervel(x, i * 2 - 4, 15 - i * 1.6)).join("")}
    <path d="M-58 -4 L48 6" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
    ${[-58, -34, -12, 10, 30, 48].map((x, i) => wervel(x, i * 2 - 4, 15 - i * 1.6)).join("")}
    ${[[52, -14], [60, 4], [44, -22], [64, 16]].map(([x, y]) => `<path d="M${x} ${y} l26 -12 l-18 20z" fill="${BF}" ${BS2}/>`).join("")}`,
  lang: `${[-70, -46, -22, 2, 24, 44, 62, 78].map((x, i) => wervel(x, i * 1.5 - 4, 14 - i * 1.5)).join("")}
    <path d="M-70 -4 L78 8" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
    ${[-70, -46, -22, 2, 24, 44, 62, 78].map((x, i) => wervel(x, i * 1.5 - 4, 14 - i * 1.5)).join("")}`
};
const botSVG = (d, id) => id === "kop" ? KOP[d.kop] : id === "staart" ? STAART[d.staart] : BOT[id];
/* plek + draai van een bot; f = gespiegeld (de koppen zijn naar rechts getekend, de dino kijkt naar links) */
const pT = (p, extraS, r) => `translate(${p.x} ${p.y}) rotate(${r === undefined ? p.r : r}) scale(${(p.s || 1) * (extraS || 1) * (p.f ? -1 : 1)} ${(p.s || 1) * (extraS || 1)})`;

/* ---------- de dino's ---------- */
const DINO = {
  trex: {
    naam: "trex", kleur: "#6FA84B", buik: "#C5E1A5", eet: "vlees", kop: "trex", staart: "gewoon",
    delen: [{ id: "rug", x: 10, y: -14, r: -8 }, { id: "ribben", x: -14, y: 10, r: -8 }, { id: "nek", x: -66, y: -44, r: -32 },
      { id: "kop", x: -96, y: -86, r: -10, f: true }, { id: "staart", x: 96, y: 4, r: 10 }, { id: "poota", x: 18, y: 40, r: 0 }, { id: "pootv", x: -46, y: 6, r: 24, s: .8 }]
  },
  raptor: {
    naam: "raptor", kleur: "#E08A3C", buik: "#FFD9A6", eet: "vlees", kop: "raptor", staart: "lang",
    delen: [{ id: "rug", x: 6, y: -10, r: -6, s: .85 }, { id: "ribben", x: -14, y: 10, r: -6, s: .85 }, { id: "nek", x: -58, y: -34, r: -30, s: .85 },
      { id: "kop", x: -84, y: -68, r: -8, s: .9, f: true }, { id: "staart", x: 86, y: 2, r: 8, s: .9 }, { id: "poota", x: 14, y: 36, r: 0, s: .9 }, { id: "pootv", x: -42, y: 4, r: 26, s: .7 }]
  },
  trice: {
    naam: "trice", kleur: "#8D9BD8", buik: "#D6DCF6", eet: "blad", kop: "trice", staart: "gewoon",
    delen: [{ id: "rug", x: 10, y: -20, r: 0 }, { id: "ribben", x: -6, y: 6, r: 0 }, { id: "nek", x: -64, y: -14, r: -8 },
      { id: "kop", x: -88, y: -20, r: 0, f: true }, { id: "staart", x: 92, y: -6, r: 6, s: .8 }, { id: "poota", x: 36, y: 34, r: 0 }, { id: "pootv", x: -40, y: 32, r: 0 }]
  },
  stego: {
    naam: "stego", kleur: "#5FB3A1", buik: "#B2DFDB", eet: "blad", kop: "stego", staart: "stekels",
    delen: [{ id: "rug", x: 6, y: -26, r: 0 }, { id: "ribben", x: -8, y: 4, r: 0 }, { id: "nek", x: -66, y: -6, r: -14 },
      { id: "kop", x: -104, y: -14, r: -4, f: true }, { id: "staart", x: 92, y: -14, r: -8 }, { id: "poota", x: 34, y: 34, r: 0 }, { id: "pootv", x: -42, y: 34, r: 0, s: .9 }]
  },
  brachio: {
    naam: "brachio", kleur: "#B07FD0", buik: "#E1BEE7", eet: "blad", kop: "brachio", staart: "lang",
    delen: [{ id: "rug", x: 14, y: -18, r: -4 }, { id: "ribben", x: -6, y: 8, r: -4 }, { id: "nek", x: -78, y: -76, r: -56, s: 1.3 },
      { id: "kop", x: -92, y: -132, r: -28, s: .9, f: true }, { id: "staart", x: 98, y: -4, r: 8 }, { id: "poota", x: 36, y: 36, r: 0 }, { id: "pootv", x: -46, y: 34, r: 0 }]
  }
};
const DSOORT = ["trex", "trice", "stego", "brachio", "raptor"];
/* de levende dino (onderkant-midden op 0,0) */
function dinoLevend(k) {
  const d = DINO[k], c = d.kleur, b = d.buik;
  const poot = (x, w, h) => `<path d="M${x - w / 2} ${-h} h${w} v${h - 6} q0 6 -${w / 2} 6 q-${w / 2} 0 -${w / 2} -6z" fill="${c}" ${ST}/>`;
  if (k === "brachio") return `<g>${poot(-34, 26, 74)}${poot(34, 26, 70)}
    <ellipse cx="0" cy="-92" rx="62" ry="42" fill="${c}" ${ST}/><ellipse cx="6" cy="-78" rx="40" ry="22" fill="${b}"/>
    <path d="M-40 -110 q-28 -60 -6 -100 q10 -18 26 -8 q14 10 4 26 q-16 26 -4 70z" fill="${c}" ${ST}/>
    <ellipse cx="-30" cy="-214" rx="26" ry="18" fill="${c}" ${ST}/><circle cx="-40" cy="-220" r="4" fill="${INK}"/>
    <path d="M54 -104 q56 -18 84 12 q-40 10 -84 16z" fill="${c}" ${ST}/></g>`;
  if (k === "trice") return `<g>${poot(-40, 28, 56)}${poot(38, 28, 56)}
    <ellipse cx="0" cy="-70" rx="70" ry="42" fill="${c}" ${ST}/><ellipse cx="6" cy="-58" rx="46" ry="24" fill="${b}"/>
    <path d="M62 -84 q54 -14 78 14 q-38 10 -78 14z" fill="${c}" ${ST}/>
    <path d="M-58 -118 q-44 8 -44 48 q0 40 44 48 q10 -46 10 -48 q0 -6 -10 -48z" fill="${b}" ${ST}/>
    <ellipse cx="-88" cy="-70" rx="34" ry="30" fill="${c}" ${ST}/>
    <path d="M-104 -94 l-8 -34 q-2 -10 6 -12 q8 -2 10 8z" fill="#fff" ${TH}/>
    <path d="M-76 -96 l-4 -34 q-1 -10 7 -11 q8 -1 9 9z" fill="#fff" ${TH}/>
    <circle cx="-96" cy="-76" r="5" fill="${INK}"/><path d="M-118 -62 q-8 6 0 12 q10 4 14 -4z" fill="${b}" ${ST}/></g>`;
  if (k === "stego") return `<g>${poot(-40, 26, 50)}${poot(38, 26, 52)}
    <ellipse cx="0" cy="-70" rx="68" ry="40" fill="${c}" ${ST}/><ellipse cx="4" cy="-58" rx="44" ry="22" fill="${b}"/>
    <path d="M60 -80 q58 -12 84 18 q-44 12 -84 12z" fill="${c}" ${ST}/>
    ${[[100, -92], [116, -76]].map(([x, y]) => `<path d="M${x} ${y} l22 -10 l-14 18z" fill="#FFB74D" ${TH}/>`).join("")}
    ${[[-34, -108], [-4, -116], [26, -110], [52, -98]].map(([x, y], i) => `<path d="M${x} ${y + 10} q${i % 2 ? 4 : -4} -26 14 -30 q12 6 10 30z" fill="#FFB74D" ${TH}/>`).join("")}
    <path d="M-62 -84 q-32 -4 -42 14 q-6 12 6 18 q20 8 40 -4z" fill="${c}" ${ST}/>
    <circle cx="-88" cy="-70" r="5" fill="${INK}"/></g>`;
  const klein = k === "raptor" ? .85 : 1;
  return `<g transform="scale(${klein})">${poot(-16, 30, 70)}${poot(20, 30, 74)}
    <path d="M56 -96 q70 -6 104 40 q-56 4 -104 18z" fill="${c}" ${ST}/>
    <ellipse cx="0" cy="-96" rx="62" ry="46" fill="${c}" ${ST}/><ellipse cx="4" cy="-82" rx="40" ry="26" fill="${b}"/>
    <path d="M-34 -128 q-24 -26 -6 -46 q14 -16 28 -2 q10 12 0 26z" fill="${c}" ${ST}/>
    <path d="M-88 -178 q24 -14 44 -4 q16 8 14 22 q-2 14 -22 16 l-40 4 q-16 2 -18 -12 q-2 -16 22 -26z" fill="${c}" ${ST}/>
    <path d="M-104 -152 l58 -6 q8 -1 8 6 q0 7 -8 8 l-56 4z" fill="${b}" ${ST}/>
    ${[-92, -76, -60].map(x => `<path d="M${x} -146 l4 10 l6 -10z" fill="#fff" ${TH}/>`).join("")}
    <circle cx="-56" cy="-176" r="5" fill="${INK}"/>
    <path d="M-30 -110 q-16 4 -18 18 q10 6 18 -2z" fill="${c}" ${ST}/></g>`;
}

/* ---------- toestand ---------- */
let DS = null, DV = null;
function dLoad() {
  try { DS = JSON.parse(localStorage.getItem(DKEY)); } catch (e) { DS = null; }
  if (!DS || DS.v !== 1) DS = { v: 1, gevonden: {}, done: 0, stars: 0 };
}
function dSave() { try { localStorage.setItem(DKEY, JSON.stringify(DS)); } catch (e) {} }
function dview(name, html) {
  DV.tok++; DV.view = name;
  if (DV.upH) { window.removeEventListener("pointerup", DV.upH); DV.upH = null; }
  const el = $("#dino");
  el.innerHTML = html;
  return el;
}
function dLater(fn, ms) { const tok = DV && DV.tok; return setTimeout(() => { if (DV && DV.tok === tok) fn(); }, ms); }
function dAnim(dur, fn, done) {
  const tok = DV && DV.tok, t0 = performance.now();
  const step = now => {
    if (!DV || DV.tok !== tok) return;
    const t = Math.min(1, (now - t0) / dur);
    fn(t);
    if (t < 1) requestAnimationFrame(step); else if (done) done();
  };
  requestAnimationFrame(step);
}
function dsay(name, cb) { const tok = DV && DV.tok; say(name, cut => { if (cut || !DV || DV.tok !== tok) return; if (cb) cb(); }); }
function dinoOpen() {
  unlockAudio(); dLoad();
  show("dino");
  DV = { tok: 0 };
  dNieuweKuil();
}
function dinoStop() { if (!DV) return; DV.tok++; if (DV.upH) window.removeEventListener("pointerup", DV.upH); DV = null; if (DS) dSave(); }

/* ---------- een nieuwe kuil ---------- */
function dNieuweKuil() {
  const nog = DSOORT.filter(s => !DS.gevonden[s]);
  const soort = nog.length ? pick(nog) : pick(DSOORT);
  const lvl = DS.done < 2 ? 0 : DS.done < 5 ? 1 : 2;
  const d = DINO[soort];
  const delen = d.delen.map((p, i) => ({ ...p, i }));
  const plek = [[122, 150], [250, 142], [378, 150], [500, 146], [170, 248], [320, 252], [462, 248]].sort(() => Math.random() - .5);
  delen.forEach((p, i) => {
    p.zx = plek[i][0]; p.zy = plek[i][1];
    p.zr = lvl === 0 ? p.r : lvl === 1 ? p.r + rnd(-40, 40) : rnd(-180, 180);
    p.uit = false; p.vast = false;
  });
  DV.kuil = { soort, lvl, delen, gevonden: 0 };
  dGraven();
}
/* ---------- deel 1: zand wegvegen ---------- */
const ZAND = { x: 40, y: 90, cols: 12, rows: 5, w: 49, h: 42 };
function dGraven() {
  const k = DV.kuil, d = DINO[k.soort];
  const el = dview("graven", `
    <svg viewBox="0 0 ${W} ${H}" id="dsvg">
      <rect width="${W}" height="${H}" fill="#8CC8EE"/>
      <rect y="70" width="${W}" height="${H - 70}" fill="#C8A26A"/>
      <circle cx="600" cy="44" r="26" fill="#FFD600" ${ST}/>
      ${[40, 200, 520].map((x, i) => `<path d="M${x} 78 q26 -${30 + i * 8} 54 0z" fill="#9E7B4F"/>`).join("")}
      <g id="dbot">${k.delen.map(p => `<g class="dbot" data-i="${p.i}" transform="translate(${p.zx} ${p.zy}) rotate(${p.zr}) scale(${(p.s || 1) * .7 * (p.f ? -1 : 1)} ${(p.s || 1) * .7})">${botSVG(d, p.id)}</g>`).join("")}</g>
      <g id="dzand">${Array.from({ length: ZAND.cols * ZAND.rows }, (_, i) => {
        const cx = ZAND.x + (i % ZAND.cols) * ZAND.w, cy = ZAND.y + Math.floor(i / ZAND.cols) * ZAND.h;
        return `<g class="dtegel" data-i="${i}"><rect x="${cx}" y="${cy}" width="${ZAND.w}" height="${ZAND.h}" fill="${i % 2 ? "#D9B57C" : "#D2AB70"}"/>
          ${[7, 19, 31, 41].map((o, j) => `<circle cx="${cx + (o * 3 + i * 7) % 44 + 3}" cy="${cy + (o * 5 + i * 3) % 42 + 4}" r="${1.5 + j % 2}" fill="#B8924E"/>`).join("")}</g>`;
      }).join("")}</g>
      <g id="dfx"></g>
    </svg>
    <div class="dteller" id="dteller"><b id="dnum">0</b><span>/ ${k.delen.length}</span></div>`);
  homeButton(el);
  const svg = $("#dsvg");
  let veegt = false;
  const veeg = e => {
    if (!veegt) return;
    const p = stagePoint(e);
    const cx = Math.floor((p.x - ZAND.x) / ZAND.w), cy = Math.floor((p.y - ZAND.y) / ZAND.h);
    if (cx < 0 || cy < 0 || cx >= ZAND.cols || cy >= ZAND.rows) return;
    dWeg(cy * ZAND.cols + cx);
  };
  svg.addEventListener("pointerdown", e => { veegt = true; veeg(e); });
  svg.addEventListener("pointermove", veeg);
  DV.upH = () => { veegt = false; };
  window.addEventListener("pointerup", DV.upH);
  dsay("dino_welkom", () => dsay("dino_botten_" + k.delen.length, () => dsay("dino_veeg")));
}
function dWeg(i) {
  const g = document.querySelector(`#dzand .dtegel[data-i="${i}"]`);
  if (!g || g.dataset.weg) return;
  g.dataset.weg = 1;
  g.classList.add("dpuf");
  tone(260 + Math.random() * 120, .07, "triangle", .05, 0, 160);
  setTimeout(() => g.remove(), 260);
  dCheckBotten();
}
function dCheckBotten() {
  const k = DV.kuil;
  k.delen.forEach(p => {
    if (p.uit) return;
    const cx = Math.floor((p.zx - ZAND.x) / ZAND.w), cy = Math.floor((p.zy - ZAND.y) / ZAND.h);
    const i = cy * ZAND.cols + cx;
    const t = document.querySelector(`#dzand .dtegel[data-i="${i}"]`);
    if (t && !t.dataset.weg) return;
    p.uit = true; k.gevonden++;
    const b = document.querySelector(`#dbot .dbot[data-i="${p.i}"]`);
    if (b) { b.classList.add("dpop"); }
    sfx.sparkle(); say("n" + Math.min(20, k.gevonden));
    const n = $("#dnum"); if (n) n.textContent = k.gevonden;
    if (k.gevonden >= k.delen.length) dLater(() => dsay("dino_alles", () => dLater(dLeggen, 200)), 700);
  });
}
/* ---------- deel 2: het skelet leggen ---------- */
function dLeggen() {
  const k = DV.kuil, d = DINO[k.soort];
  k.sel = null; k.selGat = null;
  const el = dview("leggen", `
    <svg viewBox="0 0 ${W} ${H}" id="dsvg">
      <rect width="${W}" height="${H}" fill="#2E3856"/>
      <rect y="292" width="${W}" height="83" fill="#1F2740"/>
      <g id="dskelet" transform="translate(330 190)">
        ${k.delen.map(p => `<g class="dgat" data-i="${p.i}" transform="${pT(p)}">
          <g class="sil">${botSVG(d, p.id)}</g><circle r="18" fill="transparent"/></g>`).join("")}
        <g id="dvast"></g>
      </g>
      <g id="dfx"></g>
    </svg>
    <div class="dcards" id="dcards">${k.delen.map(p => `<button class="btn dcard" data-i="${p.i}" aria-label="bot">
      <svg viewBox="-80 -80 160 160"><g transform="rotate(${p.zr - p.r}) scale(${(p.s || 1) * .62 * (p.f ? -1 : 1)} ${(p.s || 1) * .62})">${botSVG(d, p.id)}</g></svg></button>`).join("")}</div>`);
  homeButton(el);
  el.querySelectorAll(".dcard").forEach(b => b.addEventListener("click", () => { unlockAudio(); dKiesBot(+b.dataset.i, b); }));
  el.querySelectorAll(".dgat").forEach(g => g.addEventListener("click", () => { unlockAudio(); dKiesGat(+g.dataset.i); }));
  dsay("dino_leg");
}
function dKiesBot(i, btn) {
  const k = DV.kuil;
  if (k.busy) return;
  const p = k.delen[i];
  if (!p || p.vast) return;
  if (k.selGat !== null) { const g = k.selGat; k.selGat = null; dProbeer(i, g); return; }
  k.sel = i;
  document.querySelectorAll(".dcard").forEach(b => b.classList.toggle("dsel", +b.dataset.i === i));
  sfx.click();
}
function dKiesGat(gi) {
  const k = DV.kuil;
  if (k.busy) return;
  if (k.sel !== null) { const s = k.sel; k.sel = null; document.querySelectorAll(".dcard").forEach(b => b.classList.remove("dsel")); dProbeer(s, gi); return; }
  k.selGat = gi;
  document.querySelectorAll(".dgat").forEach(g => g.querySelector(".sil").classList.toggle("next", +g.dataset.i === gi));
  sfx.click();
}
function dProbeer(boti, gati) {
  const k = DV.kuil, d = DINO[k.soort];
  document.querySelectorAll(".dgat").forEach(g => g.querySelector(".sil").classList.remove("next"));
  const gat = document.querySelector(`.dgat[data-i="${gati}"]`), kaart = document.querySelector(`.dcard[data-i="${boti}"]`);
  if (boti !== gati) {
    if (gat) { gat.classList.remove("tschud"); void gat.getBBox(); gat.classList.add("tschud"); }
    if (kaart) { kaart.classList.remove("wrong"); void kaart.offsetWidth; kaart.classList.add("wrong"); }
    tone(160, .25, "square", .12, 0, 110);
    dsay("dino_past_niet");
    return;
  }
  const p = k.delen[boti];
  p.vast = true;
  k.busy = true;
  if (kaart) { kaart.classList.add("gone"); kaart.disabled = true; }
  if (gat) gat.querySelector(".sil").classList.add("done");
  $("#dvast").insertAdjacentHTML("beforeend", `<g class="dpop" transform="${pT(p)}">${botSVG(d, p.id)}</g>`);
  sfx.pop(); sparkleAt($("#dfx"), 330 + p.x, 190 + p.y, false, ["#fff", "#FFD600"]);
  dLater(() => {
    k.busy = false;
    if (k.delen.every(q => q.vast)) { confetti(40); sfx.fanfare(); dsay("dino_klaar", () => dLater(dLeven, 300)); }
    else say(pick(["goed1", "goed2", "goed3", "goed4"]));
  }, 420);
}
/* ---------- deel 3: tot leven ---------- */
function dLeven() {
  const k = DV.kuil, d = DINO[k.soort];
  const el = dview("leven", `
    <svg viewBox="0 0 ${W} ${H}" id="dsvg">
      <rect width="${W}" height="${H}" fill="#9BD3F0"/>
      <circle cx="90" cy="54" r="26" fill="#FFD600" ${ST}/>
      ${[80, 300, 560].map((x, i) => `<path d="M${x - 90} 300 q90 -${70 + i * 14} 180 0z" fill="#7CB342"/>`).join("")}
      <rect y="300" width="${W}" height="75" fill="#8BC34A" ${ST}/>
      <g id="dskelet" transform="translate(330 250)">${k.delen.map(p => `<g transform="${pT(p)}">${botSVG(d, p.id)}</g>`).join("")}</g>
      <g id="dlevend" transform="translate(330 316)" opacity="0"><g class="dbody">${dinoLevend(k.soort)}</g></g>
      <g id="dfx"></g>
    </svg>`);
  homeButton(el);
  const sk = $("#dskelet"), lv = $("#dlevend");
  dAnim(1400, t => { sk.setAttribute("opacity", 1 - t); lv.setAttribute("opacity", t); }, () => {
    sk.remove();
    const body = lv.querySelector(".dbody"); if (body) body.classList.add("dbrul");
    sfx.roar ? sfx.roar() : (tone(90, .6, "sawtooth", .18, 0, 60), tone(150, .5, "square", .1, .05, 80));
    confetti(50);
    dsay("dino_leeft", () => dsay("dino_naam_" + k.soort, () => dVraagEten()));
  });
}
function dVraagEten() {
  const k = DV.kuil, d = DINO[k.soort];
  const el = $("#dino");
  const box = document.createElement("div");
  box.className = "deet";
  box.innerHTML = ["blad", "vlees"].map(e => `<button class="btn deetb" data-e="${e}">
    ${e === "blad" ? `<svg viewBox="0 0 60 60"><path d="M30 54 q-26 -14 -22 -34 q20 -16 44 -6 q4 24 -22 40z" fill="#4CAF50" ${ST}/><path d="M30 54 q-2 -22 8 -34" fill="none" stroke="${INK}" stroke-width="3"/></svg>`
      : `<svg viewBox="0 0 60 60"><path d="M12 40 q-4 -22 14 -26 q18 -4 24 12 q4 16 -10 20 q-16 4 -28 -6z" fill="#EF6C6C" ${ST}/><path d="M18 20 l-8 -8 M42 18 l8 -8" stroke="${INK}" stroke-width="5" stroke-linecap="round"/></svg>`}</button>`).join("");
  el.appendChild(box);
  box.querySelectorAll(".deetb").forEach(b => b.addEventListener("click", () => {
    unlockAudio();
    if (b.dataset.e !== d.eet) { b.classList.remove("wrong"); void b.offsetWidth; b.classList.add("wrong"); tone(160, .25, "square", .12, 0, 110); dsay("dino_fout_eten"); return; }
    box.remove();
    confetti(40); sfx.fanfare();
    DS.gevonden[k.soort] = true; DS.done++; DS.stars += 2; dSave();
    dsay(d.eet === "blad" ? "dino_planteneter" : "dino_vleeseter", () => dsay("dino_museum", () => dLater(dMuseum, 400)));
  }));
  dsay("dino_wat_at");
}
/* ---------- het museum ---------- */
function dMuseum() {
  const el = dview("museum", `
    <svg viewBox="0 0 ${W} ${H}" id="dsvg">
      <rect width="${W}" height="${H}" fill="#F3E7D2"/>
      <rect y="300" width="${W}" height="75" fill="#C8A26A" ${ST}/>
      ${[38, 356, 620].map(x => `<rect x="${x}" y="40" width="22" height="262" fill="#E3D3B6" ${TH}/>`).join("")}
      <g id="dstands">${DSOORT.map((s, i) => {
        const x = 92 + i * 122, gevonden = DS.gevonden[s];
        return `<g class="dstand" data-s="${s}" transform="translate(${x} 292)">
          <rect x="-56" y="0" width="112" height="16" rx="6" fill="#B08B5A" ${ST}/>
          <g transform="scale(.42)"><g class="dbody ${gevonden ? "" : "sil"}">${dinoLevend(s)}</g></g>
          <rect x="-58" y="-150" width="116" height="170" fill="transparent"/></g>`;
      }).join("")}</g>
      <g id="dfx"></g>
    </svg>
    <div class="dtitel">${Object.keys(DS.gevonden).length} / 5</div>
    <button class="btn vagain dagain" id="dagain" aria-label="Nog een kuil">${ICONS.play}</button>
    <div class="vstars"><svg viewBox="0 0 40 40"><path d="M20 4 l5 11 12 1 -9 8 3 12 -11 -6 -11 6 3 -12 -9 -8 12 -1z" fill="#FFD600" ${ST}/></svg><span>${DS.stars}</span></div>`);
  homeButton(el);
  $("#dagain").addEventListener("click", () => { unlockAudio(); sfx.pop(); dNieuweKuil(); });
  el.querySelectorAll(".dstand").forEach(g => g.addEventListener("click", () => {
    unlockAudio();
    const s = g.dataset.s;
    if (!DS.gevonden[s]) { sfx.click(); return; }
    const b = g.querySelector(".dbody"); b.classList.remove("dbrul"); void b.getBBox(); b.classList.add("dbrul");
    tone(90, .5, "sawtooth", .16, 0, 60);
    dsay("dino_naam_" + s);
  }));
  dsay("dino_nog_een");
}

if (typeof renderHome === "function" && typeof current !== "undefined" && current === "home") renderHome();
