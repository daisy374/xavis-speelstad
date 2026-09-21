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
const PRICE_SELL = { melk: 3, wol: 4, ei: 1, wortel: 1, sla: 1, aardbei: 2 };
const DECAY = { h: 8, d: 10, s: 5, b: 7 };           // punten per uur
const PROD = { koe: 50, schaap: 34 };                 // melk na 2 uur, wol na 3 uur
const GROW = 20 * 60 * 1000;                          // moestuin: 20 minuten na water geven
const MAX_ANIMALS = 8;
const MEADOW = { x0: 180, x1: 450, y0: 236, y1: 318 };

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
  wortel: CROP.wortel, sla: CROP.sla, aardbei: AARDBEI
};
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
function fLoad() {
  try { F = JSON.parse(localStorage.getItem(FKEY)); } catch (e) { F = null; }
  if (!F || F.v !== 1) F = fNew();
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
  const layed = Math.floor((now - F.eggT) / (30 * 60 * 1000));
  if (layed > 0) { F.eggs = Math.min(6, F.eggs + layed); F.eggT = now; }
  if (F.eggs >= 6) F.eggT = now;
}
const nameClip = a => NAMES[a.type] && NAMES[a.type].includes(a.name) ? "nm_" + a.name : "je_" + a.type;
const sayA = (a, key, cb) => say(nameClip(a), () => say(key, cb));
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
    say("g_" + chosen, () => say("type_" + chosen));
    $("#okBtn").hidden = false;
  }));
  $("#okBtn").addEventListener("click", () => { if (chosen) { sfx.sparkle(); pickName(chosen, false, a => { yard(); later2(() => sayA(a, "b_blij"), 600); }); } });
  say("boer_welkom", () => say("boer_kies"));
}
const later2 = (fn, ms) => fLater(fn, ms);
function pickName(type, baby, done) {
  const free = NAMES[type].filter(n => !usedNames(type).includes(n));
  if (!free.length) { done(addAnimal(type, `${type} ${F.animals.length + 1}`, baby)); return; }
  const el = view("name", `
    <div class="farmbg"></div>
    <div class="namepet">${animalCard(type, baby ? .7 : 1)}</div>
    <div class="namerow">${free.map(n => `<button class="namebtn" data-n="${n}">${n}</button>`).join("")}</div>
    <button class="btn okbtn" id="okBtn" hidden aria-label="Kiezen">${TOOL.vink}</button>`);
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
    <g id="stal"><rect x="14" y="120" width="140" height="120" fill="#E53935" ${ST}/>
      <path d="M4 124 L84 70 L164 124 Z" fill="#8D2A1E" ${ST}/>
      <rect x="54" y="170" width="60" height="70" fill="${n ? "#FFE082" : "#fff"}" ${TH}/>
      <path d="M54 170 L114 240 M114 170 L54 240" stroke="${INK}" stroke-width="3"/>
      <rect x="72" y="92" width="24" height="20" fill="${n ? "#FFE082" : "#FFE0B2"}" ${TH}/></g>
    <path d="M${MEADOW.x0 - 16} 214 H${MEADOW.x1 + 24}" stroke="#A1887F" stroke-width="5"/>
    ${Array.from({ length: 12 }, (_, i) => `<rect x="${MEADOW.x0 - 18 + i * 26}" y="204" width="6" height="22" fill="#A1887F" ${TH}/>`).join("")}
    <g id="hok" class="tap"><rect x="500" y="170" width="100" height="62" fill="#FFCC80" ${ST}/>
      <path d="M492 172 L550 132 L608 172 Z" fill="#6D4C41" ${ST}/><rect x="538" y="196" width="24" height="36" rx="10" fill="#4E342E" ${TH}/>
      ${F.eggs > 0 ? `<ellipse cx="516" cy="226" rx="6" ry="8" fill="#FFF3E0" ${TH}/>` : ""}
      <g transform="translate(596 250) scale(.8)"><g class="animal fine peck">${ANIMALS.kip}</g></g>
      <g transform="translate(478 246) scale(.7)"><g class="animal fine peck2">${ANIMALS.kip}</g></g></g>
    <g id="tuin" class="tap"><rect x="480" y="270" width="182" height="80" rx="8" fill="#A5D6A7" ${ST}/>${plots}</g>
    <g id="herd"></g>
    <g id="fx"></g>
    ${n ? `<rect width="${W}" height="${H}" fill="#0B1640" opacity=".25" pointer-events="none"/>` : ""}
  </svg>`;
}
function yard() {
  const el = view("yard", yardSVG() + `<button class="btn daybtn" id="dayBtn" aria-label="Dag en nacht">${F.night ? ICONS.sun : ICONS.moon}</button>
    <button class="gearbtn" id="gearBtn" aria-label="Instellingen voor ouders">${TOOL.gear}</button>`);
  homeButton(el);
  coinBox(el);
  const herd = $("#herd");
  FV.pos = FV.pos || {};
  F.animals.forEach(a => {
    if (a.inStal) return;
    const p = FV.pos[a.id] || (FV.pos[a.id] = { x: rnd(MEADOW.x0, MEADOW.x1), y: rnd(MEADOW.y0, MEADOW.y1), tx: 0, ty: 0, dir: 1 });
    p.tx = p.x; p.ty = p.y;
    const g = svgEl("pet", `<rect class="hit" x="-50" y="-95" width="100" height="100" fill="transparent"/>
      <g class="flip"><g class="animal ${moodCls(a)} ${a.type === "schaap" && a.prod < 60 ? "kaal" : ""}">${FARM_SVG(a.type)}</g></g><g class="bub"></g>`);
    g.dataset.id = a.id;
    herd.appendChild(g);
    g.addEventListener("pointerdown", e => { e.stopPropagation(); tapAnimal(a, g); });
  });
  yardNeeds(); yardPlace();
  FV.walkT = setInterval(yardWalk, 50);
  $("#hok").addEventListener("click", () => { sfx.pop(); coop(); });
  $("#tuin").addEventListener("click", () => { sfx.pop(); garden(); });
  $("#kraam").addEventListener("click", () => { sfx.pop(); market(); });
  $("#dayBtn").addEventListener("click", () => F.night ? wakeUp() : evening());
  gearHold($("#gearBtn"));
  if (F.night && F.animals.every(a => a.inStal)) sleepOverlay();
}
function yardPlace() {
  F.animals.forEach(a => {
    const g = document.querySelector(`#herd .pet[data-id="${a.id}"]`), p = FV.pos[a.id];
    if (!g || !p) return;
    const sc = (0.62 + (p.y - MEADOW.y0) / (MEADOW.y1 - MEADOW.y0) * 0.2) * (a.baby ? .65 : 1);
    g.setAttribute("transform", `translate(${p.x} ${p.y}) scale(${sc})`);
    g.querySelector(".flip").setAttribute("transform", `scale(${p.dir} 1)`);
  });
  const herd = $("#herd");
  [...herd.children].sort((a, b) => FV.pos[a.dataset.id].y - FV.pos[b.dataset.id].y).forEach(g => herd.appendChild(g));
}
function yardWalk() {
  F.animals.forEach(a => {
    const p = FV.pos[a.id];
    if (!p || a.inStal || p.busy) return;
    const dx = p.tx - p.x, dy = p.ty - p.y, d = Math.hypot(dx, dy);
    if (d < 2) { if (Math.random() < .02) { p.tx = rnd(MEADOW.x0, MEADOW.x1); p.ty = rnd(MEADOW.y0, MEADOW.y1); } return; }
    p.x += dx / d * 0.9; p.y += dy / d * 0.5;
    if (Math.abs(dx) > 2) p.dir = dx > 0 ? 1 : -1;
  });
  yardPlace();
}
function yardNeeds() {
  F.animals.forEach(a => {
    const g = document.querySelector(`#herd .pet[data-id="${a.id}"] .bub`);
    if (!g) return;
    const k = minNeed(a), low = a.needs[k] < 45 && !F.night;
    const ready = !F.night && ((a.type === "koe" || a.type === "schaap") && !a.baby && a.prod >= 100);
    const icon = low ? NEED_ICON[k === "s" && a.type === "varken" ? "m" : k] : ready ? TOOL[a.type === "koe" ? "melk" : "schaar"] : "";
    const pet = g.parentNode.querySelector(".flip .animal"); if (pet) pet.classList.toggle("fine", moodCls(a) === "fine");
    g.innerHTML = icon ? `<g transform="translate(-22 -${a.type === "paard" ? 150 : 125})"><path d="M22 52 l-8 -10 h16 z" fill="#fff" ${TH}/><rect x="0" y="0" width="44" height="44" rx="14" fill="#fff" ${ST}/><g transform="translate(4 4) scale(.9)">${icon.replace(/<\/?svg[^>]*>/g, "")}</g></g>` : "";
  });
}
function tapAnimal(a, g) {
  unlockAudio();
  if (F.night) {
    if (a.inStal) return;
    const p = FV.pos[a.id]; p.busy = true; p.dir = -1;
    say("g_" + a.type);
    fAnim(1400, t => { p.x += (84 - p.x) * t * .25; p.y += (238 - p.y) * t * .25; yardPlace(); }, () => {
      a.inStal = true; fSave(); g.remove(); sfx.pop();
      if (F.animals.every(x => x.inStal)) { say("slapen"); fLater(sleepOverlay, 1200); }
    });
    return;
  }
  say("g_" + a.type);
  g.classList.remove("bounce"); void g.getBBox(); g.classList.add("bounce");
  fLater(() => care(a), 450);
}

