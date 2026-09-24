"use strict";
/* foutenlogboek: bewaart de laatste fouten op dit toestel (zichtbaar in de oudersknop van de boerderij) */
const logErr = msg => { try { const l = JSON.parse(localStorage.getItem("xavi-fouten") || "[]"); l.push(new Date().toLocaleString("nl-NL") + " " + String(msg).slice(0, 200)); localStorage.setItem("xavi-fouten", JSON.stringify(l.slice(-15))); } catch (e) {} };
window.addEventListener("error", e => logErr(e.message + " (" + (e.filename || "").split("/").pop() + ":" + e.lineno + ")"));
window.addEventListener("unhandledrejection", e => logErr("promise: " + (e.reason && e.reason.message || e.reason)));
/* Xavi's Speelstad — voertuigen bouwen en rijden (politie, brandweer) */

const W = 667, H = 375;
const INK = "#1B1B2A";
const C = {
  white: "#FFFFFF", blue: "#1E4FD8", glass: "#9FE3FF", tyre: "#1B1B2A", hub: "#FFD600",
  dino: "#22C55E", dinoDark: "#15803D", red: "#FF1744", sblue: "#2979FF", yellow: "#FFC928",
  grey: "#C7CEDB", fred: "#F4262C", orange: "#FF8A00", amb: "#FFD000", tgreen: "#43A047", tdark: "#2E7D32"
};
const ST = `stroke="${INK}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"`;
const TH = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
const SVGNS = "http://www.w3.org/2000/svg";
const $ = s => document.querySelector(s);
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const svgEl = (cls, html) => { const g = document.createElementNS(SVGNS, "g"); if (cls) g.setAttribute("class", cls); if (html) g.innerHTML = html; return g; };

/* ---------- schaal het speelveld naar het scherm ----------
   Staat de telefoon rechtop (bv. rotatievergrendeling aan), dan draaien we het
   speelveld zelf een kwartslag, zodat het dwars vasthouden altijd werkt. */
const stage = $("#stage");
let ROT = false, S = 1, TX = 0, TY = 0;
function fit() {
  const w = innerWidth, h = innerHeight;
  ROT = h > w;
  if (ROT) {
    S = Math.min(h / W, w / H); TX = w - (w - H * S) / 2; TY = (h - W * S) / 2;
    stage.style.transform = `translate(${TX}px, ${TY}px) rotate(90deg) scale(${S})`;
  } else {
    S = Math.min(w / W, h / H); TX = (w - W * S) / 2; TY = (h - H * S) / 2;
    stage.style.transform = `translate(${TX}px, ${TY}px) scale(${S})`;
  }
}
addEventListener("resize", fit);
addEventListener("orientationchange", () => { setTimeout(fit, 100); setTimeout(fit, 500); });
fit();
function stagePoint(e) {
  return ROT ? { x: (e.clientY - TY) / S, y: (TX - e.clientX) / S }
             : { x: (e.clientX - TX) / S, y: (e.clientY - TY) / S };
}

/* ---------- geluid ---------- */
let ctx = null, master = null;
/* Stemmen: elk zinnetje is een los bestandje in audio/. We halen er pas eentje op
   als hij nodig is en bewaren de laatste paar (zuinig op het geheugen van een iPhone 8). */
const buffers = {}, bufOrder = [], BUF_MAX = 40;
let voicesLoaded = true, voiceSrc = null, voiceToken = 0, pendingVoice = null;
let voiceOn = true;
try { voiceOn = localStorage.getItem("xavi-stem") !== "0"; } catch (e) {}

function unlockAudio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  if (!ctx) {
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    prefetchVoices();
  }
  if (ctx.state === "suspended") ctx.resume();
  const b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource();
  s.buffer = b; s.connect(ctx.destination); s.start(0);
}
let fetching = 0;
function grab(url) {
  // eerst de bewaarde kopie (direct en werkt offline), anders van het internet
  const net = () => fetch(url, { cache: "force-cache" });
  if (!("caches" in window)) return net();
  return caches.match(url, { ignoreSearch: true }).then(r => r || net()).catch(net);
}
function getBuf(name) {
  if (buffers[name]) return Promise.resolve(buffers[name]);
  const url = "audio/" + name + ".m4a";
  fetching++;
  const done = v => { fetching = Math.max(0, fetching - 1); return v; };
  const load = () => grab(url).then(r => { if (!r || !r.ok) throw new Error("geen stem " + name); return r.arrayBuffer(); });
  return load().catch(() => load())   // één herkansing
    .then(ab => new Promise((res, rej) => ctx.decodeAudioData(ab, b => {
      buffers[name] = b; bufOrder.push(name);
      while (bufOrder.length > BUF_MAX) delete buffers[bufOrder.shift()];   // alleen de laatste zinnetjes bewaren
      res(done(b));
    }, e => rej(done(e)))))
    .catch(e => { done(); throw e; });
}
/* De zinnetjes rustig op de achtergrond ophalen, zodat ze ook zonder internet klaarstaan. */
function prefetchVoices() {
  if (!("caches" in window) || !navigator.onLine) return;
  fetch("voices-index.json").then(r => r.json()).then(list => {
    let i = 0;
    const step = () => {
      if (i >= list.length) return;
      // niets doen zolang er een zinnetje speelt of opgehaald wordt: dat gaat voor
      if (voiceSrc || fetching > 0) { setTimeout(step, 1500); return; }
      const n = list[i++];
      caches.match("audio/" + n + ".m4a", { ignoreSearch: true })
        .then(hit => hit ? null : fetch("audio/" + n + ".m4a").catch(() => {}))
        .catch(() => {})
        .then(() => setTimeout(step, 700));
    };
    setTimeout(step, 8000);
  }).catch(() => {});
}
/* Wordt een zinnetje onderbroken (Xavi tikt ergens op), dan gaat het spel toch
   door met wat er na dat zinnetje zou komen — anders kan het spel blijven hangen. */
