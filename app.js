"use strict";
/* Xavi's Speelstad — v1: politieauto bouwen en rijden */

const W = 667, H = 375;
const INK = "#1B1B2A";
const C = {
  white: "#FFFFFF", blue: "#1E4FD8", glass: "#9FE3FF", tyre: "#1B1B2A", hub: "#FFD600",
  dino: "#22C55E", dinoDark: "#15803D", red: "#FF1744", sblue: "#2979FF", yellow: "#FFC928", grey: "#C7CEDB"
};
const ST = `stroke="${INK}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"`;
const TH = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
const $ = s => document.querySelector(s);
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];

/* ---------- schaal het speelveld naar het scherm ---------- */
const stage = $("#stage");
let scale = 1;
function fit() {
  scale = Math.min(innerWidth / W, innerHeight / H);
  stage.style.transform = `translate(${(innerWidth - W * scale) / 2}px, ${(innerHeight - H * scale) / 2}px) scale(${scale})`;
}
addEventListener("resize", fit);
addEventListener("orientationchange", () => setTimeout(fit, 200));
fit();
function stagePoint(e) {
  const r = stage.getBoundingClientRect();
  const s = r.width / W;
  return { x: (e.clientX - r.left) / s, y: (e.clientY - r.top) / s };
}

/* ---------- geluid ---------- */
const VOICES = ["welkom", "politie", "binnenkort", "bouw_body", "bouw_wiel", "bouw_wiel2", "bouw_cabine", "bouw_sirene",
  "bouw_dino", "goed1", "goed2", "goed3", "goed4", "nogeens", "hint", "klaar", "rijden", "boef_daar",
  "tel1", "tel2", "tel3", "tel4", "tel5", "tel6", "tel7", "tel8", "tel9", "tel10", "dino_hallo", "nacht", "dag", "sirene_aan"];
let ctx = null, master = null;
const buffers = {};
let voiceSrc = null, voiceToken = 0;

function unlockAudio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  if (!ctx) {
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    fetch("voices.json").then(r => r.json()).then(all => {
      VOICES.forEach(n => {
        if (!all[n]) return;
        const bin = atob(all[n]), a = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
        new Promise((res, rej) => ctx.decodeAudioData(a.buffer, res, rej))
          .then(b => { buffers[n] = b; if (pendingVoice && pendingVoice.name === n && Date.now() - pendingVoice.t < 3000) playVoice(n); })
          .catch(() => {});
      });
    }).catch(() => {});
  }
  if (ctx.state === "suspended") ctx.resume();
  const b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource();
  s.buffer = b; s.connect(ctx.destination); s.start(0);
}
let pendingVoice = null;
function playVoice(name, cb) {
  if (!ctx) { cb && setTimeout(cb, 300); return; }
  const token = ++voiceToken;
  if (voiceSrc) { try { voiceSrc.onended = null; voiceSrc.stop(); } catch (e) {} voiceSrc = null; }
  const buf = buffers[name];
  if (!buf) { pendingVoice = { name, t: Date.now() }; cb && setTimeout(cb, 700); return; }
  pendingVoice = null;
  const s = ctx.createBufferSource();
  s.buffer = buf; s.connect(master); s.start(0);
  voiceSrc = s;
  s.onended = () => { if (token === voiceToken) { voiceSrc = null; cb && cb(); } };
}
function say(name, cb) { playVoice(name, cb); }

