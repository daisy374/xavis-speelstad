"use strict";
/* Xavi's Trein — wagons koppelen op volgorde, kisten laden en tellen, en naar het goede perron rijden.
   Gebruikt de gedeelde hulpjes uit app.js (say, sfx, tone, confetti, sparkleAt, ICONS, …) en pasSVG uit vervoer.js. */

const TKEY = "xavi-trein-v1";
const TR_COL = ["#E53935", "#1E88E5", "#43A047", "#FB8C00", "#8E24AA"];
const TKIST = "#C68B4A";

/* ---------- tekeningen (voeten/wielen op y = 0) ---------- */
function tLoco() {
  return `<g>
    <rect x="-100" y="-46" width="192" height="12" rx="4" fill="#455A64" ${TH}/>
    <rect x="-24" y="-96" width="116" height="52" rx="24" fill="#37474F" ${ST}/>
    <rect x="-8" y="-90" width="84" height="10" rx="5" fill="#546E7A"/>
    <circle cx="86" cy="-66" r="12" fill="#FFF59D" ${TH}/>
    <rect x="-100" y="-114" width="78" height="70" rx="8" fill="#E53935" ${ST}/>
    <rect x="-108" y="-126" width="94" height="14" rx="7" fill="#37474F" ${ST}/>
    <rect x="-88" y="-104" width="46" height="34" rx="6" fill="#CFEFFF" ${TH}/>
    <rect x="46" y="-120" width="24" height="26" rx="3" fill="#37474F" ${ST}/>
    <rect x="38" y="-130" width="40" height="12" rx="6" fill="#37474F" ${ST}/>
    <ellipse cx="14" cy="-96" rx="15" ry="8" fill="#FFD600" ${TH}/>
    <rect x="-112" y="-54" width="14" height="12" rx="3" fill="#90A4AE" ${TH}/>
    <circle cx="-56" cy="-22" r="22" fill="#2B2118" ${ST}/><circle cx="-56" cy="-22" r="9" fill="#CFD8DC" ${TH}/>
    <circle cx="-8" cy="-22" r="22" fill="#2B2118" ${ST}/><circle cx="-8" cy="-22" r="9" fill="#CFD8DC" ${TH}/>
    <circle cx="50" cy="-18" r="16" fill="#2B2118" ${ST}/><circle cx="50" cy="-18" r="6" fill="#CFD8DC" ${TH}/>
    <rect x="-60" y="-26" width="56" height="8" rx="4" fill="#B0BEC5" ${TH}/>
    <g class="tsmoke">${[0, 1, 2].map(i => `<circle cx="58" cy="-142" r="${9 + i * 2}" fill="#fff" opacity=".8" style="animation-delay:${i * .6}s"/>`).join("")}</g>
  </g>`;
}
/* een open goederenwagon; de kisten komen in het vak x -40..40, y -88..-40 */
function tWagon(col, n, kisten, klas) {
  const c = TR_COL[col % TR_COL.length];
  return `<g class="${klas || ""}">
    <rect x="-50" y="-42" width="100" height="10" rx="4" fill="#455A64" ${TH}/>
    <circle cx="-26" cy="-20" r="18" fill="#2B2118" ${ST}/><circle cx="-26" cy="-20" r="7" fill="#CFD8DC" ${TH}/>
    <circle cx="26" cy="-20" r="18" fill="#2B2118" ${ST}/><circle cx="26" cy="-20" r="7" fill="#CFD8DC" ${TH}/>
    <path d="M-46 -92 V-40 H46 V-92" fill="${c}"/>
    ${kisten || ""}
    <path d="M-46 -92 V-40 H46 V-92" fill="none" ${ST}/>
    <rect x="-46" y="-46" width="92" height="7" rx="3" fill="${c}" ${TH}/>
    ${n ? `<circle cx="-28" cy="-66" r="15" fill="#fff" ${TH}/><text x="-28" y="-58" text-anchor="middle" class="tnum">${n}</text>` : ""}
  </g>`;
}
const tKist = (x, y, s, klas, k) => `<g class="${klas || ""}" ${k === undefined ? "" : `data-k="${k}"`} transform="translate(${x} ${y})">
  <rect width="${s}" height="${s}" rx="2" fill="${TKIST}" stroke="${INK}" stroke-width="2.5"/>
  <path d="M0 0 L${s} ${s} M${s} 0 L0 ${s}" stroke="#8D5A2B" stroke-width="2"/></g>`;
