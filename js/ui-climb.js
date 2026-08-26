/* HOKAGE — ui-climb: the Climb card, trial sheets, the Bazaar and its stalls, living summons, masks, scene moods, cinematics. */
(function (G) {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ================= the Climb card (home) ================= */
  G.climbCardHtml = function () {
    var c = G.climbCard(), s = c.status, dots = '';
    if (c.state === 'ready' && G.state.seen && !G.state.seen.h_trial) { G.state.seen.h_trial = 1; G.save(); setTimeout(function () { G.toast('影 A trial is ready. It begins only when you choose — and it will not be easy.', 'long'); }, 900); }
    if (s && s.keys && s.keys.length && s.keys.length <= 28 && !s.hidden) {
      dots = '<span class="ex-dots">' + s.keys.map(function (k) { var sd = G.daySealed(k), td = k === G.today(), fut = k > G.today(); return '<i class="' + (sd ? 'on' : (fut || td) ? 'fut' : 'miss') + (td ? ' td' : '') + '"></i>'; }).join('') + '</span>';
    }
    if (s && s.hidden) dots = '<span class="ex-dots dark">' + s.keys.map(function (k) { return '<i class="' + (k === G.today() ? 'td' : k < G.today() ? 'dk' : 'fut') + '"></i>'; }).join('') + '</span>';
    return '<button class="exam climb-' + c.state + (s && s.left === 0 && !s.passed ? ' lastday' : '') + '" id="climbB"><span class="ex-k brush">' + c.kanji + '</span><span class="ex-b"><b>' + G.esc(c.title) + '</b><small>' + G.esc(c.sub) + '</small>' + dots + '</span><span class="ex-r">' + (c.state === 'ready' ? '始' : c.state === 'active' ? '中' : c.state === 'cooldown' ? '待' : c.state === 'kage' ? '影' : '鎖') + '</span></button>';
  };

  /* ================= the trial sheet ================= */
  G.trialSheet = function () {
    var st = G.state, c = G.climbCard(), s = c.status, idx = st.rankIdx + 1, T = G.TRIALS[idx];
    if (!T) { G.sheet('<div class="sh-h"><b class="brush big">影</b><b>' + c.title + '</b><small>' + c.sub + '</small></div><p class="quote">' + T ? '' : '“' + c.line + '”</p>'); return; }
    var body = '<div class="sh-h"><b class="brush big">' + (s && s.arc ? s.arc.kanji : T.kanji) + '</b><b>' + G.esc(c.title) + '</b><small>for the rank of ' + G.RANKS[idx][0] + (st.climb.fails[T.id] ? ' · failed ' + st.climb.fails[T.id] + '×' : '') + '</small></div>';
    body += '<p class="quote">“' + G.esc(s && s.arc ? s.arc.line : T.intro) + '”</p>';
    if (s) {
      if (s.hidden) body += '<div class="shadowbox"><span class="brush">暗</span><b>You are in the dark.</b><small>Day ' + (G.daysSince(s.trial.start) + 1) + ' of 7. The numbers return when it ends.</small></div>';
      else {
        if (s.id === 'kage') body += '<div class="arcs">' + G.KAGE_ARCS.map(function (a, i) { return '<span class="arc' + (i < s.arcIdx ? ' done' : i === s.arcIdx ? ' now' : '') + '"><b class="brush">' + a.kanji + '</b><small>' + a.name.split(' ')[0] + '</small></span>'; }).join('') + '</div>';
        if (s.fronts) body += '<div class="warmap">' + s.fronts.map(function (f) { return '<span class="front' + (f.ok ? ' held' : '') + '"><i style="--p:' + Math.round(100 * Math.min(1, f.have / f.need)) + '"></i><b>' + f.have + '/' + f.need + '</b><small>' + f.name.split(' · ')[0] + '</small></span>'; }).join('') + '</div>';
        body += '<div class="tlines">' + s.lines.map(function (l) { return '<div class="tl' + (l[2] ? ' ok' : '') + '"><span>' + G.esc(l[0]) + '</span><b>' + G.esc(l[1]) + '</b></div>'; }).join('') + '</div>';
        body += '<div class="tbar"><i style="width:' + Math.round(s.pct * 100) + '%"></i></div>';
      }
      body += '<button class="btn wide ghost" id="trW">Withdraw — no scar, seven days</button>';
    } else if (c.state === 'ready') {
      if (T.id === 'spec') body += '<small class="lab">専 DECLARE A DISCIPLINE</small>' + Object.keys(G.TRACKS).map(function (k) { var t = G.TRACKS[k]; return '<button class="lp own' + (st.climb.spec.indexOf(k) >= 0 ? ' done' : '') + '" data-track="' + k + '"><span class="lp-k brush">' + t.kanji + '</span><span class="lp-b"><b>' + t.name + '</b><small>' + t.sub + ' · paths: ' + t.paths.map(function (i) { return G.PATHS[i][1].split(' — ')[0]; }).join(', ') + '</small></span></button>'; }).join('');
      else if (T.id === 'anbu') body += '<small class="lab">面 CHOOSE A MASK — you do not wear it yet</small><div class="masks">' + G.MASKS.map(function (m) { var burned = st.climb.masks.burned.indexOf(m[0]) >= 0; return '<button class="maskb' + (burned ? ' burned' : '') + '" data-mask="' + m[0] + '"' + (burned ? ' disabled' : '') + '>' + G.maskSVG(m[0], 56) + '<b>' + m[2] + '</b><small>' + (burned ? 'burned' : m[1]) + '</small></button>'; }).join('') + '</div>';
      else body += '<button class="btn wide" id="trGo">Begin ' + T.name + '</button>';
      body += '<p class="lead c dim">Nothing starts until you choose. ' + (T.cd ? 'Failing closes it for ' + T.cd + ' days.' : '') + '</p>';
    } else if (c.state === 'cooldown') body += '<p class="lead c">' + G.esc(T.fail) + '</p><p class="lead c dim">' + c.sub + '</p>';
    else body += '<small class="lab">鎖 NOT YET</small>' + (c.need || []).map(function (n) { return '<div class="tl"><span>' + G.esc(n) + '</span><b>—</b></div>'; }).join('');
    var sh = G.sheet(body);
    var go = $('#trGo', sh.body); if (go) go.addEventListener('click', function () { var r = G.startTrial(); if (r.ok) { G.sfx('rank'); G.buzz([30, 40, 80]); sh.close(function () { G.trialOpened(T); }); } else G.toast(r.why); });
    $$('[data-track]', sh.body).forEach(function (el) { el.addEventListener('click', function () { var r = G.startTrial({ track: el.dataset.track }); if (r.ok) { G.sfx('stamp'); sh.close(function () { G.trialOpened(T); }); } else G.toast(r.why); }); });
    $$('[data-mask]', sh.body).forEach(function (el) { el.addEventListener('click', function () { var r = G.startTrial({ mask: el.dataset.mask }); if (r.ok) { G.sfx('whoosh'); sh.close(function () { G.applyShadow(); G.trialOpened(T); }); } else G.toast(r.why); }); });
    var w = $('#trW', sh.body); if (w) w.addEventListener('click', function () { if (!confirm('Withdraw from ' + c.title + '? It reopens in seven days, unscarred.')) return; G.withdrawTrial(); G.applyShadow(); sh.close(function () { G.go('home'); }); });
  };
  function hideNav() { var n = document.getElementById('nav'); if (n) n.style.display = 'none'; }
  G.hideNav = hideNav;
  G.trialOpened = function (T) {
    hideNav(); G.render('<div class="cer trialopen"><div class="cer-flash"></div>' + G.embers(16) + '<p class="cer-pre cs1">' + (T.voice || '').toUpperCase() + '</p><div class="cer-k brush cs2">' + T.kanji + '</div><h2 class="cs3">' + T.name + '</h2><p class="cer-mn cs3">“' + G.esc(T.intro) + '”</p>' +
      (G.state.nindo ? '<p class="cer-oath cs4">your nindō: ' + G.esc(G.state.nindo) + '</p>' : '') + '<button class="btn wide cs5" id="toGo">Begin</button></div>');
    $('#toGo').addEventListener('click', function () { G.go('home'); });
  };

  /* ================= climb events → cinematics ================= */
  G.climbLines = function (res) {
    return (res.climb || []).map(function (ev) {
      if (ev.ev === 'fail') return '<p class="fin-x red">' + ev.def.kanji + ' ' + ev.def.name + ' — ' + G.esc(ev.def.fail) + '</p>';
      if (ev.ev === 'stage') return '<p class="fin-x gold">森 You reached the tower. Preliminaries: your opponent is <b>' + G.esc(ev.weakest.name) + '</b> — three days running.</p>';
      if (ev.ev === 'arc') return '<p class="fin-x gold">' + ev.done.kanji + ' ' + ev.done.name + ' is over. ' + ev.arc.kanji + ' ' + ev.arc.name + ' begins.</p>';
      if (ev.ev === 'summonUnlock') return '<p class="fin-x gold">' + ev.summon.kanji + ' A contract is ready to sign: ' + ev.summon.name + '</p>';
      if (ev.ev === 'summonGrow') return '<p class="fin-x gold">' + ev.summon.kanji + ' ' + ev.summon.name.split(' — ')[0] + ' grew — ' + ev.summon.grown + '</p>';
      if (ev.ev === 'demote') return '<p class="fin-x red">退 The register marks your absence — ' + ev.to + '</p>';
      return '';
    }).join('');
  };
  G.climbCinematic = function (res, cb) {
    var evs = (res.climb || []).filter(function (e) { return e.ev === 'fail' || e.ev === 'stage' || e.ev === 'arc' || e.ev === 'demote'; });
    if (!evs.length) { cb(); return; }
    var ev = evs[0], st = G.state, v = G.VILLAGES[st.village], html;
    if (ev.ev === 'fail') {
      var scene = ev.id === 'forest' ? '<div class="cin forest"><i class="tower"></i></div>' : ev.id === 'anbu' ? '<div class="cin burn">' + G.maskSVG(ev.mask, 120) + '</div>' : ev.id === 'kage' ? '<div class="cin chair"><i class="hat"></i><i class="seat"></i></div>' : '<div class="cin"><span class="brush">' + ev.def.kanji + '</span></div>';
      html = '<p class="cer-pre cs1">' + ev.def.name.toUpperCase() + '</p>' + scene + '<p class="cer-mn cs3">“' + G.esc(ev.def.fail) + '”</p><p class="cer-oath cs4">your record, chakra and ryō are untouched</p>';
    } else if (ev.ev === 'stage') html = '<p class="cer-pre cs1">THE TOWER</p><div class="cin tower-in"><span class="brush">塔</span></div><h2 class="cs3">Preliminaries</h2><p class="cer-mn cs3">Your opponent: <b>' + G.esc(ev.weakest.name) + '</b>. The step you dodge most. Seal it three days running.</p>';
    else if (ev.ev === 'arc') html = '<p class="cer-pre cs1">' + ev.done.name.toUpperCase() + ' · COMPLETE</p><div class="cer-k brush cs2">' + ev.arc.kanji + '</div><h2 class="cs3">' + ev.arc.name + '</h2><p class="cer-mn cs3">“' + G.esc(ev.arc.line) + '”</p>';
    else html = '<p class="cer-pre cs1">退 THE REGISTER</p><div class="cer-k brush cs2">退</div><p class="cer-mn cs3">' + (ev.retired ? 'The hat is set down. The rock keeps your face.' : 'Twenty-one silent days. You are ' + ev.to + '.') + '</p>';
    hideNav(); G.render('<div class="cer cin-v">' + G.embers(10) + html + '<button class="btn wide cs5" id="cinGo">Understood</button></div>');
    G.sfx(ev.ev === 'fail' || ev.ev === 'demote' ? 'stamp' : 'rank'); if (ev.ev === 'fail') G.buzz([80, 60, 200]);
    $('#cinGo').addEventListener('click', cb);
  };

  /* ================= masks, summons, weapons, cloaks ================= */
  G.maskSVG = function (id, size) {
    var m = G.MASKS.filter(function (x) { return x[0] === id; })[0]; if (!m) return '';
    var col = m[3], marks = { cat: '<path d="M22 22l8 10M58 22l-8 10M30 46q10 6 20 0" stroke="#c9312b" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M18 14l8 14M62 14l-8 14" stroke="#c9312b" stroke-width="3"/>',
      hawk: '<path d="M40 34l-6 14h12z" fill="#c9312b"/><path d="M22 26q18-8 36 0" stroke="#c9312b" stroke-width="3" fill="none"/>',
      boar: '<path d="M30 48q10 8 20 0M24 20l10 12M56 20l-10 12" stroke="#c9312b" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="40" cy="44" r="5" fill="#c9312b"/>',
      bear: '<circle cx="26" cy="16" r="6" fill="' + col + '" stroke="#000"/><circle cx="54" cy="16" r="6" fill="' + col + '" stroke="#000"/><path d="M30 48q10-6 20 0" stroke="#c9312b" stroke-width="3" fill="none"/>',
      wolf: '<path d="M20 8l10 16M60 8l-10 16M26 50l14 8 14-8" stroke="#c9312b" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M32 36h4M44 36h4" stroke="#c9312b" stroke-width="3"/>',
      monkey: '<path d="M24 44q16 12 32 0" stroke="#c9312b" stroke-width="3" fill="none"/><circle cx="30" cy="28" r="3" fill="#c9312b"/><circle cx="50" cy="28" r="3" fill="#c9312b"/>' }[id];
    return '<svg viewBox="0 0 80 70" class="mask" style="width:' + size + 'px"><path d="M12 10q28-12 56 0 4 30-28 54Q8 40 12 10z" fill="' + col + '" stroke="rgba(0,0,0,.6)" stroke-width="2"/><path d="M26 30q7-5 12 0M42 30q7-5 12 0" stroke="#000" stroke-width="3" fill="none"/>' + marks + '</svg>';
  };
  G.summonSVG = function (id, size, grown) {
    var S = G.SUMMONS.filter(function (x) { return x.id === id; })[0]; if (!S) return ''; var c = S.color, body;
    if (id === 'toad') body = '<g class="sm-body"><ellipse cx="50" cy="64" rx="34" ry="22" fill="' + c + '"/><ellipse cx="50" cy="70" rx="22" ry="10" fill="#f6d7a8"/><circle cx="34" cy="42" r="10" fill="' + c + '"/><circle cx="66" cy="42" r="10" fill="' + c + '"/><circle cx="34" cy="42" r="5" fill="#ffd76b"/><circle cx="66" cy="42" r="5" fill="#ffd76b"/><rect x="32" y="41" width="4" height="3" fill="#000"/><rect x="64" y="41" width="4" height="3" fill="#000"/>' + (grown ? '<path d="M70 60l16-6" stroke="#5a3a1a" stroke-width="3"/><circle cx="88" cy="52" r="3" fill="#c94f2b" class="sm-pipe"/>' : '') + '<path d="M30 72q20 8 40 0" stroke="#000" stroke-width="2" fill="none"/></g>';
    else if (id === 'snake') body = '<g class="sm-body"><path d="M10 70c20-30 40 10 60-10 10-10 20-10 22-2" fill="none" stroke="' + c + '" stroke-width="10" stroke-linecap="round"/><path d="M10 70c20-30 40 10 60-10" fill="none" stroke="#2b5d20" stroke-width="3" stroke-dasharray="4 6"/><circle cx="90" cy="56" r="9" fill="' + c + '"/><circle cx="93" cy="54" r="2.4" fill="#000"/><path d="M98 58l8 2-8 2" fill="none" stroke="#c9312b" stroke-width="2" class="sm-tongue"/></g>';
    else if (id === 'slug') body = '<g class="sm-body"><path d="M14 76c0-20 20-34 44-34s30 16 28 30H14z" fill="' + c + '"/><path d="M30 58q8-8 18-4" stroke="#fff" stroke-width="2" fill="none"/><path d="M52 44l-6-14M60 44l2-16" stroke="' + c + '" stroke-width="4" stroke-linecap="round"/><circle cx="45" cy="28" r="3" fill="#000"/><circle cx="63" cy="26" r="3" fill="#000"/></g>';
    else if (id === 'hawk') body = '<g class="sm-body sm-fly"><path d="M50 50L6 30q20-4 44 8 24-12 44-8L50 50z" fill="' + c + '"/><path d="M44 50h12l-6 22z" fill="' + c + '"/><circle cx="50" cy="44" r="7" fill="#6b4a2a"/><path d="M56 44l6 2-6 3z" fill="#ffd76b"/></g>';
    else if (id === 'ninken') body = '<g class="sm-body"><rect x="28" y="44" width="44" height="30" rx="12" fill="' + c + '"/><circle cx="38" cy="36" r="14" fill="' + c + '"/><path d="M26 24l6 14M50 24l-6 14" stroke="' + c + '" stroke-width="6" stroke-linecap="round"/><circle cx="34" cy="36" r="2.2" fill="#000"/><circle cx="44" cy="36" r="2.2" fill="#000"/><circle cx="39" cy="42" r="2.6" fill="#3a2a1a"/><rect x="22" y="28" width="30" height="5" fill="#2b3a6a"/><path d="M72 50q10-6 6 8" stroke="' + c + '" stroke-width="5" fill="none" stroke-linecap="round" class="sm-tail"/></g>';
    else if (id === 'crow') body = '<g class="sm-body sm-fly"><path d="M50 46L10 32q18 0 40 10 22-10 40-10L50 46z" fill="' + c + '"/><ellipse cx="50" cy="50" rx="8" ry="12" fill="' + c + '"/><circle cx="50" cy="42" r="6" fill="#2a2d3a"/><circle cx="52" cy="41" r="1.6" fill="#c9312b"/><path d="M56 43l6 1-6 2z" fill="#444"/></g>';
    else body = '<g class="sm-body sm-cloak"><circle cx="50" cy="50" r="34" fill="none" stroke="' + c + '" stroke-width="6" opacity=".7"/><g stroke="' + c + '" stroke-width="4" fill="none" stroke-linecap="round">' + [0, 40, 80, 120, 160, 200, 240, 280, 320].map(function (a) { return '<path transform="rotate(' + a + ' 50 50)" d="M50 18q10-12 4-24"/>'; }).join('') + '</g><circle cx="40" cy="46" r="4" fill="#c9312b"/><circle cx="60" cy="46" r="4" fill="#c9312b"/></g>';
    return '<svg viewBox="0 0 100 100" class="summon sm-' + id + (grown ? ' grown' : '') + '" style="width:' + size + 'px">' + body + '</svg>';
  };
  G.weaponSVG = function (val) {
    if (val === 'w_kunai') return '<svg viewBox="0 0 100 60" class="wpn"><g fill="#9aa4b4" stroke="#222" stroke-width="1.2"><path d="M10 50L48 12l6 6L16 56z"/><path d="M90 50L52 12l-6 6L84 56z"/><circle cx="50" cy="8" r="4" fill="none" stroke="#9aa4b4" stroke-width="2"/></g></svg>';
    if (val === 'w_kubikiri') return '<svg viewBox="0 0 100 60" class="wpn"><path d="M4 52L70 14h22l-6 10H72L10 58z" fill="#8c96a6" stroke="#1a1d26" stroke-width="1.5"/><circle cx="78" cy="18" r="4" fill="#1a1d26"/><path d="M60 20a10 10 0 0 1 8 8" fill="none" stroke="#1a1d26" stroke-width="2"/></svg>';
    if (val === 'w_samehada') return '<svg viewBox="0 0 100 60" class="wpn sam"><path d="M8 48L80 14q10 6 10 14L18 56z" fill="#4a5a8a" stroke="#1a1d26" stroke-width="1.5"/><g fill="#6f82b8" class="sam-scale">' + [20, 30, 40, 50, 60, 70].map(function (x) { return '<path d="M' + x + ' ' + (48 - (x - 20) * 0.45) + 'l5-7 5 5z"/>'; }).join('') + '</g></svg>';
    if (val === 'w_chidori') return '<svg viewBox="0 0 100 60" class="wpn chid"><path d="M6 50L86 12l4 8L14 58z" fill="#dbe6ff" stroke="#5a7bd0" stroke-width="1.5"/><path d="M20 44l6-6-4 8 8-4-3 7M50 30l6-6-4 8 8-4-3 7" stroke="#7fb8ff" stroke-width="2" fill="none" class="chid-arc"/></svg>';
    if (val === 'w_susanoo') return '<svg viewBox="0 0 200 140" class="wpn susa"><g fill="none" stroke="#b17cff" stroke-width="3" opacity=".75"><path d="M100 10q60 0 80 60-20 70-80 70-60 0-80-70 20-60 80-60z"/><path d="M40 50q60-20 120 0M32 72h136M40 94q60 20 120 0"/><path d="M100 10v130"/></g></svg>';
    return '';
  };

  /* ================= the Bazaar ================= */
  G.bazaarSheet = function (stall) {
    var st = G.state; stall = stall || 'summons';
    function draw(s) {
      var tabs = '<div class="stalls">' + [['summons', '契', 'Contracts']].concat(G.STALLS.map(function (x) { return [x[0], x[1], x[2].replace('The ', '')]; })).map(function (t) { return '<button class="stall' + (t[0] === stall ? ' on' : '') + '" data-st="' + t[0] + '"><b class="brush">' + t[1] + '</b><small>' + t[2] + '</small></button>'; }).join('') + '</div>';
      var rows = '', col = G.collection();
      if (stall === 'summons') {
        rows = '<p class="lead">A contract is signed in blood, not bought. Do the deed, then pay the shrine.' + (!st.summons.owned.length ? ' <b>None are open yet</b> — the nearest is the Toad, at a thirty-day chain.' : '') + '</p>' + G.SUMMONS.map(function (S) {
          var ss = G.summonState(S.id);
          var btn = ss.owned ? '<button class="spa' + (ss.active ? '' : ' ghost') + '" data-sign="' + S.id + '">' + (ss.active ? 'summoned' : 'summon') + '</button>'
            : ss.unlocked ? '<button class="spa sign" data-sign="' + S.id + '">' + (S.vault ? 'sign' : G.fmtN(S.price) + ' 両') + '</button>' : '<button class="spa ghost" disabled>deed</button>';
          return '<div class="lp own share mk sm' + (ss.unlocked ? '' : ' lk') + '"><span class="lp-sum">' + G.summonSVG(S.id, 54, ss.grown) + '</span><span class="lp-b"><b>' + (ss.grown ? S.grown : S.name) + (S.vault ? ' <i class="vault">VAULT</i>' : '') + '</b><small>' + S.line + '</small><em>deed: ' + S.deed + (ss.owned && !ss.grown ? ' · grows later' : '') + '</em></span>' + btn + '</div>';
        }).join('');
      } else {
        var stDef = G.STALLS.filter(function (x) { return x[0] === stall; })[0];
        rows = '<p class="lead">' + stDef[3] + '.</p>' + G.BAZAAR.filter(function (it) { return it.stall === stall; }).map(function (it) {
          var can = G.canBuy(it), owned = st.cosmetics.owned.indexOf(it.id) >= 0, eq = st.cosmetics[it.kind] === it.id;
          var btn = it.kind === 'maskinfo' ? (st.cosmetics.mask ? G.maskSVG(st.cosmetics.mask, 36) : '<button class="spa ghost" disabled>earned</button>')
            : owned ? '<button class="spa' + (eq ? '' : ' ghost') + '" data-eq="' + it.id + '">' + (eq ? 'worn' : 'wear') + '</button>'
            : '<button class="spa' + (can.ok ? (it.vault ? ' sign' : '') : ' ghost') + '" data-buy="' + it.id + '"' + (can.ok ? '' : ' disabled') + '>' + (can.ok ? (it.vault ? 'claim' : G.fmtN(can.price) + ' 両') : can.why) + '</button>';
          var pre = it.kind === 'weapon' ? '<span class="lp-w">' + G.weaponSVG(it.id) + '</span>' : '<span class="lp-k brush">' + it.kanji + '</span>';
          return '<div class="lp own share mk' + (can.ok || owned ? '' : ' lk') + (it.vault ? ' vt' : '') + '">' + pre + '<span class="lp-b"><b>' + it.name + (it.vault ? ' <i class="vault">VAULT</i>' : '') + '</b><small>' + it.sub + (owned ? '' : it.vault ? '' : ' · ' + G.fmtN(it.kind === 'reroll' ? G.rerollPrice() : it.price) + ' ryō') + '</small></span>' + btn + '</div>';
        }).join('');
      }
      s.body.innerHTML = '<button class="sheet-x" aria-label="Close">✕</button><div class="sh-h"><b>市 The Village Bazaar</b><small>You carry <b>' + G.fmtN(st.ryo) + ' ryō</b> · collection ' + col.got + ' / ' + col.total + ' (' + col.pct + '%)</small></div>' + tabs + rows;
      $('.sheet-x', s.body).addEventListener('click', function () { s.close(); });
      $$('.stall', s.body).forEach(function (el) { el.addEventListener('click', function () { stall = el.dataset.st; G.sfx('tick'); draw(s); }); });
      $$('[data-buy]', s.body).forEach(function (el) { el.addEventListener('click', function () {
        var r = G.buy(el.dataset.buy); if (!r.ok) { G.toast(r.why); return; }
        G.sfx('coin'); G.ink(el, { n: 16, color: '#c9a25c' });
        if (r.item.kind === 'reroll') { s.close(function () { G.doReroll(); G.clanReel({ reroll: true, onDone: function () { G.applyTheme(); G.go('card'); } }); }); return; }
        G.toast(r.item.name + ' — yours'); draw(s);
      }); });
      $$('[data-eq]', s.body).forEach(function (el) { el.addEventListener('click', function () { G.equip(G.BAZAAR.filter(function (x) { return x.id === el.dataset.eq; })[0]); G.sfx('tick'); draw(s); }); });
      $$('[data-sign]', s.body).forEach(function (el) { el.addEventListener('click', function () {
        var id = el.dataset.sign, ss = G.summonState(id);
        if (ss.owned) { G.signContract(id); G.sfx('tick'); draw(s); return; }
        signInBlood(ss.def, function () { var r = G.signContract(id); if (r.ok) { G.sfx('seal'); G.confetti([ss.def.color, '#c9312b', '#f2ede4'], 50); draw(s); } else G.toast(r.why); });
      }); });
    }
    var s = G.sheet('', { noClose: true }); draw(s);
    s.el.addEventListener('click', function (e) { if (e.target === s.el) s.close(function () { G.go('card'); }); });
  };
  function signInBlood(S, cb) {
    var st = G.state, nm = (st.sName || {}).k || st.name;
    var sh = G.sheet('<div class="gatev"><div class="sig-sum">' + G.summonSVG(S.id, 110) + '</div><p class="cer-pre">契約 · SUMMONING CONTRACT</p><h2>' + S.name + '</h2><p class="lead c">' + S.line + '</p>' +
      '<div class="sigline"><span class="brush sig-name" id="sigN"></span><i></i></div><p class="lead c dim">hold to sign in blood' + (S.vault ? '' : ' · ' + G.fmtN(S.price) + ' ryō') + '</p>' +
      '<div class="sealhold" id="sigHold"><svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="88" class="ring-bg"/><circle id="sigRing" cx="100" cy="100" r="88" class="ring-f red" stroke-dasharray="553" stroke-dashoffset="553"/></svg><span class="brush">血</span></div>' +
      '<button class="btn ghost wide" id="sigBack">not yet</button></div>', { noClose: true });
    $('#sigBack', sh.body).addEventListener('click', function () { sh.close(); });
    var hold = $('#sigHold', sh.body), ring = $('#sigRing', sh.body), nameEl = $('#sigN', sh.body), t0 = null, raf = null, DUR = 1800, shown = 0;
    function frame() { var f = Math.min(1, (Date.now() - t0) / DUR); ring.setAttribute('stroke-dashoffset', String(553 * (1 - f))); var n = Math.ceil(f * nm.length); if (n !== shown) { shown = n; nameEl.textContent = nm.slice(0, n); G.buzz(4); } if (f >= 1) { G.buzz([40, 30, 120]); sh.close(cb); return; } raf = requestAnimationFrame(frame); }
    function down(e) { e.preventDefault(); G.fxUnlock(); t0 = Date.now(); shown = 0; raf = requestAnimationFrame(frame); }
    function up() { if (raf) cancelAnimationFrame(raf); ring.setAttribute('stroke-dashoffset', '553'); nameEl.textContent = ''; shown = 0; }
    hold.addEventListener('mousedown', down); hold.addEventListener('touchstart', down, { passive: false }); hold.addEventListener('mouseup', up); hold.addEventListener('mouseleave', up); hold.addEventListener('touchend', up); hold.addEventListener('touchcancel', up);
  }

  /* ================= hero mood layers ================= */
  G.heroOverlay = function () {
    var mood = G.heroMood(), v = G.VILLAGES[G.state.village] || G.VILLAGES.konoha, st = G.state, nm = (st.sName || {}).k || '影';
    var o = '';
    if (mood === 'snow') { var f = ''; for (var i = 0; i < 26; i++) f += '<i style="left:' + (Math.random() * 100).toFixed(1) + '%;animation-delay:' + (Math.random() * 6).toFixed(2) + 's;animation-duration:' + (5 + Math.random() * 5).toFixed(1) + 's"></i>'; o = '<div class="mood snow">' + f + '</div>'; }
    else if (mood === 'festival') o = '<svg viewBox="0 0 400 190" class="mood fest" preserveAspectRatio="xMidYMax slice"><path d="M0 110q100 30 200 0t200 0" fill="none" stroke="#2a1a10" stroke-width="1.5"/>' + [20, 60, 100, 140, 180, 220, 260, 300, 340, 380].map(function (x, i) { var y = 110 + Math.sin(x / 400 * Math.PI * 2) * -14 + 14; return '<g class="fl" style="--d:' + (i * .23) + 's"><rect x="' + (x - 5) + '" y="' + y + '" width="10" height="14" rx="3" fill="' + (i % 2 ? '#ff9a3d' : '#ffd76b') + '"/><circle cx="' + x + '" cy="' + (y + 7) + '" r="12" fill="' + v.glow + '" opacity=".16"/></g>'; }).join('') + '</svg>';
    else if (mood === 'storm') o = '<div class="mood storm"><i class="bolt"></i><i class="rainy"></i></div>';
    else if (mood === 'forest') o = '<svg viewBox="0 0 400 190" class="mood forest" preserveAspectRatio="xMidYMax slice"><g fill="#07130a">' + [10, 50, 90, 130, 300, 340, 380].map(function (x) { return '<path d="M' + x + ' 190V120q-4-22 12-40 14 18 12 40v70z"/><path d="M' + (x + 12) + ' 70l18 40h-36z"/>'; }).join('') + '</g><rect x="196" y="100" width="8" height="30" fill="#1a1408"/><path d="M190 104l10-12 10 12z" fill="#1a1408"/><rect x="150" y="120" width="100" height="70" fill="rgba(3,8,4,.5)"/></svg>';
    else if (mood === 'shadow') o = '<div class="mood shadow"></div>';
    else if (mood === 'crater') { var s = G.trialStatus(), reb = s ? s.got : 0; o = '<svg viewBox="0 0 400 190" class="mood crater" preserveAspectRatio="xMidYMax slice"><ellipse cx="200" cy="172" rx="190" ry="26" fill="#120c08"/><ellipse cx="200" cy="170" rx="150" ry="16" fill="#080503"/>' + [30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360].map(function (x, i) { return i < reb ? '<g class="roof" style="--d:' + (i * .08) + 's"><rect x="' + (x - 9) + '" y="150" width="18" height="16" fill="#0a0d14"/><path d="M' + (x - 12) + ' 152l12-12 12 12z" fill="#1a2030"/></g>' : '<path d="M' + (x - 8) + ' 166l4-8 6 4 4-10 4 14z" fill="#1a140e"/>'; }).join('') + '</svg>'; }
    else if (mood === 'myoboku') o = '<svg viewBox="0 0 400 190" class="mood myo" preserveAspectRatio="xMidYMax slice"><path d="M0 190V130q40-60 90-40t60 30q40-30 80-10 40 20 60-20 40-40 110 0v100z" fill="#0b1f14"/><path d="M210 150a22 22 0 1 1 44 0z" fill="#1f3a26"/>' + G.summonSVG('toad', 60).replace('class="summon', 'x="90" y="84" class="summon myo-toad') + '<g class="oil">' + [120, 200, 280].map(function (x) { return '<circle cx="' + x + '" cy="100" r="3" fill="#ff9a3d"/>'; }).join('') + '</g></svg>';
    else if (mood === 'war') o = '<div class="mood war"><svg viewBox="0 0 400 190" preserveAspectRatio="xMidYMax slice"><g class="smoke">' + [60, 140, 260, 340].map(function (x) { return '<ellipse cx="' + x + '" cy="120" rx="30" ry="14" fill="#000" opacity=".35"/>'; }).join('') + '</g><g class="flags">' + [40, 120, 200, 280, 360].map(function (x, i) { return '<rect x="' + x + '" y="90" width="2" height="40" fill="#eee"/><path d="M' + (x + 2) + ' 92h22l-6 8 6 8h-22z" fill="' + ['#ffd76b', '#7fb8ff', '#c98a6a', '#9a8ee0', '#c9312b'][i] + '"/>'; }).join('') + '</g></svg></div>';
    else if (mood === 'summit') o = '<svg viewBox="0 0 400 190" class="mood summit" preserveAspectRatio="xMidYMax slice"><path d="M0 190L120 60l60 50 40-70 60 80 40-50 80 120z" fill="#0b0e18"/><path d="M120 60l16 14h-32z M220 40l14 14h-28z" fill="#e8ecf5" opacity=".9"/><g class="flags">' + [100, 160, 200, 250, 300].map(function (x, i) { return '<rect x="' + x + '" y="130" width="2" height="24" fill="#eee"/><path d="M' + (x + 2) + ' 131h14l-4 5 4 5h-14z" fill="' + ['#ffd76b', '#7fb8ff', '#c98a6a', '#9a8ee0', '#c9312b'][i] + '"/>'; }).join('') + '</g></svg>';
    else if (mood === 'rock') o = '<svg viewBox="0 0 400 190" class="mood rock" preserveAspectRatio="xMidYMax slice"><path d="M0 150V70Q20 50 50 56q20-20 44-4 20-16 40 4 16 10 14 40l-2 54z" fill="rgba(5,7,14,.85)"/><g fill="none" stroke="#ffd76b" stroke-width="1.6" stroke-linecap="round" class="carve"><path d="M64 80q14-18 30 0"/><path d="M79 86v12"/><path d="M70 104q9 8 18 0"/></g><text x="79" y="126" text-anchor="middle" font-size="9" fill="#ffd76b" class="brush" opacity=".85">' + G.esc(nm) + '</text></svg>';
    var sm = G.activeSummon();
    if (sm && mood !== 'myoboku') o += '<div class="hero-sum sm-pos-' + sm.def.id + '">' + G.summonSVG(sm.def.id, sm.grown ? 96 : 64, sm.grown) + '</div>';
    return o;
  };
  G.applyShadow = function () { var c = G.state.climb; document.body.classList.toggle('shadow', !!(c && c.shadow)); };
  G.on('change', G.applyShadow);

  /* ================= ceremonies: mask reveal & rock carving ================= */
  G.rankCinematic = function (res, cb) {
    var st = G.state, v = G.VILLAGES[st.village], idx = res.promotedIdx; hideNav();
    if (idx === 5 && st.cosmetics.mask) {
      G.render('<div class="cer cin-v maskrv">' + G.embers(12) + '<p class="cer-pre cs1">ROOT · SELECTION</p><div class="cin maskin cs2">' + G.maskSVG(st.cosmetics.mask, 150) + '</div><h2 class="cs3">The mask un-seals.</h2><p class="cer-mn cs3">“You have seen too much to go back.”</p><button class="btn wide cs5" id="rcGo">Wear it</button></div>');
      setTimeout(function () { G.sfx('whoosh'); G.buzz([20, 30, 60]); }, 500);
    } else if (idx === 6) {
      G.render('<div class="cer cin-v rockrv">' + G.embers(16) + '<p class="cer-pre cs1">THE ROCK</p><div class="cin rockin cs2"><svg viewBox="0 0 200 160"><path d="M10 150V60q20-30 50-20 30-30 60-4 30-8 40 30 10 30 0 84z" fill="#232838" stroke="#4a5068" stroke-width="2"/><path d="M30 140V70q15-20 40-14" fill="none" stroke="#3a4056" stroke-width="1.5"/><g fill="none" stroke="#ffd76b" stroke-width="2.4" stroke-linecap="round" class="chisel"><path d="M58 78q22-26 46 0"/><path d="M81 86v18"/><path d="M66 112q15 12 30 0"/><path d="M48 70q33-40 70 0"/></g><text x="100" y="150" text-anchor="middle" font-size="11" fill="#ffd76b" font-family="var(--brush)" letter-spacing="2">' + G.esc((st.sName || {}).k || st.name) + '</text></svg></div><h2 class="cs3">' + v.kage + '.</h2><p class="cer-mn cs3">The village carves your face. Nobody in this village has ever finished the Summit.</p><button class="btn wide cs5" id="rcGo">Take the hat</button></div>');
      setTimeout(function () { G.sfx('rank'); G.buzz([40, 60, 40, 60, 40, 60, 300]); G.confetti([v.glow, '#ffd76b', '#f2ede4', '#c9312b'], 120); }, 600);
      var n = 0, iv = setInterval(function () { n++; G.sfx('handseal'); G.buzz(6); if (n > 10) clearInterval(iv); }, 260);
    } else { cb(); return; }
    $('#rcGo').addEventListener('click', cb);
  };
  /* ================= the card, as an image ================= */
  G.cardImage = function (cb) {
    var st = G.state, v = G.VILLAGES[st.village], ri = G.rankInfo(), lp = G.levelProgress(), nm = st.sName || { k: st.name, r: st.name, m: '' };
    var W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H;
    var x = c.getContext('2d');
    var g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, v.sky[0]); g.addColorStop(.55, '#0a0c14'); g.addColorStop(1, '#05070d');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    /* sun */
    var rg = x.createRadialGradient(W / 2, 300, 20, W / 2, 300, 400); rg.addColorStop(0, v.glow); rg.addColorStop(1, 'rgba(0,0,0,0)');
    x.globalAlpha = .35; x.fillStyle = rg; x.beginPath(); x.arc(W / 2, 300, 400, 0, 7); x.fill(); x.globalAlpha = 1;
    /* mountains */
    x.fillStyle = 'rgba(4,6,12,.85)'; x.beginPath(); x.moveTo(0, 900);
    [[120, 760], [260, 850], [400, 700], [560, 830], [700, 720], [860, 840], [1080, 780]].forEach(function (p2) { x.lineTo(p2[0], p2[1]); });
    x.lineTo(W, H); x.lineTo(0, H); x.closePath(); x.fill();
    /* frame */
    x.strokeStyle = 'rgba(212,176,104,.65)'; x.lineWidth = 4; x.strokeRect(40, 40, W - 80, H - 80);
    x.strokeStyle = 'rgba(212,176,104,.25)'; x.lineWidth = 1.5; x.strokeRect(56, 56, W - 112, H - 112);
    function txt(t, y, size, col, weight, align) { x.fillStyle = col; x.textAlign = align || 'center'; x.font = (weight || '') + ' ' + size + 'px "Yuji Syuku", Georgia, serif'; x.fillText(t, align === 'left' ? 110 : W / 2, y); }
    txt(v.kanji, 210, 128, v.glow);
    txt(v.en.toUpperCase(), 268, 30, 'rgba(255,255,255,.55)');
    txt(nm.k, 430, 104, '#f2ede4');
    txt(nm.r, 492, 40, 'rgba(255,255,255,.75)');
    if (st.epithet) txt('\u300c ' + st.epithet + ' \u300d', 552, 32, '#d4b068');
    txt((st.akatsuki ? 'ROGUE · ' : '') + ri.name.toUpperCase() + (st.clan ? '  ·  ' + st.clan.name.toUpperCase() : ''), 620, 30, '#f2ede4');
    /* stat row */
    var stats = [['LEVEL', String(lp.lvl)], ['CHAIN', String(G.streak())], ['DAYS', String(st.sealedDays)], ['BEST', String(G.bestStreakEver())]];
    stats.forEach(function (s2, i) {
      var cx = 150 + i * 260;
      x.fillStyle = 'rgba(0,0,0,.4)'; x.fillRect(cx - 100, 700, 200, 150);
      x.strokeStyle = 'rgba(255,255,255,.12)'; x.lineWidth = 1; x.strokeRect(cx - 100, 700, 200, 150);
      x.textAlign = 'center'; x.fillStyle = '#f2ede4'; x.font = '64px Georgia, serif'; x.fillText(s2[1], cx, 790);
      x.fillStyle = 'rgba(255,255,255,.5)'; x.font = '22px Georgia, serif'; x.fillText(s2[0], cx, 828);
    });
    if (st.nindo) { txt('\u201c' + (st.nindo.length > 46 ? st.nindo.slice(0, 45) + '\u2026' : st.nindo) + '\u201d', 950, 34, 'rgba(255,255,255,.8)'); }
    var col = G.collection();
    txt('\u26a1 ' + G.fmtN(st.chakra) + '   \u4e21 ' + G.fmtN(st.ryo) + '   \u96c6 ' + col.pct + '%', 1030, 30, 'rgba(255,255,255,.55)');
    /* seal */
    x.fillStyle = 'rgba(201,49,43,.9)'; x.beginPath(); x.arc(W / 2, 1160, 76, 0, 7); x.fill();
    x.fillStyle = '#f2ede4'; x.font = '76px "Yuji Syuku", Georgia, serif'; x.textAlign = 'center'; x.fillText('\u5c01', W / 2, 1188);
    txt('HOKAGE \u2014 the way is showing up', 1280, 26, 'rgba(255,255,255,.45)');
    try { c.toBlob(function (bl) { cb(bl, c); }, 'image/png'); } catch (e) { cb(null, c); }
  };
  G.cardShareSheet = function () {
    var sh = G.sheet('<div class="sh-h"><b>証 Your card</b><small id="ciSub">drawing the register…</small></div><div class="cardimg" id="ciWrap"></div>' +
      '<div class="row2"><button class="btn ghost" id="ciSave">Save image</button><button class="btn" id="ciShare">Share</button></div>');
    G.cardImage(function (blob, canvas) {
      var w = $('#ciWrap', sh.body); if (!w) return;
      w.innerHTML = ''; canvas.style.width = '100%'; canvas.style.borderRadius = '10px'; w.appendChild(canvas);
      var sub = $('#ciSub', sh.body); if (sub) sub.textContent = 'save it, or send it to someone who would understand';
      var url = blob ? URL.createObjectURL(blob) : canvas.toDataURL('image/png');
      $('#ciSave', sh.body).addEventListener('click', function () {
        var a = document.createElement('a'); a.href = url; a.download = 'hokage-' + (G.state.name || 'shinobi').toLowerCase().replace(/\s+/g, '-') + '.png';
        document.body.appendChild(a); a.click(); a.remove(); G.sfx('stamp'); G.toast('Saved to your downloads');
      });
      $('#ciShare', sh.body).addEventListener('click', function () {
        var f = blob ? new File([blob], 'hokage.png', { type: 'image/png' }) : null;
        if (f && navigator.canShare && navigator.canShare({ files: [f] })) {
          navigator.share({ files: [f], text: G.state.sName ? G.state.sName.r + ' — ' + G.rankInfo().name + ' of ' + (G.VILLAGES[G.state.village] || {}).en : 'HOKAGE' }).catch(function () {});
        } else G.toast('Sharing images is not supported here — use Save image');
      });
    });
  };
})(window.HOKAGE = window.HOKAGE || {});
