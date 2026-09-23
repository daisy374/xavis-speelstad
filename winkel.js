"use strict";
/* Xavi's Supermarkt — boodschappenlijstje verzamelen en afrekenen met muntjes.
   Gebruikt de gedeelde hulpjes uit app.js (say, sfx, tone, confetti, sparkleAt, FOODS, ICONS, …). */

const WKEY = "xavi-winkel-v1";
const SHELF_W = 300, SHOP_W = 60 + 5 * SHELF_W + 60;
/* ---------- de producten ---------- */
const SPUL = {
  appel: { p: 1, s: 0, svg: FOODS.appel.svg },
  banaan: { p: 1, s: 0, svg: `<path d="M8 10 q2 18 14 22 q12 4 12 -4 q-10 2 -16 -6 q-5 -7 -4 -12z" fill="#FFD54F" ${TH}/><path d="M8 10 q-2 -4 2 -5 q3 -1 3 4" fill="#8D6E63" ${TH}/>` },
  wortel: { p: 1, s: 0, svg: FOODS.wortel.svg },
  tomaat: { p: 1, s: 0, svg: `<circle cx="20" cy="23" r="13" fill="#E53935" ${TH}/><path d="M20 10 l-7 -4 l4 7 l-8 0 l7 4 M20 10 l7 -4 l-4 7 l8 0 l-7 4" fill="#43A047" ${TH}/><circle cx="15" cy="19" r="3" fill="#fff" opacity=".4"/>` },
  sla: { p: 2, s: 0, svg: FOODS.sla.svg },
  brood: { p: 2, s: 1, svg: FOODS.brood.svg },
  croissant: { p: 1, s: 1, svg: `<path d="M6 26 q4 -16 16 -16 q12 0 12 12 q0 6 -5 6 q-3 0 -3 -4 q0 -6 -5 -6 q-7 0 -9 10z" fill="#E0A85C" ${TH}/><path d="M12 22 q4 -8 10 -8" stroke="#B4782F" stroke-width="2" fill="none"/>` },
  bol: { p: 1, s: 1, svg: `<path d="M6 30 q0 -18 14 -18 q14 0 14 18 z" fill="#D7A86E" ${TH}/>${[[13, 24], [20, 20], [26, 25], [17, 27]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2" fill="#5D4037"/>`).join("")}` },
  melk: { p: 2, s: 2, svg: `<path d="M12 12 H28 L30 36 H10 Z" fill="#fff" ${TH}/><path d="M12 4 H28 L28 12 H12 Z" fill="#29B6F6" ${TH}/><path d="M13 22 h14" stroke="#B3E5FC" stroke-width="3"/>` },
  kaas: { p: 3, s: 2, svg: `<path d="M6 30 L30 12 q6 2 6 8 v10 z" fill="#FFCA28" ${TH}/>${[[18, 24], [27, 22], [22, 29]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#E0A800"/>`).join("")}` },
  yoghurt: { p: 2, s: 2, svg: `<path d="M11 14 H29 L27 34 H13 Z" fill="#fff" ${TH}/><rect x="9" y="8" width="22" height="7" rx="2" fill="#F48FB1" ${TH}/><circle cx="20" cy="24" r="4" fill="#F48FB1"/>` },
  ei: { p: 2, s: 2, svg: `<rect x="5" y="16" width="30" height="16" rx="4" fill="#D7CCC8" ${TH}/>${[12, 20, 28].map(x => `<ellipse cx="${x}" cy="16" rx="5" ry="6" fill="#FFF3E0" ${TH}/>`).join("")}` },
  boter: { p: 2, s: 2, svg: `<path d="M6 16 H30 L34 26 H10 Z" fill="#FFF59D" ${TH}/><path d="M6 16 V28 L10 36 H34 V26" fill="#FDD835" ${TH}/><rect x="12" y="20" width="14" height="7" rx="2" fill="#fff" ${TH}/>` },
  sap: { p: 2, s: 3, svg: `<path d="M12 12 H28 L30 36 H10 Z" fill="#FF8A00" ${TH}/><path d="M12 4 H28 V12 H12 Z" fill="#FFB74D" ${TH}/><path d="M26 10 l6 -8" stroke="#fff" stroke-width="3"/><circle cx="20" cy="24" r="5" fill="#FFE082"/>` },
  water: { p: 1, s: 3, svg: `<path d="M15 10 H25 L28 20 V34 Q20 38 12 34 V20 Z" fill="#B3E5FC" ${TH}/><rect x="16" y="3" width="8" height="8" rx="2" fill="#29B6F6" ${TH}/><rect x="13" y="22" width="14" height="7" fill="#fff" opacity=".7"/>` },
  limonade: { p: 2, s: 3, svg: `<path d="M15 10 H25 L28 20 V34 Q20 38 12 34 V20 Z" fill="#F48FB1" ${TH}/><rect x="16" y="3" width="8" height="8" rx="2" fill="#E53935" ${TH}/><rect x="13" y="22" width="14" height="7" fill="#fff" opacity=".7"/>` },
  koek: { p: 2, s: 4, svg: `<circle cx="20" cy="22" r="13" fill="#C08E5E" ${TH}/>${[[15, 18], [24, 17], [20, 26], [26, 26]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4" fill="#5D4037"/>`).join("")}` },
  snoep: { p: 2, s: 4, svg: `<path d="M12 14 H28 L32 24 L28 34 H12 L8 24 Z" fill="#FF4081" ${TH}/><path d="M12 14 l-6 -6 l2 8 l-4 4 l6 4 M28 14 l6 -6 l-2 8 l4 4 l-6 4" fill="#F8BBD0" ${TH}/>` },
  chocola: { p: 3, s: 4, svg: `<rect x="7" y="10" width="26" height="24" rx="3" fill="#5D4037" ${TH}/><path d="M20 10 V34 M7 22 H33" stroke="#3E2723" stroke-width="2.5"/><rect x="7" y="10" width="26" height="8" fill="#E53935" ${TH}/>` },
  chips: { p: 2, s: 4, svg: `<path d="M10 8 H30 L32 32 Q20 38 8 32 Z" fill="#FFB300" ${TH}/><path d="M10 8 q10 4 20 0" stroke="${INK}" stroke-width="2.5" fill="none"/><ellipse cx="20" cy="22" rx="8" ry="6" fill="#FFF3E0" ${TH}/>` }
};
const SHELVES = [
  { k: "groente", naam: "Groente & fruit", col: "#7CB342" },
  { k: "brood", naam: "Brood", col: "#D7A86E" },
  { k: "zuivel", naam: "Zuivel", col: "#4FC3F7" },
  { k: "drinken", naam: "Drinken", col: "#FF8A00" },
  { k: "lekkers", naam: "Lekkers", col: "#F48FB1" }
];
const prodKeys = s => Object.keys(SPUL).filter(k => SPUL[k].s === s);
const wico = k => `<svg viewBox="0 0 40 40">${SPUL[k].svg}</svg>`;
const COIN_W = v => `<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" fill="${v === 1 ? "#FFC107" : v === 2 ? "#FFD54F" : "#B0BEC5"}" ${ST}/><circle cx="20" cy="20" r="12" fill="none" stroke="${v === 5 ? "#78909C" : "#E0A800"}" stroke-width="2"/><text x="20" y="27" text-anchor="middle" class="wnum small">${v}</text></svg>`;

/* ---------- toestand ---------- */
let WS = null, WV = null;
function wLoad() {
  try { WS = JSON.parse(localStorage.getItem(WKEY)); } catch (e) { WS = null; }
  if (!WS || WS.v !== 1) WS = { v: 1, done: 0, stars: 0 };
}
function wSave() { try { localStorage.setItem(WKEY, JSON.stringify(WS)); } catch (e) {} }
function wview(name, html) {
  WV.tok++; WV.view = name;
  clearInterval(WV.int); WV.int = null;
  if (WV.upH) { window.removeEventListener("pointerup", WV.upH); WV.upH = null; }
  const el = $("#winkel");
  el.innerHTML = html;
  return el;
}
function wLater(fn, ms) { const tok = WV && WV.tok; return setTimeout(() => { if (WV && WV.tok === tok) fn(); }, ms); }
function wAnim(dur, fn, done) {
  const tok = WV && WV.tok, t0 = performance.now();
  const step = now => {
    if (!WV || WV.tok !== tok) return;
    const t = Math.min(1, (now - t0) / dur);
    fn(t);
    if (t < 1) requestAnimationFrame(step); else if (done) done();
  };
  requestAnimationFrame(step);
}
function wsay(name, cb) { const tok = WV && WV.tok; say(name, cut => { if (cut || !WV || WV.tok !== tok) return; if (cb) cb(); }); }
function wBack(el, fn) {
  const b = document.createElement("button");
  b.className = "btn home-btn"; b.setAttribute("aria-label", "Terug");
  b.innerHTML = `<svg viewBox="0 0 40 40"><path d="M24 8 L12 20 L24 32" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  b.addEventListener("click", () => { sfx.pop(); fn(); });
  el.appendChild(b);
}
function winkelOpen() {
  unlockAudio(); wLoad();
  show("winkel");
  WV = { tok: 0 };
  newList();
}
function winkelStop() { if (!WV) return; clearInterval(WV.int); if (WV.upH) window.removeEventListener("pointerup", WV.upH); WV = null; if (WS) wSave(); }

/* ---------- het lijstje ---------- */
function newList() {
  const lvl = WS.done < 2 ? 0 : WS.done < 5 ? 1 : 2;
  const [kinds, maxN, maxTot] = [[3, 2, 7], [4, 3, 13], [5, 5, 20]][lvl];
  let list = null;
  for (let tries = 0; tries < 60 && !list; tries++) {
    const keys = Object.keys(SPUL).sort(() => Math.random() - .5).slice(0, kinds);
    const l = keys.map(k => ({ k, n: 1 + Math.floor(Math.random() * maxN), got: 0 }));
    const tot = l.reduce((s, it) => s + SPUL[it.k].p * it.n, 0);
    if (tot >= 4 && tot <= maxTot) list = l;
  }
  if (!list) list = [{ k: "appel", n: 2, got: 0 }, { k: "melk", n: 1, got: 0 }];
  const klok = WS.done >= 3 && Math.random() < .5;
  WV.game = { lvl, list, klok, tijd: 0, tot: list.reduce((s, it) => s + SPUL[it.k].p * it.n, 0), bonus: false };
  shop();
}

/* ---------- de winkel ---------- */
function shelfSVG(i) {
  const x0 = 60 + i * SHELF_W, sh = SHELVES[i], keys = prodKeys(i);
  let s = `<rect x="${x0}" y="70" width="${SHELF_W - 40}" height="250" rx="8" fill="#ECEFF1" ${ST}/>`;
  s += `<rect x="${x0 - 6}" y="40" width="${SHELF_W - 28}" height="34" rx="8" fill="${sh.col}" ${ST}/><text x="${x0 + (SHELF_W - 40) / 2}" y="65" text-anchor="middle" class="wsign">${sh.naam}</text>`;
  const rows = [150, 225, 300];
  rows.forEach(y => { s += `<rect x="${x0}" y="${y}" width="${SHELF_W - 40}" height="10" rx="3" fill="#B0BEC5" ${ST}/>`; });
  keys.forEach((k, j) => {
    const row = Math.floor(j / 3), col = j % 3;
    const x = x0 + 30 + col * 70, y = rows[row] - 4;
    s += `<g class="wprod" data-k="${k}" transform="translate(${x} ${y})"><rect x="-30" y="-52" width="60" height="56" fill="transparent"/><g transform="translate(-27 -56) scale(1.4)">${SPUL[k].svg}</g></g>`;
  });
  return s;
}
function listHUD() {
  const g = WV.game;
  return `<div class="wlist" id="wlist">${g.list.map((it, i) => `<button class="witem ${it.got >= it.n ? "done" : ""}" data-i="${i}" aria-label="${it.k}">${wico(it.k)}<span class="wcount">${it.got}/${it.n}</span></button>`).join("")}</div>`;
}
function shop() {
  const g = WV.game;
  const el = wview("shop", `
    <svg viewBox="0 0 ${W} ${H}" id="shopSvg">
      <g id="wpan">
        <rect width="${SHOP_W}" height="${H}" fill="#FFF8E1"/>
        <rect y="320" width="${SHOP_W}" height="55" fill="#CFD8DC" ${ST}/>
        ${Array.from({ length: 5 }, (_, i) => shelfSVG(i)).join("")}
        <g id="wfx"></g>
      </g>
    </svg>
    ${listHUD()}
    <button class="btn wcart" id="wcart" aria-label="Karretje"><svg viewBox="0 0 40 40"><path d="M4 8 H10 L14 26 H32 L36 12 H12" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="16" cy="33" r="3.5" fill="${INK}"/><circle cx="30" cy="33" r="3.5" fill="${INK}"/></svg><span class="wbadge" id="wbadge">0</span></button>
    <button class="btn wkassa" id="wkassa" hidden aria-label="Naar de kassa"><svg viewBox="0 0 40 40"><rect x="5" y="14" width="30" height="20" rx="4" fill="#FF8A00" ${TH}/><rect x="10" y="7" width="20" height="8" rx="2" fill="#FFD54F" ${TH}/><path d="M11 22 h18 M11 28 h8" stroke="#fff" stroke-width="3"/></svg></button>
    ${g.klok ? `<div class="wklok" id="wklok"><i id="wklokI"></i></div>` : ""}`);
  homeButton(el);
  const svg = $("#shopSvg"), pan = $("#wpan");
  let panX = 0; const maxPan = SHOP_W - W;
  const setPan = () => pan.setAttribute("transform", `translate(${-panX} 0)`);
  let drag = null;
  svg.addEventListener("pointerdown", e => { const p = stagePoint(e); drag = { x: p.x, pan: panX, moved: false }; });
  svg.addEventListener("pointermove", e => {
    if (!drag) return; const p = stagePoint(e), dx = p.x - drag.x;
    if (Math.abs(dx) > 8) drag.moved = true;
    if (drag.moved) { panX = Math.max(0, Math.min(maxPan, drag.pan - dx)); setPan(); }
  });
  WV.upH = () => setTimeout(() => { drag = null; }, 0);
  window.addEventListener("pointerup", WV.upH);
  const badge = () => { $("#wbadge").textContent = g.list.reduce((s, it) => s + it.got, 0); };
  const refresh = () => {
    $("#wlist").innerHTML = g.list.map((it, i) => `<button class="witem ${it.got >= it.n ? "done" : ""}" data-i="${i}" aria-label="${it.k}">${wico(it.k)}<span class="wcount">${it.got}/${it.n}</span></button>`).join("");
    $("#wlist").querySelectorAll(".witem").forEach(b => b.addEventListener("click", () => { unlockAudio(); const it = g.list[+b.dataset.i]; wsay(`sm_${it.k}_${it.n}`); }));
    badge();
    const klaar = g.list.every(it => it.got >= it.n);
    $("#wkassa").hidden = !klaar;
    if (klaar && !g.told) { g.told = true; confetti(40); sfx.fanfare(); wsay("sm_klaar"); if (g.klok && g.tijd > 0) { g.bonus = true; } }
  };
  refresh();
  el.querySelectorAll(".wprod").forEach(p => p.addEventListener("click", e => {
    if (drag && drag.moved) return;
    unlockAudio();
    const k = p.dataset.k, it = g.list.find(x => x.k === k);
    const r = p.getBoundingClientRect(), st = stage.getBoundingClientRect(), s = st.width / W;
    const x0 = (r.left + r.width / 2 - st.left) / s + panX, y0 = (r.top + r.height / 2 - st.top) / s;
    if (!it) { p.classList.remove("wrong"); void p.getBBox(); p.classList.add("wrong"); wsay("sm_nietlijst"); return; }
    if (it.got >= it.n) { p.classList.remove("wrong"); void p.getBBox(); p.classList.add("wrong"); wsay("sm_genoeg"); return; }
    it.got++;
    const fly = svgEl("", `<g transform="translate(-20 -20) scale(1.2)">${SPUL[k].svg}</g>`);
    $("#wfx").appendChild(fly);
    const tx = 600 + panX, ty = 330;
    wAnim(500, t => { const e2 = t * t * (3 - 2 * t); fly.setAttribute("transform", `translate(${x0 + (tx - x0) * e2} ${y0 + (ty - y0) * e2 - Math.sin(Math.PI * t) * 70}) scale(${1 - t * .4})`); }, () => { fly.remove(); sfx.pop(); refresh(); });
    say("n" + it.got);
  }));
  $("#wcart").addEventListener("click", () => { unlockAudio(); cartView(); });
  $("#wkassa").addEventListener("click", () => { unlockAudio(); sfx.pop(); kassa(); });
  if (g.klok && !g.tijd) {
    g.tijd = g.list.reduce((s, it) => s + it.n, 0) * 9000 + 15000;
    g.t0 = Date.now();
    WV.int = setInterval(() => {
      const left = Math.max(0, 1 - (Date.now() - g.t0) / g.tijd);
      const i = $("#wklokI"); if (i) { i.style.width = (left * 100) + "%"; i.style.background = left < .25 ? "#FF5252" : "#22C55E"; }
      if (left <= 0) { clearInterval(WV.int); WV.int = null; g.tijd = 0; if (!g.told) wsay("sm_tijd"); }
    }, 200);
  }
  if (!g.intro) {
    g.intro = true;
    wsay("sm_welkom", () => sayList(0, () => wsay(g.klok ? "sm_snel" : "sm_zoek")));
  }
  function sayList(i, done) {
    if (i >= g.list.length) { if (done) done(); return; }
    wsay(`sm_${g.list[i].k}_${g.list[i].n}`, () => sayList(i + 1, done));
  }
}
/* iets teruggeleggen uit het karretje */
function cartView() {
  const g = WV.game, got = g.list.filter(it => it.got > 0);
  if (!got.length) { wsay("sm_kartik"); return; }
  const ov = document.createElement("div");
  ov.className = "wcartov";
  ov.innerHTML = `<div class="wcartbox"><div class="wcartrow">${got.map(it => Array.from({ length: it.got }, () => `<button class="witem" data-k="${it.k}">${wico(it.k)}</button>`).join("")).join("")}</div></div>`;
  $("#winkel").appendChild(ov);
  ov.addEventListener("click", e => { if (e.target === ov) ov.remove(); });
  ov.querySelectorAll(".witem").forEach(b => b.addEventListener("click", () => {
    const it = g.list.find(x => x.k === b.dataset.k);
    if (it && it.got > 0) { it.got--; sfx.whoosh(); wsay("sm_terug"); }
    ov.remove(); shop();
  }));
}

/* ---------- de kassa ---------- */
function kassa() {
  const g = WV.game;
  const items = [];
  g.list.forEach(it => { for (let i = 0; i < it.n; i++) items.push(it.k); });
  const coins = [[1], [1, 2], [1, 2, 5]][g.lvl];
  const el = wview("kassa", `
    <svg viewBox="0 0 ${W} ${H}" id="kasSvg">
      <rect width="${W}" height="${H}" fill="#FFF8E1"/>
      <rect y="250" width="${W}" height="125" fill="#CFD8DC" ${ST}/>
      <rect x="0" y="196" width="470" height="54" rx="8" fill="#90A4AE" ${ST}/>
      ${Array.from({ length: 12 }, (_, i) => `<path d="M${20 + i * 38} 198 V248" stroke="#78909C" stroke-width="4"/>`).join("")}
      <g transform="translate(560 250)"><rect x="-70" y="-90" width="140" height="90" rx="8" fill="#FF8A00" ${ST}/><rect x="-56" y="-78" width="112" height="40" rx="5" fill="#263238" ${TH}/>
        <text x="0" y="-48" text-anchor="middle" class="wnum" id="kasNum" fill="#8BC34A">0</text>
        ${[0, 1, 2].map(r => [0, 1, 2].map(c => `<rect x="${-44 + c * 30}" y="${-30 + r * 11}" width="22" height="8" rx="2" fill="#FFE082"/>`).join("")).join("")}</g>
      <g transform="translate(424 116) scale(.9)">${dinoHead("")}</g>
      <g id="wgoods"></g><g id="kfx"></g>
    </svg>
    <div class="wtotaal" id="wtotaal" hidden><span id="wtotN">0</span><span class="wmunt">${COIN_W(1)}</span></div>
    <div class="wpurse" id="wpurse" hidden>${coins.map(c => `<button class="btn wcoin" data-v="${c}" aria-label="${c} muntje">${COIN_W(c)}</button>`).join("")}</div>
    <div class="wbetaald" id="wbetaald" hidden>Betaald: <b id="wbetN">0</b></div>`);
  wBack(el, () => shop());
  const goods = $("#wgoods");
  const sp = Math.min(36, 430 / Math.max(1, items.length));
  const draw = () => { goods.innerHTML = items.map((k, i) => k ? `<g class="wgood" data-i="${i}" transform="translate(${26 + i * sp} 176)"><rect x="-18" y="-24" width="36" height="46" fill="transparent"/><g transform="translate(-20 -20)">${SPUL[k].svg}</g></g>` : "").join("");
    goods.querySelectorAll(".wgood").forEach(gg => gg.addEventListener("click", () => scan(+gg.dataset.i))); };
  let scanned = 0, total = 0, paid = 0, done = false;
  const scan = i => {
    if (items[i] == null) return;
    const k = items[i]; items[i] = null; scanned++;
    total += SPUL[k].p;
    tone(2100, .07, "square", .08); tone(1500, .05, "square", .06, .08);
    $("#kasNum").textContent = total;
    sparkleAt($("#kfx"), 26 + i * sp, 176, false, ["#fff", "#FFD600"]);
    draw();
    if (items.every(x => x == null)) {
      done = true;
      $("#wtotaal").hidden = false; $("#wtotN").textContent = total;
      wsay("sm_totaal", () => wsay("n" + Math.min(20, total), () => wsay(total === 1 ? "sm_munt1" : "sm_munt", () => {
        $("#wpurse").hidden = false; $("#wbetaald").hidden = false; wsay("sm_betaal");
      })));
    }
  };
  draw();
  el.querySelectorAll(".wcoin").forEach(b => b.addEventListener("click", () => {
    unlockAudio();
    if (!done || paid >= total) return;
    const v = +b.dataset.v;
    paid += v;
    $("#wbetN").textContent = paid;
    const r = b.getBoundingClientRect(), st = stage.getBoundingClientRect(), s = st.width / W;
    const x0 = (r.left + r.width / 2 - st.left) / s, y0 = (r.top + r.height / 2 - st.top) / s;
    const c = svgEl("", `<g transform="translate(-20 -20)">${COIN_W(v).replace(/<\/?svg[^>]*>/g, "")}</g>`);
    $("#kfx").appendChild(c);
    wAnim(450, t => { const e2 = t * t * (3 - 2 * t); c.setAttribute("transform", `translate(${x0 + (560 - x0) * e2} ${y0 + (206 - y0) * e2 - Math.sin(Math.PI * t) * 60})`); }, () => { c.remove(); tone(1320, .08, "square", .07); });
    say("n" + Math.min(20, paid));
    if (paid >= total) wLater(() => klaarAfrekenen(paid - total), 900);
    else { clearTimeout(WV.nogT); WV.nogT = wLater(() => wsay("sm_nog"), 6000); }
  }));
  function klaarAfrekenen(rest) {
    clearTimeout(WV.nogT);
    $("#wpurse").hidden = true;
    if (rest > 0) {
      wsay("sm_teveel", () => wsay("sm_wissel", () => wsay("n" + Math.min(20, rest), () => klaar())));
      for (let i = 0; i < rest; i++) wLater(() => {
        const c = svgEl("", `<g transform="translate(-20 -20)">${COIN_W(1).replace(/<\/?svg[^>]*>/g, "")}</g>`);
        $("#kfx").appendChild(c);
        wAnim(600, t => c.setAttribute("transform", `translate(${560 - 420 * t} ${206 + Math.sin(Math.PI * t) * -50 + t * 120})`), () => { c.remove(); tone(1000, .08, "square", .07); });
      }, 600 + i * 400);
    } else wsay("sm_precies", () => klaar());
  }
  function klaar() {
    WS.done++; WS.stars += 1 + (g.bonus ? 1 : 0); wSave();
    confetti(90); sfx.fanfare();
    if (g.bonus) wLater(() => wsay("sm_gehaald"), 1200);
    wLater(() => bon(), 1800);
  }
  function bon() {
    const el2 = wview("bon", `
      <svg viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#FFF8E1"/>
        <g transform="translate(${W / 2} 30)"><rect x="-150" y="0" width="300" height="${110 + g.list.length * 34}" rx="10" fill="#fff" ${ST}/>
          <text x="0" y="40" text-anchor="middle" class="wsign">KASSABON</text>
          ${g.list.map((it, i) => `<g transform="translate(-120 ${60 + i * 34})"><g transform="translate(0 -18) scale(.8)">${SPUL[it.k].svg}</g><text x="52" y="8" class="wsign">${it.n} x</text><text x="220" y="8" text-anchor="end" class="wsign">${SPUL[it.k].p * it.n}</text></g>`).join("")}
          <path d="M-120 ${66 + g.list.length * 34} H120" stroke="${INK}" stroke-width="3"/>
          <text x="-120" y="${92 + g.list.length * 34}" class="wsign">TOTAAL</text><text x="120" y="${92 + g.list.length * 34}" text-anchor="end" class="wsign">${total}</text></g>
        <g id="sfx2"></g></svg>
      <div class="wstars"><svg viewBox="0 0 40 40"><path d="M20 4 l5 11 12 1 -9 8 3 12 -11 -6 -11 6 3 -12 -9 -8 12 -1z" fill="#FFD600" ${ST}/></svg><span>${WS.stars}</span></div>
      <button class="btn wagain" id="wagain" aria-label="Nog een keer">${ICONS.play}</button>`);
    homeButton(el2);
    $("#wagain").addEventListener("click", () => { unlockAudio(); sfx.pop(); newList(); });
    wsay("sm_bon", () => wsay("sm_ster"));
  }
}

// het startscherm is al getekend voordat dit bestand laadde: nu opnieuw, met de supermarkt-knop compleet
if (typeof renderHome === "function" && typeof current !== "undefined" && current === "home") renderHome();
