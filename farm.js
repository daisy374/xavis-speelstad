"use strict";
/* Xavi's Boerderij — dieren verzorgen, werken, moestuin, markt, dag en nacht.
   Gebruikt de gedeelde hulpjes uit app.js (say, sfx, ICONS, ANIMALS, FOODS, confetti, …). */

const FKEY = "xavi-boerderij-v1";
const HOUR = 3600 * 1000;
const NAMES = {
  koe: ["Bella", "Klara", "Madelief", "Bertha", "Fien"],
  paard: ["Storm", "Bliksem", "Roos", "Sam", "Max"],
  varken: ["Knorrie", "Babe", "Pinky", "Toffee", "Dikkie"],
  schaap: ["Molly", "Wolkje", "Pluis", "Sneeuwtje", "Lotje"]
};
const PRICE_BUY = { koe: 15, paard: 20, varken: 12, schaap: 10 };
const PRICE_SELL = { melk: 3, wol: 4, ei: 1, wortel: 1, sla: 1, aardbei: 2, graan: 1, mais: 2, pompoen: 4, appel: 2, honing: 5 };
const MOVE_PRICE = { koe: 9, paard: 12, varken: 7, schaap: 6 };   // verhuizen levert muntjes op (baby +2)
const FIELD_GROW = 8 * 60 * 1000;                     // akker: 8 minuten na zaaien
const FIELD_YIELD = { graan: 6, mais: 4, pompoen: 3 };
const BINS = 12;                                      // stukjes per akkerstrook
const TREATS = ["aardbei", "appel", "pompoen", "mais", "wortel", "sla"];
const CUSTOMERS = ["konijn", "eend"];
const DECAY = { h: 8, d: 10, s: 5, b: 7 };           // punten per uur
const PROD = { koe: 50, schaap: 34 };                 // melk na 2 uur, wol na 3 uur
const GROW = 5 * 60 * 1000;                           // moestuin: 5 minuten na water geven
const MAX_ANIMALS = 8;
const eggMax = () => F.owned && F.owned.kippenluik ? 10 : 6;
const MEADOW = { x0: 190, x1: 440, y0: 240, y1: 350 };
const EGG_T = 15 * 60 * 1000;                         // kippen leggen 1 ei per kwartier

/* ---------- tekeningen ---------- */
const PAARD = `
  <path d="M-27 -42 q-16 6 -12 30" fill="none" stroke="#5D4037" stroke-width="8" stroke-linecap="round"/>
  ${[-22, -12, 10, 20].map(x => `<rect x="${x}" y="-28" width="7" height="28" rx="2" fill="#A1887F" ${TH}/><rect x="${x}" y="-5" width="7" height="5" fill="#4E342E"/>`).join("")}
  <ellipse cx="-2" cy="-40" rx="30" ry="15" fill="#A1887F" ${ST}/>
  <path d="M12 -48 L20 -80 Q28 -88 36 -82 L32 -44 Z" fill="#A1887F" ${TH}/>
  <path d="M19 -80 q-9 14 -9 34 q6 0 8 -3 q0 -16 9 -29 z" fill="#5D4037"/>
  <path d="M27 -85 l1 -11 l7 9 z" fill="#A1887F" ${TH}/>
  <path d="M24 -84 Q33 -94 42 -84 L57 -63 Q59 -54 50 -53 L42 -55 Q35 -66 27 -70 Z" fill="#A1887F" ${TH}/>
  <ellipse cx="52" cy="-58" rx="7" ry="5.5" fill="#8D6E63" ${TH}/>
  <circle cx="54" cy="-59" r="1.4" fill="${INK}"/>
  <path d="M38 -84 L50 -64" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M30 -86 q4 -6 9 -2 q-4 2 -9 2z" fill="#5D4037"/>
  <circle cx="36" cy="-76" r="2.6" fill="${INK}"/>
  <g class="sad"><path d="M33 -72 q-3 5 0 7 q3 -2 0 -7z" fill="#4FC3F7"/></g>
  <g class="happy"><path d="M45 -52 q4 3 7 -1" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/></g>
  <g class="band" transform="translate(-6 -38)"><rect x="-10" y="-4.5" width="20" height="9" rx="4.5" fill="#fff" ${TH}/></g>`;
