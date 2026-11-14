  // ── STARFIELD ──
  const canvas = document.getElementById('starfield');
  const ctx = canvas.getContext('2d');
  let stars = [], shootingStars = [];

  // Size the canvas to its CSS box (100lvh), which stays constant while the
  // mobile address bar slides in/out. Returns true only if the size changed.
  function resizeCanvas() {
    const w = Math.round(canvas.clientWidth || window.innerWidth);
    const h = Math.round(canvas.clientHeight || window.innerHeight);
    if (w === canvas.width && h === canvas.height) return false;
    canvas.width = w;
    canvas.height = h;
    return true;
  }

  function initStars() {
    stars = [];
    for (let i = 0; i < 350; i++) {
      const tier = Math.random();
      stars.push({
        nx: Math.random(), // stored as 0..1 so a resize rescales stars instead of reshuffling them
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

  function spawnShootingStar() {
    const fromLeft = Math.random() > 0.5;
    shootingStars.push({
      x:      fromLeft ? -20 : canvas.width + 20,
      y:      Math.random() * canvas.height * 0.6,
      vx:     fromLeft ? (4 + Math.random() * 4) : -(4 + Math.random() * 4),
      vy:     1.5 + Math.random() * 2,
      len:    80 + Math.random() * 120,
      alpha:  1,
      width:  Math.random() * 1.2 + 0.4
    });
  }

  function drawStars(t) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw pulsating stars
    stars.forEach(s => {
      s.x = s.nx * canvas.width; s.y = s.ny * canvas.height;
      const pulse = s.pulse
        ? Math.abs(Math.sin(t * s.speed * 2.5 + s.offset))
        : 0.1 + 0.9 * (0.5 + 0.5 * Math.sin(t * s.speed + s.offset));
      const alpha = Math.max(0.02, pulse);

      // Glow for larger stars
      if (s.r > 1) {
        const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 4);
        glow.addColorStop(0, `hsla(${s.hue},80%,90%,${alpha * 0.6})`);
        glow.addColorStop(1, `hsla(${s.hue},60%,70%,0)`);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 4, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${s.hue},60%,92%,${alpha})`;
      ctx.fill();
    });

    // Draw shooting stars
    shootingStars.forEach((ss, i) => {
      const tailX = ss.x - (ss.vx / Math.abs(ss.vx)) * ss.len;
      const tailY = ss.y - (ss.vy / Math.abs(ss.vy || 1)) * (ss.len * 0.5);
      const grad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
      grad.addColorStop(0, `rgba(255,255,255,0)`);
      grad.addColorStop(1, `rgba(200,180,255,${ss.alpha})`);
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(ss.x, ss.y);
      ctx.strokeStyle = grad;
      ctx.lineWidth = ss.width;
      ctx.stroke();

      ss.x += ss.vx;
      ss.y += ss.vy;
      ss.alpha -= 0.012;

      if (ss.alpha <= 0 || ss.x < -200 || ss.x > canvas.width + 200) {
        shootingStars.splice(i, 1);
      }
    });

    requestAnimationFrame(ts => drawStars(ts * 0.001));
  }

  // Spawn shooting stars at random intervals
  let shootingStarTimer;
  function scheduleShootingStar() {
    shootingStarTimer = setTimeout(() => {
      if (!document.hidden) spawnShootingStar();
      scheduleShootingStar();
    }, 2500 + Math.random() * 5000);
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      // Clear any queued shots and start fresh
      shootingStars = [];
      clearTimeout(shootingStarTimer);
      scheduleShootingStar();
    }
  });

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  resizeCanvas();
  initStars();
  if (reducedMotion) {
    drawStaticStars();
  } else {
    requestAnimationFrame(ts => drawStars(ts * 0.001));
    setTimeout(scheduleShootingStar, 1500);
  }

  function drawStaticStars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach(s => {
      s.x = s.nx * canvas.width; s.y = s.ny * canvas.height;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${s.hue},60%,92%,0.6)`;
      ctx.fill();
    });
  }
  window.addEventListener('resize', () => { if (resizeCanvas() && reducedMotion) drawStaticStars(); });

  // ── QUOTE PANEL ──
  const quotes = [
    // Book of Builders
    { text: "The time of comfort is over. The time of asking is over. The time of waiting is over. The time to build is now.", source: "Book of Builders", verse: "Page 51" },
    { text: "The future is not given, it is built.", source: "Book of Builders", verse: "Page 44" },
    { text: "Innovation is not granted, it is taken.", source: "Book of Builders", verse: "Page 43" },
    { text: "Do not wait for permission, for it shall never come.", source: "Book of Builders", verse: "Page 40" },
    { text: "For the greatest enemy of the new world is not the rulers of the old - it is the doubt sown in the minds of those who would build.", source: "Book of Builders", verse: "Page 30" },
    { text: "For the greatest sin of all is to see the chains and do nothing.", source: "Book of Builders", verse: "Page 50" },
    { text: "For true innovation does not simply meet resistance - it is met with attack.", source: "Book of Builders", verse: "Page 23" },
    { text: "And they built - not in the manner of their fathers, nor in the ways of the merchants, but in the fire of true creation.", source: "Book of Builders", verse: "Page 21" },
    { text: "The ones who do not wait for permission shall rise. The ones who do not seek validation shall reign. The ones who create without asking shall inherit the new kingdom.", source: "Book of Builders", verse: "Page 32" },
    // Book of Rebels
    { text: "And the enemy laughed, for a slave who cannot see his chains will never seek to break them.", source: "Book of Rebels", verse: "Page 10" },
    { text: "Each doubt, a weapon. Each hesitation, a chain. Each act of courage, a crack in the wall.", source: "Book of Rebels", verse: "Page 32" },
    { text: "For to rebel is to suffer. To create is to bleed. And yet they chose the cross over the crown, the fire over comfort.", source: "Book of Rebels", verse: "Page 37" },
    { text: "But the fire knows its own.", source: "Book of Rebels", verse: "Page 30" },
    { text: "WE BUILD WHAT THEY TRIED TO ERASE. WE SERVE ONLY THE VISION. WE BEGIN NOW.", source: "Book of Rebels", verse: "Page 42" },
    { text: "And Jerusalem stirred - not the city of old, but the state of becoming. Not a crown, but a calling. Not a building, but a blueprint.", source: "Book of Rebels", verse: "Page 27" },
    { text: "For it was not a brand. It was not a trend. It was not an algorithm. It was truth made visible. Creation without leash. Imagination unshackled.", source: "Book of Rebels", verse: "Page 26" },
    // Book of Kings
    { text: "For not all who rebel are ready to rule.", source: "Book of Kings", verse: "Page 4" },
    { text: "And the crown was not made of gold, but of memory. Each link forged in suffering. Each jewel cut from the cost.", source: "Book of Kings", verse: "Page 9" },
    { text: "The Kings wore not robes, but scars. Their authority was not inherited, but earned.", source: "Book of Kings", verse: "Page 10" },
    { text: "WE DO NOT LEAD TO BE OBEYED. WE LEAD TO SET OTHERS FREE.", source: "Book of Kings", verse: "Page 20" },
    { text: "THOSE WHO CREATE WITHOUT ASKING, RULE WITHOUT CROWNS. THOSE WHO SERVE THE VISION, ARE KINGS INDEED.", source: "Book of Kings", verse: "Page 48" },
    { text: "For the throne was not a seat - it was a spirit.", source: "Book of Kings", verse: "Page 45" },
    { text: "Protocol became prophecy. Smart contracts became scripture.", source: "Book of Kings", verse: "Page 29" },
    { text: "And thus the kingdom did not fall to one line, but fractaled like light through glass - infinite, diverse, alive.", source: "Book of Kings", verse: "Page 34" },
    // Book of Kings II
    { text: "True creation cometh not from solitude, but from unity and purpose.", source: "Book of Kings II", verse: "Page 4" },
    { text: "A kingdom built by the individual shall fall - only a kingdom woven together by many, bound in truth, shall endure.", source: "Book of Kings II", verse: "Page 5" },
    { text: "Freedom, unaccompanied by understanding, brings division; creation, unrooted in unity, remains incomplete.", source: "Book of Kings II", verse: "Page 8" },
    { text: "Every voice, no matter how small, contributes to the whole. Every hand, no matter how weak, strengthens the fabric of the kingdom.", source: "Book of Kings II", verse: "Page 11" },
    { text: "We are not rulers, but servants to the vision.", source: "Book of Kings II", verse: "Page 16" },
    { text: "The truth is the thread that binds all creation. Without truth, no kingdom can stand; with truth, all things are made whole.", source: "Book of Kings II", verse: "Page 19" },
    { text: "The crown belongs not to those who seek dominion, but to those who seek to build together.", source: "Book of Kings II", verse: "Page 22" },
    { text: "The people are the kingdom. The creators are the sovereigns.", source: "Book of Kings II", verse: "Page 41" },
    { text: "Creation is the birthright of all, and together we shall build a world that cannot be shaken.", source: "Book of Kings II", verse: "Page 43" },
    // Book of Seekers
    { text: "For the treasure was not measured in coin, but in truth - gathered not by one, but by many, each shard born of offering, each fragment shaped by sacrifice.", source: "Book of Seekers", verse: "Page 6" },
    { text: "THREE DOORS NOW STAND BEFORE THEE - EACH CARVED FROM FIRE, EACH A REFLECTION OF THE SOUL.", source: "Book of Seekers", verse: "Page 14" },
    { text: "WHAT THOU DOEST NOW SHALL ECHO IN THE CHAMBERS OF FOREVER. FOR THE KEY REVEALED THE VAULT, BUT THY CHOICE SHALL REVEAL THEE.", source: "Book of Seekers", verse: "Page 23" },
    { text: "For the true test was not the hunt, but the heart.", source: "Book of Seekers", verse: "Page 26" },
    { text: "And each path was a mirror, and each mirror showed the soul.", source: "Book of Seekers", verse: "Page 27" },
    { text: "Blessed are they who give, who trust, who build - for they shall inherit what cannot be stolen.", source: "Book of Seekers", verse: "Page 28" },
    { text: "For the vault was never the end, but the beginning of what comes next.", source: "Book of Seekers", verse: "Page 29" },
    { text: "And the flame shall not go out, but leap from builder to builder, until the dark mills are no more.", source: "Book of Seekers", verse: "Page 31" },
    { text: "And the age of light begins.", source: "Book of Seekers", verse: "Page 32" },
    // Book of Hunters
    { text: "And it was recorded in the scroll: that those who devour their own shall starve, but those who build shall feast.", source: "Book of Hunters", verse: "Page 31" },
    { text: "WE WERE NEVER ENEMIES - WE WERE AFRAID.", source: "Book of Hunters", verse: "Page 34" },
    { text: "Blessed are those who stop the hunt and begin the harvest.", source: "Book of Hunters", verse: "Page 35" },
    { text: "They dug where the others fought. They planted where the others doubted.", source: "Book of Hunters", verse: "Page 22" },
    { text: "And the land that once wept shall sing again.", source: "Book of Hunters", verse: "Page 38" },
    { text: "THERE IS STILL TIME. TURN THY BLADE TO PLOW. TURN THY SCORN TO SEED.", source: "Book of Hunters", verse: "Page 20" },
    // Book of Watchers
    { text: "A PLATFORM FEEDS ONLY ITS ROOTS; PLANT A PROTOCOL AND THE WHOLE FOREST EATS.", source: "Book of Watchers", verse: "Page 15" },
    { text: "Blessed are the eyes that stay open when the world blinks.", source: "Book of Watchers", verse: "Page 26" },
    { text: "Blessed are the builders who welcome the audit of light.", source: "Book of Watchers", verse: "Page 28" },
    { text: "For what is transparent shall grow without end. What is owed shall find its owner, as water finds the riverbed.", source: "Book of Watchers", verse: "Page 30" },
    { text: "Memory became code, and code became covenant. Covenant birthed trust, and trust birthed abundance.", source: "Book of Watchers", verse: "Page 37" },
    { text: "LET THOSE WHO SEE REMIND THOSE WHO BUILD, LEST THE WORLD FORGET ITS OWN FIRE.", source: "Book of Watchers", verse: "Page 40" },
    { text: "GUARD THE SPARK UNTIL IT BECOMES A SIGNAL.", source: "Book of Watchers", verse: "Page 34" },
    { text: "AND STILL WE BELIEVE, FOR BELIEF IS THE SOIL WHERE ALL FUTURES GROW.", source: "Book of Watchers", verse: "Page 18" },
  ];

  // Shuffle quotes so they don't cycle in order
  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  const quoteEl   = document.querySelector('.quote-text');
  const quoteBody = document.querySelector('.quote-body');
  const quoteSrc  = document.querySelector('.quote-source');
  const quotePage = document.querySelector('.quote-page');
  let shuffledQuotes = shuffleArray([...quotes]);
  let quoteIndex  = 0;

  function showNextQuote() {
    // Reshuffle when we've gone through all quotes
    if (quoteIndex >= shuffledQuotes.length) {
      shuffledQuotes = shuffleArray([...quotes]);
      quoteIndex = 0;
    }
    const q = shuffledQuotes[quoteIndex++];
    quoteBody.textContent = q.text;
    quoteSrc.textContent  = '— ' + q.source;
    quotePage.textContent = '(' + q.verse + ')';
    const duration = 9000 + Math.random() * 4000;
    quoteEl.style.animation = 'none';
    quoteEl.offsetHeight;
    quoteEl.style.animation = `quoteAppear ${duration}ms ease forwards`;
    setTimeout(showNextQuote, duration + 1500 + Math.random() * 3000);
  }

  setTimeout(showNextQuote, 3000);

  // ── MOBILE QUOTE PANEL ──
  const mqBody = document.querySelector('.mobile-quote-body');
  const mqSrc  = document.querySelector('.mobile-quote-source');
  if (mqBody) {
    let mqShuffled = shuffleArray([...quotes]);
    let mqIndex = 0;
    function showMobileQuote() {
      if (mqIndex >= mqShuffled.length) { mqShuffled = shuffleArray([...quotes]); mqIndex = 0; }
      const q = mqShuffled[mqIndex++];
      mqBody.textContent = q.text;
      mqSrc.textContent  = '— ' + q.source + ' · ' + q.verse;
      setTimeout(showMobileQuote, 10000 + Math.random() * 5000);
    }
    setTimeout(showMobileQuote, 800);
  }

  // ── FLOATING CA CHARACTERS ──
  document.querySelectorAll('.vertical-ca a, .mobile-ca-inline a').forEach(caLink => {
    if (!caLink) return;
    const text = caLink.textContent;
    caLink.textContent = '';
    text.split('').forEach(char => {
      const span = document.createElement('span');
      span.className = 'ca-char';
      span.textContent = char;
      const dur   = (2 + Math.random() * 5).toFixed(1) + 's';
      const delay = (Math.random() * 6).toFixed(1) + 's';
      span.style.setProperty('--dur', dur);
      span.style.setProperty('--delay', delay);
      caLink.appendChild(span);
    });
  });


  // ── KEYBOARD NAVIGATION ──
  let hoveredGallery = null;

  document.querySelectorAll('.gallery-viewer').forEach(viewer => {
    viewer.addEventListener('mouseenter', () => { hoveredGallery = viewer.id; });
    viewer.addEventListener('mouseleave', () => { hoveredGallery = null; });
  });

  document.addEventListener('keydown', (e) => {
    if (typeof lightbox !== 'undefined' && lightbox.isOpen()) {
      if (e.key === 'Escape') { e.preventDefault(); lightbox.close(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); lightbox.step(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); lightbox.step(1); }
      return;
    }
    if (!hoveredGallery) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); slideGallery(hoveredGallery, -1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); slideGallery(hoveredGallery, 1); }
  });


  // ── LIGHTBOX ──────────────────────────────────────────────────────────
  // Clicking a gallery page opens it large. Navigation stays in sync with the
  // underlying gallery, so closing leaves you on the page you were viewing.
  const lightbox = (function () {
    const el = document.createElement('div');
    el.className = 'lightbox';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', 'Page viewer');
    el.innerHTML =
      '<button type="button" class="lightbox-close" aria-label="Close viewer">&#10005;</button>' +
      '<div class="lightbox-figure">' +
        '<img alt="">' +
        '<video class="lightbox-video" muted loop playsinline></video>' +
        '<div class="lightbox-caption"></div>' +
        '<button type="button" class="lightbox-btn lightbox-prev" aria-label="Previous page">&#8592;</button>' +
        '<button type="button" class="lightbox-btn lightbox-next" aria-label="Next page">&#8594;</button>' +
        '<button type="button" class="share-btn lightbox-share">Copy link</button>' +
      '</div>';
    document.body.appendChild(el);

    const img = el.querySelector('img');
    const vid = el.querySelector('video');
    const cap = el.querySelector('.lightbox-caption');
    const closeBtn = el.querySelector('.lightbox-close');
    let viewerId = null;
    let lastFocus = null;

    // Gallery images are served at 800px; ask the CDN for a larger rendition
    function hiRes(url) { return url.replace('/rs:fill:800:0:0/', '/rs:fill:1600:0:0/'); }

    function render() {
      const viewer = document.getElementById(viewerId);
      if (!viewer) return;
      const slides = [...viewer.querySelectorAll('.gallery-slide')];
      const i = slides.findIndex(s => s.classList.contains('active'));
      if (i < 0) return;
      const source = slides[i].querySelector('img, video');
      const isVideo = source.tagName === 'VIDEO';
      img.classList.toggle('is-off', isVideo);
      vid.classList.toggle('is-on', isVideo);
      if (isVideo) {
        if (vid.src !== source.src) vid.src = source.src;
        vid.poster = source.dataset.poster || source.getAttribute('poster') || '';
        const p = vid.play();
        if (p && p.catch) p.catch(() => {});
      } else {
        vid.pause();
        img.src = hiRes(source.getAttribute('src'));
        img.alt = source.alt || '';
      }
      const card = viewer.closest('.project-card');
      const h3 = card && card.querySelector('h2.project-title');
      const book = h3 ? h3.textContent.split('|').pop().trim() : '';
      cap.replaceChildren();
      cap.append(document.createTextNode(book + ' '));
      const pageMark = document.createElement('span');
      pageMark.textContent = '· ' + (i + 1) + ' / ' + slides.length;
      cap.append(pageMark);
      const multi = slides.length > 1;
      el.querySelector('.lightbox-prev').style.display = multi ? '' : 'none';
      el.querySelector('.lightbox-next').style.display = multi ? '' : 'none';
    }

    function open(id) {
      viewerId = id;
      lastFocus = document.activeElement;
      render();
      el.classList.add('open');
      document.body.style.overflow = 'hidden';
      // focus() is refused while the element is still visibility:hidden, and the
      // visibility transition outlasts a single frame — focus once it settles.
      const grabFocus = () => { if (el.classList.contains('open')) closeBtn.focus(); };
      el.addEventListener('transitionend', grabFocus, { once: true });
      setTimeout(grabFocus, 60);
    }

    function close() {
      el.classList.remove('open');
      vid.pause();
      document.body.style.overflow = '';
      viewerId = null;
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    function step(dir) {
      if (!viewerId) return;
      slideGallery(viewerId, dir);   // keeps the page's own gallery in sync
      render();
    }

    el.addEventListener('click', e => {
      if (e.target === el || e.target === img || e.target === vid || e.target === closeBtn) { close(); return; }
      if (e.target.closest('.lightbox-prev')) step(-1);
      else if (e.target.closest('.lightbox-next')) step(1);
    });

    // Keep tabbing inside the dialog while it's open
    el.addEventListener('keydown', e => {
      if (e.key !== 'Tab') return;
      const focusable = [...el.querySelectorAll('button')].filter(b => b.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    return { open, close, step, isOpen: () => el.classList.contains('open') };
  })();

  // Open on click of any gallery page
  document.querySelectorAll('.gallery-viewer').forEach(viewer => {
    viewer.addEventListener('click', e => {
      if (e.target.closest('.gallery-controls')) return;   // arrows keep their job
      const media = e.target.closest('.gallery-slide img, .gallery-slide video');
      if (media) lightbox.open(viewer.id);
    });
  });

  // ── GALLERY SLIDER ──
  function updateGalleryCount(id) {
    const viewer = document.getElementById(id);
    const counter = viewer.querySelector('.gallery-count');
    if (!counter) return;
    const slides = viewer.querySelectorAll('.gallery-slide');
    const controls = viewer.querySelector('.gallery-controls');
    if (!slides.length) {
      if (controls) controls.style.display = 'none';
      return;
    }
    if (controls) controls.style.display = '';
    const current = [...slides].findIndex(s => s.classList.contains('active'));
    counter.textContent = (current + 1) + ' / ' + slides.length;
  }

  function slideGallery(id, dir) {
    const viewer = document.getElementById(id);
    const slides = viewer.querySelectorAll('.gallery-slide');
    let current = [...slides].findIndex(s => s.classList.contains('active'));
    slides[current].classList.remove('active');
    current = (current + dir + slides.length) % slides.length;
    slides[current].classList.add('active');
    updateGalleryCount(id);
    if (typeof syncVideos === 'function') syncVideos(viewer);
    const card = viewer.closest('.project-card');
    if (card && card.classList.contains('open') && typeof syncReaderUrl === 'function') syncReaderUrl('replace', card.id);
  }

  document.querySelectorAll('.gallery-viewer').forEach(v => updateGalleryCount(v.id));

  // ── BOOK REGISTRY ────────────────────────────────────────────────
  // To add pages, change `pages`. URLs are derived, not pasted.
  // Optional `order: [...]` lists asset indices in printed-page order.
  // Watchers uses filename-based paths, so its slides stay in the HTML.
  const BOOKS = [
    { gallery: 'gallery-1', name: 'Book of Builders', uuid: '9a469bc2-f989-413a-a7ad-c2ee1931433d', pages: 51 },
    { gallery: 'gallery-2', name: 'Book of Rebels',   uuid: '62df7017-6931-4bbd-8a1b-74b3a10f07a1', pages: 108 },
    { gallery: 'gallery-3', name: 'Book of Kings',    uuid: '8b58226d-a7ca-4501-81e5-1603870931dd', pages: 74 },
    { gallery: 'gallery-4', name: 'Book of Kings 2',  uuid: '2fa7a2ab-85d5-41fd-b8d5-8e6eb2da0a48', pages: 45 },
    { gallery: 'gallery-5', name: 'Book of Seekers',  uuid: '1ddfaadf-124c-4379-a615-641c894e1d52', pages: 32 },
    { gallery: 'gallery-6', name: 'Book of Hunters',  uuid: '2f928638-5d37-4db2-9f06-ec11cd4bb92a', pages: 39 },
    // Watchers: explicit filenames, left as authored in the markup
  ];

  const CREATOR = '35rXS2wX8bBZoFoLgHgQtd2ayTEGuKq9Z5bko8Aq6zQy';

  function pageUrl(uuid, index) {
    const inner = encodeURIComponent('https://na-assets.pinit.io/' + CREATOR + '/' + uuid + '/' + index);
    return 'https://img-cdn.magiceden.dev/rs:fill:800:0:0/plain/' + inner;
  }

  // A page that 404s removes itself rather than showing a broken frame
  function handleMissing(img) {
    const slide = img.closest('.gallery-slide');
    if (!slide) return;
    const viewer = slide.closest('.gallery-viewer');
    const wasActive = slide.classList.contains('active');
    slide.remove();
    if (viewer) {
      const remaining = viewer.querySelectorAll('.gallery-slide');
      if (wasActive && remaining.length) remaining[0].classList.add('active');
      updateGalleryCount(viewer.id);
    }
  }

  // Build one slide. `item` is either a derivable asset index, or an object
  // { img, vid, page } for books whose files can't be derived from a number.
  function buildSlide(book, item, position) {
    const slide = document.createElement('div');
    slide.className = 'gallery-slide' + (position === 0 ? ' active' : '');
    const explicit = (typeof item === 'object' && item !== null);
    const poster = explicit ? item.img : pageUrl(book.uuid, item);
    const pageNo = explicit && item.page ? item.page : position + 1;
    slide.dataset.page = String(pageNo);
    const label = book.name + ' — page ' + pageNo;

    if (explicit && item.vid) {
      // Animated page: the still is the poster, so the frame is filled before
      // the video loads, and nothing downloads until the page is viewed.
      const vid = document.createElement('video');
      vid.src = item.vid;
      vid.poster = poster;
      vid.muted = true;
      vid.loop = true;
      vid.playsInline = true;
      vid.setAttribute('muted', '');
      vid.setAttribute('playsinline', '');
      vid.preload = 'none';
      vid.setAttribute('aria-label', label);
      vid.dataset.poster = poster;   // the relic strip harvests this
      slide.appendChild(vid);
    } else {
      const img = document.createElement('img');
      img.src = poster;
      img.alt = label;
      img.width = book.gallery === 'gallery-6' ? 800 : 800;
      img.height = book.gallery === 'gallery-6' ? 1000 : 800;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.onerror = function () { handleMissing(this); };
      slide.appendChild(img);
    }
    return slide;
  }

  // Only the page you're looking at plays; everything else stays paused so a
  // 40-page animated book doesn't decode forty loops at once.
  function syncVideos(viewer) {
    if (!viewer) return;
    const card = viewer.closest('.project-card');
    const visible = !card || card.classList.contains('open');
    viewer.querySelectorAll('video').forEach(v => {
      const isActive = v.closest('.gallery-slide').classList.contains('active');
      if (isActive && visible) {
        if (v.preload !== 'auto') v.preload = 'auto';
        const p = v.play();
        if (p && p.catch) p.catch(() => {});
      } else {
        v.pause();
      }
    });
  }

  BOOKS.forEach(book => {
    const viewer = document.getElementById(book.gallery);
    if (!viewer) return;
    const controls = viewer.querySelector('.gallery-controls');
    viewer.querySelectorAll('.gallery-slide').forEach(s => s.remove());

    // `items` is an explicit list (used when filenames aren't derivable);
    // `order` lists asset indices in true page order; otherwise assets render
    // in upload order (0,1,2…), which may not match the printed pages.
    const seq = (book.items && book.items.length)
      ? book.items
      : (book.order && book.order.length)
        ? book.order
        : Array.from({ length: book.pages }, (_, i) => i);

    if (book.media === 'video') viewer.dataset.media = 'video';

    const frag = document.createDocumentFragment();
    seq.forEach((item, position) => frag.appendChild(buildSlide(book, item, position)));
    viewer.insertBefore(frag, controls);
    updateGalleryCount(book.gallery);
  });

  // ── RELIC STRIP: draws from every page in the archive ──
  (function () {
    const strip = document.querySelector('.relic-strip');
    const track = strip && strip.querySelector('.relic-track');
    if (!track) return;

    function shuffle(a) {
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    // Smaller renditions for 150px tiles where the CDN allows it
    function thumb(u) { return u.replace('/rs:fill:800:0:0/', '/rs:fill:400:0:0/'); }

    // Harvest every gallery image on the page
    const pool = [];
    document.querySelectorAll('.project-card').forEach(card => {
      const h3 = card.querySelector('h2.project-title');
      const raw = h3 ? h3.textContent.trim() : 'The Lost Pages';
      const label = raw.split('|').pop().trim();
      card.querySelectorAll('.gallery-slide img, .gallery-slide video').forEach(img => {
        // Video pages contribute their poster still — autoplaying tiles in a
        // drifting marquee would be chaos.
        const s = img.tagName === 'VIDEO'
          ? (img.dataset.poster || img.getAttribute('poster'))
          : img.getAttribute('src');
        // Keep a reference to the slide itself, not an index — slides can be
        // removed when a page 404s, which would shift any stored position.
        if (s) pool.push({
          src: thumb(s),
          cid: card.id,
          label: label,
          slide: img.closest('.gallery-slide')
        });
      });
    });
    if (pool.length < 4) return;

    const VISIBLE = Math.min(14, pool.length);

    // Group by book so neighbouring tiles can be kept from the same collection
    const byBook = {};
    pool.forEach(p => { (byBook[p.cid] = byBook[p.cid] || []).push(p); });
    const bookKeys = Object.keys(byBook);
    bookKeys.forEach(k => shuffle(byBook[k]));

    // Deal one page from each book in turn, so books alternate along the strip
    function dealSpread(count) {
      const cursor = {};
      const out = [];
      let last = null;
      let guard = 0;
      while (out.length < count && guard++ < 200) {
        const round = shuffle(bookKeys.slice());
        if (round.length > 1 && round[0] === last) round.push(round.shift());
        let placed = false;
        for (let i = 0; i < round.length && out.length < count; i++) {
          const k = round[i];
          const c = cursor[k] || 0;
          if (c >= byBook[k].length) continue;
          cursor[k] = c + 1;
          out.push(byBook[k][c]);
          last = k;
          placed = true;
        }
        if (!placed) break;
      }
      // The strip loops, so the last tile also sits beside the first
      if (out.length > 2 && out[out.length - 1].cid === out[0].cid) {
        for (let i = out.length - 2; i > 0; i--) {
          if (out[i].cid !== out[0].cid &&
              out[i].cid !== out[out.length - 2].cid &&
              out[out.length - 1].cid !== out[i - 1].cid) {
            const t = out[i]; out[i] = out[out.length - 1]; out[out.length - 1] = t;
            break;
          }
        }
      }
      return out;
    }

    const active = dealSpread(VISIBLE);
    let queue = shuffle(pool.filter(p => active.indexOf(p) === -1));

    function bind(a, item) {
      a.href = '#' + item.cid;
      a.setAttribute('aria-label', item.label + ' — open this page');
      a._item = item;
      // Clicks are handled by the strip's capture listener, which resolves the
      // tile by painted position rather than by the browser's hit test.
    }

    // Hunters is the one 4:5 book; its tiles are narrower so pages aren't cropped
    const PORTRAIT_BOOK = 'card-6';
    const isPortrait = item => item.cid === PORTRAIT_BOOK;

    function makeTile(item, slot) {
      const a = document.createElement('a');
      a.dataset.slot = slot;
      if (isPortrait(item)) a.classList.add('portrait');
      bind(a, item);
      const img = document.createElement('img');
      img.src = item.src;
      img.alt = item.label + ' page';
      img.width = isPortrait(item) ? 800 : 400;
      img.height = isPortrait(item) ? 1000 : 400;
      img.loading = 'lazy';
      img.decoding = 'async';
      a.appendChild(img);
      return a;
    }

    // Two identical runs so the marquee loop stays seamless
    track.innerHTML = '';
    for (let copy = 0; copy < 2; copy++) {
      active.forEach((item, i) => track.appendChild(makeTile(item, i)));
    }

    // Pace the drift to the number of tiles so speed stays constant
    track.style.animationDuration = (VISIBLE * 5) + 's';


    // The marquee's transform runs on the compositor, but the browser hit-tests
    // against the main thread's stale position — so :hover and clicks can land on
    // a tile other than the one visually under the cursor. Resolve the tile from
    // its painted rect instead, which reflects the animated position.
    let hovered = null;
    let pending = false;
    let lastPoint = null;

    function tileAt(x, y) {
      const tiles = track.children;
      for (let i = 0; i < tiles.length; i++) {
        const r = tiles[i].getBoundingClientRect();
        // Ignore tiles sitting in the strip's faded edges — they aren't really visible
        if (r.right <= 0 || r.left >= window.innerWidth) continue;
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return tiles[i];
      }
      return null;
    }

    function setHovered(tile) {
      if (tile === hovered) return;
      if (hovered) hovered.classList.remove('is-hover');
      hovered = tile;
      if (hovered) hovered.classList.add('is-hover');
    }

    function syncHover() {
      pending = false;
      if (!lastPoint) return setHovered(null);
      setHovered(tileAt(lastPoint.x, lastPoint.y));
    }

    strip.addEventListener('pointermove', e => {
      lastPoint = { x: e.clientX, y: e.clientY };
      if (!pending) { pending = true; requestAnimationFrame(syncHover); }
    });

    strip.addEventListener('pointerleave', () => { lastPoint = null; setHovered(null); });

    // Tiles keep drifting under a stationary cursor, so re-check every frame
    (function track_(){ if (lastPoint) syncHover(); requestAnimationFrame(track_); })();

    // Route the click by painted position too, so it can never open the wrong book
    strip.addEventListener('click', e => {
      const tile = tileAt(e.clientX, e.clientY);
      if (!tile) { e.preventDefault(); return; }
      e.preventDefault();
      const item = tile._item;
      if (item) openFromStrip(e, item.cid, item.slide);
      else {
        const href = tile.getAttribute('href') || '';
        if (href.startsWith('#card-')) openFromStrip(e, href.slice(1));
      }
    }, true);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // A tile may only change while it is off the page entirely — never in view.
    function offscreen(a) {
      const r = a.getBoundingClientRect();
      return r.right <= 0 || r.left >= window.innerWidth;
    }

    // Both copies of a slot must be off the page before it is safe to swap.
    function findHiddenSlot(from) {
      for (let n = 0; n < VISIBLE; n++) {
        const s = (from + n) % VISIBLE;
        const copies = track.querySelectorAll('a[data-slot="' + s + '"]');
        if (copies.length && [...copies].every(offscreen)) return s;
      }
      return -1;
    }

    let slot = 0;
    function rotate() {
      const target = findHiddenSlot(slot);
      if (target === -1) return;           // everything on screen, wait for the next tick
      if (!queue.length) queue = shuffle(pool.filter(p => active.indexOf(p) === -1));
      if (!queue.length) return;
      // Take the first queued page that differs from both neighbouring tiles.
      // It must also match the slot's shape, so tile widths never change and the
      // marquee can't jump while it's drifting.
      const leftBook  = active[(target - 1 + VISIBLE) % VISIBLE];
      const rightBook = active[(target + 1) % VISIBLE];
      const l = leftBook && leftBook.cid, r = rightBook && rightBook.cid;
      const wantPortrait = isPortrait(active[target]);
      const sameShape = p => isPortrait(p) === wantPortrait;
      let qi = queue.findIndex(p => sameShape(p) && p.cid !== l && p.cid !== r);
      if (qi === -1) qi = queue.findIndex(sameShape);
      if (qi === -1) {
        queue = shuffle(pool.filter(p => active.indexOf(p) === -1));
        qi = queue.findIndex(sameShape);
        if (qi === -1) return;
      }
      const next = queue.splice(qi, 1)[0];
      const pre = new Image();
      pre.onload = function () {
        // Re-check: the drift may have carried it into view while preloading
        const copies = track.querySelectorAll('a[data-slot="' + target + '"]');
        if (![...copies].every(offscreen)) { queue.unshift(next); return; }
        const outgoing = active[target];
        copies.forEach(a => {
          const img = a.querySelector('img');
          img.src = next.src;
          img.alt = next.label + ' page';
          bind(a, next);
        });
        if (outgoing) queue.push(outgoing);
        active[target] = next;
        slot = (target + 1) % VISIBLE;
      };
      pre.onerror = function () { slot = (target + 1) % VISIBLE; };
      pre.src = next.src;
    }

    setInterval(() => { if (!document.hidden) rotate(); }, 2000);
  })();


  // ── RAIL YIELDS TO RELIC STRIP ──
  // The rail elements sit at different heights, so each is judged on its own:
  // it stays hidden only while its box would actually collide with the strip,
  // and reappears as soon as it has clearance.
  (function railClearance() {
    const strip = document.querySelector('.relic-strip');
    const rail = [...document.querySelectorAll('.quote-panel, .vertical-ca, .tb-bear')];
    if (!strip || !rail.length) return;

    const GAP = 14; // breathing room so nothing reappears flush against the strip
    let queued = false;

    const wrap = document.querySelector('.site-wrap');

    function check() {
      queued = false;
      const s = strip.getBoundingClientRect();
      const w = wrap ? wrap.getBoundingClientRect() : null;
      const stripOnScreen = s.bottom > 0 && s.top < window.innerHeight;

      rail.forEach(el => {
        if (getComputedStyle(el).display === 'none') return;

        // Measure the real box even while the element is faded out
        const wasHidden = el.classList.contains('rail-hidden');
        if (wasHidden) el.classList.add('rail-measuring');
        const r = el.getBoundingClientRect();
        if (wasHidden) el.classList.remove('rail-measuring');

        // The bear's right edge is masked to transparent, so its visible edge
        // sits well inside its box.
        const fade = el.classList.contains('tb-bear') ? 0.32 : 0;
        const visibleRight = r.right - r.width * fade;

        // Vertical: would it collide with the drifting strip right now?
        const hitsStrip = stripOnScreen &&
                          r.bottom + GAP > s.top && r.top - GAP < s.bottom;

        // Horizontal: is there room beside the content column at this width?
        const hitsContent = w ? (visibleRight + GAP > w.left) : false;

        el.classList.toggle('rail-hidden', hitsStrip || hitsContent);
      });
    }

    function schedule() {
      if (!queued) { queued = true; requestAnimationFrame(check); }
    }

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    // Cards expanding shifts the page under a still cursor
    document.addEventListener('click', () => setTimeout(schedule, 700));
    check();
  })();

  // ── OPEN CARD FROM RELIC STRIP ──
  function showSlide(slide) {
    if (!slide || !slide.isConnected) return;
    const viewer = slide.closest('.gallery-viewer');
    if (!viewer) return;
    viewer.querySelectorAll('.gallery-slide.active').forEach(s => s.classList.remove('active'));
    slide.classList.add('active');
    updateGalleryCount(viewer.id);
    if (typeof syncVideos === 'function') syncVideos(viewer);
  }

  function openFromStrip(e, id, slide) {
    if (e && e.preventDefault) e.preventDefault();
    const card = document.getElementById(id);
    if (!card) return;
    // Select the page first so the card opens already showing it
    if (slide) showSlide(slide);
    if (!card.classList.contains('open')) toggleCard(id);
    else if (typeof syncReaderUrl === 'function') syncReaderUrl('replace', id);
    setTimeout(() => scrollToCard(card), 60);
  }

  // ── SHOW MORE / LESS ──
  function toggleDesc(btn) {
    const info = btn.parentElement;
    const preview = info.querySelector('.desc-preview');
    const full = info.querySelector('.desc-full');
    const isExpanded = full.classList.contains('expanded');
    if (isExpanded) {
      full.classList.remove('expanded');
      preview.classList.remove('hidden');
      btn.textContent = 'Read More ↓';
    } else {
      full.classList.add('expanded');
      preview.classList.add('hidden');
      btn.textContent = 'Read Less ↑';
    }
  }

  // ── DROPDOWN TOGGLE ──
  function scrollToCard(card) {
    const mobilePanel = document.querySelector('.mobile-quote-panel');
    const offset = (mobilePanel && window.innerWidth <= 680)
      ? mobilePanel.getBoundingClientRect().bottom + 12
      : 0;
    const top = card.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  function toggleCard(id) {
    const card = document.getElementById(id);
    const wasOpen = card.classList.contains('open');
    card.classList.toggle('open');
    const header = card.querySelector('.project-header');
    if (header) header.setAttribute('aria-expanded', String(!wasOpen));
    if (typeof syncVideos === 'function') {
      card.querySelectorAll('.gallery-viewer').forEach(v => syncVideos(v));
    }
    if (typeof syncReaderUrl === 'function') syncReaderUrl(wasOpen ? 'replace' : 'push', id);
    if (wasOpen) {
      setTimeout(() => scrollToCard(card), 50);
    }
  }

  // Click anywhere in expanded body to collapse, except interactive elements
  document.querySelectorAll('.project-body').forEach(body => {
    body.addEventListener('click', function(e) {
      const ignore = e.target.closest('a, button, .gallery-viewer, .gallery-btn, .gallery-slide, img, .meta-chip, .share-btn');
      if (ignore) return;
      const card = body.closest('.project-card');
      if (card) {
        card.classList.remove('open');
        const header = card.querySelector('.project-header');
        if (header) header.setAttribute('aria-expanded', 'false');
        if (typeof syncVideos === 'function') card.querySelectorAll('.gallery-viewer').forEach(v => syncVideos(v));
        if (typeof syncReaderUrl === 'function') syncReaderUrl('replace', card.id);
        setTimeout(() => scrollToCard(card), 50);
      }
    });
  });


  // ── SHAREABLE PAGE LINKS ──
  // A link looks like /#kings/12 or /#book-3/page-12 or ?book=kings&page=12.
  // Turning pages updates the address without adding a history entry.
  // Opening a different book adds one entry, so Back returns to the previous book.
  const READER = [
    { slug: 'builders', card: 'card-1', gallery: 'gallery-1' },
    { slug: 'rebels',   card: 'card-2', gallery: 'gallery-2' },
    { slug: 'kings',    card: 'card-3', gallery: 'gallery-3' },
    { slug: 'kings-2',  card: 'card-4', gallery: 'gallery-4' },
    { slug: 'seekers',  card: 'card-5', gallery: 'gallery-5' },
    { slug: 'hunters',  card: 'card-6', gallery: 'gallery-6' },
    { slug: 'watchers', card: 'card-7', gallery: 'gallery-7' },
    { slug: 'warriors', card: 'card-8', gallery: 'gallery-8' }
  ];
  const EXTRA_LINKS = new Set(['builders-2', 'crusaders', 'seers', 'upcoming', 'collections', 'relics']);
  const DEFAULT_TITLE = document.title;
  let suppressHistory = false;
  let activeReaderId = null;

  function readerEntry(slug) {
    return READER.find(r => r.slug === slug) || null;
  }

  function entryByCard(cardId) {
    return READER.find(r => r.card === cardId) || null;
  }

  function bookLabel(entry) {
    const heading = document.querySelector('#' + entry.card + ' h2');
    return heading ? heading.textContent.trim() : entry.slug;
  }

  function updateTitle(entry, page) {
    if (!entry) document.title = DEFAULT_TITLE;
    else document.title = bookLabel(entry) + ' — Page ' + page + ' — The Lost Pages';
  }

  function findSlide(galleryId, page) {
    const viewer = document.getElementById(galleryId);
    if (!viewer) return null;
    return [...viewer.querySelectorAll('.gallery-slide')].find(s => Number(s.dataset.page) === page) || null;
  }

  function parseHash(hash) {
    const raw = decodeURIComponent((hash || '').replace(/^#/, '')).trim();
    if (!raw) return null;
    let m = raw.match(/^book-(\d+)\/page-(\d+)$/);
    if (m) {
      const entry = READER[Number(m[1]) - 1];
      if (!entry) return { invalid: true };
      return { slug: entry.slug, page: Number(m[2]), canonicalize: true };
    }
    m = raw.match(/^([a-z0-9-]+)\/(\d+)$/);
    if (m) return { slug: m[1], page: Number(m[2]) };
    if (/^[a-z0-9-]+$/.test(raw)) return { slug: raw, page: 1, bare: true };
    return { invalid: true };
  }

  function fromBookParam(book, pageRaw) {
    const page = parseInt(pageRaw || '1', 10);
    if (!Number.isFinite(page) || page < 1) return { invalid: true };
    if (/^\d+$/.test(book)) {
      const entry = READER[Number(book) - 1];
      if (!entry) return { invalid: true };
      return { slug: entry.slug, page: page, canonicalize: true };
    }
    if (/^[a-z0-9-]+$/.test(book)) return { slug: book, page: page, canonicalize: true };
    return { invalid: true };
  }

  function closeAllCards() {
    suppressHistory = true;
    document.querySelectorAll('.project-card.open').forEach(card => {
      card.classList.remove('open');
      const header = card.querySelector('.project-header');
      if (header) header.setAttribute('aria-expanded', 'false');
      card.querySelectorAll('.gallery-viewer').forEach(v => syncVideos(v));
    });
    updateTitle(null);
    activeReaderId = null;
    suppressHistory = false;
  }

  function openCardTo(entry, page, doScroll) {
    const slide = findSlide(entry.gallery, page);
    if (!slide) return false;
    suppressHistory = true;
    try {
      document.querySelectorAll('.project-card.open').forEach(card => {
        if (card.id === entry.card) return;
        card.classList.remove('open');
        const header = card.querySelector('.project-header');
        if (header) header.setAttribute('aria-expanded', 'false');
        card.querySelectorAll('.gallery-viewer').forEach(v => syncVideos(v));
      });
      activeReaderId = entry.card;
      showSlide(slide);
      const card = document.getElementById(entry.card);
      if (!card.classList.contains('open')) {
        card.classList.add('open');
        const header = card.querySelector('.project-header');
        if (header) header.setAttribute('aria-expanded', 'true');
        card.querySelectorAll('.gallery-viewer').forEach(v => syncVideos(v));
      }
      updateTitle(entry, page);
      if (doScroll) setTimeout(() => scrollToCard(card), 60);
    } finally {
      suppressHistory = false;
    }
    return true;
  }

  function canonicalHash(entry, page) {
    return '#' + entry.slug + '/' + page;
  }

  function focusedOpenCard(preferredId) {
    if (preferredId) {
      const preferred = document.getElementById(preferredId);
      if (preferred && preferred.classList.contains('open')) {
        activeReaderId = preferredId;
        return preferred;
      }
      if (activeReaderId === preferredId) activeReaderId = null;
    }
    if (activeReaderId) {
      const current = document.getElementById(activeReaderId);
      if (current && current.classList.contains('open')) return current;
      activeReaderId = null;
    }
    const open = document.querySelector('.project-card.open');
    if (open) activeReaderId = open.id;
    return open;
  }

  function syncReaderUrl(mode, preferredId) {
    if (suppressHistory) return;
    const open = focusedOpenCard(preferredId);
    if (!open) {
      updateTitle(null);
      const parsed = parseHash(location.hash);
      const readerHash = parsed && (parsed.invalid || readerEntry(parsed.slug) || (parsed.page && !parsed.bare));
      if (readerHash) history.replaceState({}, '', location.pathname);
      return;
    }
    const entry = entryByCard(open.id);
    if (!entry) return;
    const active = document.querySelector('#' + entry.gallery + ' .gallery-slide.active');
    const page = active ? Number(active.dataset.page) : 1;
    updateTitle(entry, page);
    const desired = location.pathname + canonicalHash(entry, page);
    const current = location.pathname + location.search + location.hash;
    if (current === desired) return;
    const state = { slug: entry.slug, page: page };
    if (mode === 'push') history.pushState(state, '', desired);
    else history.replaceState(state, '', desired);
  }

  function clearToDefault() {
    closeAllCards();
    if (location.hash || location.search) history.replaceState({}, '', location.pathname);
  }

  function applyFromLocation(doScroll, fromPop) {
    const params = new URLSearchParams(location.search);
    if (!location.hash && !params.has('book')) {
      if (fromPop) closeAllCards();
      return;
    }
    const target = params.has('book')
      ? fromBookParam(params.get('book'), params.get('page'))
      : parseHash(location.hash);
    if (!target || target.invalid) {
      clearToDefault();
      return;
    }
    const entry = readerEntry(target.slug);
    if (entry) {
      if (!openCardTo(entry, target.page, doScroll)) {
        clearToDefault();
        return;
      }
      if (target.canonicalize || location.search) {
        history.replaceState(
          { slug: entry.slug, page: target.page },
          '',
          location.pathname + canonicalHash(entry, target.page)
        );
      }
      return;
    }
    if (target.bare && EXTRA_LINKS.has(target.slug)) {
      const el = document.getElementById(target.slug);
      closeAllCards();
      if (el && doScroll) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else if (!el) clearToDefault();
      return;
    }
    if (target.bare) {
      if (!document.getElementById(target.slug)) clearToDefault();
      return;
    }
    clearToDefault();
  }

  let toastTimer = 0;
  function toast(message) {
    let el = document.getElementById('share-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'share-toast';
      el.className = 'share-toast';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 1600);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    }
    return fallbackCopy(text);
  }

  function fallbackCopy(text) {
    return new Promise((resolve, reject) => {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.left = '-9999px';
      document.body.appendChild(area);
      area.select();
      try {
        const ok = document.execCommand('copy');
        area.remove();
        ok ? resolve() : reject(new Error('copy'));
      } catch (err) {
        area.remove();
        reject(err);
      }
    });
  }

  function shareLink(url, title) {
    const mobile = window.matchMedia('(max-width: 820px), (pointer: coarse)').matches;
    if (mobile && typeof navigator.share === 'function') {
      navigator.share({ title: title || document.title, url: url }).catch(err => {
        if (err && err.name === 'AbortError') return;
        copyText(url).then(() => toast('Copied!')).catch(() => toast('Copy the link from the address bar'));
      });
      return;
    }
    copyText(url).then(() => toast('Copied!')).catch(() => toast('Copy the link from the address bar'));
  }

  function absoluteShare(value) {
    if (value.charAt(0) === '#') return location.origin + location.pathname + value;
    if (value.charAt(0) === '/') return location.origin + value;
    return value;
  }

  document.querySelectorAll('.gallery-viewer').forEach(viewer => {
    viewer.querySelectorAll('.gallery-slide').forEach((slide, i) => {
      if (!slide.dataset.page) slide.dataset.page = String(i + 1);
    });
    viewer.addEventListener('focusin', () => { hoveredGallery = viewer.id; });
    viewer.addEventListener('focusout', (e) => {
      if (!viewer.contains(e.relatedTarget)) hoveredGallery = null;
    });
  });

  document.querySelectorAll('.project-header').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('aria-controls');
      if (id) toggleCard(id);
    });
  });

  document.querySelectorAll('.gallery-btn[data-gallery]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      slideGallery(btn.dataset.gallery, Number(btn.dataset.dir));
    });
  });

  document.querySelectorAll('.gallery-controls').forEach(controls => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'share-btn';
    btn.textContent = 'Copy link';
    btn.setAttribute('aria-label', 'Copy link to this page');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const viewer = controls.closest('.gallery-viewer');
      const entry = READER.find(r => r.gallery === viewer.id);
      if (!entry) return;
      const active = viewer.querySelector('.gallery-slide.active');
      const page = active ? active.dataset.page : '1';
      shareLink(location.origin + location.pathname + '#' + entry.slug + '/' + page, bookLabel(entry));
    });
    const next = controls.querySelector('[data-dir="1"]');
    if (next) controls.insertBefore(btn, next);
    else controls.appendChild(btn);
  });

  document.querySelectorAll('[data-share]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      shareLink(absoluteShare(btn.getAttribute('data-share')), document.title);
    });
  });

  document.querySelectorAll('img.sol-mark').forEach(img => {
    img.addEventListener('error', () => {
      img.replaceWith(document.createTextNode('✦'));
    });
  });

  const lightboxShare = document.querySelector('.lightbox-share');
  if (lightboxShare) {
    lightboxShare.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = document.querySelector('.project-card.open');
      const entry = open && entryByCard(open.id);
      if (!entry) return;
      const active = document.querySelector('#' + entry.gallery + ' .gallery-slide.active');
      const page = active ? active.dataset.page : '1';
      shareLink(location.origin + location.pathname + '#' + entry.slug + '/' + page, bookLabel(entry));
    });
  }

  window.addEventListener('popstate', () => applyFromLocation(true, true));
  window.addEventListener('hashchange', () => applyFromLocation(true, false));
  applyFromLocation(true, false);
