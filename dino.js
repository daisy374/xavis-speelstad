"use strict";
/* Xavi's Dino-opgraving — zand wegvegen, botten tellen, het skelet leggen en de dino tot leven wekken.
   De tekeningen staan in dinoart.js. */

const DKEY = "xavi-dino-v1";
/* welke soorten er zijn; de eerste vijf zijn de eenvoudigste (zeven botten, rustige houding) */
const DSOORT = ["trex", "trice", "brachio", "raptor", "para", "stego", "anky", "spino", "ptero"];
const DINO = {
  trex: {
    kleur: "#6FA84B", buik: "#C5E1A5", donker: "#4C7A31", eet: "vlees", kop: "trex", staart: "gewoon",
    delen: [{ id: "rug", x: -52, y: -34, r: -4 }, { id: "ribben", x: -50, y: 2, r: -4 }, { id: "nek", x: -172, y: -52, r: -16 },
      { id: "kop", x: -256, y: -74, r: -6, f: 1, s: .85 }, { id: "staart", x: 86, y: -26, r: 6 }, { id: "poota", x: 6, y: 6, s: 1.1 }, { id: "pootv", x: -104, y: 2, r: 22, s: .7 }]
  },
  raptor: {
    kleur: "#E08A3C", buik: "#FFD9A6", donker: "#B06A22", eet: "vlees", kop: "raptor", staart: "lang",
    delen: [{ id: "rug", x: -46, y: -30, r: -6, s: .85 }, { id: "ribben", x: -46, y: 2, r: -6, s: .8 }, { id: "nek", x: -152, y: -46, r: -18, s: .85 },
      { id: "kop", x: -222, y: -66, r: -8, f: 1, s: .8 }, { id: "staart", x: 84, y: -24, r: 4, s: .9 }, { id: "poota", x: 4, y: 4, s: 1 }, { id: "pootv", x: -96, y: 2, r: 22, s: .62 }]
  },
  spino: {
    kleur: "#4FA3C7", buik: "#BEE3F2", donker: "#2F7E9E", eet: "vlees", kop: "spino", staart: "lang",
    delen: [{ id: "rug", x: -52, y: -34, r: -4 }, { id: "ribben", x: -50, y: 2, r: -4 }, { id: "nek", x: -170, y: -48, r: -12 },
      { id: "kop", x: -262, y: -64, r: -4, f: 1, s: .9 }, { id: "staart", x: 88, y: -24, r: 4 }, { id: "poota", x: 6, y: 6, s: 1.1 },
      { id: "pootv", x: -104, y: 2, r: 22, s: .7 }, { id: "zeil", x: -40, y: -66 }]
  },
  trice: {
    kleur: "#8D9BD8", buik: "#D6DCF6", donker: "#5E6BAE", eet: "blad", kop: "trice", staart: "gewoon",
    delen: [{ id: "rug", x: -46, y: -30, r: 0 }, { id: "ribben", x: -46, y: 4, r: 0 }, { id: "nek", x: -152, y: -26, r: -4 },
      { id: "kop", x: -240, y: -30, r: 0, f: 1, s: .8 }, { id: "staart", x: 84, y: -24, r: 4 }, { id: "poota", x: 10, y: 6, s: .95 }, { id: "pootv", x: -104, y: 8, r: 0, s: .9 }]
  },
  stego: {
    kleur: "#5FB3A1", buik: "#B2DFDB", donker: "#3E8B7C", eet: "blad", kop: "stego", staart: "stekels",
    delen: [{ id: "rug", x: -46, y: -40, r: -6 }, { id: "ribben", x: -46, y: 2, r: 0 }, { id: "nek", x: -146, y: -22, r: -8 },
      { id: "kop", x: -222, y: -14, r: -4, f: 1, s: .85 }, { id: "staart", x: 84, y: -40, r: -14 }, { id: "poota", x: 12, y: 6, s: .95 },
      { id: "pootv", x: -100, y: 10, r: 0, s: .85 }, { id: "platen", x: -40, y: -74 }]
  },
  brachio: {
    kleur: "#B07FD0", buik: "#E1BEE7", donker: "#8155A8", eet: "blad", kop: "brachio", staart: "lang",
    delen: [{ id: "rug", x: -46, y: -36, r: -4 }, { id: "ribben", x: -46, y: 4, r: -4 }, { id: "nek", x: -142, y: -96, r: -56, s: 1.3 },
      { id: "kop", x: -214, y: -188, r: -32, f: 1, s: .85 }, { id: "staart", x: 86, y: -30, r: 6 }, { id: "poota", x: 12, y: 6, s: 1.05 }, { id: "pootv", x: -104, y: 6, r: 0, s: 1 }]
  },
  anky: {
    kleur: "#A8926B", buik: "#E0D2B4", donker: "#7C6A48", eet: "blad", kop: "anky", staart: "knots",
    delen: [{ id: "rug", x: -44, y: -26, r: 0 }, { id: "ribben", x: -44, y: 6, r: 0 }, { id: "nek", x: -140, y: -18, r: -2 },
      { id: "kop", x: -226, y: -18, r: 0, f: 1, s: .85 }, { id: "staart", x: 82, y: -20, r: 2 }, { id: "poota", x: 12, y: 8, s: .85 }, { id: "pootv", x: -100, y: 10, r: 0, s: .85 }]
  },
  para: {
    kleur: "#E2705C", buik: "#FFD3C8", donker: "#B34E3C", eet: "blad", kop: "para", staart: "gewoon",
    delen: [{ id: "rug", x: -48, y: -32, r: -4 }, { id: "ribben", x: -48, y: 4, r: -2 }, { id: "nek", x: -158, y: -50, r: -22 },
      { id: "kop", x: -238, y: -84, r: -10, f: 1, s: .85 }, { id: "staart", x: 84, y: -26, r: 4 }, { id: "poota", x: 8, y: 6, s: 1 }, { id: "pootv", x: -108, y: 6, r: 12, s: .8 }]
  },
  ptero: {
    kleur: "#7E8EA8", buik: "#D3DCE8", donker: "#5A6B86", eet: "vlees", kop: "ptero", staart: "gewoon",
    delen: [{ id: "rug", x: -40, y: -26, r: 0, s: .8 }, { id: "ribben", x: -42, y: 2, r: 0, s: .75 }, { id: "nek", x: -118, y: -40, r: -26, s: .8 },
      { id: "kop", x: -186, y: -66, r: -10, f: 1, s: .85 }, { id: "staart", x: 70, y: -20, r: 2, s: .6 }, { id: "poota", x: 6, y: 8, s: .7 },
      { id: "vleugel", x: -56, y: -46, r: -10 }]
  }
};
const DEENVOUDIG = ["trex", "trice", "brachio", "raptor", "para"];
const DVIEW = { brachio: [392, 252, .6], ptero: [372, 196, .78], trice: [404, 196, .76], anky: [404, 200, .8], stego: [404, 196, .76] };
const dView = s => DVIEW[s] || [404, 184, .74];
const botSVG = (d, id) => id === "kop" ? KOP[d.kop] : id === "staart" ? STAART[d.staart] : BOT[id];
/* plek + draai van een bot; f = gespiegeld (schedels zijn naar rechts getekend, de dino kijkt naar links) */
const pT = (p, extra) => `translate(${p.x} ${p.y}) rotate(${p.r || 0}) scale(${(p.s || 1) * (extra || 1) * (p.f ? -1 : 1)} ${(p.s || 1) * (extra || 1)})`;

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
const dBrul = () => { tone(88, .55, "sawtooth", .18, 0, 58); tone(132, .45, "square", .08, .06, 76); tone(210, .3, "sawtooth", .06, .1, 120); };
function dinoOpen() {
  unlockAudio(); dLoad();
  show("dino");
  DV = { tok: 0 };
  dNieuweKuil();
}
function dinoStop() { if (!DV) return; DV.tok++; if (DV.upH) window.removeEventListener("pointerup", DV.upH); DV = null; if (DS) dSave(); }

