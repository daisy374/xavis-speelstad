"use strict";
/* Dierentuin — gestileerd 3D ("speelgoed"): ronde vormen, verloop voor volume,
   glanslichtje en een zachte schaduw op de grond. Geen zwarte contouren zoals de rest van de app.
   Alle dieren: voeten op y = 0, kop naar links, ongeveer 150 breed. */

const ZKLEUR = {
  grijs: ["#EFF3F7", "#A8B4C0", "#69757F"], bruin: ["#E7BD8C", "#C08A4F", "#865A2C"],
  geel: ["#FFE3A6", "#F0AE4E", "#B4761F"], giraf: ["#FFE7B8", "#F3C068", "#BA882F"],
  wit: ["#FFFFFF", "#E8ECF1", "#B6C0CA"], zwart: ["#5A6672", "#333B44", "#1C2229"],
  oranje: ["#FFC489", "#F28C33", "#B2581C"], paars: ["#E6C7E3", "#BC8FB8", "#80607D"],
  roze: ["#FFD6E0", "#F2A7BC", "#C2748C"], groen: ["#CDEAA8", "#8CC45E", "#5A8C34"],
  bruin2: ["#D8B089", "#AE7F50", "#79522C"]
};
const ZDEFS_SRC = `<defs>
  ${Object.entries(ZKLEUR).map(([k, [a, b, c]]) => `<radialGradient id="zg-${k}" cx="33%" cy="25%" r="82%">
    <stop offset="0" stop-color="${a}"/><stop offset=".52" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></radialGradient>`).join("")}
  <radialGradient id="zg-grond" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#2B241E" stop-opacity=".34"/><stop offset=".7" stop-color="#2B241E" stop-opacity=".12"/><stop offset="1" stop-color="#2B241E" stop-opacity="0"/></radialGradient>
  <linearGradient id="zg-lucht" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9BD8F5"/><stop offset="1" stop-color="#DFF2FB"/></linearGradient>
  <linearGradient id="zg-gras" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9BCF6A"/><stop offset="1" stop-color="#6FA845"/></linearGradient>
</defs>`;
/* de verlopen één keer in een verborgen svg: dubbele defs in een verborgen scherm tekenen niet */
document.body.insertAdjacentHTML("afterbegin", `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">${ZDEFS_SRC}</svg>`);

/* bouwstenen */
const zbol = (cx, cy, rx, ry, k, extra = "") => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#zg-${k})" ${extra}/>`;
const zglans = (cx, cy, rx, ry, o = .45, r = 0) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" opacity="${o}" transform="rotate(${r} ${cx} ${cy})"/>`;
const zpoot = (x, y, w, h, k) => `<rect x="${x - w / 2}" y="${y - h}" width="${w}" height="${h}" rx="${w / 2}" fill="url(#zg-${k})"/>`;
const zoog = (cx, cy, r) => `<ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 1.06}" fill="#fff"/>
  <circle cx="${cx - r * .1}" cy="${cy + r * .08}" r="${r * .6}" fill="#2A2420"/><circle cx="${cx - r * .3}" cy="${cy - r * .3}" r="${r * .24}" fill="#fff"/>`;
const zgrond = (cx, rx) => `<ellipse cx="${cx}" cy="4" rx="${rx}" ry="${rx * .22}" fill="url(#zg-grond)"/>`;

const ZOO = {
  olifant: { nl: "olifant", en: "elephant", kg: 60, eet: "blad", verblijf: "savanne" },
  aap: { nl: "aap", en: "monkey", kg: 12, eet: "fruit", verblijf: "jungle" },
  leeuw: { nl: "leeuw", en: "lion", kg: 30, eet: "vlees", verblijf: "savanne" },
  giraf: { nl: "giraf", en: "giraffe", kg: 40, eet: "blad", verblijf: "savanne" },
  zebra: { nl: "zebra", en: "zebra", kg: 25, eet: "blad", verblijf: "savanne" },
  pinguin: { nl: "pinguïn", en: "penguin", kg: 8, eet: "vis", verblijf: "water" },
  tijger: { nl: "tijger", en: "tiger", kg: 28, eet: "vlees", verblijf: "jungle" },
  nijlpaard: { nl: "nijlpaard", en: "hippo", kg: 50, eet: "blad", verblijf: "water" }
};
const ZSOORT = Object.keys(ZOO);

