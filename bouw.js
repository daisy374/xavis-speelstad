"use strict";
/* Xavi's Bouwstad — bouwplekken vrijmaken, graven, fundering gieten en stapelen met de kraan.
   Tekenstijl A "Echt & stoer": verlopen kleuren, dunne donkere lijnen, schaduwen.
   Gebruikt de gedeelde hulpjes uit app.js (say, sfx, tone, confetti, sparkleAt, heartsAt, ANIMALS, …). */

const BKEY = "xavi-bouwstad-v1";
const BPLOTS = 6, BPLOT_W = 210, BTOWN_W = 120 + BPLOTS * BPLOT_W;
const BCOL = { rood: "#D9463B", blauw: "#3F7FD0", geel: "#F2C230", groen: "#4FA35A", oranje: "#EE8A2E", paars: "#8E5AC8" };
const BSHOP = ["bakker", "ijs", "speelgoed", "groente"];
const BRES = ["koe", "paard", "varken", "schaap", "kip", "eend"];
const BSHAPES = ["vierkant", "cirkel", "driehoek", "rechthoek"];

/* ---------- tekenstijl A ---------- */
const BPAL = {
  sky: ["#8CC8EE", "#E9F5FB"], ground: ["#C9A46A", "#A8844E"], body: ["#FFC928", "#D38F00"], dark: ["#5A5147", "#37302A"],
  metal: ["#C3C9CE", "#7C868E"], tyre: ["#3A3A3A", "#1C1C1C"], hub: ["#E0B000", "#9E7A00"], glass: ["#CFEFFF", "#7FB6D6"],
  sand: ["#E3C27D", "#B8924E"], dirt: ["#8E6A40", "#5F452A"], red: ["#E04A3A", "#A8301F"], concrete: ["#D3D3CE", "#9E9E98"],
  grass: ["#8CC66A", "#5E9A44"], wood: ["#C08E5E", "#8A6139"], asphalt: ["#5B5B60", "#3E3E44"], dino: ["#4CC76F", "#2E8C4B"],
  far: ["#B9C7D2", "#A7B6C2"], skip: ["#3E8E5A", "#2A6440"], white: ["#FFFFFF", "#D9DEE2"], blueprint: ["#3C6FB5", "#2B5494"]
};
const BDEFS_SRC = `<defs>${Object.entries(BPAL).map(([k, [a, b]]) => `<linearGradient id="bz-${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`).join("")}
  <clipPath id="bz-drumclip"><path d="M-104 -62 Q-108 -112 -62 -120 L14 -106 Q34 -80 14 -50 L-62 -42 Q-100 -44 -104 -62 Z"/></clipPath>
  <linearGradient id="bz-shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient></defs>`;
// één centrale plek voor de kleurverlopen (dubbele id's in een verborgen scherm worden anders niet getekend)
document.body.insertAdjacentHTML("afterbegin", `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">${BDEFS_SRC}</svg>`);
const BDEFS = "";
const BE = `stroke="#2B2118" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"`;
const bp = (d, k, extra = "") => `<path d="${d}" fill="url(#bz-${k})" ${BE} ${extra}/>`;
const bc = (x, y, r, k) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#bz-${k})" ${BE}/>`;
const bshadow = (x, rx) => `<ellipse cx="${x}" cy="1" rx="${rx}" ry="7" fill="#000" opacity=".25"/>`;
const bwheel = (x, y, r) => bc(x, y, r, "tyre") + bc(x, y, r * .45, "hub") + `<circle cx="${x}" cy="${y}" r="${r * .14}" fill="#37302A"/>`
  + Array.from({ length: 10 }, (_, i) => { const a = i * Math.PI / 5; return `<path d="M${(x + Math.cos(a) * r * .78).toFixed(1)} ${(y + Math.sin(a) * r * .78).toFixed(1)} L${(x + Math.cos(a) * r * .97).toFixed(1)} ${(y + Math.sin(a) * r * .97).toFixed(1)}" stroke="#000" stroke-opacity=".4" stroke-width="3"/>`; }).join("");
const bdino = (x, y) => bc(x, y, 12, "dino") + bc(x + 12, y + 3, 9, "dino") + `<circle cx="${x + 3}" cy="${y - 4}" r="4" fill="#fff"/><circle cx="${x + 4.4}" cy="${y - 3.5}" r="2.2" fill="#1B1B2A"/><path d="M${x + 11} ${y + 7} q6 3 10 -1" fill="none" stroke="#1B1B2A" stroke-width="1.8" stroke-linecap="round"/>`;
const bshine = (x, y) => `<path d="M${x} ${y} l7 0 l-7 12 z" fill="#fff" opacity=".6"/>`;
const btrack = (x0, x1, h) => { const r = h / 2; return bp(`M${x0 + r} ${-h} H${x1 - r} Q${x1} ${-h} ${x1} ${-r} Q${x1} 0 ${x1 - r} 0 H${x0 + r} Q${x0} 0 ${x0} ${-r} Q${x0} ${-h} ${x0 + r} ${-h} Z`, "tyre")
  + Array.from({ length: Math.floor((x1 - x0) / 11) }, (_, i) => `<path d="M${x0 + 8 + i * 11} ${-h + 1} v5" stroke="#9a9a9a" stroke-width="2.2" opacity=".6"/>`).join(""); };