/* ---------- een nieuwe kuil (elke keer een stapje moeilijker) ---------- */
function dNieuweKuil() {
  const lvl = Math.min(4, Math.floor(DS.done / 2));
  const draai = [0, 0, 45, 999, 999][lvl], vreemd = [0, 0, 0, 1, 2][lvl];
  const pool = lvl >= 3 ? DSOORT : DEENVOUDIG;
  const nog = pool.filter(s => !DS.gevonden[s]);
  const soort = nog.length ? pick(nog) : pick(pool);
  const d = DINO[soort];
  const delen = d.delen.map((p, i) => ({ ...p, i }));
  /* botten van een ándere dino die er niet bij horen */
  const extra = [];
  if (vreemd) {
    const mag = [];
    DSOORT.filter(s => s !== soort).forEach(s2 => {
      mag.push({ id: "kop", van: s2 });
      if (DINO[s2].staart !== d.staart) mag.push({ id: "staart", van: s2 });
      DINO[s2].delen.forEach(p => { if (["platen", "zeil", "vleugel"].includes(p.id) && !d.delen.some(q => q.id === p.id)) mag.push({ id: p.id, van: s2 }); });
    });
    for (let j = 0; j < vreemd && mag.length; j++) {
      const m = mag.splice(Math.floor(Math.random() * mag.length), 1)[0];
      extra.push({ ...m, i: 100 + j, s: .9 });
    }
  }
  const alles = delen.concat(extra);
  const plek = [[110, 148], [232, 138], [352, 146], [470, 140], [560, 210], [130, 232], [250, 248], [370, 244], [478, 250], [95, 200], [300, 196], [420, 198]]
    .sort(() => Math.random() - .5);
  alles.forEach((p, i) => {
    p.zx = plek[i][0]; p.zy = plek[i][1];
    p.zr = draai === 0 ? (p.r || 0) : draai === 999 ? rnd(-180, 180) : (p.r || 0) + rnd(-draai, draai);
    p.uit = false; p.vast = false;
  });
  DV.kuil = { soort, lvl, delen, extra, alles, kaarten: alles.slice().sort(() => Math.random() - .5), gevonden: 0 };
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
      <g id="dbot">${k.alles.map(p => `<g class="dbot" data-i="${p.i}" transform="translate(${p.zx} ${p.zy}) rotate(${p.zr}) scale(${(p.s || 1) * .62 * (p.f ? -1 : 1)} ${(p.s || 1) * .62})">${botSVG(DINO[p.van || k.soort], p.id)}</g>`).join("")}</g>
      <g id="dzand">${Array.from({ length: ZAND.cols * ZAND.rows }, (_, i) => {
        const cx = ZAND.x + (i % ZAND.cols) * ZAND.w, cy = ZAND.y + Math.floor(i / ZAND.cols) * ZAND.h;
        return `<g class="dtegel" data-i="${i}"><rect x="${cx}" y="${cy}" width="${ZAND.w}" height="${ZAND.h}" fill="${i % 2 ? "#D9B57C" : "#D2AB70"}"/>
          ${[7, 19, 31, 41].map((o, j) => `<circle cx="${cx + (o * 3 + i * 7) % 44 + 3}" cy="${cy + (o * 5 + i * 3) % 36 + 4}" r="${1.5 + j % 2}" fill="#B8924E"/>`).join("")}</g>`;
      }).join("")}</g>
      <g id="dfx"></g>
    </svg>
    <div class="dteller" id="dteller"><b id="dnum">0</b><span>/ ${k.alles.length}</span></div>`);
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
  svg.addEventListener("pointerdown", e => { veegt = true; unlockAudio(); veeg(e); });
  svg.addEventListener("pointermove", veeg);
  DV.upH = () => { veegt = false; };
  window.addEventListener("pointerup", DV.upH);
  dsay("dino_welkom", () => dsay("dino_botten_" + k.alles.length, () => k.extra.length ? dsay("dino_ook_andere") : dsay("dino_veeg")));
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
  k.alles.forEach(p => {
    if (p.uit) return;
    const cx = Math.floor((p.zx - ZAND.x) / ZAND.w), cy = Math.floor((p.zy - ZAND.y) / ZAND.h);
    const t = document.querySelector(`#dzand .dtegel[data-i="${cy * ZAND.cols + cx}"]`);
    if (t && !t.dataset.weg) return;
    p.uit = true; k.gevonden++;
    const b = document.querySelector(`#dbot .dbot[data-i="${p.i}"]`);
    if (b) b.classList.add("dpop");
    sfx.sparkle(); say("n" + Math.min(20, k.gevonden));
    const n = $("#dnum"); if (n) n.textContent = k.gevonden;
    if (k.gevonden >= k.alles.length) dLater(() => dsay("dino_alles", () => dLater(dLeggen, 200)), 700);
  });
}
/* ---------- deel 2: het skelet leggen ---------- */
function dLeggen() {
  const k = DV.kuil, d = DINO[k.soort];
  k.sel = null; k.selGat = null;
  const el = dview("leggen", `
    <svg viewBox="0 0 ${W} ${H}" id="dsvg">
      <rect width="${W}" height="${H}" fill="#2E3856"/>
      <rect y="284" width="${W}" height="91" fill="#1F2740"/>
      <g id="dskelet" transform="translate(${dView(k.soort)[0]} ${dView(k.soort)[1]}) scale(${dView(k.soort)[2]})">
        ${k.delen.map(p => `<g class="dgat" data-i="${p.i}" transform="${pT(p)}">
          <g class="sil">${botSVG(d, p.id)}</g><circle r="16" fill="transparent"/></g>`).join("")}
        <g id="dvast"></g>
      </g>
      <g id="dfx"></g>
    </svg>
    <div class="dcards" id="dcards">${k.kaarten.map(p => `<button class="btn dcard" data-i="${p.i}" aria-label="bot">
      <svg viewBox="-70 -70 140 140"><g transform="rotate(${p.zr - (p.r || 0)}) scale(${(p.s || 1) * .52 * (p.f ? -1 : 1)} ${(p.s || 1) * .52})">${botSVG(DINO[p.van || k.soort], p.id)}</g></svg></button>`).join("")}</div>`);
  homeButton(el);
  el.querySelectorAll(".dcard").forEach(b => b.addEventListener("click", () => { unlockAudio(); dKiesBot(+b.dataset.i, b); }));
  el.querySelectorAll(".dgat").forEach(g => g.addEventListener("click", () => { unlockAudio(); dKiesGat(+g.dataset.i); }));
  dsay("dino_leg");
}
function dKiesBot(i, btn) {
  const k = DV.kuil;
  if (k.busy || btn.classList.contains("gone")) return;
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
  const mis = () => {
    if (gat) { gat.classList.remove("tschud"); void gat.getBBox(); gat.classList.add("tschud"); }
    if (kaart) { kaart.classList.remove("wrong"); void kaart.offsetWidth; kaart.classList.add("wrong"); }
    tone(160, .25, "square", .12, 0, 110);
  };
  if (boti >= 100) { mis(); dsay("dino_vreemd"); return; }
  if (boti !== gati) { mis(); dsay("dino_past_niet"); return; }
  const p = k.delen[k.delen.findIndex(q => q.i === boti)];
  p.vast = true;
  k.busy = true;
  if (kaart) { kaart.classList.add("gone"); kaart.disabled = true; }
  if (gat) gat.querySelector(".sil").classList.add("done");
  $("#dvast").insertAdjacentHTML("beforeend", `<g class="dpop" transform="${pT(p)}">${botSVG(d, p.id)}</g>`);
  sfx.pop(); sparkleAt($("#dfx"), dView(k.soort)[0] + p.x * dView(k.soort)[2], dView(k.soort)[1] + p.y * dView(k.soort)[2], false, ["#fff", "#FFD600"]);
  const n = k.delen.filter(q => q.vast).length;
  dLater(() => {
    k.busy = false;
    if (n >= k.delen.length) { confetti(40); sfx.fanfare(); dsay("dino_klaar", () => dLater(dLeven, 300)); }
    else if (n === 1) say(pick(["goed1", "goed2", "goed3", "goed4"]));   // alleen de eerste keer een compliment
    else tone(560 + n * 70, .14, "triangle", .12, 0, 1240);
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
      <g id="dskelet" transform="translate(${dView(k.soort)[0]} ${302 - 84 * dView(k.soort)[2]}) scale(${dView(k.soort)[2]})">${k.delen.map(p => `<g transform="${pT(p)}">${botSVG(d, p.id)}</g>`).join("")}</g>
      <g id="dlevend" transform="translate(${dView(k.soort)[0]} ${302 - 84 * dView(k.soort)[2]}) scale(${dView(k.soort)[2]})" opacity="0"><g class="dbody">${dinoLevend(k.soort)}</g></g>
      <g id="dfx"></g>
    </svg>`);
  homeButton(el);
  const sk = $("#dskelet"), lv = $("#dlevend");
  dAnim(1500, t => { sk.setAttribute("opacity", 1 - t); lv.setAttribute("opacity", t); }, () => {
    sk.remove();
    const body = lv.querySelector(".dbody"); if (body) body.classList.add("dbrul");
    dBrul(); confetti(50);
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
  const rij1 = DSOORT.slice(0, 5), rij2 = DSOORT.slice(5);
  const stand = (s, x, y) => `<g class="dstand" data-s="${s}" transform="translate(${x} ${y})">
      <rect x="-48" y="0" width="96" height="13" rx="5" fill="#B08B5A" ${ST}/>
      <g transform="translate(0 -25) scale(.3)"><g class="dbody ${DS.gevonden[s] ? "" : "sil"}">${dinoLevend(s)}</g></g>
      <rect x="-50" y="-96" width="100" height="112" fill="transparent"/></g>`;
  const el = dview("museum", `
    <svg viewBox="0 0 ${W} ${H}" id="dsvg">
      <rect width="${W}" height="${H}" fill="#F3E7D2"/>
      <rect y="186" width="${W}" height="10" fill="#D9C6A5"/>
      <rect y="338" width="${W}" height="37" fill="#C8A26A" ${ST}/>
      ${[26, 640].map(x => `<rect x="${x}" y="30" width="20" height="308" fill="#E3D3B6" ${TH}/>`).join("")}
      <g id="dstands">
        ${rij1.map((s, i) => stand(s, 82 + i * 126, 184)).join("")}
        ${rij2.map((s, i) => stand(s, 146 + i * 126, 336)).join("")}
      </g>
      <g id="dfx"></g>
    </svg>
    <div class="dtitel">${Object.keys(DS.gevonden).length} / ${DSOORT.length}</div>
    <button class="btn vagain dagain" id="dagain" aria-label="Nog een kuil">${ICONS.play}</button>
    <div class="vstars"><svg viewBox="0 0 40 40"><path d="M20 4 l5 11 12 1 -9 8 3 12 -11 -6 -11 6 3 -12 -9 -8 12 -1z" fill="#FFD600" ${ST}/></svg><span>${DS.stars}</span></div>`);
  homeButton(el);
  $("#dagain").addEventListener("click", () => { unlockAudio(); sfx.pop(); dNieuweKuil(); });
  el.querySelectorAll(".dstand").forEach(g => g.addEventListener("click", () => {
    unlockAudio();
    const s = g.dataset.s;
    if (!DS.gevonden[s]) { sfx.click(); return; }
    const b = g.querySelector(".dbody"); b.classList.remove("dbrul"); void b.getBBox(); b.classList.add("dbrul");
    dBrul();
    dsay("dino_naam_" + s);
  }));
  dsay("dino_nog_een");
}

if (typeof renderHome === "function" && typeof current !== "undefined" && current === "home") renderHome();
