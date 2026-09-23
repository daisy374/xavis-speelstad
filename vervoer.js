"use strict";
/* Xavi's Bus — passagiers ophalen en wegbrengen, en steeds tellen hoeveel er in de bus zitten.
   Gebruikt de gedeelde hulpjes uit app.js (say, sfx, tone, confetti, sparkleAt, ICONS, …). */

const VKEY = "xavi-vervoer-v1";
const STOP_GAP = 700, BUS_X = 150;
const PAS_COL = ["#E53935", "#1E88E5", "#43A047", "#FB8C00", "#8E24AA", "#00ACC1", "#F06292", "#FDD835"];
/* een wachtend of zittend mensje (voeten op y=0) */
function pasSVG(i, klein) {
  const c = PAS_COL[i % PAS_COL.length], h = klein ? .8 : 1;
  return `<g transform="scale(${h})">
    <path d="M-9 0 V-16 Q-9 -26 0 -26 Q9 -26 9 -16 V0 Z" fill="${c}" ${TH}/>
    <circle cx="0" cy="-34" r="9" fill="#FFCC80" ${TH}/>
    <path d="M-9 -38 q9 -8 18 0 q-4 -6 -9 -6 q-5 0 -9 6z" fill="${i % 3 === 0 ? "#5D4037" : i % 3 === 1 ? "#FBC02D" : "#3E2723"}" ${TH}/>
    <circle cx="-3" cy="-34" r="1.4" fill="${INK}"/><circle cx="3" cy="-34" r="1.4" fill="${INK}"/>
    <path d="M-3 -29 q3 2 6 0" fill="none" stroke="${INK}" stroke-width="1.4" stroke-linecap="round"/></g>`;
}
const BUS_SVG = `
  <rect x="-130" y="-116" width="262" height="100" rx="16" fill="#FFC928" ${ST}/>
  <rect x="-130" y="-116" width="262" height="100" rx="16" fill="url(#bz-shade)" opacity=".5"/>
  <rect x="-122" y="-108" width="196" height="52" rx="8" fill="#CFEFFF" ${ST}/>
  <rect x="82" y="-108" width="42" height="52" rx="8" fill="#CFEFFF" ${ST}/>
  <rect x="58" y="-116" width="8" height="100" fill="#E0A800"/>
  <path d="M-130 -34 H132" stroke="#1E88E5" stroke-width="9"/>
  <rect x="-24" y="-116" width="10" height="100" fill="#E0A800" opacity=".8"/>
  <rect x="112" y="-46" width="18" height="12" rx="3" fill="#FFF59D" ${TH}/>
  <rect x="-132" y="-46" width="16" height="12" rx="3" fill="#FF5252" ${TH}/>
  ${[-82, 74].map(x => `<circle cx="${x}" cy="-12" r="20" fill="#2B2118" ${ST}/><circle cx="${x}" cy="-12" r="8" fill="#CFD8DC" ${TH}/>`).join("")}`;