/* plek van kist k in de wagon (eigen assenstelsel van de wagon) */
const tSlot = k => ({ x: -40 + (k % 5) * 16, y: -56 - Math.floor(k / 5) * 16 });
const tWagonKisten = (aantal, klas) => Array.from({ length: Math.min(15, aantal) }, (_, k) => {
  const p = tSlot(k); return tKist(p.x + 1.5, p.y + 1.5, 13, klas, k);
}).join("");

function tRails(y, x0, x1) {
  let s = "";
  for (let x = x0; x < x1; x += 34) s += `<rect x="${x}" y="${y + 7}" width="24" height="9" rx="2" fill="#8D6E63"/>`;
  return `<g>${s}<rect x="${x0}" y="${y}" width="${x1 - x0}" height="7" rx="3" fill="#B0BEC5" ${TH}/></g>`;
}
function tLucht(gras) {
  return `<rect width="${W}" height="${H}" fill="#8CC8EE"/>
    <circle cx="596" cy="46" r="26" fill="#FFD600" ${ST}/>
    <g fill="#fff" opacity=".9">${[[90, 50, 1], [300, 34, .8], [470, 62, .6]].map(c => `<g transform="translate(${c[0]} ${c[1]}) scale(${c[2]})"><ellipse rx="42" ry="20"/><ellipse cx="-26" cy="6" rx="24" ry="14"/><ellipse cx="28" cy="4" rx="26" ry="15"/></g>`).join("")}</g>
    ${[60, 240, 430, 600].map((x, i) => `<path d="M${x - 110} ${gras} q110 -${70 + i * 8} 220 0z" fill="#7CB342"/>`).join("")}
    <rect y="${gras}" width="${W}" height="${H - gras}" fill="#8BC34A"/>`;
}

/* ---------- toestand ---------- */
let TS = null, TT = null;
function tLoad() {
  try { TS = JSON.parse(localStorage.getItem(TKEY)); } catch (e) { TS = null; }
  if (!TS || TS.v !== 1) TS = { v: 1, done: 0, stars: 0 };
}
function tSave() { try { localStorage.setItem(TKEY, JSON.stringify(TS)); } catch (e) {} }
function tview(name, html) {
  TT.tok++; TT.view = name;
  const el = $("#trein");
  el.innerHTML = html;
  return el;
}
function tLater(fn, ms) { const tok = TT && TT.tok; return setTimeout(() => { if (TT && TT.tok === tok) fn(); }, ms); }
function tAnim(dur, fn, done) {
  const tok = TT && TT.tok, t0 = performance.now();
  const step = now => {
    if (!TT || TT.tok !== tok) return;
    const t = Math.min(1, (now - t0) / dur);
    fn(t);
    if (t < 1) requestAnimationFrame(step); else if (done) done();
  };
  requestAnimationFrame(step);
}
function tsay(name, cb) { const tok = TT && TT.tok; say(name, cut => { if (cut || !TT || TT.tok !== tok) return; if (cb) cb(); }); }
function tToet() { tone(370, .55, "sawtooth", .1, 0, 370); tone(466, .55, "sawtooth", .08, 0, 466); tone(311, .4, "sawtooth", .08, .5, 311); }
function tClank() { tone(180, .12, "square", .12, 0, 90); tone(1200, .07, "triangle", .07, .03); }

function treinOpen() {
  unlockAudio(); tLoad();
  show("trein");
  TT = { tok: 0 };
  tNieuweRit();
}
function treinStop() { if (!TT) return; TT.tok++; TT = null; if (TS) tSave(); }

