"use strict";
/* Xavi's Dierentuin — één ronde bestaat uit drie delen, geloot uit: verzorgen (herhaald optellen),
   kassa (kaartjes en wisselgeld), dierenarts (wegen en vergelijken) en safari (Engels, klanken, zoeken).
   Tekeningen staan in zooart.js (gestileerd 3D). */

const ZOOKEY = "xavi-zoo-v1";
const ZVOER = {
  blad: `<path d="M0 14 q-16 -8 -13 -22 q13 -10 26 -3 q3 15 -13 25z" fill="#7CC24B"/><path d="M0 14 q-2 -14 6 -22" stroke="#4C8A2A" stroke-width="2.5" fill="none"/>`,
  fruit: `<path d="M-13 -6 q3 18 14 22 q11 3 11 -5 q-9 2 -14 -6 q-5 -7 -3 -11z" fill="#FFD54F"/><path d="M-13 -6 q-3 -6 3 -7" stroke="#A1762A" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  vlees: `<path d="M-12 6 q-4 -16 10 -18 q14 -2 15 10 q1 10 -9 12 q-12 2 -16 -4z" fill="#EF7A6B"/><circle cx="-11" cy="9" r="5" fill="#F3E3C8"/>`,
  vis: `<path d="M12 0 L22 -8 V8 Z" fill="#4FC3F7"/><ellipse cx="0" cy="0" rx="14" ry="9" fill="#81D4FA"/><circle cx="-6" cy="-2" r="2.2" fill="#0D4F6B"/>`
};
const zMunt = v => `<circle r="17" fill="${v === 5 ? "#CFD8DC" : "#FFC107"}" stroke="${v === 5 ? "#90A4AE" : "#E0A800"}" stroke-width="3"/><text y="7" text-anchor="middle" class="znum">${v}</text>`;
/* speelgoed-mensje: bol hoofd, capsule lijf */
function zMens(kleur, groot) {
  const s = groot ? 1 : .68, h = groot ? "#F3C89B" : "#F7D6B0";
  return `<g transform="scale(${s})">${zgrond(0, 26)}
    <path d="M-17 0 q-3 -42 17 -42 q20 0 17 42z" fill="${kleur}"/>
    <ellipse cx="0" cy="-54" rx="17" ry="16" fill="${h}"/>
    <path d="M-17 -58 q17 -16 34 0 q-6 -10 -17 -10 q-11 0 -17 10z" fill="#6D4C41"/>
    ${zoog(-6, -54, 4.5)}${zoog(6, -54, 4.5)}
    <path d="M-5 -46 q5 4 10 0" stroke="#8A5A34" stroke-width="2.5" fill="none" stroke-linecap="round"/></g>`;
}
/* ---------- toestand ---------- */
let ZS = null, ZV = null;
function zLoad() {
  try { ZS = JSON.parse(localStorage.getItem(ZOOKEY)); } catch (e) { ZS = null; }
  if (!ZS || ZS.v !== 1) ZS = { v: 1, done: 0, stars: 0 };
}
function zSave() { try { localStorage.setItem(ZOOKEY, JSON.stringify(ZS)); } catch (e) {} }
function zview(name, html) {
  ZV.tok++; ZV.view = name;
  if (ZV.upH) { window.removeEventListener("pointerup", ZV.upH); ZV.upH = null; }
  const el = $("#zoo");
  el.innerHTML = html;
  return el;
}
function zLater(fn, ms) { const tok = ZV && ZV.tok; return setTimeout(() => { if (ZV && ZV.tok === tok) fn(); }, ms); }
function zAnim(dur, fn, done) {
  const tok = ZV && ZV.tok, t0 = performance.now();
  const step = now => {
    if (!ZV || ZV.tok !== tok) return;
    const t = Math.min(1, (now - t0) / dur);
    fn(t);
    if (t < 1) requestAnimationFrame(step); else if (done) done();
  };
  requestAnimationFrame(step);
}
function zsay(name, cb) { const tok = ZV && ZV.tok; say(name, cut => { if (cut || !ZV || ZV.tok !== tok) return; if (cb) cb(); }); }
const zLucht = (gras = 300) => `<rect width="${W}" height="${H}" fill="url(#zg-lucht)"/>
  <circle cx="596" cy="46" r="30" fill="#FFE07A"/>
  ${[90, 300, 500].map((x, i) => `<g opacity=".9"><ellipse cx="${x}" cy="${54 + i * 8}" rx="46" ry="20" fill="#fff"/><ellipse cx="${x - 28}" cy="${60 + i * 8}" rx="26" ry="14" fill="#fff"/><ellipse cx="${x + 30}" cy="${58 + i * 8}" rx="28" ry="15" fill="#fff"/></g>`).join("")}
  <rect y="${gras}" width="${W}" height="${H - gras}" fill="url(#zg-gras)"/>`;
/* antwoordkaarten (hergebruikt de kaartjes van de bus) */
function zVraag(el, goed, max, goedCb, zegFout) {
  const opties = new Set([goed]);
  while (opties.size < 3) { const d = goed + (Math.random() < .5 ? -1 : 1) * (1 + Math.floor(Math.random() * 3)); if (d > 0 && d <= max) opties.add(d); }
  const box = document.createElement("div");
  box.className = "vans"; box.id = "zans";
  box.innerHTML = [...opties].sort(() => Math.random() - .5).map(n => `<button class="btn vansb" data-n="${n}">${n}</button>`).join("");
  el.appendChild(box);
  box.querySelectorAll(".vansb").forEach(b => b.addEventListener("click", () => {
    unlockAudio();
    if (+b.dataset.n !== goed) { b.classList.remove("wrong"); void b.offsetWidth; b.classList.add("wrong"); tone(160, .25, "square", .12, 0, 110); rondeFout(); if (zegFout) zsay(zegFout); return; }
    box.remove(); sfx.sparkle();
    goedCb();
  }));
  return box;
}
function zooOpen() {
  unlockAudio(); zLoad();
  show("zoo");
  ZV = { tok: 0 };
  const el = zview("niveau", `<svg viewBox="0 0 ${W} ${H}">${zLucht(290)}
    <g transform="translate(150 300) scale(.6)">${zooDier("olifant")}</g><g transform="translate(520 300) scale(.6)">${zooDier("giraf")}</g></svg>`);
  homeButton(el);
  nivKies(el, "zoo", n => { ZV.niv = n; zNieuweRonde(); });
}
function zooStop() { if (!ZV) return; ZV.tok++; if (ZV.upH) window.removeEventListener("pointerup", ZV.upH); ZV = null; if (ZS) zSave(); }

/* ---------- een ronde van drie delen ---------- */
function zNieuweRonde() {
  const lvl = ZV.niv === undefined ? 0 : ZV.niv;
  const delen = ["voer", "kassa", "arts", "safari"].sort(() => Math.random() - .5).slice(0, 3);
  ZV.ronde = { lvl, delen, i: -1 };
  rondeStart("zoo", lvl);
  zsay("zoo_welkom", () => zVolgende());
}
function zVolgende() {
  const r = ZV.ronde;
  r.i++;
  if (r.i >= r.delen.length) { zRondeKlaar(); return; }
  ({ voer: zVoer, kassa: zKassa, arts: zArts, safari: zSafari })[r.delen[r.i]]();
}
function zRondeKlaar() {
  ZS.done++; ZS.stars++; zSave();
  const el = zview("klaar", `<svg viewBox="0 0 ${W} ${H}">${zLucht(290)}
    ${ZSOORT.slice(0, 4).map((k, i) => `<g transform="translate(${90 + i * 160} 300) scale(.5)">${zooDier(k)}</g>`).join("")}</svg>`);
  homeButton(el);
  zsay("zoo_klaar", () => sterrenTonen(el, zsay, () => {}));
  const again = document.createElement("button");
  again.className = "btn vagain tagain"; again.setAttribute("aria-label", "Nog een dag");
  again.innerHTML = ICONS.play;
  again.addEventListener("click", () => { unlockAudio(); sfx.pop(); zooOpen(); });
  el.appendChild(again);
  const st = document.createElement("div");
  st.className = "vstars";
  st.innerHTML = `<svg viewBox="0 0 40 40"><path d="M20 4 l5 11 12 1 -9 8 3 12 -11 -6 -11 6 3 -12 -9 -8 12 -1z" fill="#FFD600" ${ST}/></svg><span>${ZS.stars}</span>`;
  el.appendChild(st);
}

/* ---------- deel: verzorgen (herhaald optellen) ---------- */
function zVoer() {
  const lvl = ZV.ronde.lvl;
  const soort = pick(ZSOORT);
  const d = ZOO[soort];
  const n = [2 + Math.floor(Math.random() * 2), 2 + Math.floor(Math.random() * 3), 3 + Math.floor(Math.random() * 3)][lvl];
  const m = [1 + Math.floor(Math.random() * 2), 2 + Math.floor(Math.random() * 2), 2 + Math.floor(Math.random() * 3)][lvl];
  const totaal = n * m;
  const V = ZV.voer = { soort, n, m, totaal, in: 0, stapel: Math.min(16, totaal + 3), klaar: false };
  const el = zview("voer", `
    <svg viewBox="0 0 ${W} ${H}" id="zsvg">${zLucht(222)}
      ${Array.from({ length: 7 }, (_, i) => `<rect x="${16 + i * 66}" y="206" width="9" height="40" rx="4" fill="#C9A978"/>`).join("")}
      <rect x="10" y="212" width="430" height="9" rx="4" fill="#DCC08E"/>
      <g id="zdieren">${Array.from({ length: n }, (_, i) => `<g transform="translate(${64 + i * (396 / n)} ${272 - (i % 2) * 6}) scale(${.52 - n * .03})">${zooDier(soort)}</g>`).join("")}</g>
      <g id="zspul" opacity="0">
        <g transform="translate(206 372)"><rect x="-176" y="-26" width="352" height="30" rx="12" fill="#A9733F"/><rect x="-176" y="-34" width="352" height="12" rx="6" fill="#C98B4C"/>
          <g id="zbak"></g></g>
        <g id="zstapel"></g>
      </g>
      <g id="zfx"></g>
    </svg>
    <div class="zbord"><span class="zn">${n}</span><span class="zx">×</span><span class="zi">${ZVOER[d.eet] ? `<svg viewBox="-24 -24 48 48">${ZVOER[d.eet]}</svg>` : ""}</span><span class="zn">${m}</span></div>
    <button class="btn tklaar" id="zklaar" aria-label="Klaar" hidden><svg viewBox="0 0 40 40"><path d="M8 21 l8 9 L33 10" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`);
  homeButton(el);
  const tekenBak = () => {
    $("#zbak").innerHTML = Array.from({ length: V.in }, (_, i) => `<g class="zk" data-i="${i}" transform="translate(${-152 + (i % 10) * 32} ${-44 - Math.floor(i / 10) * 28}) scale(.9)">${ZVOER[d.eet]}</g>`).join("");
    $("#zbak").querySelectorAll(".zk").forEach(g => g.addEventListener("click", ev => { ev.stopPropagation(); unlockAudio(); if (V.klaar || V.in <= 0) return; V.in--; V.stapel++; sfx.pop(); tekenBak(); tekenStapel(); }));
  };
  const tekenStapel = () => {
    $("#zstapel").innerHTML = Array.from({ length: V.stapel }, (_, i) => `<g class="zs" data-i="${i}" transform="translate(${478 + (i % 4) * 54} ${310 - Math.floor(i / 4) * 46})"><circle r="24" fill="transparent"/>${ZVOER[d.eet]}</g>`).join("");
    $("#zstapel").querySelectorAll(".zs").forEach(g => g.addEventListener("click", () => {
      unlockAudio();
      if (V.klaar || V.stapel <= 0) return;
      V.stapel--; V.in++;
      sfx.pop(); say("n" + Math.min(20, V.in));
      tekenBak(); tekenStapel();
    }));
  };
  tekenBak(); tekenStapel();
  $("#zklaar").addEventListener("click", () => {
    unlockAudio();
    if (V.in !== V.totaal) { tone(160, .25, "square", .12, 0, 110); rondeFout(); zsay(V.in > V.totaal ? "zoo_voer_teveel" : "zoo_voer_leg"); return; }
    V.klaar = true;
    $("#zklaar").hidden = true;
    confetti(30); sfx.fanfare();
    zsay("zoo_voer_goed", () => zLater(zVolgende, 400));
  });
  const start = () => { $("#zklaar").hidden = false; $("#zspul").setAttribute("opacity", 1); zsay("zoo_voer_leg"); };
  zsay("zoo_voer_uitleg", () => zsay("zoo_elk_" + m, () => {
    if (lvl === 0) { start(); return; }
    zsay("zoo_voer_vraag");
    zVraag(el, totaal, 20, start, "zoo_voer_vraag");
  }));
}

/* ---------- deel: kassa (kaartjes en wisselgeld) ---------- */
function zKassa() {
  const lvl = ZV.ronde.lvl;
  const volw = 1 + Math.floor(Math.random() * 2), kind = 1 + Math.floor(Math.random() * 3);
  const pV = [1, 2, 5][lvl], pK = [1, 1, 2][lvl];
  const totaal = volw * pV + kind * pK;
  const groot = lvl === 2 ? (totaal <= 10 ? 10 : 20) : 0;
  const K = ZV.kassa = { volw, kind, pV, pK, totaal, groot, terug: 0 };
  const el = zview("kassa", `
    <svg viewBox="0 0 ${W} ${H}" id="zsvg">${zLucht(300)}
      <g transform="translate(470 300)"><rect x="-120" y="-176" width="240" height="176" rx="14" fill="#F0E2C8"/>
        <rect x="-134" y="-196" width="268" height="30" rx="12" fill="#E07A4A"/>
        <text x="0" y="-174" text-anchor="middle" class="zsign">ZOO</text>
        <rect x="-86" y="-140" width="172" height="86" rx="10" fill="#BFE6F5"/>
        <g transform="translate(0 -40)">${zMens("#5B8FD6", 1)}</g></g>
      <g id="zgezin">
        ${Array.from({ length: volw }, (_, i) => `<g transform="translate(${70 + i * 62} 300)">${zMens("#D96A6A", 1)}</g>`).join("")}
        ${Array.from({ length: kind }, (_, i) => `<g transform="translate(${180 + i * 50} 300)">${zMens("#6FBF73", 0)}</g>`).join("")}
      </g>
      <g id="zfx"></g>
    </svg>
    <div class="zprijs"><span>${zTicket(1)} ${pV}</span><span>${zTicket(0)} ${pK}</span></div>
    <div class="xpaid" id="zterug" hidden>terug <b id="zterugn">0</b></div>
    <div class="xpurse" id="zpurse" hidden></div>`);
  homeButton(el);
  const klaar = () => { confetti(40); sfx.fanfare(); zsay("zoo_kassa_goed", () => zLater(zVolgende, 400)); };
  const naTotaal = () => {
    if (!groot) { klaar(); return; }
    $("#zterug").hidden = false;
    const purse = $("#zpurse");
    purse.hidden = false;
    purse.innerHTML = [1, 2, 5].map(v => `<button class="btn wcoin" data-v="${v}" aria-label="${v} muntje"><svg viewBox="-22 -22 44 44">${zMunt(v)}</svg></button>`).join("");
    const doel = groot - totaal;
    const fx = $("#zfx");
    fx.insertAdjacentHTML("beforeend", `<g transform="translate(300 180) scale(2)">${zMunt(groot)}</g>`);
    purse.querySelectorAll(".wcoin").forEach(b => b.addEventListener("click", () => {
      unlockAudio();
      const v = +b.dataset.v;
      if (K.terug + v > doel) { b.classList.remove("wrong"); void b.offsetWidth; b.classList.add("wrong"); tone(160, .25, "square", .12, 0, 110); rondeFout(); zsay("zoo_kassa_terug"); return; }
      K.terug += v; sfx.click();
      $("#zterugn").textContent = K.terug;
      if (K.terug === doel) { purse.hidden = true; klaar(); } else say("n" + Math.min(20, K.terug));
    }));
    zsay("zoo_kassa_terug");
  };
  zsay("zoo_two_tickets", () => zsay("zoo_kassa_uitleg", () => {
    zsay("zoo_kassa_vraag");
    zVraag(el, totaal, 30, naTotaal, "zoo_kassa_vraag");
  }));
}
const zTicket = groot => `<svg viewBox="0 0 40 26"><rect x="2" y="4" width="36" height="18" rx="4" fill="${groot ? "#F2B13C" : "#7FC6E8"}" stroke="#9A6A20" stroke-width="2"/><circle cx="20" cy="13" r="4" fill="#FFF3D6"/></svg>`;

/* ---------- deel: dierenarts (wegen en vergelijken) ---------- */
function zArts() {
  const lvl = ZV.ronde.lvl;
  const type = lvl === 0 ? "weeg" : lvl === 1 ? (Math.random() < .5 ? "weeg" : "zwaarst") : pick(["samen", "zwaarst", "weeg"]);
  /* bij optellen alleen de lichte dieren, anders worden de sommen te groot */
  const pool = (type === "samen" ? ZSOORT.filter(k => ZOO[k].kg <= 28) : ZSOORT).slice().sort(() => Math.random() - .5);
  const soort = ZV.artsSoort = pool[0], tweede = pool[1];
  const a = ZOO[soort], b = ZOO[tweede];
  const el = zview("arts", `
    <svg viewBox="0 0 ${W} ${H}" id="zsvg">${zLucht(300)}
      <rect x="0" y="300" width="${W}" height="75" fill="#D9CDB6"/>
      <g id="zweeg"></g><g id="zfx"></g>
    </svg>`);
  homeButton(el);
  const weegschaal = (x, k, kg, toon) => `<g transform="translate(${x} 300)">
      <g transform="translate(0 -46) scale(.46)">${zooDier(k)}</g>
      <rect x="-76" y="-46" width="152" height="18" rx="8" fill="#CFD8DC"/><rect x="-54" y="-28" width="108" height="30" rx="10" fill="#90A4AE"/>
      <rect x="-40" y="-24" width="80" height="22" rx="7" fill="#263238"/>
      <text x="0" y="-7" text-anchor="middle" class="zkg">${toon ? kg : "?"}</text></g>`;
  if (type === "weeg") {
    $("#zweeg").innerHTML = weegschaal(330, soort, a.kg, true);
    zsay("zoo_arts_uitleg", () => { zsay("zoo_weeg_vraag"); zVraag(el, a.kg, 70, goed, "zoo_weeg_vraag"); });
  } else if (type === "samen") {
    $("#zweeg").innerHTML = weegschaal(180, soort, a.kg, true) + weegschaal(500, tweede, b.kg, true);
    zsay("zoo_erbij");
    zVraag(el, a.kg + b.kg, 120, goed, "zoo_erbij");
  } else {
    const zwaar = a.kg > b.kg ? soort : tweede;
    $("#zweeg").innerHTML = `<g class="zkies" data-k="${soort}">${weegschaal(180, soort, a.kg, true)}</g><g class="zkies" data-k="${tweede}">${weegschaal(500, tweede, b.kg, true)}</g>`;
    el.querySelectorAll(".zkies").forEach(g => g.addEventListener("click", () => {
      unlockAudio();
      if (g.dataset.k !== zwaar) { tone(160, .25, "square", .12, 0, 110); rondeFout(); zsay("zoo_zwaarste"); return; }
      sparkleAt($("#zfx"), g.dataset.k === soort ? 180 : 500, 240, true); goed();
    }));
    zsay("zoo_zwaarste");
  }
  function goed() { confetti(30); sfx.fanfare(); zsay("zoo_arts_goed", () => zLater(zVolgende, 400)); }
}

/* ---------- deel: safari (Engels, klanken en zoeken) ---------- */
function zSafari() {
  const lvl = ZV.ronde.lvl;
  const aantal = [3, 5, 6][lvl];
  const soorten = ZSOORT.slice().sort(() => Math.random() - .5).slice(0, aantal);
  const plek = [[90, 250], [250, 232], [410, 252], [560, 236], [170, 330], [430, 330], [600, 320]].slice(0, aantal);
  const S = ZV.safari = { soorten, taken: soorten.slice().sort(() => Math.random() - .5).slice(0, 3), i: 0, gedaan: [] };
  const el = zview("safari", `
    <svg viewBox="0 0 ${W} ${H}" id="zsvg">${zLucht(210)}
      ${[60, 300, 540].map((x, i) => `<ellipse cx="${x}" cy="${230 + i * 10}" rx="${90 + i * 10}" ry="30" fill="#8CC45E" opacity=".55"/>`).join("")}
      ${[[120, 214], [470, 206]].map(([x, y]) => `<g><rect x="${x - 7}" y="${y - 46}" width="14" height="52" rx="6" fill="#8D6E63"/><ellipse cx="${x}" cy="${y - 54}" rx="42" ry="26" fill="#6FA845"/><ellipse cx="${x - 10}" cy="${y - 62}" rx="24" ry="16" fill="#8CC45E"/></g>`).join("")}
      <g id="zsafari">${soorten.map((k, i) => `<g class="zdier" data-k="${k}" transform="translate(${plek[i][0]} ${plek[i][1]}) scale(${.4 - (i % 3) * .03})"><rect x="-90" y="-200" width="180" height="210" fill="transparent"/>${zooDier(k)}</g>`).join("")}</g>
      <g id="zfx"></g>
    </svg>`);
  homeButton(el);
  const volgende = () => {
    if (S.i >= S.taken.length) { confetti(40); sfx.fanfare(); zLater(zVolgende, 600); return; }
    const k = S.taken[S.i];
    S.klank = lvl === 2 && Math.random() < .5;
    if (S.klank) zsay("zoo_klank", () => zsay("zoo_k_" + k));
    else zsay("zoo_find", () => zsay("zoo_en_" + k));
  };
  el.querySelectorAll(".zdier").forEach(g => g.addEventListener("click", () => {
    unlockAudio();
    const k = g.dataset.k, doel = S.taken[S.i];
    if (S.i >= S.taken.length) return;
    if (k !== doel) { g.classList.remove("zschud"); void g.getBBox(); g.classList.add("zschud"); tone(160, .25, "square", .12, 0, 110); rondeFout(); zsay("zoo_safari_fout"); return; }
    S.i++;
    const fl = svgEl("", `<rect width="${W}" height="${H}" fill="#fff"/>`);
    $("#zfx").appendChild(fl);
    zAnim(320, t => fl.setAttribute("opacity", 1 - t), () => fl.remove());
    sfx.sparkle();
    zsay("zoo_safari_goed", () => zsay("zoo_nl_" + k, () => zLater(volgende, 200)));
  }));
  zsay("zoo_safari_uitleg", () => volgende());
}

if (typeof renderHome === "function" && typeof current !== "undefined" && current === "home") renderHome();
