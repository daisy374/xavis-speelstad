"use strict";
/* Xavi's Taxi — klant ophalen, naar het juiste gebouw rijden en de rit laten betalen met muntjes.
   Gebruikt buildingSVG() uit bouw.js (met Xavi's eigen bouwstad als die er is), pasSVG() uit vervoer.js
   en COIN_W() uit winkel.js. */

const XKEY = "xavi-taxi-v1";
const XW = 2500, XTAXI_X = 150, XROAD = 352;
const xbx = i => 430 + i * 340;
/* de vaste gebouwen; staat hetzelfde gebouw in Xavi's eigen bouwstad, dan gebruiken we dat exemplaar */
const XBUILD = {
  huis: { type: "huis", cols: ["rood", "geel", "rood", "geel", "geel", "rood", "geel", "rood"], roof: "blauw", res: "koe" },
  winkel: { type: "winkel", cols: ["oranje", "geel", "oranje", "geel"], shop: "ijs" },
  ziekenhuis: { type: "ziekenhuis", cols: Array(8).fill("blauw") },
  politie: { type: "politie", cols: Array(8).fill("blauw") },
  brandweer: { type: "brandweer", cols: Array(8).fill("rood") },
  garage: { type: "garage", cols: Array(8).fill("geel") },
  toren: { type: "toren", cols: Array.from({ length: 9 }, (_, i) => i % 2 ? "blauw" : "groen") }
};
const XSOORT = ["huis", "winkel", "ziekenhuis", "politie", "brandweer", "garage", "toren"];
function xEigenStad() {
  const eigen = {};
  try {
    const bs = JSON.parse(localStorage.getItem("xavi-bouwstad-v1"));
    if (bs && bs.plots) bs.plots.forEach(p => { if (p && p.type && !p.raw && !eigen[p.type]) eigen[p.type] = p; });
  } catch (e) {}
  return eigen;
}
const TAXI_SVG = `
  <rect x="-88" y="-52" width="176" height="36" rx="12" fill="#FFC928" ${ST}/>
  <path d="M-48 -52 L-30 -84 Q-26 -88 -20 -88 H32 Q38 -88 42 -84 L58 -52 Z" fill="#FFC928" ${ST}/>
  <path d="M-38 -55 L-25 -79 H-4 V-55 Z" fill="#CFEFFF" ${TH}/>
  <path d="M4 -55 V-79 H26 L39 -55 Z" fill="#CFEFFF" ${TH}/>
  ${Array.from({ length: 9 }, (_, i) => `<rect x="${-84 + i * 19}" y="-40" width="9.5" height="9" fill="${i % 2 ? INK : "#fff"}"/>`).join("")}
  <rect x="-84" y="-40" width="171" height="9" fill="none" stroke="${INK}" stroke-width="2"/>
  <rect x="-16" y="-106" width="44" height="20" rx="5" fill="#fff" ${TH}/>
  <text x="6" y="-91" text-anchor="middle" class="xsign">TAXI</text>
  <rect x="76" y="-38" width="12" height="9" rx="3" fill="#FFF59D" ${TH}/>
  <rect x="-88" y="-38" width="10" height="9" rx="3" fill="#FF5252" ${TH}/>
  <circle cx="-52" cy="-16" r="16" fill="#2B2118" ${ST}/><circle cx="-52" cy="-16" r="6" fill="#CFD8DC" ${TH}/>
  <circle cx="52" cy="-16" r="16" fill="#2B2118" ${ST}/><circle cx="52" cy="-16" r="6" fill="#CFD8DC" ${TH}/>`;

/* ---------- toestand ---------- */
let XS = null, XV = null;
function xLoad() {
  try { XS = JSON.parse(localStorage.getItem(XKEY)); } catch (e) { XS = null; }
  if (!XS || XS.v !== 1) XS = { v: 1, done: 0, stars: 0 };
}
function xSave() { try { localStorage.setItem(XKEY, JSON.stringify(XS)); } catch (e) {} }
function xview(name, html) {
  XV.tok++; XV.view = name;
  if (XV.upH) { window.removeEventListener("pointerup", XV.upH); XV.upH = null; }
  const el = $("#taxi");
  el.innerHTML = html;
  return el;
}
function xLater(fn, ms) { const tok = XV && XV.tok; return setTimeout(() => { if (XV && XV.tok === tok) fn(); }, ms); }
function xAnim(dur, fn, done) {
  const tok = XV && XV.tok, t0 = performance.now();
  const step = now => {
    if (!XV || XV.tok !== tok) return;
    const t = Math.min(1, (now - t0) / dur);
    fn(t);
    if (t < 1) requestAnimationFrame(step); else if (done) done();
  };
  requestAnimationFrame(step);
}
function xsay(name, cb) { const tok = XV && XV.tok; say(name, cut => { if (cut || !XV || XV.tok !== tok) return; if (cb) cb(); }); }
function taxiOpen() {
  unlockAudio(); xLoad();
  show("taxi");
  XV = { tok: 0 };
  xNieuweRit();
}
function taxiStop() { if (!XV) return; XV.tok++; if (XV.upH) window.removeEventListener("pointerup", XV.upH); XV = null; if (XS) xSave(); }

/* ---------- een nieuwe rit ---------- */
function xNieuweRit() {
  const lvl = XS.done < 1 ? 0 : XS.done < 3 ? 1 : 2;
  const eigen = xEigenStad();
  const soorten = XSOORT.slice().sort(() => Math.random() - .5).slice(0, lvl === 0 ? 4 : 6);
  const huizen = soorten.map(t => ({ soort: t, p: eigen[t] || XBUILD[t] }));
  const doelen = [];
  const eerste = Math.floor(Math.random() * huizen.length);
  doelen.push(eerste);
  if (lvl === 2) { let b = Math.floor(Math.random() * huizen.length); if (b === eerste) b = (b + 1) % huizen.length; doelen.push(b); }
  const prijs = lvl === 0 ? 2 + Math.floor(Math.random() * 4) : lvl === 1 ? 4 + Math.floor(Math.random() * 7) : 8 + Math.floor(Math.random() * 13);
  XV.rit = { lvl, huizen, doelen, stap: 0, prijs, munten: lvl === 0 ? [1] : lvl === 1 ? [1, 2] : [1, 2, 5], betaald: 0, fase: "instap" };
  xStraat();
  xsay("taxi_welkom", () => xsay("taxi_instap"));
}
/* ---------- de straat ---------- */
function xStraat() {
  const r = XV.rit;
  const el = xview("rit", `
    <svg viewBox="0 0 ${W} ${H}" id="xsvg">
      <g id="xwereld">
        ${bSky(XW)}
        ${Array.from({ length: 15 }, (_, i) => `<rect x="${30 + i * 160}" y="${160 - (i % 3) * 20}" width="${64 + (i % 2) * 30}" height="${150 + (i % 3) * 20}" fill="url(#bz-far)" opacity=".7"/>`).join("")}
        <rect y="296" width="${XW}" height="12" fill="url(#bz-concrete)" ${BE}/>
        <rect y="308" width="${XW}" height="67" fill="url(#bz-asphalt)"/>
        ${Array.from({ length: Math.floor(XW / 70) }, (_, k) => `<rect x="${17 + k * 70}" y="338" width="36" height="6" rx="2" fill="#F1EEE6"/>`).join("")}
        ${r.huizen.map((h, i) => `<g class="xhuis" data-i="${i}" transform="translate(${xbx(i)} 296)">
            <rect x="-100" y="-260" width="200" height="264" fill="transparent"/>
            <g class="bld">${typeof buildingSVG === "function" ? buildingSVG(h.p) : ""}</g></g>`).join("")}
        <g id="xklant" transform="translate(300 300)"><rect x="-22" y="-52" width="44" height="56" fill="transparent"/>${typeof pasSVG === "function" ? pasSVG(2) : ""}</g>
        <g id="xfx"></g>
      </g>
      <g id="xtaxi" transform="translate(${XTAXI_X} ${XROAD})"><g class="xcar">${TAXI_SVG}</g></g>
      <g id="xbubble"></g>
    </svg>
    <div class="xmeter" id="xmeter" hidden><span class="xlab">rit</span><b id="xprijs">0</b></div>
    <div class="xpaid" id="xpaid" hidden><span id="xpaidn">0</span></div>
    <div class="xpurse" id="xpurse" hidden></div>`);
  homeButton(el);
  XV.pan = 0;
  xSetPan();
  const svg = $("#xsvg");
  let drag = null;
  svg.addEventListener("pointerdown", e => { if (XV.rit.busy) return; const p = stagePoint(e); drag = { x: p.x, pan: XV.pan, moved: false }; });
  svg.addEventListener("pointermove", e => {
    if (!drag) return;
    const p = stagePoint(e), dx = p.x - drag.x;
    if (Math.abs(dx) > 8) drag.moved = true;
    if (drag.moved) { XV.pan = Math.max(0, Math.min(XW - W, drag.pan - dx)); xSetPan(); }
  });
  XV.upH = () => { const d = drag; setTimeout(() => { drag = null; }, 0); if (d) XV.sleepte = d.moved; };
  window.addEventListener("pointerup", XV.upH);
  el.querySelectorAll(".xhuis").forEach(g => g.addEventListener("click", () => {
    if (XV.sleepte) return;
    unlockAudio(); xKiesGebouw(+g.dataset.i);
  }));
  $("#xklant").addEventListener("click", () => { if (XV.sleepte) return; unlockAudio(); xInstap(); });
}
const xSetPan = () => { const w = $("#xwereld"); if (w) w.setAttribute("transform", `translate(${-XV.pan} 0)`); };
function xRijNaar(pan, dur, done) {
  const r = XV.rit, van = XV.pan, naar = Math.max(0, Math.min(XW - W, pan));
  r.busy = true;
  const t = $("#xtaxi");
  if (t) t.classList.add("xrijdt");
  tone(150, .3, "sawtooth", .05, 0, 200);
  xAnim(dur, k => { const e = k < .5 ? 2 * k * k : 1 - 2 * (1 - k) * (1 - k); XV.pan = van + (naar - van) * e; xSetPan(); }, () => {
    XV.pan = naar; xSetPan();
    if (t) t.classList.remove("xrijdt");
    r.busy = false;
    if (done) done();
  });
}
/* ---------- klant instappen ---------- */
function xInstap() {
  const r = XV.rit;
  if (r.fase !== "instap" || r.busy) return;
  r.busy = true;
  const k = $("#xklant");
  xAnim(600, t => k.setAttribute("transform", `translate(${300 + (XV.pan + XTAXI_X - 300) * t} ${300 - Math.sin(Math.PI * t) * 26}) scale(${1 - t * .5})`), () => {
    k.setAttribute("opacity", "0");
    sfx.pop();
    r.busy = false; r.fase = "rijden";
    xBestemming();
  });
}
/* ---------- waar moet de klant heen? ---------- */
function xBestemming() {
  const r = XV.rit, h = r.huizen[r.doelen[r.stap]];
  const b = $("#xbubble");
  b.innerHTML = `<g transform="translate(${XTAXI_X + 96} 122)">
      <path d="M-78 -108 h156 q12 0 12 12 v88 q0 12 -12 12 h-96 l-22 22 v-22 h-38 q-12 0 -12 -12 v-88 q0 -12 12 -12z" fill="#fff" ${ST}/>
      <g transform="translate(0 6) scale(.3)">${typeof buildingSVG === "function" ? buildingSVG(h.p) : ""}</g></g>`;
  b.classList.remove("xpop"); void b.getBBox(); b.classList.add("xpop");
  xsay("taxi_naar_" + h.soort, () => xsay("taxi_zoek"));
}
function xKiesGebouw(i) {
  const r = XV.rit;
  if (r.fase !== "rijden" || r.busy) return;
  const goed = r.doelen[r.stap];
  xRijNaar(xbx(i) - 330, 1800, () => {
    if (i !== goed) { tone(160, .25, "square", .12, 0, 110); xsay("taxi_fout"); return; }
    sfx.honk();
    r.stap++;
    if (r.stap < r.doelen.length) { xsay("taxi_er", () => xLater(() => xsay("taxi_en_nu", () => xBestemming()), 200)); return; }
    $("#xbubble").innerHTML = "";
    xUitstap(i);
  });
}
/* ---------- klant stapt uit en betaalt ---------- */
function xUitstap(i) {
  const r = XV.rit;
  r.fase = "betalen";
  const fx = $("#xfx");
  const k = svgEl("", typeof pasSVG === "function" ? pasSVG(2) : "");
  fx.appendChild(k);
  const x0 = XV.pan + XTAXI_X, x1 = xbx(i) - 60;
  xAnim(900, t => k.setAttribute("transform", `translate(${x0 + (x1 - x0) * t} ${300 - Math.sin(Math.PI * t) * 20}) scale(${.5 + t * .5})`), () => {
    confetti(20);
    xsay("taxi_er", () => xMeter());
  });
}
function xMeter() {
  const r = XV.rit;
  $("#xmeter").hidden = false;
  $("#xprijs").textContent = r.prijs;
  $("#xpaid").hidden = false;
  $("#xpaidn").textContent = "0";
  const purse = $("#xpurse");
  purse.hidden = false;
  purse.innerHTML = r.munten.map(v => `<button class="btn wcoin" data-v="${v}" aria-label="${v} muntje">${COIN_W(v)}</button>`).join("");
  purse.querySelectorAll(".wcoin").forEach(b => b.addEventListener("click", () => { unlockAudio(); xMunt(+b.dataset.v, b); }));
  xsay("taxi_meter", () => xsay("n" + Math.min(20, r.prijs), () => xsay("taxi_betaal")));
  xLater(() => { const q = XV && XV.rit; if (q && q.fase === "betalen" && !q.klaar && q.betaald < q.prijs) xsay("taxi_nog"); }, 14000);
}
function xMunt(v, btn) {
  const r = XV.rit;
  if (r.fase !== "betalen" || r.klaar) return;
  if (r.betaald + v > r.prijs) {
    btn.classList.remove("wrong"); void btn.offsetWidth; btn.classList.add("wrong");
    tone(160, .25, "square", .12, 0, 110);
    xsay("taxi_teveel");
    return;
  }
  r.betaald += v;
  sfx.click();
  $("#xpaidn").textContent = r.betaald;
  const fx = $("#xfx");
  const c = svgEl("", `<g transform="translate(-20 -20)">${COIN_W(v).replace(/<\/?svg[^>]*>/g, "")}</g>`);
  fx.appendChild(c);
  const x0 = XV.pan + 60, y0 = 330, x1 = XV.pan + XTAXI_X, y1 = 280;
  xAnim(500, t => c.setAttribute("transform", `translate(${x0 + (x1 - x0) * t} ${y0 + (y1 - y0) * t - Math.sin(Math.PI * t) * 50})`), () => c.remove());
  if (r.betaald === r.prijs) { r.klaar = true; xLater(xAf, 420); }
  else say("n" + Math.min(20, r.betaald));
}
function xAf() {
  const r = XV.rit;
  $("#xpurse").hidden = true;
  confetti(70); sfx.fanfare();
  XS.done++; XS.stars++;
  const fooi = Math.random() < .5;
  if (fooi) XS.stars++;
  xSave();
  xsay("taxi_klaar", () => { if (fooi) xsay("taxi_fooi"); });
  const el = $("#taxi");
  const again = document.createElement("button");
  again.className = "btn vagain tagain"; again.setAttribute("aria-label", "Nog een rit");
  again.innerHTML = ICONS.play;
  again.addEventListener("click", () => { unlockAudio(); sfx.pop(); xNieuweRit(); });
  el.appendChild(again);
  const st = document.createElement("div");
  st.className = "vstars";
  st.innerHTML = `<svg viewBox="0 0 40 40"><path d="M20 4 l5 11 12 1 -9 8 3 12 -11 -6 -11 6 3 -12 -9 -8 12 -1z" fill="#FFD600" ${ST}/></svg><span>${XS.stars}</span>`;
  el.appendChild(st);
}

if (typeof renderHome === "function" && typeof current !== "undefined" && current === "home") renderHome();
