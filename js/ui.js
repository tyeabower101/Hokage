/* HOKAGE — ui: the shell, the ceremony, the village. */
(function (G) {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  G.$ = $; G.$$ = $$;
  var view, navEl;
  G.timer = null;

  /* ================= primitives ================= */
  G.toast = function (msg, kind) {
    var t = document.createElement('div'); t.className = 'toast' + (kind ? ' ' + kind : ''); t.innerHTML = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('in'); });
    setTimeout(function () { t.classList.remove('in'); setTimeout(function () { t.remove(); }, 300); }, kind === 'long' ? 4200 : 2300);
  };
  G.sheet = function (html, opts) {
    opts = opts || {};
    var el = document.createElement('div'); el.className = 'shwrap' + (opts.cls ? ' ' + opts.cls : '');
    el.innerHTML = '<div class="sheet" role="dialog">' + (opts.noClose ? '' : '<button class="sheet-x" aria-label="Close">✕</button>') + html + '</div>';
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('in'); });
    var closed = false;
    function close(cb) { if (closed) return; closed = true; el.classList.remove('in'); setTimeout(function () { el.remove(); if (cb) cb(); }, 240); }
    el.addEventListener('click', function (e) { if (e.target === el && !opts.noClose) close(); });
    var x = $('.sheet-x', el); if (x) x.addEventListener('click', function () { close(); });
    return { body: el.firstChild, close: close, el: el };
  };
  G.confirm = function (title, sub, yes, no, danger) {
    return new Promise(function (resolve) {
      var s = G.sheet('<div class="sh-h"><b>' + title + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</div>' +
        '<div class="row2"><button class="btn ghost" id="cN">' + (no || 'Keep it') + '</button><button class="btn' + (danger ? ' danger' : '') + '" id="cY">' + (yes || 'Do it') + '</button></div>');
      $('#cN', s.body).addEventListener('click', function () { s.close(function () { resolve(false); }); });
      $('#cY', s.body).addEventListener('click', function () { s.close(function () { resolve(true); }); });
    });
  };
  G.embers = function (n) { var out = '<div class="embers" aria-hidden="true">'; for (var i = 0; i < (n || 12); i++) out += '<i></i>'; return out + '</div>'; };
  G.clanEmblem = function (id, cls) { return '<svg viewBox="0 0 24 24" class="cemb ' + (cls || '') + '">' + (G.CLAN_EMBLEMS[id] || G.CLAN_EMBLEMS.uzumaki) + '</svg>'; };
  G.rankPill = function (r) { return '<span class="mrank r-' + r + '"><b class="brush">' + G.MISSION_KANJI[r] + '</b>' + r + '</span>'; };

  /* the forehead protector — the crest is a real headband now */
  G.crest = function (size) {
    var st = G.state, v = G.VILLAGES[st.village] || { kanji: '忍' };
    var i = st.rankIdx, metal = i >= 5 ? '#ffd76b' : i >= 3 ? '#c8d0dc' : '#b0793d';
    var hb = G.cosmetic('headband'); var cloth = hb ? hb.val : '#141826';
    var hat = i >= 3 ? '<g class="cr-hat"><path d="M40 2L62 22H18Z" fill="#c0392f" stroke="#f2eada" stroke-width="1.6"/><path d="M34 22L40 8 46 22Z" fill="#f2eada"/><rect x="15" y="21.2" width="50" height="3" rx="1.5" fill="#f2eada"/><circle cx="40" cy="2.4" r="2.4" fill="#d6b26a"/></g>' : '';
    var scratch = st.akatsuki ? '<path d="M18 34L62 50" stroke="#f2eada" stroke-width="2.4" stroke-linecap="round" opacity=".92"/>' : '';
    var mask = st.cosmetics.mask ? '<g class="cr-mask" transform="translate(22 -2) scale(.45)">' + G.maskSVG(st.cosmetics.mask, 0).replace(/<svg[^>]*>|<\/svg>/g, '') + '</g>' : '';
    var kyubi = (st.summons && st.summons.owned.indexOf('kyubi') >= 0) ? '<ellipse cx="40" cy="42" rx="40" ry="22" fill="none" stroke="#ff7a2f" stroke-width="2" opacity=".7" class="cr-kyubi"/>' : '';
    var sage = G.sageMode() ? '<ellipse cx="40" cy="42" rx="39" ry="20" fill="none" stroke="#ff9a3d" stroke-width="1.2" opacity=".6" class="cr-sage"/>' : '';
    return '<svg viewBox="0 0 80 64" class="crest" style="width:' + size + 'px" aria-label="crest">' + sage + kyubi +
      (i >= 5 ? '<rect x="1.5" y="25.5" width="77" height="33" rx="9" fill="none" stroke="' + metal + '" stroke-width="1" opacity=".4"/>' : '') +
      '<path d="M0 33 Q6 28 14 28 H66 Q74 28 80 33 V52 Q74 57 66 57 H14 Q6 57 0 52 Z" fill="' + cloth + '" stroke="rgba(0,0,0,.4)" stroke-width="1"/>' +
      '<path d="M0 33 Q6 28 14 28 H66 Q74 28 80 33" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="1"/>' +
      '<rect x="18" y="24" width="44" height="36" rx="7" fill="rgba(0,0,0,.45)" stroke="' + metal + '" stroke-width="2.6"/>' +
      '<rect x="21" y="27" width="38" height="30" rx="5" fill="none" stroke="' + metal + '" stroke-width=".6" opacity=".5"/>' +
      '<text x="40" y="52" text-anchor="middle" font-size="26" fill="#f2eada" class="brush">' + v.kanji + '</text>' + scratch + hat + mask + '</svg>';
  };

  /* the living village */
  /* ---------- twelve villages, twelve skylines: each gets its own landmarks, not a tint ---------- */
  G.villageLandmarks = function (vid, v) {
    var g = v.glow, a = v.acc;
    switch (vid) {
      case 'konoha': return '<path class="vs-cliff" d="M0 150L0 86Q10 70 34 72Q52 60 72 70Q92 58 112 72Q128 66 140 82L146 150Z" fill="rgba(5,7,14,.7)"/>' +
        '<g fill="none" stroke="rgba(255,255,255,.08)" stroke-width="1.2" stroke-linecap="round"><path d="M22 96q8-14 18 0M54 92q8-14 18 0M87 94q8-14 18 0M118 100q7-12 16 0"/><path d="M31 102v8M63 98v8M96 100v8M126 106v6"/></g>' +
        '<g fill="rgba(4,6,12,.9)"><rect x="236" y="134" width="30" height="24"/><path d="M224 136 251 122 278 136Z"/><rect x="240" y="116" width="22" height="12"/><path d="M230 118 251 106 272 118Z"/><rect x="244" y="100" width="14" height="10"/><path d="M238 102 251 92 264 102Z"/><rect x="250" y="84" width="2" height="10"/></g>' +
        '<g fill="#5b1812"><rect x="318" y="136" width="40" height="3.6" rx="1"/><rect x="322" y="143" width="32" height="2.6"/><rect x="326" y="140" width="3.4" height="20"/><rect x="346" y="140" width="3.4" height="20"/></g>';
      case 'suna': return '<path d="M0 150V70L26 66 34 150Z" fill="rgba(6,5,10,.78)"/><path d="M400 150V64L372 60 362 150Z" fill="rgba(6,5,10,.78)"/>' +
        '<path d="M0 96h30M370 90h30" stroke="rgba(255,255,255,.06)" stroke-width="2"/>' +
        '<g fill="rgba(5,6,12,.88)"><ellipse cx="120" cy="152" rx="34" ry="22"/><ellipse cx="190" cy="156" rx="26" ry="17"/><ellipse cx="255" cy="152" rx="38" ry="24"/><ellipse cx="318" cy="157" rx="24" ry="15"/></g>' +
        '<g fill="' + g + '" opacity=".5"><rect x="116" y="142" width="4" height="7" rx="2"/><rect x="250" y="140" width="4" height="8" rx="2"/><rect x="187" y="149" width="3.4" height="6" rx="1.7"/></g>' +
        '<path d="M40 168q40-8 80 0M290 170q36-7 70 0" stroke="rgba(255,255,255,.05)" stroke-width="2" fill="none"/>';
      case 'kiri': return '<rect x="0" y="128" width="400" height="62" fill="rgba(10,16,26,.65)"/>' +
        '<g fill="#22303f"><rect x="150" y="96" width="9" height="46"/><rect x="240" y="96" width="9" height="46"/><rect x="138" y="92" width="124" height="7" rx="3"/><rect x="150" y="104" width="100" height="4.6"/></g>' +
        '<path d="M154 146q46 8 92 0" stroke="rgba(255,255,255,.08)" stroke-width="2" fill="none"/>' +
        '<g fill="rgba(4,6,12,.85)"><path d="M30 128l14-26 14 26Z"/><path d="M52 128l10-18 10 18Z"/><path d="M330 128l12-22 12 22Z"/></g>' +
        '<path d="M60 156l26-4 4 6-28 3Z" fill="rgba(4,6,12,.9)"/>' +
        '<g class="vs-mist"><rect x="-40" y="112" width="220" height="9" rx="4.5" fill="#dfe8ee" opacity=".10"/><rect x="180" y="132" width="260" height="10" rx="5" fill="#dfe8ee" opacity=".12"/><rect x="-20" y="148" width="300" height="8" rx="4" fill="#dfe8ee" opacity=".08"/></g>';
      case 'kumo': return '<path d="M0 190V120L34 58 66 112 96 70 128 126 150 96 176 190Z" fill="rgba(6,7,14,.8)"/>' +
        '<path d="M400 190V112L366 54 338 108 312 66 284 122 262 98 240 190Z" fill="rgba(6,7,14,.8)"/>' +
        '<g fill="rgba(3,4,9,.95)"><rect x="28" y="52" width="12" height="10" rx="2"/><rect x="360" y="48" width="12" height="10" rx="2"/><rect x="90" y="64" width="11" height="9" rx="2"/></g>' +
        '<g fill="' + g + '" opacity=".55"><rect x="31" y="55" width="2.6" height="3"/><rect x="363" y="51" width="2.6" height="3"/></g>' +
        '<g class="vs-cloudband"><ellipse cx="110" cy="96" rx="58" ry="8" fill="#e8ecf5" opacity=".10"/><ellipse cx="300" cy="86" rx="64" ry="9" fill="#e8ecf5" opacity=".11"/></g>' +
        '<path class="vs-bolt" d="M206 40l-10 26h8l-12 30 24-34h-9l11-22Z" fill="' + g + '" opacity=".5"/>';
      case 'iwa': return '<g fill="rgba(6,6,11,.82)"><path d="M20 190V96q14-10 26 0v94Z"/><path d="M64 190V116q12-9 24 0v74Z"/><path d="M330 190V88q16-11 30 0v102Z"/><path d="M292 190V128q10-8 22 0v62Z"/></g>' +
        '<g fill="rgba(4,5,10,.92)"><path d="M150 190V110l30-26 34 24v82Z"/><rect x="166" y="124" width="10" height="8" rx="1"/><rect x="188" y="118" width="10" height="8" rx="1"/><rect x="176" y="146" width="12" height="10" rx="1"/></g>' +
        '<g fill="' + g + '" opacity=".45"><rect x="168" y="126" width="6" height="4"/><rect x="190" y="120" width="6" height="4"/></g>' +
        '<path d="M20 96h26M64 116h24M330 88h30" stroke="rgba(255,255,255,.07)" stroke-width="1.6"/>';
      case 'ame': return '<g fill="rgba(5,7,13,.9)"><rect x="60" y="70" width="16" height="120"/><rect x="100" y="96" width="12" height="94"/><rect x="290" y="60" width="18" height="130"/><rect x="330" y="100" width="12" height="90"/><rect x="180" y="84" width="14" height="106"/></g>' +
        '<g stroke="rgba(255,255,255,.10)" stroke-width="1.4"><path d="M60 82h16M60 96h16M290 74h18M290 90h18M180 98h14"/></g>' +
        '<g fill="' + g + '" opacity=".4"><rect x="64" y="88" width="3" height="4"/><rect x="296" y="80" width="3" height="4"/><rect x="184" y="104" width="3" height="4"/></g>' +
        '<g class="vs-rain" stroke="#9fb6c9" stroke-width="1" opacity=".28"><path d="M40 30l-6 22M120 20l-6 22M210 34l-6 22M260 16l-6 22M350 30l-6 22M160 50l-5 18M310 54l-5 18"/></g>';
      case 'taki': return '<path d="M0 190V64L52 54 84 70 96 190Z" fill="rgba(5,7,12,.82)"/>' +
        '<path class="vs-fall" d="M52 62q6 60 2 128h26q2-70-4-128Z" fill="#cfe6da" opacity=".22"/>' +
        '<path d="M46 186q22 8 44 0" stroke="#cfe6da" stroke-width="3" opacity=".25" fill="none"/>' +
        '<g fill="rgba(4,6,10,.9)"><rect x="248" y="112" width="7" height="52"/><path d="M212 118q40-44 80 0q-18-14-40-12q-22-2-40 12Z"/></g>' +
        '<g fill="rgba(4,6,10,.9)"><rect x="322" y="132" width="5" height="34"/><path d="M300 138q24-30 48 0q-12-10-24-9q-12-1-24 9Z"/></g>';
      case 'kusa': return '<path d="M0 190V150q60-26 120-8q70 20 140-6q80-26 140 10V190Z" fill="rgba(6,9,8,.85)"/>' +
        '<g stroke="rgba(190,220,150,.35)" stroke-width="1.6" fill="none" stroke-linecap="round" class="vs-grass"><path d="M60 156q-2-14 4-22M70 158q0-12 8-18M250 148q-3-12 2-20M262 150q1-12 9-16M340 158q-2-12 4-18M120 152q-1-10 5-16"/></g>' +
        '<g fill="rgba(4,6,8,.9)"><rect x="176" y="128" width="34" height="22"/><path d="M168 130 193 112 218 130Z"/></g>' +
        '<circle cx="193" cy="136" r="3" fill="' + g + '" opacity=".5"/>';
      case 'oto': return '<g fill="rgba(5,4,10,.9)"><rect x="90" y="92" width="20" height="98"/><path d="M86 92h28l-14-18Z"/><rect x="270" y="80" width="24" height="110"/><path d="M266 80h32l-16-20Z"/><rect x="180" y="120" width="16" height="70"/></g>' +
        '<g fill="none" stroke="' + g + '" stroke-width="1.5" opacity=".4" class="vs-wave"><path d="M120 70q10-8 20 0t20 0"/><path d="M304 60q10-8 20 0t20 0"/><path d="M196 104q8-7 16 0"/></g>' +
        '<g fill="' + g + '" opacity=".4"><rect x="96" y="104" width="4" height="5"/><rect x="278" y="94" width="4" height="5"/></g>';
      case 'yu': return '<g fill="rgba(6,5,8,.88)"><rect x="140" y="118" width="120" height="48"/><path d="M128 122 200 92 272 122Z"/><rect x="150" y="132" width="14" height="12" rx="2"/><rect x="236" y="132" width="14" height="12" rx="2"/><rect x="190" y="138" width="20" height="28"/></g>' +
        '<g fill="' + g + '" opacity=".45"><rect x="152" y="134" width="10" height="8" rx="1"/><rect x="238" y="134" width="10" height="8" rx="1"/></g>' +
        '<ellipse cx="320" cy="168" rx="42" ry="9" fill="rgba(120,160,180,.18)"/>' +
        '<g class="vs-steam" stroke="rgba(255,255,255,.16)" stroke-width="2.4" fill="none" stroke-linecap="round"><path d="M306 154q6-10-2-20q-6-8 2-16"/><path d="M326 156q6-10-2-20q-6-8 2-16"/><path d="M200 84q5-9-2-17q-5-7 2-14"/></g>';
      case 'shimo': return '<g fill="rgba(9,11,20,.85)"><path d="M40 190V96l22-34 22 34v94Z"/><path d="M120 190V120l16-26 16 26v70Z"/><path d="M300 190V102l24-38 24 38v88Z"/></g>' +
        '<g fill="#cfd8ea" opacity=".22"><path d="M52 78l10-16 10 16-10 8Z"/><path d="M314 70l10-16 10 16-10 8Z"/></g>' +
        '<path class="vs-aurora" d="M0 44q100-26 200-8t200-6" stroke="' + g + '" stroke-width="10" fill="none" opacity=".12"/>' +
        '<path class="vs-aurora2" d="M0 60q110-22 210-6t190-10" stroke="#8ff0c8" stroke-width="6" fill="none" opacity=".10"/>';
      case 'hoshi': return '<ellipse cx="200" cy="172" rx="120" ry="20" fill="rgba(5,6,14,.8)"/><ellipse cx="200" cy="166" rx="86" ry="13" fill="rgba(10,12,26,.9)"/>' +
        '<g fill="rgba(5,6,14,.92)"><rect x="264" y="118" width="34" height="30" rx="4"/><path d="M262 122a20 20 0 0 1 38 0Z"/><rect x="276" y="102" width="4" height="14" transform="rotate(28 278 109)"/></g>' +
        '<circle cx="200" cy="160" r="5" fill="' + g + '" opacity=".7" class="vs-lamp"/>' +
        '<path class="vs-shoot" d="M60 34l34 18" stroke="#fff" stroke-width="1.6" opacity=".5"/><circle cx="94" cy="52" r="1.8" fill="#fff" opacity=".8"/>';
    }
    return '';
  };
  G.villageScene = function (vidOpt) {
    var st = G.state, vid = vidOpt || st.village || 'konoha', v = G.VILLAGES[vid] || G.VILLAGES.konoha;
    var d = G.clock(), h = d.getHours() + d.getMinutes() / 60;
    var night = h < 5.5 || h >= 20, dusk = !night && (h < 7.5 || h >= 17.5);
    var day = !night && !dusk;
    /* sun or moon crosses from left (6h) to right (20h); moon from 20h to 6h */
    var t = night ? ((h + 4) % 24) / 10 : (h - 6) / 14;
    t = Math.min(1, Math.max(0, t));
    var cx = 40 + t * 320, cy = 120 - Math.sin(t * Math.PI) * 88;
    var seed = 7; function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    var stars = ''; if (night || dusk) for (var i = 0; i < 40; i++) stars += '<circle cx="' + (rnd() * 400).toFixed(1) + '" cy="' + (rnd() * 110).toFixed(1) + '" r="' + (0.4 + rnd() * 1.1).toFixed(2) + '" fill="#fff" opacity="' + (night ? 0.35 + rnd() * 0.5 : 0.15 + rnd() * 0.2).toFixed(2) + '"/>';
    var lanterns = ''; if (night || dusk) [[58, 164], [96, 168], [150, 160], [222, 166], [262, 158], [318, 164], [356, 168]].forEach(function (p) { lanterns += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2.2" fill="' + v.glow + '" class="vs-lamp"/><circle cx="' + p[0] + '" cy="' + p[1] + '" r="7" fill="' + v.glow + '" opacity=".18"/>'; });
    var mood = night ? 'night' : dusk ? 'dusk' : 'day';
    return '<svg viewBox="0 0 400 190" preserveAspectRatio="xMidYMax slice" class="vscene vs-' + mood + '" aria-hidden="true">' +
      '<defs><linearGradient id="vsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + v.sky[0] + '"/><stop offset="1" stop-color="' + v.sky[1] + '"/></linearGradient>' +
      '<radialGradient id="vsun"><stop offset="0" stop-color="' + (night ? '#e8ecf5' : v.glow) + '"/><stop offset=".55" stop-color="' + (night ? '#cfd8ea' : v.acc) + '" stop-opacity=".9"/><stop offset="1" stop-color="' + v.acc + '" stop-opacity="0"/></radialGradient></defs>' +
      '<rect width="400" height="190" fill="url(#vsky)"/>' + stars +
      '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + (night ? 40 : 64) + '" fill="url(#vsun)" opacity="' + (night ? 0.55 : day ? 0.75 : 0.95) + '" class="vs-orb"/>' +
      '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + (night ? 12 : 16) + '" fill="' + (night ? '#eef1f8' : '#fff3dc') + '" opacity=".95"/>' +
      '<g class="vs-cloud"><ellipse cx="90" cy="52" rx="48" ry="7" fill="#fff" opacity=".07"/><ellipse cx="300" cy="38" rx="36" ry="6" fill="#fff" opacity=".06"/></g>' +
      '<path class="vs-far" d="M0 132L30 112 62 124 96 96 128 118 156 104 190 122 226 92 258 116 292 100 326 120 360 104 400 126V190H0Z" fill="rgba(6,8,16,.42)"/>' +
      G.villageLandmarks(vid, v) +
      /* rooftops */
      '<path class="vs-town" d="M0 190V158L18 148 40 158 58 146 82 160 104 150 124 162 146 154 168 164 192 150 212 162 234 156 258 166 282 152 306 164 330 156 352 166 378 150 400 160V190Z" fill="rgba(3,4,9,.96)"/>' +
      lanterns + '</svg>';
  };

  /* chakra orb — today’s work as a ring, the level in the middle */
  G.chakraOrb = function (size) {
    var tp = G.todayProgress(), lp = G.levelProgress();
    var R = 46, C = 2 * Math.PI * R;
    var nat = (G.VILLAGES[G.state.village] || {}).nature || 'fire';
    return '<div class="orb el-' + nat + '" style="--s:' + size + 'px"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="' + R + '" class="orb-bg"/>' +
      '<circle cx="60" cy="60" r="' + R + '" class="orb-lvl" stroke-dasharray="' + C + '" stroke-dashoffset="' + (C * (1 - lp.pct)).toFixed(1) + '"/>' +
      '<circle cx="60" cy="60" r="38" class="orb-day" stroke-dasharray="' + (2 * Math.PI * 38).toFixed(1) + '" stroke-dashoffset="' + (2 * Math.PI * 38 * (1 - tp.pct)).toFixed(1) + '"/></svg>' +
      '<div class="orb-liq" style="--f:' + Math.round(lp.pct * 100) + '%"><i></i></div><div class="orb-in"><small>LV</small><b>' + lp.lvl + '</b></div></div>';
  };

  /* ================= navigation ================= */
  var VIEWS = {}; G._views = VIEWS;
  var CHROME = ['home', 'scrolls', 'cal', 'pouch', 'card'];
  G.go = function (name, arg) {
    if (G.timer) { clearInterval(G.timer); G.timer = null; }
    G.$$('.chakrarain,.inkburst,.floatup,.tierflash').forEach(function (x) { x.remove(); });
    try { (VIEWS[name] || VIEWS.home)(arg); } catch (e) { if (G.onError) G.onError(e); if (name !== 'home') return G.go('home'); }
    var chrome = CHROME.indexOf(name) >= 0;
    navEl.style.display = chrome ? '' : 'none';
    document.body.setAttribute('data-view', name);
    $$('button', navEl).forEach(function (b) { b.classList.toggle('on', b.dataset.v === name); });
    if (view) view.scrollTop = 0; window.scrollTo(0, 0);
  };
  G.render = function (html) { view.innerHTML = '<div class="vin">' + html + '</div>'; };
  var render = G.render;

  /* ================= intro + enroll ================= */
  VIEWS.intro = function () {
    render('<div class="intro">' + G.embers(16) + '<div class="intro-sun"></div><div class="intro-k brush">火</div><h1 class="intro-t">HOKAGE</h1>' +
      '<p class="intro-s">The way is showing up.<br>Choose a village. Take a name.<br>Seal one day at a time.</p>' +
      '<button class="btn wide" id="beginB">Enter the village</button>' +
      '<small class="ver">' + G.VERSION + '</small></div>');
    $('#beginB').addEventListener('click', function () { G.fxUnlock(); G.sfx('whoosh'); G.go('enroll'); });
  };
  VIEWS.enroll = function () {
    var grid = Object.keys(G.VILLAGES).map(function (vid) {
      var v = G.VILLAGES[vid];
      return '<button class="vg" data-v="' + vid + '" style="--va:' + v.acc + '">' +
        '<span class="vg-sky">' + G.villageScene(vid) + '</span>' +
        '<span class="vg-nm"><b class="brush">' + v.kanji + '</b><span>' + v.en + '</span><small>' + v.vibe + '</small></span></button>';
    }).join('');
    render('<div class="pad"><h1>入村 <span>Enrollment</span></h1><p class="lead">Where do you swear your oath?</p>' +
      '<div class="vgrid">' + grid + '</div>' +
      '<button class="btn wide ghost" id="fateB">⚄ Let fate decide</button></div>');
    function pick(vid) {
      var v = G.VILLAGES[vid];
      var s = G.sheet('<div class="sh-h"><b class="brush big">' + v.kanji + '</b><b>' + v.en + '</b><small>' + v.name + ' · ' + v.vibe + '</small></div>' +
        '<p class="lead">The register needs your name.</p>' +
        '<input class="inp" id="nmI" maxlength="24" placeholder="Your name" autocomplete="off">' +
        '<p class="lead" style="margin-top:14px">Your nindō — the one line you live by. Optional, but it follows you.</p>' +
        '<input class="inp" id="ndI" maxlength="120" placeholder="e.g. I never go back on my word" autocomplete="off">' +
        '<button class="btn wide" id="nmGo">Swear the oath</button>');
      $('#nmGo', s.body).addEventListener('click', function () {
        var nm = $('#nmI', s.body).value.trim() || 'Shinobi', nd = $('#ndI', s.body).value.trim();
        G.fxUnlock(); G.enroll(vid, nm, nd); G.sfx('whoosh');
        s.close(function () { nameForge(); });
      });
    }
    $$('.vg').forEach(function (el) { el.addEventListener('click', function () { G.buzz(8); pick(el.dataset.v); }); });
    $('#fateB').addEventListener('click', function () { var ids = Object.keys(G.VILLAGES); pick(ids[Math.floor(Math.random() * ids.length)]); });
  };
  function nameForge() {
    var st = G.state, nm = st.sName;
    render('<div class="cer">' + G.embers(16) + '<div class="cer-flash"></div>' +
      '<p class="cer-pre cs1">THE FORGE STRIKES YOUR NAME</p>' +
      '<div class="cer-k brush cs2">' + G.esc(nm.k) + '</div>' +
      '<p class="cer-rn cs3">' + G.esc(nm.r) + '</p>' +
      '<p class="cer-mn cs3">\u300c ' + G.esc(nm.m) + ' \u300d</p>' +
      '<p class="cer-oath cs4">' + G.esc(st.name) + ' \u2014 this name is yours now</p>' +
      '<button class="btn wide cs5" id="nfGo">The blood remembers \u203a</button></div>');
    setTimeout(function () { G.sfx('stamp'); G.buzz([30, 40, 60]); }, 520);
    $('#nfGo').addEventListener('click', function () { clanReel(); });
  }
  function clanReel() { G.clanReel({ onDone: ceremony }); }
  function ceremony() {
    var st = G.state, v = G.VILLAGES[st.village], nm = st.sName;
    render('<div class="cer">' + G.embers(16) + '<div class="cer-flash"></div>' +
      '<p class="cer-pre cs1">THE LINE IS NAMED</p>' +
      '<div class="cer-clanrow lone cs2 t-' + st.clan.tier + '">' + G.clanEmblem(st.clan.id, 'big t-' + st.clan.tier) +
      '<span><b>Clan ' + G.esc(st.clan.name) + '</b><span class="tierb t-' + st.clan.tier + '">' + st.clan.tier + '</span>' +
      '<small>' + G.esc(st.clan.perk) + '</small></span></div>' +
      '<div class="cer-k brush sm cs3">' + G.esc(nm.k) + '</div>' +
      '<p class="cer-mn cs3">\u300c ' + G.esc(nm.m) + ' \u300d</p>' +
      '<p class="cer-oath cs4">' + G.esc(st.name) + ' \u00b7 sworn to ' + v.kanji + ' ' + v.en + '</p>' +
      '<button class="btn wide cs5" id="cerGo">Meet your sensei \u203a</button></div>');
    $('#cerGo').addEventListener('click', function () { senseiPick(); });
  }
  function senseiPick(back) {
    var cards = G.SENSEI.map(function (s) {
      return '<button class="sen" data-id="' + s.id + '" style="--sa:' + s.acc + '"><span class="sen-k brush">' + s.kanji + '</span>' +
        '<span class="sen-b"><b>' + s.name + '</b><small>' + s.title + '</small><em>' + s.perk + '</em></span></button>';
    }).join('');
    render('<div class="pad"><p class="cer-pre cs1">THE ACADEMY ASSIGNS A SENSEI</p><h1>師 <span>Your sensei</span></h1>' +
      '<p class="lead">One voice you will hear every morning. Each teaches a different way — and each carries a real perk.</p>' +
      '<div class="sengrid">' + cards + '</div></div>');
    $$('.sen').forEach(function (el) {
      el.addEventListener('click', function () {
        var s = G.SENSEI.filter(function (x) { return x.id === el.dataset.id; })[0];
        var sh = G.sheet('<div class="sh-h"><b class="brush big" style="color:' + s.acc + '">' + s.kanji + '</b><b>' + s.name + ', ' + s.title + '</b><small>' + s.perk + '</small></div>' +
          '<p class="quote">\u201c' + s.lines[0] + '\u201d</p>' +
          '<button class="btn wide" id="senGo">Train under ' + s.name + '</button>');
        $('#senGo', sh.body).addEventListener('click', function () {
          G.setSensei(s.id); G.sfx('chime');
          sh.close(function () { if (back) G.go(back); else welcome(); });
        });
      });
    });
  }
  G.senseiPick = senseiPick;
  function welcome() {
    var v = G.VILLAGES[G.state.village], L = G.LETTERS[0];
    render('<div class="cer letter">' + G.embers(12) +
      '<p class="cer-pre cs1">A LETTER FROM THE ' + (v.kage || 'KAGE').toUpperCase() + '</p>' +
      '<div class="letter-p cs2"><span class="brush lt-k">' + L.k + '</span><b>' + L.t + '</b><p>' + L.body + '</p><small>— the ' + v.kage + ', ' + v.name + '</small></div>' +
      '<button class="btn wide cs4" id="wGo">Enter ' + v.en + '</button></div>');
    $('#wGo').addEventListener('click', function () { G.sfx('seal'); orientation(0); });
  }

  /* ================= the dawn gate: the first open of each day is a moment ================= */
  G.dawnGate = function (after) {
    var st = G.state, today = G.today();
    if (st.seen.gateDay === today || !st.seen.orient) { after(); return; }
    st.seen.gateDay = today; G.save();
    var v = G.VILLAGES[st.village], streak = G.streak(), lp = G.levelProgress();
    var h = G.clock().getHours(), sealed = G.daySealed(today);
    var word = h < 5 ? 'The village is still dark' : h < 11 ? 'The village wakes' : h < 17 ? 'The village works' : 'The village lights its lanterns';
    var d = G.logicalNow(), dstr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()] + ' · ' + (d.getMonth() + 1) + '/' + d.getDate();
    var sub = sealed ? 'Today is already sealed. Anything more is surplus.'
      : streak > 0 ? 'Chain of ' + streak + '. It survives only if today is sealed.'
      : 'No chain. Today is day one — again. That is allowed.';
    G.hideNav && G.hideNav();
    /* the gate lives on <body>, not inside #view — an animated ancestor would trap a fixed child */
    var host = document.createElement('div'); host.className = 'dgate'; host.id = 'dgate';
    host.innerHTML = (G.villageScene() + G.heroOverlay() + G.embers(10) +
      '<div class="dg-in"><p class="dg-d cs1">' + dstr + '</p><h2 class="dg-w cs2">' + word + '</h2>' +
      '<div class="dg-row cs3"><span><b>' + streak + '</b><small>CHAIN</small></span><span><b>' + lp.lvl + '</b><small>LEVEL</small></span><span><b>' + G.fmtN(st.ryo) + '</b><small>RYŌ</small></span></div>' +
      '<p class="dg-s cs4">' + G.esc(sub) + '</p><small class="dg-tap cs5">tap anywhere</small></div>');
    document.body.appendChild(host);
    G.sfx('seal'); G.buzz([18, 40, 18]);
    var gone = false;
    function leave() { if (gone) return; gone = true; host.classList.add('out'); setTimeout(function () { host.remove(); after(); }, 340); }
    host.addEventListener('click', leave);
    setTimeout(leave, 4200);
  };

  /* ================= the academy orientation: four cards, one minute, skippable ================= */
  var ORIENT = [
    { k: '巻', t: 'Seal your days', b: 'Two base scrolls — Wake Up and Wind Down — are your real routine. Run one, do the steps, then hold the seal. A sealed day joins the chain; the chain is everything.', a: '#ff8f4d' },
    { k: '⚡', t: 'Chakra is forever', b: 'Every step you complete earns chakra. Chakra sets your Level, and levels awaken jutsu — shields for missed days, bonuses for doubles, Rasengan on every 7-chain. Nothing ever drains it.', a: '#7fb8ff' },
    { k: '両', t: 'Ryō buys the look', b: 'Each sealed day is graded D to S and pays ryō. Spend it in the Village Bazaar — weapons, cloaks, seal inks, living summons. The rarest things cannot be bought, only earned.', a: '#ffd76b' },
    { k: '影', t: 'The Climb is the game', b: 'Ranks are earned in trials: the Bell Test, the Forest of Death, Selection, the Summit. All opt-in, all hard, none forgiving. Almost nobody reaches Kage. Begin when you are ready — the village waits.', a: '#c9312b' }
  ];
  function orientation(i) {
    var st = G.state;
    if (st.seen.orient || i >= ORIENT.length) { st.seen.orient = 1; G.save(); G.go('home'); return; }
    var o = ORIENT[i];
    var dots = ORIENT.map(function (_, d) { return '<i class="' + (d === i ? 'on' : '') + '"></i>'; }).join('');
    render('<div class="cer orient" style="--oa:' + o.a + '">' + G.embers(8) +
      '<p class="cer-pre cs1">ACADEMY ORIENTATION · ' + (i + 1) + ' OF ' + ORIENT.length + '</p>' +
      '<div class="or-k brush cs2">' + o.k + '</div>' +
      '<h2 class="cs3">' + o.t + '</h2><p class="or-b cs3">' + o.b + '</p>' +
      '<div class="or-dots cs4">' + dots + '</div>' +
      '<button class="btn wide cs4" id="orGo">' + (i === ORIENT.length - 1 ? 'Enter the village' : 'Next') + '</button>' +
      (i < ORIENT.length - 1 ? '<button class="btn wide ghost cs5" id="orSkip">Skip — I will learn by doing</button>' : '') + '</div>');
    $('#orGo').addEventListener('click', function () { G.sfx('tick'); G.buzz(5); if (i === ORIENT.length - 1) { G.state.seen.orient = 1; G.save(); G.sfx('seal'); G.go('home'); } else orientation(i + 1); });
    var sk = $('#orSkip'); if (sk) sk.addEventListener('click', function () { G.state.seen.orient = 1; G.save(); G.go('home'); });
  }

  /* one-time hints: shown once, then never again */
  G.hint = function (id, msg) { var st = G.state; if (st.seen[id]) return; st.seen[id] = 1; G.save(); G.toast(msg, 'long'); };

  /* ================= home ================= */
  VIEWS.home = function () {
    var st = G.state, v = G.VILLAGES[st.village], ri = G.rankInfo(), streak = G.streak(), lp = G.levelProgress();
    var hour = G.clock().getHours();
    var greet = hour < 4 ? 'The village sleeps' : hour < 11 ? 'Ohayō' : hour < 17 ? 'Konnichiwa' : 'Konbanwa';
    var sage = G.sageMode();
    var nextPid = null;
    ['asageiko', 'fuin'].concat(G.userScrolls()).forEach(function (pid) {
      if (nextPid) return; var e0 = G.entry(pid, G.today(), false);
      if (!(e0 && e0.sealed)) { var p0 = st.protocols[pid]; var amOk = p0.schedule !== 'pm' || hour >= 15; if (p0.schedule === 'am' && hour >= 15) amOk = false; if (amOk || true) nextPid = pid; }
    });
    var rows = ['asageiko', 'fuin'].concat(G.userScrolls()).map(function (pid) {
      var p = st.protocols[pid];
      var e = G.entry(pid, G.today(), false);
      var sealed = e && e.sealed, touched = e && (e.done.length || e.skip.length);
      var tp = (p.movements || []).filter(G.stepToday);
      var prog = e && !sealed ? Math.round(100 * e.done.length / Math.max(1, tp.length)) : 0;
      var state = sealed ? '<span class="mr-st sealed"><span class="brush">' + G.esc(e.sigil || '封') + '</span>' + (e.rank ? G.rankPill(e.rank) : '') + '</span>'
        : touched ? '<span class="mr-st prog"><i style="--p:' + prog + '"></i><small>' + prog + '%</small></span>' : '<span class="mr-go">›</span>';
      var slot = p.movements.some(function (m) { return m.type === 'path'; });
      var hint = sealed ? (e.chakra ? '+' + e.chakra + ' chakra · +' + e.ryo + ' ryō' : 'sealed') : G.esc(p.en || (p.mode === 'seal' ? 'seals the day' : 'mission')) + (slot ? ' · ⛩ path slot' : '');
      return '<button class="mrow' + (sealed ? ' issealed' : '') + (pid === nextPid ? ' next' : '') + '" data-pid="' + pid + '" data-wk="' + G.esc(p.kanji) + '">' +
        '<span class="mr-k brush">' + G.esc(p.kanji) + '</span>' +
        '<span class="mr-b"><b>' + G.esc(p.name) + (pid === nextPid ? ' <i class="nextb">NEXT</i>' : '') + '</b><small>' + hint + '</small></span>' + state + '</button>';
    }).join('');
    var line = G.dailyLine();
    /* the open-day warning: real clock, sharpened after the chosen hour, all through the night */
    var rh = G.clock().getHours();
    var atRisk = !G.daySealed(G.today()) && (rh >= st.prefs.riskHour || rh < G.dayStart());
    var hoursLeft = 0;
    if (atRisk) { var b = G.clock(); var dawn = new Date(b); dawn.setHours(G.dayStart(), 0, 0, 0); if (b.getHours() >= G.dayStart()) dawn.setDate(dawn.getDate() + 1); hoursLeft = Math.max(1, Math.ceil((dawn - b) / 3600e3)); }
    if (atRisk && line) line = { sensei: line.sensei, line: G.URGENT_LINES[G.dow() % G.URGENT_LINES.length] };
    var exHtml = G.climbCardHtml(), ex = G.trialStatus();
    var wk = G.weekKeysDisplay(), wkLabels = (st.prefs.weekStart === 'sun' ? 'SMTWTFS' : 'MTWTFSS'), wkDots = wk.map(function (k, i) {
      var s = G.daySealed(k), sh = st.jutsu.used[k], td = k === G.today(), fut = k > G.today();
      return '<span class="wd' + (s ? ' on' : sh ? ' sh' : fut ? ' fut' : ' miss') + (td ? ' td' : '') + '"><small>' + wkLabels[i] + '</small><i>' + (s ? '封' : sh ? '身' : '') + '</i></span>';
    }).join('');
    var perfect = G.weekKeys().every(G.daySealed);
    var charges = G.hasJutsu('kawarimi') ? '<span class="chg" title="Substitution charges">身 <b>' + st.jutsu.charges + '</b>/' + G.kawarimiMax() + '</span>' : '';
    var mood = G.heroMood(); if (atRisk && !mood) mood = '';
    render('<div class="hero' + (sage ? ' sage' : '') + (st.akatsuki ? ' rogue' : '') + (mood ? ' md-' + mood : '') + (atRisk ? ' atrisk' : '') + '">' + G.villageScene() + G.heroOverlay() + G.embers(8) +
      '<div class="hero-top"><div><h1 class="brush">' + v.kanji + ' <span>' + v.en + '</span></h1>' +
      '<p class="hero-greet">' + greet + ', ' + G.esc(st.name) + ' · ' + (st.akatsuki ? 'Rogue ' : '') + ri.name + (sage ? ' · <em class="sagetag">仙 Sage Mode</em>' : '') + '</p></div>' +
      '<button class="hero-crest" id="crestB" aria-label="Registration">' + G.crest(58) + '</button></div>' +
      '<div class="hero-bar">' + G.chakraOrb(64) +
      '<div class="hb-stats"><div class="hb-lvl"><b>Level ' + lp.lvl + '</b><small>' + G.fmtN(lp.have) + ' / ' + G.fmtN(lp.need) + ' chakra</small><i class="hb-fill"><i style="width:' + Math.round(lp.pct * 100) + '%"></i></i></div>' +
      '<div class="hb-row"><span class="' + (streak >= 30 ? 'fire f3' : streak >= 7 ? 'fire f2' : streak >= 3 ? 'fire' : '') + '"><b>' + streak + '</b> chain' + (streak >= 3 ? ' 火' : '') + '</span><span><b>' + G.fmtN(st.ryo) + '</b> ryō</span><span><b>' + st.sealedDays + '</b> days</span>' + charges + '</div></div></div></div>' +
      '<div class="pad">' +
      (st.run && st.protocols[st.run.pid] ? '<button class="resume" id="resB"><span class="brush">続</span><span><b>A run is still open</b><small>' + G.esc(st.protocols[st.run.pid].name) + ' · ' + ((st.log[st.run.key] && st.log[st.run.key][st.run.pid] || { done: [] }).done.length) + ' steps stamped</small></span><i>›</i></button>' : '') +
      '<small class="lab">今日 TODAY' + (ex ? ' <em>· ' + (ex.arc ? ex.arc.name : ex.def.name) + ' is open</em>' : atRisk ? ' <em class="riskem">· the day is unsealed</em>' : '') + '</small>' + rows +
      exHtml +
      (line ? '<button class="senline' + (atRisk ? ' urgent' : '') + '" id="senB" style="--sa:' + line.sensei.acc + '"><span class="brush">' + line.sensei.kanji + '</span><span><small>' + line.sensei.name + ' says</small><b>\u201c' + line.line + '\u201d</b></span></button>' : '<button class="senline" id="senB"><span class="brush">師</span><span><small>No sensei yet</small><b>Choose one — every morning, a word</b></span></button>') +
      (st.inbox.length ? '<button class="inbox" id="inbB"><span class="brush">' + G.esc(st.inbox[0].k) + '</span><span><b>' + G.esc(st.inbox[0].t) + '</b><small>' + G.esc(st.inbox[0].b.slice(0, 80)) + '…</small></span><i class="inb-n">' + st.inbox.length + '</i></button>' : '') +
      '<small class="lab">週 THIS WEEK' + (perfect ? ' <em class="gold">· S-rank · a perfect week</em>' : '') + '</small><div class="week' + (perfect ? ' perfect' : '') + '">' + wkDots + '</div>' +
      '</div>');
    var rb = $('#resB'); if (rb) rb.addEventListener('click', function () { G.go('run'); });
    $$('.mrow').forEach(function (el) {
      var lp = null, moved = false;
      el.addEventListener('click', function () { if (moved) { moved = false; return; } G.fxUnlock(); G.launch(el.dataset.pid); });
      function press() { lp = setTimeout(function () { moved = true; G.buzz([10, 20, 10]); scrollQuick(el.dataset.pid); }, 480); }
      function release() { clearTimeout(lp); }
      el.addEventListener('touchstart', press, { passive: true }); el.addEventListener('touchend', release);
      el.addEventListener('touchmove', release, { passive: true });
      el.addEventListener('mousedown', press); el.addEventListener('mouseup', release); el.addEventListener('mouseleave', release);
      el.addEventListener('contextmenu', function (e) { e.preventDefault(); moved = true; scrollQuick(el.dataset.pid); });
    });
    $('#crestB').addEventListener('click', function () { G.go('card'); });
    $('#senB').addEventListener('click', function () { G.fxUnlock(); if (!G.state.sensei) senseiPick('home'); else G.go('card', 'sensei'); });
    var cb = $('#climbB'); if (cb) cb.addEventListener('click', function () { G.fxUnlock(); G.trialSheet(); });
    var ib = $('#inbB'); if (ib) ib.addEventListener('click', function () {
      var m = st.inbox[0];
      var s = G.sheet('<div class="sh-h"><b>' + G.esc(m.t) + '</b></div><p class="lead">' + G.esc(m.b) + '</p><button class="btn wide" id="inbOk">Understood</button>');
      $('#inbOk', s.body).addEventListener('click', function () { st.inbox.shift(); G.save(); s.close(function () { G.go('home'); }); });
    });
  };
  /* long-press a scroll: everything you'd otherwise dig for */
  function scrollQuick(pid) {
    var p = G.state.protocols[pid], stt = G.scrollStats(pid), sealed = (G.entry(pid, G.today(), false) || {}).sealed;
    var sh = G.sheet('<div class="sh-h"><b class="brush big">' + G.esc(p.kanji) + '</b><b>' + G.esc(p.name) + '</b><small>' + stt.steps + ' steps · ~' + stt.mins + ' min · ⚡' + stt.chakra + (sealed ? ' · sealed today' : '') + '</small></div>' +
      '<button class="btn wide" id="sqRun">' + (sealed ? 'Run it again' : 'Run it now') + '</button>' +
      '<button class="btn wide ghost" id="sqEdit">Edit in the Forge</button>' +
      '<button class="btn wide ghost" id="sqPrev">Preview the run</button>');
    $('#sqRun', sh.body).addEventListener('click', function () { sh.close(function () { G.launch(pid); }); });
    $('#sqEdit', sh.body).addEventListener('click', function () { sh.close(function () { G.go('forge', pid); }); });
    $('#sqPrev', sh.body).addEventListener('click', function () { sh.close(function () { G.previewSheet(pid); }); });
  }

  /* ================= launch picker ================= */
  G.launch = function (pid) {
    var p = G.state.protocols[pid];
    if (!(p.movements || []).length) { G.toast('The scroll is blank — forge a step first'); G.go('forge', pid); return; }
    var hasSlot = p.movements.some(function (m) { return m.type === 'path'; });
    if (!hasSlot) { G.startRun(pid); G.go('run'); return; }
    var slot = p.schedule === 'am' ? 'am' : p.schedule === 'pm' ? 'pm' : null;
    function prRow(pr, i, opts) {
      opts = opts || {};
      var ms = G.pathMastery(pr[0]), mt = G.masteryTier(ms), lock = G.pathLock(i);
      var grade = opts.released ? 'A' : pr[5] === 'S' ? 'S' : pr[5] ? 'B' : 'C';
      if (lock) return '<div class="lp locked" style="--pa:' + pr[6] + '"><span class="lp-sign lk">' + G.pathSign(i) + '</span>' +
        '<span class="lp-b"><b>' + G.esc(pr[1]) + '</b><small>' + G.esc(lock.why) + '</small></span><span class="lockg brush">鎖</span></div>';
      return '<button class="lp' + (opts.released ? ' released' : '') + '" data-pi="' + i + '"' + (opts.released ? ' data-rel="1"' : '') + ' style="--pa:' + pr[6] + '">' +
        '<span class="lp-sign' + (mt ? ' mt' + mt : '') + '">' + G.pathSign(i) + '</span>' +
        '<span class="lp-b"><b>' + G.esc(pr[1]) + (opts.released ? ' <i class="hard rel">解</i>' : pr[5] === 'S' ? ' <i class="hard six">六道</i>' : pr[5] ? ' <i class="hard">極</i>' : '') + '</b>' +
        '<small>' + (opts.released ? 'the full form · everything the vow was building toward' : G.esc(pr[2])) + ' · ' + G.pathTime(i) + (ms ? ' · 封×' + ms : '') + '</small></span>' + G.rankPill(grade) + '</button>';
    }
    var groups = { C: '', B: '', A: '', S: '' };
    G.PATHS.forEach(function (pr, i) {
      if (slot && pr[3] !== slot && pr[3] !== 'pm2am') return;
      if (slot === 'pm' && pr[3] === 'pm2am' && pr[5] !== 'S') return;
      if (pr[5] === 'S') { if (slot !== 'am') groups.S += prRow(pr, i); return; }
      groups[pr[5] ? 'B' : 'C'] += prRow(pr, i);
      if (pr[5] && G.releasedOpen(i)) groups.A += prRow(pr, i, { released: true });
    });
    var rows = (groups.C ? '<small class="lab tier">丙 C · THE TEN ROADS</small>' + groups.C : '') +
      (groups.B ? '<small class="lab tier">乙 B · 極 THE VOWS</small>' + groups.B : '') +
      (groups.A ? '<small class="lab tier gold">甲 A · 解 RELEASED</small>' + groups.A : '') +
      (groups.S ? '<small class="lab tier six">秀 S · THE SIX PATHS</small>' + groups.S : '');
    var yours = '';
    G.userPaths().forEach(function (up) {
      var u = G.state.protocols[up];
      if (slot && u.schedule !== 'any' && u.schedule !== slot) return;
      if (!(u.movements || []).length) return;
      var lg = u.movements.filter(function (m) { return m.log; })[0];
      var tot = lg ? G.logTotal(lg.name) : 0;
      yours += '<button class="lp own" data-pid="' + up + '">' +
        '<span class="lp-k brush">' + G.esc(u.kanji) + '</span>' +
        '<span class="lp-b"><b>' + G.esc(u.name) + (u.hard ? ' <i class="hard">極</i>' : '') + '</b><small>your path · ' + u.movements.length + ' steps' + (tot ? ' · ' + tot + ' ' + G.esc(lg.log) + ' all time' : '') + '</small></span>' + G.rankPill(u.hard ? 'B' : 'C') + '</button>';
    });
    G.hint('h_path', '⛩ A path rides inside your base scroll — it sets the mission rank and the pay. 極 paths pay double.');
    var s = G.sheet('<div class="sh-h"><b class="brush big">' + G.esc(p.kanji) + '</b><b>' + G.esc(p.name) + '</b><small>Which path rides the ⛩ slot today? The path sets the mission rank.</small></div>' +
      rows + (yours ? '<small class="lab">道 YOUR PATHS</small>' + yours : '') +
      '<button class="lp none" id="lpNone"><span class="lp-b"><b>No path today</b><small>the base alone still counts</small></span>' + G.rankPill('D') + '</button>');
    $$('.lp[data-pi]', s.body).forEach(function (el) {
      el.addEventListener('click', function () { s.close(function () { G.startRun(pid, G.materializePath(+el.dataset.pi, !!el.dataset.rel)); G.go('run'); }); });
    });
    $$('.lp[data-pid]', s.body).forEach(function (el) {
      el.addEventListener('click', function () {
        var u = G.state.protocols[el.dataset.pid];
        s.close(function () { G.startRun(pid, { name: u.name, kanji: u.kanji, hard: !!u.hard, grade: u.hard ? 'B' : 'C', steps: G.deep(u.movements) }); G.go('run'); });
      });
    });
    $('#lpNone', s.body).addEventListener('click', function () { s.close(function () { G.startRun(pid); G.go('run'); }); });
  };

  /* ================= boot ================= */
  G.onError = function (e) { try { console.error(e); } catch (x) {} };
  window.addEventListener('DOMContentLoaded', function () {
    view = $('#view'); navEl = $('#nav'); G.view = view;
    navEl.innerHTML = [['home', '家', 'Village'], ['scrolls', '巻', 'Scrolls'], ['cal', '暦', 'Record'], ['pouch', '具', 'Pouch'], ['card', '証', 'Card']].map(function (n) {
      return '<button data-v="' + n[0] + '" aria-label="' + n[2] + '"><b class="brush">' + n[1] + '</b><span>' + n[2] + '</span></button>';
    }).join('');
    $$('button', navEl).forEach(function (b) { b.addEventListener('click', function () { G.fxUnlock(); G.sfx('tick'); G.buzz(4); G.go(b.dataset.v); }); });
    /* swipe between the five village screens — thumb navigation, no reaching */
    (function () {
      var x0 = 0, y0 = 0, t0 = 0, live = false;
      view.addEventListener('touchstart', function (e) {
        if (e.touches.length !== 1) { live = false; return; }
        var t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; t0 = Date.now();
        live = CHROME.indexOf(document.body.getAttribute('data-view')) >= 0 && !e.target.closest('.fdrag,.paper,.wheel-wrap,input,textarea,.sheet,.shwrap');
      }, { passive: true });
      view.addEventListener('touchend', function (e) {
        if (!live) return; live = false;
        var t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0, dt = Date.now() - t0;
        if (dt > 500 || Math.abs(dx) < 95 || Math.abs(dy) > Math.abs(dx) * 0.45) return;
        var cur = CHROME.indexOf(document.body.getAttribute('data-view'));
        var nxt = G.clamp(cur + (dx < 0 ? 1 : -1), 0, CHROME.length - 1);
        if (nxt === cur) return;
        G.buzz(5); G.sfx('tick');
        view.classList.add(dx < 0 ? 'swl' : 'swr');
        setTimeout(function () { view.classList.remove('swl', 'swr'); G.go(CHROME[nxt]); }, 110);
      }, { passive: true });
    })();
    G.load();
    G.applyTheme(); G.applyTextScale();
    var dawn = G.state.village ? G.dawn() : null;
    /* the gate opens first; anything the night decided is announced after it */
    function afterGate() {
      if (dawn && dawn.climb && dawn.climb.length) G.climbCinematic(dawn, function () { if (dawn.promoted) G._promotion(dawn); else G.go('home'); });
      else G.go('home');
    }
    if (G.state.run) { G.go('run'); }
    else if (G.state.village) G.dawnGate(afterGate);
    else G.go('intro');
    if (dawn && dawn.shielded.length) setTimeout(function () { G.toast('身 Kawarimi took the hit — ' + dawn.shielded.length + ' missed day' + (dawn.shielded.length > 1 ? 's' : '') + ' covered. The chain holds.', 'long'); }, 600);
    G.applyShadow();
    G.on('saveFail', function () { G.toast('Storage is full or blocked — export a backup from Scrolls', 'long'); });
    window.addEventListener('error', function (ev) { G.onError(ev.error || ev.message); });
    if ('serviceWorker' in navigator) {
      try {
        navigator.serviceWorker.register('sw.js').then(function (reg) {
          reg.addEventListener('updatefound', function () {
            var nw = reg.installing; if (!nw) return;
            nw.addEventListener('statechange', function () { if (nw.state === 'installed' && navigator.serviceWorker.controller) G.toast('A new version of the village is ready — reopen the app', 'long'); });
          });
        }).catch(function () {});
      } catch (e) {}
    }
  });
  G.applyTextScale = function () { try { document.body.setAttribute('data-ts', (G.state.prefs || {}).textScale || 'm'); } catch (e) {} };
  G.applyTheme = function () {
    try {
      var v = G.VILLAGES[(G.state || {}).village]; if (!v) return;
      var r = document.documentElement.style;
      r.setProperty('--acc', v.acc); r.setProperty('--glow', v.glow);
      r.setProperty('--sky1', v.sky[0]); r.setProperty('--sky2', v.sky[1]);
      document.body.setAttribute('data-village', G.state.village);
      var c = G.state.clan; document.body.setAttribute('data-clan', c ? c.id : '');
    } catch (e) {}
  };
  G.on('change', function () { if (document.body.getAttribute('data-village') !== G.state.village) G.applyTheme(); });
})(window.HOKAGE = window.HOKAGE || {});