/* ---------- een nieuwe rit ---------- */
function tNieuweRit() {
  const lvl = TS.done < 2 ? 0 : TS.done < 5 ? 1 : 2;
  const aantal = [3, 4, 5][lvl];
  const terug = lvl === 2 && Math.random() < .5;
  const wagons = Array.from({ length: aantal }, (_, i) => ({ n: i + 1, col: i % TR_COL.length }));
  const volgorde = terug ? wagons.slice().reverse() : wagons.slice();
  const los = wagons.slice().sort(() => Math.random() - .5);
  TT.rit = { lvl, terug, volgorde, los, gekoppeld: [], fout: 0 };
  tFase1();
}

/* ---------- deel 1: wagons koppelen ---------- */
function tFase1() {
  const r = TT.rit;
  const el = tview("koppel", `
    <svg viewBox="0 0 ${W} ${H}" id="tsvg">
      ${tLucht(236)}
      ${tRails(250, 0, W)}
      <g id="ttrein"></g>
      <g id="tfx"></g>
    </svg>
    <div class="tcards" id="tcards">${r.los.map((w, i) => `<button class="btn tcard" data-i="${i}" aria-label="Wagon ${w.n}"><svg viewBox="-54 -100 108 104">${tWagon(w.col, w.n, "")}</svg></button>`).join("")}</div>`);
  homeButton(el);
  tTekenTrein();
  el.querySelectorAll(".tcard").forEach(b => b.addEventListener("click", () => { unlockAudio(); tKoppel(+b.dataset.i, b); }));
  tsay("trein_welkom", () => tsay(r.terug ? "trein_terug" : "trein_koppel"));
}
function tTekenTrein(nieuw) {
  const r = TT.rit, g = $("#ttrein"); if (!g) return;
  const n = r.volgorde.length, s = n >= 5 ? .8 : n === 4 ? .9 : 1;
  const klaar = r.gekoppeld.length >= n;
  g.innerHTML = `<g transform="translate(560 250) scale(${s})">
    ${tLoco()}
    ${r.gekoppeld.map((w, k) => `<g transform="translate(${-158 - k * 100} 0)"><g class="${nieuw && k === r.gekoppeld.length - 1 ? "tin" : ""}">${tWagon(w.col, w.n, "")}</g></g>`).join("")}
    ${klaar ? "" : `<g transform="translate(${-158 - r.gekoppeld.length * 100} 0)"><rect x="-46" y="-92" width="92" height="52" rx="6" fill="#fff" opacity=".25"/><rect x="-46" y="-92" width="92" height="52" rx="6" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="11 9"/></g>`}
  </g>`;
}
function tKoppel(i, btn) {
  const r = TT.rit;
  if (r.busy) return;
  const w = r.los[i];
  if (!w || w.weg) return;
  const doel = r.volgorde[r.gekoppeld.length];
  if (!doel || w.n !== doel.n) {
    btn.classList.remove("wrong"); void btn.offsetWidth; btn.classList.add("wrong");
    tone(160, .25, "square", .12, 0, 110);
    r.fout++;
    tsay("trein_fout_wagon", () => { if (r.fout >= 2) tHint(); });
    return;
  }
  r.fout = 0; r.busy = true;
  w.weg = true; btn.classList.add("gone"); btn.disabled = true;
  r.gekoppeld.push(w);
  tTekenTrein(true);
  tClank(); say("n" + w.n);
  tLater(() => {
    r.busy = false;
    if (r.gekoppeld.length >= r.volgorde.length) {
      confetti(30); tToet();
      tsay("trein_gekoppeld", () => tLater(tFase2, 200));
    }
  }, 620);
}
function tHint() {
  const r = TT.rit, doel = r.volgorde[r.gekoppeld.length]; if (!doel) return;
  const i = r.los.findIndex(w => w.n === doel.n && !w.weg);
  const b = document.querySelector(`#tcards .tcard[data-i="${i}"]`);
  if (b) { b.classList.add("tglow"); tLater(() => b.classList.remove("tglow"), 2000); }
}