function tone(f, dur, type = "sine", vol = 0.2, delay = 0, f2 = null) {
  if (!ctx) return;
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.05);
}
const sfx = {
  click() { tone(900, 0.08, "square", 0.12, 0, 1500); tone(1800, 0.06, "triangle", 0.1, 0.05); },
  sparkle() { [880, 1175, 1568, 2093].forEach((f, i) => tone(f, 0.18, "triangle", 0.12, i * 0.06)); },
  whoosh() { tone(420, 0.35, "triangle", 0.12, 0, 220); },
  pop() { tone(500, 0.12, "sine", 0.2, 0, 1100); },
  honk() {
    if (!ctx) return;
    const t = ctx.currentTime, g = ctx.createGain(), lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 1400;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.02);
    g.gain.setValueAtTime(0.16, t + 0.16); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    g.gain.setValueAtTime(0.0001, t + 0.24); g.gain.exponentialRampToValueAtTime(0.16, t + 0.26);
    g.gain.setValueAtTime(0.16, t + 0.5); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    [392, 494].forEach(f => { const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = f; o.connect(lp); o.start(t); o.stop(t + 0.6); });
    lp.connect(g).connect(master);
  },
  cuffs() { tone(2400, 0.08, "square", 0.08); tone(3000, 0.1, "square", 0.08, 0.09); tone(660, 0.25, "triangle", 0.15, 0.15, 990); },
  fanfare() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i === 3 ? 0.5 : 0.16, "square", 0.09, i * 0.14)); }
};
let sirenNodes = null;
function sirenOn() {
  if (!ctx || sirenNodes) return;
  const o = ctx.createOscillator(), lfo = ctx.createOscillator(), lg = ctx.createGain(), g = ctx.createGain();
  o.type = "triangle"; o.frequency.value = 780;
  lfo.type = "square"; lfo.frequency.value = 1.25; lg.gain.value = 150;
  lfo.connect(lg).connect(o.frequency);
  g.gain.setValueAtTime(0.0001, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.1);
  o.connect(g).connect(master); o.start(); lfo.start();
  sirenNodes = { o, lfo, g };
}
function sirenOff() {
  if (!sirenNodes) return;
  const { o, lfo, g } = sirenNodes, t = ctx.currentTime;
  g.gain.setValueAtTime(g.gain.value, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
  o.stop(t + 0.25); lfo.stop(t + 0.25);
  sirenNodes = null;
}

/* ---------- tekeningen ---------- */
const WINDOW_PATH = "M58 38 L71 10 L131 10 L148 38 Z";
const PARTS = {
  body: { c: [98, 65], w: 204, svg: `
    <rect x="-4" y="78" width="204" height="9" rx="4.5" fill="${C.grey}" ${TH}/>
    <rect x="0" y="40" width="196" height="46" rx="14" fill="${C.white}"/>
    <rect x="2" y="57" width="192" height="14" fill="${C.blue}"/>
    <text x="98" y="68.5" text-anchor="middle" font-family="Baloo 2, Arial Rounded MT Bold, sans-serif" font-weight="800" font-size="11" letter-spacing="1.5" fill="#fff">POLITIE</text>
    <path d="M104 42 V84" fill="none" ${TH}/>
    <rect x="112" y="46" width="12" height="4" rx="2" fill="${INK}"/>
    <path d="M62 43 l2.8 5.6 l6.2 .9 l-4.5 4.3 l1.1 6.1 l-5.6 -2.9 l-5.6 2.9 l1.1 -6.1 l-4.5 -4.3 l6.2 -.9z" transform="translate(0 -1) scale(.85) translate(11 5)" fill="${C.yellow}" ${TH}/>
    <rect x="184" y="45" width="12" height="9" rx="3" fill="#FFE27A" ${TH}/>
    <rect x="0" y="45" width="9" height="9" rx="3" fill="${C.red}" ${TH}/>
    <rect x="0" y="40" width="196" height="46" rx="14" fill="none" ${ST}/>` },
  cabin: { c: [104, 22], w: 132, svg: `
    <path d="M40 44 L62 2 Q64 0 68 0 L136 0 Q140 0 142 3 L168 44 Z" fill="${C.white}" ${ST}/>
    <path d="${WINDOW_PATH}" fill="${C.glass}" ${TH}/>
    <path d="M128 15 L119 33" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/>` },
  wheel: { c: [0, 0], w: 42, targets: [[44, 88], [152, 88]], svg: `
    <circle r="19" fill="${C.tyre}" ${ST}/>
    <circle r="9" fill="${C.hub}" ${TH}/>
    <circle cy="-4.5" r="2" fill="${INK}"/><circle cy="4.5" r="2" fill="${INK}"/>
    <circle cx="-4.5" r="2" fill="${INK}"/><circle cx="4.5" r="2" fill="${INK}"/>` },
  siren: { c: [100, -5], w: 34, svg: `
    <path d="M88 2 v-9 a12 10 0 0 1 12 -6 v15z" fill="${C.red}" ${TH}/>
    <path d="M100 2 v-15 a12 10 0 0 1 12 6 v9z" fill="${C.sblue}" ${TH}/>
    <rect x="84" y="0" width="32" height="5" rx="2.5" fill="${C.grey}" ${TH}/>` },
  dino: { c: [102, 22], w: 60, svg: `<g transform="translate(0 4)">
    <rect x="88" y="30" width="20" height="24" rx="8" fill="${C.dino}" ${TH}/>
    <path d="M78 22 l5 -9 l4 9 z M81 33 l6 -8 l3 9 z" fill="${C.dinoDark}" ${TH}/>
    <ellipse cx="98" cy="26" rx="17" ry="16" fill="${C.dino}" ${TH}/>
    <ellipse cx="114" cy="29" rx="15" ry="11" fill="${C.dino}" ${TH}/>
    <circle cx="124" cy="26" r="1.8" fill="${C.dinoDark}"/>
    <path d="M108 34 q8 5 16 -1" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>
    <circle cx="105" cy="17" r="8" fill="#fff" ${TH}/><circle cx="107" cy="18" r="4.5" fill="${INK}"/><circle cx="108.6" cy="16" r="1.6" fill="#fff"/>
    <path d="M84 11 q14 -14 30 -2 z" fill="${C.blue}" ${TH}/>
    <rect x="82" y="9" width="36" height="5" rx="2.5" fill="#163A9E" ${TH}/>
    <circle cx="99" cy="4.5" r="2.6" fill="${C.hub}"/></g>` }
};
function partInner(key) {
  const p = PARTS[key];
  return `<g transform="translate(${-p.c[0]} ${-p.c[1]})">${p.svg}</g>`;
}
let uid = 0;
/* volledige auto in auto-coördinaten (0..196 breed, wielen onderaan y≈107) */
function carSVG({ glow = false, cone = false } = {}) {
  const id = "win" + (++uid);
  const at = (key, x, y, cls = "") => `<g transform="translate(${x} ${y})"><g class="${cls}">${partInner(key)}</g></g>`;
  return `
    <defs><clipPath id="${id}"><path d="${WINDOW_PATH}"/></clipPath></defs>
    ${cone ? `<path class="no" d="M194 50 L360 18 L360 100 Z" fill="#FFF3A0" fill-opacity=".4"/>` : ""}
    ${glow ? `<circle class="glow r" cx="90" cy="-8" r="22" fill="${C.red}"/><circle class="glow b" cx="110" cy="-8" r="22" fill="${C.sblue}"/>` : ""}
    ${at("siren", 100, -5)}
    ${at("cabin", 104, 22)}
    <g clip-path="url(#${id})"><g class="dinohead">${at("dino", 102, 22)}</g></g>
    ${at("body", 98, 65)}
    ${at("wheel", 44, 88, "spin")}
    ${at("wheel", 152, 88, "spin")}`;
}

const ICONS = {
  home: `<svg viewBox="0 0 40 40"><path d="M6 20 L20 7 L34 20 V34 H24 V25 H16 V34 H6 Z" fill="#FF5A5F" ${TH}/></svg>`,
  play: `<svg viewBox="0 0 40 40"><path d="M13 8 L32 20 L13 32 Z" fill="#fff" ${ST}/></svg>`,
  horn: `<svg viewBox="0 0 40 40"><path d="M6 16 H12 L28 6 V34 L12 24 H6 Z" fill="#FF8A00" ${TH}/><path d="M32 14 q4 6 0 12" fill="none" ${TH}/></svg>`,
  siren: `<svg viewBox="0 0 40 40"><path d="M9 30 V20 a11 11 0 0 1 22 0 V30 Z" fill="${C.sblue}" ${TH}/><path d="M20 9 V20" stroke="#fff" stroke-width="3" stroke-linecap="round"/><rect x="5" y="29" width="30" height="6" rx="3" fill="${C.red}" ${TH}/><path d="M4 12 l4 3 M36 12 l-4 3 M20 2 v3" ${TH}/></svg>`,
  sun: `<svg viewBox="0 0 40 40"><g ${TH}><path d="M20 3v5M20 32v5M3 20h5M32 20h5M8 8l3.5 3.5M28.5 28.5L32 32M8 32l3.5-3.5M28.5 11.5L32 8"/></g><circle cx="20" cy="20" r="8" fill="${C.hub}" ${TH}/></svg>`,
  moon: `<svg viewBox="0 0 40 40"><path d="M26 6 a14 14 0 1 0 8 22 a11 11 0 1 1 -8 -22z" fill="#FFE27A" ${TH}/></svg>`,
  boef: `<svg viewBox="0 0 40 40"><path d="M8 12 L12 4 L17 10 M32 12 L28 4 L23 10" fill="#9E9E9E" ${TH}/><circle cx="20" cy="22" r="14" fill="#9E9E9E" ${TH}/><rect x="6" y="15" width="28" height="9" rx="4.5" fill="${INK}"/><circle cx="14" cy="19.5" r="3" fill="#fff"/><circle cx="26" cy="19.5" r="3" fill="#fff"/><ellipse cx="20" cy="29" rx="6" ry="4" fill="#E0E0E0"/><circle cx="20" cy="27" r="2" fill="${INK}"/></svg>`,
  wrench: `<svg viewBox="0 0 40 40"><path d="M24 5 a9 9 0 0 0 -8 12 L5 28 a3.5 3.5 0 0 0 5 5 L21 22 a9 9 0 0 0 12 -8 l-5 3 l-4 -1 l-1 -4 z" fill="#B0BEC5" ${TH}/></svg>`,
  lock: `<svg viewBox="0 0 48 48"><path d="M15 22 V15 a9 9 0 0 1 18 0 V22" fill="none" stroke="${INK}" stroke-width="5"/><rect x="9" y="20" width="30" height="22" rx="6" fill="${C.hub}" ${ST}/><circle cx="24" cy="31" r="3.5" fill="${INK}"/></svg>`,
  bars: `<svg viewBox="0 0 34 34"><rect x="3" y="3" width="28" height="28" rx="5" fill="#90A4AE" ${TH}/><path d="M11 3 V31 M17 3 V31 M23 3 V31" stroke="${INK}" stroke-width="3"/></svg>`,
  mini: `<svg viewBox="0 0 20 20"><circle cx="10" cy="11" r="8" fill="#9E9E9E" stroke="${INK}" stroke-width="1.6"/><rect x="2.5" y="7.5" width="15" height="5" rx="2.5" fill="${INK}"/><circle cx="7" cy="10" r="1.5" fill="#fff"/><circle cx="13" cy="10" r="1.5" fill="#fff"/></svg>`
};

function boefSVG() {
  return `
    <circle r="48" cy="-40" fill="transparent" class="hit"/>
    <path d="M-12 -30 q-24 -4 -26 -26" fill="none" stroke="#757575" stroke-width="9" stroke-linecap="round"/>
    <path d="M-12 -30 q-24 -4 -26 -26" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round" stroke-dasharray="5 6"/>
    <rect class="leg1" x="-9" y="-22" width="8" height="22" rx="4" fill="${INK}"/>
    <rect class="leg2" x="1" y="-22" width="8" height="22" rx="4" fill="${INK}"/>
    <rect x="-14" y="-50" width="28" height="31" rx="9" fill="#fff" ${TH}/>
    <path d="M-13 -42 H13 M-14 -34 H14 M-13 -26 H13" stroke="${INK}" stroke-width="4"/>
    <path d="M10 -48 q24 -10 22 12 q-2 12 -18 8 z" fill="#A1887F" ${TH}/>
    <text x="21" y="-30" text-anchor="middle" font-family="Arial Rounded MT Bold, sans-serif" font-size="13" font-weight="800" fill="${C.hub}">€</text>
    <path d="M-12 -70 L-9 -82 L-1 -74 M12 -70 L9 -82 L1 -74" fill="#9E9E9E" ${TH}/>
    <circle cy="-62" r="16" fill="#9E9E9E" ${TH}/>
    <rect x="-15" y="-69" width="30" height="10" rx="5" fill="${INK}"/>
    <circle cx="-6" cy="-64" r="3.4" fill="#fff"/><circle cx="6" cy="-64" r="3.4" fill="#fff"/>
    <circle cx="-5" cy="-64" r="1.6" fill="${INK}"/><circle cx="7" cy="-64" r="1.6" fill="${INK}"/>
    <ellipse cy="-53" rx="7" ry="5" fill="#E0E0E0"/>
    <circle cy="-55" r="2.2" fill="${INK}"/>
    <path d="M-4 -50 q4 3 8 0" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>
    <path d="M-15 -74 q15 -14 30 0 z" fill="${INK}"/>`;
}

function fireTruckSVG() {
  return `<g ${ST}>
    <rect x="0" y="30" width="200" height="56" rx="12" fill="#FF1744"/>
    <path d="M130 30 V8 Q130 4 134 4 H176 Q186 4 192 14 L200 30 Z" fill="#FF1744"/>
    <path d="M138 10 H174 L184 28 H138 Z" fill="${C.glass}" stroke-width="3"/>
    <rect x="10" y="12" width="110" height="10" rx="3" fill="#E0E0E0" stroke-width="3"/>
    <path d="M26 12 V22 M44 12 V22 M62 12 V22 M80 12 V22 M98 12 V22" stroke-width="3"/>
    <rect x="12" y="44" width="100" height="10" fill="${C.hub}" stroke-width="3"/>
    <circle cx="44" cy="88" r="18" fill="${C.tyre}"/><circle cx="44" cy="88" r="7" fill="${C.hub}" stroke-width="3"/>
    <circle cx="160" cy="88" r="18" fill="${C.tyre}"/><circle cx="160" cy="88" r="7" fill="${C.hub}" stroke-width="3"/>
  </g>`;
}
function ambulanceSVG() {
  return `<g ${ST}>
    <rect x="0" y="10" width="140" height="76" rx="12" fill="#fff"/>
    <path d="M140 30 H170 Q182 30 188 42 L196 60 V86 H140 Z" fill="#fff"/>
    <path d="M148 38 H168 Q176 38 180 46 L185 58 H148 Z" fill="${C.glass}" stroke-width="3"/>
    <rect x="0" y="58" width="196" height="10" fill="#FF5A5F" stroke-width="3"/>
    <path d="M62 22 h16 v12 h12 v16 h-12 v12 h-16 v-12 h-12 v-16 h12 z" fill="#FF1744" stroke-width="3" transform="translate(0 -4) scale(1) "/>
    <circle cx="40" cy="88" r="18" fill="${C.tyre}"/><circle cx="40" cy="88" r="7" fill="${C.hub}" stroke-width="3"/>
    <circle cx="160" cy="88" r="18" fill="${C.tyre}"/><circle cx="160" cy="88" r="7" fill="${C.hub}" stroke-width="3"/>
  </g>`;
}

/* ---------- effecten ---------- */
function sparkleAt(layer, x, y, big = false) {
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute("transform", `translate(${x} ${y})`);
  const n = big ? 12 : 8, rr = big ? 70 : 46;
  let s = "";
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    s += `<path d="M${Math.cos(a) * rr * .45} ${Math.sin(a) * rr * .45} L${Math.cos(a) * rr} ${Math.sin(a) * rr}" stroke="${pick(["#FFD600", "#fff", "#FF5A5F", "#2979FF"])}" stroke-width="6" stroke-linecap="round"/>`;
  }
  g.innerHTML = `<g class="spark">${s}<circle r="${rr * .3}" fill="#FFE14D" opacity=".7"/></g>`;
  layer.appendChild(g);
  setTimeout(() => g.remove(), 700);
}
function confetti(n = 60) {
  const box = document.createElement("div");
  box.className = "confetti";
  const cols = ["#FFD600", "#FF5A5F", "#2979FF", "#22C55E", "#7C4DFF", "#FF8A00"];
  for (let i = 0; i < n; i++) {
    const c = document.createElement("i");
    c.style.left = rnd(0, W) + "px";
    c.style.background = pick(cols);
    c.style.setProperty("--x", rnd(-80, 80) + "px");
    c.style.setProperty("--r", rnd(-720, 720) + "deg");
    c.style.setProperty("--d", rnd(1.4, 2.6) + "s");
    c.style.animationDelay = rnd(0, .5) + "s";
    box.appendChild(c);
  }
  stage.appendChild(box);
  setTimeout(() => box.remove(), 3400);
}

