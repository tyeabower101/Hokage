/* HOKAGE — reel: the Blood Reading. A wheel you throw, that slows, that lies to you once, then tells the truth. */
(function (G) {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var N = 16, SEG = 360 / N, R = 150;
  var TIERC = { legendary: '#ff9a3d', rare: '#d4b068', noble: '#9a8ee0', common: '#6c7588' };
  var LEGEND = { uchiha: 'sharingan', senju: 'wood', uzumaki: 'spiral' };

  function wheelSVG(clans) {
    var segs = '', cx = 170, cy = 170;
    clans.forEach(function (c, i) {
      var a0 = (i - 0.5) * SEG - 90, a1 = (i + 0.5) * SEG - 90, r0 = a0 * Math.PI / 180, r1 = a1 * Math.PI / 180;
      var x0 = cx + R * Math.cos(r0), y0 = cy + R * Math.sin(r0), x1 = cx + R * Math.cos(r1), y1 = cy + R * Math.sin(r1);
      var col = TIERC[c[2]];
      segs += '<g class="wseg ws-' + c[2] + '" data-i="' + i + '"><path d="M' + cx + ' ' + cy + 'L' + x0.toFixed(1) + ' ' + y0.toFixed(1) + 'A' + R + ' ' + R + ' 0 0 1 ' + x1.toFixed(1) + ' ' + y1.toFixed(1) + 'Z" fill="' + col + '" fill-opacity="' + (c[2] === 'legendary' ? .42 : c[2] === 'rare' ? .3 : c[2] === 'noble' ? .2 : .12) + '" stroke="rgba(0,0,0,.55)" stroke-width="1.2"/>' +
        '<g transform="rotate(' + (i * SEG) + ' ' + cx + ' ' + cy + ') translate(' + cx + ' ' + (cy - R + 26) + ') scale(1.15)"><g transform="translate(-12 -12)">' + (G.CLAN_EMBLEMS[c[0]] || '') + '</g></g>' +
        '<text transform="rotate(' + (i * SEG) + ' ' + cx + ' ' + cy + ')" x="' + cx + '" y="' + (cy - R + 64) + '" text-anchor="middle" font-size="7" letter-spacing=".02em" fill="' + (c[2] === 'common' ? '#b8bfcc' : '#f2ede4') + '" opacity=".9">' + (c[1].length > 8 ? c[1].slice(0, 7) + '.' : c[1]).toUpperCase() + '</text></g>';
    });
    var spokes = ''; for (var i = 0; i < N; i++) { var a = (i - 0.5) * SEG - 90, rr = a * Math.PI / 180; spokes += '<line x1="' + cx + '" y1="' + cy + '" x2="' + (cx + R * Math.cos(rr)).toFixed(1) + '" y2="' + (cy + R * Math.sin(rr)).toFixed(1) + '" stroke="rgba(0,0,0,.6)" stroke-width="2"/>'; }
    return '<svg viewBox="0 0 340 340" class="wheel" id="wheelSvg"><defs><radialGradient id="whub"><stop offset="0" stop-color="#2a2117"/><stop offset="1" stop-color="#0a0806"/></radialGradient><radialGradient id="wrim"><stop offset=".86" stop-color="rgba(0,0,0,0)"/><stop offset="1" stop-color="rgba(0,0,0,.75)"/></radialGradient></defs>' +
      '<circle cx="170" cy="170" r="' + (R + 12) + '" fill="#120e0a" stroke="#3b2a18" stroke-width="6"/><circle cx="170" cy="170" r="' + (R + 9) + '" fill="none" stroke="#c9a25c" stroke-width="1" opacity=".5"/>' +
      '<g id="wheelRot" style="transform-origin:170px 170px">' + segs + spokes + '<circle cx="170" cy="170" r="' + R + '" fill="url(#wrim)"/>' +
      '<circle cx="170" cy="170" r="34" fill="url(#whub)" stroke="#c9a25c" stroke-width="2"/><text x="170" y="181" text-anchor="middle" font-size="30" fill="#f2ede4" class="brush">血</text></g>' +
      '<path d="M158 6 L182 6 L170 34 Z" fill="#f2ede4" stroke="#c9312b" stroke-width="2" id="wheelPin" style="transform-origin:170px 20px"/></svg>';
  }

  G.clanReel = function (opts) {
    opts = opts || {};
    var st = G.state, chosen = st.clan, clans = G.CLANS.slice();
    var ti = clans.map(function (c) { return c[0]; }).indexOf(chosen.id); if (ti < 0) ti = 0;
    var chosenClan = clans[ti];
    if (G.hideNav) G.hideNav();
    G.render('<div class="bloodv">' +
      '<div class="bl-p0" id="bl0"><i class="candle"><b></b></i><p class="bl-pre">' + (opts.reroll ? 'THE SHRINE KEEPER DRAWS YOUR BLOOD AGAIN' : 'YOUR BLOOD IS BEING READ') + '</p>' +
      '<p class="bl-sub">' + (opts.reroll ? 'The old line burns. What comes next is yours until you pay again.' : 'The wheel remembers every clan that ever bled into this village.') + '</p>' +
      '<button class="bl-hold" id="blHold"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="54"/></svg><span>HOLD</span></button><small class="bl-hint">hold the seal to open the wheel</small></div>' +
      '<div class="bl-p1" id="bl1" hidden><p class="bl-pre">THE BLOOD REMEMBERS</p><div class="wheel-wrap" id="wheelWrap">' + wheelSVG(clans) + '<div class="wheel-embers"></div></div>' +
      '<p class="bl-sub" id="blSub">flick the wheel — throw it hard</p></div>' +
      '<div class="bl-p3" id="bl3" hidden></div>' + G.embers(14) + '</div>');

    /* ---------- phase 0: hold to begin ---------- */
    var hold = $('#blHold'), holdT = null, holdStart = 0, opened = false;
    function holdTick() {
      var p = Math.min(1, (performance.now() - holdStart) / 1300);
      hold.style.setProperty('--p', p);
      if (p >= 1) { openWheel(); return; }
      holdT = requestAnimationFrame(holdTick);
    }
    function hDown(e) { e.preventDefault(); if (opened) return; holdStart = performance.now(); hold.classList.add('holding'); G.buzz(6); G.sfx('handseal'); holdT = requestAnimationFrame(holdTick); }
    function hUp() { if (opened) return; cancelAnimationFrame(holdT); hold.classList.remove('holding'); hold.style.setProperty('--p', 0); }
    hold.addEventListener('pointerdown', hDown); hold.addEventListener('pointerup', hUp); hold.addEventListener('pointercancel', hUp); hold.addEventListener('pointerleave', hUp);
    hold.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    /* ---------- phase 1: the wheel ---------- */
    var rot = $('#wheelRot'), wrap, svg, angle = 0, spinning = false, lastSeg = 0, ember = null;
    function openWheel() {
      opened = true; cancelAnimationFrame(holdT); G.sfx('whoosh'); G.buzz([20, 30, 50]);
      $('#bl0').classList.add('out');
      setTimeout(function () { $('#bl0').hidden = true; var p1 = $('#bl1'); p1.hidden = false; p1.classList.add('in'); wrap = $('#wheelWrap'); svg = $('#wheelSvg'); bindFlick(); idleNudge(); }, 520);
    }
    function setAngle(a) { angle = a; rot.style.transform = 'rotate(' + a + 'deg)'; }
    function segAt(a) { /* which segment sits under the pin for rotation a */ var k = Math.round(-a / SEG); return ((k % N) + N) % N; }
    var idleT;
    function idleNudge() { idleT = setTimeout(function () { if (!spinning) { var s = $('#blSub'); if (s) s.textContent = 'or tap the hub and fate throws it for you'; } }, 4500); }

    /* flick physics: track angular velocity around the hub */
    function bindFlick() {
      var down = false, samples = [], cx, cy;
      function ang(e) { var r = svg.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; return Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI; }
      var startA = 0, startRot = 0;
      svg.addEventListener('pointerdown', function (e) { if (spinning) return; e.preventDefault(); down = true; samples = []; startA = ang(e); startRot = angle; samples.push({ t: performance.now(), a: startA }); svg.setPointerCapture(e.pointerId); });
      svg.addEventListener('pointermove', function (e) {
        if (!down || spinning) return; var a = ang(e), d = a - startA; if (d > 180) d -= 360; if (d < -180) d += 360;
        setAngle(startRot + d); samples.push({ t: performance.now(), a: a }); if (samples.length > 6) samples.shift();
        var s = segAt(angle); if (s !== lastSeg) { lastSeg = s; G.buzz(2); G.sfx('tick'); }
      });
      function up(e) {
        if (!down) return; down = false;
        var v = 0; if (samples.length >= 2) { var a = samples[0], b = samples[samples.length - 1]; var d = b.a - a.a; if (d > 180) d -= 360; if (d < -180) d += 360; var dt = Math.max(16, b.t - a.t); v = d / dt * 1000; /* deg/s */ }
        var total = Math.abs(angle - startRot);
        if (Math.abs(v) < 120 && total < 8) { /* a tap on the hub: fate throws */ spin(900 + Math.random() * 600); return; }
        if (Math.abs(v) < 160) { var s2 = $('#blSub'); if (s2) s2.textContent = 'harder. throw it like you mean it.'; G.buzz(10); return; }
        spin(Math.min(2200, Math.abs(v)) * (v < 0 ? -1 : 1));
      }
      svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
    }

    /* the spin: decided outcome, honest-looking physics, one lie */
    function spin(v) {
      if (spinning) return; spinning = true; clearTimeout(idleT); G.sfx('whoosh'); G.buzz([10, 20, 30, 40]);
      wrap.classList.add('spinning'); $('#blSub').textContent = 'the line is far…';
      var dir = v < 0 ? -1 : 1; /* wheel follows the hand: positive v = clockwise in screen coords = positive rotate */
      var laps = 4 + Math.round(Math.min(5, Math.abs(v) / 420));
      var target = -ti * SEG; /* rotation that puts segment ti under the pin */
      var cur = angle, base = dir > 0 ? target : target;
      /* pick the final angle ≥ laps away in the spin direction */
      var delta = ((base - cur) % 360 + 360) % 360; if (dir < 0) delta = delta - 360; /* delta now in spin direction */
      var finalA = cur + delta + dir * laps * 360;
      var lie = Math.random() < 0.38; /* the near miss: overshoot by most of a segment, then creep back */
      var over = lie ? dir * SEG * (0.55 + Math.random() * 0.3) : 0;
      var dur = 4300 + laps * 260, t0 = performance.now(), from = cur, to = finalA + over;
      var nearFired = false, slowPhase = false;
      function ease(t) { return 1 - Math.pow(1 - t, 3.4); }
      function frame(now) {
        var t = Math.min(1, (now - t0) / dur), a = from + (to - from) * ease(t); setAngle(a);
        var s = segAt(a); if (s !== lastSeg) { lastSeg = s; tick(t, s); }
        if (t > 0.72 && !slowPhase) { slowPhase = true; wrap.classList.remove('spinning'); wrap.classList.add('slow'); $('#blSub').textContent = 'closer…'; }
        if (t > 0.86 && !nearFired) { nearFired = true; tension(); }
        if (t < 1) requestAnimationFrame(frame); else if (lie) creep(finalA, over); else land();
      }
      requestAnimationFrame(frame);
    }
    function tick(t, s) {
      var hard = t > 0.8; G.buzz(hard ? [8, 10, 14] : 3); if (t > 0.3 || Math.random() < 0.5) G.sfx('wheel');
      var pin = $('#wheelPin'); if (pin) { pin.style.transform = 'rotate(' + (hard ? -14 : -7) + 'deg)'; setTimeout(function () { pin.style.transform = ''; }, hard ? 140 : 70); }
      var seg = $('.wseg[data-i="' + s + '"]', rot); if (seg) { seg.classList.add('hit'); setTimeout(function () { seg.classList.remove('hit'); }, hard ? 420 : 160); }
      if (hard) { var c = clans[s]; wrap.setAttribute('data-near', c[2]); }
    }
    function tension() {
      /* the pin is approaching: light the edges in the color of what is coming */
      var upcoming = clans[segAt(angle)];
      wrap.classList.add('tense'); if (upcoming[2] === 'legendary' || upcoming[2] === 'rare') { wrap.classList.add('tense-gold'); G.buzz([30, 60, 30, 60, 30]); }
      $('#blSub').textContent = upcoming[2] === 'legendary' ? 'no. it couldn’t be…' : 'the line is near…';
    }
    function creep(finalA, over) {
      /* the lie: the wheel stopped a hair past the truth. it sighs back. */
      var from = angle, t0 = performance.now(), dur = 1100; G.buzz(40); $('#blSub').textContent = '…';
      var passing = clans[segAt(from)]; wrap.setAttribute('data-near', passing[2]);
      function f(now) { var t = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - t, 2); setAngle(from + (finalA - from) * e); var s = segAt(angle); if (s !== lastSeg) { lastSeg = s; G.buzz([20, 30, 60]); G.sfx('stamp'); wrap.setAttribute('data-near', clans[s][2]); } if (t < 1) requestAnimationFrame(f); else land(); }
      setTimeout(function () { requestAnimationFrame(f); }, 420);
    }

    /* ---------- phase 3: the reveal ---------- */
    function land() {
      wrap.classList.remove('slow', 'tense', 'tense-gold'); wrap.classList.add('landed', 'ld-' + chosenClan[2]);
      var seg = $('.wseg[data-i="' + ti + '"]', rot); if (seg) seg.classList.add('won');
      G.buzz([20, 30, 80]);
      setTimeout(function () { reveal(); }, chosenClan[2] === 'legendary' ? 700 : 500);
    }
    function reveal() {
      var tier = chosenClan[2], p3 = $('#bl3'), p1 = $('#bl1');
      var card = '<div class="bl-card t-' + tier + '">' + G.clanEmblem(chosenClan[0], 'huge t-' + tier) + '<p class="bl-tier tl-' + tier + '">' + tier.toUpperCase() + ' BLOOD</p><h2 class="brush">Clan ' + G.esc(chosenClan[1]) + '</h2><p class="bl-perk">' + G.esc(chosenClan[3]) + '</p>' +
        (G.CLAN_PERKS[chosenClan[0]] ? '<p class="bl-mech">' + perkText(chosenClan[0]) + '</p>' : '<p class="bl-mech dim">no mechanical perk · the honor is in the name</p>') +
        '<button class="btn wide" id="blGo">' + (opts.reroll ? 'Carry the new line ›' : 'The line is named ›') + '</button></div>';
      function show(extra) { p1.hidden = true; p3.hidden = false; p3.innerHTML = (extra || '') + card; p3.className = 'bl-p3 rv-' + tier + (LEGEND[chosenClan[0]] ? ' lg-' + LEGEND[chosenClan[0]] : ''); $('#blGo').addEventListener('click', function () { if (opts.onDone) opts.onDone(chosenClan); }); }
      if (tier === 'common') { G.sfx('tier_common'); show('<div class="rv-stamp"></div>'); }
      else if (tier === 'noble') { G.sfx('tier_noble'); G.ink(wrap, { n: 24, color: '#9a8ee0' }); G.confetti(['#9a8ee0', '#cfc4f5'], 40); show('<div class="rv-scroll"></div>'); }
      else if (tier === 'rare') {
        G.sfx('tier_rare'); G.buzz([40, 40, 90]);
        var fl = document.createElement('div'); fl.className = 'rv-crack'; document.body.appendChild(fl); setTimeout(function () { fl.remove(); }, 1600);
        setTimeout(function () { show('<div class="rv-seam"></div>'); }, 520);
      } else {
        /* legendary: blackout, three heartbeats, the bloodline takes the screen */
        var bo = document.createElement('div'); bo.className = 'rv-black'; document.body.appendChild(bo);
        var beats = 0, bt = setInterval(function () { beats++; G.buzz([60, 120]); G.sfx('heartbeat'); bo.classList.add('beat'); setTimeout(function () { bo.classList.remove('beat'); }, 260); if (beats >= 3) { clearInterval(bt); takeover(); } }, 760);
        function takeover() {
          bo.className = 'rv-black take lg-' + LEGEND[chosenClan[0]]; bo.innerHTML = legendSVG(chosenClan[0]);
          G.sfx('tier_legend'); G.buzz([30, 40, 30, 40, 200]);
          setTimeout(function () { G.sfx('rank'); G.confetti(['#ffd98c', '#c9312b', '#f2ede4', '#ff9a3d'], 90); show('<div class="rv-banner">LEGENDARY BLOODLINE</div><div class="rv-shock"></div>'); bo.classList.add('fade'); setTimeout(function () { bo.remove(); }, 900); }, 2100);
        }
      }
    }
    function perkText(id) {
      var p = G.CLAN_PERKS[id]; if (!p) return '';
      if (p.chakra) return 'all chakra ×' + p.chakra; if (p.kawarimiMax) return 'three Substitution charges, not two'; if (p.kawarimiEvery) return 'a Substitution charge every 5 days, not 7';
      if (p.ryo) return 'all ryō ×' + p.ryo; if (p.hardChakra) return '極 paths pay ×' + p.hardChakra + ' chakra'; if (p.examEase) return 'every exam needs one fewer day'; if (p.seeAll) return 'the Byakugan sees every hidden step'; return '';
    }
    function legendSVG(id) {
      if (id === 'uchiha') return '<svg viewBox="0 0 200 200" class="lg-svg"><circle cx="100" cy="100" r="92" fill="#a61c1c"/><circle cx="100" cy="100" r="70" fill="none" stroke="#000" stroke-width="3"/><circle cx="100" cy="100" r="14" fill="#000"/><g class="lg-tomoe"><g fill="#000"><path d="M100 38c12 0 18 10 14 20-3 8-14 10-20 4 8 0 12-6 10-12-2-4-6-6-4-12z"/><path transform="rotate(120 100 100)" d="M100 38c12 0 18 10 14 20-3 8-14 10-20 4 8 0 12-6 10-12-2-4-6-6-4-12z"/><path transform="rotate(240 100 100)" d="M100 38c12 0 18 10 14 20-3 8-14 10-20 4 8 0 12-6 10-12-2-4-6-6-4-12z"/></g></g></svg>';
      if (id === 'senju') return '<svg viewBox="0 0 200 200" class="lg-svg"><g class="lg-wood" fill="none" stroke="#7bb36a" stroke-width="7" stroke-linecap="round"><path d="M100 200V120"/><path d="M100 130c-30-10-50-40-60-80"/><path d="M100 125c30-8 55-35 62-85"/><path d="M100 150c-20 0-35-10-45-30"/><path d="M100 145c20 0 38-12 48-34"/><path d="M40 40c10 20 30 30 50 30"/><path d="M160 40c-10 20-30 30-50 30"/></g><circle cx="100" cy="100" r="96" fill="none" stroke="#7bb36a" stroke-width="2" opacity=".5"/></svg>';
      return '<svg viewBox="0 0 200 200" class="lg-svg"><g class="lg-spiral" fill="none" stroke="#ff9a3d" stroke-width="5" stroke-linecap="round"><path d="M100 100c10 0 14 8 10 16-5 10-20 10-28 0-10-14-2-34 14-38 22-6 44 10 44 34 0 30-28 50-56 44-36-8-52-48-36-78 20-36 70-44 100-18"/></g><circle cx="100" cy="100" r="96" fill="none" stroke="#ff9a3d" stroke-width="2" stroke-dasharray="8 6" class="lg-ring"/></svg>';
    }
  };
})(window.HOKAGE = window.HOKAGE || {});
