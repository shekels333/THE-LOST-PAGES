(function(){
  // Bump RELIC_V whenever a relic file or thumb changes so browsers fetch the new one.
  const RELIC_V = '20261113d';
  // Add a relic by appending an entry here and saving a square WebP into thumbs/.
  var RELICS = [
    { id:'builders',   name:'Builders',    title:'TT 1 | The Book of Builders',    code:'book1.js',  poster:'../assets/covers/builders.webp',   thumb:'thumbs/builders.webp' },
    { id:'builders-2', name:'Builders II', title:'TT 1 | The Book of Builders II', code:'book2.js',  poster:'../assets/covers/builders-2.webp', thumb:'thumbs/builders-2.webp' },
    { id:'rebels',     name:'Rebels',      title:'TT 2 | The Book of Rebels',      code:'book3.js',  poster:'../assets/covers/rebels.webp',     thumb:'thumbs/rebels.webp' },
    { id:'kings',      name:'Kings',       title:'TT 3 | The Book of Kings',       code:'book4.js',  poster:'../assets/covers/kings.webp',      thumb:'thumbs/kings.webp' },
    { id:'kings-2',    name:'Kings II',    title:'TT 3 | The Book of Kings II',    code:'book5.js',  poster:'../assets/covers/kings-2.webp',   thumb:'thumbs/kings-2.webp' },
    { id:'seekers',    name:'Seekers',     title:'TT 4 | The Book of Seekers',     code:'book6.js',  poster:'../assets/covers/seekers.webp',    thumb:'thumbs/seekers.webp' },
    { id:'hunters',    name:'Hunters',     title:'TT 5 | The Book of Hunters',     code:'book10.js', poster:'../assets/covers/hunters.webp',    thumb:'thumbs/hunters.webp' },
    { id:'watchers',   name:'Watchers',    title:'TT 6 | The Book of Watchers',    code:'book11.js', poster:'../assets/covers/watchers.webp',   thumb:'thumbs/watchers.webp' },
    { id:'warriors',   name:'Warriors',    title:'TT 7 | The Book of Warriors',    code:'book7.js',  poster:'../assets/covers/warriors.webp',   thumb:'thumbs/warriors.webp' },
    { id:'crusaders',  name:'Crusaders',   title:'TT 8 | The Book of Crusaders',   code:'book8.js',  poster:'../assets/covers/crusaders.webp',  thumb:'thumbs/crusaders.webp' },
    { id:'seers',      name:'Seers',       title:'TT 9 | The Book of Seers',       code:'book9.js',  poster:'../assets/covers/seers.webp',      thumb:'thumbs/seers.webp' },
    { id:'staff',      name:'Staff',       title:'Relic | The Staff of Trillionbear', code:'staff.js', poster:'thumbs/staff.webp',             thumb:'thumbs/staff.webp',      group:'other' }
  ];
  var GROUPS = [
    { id:'books', label:'Books' },
    { id:'other', label:'Other relics' }
  ];
  var BY_ID = {};
  RELICS.forEach(function(r){ BY_ID[r.id] = r; });

  function relicId(){
    return (location.hash || '').replace(/^#/, '');
  }
  function clearHash(){
    if (location.hash){
      history.replaceState(null, '', location.pathname + location.search);
    }
  }
  function goMenu(url){
    var dest = url || (location.pathname + location.search);
    if (location.hash){
      location.assign(dest);
    } else if (location.pathname + location.search !== dest){
      location.assign(dest);
    }
  }

  var menu = document.getElementById('menu');
  var title = document.createElement('p');
  title.className = 'menu-title';
  title.textContent = 'Relics';
  var rule = document.createElement('hr');
  rule.className = 'menu-rule';
  menu.appendChild(title);
  menu.appendChild(rule);
  GROUPS.forEach(function(g){
    var items = RELICS.filter(function(r){ return (r.group || 'books') === g.id; });
    if (!items.length) return;
    var section = document.createElement('div');
    section.className = 'menu-group';
    section.setAttribute('role', 'group');
    section.setAttribute('aria-label', g.label);
    var label = document.createElement('span');
    label.className = 'menu-label';
    label.textContent = g.label;
    var row = document.createElement('div');
    row.className = 'menu-tiles';
    items.forEach(function(r){
      var tile = document.createElement('div');
      tile.className = 'menu-tile';
      var a = document.createElement('a');
      a.href = '#' + r.id;
      a.setAttribute('data-relic', r.id);
      a.setAttribute('aria-label', r.name);
      var img = document.createElement('img');
      img.src = r.thumb + '?v=' + RELIC_V;
      img.alt = '';
      img.width = 256;
      img.height = 256;
      img.loading = 'lazy';
      img.decoding = 'async';
      var name = document.createElement('span');
      name.textContent = r.name;
      a.appendChild(img);
      a.appendChild(name);
      a.addEventListener('click', function(){
        try {
          sessionStorage.setItem('tb-relic', r.id);
          sessionStorage.setItem('tb-book', r.id);
        } catch (e) {}
      });
      var share = document.createElement('button');
      share.type = 'button';
      share.className = 'tile-share';
      share.textContent = 'Copy link';
      share.setAttribute('aria-label', 'Copy link to ' + r.name);
      share.addEventListener('click', function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        shareLink(location.origin + location.pathname + '#' + r.id, r.title);
      });
      tile.appendChild(a);
      tile.appendChild(share);
      row.appendChild(tile);
    });
    section.appendChild(label);
    section.appendChild(row);
    menu.appendChild(section);
  });

  function hasWebGL(){
    try {
      var c = document.createElement('canvas');
      return !!(c.getContext('webgl') || c.getContext('experimental-webgl'));
    } catch (e) { return false; }
  }

  var starfieldStarted = false;
  function startStarfield(){
    var canvas = document.getElementById('starfield');
    if (!canvas || !canvas.getContext) return;
    if (starfieldStarted) return;
    starfieldStarted = true;
    var ctx = canvas.getContext('2d');
    var stars = [], shootingStars = [];
    var shootingStarTimer;
    function resizeCanvas(){
      var w = Math.round(canvas.clientWidth || window.innerWidth);
      var h = Math.round(canvas.clientHeight || window.innerHeight);
      if (w === canvas.width && h === canvas.height) return false;
      canvas.width = w;
      canvas.height = h;
      return true;
    }
    function initStars(){
      stars = [];
      for (var i = 0; i < 350; i++){
        var tier = Math.random();
        stars.push({
          nx: Math.random(),
          ny: Math.random(),
          r: tier > 0.95 ? Math.random() * 2 + 1.2
            : tier > 0.7  ? Math.random() * 1.2 + 0.6
            :               Math.random() * 0.6 + 0.2,
          speed:  Math.random() * 0.008 + 0.002,
          offset: Math.random() * Math.PI * 2,
          hue:    Math.random() > 0.85 ? 200 + Math.random() * 60 : 260 + Math.random() * 30,
          pulse:  Math.random() > 0.7
        });
      }
    }
    function spawnShootingStar(){
      var fromLeft = Math.random() > 0.5;
      shootingStars.push({
        x: fromLeft ? -20 : canvas.width + 20,
        y: Math.random() * canvas.height * 0.6,
        vx: fromLeft ? (4 + Math.random() * 4) : -(4 + Math.random() * 4),
        vy: 1.5 + Math.random() * 2,
        len: 80 + Math.random() * 120,
        alpha: 1,
        width: Math.random() * 1.2 + 0.4
      });
    }
    function drawStaticStars(){
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (var i = 0; i < stars.length; i++){
        var s = stars[i];
        s.x = s.nx * canvas.width; s.y = s.ny * canvas.height;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = 'hsla(' + s.hue + ',60%,92%,0.6)';
        ctx.fill();
      }
    }
    function drawStars(t){
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (var i = 0; i < stars.length; i++){
        var s = stars[i];
        s.x = s.nx * canvas.width; s.y = s.ny * canvas.height;
        var pulse = s.pulse
          ? Math.abs(Math.sin(t * s.speed * 2.5 + s.offset))
          : 0.1 + 0.9 * (0.5 + 0.5 * Math.sin(t * s.speed + s.offset));
        var alpha = Math.max(0.02, pulse);
        if (s.r > 1){
          var glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 4);
          glow.addColorStop(0, 'hsla(' + s.hue + ',80%,90%,' + (alpha * 0.6) + ')');
          glow.addColorStop(1, 'hsla(' + s.hue + ',60%,70%,0)');
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 4, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = 'hsla(' + s.hue + ',60%,92%,' + alpha + ')';
        ctx.fill();
      }
      for (var j = shootingStars.length - 1; j >= 0; j--){
        var ss = shootingStars[j];
        var tailX = ss.x - (ss.vx / Math.abs(ss.vx)) * ss.len;
        var tailY = ss.y - (ss.vy / Math.abs(ss.vy || 1)) * (ss.len * 0.5);
        var grad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
        grad.addColorStop(0, 'rgba(255,255,255,0)');
        grad.addColorStop(1, 'rgba(200,180,255,' + ss.alpha + ')');
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(ss.x, ss.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = ss.width;
        ctx.stroke();
        ss.x += ss.vx;
        ss.y += ss.vy;
        ss.alpha -= 0.012;
        if (ss.alpha <= 0 || ss.x < -200 || ss.x > canvas.width + 200) shootingStars.splice(j, 1);
      }
      requestAnimationFrame(function(ts){ drawStars(ts * 0.001); });
    }
    function scheduleShootingStar(){
      shootingStarTimer = setTimeout(function(){
        if (!document.hidden) spawnShootingStar();
        scheduleShootingStar();
      }, 2500 + Math.random() * 5000);
    }
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    resizeCanvas();
    initStars();
    if (reducedMotion){
      drawStaticStars();
    } else {
      requestAnimationFrame(function(ts){ drawStars(ts * 0.001); });
      setTimeout(scheduleShootingStar, 1500);
    }
    document.addEventListener('visibilitychange', function(){
      if (!document.hidden){
        shootingStars = [];
        clearTimeout(shootingStarTimer);
        if (!reducedMotion) scheduleShootingStar();
      }
    });
    window.addEventListener('resize', function(){ if (resizeCanvas() && reducedMotion) drawStaticStars(); });
  }

  function startViewer(relic){
    document.body.classList.add('is-viewer');
    document.body.classList.remove('is-menu');
    document.title = relic.title + ' — Relics';
    startStarfield();
    var poster = document.getElementById('poster');
    poster.alt = relic.title;
    poster.onload = function(){ poster.hidden = false; };
    poster.onerror = function(){ poster.hidden = true; };
    poster.src = relic.poster;
    if (!hasWebGL()){
      document.getElementById('load').className = 'off';
      document.getElementById('nowebgl').className = 'on';
      return;
    }
    function add(src, done){ var s = document.createElement('script'); s.src = src; s.onload = done; s.onerror = done; document.body.appendChild(s); }
    add('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', function(){
      add('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js', function(){
        add(relic.code + '?v=' + RELIC_V);
      });
    });
  }

  function startMenu(){
    document.body.classList.add('is-menu');
    document.body.classList.remove('is-viewer');
    document.title = 'The Lost Pages — Relics';
    document.getElementById('load').className = 'off';
    startStarfield();
  }

  var key = relicId();
  var current = BY_ID[key] || null;
  if (current){
    try {
      sessionStorage.setItem('tb-relic', current.id);
      sessionStorage.setItem('tb-book', current.id);
    } catch (e) {}
    startViewer(current);
  } else {
    if (key) clearHash();
    startMenu();
  }

  window.addEventListener('hashchange', function(){
    var id = relicId();
    var next = BY_ID[id] || null;
    if (!next){
      if (id) clearHash();
      if (document.body.classList.contains('is-viewer')){
        // Drop the WebGL viewer by reloading the menu; cheaper than leaving the loop running.
        location.reload();
      }
      return;
    }
    if (current && current.id === next.id) return;
    try {
      sessionStorage.setItem('tb-relic', next.id);
      sessionStorage.setItem('tb-book', next.id);
    } catch (e) {}
    location.reload();
  });

  window.addEventListener('keydown', function(e){
    if (e.key !== 'Escape') return;
    if (!document.body.classList.contains('is-viewer')) return;
    e.preventDefault();
    goMenu('/relics/');
  });

  function toast(message){
    var el = document.getElementById('share-toast');
    if (!el){
      el = document.createElement('div');
      el.id = 'share-toast';
      el.className = 'share-toast';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function(){ el.classList.remove('show'); }, 1600);
  }
  function copyText(text){
    if (navigator.clipboard && window.isSecureContext){
      return navigator.clipboard.writeText(text).catch(function(){ return fallbackCopy(text); });
    }
    return fallbackCopy(text);
  }
  function fallbackCopy(text){
    return new Promise(function(resolve, reject){
      var area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.left = '-9999px';
      document.body.appendChild(area);
      area.select();
      try {
        var ok = document.execCommand('copy');
        area.remove();
        ok ? resolve() : reject(new Error('copy'));
      } catch (err) {
        area.remove();
        reject(err);
      }
    });
  }
  function shareLink(url, title){
    var mobile = window.matchMedia('(max-width: 820px), (pointer: coarse)').matches;
    if (mobile && typeof navigator.share === 'function'){
      navigator.share({ title: title || document.title, url: url }).catch(function(err){
        if (err && err.name === 'AbortError') return;
        copyText(url).then(function(){ toast('Copied!'); }).catch(function(){ toast('Copy the link from the address bar'); });
      });
      return;
    }
    copyText(url).then(function(){ toast('Copied!'); }).catch(function(){ toast('Copy the link from the address bar'); });
  }
  var shareBtn = document.getElementById('share');
  if (shareBtn){
    shareBtn.addEventListener('click', function(){
      var id = relicId();
      var relic = BY_ID[id];
      if (!relic) return;
      shareLink(location.origin + location.pathname + '#' + relic.id, relic.title);
    });
  }

})();