/* machines in lokale coördinaten: grond op y=0, kijkt naar rechts */
const MACH = {
  bulldozer: {
    parts: {
      rups: btrack(-92, 80, 34) + bc(-74, -17, 13, "metal") + bc(62, -17, 13, "metal") + [-40, -10, 22].map(x => bc(x, -12, 7, "metal")).join(""),
      romp: bp("M-82 -34 V-66 Q-82 -72 -76 -72 H10 V-34 Z", "body") + `<rect x="-82" y="-66" width="92" height="32" fill="url(#bz-shade)"/>` + bp("M-62 -72 V-94 H-53 V-72 Z", "dark")
        + bp("M-6 -34 V-112 Q-6 -118 0 -118 H40 Q46 -118 48 -112 L56 -70 V-34 Z", "body") + bp("M2 -110 H38 L46 -74 H2 Z", "glass") + bdino(22, -90) + bshine(5, -107)
        + [-70, -58, -46].map(x => `<path d="M${x} -64 v24" stroke="#000" stroke-opacity=".25" stroke-width="3"/>`).join(""),
      schuif: `<path d="M44 -44 L90 -30 M44 -26 L90 -18" stroke="url(#bz-metal)" stroke-width="7" stroke-linecap="round"/>` + bp("M88 -82 Q102 -42 92 0 H108 Q118 -42 104 -84 Z", "body")
        + `<path d="M92 -2 H110" stroke="#7C868E" stroke-width="5"/>`
    },
    order: ["rups", "romp", "schuif"]
  },
  graaf: {
    parts: {
      rups: btrack(-96, 98, 40) + bc(-75, -20, 15, "metal") + bc(79, -20, 15, "metal") + [-35, 3, 41].map(x => bc(x, -16, 9, "metal")).join(""),
      huis: bp("M-69 -40 V-82 Q-69 -94 -57 -94 H71 V-40 Z", "body") + `<rect x="-69" y="-94" width="140" height="54" fill="url(#bz-shade)"/>` + bp("M-87 -86 Q-87 -94 -77 -94 H-57 V-46 H-77 Q-87 -46 -87 -56 Z", "dark")
        + bp("M15 -90 V-148 Q15 -158 25 -158 H61 L79 -128 V-90 Z", "body") + bp("M23 -148 H57 L70 -126 V-100 H23 Z", "glass") + bdino(41, -122) + bshine(26, -145),
      arm: `<path d="M15 -74 L101 -160" stroke="url(#bz-metal)" stroke-width="7" stroke-linecap="round"/>`
        + bp("M45 -94 L127 -212 Q135 -220 147 -212 L155 -204 L69 -88 Z", "body") + bp("M135 -208 L155 -216 L205 -134 L189 -124 Z", "body")
        + `<path d="M127 -186 L177 -162" stroke="url(#bz-metal)" stroke-width="6" stroke-linecap="round"/>`
        + bp("M179 -130 L219 -138 L225 -106 Q209 -88 183 -100 Z", "dark") + `<path d="M219 -136 l8 -3 M222 -126 l9 -2 M224 -116 l9 0" stroke="#7C868E" stroke-width="3" stroke-linecap="round"/>`
        + `<ellipse id="bload" cx="203" cy="-120" rx="17" ry="9" fill="url(#bz-dirt)" ${BE} opacity="0"/>` + bc(135, -208, 6, "metal") + bc(195, -128, 5, "metal") + bc(55, -93, 7, "metal")
    },
    order: ["rups", "huis", "arm"], pivot: [55, -93]
  },
  kiep: {
    parts: {
      onderstel: bp("M-116 -40 H106 V-24 H-116 Z", "dark") + [-72, -22, 74].map(x => bwheel(x, -20, 21)).join(""),
      bak: `<g class="bed">${bp("M-110 -92 H38 L32 -38 H-104 Z", "red")}<rect x="-108" y="-90" width="144" height="50" fill="url(#bz-shade)"/>${[-84, -54, -24, 6].map(x => `<path d="M${x} -88 V-42" stroke="#000" stroke-opacity=".22" stroke-width="3"/>`).join("")}
        <g class="loadg" transform="translate(0 -90) scale(1 0)">${bp("M-106 0 Q-82 -38 -50 -18 Q-26 -38 0 -18 Q20 -28 36 0 Z", "sand")}</g></g>`,
      cabine: bp("M42 -38 V-102 Q42 -114 54 -114 H80 Q92 -114 97 -102 L108 -72 V-38 Z", "body") + bp("M50 -106 H78 Q86 -106 89 -98 L97 -74 H50 Z", "glass") + bdino(66, -87) + bshine(53, -103)
        + bp("M102 -64 H112 V-52 H102 Z", "hub") + bp("M86 -46 H116 V-34 H86 Z", "metal")
    },
    order: ["onderstel", "bak", "cabine"]
  },
  cement: {
    parts: {
      onderstel: bp("M-116 -40 H106 V-24 H-116 Z", "dark") + [-72, -22, 74].map(x => bwheel(x, -20, 21)).join("")
        + bp("M42 -38 V-102 Q42 -114 54 -114 H80 Q92 -114 97 -102 L108 -72 V-38 Z", "body") + bp("M50 -106 H78 Q86 -106 89 -98 L97 -74 H50 Z", "glass") + bdino(66, -87) + bshine(53, -103)
        + bp("M102 -64 H112 V-52 H102 Z", "hub") + bp("M86 -46 H116 V-34 H86 Z", "metal") + `<path d="M-108 -52 L-132 -28" stroke="url(#bz-metal)" stroke-width="8" stroke-linecap="round"/>`,
      trommel: `<g class="drum">${bp("M-104 -62 Q-108 -112 -62 -120 L14 -106 Q34 -80 14 -50 L-62 -42 Q-100 -44 -104 -62 Z", "white")}
        <g class="stripes" clip-path="url(#bz-drumclip)">${Array.from({ length: 8 }, (_, i) => `<path d="M${-120 + i * 26} -130 l-30 100" stroke="#E04A3A" stroke-width="9"/>`).join("")}</g>
        <path d="M-104 -62 Q-108 -112 -62 -120 L14 -106 Q34 -80 14 -50 L-62 -42 Q-100 -44 -104 -62 Z" fill="url(#bz-shade)" ${BE}/></g>
        <path d="M20 -100 L40 -96 M20 -54 L40 -60" stroke="url(#bz-metal)" stroke-width="6"/>`
    },
    order: ["onderstel", "trommel"]
  },
  kraan: {
    parts: {
      mast: `<rect x="-14" y="-230" width="28" height="230" fill="url(#bz-body)" ${BE}/>` + Array.from({ length: 11 }, (_, i) => `<path d="M-14 ${-i * 21} L14 ${-i * 21 - 21} M14 ${-i * 21} L-14 ${-i * 21 - 21}" stroke="#8A6200" stroke-width="2.5"/>`).join("")
        + bp("M-34 0 H34 V14 H-34 Z", "concrete"),
      giek: bp("M-80 -244 H230 V-232 H-80 Z", "body") + Array.from({ length: 15 }, (_, i) => `<path d="M${-78 + i * 21} -233 l10 -10 l10 10" fill="none" stroke="#8A6200" stroke-width="2"/>`).join("")
        + bp("M-78 -232 H-44 V-208 H-78 Z", "concrete") + bp("M-6 -244 L0 -270 L6 -244 Z", "body"),
      cabine: bp("M14 -230 H44 V-206 H14 Z", "body") + bp("M20 -226 H40 V-212 H20 Z", "glass") + `<g transform="translate(22 -214) scale(.55)">${bdino(8, -4)}</g>`
    },
    order: ["mast", "giek", "cabine"]
  }
};
const machSVG = k => MACH[k].order.map(p => `<g class="mp-${p}">${MACH[k].parts[p]}</g>`).join("");