function zooDier(k) {
  if (k === "olifant") return `<g>${zgrond(0, 64)}
    ${zpoot(-34, 0, 30, 50, "grijs")}${zpoot(28, 0, 30, 48, "grijs")}${zpoot(-12, 0, 28, 46, "grijs")}${zpoot(48, 0, 28, 44, "grijs")}
    ${zbol(6, -78, 58, 46, "grijs")}${zglans(-14, -102, 22, 11, .4, -18)}
    <path d="M56 -92 q26 -6 26 16 q0 10 -10 16 q-4 -18 -16 -26z" fill="url(#zg-grijs)"/>
    ${zbol(-50, -92, 40, 38, "grijs")}
    <path d="M-86 -106 q-30 -4 -34 14 q-4 20 14 26 q18 6 26 -10z" fill="url(#zg-grijs)" opacity=".95"/>
    <path d="M-60 -64 q-6 36 -22 46 q-14 8 -18 -4 q-2 -10 8 -16 q12 -8 14 -30z" fill="url(#zg-grijs)"/>
    <path d="M-72 -56 q-4 8 -2 16" stroke="#8C98A4" stroke-width="3" fill="none" opacity=".6"/>
    <path d="M-34 -58 q6 14 2 22" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".9"/>
    ${zoog(-62, -98, 8)}${zoog(-34, -96, 8)}${zglans(-56, -116, 16, 7, .5, -12)}</g>`;
  if (k === "aap") return `<g>${zgrond(0, 46)}
    <path d="M44 -44 q40 -6 36 -40 q-2 -18 -18 -16 q-12 2 -8 14 q4 14 -16 20z" fill="url(#zg-bruin)"/>
    ${zpoot(-18, 0, 22, 38, "bruin")}${zpoot(16, 0, 22, 38, "bruin")}
    ${zbol(0, -58, 36, 34, "bruin")}${zbol(0, -56, 24, 22, "bruin2")}
    <path d="M-34 -70 q-20 -14 -34 4 q-8 14 4 22 q12 8 22 -6z" fill="url(#zg-bruin)"/>
    ${zbol(-30, -104, 30, 28, "bruin")}
    ${[-58, -2].map(x => `<circle cx="${x}" cy="-108" r="12" fill="url(#zg-bruin)"/><circle cx="${x}" cy="-108" r="6" fill="#E8B88C"/>`).join("")}
    <ellipse cx="-30" cy="-98" rx="20" ry="17" fill="#F0C79B"/>
    ${zoog(-39, -108, 7)}${zoog(-20, -108, 7)}
    <ellipse cx="-30" cy="-94" rx="4" ry="3" fill="#8A5A34"/><path d="M-38 -88 q8 7 16 0" stroke="#8A5A34" stroke-width="3" fill="none" stroke-linecap="round"/>
    ${zglans(-40, -118, 13, 6, .5, -14)}</g>`;
  if (k === "leeuw") return `<g>${zgrond(0, 56)}
    <path d="M44 -52 q34 -4 36 22 q-10 8 -18 0 q-10 -10 -20 -8z" fill="url(#zg-geel)"/>
    <circle cx="80" cy="-28" r="9" fill="#8A5A2B"/>
    ${zpoot(-26, 0, 26, 42, "geel")}${zpoot(24, 0, 26, 42, "geel")}${zpoot(4, 0, 24, 40, "geel")}
    ${zbol(8, -66, 48, 36, "geel")}${zglans(-6, -84, 18, 8, .35, -16)}
    <circle cx="-44" cy="-86" r="46" fill="url(#zg-bruin)"/>
    ${Array.from({ length: 12 }, (_, i) => { const a = i / 12 * Math.PI * 2; return `<circle cx="${-44 + Math.cos(a) * 44}" cy="${-86 + Math.sin(a) * 44}" r="13" fill="url(#zg-bruin)"/>`; }).join("")}
    ${zbol(-44, -88, 33, 30, "geel")}
    ${zoog(-56, -94, 8)}${zoog(-32, -94, 8)}
    <ellipse cx="-44" cy="-74" rx="10" ry="7" fill="#C97B54"/><path d="M-44 -70 v6 M-44 -64 q-8 6 -14 0 M-44 -64 q8 6 14 0" stroke="#8A5A34" stroke-width="3" fill="none" stroke-linecap="round"/>
    ${zglans(-56, -106, 14, 6, .5, -12)}</g>`;
  if (k === "giraf") return `<g>${zgrond(0, 48)}
    ${zpoot(-24, 0, 22, 62, "giraf")}${zpoot(22, 0, 22, 60, "giraf")}${zpoot(0, 0, 20, 58, "giraf")}
    ${zbol(4, -82, 42, 32, "giraf")}
    ${[[-16, -74], [16, -86], [-2, -96], [26, -70]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="11" ry="9" fill="#B9832C" opacity=".75"/>`).join("")}
    <path d="M-36 -92 q-18 -56 -2 -84 q8 -14 22 -6 q10 6 2 20 q-14 24 -4 66z" fill="url(#zg-giraf)"/>
    ${[[-30, -120], [-20, -148]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="8" ry="7" fill="#B9832C" opacity=".7"/>`).join("")}
    ${zbol(-22, -182, 26, 21, "giraf")}
    <path d="M-40 -178 q-16 2 -16 12 q0 10 14 10 q10 0 14 -10z" fill="url(#zg-giraf)"/>
    ${[[-32, -202], [-12, -200]].map(([x, y]) => `<rect x="${x - 3}" y="${y}" width="6" height="14" rx="3" fill="#C9972F"/><circle cx="${x}" cy="${y}" r="6" fill="#8A6020"/>`).join("")}
    ${zoog(-34, -188, 7)}${zoog(-12, -186, 7)}
    <circle cx="-44" cy="-170" r="3" fill="#8A6020"/>${zglans(-30, -196, 12, 5, .45, -10)}</g>`;
  if (k === "zebra") return `<g>${zgrond(0, 52)}
    ${zpoot(-26, 0, 22, 46, "wit")}${zpoot(24, 0, 22, 46, "wit")}${zpoot(2, 0, 20, 44, "wit")}
    ${zbol(4, -70, 46, 34, "wit")}
    ${[-30, -12, 6, 24, 40].map((x, i) => `<path d="M${x} -100 q6 16 ${i % 2 ? 2 : -4} 32 q-6 -14 ${i % 2 ? -4 : 2} -32z" fill="#2E363E" opacity=".9"/>`).join("")}
    <path d="M-40 -84 q-14 -34 -2 -48 q10 -12 20 -2 q8 8 0 18 q-10 12 -4 34z" fill="url(#zg-wit)"/>
    ${zbol(-26, -132, 24, 19, "wit")}
    <path d="M-44 -130 q-14 2 -14 11 q0 9 12 9 q10 0 13 -9z" fill="#E8ECF1"/>
    ${[[-36, -150], [-16, -148]].map(([x, y]) => `<path d="M${x} ${y} l-5 -14 l11 6z" fill="#E8ECF1"/>`).join("")}
    <path d="M-20 -150 q10 -16 18 -6 q-6 10 -16 12z" fill="#2E363E"/>
    ${zoog(-36, -136, 7)}${zoog(-16, -134, 7)}
    <circle cx="-48" cy="-120" r="3" fill="#2E363E"/>${zglans(-32, -144, 11, 5, .5, -10)}</g>`;
  if (k === "pinguin") return `<g>${zgrond(0, 38)}
    ${[-16, 16].map(x => `<path d="M${x - 14} -4 q14 -10 28 0 q-2 6 -14 6 q-12 0 -14 -6z" fill="#F2A33A"/>`).join("")}
    ${zbol(0, -52, 34, 48, "zwart")}
    ${zbol(2, -46, 24, 36, "wit")}
    <path d="M-32 -74 q-16 10 -12 36 q2 14 12 14z" fill="url(#zg-zwart)"/>
    <path d="M32 -74 q16 10 12 36 q-2 14 -12 14z" fill="url(#zg-zwart)"/>
    ${zbol(0, -98, 28, 26, "zwart")}
    <path d="M-20 -94 q20 14 40 -2 q-6 18 -20 18 q-16 0 -20 -16z" fill="#fff" opacity=".95"/>
    ${zoog(-11, -102, 7)}${zoog(11, -102, 7)}
    <path d="M-9 -90 q9 -5 18 0 q-7 12 -18 0z" fill="#F2A33A"/>
    ${zglans(-12, -112, 12, 6, .45, -12)}</g>`;
  if (k === "tijger") return `<g>${zgrond(0, 54)}
    <path d="M44 -50 q36 -8 34 18 q-2 12 -14 8 q-8 -4 -6 -12 q2 -10 -14 -8z" fill="url(#zg-oranje)"/>
    ${zpoot(-26, 0, 26, 40, "oranje")}${zpoot(24, 0, 26, 40, "oranje")}${zpoot(2, 0, 24, 38, "oranje")}
    ${zbol(6, -64, 46, 34, "oranje")}
    ${[-24, -4, 16, 34].map(x => `<path d="M${x} -92 q5 14 1 26 q-5 -12 -1 -26z" fill="#2E2A26" opacity=".85"/>`).join("")}
    ${zbol(-40, -84, 32, 29, "oranje")}
    ${[[-62, -108], [-20, -106]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="12" fill="url(#zg-oranje)"/><circle cx="${x}" cy="${y}" r="6" fill="#F3C8A0"/>`).join("")}
    ${[[-58, -98], [-24, -96]].map(([x, y]) => `<path d="M${x} ${y} q3 10 0 16" stroke="#2E2A26" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/>`).join("")}
    <ellipse cx="-40" cy="-76" rx="18" ry="13" fill="#FFE9D6"/>
    ${zoog(-52, -90, 8)}${zoog(-28, -88, 8)}
    <path d="M-40 -78 q6 2 0 6 q-6 -4 0 -6z" fill="#C45C33"/><path d="M-40 -72 q-7 7 -13 2 M-40 -72 q7 7 13 2" stroke="#8A5A34" stroke-width="3" fill="none" stroke-linecap="round"/>
    ${zglans(-52, -102, 13, 6, .5, -12)}</g>`;
  return `<g>${zgrond(0, 62)}
    ${zpoot(-34, 0, 30, 34, "paars")}${zpoot(30, 0, 30, 34, "paars")}${zpoot(-6, 0, 28, 32, "paars")}
    ${zbol(8, -58, 58, 38, "paars")}${zglans(-10, -76, 20, 9, .35, -16)}
    ${zbol(-50, -66, 44, 36, "paars")}
    <ellipse cx="-62" cy="-50" rx="30" ry="20" fill="url(#zg-roze)"/>
    ${[[-74, -52], [-50, -50]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="6" ry="4.5" fill="#B4738C"/>`).join("")}
    <path d="M-88 -44 q26 14 52 0 q-10 14 -26 14 q-18 0 -26 -14z" fill="#C2748C" opacity=".8"/>
    ${[[-78, -34], [-46, -34]].map(([x, y]) => `<rect x="${x - 4}" y="${y}" width="8" height="9" rx="3" fill="#fff"/>`).join("")}
    ${[[-70, -86], [-34, -84]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="url(#zg-paars)"/><circle cx="${x}" cy="${y}" r="4" fill="#E6C7E3"/>`).join("")}
    ${zoog(-66, -72, 8)}${zoog(-38, -70, 8)}
    ${zglans(-62, -88, 14, 6, .45, -12)}</g>`;
}
/* kleine versie voor kaartjes en lijstjes */
const zooMini = k => `<svg viewBox="-80 -200 160 215">${zooDier(k)}</svg>`;
