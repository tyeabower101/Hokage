/* HOKAGE — fx: sound forged from oscillators, haptics, ink. Nothing here touches state. */
(function (G) {
  'use strict';
  var ctx = null, master = null, unlocked = false;
  function ac() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.55; master.connect(ctx.destination);
    return ctx;
  }
  G.fxUnlock = function () {
    if (unlocked) return; var c = ac(); if (!c) return;
    if (c.state === 'suspended') c.resume().catch(function () {});
    /* silent tick primes iOS */
    var o = c.createOscillator(), g = c.createGain(); g.gain.value = 0; o.connect(g); g.connect(master); o.start(); o.stop(c.currentTime + 0.01);
    unlocked = true;
  };
  function soundOn() { return G.state && G.state.prefs && G.state.prefs.sound !== false; }
  function tone(f, type, t0, dur, vol, detune, dest) {
    var c = ac(), o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.value = f; if (detune) o.detune.value = detune;
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest || master); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function noise(t0, dur, vol, hp) {
    var c = ac(), n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
    s.buffer = buf; f.type = hp ? 'highpass' : 'lowpass'; f.frequency.value = hp || 900;
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(t0);
  }
  var SOUNDS = {
    stamp: function (t) { /* taiko: pitch drop + skin noise */
      var c = ac(), o = c.createOscillator(), g = c.createGain();
      o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.16);
      g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.35); noise(t, 0.07, 0.35);
    },
    chime: function (t) { [880, 1318.5, 1760].forEach(function (f, i) { tone(f, 'sine', t + i * 0.02, 1.1 - i * 0.2, 0.28 - i * 0.07); }); },
    flip: function (t) { tone(660, 'triangle', t, 0.25, 0.25); tone(990, 'triangle', t + 0.12, 0.3, 0.2); },
    tick: function (t) { tone(1400, 'square', t, 0.03, 0.05); },
    seal: function (t) { /* gong */
      [98, 147, 196.5, 294, 392].forEach(function (f, i) { tone(f, i ? 'sine' : 'triangle', t, 2.4 - i * 0.25, 0.32 - i * 0.05, i * 3); });
      noise(t, 0.12, 0.3, 3000);
    },
    rank: function (t) { [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) { tone(f, 'sine', t + i * 0.13, 0.9, 0.3); tone(f * 2, 'sine', t + i * 0.13, 0.5, 0.08); }); },
    coin: function (t) { tone(2093, 'sine', t, 0.09, 0.18); tone(2637, 'sine', t + 0.07, 0.22, 0.18); },
    whoosh: function (t) { noise(t, 0.35, 0.22, 600); },
    handseal: function (t) { tone(330, 'triangle', t, 0.08, 0.14); noise(t, 0.05, 0.12, 2000); },
    tier_common: function (t) { tone(196, 'triangle', t, 0.5, 0.22); noise(t, 0.06, 0.25); },
    tier_noble: function (t) { [261.6, 329.6, 392].forEach(function (f, i) { tone(f, 'sine', t + i * 0.05, 1.0, 0.22); }); },
    tier_rare: function (t) { [261.6, 392, 523.3, 659.3].forEach(function (f, i) { tone(f, 'sine', t + i * 0.07, 1.4 - i * 0.1, 0.26 - i * 0.03); }); noise(t, 0.1, 0.2, 2400); },
    tier_legend: function (t) {
      [65.4, 98, 130.8].forEach(function (f) { tone(f, 'triangle', t, 3.2, 0.3); });
      [523.3, 659.3, 784, 1046.5, 1318.5].forEach(function (f, i) { tone(f, 'sine', t + 0.5 + i * 0.16, 1.8, 0.24); tone(f * 2, 'sine', t + 0.5 + i * 0.16, 0.9, 0.07); });
      noise(t, 0.5, 0.3, 200); noise(t + 0.5, 0.2, 0.22, 3000);
    },
    heartbeat: function (t) { var c = ac(), o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(72, t); o.frequency.exponentialRampToValueAtTime(38, t + 0.2); g.gain.setValueAtTime(0.8, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4); o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.45); },
    wheel: function (t) { tone(880 + Math.random() * 220, 'square', t, 0.022, 0.045); },
    rasengan: function (t) { var c = ac(), o = c.createOscillator(), g = c.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(80, t); o.frequency.exponentialRampToValueAtTime(1200, t + 1.1); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22, t + 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3); var f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1800; o.connect(f); f.connect(g); g.connect(master); o.start(t); o.stop(t + 1.4); }
  };
  G.sfx = function (name) {
    if (!soundOn()) return;
    try {
      var c = ac(); if (!c || !SOUNDS[name]) return; if (c.state === 'suspended') c.resume().catch(function () {});
      /* the night mix: after 10 PM and before 7 AM the village speaks softly */
      var h = new Date().getHours(); master.gain.value = (h >= 22 || h < 7) ? 0.34 : 0.55;
      SOUNDS[name](c.currentTime);
    } catch (e) {}
  };
  /* count a number up inside an element — the reward should feel earned, not pasted */
  G.countUp = function (el, to, prefix, ms) {
    if (!el) return; to = +to || 0; if (G.reducedMotion() || to <= 3) { el.textContent = (prefix || '') + G.fmtN(to); return; }
    var t0 = performance.now(), dur = ms || 700;
    (function f(now) {
      var t = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - t, 2.4);
      el.textContent = (prefix || '') + G.fmtN(Math.round(to * e));
      if (t < 1) requestAnimationFrame(f);
    })(t0);
  };

  /* ---------- haptics ---------- */
  G.buzz = function (pat) {
    if (!(G.state && G.state.prefs && G.state.prefs.haptics !== false)) return;
    try { if (navigator.vibrate) navigator.vibrate(pat); } catch (e) {}
  };

  /* ---------- motion ---------- */
  G.reducedMotion = function () {
    var p = G.state && G.state.prefs && G.state.prefs.motion;
    if (p === 'off') return true; if (p === 'on') return false;
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
  };

  /* ---------- ink particles ---------- */
  G.ink = function (el, opts) {
    if (!el || G.reducedMotion()) return;
    opts = opts || {};
    var n = opts.n || 14, color = opts.color || 'var(--red)';
    var r = el.getBoundingClientRect(), host = document.createElement('div');
    host.className = 'inkburst'; host.style.left = (r.left + r.width / 2) + 'px'; host.style.top = (r.top + r.height / 2) + 'px';
    for (var i = 0; i < n; i++) {
      var d = document.createElement('i'), a = Math.random() * Math.PI * 2, dist = 40 + Math.random() * 90, s = 3 + Math.random() * 7;
      d.style.setProperty('--dx', Math.cos(a) * dist + 'px'); d.style.setProperty('--dy', Math.sin(a) * dist + 'px');
      d.style.width = d.style.height = s + 'px'; d.style.background = color; d.style.animationDelay = (Math.random() * 60) + 'ms';
      host.appendChild(d);
    }
    document.body.appendChild(host);
    setTimeout(function () { host.remove(); }, 900);
  };
  G.floatUp = function (el, text, cls) {
    if (!el) return;
    var r = el.getBoundingClientRect(), f = document.createElement('div');
    f.className = 'floatup ' + (cls || ''); f.textContent = text;
    f.style.left = (r.left + r.width / 2) + 'px'; f.style.top = (r.top + 10) + 'px';
    document.body.appendChild(f); setTimeout(function () { f.remove(); }, 1300);
  };
  G.confetti = function (colors, n) {
    if (G.reducedMotion()) return;
    var host = document.createElement('div'); host.className = 'chakrarain';
    colors = colors || ['#ffd76b', '#ff8f4d', '#f2ede4'];
    for (var i = 0; i < (n || 40); i++) {
      var d = document.createElement('i'); d.style.left = Math.random() * 100 + '%'; d.style.background = colors[i % colors.length];
      d.style.animationDelay = (Math.random() * 1.2) + 's'; d.style.animationDuration = (1.8 + Math.random() * 1.6) + 's';
      d.style.setProperty('--sx', (Math.random() * 80 - 40) + 'px'); host.appendChild(d);
    }
    document.body.appendChild(host); setTimeout(function () { host.remove(); }, 3600);
  };
  /* ---------- the photo satchel: step images live in IndexedDB, never in the save ---------- */
  var mdb = null, mURLs = {};
  function mediaDB() {
    return new Promise(function (res, rej) {
      if (mdb) return res(mdb);
      var rq = indexedDB.open('HOKAGE_MEDIA', 1);
      rq.onupgradeneeded = function () { rq.result.createObjectStore('img'); };
      rq.onsuccess = function () { mdb = rq.result; res(mdb); };
      rq.onerror = function () { rej(rq.error); };
    });
  }
  G.mediaPut = function (id, blob) {
    return mediaDB().then(function (db) {
      return new Promise(function (res, rej) {
        var tx = db.transaction('img', 'readwrite'); tx.objectStore('img').put(blob, id);
        tx.oncomplete = function () { delete mURLs[id]; res(id); }; tx.onerror = function () { rej(tx.error); };
      });
    });
  };
  G.mediaGet = function (id) {
    return mediaDB().then(function (db) {
      return new Promise(function (res) {
        var rq = db.transaction('img').objectStore('img').get(id);
        rq.onsuccess = function () { res(rq.result || null); }; rq.onerror = function () { res(null); };
      });
    });
  };
  G.mediaDel = function (id) {
    return mediaDB().then(function (db) {
      return new Promise(function (res) {
        var tx = db.transaction('img', 'readwrite'); tx.objectStore('img').delete(id);
        tx.oncomplete = function () { if (mURLs[id]) { URL.revokeObjectURL(mURLs[id]); delete mURLs[id]; } res(); }; tx.onerror = function () { res(); };
      });
    });
  };
  G.mediaURL = function (id) {
    if (mURLs[id]) return Promise.resolve(mURLs[id]);
    return G.mediaGet(id).then(function (bl) { if (!bl) return null; mURLs[id] = URL.createObjectURL(bl); return mURLs[id]; });
  };
  /* shrink a chosen image to a sane size before storing (max 1280px, jpeg .82) */
  G.mediaIngest = function (file) {
    return new Promise(function (res, rej) {
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var mx = 1280, w = img.width, h = img.height;
        if (Math.max(w, h) > mx) { var k = mx / Math.max(w, h); w = Math.round(w * k); h = Math.round(h * k); }
        var c = document.createElement('canvas'); c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        c.toBlob(function (bl) { bl ? res(bl) : rej(new Error('no blob')); }, 'image/jpeg', 0.82);
      };
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error('bad image')); };
      img.src = url;
    });
  };
})(window.HOKAGE = window.HOKAGE || {});