const WOOL = [[-14, -30, 13], [0, -36, 15], [14, -30, 13], [-6, -22, 12], [8, -22, 12], [-20, -22, 9], [20, -22, 9]];
const SCHAAP = `
  ${[-16, -6, 6, 16].map(x => `<rect x="${x - 3}" y="-20" width="6" height="20" rx="3" fill="#37474F"/>`).join("")}
  <ellipse cx="0" cy="-26" rx="21" ry="13" fill="#FFE0D0" ${ST}/>
  <g class="wool">${WOOL.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}" stroke="${INK}" stroke-width="6"/>`).join("")}
    ${WOOL.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#FAFAFA"/>`).join("")}</g>
  <ellipse cx="14" cy="-48" rx="7" ry="4" fill="#37474F" transform="rotate(-25 14 -48)"/><ellipse cx="34" cy="-48" rx="7" ry="4" fill="#37474F" transform="rotate(25 34 -48)"/>
  <ellipse cx="24" cy="-44" rx="11" ry="13" fill="#455A64" ${TH}/>
  <circle class="woolhat" cx="24" cy="-56" r="7" fill="#FAFAFA" ${TH}/>
  <circle cx="20" cy="-45" r="2.6" fill="#fff"/><circle cx="28" cy="-45" r="2.6" fill="#fff"/>
  <circle cx="20.5" cy="-45" r="1.3" fill="${INK}"/><circle cx="28.5" cy="-45" r="1.3" fill="${INK}"/>
  <g class="sad"><path d="M16 -42 q-3 5 0 7 q3 -2 0 -7z" fill="#4FC3F7"/></g>
  <g class="happy"><path d="M20 -37 q4 3 8 0" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/></g>
  <g class="band"></g>`;
const FARM_SVG = t => ({ koe: ANIMALS.koe, varken: ANIMALS.varken, paard: PAARD, schaap: SCHAAP, kip: ANIMALS.kip })[t];
/* plekken op het dier (lokale coördinaten) voor vuil, uier en mond */
const SPOTS = [[-14, -40], [6, -32], [-4, -46], [14, -40], [-20, -30]];
const MOUTH = { koe: [28, -44], paard: [52, -58], varken: [20, -36], schaap: [26, -40] };
const AARDBEI = `<path d="M20 36 C8 30 6 18 10 12 C14 8 26 8 30 12 C34 18 32 30 20 36Z" fill="#FF1744" ${TH}/><path d="M12 12 l8 -8 l8 8 l-8 -3z" fill="#43A047" ${TH}/>${[[16, 18], [24, 18], [20, 25], [15, 26], [25, 26]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.3" fill="#FFE082"/>`).join("")}`;
const CROP = { wortel: FOODS.wortel.svg, sla: FOODS.sla.svg, aardbei: AARDBEI };
const ITEM = {
  melk: `<path d="M12 10 H28 L30 36 H10 Z" fill="#fff" ${TH}/><rect x="10" y="4" width="20" height="7" rx="2" fill="#29B6F6" ${TH}/><path d="M12 22 h16" stroke="#B3E5FC" stroke-width="3"/>`,
  wol: `<circle cx="20" cy="22" r="13" fill="#F5F5F5" ${TH}/><path d="M10 16 q10 6 20 0 M9 24 q11 6 22 0 M12 31 q8 3 16 0" fill="none" stroke="#BDBDBD" stroke-width="2"/>`,
  ei: `<ellipse cx="20" cy="22" rx="10" ry="13" fill="#FFF3E0" ${TH}/>`,
  wortel: CROP.wortel, sla: CROP.sla, aardbei: AARDBEI,
  graan: `<path d="M20 37 V16 M20 31 L11 13 M20 31 L29 13" stroke="#C8A200" stroke-width="3" stroke-linecap="round"/>${[[20, 10], [10, 10], [30, 10]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="4" ry="7.5" fill="#FFCA28" ${TH}/>`).join("")}<rect x="14" y="26" width="12" height="5" rx="2" fill="#A1887F" ${TH}/>`,
  mais: `<path d="M20 4 C28 8 28 28 20 36 C12 28 12 8 20 4Z" fill="#FFD54F" ${TH}/>${[[18, 12], [22, 12], [17, 18], [21, 18], [25, 18], [17, 24], [21, 24], [24, 24], [20, 30]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#F9A825"/>`).join("")}<path d="M20 37 C10 31 6 20 8 12 C12 22 16 29 20 37Z" fill="#7CB342" ${TH}/><path d="M20 37 C30 31 34 20 32 12 C28 22 24 29 20 37Z" fill="#7CB342" ${TH}/>`,
  appel: FOODS.appel.svg,
  honing: `<rect x="9" y="12" width="22" height="24" rx="6" fill="#FFB300" ${TH}/><rect x="8" y="6" width="24" height="8" rx="3" fill="#fff" ${TH}/><path d="M13 20 q4 6 0 10" stroke="#FFE082" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  pompoen: `<path d="M20 13 q0 -6 5 -9" stroke="#558B2F" stroke-width="4" fill="none" stroke-linecap="round"/><ellipse cx="20" cy="24" rx="16" ry="12" fill="#FF8F00" ${TH}/><path d="M20 12 v24 M12 14 q-5 10 0 20 M28 14 q5 10 0 20" stroke="#E65100" stroke-width="2" fill="none"/>`
};
const TRUCK = `<rect x="4" y="-58" width="96" height="52" rx="6" fill="#FFF3E0" ${ST}/><path d="M100 -40 H124 L138 -22 V-6 H100 Z" fill="${C.fred}" ${ST}/><path d="M106 -36 H122 L131 -24 H106 Z" fill="${C.glass}" ${TH}/>
  <path d="M16 -48 h72" stroke="#FFB74D" stroke-width="6" stroke-linecap="round"/><path d="M40 -34 q12 -12 24 0 q-12 12 -24 0z" fill="#FF4081" ${TH}/>
  ${[28, 116].map(x => `<circle cx="${x}" cy="-4" r="13" fill="${INK}"/><circle cx="${x}" cy="-4" r="5" fill="${C.hub}"/>`).join("")}`;
const TRACTOR_SVG = () => `<g transform="translate(-102 -128)">${carSVG(VEH.tractor)}</g>`;
const COIN = `<svg viewBox="0 0 30 30"><circle cx="15" cy="15" r="12" fill="#FFC107" stroke="${INK}" stroke-width="2.5"/><circle cx="15" cy="15" r="7.5" fill="none" stroke="#E0A800" stroke-width="2"/></svg>`;
const ico = (inner, vb = "0 0 40 40") => `<svg viewBox="${vb}">${inner}</svg>`;
const TOOL = {
  hooi: ico(`<path d="M6 30 L10 16 H30 L34 30 Z" fill="#FFCA28" ${TH}/><path d="M12 16 l-3 -6 M18 16 l-1 -8 M24 16 l2 -8 M29 16 l4 -6" stroke="#E0A800" stroke-width="2.5" stroke-linecap="round"/>`),
  appel: ico(FOODS.appel.svg),
  water: ico(`<path d="M8 12 H32 L29 34 H11 Z" fill="#90A4AE" ${TH}/><path d="M9 16 H31" stroke="${INK}" stroke-width="2"/><path d="M11 18 H29 L28 24 H12 Z" fill="#29B6F6"/><path d="M8 12 q12 -12 24 0" fill="none" ${TH}/>`),
  borstel: ico(`<rect x="6" y="18" width="28" height="10" rx="3" fill="#8D6E63" ${TH}/><path d="M9 28 v6 M13 28 v6 M17 28 v6 M21 28 v6 M25 28 v6 M29 28 v6" stroke="${INK}" stroke-width="2"/><rect x="14" y="10" width="12" height="8" rx="3" fill="#A1887F" ${TH}/>`),
  modder: ico(`<path d="M8 14 H32 L29 34 H11 Z" fill="#90A4AE" ${TH}/><path d="M9 14 q5 -8 11 -2 q6 -7 12 2 z" fill="#6D4C41" ${TH}/>`),
  aai: ico(`<path d="M12 34 C8 26 8 20 10 16 L12 10 Q14 8 16 10 L17 18 L18 6 Q20 4 22 6 L22 18 L24 8 Q26 6 28 8 L27 20 L30 14 Q32 13 33 15 L30 28 C28 34 18 36 12 34Z" fill="#FFCC80" ${TH}/>`),
  melk: ico(`<path d="M10 14 H30 L27 34 H13 Z" fill="#B0BEC5" ${TH}/><path d="M13 18 H27" stroke="${INK}" stroke-width="2"/><path d="M10 14 q10 -10 20 0" fill="none" ${TH}/><circle cx="20" cy="26" r="4" fill="#fff"/>`),
  schaar: ico(`<circle cx="12" cy="29" r="5" fill="none" stroke="${C.fred}" stroke-width="4"/><circle cx="26" cy="29" r="5" fill="none" stroke="${C.fred}" stroke-width="4"/><path d="M14 25 L28 5 M24 25 L10 5" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><path d="M14 25 L28 5 M24 25 L10 5" stroke="#CFD8DC" stroke-width="2" stroke-linecap="round"/>`),
  gieter: ico(`<path d="M8 16 H26 V34 H8 Z" fill="#43A047" ${TH}/><path d="M26 20 L37 12" stroke="#43A047" stroke-width="5" stroke-linecap="round"/><path d="M26 20 L37 12" stroke="${INK}" stroke-width="1.5"/><path d="M10 16 q7 -10 14 0" fill="none" ${TH}/>`),
  graan: ico(`<path d="M8 34 L10 12 Q20 6 30 12 L32 34 Z" fill="#D7CCC8" ${TH}/><path d="M10 12 q10 5 20 0" fill="none" ${TH}/>${[[16, 24], [22, 20], [20, 28], [25, 27], [14, 30]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2" ry="1.4" fill="#FFB300"/>`).join("")}`),
  back: ico(`<path d="M24 8 L12 20 L24 32" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`),
  vink: ico(`<path d="M8 21 L17 30 L33 11" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`),
  gear: ico(`<circle cx="20" cy="20" r="7" fill="none" stroke="${INK}" stroke-width="4"/><path d="M20 4 v6 M20 30 v6 M4 20 h6 M30 20 h6 M9 9 l4 4 M27 27 l4 4 M9 31 l4 -4 M27 13 l4 -4" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`),
  kleding: ico(`<path d="M20 8 a4 4 0 1 1 4 4 q-4 1 -4 5 L4 30 H36 L20 17" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><g transform="translate(20 33) scale(.8)"><path d="M0 0 L-12 -7 V7 Z M0 0 L12 -7 V7 Z" fill="#FF4081" stroke="${INK}" stroke-width="2"/></g>`),
  farm: ico(`<path d="M6 36 V18 L20 8 L34 18 V36 Z" fill="#E53935" ${TH}/><rect x="15" y="24" width="10" height="12" fill="#fff" ${TH}/><path d="M15 24 L25 36 M25 24 L15 36" stroke="${INK}" stroke-width="1.5"/>`)
};
const NEED_ICON = {
  h: ico(`<path d="M20 36 L12 14 Q20 8 28 14 Z" fill="#FF8A00" ${TH}/><path d="M20 11 l-6 -7 M20 11 V2 M20 11 l6 -7" stroke="#43A047" stroke-width="4" stroke-linecap="round"/>`),
  d: ico(`<path d="M20 4 C26 14 30 20 30 25 a10 10 0 0 1 -20 0 C10 20 14 14 20 4Z" fill="#29B6F6" ${TH}/>`),
  s: ico(`<path d="M20 4 l4 10 10 1 -8 7 3 11 -9 -6 -9 6 3 -11 -8 -7 10 -1z" fill="#FFD600" ${TH}/>`),
  m: ico(`<path d="M5 26 q4 -10 12 -6 q5 -8 13 -2 q8 0 6 10 q-6 8 -16 6 q-12 2 -15 -8z" fill="#6D4C41" ${TH}/>`),
  b: ico(`<path d="M20 34 C6 24 4 16 8 10 C12 5 18 7 20 12 C22 7 28 5 32 10 C36 16 34 24 20 34Z" fill="#FF4081" ${TH}/>`)
};

/* ---------- toestand (blijft bewaard op dit toestel) ---------- */
let F = null, FV = null;   // F = opgeslagen boerderij, FV = wat er nu op het scherm gebeurt
function fNew() {
  return { v: 1, animals: [], coins: 0, stock: { melk: 0, wol: 0, ei: 0, wortel: 2, sla: 1, aardbei: 0 },
    eggs: 2, eggT: Date.now(), plots: [null, null, null, null, null, null], day: 1, last: Date.now(), night: false, seen: {} };
}
const newRow = () => ({ st: "gras", bins: Array(BINS).fill(0), crop: null, t: 0 });
// nieuwe onderdelen aanvullen bij een oude opgeslagen boerderij
function fUpgrade() {
  for (const k in PRICE_SELL) if (typeof F.stock[k] !== "number") F.stock[k] = 0;
  if (!Array.isArray(F.field)) F.field = [newRow(), newRow(), newRow()];
  if (!F.grown) F.grown = {};
  if (typeof F.ordersDone !== "number") F.ordersDone = 0;
  if (!F.nextOrderT) F.nextOrderT = Date.now() + 60 * 1000;
  if (F.order === undefined) F.order = null;
  const now = Date.now();
  F.owned = F.owned || {}; F.accOwned = F.accOwned || {}; F.acc = F.acc || {}; F.deco = F.deco || { verf: "rood" };
  if (!Array.isArray(F.trees)) F.trees = [0, 1, 2].map(() => ({ n: 2, t: now }));
  F.honey = F.honey || { n: 1, t: now }; F.duck = F.duck || { n: 1, t: now };
}
function fLoad() {
  try { F = JSON.parse(localStorage.getItem(FKEY)); } catch (e) { F = null; }
  if (!F || F.v !== 1) F = fNew();
  fUpgrade();
  fDecay();
}
function fSave() { try { localStorage.setItem(FKEY, JSON.stringify(F)); } catch (e) {} }
function fDecay() {
  const now = Date.now();
  const hrs = Math.min(24, Math.max(0, (now - F.last) / HOUR));
  F.last = now;
  F.animals.forEach(a => {
    for (const k in DECAY) a.needs[k] = Math.max(8, a.needs[k] - DECAY[k] * hrs);
    if (PROD[a.type] && !a.baby) a.prod = Math.min(100, (a.prod || 0) + PROD[a.type] * hrs);
  });
  const em = eggMax(), per = F.owned && F.owned.kippenluik ? EGG_T / 2 : EGG_T;
  const layed2 = Math.floor((now - F.eggT) / per);
  if (layed2 > 0) { F.eggs = Math.min(em, F.eggs + layed2); F.eggT = now; }
  if (F.eggs >= em) F.eggT = now;
  // boomgaard, bijen en eendjes (alleen als ze gekocht zijn)
  const grow = (o, every, max) => { const k = Math.floor((now - o.t) / every); if (k > 0) { o.n = Math.min(max, o.n + k); o.t = now; } if (o.n >= max) o.t = now; };
  if (F.owned && F.owned.boomgaard) F.trees.forEach(t => grow(t, 8 * 60 * 1000, 4));
  if (F.owned && F.owned.bijen) grow(F.honey, 15 * 60 * 1000, 3);
  if (F.owned && F.owned.vijver) grow(F.duck, 20 * 60 * 1000, 3);
  (F.field || []).forEach(r => { if (r.st === "gezaaid" && now - r.t >= FIELD_GROW) { r.st = "rijp"; r.bins = Array(BINS).fill(0); } });
}
const nameClip = a => NAMES[a.type] && NAMES[a.type].includes(a.name) ? "nm_" + a.name : "je_" + a.type;
function fsay(name, cb) {
  const tok = FV && FV.tok;
  say(name, cut => { if (cut || !FV || FV.tok !== tok) return; if (cb) cb(); });
}
const sayA = (a, key, cb) => fsay(nameClip(a), () => fsay(key, cb));
const minNeed = a => { let k = "h"; for (const n of ["d", "s", "b"]) if (a.needs[n] < a.needs[k]) k = n; return k; };
const needLine = (a, k) => ({ h: "b_honger", d: "b_dorst", s: a.type === "varken" ? "b_modder" : "b_vies", b: "b_aai" })[k];
const moodCls = a => Math.min(...Object.values(a.needs)) >= 45 ? "fine" : "";
const usedNames = t => F.animals.filter(a => a.type === t).map(a => a.name);

/* ---------- scherm en navigatie ---------- */
function fAnim(dur, fn, done) {
  const tok = FV && FV.tok, t0 = performance.now();
  const step = now => {
    if (!FV || FV.tok !== tok) return;
    const t = Math.min(1, (now - t0) / dur);
    fn(t);
    if (t < 1) requestAnimationFrame(step); else if (done) done();
  };
  requestAnimationFrame(step);
}
function fLater(fn, ms) { const tok = FV && FV.tok; return setTimeout(() => { if (FV && FV.tok === tok) fn(); }, ms); }
function farmOpen() {
  unlockAudio();
  fLoad();
  show("farm");
  FV = { tok: 0 };
  FV.decayT = setInterval(() => { fDecay(); fSave(); if (FV.view === "yard") yardNeeds(); if (FV.view === "care") careMeters(); }, 10000);
  if (!F.animals.length) pickFirst(); else { yard(); say(F.night ? "avond" : "boer_welkom"); }
}
function farmStop() {
  if (!FV) return;
  clearInterval(FV.decayT); clearInterval(FV.walkT);
  FV = null;
  if (F) { fDecay(); fSave(); }
}
function view(name, html) {
  FV.tok++; FV.view = name;
  clearInterval(FV.walkT);
  const el = $("#farm");
  el.innerHTML = html;
  return el;
}
function backBtn(el, fn) {
  const b = document.createElement("button");
  b.className = "btn home-btn"; b.setAttribute("aria-label", "Terug");
  b.innerHTML = TOOL.back;
  b.addEventListener("click", () => { sfx.pop(); fn(); });
  el.appendChild(b);
}
function coinBox(el) {
  const c = document.createElement("div");
  c.className = "jail coins"; c.id = "coinBox";
  c.innerHTML = `<span class="bars">${COIN}</span><span class="num" id="coinNum">${F.coins}</span>`;
  el.appendChild(c);
}
const setCoins = () => { const n = $("#coinNum"); if (n) n.textContent = F.coins; };
// muntjes meteen bijschrijven (dan gaan ze nooit verloren); de teller op het scherm loopt met de animatie mee
function bank(n) { const shown = F.coins; F.coins += n; fSave(); return k => { const el = $("#coinNum"); if (el) el.textContent = Math.min(F.coins, shown + k); }; }
function flyTo(svgRoot, inner, x0, y0, x1, y1, dur, done, sc = 1) {
  const g = svgEl("", inner);
  svgRoot.appendChild(g);
  fAnim(dur, t => {
    const e = t * t * (3 - 2 * t);
    g.setAttribute("transform", `translate(${x0 + (x1 - x0) * e} ${y0 + (y1 - y0) * e - Math.sin(Math.PI * t) * 50}) scale(${sc})`);
  }, () => { g.remove(); if (done) done(); });
}

/* ---------- eerste dier kiezen en namen ---------- */
function animalCard(t, sc) {
  return `<svg viewBox="-55 -100 115 105"><g transform="scale(${sc})"><g class="animal fine ${t === "schaap" ? "" : ""}">${FARM_SVG(t)}</g></g></svg>`;
}
function pickFirst() {
  const el = view("pick", `
    <div class="farmbg"></div>
    <div class="ftitle">Kies je dier</div>
    <div class="pickrow">${["koe", "paard", "varken", "schaap"].map(t => `<button class="pickcard" data-t="${t}" aria-label="${t}">${animalCard(t, 1)}</button>`).join("")}</div>
    <button class="btn okbtn" id="okBtn" hidden aria-label="Kiezen">${TOOL.vink}</button>`);
  homeButton(el);
  let chosen = null;
  el.querySelectorAll(".pickcard").forEach(b => b.addEventListener("click", () => {
    chosen = b.dataset.t;
    el.querySelectorAll(".pickcard").forEach(x => x.classList.toggle("sel", x === b));
    fsay("g_" + chosen, () => fsay("type_" + chosen));
    $("#okBtn").hidden = false;
  }));
  $("#okBtn").addEventListener("click", () => { if (chosen) { sfx.sparkle(); pickName(chosen, false, a => { yard(); later2(() => sayA(a, "b_blij"), 600); }); } });
  fsay("boer_welkom", () => fsay("boer_kies"));
}
const later2 = (fn, ms) => fLater(fn, ms);
function pickName(type, baby, done, cancel) {
  const free = NAMES[type].filter(n => !usedNames(type).includes(n));
  if (!free.length) { done(addAnimal(type, `${type} ${F.animals.length + 1}`, baby)); return; }
  const el = view("name", `
    <div class="farmbg"></div>
    <div class="namepet">${animalCard(type, baby ? .7 : 1)}</div>
    <div class="namerow">${free.map(n => `<button class="namebtn" data-n="${n}">${n}</button>`).join("")}</div>
    <button class="btn okbtn" id="okBtn" hidden aria-label="Kiezen">${TOOL.vink}</button>`);
  if (cancel) backBtn(el, cancel);
  let chosen = null;
  el.querySelectorAll(".namebtn").forEach(b => b.addEventListener("click", () => {
    chosen = b.dataset.n;
    el.querySelectorAll(".namebtn").forEach(x => x.classList.toggle("sel", x === b));
    say("nm_" + chosen);
    $("#okBtn").hidden = false;
  }));
  $("#okBtn").addEventListener("click", () => { if (!chosen) return; confetti(40); sfx.fanfare(); done(addAnimal(type, chosen, baby)); });
  say("naam_kies");
}
function addAnimal(type, name, baby) {
  const a = { id: Date.now() + "" + Math.floor(Math.random() * 1000), type, name, baby: !!baby,
    needs: { h: 75, d: 70, s: 80, b: 65 }, prod: type === "koe" || type === "schaap" ? 100 : 0, nights: 0 };
  F.animals.push(a); fSave();
  return a;
}

/* ---------- het erf ---------- */
function yardSVG() {
  const n = F.night;
  const plots = F.plots.map((p, i) => {
    const x = 488 + (i % 3) * 56, y = 280 + Math.floor(i / 3) * 34;
    let inner = "";
    if (p) {
      const ripe = p.w && Date.now() - p.w >= GROW;
      inner = ripe ? `<g transform="translate(${x + 12} ${y - 8}) scale(.7)">${CROP[p.crop]}</g>`
        : `<path d="M${x + 26} ${y + 20} v-${p.w ? 10 : 4}" stroke="#43A047" stroke-width="3"/><circle cx="${x + 26}" cy="${y + 20 - (p.w ? 12 : 5)}" r="${p.w ? 5 : 3}" fill="#66BB6A"/>`;
    }
    return `<rect x="${x}" y="${y}" width="50" height="28" rx="4" fill="${p && p.w ? "#6D4C41" : "#8D6E63"}" ${TH}/>${inner}`;
  }).join("");
  return `
  <svg viewBox="0 0 ${W} ${H}" id="yardSvg">
    <rect width="${W}" height="${H}" fill="${n ? "#1A2A5A" : "#29B6F6"}"/>
    ${n ? Array.from({ length: 30 }, (_, i) => `<circle cx="${(i * 97) % W}" cy="${(i * 53) % 120 + 10}" r="1.6" fill="#fff"/>`).join("") : ""}
    ${n ? `<path d="M600 26 a24 24 0 1 0 20 38 a18 18 0 1 1 -20 -38z" fill="#FFE27A" ${ST}/>` : `<circle cx="610" cy="48" r="26" fill="${C.hub}" ${ST}/>`}
    <path d="M0 190 Q120 140 250 185 T520 175 T${W} 180 V${H} H0 Z" fill="${n ? "#2E4A2E" : "#9CCC65"}" ${ST}/>
    <rect y="210" width="${W}" height="165" fill="${n ? "#33502F" : "#8BC34A"}"/>
    <g id="kraam" class="tap"><rect x="292" y="120" width="110" height="70" fill="#FFF3E0" ${ST}/>
      <path d="M284 122 h126 l-8 -22 h-110 z" fill="${C.fred}" ${ST}/><path d="M298 100 l-6 22 M318 100 l-4 22 M338 100 l-2 22 M358 100 v22 M378 100 l2 22 M398 100 l4 22" stroke="#fff" stroke-width="5"/>
      <rect x="300" y="150" width="94" height="10" fill="#A1887F" ${TH}/>
      <g transform="translate(304 128) scale(.55)">${ITEM.melk}</g><g transform="translate(330 128) scale(.55)">${ITEM.ei}</g><g transform="translate(356 128) scale(.55)">${CROP.wortel}</g>
      <circle cx="384" cy="140" r="9" fill="#FFC107" ${TH}/></g>
    ${F.owned.ballon ? `<g class="balbob"><g transform="translate(536 64) scale(1.1)">${SHOP_ICON.ballon}</g></g>` : ""}
    <g id="stal"><rect x="14" y="120" width="140" height="120" fill="${VERF[F.deco.verf] || VERF.rood}" ${ST}/>
      <path d="M4 124 L84 70 L164 124 Z" fill="#8D2A1E" ${ST}/>
      <rect x="54" y="170" width="60" height="70" fill="${n ? "#FFE082" : "#fff"}" ${TH}/>
      <path d="M54 170 L114 240 M114 170 L54 240" stroke="${INK}" stroke-width="3"/>
      <rect x="72" y="92" width="24" height="20" fill="${n ? "#FFE082" : "#FFE0B2"}" ${TH}/></g>
    <path d="M${MEADOW.x0 - 16} 214 H${MEADOW.x1 + 24}" stroke="#A1887F" stroke-width="5"/>
    ${Array.from({ length: 12 }, (_, i) => `<rect x="${MEADOW.x0 - 18 + i * 26}" y="204" width="6" height="22" fill="#A1887F" ${TH}/>`).join("")}
    ${F.owned.vlag ? `<path d="M150 118 Q220 150 292 116" fill="none" stroke="${INK}" stroke-width="2"/>${[0, 1, 2, 3, 4, 5, 6].map(i => { const t = (i + .5) / 7, x = 150 + t * 142, y = 118 + Math.sin(Math.PI * t) * 30 - t * 2; return `<path d="M${x - 6} ${y} h12 l-6 14 z" fill="${["#FF4081", "#FFD600", "#29B6F6", "#66BB6A"][i % 4]}" ${TH}/>`; }).join("")}` : ""}
    ${F.owned.lampjes ? Array.from({ length: 11 }, (_, i) => { const x = MEADOW.x0 - 5 + i * 26; return `${n ? `<circle cx="${x}" cy="206" r="9" fill="#FFE082" opacity=".45"/>` : ""}<ellipse cx="${x}" cy="206" rx="3.5" ry="5" fill="${n ? "#FFF59D" : ["#FFD600", "#FF4081", "#29B6F6"][i % 3]}" ${TH}/>`; }).join("") : ""}
    ${F.owned.bloemen ? [22, 40, 136, 150, 170, 460, 476].map((x, i) => `<g transform="translate(${x} ${x < 160 ? 246 : 232})"><path d="M0 0 V-12" stroke="#43A047" stroke-width="3"/>${[0, 72, 144, 216, 288].map(d => `<circle cx="${4 * Math.cos(d * Math.PI / 180)}" cy="${-14 + 4 * Math.sin(d * Math.PI / 180)}" r="3.2" fill="${["#FF4081", "#FFD600", "#AB47BC", "#fff"][i % 4]}"/>`).join("")}<circle cy="-14" r="2.2" fill="#FFF3E0"/></g>`).join("") : ""}
    <g id="erf2Btn" class="tap"><rect x="620" y="120" width="47" height="100" fill="transparent"/><rect x="640" y="150" width="7" height="66" fill="#8D6E63" ${TH}/><path d="M618 138 H652 L664 152 L652 166 H618 Z" fill="#FFE0B2" ${ST}/><path d="M626 152 h22 M642 146 l6 6 l-6 6" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></g>
    <g id="hok" class="tap"><rect x="500" y="170" width="100" height="62" fill="#FFCC80" ${ST}/>
      <path d="M492 172 L550 132 L608 172 Z" fill="#6D4C41" ${ST}/><rect x="538" y="196" width="24" height="36" rx="10" fill="#4E342E" ${TH}/>
      ${F.eggs > 0 ? `<ellipse cx="516" cy="226" rx="6" ry="8" fill="#FFF3E0" ${TH}/>` : ""}
      <g transform="translate(596 250) scale(.8)"><g class="animal fine peck">${ANIMALS.kip}</g></g>
      <g transform="translate(478 246) scale(.7)"><g class="animal fine peck2">${ANIMALS.kip}</g></g></g>
    <g id="akkerBtn" class="tap"><rect x="160" y="130" width="112" height="84" fill="transparent"/>
      <path d="M166 176 h96" stroke="#C8A200" stroke-width="3"/>${[172, 186, 200, 214, 228, 242, 256].map(x => `<path d="M${x} 178 v-12" stroke="#C8A200" stroke-width="3" stroke-linecap="round"/><ellipse cx="${x}" cy="163" rx="3" ry="5.5" fill="#FFCA28" ${TH}/>`).join("")}
      <g transform="translate(214 208) scale(.36)">${tractorArt()}</g>
      ${F.field.some(r => r.st === "rijp") && !n ? `<g class="needbub" transform="translate(214 128)"><g class="nbob"><path d="M0 4 l-8 -12 h16 z" fill="#fff" ${TH}/><rect x="-22" y="-50" width="44" height="44" rx="14" fill="#fff" ${ST}/><g transform="translate(-18 -46) scale(.9)">${ITEM[F.field.find(r => r.st === "rijp").crop]}</g></g></g>` : ""}</g>
    <g id="klant"></g>
    <g id="tuin" class="tap"><rect x="480" y="270" width="182" height="80" rx="8" fill="#A5D6A7" ${ST}/>${plots}</g>
    <g id="herd"></g>
    ${F.owned.hond ? `<g id="dog" class="tap"><rect x="-40" y="-70" width="90" height="75" fill="transparent"/><g class="dogflip"><g class="animal fine">${DOG}</g></g></g>` : ""}
    <g id="bubs"></g>
    <g id="fx"></g>
    ${n ? `<rect width="${W}" height="${H}" fill="#0B1640" opacity=".25" pointer-events="none"/>` : ""}
  </svg>`;
}
function yard() {
  const el = view("yard", yardSVG() + `<button class="btn daybtn" id="dayBtn" aria-label="Dag en nacht">${F.night ? ICONS.sun : ICONS.moon}</button>
    <button class="btn shopbtn" id="shopBtn" aria-label="Bouwwinkel">${ico(TAB_ICON.bouw)}</button>
    <button class="gearbtn" id="gearBtn" aria-label="Instellingen voor ouders">${TOOL.gear}</button>`);
  homeButton(el);
  coinBox(el);
  const herd = $("#herd");
  FV.pos = FV.pos || {};
  F.animals.forEach(a => {
    if (a.inStal) return;
    let p = FV.pos[a.id];
    if (!p) { const [x, y] = freeSpot(a.id); p = FV.pos[a.id] = { x, y, tx: x, ty: y, dir: 1 }; }
    p.busy = p.toStal = false;
    const g = svgEl("pet", `<rect class="hit" x="-50" y="-95" width="100" height="100" fill="transparent"/>
      <g class="flip"><g class="animal ${moodCls(a)} ${a.type === "schaap" && a.prod < 60 ? "kaal" : ""}">${animalArt(a)}</g></g>`);
    g.dataset.id = a.id;
    herd.appendChild(g);
    g.addEventListener("pointerdown", e => { e.stopPropagation(); tapAnimal(a, g); });
  });
  yardNeeds(); yardPlace();
  FV.walkT = setInterval(yardWalk, 50);
  $("#hok").addEventListener("click", () => { sfx.pop(); coop(); });
  $("#tuin").addEventListener("click", () => { sfx.pop(); garden(); });
  $("#kraam").addEventListener("click", () => { sfx.pop(); market(); });
  $("#akkerBtn").addEventListener("click", () => { sfx.honk(); field(); });
  yardCustomer();
  $("#shopBtn").addEventListener("click", () => { unlockAudio(); sfx.pop(); shopView(); });
  $("#erf2Btn").addEventListener("click", () => { unlockAudio(); sfx.pop(); erf2(); });
  if (F.owned.hond) {
    FV.dog = FV.dog || { x: 330, y: 300, tx: 330, ty: 300, dir: 1, hop: 0 };
    $("#dog").addEventListener("pointerdown", e => { e.stopPropagation(); unlockAudio(); FV.dog.hop = 1; fsay("g_hond"); heartsAt($("#fx"), FV.dog.x, FV.dog.y - 70); });
    dogPlace();
  }
  $("#dayBtn").addEventListener("click", () => F.night ? wakeUp() : evening());
  gearHold($("#gearBtn"));
  if (F.night && F.animals.every(a => a.inStal)) sleepOverlay();
  if (F.babyDue && !F.night) fLater(babyTime, 1500);
}
const petScale = (a, p) => (0.56 + Math.max(0, Math.min(1, (p.y - MEADOW.y0) / (MEADOW.y1 - MEADOW.y0))) * 0.18) * (a.baby ? .65 : 1);
// plekje in de wei zo ver mogelijk van de andere dieren, zodat ze niet op een kluitje staan
function freeSpot(id) {
  const others = Object.entries(FV.pos).filter(([k]) => k !== id).flatMap(([, q]) => [[q.x, q.y], [q.tx, q.ty]]);
  let best = null, bestD = -1;
  for (let i = 0; i < 14; i++) {
    const x = rnd(MEADOW.x0, MEADOW.x1), y = rnd(MEADOW.y0, MEADOW.y1);
    const d = others.reduce((m, [ox, oy]) => Math.min(m, Math.hypot(ox - x, (oy - y) * 1.6)), 999);
    if (d > bestD) { bestD = d; best = [x, y]; }
  }
  return best;
}
function yardPlace() {
  F.animals.forEach(a => {
    const g = document.querySelector(`#herd .pet[data-id="${a.id}"]`), p = FV.pos[a.id];
    if (!g || !p) return;
    g.setAttribute("transform", `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) scale(${petScale(a, p).toFixed(3)})`);
    g.querySelector(".flip").setAttribute("transform", `scale(${p.dir} 1)`);
    const b = document.querySelector(`#bubs .needbub[data-id="${a.id}"]`);
    if (b) b.setAttribute("transform", `translate(${p.x.toFixed(1)} ${Math.max(58, p.y - (a.type === "paard" ? 100 : 82) * petScale(a, p) / .8).toFixed(1)})`);
  });
  // voorste dier bovenop, maar alleen herschikken als de volgorde echt verandert (anders mislukken tikken op de iPhone)
  const herd = $("#herd"); if (!herd) return;
  const kids = [...herd.children];
  const sorted = kids.slice().sort((a, b) => FV.pos[a.dataset.id].y - FV.pos[b.dataset.id].y);
  if (sorted.some((g, i) => g !== kids[i])) sorted.forEach(g => herd.appendChild(g));
}
function dogPlace() {
  const d = FV.dog, g = $("#dog"); if (!g || !d) return;
  const hop = d.hop > 0 ? Math.sin(d.hop * Math.PI) * 30 : 0;
  g.setAttribute("transform", `translate(${d.x.toFixed(1)} ${(d.y - hop).toFixed(1)}) scale(.62)`);
  g.querySelector(".dogflip").setAttribute("transform", `scale(${d.dir} 1)`);
}
function dogWalk() {
  const d = FV.dog; if (!d || !$("#dog")) return;
  if (d.hop > 0) { d.hop += .06; if (d.hop >= 1) d.hop = 0; }
  const dx = d.tx - d.x, dy = d.ty - d.y, dist = Math.hypot(dx, dy);
  if (dist < 2) { if (Math.random() < .03) { d.tx = rnd(MEADOW.x0, MEADOW.x1); d.ty = rnd(MEADOW.y0 + 10, MEADOW.y1); } }
  else { d.x += dx / dist * 1.8; d.y += dy / dist * 1; if (Math.abs(dx) > 2) d.dir = dx > 0 ? 1 : -1; }
  dogPlace();
}
function yardWalk() {
  if (F.owned.hond && !F.night) dogWalk();
  F.animals.forEach(a => {
    const p = FV.pos[a.id];
    if (!p || a.inStal || p.busy) return;
    const dx = p.tx - p.x, dy = p.ty - p.y, d = Math.hypot(dx, dy);
    if (d < 2) { if (Math.random() < .015) [p.tx, p.ty] = freeSpot(a.id); return; }
    p.x += dx / d * 0.9; p.y += dy / d * 0.5;
    if (Math.abs(dx) > 2) p.dir = dx > 0 ? 1 : -1;
  });
  // dieren die elkaar raken schuiven een stukje uit elkaar
  const free = F.animals.filter(a => !a.inStal && FV.pos[a.id] && !FV.pos[a.id].busy);
  for (let i = 0; i < free.length; i++) for (let j = i + 1; j < free.length; j++) {
    const p = FV.pos[free[i].id], q = FV.pos[free[j].id];
    const dx = q.x - p.x, dy = (q.y - p.y) * 1.6, d = Math.hypot(dx, dy);
    if (d < 72) {
      const push = (72 - d) * 0.05, ux = d ? dx / d : 1, uy = d ? dy / d : 0;
      p.x -= ux * push; q.x += ux * push; p.y -= uy * push * .6; q.y += uy * push * .6;
      [p, q].forEach(r => { r.x = Math.max(MEADOW.x0, Math.min(MEADOW.x1, r.x)); r.y = Math.max(MEADOW.y0, Math.min(MEADOW.y1, r.y)); });
    }
  }
  yardPlace();
}
// wolkjes met wat een dier nodig heeft: eigen laag boven alle dieren, zodat ze nooit achter een ander dier verdwijnen
function yardNeeds() {
  const bubs = $("#bubs"); if (!bubs) return;
  bubs.innerHTML = "";
  F.animals.forEach(a => {
    const pg = document.querySelector(`#herd .pet[data-id="${a.id}"]`);
    if (!pg) return;
    const k = minNeed(a), low = a.needs[k] < 50 && !F.night;
    const ready = !F.night && ((a.type === "koe" || a.type === "schaap") && !a.baby && a.prod >= 100);
    const icon = low ? NEED_ICON[k === "s" && a.type === "varken" ? "m" : k] : ready ? TOOL[a.type === "koe" ? "melk" : "schaar"] : "";
    const pet = pg.querySelector(".flip .animal"); if (pet) pet.classList.toggle("fine", moodCls(a) === "fine");
    if (!icon) return;
    const b = svgEl("needbub", `<g class="nbob"><path d="M0 4 l-8 -12 h16 z" fill="#fff" ${TH}/><rect x="-24" y="-54" width="48" height="48" rx="15" fill="#fff" ${ST}/><g transform="translate(-20 -50)">${icon.replace(/<\/?svg[^>]*>/g, "")}</g></g>`);
    b.dataset.id = a.id;
    b.addEventListener("pointerdown", e => { e.stopPropagation(); tapAnimal(a, pg); });
    bubs.appendChild(b);
  });
  yardPlace();
}
function tapAnimal(a, g) {
  unlockAudio();
  if (F.night) {
    const p = FV.pos[a.id];
    if (a.inStal || !p || p.toStal) return;
    p.busy = p.toStal = true; p.dir = -1;
    say("g_" + a.type);
    fAnim(1400, t => { p.x += (84 - p.x) * t * .25; p.y += (238 - p.y) * t * .25; yardPlace(); }, () => {
      a.inStal = true; fSave(); g.remove(); sfx.pop();
      if (F.animals.every(x => x.inStal)) { say("slapen"); fLater(sleepOverlay, 1200); }
    });
    return;
  }
  sfx.pop();
  g.classList.remove("bounce"); void g.getBBox(); g.classList.add("bounce");
  fLater(() => care(a), 350);
}

/* ---------- verzorgen ---------- */
function care(a) {
  const pig = a.type === "varken";
  const tools = ["voer", "water", pig ? "modder" : "borstel", "aai"];
  if (a.type === "koe" && !a.baby) tools.push("melk");
  if (a.type === "schaap" && !a.baby) tools.push("schaar");
  if (Object.values(F.accOwned).some(n => n > 0)) tools.push("kleding");
  const treat = () => TREATS.find(k => F.stock[k] > 0) || null;
  const hasTreat = () => !!treat();
  const sc = a.baby ? 1.5 : 2.2, ax = 300, ay = 318;
  const el = view("care", `
    <svg viewBox="0 0 ${W} ${H}" id="careSvg">
      <rect width="${W}" height="${H}" fill="#D7A86E"/>
      ${Array.from({ length: 9 }, (_, i) => `<path d="M0 ${i * 30} H${W}" stroke="#B98552" stroke-width="3"/>`).join("")}
      <rect y="250" width="${W}" height="125" fill="#FFE082"/>
      ${Array.from({ length: 40 }, (_, i) => `<path d="M${(i * 53) % W} ${260 + (i * 29) % 110} l12 -6" stroke="#E0A800" stroke-width="3" stroke-linecap="round"/>`).join("")}
      <g transform="translate(${ax} ${ay}) scale(${sc})" id="pet">
        <rect class="hit" x="-45" y="-95" width="110" height="100" fill="transparent"/>
        <g class="animal ${moodCls(a)} ${a.type === "schaap" && a.prod < 60 ? "kaal" : ""}" id="petBody">${animalArt(a)}</g>
        <g id="petSpots"></g><g id="petMud"></g>
        ${a.type === "koe" ? `<g id="udder"><ellipse cx="-4" cy="-22" rx="9" ry="6" fill="#F8BBD0" ${TH}/><path d="M-9 -17 v4 M-4 -16 v4 M1 -17 v4" stroke="#F48FB1" stroke-width="2.5" stroke-linecap="round"/></g>` : ""}
      </g>
      <g id="bucket"></g>
      <g id="cfx"></g>
    </svg>
    <div class="meters">${["h", "d", "s", "b"].map(k => `<div class="meter"><span class="mi">${NEED_ICON[k === "s" && pig ? "m" : k]}</span><span class="mbar"><i id="m_${k}"></i></span></div>`).join("")}</div>
    <div class="petname">${a.name}</div>
    <div class="tools">${tools.map(t => `<button class="btn tool" data-t="${t}" aria-label="${t}">${TOOL[t === "voer" ? (pig ? "appel" : "hooi") : t]}</button>`).join("")}
      <button class="btn tool" data-t="lekkers" id="treatBtn" aria-label="lekkers" ${hasTreat() ? "" : "hidden"}>${ico(ITEM[treat() || "wortel"])}</button></div>`);
  backBtn(el, () => { fSave(); yard(); });
  FV.care = { a, mode: null, feed: null, sc, ax, ay, rub: 0, milk: 0, aai: false };
  careMeters(); careSpots();
  const svg = $("#careSvg");
  el.querySelectorAll(".tool").forEach(b => b.addEventListener("click", () => careTool(b.dataset.t, b)));
  let down = false;
  const local = e => { const p = stagePoint(e); return { x: (p.x - ax) / sc, y: (p.y - ay) / sc, sx: p.x, sy: p.y }; };
  svg.addEventListener("pointerdown", e => { down = true; careRub(local(e), true); });
  svg.addEventListener("pointermove", e => { if (down) careRub(local(e), false); });
  if (FV.upH) window.removeEventListener("pointerup", FV.upH);
  FV.upH = () => { down = false; };
  window.addEventListener("pointerup", FV.upH);
  // welkom: noem de naam en wat het dier nodig heeft
  // eerst het dierengeluid helemaal laten horen, dan de naam en wat het dier nodig heeft
  const k = minNeed(a);
  fsay("g_" + a.type, () => {
    if (a.needs[k] < 60) sayA(a, needLine(a, k));
    else if (a.type === "koe" && !a.baby && a.prod >= 100) fsay("melk_klaar");
    else if (a.type === "schaap" && !a.baby && a.prod >= 100) fsay("wol_klaar");
    else sayA(a, "b_blij");
  });
}
function careMeters() {
  const a = FV.care && FV.care.a;
  if (!a) return;
  const pb = $("#petBody"); if (pb) pb.classList.toggle("fine", moodCls(a) === "fine");
  ["h", "d", "s", "b"].forEach(k => {
    const i = $("#m_" + k); if (!i) return;
    const v = a.needs[k];
    i.style.width = v + "%";
    i.style.background = v > 60 ? "#22C55E" : v > 35 ? "#FFB300" : "#FF5252";
  });
}
function careSpots() {
  const c = FV.care, a = c.a, g = $("#petSpots");
  if (a.type === "varken") return;
  const n = Math.max(0, Math.min(5, Math.round((100 - a.needs.s) / 18)));
  g.innerHTML = SPOTS.slice(0, n).map(([x, y], i) => `<ellipse class="spot" data-i="${i}" cx="${x}" cy="${y}" rx="6" ry="4" fill="#795548" opacity=".85"/>`).join("");
}
function careFx() { return $("#cfx"); }
function careHearts(n = 3) { const c = FV.care; heartsAt(careFx(), c.ax + 20, c.ay - 150 * (c.sc / 2.2)); }
function careTool(t, btn) {
  unlockAudio();
  const c = FV.care, a = c.a;
  document.querySelectorAll(".tool").forEach(b => b.classList.toggle("on", b === btn && ["borstel", "aai", "melk", "schaar"].includes(t)));
  c.mode = null;
  const mouth = MOUTH[a.type] || [20, -40];
  const mx = c.ax + mouth[0] * c.sc, my = c.ay + mouth[1] * c.sc;
  const svg = $("#careSvg");
  if (t === "voer") {
    if (a.needs.h >= 92) { sayA(a, "b_vol"); return; }
    let first = false;
    if (!c.feed) {   // eerste tik: vertellen hoeveel happen, en meteen de eerste hap geven
      const p = Math.max(1, Math.min(3, Math.ceil((100 - a.needs.h) / 34)));
      c.feed = { left: p, i: 0 }; first = true;
    }
    c.feed.i++; c.feed.left--;
    const inner = `<g transform="translate(-20 -20)">${a.type === "varken" ? FOODS.appel.svg : TOOL.hooi.replace(/<\/?svg[^>]*>/g, "")}</g>`;
    flyTo(svg, inner, 600, 150, mx, my, 600, () => { sfx.pop(); }, 1);
    a.needs.h = Math.min(100, a.needs.h + 34);
    const last = c.feed.left <= 0 || a.needs.h >= 100;
    if (first && !last) sayA(a, "hap" + (c.feed.left + 1));
    else if (!first) say("n" + c.feed.i);
    if (last) { c.feed = null; fLater(() => { fsay("smikkel"); careHearts(); }, first ? 700 : 900); }
    careMeters(); fSave();
    return;
  }
  if (t === "water") {
    if (a.needs.d >= 92) { sayA(a, "b_vol"); return; }
    const inner = `<g transform="translate(-20 -20)">${TOOL.water.replace(/<\/?svg[^>]*>/g, "")}</g>`;
    flyTo(svg, inner, 600, 200, mx - 10, my + 10, 700, () => {
      sfx.splash(); a.needs.d = 100; careMeters(); fSave(); say("drinken");
      sparkleAt(careFx(), mx, my, false, ["#29B6F6", "#E1F5FE", "#fff"]);
    }, 1.2);
    return;
  }
  if (t === "modder") {
    const g = $("#petMud");
    g.innerHTML = [[-12, -30], [6, -24], [-4, -38], [14, -32], [-20, -22]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="5" fill="#6D4C41" opacity=".9"/>`).join("");
    sfx.splash(); a.needs.s = 100; a.needs.b = Math.min(100, a.needs.b + 15); careMeters(); fSave();
    say("modder_klaar"); careHearts();
    return;
  }
  if (t === "lekkers") {
    const crop = TREATS.find(k => F.stock[k] > 0);
    if (!crop) return;
    F.stock[crop]--;
    flyTo(svg, `<g transform="translate(-20 -20)">${ITEM[crop]}</g>`, 600, 150, mx, my, 600, () => {
      sfx.sparkle(); a.needs.b = Math.min(100, a.needs.b + 30); a.needs.h = Math.min(100, a.needs.h + 15);
      careMeters(); fSave(); say("lekkers"); careHearts();
      const tb = $("#treatBtn");
      const nx = TREATS.find(k => F.stock[k] > 0);
      if (!nx) tb.hidden = true; else tb.innerHTML = ico(ITEM[nx]);
    });
    return;
  }
  if (t === "borstel") {
    if (!$("#petSpots").children.length) { say("borstel_klaar"); sparkleAt(careFx(), c.ax, c.ay - 80, true, ["#FFD600", "#fff"]); a.needs.s = 100; careMeters(); fSave(); return; }
    c.mode = "borstel"; sayA(a, "b_vies"); return;
  }
  if (t === "aai") { c.mode = "aai"; c.rub = 0; return; }
  if (t === "kleding") {   // wisselen: niets → hoedje → strik → … (alleen wat je hebt en niet door een ander dier gedragen wordt)
    const worn = k => F.animals.filter(x => x !== a && F.acc[x.id] === k).length;
    const opts = [null, ...Object.keys(ACC).filter(k => (F.accOwned[k] || 0) - worn(k) > 0)];
    const cur = opts.indexOf(F.acc[a.id] || null);
    const nx = opts[(cur + 1) % opts.length];
    if (nx) F.acc[a.id] = nx; else delete F.acc[a.id];
    fSave();
    const pb = $("#petBody"); if (pb) pb.innerHTML = animalArt(a);
    careSpots();
    if (nx) { sfx.sparkle(); careHearts(); fsay("kleding"); } else sfx.whoosh();
    return;
  }
  if (t === "melk") {
    if (a.prod < 100) { say("melk_nog"); return; }
    c.mode = "melk"; c.milk = 0;
    $("#bucket").innerHTML = `<g transform="translate(${c.ax - 30} ${c.ay - 2})"><path d="M0 0 H40 L36 -34 H4 Z" transform="scale(1 -1) translate(0 -34)" fill="#B0BEC5" ${ST}/><rect id="milkLvl" x="5" y="30" width="30" height="0" fill="#fff"/></g>`;
    say("melk_klaar");
    return;
  }
  if (t === "schaar") {
    if (a.prod < 100) { say("wol_nog"); return; }
    c.mode = "schaar"; c.puffs = WOOL.length;
    say("wol_klaar");
  }
}
function careRub(p, isDown) {
  const c = FV.care; if (!c || !c.mode) return;
  const a = c.a;
  const inside = p.x > -45 && p.x < 65 && p.y > -95 && p.y < 5;
  if (c.mode === "borstel") {
    const spot = [...document.querySelectorAll("#petSpots .spot")].find(s => Math.hypot(+s.getAttribute("cx") - p.x, +s.getAttribute("cy") - p.y) < 14);
    if (spot) {
      spot.remove(); sfx.pop();
      sparkleAt(careFx(), p.sx, p.sy, false, ["#fff", "#FFD600"]);
      const left = $("#petSpots").children.length;
      a.needs.s = left ? Math.min(99, 100 - left * 18) : 100; careMeters(); fSave();
      if (!left) { c.mode = null; document.querySelectorAll(".tool").forEach(b => b.classList.remove("on")); say("borstel_klaar"); sparkleAt(careFx(), c.ax, c.ay - 80, true, ["#FFD600", "#fff"]); }
    }
    return;
  }
  if (c.mode === "aai" && inside) {
    c.rub += isDown ? 6 : 2.2;
    if (c.rub > 12) {
      c.rub = 0;
      heartsAt(careFx(), p.sx, p.sy - 10);
      a.needs.b = Math.min(100, a.needs.b + 6); careMeters(); fSave();
      if (a.needs.b >= 100 && !c.aai) { c.aai = true; fsay("g_" + a.type, () => fsay("aai_klaar")); }
    }
    return;
  }
  if (c.mode === "melk" && Math.hypot(p.x + 4, p.y + 20) < 16 && isDown) {
    c.milk++;
    tone(900 + c.milk * 40, 0.08, "sine", 0.12, 0, 1400);
    const lvl = $("#milkLvl"); if (lvl) { const h = c.milk * 5; lvl.setAttribute("height", h); lvl.setAttribute("y", 30 - h); }
    if (c.milk >= 6) {
      c.mode = null; a.prod = 0; F.stock.melk += F.owned.melkmachine ? 2 : 1; fSave();
      document.querySelectorAll(".tool").forEach(b => b.classList.remove("on"));
      say("melk_vol"); confetti(30); sfx.sparkle();
      fLater(() => { $("#bucket").innerHTML = ""; }, 2500);
    }
    return;
  }
  if (c.mode === "schaar" && inside) {
    const puffs = [...document.querySelectorAll("#petBody .wool circle")];
    let cut = false;
    WOOL.forEach(([x, y, r], i) => {
      if (Math.hypot(x - p.x, y - p.y) < r + 6) {
        [puffs[i], puffs[i + WOOL.length]].forEach(pf => { if (pf && pf.style.display !== "none") { pf.style.display = "none"; cut = true; } });
      }
    });
    if (cut) {
      tone(2200, 0.05, "square", 0.05); sparkleAt(careFx(), p.sx, p.sy, false, ["#fff", "#EEEEEE"]);
      const left = puffs.slice(0, WOOL.length).filter(pf => pf.style.display !== "none").length;
      if (!left) {
        c.mode = null; a.prod = 0; F.stock.wol++; fSave();
        $("#petBody").classList.add("kaal"); puffs.forEach(pf => { pf.style.display = ""; });
        document.querySelectorAll(".tool").forEach(b => b.classList.remove("on"));
        say("wol_vol"); confetti(30); sfx.sparkle();
      }
    }
  }
}

/* ---------- kippenhok ---------- */
function coop() {
  fDecay();
  const el = view("coop", `
    <svg viewBox="0 0 ${W} ${H}" id="coopSvg">
      <rect width="${W}" height="${H}" fill="#FFCC80"/>
      ${Array.from({ length: 8 }, (_, i) => `<path d="M${i * 90} 0 V240" stroke="#E6A15C" stroke-width="4"/>`).join("")}
      <rect y="220" width="${W}" height="155" fill="#FFE082"/>
      ${Array.from({ length: 50 }, (_, i) => `<path d="M${(i * 41) % W} ${230 + (i * 37) % 140} l14 -5" stroke="#E0A800" stroke-width="3" stroke-linecap="round"/>`).join("")}
      <g id="hens">${[[180, 240, 1.5], [330, 250, 1.6], [470, 236, 1.4]].map(([x, y, s], i) => `<g transform="translate(${x} ${y}) scale(${s})"><g class="animal fine ${i % 2 ? "peck2" : "peck"}">${ANIMALS.kip}</g></g>`).join("")}</g>
      <g id="eggs"></g>
      <g transform="translate(560 320)"><path d="M-44 -30 H44 L34 20 H-34 Z" fill="#A1887F" ${ST}/><path d="M-40 -30 q40 -40 80 0" fill="none" stroke="#795548" stroke-width="5"/><text id="basketN" x="0" y="8" text-anchor="middle" font-family="Baloo 2, Arial Rounded MT Bold, sans-serif" font-weight="800" font-size="26" fill="#fff">${F.stock.ei}</text></g>
      <g id="cfx"></g>
    </svg>
    <div class="tools"><button class="btn tool" id="graanBtn" aria-label="graan">${TOOL.graan}</button></div>`);
  backBtn(el, () => { fSave(); yard(); });
  coinBox(el);
  const spots = [[120, 300], [250, 330], [400, 310], [300, 280], [200, 350], [460, 345], [80, 350], [350, 350], [170, 270], [440, 275]];
  const draw = () => {
    $("#eggs").innerHTML = spots.slice(0, F.eggs).map(([x, y], i) => `<g class="egg" data-i="${i}" transform="translate(${x} ${y})"><rect x="-34" y="-40" width="68" height="68" fill="transparent"/><ellipse rx="13" ry="17" fill="#FFF3E0" ${ST}/></g>`).join("");
    $("#eggs").querySelectorAll(".egg").forEach(g => g.addEventListener("pointerdown", e => {
      e.stopPropagation(); if (g.dataset.gone) return; g.dataset.gone = 1;
      const [x, y] = spots[+g.dataset.i];
      g.remove(); F.eggs--; F.stock.ei++; FV.eggCount = (FV.eggCount || 0) + 1; fSave();
      say("n" + Math.min(20, FV.eggCount));
      flyTo($("#coopSvg"), `<ellipse rx="11" ry="14" fill="#FFF3E0" ${ST}/>`, x, y, 560, 300, 600, () => { sfx.pop(); $("#basketN").textContent = F.stock.ei; if (!F.eggs) fLater(() => say("ei_klaar"), 700); });
    }));
  };
  FV.eggCount = 0;
  const graanBadge = () => { const b = $("#graanBtn"); if (!b) return; let n = b.querySelector(".cnt"); if (!n) { n = document.createElement("span"); n.className = "cnt"; b.appendChild(n); } n.textContent = F.stock.graan || ""; n.hidden = !F.stock.graan; };
  graanBadge();
  draw();
  $("#graanBtn").addEventListener("click", () => {
    unlockAudio();
    for (let i = 0; i < 10; i++) sparkleAt($("#cfx"), rnd(150, 500), rnd(260, 330), false, ["#FFB300", "#FFD54F"]);
    document.querySelectorAll("#hens .animal").forEach(h => { h.classList.remove("bounce"); void h.getBBox(); h.classList.add("bounce"); });
    const now = Date.now();
    // graan werkt altijd: de kippen leggen 1 of 2 eieren; daarna even 20 seconden 'vol'
    if (F.eggs >= eggMax()) { fsay("ei_zoek"); return; }
    if (F.stock.graan > 0) {   // eigen graan van de akker: altijd 2 extra eieren
      F.stock.graan--; F.fedT = now; fSave(); graanBadge();
      fsay("ei_graan");
      fLater(() => { F.eggs = Math.min(eggMax(), F.eggs + (F.owned.kippenluik ? 3 : 2)); fSave(); draw(); sfx.pop(); }, 1800);
      return;
    }
    if (F.fedT && now - F.fedT < 20 * 1000) { fsay("kip_vol"); return; }
    F.fedT = now; fSave();
    fsay("kip_eten");
    fLater(() => { F.eggs = Math.min(eggMax(), F.eggs + (Math.random() < .5 ? 1 : 2) + (F.owned.kippenluik ? 1 : 0)); fSave(); draw(); sfx.pop(); fsay("ei_zoek"); }, 1800);
  });
  say(F.eggs ? "ei_zoek" : "ei_geen");
}

/* ---------- moestuin ---------- */
function garden() {
  const el = view("garden", `
    <svg viewBox="0 0 ${W} ${H}" id="gardenSvg">
      <rect width="${W}" height="${H}" fill="#29B6F6"/>
      <circle cx="610" cy="48" r="26" fill="${C.hub}" ${ST}/>
      <rect y="90" width="${W}" height="285" fill="#8BC34A" ${ST}/>
      <g id="plots"></g><g id="cfx"></g>
    </svg>
    <div class="tools">${["wortel", "sla", "aardbei"].map(c => `<button class="btn tool" data-t="${c}" aria-label="${c}">${ico(`<rect x="6" y="6" width="28" height="30" rx="4" fill="#FFF8E1" ${TH}/><g transform="translate(8 8) scale(.6)">${CROP[c]}</g>`)}</button>`).join("")}
      <button class="btn tool" data-t="gieter" aria-label="gieter">${TOOL.gieter}</button></div>`);
  backBtn(el, () => { fSave(); yard(); });
  coinBox(el);
  FV.gtool = null;
  el.querySelectorAll(".tool").forEach(b => b.addEventListener("click", () => {
    FV.gtool = b.dataset.t;
    el.querySelectorAll(".tool").forEach(x => x.classList.toggle("on", x === b));
    sfx.pop();
  }));
  gardenDraw();
  FV.gT = setInterval(() => { if (FV && FV.view === "garden") gardenDraw(); }, 5000);
  FV.walkT = FV.gT;
  say("tuin_welkom");
}
function plotXY(i) { return [70 + (i % 3) * 150, 120 + Math.floor(i / 3) * 110]; }
function gardenDraw() {
  const g = $("#plots"); if (!g) return;
  g.innerHTML = F.plots.map((p, i) => {
    const [x, y] = plotXY(i);
    let inner = "";
    const ripe = p && p.w && Date.now() - p.w >= GROW;
    if (p && ripe) inner = [0, 1, 2].map(k => `<g class="ripe" transform="translate(${x + 14 + k * 38} ${y + 18})">${CROP[p.crop]}</g>`).join("");
    else if (p) {
      const prog = p.w ? Math.min(1, (Date.now() - p.w) / GROW) : 0;
      inner = [0, 1, 2].map(k => {
        const cx = x + 34 + k * 38, h = 6 + prog * 26;
        return `<path d="M${cx} ${y + 70} v-${h}" stroke="#2E7D32" stroke-width="4" stroke-linecap="round"/><ellipse cx="${cx - 6}" cy="${y + 70 - h}" rx="${4 + prog * 6}" ry="${3 + prog * 3}" fill="#66BB6A" ${TH}/><ellipse cx="${cx + 6}" cy="${y + 70 - h + 2}" rx="${4 + prog * 6}" ry="${3 + prog * 3}" fill="#66BB6A" ${TH}/>`;
      }).join("") + (p.w ? "" : `<g transform="translate(${x + 118} ${y + 6}) scale(.7)">${TOOL.gieter.replace(/<\/?svg[^>]*>/g, "")}</g>`);
    }
    return `<g class="plot" data-i="${i}"><rect x="${x}" y="${y}" width="130" height="90" rx="10" fill="${p && p.w ? "#5D4037" : "#8D6E63"}" ${ST}/>
      ${[20, 45, 70].map(o => `<path d="M${x + 10} ${y + o} H${x + 120}" stroke="${p && p.w ? "#4E342E" : "#795548"}" stroke-width="3"/>`).join("")}${inner}</g>`;
  }).join("");
  g.querySelectorAll(".plot").forEach(pg => pg.addEventListener("click", () => plotTap(+pg.dataset.i)));
}
function plotTap(i) {
  unlockAudio();
  const p = F.plots[i], t = FV.gtool, [x, y] = plotXY(i);
  if (p && p.w && Date.now() - p.w >= GROW) {
    F.stock[p.crop] += 3; F.plots[i] = null; fSave();
    [0, 1, 2].forEach(k => fLater(() => { say("n" + (k + 1)); sfx.pop(); }, k * 450));
    sparkleAt($("#cfx"), x + 65, y + 40, true, ["#FFD600", "#fff", "#FF4081"]);
    fLater(() => say("oogst"), 1500);
    gardenDraw(); return;
  }
  if (!p && ["wortel", "sla", "aardbei"].includes(t)) {
    F.plots[i] = { crop: t, planted: Date.now(), w: F.owned.sproeier ? Date.now() : 0 }; fSave(); sfx.pop();
    if (F.owned.sproeier) { for (let k = 0; k < 4; k++) sparkleAt($("#cfx"), x + 20 + k * 30, y + 40, false, ["#29B6F6", "#E1F5FE"]); gardenDraw(); fsay("tuin_groeit"); return; }
    gardenDraw(); say("tuin_water"); return;
  }
  if (p && !p.w && t === "gieter") {
    p.w = Date.now(); fSave(); sfx.splash();
    for (let k = 0; k < 4; k++) sparkleAt($("#cfx"), x + 20 + k * 30, y + 40, false, ["#29B6F6", "#E1F5FE"]);
    gardenDraw(); say("tuin_groeit"); return;
  }
  if (p && !p.w) { say("tuin_water"); return; }
  if (p) { say("tuin_groeit"); return; }
  say("tuin_welkom");
}

/* ---------- markt ---------- */
function market() {
  const types = ["koe", "paard", "varken", "schaap"];
  const el = view("market", `
    <div class="farmbg market"></div>
    <div class="stall">${Object.keys(PRICE_SELL).map(k => `<button class="sellbtn" data-k="${k}" aria-label="${k}"><span class="si">${ico(ITEM[k])}</span><span class="sn" id="st_${k}">${F.stock[k]}</span><span class="sp">${PRICE_SELL[k]} ${COIN}</span></button>`).join("")}</div>
    <div class="shop">${types.map(t => `<button class="buybtn" data-t="${t}" aria-label="${t}">${animalCard(t, .8)}<span class="sp">${PRICE_BUY[t]} ${COIN}</span></button>`).join("")}</div>
    <button class="btn movebtn" id="moveBtn" aria-label="Dier verhuizen"><svg viewBox="0 -70 150 80">${TRUCK}</svg></button>
    <svg viewBox="0 0 ${W} ${H}" class="marketfx" id="mktSvg"></svg>`);
  backBtn(el, () => { fSave(); yard(); });
  $("#moveBtn").addEventListener("click", () => { unlockAudio(); sfx.honk(); moveView(); });
  coinBox(el);
  const refresh = () => {
    Object.keys(PRICE_SELL).forEach(k => { $("#st_" + k).textContent = F.stock[k]; el.querySelector(`.sellbtn[data-k="${k}"]`).classList.toggle("empty", !F.stock[k]); });
    el.querySelectorAll(".buybtn").forEach(b => b.classList.toggle("afford", F.coins >= PRICE_BUY[b.dataset.t]));
  };
  refresh();
  let busy = false;
  el.querySelectorAll(".sellbtn").forEach(b => b.addEventListener("click", () => {
    unlockAudio();
    const k = b.dataset.k;
    if (busy) return;
    if (!F.stock[k]) { if (Object.values(F.stock).every(v => !v)) say("niks_verkopen"); else sfx.whoosh(); return; }
    busy = true;
    F.stock[k]--; fSave(); refresh();
    const r = b.getBoundingClientRect(), st = stage.getBoundingClientRect(), s = st.width / W;
    const x0 = (r.left + r.width / 2 - st.left) / s, y0 = (r.top + r.height / 2 - st.top) / s;
    const n = PRICE_SELL[k];
    say("verkocht");
    const show = bank(n);
    fLater(() => { if (busy) { busy = false; refresh(); } }, 600 + n * 700 + 1500);
    for (let i = 0; i < n; i++) fLater(() => {
      flyTo($("#mktSvg"), `<circle r="10" fill="#FFC107" ${TH}/>`, x0, y0, 620, 34, 600, () => {
        show(i + 1); tone(1320, .08, "square", .06); say("n" + Math.min(20, i + 1));
        const cb = $("#coinBox"); cb.classList.remove("pop"); void cb.offsetWidth; cb.classList.add("pop");
        if (i === n - 1) { busy = false; refresh(); }
      });
    }, 600 + i * 700);
  }));
  el.querySelectorAll(".buybtn").forEach(b => b.addEventListener("click", () => {
    unlockAudio();
    const t = b.dataset.t;
    if (F.animals.length >= maxAnimals()) { say("vol_boerderij"); return; }
    if (F.coins < PRICE_BUY[t]) { say("te_weinig"); b.classList.remove("wrong"); void b.offsetWidth; b.classList.add("wrong"); return; }
    F.coins -= PRICE_BUY[t]; fSave(); sfx.fanfare();
    say("g_" + t);
    pickName(t, false, a => { yard(); fLater(() => fsay("gekocht", () => fsay(nameClip(a))), 500); },
      () => { F.coins += PRICE_BUY[t]; fSave(); market(); });
  }));
  fsay("markt_welkom", () => fsay("winkel_welkom"));
}

/* ---------- akker: ploegen, zaaien en oogsten met de tractor ---------- */
const ROW_TOP = [96, 186, 276], ROW_H = 78, ROW_X0 = 34, ROW_X1 = 634;
const binW = (ROW_X1 - ROW_X0) / BINS;
function field() {
  fDecay();
  const el = view("field", `
    <svg viewBox="0 0 ${W} ${H}" id="fieldSvg">
      <rect width="${W}" height="${H}" fill="#29B6F6"/>
      <circle cx="560" cy="44" r="24" fill="${C.hub}" ${ST}/>
      <path d="M0 90 Q140 60 300 84 T${W} 80 V${H} H0 Z" fill="#9CCC65" ${ST}/>
      <g id="rows"></g>
      <g id="trac" transform="translate(120 ${ROW_TOP[0] + 70})"><g id="tracFlip" transform="scale(.5 .5)">${tractorArt()}</g></g>
      <g id="cfx"></g>
    </svg>
    <div class="seedbar">${Object.keys(FIELD_YIELD).map(c => `<button class="btn tool seed" data-c="${c}" aria-label="${c}">${ico(ITEM[c])}</button>`).join("")}</div>`);
  backBtn(el, () => { fSave(); yard(); });
  coinBox(el);
  FV.fd = { row: 0, x: 120, tx: 120, dir: 1, down: false, seed: null, sayT: 0, got: 0, rum: 0 };
  el.querySelectorAll(".seed").forEach(b => b.addEventListener("click", () => {
    unlockAudio();
    FV.fd.seed = b.dataset.c;
    el.querySelectorAll(".seed").forEach(x => x.classList.toggle("on", x === b));
    sfx.pop(); fsay("z_" + b.dataset.c, () => { if (F.field.some(r => r.st === "geploegd")) fsay("akker_zaaien"); });
  }));
  const svg = $("#fieldSvg");
  const rowAt = y => { let best = 0; ROW_TOP.forEach((t, i) => { if (Math.abs(y - (t + ROW_H / 2)) < Math.abs(y - (ROW_TOP[best] + ROW_H / 2))) best = i; }); return best; };
  svg.addEventListener("pointerdown", e => {
    unlockAudio();
    const p = stagePoint(e), fd = FV.fd;
    if (p.y < 80) return;
    const r = rowAt(p.y);
    if (r !== fd.row) { fd.row = r; fd.x = Math.max(60, Math.min(610, p.x)); }   // naar een andere strook: tractor rijdt daarheen
    fd.tx = Math.max(60, Math.min(610, p.x)); fd.down = true;
    fieldHint(r, true);
  });
  svg.addEventListener("pointermove", e => { if (FV.fd && FV.fd.down) { const p = stagePoint(e); FV.fd.tx = Math.max(60, Math.min(610, p.x)); } });
  if (FV.upH) window.removeEventListener("pointerup", FV.upH);
  FV.upH = () => { if (FV && FV.fd) FV.fd.down = false; };
  window.addEventListener("pointerup", FV.upH);
  fieldDraw(); fieldTrac();
  FV.walkT = setInterval(fieldTick, 33);
  let grow = 0;
  FV.growCheck = () => { if (++grow % 150 === 0) { fDecay(); fieldDraw(); } };
  fsay("akker_welkom", () => { const r = F.field.findIndex(x => x.st === "rijp"); if (r >= 0) fsay("akker_rijp"); else if (F.field.every(x => x.st === "gras")) fsay("akker_ploeg"); });
}
function fieldHint(r, tap) {
  const fd = FV.fd, row = F.field[r], now = Date.now();
  if (now - fd.sayT < 4000) return;
  if (row.st === "geploegd" && !fd.seed) { fd.sayT = now; fsay("akker_zaai"); document.querySelectorAll(".seed").forEach(b => { b.classList.remove("wrong"); void b.offsetWidth; b.classList.add("wrong"); }); }
  else if (row.st === "gezaaid") { fd.sayT = now; fsay("akker_groeit"); }
  else if (tap && row.st === "gras" && F.field.every(x => x.st === "gras")) { fd.sayT = now; fsay("akker_ploeg"); }
}
function fieldTrac() {
  const fd = FV.fd, t = $("#trac"); if (!t) return;
  t.setAttribute("transform", `translate(${fd.x.toFixed(1)} ${ROW_TOP[fd.row] + 74})`);
  $("#tracFlip").setAttribute("transform", `scale(${(fd.dir * .5).toFixed(2)} .5)`);
}
function fieldTick() {
  if (!FV || FV.view !== "field") return;
  FV.growCheck();
  const fd = FV.fd, dx = fd.tx - fd.x;
  if (Math.abs(dx) < 1) return;
  const step = Math.sign(dx) * Math.min(Math.abs(dx), 9);
  const x0 = fd.x; fd.x += step; fd.dir = step > 0 ? 1 : -1;
  if (++fd.rum % 5 === 0) tone(70 + Math.random() * 20, 0.09, "sawtooth", 0.05);
  fieldTrac();
  // het werktuig zit achter de tractor
  const back = fd.x - fd.dir * 52, a = Math.min(back, x0 - fd.dir * 52) - 14, b = Math.max(back, x0 - fd.dir * 52) + 14;
  const row = F.field[fd.row];
  let changed = false;
  for (let i = 0; i < BINS; i++) {
    const cx = ROW_X0 + (i + .5) * binW;
    if (cx < a || cx > b) continue;
    if (row.st === "gras" && !row.bins[i]) { row.bins[i] = 1; changed = true; if (Math.random() < .5) sparkleAt($("#cfx"), cx, ROW_TOP[fd.row] + 60, false, ["#8D6E63", "#6D4C41"]); }
    else if (row.st === "geploegd" && fd.seed && !row.bins[i]) { row.bins[i] = 1; row.crop = fd.seed; changed = true; }
    else if (row.st === "rijp" && !row.bins[i]) { row.bins[i] = 1; changed = true; harvestBin(fd.row, i, cx); }
  }
  if (row.st === "geploegd" && !fd.seed) fieldHint(fd.row);
  if (row.st === "gezaaid") fieldHint(fd.row);
  if (!changed) return;
  const done = row.bins.filter(Boolean).length >= BINS;
  if (done && row.st === "gras") { row.st = "geploegd"; row.bins = Array(BINS).fill(0); sfx.sparkle(); fsay("akker_geploegd"); }
  else if (done && row.st === "geploegd") { row.st = "gezaaid"; row.t = Date.now(); row.bins = Array(BINS).fill(0); sfx.sparkle(); fsay("akker_gezaaid"); }
  else if (done && row.st === "rijp") {
    F.grown[row.crop] = 1;
    F.field[fd.row] = newRow(); fd.got = 0;
    confetti(40); sfx.fanfare(); fLater(() => fsay("akker_oogst"), 900);
  }
  fSave(); fieldDraw();
}
function harvestBin(r, i, cx) {
  const row = F.field[r], n = FIELD_YIELD[row.crop];
  const done = row.bins.filter(Boolean).length;
  // na elk stukje oogst kijken of er weer een hele zak/kolf/pompoen bij komt
  const before = Math.floor((done - 1) * n / BINS), after = Math.floor(done * n / BINS);
  if (after > before) {
    const mult = F.owned.dorser ? 2 : 1;   // maaidorser: dubbele oogst
    F.stock[row.crop] += mult; FV.fd.got += mult;
    const c = FV.fd.got;
    flyTo($("#fieldSvg"), `<g transform="translate(-20 -20)">${ITEM[row.crop]}</g>`, cx, ROW_TOP[r] + 30, 600, 30, 700, () => {
      sfx.pop(); const cb = $("#coinBox"); if (cb) { cb.classList.remove("pop"); void cb.offsetWidth; cb.classList.add("pop"); }
    }, 1.1);
    say("n" + Math.min(20, c));
  }
}
function fieldDraw() {
  const g = $("#rows"); if (!g) return;
  g.innerHTML = F.field.map((row, r) => {
    const y = ROW_TOP[r], plowed = row.st !== "gras";
    let s = `<rect x="${ROW_X0}" y="${y}" width="${ROW_X1 - ROW_X0}" height="${ROW_H}" rx="12" fill="${plowed ? "#6D4C41" : "#7CB342"}" ${ST}/>`;
    for (let i = 0; i < BINS; i++) {
      const x = ROW_X0 + i * binW, cx = x + binW / 2, b = row.bins[i];
      if (row.st === "gras") {
        s += b ? `<rect x="${x + 1}" y="${y + 3}" width="${binW - 2}" height="${ROW_H - 6}" fill="#6D4C41"/>${[20, 40, 60].map(o => `<path d="M${x + 3} ${y + o} h${binW - 6}" stroke="#4E342E" stroke-width="3"/>`).join("")}`
          : `<path d="M${cx - 10} ${y + 50} l3 -10 l3 10 M${cx + 4} ${y + 30} l3 -9 l3 9" stroke="#558B2F" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      } else {
        s += [20, 40, 60].map(o => `<path d="M${x + 3} ${y + o} h${binW - 6}" stroke="#4E342E" stroke-width="3"/>`).join("");
        if (row.st === "geploegd" && b) s += [[-8, 22], [6, 42], [-4, 62]].map(([dx, dy]) => `<ellipse cx="${cx + dx}" cy="${y + dy}" rx="2.6" ry="1.8" fill="#FFE082"/>`).join("");
        if (row.st === "gezaaid") {
          const prog = Math.min(1, (Date.now() - row.t) / FIELD_GROW), h = 6 + prog * 22;
          s += `<path d="M${cx} ${y + 66} v-${h}" stroke="#2E7D32" stroke-width="4" stroke-linecap="round"/><ellipse cx="${cx - 5}" cy="${y + 66 - h}" rx="${3 + prog * 5}" ry="${2 + prog * 3}" fill="#66BB6A" ${TH}/><ellipse cx="${cx + 5}" cy="${y + 68 - h}" rx="${3 + prog * 5}" ry="${2 + prog * 3}" fill="#66BB6A" ${TH}/>`;
        }
        if (row.st === "rijp" && !b) s += `<g transform="translate(${cx - 20} ${y + 16}) scale(1)">${ITEM[row.crop]}</g>`;
      }
    }
    return s;
  }).join("");
}

/* ---------- klanten met een bestelling (tellen!) ---------- */
function makeOrder() {
  // niveau groeit mee: 1 soort (3-10) → 2 soorten (3-10) → 2 soorten (5-15) → 3 soorten (5-20)
  const lvl = F.ordersDone < 2 ? 0 : F.ordersDone < 5 ? 1 : F.ordersDone < 10 ? 2 : 3;
  const types = new Set(F.animals.map(a => a.type));
  let avail = ["ei", "wortel", "sla", "aardbei"];
  if (types.has("koe")) avail.push("melk");
  if (types.has("schaap")) avail.push("wol");
  avail = avail.concat(Object.keys(F.grown || {}));
  if (F.owned.boomgaard) avail.push("appel");
  if (F.owned.bijen) avail.push("honing");
  const inStock = avail.filter(k => F.stock[k] > 0);
  const pickKind = ex => { const pool = (Math.random() < .6 ? inStock : avail).filter(k => !ex.includes(k)); return pick(pool.length ? pool : avail.filter(k => !ex.includes(k))); };
  const want = {}, kinds = Math.min(avail.length, [1, 2, 2, 3][lvl]);
  const [lo, hi] = [[3, 10], [3, 10], [5, 15], [5, 20]][lvl];
  for (let i = 0; i < kinds; i++) {
    const k = pickKind(Object.keys(want));
    let n = lo + Math.floor(Math.random() * (hi - lo + 1));
    if (F.stock[k] > 0) n = Math.min(n, F.stock[k] + 5);   // haalbaar houden met wat er al is
    want[k] = Math.max(1, Math.min(20, n));
  }
  const got = {}; for (const k in want) got[k] = 0;
  F.order = { who: pick(CUSTOMERS), want, got, told: false };
  fSave();
}
function yardCustomer() {
  const g = $("#klant"); if (!g) return;
  if (!F.order && !F.night && F.animals.length && Date.now() >= F.nextOrderT) makeOrder();
  if (!F.order || F.night) { g.innerHTML = ""; return; }
  const o = F.order, k = Object.keys(o.want)[0];
  g.innerHTML = `<g class="tap" id="klantTap"><rect x="400" y="120" width="90" height="100" fill="transparent"/>
    <g transform="translate(440 214) scale(.62)"><g class="animal fine">${ANIMALS[o.who]}</g></g>
    <g class="needbub" transform="translate(452 150)"><g class="nbob"><path d="M0 4 l-8 -12 h16 z" fill="#fff" ${TH}/><rect x="-22" y="-50" width="44" height="44" rx="14" fill="#FFF8E1" ${ST}/><g transform="translate(-18 -46) scale(.9)">${ITEM[k]}</g></g></g></g>`;
  $("#klantTap").addEventListener("click", e => { e.stopPropagation(); sfx.pop(); orderView(); });
  if (!o.told) { o.told = true; fSave(); fLater(() => fsay("klant_komt"), 2500); }
}
const ORDER_KEYS = Object.keys(PRICE_SELL);
function sayOrder() {
  const o = F.order; if (!o) return;
  const ks = Object.keys(o.want);
  const next = i => { if (i >= ks.length) return; const line = () => fsay(`bst_${ks[i]}_${o.want[ks[i]]}`, () => next(i + 1)); if (i === ks.length - 1 && i > 0) fsay("en", line); else line(); };
  fsay("klant_hallo", () => next(0));
}
// briefje als tienveld: per soort rijtjes van 10 vakjes
const SLOT = { x0: 96, y0: 60, w: 23, h: 30, pad: 10 };
function slotLayout(o) {
  const out = {}; let y = SLOT.y0 + SLOT.pad;
  Object.keys(o.want).forEach(k => {
    out[k] = Array.from({ length: o.want[k] }, (_, i) => [SLOT.x0 + SLOT.pad + (i % 10) * SLOT.w, y + Math.floor(i / 10) * (SLOT.h + 4)]);
    y += Math.ceil(o.want[k] / 10) * (SLOT.h + 4) + 10;
  });
  return { slots: out, h: y - SLOT.y0 };
}
function orderView() {
  const o = F.order; if (!o) { yard(); return; }
  const LAY = slotLayout(o);
  const el = view("order", `
    <div class="farmbg market"></div>
    <svg viewBox="0 0 ${W} ${H}" id="orderSvg" class="marketfx">
      <g id="klantBig" transform="translate(48 350) scale(1.05)"><g class="animal fine">${ANIMALS[o.who]}</g></g>
      <rect x="${SLOT.x0}" y="${SLOT.y0}" width="${SLOT.pad * 2 + 10 * SLOT.w}" height="${LAY.h}" rx="14" fill="#fff" ${ST}/>
      ${Object.keys(o.want).map(k => LAY.slots[k].map(([x, y], i) => `<g class="oslot" id="os_${k}_${i}" transform="translate(${x} ${y})"><rect width="${SLOT.w - 2}" height="${SLOT.h}" rx="5" fill="${i % 10 < 5 ? "#FFF8E1" : "#E3F2FD"}" stroke="#BCAAA4" stroke-width="1.5" stroke-dasharray="4 3"/><g transform="translate(-0.5 5) scale(.55)" opacity="${i < o.got[k] ? 1 : .22}">${ITEM[k]}</g></g>`).join("")).join("")}
    </svg>
    <div class="stall order">${ORDER_KEYS.map(k => `<button class="sellbtn" data-k="${k}" aria-label="${k}"><span class="si">${ico(ITEM[k])}</span><span class="sn" id="st_${k}">${F.stock[k]}</span></button>`).join("")}</div>`);
  backBtn(el, () => { fSave(); yard(); });
  coinBox(el);
  const refresh = () => ORDER_KEYS.forEach(k => { $("#st_" + k).textContent = F.stock[k]; el.querySelector(`.sellbtn[data-k="${k}"]`).classList.toggle("empty", !F.stock[k]); });
  refresh();
  let finishing = false;
  $("#klantBig").addEventListener("pointerdown", () => { unlockAudio(); sayOrder(); });
  el.querySelectorAll(".stall .sellbtn").forEach(b => b.addEventListener("click", () => {
    unlockAudio();
    if (finishing) return;
    const k = b.dataset.k;
    const shake = () => { b.classList.remove("wrong"); void b.offsetWidth; b.classList.add("wrong"); };
    if (!o.want[k] || o.got[k] >= o.want[k]) { shake(); fsay("klant_nee"); return; }
    if (!F.stock[k]) { shake(); fsay("klant_nog"); return; }
    F.stock[k]--; const i = o.got[k]++; fSave(); refresh();
    const r = b.getBoundingClientRect(), st = stage.getBoundingClientRect(), sc = st.width / W;
    const [sx, sy] = LAY.slots[k][i];
    flyTo($("#orderSvg"), `<g transform="translate(-20 -20)">${ITEM[k]}</g>`, (r.left + r.width / 2 - st.left) / sc, (r.top + r.height / 2 - st.top) / sc, sx + 11, sy + 16, 450, () => {
      const s = $(`#os_${k}_${i} g`); if (s) s.setAttribute("opacity", 1);
      sfx.pop();
    });
    say("n" + (i + 1));
    if (Object.keys(o.want).every(x => o.got[x] >= o.want[x])) { finishing = true; fLater(orderDone, 1100); }
  }));
  sayOrder();
}
function orderDone() {
  const o = F.order;
  const pay = Object.keys(o.want).reduce((s, k) => s + PRICE_SELL[k] * o.want[k], 0) + 2 + Object.keys(o.want).length;
  F.order = null; F.ordersDone++; F.nextOrderT = Date.now() + 3 * 60 * 1000; fSave();
  confetti(50); sfx.fanfare();
  const kb = $("#klantBig"); if (kb) { kb.classList.remove("bounce"); void kb.getBBox(); kb.classList.add("bounce"); }
  fsay("klant_bedankt");
  const flyN = Math.min(pay, 20), show = bank(pay);
  for (let i = 0; i < flyN; i++) fLater(() => {
    flyTo($("#orderSvg"), `<circle r="10" fill="#FFC107" ${TH}/>`, 110, 250, 620, 34, 600, () => {
      show(Math.round(pay * (i + 1) / flyN)); tone(1320, .08, "square", .06);
      const cb = $("#coinBox"); cb.classList.remove("pop"); void cb.offsetWidth; cb.classList.add("pop");
    });
  }, 2600 + i * 300);
  fLater(() => { fSave(); yard(); }, 2600 + flyN * 300 + 1500);
}

/* ---------- dieren verhuizen naar een andere lieve boerderij ---------- */
const movePrice = a => MOVE_PRICE[a.type] + (a.baby ? 2 : 0);
function moveView() {
  const el = view("move", `
    <div class="farmbg market"></div>
    <div class="movegrid">${F.animals.map(a => `<button class="movecard" data-id="${a.id}" aria-label="${a.name}"><svg viewBox="-55 -100 115 105"><g transform="scale(${a.baby ? .7 : 1})"><g class="animal fine">${animalArt(a)}</g></g></svg><span class="mn">${a.name}</span><span class="sp">${movePrice(a)} ${COIN}</span></button>`).join("")}</div>
    <button class="btn okbtn holdok" id="moveOk" hidden aria-label="Verhuizen">${TOOL.vink}</button>
    <svg viewBox="0 0 ${W} ${H}" class="marketfx" id="moveSvg"></svg>`);
  backBtn(el, () => market());
  coinBox(el);
  let chosen = null, holdT = null;
  if (F.animals.length <= 1) { fsay("verhuis_laatste"); el.querySelectorAll(".movecard").forEach(b => b.disabled = true); return; }
  el.querySelectorAll(".movecard").forEach(b => b.addEventListener("click", () => {
    unlockAudio();
    chosen = F.animals.find(a => a.id === b.dataset.id);
    el.querySelectorAll(".movecard").forEach(x => x.classList.toggle("sel", x === b));
    fsay(nameClip(chosen), () => fsay("verhuis_vast"));
    $("#moveOk").hidden = false;
  }));
  const ok = $("#moveOk");
  const stop = () => { ok.classList.remove("holding"); clearTimeout(holdT); };
  ok.addEventListener("pointerdown", e => {
    e.preventDefault(); if (!chosen) return;
    ok.classList.add("holding");
    holdT = fLater(() => { stop(); doMove(chosen); }, 1500);
  });
  ok.addEventListener("pointerup", () => { if (ok.classList.contains("holding")) fsay("verhuis_vast"); stop(); });
  ok.addEventListener("pointerleave", stop); ok.addEventListener("pointercancel", stop);
  fsay("verhuis_kies");
}
function doMove(a) {
  const el = $("#farm");
  el.querySelectorAll(".movecard, #moveOk").forEach(b => b.disabled = true);
  $("#moveOk").hidden = true;
  const svg = $("#moveSvg"), price = movePrice(a);
  const card = el.querySelector(`.movecard[data-id="${a.id}"]`); if (card) card.style.visibility = "hidden";
  const truck = svgEl("", `<g transform="scale(1.3)">${TRUCK}</g>`);
  svg.appendChild(truck);
  const pet = svgEl("", `<g transform="scale(${a.baby ? .6 : .9})"><g class="animal fine">${FARM_SVG(a.type)}</g></g>`);
  svg.appendChild(pet);
  sfx.honk();
  fAnim(1400, t => { const e = 1 - Math.pow(1 - t, 3); truck.setAttribute("transform", `translate(${760 - e * 540} 350)`); pet.setAttribute("transform", `translate(160 350)`); }, () => {
    fsay(nameClip(a), () => fsay("verhuis_dag"));
    fAnim(900, t => { pet.setAttribute("transform", `translate(${160 + t * 120} ${350 - Math.sin(Math.PI * t) * 90 - t * 30})`); }, () => {
      pet.remove();
      F.animals = F.animals.filter(x => x !== a); delete FV.pos[a.id]; fSave();
      const show = bank(price);
      fLater(() => {
        sfx.honk();
        fAnim(1500, t => truck.setAttribute("transform", `translate(${220 - t * t * 560} 350)`), () => {
          for (let i = 0; i < price; i++) fLater(() => flyTo(svg, `<circle r="10" fill="#FFC107" ${TH}/>`, 330, 300, 620, 34, 600, () => {
            show(i + 1); tone(1320, .08, "square", .06); say("n" + Math.min(20, i + 1));
          }), i * 650);
          fLater(() => market(), price * 650 + 1500);
        });
      }, 2600);
    });
  });
}

/* ---------- bouwwinkel: uitbreidingen, machines, versiering en spaardoelen ---------- */
const VERF = { rood: "#E53935", blauw: "#1E88E5", geel: "#FDD835", paars: "#8E24AA" };
const SHOP = [
  { k: "vijver", cat: "bouw", p: 40, to: "erf2" }, { k: "boomgaard", cat: "bouw", p: 60, to: "erf2" }, { k: "bijen", cat: "bouw", p: 50, to: "erf2" },
  { k: "hond", cat: "bouw", p: 35, to: "yard" }, { k: "stal", cat: "bouw", p: 80, to: "yard" },
  { k: "sproeier", cat: "machine", p: 50 }, { k: "dorser", cat: "machine", p: 80 }, { k: "melkmachine", cat: "machine", p: 60 }, { k: "kippenluik", cat: "machine", p: 70 },
  { k: "hoed", cat: "deco", p: 10, acc: 1 }, { k: "strik", cat: "deco", p: 8, acc: 1 }, { k: "sjaal", cat: "deco", p: 12, acc: 1 }, { k: "krans", cat: "deco", p: 15, acc: 1 },
  { k: "verf_blauw", cat: "deco", p: 20, verf: "blauw" }, { k: "verf_geel", cat: "deco", p: 20, verf: "geel" }, { k: "verf_paars", cat: "deco", p: 20, verf: "paars" }, { k: "verf_rood", cat: "deco", p: 0, verf: "rood" },
  { k: "bloemen", cat: "deco", p: 15, to: "yard" }, { k: "vlag", cat: "deco", p: 15, to: "yard" }, { k: "lampjes", cat: "deco", p: 25, to: "yard" }, { k: "schommel", cat: "deco", p: 25, to: "erf2" },
  { k: "goud", cat: "doel", p: 300, to: "yard" }, { k: "ballon", cat: "doel", p: 500, to: "erf2" }
];
const maxAnimals = () => F.owned && F.owned.stal ? 12 : MAX_ANIMALS;
const gold = s => s.replace(/#43A047/g, "#FFC107").replace(/#2E7D32/g, "#E0A000");
const tractorArt = () => F.owned && F.owned.goud ? gold(TRACTOR_SVG()) : TRACTOR_SVG();
const DOG = `
  <path d="M-26 -30 q-12 -8 -8 -20" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><path d="M-26 -30 q-12 -8 -8 -20" fill="none" stroke="#A1887F" stroke-width="3.5" stroke-linecap="round"/>
  ${[-20, -10, 8, 18].map(x => `<rect x="${x}" y="-22" width="7" height="22" rx="3" fill="#FFF3E0" ${TH}/>`).join("")}
  <ellipse cx="-2" cy="-28" rx="27" ry="13" fill="#FFF3E0" ${ST}/><ellipse cx="-8" cy="-32" rx="12" ry="8" fill="#A1887F"/>
  <circle cx="26" cy="-44" r="15" fill="#FFF3E0" ${ST}/><ellipse cx="38" cy="-40" rx="8" ry="6" fill="#FFF3E0" ${TH}/><circle cx="44" cy="-42" r="3" fill="${INK}"/>
  <path d="M16 -56 q-10 4 -8 22 q6 2 9 -4 z" fill="#8D6E63" ${TH}/><circle cx="29" cy="-47" r="2.4" fill="${INK}"/>
  <path d="M34 -35 q3 3 6 0" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/><rect x="12" y="-36" width="14" height="5" rx="2" fill="${C.fred}" ${TH}/>`;
/* accessoires op het hoofd of om de nek (lokale coördinaten per diersoort) */
const ACC_AT = { koe: { head: [27, -62], neck: [15, -38] }, paard: { head: [34, -90], neck: [18, -58] }, varken: { head: [20, -52], neck: [3, -27] }, schaap: { head: [24, -62], neck: [12, -36] } };
const ACC = {
  hoed: `<rect x="-12" y="-4" width="24" height="5" rx="2" fill="${INK}"/><rect x="-8" y="-20" width="16" height="17" rx="2" fill="${INK}"/><rect x="-8" y="-8" width="16" height="4" fill="${C.fred}"/>`,
  krans: `${[-12, -6, 0, 6, 12].map((x, i) => `<circle cx="${x}" cy="${-Math.abs(x) * .2}" r="4.2" fill="${["#FF4081", "#FFD600", "#fff", "#FFD600", "#FF4081"][i]}" ${TH}/>`).join("")}`,
  strik: `<path d="M0 0 L-12 -7 V7 Z M0 0 L12 -7 V7 Z" fill="#FF4081" ${TH}/><circle r="3.5" fill="#FF4081" ${TH}/>`,
  sjaal: `<path d="M-12 -4 Q0 4 12 -4 L12 3 Q0 11 -12 3 Z" fill="#1E88E5" ${TH}/><path d="M-6 4 l-3 12 l7 -1 z" fill="#1E88E5" ${TH}/><path d="M-9 1 h18" stroke="#FFD600" stroke-width="2"/>`
};
const accSVG = a => {
  const k = F.acc && F.acc[a.id]; if (!k || !ACC[k] || !ACC_AT[a.type]) return "";
  const [x, y] = ACC_AT[a.type][k === "hoed" || k === "krans" ? "head" : "neck"];
  return `<g transform="translate(${x} ${y})">${ACC[k]}</g>`;
};
const animalArt = a => FARM_SVG(a.type) + accSVG(a);
const SHOP_ICON = {
  vijver: `<ellipse cx="20" cy="26" rx="17" ry="9" fill="#4FC3F7" ${TH}/><circle cx="22" cy="18" r="5" fill="#FFD600" ${TH}/><path d="M26 18 l5 1 l-5 2z" fill="#FF8A00"/><ellipse cx="18" cy="24" rx="7" ry="4" fill="#FFD600" ${TH}/>`,
  boomgaard: `<rect x="17" y="22" width="6" height="14" fill="#8D6E63" ${TH}/><circle cx="20" cy="16" r="13" fill="#66BB6A" ${TH}/>${[[14, 13], [25, 11], [21, 21]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2" fill="#E53935" ${TH}/>`).join("")}`,
  bijen: `<path d="M8 34 V22 Q8 8 20 8 Q32 8 32 22 V34 Z" fill="#FFCA28" ${TH}/><path d="M9 18 H31 M8 26 H32" stroke="#E0A000" stroke-width="2.5"/><rect x="17" y="27" width="6" height="7" rx="3" fill="${INK}"/><ellipse cx="33" cy="9" rx="4" ry="3" fill="#FFD600" ${TH}/>`,
  hond: `<circle cx="20" cy="21" r="12" fill="#FFF3E0" ${TH}/><path d="M10 12 q-6 6 -2 16 q5 0 6 -6z M30 12 q6 6 2 16 q-5 0 -6 -6z" fill="#8D6E63" ${TH}/><circle cx="16" cy="19" r="1.8" fill="${INK}"/><circle cx="24" cy="19" r="1.8" fill="${INK}"/><ellipse cx="20" cy="25" rx="3" ry="2.2" fill="${INK}"/>`,
  stal: `<path d="M6 36 V18 L20 8 L34 18 V36 Z" fill="#E53935" ${TH}/><path d="M20 20 v12 M14 26 h12" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`,
  sproeier: `<rect x="17" y="18" width="6" height="18" fill="#90A4AE" ${TH}/><rect x="11" y="14" width="18" height="6" rx="3" fill="#43A047" ${TH}/>${[[8, 8], [14, 4], [26, 4], [32, 8]].map(([x, y]) => `<path d="M${x} ${y} q2 3 0 5 q-2 -2 0 -5z" fill="#29B6F6"/>`).join("")}`,
  dorser: `<rect x="4" y="14" width="24" height="14" rx="3" fill="#43A047" ${TH}/><rect x="16" y="6" width="10" height="9" fill="${C.glass}" ${TH}/><rect x="28" y="18" width="8" height="10" fill="#FFCA28" ${TH}/><circle cx="11" cy="30" r="5" fill="${INK}"/><circle cx="24" cy="31" r="4" fill="${INK}"/>`,
  melkmachine: `<rect x="6" y="10" width="28" height="24" rx="4" fill="#B0BEC5" ${TH}/><path d="M13 16 H19 L20 30 H12 Z M22 16 H28 L29 30 H21 Z" fill="#fff" ${TH}/><circle cx="31" cy="7" r="3" fill="#FF5252"/>`,
  kippenluik: `<path d="M6 34 V18 L20 8 L34 18 V34 Z" fill="#FFCC80" ${TH}/>${[[13, 28], [20, 26], [27, 28]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="3.5" ry="4.5" fill="#FFF3E0" ${TH}/>`).join("")}`,
  hoed: `<g transform="translate(20 30) scale(1.4)">${ACC.hoed}</g>`, strik: `<g transform="translate(20 20) scale(1.3)">${ACC.strik}</g>`,
  sjaal: `<g transform="translate(20 16) scale(1.3)">${ACC.sjaal}</g>`, krans: `<g transform="translate(20 22) scale(1.4)">${ACC.krans}</g>`,
  bloemen: `${[[10, 22, "#FF4081"], [20, 16, "#FFD600"], [30, 22, "#AB47BC"]].map(([x, y, c]) => `<path d="M${x} ${y + 4} V36" stroke="#43A047" stroke-width="3"/>${[0, 72, 144, 216, 288].map(d => `<circle cx="${x + 4 * Math.cos(d * Math.PI / 180)}" cy="${y + 4 * Math.sin(d * Math.PI / 180)}" r="3" fill="${c}"/>`).join("")}<circle cx="${x}" cy="${y}" r="2.2" fill="#FFF3E0"/>`).join("")}`,
  vlag: `<path d="M3 10 Q20 18 37 10" fill="none" stroke="${INK}" stroke-width="2"/>${[[6, "#FF4081"], [14, "#FFD600"], [22, "#29B6F6"], [30, "#66BB6A"]].map(([x, c]) => `<path d="M${x} ${12 + (x > 10 && x < 30 ? 3 : 1)} h7 l-3.5 10 z" fill="${c}" ${TH}/>`).join("")}`,
  lampjes: `<path d="M3 10 Q20 20 37 10" fill="none" stroke="${INK}" stroke-width="2"/>${[8, 16, 24, 32].map((x, i) => `<ellipse cx="${x}" cy="${16 + (i === 1 || i === 2 ? 2 : 0)}" rx="3.5" ry="5" fill="${["#FFD600", "#FF4081", "#29B6F6", "#66BB6A"][i]}" ${TH}/>`).join("")}`,
  schommel: `<path d="M6 36 L12 6 H28 L34 36" fill="none" stroke="#8D6E63" stroke-width="4" stroke-linecap="round"/><path d="M16 6 V28 M24 6 V28" stroke="${INK}" stroke-width="2"/><rect x="13" y="27" width="14" height="4" rx="2" fill="#E53935" ${TH}/>`,
  goud: `<g transform="translate(20 34) scale(.17)">${gold(TRACTOR_SVG())}</g>`,
  ballon: `<path d="M20 4 C32 4 34 18 24 26 H16 C6 18 8 4 20 4Z" fill="#FF4081" ${TH}/><path d="M20 4 C16 10 16 20 18 26 M20 4 C24 10 24 20 22 26" fill="none" stroke="#FFD600" stroke-width="3"/><rect x="15" y="30" width="10" height="7" rx="2" fill="#A1887F" ${TH}/><path d="M16 26 L16 30 M24 26 L24 30" stroke="${INK}" stroke-width="1.5"/>`
};
["blauw", "geel", "paars", "rood"].forEach(c => { SHOP_ICON["verf_" + c] = `<path d="M9 14 H31 L28 36 H12 Z" fill="#CFD8DC" ${TH}/><path d="M9 14 q11 8 22 0 v6 q-11 6 -22 0z" fill="${VERF[c]}" ${TH}/><path d="M22 4 v10" stroke="#8D6E63" stroke-width="4" stroke-linecap="round"/>`; });
const TAB_ICON = {
  bouw: `<path d="M8 32 L22 18" stroke="#8D6E63" stroke-width="6" stroke-linecap="round"/><path d="M16 10 L28 6 L34 12 L30 24 Z" fill="#90A4AE" ${TH}/>`,
  machine: TOOL.gear.replace(/<\/?svg[^>]*>/g, ""),
  deco: `<path d="M26 6 l8 8 L18 30 l-8 -8z" fill="#FF4081" ${TH}/><path d="M10 22 l8 8 q-8 8 -14 4 q-2 -6 6 -12z" fill="#FFD600" ${TH}/>`,
  doel: `<ellipse cx="20" cy="24" rx="15" ry="11" fill="#F8BBD0" ${TH}/><circle cx="33" cy="22" r="4" fill="#F48FB1" ${TH}/><rect x="15" y="12" width="10" height="3" rx="1.5" fill="${INK}"/><path d="M11 34 v3 M27 34 v3" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`
};
const itemVoice = it => it.verf ? "it_verf" : "it_" + it.k;
const isOwned = it => it.verf ? (it.verf === "rood" || !!F.owned[it.k]) : !!F.owned[it.k];
function shopView(cat = "bouw", focus = null) {
  const el = view("bouw", `
    <div class="farmbg market"></div>
    <div class="seedbar shoptabs">${Object.keys(TAB_ICON).map(c => `<button class="btn tool tab ${c === cat ? "on" : ""}" data-c="${c}" aria-label="${c}">${ico(TAB_ICON[c])}</button>`).join("")}</div>
    <div class="shopgrid">${SHOP.filter(it => it.cat === cat).map(it => {
      const own = isOwned(it), cnt = it.acc ? (F.accOwned[it.k] || 0) : 0;
      const on = it.verf && F.deco.verf === it.verf;
      return `<button class="shopcard ${own && !it.acc ? "owned" : ""} ${on ? "sel" : ""}" data-k="${it.k}" aria-label="${it.k}">
        <span class="ic">${ico(SHOP_ICON[it.k])}</span>
        ${own && !it.acc ? `<span class="got">${TOOL.vink}</span>` : `<span class="sp">${it.p} ${COIN}</span><span class="bar"><i style="width:${Math.min(100, F.coins / Math.max(1, it.p) * 100)}%"></i></span>`}
        ${cnt ? `<span class="cnt">${cnt}</span>` : ""}</button>`;
    }).join("")}</div>
    <button class="btn okbtn buyok" id="buyOk" hidden aria-label="Kopen">${TOOL.vink}</button>`);
  backBtn(el, () => { fSave(); yard(); });
  coinBox(el);
  el.querySelectorAll(".tab").forEach(b => b.addEventListener("click", () => { sfx.pop(); shopView(b.dataset.c); }));
  let chosen = null;
  const choose = b => {
    if (!b.isConnected || !$("#buyOk")) return;
    const it = SHOP.find(x => x.k === b.dataset.k);
    el.querySelectorAll(".shopcard").forEach(x => x.classList.toggle("pick", x === b));
    chosen = null; $("#buyOk").hidden = true;
    if (it.verf && isOwned(it)) {   // eigen verf: meteen de schuur die kleur geven
      F.deco.verf = it.verf; fSave(); sfx.sparkle(); el.querySelectorAll(".shopcard").forEach(x => x.classList.toggle("sel", x === b)); fsay("kleding"); return;
    }
    if (isOwned(it) && !it.acc) { fsay(itemVoice(it), () => fsay("bouw_heb")); return; }
    if (F.coins < it.p) { b.classList.remove("wrong"); void b.offsetWidth; b.classList.add("wrong"); fsay(itemVoice(it), () => fsay("bouw_sparen")); return; }
    chosen = it; $("#buyOk").hidden = false;
    fsay(itemVoice(it), () => fsay("bouw_tik"));
  };
  el.querySelectorAll(".shopcard").forEach(b => b.addEventListener("click", () => { unlockAudio(); choose(b); }));
  $("#buyOk").addEventListener("click", () => {
    const it = chosen; if (!it || F.coins < it.p) return;
    F.coins -= it.p;
    if (it.acc) F.accOwned[it.k] = (F.accOwned[it.k] || 0) + 1; else F.owned[it.k] = 1;
    if (it.verf) F.deco.verf = it.verf;
    fSave(); setCoins(); confetti(it.p >= 300 ? 120 : 50); sfx.fanfare();
    $("#buyOk").hidden = true; chosen = null;
    fsay(it.k === "ballon" ? "ballon_feest" : "bouw_gekocht");
    fLater(() => { if (it.to === "erf2") erf2(); else if (it.to === "yard") yard(); else shopView(cat); }, 2200);
  });
  if (focus) { const b = el.querySelector(`.shopcard[data-k="${focus}"]`); if (b) fLater(() => choose(b), 300); }
  else fsay("bouw_welkom");
}

/* ---------- achter de schuur: vijver, boomgaard, bijenkast, schommel, luchtballon ---------- */
const TREE_X = [350, 448, 546], APPLE_AT = [[-22, -14], [18, -22], [-4, -34], [24, 2]];
function erf2() {
  fDecay();
  const o = F.owned, sign = (k, x, y) => `<g class="tap buysign" data-k="${k}" transform="translate(${x} ${y})"><rect x="-4" y="-6" width="8" height="46" fill="#8D6E63" ${TH}/><rect x="-40" y="-44" width="80" height="44" rx="8" fill="#FFE0B2" ${ST}/><g transform="translate(-36 -42) scale(.95)">${SHOP_ICON[k]}</g><g transform="translate(4 -36)"><circle cx="12" cy="14" r="10" fill="#FFC107" ${TH}/></g><text x="16" y="-16" text-anchor="middle" class="signp">${SHOP.find(i => i.k === k).p}</text></g>`;
  const el = view("erf2", `
    <svg viewBox="0 0 ${W} ${H}" id="erf2Svg">
      <rect width="${W}" height="${H}" fill="#29B6F6"/>
      <circle cx="600" cy="48" r="24" fill="${C.hub}" ${ST}/>
      <path d="M0 170 Q160 130 330 165 T${W} 160 V${H} H0 Z" fill="#9CCC65" ${ST}/>
      <rect y="200" width="${W}" height="175" fill="#8BC34A"/>
      ${o.ballon ? `<g id="ballon" class="tap"><g class="balbob"><g transform="translate(250 30) scale(2.2)">${SHOP_ICON.ballon}</g></g></g>` : ""}
      ${o.schommel ? `<g id="schommel" class="tap"><path d="M40 225 L62 110 H150 L172 225" fill="none" stroke="#8D6E63" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><path d="M40 225 L62 110 H150 L172 225" fill="none" stroke="${INK}" stroke-width="2" opacity=".4"/>
        <g id="swing" class="swinging0"><path d="M88 110 V196 M124 110 V196" stroke="${INK}" stroke-width="3"/><rect x="80" y="194" width="52" height="9" rx="4" fill="#E53935" ${ST}/>
        <g transform="translate(33 151) scale(.7)">${dinoHead("")}</g></g></g>` : sign("schommel", 105, 190)}
      ${o.boomgaard ? TREE_X.map((x, t) => `<g class="tree" data-t="${t}"><rect x="${x - 9}" y="140" width="18" height="80" fill="#8D6E63" ${ST}/><circle cx="${x}" cy="128" r="46" fill="#66BB6A" ${ST}/><circle cx="${x - 20}" cy="116" r="14" fill="#81C784"/><g class="apples"></g></g>`).join("") + `<g transform="translate(448 250)"><path d="M-34 -18 H34 L26 18 H-26 Z" fill="#A1887F" ${ST}/><text id="appelN" x="0" y="8" text-anchor="middle" class="signp big">${F.stock.appel}</text></g>` : sign("boomgaard", 448, 200)}
      ${o.bijen ? `<g id="hive" class="tap" transform="translate(612 300)"><rect x="-4" y="0" width="8" height="30" fill="#8D6E63" ${TH}/><path d="M-30 2 V-26 Q-30 -60 0 -60 Q30 -60 30 -26 V2 Z" fill="#FFCA28" ${ST}/><path d="M-29 -16 H29 M-30 -34 H30" stroke="#E0A000" stroke-width="3"/><rect x="-7" y="-14" width="14" height="14" rx="7" fill="${INK}"/><g id="honey"></g><g class="bees">${[0, 1, 2].map(i => `<g class="bee b${i}"><ellipse rx="6" ry="4.5" fill="#FFD600" ${TH}/><path d="M-1 -4 v8 M3 -4 v8" stroke="${INK}" stroke-width="1.6"/><ellipse cx="-1" cy="-6" rx="3.5" ry="2.5" fill="#fff" opacity=".85"/></g>`).join("")}</g></g>` : sign("bijen", 612, 290)}
      ${o.vijver ? `<g id="pond"><ellipse cx="190" cy="300" rx="150" ry="52" fill="#4FC3F7" ${ST}/><ellipse cx="150" cy="290" rx="60" ry="10" fill="#B3E5FC" opacity=".7"/>
        ${[[120, 306], [200, 292], [270, 312]].map(([x, y], i) => `<g class="duck tap" data-i="${i}" transform="translate(${x} ${y}) scale(${i === 1 ? .55 : .7})"><g class="animal fine duckbob">${ANIMALS.eend}</g></g>`).join("")}<g id="duckEggs"></g></g>` : sign("vijver", 190, 300)}
      <g id="cfx"></g>
    </svg>`);
  backBtn(el, () => { fSave(); yard(); });
  coinBox(el);
  el.querySelectorAll(".buysign").forEach(g => g.addEventListener("click", () => { unlockAudio(); sfx.pop(); fsay("erf2_koop", () => {}); fLater(() => shopView(SHOP.find(i => i.k === g.dataset.k).cat, g.dataset.k), 1800); }));
  FV.picked = 0;
  if (o.boomgaard) {
    const drawApples = () => el.querySelectorAll(".tree").forEach(tg => {
      const t = +tg.dataset.t, x = TREE_X[t];
      tg.querySelector(".apples").innerHTML = APPLE_AT.slice(0, F.trees[t].n).map(([dx, dy], i) => `<g class="apple" data-i="${i}" transform="translate(${x + dx} ${128 + dy})"><rect x="-16" y="-16" width="32" height="32" fill="transparent"/><circle r="9" fill="#E53935" ${TH}/><path d="M0 -9 q2 -5 5 -6" stroke="#5D4037" stroke-width="2" fill="none"/></g>`).join("");
      tg.querySelectorAll(".apple").forEach(ap => ap.addEventListener("pointerdown", e => {
        e.stopPropagation(); unlockAudio(); if (ap.dataset.gone) return; ap.dataset.gone = 1;
        const [dx, dy] = APPLE_AT[+ap.dataset.i];
        F.trees[t].n--; F.stock.appel++; FV.picked++; fSave(); ap.remove();
        say("n" + Math.min(20, FV.picked));
        flyTo($("#erf2Svg"), `<circle r="9" fill="#E53935" ${TH}/>`, x + dx, 128 + dy, 448, 244, 500, () => { sfx.pop(); const n = $("#appelN"); if (n) n.textContent = F.stock.appel; });
      }));
      tg.onclick = () => { if (!F.trees.some(tr => tr.n)) fsay("appel_nog"); };
    });
    drawApples();
  }
  if (o.bijen) {
    const drawHoney = () => { const h = $("#honey"); if (h) h.innerHTML = Array.from({ length: F.honey.n }, (_, i) => `<g transform="translate(${-26 + i * 18} -84)"><rect x="-7" y="-10" width="14" height="16" rx="3" fill="#FFB300" ${TH}/><rect x="-7" y="-13" width="14" height="4" fill="#fff" ${TH}/></g>`).join(""); };
    drawHoney();
    $("#hive").addEventListener("click", () => {
      unlockAudio();
      tone(220, .5, "sawtooth", .03, 0, 260);
      if (!F.honey.n) { fsay("honing_nog"); return; }
      const n = F.honey.n; F.stock.honing += n; F.honey.n = 0; fSave(); drawHoney();
      for (let i = 0; i < n; i++) fLater(() => { say("n" + (i + 1)); sfx.pop(); flyTo($("#erf2Svg"), `<rect x="-7" y="-10" width="14" height="16" rx="3" fill="#FFB300" ${TH}/>`, 612, 216, 600, 30, 600); }, i * 500);
      fLater(() => fsay("honing_klaar"), n * 500 + 300);
    });
  }
  if (o.vijver) {
    const drawEggs = () => { const g = $("#duckEggs"); if (!g) return; g.innerHTML = Array.from({ length: F.duck.n }, (_, i) => `<g class="degg" transform="translate(${60 + i * 34} 250)"><rect x="-18" y="-20" width="36" height="36" fill="transparent"/><ellipse rx="9" ry="12" fill="#E0F2F1" ${ST}/></g>`).join("");
      g.querySelectorAll(".degg").forEach(eg => eg.addEventListener("pointerdown", e => { e.stopPropagation(); if (eg.dataset.gone) return; eg.dataset.gone = 1; F.duck.n--; F.stock.ei++; fSave(); eg.remove(); sfx.pop(); fsay("eend_ei"); })); };
    drawEggs();
    el.querySelectorAll(".duck").forEach(d => d.addEventListener("pointerdown", e => {
      e.stopPropagation(); unlockAudio();
      const a = d.querySelector(".animal"); a.classList.remove("bounce"); void a.getBBox(); a.classList.add("bounce");
      fsay("g_eend"); heartsAt($("#cfx"), [120, 200, 270][+d.dataset.i], 270);
    }));
  }
  if (o.schommel) $("#schommel").addEventListener("click", () => { unlockAudio(); const s = $("#swing"); s.classList.remove("swinging"); void s.getBBox(); s.classList.add("swinging"); fsay("schommel"); });
  if (o.ballon) $("#ballon").addEventListener("click", () => { unlockAudio(); confetti(40); sfx.sparkle(); fsay("ballon_feest"); });
  fsay("erf2_welkom", () => {
    if (o.bijen && F.honey.n) fsay("honing_klaar");
    else if (o.boomgaard && F.trees.some(t => t.n)) fsay("appel_pluk");
    else if (!o.vijver && !o.boomgaard && !o.bijen) fsay("erf2_koop");
  });
}

/* ---------- dag en nacht ---------- */
function evening() {
  unlockAudio();
  F.night = true; fSave();
  yard();
  say("avond");
}
function sleepOverlay() {
  if (!FV || FV.view !== "yard" || $("#sleepOv")) return;
  const ov = document.createElement("div");
  ov.className = "sleepov"; ov.id = "sleepOv";
  ov.innerHTML = `<div class="zzz">Z<span>z</span><span>z</span></div><button class="btn sunbtn" id="sunBtn" aria-label="Goedemorgen">${ICONS.sun}</button>`;
  $("#farm").appendChild(ov);
  $("#sunBtn").addEventListener("click", wakeUp);
}
function babyTime() {
  if (!F.babyDue || !FV || FV.view !== "yard") return;
  const t = F.babyDue;
  confetti(80);
  fsay("baby");
  fLater(() => pickName(t, true, a => { F.babyDue = null; fSave(); yard(); fLater(() => sayA(a, "b_blij"), 500); }), 2600);
}
function wakeUp() {
  unlockAudio();
  const babies = [];
  F.animals.forEach(a => {
    if (a.inStal && !a.baby) {
      const good = Object.values(a.needs).every(v => v >= 60);
      a.nights = good ? (a.nights || 0) + 1 : 0;
      if (a.nights >= 3 && F.animals.length + babies.length < maxAnimals() && NAMES[a.type]) { a.nights = 0; babies.push(a.type); }
    }
    a.inStal = false;
    for (const k in a.needs) a.needs[k] = Math.max(20, a.needs[k] - 12);
    if (PROD[a.type] && !a.baby) a.prod = 100;
  });
  F.night = false; F.day++; F.eggs = Math.min(eggMax(), F.eggs + 2);
  FV.pos = {};
  fSave();
  yard();
  sfx.fanfare();
  if (babies.length) { F.babyDue = babies[0]; fSave(); }
  fsay("ochtend");
  fLater(babyTime, 2600);
}

/* ---------- oudersknop: namen aanpassen, opnieuw beginnen ---------- */
function gearHold(btn) {
  let t = null;
  const start = e => { e.preventDefault(); btn.classList.add("holding"); t = setTimeout(parentPanel, 1500); };
  const stop = () => { btn.classList.remove("holding"); clearTimeout(t); };
  btn.addEventListener("pointerdown", start);
  btn.addEventListener("pointerup", stop); btn.addEventListener("pointerleave", stop); btn.addEventListener("pointercancel", stop);
}
function parentPanel() {
  const ov = document.createElement("div");
  ov.className = "parentov";
  ov.innerHTML = `<div class="parentbox">
      <h3>Boerderij-instellingen</h3>
      ${F.animals.map(a => `<label class="prow"><span>${{ koe: "Koe", paard: "Paard", varken: "Varken", schaap: "Schaap" }[a.type]}${a.baby ? " (baby)" : ""}</span>
        <input type="text" maxlength="14" data-id="${a.id}" value="${a.name.replace(/"/g, "&quot;")}" autocomplete="off"></label>`).join("")}
      <p class="phint">Namen uit de vaste lijst spreekt de stem uit. Bij een eigen naam zegt de stem "je koe", "je schaap", enzovoort.</p>
      <div class="pbtns"><button class="pbtn" id="pSave">Opslaan</button><button class="pbtn ghost" id="pClose">Sluiten</button></div>
      <button class="pbtn danger" id="pReset">Boerderij opnieuw beginnen</button>
      ${(() => { let l = []; try { l = JSON.parse(localStorage.getItem("xavi-fouten") || "[]"); } catch (e) {} return l.length ? `<p class="phint">Foutmeldingen (voor Claude): ${l.slice(-5).map(x => x.replace(/</g, "&lt;")).join("<br>")}</p>` : ""; })()}
    </div>`;
  $("#farm").appendChild(ov);
  ov.addEventListener("pointerdown", e => e.stopPropagation());
  $("#pClose").addEventListener("click", () => ov.remove());
  $("#pSave").addEventListener("click", () => {
    const seen = {};
    let ok = true;
    ov.querySelectorAll("input").forEach(inp => {
      const a = F.animals.find(x => x.id === inp.dataset.id), v = inp.value.trim() || a.name;
      const key = a.type + ":" + v.toLowerCase();
      if (seen[key]) { ok = false; inp.classList.add("bad"); } else { seen[key] = 1; inp.classList.remove("bad"); }
    });
    if (!ok) { alert("Twee dieren van dezelfde soort kunnen niet dezelfde naam hebben."); return; }
    ov.querySelectorAll("input").forEach(inp => { const a = F.animals.find(x => x.id === inp.dataset.id); a.name = inp.value.trim() || a.name; });
    fSave(); ov.remove(); yard();
  });
  $("#pReset").addEventListener("click", () => {
    if (!confirm("Weet je het zeker? Alle dieren, muntjes en de moestuin worden gewist.")) return;
    F = fNew(); fUpgrade(); fSave(); ov.remove(); FV.pos = {}; pickFirst();
  });
}