let voiceCb = null;
function playVoice(name, cb) {
  const prev = voiceCb; voiceCb = null;
  if (prev) setTimeout(() => prev(true), 0);   // true = onderbroken
  if (!ctx || !voiceOn) { cb && setTimeout(cb, voiceOn ? 300 : 120); return; }
  const token = ++voiceToken;
  if (voiceSrc) { try { voiceSrc.onended = null; voiceSrc.stop(); } catch (e) {} voiceSrc = null; }
  voiceCb = cb || null;
  const finish = () => {
    if (token !== voiceToken) return;
    voiceSrc = null;
    const c = voiceCb; voiceCb = null;
    if (c) c();
  };
  const start = buf => {
    if (token !== voiceToken) return;
    const s = ctx.createBufferSource();
    s.buffer = buf; s.connect(master); s.start(0);
    voiceSrc = s;
    s.onended = finish;
  };
  const fail = () => setTimeout(finish, 500);
  if (voicesLoaded || buffers[name]) getBuf(name).then(start).catch(fail);
  else { pendingVoice = { name, t: Date.now(), token, start, fail }; setTimeout(() => { if (pendingVoice && pendingVoice.token === token) { pendingVoice = null; finish(); } }, 4000); }
}
const say = (name, cb) => playVoice(name, cb);
// iOS zet de geluidsmotor uit als de app op de achtergrond gaat: bij terugkomst weer aanzetten
document.addEventListener("visibilitychange", () => { if (!document.hidden && ctx && ctx.state !== "running") ctx.resume().catch(() => {}); });
addEventListener("pageshow", () => { if (ctx && ctx.state !== "running") ctx.resume().catch(() => {}); });
function setVoice(on) {
  voiceOn = on;
  try { localStorage.setItem("xavi-stem", on ? "1" : "0"); } catch (e) {}
  if (!on && voiceSrc) { try { voiceSrc.onended = null; voiceSrc.stop(); } catch (e) {} voiceSrc = null; voiceToken++; voiceCb = null; }
}

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
let noise = null;
function noiseBuffer() {
  if (noise) return noise;
  noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return noise;
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
  fanfare() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i === 3 ? 0.5 : 0.16, "square", 0.09, i * 0.14)); },
  foghorn() {
    if (!ctx) return;
    const t = ctx.currentTime, g = ctx.createGain(), lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 700;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22, t + 0.15);
    g.gain.setValueAtTime(0.22, t + 1.3); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.7);
    [98, 147].forEach(f => { const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = f; o.connect(lp); o.start(t); o.stop(t + 1.75); });
    lp.connect(g).connect(master);
  },
  bell() { [0, 0.35].forEach(d => { tone(1320, 0.3, "triangle", 0.16, d); tone(1980, 0.25, "sine", 0.08, d); }); },
  splash() {
    if (!ctx) return;
    const s = ctx.createBufferSource(), lp = ctx.createBiquadFilter(), g = ctx.createGain(), t = ctx.currentTime;
    s.buffer = noiseBuffer(); lp.type = "lowpass"; lp.frequency.setValueAtTime(2500, t); lp.frequency.exponentialRampToValueAtTime(300, t + 0.5);
    g.gain.setValueAtTime(0.3, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    s.connect(lp).connect(g).connect(master); s.start(t); s.stop(t + 0.7);
  },
  bubbles() { [0, .12, .22, .36, .5].forEach((d, i) => tone(300 + i * 90, 0.08, "sine", 0.12, d, 700 + i * 120)); },
  meow() { tone(760, 0.2, "triangle", 0.14, 0, 540); tone(920, 0.32, "triangle", 0.12, 0.22, 600); },
  sizzle() {
    if (!ctx) return;
    const s = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), g = ctx.createGain(), t = ctx.currentTime;
    s.buffer = noiseBuffer(); hp.type = "highpass"; hp.frequency.value = 2500;
    g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    s.connect(hp).connect(g).connect(master); s.start(t); s.stop(t + 1);
  }
};
let sirenNodes = null;
function sirenOn(freq = 780, depth = 150, rate = 1.25) {
  if (!ctx || sirenNodes) return;
  const o = ctx.createOscillator(), lfo = ctx.createOscillator(), lg = ctx.createGain(), g = ctx.createGain();
  o.type = "triangle"; o.frequency.value = freq;
  lfo.type = "square"; lfo.frequency.value = rate; lg.gain.value = depth;
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
let waterNodes = null;
function waterOn() {
  if (!ctx || waterNodes) return;
  const s = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noiseBuffer(); s.loop = true;
  bp.type = "bandpass"; bp.frequency.value = 1100; bp.Q.value = 0.6;
  g.gain.setValueAtTime(0.0001, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.14, ctx.currentTime + 0.08);
  s.connect(bp).connect(g).connect(master); s.start();
  waterNodes = { s, g };
}
function waterOff() {
  if (!waterNodes) return;
  const { s, g } = waterNodes, t = ctx.currentTime;
  g.gain.setValueAtTime(g.gain.value, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
  s.stop(t + 0.2);
  waterNodes = null;
}

/* ---------- tekeningen: dino ---------- */
const CAP = `<path d="M84 11 q14 -14 30 -2 z" fill="${C.blue}" ${TH}/>
  <rect x="82" y="9" width="36" height="5" rx="2.5" fill="#163A9E" ${TH}/>
  <circle cx="99" cy="4.5" r="2.6" fill="${C.hub}"/>`;
const HELMET = `<path d="M80 13 q18 -24 38 -1 z" fill="${C.fred}" ${TH}/>
  <path d="M99 -4 v14" stroke="${INK}" stroke-width="3"/>
  <rect x="76" y="10" width="46" height="6" rx="3" fill="#B71C1C" ${TH}/>
  <circle cx="99" cy="4" r="3.2" fill="${C.hub}" ${TH}/>`;
const NURSE_CAP = `<path d="M84 11 q14 -14 30 -2 z" fill="#fff" ${TH}/>
  <rect x="82" y="9" width="36" height="5" rx="2.5" fill="#E0E0E0" ${TH}/>
  <path d="M99 -1 l1.8 3.6 4 .6 -2.9 2.8 .7 4 -3.6 -1.9 -3.6 1.9 .7 -4 -2.9 -2.8 4 -.6z" fill="${C.blue}"/>`;
const STRAW = `<ellipse cx="99" cy="10" rx="27" ry="5" fill="#FFD54F" ${TH}/>
  <path d="M86 10 q2 -17 13 -17 q11 0 13 17 z" fill="#FFD54F" ${TH}/>
  <rect x="87" y="3" width="24" height="4" fill="#E53935"/>`;
const PILOT = `<path d="M82 14 q17 -24 36 0 z" fill="#8D6E63" ${TH}/>
  <rect x="83" y="8" width="34" height="7" rx="3.5" fill="#6D4C41" ${TH}/>
  <circle cx="93" cy="11.5" r="4.5" fill="${C.glass}" ${TH}/><circle cx="107" cy="11.5" r="4.5" fill="${C.glass}" ${TH}/>`;
const CAPT = `<path d="M82 12 q17 -21 36 0 z" fill="#fff" ${TH}/>
  <rect x="80" y="9" width="40" height="6" rx="3" fill="${INK}"/>
  <circle cx="99" cy="3" r="3" fill="${C.hub}" ${TH}/>`;
function dinoHead(hat) {
  return `<g transform="translate(0 4)">
    <rect x="88" y="30" width="20" height="24" rx="8" fill="${C.dino}" ${TH}/>
    <path d="M78 22 l5 -9 l4 9 z M81 33 l6 -8 l3 9 z" fill="${C.dinoDark}" ${TH}/>
    <ellipse cx="98" cy="26" rx="17" ry="16" fill="${C.dino}" ${TH}/>
    <ellipse cx="114" cy="29" rx="15" ry="11" fill="${C.dino}" ${TH}/>
    <circle cx="124" cy="26" r="1.8" fill="${C.dinoDark}"/>
    <path d="M108 34 q8 5 16 -1" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>
    <circle cx="105" cy="17" r="8" fill="#fff" ${TH}/><circle cx="107" cy="18" r="4.5" fill="${INK}"/><circle cx="108.6" cy="16" r="1.6" fill="#fff"/>
    ${hat}</g>`;
}
const WHEEL_SVG = `
  <circle r="19" fill="${C.tyre}" ${ST}/>
  <circle r="9" fill="${C.hub}" ${TH}/>
  <circle cy="-4.5" r="2" fill="${INK}"/><circle cy="4.5" r="2" fill="${INK}"/>
  <circle cx="-4.5" r="2" fill="${INK}"/><circle cx="4.5" r="2" fill="${INK}"/>`;

/* ---------- voertuigen ---------- */
const POLICE_WIN = "M58 38 L71 10 L131 10 L148 38 Z";
const FIRE_WIN = "M160 16 H192 Q198 16 202 24 L210 40 H160 Z";
const AMB_WIN = "M148 38 H168 Q176 38 180 46 L186 58 H148 Z";
const TRAC_WIN = "M30 -3 H88 V44 H30 Z";
const PLANE_WIN = "M110 27 Q132 -12 178 27 Z";
const BOAT_WIN = "M104 30 H134 V54 H104 Z";
/* blauw-geel blokjespatroon, zoals op een Nederlandse ambulance */
function checker(x0, w, n) {
  const q = w / n;
  return Array.from({ length: n * 2 }, (_, i) => {
    const col = i % n, row = Math.floor(i / n);
    return `<rect x="${x0 + col * q}" y="${62 + row * 6}" width="${q + .3}" height="6.3" fill="${(col + row) % 2 ? "#FFF59D" : C.blue}"/>`;
  }).join("");
}

const VEH = {
  politie: {
    win: POLICE_WIN,
    parts: {
      siren: { c: [100, -5], w: 34, svg: `
        <path d="M88 2 v-9 a12 10 0 0 1 12 -6 v15z" fill="${C.red}" ${TH}/>
        <path d="M100 2 v-15 a12 10 0 0 1 12 6 v9z" fill="${C.sblue}" ${TH}/>
        <rect x="84" y="0" width="32" height="5" rx="2.5" fill="${C.grey}" ${TH}/>` },
      cabin: { c: [104, 22], w: 132, svg: `
        <path d="M40 44 L62 2 Q64 0 68 0 L136 0 Q140 0 142 3 L168 44 Z" fill="${C.white}" ${ST}/>
        <path d="${POLICE_WIN}" fill="${C.glass}" ${TH}/>
        <path d="M128 15 L119 33" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/>` },
      dino: { c: [102, 22], w: 60, svg: dinoHead(CAP) },
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
      wheel: { c: [0, 0], w: 42, targets: [[44, 88], [152, 88]], cls: "spin", svg: WHEEL_SVG }
    },
    layers: ["siren", "cabin", "dino", "body", "wheel"],
    extra: ({ glow, cone }) =>
      (cone ? `<path class="no" d="M194 50 L360 18 L360 100 Z" fill="#FFF3A0" fill-opacity=".4"/>` : "") +
      (glow ? `<circle class="glow r" cx="90" cy="-8" r="22" fill="${C.red}"/><circle class="glow b" cx="110" cy="-8" r="22" fill="${C.sblue}"/>` : ""),
    steps: [["body", "bouw_body"], ["wheel", "bouw_wiel"], ["wheel", "bouw_wiel2"], ["cabin", "bouw_cabine"], ["siren", "bouw_sirene"], ["dino", "bouw_dino"]],
    build: { x: 130, y: 92, k: 1.6 },
    drive: { x: 118, y: 168, k: 1.1, dino: [60, 150, 55] },
    voices: { klaar: "klaar", hallo: "dino_hallo" },
    siren: [780, 150, 1.25],
    buttons: ["horn", "siren", "night", "boef", "garage"],
    counter: { icon: "bars", mini: "mini", voice: "tel" }
  },

  brandweer: {
    win: FIRE_WIN,
    parts: {
      body: { c: [112, 55], w: 232, svg: `
        <rect x="-4" y="79" width="232" height="9" rx="4.5" fill="${C.grey}" ${TH}/>
        <rect x="0" y="22" width="152" height="64" rx="10" fill="${C.fred}"/>
        <rect x="2" y="60" width="148" height="11" fill="${C.hub}"/>
        <path d="M40 26 V56 M78 26 V56 M116 26 V56" fill="none" stroke="#B71C1C" stroke-width="3" stroke-linecap="round"/>
        <rect x="22" y="44" width="10" height="4" rx="2" fill="${INK}"/><rect x="60" y="44" width="10" height="4" rx="2" fill="${INK}"/>
        <circle cx="132" cy="40" r="12" fill="${C.grey}" ${TH}/><circle cx="132" cy="40" r="5" fill="${INK}"/>
        <path d="M132 28 a12 12 0 0 1 12 12" fill="none" stroke="${C.hub}" stroke-width="3"/>
        <rect x="0" y="46" width="8" height="9" rx="3" fill="${C.orange}" ${TH}/>
        <rect x="0" y="22" width="152" height="64" rx="10" fill="none" ${ST}/>` },
      cabin: { c: [186, 47], w: 76, svg: `
        <path d="M150 86 V16 Q150 8 158 8 H194 Q204 8 210 18 L222 42 V86 Z" fill="${C.fred}"/>
        <rect x="151" y="60" width="70" height="11" fill="${C.hub}"/>
        <path d="${FIRE_WIN}" fill="${C.glass}" ${TH}/>
        <path d="M186 44 V82" fill="none" ${TH}/>
        <rect x="192" y="48" width="10" height="4" rx="2" fill="${INK}"/>
        <rect x="212" y="47" width="12" height="9" rx="3" fill="#FFE27A" ${TH}/>
        <path d="M150 86 V16 Q150 8 158 8 H194 Q204 8 210 18 L222 42 V86 Z" fill="none" ${ST}/>` },
      dino: { c: [184, 30], w: 50, svg: `<g transform="translate(184 32) scale(.78) translate(-102 -22)">${dinoHead(HELMET)}</g>` },
      siren: { c: [180, 2], w: 32, svg: `
        <path d="M166 7 v-5 a7 6 0 0 1 14 0 v5z" fill="${C.sblue}" ${TH}/>
        <path d="M180 7 v-5 a7 6 0 0 1 14 0 v5z" fill="${C.sblue}" ${TH}/>
        <rect x="163" y="6" width="34" height="5" rx="2.5" fill="${C.grey}" ${TH}/>` },
      ladder: { c: [78, 13], w: 146, cls: "ladderRot", svg: `
        <rect x="134" y="8" width="12" height="16" rx="3" fill="#90A4AE" ${TH}/>
        <rect x="8" y="5" width="140" height="6" rx="3" fill="#ECEFF1" ${TH}/>
        <rect x="8" y="15" width="140" height="6" rx="3" fill="#ECEFF1" ${TH}/>
        <path d="${Array.from({ length: 10 }, (_, i) => `M${18 + i * 13} 9 V17`).join(" ")}" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>` },
      wheel: { c: [0, 0], w: 42, targets: [[40, 90], [106, 90], [186, 90]], cls: "spin", svg: WHEEL_SVG }
    },
    layers: ["body", "cabin", "dino", "siren", "ladder", "wheel"],
    extra: ({ glow, cone }) =>
      (cone ? `<path class="no" d="M222 52 L390 20 L390 104 Z" fill="#FFF3A0" fill-opacity=".4"/>` : "") +
      (glow ? `<circle class="glow r" cx="173" cy="0" r="20" fill="${C.sblue}"/><circle class="glow b" cx="187" cy="0" r="20" fill="${C.sblue}"/>` : ""),
    steps: [["body", "bouw_body"], ["wheel", "bouw_wiel"], ["wheel", "bouw_wiel2"], ["wheel", "bouw_wiel3"], ["cabin", "bouw_cabine_b"],
      ["ladder", "bouw_ladder"], ["siren", "bouw_lichten"], ["dino", "bouw_dino_b"]],
    build: { x: 112, y: 124, k: 1.4 },
    drive: { x: 96, y: 179, k: 1, dino: [150, 222, 45] },
    voices: { klaar: "klaar_b", hallo: "dino_hallo_b" },
    siren: [620, 130, 0.9],
    buttons: ["horn", "siren", "night", "ladder", "garage"],
    counter: { icon: "flame", mini: "drop", voice: "blus" },
    pivot: [141, 13], ladderMax: 40
  },

  ambulance: {
    win: AMB_WIN,
    parts: {
      body: { c: [99, 49], w: 206, svg: `
        <rect x="-4" y="79" width="206" height="9" rx="4.5" fill="${C.grey}" ${TH}/>
        <rect x="0" y="10" width="142" height="76" rx="12" fill="${C.amb}"/>
        ${checker(0, 140, 10)}
        <text x="92" y="43" text-anchor="middle" font-family="Baloo 2, Arial Rounded MT Bold, sans-serif" font-weight="800" font-size="12" letter-spacing=".5" fill="${C.blue}">AMBULANCE</text>
        <rect x="0" y="46" width="8" height="9" rx="3" fill="${C.red}" ${TH}/>
        <rect x="0" y="10" width="142" height="76" rx="12" fill="none" ${ST}/>` },
      sticker: { c: [30, 36], w: 40, svg: `<g transform="translate(30 36)">
        ${[0, 60, 120].map(a => `<rect x="-5.5" y="-17" width="11" height="34" rx="2" transform="rotate(${a})" fill="none" stroke="${INK}" stroke-width="6"/>`).join("")}
        ${[0, 60, 120].map(a => `<rect x="-5.5" y="-17" width="11" height="34" rx="2" transform="rotate(${a})" fill="${C.blue}"/>`).join("")}
        <path d="M0 -11 V11 M-3 -5 q6 3 0 6 q-6 3 0 6" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></g>` },
      cabin: { c: [169, 58], w: 62, svg: `
        <path d="M140 86 V34 Q140 30 144 30 H170 Q182 30 188 42 L198 60 V86 Z" fill="${C.amb}"/>
        ${checker(140, 58, 4)}
        <path d="${AMB_WIN}" fill="${C.glass}" ${TH}/>
        <path d="M160 40 V84" fill="none" stroke="${INK}" stroke-width="2" opacity=".5"/>
        <rect x="188" y="64" width="10" height="8" rx="3" fill="#FFE27A" ${TH}/>
        <path d="M140 86 V34 Q140 30 144 30 H170 Q182 30 188 42 L198 60 V86 Z" fill="none" ${ST}/>` },
      dino: { c: [166, 48], w: 40, svg: `<g transform="translate(166 50) scale(.6) translate(-102 -22)">${dinoHead(NURSE_CAP)}</g>` },
      siren: { c: [128, 7], w: 34, svg: `
        <path d="M114 10 v-5 a7 6 0 0 1 14 0 v5z" fill="${C.sblue}" ${TH}/>
        <path d="M128 10 v-5 a7 6 0 0 1 14 0 v5z" fill="${C.sblue}" ${TH}/>
        <rect x="111" y="9" width="34" height="4" rx="2" fill="${C.grey}" ${TH}/>` },
      wheel: { c: [0, 0], w: 42, targets: [[40, 90], [162, 90]], cls: "spin", svg: WHEEL_SVG }
    },
    layers: ["body", "sticker", "cabin", "dino", "siren", "wheel"],
    extra: ({ glow, cone }) =>
      (cone ? `<path class="no" d="M198 66 L360 34 L360 110 Z" fill="#FFF3A0" fill-opacity=".4"/>` : "") +
      (glow ? `<circle class="glow r" cx="121" cy="4" r="20" fill="${C.sblue}"/><circle class="glow b" cx="135" cy="4" r="20" fill="${C.sblue}"/>` : ""),
    steps: [["body", "bouw_body"], ["wheel", "bouw_wiel"], ["wheel", "bouw_wiel2"], ["cabin", "bouw_cabine_b"],
      ["sticker", "bouw_ster"], ["siren", "bouw_lichten"], ["dino", "bouw_dino_a"]],
    build: { x: 122, y: 114, k: 1.5 },
    drive: { x: 110, y: 174, k: 1.05, dino: [140, 198, 60] },
    voices: { klaar: "klaar_a", hallo: "dino_hallo_a" },
    siren: [720, 160, 1.1],
    buttons: ["horn", "siren", "night", "kit", "garage"],
    counter: { icon: "heart", mini: "minih", voice: "help" }
  },

  tractor: {
    world: "farm",
    win: TRAC_WIN,
    parts: {
      cabin: { c: [58, 28], w: 94, svg: `
        <path d="${TRAC_WIN}" fill="${C.glass}" ${TH}/>
        <path d="M76 2 L64 30" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/>
        <rect x="22" y="-6" width="9" height="74" rx="3" fill="${C.tdark}" ${TH}/>
        <rect x="87" y="-6" width="9" height="52" rx="3" fill="${C.tdark}" ${TH}/>
        <rect x="12" y="-15" width="94" height="12" rx="5" fill="${C.tgreen}" ${ST}/>` },
      dino: { c: [60, 18], w: 56, svg: `<g transform="translate(60 18) scale(.85) translate(-102 -22)">${dinoHead(STRAW)}</g>` },
      body: { c: [102, 62], w: 204, svg: `
        <path d="M8 80 A42 42 0 0 1 92 80" fill="none" stroke="${INK}" stroke-width="15" stroke-linecap="round"/>
        <path d="M8 80 A42 42 0 0 1 92 80" fill="none" stroke="${C.tgreen}" stroke-width="8" stroke-linecap="round"/>
        <rect x="20" y="66" width="172" height="20" rx="6" fill="${C.tdark}" ${ST}/>
        <rect x="84" y="38" width="112" height="46" rx="12" fill="${C.tgreen}" ${ST}/>
        <rect x="86" y="52" width="108" height="8" fill="${C.hub}"/>
        <path d="M110 42 V80 M130 42 V80" stroke="${C.tdark}" stroke-width="3"/>
        <rect x="186" y="44" width="14" height="36" rx="4" fill="#B0BEC5" ${TH}/>
        <path d="M188 52 h10 M188 60 h10 M188 68 h10" stroke="${INK}" stroke-width="2"/>
        <rect x="192" y="34" width="10" height="9" rx="3" fill="#FFE27A" ${TH}/>` },
      exhaust: { c: [150, 22], w: 22, svg: `
        <rect x="145" y="6" width="10" height="36" rx="3" fill="#9E9E9E" ${TH}/>
        <rect x="141" y="2" width="18" height="7" rx="3" fill="#616161" ${TH}/>` },
      bigwheel: { c: [0, 0], w: 70, r: 34, targets: [[50, 76]], cls: "spin", svg: `
        <circle r="34" fill="${C.tyre}" ${ST}/>
        <circle r="30" fill="none" stroke="#4E4E5E" stroke-width="6" stroke-dasharray="6 6"/>
        <circle r="15" fill="${C.hub}" ${TH}/>
        <circle cy="-7" r="2.4" fill="${INK}"/><circle cy="7" r="2.4" fill="${INK}"/>
        <circle cx="-7" r="2.4" fill="${INK}"/><circle cx="7" r="2.4" fill="${INK}"/>` },
      wheel: { c: [0, 0], w: 42, r: 19, targets: [[166, 90]], cls: "spin", svg: WHEEL_SVG }
    },
    layers: ["cabin", "dino", "body", "exhaust", "bigwheel", "wheel"],
    extra: ({ glow, cone }) =>
      (cone ? `<path class="no" d="M200 40 L360 12 L360 96 Z" fill="#FFF3A0" fill-opacity=".4"/>` : "") +
      (glow ? `<g>${[0, 1, 2].map(i => `<circle class="puff" style="animation-delay:${i * .5}s" cx="150" cy="-6" r="${8 - i}" fill="#B0BEC5" opacity=".8"/>`).join("")}</g>` : ""),
    steps: [["body", "bouw_body_t"], ["bigwheel", "bouw_groot"], ["wheel", "bouw_klein"], ["cabin", "bouw_cabine"],
      ["exhaust", "bouw_uitlaat"], ["dino", "bouw_dino_t"]],
    build: { x: 132, y: 110, k: 1.5 },
    drive: { x: 110, y: 176, k: 1, dino: [30, 88, 40] },
    voices: { klaar: "klaar_t", hallo: "dino_hallo_t" },
    buttons: ["horn", "night", "animal", "garage"],
    counter: { icon: "star", mini: "ministar", voice: "blij" }
  },

  vliegtuig: {
    world: "sky",
    win: PLANE_WIN,
    parts: {
      tail: { c: [22, 26], w: 50, svg: `
        <path d="M2 44 H38 L30 54 H6 Z" fill="${C.fred}" ${TH}/>
        <path d="M10 34 L2 0 H20 L46 30 Z" fill="${C.fred}" ${ST}/>` },
      body: { c: [108, 45], w: 212, svg: `
        <path d="M6 32 L44 26 H150 Q200 28 208 45 Q200 62 150 64 H44 L8 54 Z" fill="#fff"/>
        <path d="${PLANE_WIN}" fill="${C.glass}" ${TH}/>
        <path d="M10 47 H200" stroke="${C.fred}" stroke-width="7"/>
        <path d="M186 31 Q208 36 208 45 Q208 54 186 59 Z" fill="${C.fred}"/>
        ${[60, 80, 100].map(x => `<circle cx="${x}" cy="37" r="5" fill="${C.glass}" ${TH}/>`).join("")}
        <path d="M6 32 L44 26 H150 Q200 28 208 45 Q200 62 150 64 H44 L8 54 Z" fill="none" ${ST}/>` },
      dino: { c: [144, 16], w: 50, svg: `<g transform="translate(144 17) scale(.74) translate(-102 -22)">${dinoHead(PILOT)}</g>` },
      wing: { c: [104, 60], w: 80, svg: `<path d="M66 50 H144 L120 72 H84 Z" fill="${C.yellow}" ${ST}/><path d="M80 56 H134" stroke="#E0A800" stroke-width="3"/>` },
      gear: { c: [106, 76], w: 46, svg: `
        <path d="M98 62 L92 80 M114 62 L120 80" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
        <circle cx="92" cy="84" r="9" fill="${C.tyre}" ${ST}/><circle cx="92" cy="84" r="3.5" fill="${C.hub}"/>
        <circle cx="120" cy="84" r="9" fill="${C.tyre}" ${ST}/><circle cx="120" cy="84" r="3.5" fill="${C.hub}"/>` },
      prop: { c: [212, 45], w: 18, svg: `
        <g class="propspin"><ellipse cx="215" cy="45" rx="4" ry="27" fill="#90A4AE" ${TH}/></g>
        <circle cx="211" cy="45" r="6.5" fill="${C.grey}" ${TH}/>` }
    },
    layers: ["tail", "body", "dino", "wing", "gear", "prop"],
    extra: ({ cone }) => cone ? `<path class="no" d="M212 40 L380 8 L380 84 Z" fill="#FFF3A0" fill-opacity=".4"/>` : "",
    steps: [["body", "bouw_romp"], ["wing", "bouw_vleugel"], ["tail", "bouw_staart"], ["prop", "bouw_propeller"],
      ["gear", "bouw_wieltjes"], ["dino", "bouw_dino_v"]],
    build: { x: 128, y: 143, k: 1.45 },
    drive: { x: 120, y: 125, k: 0.9, dino: null },
    voices: { klaar: "klaar_v", hallo: "dino_hallo_v", start: "opstijgen" },
    buttons: ["looping", "night", "game", "garage"],
    counter: { icon: "star", mini: "ministar", voice: "ster" }
  },

  boot: {
    world: "sea",
    win: BOAT_WIN,
    parts: {
      mast: { c: [36, 4], w: 70, svg: `
        <rect x="46" y="-44" width="7" height="104" rx="3" fill="#8D6E63" ${TH}/>
        <path d="M45 -38 L45 50 L6 50 Z" fill="#fff" ${ST}/>
        <path d="M45 14 V26 H17 L22 14 Z" fill="${C.fred}"/>
        <path d="M53 -44 L72 -38 L53 -32 Z" fill="${C.sblue}" ${TH}/>` },
      cabin: { c: [136, 38], w: 94, svg: `
        <rect x="96" y="20" width="80" height="44" rx="6" fill="#fff" ${ST}/>
        <path d="${BOAT_WIN}" fill="${C.glass}" ${TH}/>
        <circle cx="146" cy="34" r="5" fill="${C.glass}" ${TH}/>
        <rect x="90" y="12" width="92" height="10" rx="4" fill="${C.blue}" ${ST}/>` },
      dino: { c: [119, 40], w: 40, svg: `<g transform="translate(119 43) scale(.62) translate(-102 -22)">${dinoHead(CAPT)}</g>` },
      funnel: { c: [158, 0], w: 24, svg: `
        <rect x="148" y="-14" width="20" height="28" fill="${C.fred}" ${ST}/>
        <rect x="148" y="-14" width="20" height="7" fill="${INK}"/>` },
      buoy: { c: [166, 48], w: 26, svg: `
        <circle cx="166" cy="48" r="10" fill="none" stroke="${INK}" stroke-width="10"/>
        <circle cx="166" cy="48" r="10" fill="none" stroke="#fff" stroke-width="6"/>
        <circle cx="166" cy="48" r="10" fill="none" stroke="${C.fred}" stroke-width="6" stroke-dasharray="7.85 7.85"/>` },
      hull: { c: [110, 78], w: 226, svg: `
        <path d="M-2 58 H222 L198 98 H22 Z" fill="${C.fred}"/>
        <path d="M-2 58 H222 L217 67 H3 Z" fill="#fff"/>
        <text x="150" y="88" text-anchor="middle" font-family="Baloo 2, Arial Rounded MT Bold, sans-serif" font-weight="800" font-size="15" letter-spacing="1" fill="#fff">XAVI</text>
        <path d="M-2 58 H222 L198 98 H22 Z" fill="none" ${ST}/>` }
    },
    layers: ["mast", "cabin", "dino", "funnel", "buoy", "hull"],
    extra: ({ glow, cone }) =>
      (cone ? `<path class="no" d="M178 36 L360 10 L360 80 Z" fill="#FFF3A0" fill-opacity=".4"/>` : "") +
      (glow ? `<g>${[0, 1, 2].map(i => `<circle class="puff" style="animation-delay:${i * .5}s" cx="158" cy="-22" r="${9 - i}" fill="#B0BEC5" opacity=".8"/>`).join("")}</g>` : ""),
    steps: [["hull", "bouw_romp_b"], ["cabin", "bouw_kajuit"], ["mast", "bouw_mast"], ["funnel", "bouw_schoorsteen"],
      ["buoy", "bouw_boei"], ["dino", "bouw_dino_k"]],
    build: { x: 140, y: 146, k: 1.3 },
    drive: { x: 70, y: 150, k: 0.78, dino: null },
    voices: { klaar: "klaar_boot", hallo: "dino_hallo_boot", start: "varen" },
    horn: "foghorn",
    buttons: ["horn", "night", "vis", "dz", "garage"],
    counter: { icon: "star", mini: "ministar", voice: "n" }
  }
};

function partInner(p) { return `<g transform="translate(${-p.c[0]} ${-p.c[1]})">${p.svg}</g>`; }
let uid = 0;
/* volledige auto in auto-coördinaten */
function carSVG(v, opts = {}) {
  const id = "win" + (++uid);
  let s = `<defs><clipPath id="${id}"><path d="${v.win}"/></clipPath></defs>` + v.extra(opts);
  v.layers.forEach(k => {
    const p = v.parts[k];
    (p.targets || [p.c]).forEach(t => {
      let g = `<g transform="translate(${t[0]} ${t[1]})"><g class="${p.cls || ""}"${p.r ? ` data-r="${p.r}"` : ""}>${partInner(p)}</g></g>`;
      if (k === "dino") g = `<g clip-path="url(#${id})">${g}</g>`;
      s += g;
    });
  });
  return s;
}

const ICONS = {
  home: `<svg viewBox="0 0 40 40"><path d="M6 20 L20 7 L34 20 V34 H24 V25 H16 V34 H6 Z" fill="#FF5A5F" ${TH}/></svg>`,
  play: `<svg viewBox="0 0 40 40"><path d="M13 8 L32 20 L13 32 Z" fill="#fff" ${ST}/></svg>`,
  horn: `<svg viewBox="0 0 40 40"><path d="M6 16 H12 L28 6 V34 L12 24 H6 Z" fill="#FF8A00" ${TH}/><path d="M32 14 q4 6 0 12" fill="none" ${TH}/></svg>`,
  siren: `<svg viewBox="0 0 40 40"><path d="M9 30 V20 a11 11 0 0 1 22 0 V30 Z" fill="${C.sblue}" ${TH}/><path d="M20 9 V20" stroke="#fff" stroke-width="3" stroke-linecap="round"/><rect x="5" y="29" width="30" height="6" rx="3" fill="${C.red}" ${TH}/><path d="M4 12 l4 3 M36 12 l-4 3 M20 2 v3" ${TH}/></svg>`,
  sun: `<svg viewBox="0 0 40 40"><g ${TH}><path d="M20 3v5M20 32v5M3 20h5M32 20h5M8 8l3.5 3.5M28.5 28.5L32 32M8 32l3.5-3.5M28.5 11.5L32 8"/></g><circle cx="20" cy="20" r="8" fill="${C.hub}" ${TH}/></svg>`,
  moon: `<svg viewBox="0 0 40 40"><path d="M26 6 a14 14 0 1 0 8 22 a11 11 0 1 1 -8 -22z" fill="#FFE27A" ${TH}/></svg>`,
  boef: `<svg viewBox="0 0 40 40"><path d="M8 12 L12 4 L17 10 M32 12 L28 4 L23 10" fill="#9E9E9E" ${TH}/><circle cx="20" cy="22" r="14" fill="#9E9E9E" ${TH}/><rect x="6" y="15" width="28" height="9" rx="4.5" fill="${INK}"/><circle cx="14" cy="19.5" r="3" fill="#fff"/><circle cx="26" cy="19.5" r="3" fill="#fff"/><ellipse cx="20" cy="29" rx="6" ry="4" fill="#E0E0E0"/><circle cx="20" cy="27" r="2" fill="${INK}"/></svg>`,
  speaker: `<svg viewBox="0 0 40 40"><path d="M8 16 H14 L22 9 V31 L14 24 H8 Z" fill="#FFD600" ${TH}/><path d="M27 14 q5 6 0 12 M31 10 q8 10 0 20" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/></svg>`,
  speakeroff: `<svg viewBox="0 0 40 40"><path d="M8 16 H14 L22 9 V31 L14 24 H8 Z" fill="#CFD8DC" ${TH}/><path d="M27 15 l10 10 M37 15 l-10 10" stroke="${C.red}" stroke-width="4" stroke-linecap="round"/></svg>`,
  wrench: `<svg viewBox="0 0 40 40"><path d="M24 5 a9 9 0 0 0 -8 12 L5 28 a3.5 3.5 0 0 0 5 5 L21 22 a9 9 0 0 0 12 -8 l-5 3 l-4 -1 l-1 -4 z" fill="#B0BEC5" ${TH}/></svg>`,
  ladder: `<svg viewBox="0 0 40 40"><g transform="rotate(-35 20 20)"><rect x="2" y="12" width="36" height="5" rx="2.5" fill="#ECEFF1" ${TH}/><rect x="2" y="23" width="36" height="5" rx="2.5" fill="#ECEFF1" ${TH}/><path d="M9 16 V24 M16 16 V24 M23 16 V24 M30 16 V24" ${TH}/></g></svg>`,
  lock: `<svg viewBox="0 0 48 48"><path d="M15 22 V15 a9 9 0 0 1 18 0 V22" fill="none" stroke="${INK}" stroke-width="5"/><rect x="9" y="20" width="30" height="22" rx="6" fill="${C.hub}" ${ST}/><circle cx="24" cy="31" r="3.5" fill="${INK}"/></svg>`,
  bars: `<svg viewBox="0 0 34 34"><rect x="3" y="3" width="28" height="28" rx="5" fill="#90A4AE" ${TH}/><path d="M11 3 V31 M17 3 V31 M23 3 V31" stroke="${INK}" stroke-width="3"/></svg>`,
  flame: `<svg viewBox="0 0 34 34"><path d="M17 31 C6 30 4 18 13 6 C14 13 18 14 19 8 C29 16 29 30 17 31Z" fill="#FF6D00" ${TH}/><path d="M17 28 C12 27 11 21 16 16 C17 20 20 20 20 18 C23 22 22 27 17 28Z" fill="#FFD600"/></svg>`,
  mini: `<svg viewBox="0 0 20 20"><circle cx="10" cy="11" r="8" fill="#9E9E9E" stroke="${INK}" stroke-width="1.6"/><rect x="2.5" y="7.5" width="15" height="5" rx="2.5" fill="${INK}"/><circle cx="7" cy="10" r="1.5" fill="#fff"/><circle cx="13" cy="10" r="1.5" fill="#fff"/></svg>`,
  animal: `<svg viewBox="0 0 40 40"><path d="M9 13 L3 9 M31 13 L37 9" stroke="#BCAAA4" stroke-width="4" stroke-linecap="round"/><ellipse cx="7" cy="17" rx="5" ry="3" fill="#fff" ${TH}/><ellipse cx="33" cy="17" rx="5" ry="3" fill="#fff" ${TH}/><ellipse cx="20" cy="19" rx="12" ry="13" fill="#fff" ${TH}/><path d="M12 10 q5 -3 7 4 q-4 5 -8 1z" fill="${INK}"/><circle cx="15" cy="17" r="2.2" fill="${INK}"/><circle cx="25" cy="17" r="2.2" fill="${INK}"/><ellipse cx="20" cy="27" rx="9" ry="6" fill="#F8BBD0" ${TH}/><circle cx="17" cy="27" r="1.4" fill="${INK}"/><circle cx="23" cy="27" r="1.4" fill="${INK}"/></svg>`,
  star: `<svg viewBox="0 0 34 34"><path d="M17 3 l4.3 8.8 9.7 1.4 -7 6.8 1.7 9.6 -8.7 -4.6 -8.7 4.6 1.7 -9.6 -7 -6.8 9.7 -1.4z" fill="#FFD600" ${TH}/></svg>`,
  ministar: `<svg viewBox="0 0 20 20"><path d="M10 1.5 l2.6 5.3 5.8 .8 -4.2 4.1 1 5.8 -5.2 -2.7 -5.2 2.7 1 -5.8 -4.2 -4.1 5.8 -.8z" fill="#FFD600" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
  looping: `<svg viewBox="0 0 40 40"><path d="M21 7 a13 13 0 1 1 -12 8" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M21 7 a13 13 0 1 1 -12 8" fill="none" stroke="#FF8A00" stroke-width="2.5" stroke-linecap="round"/><path d="M3 11 l6 5 l5 -7" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  balloon: `<svg viewBox="0 0 40 40"><path d="M20 29 q-4 5 1 9" stroke="${INK}" fill="none" stroke-width="2"/><ellipse cx="20" cy="15" rx="11" ry="13" fill="#FF4081" ${TH}/><path d="M17 28.5 h6 l-3 -3z" fill="#FF4081" ${TH}/><ellipse cx="16" cy="10" rx="3" ry="4.5" fill="#fff" opacity=".7"/></svg>`,
  plane: `<svg viewBox="0 0 40 40"><path d="M4 22 L10 12 L14 18 H30 Q38 19 38 22 Q38 26 30 26 H8 Z" fill="#fff" ${TH}/><path d="M16 22 L24 34 L28 34 L24 22Z" fill="${C.yellow}" ${TH}/></svg>`,
  fishbtn: `<svg viewBox="0 0 40 40"><path d="M30 20 L38 12 V28 Z" fill="#FF8A00" ${TH}/><ellipse cx="18" cy="20" rx="15" ry="10" fill="#FF8A00" ${TH}/><circle cx="10" cy="18" r="2.5" fill="${INK}"/><path d="M18 14 q4 6 0 12" fill="none" stroke="${INK}" stroke-width="2"/></svg>`,
  boei: `<svg viewBox="0 0 60 60"><path d="M2 40 q7 -6 14 0 t14 0 t14 0 t14 0" fill="none" stroke="#29B6F6" stroke-width="5" stroke-linecap="round"/><circle cx="30" cy="28" r="14" fill="none" stroke="${INK}" stroke-width="12"/><circle cx="30" cy="28" r="14" fill="none" stroke="#fff" stroke-width="8"/><circle cx="30" cy="28" r="14" fill="none" stroke="${C.fred}" stroke-width="8" stroke-dasharray="11 11"/></svg>`,
  anker: `<svg viewBox="0 0 60 60"><path d="M2 14 q7 -6 14 0 t14 0 t14 0 t14 0" fill="none" stroke="#29B6F6" stroke-width="5" stroke-linecap="round"/><g fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"><path d="M30 22 V54 M20 30 H40 M14 44 q16 16 32 0"/></g><g fill="none" stroke="#546E7A" stroke-width="4" stroke-linecap="round"><path d="M30 22 V54 M20 30 H40 M14 44 q16 16 32 0"/></g><circle cx="30" cy="20" r="5" fill="#fff" ${TH}/></svg>`,
  kit: `<svg viewBox="0 0 40 40"><path d="M15 11 V7 h10 v4" fill="none" ${TH}/><rect x="4" y="11" width="32" height="23" rx="5" fill="#fff" ${TH}/><path d="M17 15 h6 v5 h5 v6 h-5 v5 h-6 v-5 h-5 v-6 h5 z" fill="#22C55E" ${TH}/></svg>`,
  heart: `<svg viewBox="0 0 34 34"><path d="M17 29 C4 20 2 12 6 7 C10 3 15 5 17 9 C19 5 24 3 28 7 C32 12 30 20 17 29Z" fill="#FF4081" ${TH}/></svg>`,
  minih: `<svg viewBox="0 0 20 20"><path d="M10 17 C2 12 1 7 3.5 4.5 C6 2 9 3 10 5.5 C11 3 14 2 16.5 4.5 C19 7 18 12 10 17Z" fill="#FF4081" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/></svg>`,
  drop: `<svg viewBox="0 0 20 20"><path d="M10 2 C14 8 16 11 16 13.5 a6 6 0 0 1 -12 0 C4 11 6 8 10 2Z" fill="#29B6F6" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/></svg>`
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
const CAT_SVG = `
  <path d="M9 -6 q20 -2 16 -22" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>
  <path d="M9 -6 q20 -2 16 -22" fill="none" stroke="${C.orange}" stroke-width="4.5" stroke-linecap="round"/>
  <ellipse cy="-12" rx="13" ry="12" fill="${C.orange}" ${TH}/>
  <path d="M-11 -32 L-10 -46 L-2 -38 Z M11 -32 L10 -46 L2 -38 Z" fill="${C.orange}" ${TH}/>
  <circle cy="-31" r="12" fill="${C.orange}" ${TH}/>
  <circle cx="-4.5" cy="-33" r="2.3" fill="${INK}"/><circle cx="4.5" cy="-33" r="2.3" fill="${INK}"/>
  <path d="M-2 -28 h4 l-2 2.5z" fill="#F48FB1"/>
  <path d="M-6 -27 l-9 -2 M-6 -25 l-9 2 M6 -27 l9 -2 M6 -25 l9 2" stroke="${INK}" stroke-width="1.3"/>`;

function flameSVG() {
  return `<g class="flick"><path d="M0 0 C-15 -3 -17 -22 -5 -42 C-3 -30 5 -28 4 -42 C19 -28 17 -4 0 0Z" fill="#FF6D00" ${TH}/>
    <path d="M0 -4 C-8 -5 -9 -16 -2 -26 C1 -18 6 -17 5 -24 C12 -14 9 -5 0 -4Z" fill="#FFD600"/></g>`;
}
/* ---------- effecten ---------- */
function sparkleAt(layer, x, y, big = false, colors) {
  const g = svgEl();
  g.setAttribute("transform", `translate(${x} ${y})`);
  const n = big ? 12 : 8, rr = big ? 70 : 46;
  let s = "";
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    s += `<path d="M${Math.cos(a) * rr * .45} ${Math.sin(a) * rr * .45} L${Math.cos(a) * rr} ${Math.sin(a) * rr}" stroke="${pick(colors || ["#FFD600", "#fff", "#FF5A5F", "#2979FF"])}" stroke-width="6" stroke-linecap="round"/>`;
  }
  g.innerHTML = `<g class="spark">${s}<circle r="${rr * .3}" fill="#FFE14D" opacity=".7"/></g>`;
  layer.appendChild(g);
  setTimeout(() => g.remove(), 700);
}
function heartsAt(layer, x, y) {
  for (let i = 0; i < 5; i++) {
    const g = svgEl();
    g.setAttribute("transform", `translate(${x + rnd(-30, 30)} ${y + rnd(-10, 10)})`);
    g.innerHTML = `<g class="rise" style="animation-delay:${i * 0.12}s"><path d="M0 8 C-10 0 -12 -6 -8 -10 C-5 -13 -1 -12 0 -8 C1 -12 5 -13 8 -10 C12 -6 10 0 0 8Z" fill="#FF4081" ${TH}/></g>`;
    layer.appendChild(g);
    setTimeout(() => g.remove(), 1800);
  }
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
  ["home", "build", "drive", "farm", "bouw", "winkel", "vervoer", "trein", "taxi", "dino"].forEach(s => { $("#" + s).hidden = s !== id; });
  if (current === "drive" && id !== "drive") stopDrive();
  if (current === "farm" && id !== "farm" && typeof farmStop === "function") farmStop();
  if (current === "bouw" && id !== "bouw" && typeof bouwStop === "function") bouwStop();
  if (current === "winkel" && id !== "winkel" && typeof winkelStop === "function") winkelStop();
  if (current === "vervoer" && id !== "vervoer" && typeof vervoerStop === "function") vervoerStop();
  if (current === "trein" && id !== "trein" && typeof treinStop === "function") treinStop();
  if (current === "taxi" && id !== "taxi" && typeof taxiStop === "function") taxiStop();
  if (current === "dino" && id !== "dino" && typeof dinoStop === "function") dinoStop();
  if (current === "build" && id !== "build") clearBuildTimers();
  current = id;
}
function homeButton(parent) {
  const b = document.createElement("button");
  b.className = "btn home-btn"; b.setAttribute("aria-label", "Naar huis");
  b.innerHTML = ICONS.home;
  b.addEventListener("click", () => { sfx.pop(); renderHome(); show("home"); });
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
        <svg viewBox="-20 -40 236 190"><g transform="translate(0 10)">${carSVG(VEH.politie)}</g></svg>
      </div>
      <div class="tile active" id="tBrand" role="button" aria-label="Brandweer">
        <svg viewBox="-16 -30 262 170"><g transform="translate(0 12)">${carSVG(VEH.brandweer)}</g></svg>
      </div>
      <div class="tile active" id="tAmbu" role="button" aria-label="Ambulance">
        <svg viewBox="-16 -26 234 160"><g transform="translate(0 12)">${carSVG(VEH.ambulance)}</g></svg>
      </div>
      <div class="tile active" id="tPlane" role="button" aria-label="Vliegtuig">
        <svg viewBox="-12 -24 240 132"><g transform="translate(0 6)">${carSVG(VEH.vliegtuig)}</g></svg>
      </div>
      <div class="tile active" id="tBoot" role="button" aria-label="Boot">
        <svg viewBox="-10 -52 238 158"><g transform="translate(0 4)">${carSVG(VEH.boot)}</g></svg>
      </div>
      <div class="tile active" id="tTractor" role="button" aria-label="Tractor">
        <svg viewBox="-14 -34 232 164"><g transform="translate(0 10)">${carSVG(VEH.tractor)}</g></svg>
      </div>
    </div>
    <button class="bigbtn" id="tFarm" aria-label="Mijn boerderij">
      <svg viewBox="0 0 200 64"><path d="M6 62 V32 L32 14 L58 32 V62 Z" fill="#E53935" ${TH}/><rect x="23" y="42" width="18" height="20" fill="#fff" ${TH}/>
        <g transform="translate(94 63) scale(.72)"><g class="animal fine">${ANIMALS.koe}</g></g>
        <g transform="translate(146 63) scale(.72)"><g class="animal fine">${ANIMALS.varken}</g></g>
        <g transform="translate(184 63) scale(.62)"><g class="animal fine">${ANIMALS.kip}</g></g></svg>
      <span>Mijn boerderij</span></button>
    <button class="bigbtn b2" id="tBouw" aria-label="Mijn bouwstad">
      <svg viewBox="0 0 200 64">${typeof machSVG === "function" ? `${BDEFS}<g transform="translate(62 62) scale(.24)">${machSVG("graaf")}</g><g transform="translate(160 62) scale(.24)">${machSVG("kiep")}</g>` : ""}</svg>
      <span>Mijn bouwstad</span></button>
    <button class="bigbtn b3" id="tWinkel" aria-label="De supermarkt">
      <svg viewBox="0 0 200 64"><rect x="6" y="14" width="76" height="44" rx="6" fill="#FF8A00" ${TH}/><path d="M6 14 h76 l-6 -10 h-64 z" fill="#FFD54F" ${TH}/><path d="M16 26 h56 M16 38 h36" stroke="#fff" stroke-width="5"/>
        <g transform="translate(112 14) scale(1.05)">${typeof SPUL !== "undefined" ? SPUL.melk.svg : ""}</g><g transform="translate(152 14) scale(1.05)">${typeof SPUL !== "undefined" ? SPUL.appel.svg : ""}</g></svg>
      <span>Supermarkt</span></button>
    <button class="bigbtn b4" id="tBus" aria-label="Bus en trein">
      <svg viewBox="0 0 200 64"><g transform="translate(50 56) scale(.3)">${typeof BUS_SVG !== "undefined" ? BUS_SVG : ""}</g><g transform="translate(150 60) scale(.3)">${typeof tLoco === "function" ? tLoco() : ""}</g></svg>
      <span>Bus &amp; trein</span></button>
    <button class="bigbtn b5" id="tDino" aria-label="Dino's opgraven">
      <svg viewBox="0 0 200 64"><g transform="translate(58 62) scale(.2)">${typeof dinoLevend === "function" ? dinoLevend("trex") : ""}</g><g transform="translate(150 62) scale(.2)">${typeof dinoLevend === "function" ? dinoLevend("stego") : ""}</g></svg>
      <span>Dino's</span></button>
    <button class="btn mutebtn" id="tMute" aria-label="Stem aan of uit">${voiceOn ? ICONS.speaker : ICONS.speakeroff}</button>`;
  $("#tFarm").addEventListener("click", () => { sfx.pop(); farmOpen(); });
  $("#tBouw").addEventListener("click", () => { sfx.pop(); bouwOpen(); });
  $("#tWinkel").addEventListener("click", () => { sfx.pop(); winkelOpen(); });
  $("#tBus").addEventListener("click", () => { sfx.honk(); vervoerMenu(); });
  $("#tDino").addEventListener("click", () => { sfx.pop(); if (typeof dinoOpen === "function") dinoOpen(); });
  $("#tMute").addEventListener("click", () => {
    unlockAudio(); const on = !voiceOn; setVoice(on);
    $("#tMute").innerHTML = on ? ICONS.speaker : ICONS.speakeroff;
    sfx.pop(); if (on) say("stem_aan");
  });
  $("#tPolitie").addEventListener("click", () => { unlockAudio(); sfx.honk(); say("politie"); startBuild("politie"); });
  $("#tBrand").addEventListener("click", () => { unlockAudio(); sfx.honk(); say("brandweer"); startBuild("brandweer"); });
  $("#tPlane").addEventListener("click", () => { unlockAudio(); sfx.pop(); say("vliegtuig"); startBuild("vliegtuig"); });
  $("#tBoot").addEventListener("click", () => { unlockAudio(); sfx.foghorn(); say("boot"); startBuild("boot"); });
  $("#tTractor").addEventListener("click", () => { unlockAudio(); sfx.honk(); say("tractor"); startBuild("tractor"); });
  $("#tAmbu").addEventListener("click", () => { unlockAudio(); sfx.honk(); say("ambulance"); startBuild("ambulance"); });
}

/* ---------- bouwen ---------- */
const TRAY = { x: 505, y: 70, w: 150, h: 250, cx: 580, cy: 195 };
let B = null;
function clearBuildTimers() { if (B) { clearTimeout(B.hintT); clearTimeout(B.nextT); } }
const toStage = (cx, cy) => ({ x: B.v.build.x + B.v.build.k * cx, y: B.v.build.y + B.v.build.k * cy });

function startBuild(vkey) {
  clearBuildTimers();
  show("build");
  const v = VEH[vkey], bp = v.build;
  const el = $("#build");
  const winId = "bwin" + (++uid);
  let sils = "", layers = "";
  v.layers.forEach(k => {
    const p = v.parts[k];
    let s = "";
    (p.targets || [p.c]).forEach((t, i) => {
      s += `<g class="sil" data-key="${k}" data-slot="${i}" transform="translate(${t[0]} ${t[1]})">${partInner(p)}</g>`;
    });
    sils += k === "dino" ? `<g clip-path="url(#${winId})">${s}</g>` : s;
    layers += `<g id="L_${k}"${k === "dino" ? ` clip-path="url(#${winId})"` : ""}></g>`;
  });
  el.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}">
      <defs><clipPath id="${winId}"><path d="${v.win}"/></clipPath></defs>
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
      <rect x="104" y="278" width="352" height="22" rx="6" fill="#607D8B" ${ST}/>
      <rect x="${TRAY.x}" y="${TRAY.y}" width="${TRAY.w}" height="${TRAY.h}" rx="26" fill="#fff" ${ST}/>
      <rect x="${TRAY.x + 12}" y="${TRAY.y + 12}" width="${TRAY.w - 24}" height="${TRAY.h - 24}" rx="18" fill="#E3F7FF"/>
      <g transform="translate(${bp.x} ${bp.y}) scale(${bp.k})"><g id="car">
        <g id="silLayer">${sils}</g>
        ${layers}
      </g></g>
      <g id="hintLayer"></g>
      <g id="dragLayer"></g>
      <g id="fxLayer"></g>
    </svg>`;
  homeButton(el);
  const go = document.createElement("button");
  go.className = "btn go"; go.hidden = true; go.setAttribute("aria-label", "Rijden");
  go.innerHTML = ICONS.play;
  go.addEventListener("click", () => { sfx.honk(); startDrive(vkey); });
  el.appendChild(go);
  const filled = {};
  Object.keys(v.parts).forEach(k => { filled[k] = (v.parts[k].targets || [0]).map(() => false); });
  B = { v, idx: 0, part: null, filled, hintT: 0, nextT: 0, drag: null, go };
  const svg = el.querySelector("svg");
  svg.addEventListener("pointerdown", onDown);
  svg.addEventListener("pointermove", onMove);
  svg.addEventListener("pointerup", onUp);
  svg.addEventListener("pointercancel", onUp);
  B.nextT = setTimeout(nextPart, 900);
}

const trayScale = key => Math.min(B.v.build.k, 118 / B.v.parts[key].w);
function setT(el, x, y, s) { el.style.transform = `translate(${x}px, ${y}px) scale(${s})`; }

function nextPart() {
  if (B.idx >= B.v.steps.length) return finishBuild();
  const [key, voice] = B.v.steps[B.idx];
  const g = svgEl("part popin", partInner(B.v.parts[key]));
  $("#dragLayer").appendChild(g);
  B.part = { el: g, key, x: TRAY.cx, y: TRAY.cy, s: trayScale(key) };
  setT(g, TRAY.cx, TRAY.cy, B.part.s);
  markNext();
  say(voice);
  scheduleHint(9000);
}
function openTargets(key) {
  const p = B.v.parts[key];
  return (p.targets || [p.c]).map((t, i) => ({ t, i })).filter(o => !B.filled[key][o.i]);
}
function markNext() {
  document.querySelectorAll("#silLayer .sil").forEach(s => s.classList.remove("next"));
  if (!B.part) return;
  document.querySelectorAll(`#silLayer .sil[data-key="${B.part.key}"]:not(.done)`).forEach(s => s.classList.add("next"));
}
function scheduleHint(ms) { clearTimeout(B.hintT); B.hintT = setTimeout(showHint, ms); }
function showHint() {
  if (!B.part || B.drag) return;
  const t = openTargets(B.part.key)[0].t, p = toStage(t[0], t[1]);
  const mx = (TRAY.cx + p.x) / 2, my = Math.min(TRAY.cy, p.y) - 90;
  $("#hintLayer").innerHTML = `<path class="hintpath" d="M${TRAY.cx} ${TRAY.cy} Q${mx} ${my} ${p.x} ${p.y}"/><circle cx="${p.x}" cy="${p.y}" r="14" fill="#FFE14D" ${ST}/>`;
  say("hint");
  scheduleHint(14000);
}
const clearHint = () => { $("#hintLayer").innerHTML = ""; };

function onDown(e) {
  if (!B || !B.part || B.drag) return;
  const pt = stagePoint(e);
  const inTray = pt.x > TRAY.x - 20 && pt.y > TRAY.y - 20 && pt.y < TRAY.y + TRAY.h + 20;
  if (!inTray && Math.hypot(pt.x - B.part.x, pt.y - B.part.y) > 90) return;
  e.preventDefault();
  try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
  unlockAudio();
  clearHint(); clearTimeout(B.hintT);
  B.part.el.classList.remove("anim", "popin");
  B.drag = { id: e.pointerId, ox: B.part.x - pt.x, oy: B.part.y - pt.y - 10 };
  B.part.s = B.v.build.k;
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
  setT(part.el, best.p.x, best.p.y, B.v.build.k);
  B.filled[part.key][best.i] = true;
  document.querySelector(`#silLayer .sil[data-key="${part.key}"][data-slot="${best.i}"]`).classList.add("done");
  markNext();
  sfx.click();
  setTimeout(() => {
    const g = svgEl();
    g.setAttribute("transform", `translate(${best.t[0]} ${best.t[1]})`);
    g.innerHTML = `<g class="bounce">${partInner(B.v.parts[part.key])}</g>`;
    $("#L_" + part.key).appendChild(g);
    part.el.remove();
    sparkleAt($("#fxLayer"), best.p.x, best.p.y);
    sfx.sparkle();
    B.idx++;
    if (B.idx >= B.v.steps.length) { B.nextT = setTimeout(finishBuild, 250); return; }
    say(pick(["goed1", "goed2", "goed3", "goed4"]), () => { B.nextT = setTimeout(nextPart, 150); });
  }, 280);
}
function finishBuild() {
  clearTimeout(B.hintT);
  $("#car").classList.add("bounce");
  const bp = B.v.build;
  sparkleAt($("#fxLayer"), bp.x + bp.k * 100, bp.y + bp.k * 45, true);
  confetti();
  sfx.fanfare();
  setTimeout(() => { sfx.honk(); say(B.v.voices.klaar); B.go.hidden = false; }, 900);
}

/* ---------- rijden: stad ---------- */
const TW = 1334, GROUND = 246;
let D = null;
function seeded(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }

function buildingTile(vkey) {
  const r = seeded(7), cols = ["#FFC107", "#FF5A5F", "#7C4DFF", "#00BCD4", "#FF8A00", "#EC407A", "#26A69A"];
  const fire = vkey === "brandweer";
  let x = 10, i = 0, s = "";
  while (x < TW - 60) {
    let w = Math.round(92 + r() * 60), h = Math.round(105 + r() * 70);
    if (x + w > TW - 10) w = TW - 10 - x;
    const station = i === 3 && vkey !== "ambulance";
    const col = station ? (fire ? "#C62828" : C.blue) : cols[i % cols.length];
    if (station) h = 150;
    const top = 232 - h;
    s += `<rect x="${x}" y="${top}" width="${w}" height="${h + 4}" rx="6" fill="${col}" ${ST}/>`;
    const nc = Math.max(1, Math.floor((w - 14) / 30)), nr = Math.max(1, Math.floor((h - 58) / 34));
    const gx = (w - nc * 18) / (nc + 1);
    let wins = "", lit = "";
    for (let row = 0; row < nr; row++) for (let c = 0; c < nc; c++) {
      const wx = x + gx + c * (18 + gx), wy = top + 14 + row * 34;
      if (station && row === 0) continue;
      wins += `<rect x="${wx}" y="${wy}" width="18" height="22" rx="3" fill="#E3F7FF" ${TH}/>`;
      if (r() < 0.7) lit += `<rect x="${wx + 1.5}" y="${wy + 1.5}" width="15" height="19" rx="2" fill="#FFE066"/>`;
    }
    const dx = x + w / 2 - 14;
    s += wins;
    if (station && fire) {
      s += `<rect x="${x + w / 2 - 26}" y="186" width="52" height="46" rx="4" fill="#ECEFF1" ${TH}/>
            <path d="M${x + w / 2 - 26} 198 h52 M${x + w / 2 - 26} 210 h52 M${x + w / 2 - 26} 222 h52" stroke="#90A4AE" stroke-width="3"/>`;
    } else {
      s += `<rect x="${dx}" y="196" width="28" height="36" rx="5" fill="${station ? "#fff" : "#6D3B1F"}" ${TH}/>`;
    }
    if (station) {
      s += `<rect x="${x + 8}" y="${top + 10}" width="${w - 16}" height="26" rx="6" fill="#fff" ${TH}/>
            <text x="${x + w / 2}" y="${top + 29}" text-anchor="middle" font-family="Baloo 2, Arial Rounded MT Bold, sans-serif" font-weight="800" font-size="${fire ? 13 : 17}" fill="${col}">${fire ? "BRANDWEER" : "POLITIE"}</text>
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

/* ---------- boerderij-landschap ---------- */
function hillTile() {
  const q = TW / 6;
  let d = `M0 232 `;
  for (let i = 0; i < 6; i++) d += `Q${i * q + q / 2} ${i % 2 ? 150 : 172} ${(i + 1) * q} 232 `;
  return `<path d="${d} V240 H0 Z"/>`;
}
function barn(x, col) {
  return `<rect x="${x}" y="132" width="150" height="102" fill="${col}" ${ST}/>
    <path d="M${x - 10} 134 L${x + 75} 82 L${x + 160} 134 Z" fill="#8D2A1E" ${ST}/>
    <rect x="${x + 64}" y="104" width="22" height="18" fill="#FFE0B2" ${TH}/>
    <rect x="${x + 48}" y="168" width="54" height="64" fill="#fff" ${TH}/>
    <path d="M${x + 48} 168 L${x + 102} 232 M${x + 102} 168 L${x + 48} 232 M${x + 75} 168 V232" stroke="${INK}" stroke-width="3"/>
    <path class="shade" d="M${x - 10} 134 L${x + 75} 82 L${x + 160} 134 V234 H${x} Z" fill="#0B1640"/>
    <rect class="no" x="${x + 66}" y="106" width="18" height="14" fill="#FFE066"/>`;
}
function silo(x) {
  return `<rect x="${x}" y="96" width="46" height="138" fill="#90A4AE" ${ST}/>
    <path d="M${x} 98 Q${x + 23} 66 ${x + 46} 98 Z" fill="#B0BEC5" ${ST}/>
    <path d="M${x} 126 h46 M${x} 156 h46 M${x} 186 h46 M${x} 216 h46" stroke="${INK}" stroke-width="2.5"/>
    <path class="shade" d="M${x} 98 Q${x + 23} 66 ${x + 46} 98 V234 H${x} Z" fill="#0B1640"/>`;
}
function windmill(x) {
  const cx = x + 50, cy = 104;
  const arm = a => `<g transform="rotate(${a})"><rect x="-4" y="-66" width="8" height="62" fill="#6D4C41" ${TH}/><rect x="4" y="-62" width="16" height="50" fill="#FFF8E1" ${TH}/><path d="M4 -50 h16 M4 -38 h16 M4 -26 h16" stroke="${INK}" stroke-width="1.5"/></g>`;
  return `<path d="M${x + 16} 234 L${x + 32} 104 H${x + 68} L${x + 84} 234 Z" fill="#5D4037" ${ST}/>
    <rect x="${x + 38}" y="190" width="24" height="44" rx="10" fill="#2E7D32" ${TH}/>
    <rect x="${x + 42}" y="140" width="16" height="18" fill="#FFF8E1" ${TH}/>
    <path d="M${x + 26} 110 Q${x + 50} 74 ${x + 74} 110 Z" fill="#37474F" ${ST}/>
    <path class="shade" d="M${x + 16} 234 L${x + 32} 104 H${x + 68} L${x + 84} 234 Z" fill="#0B1640"/>
    <rect class="no" x="${x + 44}" y="142" width="12" height="14" fill="#FFE066"/>
    <g transform="translate(${cx} ${cy})"><g class="wieken">${[0, 90, 180, 270].map(arm).join("")}<circle r="7" fill="#37474F" ${TH}/></g></g>`;
}
function farmhouse(x) {
  return `<rect x="${x + 86}" y="126" width="14" height="30" fill="#8D6E63" ${TH}/>
    <rect x="${x}" y="160" width="124" height="74" fill="#FFF3E0" ${ST}/>
    <path d="M${x - 10} 162 L${x + 62} 118 L${x + 134} 162 Z" fill="#E64A19" ${ST}/>
    <rect x="${x + 14}" y="176" width="24" height="22" fill="#E3F7FF" ${TH}/><rect x="${x + 86}" y="176" width="24" height="22" fill="#E3F7FF" ${TH}/>
    <rect x="${x + 50}" y="190" width="24" height="44" rx="4" fill="#2E7D32" ${TH}/>
    <path class="shade" d="M${x - 10} 162 L${x + 62} 118 L${x + 134} 162 V234 H${x} Z" fill="#0B1640"/>
    <g class="no"><rect x="${x + 16}" y="178" width="20" height="18" fill="#FFE066"/><rect x="${x + 88}" y="178" width="20" height="18" fill="#FFE066"/></g>`;
}
function bales(x) {
  return [0, 38, 19].map((d, i) => `<g transform="translate(${x + d} ${i === 2 ? 190 : 214})"><circle r="20" fill="#FFCA28" ${ST}/><path d="M0 0 m-12 0 a12 12 0 1 1 12 12 a8 8 0 1 1 -8 -8" fill="none" stroke="#E0A800" stroke-width="3"/></g>`).join("") +
    `<rect class="shade" x="${x - 20}" y="170" width="78" height="64" rx="20" fill="#0B1640"/>`;
}
function farmTile() {
  return barn(40, "#E53935") + silo(206) + windmill(300) + farmhouse(470) + bales(660) + barn(760, "#C62828") + silo(926) + windmill(1010) + bales(1200);
}
function fenceTile() {
  let s = `<g fill="#BCAAA4" ${TH}>`;
  for (let x = 0; x < TW; x += 223) s += `<rect x="${x}" y="210" width="223" height="7" rx="2"/><rect x="${x}" y="224" width="223" height="7" rx="2"/>`;
  for (let x = 12; x < TW; x += 38) s += `<rect x="${x}" y="202" width="9" height="36" rx="2"/>`;
  s += `</g>`;
  for (let x = 30; x < TW; x += 170) s += `<g transform="translate(${x} 244)"><path d="M0 0 V-12" stroke="#558B2F" stroke-width="3"/><circle cy="-15" r="5" fill="${pick(["#FF4081", "#FFD600", "#fff", "#7C4DFF"])}" ${TH}/></g>`;
  return { s, glow: "" };
}
function pebbleTile() {
  const r = seeded(5);
  let s = "";
  for (let i = 0; i < 70; i++) s += `<ellipse cx="${(r() * TW).toFixed(0)}" cy="${(258 + r() * 36).toFixed(0)}" rx="${(2 + r() * 3).toFixed(1)}" ry="${(1.5 + r() * 2).toFixed(1)}"/>`;
  return s;
}

/* ---------- lucht ---------- */
function cloudTile(seed, sc, outlined, maxY = 200) {
  const r = seeded(seed);
  let s = "";
  for (let x = 40; x < TW - 80; x += 170 + r() * 120) {
    const y = 30 + r() * (maxY - 30), k = sc * (0.7 + r() * 0.6);
    const st = outlined ? `stroke="${INK}" stroke-width="${3 / k}"` : "";
    s += `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) scale(${k.toFixed(2)})" opacity="${outlined ? 1 : .55}">
      <path d="M-40 10 a16 16 0 0 1 14 -24 a22 22 0 0 1 40 -4 a16 16 0 0 1 28 10 a12 12 0 0 1 -2 18 z" fill="#fff" ${st}/></g>`;
  }
  return s;
}
function skyGroundTile() {
  const q = TW / 8;
  let d = "M0 300 V276 ";
  for (let i = 0; i < 8; i++) d += `Q${i * q + q / 2} ${i % 2 ? 258 : 266} ${(i + 1) * q} 276 `;
  let s = `<path d="${d} V300 Z" fill="#8BC34A" ${ST}/>`;
  for (let x = 60; x < TW; x += 150) {
    s += `<g transform="translate(${x} 270)"><rect x="-9" y="-12" width="18" height="12" fill="${pick(["#FF5A5F", "#FFC107", "#fff"])}" stroke="${INK}" stroke-width="2"/><path d="M-11 -12 L0 -21 L11 -12Z" fill="#8D2A1E" stroke="${INK}" stroke-width="2"/></g>`;
    s += `<g transform="translate(${x + 70} 268)"><rect x="-1.5" y="-4" width="3" height="8" fill="#8D4E1E"/><circle cy="-8" r="7" fill="${C.dino}" stroke="${INK}" stroke-width="2"/></g>`;
  }
  return s;
}

/* ---------- zee ---------- */
function coastTile() {
  const q = TW / 7;
  let d = "M0 152 ";
  for (let i = 0; i < 7; i++) d += `Q${i * q + q / 2} ${i % 2 ? 128 : 138} ${(i + 1) * q} 152 `;
  let s = `<path d="${d} Z" fill="#FFE082" stroke="${INK}" stroke-width="3"/>`;
  for (const x of [160, 700, 1150]) s += `<g transform="translate(${x} ${152 - 234 * .32}) scale(.32)">${windmill(0)}</g>`;
  const lx = 430;
  s += `<path d="M${lx - 11} 152 L${lx - 7} 84 H${lx + 7} L${lx + 11} 152 Z" fill="#fff" stroke="${INK}" stroke-width="3"/>
    <path d="M${lx - 10} 136 H${lx + 10} L${lx + 9.5} 124 H${lx - 9.5} Z M${lx - 8.6} 110 H${lx + 8.6} L${lx + 8} 98 H${lx - 8} Z" fill="${C.fred}"/>
    <rect x="${lx - 9}" y="72" width="18" height="13" rx="2" fill="#FFE27A" stroke="${INK}" stroke-width="3"/>
    <path d="M${lx - 11} 72 L${lx} 62 L${lx + 11} 72 Z" fill="${C.fred}" stroke="${INK}" stroke-width="3"/>
    <g class="no" transform="translate(${lx} 78)"><g class="beam"><path d="M0 0 L150 -22 L150 22 Z" fill="#FFF59D" opacity=".55"/><path d="M0 0 L-150 -22 L-150 22 Z" fill="#FFF59D" opacity=".55"/></g></g>`;
  return s;
}
function waveTile(rows, op) {
  let s = "";
  rows.forEach((y, i) => {
    let d = `M${(i % 2) * 30} ${y} `;
    for (let x = (i % 2) * 30; x < TW; x += 60) d += `q15 -7 30 0 m30 0 `;
    s += `<path d="${d}" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="${op}"/>`;
  });
  return s;
}
const twice = inner => `<g>${inner}</g><g transform="translate(${TW} 0)">${inner}</g>`;

const BUTTONS = {
  horn: ["Toeter", "horn"], siren: ["Sirene", "siren"], night: ["Dag en nacht", "moon"],
  boef: ["Boef", "boef"], ladder: ["Ladder", "ladder"], kit: ["Ziek dier", "kit"], animal: ["Dier roepen", "animal"], looping: ["Looping", "looping"], game: ["Spelletje", "balloon"], vis: ["Vissen", "fishbtn"], dz: ["Drijven of zinken", "boei"], garage: ["Opnieuw bouwen", "wrench"]
};

function startDrive(vkey) {
  show("drive");
  const v = VEH[vkey], dp = v.drive;
  const el = $("#drive");
  const farm = v.world === "farm", sky = v.world === "sky", sea = v.world === "sea";
  const props = sky || sea ? { s: "", glow: "" } : farm ? fenceTile() : propTile();
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
      ${sea ? `<defs><linearGradient id="seag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4FC3F7"/><stop offset="1" stop-color="#0277BD"/></linearGradient></defs>
      <g class="clouds" id="lBld">${twice(cloudTile(4, .9, true, 95))}</g>
      <g id="lFar">${twice(coastTile())}</g>
      <rect y="150" width="${W}" height="150" fill="url(#seag)"/>
      <rect class="no" y="150" width="${W}" height="150" fill="#0B1640" fill-opacity=".45"/>
      <path d="M0 150 H${W}" stroke="${INK}" stroke-width="4"/>
      <g id="lSeam">${twice(waveTile([164, 184], .5))}</g>
      <g id="fishLayer"></g>
      <rect y="178" width="${W}" height="122" fill="#01579B" opacity=".22"/>
      <g id="lDash">${twice(waveTile([210, 240, 272], .7))}</g>`
      : sky ? `<g class="clouds" id="lFar">${twice(cloudTile(3, .75, false))}</g>
      <g class="clouds" id="lBld">${twice(cloudTile(9, 1.1, true))}</g>
      <g id="lSeam"></g>
      <g id="lDash">${twice(skyGroundTile())}</g>`
      : farm ? `<g class="hills" id="lFar">${twice(hillTile())}</g>
      <g id="lBld">${twice(farmTile())}</g>
      <rect y="230" width="${W}" height="22" fill="#8BC34A" ${ST}/>
      <g id="lSeam">${twice(Array.from({ length: 60 }, (_, i) => `<path d="M${i * 23 + 4} 248 l3 -8 l3 8" fill="none" stroke="#558B2F" stroke-width="2"/>`).join(""))}</g>
      <rect y="250" width="${W}" height="50" fill="#C8A06A"/>
      <g id="lDash" fill="#A1887F">${twice(pebbleTile())}</g>`
      : `<g class="far" id="lFar">${twice(farTile())}</g>
      <g id="lBld">${twice(buildingTile(vkey))}</g>
      <rect y="230" width="${W}" height="22" fill="#CFD8DC" ${ST}/>
      <g id="lSeam">${twice(Array.from({ length: 34 }, (_, i) => `<path d="M${i * 40} 232 V250" stroke="#90A4AE" stroke-width="2"/>`).join(""))}</g>
      <rect y="250" width="${W}" height="50" fill="#3D4657"/>
      <g id="lDash" fill="#FFE14D">${twice(dashTile())}</g>`}
      <g id="lProp">${twice(props.s)}</g>
      <rect class="shade" y="228" width="${W}" height="72" fill="#0B1640"/>
      <g id="lGlow" class="no">${twice(props.glow)}</g>
      <g id="evLayer"></g>
      <g id="boefLayer"></g>
      <g id="carPos" transform="translate(${dp.x} ${dp.y}) scale(${dp.k})"><g id="carWrap"><g id="dcar" class="carbob">${carSVG(v, { glow: true, cone: true })}</g></g></g>
      <g id="dfx"></g>
    </svg>
    <div class="jail" id="cnt"><span class="bars">${ICONS[v.counter.icon]}</span><span class="num" id="cnum">0</span><span class="tally" id="tally"></span></div>
    <div class="bar">${v.buttons.map(b => `<button class="btn" id="b_${b}" aria-label="${BUTTONS[b][0]}">${ICONS[BUTTONS[b][1]]}</button>`).join("")}</div>`;
  homeButton(el);

  D = {
    v, vkey, dist: 0, speed: 0, base: 2.4, siren: false, night: false, count: 0,
    last: performance.now(), raf: 0, timers: [], ev: null, boef: null, boefSaid: 0,
    ladderA: 0, ladderT: 0, spraying: false, cleanup: null, leaving: [], nextT: 0,
    layers: [["#lFar", .25], ["#lBld", .6], ["#lSeam", 1], ["#lDash", 1], ["#lProp", 1], ["#lGlow", 1]].map(([s, f]) => [$(s), f]),
    wheels: [...el.querySelectorAll("#dcar .spin")],
    ladders: [...el.querySelectorAll("#dcar .ladderRot")],
    scene: $("#scene")
  };
  if ($("#b_horn")) $("#b_horn").addEventListener("click", () => { (sfx[v.horn] || sfx.honk)(); bounceCar(); });
  if ($("#b_siren")) $("#b_siren").addEventListener("click", e => {
    D.siren = !D.siren;
    e.currentTarget.classList.remove("hintbtn");
    e.currentTarget.classList.toggle("on", D.siren);
    D.scene.classList.toggle("siren", D.siren);
    D.base = D.siren ? 4.4 : 2.4;
    if (D.siren) { say("sirene_aan"); sirenOn(...v.siren); } else sirenOff();
  });
  $("#b_night").addEventListener("click", e => {
    D.night = !D.night;
    D.scene.classList.toggle("night", D.night);
    e.currentTarget.innerHTML = D.night ? ICONS.sun : ICONS.moon;
    say(D.night ? "nacht" : "dag");
  });
  $("#b_garage").addEventListener("click", () => { sfx.pop(); startBuild(vkey); });
  if (dp.dino) $("#dcar").addEventListener("pointerdown", e => {
    const pt = stagePoint(e), [x0, x1, yMax] = dp.dino;
    if (pt.y < dp.y + yMax * dp.k && pt.x > dp.x + x0 * dp.k && pt.x < dp.x + x1 * dp.k) say(v.voices.hallo); else sfx.honk();
    bounceCar();
  });
  MODES[vkey].setup();
  say(v.voices.start || "rijden");
  D.raf = requestAnimationFrame(tick);
}
function later(fn, ms) { const d = D; const t = setTimeout(() => { if (D === d) fn(); }, ms); D.timers.push(t); return t; }
function stopDrive() {
  if (!D) return;
  cancelAnimationFrame(D.raf); D.timers.forEach(clearTimeout);
  if (D.cleanup) D.cleanup();
  sirenOff(); waterOff();
  D = null;
}
function bounceCar() {
  const c = $("#carWrap");
  c.classList.remove("bounce"); void c.getBBox(); c.classList.add("bounce");
}
function addCount(silent) {
  D.count++;
  const n = D.count, v = D.v;
  $("#cnum").textContent = n;
  const t = $("#tally");
  t.innerHTML = ICONS[v.counter.mini].repeat(n);
  t.classList.toggle("many", n > 10);
  const j = $("#cnt"); j.classList.remove("pop"); void j.offsetWidth; j.classList.add("pop");
  sfx.pop();
  if (n >= 20) {
    confetti(100); sfx.fanfare(); say("n20_feest");
    later(() => { if (D.count >= 20) { D.count = 0; $("#cnum").textContent = "0"; t.innerHTML = ""; t.classList.remove("many"); } }, 6000);
    return;
  }
  if (n === 10) { confetti(60); sfx.fanfare(); }
  if (!silent) say(n <= 10 ? v.counter.voice + n : "n" + n);
}
function tick(now) {
  if (!D) return;
  const dt = Math.min(0.05, (now - D.last) / 1000); D.last = now;
  const ev = D.ev;
  const stopping = ev && ev.stopX != null && !ev.released;
  // afremmen en stoppen bij een gebeurtenis (brand, poes)
  let target = D.base;
  if (stopping) {
    const rem = ev.wx - D.dist - ev.stopX;
    target = rem <= 0 ? 0 : Math.min(D.base, 0.3 + D.base * rem / 160);
  }
  D.speed += (target - D.speed) * Math.min(1, dt * 3);
  let dx = D.speed * dt * 60;
  if (stopping) {
    const rem = ev.wx - D.dist - ev.stopX;
    if (dx >= rem) { dx = Math.max(0, rem); D.speed = 0; if (!ev.arrived) { ev.arrived = true; MODES[D.vkey].arrive(ev); } }
  }
  D.dist += dx;
  D.layers.forEach(([g, f]) => g.setAttribute("transform", `translate(${-((D.dist * f) % TW)} 0)`));
  D.wheels.forEach(w => {
    const deg = (D.dist / ((+w.getAttribute("data-r") || 19) * D.v.drive.k)) * (180 / Math.PI);
    w.setAttribute("transform", `rotate(${deg % 360})`);
  });
  if (D.v.pivot) {
    D.ladderA += (D.ladderT - D.ladderA) * Math.min(1, dt * 3);
    const [px, py] = D.v.pivot, lc = D.v.parts.ladder.c;
    D.ladders.forEach(l => l.setAttribute("transform", `rotate(${D.ladderA} ${px - lc[0]} ${py - lc[1]})`));
  }
  if (ev) {
    ev.sx = ev.wx - D.dist;
    ev.el.setAttribute("transform", `translate(${ev.sx} ${GROUND})`);
    if (ev.released) { D.leaving.push(ev); D.ev = null; MODES[D.vkey].gone(); }
  }
  D.leaving = D.leaving.filter(l => {
    l.sx = l.wx - D.dist;
    l.el.setAttribute("transform", `translate(${l.sx} ${GROUND})`);
    if (l.sx < -200) { l.el.remove(); return false; }
    return true;
  });
  MODES[D.vkey].tick(dt, dx, now);
  D.raf = requestAnimationFrame(tick);
}

/* ---------- politie: boeven vangen ---------- */
const MODES = {};
MODES.politie = {
  setup() {
    $("#b_boef").addEventListener("click", () => { if (!D.boef) spawnBoef(true); else say("boef_daar"); });
    D.spawnT = later(() => spawnBoef(true), 6000);
  },
  tick(dt, dx) {
    const b = D.boef;
    if (b && !b.caught) {
      b.x -= dx * 0.45;
      b.el.style.transform = `translate(${b.x}px, 250px)`;
      if (b.x < -60) { b.el.remove(); D.boef = null; scheduleBoef(); }
    }
  },
  arrive() {}, gone() {}
};
function scheduleBoef() { clearTimeout(D.spawnT); D.spawnT = later(() => spawnBoef(false), rnd(9000, 16000)); }
function spawnBoef(announce) {
  if (!D || D.boef) return;
  clearTimeout(D.spawnT);
  const g = svgEl("boef", boefSVG());
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
  later(() => {
    b.el.classList.add("fly");
    b.el.style.transform = `translate(600px, 40px) scale(.2)`;
    b.el.style.opacity = ".2";
  }, 350);
  later(() => { b.el.remove(); D.boef = null; addCount(); scheduleBoef(); }, 1300);
}

/* ---------- brandweer: blussen en poes redden ---------- */
const FLAMES = [[-31, -40, 1], [31, -40, 1.1], [-6, -92, 1.3]];
function houseSVG() {
  const col = pick(["#FFC107", "#80DEEA", "#CE93D8", "#FFAB91"]);
  return `
    <rect class="hit" x="-80" y="-150" width="160" height="150" fill="transparent"/>
    <rect x="28" y="-108" width="14" height="28" fill="#B0BEC5" ${TH}/>
    <rect x="-52" y="-72" width="104" height="72" fill="${col}" ${ST}/>
    <path d="M-62 -70 L0 -112 L62 -70 Z" fill="#8D4E1E" ${ST}/>
    <rect x="-14" y="-40" width="28" height="40" rx="4" fill="#6D3B1F" ${TH}/>
    <rect class="hwin" x="-42" y="-62" width="22" height="22" rx="3" fill="#FF9800" ${TH}/>
    <rect class="hwin" x="20" y="-62" width="22" height="22" rx="3" fill="#FF9800" ${TH}/>
    <g class="smoke">${[0, 1, 2].map(i => `<circle class="puff" style="animation-delay:${i * .5}s" cx="${-6 + i * 8}" cy="-120" r="${14 - i * 2}" fill="#90A4AE" opacity=".8"/>`).join("")}</g>
    <g class="flames">${FLAMES.map(([x, y, s]) => `<g transform="translate(${x} ${y}) scale(${s})">${flameSVG()}</g>`).join("")}</g>`;
}
function treeCatSVG(catY) {
  const cy = -catY + 30;
  return `
    <rect x="-9" y="${cy}" width="18" height="${-cy}" fill="#8D4E1E" ${TH}/>
    <circle cx="-30" cy="${cy + 16}" r="28" fill="${C.dino}" ${ST}/>
    <circle cx="30" cy="${cy + 14}" r="30" fill="${C.dino}" ${ST}/>
    <circle cx="0" cy="${cy}" r="40" fill="${C.dino}" ${ST}/>
    <g class="cat" transform="translate(0 ${-catY})">${CAT_SVG}</g>`;
}
function ladderTip(a) {
  const v = D.v, dp = v.drive, [px, py] = v.pivot, len = (px - 8) * dp.k, rad = a * Math.PI / 180;
  const sx = dp.x + px * dp.k, sy = dp.y + py * dp.k;
  return { pivot: { x: sx, y: sy }, tip: { x: sx - len * Math.cos(rad), y: sy - len * Math.sin(rad) } };
}
MODES.brandweer = {
  seq: 0,
  setup() {
    this.seq = 0;
    $("#b_ladder").addEventListener("click", ladderButton);
    $("#dfx").appendChild(svgEl("", `<path id="sprayB" fill="none" stroke="#29B6F6" stroke-width="10" stroke-linecap="round" opacity="0"/><path id="spray" class="spray" fill="none" stroke="#E1F5FE" stroke-width="4" stroke-linecap="round" stroke-dasharray="10 9" opacity="0"/>`));
    const stop = () => { if (D) D.spraying = false; };
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    D.cleanup = () => { window.removeEventListener("pointerup", stop); window.removeEventListener("pointercancel", stop); };
    later(() => this.next(), 5000);
  },
  next() {
    if (!D || D.ev) return;
    const type = this.seq % 3 === 2 ? "cat" : "fire";
    this.seq++;
    type === "fire" ? spawnFire() : spawnCat();
  },
  gone() { later(() => this.next(), rnd(4000, 8000)); },
  arrive(ev) {
    if (ev.type === "fire") { say("brand_daar"); ev.nagT = performance.now(); }
    else { sfx.meow(); say("poes_daar"); $("#b_ladder").classList.add("hintbtn"); }
  },
  tick(dt, dx, now) {
    const ev = D.ev;
    const sprayOn = ev && ev.type === "fire" && ev.arrived && !ev.out && (D.spraying || now < ev.sprayUntil);
    const sp = $("#spray"), spb = $("#sprayB");
    if (sprayOn) {
      const dp = D.v.drive, nx = dp.x + 132 * dp.k, ny = dp.y + 40 * dp.k;
      const fx = ev.sx + ev.aim[0], fy = GROUND + ev.aim[1];
      const d = `M${nx} ${ny} Q${(nx + fx) / 2} ${Math.min(ny, fy) - 90} ${fx} ${fy}`;
      sp.setAttribute("d", d); spb.setAttribute("d", d);
      sp.setAttribute("opacity", "1"); spb.setAttribute("opacity", ".85");
      waterOn();
      ev.health -= 42 * dt;
      ev.nagT = now;
      const hs = Math.max(0, ev.health) / 100;
      ev.flames.forEach((f, i) => { const [x, y, s] = FLAMES[i]; f.setAttribute("transform", `translate(${x} ${y}) scale(${s * (0.2 + 0.8 * hs)})`); });
      if (Math.random() < dt * 8) sparkleAt($("#dfx"), fx + rnd(-15, 15), fy + rnd(-10, 10), false, ["#E1F5FE", "#81D4FA", "#fff"]);
      if (ev.health <= 0) extinguish(ev);
    } else {
      sp.setAttribute("opacity", "0"); spb.setAttribute("opacity", "0");
      waterOff();
      if (ev && ev.type === "fire" && ev.arrived && !ev.out && now - ev.nagT > 9000) { ev.nagT = now; say(ev.health < 100 ? "blus_nog" : "brand_daar"); }
    }
    if (ev && ev.type === "cat" && ev.saving && !ev.moving && D.ladderA > D.v.ladderMax - 2) rescueCat(ev);
  }
};
function spawnFire() {
  const g = svgEl("house", houseSVG());
  $("#evLayer").appendChild(g);
  const ev = { type: "fire", el: g, wx: D.dist + 780, stopX: 480, health: 100, sprayUntil: 0, aim: [0, -70],
    flames: [...g.querySelectorAll(".flames > g")] };
  g.addEventListener("pointerdown", e => {
    e.stopPropagation(); unlockAudio();
    if (!ev.arrived || ev.out) return;
    D.spraying = true; ev.sprayUntil = performance.now() + 700;
  });
  D.ev = ev;
}
function extinguish(ev) {
  ev.out = true;
  D.spraying = false;
  ev.el.querySelector(".flames").style.display = "none";
  ev.el.querySelectorAll(".hwin").forEach(w => w.setAttribute("fill", "#546E7A"));
  ev.el.classList.add("out");
  sfx.sizzle();
  sparkleAt($("#dfx"), ev.sx, GROUND - 70, true, ["#E1F5FE", "#81D4FA", "#fff", "#FFD600"]);
  addCount();
  later(() => { ev.released = true; }, 2200);
}
function spawnCat() {
  const { tip } = ladderTip(D.v.ladderMax);
  const catY = GROUND - tip.y - 4;
  const g = svgEl("tree", treeCatSVG(catY));
  $("#evLayer").appendChild(g);
  D.ev = { type: "cat", el: g, wx: D.dist + 780, stopX: tip.x, catY };
  g.addEventListener("pointerdown", e => { e.stopPropagation(); sfx.meow(); });
}
function ladderButton() {
  unlockAudio();
  const ev = D.ev, btn = $("#b_ladder");
  btn.classList.remove("hintbtn");
  sfx.click();
  if (ev && ev.type === "cat" && ev.moving && !ev.released) return;
  if (ev && ev.type === "cat" && ev.arrived && !ev.saved) { D.ladderT = D.v.ladderMax; ev.saving = true; btn.classList.add("on"); return; }
  D.ladderT = D.ladderT > 0 ? 0 : D.v.ladderMax;
  btn.classList.toggle("on", D.ladderT > 0);
}
function rescueCat(ev) {
  ev.moving = true;
  ev.el.querySelector(".cat").style.display = "none";
  const { tip, pivot } = ladderTip(D.ladderA);
  const g = svgEl("", CAT_SVG);
  $("#dfx").appendChild(g);
  sfx.meow();
  const t0 = performance.now(), dur = 1500, d0 = D;
  const step = now => {
    if (D !== d0) return;
    const t = Math.min(1, (now - t0) / dur), e = t * t * (3 - 2 * t);
    const x = tip.x + (pivot.x - tip.x) * e, y = tip.y - 4 + (pivot.y - tip.y) * e;
    g.setAttribute("transform", `translate(${x} ${y})`);
    if (t < 1) { requestAnimationFrame(step); return; }
    ev.saved = true;
    heartsAt($("#dfx"), x, y - 30);
    sparkleAt($("#dfx"), x, y - 20, true, ["#FF4081", "#FFD600", "#fff"]);
    sfx.sparkle();
    say("poes_gered");
    later(() => { g.remove(); D.ladderT = 0; $("#b_ladder").classList.remove("on"); }, 1400);
    later(() => { ev.released = true; }, 2400);
  };
  requestAnimationFrame(step);
}


/* ---------- ambulance: zieke dieren helpen (kleuren) ---------- */
const ANIMALS = {
  konijn: `
    <ellipse cx="-8" cy="-72" rx="6" ry="17" fill="#F5F5F5" ${TH}/><ellipse cx="8" cy="-72" rx="6" ry="17" fill="#F5F5F5" ${TH}/>
    <ellipse cx="-8" cy="-72" rx="2.5" ry="11" fill="#F8BBD0"/><ellipse cx="8" cy="-72" rx="2.5" ry="11" fill="#F8BBD0"/>
    <ellipse cx="0" cy="-18" rx="17" ry="18" fill="#F5F5F5" ${ST}/>
    <ellipse cx="-9" cy="-2" rx="8" ry="4" fill="#F5F5F5" ${TH}/><ellipse cx="9" cy="-2" rx="8" ry="4" fill="#F5F5F5" ${TH}/>
    <circle cy="-46" r="16" fill="#F5F5F5" ${TH}/>
    <circle cx="-6" cy="-49" r="2.6" fill="${INK}"/><circle cx="6" cy="-49" r="2.6" fill="${INK}"/>
    <path d="M-2.5 -44 h5 l-2.5 3z" fill="#F06292"/>
    <g class="sad"><path d="M-5 -35 q5 -4 10 0" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/><path d="M-10 -45 q-3 5 0 7 q3 -2 0 -7z" fill="#4FC3F7"/></g>
    <g class="happy"><path d="M-6 -38 q6 5 12 0" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/></g>
    <g class="band" transform="translate(7 -22) rotate(-25)"><rect x="-10" y="-4.5" width="20" height="9" rx="4.5" fill="#fff" ${TH}/></g>`,
  eend: `
    <ellipse cx="-6" cy="-1" rx="7" ry="3.5" fill="#FF9800" ${TH}/><ellipse cx="7" cy="-1" rx="7" ry="3.5" fill="#FF9800" ${TH}/>
    <ellipse cx="0" cy="-17" rx="21" ry="15" fill="#FFEB3B" ${ST}/>
    <circle cx="5" cy="-41" r="13" fill="#FFEB3B" ${TH}/>
    <path d="M16 -42 q11 0 13 4 q-5 3 -13 2 z" fill="#FF9800" ${TH}/>
    <circle cx="8" cy="-45" r="2.4" fill="${INK}"/>
    <ellipse cx="-5" cy="-17" rx="11" ry="7" fill="#FDD835" ${TH}/>
    <g class="sad"><path d="M3 -52 l8 3" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/><path d="M6 -40 q-3 5 0 7 q3 -2 0 -7z" fill="#4FC3F7"/></g>
    <g class="happy"><circle cx="11" cy="-38" r="3" fill="#FF8A80" opacity=".8"/></g>
    <g class="band" transform="translate(-5 -17) rotate(20)"><rect x="-10" y="-4.5" width="20" height="9" rx="4.5" fill="#fff" ${TH}/></g>`,
  koe: `
    ${[-22, -10, 8, 20].map(x => `<rect x="${x}" y="-24" width="7" height="24" rx="3" fill="#fff" ${TH}/>`).join("")}
    <path d="M-30 -40 q-10 6 -8 22" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="-2" cy="-36" rx="30" ry="17" fill="#fff" ${ST}/>
    <path d="M-20 -46 q9 -4 11 6 q-6 9 -13 2 z M4 -30 q8 -3 10 5 q-6 5 -11 1z" fill="${INK}"/>
    <ellipse cx="0" cy="-22" rx="6" ry="4" fill="#F8BBD0" ${TH}/>
    <path d="M16 -64 l-6 -9 M32 -64 l6 -9" stroke="#BCAAA4" stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="11" cy="-58" rx="6" ry="3.5" fill="#fff" ${TH}/><ellipse cx="37" cy="-58" rx="6" ry="3.5" fill="#fff" ${TH}/>
    <circle cx="24" cy="-54" r="15" fill="#fff" ${TH}/>
    <path d="M14 -62 q6 -4 9 3 q-5 5 -9 1z" fill="${INK}"/>
    <circle cx="19" cy="-57" r="2.4" fill="${INK}"/><circle cx="29" cy="-57" r="2.4" fill="${INK}"/>
    <ellipse cx="24" cy="-44" rx="12" ry="8" fill="#F8BBD0" ${TH}/>
    <circle cx="20" cy="-44" r="1.6" fill="${INK}"/><circle cx="28" cy="-44" r="1.6" fill="${INK}"/>
    <g class="sad"><path d="M14 -53 q-3 5 0 7 q3 -2 0 -7z" fill="#4FC3F7"/></g>
    <g class="happy"><path d="M19 -39 q5 4 10 0" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/></g>
    <g class="band" transform="translate(-6 -34)"><rect x="-10" y="-4.5" width="20" height="9" rx="4.5" fill="#fff" ${TH}/></g>`,
  schaap: `
    ${[-16, -6, 6, 16].map(x => `<rect x="${x - 3}" y="-20" width="6" height="20" rx="3" fill="#37474F"/>`).join("")}
    <g>${[[-14, -30, 13], [0, -36, 15], [14, -30, 13], [-6, -22, 12], [8, -22, 12], [-20, -22, 9], [20, -22, 9]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}" stroke="${INK}" stroke-width="6"/>`).join("")}
    ${[[-14, -30, 13], [0, -36, 15], [14, -30, 13], [-6, -22, 12], [8, -22, 12], [-20, -22, 9], [20, -22, 9]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#FAFAFA"/>`).join("")}</g>
    <ellipse cx="14" cy="-48" rx="7" ry="4" fill="#37474F" transform="rotate(-25 14 -48)"/><ellipse cx="34" cy="-48" rx="7" ry="4" fill="#37474F" transform="rotate(25 34 -48)"/>
    <ellipse cx="24" cy="-44" rx="11" ry="13" fill="#455A64" ${TH}/>
    <circle cx="24" cy="-56" r="7" fill="#FAFAFA" ${TH}/>
    <circle cx="20" cy="-45" r="2.6" fill="#fff"/><circle cx="28" cy="-45" r="2.6" fill="#fff"/>
    <circle cx="20.5" cy="-45" r="1.3" fill="${INK}"/><circle cx="28.5" cy="-45" r="1.3" fill="${INK}"/>
    <g class="sad"><path d="M16 -42 q-3 5 0 7 q3 -2 0 -7z" fill="#4FC3F7"/></g>
    <g class="happy"><path d="M20 -37 q4 3 8 0" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/></g>
    <g class="band" transform="translate(-4 -28)"><rect x="-10" y="-4.5" width="20" height="9" rx="4.5" fill="#fff" ${TH}/></g>`,
  kip: `
    <path d="M-6 -12 V0 M6 -12 V0 M-10 0 h8 M2 0 h8" stroke="#FF9800" stroke-width="3" stroke-linecap="round"/>
    <path d="M-16 -30 q-12 -14 -4 -22 q4 8 10 10 z" fill="#fff" ${TH}/>
    <ellipse cx="0" cy="-24" rx="17" ry="14" fill="#fff" ${ST}/>
    <ellipse cx="-3" cy="-24" rx="9" ry="6" fill="#EEEEEE" ${TH}/>
    <circle cx="10" cy="-44" r="10" fill="#fff" ${TH}/>
    <path d="M3 -52 q2 -8 6 -3 q3 -7 6 0 q4 -4 4 4 z" fill="#FF1744" ${TH}/>
    <path d="M19 -46 l9 3 l-9 3 z" fill="#FF9800" ${TH}/>
    <path d="M17 -38 q3 6 -2 7 q-3 -3 2 -7z" fill="#FF1744"/>
    <circle cx="12" cy="-46" r="2.2" fill="${INK}"/>
    <g class="sad"><path d="M8 -42 q-3 5 0 7 q3 -2 0 -7z" fill="#4FC3F7"/></g>
    <g class="happy"><circle cx="8" cy="-40" r="2.5" fill="#FF8A80" opacity=".8"/></g>
    <g class="band" transform="translate(-3 -24)"><rect x="-10" y="-4.5" width="20" height="9" rx="4.5" fill="#fff" ${TH}/></g>`,
  varken: `
    <path d="M-21 -22 q-10 -2 -7 -9 q3 -4 5 1" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
    <ellipse cx="-10" cy="-2" rx="7" ry="4" fill="#F48FB1" ${TH}/><ellipse cx="10" cy="-2" rx="7" ry="4" fill="#F48FB1" ${TH}/>
    <ellipse cx="0" cy="-18" rx="22" ry="16" fill="#F48FB1" ${ST}/>
    <path d="M-2 -50 l-2 -12 l10 6z M14 -52 l6 -10 l3 11z" fill="#F48FB1" ${TH}/>
    <circle cx="8" cy="-40" r="15" fill="#F48FB1" ${TH}/>
    <ellipse cx="19" cy="-37" rx="6.5" ry="5.5" fill="#F06292" ${TH}/>
    <circle cx="17" cy="-37" r="1.3" fill="${INK}"/><circle cx="21" cy="-37" r="1.3" fill="${INK}"/>
    <circle cx="4" cy="-44" r="2.4" fill="${INK}"/><circle cx="12" cy="-45" r="2.4" fill="${INK}"/>
    <g class="sad"><path d="M3 -31 q4 -3 8 0" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/><path d="M0 -41 q-3 5 0 7 q3 -2 0 -7z" fill="#4FC3F7"/></g>
    <g class="happy"><path d="M2 -33 q5 4 10 0" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/></g>
    <g class="band" transform="translate(-6 -20) rotate(-15)"><rect x="-10" y="-4.5" width="20" height="9" rx="4.5" fill="#fff" ${TH}/></g>`
};
const PL_COL = { rood: "#FF1744", blauw: "#2979FF", geel: "#FFD600", groen: "#22C55E" };
function plasterSVG(col) {
  return `<svg viewBox="0 0 84 44"><g transform="rotate(-12 42 22)"><rect x="6" y="11" width="72" height="22" rx="11" fill="${col}" ${ST}/>
    <rect x="30" y="14" width="24" height="16" rx="4" fill="#fff" opacity=".85"/>
    <g fill="#fff" opacity=".9"><circle cx="16" cy="18" r="1.8"/><circle cx="21" cy="25" r="1.8"/><circle cx="63" cy="18" r="1.8"/><circle cx="68" cy="25" r="1.8"/></g></g></svg>`;
}
function hospitalSVG() {
  let wins = "";
  for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) wins += `<rect x="${-72 + c * 40}" y="${-112 + r * 30}" width="24" height="18" rx="3" fill="#E3F7FF" ${TH}/>`;
  return `
    <rect x="-90" y="-150" width="180" height="150" rx="6" fill="#fff" ${ST}/>
    <rect x="-90" y="-150" width="180" height="26" rx="6" fill="#29B6F6" ${ST}/>
    <text x="0" y="-131" text-anchor="middle" font-family="Baloo 2, Arial Rounded MT Bold, sans-serif" font-weight="800" font-size="16" fill="#fff">ZIEKENHUIS</text>
    <circle cx="0" cy="-168" r="17" fill="#fff" ${ST}/>
    <g transform="translate(0 -168) scale(.7)">${[0, 60, 120].map(a => `<rect x="-5.5" y="-17" width="11" height="34" rx="2" transform="rotate(${a})" fill="${C.blue}"/>`).join("")}</g>
    ${wins}
    <path d="M-40 -52 h80 l-8 -10 h-64 z" fill="${C.sblue}" ${TH}/>
    <rect x="-26" y="-50" width="52" height="50" fill="${C.glass}" ${TH}/>
    <path d="M0 -50 V0" stroke="${INK}" stroke-width="3"/>`;
}
function animate(dur, fn, done) {
  const d0 = D, t0 = performance.now();
  const step = now => {
    if (D !== d0) return;
    const t = Math.min(1, (now - t0) / dur);
    fn(t);
    if (t < 1) requestAnimationFrame(step); else if (done) done();
  };
  requestAnimationFrame(step);
}
const hop = (g, x, t) => g.setAttribute("transform", `translate(${x} ${-Math.abs(Math.sin(t * Math.PI * 4)) * 10})`);

MODES.ambulance = {
  setup() {
    D.carrying = null;
    $("#b_kit").addEventListener("click", kitButton);
    D.nextT = later(spawnPatient, 4000);
  },
  arrive(ev) {
    if (ev.type === "patient") say("au_" + ev.animal, () => { if (D && D.ev === ev && !ev.healed) askPlaster(ev); });
    else { say("ziekenhuis"); later(() => dropOff(ev), 1200); }
  },
  gone() {
    clearTimeout(D.nextT);
    D.nextT = D.carrying ? later(spawnHospital, rnd(2000, 3500)) : later(spawnPatient, rnd(2000, 3500));
  },
  tick() {}
};
function kitButton() {
  unlockAudio();
  const b = $("#b_kit"); b.classList.remove("bounce"); void b.offsetWidth;
  const ev = D.ev;
  if (ev && ev.type === "patient") { sfx.pop(); if (ev.arrived && !ev.healed) say(ev.target ? "pl_" + ev.target : "au_" + ev.animal); return; }
  if (D.carrying) {
    say("eerst_ziekenhuis");
    if (!ev) { clearTimeout(D.nextT); spawnHospital(); }
    return;
  }
  if (!ev) { clearTimeout(D.nextT); sfx.sparkle(); spawnPatient(); } else sfx.pop();
}
const AMB_DOOR = () => D.v.drive.x + 196 * D.v.drive.k;
function spawnPatient() {
  if (!D || D.ev || D.carrying) return;
  const animal = pick(["konijn", "eend", "varken"]);
  const g = svgEl("", `<rect class="hit" x="-45" y="-100" width="90" height="100" fill="transparent"/><g class="animal">${ANIMALS[animal]}</g>`);
  $("#evLayer").appendChild(g);
  const ev = { type: "patient", animal, el: g, wx: D.dist + 760, stopX: 440 };
  g.addEventListener("pointerdown", e => { e.stopPropagation(); unlockAudio(); if (ev.arrived && !ev.healed) say(ev.target ? "pl_" + ev.target : "au_" + animal); });
  D.ev = ev;
}
function askPlaster(ev) {
  const cols = Object.keys(PL_COL).sort(() => Math.random() - .5).slice(0, 3);
  ev.target = pick(cols);
  const panel = document.createElement("div");
  panel.className = "plasters"; panel.id = "plasters";
  panel.innerHTML = cols.map(c => `<button class="plaster" data-c="${c}" aria-label="${c}">${plasterSVG(PL_COL[c])}</button>`).join("");
  $("#drive").appendChild(panel);
  panel.querySelectorAll(".plaster").forEach(b => b.addEventListener("click", () => {
    const c = b.dataset.c;
    if (c === ev.target) { panel.remove(); heal(ev, c); return; }
    b.classList.remove("wrong"); void b.offsetWidth; b.classList.add("wrong");
    sfx.whoosh(); say("nee_" + ev.target);
  }));
  say("pl_" + ev.target);
}
function heal(ev, c) {
  ev.healed = true;
  const a = ev.el.querySelector(".animal");
  a.querySelector(".band rect").setAttribute("fill", PL_COL[c]);
  a.classList.add("healed");
  sparkleAt($("#dfx"), ev.sx, GROUND - 50, true);
  sfx.sparkle();
  say(pick(["goed1", "goed2", "goed3", "goed4"]), () => { if (D && D.ev === ev) say("instappen"); });
  later(() => {
    const dx = AMB_DOOR() - ev.sx;
    animate(1200, t => { hop(a, dx * t, t); a.style.opacity = t > .8 ? String((1 - t) * 5) : "1"; }, () => {
      D.carrying = { animal: ev.animal, col: PL_COL[c] };
      ev.released = true;
      if (!D.siren) $("#b_siren").classList.add("hintbtn");
      sfx.pop();
    });
  }, 1800);
}
function spawnHospital() {
  if (!D || D.ev) return;
  const g = svgEl("", hospitalSVG());
  $("#evLayer").appendChild(g);
  D.ev = { type: "hospital", el: g, wx: D.dist + 800, stopX: 470 };
}
function dropOff(ev) {
  const cr = D.carrying;
  if (!cr) { ev.released = true; return; }
  const g = svgEl("animal healed", ANIMALS[cr.animal]);
  g.querySelector(".band rect").setAttribute("fill", cr.col);
  ev.el.appendChild(g);
  const x0 = AMB_DOOR() - ev.sx;
  sfx.pop();
  animate(1300, t => { hop(g, x0 * (1 - t), t); }, () => {
    heartsAt($("#dfx"), ev.sx, GROUND - 80);
    sfx.sparkle();
    D.carrying = null;
    $("#b_siren").classList.remove("hintbtn");
    say("beter_" + cr.animal, () => { if (D) addCount(); });
    later(() => { animate(500, t => { g.style.opacity = String(1 - t); }, () => g.remove()); }, 2200);
    later(() => { ev.released = true; }, 3200);
  });
}


/* ---------- tractor: dieren voeren (tellen) en geluiden raden ---------- */
const FOODS = {
  wortel: { col: "#FF8A00", svg: `<path d="M20 36 L12 14 Q20 8 28 14 Z" fill="#FF8A00" ${TH}/><path d="M15 21 h5 M17 27 h4" stroke="${INK}" stroke-width="2"/><path d="M20 11 l-6 -7 M20 11 V2 M20 11 l6 -7" stroke="#43A047" stroke-width="4" stroke-linecap="round"/>` },
  appel: { col: "#FF1744", svg: `<path d="M20 12 C12 6 4 12 6 22 C8 32 14 36 20 33 C26 36 32 32 34 22 C36 12 28 6 20 12Z" fill="#FF1744" ${TH}/><path d="M20 12 q0 -6 3 -8" stroke="${INK}" stroke-width="2.5" fill="none"/><path d="M22 8 q7 -4 10 1 q-6 3 -10 -1z" fill="#43A047" ${TH}/>` },
  gras: { col: "#43A047", svg: ["M20 36 Q18 20 10 6", "M20 36 Q20 18 20 3", "M20 36 Q22 20 30 6", "M20 36 Q14 26 5 18", "M20 36 Q26 26 35 18"].map(d => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>`).join("") + ["M20 36 Q18 20 10 6", "M20 36 Q20 18 20 3", "M20 36 Q22 20 30 6", "M20 36 Q14 26 5 18", "M20 36 Q26 26 35 18"].map(d => `<path d="${d}" fill="none" stroke="#66BB6A" stroke-width="4" stroke-linecap="round"/>`).join("") },
  sla: { col: "#9CCC65", svg: `<path d="M20 36 C6 30 4 16 12 8 C16 4 24 4 28 8 C36 16 34 30 20 36Z" fill="#9CCC65" ${TH}/><path d="M20 34 V10 M20 20 l-7 -5 M20 26 l7 -5" stroke="#558B2F" stroke-width="2" fill="none"/>` },
  brood: { col: "#D7A86E", svg: `<path d="M8 18 C6 8 34 8 32 18 V34 H8 Z" fill="#D7A86E" ${TH}/><path d="M12 18 C11 12 29 12 28 18 V30 H12 Z" fill="#FFE0B2"/>` },
  worm: { col: "#F48FB1", svg: `<path d="M5 28 q5 -12 10 0 t10 0 t9 -8" fill="none" stroke="${INK}" stroke-width="10" stroke-linecap="round"/><path d="M5 28 q5 -12 10 0 t10 0 t9 -8" fill="none" stroke="#F48FB1" stroke-width="5.5" stroke-linecap="round"/><circle cx="33" cy="20" r="1.6" fill="${INK}"/>` }
};
const FEED = { konijn: "wortel", varken: "appel", koe: "gras", schaap: "sla", eend: "brood", kip: "worm" };
const SOUNDS = ["koe", "schaap", "varken", "eend", "kip"];
const foodSVG = f => `<svg viewBox="0 0 40 40">${FOODS[f].svg}</svg>`;
const animalFace = a => `<svg viewBox="-42 -92 90 96"><g class="animal fine">${ANIMALS[a]}</g></svg>`;

MODES.tractor = {
  seq: 0,
  setup() {
    this.seq = 0;
    $("#b_animal").addEventListener("click", animalButton);
    D.nextT = later(() => this.next(), 4000);
  },
  next() {
    if (!D || D.ev) return;
    this.seq++ % 2 === 0 ? spawnFeed() : spawnShed();
  },
  gone() { clearTimeout(D.nextT); D.nextT = later(() => this.next(), rnd(2000, 3500)); },
  arrive(ev) {
    if (ev.type === "feed") say(`wil_${ev.animal}_${ev.n}`, () => { if (D && D.ev === ev && !ev.panel) showFood(ev); });
    else askSound(ev);
  },
  tick() {}
};
function animalButton() {
  unlockAudio();
  const ev = D.ev;
  if (!ev) { clearTimeout(D.nextT); sfx.sparkle(); MODES.tractor.next(); return; }
  sfx.pop();
  if (!ev.arrived || ev.done) return;
  if (ev.type === "feed") say(`wil_${ev.animal}_${ev.n}`, () => { if (D && D.ev === ev && !ev.panel) showFood(ev); });
  else say("wie_" + ev.target);
}
function spawnFeed() {
  const animal = pick(Object.keys(FEED)), n = 1 + Math.floor(Math.random() * 5);
  const w = n * 24 + 14;
  const bubble = `<g class="bubble" transform="translate(4 -112)" style="display:none">
    <path d="M-8 14 L0 26 L8 14 Z" fill="#fff" ${ST}/>
    <rect x="${-w / 2}" y="-17" width="${w}" height="34" rx="17" fill="#fff" ${ST}/>
    <rect x="-9" y="12" width="18" height="6" fill="#fff"/>
    ${Array.from({ length: n }, (_, i) => `<circle class="slot" cx="${-w / 2 + 19 + i * 24}" cy="0" r="9" fill="#fff" stroke="${INK}" stroke-width="2.5" stroke-dasharray="4 3"/>`).join("")}</g>`;
  const g = svgEl("", `<rect class="hit" x="-50" y="-100" width="100" height="100" fill="transparent"/><g class="animal fine">${ANIMALS[animal]}</g>${bubble}`);
  $("#evLayer").appendChild(g);
  const ev = { type: "feed", animal, n, got: 0, el: g, wx: D.dist + 760, stopX: 470 };
  g.addEventListener("pointerdown", e => { e.stopPropagation(); if (ev.arrived && !ev.done) say(`wil_${animal}_${n}`); });
  D.ev = ev;
}
function showFood(ev) {
  const f = FEED[ev.animal];
  ev.el.querySelector(".bubble").style.display = "";
  const panel = document.createElement("div");
  panel.className = "plasters food"; panel.id = "choice";
  panel.innerHTML = Array.from({ length: 6 }, () => `<button class="plaster fooditem" aria-label="${f}">${foodSVG(f)}</button>`).join("");
  $("#drive").appendChild(panel);
  ev.panel = panel;
  const slots = [...ev.el.querySelectorAll(".slot")];
  panel.querySelectorAll(".fooditem").forEach(b => b.addEventListener("click", () => {
    if (ev.done || b.classList.contains("used")) return;
    b.classList.add("used");
    ev.got++;
    const sl = slots[ev.got - 1];
    sl.setAttribute("fill", FOODS[f].col); sl.removeAttribute("stroke-dasharray");
    sparkleAt($("#dfx"), ev.sx + 20, GROUND - 50, false, [FOODS[f].col, "#fff", "#FFD600"]);
    sfx.pop();
    say("n" + ev.got);
    if (ev.got >= ev.n) {
      ev.done = true;
      later(() => panel.remove(), 400);
      later(() => {
        const a = ev.el.querySelector(".animal");
        a.classList.remove("bounce"); void a.getBBox(); a.classList.add("bounce");
        heartsAt($("#dfx"), ev.sx + 10, GROUND - 90);
        sfx.sparkle();
        say("lekker", () => { if (D) addCount(); });
      }, 900);
      later(() => { ev.el.querySelector(".bubble").style.display = "none"; }, 3000);
      later(() => { ev.released = true; }, 4200);
    }
  }));
}
function shedSVG(animal) {
  return `<rect class="hit" x="-60" y="-110" width="120" height="110" fill="transparent"/>
    <rect x="-48" y="-78" width="96" height="78" fill="#A1887F" ${ST}/>
    <path d="M-56 -76 L0 -110 L56 -76 Z" fill="#6D4C41" ${ST}/>
    <path d="M-48 -56 h96 M-48 -34 h96 M-48 -12 h96" stroke="#795548" stroke-width="2.5"/>
    <rect x="-22" y="-60" width="44" height="60" fill="#3E2723" ${TH}/>
    <g class="hidden-animal" style="display:none"><g class="animal fine">${ANIMALS[animal]}</g></g>
    <g class="door"><rect x="-22" y="-60" width="44" height="60" fill="#8D6E63" ${TH}/>
      <path d="M-22 -60 L22 0 M22 -60 L-22 0" stroke="${INK}" stroke-width="3"/>
      <text x="0" y="-66" text-anchor="middle" font-family="Baloo 2, Arial Rounded MT Bold, sans-serif" font-weight="800" font-size="22" fill="#FFD600" stroke="${INK}" stroke-width="1.5">?</text></g>`;
}
function spawnShed() {
  const target = pick(SOUNDS);
  const g = svgEl("", shedSVG(target));
  $("#evLayer").appendChild(g);
  const ev = { type: "sound", target, el: g, wx: D.dist + 760, stopX: 470 };
  g.addEventListener("pointerdown", e => { e.stopPropagation(); if (ev.arrived && !ev.done) say("wie_" + target); });
  D.ev = ev;
}
function askSound(ev) {
  const others = SOUNDS.filter(a => a !== ev.target).sort(() => Math.random() - .5).slice(0, 2);
  const opts = [ev.target, ...others].sort(() => Math.random() - .5);
  const panel = document.createElement("div");
  panel.className = "plasters faces"; panel.id = "choice";
  panel.innerHTML = opts.map(a => `<button class="plaster face" data-a="${a}" aria-label="${a}">${animalFace(a)}</button>`).join("");
  $("#drive").appendChild(panel);
  ev.panel = panel;
  panel.querySelectorAll(".face").forEach(b => b.addEventListener("click", () => {
    if (ev.done) return;
    const a = b.dataset.a;
    if (a !== ev.target) {
      b.classList.remove("wrong"); void b.offsetWidth; b.classList.add("wrong");
      sfx.whoosh();
      say("nee_" + a, () => { if (D && D.ev === ev && !ev.done) say("wie_" + ev.target); });
      return;
    }
    ev.done = true;
    panel.remove();
    ev.el.querySelector(".door").style.display = "none";
    const h = ev.el.querySelector(".hidden-animal");
    h.style.display = "";
    h.classList.add("bounce");
    sparkleAt($("#dfx"), ev.sx, GROUND - 60, true);
    sfx.sparkle();
    say("ja_" + ev.target, () => { if (D) addCount(); });
    later(() => { ev.released = true; }, 4000);
  }));
  say("wie_" + ev.target);
}


/* ---------- vliegtuig: ballonnen (kleuren), hoepels (vormen), letters (XAVI) ---------- */
const ROWS = [96, 176, 255];
const BAL = { rood: "#FF1744", blauw: "#2979FF", geel: "#FFD600", groen: "#22C55E", oranje: "#FF8A00", paars: "#9C27B0" };
const SHAPES = {
  cirkel: `<circle r="28"/>`,
  vierkant: `<rect x="-26" y="-26" width="52" height="52" rx="4"/>`,
  driehoek: `<path d="M0 -31 L31 24 H-31 Z"/>`,
  ster: `<path d="M0 -33 l9.4 19.1 21 3.1 -15.2 14.8 3.6 21 -18.8 -9.9 -18.8 9.9 3.6 -21 -15.2 -14.8 21 -3.1z"/>`,
  hart: `<path d="M0 26 C-30 8 -34 -12 -22 -22 C-12 -30 -2 -24 0 -16 C2 -24 12 -30 22 -22 C34 -12 30 8 0 26Z"/>`
};
const NAME = ["X", "A", "V", "I"];
const OTHER_LETTERS = "BDEKMOPRSTUW".split("");
function itemSVG(type, val) {
  if (type === "kleur") return `<path d="M0 30 q-7 12 2 28" fill="none" stroke="${INK}" stroke-width="2"/>
    <ellipse rx="25" ry="31" fill="${BAL[val]}" ${ST}/><path d="M-6 30 h12 l-6 -7z" fill="${BAL[val]}" ${TH}/>
    <ellipse cx="-9" cy="-12" rx="6" ry="10" fill="#fff" opacity=".55"/>`;
  if (type === "vorm") {
    const sh = SHAPES[val];
    return `<g fill="none" stroke="${INK}" stroke-width="15" stroke-linejoin="round">${sh}</g>
      <g fill="#fff" fill-opacity=".35" stroke="#7C4DFF" stroke-width="8" stroke-linejoin="round">${sh}</g>`;
  }
  return `<circle cx="-22" cy="10" r="14" fill="#fff" ${TH}/><circle cx="22" cy="10" r="14" fill="#fff" ${TH}/>
    <circle r="30" fill="#fff" ${ST}/>
    <text y="14" text-anchor="middle" font-family="Baloo 2, Arial Rounded MT Bold, sans-serif" font-weight="800" font-size="42" fill="${C.blue}">${val}</text>`;
}
const promptFor = (type, t) => type === "kleur" ? "vl_" + t : type === "vorm" ? "vv_" + t : "lt_" + t;
const wrongFor = (type, v) => type === "kleur" ? "nk_" + v : type === "vorm" ? "nv_" + v : "nee_lt";

MODES.vliegtuig = {
  setup() {
    D.py = D.ty = 165; D.items = []; D.round = null; D.gameIdx = 0; D.loop = null;
    D.carPos = $("#carPos");
    let steering = false;
    const aim = e => { D.ty = Math.max(55, Math.min(262, stagePoint(e).y)); };
    D.scene.addEventListener("pointerdown", e => { unlockAudio(); steering = true; aim(e); });
    D.scene.addEventListener("pointermove", e => { if (steering) aim(e); });
    const up = () => { steering = false; };
    window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
    D.cleanup = () => { window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up); };
    $("#b_looping").addEventListener("click", () => { if (!D.loop) { D.loop = { t0: performance.now() }; say("looping"); } });
    $("#b_game").addEventListener("click", gameButton);
    const nb = document.createElement("div");
    nb.className = "jail namebar"; nb.id = "nameBar"; nb.hidden = true;
    nb.innerHTML = NAME.map(l => `<span class="nl">${l}</span>`).join("");
    $("#drive").appendChild(nb);
    D.nextT = later(startRound, 5000);
  },
  arrive() {}, gone() {},
  tick(dt, dx, now) {
    const dp = D.v.drive, k = dp.k;
    const prev = D.py;
    D.py += (D.ty - D.py) * Math.min(1, dt * 4);
    let rot = Math.max(-18, Math.min(18, (D.py - prev) / Math.max(dt, .001) * 0.06)), yOff = 0;
    if (D.loop) {
      const t = Math.min(1, (now - D.loop.t0) / 1300), e = t * t * (3 - 2 * t);
      rot -= 360 * e; yOff = -55 * Math.sin(Math.PI * e);
      if (t >= 1) D.loop = null;
    }
    D.carPos.setAttribute("transform", `translate(${dp.x} ${D.py - 45 * k + yOff}) scale(${k}) rotate(${rot} 108 45)`);
    if (!D.items.length) return;
    const nx = dp.x + 205 * k, ny = D.py + yOff;
    let alive = 0;
    D.items.forEach(it => {
      if (it.gone) return;
      it.x -= dx;
      it.el.setAttribute("transform", `translate(${it.x} ${it.y})`);
      if (!it.hit && Math.abs(it.x - nx) < 34 && Math.abs(it.y - ny) < 42) hitItem(it);
      if (it.x > -70) alive++;
    });
    if (!alive && D.round && !D.round.solved) {
      clearWave();
      say("mis");
      D.nextT = later(spawnWave, 1800);
    }
  }
};
function clearWave() { D.items.forEach(it => it.el.remove()); D.items = []; }
function startRound() {
  if (!D || D.round) return;
  const type = ["kleur", "vorm", "letters"][D.gameIdx++ % 3];
  if (type === "letters") {
    D.round = { type, pos: 0 };
    const nb = $("#nameBar"); nb.hidden = false; nb.querySelectorAll(".nl").forEach(n => n.classList.remove("got"));
    say("lt_start", () => { if (D && D.round && D.round.type === "letters" && !D.items.length) spawnWave(); });
  } else {
    D.round = { type, target: pick(Object.keys(type === "kleur" ? BAL : SHAPES)) };
    spawnWave();
  }
}
function waveTarget() { const r = D.round; return r.type === "letters" ? NAME[r.pos] : r.target; }
function spawnWave() {
  if (!D || !D.round || D.items.length) return;
  const r = D.round, t = waveTarget();
  const pool = r.type === "kleur" ? Object.keys(BAL) : r.type === "vorm" ? Object.keys(SHAPES) : OTHER_LETTERS;
  const opts = [t, ...pool.filter(x => x !== t).sort(() => Math.random() - .5).slice(0, 2)].sort(() => Math.random() - .5);
  D.items = opts.map((val, i) => {
    const el = svgEl("skyitem", itemSVG(r.type, val));
    $("#evLayer").appendChild(el);
    return { el, val, x: 740, y: ROWS[i] };
  });
  say(promptFor(r.type, t));
}
function hitItem(it) {
  it.hit = true;
  const r = D.round, t = waveTarget();
  if (it.val !== t) {
    it.gone = true;
    it.el.classList.add("poof");
    sfx.whoosh();
    say(wrongFor(r.type, it.val), () => { if (D && D.round === r && !r.solved && D.items.length) say(promptFor(r.type, waveTarget())); });
    later(() => it.el.remove(), 500);
    return;
  }
  sparkleAt($("#dfx"), it.x, it.y, true, r.type === "kleur" ? [BAL[it.val], "#fff", "#FFD600"] : undefined);
  sfx.pop(); sfx.sparkle();
  D.items.forEach(o => { o.gone = true; o.el.classList.add("poof"); });
  const old = D.items; D.items = [];
  later(() => old.forEach(o => o.el.remove()), 500);
  if (r.type === "letters") {
    $("#nameBar").querySelectorAll(".nl")[r.pos].classList.add("got");
    r.pos++;
    if (r.pos < NAME.length) { D.nextT = later(spawnWave, 900); return; }
    r.solved = true;
    confetti(70);
    say("lt_klaar", () => { if (D) addCount(); });
    later(() => { $("#nameBar").hidden = true; }, 6000);
    D.round = null;
    D.nextT = later(startRound, 7000);
    return;
  }
  r.solved = true;
  D.round = null;
  say(pick(["goed1", "goed2", "goed3", "goed4"]), () => { if (D) addCount(); });
  D.nextT = later(startRound, 3800);
}
function gameButton() {
  unlockAudio();
  if (!D.round) { clearTimeout(D.nextT); sfx.sparkle(); startRound(); return; }
  sfx.pop();
  if (D.items.length) say(promptFor(D.round.type, waveTarget()));
}


/* ---------- boot: vissen, ophaalbrug, drijven of zinken, zeehond ---------- */
const FISH_COLS = ["rood", "blauw", "geel", "groen"];
const FISH_LANES = [202, 234, 266];
const fishSVG = col => `<path d="M14 0 L27 -10 L25 0 L27 10 Z" fill="${BAL[col]}" ${TH}/>
  <ellipse rx="18" ry="11" fill="${BAL[col]}" ${TH}/><path d="M-2 -10 q6 -8 12 0" fill="${BAL[col]}" ${TH}/>
  <circle cx="-9" cy="-2" r="3" fill="#fff"/><circle cx="-9.6" cy="-2" r="1.6" fill="${INK}"/>
  <path d="M-17 4 q3 2 6 0" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`;
const OBJ = {
  appel: [true, `<path d="M0 -10 C-9 -16 -17 -9 -15 1 C-13 11 -6 15 0 12 C6 15 13 11 15 1 C17 -9 9 -16 0 -10Z" fill="#FF1744" ${TH}/><path d="M0 -10 q0 -6 3 -8" stroke="${INK}" stroke-width="2.5" fill="none"/><path d="M2 -14 q7 -4 10 1 q-6 3 -10 -1z" fill="#43A047" ${TH}/>`],
  steen: [false, `<path d="M-16 6 C-18 -6 -8 -12 2 -11 C12 -10 18 -4 16 6 C14 13 -12 14 -16 6Z" fill="#90A4AE" ${TH}/><path d="M-6 -4 l4 3 M6 2 l3 -3" stroke="#607D8B" stroke-width="2"/>`],
  badeend: [true, `<ellipse cy="4" rx="15" ry="9" fill="#FFD600" ${TH}/><circle cx="-7" cy="-7" r="7" fill="#FFD600" ${TH}/><path d="M-14 -7 l-7 2 l7 3z" fill="#FF8A00" ${TH}/><circle cx="-8" cy="-9" r="1.5" fill="${INK}"/><path d="M13 0 l6 -6 l0 7z" fill="#FFD600" ${TH}/>`],
  sleutel: [false, `<circle cx="-9" r="7" fill="none" stroke="${INK}" stroke-width="6"/><circle cx="-9" r="7" fill="none" stroke="#FFC107" stroke-width="3"/><path d="M-2 0 H16 M10 0 V6 M15 0 V5" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M-2 0 H16 M10 0 V6 M15 0 V5" stroke="#FFC107" stroke-width="3" stroke-linecap="round"/>`],
  bal: [true, `<circle r="13" fill="#fff" ${TH}/><path d="M-13 0 A13 13 0 0 1 13 0 Z" fill="#2979FF"/><path d="M0 -13 A13 13 0 0 1 0 13" fill="none" stroke="${C.fred}" stroke-width="4"/><circle r="13" fill="none" ${TH}/>`],
  munt: [false, `<circle r="11" fill="#FFC107" ${TH}/><circle r="7" fill="none" stroke="#E0A800" stroke-width="2"/><text y="4" text-anchor="middle" font-size="11" font-weight="800" font-family="Arial" fill="#E0A800">€</text>`],
  blad: [true, `<path d="M-16 4 C-12 -12 8 -14 16 -8 C12 8 -6 12 -16 4Z" fill="#8BC34A" ${TH}/><path d="M-16 4 C-6 0 4 -4 16 -8" fill="none" stroke="#558B2F" stroke-width="2"/>`],
  kurk: [true, `<path d="M-9 -12 H9 L7 12 H-7 Z" fill="#D7A86E" ${TH}/><circle cx="-3" cy="-4" r="1.5" fill="#A1887F"/><circle cx="3" cy="4" r="1.5" fill="#A1887F"/>`],
  veer: [true, `<path d="M-16 10 C-8 -2 4 -12 16 -14 C12 -2 2 8 -16 10Z" fill="#fff" ${TH}/><path d="M-16 10 L12 -11" stroke="#90A4AE" stroke-width="2"/>`],
  potlood: [true, `<g transform="rotate(-20)"><rect x="-16" y="-5" width="26" height="10" fill="#FFC107" ${TH}/><path d="M10 -5 L20 0 L10 5 Z" fill="#FFE0B2" ${TH}/><path d="M16 -2 L20 0 L16 2Z" fill="${INK}"/><rect x="-21" y="-5" width="6" height="10" fill="#F48FB1" ${TH}/></g>`],
  ijsblokje: [true, `<rect x="-11" y="-11" width="22" height="22" rx="4" fill="#E1F5FE" ${TH}/><path d="M-6 -6 h6" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`],
  knikker: [false, `<circle r="10" fill="#7C4DFF" ${TH}/><path d="M-5 -1 q5 -6 10 0" stroke="#fff" stroke-width="2.5" fill="none"/><circle cx="-4" cy="-4" r="2.5" fill="#fff" opacity=".8"/>`],
  lepel: [false, `<g transform="rotate(-25)"><ellipse cx="-10" rx="7" ry="5" fill="#B0BEC5" ${TH}/><rect x="-3" y="-2" width="22" height="4" rx="2" fill="#B0BEC5" ${TH}/></g>`],
  autootje: [false, `<path d="M-8 -4 L-4 -11 H6 L10 -4Z" fill="#FF1744" ${TH}/><rect x="-15" y="-4" width="30" height="10" rx="3" fill="#FF1744" ${TH}/><circle cx="-8" cy="7" r="4" fill="${INK}"/><circle cx="8" cy="7" r="4" fill="${INK}"/>`],
  spijker: [false, `<g transform="rotate(-30)"><rect x="-14" y="-6" width="4" height="12" rx="1" fill="#90A4AE" ${TH}/><rect x="-11" y="-1.8" width="24" height="3.6" fill="#90A4AE" ${TH}/><path d="M13 -1.8 L18 0 L13 1.8Z" fill="#90A4AE" ${TH}/></g>`],
  schelp: [false, `<path d="M0 10 L-15 -2 C-12 -14 12 -14 15 -2 Z" fill="#FFAB91" ${TH}/><path d="M0 10 L-8 -10 M0 10 V-12 M0 10 L8 -10" stroke="#E64A19" stroke-width="2"/>`]
};

MODES.boot = {
  seq: 0,
  setup() {
    this.seq = 0;
    D.py = D.ty = 234; D.fish = []; D.fishing = null; D.carPos = $("#carPos");
    const dc = $("#dcar"); dc.classList.remove("carbob"); dc.classList.add("rock");
    let steering = false;
    const aim = e => { D.ty = Math.max(194, Math.min(268, stagePoint(e).y)); };
    D.scene.addEventListener("pointerdown", e => { unlockAudio(); steering = true; aim(e); });
    D.scene.addEventListener("pointermove", e => { if (steering) aim(e); });
    const up = () => { steering = false; };
    window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
    D.cleanup = () => { window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up); };
    $("#b_vis").addEventListener("click", () => boatStart("vissen"));
    $("#b_dz").addEventListener("click", () => boatStart("kade"));
    const nb = document.createElement("div");
    nb.className = "jail namebar"; nb.id = "nameBar"; nb.hidden = true;
    $("#drive").appendChild(nb);
    D.nextT = later(() => this.next(), 4500);
  },
  next() {
    if (!D || D.ev || D.fishing) return;
    const t = pick(["vissen", "brug", "kade", "zeehond"].filter(x => x !== this.last));
    this.last = t;
    ({ vissen: startFishing, brug: spawnBridge, kade: spawnDock, zeehond: spawnSeal })[t]();
  },
  gone() { clearTimeout(D.nextT); D.nextT = later(() => MODES.boot.next(), rnd(2000, 3500)); },
  arrive(ev) {
    if (ev.type === "brug") { say("brug_daar"); ev.el.querySelector(".bellhint").classList.add("pulse"); }
    else if (ev.type === "kade") askFloat(ev);
    else say("zh_daar");
  },
  tick(dt, dx, now) {
    const dp = D.v.drive, k = dp.k;
    if (D.ev && !D.ev.released && D.ev.lane) D.ty = D.ev.lane;
    const prev = D.py;
    D.py += (D.ty - D.py) * Math.min(1, dt * 3.5);
    const tilt = Math.max(-6, Math.min(6, (D.py - prev) / Math.max(dt, .001) * 0.05));
    D.carPos.setAttribute("transform", `translate(${dp.x} ${D.py - 80 * k}) scale(${k}) rotate(${tilt} 110 78)`);
    const cx = dp.x + 110 * k;
    D.fish.forEach(f => {
      if (f.done) return;
      f.x -= dx + f.swim * dt * 60;
      f.el.setAttribute("transform", `translate(${f.x} ${f.y + Math.sin(now / 300 + f.ph) * 2})`);
      if (D.fishing && !f.caught && Math.abs(f.x - cx) < 58 && Math.abs(f.y - D.py) < 20) catchFish(f);
      if (f.x < -40) { f.done = true; f.el.remove(); }
    });
    D.fish = D.fish.filter(f => !f.done);
  }
};
function boatStart(kind) {
  unlockAudio();
  if (D.fishing) { sfx.pop(); say(`vis_${D.fishing.col}_${D.fishing.n}`); return; }
  const ev = D.ev;
  if (ev && !ev.released) {
    if (ev.arrived) { sfx.pop(); say(ev.type === "brug" ? "brug_daar" : ev.type === "zeehond" ? "zh_daar" : "dz_q_" + ev.obj); return; }
    ev.el.remove(); D.ev = null;
  }
  clearTimeout(D.nextT); sfx.sparkle();
  MODES.boot.last = kind;
  kind === "vissen" ? startFishing() : spawnDock();
}
/* vissen */
function startFishing() {
  const col = pick(FISH_COLS), n = 2 + Math.floor(Math.random() * 3);
  D.fishing = { col, n, got: 0, spawned: 0 };
  const nb = $("#nameBar");
  nb.innerHTML = Array.from({ length: n }, () => `<svg class="slotfish" viewBox="-30 -14 60 28">${fishSVG(col)}</svg>`).join("");
  nb.hidden = false;
  say(`vis_${col}_${n}`);
  spawnFish();
}
function spawnFish() {
  if (!D || !D.fishing) return;
  const f = D.fishing;
  f.spawned++;
  const col = (f.spawned % 2 === 1 || Math.random() < .35) ? f.col : pick(FISH_COLS.filter(c => c !== f.col));
  const el = svgEl("fish", fishSVG(col));
  $("#fishLayer").appendChild(el);
  D.fish.push({ el, col, x: 700, y: pick(FISH_LANES), swim: .5 + Math.random() * .6, ph: Math.random() * 6 });
  D.fishT = later(spawnFish, rnd(900, 1500));
}
function jumpFish(f, x2, y2, dur, done) {
  const x0 = f.x, y0 = f.y;
  f.done = true;
  $("#dfx").appendChild(f.el);
  animate(dur, t => {
    const x = x0 + (x2 - x0) * t, y = y0 + (y2 - y0) * t - Math.sin(Math.PI * t) * 70;
    f.el.setAttribute("transform", `translate(${x} ${y}) rotate(${-40 + 80 * t})`);
  }, done);
}
function catchFish(f) {
  f.caught = true;
  const fs = D.fishing;
  sfx.splash();
  if (f.col !== fs.col) {
    say("nk_" + f.col);
    jumpFish(f, f.x - 80, 300, 900, () => f.el.remove());
    return;
  }
  fs.got++;
  const slot = $("#nameBar").querySelectorAll(".slotfish")[fs.got - 1];
  const r = slot.getBoundingClientRect(), st = stage.getBoundingClientRect(), sc = st.width / W;
  jumpFish(f, (r.left + r.width / 2 - st.left) / sc, (r.top + r.height / 2 - st.top) / sc, 800, () => { f.el.remove(); slot.classList.add("got"); });
  say("n" + fs.got);
  addCount(true);
  if (fs.got >= fs.n) {
    clearTimeout(D.fishT);
    D.fishing = null;
    later(() => { confetti(40); say("vis_vol"); }, 900);
    later(() => { $("#nameBar").hidden = true; }, 4500);
    D.nextT = later(() => MODES.boot.next(), 6500);
  }
}
/* ophaalbrug */
function spawnBridge() {
  const g = svgEl("", `
    <rect class="hit" x="-110" y="-240" width="240" height="250" fill="transparent"/>
    <rect x="36" y="-96" width="12" height="70" fill="#8D6E63" ${TH}/>
    <rect x="34" y="-232" width="8" height="140" fill="#fff" ${TH}/><rect x="58" y="-232" width="8" height="140" fill="#fff" ${TH}/>
    <rect x="30" y="-240" width="40" height="12" rx="3" fill="#fff" ${ST}/>
    <g class="deck"><rect x="-94" y="-102" width="140" height="12" fill="#fff" ${ST}/>
      <path d="M-86 -102 v12 M-66 -102 v12 M-46 -102 v12 M-26 -102 v12 M-6 -102 v12 M14 -102 v12" stroke="${C.fred}" stroke-width="7"/>
      <rect x="-94" y="-102" width="140" height="12" fill="none" ${ST}/></g>
    <circle class="blink" cx="50" cy="-120" r="7" fill="${C.fred}" ${TH}/>
    <g transform="translate(96 -86)"><rect x="-22" y="-26" width="44" height="30" fill="#FFE0B2" ${ST}/><path d="M-27 -26 L0 -44 L27 -26 Z" fill="${C.fred}" ${ST}/><rect x="-4" y="4" width="8" height="40" fill="#8D6E63" ${TH}/>
      <g class="bellhint"><circle cy="-10" r="17" fill="#FFE14D" ${ST}/><path d="M-8 -4 q0 -14 8 -14 q8 0 8 14 z" fill="#FFB300" ${TH}/><circle cy="-2" r="2.5" fill="${INK}"/></g></g>`);
  $("#evLayer").appendChild(g);
  const ev = { type: "brug", el: g, wx: D.dist + 820, stopX: 360, lane: 232 };
  g.addEventListener("pointerdown", e => { e.stopPropagation(); unlockAudio(); openBridge(ev); });
  D.ev = ev;
}
function openBridge(ev) {
  if (!ev.arrived || ev.open) return;
  ev.open = true;
  ev.el.querySelector(".bellhint").classList.remove("pulse");
  sfx.bell(); say("brug_open");
  ev.el.querySelector(".blink").classList.add("blinking");
  const deck = ev.el.querySelector(".deck");
  animate(1800, t => deck.setAttribute("transform", `rotate(${82 * t * t * (3 - 2 * t)} 42 -96)`), () => {
    ev.released = true; sfx.foghorn(); addCount();
  });
}
/* drijven of zinken */
function nextObj() {
  const m = MODES.boot;
  if (!m.bag || !m.bag.length) m.bag = Object.keys(OBJ).sort(() => Math.random() - .5);
  return m.bag.pop();
}
function spawnDock() {
  const obj = nextObj();
  const g = svgEl("", `
    <rect x="-70" y="-78" width="150" height="12" fill="#A1887F" ${ST}/>
    ${[-60, -10, 40, 70].map(x => `<rect x="${x}" y="-70" width="8" height="56" fill="#6D4C41" ${TH}/>`).join("")}
    <path d="M-70 -72 h150" stroke="#795548" stroke-width="2"/>
    <g class="obj" transform="translate(10 -92) scale(1.3)">${OBJ[obj][1]}</g>`);
  $("#evLayer").appendChild(g);
  D.ev = { type: "kade", obj, el: g, wx: D.dist + 800, stopX: 350, lane: 250 };
}
function askFloat(ev) {
  const panel = document.createElement("div");
  panel.className = "plasters side"; panel.id = "choice";
  panel.innerHTML = `<button class="plaster" data-f="1" aria-label="Drijft">${ICONS.boei}</button><button class="plaster" data-f="0" aria-label="Zinkt">${ICONS.anker}</button>`;
  $("#drive").appendChild(panel);
  panel.querySelectorAll(".plaster").forEach(b => b.addEventListener("click", () => {
    if (ev.chosen) return;
    ev.chosen = true; panel.remove();
    dropObject(ev, b.dataset.f === "1");
  }));
  say("dz_q_" + ev.obj, () => { if (D && D.ev === ev && !ev.chosen && !MODES.boot.explained) { MODES.boot.explained = true; say("dz_uitleg"); } });
}
function dropObject(ev, guessFloat) {
  const floats = OBJ[ev.obj][0];
  const o = ev.el.querySelector(".obj");
  const x0 = ev.sx + 10, y0 = GROUND - 92, x1 = ev.sx - 40, y1 = 206;
  const g = svgEl("", OBJ[ev.obj][1]);
  $("#dfx").appendChild(g); o.remove();
  animate(700, t => g.setAttribute("transform", `translate(${x0 + (x1 - x0) * t} ${y0 + (y1 - y0) * t - Math.sin(Math.PI * t) * 60}) scale(1.3) rotate(${t * 200})`), () => {
    sfx.splash();
    sparkleAt($("#dfx"), x1, y1, false, ["#E1F5FE", "#81D4FA", "#fff"]);
    const right = guessFloat === floats;
    const after = () => say(right ? "dz_goed" : "dz_oeps", () => { if (D && right) addCount(); });
    if (floats) {
      g.classList.add("bob");
      g.setAttribute("transform", `translate(${x1} ${y1 - 4}) scale(1.3)`);
      say("dz_r_" + ev.obj, after);
      later(() => { ev.released = true; animate(2500, t => g.setAttribute("transform", `translate(${x1 - t * 220} ${y1 - 4}) scale(1.3)`), () => g.remove()); }, 3500);
    } else {
      $("#fishLayer").appendChild(g);
      sfx.bubbles();
      animate(1600, t => g.setAttribute("transform", `translate(${x1} ${y1 + t * 80}) scale(1.3) rotate(${t * 90})`));
      for (let i = 0; i < 5; i++) later(() => { const b = svgEl("", `<circle class="bubble" r="${3 + Math.random() * 3}" fill="none" stroke="#fff" stroke-width="2"/>`); b.setAttribute("transform", `translate(${x1 + rnd(-8, 8)} ${y1 + 30})`); $("#fishLayer").appendChild(b); later(() => b.remove(), 1200); }, i * 250);
      say("dz_r_" + ev.obj, after);
      later(() => { g.remove(); ev.released = true; }, 3500);
    }
  });
}
/* zeehond */
function spawnSeal() {
  const g = svgEl("", `
    <rect class="hit" x="-50" y="-90" width="100" height="80" fill="transparent"/>
    <g class="seal"><ellipse cx="0" cy="-36" rx="26" ry="14" fill="#90A4AE" ${ST}/>
      <path d="M22 -38 l14 -8 l-2 10 l2 10 z" fill="#78909C" ${TH}/>
      <circle cx="-20" cy="-50" r="13" fill="#90A4AE" ${ST}/>
      <circle cx="-25" cy="-53" r="2.4" fill="${INK}"/><circle cx="-17" cy="-54" r="2.4" fill="${INK}"/>
      <ellipse cx="-28" cy="-46" rx="4" ry="3" fill="${INK}"/>
      <path d="M-34 -46 l-8 -2 M-34 -44 l-8 2" stroke="${INK}" stroke-width="1.3"/>
      <path class="sadm" d="M-26 -40 q4 -3 8 0" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/></g>
    <g class="net"><path d="M-40 -62 L34 -62 L30 -22 L-36 -22 Z" fill="none" stroke="#6D4C41" stroke-width="2.5"/>
      <path d="M-28 -62 L-24 -22 M-14 -62 L-12 -22 M0 -62 V-22 M14 -62 L12 -22 M26 -62 L22 -22 M-40 -50 H34 M-38 -36 H32" stroke="#6D4C41" stroke-width="2"/></g>
    <path d="M-60 -22 q15 -8 30 0 t30 0 t30 0 t30 0" fill="none" stroke="#fff" stroke-width="3" opacity=".8"/>`);
  $("#evLayer").appendChild(g);
  const ev = { type: "zeehond", el: g, wx: D.dist + 800, stopX: 380, lane: 232 };
  g.addEventListener("pointerdown", e => { e.stopPropagation(); unlockAudio(); throwBuoy(ev); });
  D.ev = ev;
}
function throwBuoy(ev) {
  if (!ev.arrived || ev.thrown) return;
  ev.thrown = true;
  const dp = D.v.drive, k = dp.k;
  const x0 = dp.x + 166 * k, y0 = D.py - 80 * k + 48 * k, x1 = ev.sx - 10, y1 = GROUND - 40;
  const b = svgEl("", `<circle r="10" fill="none" stroke="${INK}" stroke-width="10"/><circle r="10" fill="none" stroke="#fff" stroke-width="6"/><circle r="10" fill="none" stroke="${C.fred}" stroke-width="6" stroke-dasharray="7.85 7.85"/>`);
  $("#dfx").appendChild(b);
  sfx.whoosh();
  animate(800, t => b.setAttribute("transform", `translate(${x0 + (x1 - x0) * t} ${y0 + (y1 - y0) * t - Math.sin(Math.PI * t) * 90})`), () => {
    sfx.splash();
    ev.el.querySelector(".net").style.display = "none";
    ev.el.querySelector(".sadm").setAttribute("d", "M-27 -42 q5 4 10 0");
    heartsAt($("#dfx"), x1, y1 - 30);
    sfx.sparkle();
    say("zh_gered", () => { if (D) addCount(); });
    later(() => b.remove(), 600);
    const seal = ev.el.querySelector(".seal");
    later(() => animate(1400, t => seal.setAttribute("transform", `translate(${t * 260} ${-Math.sin(Math.PI * t) * 60}) rotate(${t * 40})`), () => {
      seal.style.display = "none"; sfx.splash(); ev.released = true;
    }), 2200);
  });
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    sirenOff(); waterOff();
    if (D) { D.siren = false; D.spraying = false; D.base = 2.4; const b = $("#b_siren"); b && b.classList.remove("on"); D.scene.classList.remove("siren"); }
  } else if (ctx && ctx.state === "suspended") ctx.resume();
});
document.addEventListener("gesturestart", e => e.preventDefault());
document.addEventListener("dblclick", e => e.preventDefault());

renderHome();
show("home");

if ("serviceWorker" in navigator && location.protocol === "https:" && window.self === window.top) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