/* ---------- gebouwen ---------- */
const bblock = (x, y, w, h, col) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${BCOL[col]}" ${BE}/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#bz-shade)"/>`
  + `<path d="M${x + 3} ${y + h / 2} H${x + w - 3}" stroke="#000" stroke-opacity=".12" stroke-width="2"/>`;
const bwindow = (x, y, w, h, lit) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${lit ? "#FFE9A8" : "url(#bz-glass)"}" ${BE}/><path d="M${x + w / 2} ${y} V${y + h} M${x} ${y + h / 2} H${x + w}" stroke="#fff" stroke-width="2" opacity=".8"/>`;
const SHOP_SIGN = {
  bakker: `<path d="M-14 4 Q-14 -10 0 -10 Q14 -10 14 4 Z" fill="#D9A45B" ${BE}/><path d="M-6 -6 l3 8 M2 -8 l3 8" stroke="#8A5A2B" stroke-width="2"/>`,
  ijs: `<path d="M-6 0 L0 14 L6 0 Z" fill="#D9A45B" ${BE}/><circle cx="0" cy="-4" r="7" fill="#F48FB1" ${BE}/>`,
  speelgoed: `<circle cx="-5" cy="2" r="7" fill="#3F7FD0" ${BE}/><rect x="1" y="-8" width="11" height="11" fill="#F2C230" ${BE}/>`,
  groente: `<path d="M-2 -6 L-8 12 L4 10 Z" fill="#EE8A2E" ${BE}/><path d="M-2 -6 l-3 -6 M-2 -6 l3 -6" stroke="#4FA35A" stroke-width="3"/><circle cx="7" cy="2" r="6" fill="#4FA35A" ${BE}/>`
};
const RESIDENT = t => (t === "paard" && typeof PAARD !== "undefined") ? PAARD : ANIMALS[t];
// een gebouw met de onderkant-midden op (0,0)
function buildingSVG(p) {
  if (!p) return "";
  let s = "";
  if (p.raw) {   // tijdens het bouwen: alleen de gestapelde blokken
    if (p.type === "toren") p.cols.forEach((c, i) => { s += bblock(-55, -(i + 1) * 16, 110, 16, c); });
    else { const bw = p.type === "winkel" ? 44 : 40, bh = p.type === "winkel" ? 64 : 34, x0 = p.type === "winkel" ? -88 : -80, cols = 4;
      p.cols.forEach((c, i) => { s += bblock(x0 + (i % cols) * bw, -bh - Math.floor(i / cols) * bh, bw, bh, c); }); }
    return s;
  }
  if (p.type === "huis") {
    const bw = 40, bh = 34, cols = 4;
    p.cols.forEach((c, i) => { s += bblock(-80 + (i % cols) * bw, -bh - Math.floor(i / cols) * bh, bw, bh, c); });
    const top = -Math.ceil(p.cols.length / cols) * bh;
    s += bwindow(-72, top + 8, 24, 20, p.night) + bwindow(48, top + 8, 24, 20, p.night);
    s += `<rect x="-14" y="-40" width="28" height="40" rx="3" fill="url(#bz-wood)" ${BE}/><circle cx="8" cy="-20" r="2.5" fill="#F2C230"/>`;
    if (p.roof) s += bp(`M-94 ${top} L0 ${top - 60} L94 ${top} Z`, "red", `style="fill:${BCOL[p.roof]}"`) + `<path d="M-94 ${top} L0 ${top - 60} L94 ${top} Z" fill="url(#bz-shade)"/>` + bp(`M40 ${top - 30} V${top - 52} H56 V${top - 18} Z`, "dark");
    if (p.res) s += `<g transform="translate(-60 ${top + 36}) scale(.28)"><g class="animal fine">${RESIDENT(p.res)}</g></g>`;
  } else if (p.type === "toren") {
    const fh = 16, w = 110;
    p.cols.forEach((c, i) => { s += bblock(-w / 2, -(i + 1) * fh, w, fh, c) + [0, 1, 2, 3].map(k => `<rect x="${-w / 2 + 10 + k * 25}" y="${-(i + 1) * fh + 4}" width="14" height="8" rx="1.5" fill="url(#bz-glass)" stroke="#2B2118" stroke-width="1.2"/>`).join(""); });
    const top = -p.cols.length * fh;
    s += bp(`M${-w / 2 - 6} ${top} H${w / 2 + 6} V${top - 8} H${-w / 2 - 6} Z`, "concrete") + `<path d="M20 ${top - 8} V${top - 34}" stroke="#2B2118" stroke-width="3"/><circle cx="20" cy="${top - 36}" r="4" fill="#E04A3A"/>`;
    s += `<rect x="-12" y="-16" width="24" height="16" fill="url(#bz-glass)" ${BE}/>`;
  } else if (p.type === "winkel") {
    const bw = 44, bh = 64;
    p.cols.forEach((c, i) => { s += bblock(-88 + i * bw, -bh, bw, bh, c); });
    s += `<rect x="-74" y="-46" width="92" height="36" rx="3" fill="url(#bz-glass)" ${BE}/><rect x="34" y="-46" width="30" height="46" rx="3" fill="url(#bz-wood)" ${BE}/>`;
    if (p.shop) {
      s += Array.from({ length: 8 }, (_, i) => `<path d="M${-92 + i * 23} -64 h23 l-3 16 q-8.5 6 -17 0 z" fill="${i % 2 ? "#fff" : BCOL[p.cols[0]]}" ${BE}/>`).join("");
      s += `<rect x="-40" y="-100" width="80" height="30" rx="8" fill="url(#bz-white)" ${BE}/><g transform="translate(0 -86)">${SHOP_SIGN[p.shop]}</g>`;
    }
  }
  return s;
}

