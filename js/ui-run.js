/* HOKAGE — ui-run: the run, the gate, the finale. */
(function (G) {
  'use strict';
  var $ = G.$, $$ = G.$$, VIEWS = G._views;
  var mem = {};

  var tick = null, lock = null;
  function stopTick() { if (tick) { clearInterval(tick); tick = null; } }
  /* the screen stays lit while a clock runs — a locked phone is where timers used to die */
  function keepAwake(on) {
    if (!('wakeLock' in navigator)) return;
    if (on && !lock) { navigator.wakeLock.request('screen').then(function (l) { lock = l; l.addEventListener('release', function () { lock = null; }); }).catch(function () { lock = null; }); }
    if (!on && lock) { try { lock.release(); } catch (e) {} lock = null; }
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden && document.querySelector('.ring.live')) keepAwake(true); });
  function resync() { if (document.querySelector('.runv')) drawFlow(); }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) resync(); });
  window.addEventListener('focus', resync);
  window.addEventListener('pageshow', resync);

  VIEWS.run = function () {
    var c = G.current();
    if (!c) { G.go('home'); return; }
    if (c.run.idx < 0) c.run.idx = G.nextIdx();
    mem = {};
    var pathTag = c.run.pathName ? '<span class="ptag" style="--pa:' + (c.run.pathAccent || '#d4b068') + '">' + (typeof c.run.pathSignIdx === 'number' ? G.pathSign(c.run.pathSignIdx) : '') + G.esc(c.run.pathName.split(' — ')[0]) + '</span>' : '';
    var rank = G.missionRankOf(c.run.pathKanji ? 1 : null, c.run.pathHard, false);
    G.render('<div class="runv" style="--pa:' + (c.run.pathAccent || 'var(--glow)') + '"><div class="run-top">' +
      '<button class="hb" id="rBack" aria-label="Back">‹</button>' +
      '<div class="run-t"><b>' + G.esc(c.p.kanji) + ' ' + G.esc(c.p.name) + '</b><small>' + pathTag + G.rankPill(rank) + '<span id="rCount"></span><span class="rchk" id="rChk">⚡ <b>0</b></span></small></div>' +
      '<button class="hb danger" id="rX" aria-label="Abandon">✕</button></div>' +
      '<div class="rprog"><i id="rpFill"></i></div>' +
      '<div id="flow"></div></div>');
    $('#rBack').addEventListener('click', function () { stopTick(); keepAwake(false); G.go('home'); });
    $('#rX').addEventListener('click', function () {
      G.confirm('Abandon this run?', 'Stamps stay on the day; the run closes unsealed.', 'Abandon', 'Keep going', true).then(function (y) { if (y) { stopTick(); keepAwake(false); G.abandonRun(); G.go('home'); } });
    });
    drawFlow();
  };
  function drawFlow() {
    var c = G.current(); if (!c) { stopTick(); return; }
    var flow = $('#flow'); if (!flow) { stopTick(); return; }
    var pset = {}; (c.run.pathSteps || []).forEach(function (m) { pset[m.id] = 1; });
    var firstP = -1, lastP = -1;
    c.mv.forEach(function (m, i) { if (pset[m.id]) { if (firstP < 0) firstP = i; lastP = i; } });
    var secBefore = {};
    (function () {
      var base = (c.p.movements || []), pending = null;
      base.forEach(function (m) {
        if (m.type === 'section') { pending = m.name; return; }
        if (pending && c.mv.indexOf(m) >= 0) { secBefore[m.id] = pending; pending = null; }
      });
    })();
    var html = '', n = 0;
    c.mv.forEach(function (m, i) {
      var st = stepState(c, m), inP = !!pset[m.id];
      n++;
      var row = st === 'active' ? activeHTML(c, m, i, inP, n) : lineHTML(m, i, st, inP, n);
      if (secBefore[m.id] && !inP) row = '<div class="fsec"><i></i><b>' + G.esc(secBefore[m.id]) + '</b><i></i></div>' + row;
      if (i === firstP) row = '<div class="torii in"><span>⛩</span><span class="tb"><b>THE PATH</b><small>' + G.esc(c.run.pathName || '') + '</small></span><em>' + (c.run.pathSteps || []).filter(function (x) { return c.mv.indexOf(x) >= 0; }).length + ' steps</em></div>' + row;
      if (i === lastP && lastP < c.mv.length - 1) row += '<div class="torii out"><small>the path ends — the base resumes</small></div>';
      html += row;
    });
    var allDone = G.allSettled();
    html += allDone
      ? '<button class="btn wide gate-b" id="gateB">' + (c.p.mode === 'seal' ? '封 Seal the day' : '完 Complete the mission') + '</button>'
      : '<p class="hint c rhint">tap the active step to stamp it · skip is honest too</p>';
    flow.innerHTML = html;
    var done = c.e.done.length, total = c.mv.length;
    var rc = $('#rCount'); if (rc) rc.textContent = done + ' / ' + total;
    var rk = $('#rChk b'); if (rk) rk.textContent = c.run.chakra | 0;
    var rp = $('#rpFill'); if (rp) rp.style.width = Math.round(100 * done / Math.max(1, total)) + '%';
    wireFlow();
    stopTick();
    var act = c.mv[c.run.idx];
    if (act && (act.type === 'timed' || act.type === 'breath')) tick = setInterval(function () { paintTimer(act, c.run.idx); }, 250);
    keepAwake(!!(act && (act.type === 'timed' || act.type === 'breath') && G.timerGet(act).status === 'running'));
    var el = $('.fs.active', flow);
    if (el && el.scrollIntoView) setTimeout(function () { el.scrollIntoView({ block: 'center', behavior: G.reducedMotion() ? 'auto' : 'smooth' }); }, 60);
    var gb = $('#gateB'); if (gb) gb.addEventListener('click', gate);
  }
  function stepState(c, m) {
    if (c.e.done.indexOf(m.id) >= 0) return 'done';
    if (c.e.skip.indexOf(m.id) >= 0) return 'skip';
    return c.mv[c.run.idx] === m ? 'active' : 'future';
  }
  function lineHTML(m, i, st, inP, n) {
    var pc = inP ? ' inpath' : '';
    if (st === 'done') return '<button class="fs done' + pc + '" data-i="' + i + '"><span class="fs-h brush">封</span><span class="fs-n">' + G.esc(m.name) + '</span><small>+' + G.stepChakra(m, inP) + '</small></button>';
    if (st === 'skip') return '<button class="fs skip' + pc + '" data-i="' + i + '"><span class="fs-sl"></span><span class="fs-n">' + G.esc(m.name) + '</span><small>tap to restore</small></button>';
    return '<button class="fs future' + pc + (m.opt ? ' optional' : '') + '" data-i="' + i + '"><span class="fs-ic">' + (G.TYPES[m.type] || G.TYPES.open)[0] + '</span><span class="fs-n">' + G.esc(m.name) + (m.opt ? ' <i class="optb">optional</i>' : '') + '</span><small>' + G.meta(m) + '</small></button>';
  }
  G.meta = function (m) {
    if (m.type === 'section') return 'section';
    if (m.type === 'timed') return G.fmt(m.secs) + (m.sides ? ' / side' : '');
    if (m.type === 'reps') return '×' + m.reps;
    if (m.type === 'breath') return 'breath · ' + G.fmt(m.secs || 60);
    return 'tap when done';
  };
  function isVow(m) { return /vow|nind|creed|gratitude|mirror/i.test(m.name + ' ' + (m.cue || '')); }
  function isMulti(m) { return m.type === 'reps' && m.reps > 1 && /century|tap/i.test(m.cue || ''); }
  function activeHTML(c, m, i, inP, n) {
    var run = c.run, mark = '';
    var gd = G.guideFor && G.guideFor(m);
    var help = (G.stepHasHelp && G.stepHasHelp(m)) ? '<button class="fa-help" data-help="' + i + '" aria-label="How to do this">? <span>how</span></button>' : '';
    var uref = m.ref && m.ref.url ? m.ref : null;
    var refline = uref ? '<a class="fa-ref" href="' + G.esc(uref.url) + '" target="_blank" rel="noopener" onclick="event.stopPropagation()">⧉ ' + G.esc(uref.note || 'watch how') + '</a>' : '';
    if (inP) mark = typeof run.pathSignIdx === 'number' ? '<span class="fa-mark">' + G.pathSign(run.pathSignIdx) + '</span>' : '<span class="fa-mark brush">' + G.esc((run.pathKanji || '道')) + '</span>';
    var tool = '';
    if (m.dogu && G.dogu(m.dogu)) {
      var d = G.dogu(m.dogu);
      tool = d.owned ? '<span class="fa-tool">具 ' + G.esc(d.slot) + (d.name ? ' · ' + G.esc(d.name) : '') + '</span>'
        : '<a class="fa-tool need" href="' + G.esc(G.doguBuy(d)) + '" target="_blank" rel="noopener" onclick="event.stopPropagation()">具 ' + G.esc(d.name || d.slot) + ' — buy ›</a>';
    }
    var nindo = refline + ((isVow(m) && G.state.nindo) ? '<p class="fa-nindo"><small>YOUR NINDŌ</small>\u300c ' + G.esc(G.state.nindo) + ' \u300d</p>' : '');
    var thumb = (gd && gd.cat === 'body') ? '<button class="fa-thumb" data-help="' + i + '" aria-label="How to do this">' + G.guideSVG(gd) + '</button>' : '';
    var inst, clan = (G.state.clan || {}).id;
    if (m.type === 'timed' || m.type === 'breath') {
      var t = G.timerGet(m), left = G.timerLeft(m), total = t.total;
      var tomoe = clan === 'uchiha' ? '<g class="tomoe"><circle cx="100" cy="12" r="5"/><circle cx="176.2" cy="144" r="5"/><circle cx="23.8" cy="144" r="5"/></g>' : clan === 'uzumaki' ? '<path class="spiral" d="M100 100m-4 0a4 4 0 1 0 8 0 12 12 0 1 1-24 0 20 20 0 1 0 40 0" fill="none" stroke="currentColor" stroke-width="2" opacity=".25"/>' : '';
      inst = '<div class="ring c-' + clan + (t.status === 'running' ? ' live' : '') + '" data-i="' + i + '"><svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="88" class="ring-bg"/><circle id="ringF" cx="100" cy="100" r="88" class="ring-f" stroke-dasharray="553" stroke-dashoffset="' + (553 * (1 - (left / total))) + '"/>' + tomoe + '</svg>' +
        '<b id="tval">' + G.fmt(left) + '</b>' +
        '<small id="tsub">' + (m.sides ? (t.side2 ? 'side 2' : 'side 1') + ' · ' : '') + (m.type === 'breath' ? '<span id="bphase" class="bph">breathe</span>' : (t.status === 'running' ? 'running' : t.status === 'paused' ? 'paused' : 'ready')) + '</small></div>' +
        '<div class="tctl">' +
        (t.status === 'running' ? '<button class="tb" data-t="pause" data-i="' + i + '">❚❚ Pause</button>' : '<button class="tb go" data-t="start" data-i="' + i + '">' + (t.status === 'paused' ? '▶ Resume' : '▶ Start') + '</button>') +
        '<button class="tb done" data-t="done" data-i="' + i + '">封 Done</button>' +
        '<button class="tb icon" data-t="reset" data-i="' + i + '" aria-label="Reset the timer">↺</button></div>';
    } else if (m.type === 'reps') {
      var tapped = mem.taps || 0, multi = isMulti(m);
      inst = '<div class="repbox"><b>' + (multi ? (m.reps - tapped) : m.reps) + '</b><small>' + (multi ? 'sets left · ' + tapped + ' / ' + m.reps + ' done' : 'reps') + '</small></div>' +
        '<div class="tctl"><button class="tb done wide" data-t="stamp" data-i="' + i + '">' + (multi ? '✓ Set done' : '封 Done — stamp it') + '</button></div>';
    } else {
      inst = '<div class="stampbox" data-i="' + i + '"><span class="brush">押</span><small>tap to stamp</small></div>';
    }
    var worth = G.stepChakra(m, inP);
    return '<div class="fs active' + (inP ? ' inpath' : '') + '" data-i="' + i + '">' + mark +
      '<div class="fa-top"><span><i class="fa-n">' + n + '</i>' + (G.TYPES[m.type] || G.TYPES.open)[0] + ' ' + (G.TYPES[m.type] || G.TYPES.open)[1] + ' · <em>⚡ ' + worth + '</em></span><span class="fa-acts">' + help + '<button class="fa-skip" data-i="' + i + '">skip</button></span></div>' +
      '<div class="fa-body' + (thumb ? ' has-thumb' : '') + '"><div><h2>' + G.esc(m.name) + '</h2>' + (m.cue ? '<p class="fa-cue">' + G.esc(m.cue) + '</p>' : '') + '</div>' + thumb + '</div>' + nindo + tool +
      '<div class="inst" data-i="' + i + '">' + inst + '</div></div>';
  }
  function paintTimer(m, i) {
    var c = G.current(); if (!c || c.mv[i] !== m) { stopTick(); return; }
    var r = G.timerTick(m);
    if (r === 'flip') { G.sfx('flip'); G.buzz([30, 40, 30]); G.toast('Other side'); drawFlow(); return; }
    if (r === 'done') { G.sfx('chime'); G.buzz([30, 40, 30]); finishStep(i); return; }
    var t = G.timerGet(m), left = G.timerLeft(m), total = t.total;
    var tv = $('#tval'), rf = $('#ringF');
    if (tv) tv.textContent = G.fmt(left);
    if (rf) rf.setAttribute('stroke-dashoffset', String(553 * (1 - left / total)));
    if (m.type === 'breath' && t.status === 'running') {
      var b = m.breath || [4, 4, 4, 4, 4], cyc = b[0] + b[1] + b[2] + b[3], pos = (total - left) % (cyc || 1);
      var ph = pos < b[0] ? 'in' : pos < b[0] + b[1] ? 'hold' : pos < b[0] + b[1] + b[2] ? 'out' : 'hold';
      var bp = $('#bphase'); if (bp && bp.textContent !== ph) { bp.textContent = ph; bp.className = 'bph ph-' + ph; if (ph !== 'hold') G.buzz(6); }
      var rg = $('.ring'); if (rg) rg.setAttribute('data-ph', ph);
    }
    if (t.status === 'running' && left <= 3 && left > 0 && mem.lastTickAt !== left) { mem.lastTickAt = left; G.sfx('tick'); }
  }
  function wireFlow() {
    $$('.fs.done').forEach(function (el) {
      el.addEventListener('click', function () {
        var i = +el.dataset.i, c = G.current();
        G.confirm(G.esc(c.mv[i].name), 'Stamped. Undo it?', 'Unstamp', 'Leave it').then(function (y) { if (y) { G.uncompleteAt(i); mem = {}; drawFlow(); } });
      });
    });
    $$('.fs.skip').forEach(function (el) { el.addEventListener('click', function () { G.unskipAt(+el.dataset.i); mem = {}; drawFlow(); }); });
    $$('.fa-skip').forEach(function (el) { el.addEventListener('click', function (e) { e.stopPropagation(); G.skipAt(+el.dataset.i); mem = {}; G.sfx('tick'); drawFlow(); }); });
    $$('.fa-help, .fa-thumb').forEach(function (el) { el.addEventListener('click', function (e) { e.stopPropagation(); var c2 = G.current(); G.guideSheet(c2.mv[+el.dataset.help]); }); });
    $$('.stampbox').forEach(function (el) { el.addEventListener('click', function () { G.fxUnlock(); finishStep(+el.dataset.i); }); });
    $$('.tb').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.stopPropagation(); G.fxUnlock();
        var i = +el.dataset.i, c = G.current(); if (!c) return; var m = c.mv[i]; if (!m || c.mv[c.run.idx] !== m) return;
        var a = el.dataset.t;
        if (a === 'start') { G.timerStart(m); G.sfx('tick'); G.buzz(8); drawFlow(); }
        else if (a === 'pause') { G.timerPause(m); G.sfx('tick'); drawFlow(); }
        else if (a === 'reset') { G.timerReset(m); G.sfx('flip'); G.toast('Timer reset'); drawFlow(); }
        else if (a === 'done') { finishStep(i); }
        else if (a === 'stamp') {
          if (isMulti(m)) {
            mem.taps = (mem.taps || 0) + 1;
            if (mem.taps < m.reps) { G.sfx('tick'); G.buzz(10); var rb = $('.repbox b'); if (rb) { rb.textContent = m.reps - mem.taps; rb.classList.remove('pop'); void rb.offsetWidth; rb.classList.add('pop'); } var rs = $('.repbox small'); if (rs) rs.textContent = 'sets left · ' + mem.taps + ' / ' + m.reps + ' done'; return; }
          }
          finishStep(i);
        }
      });
    });
    /* the ring itself: tap toggles run/pause — the buttons are the explicit path, this is the thumb's shortcut */
    $$('.ring').forEach(function (el) {
      el.addEventListener('click', function () {
        var i = +el.dataset.i, c = G.current(); if (!c) return; var m = c.mv[i]; if (!m || c.mv[c.run.idx] !== m) return;
        var t = G.timerGet(m);
        if (t.status === 'running') G.timerPause(m); else G.timerStart(m);
        G.sfx('tick'); drawFlow();
      });
    });
  }
  function finishStep(i) {
    var c = G.current(); if (!c) return; var m = c.mv[i]; if (!m) return;
    stopTick(); keepAwake(false);
    stampFX(i);
    var r = G.completeAt(i);
    var el = $('.fs.active[data-i="' + i + '"]');
    if (r && r.chakra) { G.floatUp(el, '+' + r.chakra + ' ⚡', 'chakra'); var rk = $('#rChk b'); if (rk) rk.textContent = G.state.run.chakra | 0; }
    var e = G.entry(c.run.pid, c.run.key, false);
    if (m.log && (!e.logs || typeof e.logs[m.name] !== 'number')) logSheet(m);
    mem = {};
    setTimeout(drawFlow, 420);
  }
  function stampFX(i) {
    var el = $('.fs.active[data-i="' + i + '"]');
    if (!el) return;
    G.sfx('stamp'); G.buzz([18, 20, 30]);
    var st = document.createElement('div'); st.className = 'stampfx brush'; st.textContent = '封';
    el.appendChild(st);
    G.ink($('.inst', el) || el, { n: 12 });
  }
  function logSheet(m) {
    var s = G.sheet('<div class="sh-h"><b>' + G.esc(m.name) + '</b><small>Log it — the number lives on the day' + (G.senseiPerk('logChakra') ? ' · +5 chakra (Jiraiya)' : '') + '.</small></div>' +
      '<div class="logrow"><input class="inp" id="lgV" type="number" step="0.1" inputmode="decimal" placeholder="0.0"><span>' + G.esc(m.log) + '</span></div>' +
      '<div class="row2"><button class="btn ghost" id="lgS">Skip</button><button class="btn" id="lgGo">Log it</button></div>');
    setTimeout(function () { try { $('#lgV', s.body).focus(); } catch (e) {} }, 320);
    $('#lgS', s.body).addEventListener('click', function () { s.close(); });
    $('#lgGo', s.body).addEventListener('click', function () {
      var v = parseFloat($('#lgV', s.body).value);
      if (!isFinite(v) || v < 0) { G.toast('A number, shinobi'); return; }
      G.runLog(m.name, Math.round(v * 100) / 100);
      s.close(function () { G.toast(v + ' ' + m.log + ' logged'); G.sfx('coin'); });
    });
  }

  /* ---------- the sensei's demonstration scroll ---------- */
  G.guideSheet = function (m) {
    if (!m) return;
    var g = (G.guideFor && G.guideFor(m)), ref = m.ref && m.ref.url ? m.ref : null, cur = g && g.link;
    var body = '<div class="sh-h gd-h"><b class="brush big">習</b><b>' + G.esc(m.name) + '</b><small>' + (g ? G.esc(g.t) : 'how to do this') + '</small></div>';
    if (m.img) body += '<div class="gd-photo" id="gdPhoto"></div>';
    if (g) body += '<div class="gd-board">' + G.guideSVG(g) + '</div>' +
      '<div class="gd-how">' + g.how.map(function (h, i) { return '<p><i>' + (i + 1) + '</i><span>' + G.esc(h) + '</span></p>'; }).join('') + '</div>' +
      (g.miss ? '<p class="gd-miss"><b>THE ONE MISTAKE</b>' + G.esc(g.miss) + '</p>' : '');
    if (m.cue) body += '<p class="gd-cue">' + G.esc(m.cue) + '</p>';
    if (ref) body += '<a class="btn wide gd-link" href="' + G.esc(ref.url) + '" target="_blank" rel="noopener">⧉ ' + G.esc(ref.note || 'Open the reference') + '</a>';
    if (cur) body += '<a class="btn wide ghost gd-link" href="' + G.esc(cur.url) + '" target="_blank" rel="noopener">' + (cur.search ? '▶ ' : '⧉ ') + G.esc(cur.label) + '</a>';
    G.sheet(body); G.sfx('flip');
    if (m.img) G.mediaURL(m.img).then(function (u) { var ph = document.getElementById('gdPhoto'); if (u && ph) ph.style.backgroundImage = 'url(' + u + ')'; else if (ph) ph.remove(); });
  };

  /* ---------- the gate: twelve hand seals, then the hold ---------- */
  function gate() {
    var c = G.current(); if (!c) return;
    var secs = Math.round((G.now() - c.run.startAt) / 1000);
    var isSeal = c.p.mode === 'seal';
    var seals = G.HAND_SEALS.map(function (h, i) { return '<span class="hs" data-n="' + i + '"><b class="brush">' + h[0] + '</b><small>' + h[1] + '</small></span>'; }).join('');
    var s = G.sheet('<div class="gatev"><div class="gate-k brush">' + (isSeal ? '封印' : '完了') + '</div>' +
      '<p class="lead c">' + (isSeal ? 'Weave the seals. Hold to make the day record.' : 'Weave the seals. Hold to complete the mission.') + '</p>' +
      '<div class="handseals" id="hseals">' + seals + '</div>' +
      '<div class="sealhold" id="shold"><svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="88" class="ring-bg"/><circle id="sring" cx="100" cy="100" r="88" class="ring-f gold" stroke-dasharray="553" stroke-dashoffset="553"/></svg><span class="brush">' + G.esc(c.run.pathKanji || c.p.kanji) + '</span></div>' +
      '<button class="btn ghost wide" id="gBack">back to the scroll</button></div>', { noClose: true });
    $('#gBack', s.body).addEventListener('click', function () { s.close(); });
    var hold = $('#shold', s.body), ring = $('#sring', s.body), hs = $$('.hs', s.body);
    var t0 = null, raf = null, DUR = 1600, lit = -1;
    function frame() {
      var f = Math.min(1, (Date.now() - t0) / DUR);
      ring.setAttribute('stroke-dashoffset', String(553 * (1 - f)));
      var n = Math.min(11, Math.floor(f * 12));
      if (n !== lit) { lit = n; hs.forEach(function (h, i) { h.classList.toggle('on', i <= n); }); G.sfx('handseal'); G.buzz(5); }
      if (f >= 1) { land(); return; }
      raf = requestAnimationFrame(frame);
    }
    function down(e) { e.preventDefault(); G.fxUnlock(); t0 = Date.now(); lit = -1; raf = requestAnimationFrame(frame); }
    function up() { if (raf) cancelAnimationFrame(raf); ring.setAttribute('stroke-dashoffset', '553'); hs.forEach(function (h) { h.classList.remove('on'); }); lit = -1; }
    hold.addEventListener('mousedown', down); hold.addEventListener('touchstart', down, { passive: false });
    hold.addEventListener('mouseup', up); hold.addEventListener('mouseleave', up); hold.addEventListener('touchend', up); hold.addEventListener('touchcancel', up);
    function land() {
      var run = c.run, signIdx = run.pathSignIdx, kanji = run.pathKanji, pname = run.pathName;
      var res = G.sealDay(secs);
      G.sfx('seal'); G.buzz([40, 30, 120]);
      s.close(function () { finale(c.p, res, secs, signIdx, kanji, pname); });
    }
  }

  /* ---------- the finale: every reward on the table ---------- */
  function finale(p, res, secs, signIdx, kanji, pname) {
    var e = (G.state.log[G.today()] || {})[p.id] || {};
    var logs = e.logs || {}, lks = Object.keys(logs);
    var ms = kanji ? G.pathMastery(kanji) : 0;
    var rewards = '<div class="rw"><span class="rw-i"><b id="cuCh">+0</b><small>⚡ CHAKRA</small></span><span class="rw-i"><b id="cuRy">+0</b><small>両 RYŌ</small></span><span class="rw-i rank">' + G.rankPill(res.rank) + '<small>' + G.MISSION[res.rank].name.toUpperCase() + '</small></span></div>';
    var extras = '';
    if (res.clone) extras += '<p class="fin-x gold">影分身 — Shadow Clone day: both bases sealed</p>';
    if (res.sRank) extras += '<p class="fin-x gold">秀 S-RANK — a perfect week · +1000 ryō</p>';
    if (res.rasengan) extras += '<p class="fin-x blue">螺旋丸 Rasengan ×' + res.rasengan + ' — the chain spun at ' + res.streak + '</p>';
    if (res.charge) extras += '<p class="fin-x">身 A Substitution charge earned (' + G.state.jutsu.charges + '/' + G.kawarimiMax() + ')</p>';
    extras += G.climbLines(res);
    if (res.logChakra) extras += '<p class="fin-x">蝦 Jiraiya read your numbers — +' + res.logChakra + ' chakra for the log</p>';
    var bounties = res.bounties.map(function (b) { return '<div class="fin-b"><span class="brush">' + b.kanji + '</span><b>' + b.name + '</b><small>bounty claimed · +' + b.ryo + ' ryō</small></div>'; }).join('');
    G.render('<div class="fin">' + G.embers(14) + '<div class="fin-stamp' + (res.rasengan ? ' spin' : '') + '">' +
      (typeof signIdx === 'number' ? G.pathSign(signIdx, 'fin-sign') : '<span class="brush">' + G.esc(e.sigil || '封') + '</span>') + '</div>' +
      '<h2>' + (p.mode === 'seal' ? 'The day is sealed.' : 'Mission complete.') + '</h2>' +
      '<p class="fin-l">' + G.esc(p.name) + (pname ? ' · ' + G.esc(pname) : '') + ' · ' + G.fmt(secs) + ' · chain ' + res.streak + '</p>' +
      rewards + extras +
      (ms ? '<p class="fin-m">' + ord(ms) + ' day sealed on this path' + (G.masteryTier(ms) === 2 ? ' · 極 grandmaster' : G.masteryTier(ms) === 1 ? ' · 師 mastered' : '') + '</p>' : '') +
      (lks.length ? '<p class="fin-lg">' + lks.map(function (k) { return G.esc(k) + ' — <b>' + logs[k] + '</b>'; }).join(' · ') + '</p>' : '') +
      bounties +
      '<button class="btn wide" id="finB">' + (res.promoted ? '昇進 The promotion ›' : res.levelUp ? 'Level ' + res.levelUp.to + ' ›' : 'Return to the village') + '</button></div>');
    G.countUp($('#cuCh'), res.chakra, '+', 750); G.countUp($('#cuRy'), res.ryo, '+', 900);
    if (res.rasengan) setTimeout(function () { G.sfx('rasengan'); }, 300);
    if (res.bounties.length) setTimeout(function () { G.sfx('coin'); }, 700);
    if (res.sRank || res.clone) G.confetti([G.VILLAGES[G.state.village].glow, '#ffd76b', '#f2ede4'], 36);
    $('#finB').addEventListener('click', function () {
      if (res.promoted) G.rankCinematic(res, function () { promotion(res); });
      else if (res.climb && res.climb.length) G.climbCinematic(res, function () { if (res.levelUp) levelUp(res.levelUp, function () { G.go('home'); }); else G.go('home'); });
      else if (res.levelUp) levelUp(res.levelUp, function () { G.go('home'); });
      else G.go('home');
    });
  }
  function ord(n) { var s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }

  function promotion(res) {
    var st = G.state, v = G.VILLAGES[st.village], L = G.LETTERS[res.promotedIdx] || G.LETTERS[0];
    G.render('<div class="cer promo">' + G.embers(18) + '<div class="cer-flash"></div>' +
      '<p class="cer-pre cs1">昇進 · PROMOTED</p>' +
      '<div class="promo-crest cs2">' + G.crest(120) + '</div>' +
      '<div class="cer-k brush sm cs2">' + G.esc(res.promoted) + '</div>' +
      (res.epithet ? '<p class="cer-mn cs3">the village names you \u300c ' + G.esc(res.epithet) + ' \u300d</p>' : '<p class="cer-mn cs3">' + G.esc(st.sName ? st.sName.r : st.name) + ' of ' + v.en + '</p>') +
      '<div class="letter-p cs4"><span class="brush lt-k">' + L.k + '</span><b>' + L.t + '</b><p>' + L.body + '</p><small>— the ' + v.kage + '</small></div>' +
      '<button class="btn wide cs5" id="prGo">Wear it</button></div>');
    setTimeout(function () { G.sfx('rank'); G.buzz([40, 40, 40, 40, 120]); G.confetti([v.glow, '#ffd76b', '#f2ede4'], 70); }, 500);
    $('#prGo').addEventListener('click', function () { if (res.levelUp) levelUp(res.levelUp, function () { G.go('home'); }); else G.go('home'); });
  }
  function levelUp(lu, cb) {
    var j = lu.jutsu.map(function (x) { return '<div class="ju-row on" style="--ja:' + x.color + '"><span class="brush">' + x.kanji + '</span><span><b>' + x.name + '</b><small>' + x.sub + '</small></span></div>'; }).join('');
    var s = G.sheet('<div class="gatev"><div class="gate-k brush">昇</div><p class="cer-pre">CHAKRA LEVEL ' + lu.from + ' → ' + lu.to + '</p>' +
      (j ? '<small class="lab c">術 NEW JUTSU</small>' + j : '<p class="lead c">The reserves deepen. The next jutsu waits at level ' + (function () { var n = G.JUTSU.filter(function (x) { return !x.streak && x.lvl > lu.to; })[0]; return n ? n.lvl : '—'; })() + '.</p>') +
      '<button class="btn wide" id="luGo">Continue</button></div>', { noClose: true });
    G.sfx(j ? 'rank' : 'chime');
    $('#luGo', s.body).addEventListener('click', function () { s.close(cb); });
  }
  G._promotion = promotion;
})(window.HOKAGE = window.HOKAGE || {});
