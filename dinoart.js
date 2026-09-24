"use strict";
/* Tekeningen voor het dinospel: botten, schedels en de levende dino's.
   Alles in hetzelfde assenstelsel: heup op (0,0), kop naar links, voeten rond y = +84. */

const BF = "#F3ECDC";
/* een bot als dikke streep met donkere rand */
const stok = (d, w) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w + 6}" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="${d}" fill="none" stroke="${BF}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const knoop = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${BF}" stroke="${INK}" stroke-width="3.5"/>`;
const wervel = (x, y, r) => `<rect x="${x - r}" y="${y - r}" width="${r * 2}" height="${r * 2}" rx="${r * .45}" fill="${BF}" stroke="${INK}" stroke-width="3.2"/>`;
const rij = (punten) => punten.map((p, i) => wervel(p[0], p[1], p[2])).join("");
const lijn = (punten, w) => stok("M" + punten.map(p => `${p[0]} ${p[1]}`).join(" L"), w);

const BOT = {
  /* ruggengraat met doornuitsteeksels */
  rug: `${[-62, -40, -18, 6, 28, 50].map(x => `<path d="M${x - 6} 0 l3 -26 q3 -7 6 0 l3 26z" fill="${BF}" stroke="${INK}" stroke-width="3.2" stroke-linejoin="round"/>`).join("")}
    <path d="M-74 -6 h148 q8 0 8 8 v4 q0 8 -8 8 h-148 q-8 0 -8 -8 v-4 q0 -8 8 -8z" fill="${BF}" stroke="${INK}" stroke-width="3.5"/>`,
  /* ribbenkast */
  ribben: `${[-46, -22, 2, 26, 48].map((x, i) => stok(`M${x} -26 q${20 + i * 2} 36 ${6} 74`, 8)).join("")}
    <path d="M-58 -34 h116 q8 0 8 8 q0 8 -8 8 h-116 q-8 0 -8 -8 q0 -8 8 -8z" fill="${BF}" stroke="${INK}" stroke-width="3.5"/>`,
  /* nek: gebogen ketting van wervels */
  nek: `${lijn([[-54, 24], [-26, 10], [2, -2], [30, -12], [56, -20]], 9)}${rij([[-54, 24, 13.5], [-27, 11, 12], [0, -1, 10.5], [27, -11, 9], [54, -19, 7.5]])}`,
  /* achterpoot: dijbeen, scheenbeen en voet met tenen */
  poota: `${lijn([[6, -54], [-12, 2], [18, 44]], 18)}${lijn([[18, 44], [-22, 62]], 13)}
    ${knoop(6, -54, 14)}${knoop(-12, 2, 13)}${knoop(18, 44, 10)}
    ${[0, 1, 2].map(i => stok(`M-22 62 l-${18 + i * 5} ${i * 6 - 3}`, 7)).join("")}`,
  /* voorpoot: kleiner, met kleine klauwen */
  pootv: `${lijn([[0, -32], [-8, 2], [10, 26]], 12)}${knoop(0, -32, 10)}${knoop(-8, 2, 9)}
    ${[0, 1].map(i => stok(`M10 26 l-${12 + i * 6} ${8 + i * 5}`, 5)).join("")}`,
  /* rugplaten (stegosaurus) */
  platen: `${[-58, -28, 2, 32, 60].map((x, i) => {
    const h = [30, 44, 50, 42, 28][i];
    return `<path d="M${x} 16 q-${14 + i} -${h} 0 -${h + 6} q${16 - i} ${6} ${2} ${h + 6}z" fill="${BF}" stroke="${INK}" stroke-width="3.2" stroke-linejoin="round"/>`;
  }).join("")}`,
  /* rugzeil (spinosaurus) */
  zeil: `<path d="M-64 18 q10 -54 20 -58 q12 -4 16 30 q4 -40 16 -42 q12 -2 14 36 q2 -30 12 -30 q10 0 12 26 l2 38z" fill="${BF}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>`,
  /* vleugelvinger (pteranodon) */
  vleugel: `${lijn([[-44, 10], [-4, -14], [54, -18], [96, 4]], 10)}${knoop(-44, 10, 10)}${knoop(-4, -14, 9)}
    <path d="M-44 10 q40 40 140 -6 q-40 -8 -96 -22z" fill="${BF}" opacity=".55" stroke="${INK}" stroke-width="3"/>`
};
const oog = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}"/>`;
const tand = (x, y, h) => `<path d="M${x} ${y} l${h * .5} ${h} l${h * .55} -${h}z" fill="#fff" stroke="${INK}" stroke-width="2"/>`;
/* schedels kijken naar rechts (+x); in het spel worden ze gespiegeld */
const KOP = {
  trex: `<path d="M-52 -18 q-6 -26 18 -30 l30 -4 q22 -4 34 10 l28 30 q10 10 -2 18 l-24 14 q-14 8 -30 6 l-38 -6 q-20 -4 -18 -24z" fill="${BF}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M-30 -30 q18 -8 30 4 q-14 10 -30 6z" fill="#D9CDB4"/>${oog(16, -20, 7)}
    <path d="M40 6 q22 4 30 16 q-16 8 -34 2z" fill="${BF}" stroke="${INK}" stroke-width="3"/>
    ${[6, 22, 38, 52].map((x, i) => tand(x, 18, 11 - i)).join("")}
    <path d="M-44 -6 q26 10 60 8" fill="none" stroke="${INK}" stroke-width="2.5" opacity=".5"/>`,
  raptor: `<path d="M-44 -12 q-4 -22 16 -24 l24 -4 q18 -2 28 10 l26 26 q8 8 -2 14 l-20 10 q-12 6 -24 4 l-30 -6 q-18 -4 -18 -20z" fill="${BF}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
    ${oog(10, -16, 6)}<path d="M-26 -24 q16 -6 24 4 q-12 8 -24 4z" fill="#D9CDB4"/>
    ${[12, 26, 40].map((x, i) => tand(x, 14, 9 - i)).join("")}`,
  spino: `<path d="M-40 -10 q-4 -20 14 -22 l20 -2 q16 0 22 10 l50 22 q10 4 10 12 q0 8 -12 10 l-52 6 q-16 2 -32 -2 q-20 -6 -20 -22z" fill="${BF}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
    ${oog(4, -14, 6)}<path d="M-22 -22 l4 -16 q2 -8 8 -6 q5 2 3 10z" fill="${BF}" stroke="${INK}" stroke-width="3"/>
    ${[18, 34, 50, 64].map((x, i) => tand(x, 14, 8)).join("")}`,
  trice: `<path d="M-30 -52 q-46 10 -46 52 q0 42 46 52 q8 -34 8 -52 q0 -18 -8 -52z" fill="${BF}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
    ${[-40, -14, 14, 40].map(y => `<circle cx="-70" cy="${y}" r="7" fill="${BF}" stroke="${INK}" stroke-width="3"/>`).join("")}
    <path d="M-30 -36 q48 -8 68 16 l24 28 q8 10 -4 16 l-26 14 q-16 8 -32 -2 q-30 -16 -30 -38z" fill="${BF}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M-2 -38 l8 -40 q2 -9 9 -7 q7 2 5 11z" fill="#fff" stroke="${INK}" stroke-width="3"/>
    <path d="M28 -26 l14 -34 q4 -9 10 -6 q7 3 3 11z" fill="#fff" stroke="${INK}" stroke-width="3"/>
    ${oog(6, -4, 6)}<path d="M56 24 q20 6 22 18 q-16 8 -30 0z" fill="${BF}" stroke="${INK}" stroke-width="3"/>`,
  stego: `<path d="M-36 -8 q-2 -16 12 -18 l16 -2 q14 0 18 8 l34 16 q8 4 8 10 q0 7 -10 8 l-36 4 q-14 2 -26 -2 q-16 -6 -16 -18z" fill="${BF}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
    ${oog(0, -10, 5.5)}<path d="M40 6 q14 2 16 8 q-10 5 -20 1z" fill="${BF}" stroke="${INK}" stroke-width="3"/>`,
  brachio: `<path d="M-34 -6 q-2 -18 14 -20 l14 -2 q14 0 18 10 l26 12 q10 4 10 11 q0 7 -10 9 l-30 4 q-14 2 -26 -3 q-16 -6 -16 -21z" fill="${BF}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M-14 -24 q14 -14 28 -2 q-10 8 -28 2z" fill="${BF}" stroke="${INK}" stroke-width="3"/>${oog(-2, -8, 5.5)}`,
  anky: `<path d="M-34 -16 q0 -20 20 -22 l30 -2 q24 0 30 14 l10 22 q4 12 -10 16 l-38 8 q-22 4 -34 -6 q-10 -10 -8 -30z" fill="${BF}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
    ${oog(14, -10, 6)}
    <path d="M-34 -18 l-16 -10 q-8 -4 -4 -10 q4 -6 12 -2 l14 10z" fill="${BF}" stroke="${INK}" stroke-width="3"/>
    <path d="M-30 12 l-18 10 q-8 4 -12 -2 q-4 -6 4 -10 l18 -8z" fill="${BF}" stroke="${INK}" stroke-width="3"/>`,
  para: `<path d="M-30 -8 q-4 -18 12 -20 l18 -2 q16 0 20 10 l30 16 q10 5 10 12 q0 7 -10 9 l-34 4 q-16 2 -28 -4 q-18 -8 -18 -25z" fill="${BF}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M-24 -20 q-30 -30 -54 -34 q-10 -2 -10 6 q0 8 10 12 q26 10 44 30z" fill="${BF}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
    ${oog(2, -12, 6)}<path d="M40 8 q16 2 18 10 q-12 6 -24 2z" fill="${BF}" stroke="${INK}" stroke-width="3"/>`,
  ptero: `<path d="M-26 -6 q-4 -16 10 -18 l14 -2 q14 0 18 8 l56 20 q12 4 12 11 q0 8 -12 9 l-56 4 q-14 2 -24 -4 q-16 -8 -18 -28z" fill="${BF}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M-16 -18 q-34 -18 -52 -12 q-8 4 -2 10 q8 8 32 10 l20 4z" fill="${BF}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
    ${oog(4, -8, 6)}`
};
const STAART = {
  gewoon: `${lijn([[-58, 6], [-10, 0], [34, -4], [66, -8]], 9)}${rij([[-58, 6, 13], [-34, 3, 11], [-10, 0, 9.5], [12, -2, 8], [34, -4, 6.5], [52, -6, 5], [66, -8, 4]])}`,
  lang: `${lijn([[-64, 8], [-10, 0], [42, -6], [92, -12]], 9)}${rij([[-64, 8, 13], [-38, 4, 11.5], [-12, 0, 10], [14, -2, 8.5], [40, -6, 7], [62, -8, 5.5], [78, -10, 4.5], [92, -12, 3.5]])}`,
  stekels: `${lijn([[-54, 8], [-10, 0], [34, -8], [62, -16]], 9)}${rij([[-54, 8, 13], [-32, 4, 11], [-10, 0, 9.5], [12, -4, 8], [34, -8, 6.5], [50, -12, 5]])}
    ${[[44, -26, -30], [60, -22, -8], [40, 4, 40], [58, 2, 60]].map(([x, y, a]) => `<path d="M${x} ${y} l26 ${a * .5} l-20 ${18 - a * .2}z" fill="${BF}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`).join("")}`,
  knots: `${lijn([[-54, 6], [-12, 0], [28, -4], [52, -6]], 9)}${rij([[-54, 6, 13], [-32, 3, 11], [-12, 0, 9.5], [8, -2, 8], [28, -4, 7]])}
    <ellipse cx="66" cy="-6" rx="22" ry="18" fill="${BF}" stroke="${INK}" stroke-width="3.5"/>
    <ellipse cx="54" cy="-6" rx="10" ry="13" fill="${BF}" stroke="${INK}" stroke-width="3"/>`
};