/* ---------- verzorgen ---------- */
function care(a) {
  const pig = a.type === "varken";
  const tools = ["voer", "water", pig ? "modder" : "borstel", "aai"];
  if (a.type === "koe" && !a.baby) tools.push("melk");
  if (a.type === "schaap" && !a.baby) tools.push("schaar");
  const hasTreat = () => F.stock.wortel + F.stock.sla + F.stock.aardbei > 0;
  const sc = a.baby ? 1.5 : 2.2, ax = 300, ay = 318;
  const el = view("care", `
    <svg viewBox="0 0 ${W} ${H}" id="careSvg">
      <rect width="${W}" height="${H}" fill="#D7A86E"/>
      ${Array.from({ length: 9 }, (_, i) => `<path d="M0 ${i * 30} H${W}" stroke="#B98552" stroke-width="3"/>`).join("")}
      <rect y="250" width="${W}" height="125" fill="#FFE082"/>
      ${Array.from({ length: 40 }, (_, i) => `<path d="M${(i * 53) % W} ${260 + (i * 29) % 110} l12 -6" stroke="#E0A800" stroke-width="3" stroke-linecap="round"/>`).join("")}
      <g transform="translate(${ax} ${ay}) scale(${sc})" id="pet">
        <rect class="hit" x="-45" y="-95" width="110" height="100" fill="transparent"/>
        <g class="animal ${moodCls(a)} ${a.type === "schaap" && a.prod < 60 ? "kaal" : ""}" id="petBody">${FARM_SVG(a.type)}</g>
        <g id="petSpots"></g><g id="petMud"></g>
        ${a.type === "koe" ? `<g id="udder"><ellipse cx="-4" cy="-22" rx="9" ry="6" fill="#F8BBD0" ${TH}/><path d="M-9 -17 v4 M-4 -16 v4 M1 -17 v4" stroke="#F48FB1" stroke-width="2.5" stroke-linecap="round"/></g>` : ""}
      </g>
      <g id="bucket"></g>
      <g id="cfx"></g>
    </svg>
    <div class="meters">${["h", "d", "s", "b"].map(k => `<div class="meter"><span class="mi">${NEED_ICON[k === "s" && pig ? "m" : k]}</span><span class="mbar"><i id="m_${k}"></i></span></div>`).join("")}</div>
    <div class="petname">${a.name}</div>
    <div class="tools">${tools.map(t => `<button class="btn tool" data-t="${t}" aria-label="${t}">${TOOL[t === "voer" ? (pig ? "appel" : "hooi") : t]}</button>`).join("")}
      <button class="btn tool" data-t="lekkers" id="treatBtn" aria-label="lekkers" ${hasTreat() ? "" : "hidden"}>${ico(CROP[F.stock.aardbei ? "aardbei" : F.stock.wortel ? "wortel" : "sla"])}</button></div>`);
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
  const k = minNeed(a);
  if (a.needs[k] < 60) sayA(a, needLine(a, k));
  else if (a.type === "koe" && !a.baby && a.prod >= 100) say("melk_klaar");
  else if (a.type === "schaap" && !a.baby && a.prod >= 100) say("wol_klaar");
  else sayA(a, "b_blij");
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
    if (!c.feed) {
      const p = Math.max(1, Math.min(3, Math.ceil((100 - a.needs.h) / 34)));
      c.feed = { left: p, i: 0 };
      sayA(a, "hap" + p);
      return;
    }
    c.feed.i++; c.feed.left--;
    const inner = `<g transform="translate(-20 -20)">${a.type === "varken" ? FOODS.appel.svg : TOOL.hooi.replace(/<\/?svg[^>]*>/g, "")}</g>`;
    flyTo(svg, inner, 600, 150, mx, my, 600, () => { sfx.pop(); }, 1);
    a.needs.h = Math.min(100, a.needs.h + 34);
    say("n" + c.feed.i, () => {});
    if (c.feed.left <= 0 || a.needs.h >= 100) { c.feed = null; fLater(() => { say("smikkel"); careHearts(); }, 900); }
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
    const crop = F.stock.aardbei ? "aardbei" : F.stock.wortel ? "wortel" : F.stock.sla ? "sla" : null;
    if (!crop) return;
    F.stock[crop]--;
    flyTo(svg, `<g transform="translate(-20 -20)">${CROP[crop]}</g>`, 600, 150, mx, my, 600, () => {
      sfx.sparkle(); a.needs.b = Math.min(100, a.needs.b + 30); a.needs.h = Math.min(100, a.needs.h + 15);
      careMeters(); fSave(); say("lekkers"); careHearts();
      const tb = $("#treatBtn");
      if (F.stock.wortel + F.stock.sla + F.stock.aardbei <= 0) tb.hidden = true;
      else tb.innerHTML = ico(CROP[F.stock.aardbei ? "aardbei" : F.stock.wortel ? "wortel" : "sla"]);
    });
    return;
  }
  if (t === "borstel") {
    if (!$("#petSpots").children.length) { say("borstel_klaar"); sparkleAt(careFx(), c.ax, c.ay - 80, true, ["#FFD600", "#fff"]); a.needs.s = 100; careMeters(); fSave(); return; }
    c.mode = "borstel"; sayA(a, "b_vies"); return;
  }
  if (t === "aai") { c.mode = "aai"; c.rub = 0; return; }
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
      if (a.needs.b >= 100 && !c.aai) { c.aai = true; say("g_" + a.type, () => say("aai_klaar")); }
    }
    return;
  }
  if (c.mode === "melk" && Math.hypot(p.x + 4, p.y + 20) < 16 && isDown) {
    c.milk++;
    tone(900 + c.milk * 40, 0.08, "sine", 0.12, 0, 1400);
    const lvl = $("#milkLvl"); if (lvl) { const h = c.milk * 5; lvl.setAttribute("height", h); lvl.setAttribute("y", 30 - h); }
    if (c.milk >= 6) {
      c.mode = null; a.prod = 0; F.stock.melk++; fSave();
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
  const spots = [[120, 300], [250, 330], [400, 310], [300, 280], [200, 350], [460, 345]];
  const draw = () => {
    $("#eggs").innerHTML = spots.slice(0, F.eggs).map(([x, y], i) => `<g class="egg" data-i="${i}" transform="translate(${x} ${y})"><rect x="-24" y="-30" width="48" height="48" fill="transparent"/><ellipse rx="11" ry="14" fill="#FFF3E0" ${ST}/></g>`).join("");
    $("#eggs").querySelectorAll(".egg").forEach(g => g.addEventListener("pointerdown", e => {
      e.stopPropagation(); if (g.dataset.gone) return; g.dataset.gone = 1;
      const [x, y] = spots[+g.dataset.i];
      g.remove(); F.eggs--; F.stock.ei++; FV.eggCount = (FV.eggCount || 0) + 1; fSave();
      say("n" + Math.min(20, FV.eggCount));
      flyTo($("#coopSvg"), `<ellipse rx="11" ry="14" fill="#FFF3E0" ${ST}/>`, x, y, 560, 300, 600, () => { sfx.pop(); $("#basketN").textContent = F.stock.ei; if (!F.eggs) fLater(() => say("ei_klaar"), 700); });
    }));
  };
  FV.eggCount = 0;
  draw();
  $("#graanBtn").addEventListener("click", () => {
    unlockAudio();
    for (let i = 0; i < 10; i++) sparkleAt($("#cfx"), rnd(150, 500), rnd(260, 330), false, ["#FFB300", "#FFD54F"]);
    say("kip_eten"); say("g_kip", () => {});
    document.querySelectorAll("#hens .animal").forEach(h => { h.classList.remove("bounce"); void h.getBBox(); h.classList.add("bounce"); });
    const now = Date.now();
    if (F.eggs < 6 && (!F.fedT || now - F.fedT > 5 * 60 * 1000)) {
      F.fedT = now; fSave();
      fLater(() => { F.eggs = Math.min(6, F.eggs + 1); fSave(); draw(); sfx.pop(); say("ei_zoek"); }, 2500);
    }
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
    F.plots[i] = { crop: t, planted: Date.now(), w: 0 }; fSave(); sfx.pop();
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
    <svg viewBox="0 0 ${W} ${H}" class="marketfx" id="mktSvg"></svg>`);
  backBtn(el, () => { fSave(); yard(); });
  coinBox(el);
  const refresh = () => {
    Object.keys(PRICE_SELL).forEach(k => { $("#st_" + k).textContent = F.stock[k]; el.querySelector(`.sellbtn[data-k="${k}"]`).classList.toggle("empty", !F.stock[k]); });
    el.querySelectorAll(".buybtn").forEach(b => b.classList.toggle("afford", F.coins >= PRICE_BUY[b.dataset.t]));
    setCoins();
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
    for (let i = 0; i < n; i++) fLater(() => {
      flyTo($("#mktSvg"), `<circle r="10" fill="#FFC107" ${TH}/>`, x0, y0, 620, 34, 600, () => {
        F.coins++; fSave(); setCoins(); tone(1320, .08, "square", .06); say("n" + Math.min(20, i + 1));
        const cb = $("#coinBox"); cb.classList.remove("pop"); void cb.offsetWidth; cb.classList.add("pop");
        if (i === n - 1) { busy = false; refresh(); }
      });
    }, 600 + i * 700);
  }));
  el.querySelectorAll(".buybtn").forEach(b => b.addEventListener("click", () => {
    unlockAudio();
    const t = b.dataset.t;
    if (F.animals.length >= MAX_ANIMALS) { say("vol_boerderij"); return; }
    if (F.coins < PRICE_BUY[t]) { say("te_weinig"); b.classList.remove("wrong"); void b.offsetWidth; b.classList.add("wrong"); return; }
    F.coins -= PRICE_BUY[t]; fSave(); sfx.fanfare();
    say("g_" + t);
    pickName(t, false, a => { yard(); fLater(() => say("gekocht", () => say(nameClip(a))), 500); });
  }));
  say("markt_welkom", () => say("winkel_welkom"));
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
function wakeUp() {
  unlockAudio();
  const babies = [];
  F.animals.forEach(a => {
    if (a.inStal && !a.baby) {
      const good = Object.values(a.needs).every(v => v >= 60);
      a.nights = good ? (a.nights || 0) + 1 : 0;
      if (a.nights >= 3 && F.animals.length + babies.length < MAX_ANIMALS && NAMES[a.type]) { a.nights = 0; babies.push(a.type); }
    }
    a.inStal = false;
    for (const k in a.needs) a.needs[k] = Math.max(20, a.needs[k] - 12);
    if (PROD[a.type] && !a.baby) a.prod = 100;
  });
  F.night = false; F.day++; F.eggs = Math.min(6, F.eggs + 2);
  FV.pos = {};
  fSave();
  yard();
  sfx.fanfare();
  say("ochtend", () => {
    if (!babies.length) return;
    const t = babies[0];
    confetti(80);
    say("baby", () => pickName(t, true, a => { yard(); fLater(() => sayA(a, "b_blij"), 500); }));
  });
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
    F = fNew(); fSave(); ov.remove(); FV.pos = {}; pickFirst();
  });
}