/* ---------- schermen ---------- */
let current = null;
function show(id) {
  ["home", "build", "drive"].forEach(s => { $("#" + s).hidden = s !== id; });
  if (current === "drive" && id !== "drive") stopDrive();
  if (current === "build" && id !== "build") clearBuildTimers();
  current = id;
}
function homeButton(parent, onTap) {
  const b = document.createElement("button");
  b.className = "btn home-btn"; b.setAttribute("aria-label", "Naar huis");
  b.innerHTML = ICONS.home;
  b.addEventListener("click", () => { sfx.pop(); onTap(); });
  parent.appendChild(b);
}

/* ---------- start / thuis ---------- */
$("#startBtn").innerHTML = ICONS.play;
$("#startBtn").addEventListener("click", () => {
  unlockAudio();
  $("#start").remove();
  sfx.pop();
  say("welkom");
});

function renderHome() {
  const el = $("#home");
  el.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" aria-hidden="true">
      <rect width="${W}" height="${H}" fill="var(--sky)"/>
      <circle cx="600" cy="60" r="34" fill="${C.hub}" ${ST}/>
      <rect y="300" width="${W}" height="75" fill="var(--grass)" ${ST}/>
      <rect y="318" width="${W}" height="57" fill="#3D4657"/>
      <g fill="#FFE14D">${Array.from({ length: 12 }, (_, i) => `<rect x="${i * 60 + 8}" y="344" width="32" height="6" rx="3"/>`).join("")}</g>
    </svg>
    <div class="title">Xavi's Speelstad</div>
    <div class="tiles">
      <div class="tile active" id="tPolitie" role="button" aria-label="Politieauto">
        <svg viewBox="-20 -40 236 190"><g transform="translate(0 10)">${carSVG()}</g></svg>
      </div>
      <div class="tile locked" id="tBrand" role="button" aria-label="Brandweer (binnenkort)">
        <svg viewBox="-20 -30 240 170"><g transform="translate(0 16)">${fireTruckSVG()}</g></svg>
        <span class="lock">${ICONS.lock}</span>
      </div>
      <div class="tile locked" id="tAmbu" role="button" aria-label="Ambulance (binnenkort)">
        <svg viewBox="-20 -30 236 170"><g transform="translate(0 16)">${ambulanceSVG()}</g></svg>
        <span class="lock">${ICONS.lock}</span>
      </div>
    </div>`;
  $("#tPolitie").addEventListener("click", () => { unlockAudio(); sfx.honk(); say("politie"); startBuild(); });
  ["#tBrand", "#tAmbu"].forEach(s => $(s).addEventListener("click", e => {
    unlockAudio();
    const t = e.currentTarget; t.classList.remove("shake"); void t.offsetWidth; t.classList.add("shake");
    say("binnenkort");
  }));
}

/* ---------- bouwen ---------- */
const CAR_X = 130, CAR_Y = 92, K = 1.6;
const TRAY = { x: 505, y: 70, w: 150, h: 250, cx: 580, cy: 195 };
const STEPS = [
  { key: "body", voice: "bouw_body" },
  { key: "wheel", voice: "bouw_wiel" },
  { key: "wheel", voice: "bouw_wiel2" },
  { key: "cabin", voice: "bouw_cabine" },
  { key: "siren", voice: "bouw_sirene" },
  { key: "dino", voice: "bouw_dino" }
];
let B = null; // bouwstatus
function clearBuildTimers() { if (B) { clearTimeout(B.hintT); clearTimeout(B.nextT); } }
const toStage = (cx, cy) => ({ x: CAR_X + K * cx, y: CAR_Y + K * cy });

function startBuild() {
  clearBuildTimers();
  show("build");
  const el = $("#build");
  const winId = "bwin" + (++uid);
  const silAt = (key, x, y, extra = "") => `<g class="sil" data-key="${key}" data-x="${x}" data-y="${y}" transform="translate(${x} ${y})" ${extra}>${partInner(key)}</g>`;
  el.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}">
      <defs><clipPath id="${winId}"><path d="${WINDOW_PATH}"/></clipPath></defs>
      <rect width="${W}" height="${H}" fill="#FFE8B0"/>
      <g opacity=".55">${Array.from({ length: 12 }, (_, i) => `<rect x="${i * 60}" y="0" width="30" height="300" fill="#FFD980"/>`).join("")}</g>
      <rect x="150" y="26" width="200" height="30" rx="8" fill="#fff" ${ST}/>
      <path d="M168 34 l14 14 M182 34 l-14 14" stroke="#B0BEC5" stroke-width="5" stroke-linecap="round"/>
      <g transform="translate(200 29) scale(.55)">${ICONS.wrench.replace(/<\/?svg[^>]*>/g, "")}</g>
      <g transform="translate(236 29) scale(.55)">${ICONS.wrench.replace(/<\/?svg[^>]*>/g, "")}</g>
      <circle cx="300" cy="41" r="9" fill="${C.red}" ${TH}/><circle cx="326" cy="41" r="9" fill="${C.sblue}" ${TH}/>
      <rect x="0" y="298" width="${W}" height="77" fill="#90A4AE" ${ST}/>
      <g fill="#FFD600">${Array.from({ length: 14 }, (_, i) => `<path d="M${i * 50} 298 l20 0 l-30 77 l-20 0 z" opacity=".9"/>`).join("")}</g>
      <rect x="0" y="298" width="${W}" height="77" fill="none" ${ST}/>
      <rect x="120" y="278" width="336" height="22" rx="6" fill="#607D8B" ${ST}/>
      <rect x="${TRAY.x}" y="${TRAY.y}" width="${TRAY.w}" height="${TRAY.h}" rx="26" fill="#fff" ${ST}/>
      <rect x="${TRAY.x + 12}" y="${TRAY.y + 12}" width="${TRAY.w - 24}" height="${TRAY.h - 24}" rx="18" fill="#E3F7FF"/>
      <g transform="translate(${CAR_X} ${CAR_Y}) scale(${K})"><g id="car">
        <g id="silLayer">
          ${silAt("siren", 100, -5)}
          ${silAt("cabin", 104, 22)}
          <g clip-path="url(#${winId})">${silAt("dino", 102, 22)}</g>
          ${silAt("body", 98, 65)}
          ${silAt("wheel", 44, 88, 'data-slot="0"')}
          ${silAt("wheel", 152, 88, 'data-slot="1"')}
        </g>
        <g id="L_siren"></g><g id="L_cabin"></g><g id="L_dino" clip-path="url(#${winId})"></g><g id="L_body"></g><g id="L_wheel"></g>
      </g></g>
      <g id="hintLayer"></g>
      <g id="dragLayer"></g>
      <g id="fxLayer"></g>
    </svg>`;
  homeButton(el, () => { renderHome(); show("home"); });
  const go = document.createElement("button");
  go.className = "btn go"; go.hidden = true; go.setAttribute("aria-label", "Rijden");
  go.innerHTML = ICONS.play;
  go.addEventListener("click", () => { sfx.honk(); startDrive(); });
  el.appendChild(go);
  B = { idx: 0, part: null, filled: { wheel: [false, false] }, hintT: 0, nextT: 0, drag: null, go };
  const svg = el.querySelector("svg");
  svg.addEventListener("pointerdown", onDown);
  svg.addEventListener("pointermove", onMove);
  svg.addEventListener("pointerup", onUp);
  svg.addEventListener("pointercancel", onUp);
  B.nextT = setTimeout(nextPart, 900);
}