/* ---------- toestand ---------- */
let VS = null, VV = null;
function vLoad() {
  try { VS = JSON.parse(localStorage.getItem(VKEY)); } catch (e) { VS = null; }
  if (!VS || VS.v !== 1) VS = { v: 1, done: 0, stars: 0 };
}
function vSave() { try { localStorage.setItem(VKEY, JSON.stringify(VS)); } catch (e) {} }
function vview(name, html) {
  VV.tok++; VV.view = name;
  clearInterval(VV.int); VV.int = null;
  if (VV.upH) { window.removeEventListener("pointerup", VV.upH); VV.upH = null; }
  const el = $("#vervoer");
  el.innerHTML = html;
  return el;
}
function vLater(fn, ms) { const tok = VV && VV.tok; return setTimeout(() => { if (VV && VV.tok === tok) fn(); }, ms); }
function vAnim(dur, fn, done) {
  const tok = VV && VV.tok, t0 = performance.now();
  const step = now => {
    if (!VV || VV.tok !== tok) return;
    const t = Math.min(1, (now - t0) / dur);
    fn(t);
    if (t < 1) requestAnimationFrame(step); else if (done) done();
  };
  requestAnimationFrame(step);
}
function vsay(name, cb) { const tok = VV && VV.tok; say(name, cut => { if (cut || !VV || VV.tok !== tok) return; if (cb) cb(); }); }
/* ---------- kiezen: bus of trein ---------- */
function vervoerMenu() {
  unlockAudio();
  show("vervoer");
  VV = { tok: 0 };
  const el = vview("menu", `
    <svg viewBox="0 0 ${W} ${H}">
      <rect width="${W}" height="${H}" fill="#8CC8EE"/>
      <circle cx="590" cy="52" r="28" fill="#FFD600" ${ST}/>
      <rect y="300" width="${W}" height="75" fill="#8BC34A" ${ST}/>
    </svg>
    <div class="vmenu">
      <button class="btn vcard" id="vBus" aria-label="De bus"><svg viewBox="-140 -126 280 144">${BUS_SVG}</svg><span>De bus</span></button>
      <button class="btn vcard" id="vTrein" aria-label="De trein"><svg viewBox="-118 -142 240 152">${typeof tLoco === "function" ? tLoco() : ""}</svg><span>De trein</span></button>
      <button class="btn vcard" id="vTaxi" aria-label="De taxi"><svg viewBox="-100 -118 200 128">${typeof TAXI_SVG !== "undefined" ? TAXI_SVG : ""}</svg><span>De taxi</span></button>
    </div>`);
  homeButton(el);
  $("#vBus").addEventListener("click", () => { sfx.honk(); busOpen(); });
  $("#vTrein").addEventListener("click", () => { sfx.pop(); if (typeof treinOpen === "function") treinOpen(); });
  $("#vTaxi").addEventListener("click", () => { sfx.honk(); if (typeof taxiOpen === "function") taxiOpen(); });
}

function busOpen() {
  unlockAudio(); vLoad();
  show("vervoer");
  VV = { tok: 0 };
  newRit();
}

function vervoerStop() { if (!VV) return; clearInterval(VV.int); if (VV.upH) window.removeEventListener("pointerup", VV.upH); VV = null; if (VS) vSave(); }

/* ---------- een nieuwe rit ---------- */
function newRit() {
  const lvl = VS.done < 2 ? 0 : VS.done < 5 ? 1 : 2;
  const haltes = [3, 4, 5][lvl], maxIn = [5, 10, 16][lvl];
  const stops = [];
  let inBus = 0;
  for (let i = 0; i < haltes; i++) {
    const ruimte = maxIn - inBus;
    let inst = Math.min(ruimte, 1 + Math.floor(Math.random() * (lvl === 0 ? 3 : lvl === 1 ? 4 : 6)));
    if (inst < 1) inst = 0;
    let uit = 0;
    if (lvl >= 1 && inBus > 0 && i > 0) uit = Math.min(inBus, 1 + Math.floor(Math.random() * Math.min(4, inBus)));
    if (lvl === 1 && Math.random() < .4) { if (uit > 0) inst = 0; }      // niveau 1: meestal één ding per halte
    if (inst === 0 && uit === 0) inst = 1;
    inBus = inBus - uit + inst;
    stops.push({ inst, uit });
  }
  VV.rit = { lvl, stops, i: -1, inBus: 0, done: false };
  scene();
  vsay("bus_welkom", () => vsay("bus_rijden"));
}

