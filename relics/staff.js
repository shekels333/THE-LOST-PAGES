/* =====================================================================
   RELIC | THE STAFF OF TRILLIONBEAR
   VERSES — one verse per page, in order. Edit the text here.
   ===================================================================== */
const BOOK = { kicker: 'RELIC', over: 'THE STAFF OF', title: 'TRILLIONBEAR' };
const VERSES = [
  "The staff of Trillionbear."
];
const PAGES = [{ cover: true }].concat(VERSES.map(function(t, i){ return { verse: i + 1, text: t }; }));

(function(){
  const canvas = document.getElementById('c');
  const THUMB = /(?:^|[?&])thumb=1(?:&|$)/.test(location.search);
  const THUMB_KIND = ((location.search.match(/(?:^|[?&])crop=(\w+)/) || [])[1] || 'diag');
  const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true, preserveDrawingBuffer: !!THUMB});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.setClearColor(0x000000, 0);
  const ANISO = renderer.capabilities.getMaxAnisotropy();

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  let dist = 7.2, showDist = 7.2;

  // ---------- environment (gives the bronze something to reflect) ----------
  (function(){
    const c = document.createElement('canvas'); c.width = 512; c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#050403'; g.fillRect(0,0,512,256);
    function blob(x,y,r,col){ const gr=g.createRadialGradient(x,y,0,x,y,r);
      gr.addColorStop(0,col); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(0,0,512,256); }
    blob(150,60,150,'rgba(255,214,170,.95)');
    blob(400,90,120,'rgba(90,130,255,.6)');
    blob(260,230,160,'rgba(255,120,40,.35)');
    const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.encoding = THREE.sRGBEncoding;
    const pm = new THREE.PMREMGenerator(renderer);
    scene.environment = pm.fromEquirectangular(t).texture;
    t.dispose(); pm.dispose();
  })();

  // ---------- book layout, in the model's own units ----------
  const S  = 2.8 / 0.981;            // model height -> 2.8 scene units
  const XH = -0.300;                 // spine-side edge of the covers (hinge line)
  const ZI = 0.055;                  // inner face of each cover board
  const X0 = -0.229;                 // plane the inner faces lie on when open
  const G  = 0.012;                  // half-width of the gutter when open
  const WP = 0.500, PY0 = 0.060, PY1 = 0.920, PH = PY1 - PY0;   // page size, kept inside the cover lip
  const TP = ZI * 2;                 // thickness of the whole page block
  const LEAVES = Math.max(1, Math.ceil(PAGES.length / 2));

  const tilt = new THREE.Group(), book = new THREE.Group(), M = new THREE.Group();
  M.scale.setScalar(S); M.position.y = -0.4905 * S;
  book.add(M); tilt.add(book); scene.add(tilt);
  book.visible = false;              // nothing of the book is shown until the cover has loaded and drawn once

  function pivot(parent, x, z){
    const p = new THREE.Group(), inner = new THREE.Group();
    p.position.set(x, 0, z); inner.position.set(-x, 0, -z); p.add(inner); parent.add(p);
    return {p, inner};
  }
  const front = pivot(M, XH,  ZI), back = pivot(M, XH, -ZI);
  // ---------- living parts ----------
  // This relic is not a book. It is Trillionbear's staff: it hovers, leans as it is turned, and wakes when its orb is touched.
  const staffG = new THREE.Group(); M.add(staffG);
  const OX = 0.013, OY = 0.9015;                                           // centre of the orb
  function part(parent, x, y){ const p = new THREE.Group(), inner = new THREE.Group(); p.position.set(x, y, 0); inner.position.set(-x, -y, 0); p.add(inner); parent.add(p); return {p:p, inner:inner}; }
  const headG = part(staffG, 0.001, 0.815), orbG = part(headG.inner, OX, OY), collars = [part(staffG, 0.0006, 0.2936), part(staffG, 0.0008, 0.5553)], tipG = part(staffG, 0.0002, 0.0188);
  function dot(stops){ const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), gr = g.createRadialGradient(64,64,0,64,64,64); stops.forEach(function(s){ gr.addColorStop(s[0], s[1]); }); g.fillStyle = gr; g.fillRect(0,0,128,128); return new THREE.CanvasTexture(c); }
  const softT = dot([[0,'rgba(255,255,255,1)'],[.25,'rgba(255,255,255,.45)'],[1,'rgba(255,255,255,0)']]);
  const ringT = dot([[0,'rgba(255,255,255,0)'],[.62,'rgba(255,255,255,0)'],[.80,'rgba(255,255,255,.9)'],[.94,'rgba(255,255,255,0)'],[1,'rgba(255,255,255,0)']]);
  function glow(tex, col, size, parent, x, y){ const s = new THREE.Sprite(new THREE.SpriteMaterial({map:tex, color:col, transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false})); s.scale.set(size, size, 1); s.position.set(x, y, 0); s.raycast = function(){}; parent.add(s); return s; }
  const orbGlow = glow(softT, 0x1470ff, 0.50, headG.inner, OX, OY), orbCore = glow(softT, 0x7fc4ff, 0.20, headG.inner, OX, OY);
  const tipGlow = glow(softT, 0x1470ff, 0.16, staffG, 0.0002, 0.019);
  const shock = glow(ringT, 0x3d94ff, 0.2, headG.inner, OX, OY);
  const pulses = [0, 1, 2, 3].map(function(){ const s = glow(softT, 0x2f8cff, 0.13, staffG, 0.001, 0.5); return {s:s, y:0, v:0, on:false}; });   // light running along the shaft
  const orbLight = new THREE.PointLight(0x3aa0ff, 0, 2.2, 1.6); orbLight.position.set(OX, OY, 0); headG.inner.add(orbLight);
  const motes = (function(){                                               // sparks circling the orb
    const n = 18, a = new Float32Array(n*3), d = [];
    for (let i = 0; i < n; i++) d.push({r:0.105 + Math.random()*0.06, ph:Math.random()*6.28, sp:(0.5 + Math.random()*0.9)*(Math.random() < .5 ? -1 : 1), tx:(Math.random() - .5)*1.6, tz:(Math.random() - .5)*1.6});
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(a, 3));
    const p = new THREE.Points(g, new THREE.PointsMaterial({size:0.020, map:softT, color:0x5fb0ff, transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false, sizeAttenuation:true, toneMapped:false}));
    p.raycast = function(){}; p.frustumCulled = false; headG.inner.add(p); return {p:p, a:a, d:d, n:n};
  })();
  let orbMat = null, tipMat = null, cresMat = null;


  // ---------- paper ----------
  // Leaf edges: cream stock with thin separated lines. The old texture painted a
  // full-bleed stripe on every row, which read as cut timber.
  function edgeTex(){
    const W = 128, H = 512, c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    let s = 11;
    const R = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    g.fillStyle = '#f1e4c8'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 1800; i++){
      const v = 170 + R() * 60;
      g.fillStyle = 'rgba(' + (v|0) + ',' + ((v - 22)|0) + ',' + ((v - 52)|0) + ',' + (0.025 + R() * 0.05) + ')';
      g.fillRect(R() * W, R() * H, 1, 1 + R() * 2);
    }
    let y = 2, n = 0;
    while (y < H){
      y += 4.2 + R() * 3.2; n++;
      const band = n % 12 === 0;
      g.strokeStyle = band ? 'rgba(78,50,26,0.85)' : 'rgba(112,74,40,' + (0.5 + R() * 0.32) + ')';
      g.lineWidth = band ? 1.7 : 0.7 + R() * 0.55;
      g.beginPath();
      const w = (R() - 0.5) * 0.8;
      g.moveTo(0, y + w); g.lineTo(W, y - w); g.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = ANISO;
    return t;
  }
  const edgeMat = new THREE.MeshStandardMaterial({map:edgeTex(), roughness:.98, metalness:0, envMapIntensity:.08});
  edgeMat.side = THREE.DoubleSide;
  const dark  = new THREE.MeshStandardMaterial({color:0x0c0704, roughness:.95, envMapIntensity:.2});

  const CW = 900, CH = Math.round(CW * PH / WP);
  const BODY = "'IM Fell English', Georgia, 'Times New Roman', serif";
  const HEAD = BODY;
  function rnd(seed){ let s = seed*9301+49297; return function(){ s = (s*9301+49297)%233280; return s/233280; }; }

  function paper(g, gutterLeft, seed){
    const R = rnd(seed+3);
    const bg = g.createLinearGradient(0,0,CW,CH);
    bg.addColorStop(0,'#c9b081'); bg.addColorStop(.5,'#bfa574'); bg.addColorStop(1,'#b09562');
    g.fillStyle = bg; g.fillRect(0,0,CW,CH);
    for (let i=0;i<1400;i++){ g.fillStyle = 'rgba(90,60,25,'+(R()*0.07)+')'; g.fillRect(R()*CW, R()*CH, 1+R()*2, 1+R()*2); }
    for (let i=0;i<14;i++){
      const x=R()*CW, y=R()*CH, r=40+R()*170, gr=g.createRadialGradient(x,y,0,x,y,r);
      gr.addColorStop(0,'rgba(120,80,30,'+(0.03+R()*0.07)+')'); gr.addColorStop(1,'rgba(120,80,30,0)');
      g.fillStyle = gr; g.fillRect(0,0,CW,CH);
    }
    const vg = g.createRadialGradient(CW/2,CH/2,CH*0.35,CW/2,CH/2,CH*0.78);
    vg.addColorStop(0,'rgba(70,40,10,0)'); vg.addColorStop(1,'rgba(70,40,10,.38)');
    g.fillStyle = vg; g.fillRect(0,0,CW,CH);
    const gs = gutterLeft ? g.createLinearGradient(0,0,CW*0.2,0) : g.createLinearGradient(CW,0,CW*0.8,0);
    gs.addColorStop(0,'rgba(25,12,3,.72)'); gs.addColorStop(.35,'rgba(40,20,5,.22)'); gs.addColorStop(1,'rgba(40,20,5,0)');
    g.fillStyle = gs; g.fillRect(0,0,CW,CH);
  }
  function wrap(g, text, width, firstIndent, indentLines){
    const out = []; let line = '', n = 0;
    const w = () => width - (n < indentLines ? firstIndent : 0);
    text.split(/\s+/).forEach(function(word){
      const t = line ? line + ' ' + word : word;
      if (g.measureText(t).width > w() && line){ out.push(line); n++; line = word; } else line = t;
    });
    if (line) out.push(line);
    return out;
  }
  // In-book shekel sign (U+20AA). IM Fell has no shekel, and fillText would
  // fall back to whatever face the machine has, so the mark is drawn. The
  // form follows the typographic sign: open at the bottom left, a left stem,
  // a bar that turns down and stops, an inner stem, and a right stem that
  // hooks under. The cover rune is a separate mark and is not drawn here.
  function drawShekel(g, cx, cy, size){
    const aspect = 1.13;
    const X = function(nx){ return (nx - 0.5) * size * aspect; };
    const Y = function(ny){ return (ny - 0.5) * size; };
    function poly(cmds){
      g.beginPath();
      cmds.forEach(function(c){
        if (c[0] === 'M') g.moveTo(X(c[1]), Y(c[2]));
        else if (c[0] === 'L') g.lineTo(X(c[1]), Y(c[2]));
        else g.quadraticCurveTo(X(c[1]), Y(c[2]), X(c[3]), Y(c[4]));
      });
      g.closePath();
      g.fill();
    }
    g.save();
    g.translate(cx, cy);
    // Left stem and the bar that curls down into a short hanging stroke.
    poly([
      ['M', -0.036, 1.000],
      ['Q', 0.000, 1.000, 0.000, 0.915],
      ['L', 0.000, 0.062],
      ['Q', -0.010, 0.018, -0.038, -0.006],
      ['L', 0.016, -0.016],
      ['Q', 0.058, -0.016, 0.100, 0.000],
      ['L', 0.385, 0.000],
      ['Q', 0.562, 0.000, 0.6375, 0.0875],
      ['Q', 0.713, 0.175, 0.713, 0.374],
      ['L', 0.713, 0.608],
      ['Q', 0.722, 0.652, 0.736, 0.672],
      ['L', 0.552, 0.672],
      ['Q', 0.560, 0.652, 0.574, 0.612],
      ['Q', 0.574, 0.237, 0.5335, 0.160],
      ['Q', 0.493, 0.083, 0.374, 0.083],
      ['L', 0.139, 0.083],
      ['L', 0.139, 0.915],
      ['Q', 0.139, 1.000, 0.188, 1.000]
    ]);
    // Inner stem, joined along the bottom to the right stem's hook.
    poly([
      ['M', 0.287, 1.000],
      ['L', 0.287, 0.395],
      ['Q', 0.282, 0.348, 0.255, 0.338],
      ['L', 0.458, 0.338],
      ['Q', 0.430, 0.350, 0.426, 0.395],
      ['L', 0.426, 0.917],
      ['L', 0.663, 0.917],
      ['Q', 0.781, 0.917, 0.821, 0.839],
      ['Q', 0.861, 0.761, 0.861, 0.604],
      ['L', 0.861, 0.040],
      ['Q', 0.855, 0.000, 0.830, -0.012],
      ['L', 1.040, -0.012],
      ['Q', 1.012, 0.000, 1.000, 0.045],
      ['L', 1.000, 0.626],
      ['Q', 1.000, 0.825, 0.924, 0.9125],
      ['Q', 0.848, 1.000, 0.672, 1.000]
    ]);
    g.restore();
  }
  // Gold crescent, the mark of the series. Drawn, so it never depends on a font.
  function drawCrescent(g, cx, cy, r, rot){
    const q = 0.80, d = 0.42, xi = (1 - q*q + d*d)/(2*d), yi = Math.sqrt(1 - xi*xi);
    const A = Math.atan2(yi, xi), B = Math.atan2(yi, xi - d);
    g.save(); g.translate(cx, cy); g.rotate(rot === undefined ? -Math.PI/2 : rot); g.scale(r, r);   // default: both points aim straight up (matches the cover)
    g.beginPath(); g.arc(0, 0, 1, A, 2*Math.PI - A, false); g.arc(d, 0, q, 2*Math.PI - B, B, true); g.closePath();
    const gr = g.createLinearGradient(1, -1, -1, 0.6);
    gr.addColorStop(0, '#f2cf4a'); gr.addColorStop(.55, '#d9a521'); gr.addColorStop(1, '#a8760f');
    g.fillStyle = gr; g.fill();
    g.lineWidth = Math.max(1.5/r, 0.035); g.strokeStyle = 'rgba(74,46,8,.9)'; g.lineJoin = 'round'; g.stroke();
    g.restore();
  }
  function drawPage(i){
    const c = document.createElement('canvas'); c.width = CW; c.height = CH;
    const g = c.getContext('2d'), gutterLeft = (i % 2 === 0), pg = PAGES[i];
    paper(g, gutterLeft, i + 11);
    if (!pg) return c;
    const mIn = 158, mOut = 84, x0 = gutterLeft ? mIn : mOut, w = CW - mIn - mOut, cx = x0 + w/2;
    g.textBaseline = 'alphabetic';
    if (pg.cover){
      g.textAlign = 'center';
      drawCrescent(g, cx, CH*0.29, CH*0.105);
      g.fillStyle = '#6b1410';
      const km = /^TT (\d+)$/.exec(BOOK.kicker);
      if (km){                                                   // joined TT, and a full-height 1, to match the cover plate
        const cap = 34, gap = cap*0.5; g.font = "bold " + Math.round(cap/0.662) + "px 'Times New Roman', Times, 'Liberation Serif', serif"; g.textAlign = 'left';
        const one = km[1] === '1', wn = one ? cap*(0.24 + 0.19*1.75) : g.measureText(km[1]).width, x = cx - (cap*1.22 + gap + wn)/2;
        drawTT(g, x, CH*0.50, cap);
        if (one) drawOne(g, x + cap*1.22 + gap, CH*0.50, cap); else g.fillText(km[1], x + cap*1.22 + gap, CH*0.50);
        g.textAlign = 'center';
      } else { g.font = "46px " + HEAD; g.fillText(BOOK.kicker, cx, CH*0.50); }
      g.strokeStyle = 'rgba(60,35,15,.6)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(cx-70, CH*0.525); g.lineTo(cx+70, CH*0.525); g.stroke();
      g.fillStyle = '#2b1a0e'; g.font = "56px " + HEAD; g.fillText(BOOK.over, cx, CH*0.60);
      let ts = 128; g.font = ts + "px " + HEAD;
      while (g.measureText(BOOK.title).width > w && ts > 60){ ts -= 4; g.font = ts + "px " + HEAD; }
      g.fillText(BOOK.title, cx, CH*0.60 + ts*0.98);
      return c;
    }
    if (pg.verse !== undefined){
      g.textAlign = 'center';
      let fs, lh, lines;
      for (fs = 62; fs >= 30; fs -= 2){
        g.font = fs + "px " + BODY; lh = Math.round(fs*1.42); lines = wrap(g, pg.text, w, 0, 0);
        if (lines.length*lh <= CH*0.44) break;
      }
      const headH = 168, sealH = 190, blockH = lines.length*lh;
      let y = (CH - headH - blockH - sealH)/2 + 10;
      g.fillStyle = '#7a2e12'; g.font = "104px " + HEAD; g.fillText(String(pg.verse), cx, y + 100);      // verse number, in the cover's royal blue
      y += headH + fs*0.8;
      g.fillStyle = '#2b1a0e'; g.font = fs + "px " + BODY;
      lines.forEach(function(ln){ g.fillText(ln, cx, y); y += lh; });
      // moon seal under the verse: a royal-blue disc ringed in gold, carrying a gold crescent
      const sy = y - lh + 118, sr = 46;
      g.beginPath(); g.arc(cx, sy, sr, 0, Math.PI*2);
      g.fillStyle = 'rgba(70,36,22,.88)'; g.fill();
      g.lineWidth = 3; g.strokeStyle = 'rgba(214,196,160,.95)'; g.stroke();
      drawCrescent(g, cx + 3, sy, 21, Math.PI - 0.18);
      return c;
    }
    if (pg.title !== undefined){
      g.textAlign = 'center';
      g.fillStyle = '#6b1410'; drawShekel(g, cx, CH*0.33, CH*0.24);
      g.fillStyle = '#2b1a0e'; g.font = "124px " + HEAD; g.fillText(pg.title, cx, CH*0.58);
      g.strokeStyle = 'rgba(60,35,15,.6)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(cx-150, CH*0.645); g.lineTo(cx+150, CH*0.645); g.stroke();
      if (pg.sub){ g.font = "italic 40px " + BODY; g.fillStyle = '#4a321c'; g.fillText(pg.sub, cx, CH*0.70); }
      return c;
    }
    let y = 170;
    if (pg.head){
      g.textAlign = 'center'; g.fillStyle = '#6b1410'; g.font = "64px " + HEAD;
      g.fillText(pg.head, cx, y); y += 34;
      g.fillStyle = 'rgba(107,20,16,.75)'; g.font = "26px " + BODY;
      g.fillText('•', cx - 34, y + 18); drawShekel(g, cx, y + 8, 26); g.fillText('•', cx + 34, y + 18); y += 92;
    }
    const FS = 40, LH = 58;
    g.textAlign = 'left';
    (pg.text || '').split(/\n\s*\n/).forEach(function(par, pi){
      par = par.trim(); if (!par) return;
      let capW = 0, rest = par;
      if (pi === 0 && pg.head){
        g.font = "112px " + HEAD; g.fillStyle = '#6b1410';
        const ch = par.charAt(0); capW = g.measureText(ch).width + 14;
        g.fillText(ch, x0 - 4, y + LH + 6); rest = par.slice(1);
      }
      g.font = FS + "px " + BODY; g.fillStyle = '#2b1a0e';
      const lines = wrap(g, rest, w, capW, capW ? 2 : 0);
      lines.forEach(function(ln, k){
        if (y > CH - 150) return;
        g.fillText(ln, x0 + (k < 2 ? capW : 0), y); y += LH;
      });
      if (capW && lines.length < 2) y += LH * (2 - lines.length);
      y += LH * 0.55;
    });
    g.textAlign = 'center'; g.font = "italic 28px " + BODY; g.fillStyle = 'rgba(43,26,14,.75)';
    g.fillText('· ' + (i + 1) + ' ·', cx, CH - 78);
    return c;
  }
  const texCache = new Map();
  function pageTex(i){
    const key = (i < 0) ? 'L' : (i >= PAGES.length ? (i % 2 ? 'L' : 'R') : i);
    let t = texCache.get(key);
    if (!t){
      t = new THREE.CanvasTexture(drawPage(key === 'L' ? -1 : key === 'R' ? PAGES.length + (PAGES.length % 2) : key));
      t.encoding = THREE.sRGBEncoding; t.anisotropy = ANISO; texCache.set(key, t);
      if (texCache.size > 14){                       // keep memory flat for long books
        const first = texCache.keys().next().value; texCache.get(first).dispose(); texCache.delete(first);
      }
    }
    return t;
  }
  function flushPages(){ texCache.forEach(function(t){ t.dispose(); }); texCache.clear(); refresh(); }

  function pageMat(){ return new THREE.MeshStandardMaterial({roughness:1, metalness:0, envMapIntensity:.25}); }
  // Each half of the page block is a sheet-stack whose top surface curves down into the spine,
  // so both halves meet in a valley at the binding line instead of ending in a square edge.
  const NS = 26, DEN = 80, Q = G + WP + 0.004;
  function newProfile(){ return {q:new Float32Array(NS+1), h:new Float32Array(NS+1), ang:new Float32Array(NS), len:Q}; }
  const dq = new Float32Array(DEN+1), dh = new Float32Array(DEN+1), da = new Float32Array(DEN+1);
  let flut = 0, nowT = 0;              // the outer page edges ripple briefly as the book falls open
  function profile(out, t, hv, cv){
    const lam = 1.6*(t - hv) + 0.05;
    for (let i=0;i<=DEN;i++){
      const q = i/DEN*Q, u = Math.min(1, q/lam), c = hv + (t - hv)*(1 - (1-u)*(1-u));
      dq[i] = q; dh[i] = t + (c - t)*cv + flut*0.0062*Math.sin(nowT*15.0 + q*16.0)*Math.pow(q/Q, 2.2);
      da[i] = i ? da[i-1] + Math.hypot(dq[i]-dq[i-1], dh[i]-dh[i-1]) : 0;
    }
    const total = da[DEN]; let k = 0;
    for (let j=0;j<=NS;j++){                          // resample evenly by arc length
      const a = j/NS*total; while (k < DEN-1 && da[k+1] < a) k++;
      const f = (a - da[k]) / Math.max(1e-9, da[k+1]-da[k]);
      out.q[j] = dq[k] + (dq[k+1]-dq[k])*f; out.h[j] = dh[k] + (dh[k+1]-dh[k])*f;
    }
    for (let j=0;j<NS;j++) out.ang[j] = Math.atan2(out.h[j+1]-out.h[j], out.q[j+1]-out.q[j]);
    out.len = total; return out;
  }
  // How far the page edges reach past the hinge plane toward each cover board.
  // The boards' inner panel sits near z=0.126; the rim dips in to 0.108, so the
  // reach eases off at the corners and the fore-edge stays inside that lip.
  const NY = 10, TUCK = 0.012, VSCALE = 3.1;
  // Constant reach. Easing it off at the corners reopened a dark slot under the brass.
  function tuckOf(){ return TUCK; }
  function stack(inner, sign){        // sign +1: hangs under the front cover, -1: rests on the back cover
    const tg = new THREE.BufferGeometry(), tp = new Float32Array((NS+1)*6), tu = new Float32Array((NS+1)*4), ti = [];
    for (let j=0;j<=NS;j++){
      const u = sign < 0 ? j/NS : 1 - j/NS;
      tu[j*4] = u; tu[j*4+1] = 0; tu[j*4+2] = u; tu[j*4+3] = 1;
      if (j < NS){ const a=j*2, b=j*2+2, c=j*2+1, d=j*2+3; ti.push(a,b,c, b,d,c); }
    }
    tg.setAttribute('position', new THREE.BufferAttribute(tp,3)); tg.setAttribute('uv', new THREE.BufferAttribute(tu,2)); tg.setIndex(ti);
    const mat = pageMat(); mat.side = THREE.DoubleSide;
    const top = new THREE.Mesh(tg, mat); top.frustumCulled = false;
    // edges: head, tail, and a subdivided fore-edge. Cover-side verts are written in set().
    const f0 = (NS+1)*4, nv = f0 + (NY+1)*2;
    const eg = new THREE.BufferGeometry(), ep2 = new Float32Array(nv*3), eu = new Float32Array(nv*2), ei = [];
    for (let e=0;e<2;e++) for (let j=0;j<NS;j++){
      const o = (e*(NS+1) + j)*2;
      ei.push(o, o+2, o+1, o+2, o+3, o+1);
    }
    for (let k=0;k<NY;k++){
      const o = f0 + k*2;
      ei.push(o, o+2, o+1, o+2, o+3, o+1);
    }
    eg.setAttribute('position', new THREE.BufferAttribute(ep2,3)); eg.setAttribute('uv', new THREE.BufferAttribute(eu,2)); eg.setIndex(ei);
    const edges = new THREE.Mesh(eg, edgeMat); edges.frustumCulled = false;
    inner.add(top, edges);
    const X = q => XH - G + q, Z = h => sign < 0 ? -ZI + h : ZI - h;
    const zCover = tuck => sign < 0 ? -(ZI - 0.0003) : (ZI - 0.0003);
    return { top, sign, prof:newProfile(), set(pr){
      for (let j=0;j<=NS;j++){
        const u = j/NS, x = X(pr.q[j]), z = Z(pr.h[j] - 0.0005), tuck = tuckOf(u), zb = zCover(tuck), o = j*6;
        tp[o]=x; tp[o+1]=PY0; tp[o+2]=z; tp[o+3]=x; tp[o+4]=PY1; tp[o+5]=z;
        for (let e=0;e<2;e++){
          const vi = (e*(NS+1) + j)*2, p = vi*3, y = e ? PY1 : PY0;
          ep2[p]=x; ep2[p+1]=y; ep2[p+2]=zb; ep2[p+3]=x; ep2[p+4]=y; ep2[p+5]=z;
          eu[vi*2]=u*1.6; eu[vi*2+1]=0; eu[vi*2+2]=u*1.6; eu[vi*2+3]=(pr.h[j]+tuck)*VSCALE;
        }
      }
      const xf = X(pr.q[NS]), zt = Z(pr.h[NS]);
      for (let k=0;k<=NY;k++){
        const v = k/NY, y = PY0 + PH*v, tuck = tuckOf(v), zb = zCover(tuck);
        const vi = f0 + k*2, p = vi*3;
        ep2[p]=xf; ep2[p+1]=y; ep2[p+2]=zb; ep2[p+3]=xf; ep2[p+4]=y; ep2[p+5]=zt;
        eu[vi*2]=v*2.2; eu[vi*2+1]=0; eu[vi*2+2]=v*2.2; eu[vi*2+3]=(pr.h[NS]+tuck)*VSCALE;
      }
      tg.attributes.position.needsUpdate = eg.attributes.position.needsUpdate = eg.attributes.uv.needsUpdate = true;
      tg.computeVertexNormals(); eg.computeVertexNormals();
    }};
  }
  const leftStack = stack(front.inner, 1), rightStack = stack(back.inner, -1);

  // endpapers on the inside of each cover
  function endTex(){
    const c = document.createElement('canvas'); c.width = 512; c.height = 720;
    const g = c.getContext('2d'); g.fillStyle = '#1a0f08'; g.fillRect(0,0,512,720);
    const R = rnd(77);
    g.fillStyle = '#5a4026'; g.fillRect(26,26,460,668);
    for (let i=0;i<900;i++){ g.fillStyle = 'rgba('+(60+R()*70|0)+','+(40+R()*40|0)+','+(18+R()*20|0)+','+(R()*0.25)+')';
      g.beginPath(); g.ellipse(26+R()*460, 26+R()*668, 4+R()*26, 2+R()*9, R()*3.14, 0, 7); g.fill(); }
    g.strokeStyle = 'rgba(20,10,4,.8)'; g.lineWidth = 3; g.strokeRect(26,26,460,668);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
  }
  const endMat = new THREE.MeshStandardMaterial({map:endTex(), roughness:.9, envMapIntensity:.3});
  function cap(inner, sign){
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.560, 0.880), endMat);
    m.position.set(0.0, 0.4893, sign * (ZI - 0.0004)); if (sign > 0) m.rotation.y = Math.PI;
    inner.add(m);
  }
  cap(front.inner, 1); cap(back.inner, -1);
  const gutter = new THREE.Mesh(new THREE.BoxGeometry(X0 + 0.300, PH - 0.016, 0.07), dark);
  gutter.position.set((X0 - 0.300)/2, PY0 + PH/2, 0); M.add(gutter);

  // the turning leaf
  function leafGeo(verso){
    const g = new THREE.BufferGeometry(), pos = new Float32Array((NS+1)*2*3), uv = new Float32Array((NS+1)*2*2), idx = [];
    for (let j=0;j<=NS;j++){
      const u = verso ? 1 - j/NS : j/NS;
      uv[j*4] = u; uv[j*4+1] = 0; uv[j*4+2] = u; uv[j*4+3] = 1;
      if (j < NS){ const a=j*2, b=j*2+2, c=j*2+1, d=j*2+3; idx.push(a,b,c, b,d,c); }
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos,3)); g.setAttribute('uv', new THREE.BufferAttribute(uv,2));
    g.setIndex(idx); return g;
  }
  const leafF = new THREE.Mesh(leafGeo(false), pageMat()), leafB = new THREE.Mesh(leafGeo(true), pageMat());
  leafB.material.side = THREE.BackSide;
  leafF.frustumCulled = leafB.frustumCulled = false; leafF.visible = leafB.visible = false;
  M.add(leafF, leafB);
  function poseLeaf(p, pr, pl, hv){
    const e = p*p*(3-2*p), c = 0.95*Math.sin(Math.PI*e), seg = (pr.len + (pl.len - pr.len)*e)/NS;
    let x = X0 + hv + 0.0014, z = 0;
    const pf = leafF.geometry.attributes.position.array, pb = leafB.geometry.attributes.position.array;
    for (let j=0;j<=NS;j++){
      if (j > 0){
        const k = j-1, aR = pr.ang[k], aL = Math.PI - pl.ang[k];
        const a = Math.max(0, Math.min(Math.PI, aR + (aL - aR)*e + c*(0.5 - (j-0.5)/NS)));
        x += Math.sin(a)*seg; z -= Math.cos(a)*seg;
      }
      const o = j*6;
      pf[o]=pb[o]=x; pf[o+1]=pb[o+1]=PY0; pf[o+2]=pb[o+2]=z;
      pf[o+3]=pb[o+3]=x; pf[o+4]=pb[o+4]=PY1; pf[o+5]=pb[o+5]=z;
    }
    [leafF, leafB].forEach(function(m){ m.geometry.attributes.position.needsUpdate = true; m.geometry.computeVertexNormals(); });
  }

  // ---------- reading state ----------
  let turned = 0;                    // leaves lying on the left
  let flip = null;                   // {dir, p}
  const thickL = n => TP * (0.12 + 0.76 * n / LEAVES);
  function setMap(mat, t){ if (mat.map !== t){ mat.map = t; mat.needsUpdate = true; } }
  function refresh(){
    const n = turned, f = flip;
    const nl = f ? (f.dir > 0 ? n : n - 1) : n;          // leaf count the stacks show under the flying leaf
    setMap(leftStack.top.material,  pageTex(nl > 0 ? 2*nl - 1 : -1));
    setMap(rightStack.top.material, pageTex(f ? 2*(nl + 1) : 2*n));
    if (f){ setMap(leafF.material, pageTex(2*nl)); setMap(leafB.material, pageTex(2*nl + 1)); }
    leafF.visible = leafB.visible = !!f;
  }
  let lastKey = '';
  function layout(cv){
    const pos = flip ? (flip.dir > 0 ? turned + flip.p : turned - 1 + flip.p) : turned;
    const key = pos.toFixed(4) + '|' + cv.toFixed(4) + '|' + (flip ? flip.p.toFixed(4) : '') + (flut > 0.003 ? '|' + nowT : '');
    if (key === lastKey) return; lastKey = key;
    const tl = thickL(pos), tr = TP - tl, hv = Math.min(0.018, 0.7*Math.min(tl, tr));
    leftStack.set(profile(leftStack.prof, tl, hv, cv)); rightStack.set(profile(rightStack.prof, tr, hv, cv));
    if (flip) poseLeaf(flip.p, rightStack.prof, leftStack.prof, hv);
  }
  function next(){ if (mode !== 'read' || flip) return; if (turned < LEAVES){ flip = {dir:1, p:0}; refresh(); } }
  function prev(){ if (mode !== 'read' || flip) return; if (turned > 0){ flip = {dir:-1, p:1}; refresh(); } else closeBook(); }

  // ---------- living cover: chains that shiver, a molten moon, a glint on the metal ----------
  const U = { uTime:{value:0}, uRattle:{value:0}, uGlint:{value:0}, uGlintAmt:{value:0} };
  // The chains are part of the cover's surface, so the shader finds them by where they sit (a band round
  // the cover) and how far they stand proud of the leather. Everything is worked out from the vertex
  // position, with no extra vertex data, to keep it portable across phones.
  const liveMats = [];
  function liveCover(mat, mesh, xl){
    const uS = {value: mesh.scale.x}, uO = {value: mesh.position.clone()}, uAmp = {value: 0.0036 / mesh.scale.x}, uXL = {value: xl};
    mat.userData.live = true; liveMats.push(mat);
    mat.onBeforeCompile = function(sh){
      if (!mat.userData.live) return;
      sh.uniforms.tbTime = U.uTime; sh.uniforms.tbRattle = U.uRattle; sh.uniforms.tbGlint = U.uGlint; sh.uniforms.tbGlintAmt = U.uGlintAmt;
      sh.uniforms.tbS = uS; sh.uniforms.tbO = uO; sh.uniforms.tbAmp = uAmp; sh.uniforms.tbXL = uXL;
      sh.vertexShader = [
        'uniform highp float tbTime;', 'uniform highp float tbRattle;', 'uniform highp float tbAmp;', 'uniform highp float tbS;',
        'uniform highp float tbXL;', 'uniform highp vec3 tbO;', 'varying highp vec3 tbPos;', ''].join('\n') +
        sh.vertexShader.replace('#include <begin_vertex>', [
          '#include <begin_vertex>',
          'tbPos = position * tbS + tbO;',
          'if (tbRattle > 0.001 && tbXL < 1.0){',
          '  float tbH = abs(tbPos.z);',
          '  float tbCx = clamp(tbPos.x, tbXL, 0.295), tbCy = clamp(tbPos.y, 0.100, 0.895);',
          '  float tbDv = min(length(vec2(tbPos.x - tbXL, tbPos.y - tbCy)), length(vec2(tbPos.x - 0.295, tbPos.y - tbCy)));',
          '  float tbDh = min(length(vec2(tbPos.x - tbCx, tbPos.y - 0.100)), length(vec2(tbPos.x - tbCx, tbPos.y - 0.895)));',
          '  float tbHz = step(tbDh, tbDv);',
          '  float tbDc = length(vec2(min(abs(tbPos.x - tbXL), abs(tbPos.x - 0.295)), min(abs(tbPos.y - 0.100), abs(tbPos.y - 0.895))));',
          '  float tbW = (1.0 - smoothstep(0.013, 0.024, min(tbDv, tbDh))) * smoothstep(0.0905, 0.0945, tbH) * (1.0 - smoothstep(0.1005, 0.1035, tbH)) * smoothstep(0.125, 0.165, tbDc);',
          '  float tbSp = step(abs(tbPos.x - tbXL), abs(tbPos.x - 0.295));',
          '  float tbHy = min(min(abs(tbPos.y - 0.236), abs(tbPos.y - 0.509)), abs(tbPos.y - 0.794));',
          '  tbW *= mix(mix(smoothstep(0.125, 0.15, abs(tbPos.y - 0.51)), smoothstep(0.055, 0.075, tbHy), tbSp), 1.0, tbHz);',
          '  float tbLink = floor(mix(tbPos.y, tbPos.x, tbHz) / 0.043) + tbHz*37.0 + step(0.0, tbPos.x)*11.0 + step(0.5, tbPos.y)*5.0;',
          '  float tbPh = fract(sin(tbLink*12.9898)*43758.5453) * 6.2831;',
          '  float tbA = sin(tbTime*33.0 + tbPh), tbB = sin(tbTime*26.0 + tbPh*1.7);',
          '  vec3 tbD = mix(vec3(tbA, tbB*0.35, 0.0), vec3(tbB*0.35, tbA, 0.0), tbHz);',
          '  transformed += (tbD + objectNormal * abs(tbB) * 0.5) * tbW * tbRattle * tbAmp;',
          '}'].join('\n'));
      sh.fragmentShader = [
        'uniform highp float tbTime;', 'uniform highp float tbGlint;', 'uniform highp float tbGlintAmt;', 'varying highp vec3 tbPos;', ''].join('\n') +
        sh.fragmentShader.replace('#include <emissivemap_fragment>', [
          '#include <emissivemap_fragment>',
          'float tbM1 = sin(tbPos.x*46.0 + tbTime*1.25 + sin(tbPos.y*38.0 - tbTime*0.8)*1.6);',
          'float tbM2 = sin(tbPos.y*71.0 - tbTime*1.9 + tbPos.x*23.0);',
          'totalEmissiveRadiance *= 0.86 + 0.20*tbM1 + 0.10*tbM2;',
          'float tbG = max(sin(tbPos.y*7.0 + tbPos.x*5.0 - tbGlint), 0.0);',
          'totalEmissiveRadiance += vec3(1.0, 0.86, 0.62) * pow(tbG, 60.0) * smoothstep(0.62, 0.92, metalnessFactor) * tbGlintAmt * 0.6;'].join('\n'));
    };
    mat.customProgramCacheKey = function(){ return mat.userData.live ? 'tb-live' : 'tb-plain'; };
  }
  // If a device refuses the extra shader code, drop back to the plain cover so the book is never left bare.
  let liveChecked = 0;
  function checkLive(){
    if (liveChecked > 1 || !ready) return;
    const bad = (renderer.info.programs || []).some(function(p){ return p.diagnostics && p.diagnostics.runnable === false; });
    const gl = renderer.getContext(), glErr = gl.getError();
    if (bad || (glErr !== gl.NO_ERROR && glErr !== gl.CONTEXT_LOST_WEBGL)){
      liveMats.forEach(function(m){ m.userData.live = false; m.needsUpdate = true; });
      liveChecked = 2;
      if (location.hash === '#debug') setHint('cover effects off on this device (' + (bad ? 'shader' : 'gl ' + glErr) + ')');
    } else liveChecked++;
  }

  // ---------- load the sculpted parts ----------
  const glowMats = new Set();
  let claspBack = null, claspHome = null;
  const loadEl = document.getElementById('load'), barEl = document.getElementById('bar');
  let ready = false, appear = 1;
  function onModel(gltf){
    const rootNode = gltf.scene.getObjectByName('ROOT') || gltf.scene;
    rootNode.children.slice().forEach(function(o){
      const n = o.name;
      let tag = 'shaft';
      if (n === 'H_orb'){ orbG.inner.add(o); tag = 'orb'; }
      else if (n === 'H_cres'){ headG.inner.add(o); tag = 'cres'; }
      else if (n === 'C_0' || n === 'C_1'){ collars[+n.charAt(2)].inner.add(o); tag = 'collar'; }
      else if (n === 'T_tip'){ tipG.inner.add(o); tag = 'tip'; }
      else if (n.charAt(0) === 'S') staffG.add(o);
      else if (n.charAt(0) === 'F') front.inner.add(o);
      else if (n.charAt(0) === 'S') M.add(o);
      else back.inner.add(o);
      o.traverse(function(q){
        if (!q.isMesh) return;
        const mat = q.material.clone(); q.material = mat;          // one material per part, so each knows its own placement
        [mat.map, mat.normalMap, mat.roughnessMap, mat.emissiveMap].forEach(function(t){ if (t) t.anisotropy = ANISO; });
        mat.envMapIntensity = 1.1;
        if (n === 'H_orb'){ mat.emissiveMap = mat.map; mat.emissive.set(0xffffff); mat.roughness = 0.18; mat.envMapIntensity = 1.3; orbMat = mat; }
        else if (n === 'T_tip'){ mat.emissiveMap = mat.map; mat.emissive.set(0xffffff); mat.roughness = 0.25; tipMat = mat; }
        else if (n === 'H_cres'){ mat.emissiveMap = mat.map; mat.emissive.set(0x9fd0ff); mat.emissiveIntensity = 0; mat.metalness = 0.85; mat.roughness = 0.32; cresMat = mat; }
        else if (n === 'S_ferrule'){ mat.metalness = 0.85; mat.roughness = 0.32; }
        q.userData.tag = tag;
        const pa = q.geometry.attributes.position;                 // packed positions: unpack them so taps can be traced against the real surface
        if (!(pa.array instanceof Float32Array) || pa.isInterleavedBufferAttribute){
          const f = new Float32Array(pa.count*3), k = pa.normalized ? 1/32767 : 1;
          for (let i = 0; i < pa.count; i++){ f[i*3] = Math.max(-1e9, pa.getX(i)*k); f[i*3+1] = pa.getY(i)*k; f[i*3+2] = pa.getZ(i)*k; }
          q.geometry.setAttribute('position', new THREE.BufferAttribute(f, 3));
        }
        liveCover(mat, q, 9.0);
      });
    });
    // Show the whole book at once. The first frame with the cover is slow on phones (its textures go to the
    // graphics chip then), so keep the loading line up until that frame has actually been drawn.
    book.visible = true; appear = THUMB ? 1 : 0; flare = 0.8;
    requestAnimationFrame(function(){ requestAnimationFrame(function(){
      ready = true; frameStaff(); loadEl.classList.add('off'); setHint('drag to rotate · touch the orb');
    }); });
  }
  function onFail(err){ loadEl.querySelector('span').textContent = 'could not load the relic model'; console.error(err); }
  const embedded = document.getElementById('glb'), glb64 = window.GLB_B64 || (embedded && embedded.textContent);
  if (glb64){
    barEl.style.width = '60%';
    setTimeout(function(){
      const b = atob(glb64.trim()), n = b.length, u = new Uint8Array(n);
      for (let i=0;i<n;i++) u[i] = b.charCodeAt(i);
      new THREE.GLTFLoader().parse(u.buffer, '', onModel, onFail);
    }, 60);
  } else {
    new THREE.GLTFLoader().load('staff.glb', onModel, function(e){
      if (e.total) barEl.style.width = (100 * e.loaded / e.total).toFixed(0) + '%';
    }, onFail);
  }

  // ---------- rune glow ----------
  const RX = 0.210, RY = 0.732;
  function glowTex(){
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(128,128,0,128,128,128);
    gr.addColorStop(0,'rgba(255,190,70,.10)'); gr.addColorStop(.35,'rgba(255,140,30,.06)');
    gr.addColorStop(1,'rgba(255,80,0,0)');
    g.fillStyle = gr; g.fillRect(0,0,256,256);
    return new THREE.CanvasTexture(c);
  }
  const gt = glowTex();
  function rune(inner, sign){
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(0.62,0.62),
      new THREE.MeshBasicMaterial({map:gt, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false}));
    halo.position.set(sign*RX, RY, sign*0.124); if (sign < 0) halo.visible = false; else moonHalo = halo; if (sign < 0) halo.rotation.y = Math.PI;
    const light = new THREE.PointLight(0xffb040, 1.6, 2.6, 2); light.position.set(sign*RX, RY, sign*0.30);
    inner.add(halo, light);
    return {halo, light, inner, sign, n:new THREE.Vector3()};
  }
  const runes = [rune(front.inner, 1)];
  // ---------- nameplate lettering (drawn here so it stays sharp; the model's plates are blank) ----------
  const plates = [];
  function plate(cx, cy, w, h, z, draw){
    const c = document.createElement('canvas'); c.width = 1024; c.height = Math.round(1024*h/w);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = ANISO;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({
      map:t, transparent:true, metalness:.2, roughness:.6, envMapIntensity:.5, depthWrite:false,
      polygonOffset:true, polygonOffsetFactor:-2, polygonOffsetUnits:-2 }));
    m.position.set(cx, cy, z); front.inner.add(m);
    const redraw = function(){
      const g = c.getContext('2d'); g.clearRect(0,0,c.width,c.height);
      // engraved gold: dark cut edge up-left, bright lip down-right, gold face
      [[2.5,2.5,'rgba(255,240,210,.18)'],[-2.5,-2.5,'rgba(6,3,1,.85)'],[0,0,null]].forEach(function(p){
        g.save(); g.translate(p[0], p[1]);
        if (p[2]) g.fillStyle = p[2];
        else { const gr = g.createLinearGradient(0,0,0,c.height); gr.addColorStop(0,'#ffc24a'); gr.addColorStop(.5,'#f29a1c'); gr.addColorStop(1,'#c36c08'); g.fillStyle = gr; }
        draw(g, c.width, c.height); g.restore();
      });
      t.needsUpdate = true;
    };
    plates.push(redraw); redraw();
  }
  // "TT" as one joined glyph: two posts under a single unbroken beam, like a torii gate.
  function drawTT(g, x, base, cap){
    const W = cap*1.22, bt = cap*0.17, st = cap*0.19, top = base - cap;
    g.fillRect(x, top, W, bt);                                   // the one beam
    g.fillRect(x, top, bt*0.55, bt*1.75); g.fillRect(x + W - bt*0.55, top, bt*0.55, bt*1.75);   // beam serifs
    [0.27, 0.73].forEach(function(f){
      const sx = x + W*f - st/2;
      g.fillRect(sx, top, st, cap);                              // post
      g.fillRect(sx - st*0.55, base - bt*0.5, st*2.1, bt*0.5);   // foot
    });
    return W;
  }
  // A full-height "1", drawn so it matches the posts of the TT (the page font's own 1 is a small old-style figure).
  function drawOne(g, x, base, cap){
    const bt = cap*0.17, st = cap*0.19, top = base - cap, fl = cap*0.24, sx = x + fl;
    g.fillRect(sx, top, st, cap);
    g.beginPath(); g.moveTo(sx, top); g.lineTo(sx - fl, top + cap*0.24); g.lineTo(sx - fl*0.82, top + cap*0.33); g.lineTo(sx, top + cap*0.19); g.closePath(); g.fill();
    g.fillRect(sx - st*0.75, base - bt*0.5, st*2.5, bt*0.5);
    return fl + st*1.75;
  }
  plate(0.090, 0.8715, 0.150, 0.036, 0.1157, function(g, w, h){
    const cap = h*0.70, base = h/2 + cap/2, gap = cap*0.50, wTT = cap*1.22;
    g.font = "bold " + Math.round(cap/0.662) + "px 'Times New Roman', Times, 'Liberation Serif', serif"; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    const w3 = g.measureText('6').width, x = (w - (wTT + gap + w3))/2;
    drawTT(g, x, base, cap); g.fillText('6', x + wTT + gap, base);
  });
  plate(0.007, 0.2795, 0.430, 0.086, 0.1182, function(g, w, h){
    const txt = 'WATCHERS'; let f = Math.round(h*0.86);
    g.textBaseline = 'alphabetic'; g.textAlign = 'left';
    let sp, total;
    for (;; f -= 2){                                   // largest size that fits the plate between its rivets
      g.font = f + "px " + HEAD; sp = f*0.11; total = -sp;
      for (const ch of txt) total += g.measureText(ch).width + sp;
      if (total <= w*0.93 || f < 20) break;
    }
    const m = g.measureText('B'), asc = m.actualBoundingBoxAscent || f*0.66;
    let x = (w - total)/2; const base = h/2 + asc/2;
    for (const ch of txt){ g.fillText(ch, x, base); x += g.measureText(ch).width + sp; }
  });

  // ---------- lights ----------
  scene.add(new THREE.AmbientLight(0x4a3f38, 0.55));
  const key = new THREE.DirectionalLight(0xffe2c0, 1.25); key.position.set(-3, 4, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0x6f9cff, 0.9);  rim.position.set(4, 2, -5); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xff9a50, 0.35); fill.position.set(3, -3, 3); scene.add(fill);
  const candle = new THREE.PointLight(0xffc98a, 0, 18, 1.2); candle.position.set(0.8, 1.6, 6); scene.add(candle);

  // ---------- smoke ----------
  function smokeTex(){
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d');
    for (let i=0;i<26;i++){
      const x=60+Math.random()*136, y=60+Math.random()*136, r=30+Math.random()*60;
      const gr = g.createRadialGradient(x,y,0,x,y,r);
      gr.addColorStop(0,'rgba(255,255,255,.07)'); gr.addColorStop(1,'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0,0,256,256);
    }
    return new THREE.CanvasTexture(c);
  }
  const st = smokeTex(), smoke = [];
  for (let i=0;i<14;i++){
    const s = new THREE.Sprite(new THREE.SpriteMaterial({map:st, color:0x8a7a70, transparent:true,
      opacity:0.09+Math.random()*0.09, depthWrite:false, rotation:Math.random()*6.28}));
    const sc = 4+Math.random()*4; s.scale.set(sc,sc,1);
    s.position.set((Math.random()-.5)*10, (Math.random()-.5)*5-0.5, -2.5-Math.random()*3);
    s.userData = {vx:(Math.random()-.5)*0.12+0.06, vr:(Math.random()-.5)*0.05};
    scene.add(s); smoke.push(s);
  }

  // ---------- embers ----------
  const N = 140, ep = new Float32Array(N*3), ev = [];
  function seed(i, anyY){
    ep[i*3]   = (Math.random()-.5)*5;
    ep[i*3+1] = anyY ? (Math.random()-.5)*6 : -3.2;
    ep[i*3+2] = (Math.random()-.5)*3;
    ev[i] = {vy:0.15+Math.random()*0.35, ph:Math.random()*6.28, sp:0.5+Math.random()*1.5};
  }
  for (let i=0;i<N;i++) seed(i,true);
  const eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.BufferAttribute(ep,3));
  function dotTex(){
    const c = document.createElement('canvas'); c.width=c.height=32; const g=c.getContext('2d');
    const gr=g.createRadialGradient(16,16,0,16,16,16);
    gr.addColorStop(0,'rgba(255,220,150,1)'); gr.addColorStop(.3,'rgba(255,140,40,.8)'); gr.addColorStop(1,'rgba(255,80,0,0)');
    g.fillStyle=gr; g.fillRect(0,0,32,32); return new THREE.CanvasTexture(c);
  }
  const embers = new THREE.Points(eg, new THREE.PointsMaterial({map:dotTex(), size:0.05, transparent:true,
    blending:THREE.AdditiveBlending, depthWrite:false, opacity:.9}));
  scene.add(embers);

  // ---------- dust that puffs from the edges when the covers part ----------
  const DN = 80, dpos = new Float32Array(DN*3), dvel = new Float32Array(DN*3);
  const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const dustMat = new THREE.PointsMaterial({size:0.2, transparent:true, opacity:0, depthWrite:false, color:0xcdbb9c, map:(function(){
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    const gr = g.createRadialGradient(32,32,0,32,32,32); gr.addColorStop(0,'rgba(255,255,255,.55)'); gr.addColorStop(1,'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0,0,64,64); return new THREE.CanvasTexture(c); })()});
  const dust = new THREE.Points(dustGeo, dustMat); dust.frustumCulled = false; scene.add(dust);
  if (THUMB){
    smoke.forEach(function(s){ s.visible = false; });
    embers.visible = false;
    dust.visible = false;
    renderer.setClearColor(0x000000, 0);
  }
  let dustAge = 9, puffed = false;
  function puff(){
    const p = new THREE.Vector3(), c = new THREE.Vector3();
    M.updateWorldMatrix(true, false); c.set(0, 0.49, 0); M.localToWorld(c);
    for (let i=0;i<DN;i++){
      const r = Math.random();
      if (r < 0.6) p.set(0.352, PY0 + Math.random()*PH, (Math.random()-.5)*0.08);            // fore-edge
      else p.set(XH + Math.random()*(0.352 - XH), r < 0.8 ? PY1 : PY0, (Math.random()-.5)*0.08);   // head and tail
      M.localToWorld(p);
      dpos[i*3] = p.x; dpos[i*3+1] = p.y; dpos[i*3+2] = p.z;
      p.sub(c).normalize().multiplyScalar(0.35 + Math.random()*0.75);
      dvel[i*3] = p.x + (Math.random()-.5)*0.3; dvel[i*3+1] = p.y + (Math.random()-.5)*0.3; dvel[i*3+2] = p.z + (Math.random()-.5)*0.3;
    }
    dustAge = 0;
  }

  // ---------- modes: show -> opening -> read -> closing ----------
  let mode = 'show', openT = 0, yawRead = 0;
  const hint = document.getElementById('hint'), closeBtn = document.getElementById('close');
  let hintTimer = 0;
  function setHint(text){ hint.textContent = text; hint.classList.remove('off'); clearTimeout(hintTimer);
    hintTimer = setTimeout(function(){ hint.classList.add('off'); }, 6000); }
  function openBook(){
    if (mode !== 'show' || !ready) return;
    mode = 'opening'; showDist = dist; vyaw = vpitch = 0;
    yawRead = -Math.PI/2 + 2*Math.PI*Math.round((yaw + Math.PI/2)/(2*Math.PI));
    canvas.classList.add('read'); refresh();
  }
  // ---------- this relic's quirk: touch the orb and the staff wakes; touch it again and it rests. A touch anywhere on a waking staff sends light along it. ----------
  let jolt = 0, flare = 0, awake = 0, glowLv = 0, tipFlare = 0, shockT = 9, lean = 0, leanV = 0, yawRate = 0, lastYawS = null, nextPulse = 0, cSpin = 0;
  const sv = new THREE.Vector3();
  function pressBook(){ return false; } function releaseBook(){} function relock(){}
  function sendPulse(y, v){ for (let i = 0; i < pulses.length; i++) if (!pulses[i].on){ const p = pulses[i]; p.on = true; p.y = y; p.v = v; return; } }
  function wake(){
    if (!ready) return; idle = 0;
    awake = awake ? 0 : 1; jolt = 0.3;
    if (awake){ flare = 1; shockT = 0; sendPulse(0.80, -0.9); setHint('the staff wakes'); nextPulse = 3.5; }
    else { sendPulse(0.05, 0.9); setHint('the staff rests'); }
  }
  function strike(){ wake(); }
  function tapBook(hits){
    let h = null; for (let i = 0; i < hits.length; i++) if (hits[i].object.visible && hits[i].object.userData.tag){ h = hits[i]; break; }
    if (!h) return;
    const tag = h.object.userData.tag; idle = 0;
    if (tag === 'orb' || tag === 'cres'){ wake(); return; }
    sv.copy(h.point); staffG.worldToLocal(sv);
    if (!awake){ jolt = 0.2; setHint('touch the orb'); return; }
    sendPulse(sv.y, 0.9); sendPulse(sv.y, -0.9); cSpin += 5; jolt = 0.15;
    if (tag === 'tip'){ tipFlare = 1; }
  }
  function closeBook(){
    if ((mode !== 'read' && mode !== 'opening') || flip) return;
    mode = 'closing'; closeBtn.classList.remove('on'); canvas.classList.remove('read');
  }
  closeBtn.addEventListener('click', closeBook);
  function relicDist(){
    // Frame the tall, thin staff from its own bounds, not the leftover book page size.
    const box = new THREE.Box3().setFromObject(staffG);
    const size = box.getSize(new THREE.Vector3());
    const tan = Math.tan(camera.fov * Math.PI/360);
    if (size.y < 0.05){
      return (0.981*S*1.16)/2/tan + 0.6;
    }
    const pad = THUMB ? 1.12 : 1.16;
    return Math.max(size.y/(2*tan), size.x/(2*tan*camera.aspect)) * pad + 0.35;
  }
  function frameStaff(){
    const d = relicDist();
    showDist = d;
    if (!pts.size) dist = d;
  }
  const STAFF_MESH = { H_orb:1, H_cres:1, S_shaft:1, C_0:1, C_1:1, S_ferrule:1, T_tip:1 };
  function staffMeshBox(allow){
    const box = new THREE.Box3();
    staffG.traverse(function(o){
      if (!o.isMesh) return;
      if (allow[o.name]) box.expandByObject(o);
    });
    if (box.isEmpty()) box.setFromObject(staffG);
    return box;
  }
  function frameThumb(){
    // Fit only the sculpted meshes so glow sprites do not shrink the staff in the tile.
    const roll = THUMB_KIND === 'diag' ? -0.74 : 0;
    tilt.rotation.set(pitch, yaw, roll, 'XYZ');
    tilt.updateWorldMatrix(true, true);
    const box = THUMB_KIND === 'head'
      ? staffMeshBox({ H_orb:1, H_cres:1, C_1:1 })
      : staffMeshBox(STAFF_MESH);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const tan = Math.tan(camera.fov * Math.PI / 360);
    const pad = THUMB_KIND === 'head' ? 1.08 : 1.04;
    const d = Math.max(size.y / (2 * tan), size.x / (2 * tan * camera.aspect)) * pad;
    camera.position.set(center.x, center.y, center.z + d);
    camera.near = Math.max(0.01, d / 80);
    camera.far = d * 30;
    camera.lookAt(center);
    camera.updateProjectionMatrix();
  }
  const readDist = relicDist;

  // ---------- interaction ----------
  let yaw = -0.5, pitch = 0.12, vyaw = 0, vpitch = 0, dragging = false, lastX=0, lastY=0, idle = 99;
  if (THUMB){ yaw = THUMB_KIND === 'head' ? 0.38 : 0.32; pitch = 0.08; idle = -1e9; appear = 1; }
  let downX = 0, downY = 0, downT = 0, moved = 0;
  const pts = new Map(); let pinch = 0;
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function touched(){ idle = 0; }
  canvas.addEventListener('pointerdown', e=>{
    canvas.setPointerCapture(e.pointerId); pts.set(e.pointerId,[e.clientX,e.clientY]);
    dragging = pts.size===1; lastX=downX=e.clientX; lastY=downY=e.clientY; downT=performance.now(); moved=0; pinch=0;
    if (mode === 'show') canvas.classList.add('drag'); touched();
    if (mode === 'show' && pts.size === 1){ const r = canvas.getBoundingClientRect(); ndc.set((e.clientX-r.left)/r.width*2-1, -((e.clientY-r.top)/r.height*2-1)); ray.setFromCamera(ndc, camera); if (pressBook(ray.intersectObject(M, true))){ dragging = false; canvas.classList.remove('drag'); } }
  });
  canvas.addEventListener('pointermove', e=>{
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId,[e.clientX,e.clientY]);
    if (pts.size===2){
      const [a,b] = [...pts.values()], d = Math.hypot(a[0]-b[0],a[1]-b[1]);
      if (pinch) zoom(pinch / d);
      pinch = d; moved = 99; touched(); return;
    }
    if (!dragging) return;
    const dx=e.clientX-lastX, dy=e.clientY-lastY; lastX=e.clientX; lastY=e.clientY;
    moved += Math.abs(dx) + Math.abs(dy);
    if (mode === 'show'){ vyaw = dx*0.008; vpitch = dy*0.006; yaw += vyaw; pitch += vpitch; }
    touched();
  });
  function up(e){
    if (!pts.has(e.pointerId)) return;
    releaseBook();
    const wasSingle = pts.size === 1 && dragging;
    pts.delete(e.pointerId); dragging=false; pinch=0; canvas.classList.remove('drag');
    if (!wasSingle || e.type === 'pointercancel') return;
    const dx = e.clientX - downX, quick = performance.now() - downT < 500;
    if (moved < 8 && quick){
      if (mode === 'show'){
        const r = canvas.getBoundingClientRect();
        ndc.set((e.clientX-r.left)/r.width*2-1, -((e.clientY-r.top)/r.height*2-1));
        ray.setFromCamera(ndc, camera);
        const hits = ray.intersectObject(M, true);
        if (hits.length){ vyaw = vpitch = 0; tapBook(hits); }
      } else if (mode === 'read'){
        if (e.clientX > window.innerWidth/2) next(); else prev();
      }
    } else if (mode === 'read' && Math.abs(dx) > 50){
      if (dx < 0) next(); else prev();
    }
  }
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  let zoomRead = 1;
  function zoom(k){
    if (mode === 'show') dist = Math.max(4.2, Math.min(11, dist * k));
    else zoomRead = Math.max(0.45, Math.min(1.5, zoomRead * k));
    touched();
  }
  canvas.addEventListener('wheel', e=>{ e.preventDefault(); zoom(1 + e.deltaY*0.001); }, {passive:false});
  window.addEventListener('keydown', e=>{
    if (e.key === 'ArrowRight' || e.key === ' '){ if (mode === 'show') strike(); else next(); e.preventDefault(); }
    else if (e.key === 'ArrowLeft'){ prev(); e.preventDefault(); }
    else if (e.key === 'Enter'){ strike(); }
    else if (e.key === 'Escape'){ closeBook(); }
  });

  function resize(){
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w/h;
    camera.fov = w/h < 0.9 ? 44 : 32;
    camera.updateProjectionMatrix();
    if (ready) frameStaff();
  }
  window.addEventListener('resize', resize); resize();

  if (document.fonts && document.fonts.load){
    Promise.all([document.fonts.load("37px 'IM Fell English'"), document.fonts.load("italic 37px 'IM Fell English'"),
                 document.fonts.load("124px 'IM Fell English'")]).then(function(){ flushPages(); plates.forEach(function(f){ f(); }); }, function(){});
  }

  // ---------- loop ----------
  const clock = new THREE.Clock(), toCam = new THREE.Vector3();
  let prevYaw = -0.5, prevPitch = 0.12, frameNo = 0, beat = 0;
  let manual = null;                 // set only by the capture hook: freezes time so a turntable render is perfectly steady
  const sm = (a,b,x) => { const t = Math.max(0, Math.min(1, (x-a)/(b-a))); return t*t*(3-2*t); };
  refresh();
  function frame(){
    const dt = manual ? manual.dt : Math.min(clock.getDelta(), 0.05), t = manual ? manual.t : clock.elapsedTime;
    idle += dt;

    // open / close
    if (mode === 'opening'){ openT = Math.min(1, openT + dt/2.6);
      if (openT === 1){ mode = 'read'; closeBtn.classList.add('on'); setHint('click a page to turn · esc to close'); } }
    if (mode === 'closing'){ openT = Math.max(0, openT - dt/2.2);
      if (openT === 0){ mode = 'show'; idle = 99; zoomRead = 1; turned = 0; refresh();      // a closed book always reopens at its first page
        jolt = 0.55; flare = 0.4; puffed = false; relock(); setHint('the hunt begins again'); } }
    const cv = sm(0.06, 1, openT);
    // Swing the clasp out past the fore-edge and on around until it lies behind the back board.
    if (claspBack){
      const c = sm(0.2, 0.75, openT);
      claspBack.position.x = claspHome.x - c * 0.07;
      claspBack.position.z = claspHome.z - c * 0.025;
    }
    front.p.rotation.y = -cv * Math.PI/2; front.p.position.set(XH + (X0-XH)*cv, 0,  ZI + (G-ZI)*cv);
    back.p.rotation.y  =  cv * Math.PI/2; back.p.position.set(XH + (X0-XH)*cv, 0, -ZI - (G-ZI)*cv);

    // page turning
    if (flip){
      flip.p += flip.dir * dt / 0.95;
      if (flip.p >= 1 || flip.p <= 0){ turned += flip.dir; flip = null; refresh(); }
    }
    nowT = t;
    if (mode === 'opening' && cv > 0.5) flut = Math.max(flut, sm(0.5, 0.8, cv));
    else if (flut > 0){ flut *= Math.exp(-dt*1.4); if (flut < 0.003) flut = 0; }
    if (mode === 'opening' && cv > 0.04 && !puffed){ puffed = true; puff(); }
    if (dustAge < 2.4){
      dustAge += dt; const dk = Math.exp(-dt*1.9);
      for (let i=0;i<DN*3;i++){ dpos[i] += dvel[i]*dt; dvel[i] *= dk; }
      dustGeo.attributes.position.needsUpdate = true;
      dustMat.opacity = Math.max(0, 1 - dustAge/2.4) * Math.min(1, dustAge*7) * 0.42;
    } else dustMat.opacity = 0;
    layout(cv);

    // view
    if (mode === 'show'){
      if (!dragging){
        yaw += vyaw; pitch += vpitch; vyaw *= 0.94; vpitch *= 0.9;
        if (idle > 1.5){
          const k = Math.min(1,(idle-1.5)/2);
          yaw += dt*0.28*k; pitch += (0.12 - pitch)*dt*0.8*k;
        }
      }
      dist += (showDist - dist) * (1 - Math.exp(-dt*3)) * (Math.abs(showDist - dist) > 0.01 && idle > 0.2 && !pts.size ? 1 : 0);
      if (pts.size || idle < 0.2) showDist = dist;
    } else {
      const k = 1 - Math.exp(-dt*3.2);
      yaw += (yawRead - yaw)*k; pitch += (0.07 - pitch)*k;
      dist += (readDist()*zoomRead - dist)*k;
    }
    pitch = Math.max(-1.25, Math.min(1.25, pitch));
    tilt.rotation.set(pitch, yaw, 0, 'XYZ');
    // how fast the book is being turned by hand (the slow idle spin does not count)
    const spin = mode === 'show' ? (Math.abs(yaw - prevYaw) + Math.abs(pitch - prevPitch)) / Math.max(dt, 0.001) : 0;
    // ---- the living parts ----
    for (let i = 0; i < M.children.length; i++) if (M.children[i] !== staffG) M.children[i].visible = false;      // no covers, no pages: only the staff
    beat = Math.pow(Math.max(0, Math.sin(t*1.5)), 4);
    glowLv += (awake - glowLv)*Math.min(1, dt*2.2); tipFlare *= Math.exp(-dt*2.5); cSpin *= Math.exp(-dt*1.4);
    // it hovers, and leans a little behind the hand that turns it
    if (lastYawS === null) lastYawS = yaw;
    yawRate += ((yaw - lastYawS)/Math.max(dt, 0.001) - yawRate)*Math.min(1, dt*6); lastYawS = yaw;
    const want = Math.max(-0.16, Math.min(0.16, -yawRate*0.05));
    leanV += ((want - lean)*30 - leanV*7)*dt; lean += leanV*dt;
    staffG.position.y = Math.sin(t*0.9)*0.008 + glowLv*0.012;
    staffG.rotation.z = lean*0.6 + Math.sin(t*0.55)*0.012; staffG.rotation.x = Math.sin(t*0.43 + 1)*0.010;
    headG.p.rotation.z = lean*0.5 + Math.sin(t*0.8)*0.008;
    orbG.p.scale.setScalar(1 + glowLv*0.025*beat + flare*0.05);
    collars[0].p.rotation.y += dt*(0.25 + glowLv*1.6 + cSpin); collars[1].p.rotation.y -= dt*(0.25 + glowLv*1.6 + cSpin);
    // light
    const lv = 0.16 + 0.05*Math.sin(t*1.1) + glowLv*(0.62 + 0.25*beat) + flare*0.6;
    if (orbMat) orbMat.emissiveIntensity = 0.08 + lv*0.70;
    if (cresMat) cresMat.emissiveIntensity = glowLv*0.10 + flare*0.15;
    if (tipMat) tipMat.emissiveIntensity = 0.06 + glowLv*(0.35 + 0.2*beat) + tipFlare*0.9;
    orbGlow.material.opacity = Math.min(1, lv*0.85); orbGlow.scale.setScalar(0.40 + glowLv*0.12 + flare*0.22);
    orbCore.material.opacity = Math.min(1, glowLv*0.30 + flare*0.6);
    tipGlow.material.opacity = Math.min(1, 0.05 + glowLv*0.30 + tipFlare*0.8);
    orbLight.intensity = 0.25 + glowLv*2.2 + flare*3;
    shockT += dt; { const f = Math.min(1, shockT/0.9); shock.material.opacity = (1 - f)*(1 - f)*0.85; shock.scale.setScalar(0.18 + f*0.75); }
    if (awake){ nextPulse -= dt; if (nextPulse <= 0){ nextPulse = 3.2 + Math.random()*2; sendPulse(0.80, -0.75); } }
    for (let i = 0; i < pulses.length; i++){
      const p = pulses[i]; if (!p.on){ p.s.material.opacity = 0; continue; }
      p.y += p.v*dt; p.s.position.y = p.y; p.s.material.opacity = 0.75*Math.min(1, (p.y - 0.0)/0.06, (0.84 - p.y)/0.06);
      if (p.y < 0.02){ p.on = false; tipFlare = 1; } else if (p.y > 0.83){ p.on = false; flare = Math.max(flare, 0.5); }
    }
    for (let i = 0; i < motes.n; i++){
      const d = motes.d[i], a = t*d.sp*(0.5 + glowLv*1.4) + d.ph, j = i*3, cx = Math.cos(a)*d.r, sz = Math.sin(a)*d.r;
      motes.a[j] = OX + cx; motes.a[j+1] = OY + sz*Math.sin(d.tx) + cx*Math.sin(d.tz)*0.4; motes.a[j+2] = sz*Math.cos(d.tx);
    }
    motes.p.geometry.attributes.position.needsUpdate = true; motes.p.material.opacity = 0.10 + glowLv*0.65;
    prevYaw = yaw; prevPitch = pitch;
    const rTarget = Math.min(1, Math.max(0, (spin - 0.7)/4.5) + jolt*1.4);
    U.uRattle.value += (rTarget - U.uRattle.value) * (1 - Math.exp(-dt*(rTarget > U.uRattle.value ? 28 : 3.2)));
    U.uTime.value = t; U.uGlint.value = yaw*2.2 + pitch*1.4;
    U.uGlintAmt.value = 0;                 // the travelling glint on the metal is switched off
    const calm = 1 - cv;
    book.position.y = Math.sin(t*0.8)*0.05*(0.25 + 0.75*calm);
    book.rotation.z = Math.sin(t*0.5)*0.02*calm;
    candle.intensity = 0.45 * cv;
    jolt *= Math.exp(-dt*7); flare *= Math.exp(-dt*3.2);
    if (appear < 1){ appear = Math.min(1, appear + dt/0.7); book.scale.setScalar(0.9 + 0.1*(1 - Math.pow(1 - appear, 3))); }
    book.position.z = -jolt*0.16; book.rotation.x = jolt*0.05;

    // rune pulse with a little fire flicker
    const pulse = 0.5+0.5*Math.sin(t*1.7), flick = 0.06*Math.sin(t*13.1)+0.04*Math.sin(t*23.7);
    const e = 0.95 + pulse*0.55 + beat*0.45 + flick + flare*2.4;
    glowMats.forEach(function(m){ m.emissiveIntensity = e; });
    toCam.copy(camera.position).normalize();
    runes.forEach(function(r){
      r.light.intensity = 0.12 + pulse*0.2 + flick*0.8 + flare*3.5;
      r.n.set(0,0,r.sign).transformDirection(r.inner.matrixWorld);
      r.halo.material.opacity = Math.pow(Math.max(0, r.n.dot(toCam)),1.6) * Math.min(1.6, 0.55 + pulse*0.45 + flare*0.9);
    });

    for (const s of smoke){
      s.position.x += s.userData.vx*dt; s.material.rotation += s.userData.vr*dt;
      if (s.position.x > 6) s.position.x = -6;
    }
    for (let i=0;i<N;i++){
      ep[i*3+1] += ev[i].vy*dt;
      ep[i*3]   += Math.sin(t*ev[i].sp+ev[i].ph)*0.12*dt;
      if (ep[i*3+1] > 3.2) seed(i,false);
    }
    eg.attributes.position.needsUpdate = true;

    if (THUMB) frameThumb();
    else { camera.position.set(0, 0, dist); camera.lookAt(0,0,0); }
    renderer.render(scene, camera);
    if (liveChecked < 2 && ready && (frameNo++ % 20) === 19) checkLive();
    if (!manual) requestAnimationFrame(frame);
  }
  if (location.hostname==='localhost') window.__book = {
    view:(y,p)=>{ yaw=y; pitch=p; idle=-1e9; }, peek:(d)=>{ yawRead += d; }, open:openBook, close:closeBook, next, prev, wake:()=>wake(), kick:(v)=>{ jolt = v; }, lit:()=>[awake, +glowLv.toFixed(2)], info:()=>{ const out=[]; M.traverse(o=>{ if(o.isMesh&&o.name){ const g=o.geometry, a=g.attributes.position; out.push([o.name, a.array.constructor.name, a.normalized, g.index?g.index.count:0, o.material.side, g.boundingSphere?+g.boundingSphere.radius.toFixed(3):null, o.scale.x.toFixed(5), o.visible]); } }); return out.slice(0,6); }, probe:(x,y)=>{ const r=canvas.getBoundingClientRect(); ndc.set((x-r.left)/r.width*2-1, -((y-r.top)/r.height*2-1)); ray.setFromCamera(ndc, camera); return ray.intersectObject(M, true).slice(0,8).map(h=>[h.object.name||h.object.type, +h.distance.toFixed(3), h.object.userData.jewel, h.object.userData.tag]); }, hide:(re,v)=>{ M.traverse(o=>{ if (o.name && new RegExp(re).test(o.name)) o.visible = v; }); }, still:(y,p)=>{ manual = {t:2.0, dt:0}; yaw = y; pitch = p; idle = -1e9; frame(); return canvas.toDataURL('image/png'); }, goto:(n)=>{ turned = Math.max(0, Math.min(LEAVES, n)); refresh(); },
    state:()=>({mode, openT, turned, flip:!!flip, ready}) };
  frame();
})();