function trayScale(key) { return Math.min(K, 118 / PARTS[key].w); }
function setT(el, x, y, s) { el.style.transform = `translate(${x}px, ${y}px) scale(${s})`; }

function nextPart() {
  if (B.idx >= STEPS.length) return finishBuild();
  const step = STEPS[B.idx];
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute("class", "part popin");
  g.innerHTML = partInner(step.key);
  g.dataset.key = step.key;
  $("#dragLayer").appendChild(g);
  B.part = { el: g, key: step.key, x: TRAY.cx, y: TRAY.cy, s: trayScale(step.key) };
  setT(g, TRAY.cx, TRAY.cy, B.part.s);
  markNext();
  say(step.voice);
  scheduleHint(9000);
}
function openTargets(key) {
  const p = PARTS[key];
  if (key === "wheel") return p.targets.map((t, i) => ({ t, i })).filter(o => !B.filled.wheel[o.i]);
  return [{ t: p.c, i: 0 }];
}
function markNext() {
  document.querySelectorAll("#silLayer .sil").forEach(s => s.classList.remove("next"));
  if (!B.part) return;
  document.querySelectorAll(`#silLayer .sil[data-key="${B.part.key}"]:not(.done)`).forEach(s => s.classList.add("next"));
}
function scheduleHint(ms) {
  clearTimeout(B.hintT);
  B.hintT = setTimeout(showHint, ms);
}
function showHint() {
  if (!B.part || B.drag) return;
  const t = openTargets(B.part.key)[0].t, p = toStage(t[0], t[1]);
  const mx = (TRAY.cx + p.x) / 2, my = Math.min(TRAY.cy, p.y) - 90;
  $("#hintLayer").innerHTML = `<path class="hintpath" d="M${TRAY.cx} ${TRAY.cy} Q${mx} ${my} ${p.x} ${p.y}"/><circle cx="${p.x}" cy="${p.y}" r="14" fill="#FFE14D" ${ST}/>`;
  say("hint");
  scheduleHint(14000);
}
function clearHint() { $("#hintLayer").innerHTML = ""; }