/* ---------- het straatbeeld ---------- */
function huis(x, i) {
  const h = 90 + (i % 4) * 34, c = ["#EF9A9A", "#90CAF9", "#A5D6A7", "#FFE082", "#CE93D8"][i % 5];
  return `<g><rect x="${x}" y="${288 - h}" width="96" height="${h}" fill="${c}" ${ST}/>
    <path d="M${x - 8} ${288 - h} H${x + 104} L${x + 48} ${288 - h - 34} Z" fill="#8D6E63" ${ST}/>
    ${[0, 1].map(r => [0, 1].map(k => `<rect x="${x + 16 + k * 44}" y="${288 - h + 22 + r * 40}" width="26" height="26" rx="3" fill="#CFEFFF" ${TH}/>`).join("")).join("")}</g>`;
}
function halteSVG(x, n) {
  return `<g class="halte" data-n="${n}">
    <rect x="${x - 10}" y="180" width="8" height="108" fill="#90A4AE" ${TH}/>
    <rect x="${x - 46}" y="150" width="82" height="36" rx="8" fill="#1E88E5" ${ST}/>
    <text x="${x - 5}" y="176" text-anchor="middle" class="vsign" fill="#fff">HALTE</text>
    <rect x="${x + 30}" y="176" width="120" height="8" rx="4" fill="#B0BEC5" ${ST}/>
    <rect x="${x + 140}" y="176" width="8" height="112" fill="#90A4AE" ${TH}/></g>`;
}
function scene() {
  const r = VV.rit;
  const el = vview("rit", `
    <svg viewBox="0 0 ${W} ${H}" id="busSvg">
      <rect width="${W}" height="${H}" fill="#8CC8EE"/>
      <circle cx="600" cy="50" r="26" fill="#FFD600" ${ST}/>
      <g id="world">
        ${Array.from({ length: 24 }, (_, i) => huis(120 + i * 150, i)).join("")}
        <rect y="288" width="4000" height="16" fill="#CFD8DC" ${ST}/>
        <rect y="304" width="4000" height="71" fill="#5B5B60"/>
        ${Array.from({ length: 60 }, (_, i) => `<rect x="${20 + i * 70}" y="336" width="36" height="6" rx="3" fill="#F1EEE6"/>`).join("")}
        <g id="stops"></g>
      </g>
      <g id="bus" transform="translate(${BUS_X} 300)">${BUS_SVG}<g id="inbus"></g></g>
      <g id="vfx"></g>
    </svg>
    <div class="vcount" id="vcount"><span class="vlabel">in de bus</span><b id="vnum">0</b></div>
    <button class="btn vgo" id="vgo" aria-label="Rijden"><svg viewBox="0 0 40 40"><path d="M13 8 L32 20 L13 32 Z" fill="#fff" ${ST}/></svg></button>
    <div class="vans" id="vans" hidden></div>`);
  homeButton(el);
  drawStops(); drawIn();
  $("#vgo").addEventListener("click", () => { unlockAudio(); rijden(); });
  VV.worldX = 0;
  setWorld();
}
const setWorld = () => { const w = $("#world"); if (w) w.setAttribute("transform", `translate(${-VV.worldX} 0)`); };
function drawStops() {
  const r = VV.rit, g = $("#stops"); if (!g) return;
  g.innerHTML = r.stops.map((s, i) => halteSVG(STOP_GAP * (i + 1), i + 1)).join("");
  // de wachtende mensjes bij de huidige halte
  const s = r.stops[r.i];
  if (s && s.wacht && s.wacht.length) {
    const x0 = STOP_GAP * (r.i + 1) + 40;
    g.insertAdjacentHTML("beforeend", `<g id="wachters">${s.wacht.map((p, k) => `<g class="pas" data-k="${k}" transform="translate(${x0 + k * 30} 288)"><rect x="-16" y="-48" width="32" height="50" fill="transparent"/>${pasSVG(p)}</g>`).join("")}</g>`);
    g.querySelectorAll("#wachters .pas").forEach(p => p.addEventListener("click", () => instap(+p.dataset.k)));
  }
}
/* een passagier achter het raam: alleen hoofd en schouders, in rijen van acht */
function pasKop(i) {
  const c = PAS_COL[i % PAS_COL.length];
  return `<path d="M-11 6 V-2 Q-11 -10 0 -10 Q11 -10 11 -2 V6 Z" fill="${c}" ${TH}/>
    <circle cx="0" cy="-14" r="8.5" fill="#FFCC80" ${TH}/>
    <path d="M-8.5 -18 q8.5 -7 17 0 q-4 -6 -8.5 -6 q-4.5 0 -8.5 6z" fill="${i % 3 === 0 ? "#5D4037" : i % 3 === 1 ? "#FBC02D" : "#3E2723"}" ${TH}/>
    <circle cx="-3" cy="-14" r="1.3" fill="${INK}"/><circle cx="3" cy="-14" r="1.3" fill="${INK}"/>`;
}
function drawIn() {
  const r = VV.rit, g = $("#inbus"); if (!g) return;
  // passagiers achter de ramen: twee rijen van acht, zo kan Xavi ze natellen
  g.innerHTML = r.zit ? r.zit.map((p, k) => {
    const col = k % 8, row = Math.floor(k / 8);
    const x = -112 + col * 26, y = -86 + row * 26;
    return `<g class="pas zit" data-k="${k}" transform="translate(${x} ${y})"><rect x="-13" y="-24" width="26" height="32" fill="transparent"/>${pasKop(p)}</g>`;
  }).join("") : "";
  const n = $("#vnum"); if (n) n.textContent = r.inBus;
}
/* ---------- rijden en stoppen ---------- */
function rijden() {
  const r = VV.rit;
  if (r.busy || r.vraag) return;
  r.busy = true;
  $("#vgo").hidden = true;
  r.i++;
  if (r.i >= r.stops.length) { eindhalte(); return; }
  const s = r.stops[r.i];
  s.wacht = Array.from({ length: s.inst }, () => Math.floor(Math.random() * PAS_COL.length));
  s.inGedaan = 0; s.uitGedaan = 0;
  const from = VV.worldX, to = STOP_GAP * (r.i + 1) - 380;
  tone(90, .4, "sawtooth", .05, 0, 120);
  vAnim(2200, t => { VV.worldX = from + (to - from) * (t < .8 ? t / .8 * .96 + 0 : .96 + (t - .8) / .2 * .04); setWorld(); if (t > .5 && t < .55) drawStops(); }, () => {
    VV.worldX = to; setWorld(); drawStops(); drawIn();
    sfx.pop(); r.busy = false;
    vsay("bus_halte", () => stapStap());
  });
  drawStops();
}
function stapStap() {
  const r = VV.rit, s = r.stops[r.i];
  if (s.uit > 0 && s.uitGedaan < s.uit) { vsay("bus_uit_" + Math.min(10, s.uit), () => vsay("bus_tik_uit")); return; }
  if (s.inst > 0 && s.inGedaan < s.inst) { vsay("bus_in_" + Math.min(10, s.inst), () => vsay("bus_tik_in")); return; }
  vraagStellen();
}
function instap(k) {
  const r = VV.rit, s = r.stops[r.i];
  if (r.busy || r.vraag) return;
  if (s.uit > 0 && s.uitGedaan < s.uit) { vsay("bus_tik_uit"); return; }   // eerst de mensen eruit
  const g = document.querySelector(`#wachters .pas[data-k="${k}"]`);
  if (!g || g.dataset.weg) return;
  g.dataset.weg = 1;
  const x0 = STOP_GAP * (r.i + 1) + 40 + k * 30;
  s.inGedaan++; r.inBus++; r.zit = (r.zit || []).concat([Math.floor(Math.random() * PAS_COL.length)]);
  say("n" + Math.min(20, s.inGedaan));
  vAnim(600, t => g.setAttribute("transform", `translate(${x0 - (x0 - (STOP_GAP * (r.i + 1) - 380 + BUS_X + 30)) * t} ${288 - Math.sin(Math.PI * t) * 20}) scale(${1 - t * .4})`), () => {
    g.remove(); sfx.pop(); drawIn();
    if (s.inGedaan >= s.inst) vLater(vraagStellen, 700);
  });
}
function uitstap(k) {
  const r = VV.rit, s = r.stops[r.i];
  if (r.busy || r.vraag || !s || s.uitGedaan >= s.uit) { if (s && s.uit === 0) vsay("bus_tik_in"); return; }
  const g = document.querySelector(`#inbus .pas[data-k="${k}"]`);
  if (!g) return;
  s.uitGedaan++; r.inBus--; r.zit.splice(k, 1);
  say("n" + Math.min(20, s.uitGedaan));
  const fly = svgEl("", `<g transform="translate(${BUS_X + 30} 300)">${pasSVG(0)}</g>`);
  $("#vfx").appendChild(fly);
  vAnim(700, t => fly.setAttribute("transform", `translate(${BUS_X + 30 + t * 150} ${300 - Math.sin(Math.PI * t) * 24})`), () => { fly.remove(); sfx.pop(); });
  drawIn();
  if (s.uitGedaan >= s.uit) vLater(() => stapStap(), 800);
}
/* ---------- de telvraag ---------- */
function vraagStellen() {
  const r = VV.rit;
  if (r.vraag) return;
  r.vraag = true;
  const goed = r.inBus;
  const opties = new Set([goed]);
  while (opties.size < 3) { const d = goed + (Math.random() < .5 ? -1 : 1) * (1 + Math.floor(Math.random() * 2)); if (d >= 0 && d <= 20) opties.add(d); }
  const lijst = [...opties].sort(() => Math.random() - .5);
  const box = $("#vans");
  box.hidden = false;
  box.innerHTML = lijst.map(n => `<button class="btn vansb" data-n="${n}">${n}</button>`).join("");
  box.querySelectorAll(".vansb").forEach(b => b.addEventListener("click", () => {
    unlockAudio();
    const n = +b.dataset.n;
    if (n !== goed) { b.classList.remove("wrong"); void b.offsetWidth; b.classList.add("wrong"); vsay("bus_fout"); return; }
    box.hidden = true; box.innerHTML = "";
    r.vraag = false;
    confetti(40); sfx.fanfare(); VS.stars++; vSave();
    vsay("bus_goed", () => { if (r.i < r.stops.length - 1) vsay("bus_rijden"); });
    $("#vgo").hidden = false;
  }));
  vsay(r.inBus === 0 ? "bus_leeg" : "bus_hoeveel");
  if (r.inBus === 0) { box.hidden = true; r.vraag = false; $("#vgo").hidden = false; }
}
/* ---------- eindhalte ---------- */
function eindhalte() {
  const r = VV.rit;
  const from = VV.worldX, to = from + 600;
  vAnim(2000, t => { VV.worldX = from + (to - from) * t; setWorld(); }, () => {
    r.zit = []; r.inBus = 0; drawIn();
    confetti(80); sfx.fanfare();
    VS.done++; VS.stars++; vSave();
    vsay("bus_eind", () => vsay("bus_klaar"));
    const el = $("#vervoer");
    const again = document.createElement("button");
    again.className = "btn vagain"; again.setAttribute("aria-label", "Nog een rit");
    again.innerHTML = ICONS.play;
    again.addEventListener("click", () => { unlockAudio(); sfx.pop(); newRit(); });
    el.appendChild(again);
    const st = document.createElement("div");
    st.className = "vstars";
    st.innerHTML = `<svg viewBox="0 0 40 40"><path d="M20 4 l5 11 12 1 -9 8 3 12 -11 -6 -11 6 3 -12 -9 -8 12 -1z" fill="#FFD600" ${ST}/></svg><span>${VS.stars}</span>`;
    el.appendChild(st);
  });
}
// de mensjes in de bus zijn aantikbaar om uit te stappen
document.addEventListener("click", e => {
  if (!VV || VV.view !== "rit") return;
  const p = e.target.closest && e.target.closest("#inbus .pas");
  if (p) uitstap(+p.dataset.k);
});

// het startscherm is al getekend voordat dit bestand laadde: nu opnieuw, met de busknop compleet
if (typeof renderHome === "function" && typeof current !== "undefined" && current === "home") renderHome();