/* ---------- de levende dino's (heup op 0,0, kop naar links) ---------- */
function been(x, c, h, br) {
  const w = br || 26;
  return `<path d="M${x - w / 2} 0 q${w / 2} -14 ${w} 0 l${w * .22} ${h * .55} q2 10 -6 12 l4 ${h * .4} q2 10 -8 11 h-${w * .55} q-9 -1 -8 -11 l4 -${h * .4} q-8 -2 -6 -12z" fill="${c}" ${ST}/>
    <path d="M${x - w * .62} ${h} h${w * .9} q9 0 9 7 q0 7 -9 7 h-${w * 1.25} q-9 0 -9 -7 q0 -7 9 -7z" fill="${c}" ${ST}/>`;
}
const vlek = (x, y, rx, ry, c) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}" opacity=".55"/>`;
function dinoLevend(k) {
  const d = DINO[k], c = d.kleur, b = d.buik, don = d.donker || "#00000022";
  if (k === "trex" || k === "raptor" || k === "spino") {
    const groot = k === "raptor" ? .82 : 1;
    const kopY = k === "spino" ? -96 : -104, kopX = k === "spino" ? -196 : -176;
    return `<g transform="scale(${groot})">
      <path d="M40 -26 q70 -2 132 34 q28 16 44 40 q-8 10 -30 -2 q-40 -22 -84 -30 q-40 -8 -62 -14z" fill="${c}" ${ST}/>
      ${been(24, don === "#00000022" ? c : don, 84, 30)}
      <path d="M-86 -44 q-6 -60 44 -70 q46 -10 78 24 q26 28 6 62 q-20 32 -66 30 q-52 -2 -62 -46z" fill="${c}" ${ST}/>
      <ellipse cx="-24" cy="-22" rx="52" ry="26" fill="${b}"/>
      ${been(-10, c, 90, 34)}
      <path d="M-84 -60 q-36 -16 -50 -44 q-8 -18 8 -26 q18 -8 28 10 q12 24 34 40z" fill="${c}" ${ST}/>
      <g transform="translate(${kopX} ${kopY}) rotate(8)">
        <path d="M0 -14 q-4 -24 20 -26 l34 -2 q26 0 34 16 l${k === "spino" ? 66 : 40} ${k === "spino" ? 26 : 30} q12 8 0 18 l-24 14 q-16 10 -36 6 l-40 -8 q-22 -6 -22 -26z" fill="${c}" ${ST}/>
        <path d="M-16 -26 q22 -10 38 2 q-18 12 -38 6z" fill="${b}"/>
        <circle cx="26" cy="-18" r="7" fill="#fff" ${TH}/><circle cx="28" cy="-18" r="4" fill="${INK}"/>
        ${[16, 32, 48, 62].map((x, i) => tand(x, 20, 10 - i)).join("")}
        <path d="M-14 6 q30 10 62 6" fill="none" stroke="${INK}" stroke-width="3"/>
      </g>
      <path d="M-70 -36 q-24 6 -26 26 q10 10 24 2 l10 -10z" fill="${c}" ${ST}/>
      ${k === "spino" ? `<path d="M-60 -74 q14 -58 36 -62 q22 -4 28 42 q6 -44 26 -44 q22 0 24 52 l4 30 q-56 -26 -118 -18z" fill="${c}" ${ST}/><path d="M-40 -100 q10 -30 18 -32 M4 -104 q8 -26 16 -26" fill="none" stroke="${don}" stroke-width="5"/>` : ""}
      ${[[-40, -40], [4, -50], [40, -34]].map(([x, y]) => vlek(x, y, 16, 9, don)).join("")}</g>`;
  }
  if (k === "brachio") return `<g>
    <path d="M44 -30 q80 6 150 44 q26 16 40 36 q-10 10 -32 -4 q-48 -26 -96 -36 q-42 -8 -62 -16z" fill="${c}" ${ST}/>
    ${been(34, c, 96, 30)}${been(-52, c, 92, 28)}
    <ellipse cx="-6" cy="-52" rx="86" ry="52" fill="${c}" ${ST}/><ellipse cx="0" cy="-36" rx="58" ry="30" fill="${b}"/>
    <path d="M-72 -80 q-40 -80 -22 -140 q10 -32 34 -24 q22 8 10 38 q-20 52 -2 112z" fill="${c}" ${ST}/>
    <g transform="translate(-92 -260) rotate(-14)"><path d="M0 -8 q-2 -16 14 -18 l18 -2 q16 0 20 10 l26 12 q10 5 10 12 q0 7 -10 9 l-30 4 q-16 2 -28 -4 q-18 -8 -20 -23z" fill="${c}" ${ST}/>
      <path d="M-4 -22 q14 -14 30 -2 q-12 8 -30 2z" fill="${b}"/><circle cx="18" cy="-12" r="6" fill="#fff" ${TH}/><circle cx="20" cy="-12" r="3.5" fill="${INK}"/></g>
    ${[[-30, -70], [20, -66], [-60, -50]].map(([x, y]) => vlek(x, y, 18, 10, don)).join("")}</g>`;
  if (k === "trice" || k === "anky" || k === "para" || k === "stego") {
    const kop = { trice: -150, anky: -140, para: -150, stego: -144 }[k];
    const kopy = { trice: -46, anky: -30, para: -76, stego: -44 }[k];
    return `<g>
      ${k === "anky" ? `<path d="M52 -28 q64 0 104 22 q-16 10 -40 12 q26 10 30 26 q-6 14 -26 10 q-22 -4 -34 -22 q-24 -14 -44 -26z" fill="${c}" ${ST}/><ellipse cx="150" cy="-2" rx="30" ry="24" fill="${c}" ${ST}/>${[[128, -22], [168, -22], [150, 22]].map(([x, y]) => `<path d="M${x} ${y} l14 -12 l2 18z" fill="${c}" ${ST}/>`).join("")}`
        : `<path d="M50 -30 q76 4 134 40 q24 16 34 34 q-10 10 -30 -4 q-42 -24 -84 -34 q-36 -8 -54 -14z" fill="${c}" ${ST}/>`}
      ${been(40, c, 84, 28)}${been(-46, c, 80, 26)}
      <ellipse cx="-4" cy="-48" rx="80" ry="46" fill="${c}" ${ST}/><ellipse cx="2" cy="-32" rx="54" ry="27" fill="${b}"/>
      <path d="M-66 -66 q-34 -6 -52 14 q-10 12 2 22 q22 14 52 4z" fill="${c}" ${ST}/>
      <g transform="translate(${kop} ${kopy})">
        ${k === "trice" ? `<path d="M56 -50 q40 12 40 50 q0 38 -40 50 q-10 -34 -10 -50 q0 -16 10 -50z" fill="${b}" ${ST}/>
          ${[[86, -30], [96, 0], [86, 30]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="${b}" ${TH}/>`).join("")}` : ""}
        <path d="M0 -10 q-6 -22 16 -24 l${k === "anky" ? 44 : 28} -2 q20 0 26 12 l${k === "anky" ? 26 : 34} ${k === "anky" ? 22 : 16} q10 6 10 12 q0 8 -12 10 l-${k === "anky" ? 46 : 36} 4 q-18 2 -32 -4 q-20 -8 -20 -28z" fill="${c}" ${ST}/>
        ${k === "trice" ? `<path d="M24 -30 l8 -44 q2 -10 10 -8 q8 2 6 12z" fill="#fff" ${TH}/><path d="M52 -22 l14 -38 q4 -10 11 -6 q7 4 3 12z" fill="#fff" ${TH}/>` : ""}
        ${k === "para" ? `<path d="M6 -22 q-34 -34 -62 -38 q-12 -2 -12 8 q0 10 12 14 q30 10 50 32z" fill="${c}" ${ST}/><path d="M0 -20 q-30 -26 -52 -30" fill="none" stroke="${don}" stroke-width="6"/>` : ""}
        <circle cx="${k === "anky" ? 30 : 20}" cy="-14" r="6.5" fill="#fff" ${TH}/><circle cx="${k === "anky" ? 32 : 22}" cy="-14" r="4" fill="${INK}"/>
        <path d="M${k === "anky" ? 60 : 50} 6 q18 4 20 12 q-14 7 -28 2z" fill="${b}" ${ST}/>
      </g>
      ${k === "stego" ? `${[[-60, -96], [-24, -110], [12, -114], [48, -102], [78, -84]].map(([x, y], i) => `<path d="M${x} ${y + 24} q-${12 + i * 2} -${26 + i * 4} ${6} -${30 + i * 5} q${18 - i * 2} ${4} ${8} ${32 + i * 5}z" fill="#F4A83A" ${ST}/>`).join("")}
        ${[[122, -34], [140, -14]].map(([x, y]) => `<path d="M${x} ${y} l24 -10 l-12 20z" fill="#F4A83A" ${ST}/>`).join("")}` : ""}
      ${k === "anky" ? `${[[-40, -84], [4, -90], [46, -80], [-14, -88]].map(([x, y]) => `<path d="M${x} ${y + 10} q-8 -16 4 -18 q12 2 6 18z" fill="${don}" ${TH}/>`).join("")}` : ""}
      ${[[-30, -64], [24, -60], [-58, -44]].map(([x, y]) => vlek(x, y, 17, 9, don)).join("")}</g>`;
  }
  /* pteranodon */
  return `<g>
    <path d="M-30 -30 q-90 -60 -180 -50 q60 40 120 54 q30 8 60 10z" fill="${c}" opacity=".9" ${ST}/>
    <path d="M30 -30 q90 -60 180 -50 q-60 40 -120 54 q-30 8 -60 10z" fill="${c}" opacity=".9" ${ST}/>
    <ellipse cx="0" cy="-40" rx="40" ry="46" fill="${c}" ${ST}/><ellipse cx="0" cy="-34" rx="24" ry="30" fill="${b}"/>
    ${been(-16, c, 60, 18)}${been(18, c, 60, 18)}
    <path d="M-16 -74 q-20 -22 -14 -40 q8 -16 24 -6 q14 10 8 28z" fill="${c}" ${ST}/>
    <g transform="translate(-58 -128) rotate(-6)">
      <path d="M0 -6 q-4 -16 12 -18 l16 -2 q14 0 18 8 l56 20 q12 4 12 11 q0 8 -12 9 l-56 4 q-14 2 -24 -4 q-16 -8 -22 -28z" fill="${c}" ${ST}/>
      <path d="M-4 -18 q-36 -16 -54 -10 q-8 4 -2 10 q10 8 34 10 l20 4z" fill="${b}" ${ST}/>
      <circle cx="16" cy="-8" r="6" fill="#fff" ${TH}/><circle cx="18" cy="-8" r="3.5" fill="${INK}"/></g></g>`;
}