function onDown(e) {
  if (!B || !B.part || B.drag) return;
  const pt = stagePoint(e);
  const inTray = pt.x > TRAY.x - 20 && pt.y > TRAY.y - 20 && pt.y < TRAY.y + TRAY.h + 20;
  const dx = pt.x - B.part.x, dy = pt.y - B.part.y;
  if (!inTray && Math.hypot(dx, dy) > 90) return;
  e.preventDefault();
  try { e.target.setPointerCapture && e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
  unlockAudio();
  clearHint(); clearTimeout(B.hintT);
  const el = B.part.el;
  el.classList.remove("anim", "popin");
  B.drag = { id: e.pointerId, ox: B.part.x - pt.x, oy: B.part.y - pt.y - 10 };
  B.part.s = K;
  moveTo(pt);
  sfx.pop();
}
function moveTo(pt) {
  B.part.x = pt.x + B.drag.ox; B.part.y = pt.y + B.drag.oy;
  setT(B.part.el, B.part.x, B.part.y, B.part.s);
}
function onMove(e) {
  if (!B || !B.drag || e.pointerId !== B.drag.id) return;
  e.preventDefault();
  moveTo(stagePoint(e));
}
function onUp(e) {
  if (!B || !B.drag || e.pointerId !== B.drag.id) return;
  B.drag = null;
  const part = B.part;
  let best = null;
  openTargets(part.key).forEach(o => {
    const p = toStage(o.t[0], o.t[1]);
    const d = Math.hypot(p.x - part.x, p.y - part.y);
    if (!best || d < best.d) best = { ...o, p, d };
  });
  const inTray = part.x > TRAY.x && part.y > TRAY.y && part.y < TRAY.y + TRAY.h;
  if (best && best.d < 75) return place(best);
  part.el.classList.add("anim");
  part.x = TRAY.cx; part.y = TRAY.cy; part.s = trayScale(part.key);
  setT(part.el, part.x, part.y, part.s);
  if (!inTray) { sfx.whoosh(); say("nogeens"); }
  scheduleHint(inTray ? 9000 : 5000);
}
function place(best) {
  const part = B.part;
  B.part = null;
  part.el.classList.add("anim");
  setT(part.el, best.p.x, best.p.y, K);
  if (part.key === "wheel") {
    B.filled.wheel[best.i] = true;
    document.querySelector(`#silLayer .sil[data-key="wheel"][data-slot="${best.i}"]`).classList.add("done");
  } else {
    document.querySelector(`#silLayer .sil[data-key="${part.key}"]`).classList.add("done");
  }
  markNext();
  sfx.click();
  setTimeout(() => {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${best.t[0]} ${best.t[1]})`);
    g.innerHTML = `<g class="bounce">${partInner(part.key)}</g>`;
    $("#L_" + part.key).appendChild(g);
    part.el.remove();
    sparkleAt($("#fxLayer"), best.p.x, best.p.y);
    sfx.sparkle();
    B.idx++;
    if (B.idx >= STEPS.length) { B.nextT = setTimeout(finishBuild, 250); return; }
    say(pick(["goed1", "goed2", "goed3", "goed4"]), () => { B.nextT = setTimeout(nextPart, 150); });
  }, 280);
}
function finishBuild() {
  clearTimeout(B.hintT);
  const car = $("#car");
  car.classList.add("bounce");
  sparkleAt($("#fxLayer"), CAR_X + K * 98, CAR_Y + K * 45, true);
  confetti();
  sfx.fanfare();
  setTimeout(() => { sfx.honk(); say("klaar"); B.go.hidden = false; }, 900);
}

/* ---------- rijden ---------- */
const TW = 1334;
let D = null;
function seeded(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }

function buildingTile() {
  const r = seeded(7), cols = ["#FFC107", "#FF5A5F", "#7C4DFF", "#00BCD4", "#FF8A00", "#EC407A", "#26A69A"];
  let x = 10, i = 0, s = "";
  while (x < TW - 60) {
    let w = Math.round(92 + r() * 60), h = Math.round(105 + r() * 70);
    if (x + w > TW - 10) w = TW - 10 - x;
    const police = i === 3;
    const col = police ? C.blue : cols[i % cols.length];
    if (police) h = 150;
    const top = 232 - h;
    s += `<rect x="${x}" y="${top}" width="${w}" height="${h + 4}" rx="6" fill="${col}" ${ST}/>`;
    const nc = Math.max(1, Math.floor((w - 14) / 30)), nr = Math.max(1, Math.floor((h - 58) / 34));
    const gx = (w - nc * 18) / (nc + 1);
    let wins = "", lit = "";
    for (let row = 0; row < nr; row++) for (let c = 0; c < nc; c++) {
      const wx = x + gx + c * (18 + gx), wy = top + 14 + row * 34;
      if (police && row === 0) continue;
      wins += `<rect x="${wx}" y="${wy}" width="18" height="22" rx="3" fill="#E3F7FF" ${TH}/>`;
      if (r() < 0.7) lit += `<rect x="${wx + 1.5}" y="${wy + 1.5}" width="15" height="19" rx="2" fill="#FFE066"/>`;
    }
    const dx = x + w / 2 - 14;
    s += wins;
    s += `<rect x="${dx}" y="196" width="28" height="36" rx="5" fill="${police ? "#fff" : "#6D3B1F"}" ${TH}/>`;
    if (police) {
      s += `<rect x="${x + 10}" y="${top + 10}" width="${w - 20}" height="26" rx="6" fill="#fff" ${TH}/>
            <text x="${x + w / 2}" y="${top + 29}" text-anchor="middle" font-family="Baloo 2, Arial Rounded MT Bold, sans-serif" font-weight="800" font-size="17" fill="${C.blue}">POLITIE</text>
            <circle cx="${x + w / 2}" cy="${top - 10}" r="9" fill="${C.sblue}" ${TH}/>`;
    } else if (r() < 0.5) {
      s += `<path d="M${dx - 8} 196 h44 l-6 -12 h-32 z" fill="${pick(["#fff", "#FFE14D"])}" ${TH}/>`;
    }
    s += `<rect class="shade" x="${x}" y="${top}" width="${w}" height="${h + 4}" rx="6" fill="#0B1640"/>`;
    s += `<g class="no">${lit}</g>`;
    x += w + Math.round(8 + r() * 18);
    i++;
  }
  return s;
}
function farTile() {
  const r = seeded(3);
  let x = 0, s = "";
  while (x < TW) {
    const w = Math.round(40 + r() * 50), h = Math.round(60 + r() * 70);
    s += `<rect x="${x}" y="${232 - h}" width="${Math.min(w, TW - x)}" height="${h}"/>`;
    x += w;
  }
  return s;
}
function propTile() {
  let s = "", glow = "";
  for (let x = 90; x < TW; x += 260) {
    s += `<rect x="${x - 4}" y="196" width="8" height="46" fill="#8D4E1E" ${TH}/>
          <circle cx="${x}" cy="186" r="22" fill="${C.dino}" ${ST}/><circle cx="${x - 14}" cy="200" r="13" fill="${C.dino}" ${ST}/><circle cx="${x + 14}" cy="198" r="14" fill="${C.dino}" ${ST}/>`;
    const lx = x + 130;
    s += `<rect x="${lx - 3}" y="160" width="6" height="84" fill="#455A64" ${TH}/><path d="M${lx} 162 q0 -10 14 -10 h6" fill="none" stroke="#455A64" stroke-width="6" stroke-linecap="round"/><rect x="${lx + 12}" y="150" width="18" height="8" rx="3" fill="#FFE27A" ${TH}/>`;
    glow += `<path d="M${lx + 14} 158 L${lx - 12} 245 L${lx + 56} 245 L${lx + 28} 158 Z" fill="#FFF3A0" opacity=".35"/><circle cx="${lx + 21}" cy="154" r="14" fill="#FFF3A0" opacity=".6"/>`;
  }
  return { s, glow };
}
function dashTile() {
  let s = "";
  for (let x = 0; x < TW; x += 60) s += `<rect x="${x}" y="268" width="32" height="6" rx="3"/>`;
  return s;
}
const twice = inner => `<g>${inner}</g><g transform="translate(${TW} 0)">${inner}</g>`;

function startDrive() {
  show("drive");
  const el = $("#drive");
  const props = propTile();
  let stars = "";
  const r = seeded(11);
  for (let i = 0; i < 40; i++) stars += `<circle cx="${r() * W}" cy="${r() * 130}" r="${1 + r() * 1.8}" fill="#fff"/>`;
  el.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" class="scene" id="scene">
      <defs><linearGradient id="nightsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B1640"/><stop offset="1" stop-color="#2B3D78"/></linearGradient></defs>
      <rect width="${W}" height="${H}" fill="#29B6F6"/>
      <rect class="no" width="${W}" height="${H}" fill="url(#nightsky)"/>
      <g class="no">${stars}</g>
      <circle class="dayon" cx="250" cy="46" r="28" fill="${C.hub}" ${ST}/>
      <path class="no" d="M250 20 a26 26 0 1 0 22 40 a20 20 0 1 1 -22 -40z" fill="#FFE27A" ${ST}/>
      <g class="dayon" fill="#fff" ${TH}>
        <path d="M60 70 a16 16 0 0 1 26 -14 a18 18 0 0 1 34 4 a12 12 0 0 1 4 24 h-62 a12 12 0 0 1 -2 -14z"/>
        <path d="M330 50 a12 12 0 0 1 19 -11 a14 14 0 0 1 26 3 a9 9 0 0 1 3 17 h-46 a9 9 0 0 1 -2 -9z"/>
      </g>
      <g class="far" id="lFar">${twice(farTile())}</g>
      <g id="lBld">${twice(buildingTile())}</g>
      <rect y="230" width="${W}" height="22" fill="#CFD8DC" ${ST}/>
      <g id="lSeam">${twice(Array.from({ length: 34 }, (_, i) => `<path d="M${i * 40} 232 V250" stroke="#90A4AE" stroke-width="2"/>`).join(""))}</g>
      <rect y="250" width="${W}" height="50" fill="#3D4657"/>
      <g id="lDash" fill="#FFE14D">${twice(dashTile())}</g>
      <g id="lProp">${twice(props.s)}</g>
      <rect class="shade" y="228" width="${W}" height="72" fill="#0B1640"/>
      <g id="lGlow" class="no">${twice(props.glow)}</g>
      <g id="boefLayer"></g>
      <g transform="translate(118 168) scale(1.1)"><g id="carWrap"><g id="dcar" class="carbob">${carSVG({ glow: true, cone: true })}</g></g></g>
      <g id="dfx"></g>
    </svg>
    <div class="jail" id="jail"><span class="bars">${ICONS.bars}</span><span class="num" id="jnum">0</span><span class="tally" id="tally"></span></div>
    <div class="bar">
      <button class="btn" id="bHorn" aria-label="Toeter">${ICONS.horn}</button>
      <button class="btn" id="bSiren" aria-label="Sirene">${ICONS.siren}</button>
      <button class="btn" id="bNight" aria-label="Dag en nacht">${ICONS.moon}</button>
      <button class="btn" id="bBoef" aria-label="Boef">${ICONS.boef}</button>
      <button class="btn" id="bGarage" aria-label="Opnieuw bouwen">${ICONS.wrench}</button>
    </div>`;
  homeButton(el, () => { renderHome(); show("home"); });

  D = {
    dist: 0, speed: 0, target: 2.4, siren: false, night: false, count: 0, boef: null,
    last: performance.now(), raf: 0, spawnT: 0, boefSaid: 0,
    layers: [["#lFar", .25], ["#lBld", .6], ["#lSeam", 1], ["#lDash", 1], ["#lProp", 1], ["#lGlow", 1]].map(([s, f]) => [$(s), f]),
    wheels: [...el.querySelectorAll("#dcar .spin")],
    scene: $("#scene")
  };
  $("#bHorn").addEventListener("click", () => { sfx.honk(); bounceCar(); });
  $("#bSiren").addEventListener("click", e => {
    D.siren = !D.siren;
    e.currentTarget.classList.toggle("on", D.siren);
    D.scene.classList.toggle("siren", D.siren);
    D.target = D.siren ? 4.4 : 2.4;
    if (D.siren) { say("sirene_aan"); sirenOn(); } else sirenOff();
  });
  $("#bNight").addEventListener("click", e => {
    D.night = !D.night;
    D.scene.classList.toggle("night", D.night);
    e.currentTarget.innerHTML = D.night ? ICONS.sun : ICONS.moon;
    say(D.night ? "nacht" : "dag");
  });
  $("#bBoef").addEventListener("click", () => { if (!D.boef) spawnBoef(true); else say("boef_daar"); });
  $("#bGarage").addEventListener("click", () => { sfx.pop(); startBuild(); });
  $("#dcar").addEventListener("pointerdown", e => {
    const pt = stagePoint(e);
    if (pt.y < 168 + 55 * 1.1 && pt.x > 118 + 60 * 1.1 && pt.x < 118 + 150 * 1.1) say("dino_hallo"); else sfx.honk();
    bounceCar();
  });
  say("rijden");
  D.spawnT = setTimeout(() => spawnBoef(true), 6000);
  D.raf = requestAnimationFrame(tick);
}
function stopDrive() {
  if (!D) return;
  cancelAnimationFrame(D.raf); clearTimeout(D.spawnT);
  sirenOff();
  D = null;
}
function bounceCar() {
  const c = $("#carWrap");
  c.classList.remove("bounce"); void c.getBBox(); c.classList.add("bounce");
}
function tick(now) {
  if (!D) return;
  const dt = Math.min(0.05, (now - D.last) / 1000); D.last = now;
  D.speed += (D.target - D.speed) * Math.min(1, dt * 2.5);
  const dx = D.speed * dt * 60;
  D.dist += dx;
  D.layers.forEach(([g, f]) => g.setAttribute("transform", `translate(${-((D.dist * f) % TW)} 0)`));
  const deg = (D.dist / 19) * (180 / Math.PI) / 1.1;
  D.wheels.forEach(w => w.setAttribute("transform", `rotate(${deg % 360})`));
  const b = D.boef;
  if (b && !b.caught) {
    b.x -= dx * 0.45;
    b.el.style.transform = `translate(${b.x}px, 250px)`;
    if (b.x < -60) { b.el.remove(); D.boef = null; scheduleSpawn(); }
  }
  D.raf = requestAnimationFrame(tick);
}
function scheduleSpawn() {
  clearTimeout(D.spawnT);
  D.spawnT = setTimeout(() => spawnBoef(false), rnd(9000, 16000));
}
function spawnBoef(announce) {
  if (!D || D.boef) return;
  clearTimeout(D.spawnT);
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute("class", "boef");
  g.innerHTML = boefSVG();
  $("#boefLayer").appendChild(g);
  D.boef = { el: g, x: 720, caught: false };
  g.style.transform = `translate(720px, 250px)`;
  g.addEventListener("pointerdown", e => { e.stopPropagation(); catchBoef(); });
  if (announce || D.boefSaid < 2) { say("boef_daar"); D.boefSaid++; }
}
function catchBoef() {
  const b = D && D.boef;
  if (!b || b.caught) return;
  unlockAudio();
  b.caught = true;
  b.el.classList.add("caught");
  sparkleAt($("#dfx"), b.x, 210, true);
  sfx.cuffs();
  setTimeout(() => {
    b.el.classList.add("fly");
    b.el.style.transform = `translate(600px, 40px) scale(.2)`;
    b.el.style.opacity = ".2";
  }, 350);
  setTimeout(() => {
    b.el.remove();
    if (!D) return;
    D.boef = null;
    D.count++;
    const n = D.count;
    $("#jnum").textContent = n;
    $("#tally").innerHTML = ICONS.mini.repeat(n);
    const j = $("#jail"); j.classList.remove("pop"); void j.offsetWidth; j.classList.add("pop");
    sfx.pop();
    say("tel" + n);
    if (n >= 10) {
      confetti(80); sfx.fanfare();
      setTimeout(() => { if (!D) return; D.count = 0; $("#jnum").textContent = "0"; $("#tally").innerHTML = ""; }, 5000);
    }
    scheduleSpawn();
  }, 1300);
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) { sirenOff(); if (D) { D.siren = false; D.target = 2.4; const b = $("#bSiren"); b && b.classList.remove("on"); D.scene.classList.remove("siren"); } }
  else if (ctx && ctx.state === "suspended") ctx.resume();
});
document.addEventListener("gesturestart", e => e.preventDefault());
document.addEventListener("dblclick", e => e.preventDefault());

renderHome();
show("home");

if ("serviceWorker" in navigator && location.protocol === "https:" && window.self === window.top) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