/* ---------- toestand (per toestel bewaard) ---------- */
let BS = null, BV = null;
function bLoad() {
  try { BS = JSON.parse(localStorage.getItem(BKEY)); } catch (e) { BS = null; }
  if (!BS || BS.v !== 1) BS = { v: 1, plots: Array(BPLOTS).fill(null), built: {}, done: 0, pan: 0 };
}
function bSave() { try { localStorage.setItem(BKEY, JSON.stringify(BS)); } catch (e) {} }
function bview(name, html) {
  BV.tok++; BV.view = name;
  clearInterval(BV.int); BV.int = null;
  if (BV.upH) { window.removeEventListener("pointerup", BV.upH); BV.upH = null; }
  const el = $("#bouw");
  el.innerHTML = html;
  return el;
}
function bLater(fn, ms) { const tok = BV && BV.tok; return setTimeout(() => { if (BV && BV.tok === tok) fn(); }, ms); }
function bAnim(dur, fn, done) {
  const tok = BV && BV.tok, t0 = performance.now();
  const step = now => {
    if (!BV || BV.tok !== tok) return;
    const t = Math.min(1, (now - t0) / dur);
    fn(t);
    if (t < 1) requestAnimationFrame(step); else if (done) done();
  };
  requestAnimationFrame(step);
}
const ease = t => t * t * (3 - 2 * t);
// vervolgzin alleen als de vorige niet onderbroken is en we nog op hetzelfde scherm zijn
function bsay(name, cb) { const tok = BV && BV.tok; say(name, cut => { if (cut || !BV || BV.tok !== tok) return; if (cb) cb(); }); }
function bUp(fn) { BV.upH = fn; window.addEventListener("pointerup", fn); }
function bBack(el, fn) {
  const b = document.createElement("button");
  b.className = "btn home-btn"; b.setAttribute("aria-label", "Terug");
  b.innerHTML = `<svg viewBox="0 0 40 40"><path d="M24 8 L12 20 L24 32" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  b.addEventListener("click", () => { sfx.pop(); fn(); });
  el.appendChild(b);
}
function bouwOpen() {
  unlockAudio(); bLoad();
  show("bouw");
  BV = { tok: 0 };
  town();
  bsay("bs_welkom");
}
function bouwStop() { if (!BV) return; clearInterval(BV.int); if (BV.upH) window.removeEventListener("pointerup", BV.upH); BV = null; if (BS) bSave(); }

/* ---------- achtergrond ---------- */
function bSky(w) {
  return `<rect width="${w}" height="${H}" fill="url(#bz-sky)"/><circle cx="90" cy="54" r="24" fill="#FFE08A"/>
    <path d="M0 210 Q${w * .15} 160 ${w * .3} 200 T${w * .6} 195 T${w} 190 V300 H0 Z" fill="#A9CF8E" opacity=".8"/>`;
}

/* ---------- het stadje ---------- */
const plotX = i => 150 + i * BPLOT_W;
function town(focus) {
  const el = bview("town", `
    <svg viewBox="0 0 ${W} ${H}" id="townSvg">${BDEFS}
      <g id="pan">
        ${bSky(BTOWN_W)}
        ${Array.from({ length: 9 }, (_, i) => `<rect x="${40 + i * 150}" y="${150 - (i % 3) * 22}" width="${60 + (i % 2) * 30}" height="${150 + (i % 3) * 22}" fill="url(#bz-far)" opacity=".7"/>`).join("")}
        <rect y="296" width="${BTOWN_W}" height="12" fill="url(#bz-concrete)" ${BE}/>
        <rect y="308" width="${BTOWN_W}" height="67" fill="url(#bz-asphalt)"/>
        ${Array.from({ length: Math.ceil(BTOWN_W / 70) }, (_, i) => `<rect x="${10 + i * 70}" y="338" width="36" height="6" rx="2" fill="#F1EEE6"/>`).join("")}
        ${BS.plots.map((p, i) => `<g class="plot tap" data-i="${i}" transform="translate(${plotX(i)} 296)">
            <rect x="-96" y="-280" width="192" height="284" fill="transparent"/>
            ${p ? `<g class="bld">${buildingSVG(p)}</g>` : `${bp("M-90 0 V-8 H90 V0 Z", "grass")}<g transform="translate(40 0)"><rect x="-3" y="-60" width="6" height="60" fill="url(#bz-wood)" ${BE}/><rect x="-34" y="-92" width="68" height="40" rx="6" fill="url(#bz-white)" ${BE}/>
              <g transform="translate(0 -72) scale(.18)">${machSVG("graaf")}</g></g>
              ${[-70, -40].map(x => `<path d="M${x} 0 l10 -28 l10 28 z" fill="#EE8A2E" ${BE}/><path d="M${x + 5} -12 h10" stroke="#fff" stroke-width="4"/>`).join("")}`}
          </g>`).join("")}
      </g>
    </svg>`);
  homeButton(el);
  const svg = $("#townSvg"), pan = $("#pan");
  const maxPan = BTOWN_W - W;
  if (typeof focus === "number") BS.pan = Math.max(0, Math.min(maxPan, plotX(focus) - W / 2));
  const setPan = () => pan.setAttribute("transform", `translate(${-BS.pan} 0)`);
  setPan();
  let drag = null;
  svg.addEventListener("pointerdown", e => { const p = stagePoint(e); drag = { x: p.x, pan: BS.pan, moved: false }; });
  svg.addEventListener("pointermove", e => {
    if (!drag) return; const p = stagePoint(e), dx = p.x - drag.x;
    if (Math.abs(dx) > 8) drag.moved = true;
    if (drag.moved) { BS.pan = Math.max(0, Math.min(maxPan, drag.pan - dx)); setPan(); }
  });
  bUp(() => { if (drag && drag.moved) bSave(); setTimeout(() => { drag = null; }, 0); });
  el.querySelectorAll(".plot").forEach(g => g.addEventListener("click", () => {
    if (drag && drag.moved) return;
    unlockAudio();
    const i = +g.dataset.i, p = BS.plots[i];
    if (!p) { sfx.pop(); choose(i); return; }
    const b = g.querySelector(".bld"); b.classList.remove("bounce"); void b.getBBox(); b.classList.add("bounce");
    if (p.type === "huis" && p.res) { say("g_" + p.res); heartsAt(pan, plotX(i) - 60, 150); }
    else if (p.type === "winkel" && p.shop) say("ws_" + p.shop);
    else if (p.type === "toren") bsay("n" + Math.min(20, p.cols.length), () => bsay("bs_verd"));
  }));
}

/* ---------- wat gaan we bouwen? ---------- */
function choose(plot) {
  const demo = { huis: { type: "huis", cols: ["rood", "geel", "rood", "geel", "geel", "rood", "geel", "rood"], roof: "blauw", res: "koe" },
    toren: { type: "toren", cols: Array.from({ length: 9 }, (_, i) => i % 2 ? "blauw" : "groen") }, winkel: { type: "winkel", cols: ["oranje", "geel", "oranje", "geel"], shop: "ijs" } };
  const el = bview("choose", `
    <svg viewBox="0 0 ${W} ${H}" class="bfull">${BDEFS}${bSky(W)}<rect y="300" width="${W}" height="75" fill="url(#bz-ground)"/></svg>
    <div class="bchoose">${["huis", "toren", "winkel"].map(t => `<button class="bcard" data-t="${t}" aria-label="${t}"><svg viewBox="-110 -250 220 260">${BDEFS}<g transform="${t === "toren" ? "scale(1.05)" : "scale(1.1)"}">${buildingSVG(demo[t])}</g></svg></button>`).join("")}</div>`);
  bBack(el, () => town());
  el.querySelectorAll(".bcard").forEach(b => b.addEventListener("click", () => {
    unlockAudio(); sfx.pop();
    el.querySelectorAll(".bcard").forEach(x => x.classList.toggle("sel", x === b));
    const t = b.dataset.t;
    bsay("bs_" + t, () => startSite(plot, t));
  }));
  bsay("bs_kies");
}

/* ---------- een machine in elkaar zetten (eerste keer) ---------- */
function assemble(key, done) {
  const M = MACH[key], S = key === "kraan" ? .9 : 1.25, cx = key === "kraan" ? 230 : 250, cy = key === "kraan" ? 330 : 280;
  const el = bview("assemble", `
    <svg viewBox="0 0 ${W} ${H}" id="asmSvg">${BDEFS}${bSky(W)}<rect y="${key === "kraan" ? 330 : 280}" width="${W}" height="100" fill="url(#bz-ground)"/>
      <rect x="470" y="70" width="180" height="290" rx="18" fill="#fff" opacity=".55" ${BE}/>
      <g class="silh" transform="translate(${cx} ${cy}) scale(${S})">${machSVG(key)}</g>
      <g id="asmParts"></g><g id="cfx"></g>
    </svg>`);
  bBack(el, () => town());
  const svg = $("#asmSvg"), layer = $("#asmParts");
  const parts = M.order.map((k, i) => {
    const g = svgEl("apart", `<g class="inner">${M.parts[k]}</g>`);
    layer.appendChild(g);
    const bb = g.querySelector(".inner").getBBox();
    const c = { x: bb.x + bb.width / 2, y: bb.y + bb.height / 2 };
    const ts = Math.min(1.6 * S, 150 / bb.width, 80 / bb.height); // passend in het vakje
    g.querySelector(".inner").insertAdjacentHTML("afterbegin", `<rect x="${bb.x - 14}" y="${bb.y - 14}" width="${bb.width + 28}" height="${bb.height + 28}" fill="transparent" stroke="none"/>`);
    const slot = { x: 560, y: 70 + (i + .5) * (290 / M.order.length) };
    return { k, g, c, ts, slot, placed: false, x: slot.x, y: slot.y, s: ts };
  });
  // onderdelen door elkaar in de bak
  parts.map(p => p.slot).sort(() => Math.random() - .5).forEach((sl, i) => { parts[i].slot = sl; parts[i].x = sl.x; parts[i].y = sl.y; });
  const place = p => p.g.setAttribute("transform", `translate(${(p.x - p.c.x * p.s).toFixed(1)} ${(p.y - p.c.y * p.s).toFixed(1)}) scale(${p.s.toFixed(3)})`);
  parts.forEach(place);
  let drag = null;
  parts.forEach(p => p.g.addEventListener("pointerdown", e => {
    if (p.placed) return; e.stopPropagation(); unlockAudio();
    const q = stagePoint(e); drag = { p, dx: p.x - q.x, dy: p.y - q.y }; p.s = S * .9; place(p); layer.appendChild(p.g); sfx.pop();
  }));
  svg.addEventListener("pointermove", e => { if (!drag) return; const q = stagePoint(e); drag.p.x = q.x + drag.dx; drag.p.y = q.y + drag.dy; place(drag.p); });
  bUp(() => {
    if (!drag) return; const p = drag.p; drag = null;
    const tx = cx + p.c.x * S, ty = cy + p.c.y * S;
    if (Math.hypot(p.x - tx, p.y - ty) < 70) {
      p.placed = true; p.x = tx; p.y = ty; p.s = S; place(p); sfx.click(); sparkleAt($("#cfx"), tx, ty, false, ["#FFD600", "#fff"]);
      if (parts.every(x => x.placed)) { confetti(40); sfx.fanfare(); bsay("bs_machine_klaar"); bLater(done, 1800); }
    } else { p.x = p.slot.x; p.y = p.slot.y; p.s = p.ts; place(p); sfx.whoosh(); }
  });
  bsay("bs_bouwen");
}
function machine(key, next) {
  bsay("bs_m_" + key);
  if (BS.built[key]) { bLater(next, 1100); return; }
  bLater(() => assemble(key, () => { BS.built[key] = 1; bSave(); next(); }), 900);
}

/* ---------- de bouwplaats ---------- */
function siteBG(extra = "") {
  return `${BDEFS}${bSky(W)}
    ${[60, 190, 470, 590].map((x, i) => `<rect x="${x}" y="${170 - i * 12}" width="${50 + i * 8}" height="${130 + i * 12}" fill="url(#bz-far)" opacity=".6"/>`).join("")}
    <rect y="300" width="${W}" height="75" fill="url(#bz-ground)"/>
    ${Array.from({ length: 30 }, (_, i) => `<circle cx="${(i * 67) % W}" cy="${312 + (i * 29) % 56}" r="${1.5 + (i % 3)}" fill="#A8844E" opacity=".8"/>`).join("")}${extra}`;
}
function startSite(plot, type) {
  const lvl = BS.done < 2 ? 0 : BS.done < 5 ? 1 : 2;
  BV.site = { plot, type, lvl, shape: pick(BSHAPES) };
  machine("bulldozer", dozerStep);
}
const next = step => bLater(step, 2400);

/* 1. bulldozer: stenen in de container duwen */
const rockPath = (r, seed) => { let d = ""; for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, rr = r * (.82 + ((seed * 7 + i * 13) % 10) / 45); d += `${i ? "L" : "M"}${(Math.cos(a) * rr * 1.25).toFixed(1)} ${(Math.sin(a) * rr).toFixed(1)} `; } return d + "Z"; };
function dozerStep() {
  const site = BV.site, n = 4 + Math.min(4, BS.done), SC = .85;
  const rocks = Array.from({ length: n }, (_, i) => ({ x: 190 + i * (330 / n) + rnd(-10, 10), r: pick([11, 14, 18, 22]), seed: i + 1, in: false })).sort((a, b) => a.x - b.x);
  const el = bview("dozer", `
    <svg viewBox="0 0 ${W} ${H}" id="siteSvg">${siteBG()}
      <g transform="translate(610 300)">${bp("M-52 -58 H58 L48 0 H-42 Z", "skip")}<path d="M-46 -40 H52" stroke="#fff" stroke-width="3" opacity=".5"/></g>
      <g id="rocks">${rocks.map((r, i) => `<g class="brock" data-i="${i}">${bp(rockPath(r.r, r.seed), "concrete")}<path d="${rockPath(r.r * .45, r.seed + 3)}" fill="#fff" opacity=".25" transform="translate(${-r.r * .3} ${-r.r * .35})"/></g>`).join("")}</g>
      <g id="dz"><g transform="scale(${SC})">${bshadow(10, 95)}${machSVG("bulldozer")}</g></g>
      <g transform="translate(610 300)"><path d="M-52 -58 H58" stroke="#2A6440" stroke-width="6"/></g>
      <g id="hint"><path d="M0 0 h40 m-12 -12 l12 12 l-12 12" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><path d="M0 0 h40 m-12 -12 l12 12 l-12 12" fill="none" stroke="#2B2118" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></g>
      <g id="cfx"></g>
    </svg>`);
  bBack(el, () => town());
  const dz = { x: 80, tx: 80 }, svg = $("#siteSvg");
  let got = 0, down = false, done = false, rum = 0;
  const drawRocks = () => rocks.forEach((r, i) => { const g = el.querySelector(`.brock[data-i="${i}"]`); if (g) g.setAttribute("transform", `translate(${r.x.toFixed(1)} ${(r.y || 300 - r.r * .95).toFixed(1)}) rotate(${(r.x * 1.3 % 360).toFixed(0)})`); });
  const drawDz = () => { $("#dz").setAttribute("transform", `translate(${dz.x.toFixed(1)} 300)`); const h = $("#hint"); if (h) h.setAttribute("transform", `translate(${dz.x + 40} 160)`); };
  drawRocks(); drawDz();
  svg.addEventListener("pointerdown", e => { unlockAudio(); down = true; dz.tx = stagePoint(e).x; });
  svg.addEventListener("pointermove", e => { if (down) dz.tx = stagePoint(e).x; });
  bUp(() => { down = false; });
  BV.int = setInterval(() => {
    const maxX = 560 - 110 * SC;
    const t = Math.max(40, Math.min(maxX, dz.tx)), dx = t - dz.x;
    if (Math.abs(dx) < 1) return;
    const h = $("#hint"); if (h) h.remove();
    dz.x += Math.sign(dx) * Math.min(Math.abs(dx), 6);
    if (++rum % 4 === 0) tone(65 + Math.random() * 15, .08, "sawtooth", .05);
    if (dx > 0) {
      let front = dz.x + 110 * SC;
      rocks.forEach(r => {
        if (r.in) return;
        if (r.x - r.r * 1.2 < front) { r.x = front + r.r * 1.2; if (Math.random() < .3) sparkleAt($("#cfx"), r.x - r.r, 296, false, ["#C9A46A", "#A8844E"]); }
        front = Math.max(front, r.x + r.r * 1.2);
        if (r.x > 566 && !r.in) {
          r.in = true; got++;
          const g = el.querySelector(`.brock[data-i="${rocks.indexOf(r)}"]`);
          bAnim(400, k => { r.x += 1.5; r.y = 300 - r.r + k * 30; drawRocks(); }, () => { if (g) g.style.opacity = 0; sfx.pop(); });
          say("n" + got);
          if (got >= rocks.length && !done) { done = true; bLater(() => { confetti(40); sfx.fanfare(); bsay("bs_doz_klaar"); }, 900); next(() => machine("graaf", () => machine("kiep", digStep))); }
        }
      });
    }
    drawRocks(); drawDz();
  }, 33);
  bsay("bs_doz");
}

/* 2. graafmachine schept zand in de kiepwagen (tellen) */
function digStep() {
  const site = BV.site;
  const N = site.lvl === 0 ? 3 + Math.floor(Math.random() * 3) : site.lvl === 1 ? 5 + Math.floor(Math.random() * 6) : 8 + Math.floor(Math.random() * 13);
  const G = MACH.graaf.parts, EX = 330, SC = .85;
  const el = bview("dig", `
    <svg viewBox="0 0 ${W} ${H}" id="siteSvg">${siteBG()}
      <ellipse id="hole" cx="${EX + 190 * SC}" cy="303" rx="54" ry="4" fill="url(#bz-dirt)" ${BE}/>
      <g transform="translate(${EX + 250 * SC} 300)">${bp("M-30 0 Q0 -40 34 0 Z", "dirt")}</g>
      <g id="truck" transform="translate(133 300) scale(${-SC} ${SC})">${bshadow(0, 110)}${machSVG("kiep")}</g>
      <g transform="translate(${EX} 300) scale(${SC})">${bshadow(0, 100)}${G.rups}<g id="exU"><g>${G.huis}</g><g id="exB">${G.arm}</g></g></g>
      <g id="board" transform="translate(${W / 2 - Math.min(N, 10) * 13} 14)">${Array.from({ length: N }, (_, i) => `<circle class="dot" cx="${(i % 10) * 26 + 13}" cy="${Math.floor(i / 10) * 26 + 13}" r="10" fill="#fff" ${BE}/>`).join("")}</g>
      <g id="cfx"></g>
    </svg>`);
  bBack(el, () => town());
  const upper = $("#exU"), boom = $("#exB"), load = $("#bload"), piv = MACH.graaf.pivot;
  let a = 0, sx = 1, count = 0, busy = false, full = false, holeR = 4;
  const pose = () => { upper.setAttribute("transform", `scale(${sx.toFixed(3)} 1)`); boom.setAttribute("transform", `rotate(${a.toFixed(1)} ${piv[0]} ${piv[1]})`); };
  pose();
  const fillTruck = () => { const lg = el.querySelector("#truck .loadg"); if (lg) lg.setAttribute("transform", `translate(0 -90) scale(1 ${(count / N).toFixed(3)})`); };
  const scoop = () => {
    if (busy || full) return; busy = true;
    bAnim(450, t => { a = 45 * ease(t); pose(); }, () => {
      load.setAttribute("opacity", 1); holeR = Math.min(22, holeR + 18 / N); $("#hole").setAttribute("ry", holeR.toFixed(1)); tone(140, .15, "sawtooth", .06, 0, 90);
      sparkleAt($("#cfx"), EX + 190 * SC, 296, false, ["#8E6A40", "#5F452A"]);
      bAnim(450, t => { a = 45 - 53 * ease(t); pose(); }, () =>
        bAnim(520, t => { sx = Math.cos(Math.PI * t); pose(); }, () =>
          bAnim(300, t => { a = -8 + 20 * ease(t); pose(); }, () => {
            load.setAttribute("opacity", 0); count++; fillTruck(); sfx.pop();
            sparkleAt($("#cfx"), 164, 215, false, ["#E3C27D", "#B8924E"]);
            const d = el.querySelectorAll(".dot")[count - 1]; if (d) d.setAttribute("fill", "#E3A93C");
            say("n" + Math.min(20, count));
            if (count >= N) { full = true; bLater(() => { bsay("bs_vol"); $("#truck").classList.add("bpulse"); }, 900); }
            bAnim(520, t => { sx = -Math.cos(Math.PI * t); a = 12 * (1 - t); pose(); }, () => { busy = false; });
          })));
    });
  };
  const svg = $("#siteSvg");
  svg.addEventListener("pointerdown", e => {
    unlockAudio();
    const p = stagePoint(e);
    if (full && p.x < 300) { driveAway(); return; }
    if (p.y > 60) scoop();
  });
  let gone = false;
  const driveAway = () => {
    if (gone) return; gone = true; sfx.honk();
    const tr = $("#truck"); tr.classList.remove("bpulse");
    bAnim(1500, t => tr.setAttribute("transform", `translate(${133 - 360 * t * t} 300) scale(${-SC} ${SC})`), () => { bsay("bs_weg"); next(() => machine("cement", cementStep)); });
  };
  bsay("bs_graaf", () => bsay("sch_" + N));
}

/* 3. cementwagen: de goede vorm kiezen en de fundering gieten */
const SHAPE_D = {
  vierkant: "M-30 -30 H30 V30 H-30 Z", cirkel: "M-32 0 A32 32 0 1 0 32 0 A32 32 0 1 0 -32 0 Z",
  driehoek: "M0 -34 L36 30 H-36 Z", rechthoek: "M-44 -24 H44 V24 H-44 Z"
};
function cementStep() {
  const site = BV.site, sh = site.shape;
  const opts = [sh, ...BSHAPES.filter(x => x !== sh).sort(() => Math.random() - .5).slice(0, 2)].sort(() => Math.random() - .5);
  const el = bview("cement", `
    <svg viewBox="0 0 ${W} ${H}" id="siteSvg">${siteBG()}
      <defs><clipPath id="bpClip"><path d="${SHAPE_D[sh]}"/></clipPath></defs>
      <g id="bprint" transform="translate(170 150)"><rect x="-80" y="-78" width="160" height="150" rx="10" fill="url(#bz-blueprint)" ${BE}/>
        ${Array.from({ length: 7 }, (_, i) => `<path d="M${-80 + i * 26} -78 V72 M-80 ${-78 + i * 25} H80" stroke="#fff" stroke-opacity=".15" stroke-width="1.5"/>`).join("")}
        <g clip-path="url(#bpClip)"><rect id="bpFill" x="-50" y="40" width="100" height="0" fill="#D3D3CE"/></g>
        <path d="${SHAPE_D[sh]}" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="8 6"/></g>
      <g id="form" opacity="0"><rect x="250" y="284" width="210" height="16" fill="url(#bz-wood)" ${BE}/><rect id="slab" x="254" y="298" width="202" height="0" fill="url(#bz-concrete)"/></g>
      <path id="stream" d="M0 0" stroke="#A9A9A4" stroke-width="10" stroke-linecap="round" fill="none" opacity="0"/>
      <g id="mixer" transform="translate(760 300) scale(.8)">${bshadow(0, 110)}${machSVG("cement")}</g>
      <g id="cfx"></g>
    </svg>
    <div class="bshapes">${opts.map(o => `<button class="btn bshape" data-s="${o}" aria-label="${o}"><svg viewBox="-45 -45 90 90"><path d="${SHAPE_D[o]}" fill="#fff" stroke="#2B2118" stroke-width="5" stroke-linejoin="round"/></svg></button>`).join("")}</div>
    <button class="btn bpour" id="pour" hidden aria-label="Gieten"><svg viewBox="0 0 40 40"><path d="M20 6 C28 16 31 21 31 26 a11 11 0 0 1 -22 0 C9 21 12 16 20 6Z" fill="#B0B0AA" stroke="#2B2118" stroke-width="3"/></svg></button>`);
  bBack(el, () => town());
  let ok = false;
  el.querySelectorAll(".bshape").forEach(b => b.addEventListener("click", () => {
    unlockAudio(); if (ok) return;
    const s2 = b.dataset.s;
    if (s2 !== sh) { b.classList.remove("wrong"); void b.offsetWidth; b.classList.add("wrong"); bsay("nv_" + s2, () => bsay("bs_cement")); return; }
    ok = true; sfx.sparkle(); b.classList.add("on");
    bsay("ja_" + sh, () => bsay("bs_giet"));
    $("#form").setAttribute("opacity", 1);
    const mx = $("#mixer");
    sfx.honk();
    bAnim(1600, t => mx.setAttribute("transform", `translate(${760 - 180 * ease(t)} 300) scale(.8)`), () => { el.querySelector(".bshapes").hidden = true; $("#pour").hidden = false; });
  }));
  let prog = 0, holding = false, doneC = false, spin = 0;
  const pour = $("#pour");
  pour.addEventListener("pointerdown", e => { e.preventDefault(); unlockAudio(); holding = true; pour.classList.add("on"); });
  bUp(() => { holding = false; pour.classList.remove("on"); });
  BV.int = setInterval(() => {
    const stripes = el.querySelector("#mixer .stripes");
    spin += holding ? 4 : .8;
    if (stripes) stripes.setAttribute("transform", `translate(${(spin % 26).toFixed(1)} 0)`);
    const st = $("#stream");
    if (!holding || doneC || pour.hidden) { st.setAttribute("opacity", 0); return; }
    prog = Math.min(1, prog + .014);
    st.setAttribute("d", `M474 265 Q462 272 ${440 - prog * 120} 294`); st.setAttribute("opacity", 1);
    if (Math.random() < .3) tone(90 + Math.random() * 30, .06, "triangle", .04);
    $("#slab").setAttribute("y", (298 - prog * 12).toFixed(1)); $("#slab").setAttribute("height", (prog * 12).toFixed(1));
    $("#bpFill").setAttribute("y", (40 - prog * 80).toFixed(1)); $("#bpFill").setAttribute("height", (prog * 80).toFixed(1));
    if (prog >= 1) { doneC = true; pour.hidden = true; st.setAttribute("opacity", 0); confetti(40); sfx.fanfare(); bsay("bs_giet_klaar"); next(() => machine("kraan", craneStep)); }
  }, 33);
  bsay("bs_cement");
}

/* 4. hijskraan: stapelen volgens een patroon */
function makePattern(lvl) {
  const cs = Object.keys(BCOL).sort(() => Math.random() - .5);
  const pats = lvl === 0 ? ["AB"] : lvl === 1 ? ["ABC", "AAB", "AB"] : ["ABB", "AABB", "ABC", "AAB"];
  const pat = pick(pats), map = { A: cs[0], B: cs[1], C: cs[2] };
  return { unit: [...pat].map(ch => map[ch]), extra: cs[3] };
}
function craneSVG(h) {
  return `<rect x="-14" y="${-h}" width="28" height="${h}" fill="url(#bz-body)" ${BE}/>` + Array.from({ length: Math.floor(h / 21) }, (_, i) => `<path d="M-14 ${-i * 21} L14 ${-i * 21 - 21} M14 ${-i * 21} L-14 ${-i * 21 - 21}" stroke="#8A6200" stroke-width="2.5"/>`).join("")
    + bp("M-34 0 H34 V10 H-34 Z", "concrete")
    + bp(`M-90 ${-h - 14} H330 V${-h - 2} H-90 Z`, "body") + Array.from({ length: 20 }, (_, i) => `<path d="M${-88 + i * 21} ${-h - 3} l10 -10 l10 10" fill="none" stroke="#8A6200" stroke-width="2"/>`).join("")
    + bp(`M-88 ${-h - 2} H-50 V${-h + 24} H-88 Z`, "concrete") + bp(`M-6 ${-h - 14} L0 ${-h - 44} L6 ${-h - 14} Z`, "body")
    + `<path d="M0 ${-h - 44} L-88 ${-h - 14} M0 ${-h - 44} L320 ${-h - 14}" stroke="#2B2118" stroke-width="1.6"/>`
    + bp(`M14 ${-h - 2} H44 V${-h + 22} H14 Z`, "body") + bp(`M20 ${-h + 2} H40 V${-h + 16} H20 Z`, "glass");
}
function craneStep() {
  const site = BV.site, T = site.type, P = makePattern(site.lvl);
  const total = T === "huis" ? 8 : T === "winkel" ? 4 : 20;
  const seq = Array.from({ length: total }, (_, i) => P.unit[i % P.unit.length]);
  const b = { type: T, cols: seq.slice(0, T === "toren" ? Math.min(2, P.unit.length) : P.unit.length), raw: true };
  const CX = 110, BX = 330;
  const el = bview("crane", `
    <svg viewBox="0 0 ${W} ${H}" id="siteSvg">${siteBG()}
      <g id="cz"><rect x="${BX - 105}" y="296" width="210" height="8" fill="url(#bz-concrete)" ${BE}/>
        <g id="bld" transform="translate(${BX} 296)"></g>
        <g id="crane" transform="translate(${CX} 300)"></g>
        <g id="trolley"></g></g>
      <g id="cfx"></g>
    </svg>
    <div class="bcolors" id="bcolors"></div>
    <button class="btn okbtn bdone" id="bdone" hidden aria-label="Klaar">${`<svg viewBox="0 0 40 40"><path d="M8 21 L17 30 L33 11" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`}</button>`);
  bBack(el, () => town());
  let busy = false, finished = false, trol = { x: CX + 120, hy: 110, block: null };
  const craneH = () => T === "toren" ? Math.max(244, b.cols.length * 16 + 110) : 244;
  const zoom = () => { const z = Math.min(1, 285 / (craneH() + 50)); $("#cz").setAttribute("transform", `translate(0 ${300 * (1 - z)}) scale(${z.toFixed(3)})`); };
  const draw = () => {
    $("#bld").innerHTML = buildingSVG(b);
    $("#crane").innerHTML = craneSVG(craneH());
    const top = 300 - craneH() - 2;
    $("#trolley").innerHTML = `<rect x="${trol.x - 12}" y="${top}" width="24" height="10" fill="url(#bz-dark)" ${BE}/><path d="M${trol.x} ${top + 10} V${trol.hy}" stroke="#2B2118" stroke-width="2"/>`
      + `<path d="M${trol.x - 8} ${trol.hy} h16 M${trol.x} ${trol.hy} v8" stroke="#2B2118" stroke-width="3"/>` + (trol.block ? trol.block : "");
    zoom();
  };
  draw();
  const slotOf = i => {
    if (T === "toren") return { x: BX, top: 296 - (i + 1) * 16, w: 110, h: 16 };
    const bw = T === "winkel" ? 44 : 40, bh = T === "winkel" ? 64 : 34, x0 = T === "winkel" ? -88 : -80;
    return { x: BX + x0 + (i % 4) * bw + bw / 2, top: 296 - bh - Math.floor(i / 4) * bh, w: bw, h: bh };
  };
  const colorBtns = () => {
    const opts = [...new Set([...P.unit, P.extra])].sort(() => Math.random() - .5);
    $("#bcolors").innerHTML = opts.map(c => `<button class="btn bcol" data-c="${c}" aria-label="${c}" style="background:${BCOL[c]}"></button>`).join("");
    $("#bcolors").querySelectorAll(".bcol").forEach(btn => btn.addEventListener("click", () => tapColor(btn)));
  };
  // blok (of dak) aan de haak naar zijn plek laten zakken
  const lower = (x, top, blockSvg, done) => {
    busy = true; const top0 = 300 - craneH() + 40;
    trol.hy = top0; trol.block = `<g transform="translate(${trol.x} ${top0 + 8})">${blockSvg}</g>`;
    const x0 = trol.x;
    bAnim(550, t => { trol.x = x0 + (x - x0) * ease(t); trol.block = `<g transform="translate(${trol.x} ${top0 + 8})">${blockSvg}</g>`; draw(); }, () =>
      bAnim(600, t => { trol.hy = top0 + (top - 8 - top0) * ease(t); trol.block = `<g transform="translate(${trol.x} ${trol.hy + 8})">${blockSvg}</g>`; draw(); }, () => {
        trol.block = null; done(); sfx.click();
        bAnim(350, t => { trol.hy = top - 8 + (top0 - top + 8) * t; draw(); }, () => { busy = false; });
      }));
  };
  const tapColor = btn => {
    unlockAudio();
    if (busy || finished) return;
    const c = btn.dataset.c, want = seq[b.cols.length];
    if (c !== want) { btn.classList.remove("wrong"); void btn.offsetWidth; btn.classList.add("wrong"); bsay("nk_" + c, () => bsay("bs_fout")); return; }
    const s = slotOf(b.cols.length);
    lower(s.x, s.top, `<g transform="translate(${-s.w / 2} 0)">${bblock(0, 0, s.w, s.h, c)}</g>`, () => {
      b.cols.push(c);
      sparkleAt($("#cfx"), s.x, s.top + s.h / 2, false, ["#fff", "#FFD600"]);
      if (T === "toren") { say("n" + b.cols.length); if (b.cols.length >= 3) $("#bdone").hidden = false; if (b.cols.length >= total) towerDone(); }
      else { say("bs_goed" + (1 + Math.floor(Math.random() * 3))); if (b.cols.length >= total) wallsDone(); }
    });
  };
  const towerDone = () => { if (finished) return; finished = true; $("#bdone").hidden = true; $("#bcolors").innerHTML = ""; bsay("bs_toren_klaar", () => bsay("n" + Math.min(20, b.cols.length), () => bsay("bs_verd"))); bLater(() => finish(b), 3800); };
  $("#bdone").addEventListener("click", () => { unlockAudio(); if (!busy) towerDone(); });
  const wallsDone = () => {
    finished = true; $("#bcolors").innerHTML = "";
    if (T === "huis") bLater(() => pickRoof(), 900);
    else bLater(() => pickShop(), 900);
  };
  const choice = (items, render, cb) => {
    $("#bcolors").innerHTML = items.map(k => `<button class="btn bcol big" data-k="${k}" aria-label="${k}">${render(k)}</button>`).join("");
    $("#bcolors").querySelectorAll(".bcol").forEach(btn => btn.addEventListener("click", () => { unlockAudio(); if (!busy) cb(btn.dataset.k); }));
  };
  const pickRoof = () => {
    bsay("bs_dak");
    choice(["rood", "blauw", "groen"], k => `<svg viewBox="-50 -40 100 50"><path d="M-44 6 L0 -34 L44 6 Z" fill="${BCOL[k]}" stroke="#2B2118" stroke-width="4" stroke-linejoin="round"/></svg>`, k => {
      $("#bcolors").innerHTML = "";
      const top = 296 - 68;
      lower(BX, top - 60, `<g transform="translate(0 60)"><path d="M-94 0 L0 -60 L94 0 Z" fill="${BCOL[k]}" ${BE}/></g>`, () => {
        b.raw = false; b.roof = k; draw(); sfx.sparkle(); bLater(pickRes, 700);
      });
    });
  };
  const pickRes = () => {
    bsay("bs_bewoner");
    choice(BRES, k => `<svg viewBox="-55 -100 115 105"><g class="animal fine">${RESIDENT(k)}</g></svg>`, k => {
      $("#bcolors").innerHTML = ""; say("g_" + k);
      const w = svgEl("", `<g class="animal fine">${RESIDENT(k)}</g>`);
      $("#cz").appendChild(w);
      bAnim(1600, t => w.setAttribute("transform", `translate(${700 - (700 - BX) * t} 300) scale(-.45 .45)`), () => { w.remove(); b.res = k; draw(); heartsAt($("#cfx"), BX, 200); bLater(() => finish(b), 1400); });
    });
  };
  const pickShop = () => {
    bsay("bs_winkel_kies");
    choice(BSHOP, k => `<svg viewBox="-22 -18 44 36">${SHOP_SIGN[k]}</svg>`, k => {
      $("#bcolors").innerHTML = ""; b.raw = false; b.shop = k; draw(); sfx.sparkle(); sparkleAt($("#cfx"), BX, 210, true, ["#FFD600", "#fff", "#FF4081"]);
      bsay("ws_" + k); bLater(() => finish(b), 2200);
    });
  };
  colorBtns();
  bsay(T === "toren" ? "bs_toren_hoe" : "bs_kraan");
}

/* ---------- klaar! ---------- */
function finish(b) {
  const site = BV.site;
  const p = { type: b.type, cols: b.cols.slice(), roof: b.roof || null, res: b.res || null, shop: b.shop || null, shape: site.shape };
  BS.plots[site.plot] = p; BS.done++; bSave();
  confetti(90); sfx.fanfare(); bsay("bs_af");
  bLater(() => town(site.plot), 2600);
}

// het startscherm is al getekend voordat dit bestand laadde: nu opnieuw, met de bouwstad-knop compleet
if (typeof renderHome === "function" && typeof current !== "undefined" && current === "home") renderHome();