/* ---------- deel 2: kisten laden ---------- */
function tFase2() {
  const r = TT.rit;
  const cols = r.volgorde.map(w => w.col);
  let L;
  if (r.lvl === 0) {
    L = { type: "laad", wagons: [{ col: cols[0], doel: 2 + Math.floor(Math.random() * 5), k: 0 }] };
  } else if (r.lvl === 1) {
    L = { type: "laad", wagons: [{ col: cols[0], doel: 3 + Math.floor(Math.random() * 4), k: 0 }, { col: cols[1], doel: 2 + Math.floor(Math.random() * 4), k: 0 }] };
  } else if (Math.random() < .6) {
    const start = 8 + Math.floor(Math.random() * 8), weg = 2 + Math.floor(Math.random() * 4);
    L = { type: "haal", weg, start, wagons: [{ col: cols[0], doel: start - weg, k: start }] };
  } else {
    L = { type: "laad", wagons: [{ col: cols[0], doel: 4 + Math.floor(Math.random() * 5), k: 0 }, { col: cols[1], doel: 3 + Math.floor(Math.random() * 4), k: 0 }] };
  }
  L.pile = L.type === "haal" ? 0 : Math.min(12, L.wagons.reduce((a, w) => a + w.doel, 0) + 2);
  L.klaar = false;
  TT.laad = L;
  const el = tview("laden", `
    <svg viewBox="0 0 ${W} ${H}" id="tsvg">
      ${tLucht(250)}
      <g transform="translate(316 -8)"><rect x="90" y="96" width="270" height="162" fill="#B0A08C" ${ST}/><path d="M74 96 H376 L342 54 H108 Z" fill="#8D6E63" ${ST}/><rect x="112" y="150" width="76" height="108" rx="6" fill="#6D4C41" ${TH}/></g>
      ${tRails(300, 0, W)}
      <g id="twagons"></g>
      <g id="tpile"></g>
      <g id="tfx"></g>
    </svg>
    <button class="btn tklaar" id="tklaar" aria-label="Klaar"><svg viewBox="0 0 40 40"><path d="M8 21 l8 9 L33 10" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
    <div class="vans" id="tans" hidden></div>`);
  homeButton(el);
  tDrawLaad();
  $("#tklaar").addEventListener("click", () => { unlockAudio(); tCheckLaad(); });
  if (L.type === "haal") {
    $("#tklaar").hidden = true;
    tsay("trein_haal_" + L.weg);
  } else if (L.wagons.length > 1) {
    tsay("trein_twee", () => tsay("trein_doe_" + L.wagons[0].doel));
  } else {
    tsay("trein_doe_" + L.wagons[0].doel, () => tsay("trein_klaarknop"));
  }
}
/* welke wagon krijgt de volgende kist? */
function tActief() {
  const L = TT.laad;
  const i = L.wagons.findIndex(w => w.k < w.doel);
  return i < 0 ? L.wagons.length - 1 : i;
}
function tWagonPos(i) {
  const L = TT.laad;
  return L.wagons.length > 1 ? { x: 150 + i * 160, y: 300, s: 1.05 } : { x: 210, y: 300, s: 1.3 };
}
const tPilePos = k => ({ x: 438 + (k % 4) * 54, y: 262 - Math.floor(k / 4) * 36 });
function tDrawLaad() {
  const L = TT.laad, g = $("#twagons"), p = $("#tpile");
  if (!g || !p) return;
  const act = tActief();
  g.innerHTML = L.wagons.map((w, i) => {
    const pos = tWagonPos(i), bord = L.type === "haal" ? `−${L.weg}` : w.doel;
    return `<g data-w="${i}" transform="translate(${pos.x} ${pos.y}) scale(${pos.s})">${tWagon(w.col, 0, tWagonKisten(w.k, "tk"), L.wagons.length > 1 && i === act && !L.klaar ? "tact" : "")}</g>
      <g transform="translate(${pos.x} ${pos.y - 100 * pos.s})">
        <rect x="-5" y="-30" width="10" height="34" fill="#90A4AE" ${TH}/>
        <rect x="-32" y="-72" width="64" height="48" rx="8" fill="${L.type === "haal" ? "#FFCDD2" : i === act && !L.klaar ? "#FFE14D" : "#fff"}" ${ST}/>
        <text x="0" y="-36" text-anchor="middle" class="tnum tbig">${bord}</text>
        ${L.type !== "haal" && w.k === w.doel ? `<g transform="translate(30 -70)"><circle r="14" fill="#22C55E" ${TH}/><path d="M-6 0 l4 5 l8 -10" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g>` : ""}</g>`;
  }).join("");
  p.innerHTML = Array.from({ length: L.pile }, (_, k) => { const q = tPilePos(k); return tKist(q.x, q.y, 34, "tp", k); }).join("");
  g.querySelectorAll(".tk").forEach(el => el.addEventListener("click", ev => { ev.stopPropagation(); unlockAudio(); tUitWagon(el); }));
  p.querySelectorAll(".tp").forEach(el => el.addEventListener("click", () => { unlockAudio(); tInWagon(+el.dataset.k); }));
}
function tVlieg(x0, y0, x1, y1, s0, s1, done) {
  const fx = $("#tfx"); if (!fx) { if (done) done(); return; }
  const g = svgEl("", tKist(-s0 / 2, -s0 / 2, s0));
  fx.appendChild(g);
  tAnim(380, t => {
    const e = t * t * (3 - 2 * t), sc = s0 + (s1 - s0) * e;
    g.setAttribute("transform", `translate(${x0 + (x1 - x0) * e} ${y0 + (y1 - y0) * e - Math.sin(Math.PI * t) * 40}) scale(${sc / s0})`);
  }, () => { g.remove(); sfx.pop(); if (done) done(); });
}
function tInWagon(k) {
  const L = TT.laad;
  if (L.busy || L.klaar || L.pile <= 0) return;
  const i = tActief(), w = L.wagons[i];
  if (w.k >= 15) return;
  L.busy = true;
  const from = tPilePos(k), pos = tWagonPos(i), slot = tSlot(w.k);
  L.pile--; w.k++;
  tDrawLaad();
  tVlieg(from.x + 17, from.y + 17, pos.x + (slot.x + 8) * pos.s, pos.y + (slot.y + 8) * pos.s, 34, 16 * pos.s, () => {
    L.busy = false;
    if (L.type !== "haal") say("n" + Math.min(20, w.k));
    tNaZet(i);
  });
}
function tUitWagon(el) {
  const L = TT.laad;
  if (L.busy || L.klaar || L.pile >= 12) return;
  const groep = el.closest("[data-w]");
  const wi = groep ? +groep.dataset.w : 0, w = L.wagons[wi];
  if (!w || w.k <= 0) return;
  L.busy = true;
  const pos = tWagonPos(wi), slot = tSlot(w.k - 1), to = tPilePos(L.pile);
  w.k--; L.pile++;
  tDrawLaad();
  tVlieg(pos.x + (slot.x + 8) * pos.s, pos.y + (slot.y + 8) * pos.s, to.x + 17, to.y + 17, 16 * pos.s, 34, () => {
    L.busy = false;
    if (L.type === "haal") say("n" + Math.min(20, L.start - w.k));
    tNaZet(wi);
  });
}
function tNaZet(i) {
  const L = TT.laad;
  if (L.klaar) return;
  const w = L.wagons[i];
  if (L.type === "haal") {
    if (w.k === w.doel) { L.klaar = true; tDrawLaad(); tLater(tVraag, 500); }
    return;
  }
  if (L.wagons.length > 1 && i < L.wagons.length - 1 && w.k === w.doel) {
    tLater(() => tsay("trein_doe_" + L.wagons[i + 1].doel), 400);
  } else if (w.k === w.doel && i === L.wagons.length - 1) {
    tLater(() => tsay("trein_klaarknop"), 500);
  }
}
function tCheckLaad() {
  const L = TT.laad;
  if (L.busy || L.klaar) return;
  const teveel = L.wagons.find(w => w.k > w.doel), teweinig = L.wagons.find(w => w.k < w.doel);
  if (teveel) { tone(160, .25, "square", .12, 0, 110); tsay("trein_teveel"); return; }
  if (teweinig) { tone(160, .25, "square", .12, 0, 110); tsay("trein_teweinig"); return; }
  L.klaar = true;
  $("#tklaar").hidden = true;
  const pos = tWagonPos(0);
  sparkleAt($("#tfx"), pos.x, pos.y - 70, true);
  confetti(30); sfx.fanfare();
  TS.stars++; tSave();
  tsay("trein_geladen", () => tLater(tFase3, 200));
}
/* de telvraag na het uitladen */
function tVraag() {
  const L = TT.laad, goed = L.wagons[0].k;
  const opties = new Set([goed]);
  while (opties.size < 3) { const d = goed + (Math.random() < .5 ? -1 : 1) * (1 + Math.floor(Math.random() * 2)); if (d >= 0 && d <= 20) opties.add(d); }
  const box = $("#tans");
  box.hidden = false;
  box.innerHTML = [...opties].sort(() => Math.random() - .5).map(n => `<button class="btn vansb" data-n="${n}">${n}</button>`).join("");
  box.querySelectorAll(".vansb").forEach(b => b.addEventListener("click", () => {
    unlockAudio();
    if (+b.dataset.n !== goed) { b.classList.remove("wrong"); void b.offsetWidth; b.classList.add("wrong"); tsay("trein_fout_tel"); return; }
    box.hidden = true; box.innerHTML = "";
    confetti(40); sfx.fanfare(); TS.stars++; tSave();
    tsay(pick(["goed1", "goed2", "goed3", "goed4"]), () => tLater(tFase3, 150));
  }));
  tsay("trein_hoeveel");
}

/* ---------- deel 3: naar het goede perron ---------- */
function tFase3() {
  const r = TT.rit;
  const sporen = r.lvl === 0 ? 2 : 3;
  const ys = sporen === 2 ? [140, 280] : [110, 212, 314];
  const doel = 1 + Math.floor(Math.random() * sporen);
  const P = TT.perron = { sporen, ys, doel, klaar: false };
  const el = tview("perron", `
    <svg viewBox="0 0 ${W} ${H}" id="tsvg">
      <rect width="${W}" height="${H}" fill="#8CC8EE"/>
      <rect y="60" width="${W}" height="${H - 60}" fill="#8BC34A"/>
      ${tRails(212, 0, 300)}
      ${ys.map((y, i) => `<g><path d="M300 215 L430 ${y + 3} L667 ${y + 3}" fill="none" stroke="#8D6E63" stroke-width="16" stroke-linejoin="round"/>
        <path d="M300 215 L430 ${y + 3} L667 ${y + 3}" fill="none" stroke="#B0BEC5" stroke-width="7" stroke-linejoin="round"/>
        <rect x="446" y="${y + 18}" width="221" height="26" fill="#CFC3B0" ${TH}/>
        <g transform="translate(560 ${y + 20}) scale(.42)">${typeof pasSVG === "function" ? pasSVG(i + 1) : ""}</g>
        <g transform="translate(618 ${y + 20}) scale(.42)">${typeof pasSVG === "function" ? pasSVG(i + 3) : ""}</g>
        <g transform="translate(486 ${y - 4})"><rect x="-4" y="0" width="8" height="24" fill="#90A4AE" ${TH}/>
          <rect x="-26" y="-42" width="52" height="42" rx="8" fill="#1E88E5" ${ST}/>
          <text x="0" y="-10" text-anchor="middle" class="tnum tbig" fill="#fff">${i + 1}</text></g>
        <rect class="tspoor" data-n="${i + 1}" x="300" y="${y - 34}" width="367" height="76" fill="transparent"/></g>`).join("")}
      <g transform="translate(286 268)"><circle r="12" fill="#FFD600" ${TH}/><rect x="-4" y="-34" width="8" height="26" rx="4" fill="#546E7A" ${TH}/></g>
      <g id="trij"></g>
      <g id="tfx"></g>
    </svg>
    <div class="tbord"><svg viewBox="0 0 40 40"><path d="M6 20 H30 M22 11 l9 9 -9 9" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg><span>${doel}</span></div>`);
  homeButton(el);
  TT.pad = [[-260, 212], [300, 212], [430, ys[doel - 1]], [596, ys[doel - 1]]];
  TT.d0 = 500;
  tRijTeken(120);
  el.querySelectorAll(".tspoor").forEach(s => s.addEventListener("click", () => { unlockAudio(); tKiesSpoor(+s.dataset.n, s); }));
  P.busy = true;
  tAnim(1600, t => tRijTeken(120 + (TT.d0 - 120) * (1 - (1 - t) * (1 - t))), () => {
    P.busy = false;
    tsay("trein_perron_" + doel, () => tsay("trein_wissel"));
  });
}
/* punt op de route, gemeten in beeldpunten vanaf het begin */
function tPunt(d) {
  const p = TT.pad;
  let rest = d;
  for (let i = 0; i < p.length - 1; i++) {
    const dx = p[i + 1][0] - p[i][0], dy = p[i + 1][1] - p[i][1], len = Math.hypot(dx, dy);
    if (rest <= len || i === p.length - 2) {
      const t = Math.max(0, Math.min(1, rest / len));
      return { x: p[i][0] + dx * t, y: p[i][1] + dy * t, a: Math.atan2(dy, dx) * 180 / Math.PI };
    }
    rest -= len;
  }
  return { x: p[0][0], y: p[0][1], a: 0 };
}
function tRijTeken(d) {
  const r = TT.rit, g = $("#trij"); if (!g) return;
  const s = .5, stukken = [];
  const loc = tPunt(d);
  stukken.push(`<g transform="translate(${loc.x} ${loc.y}) rotate(${loc.a}) scale(${s})">${tLoco()}</g>`);
  r.volgorde.forEach((w, k) => {
    const p = tPunt(d - (150 + k * 100) * s);
    stukken.push(`<g transform="translate(${p.x} ${p.y}) rotate(${p.a}) scale(${s})">${tWagon(w.col, w.n, "")}</g>`);
  });
  g.innerHTML = stukken.join("");
}
function tKiesSpoor(n, el) {
  const P = TT.perron;
  if (P.klaar || P.busy) return;
  if (n !== P.doel) {
    P.busy = true;
    tone(160, .25, "square", .12, 0, 110);
    const f = svgEl("", `<rect x="440" y="${P.ys[n - 1] - 30}" width="220" height="60" rx="12" fill="#FF5252" opacity=".45"/>`);
    $("#tfx").appendChild(f);
    tLater(() => { f.remove(); P.busy = false; }, 500);
    tsay("trein_spoor_fout");
    return;
  }
  P.klaar = true;
  sfx.bell(); tToet();
  const eind = TT.pad.reduce((a, p, i) => i ? a + Math.hypot(p[0] - TT.pad[i - 1][0], p[1] - TT.pad[i - 1][1]) : 0, 0);
  const totaal = eind, d0 = TT.d0;
  tAnim(3200, t => tRijTeken(d0 + (totaal - d0) * (t < .85 ? t / .85 * .94 : .94 + (t - .85) / .15 * .06)), () => {
    confetti(80); sfx.fanfare();
    TS.done++; TS.stars++; tSave();
    tsay("trein_aangekomen");
    const el2 = $("#trein");
    const again = document.createElement("button");
    again.className = "btn vagain tagain"; again.setAttribute("aria-label", "Nog een rit");
    again.innerHTML = ICONS.play;
    again.addEventListener("click", () => { unlockAudio(); sfx.pop(); tNieuweRit(); });
    el2.appendChild(again);
    const st = document.createElement("div");
    st.className = "vstars";
    st.innerHTML = `<svg viewBox="0 0 40 40"><path d="M20 4 l5 11 12 1 -9 8 3 12 -11 -6 -11 6 3 -12 -9 -8 12 -1z" fill="#FFD600" ${ST}/></svg><span>${TS.stars}</span>`;
    el2.appendChild(st);
  });
}

if (typeof renderHome === "function" && typeof current !== "undefined" && current === "home") renderHome();
