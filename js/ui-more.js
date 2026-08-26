/* HOKAGE — ui-more: the record, the scrolls, the forge, the pouch, the card. */
(function (G) {
  'use strict';
  var $ = G.$, $$ = G.$$, VIEWS = G._views, render = G.render;
  /* a one-field sheet: the app never calls window.prompt */
  function ask(title, sub, value, placeholder, maxlen, kind) {
    return new Promise(function (resolve) {
      var s = G.sheet('<div class="sh-h"><b>' + title + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</div>' +
        '<input class="inp" id="askI" maxlength="' + (maxlen || 40) + '" value="' + G.esc(value || '') + '" placeholder="' + G.esc(placeholder || '') + '"' + (kind === 'num' ? ' type="number" inputmode="numeric"' : ' autocomplete="off"') + '>' +
        '<div class="row2"><button class="btn ghost" id="askN">Cancel</button><button class="btn" id="askY">Done</button></div>');
      var inp = $('#askI', s.body); setTimeout(function () { try { inp.focus(); inp.select(); } catch (e) {} }, 300);
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') $('#askY', s.body).click(); });
      $('#askN', s.body).addEventListener('click', function () { s.close(function () { resolve(null); }); });
      $('#askY', s.body).addEventListener('click', function () { var v = inp.value; s.close(function () { resolve(v); }); });
    });
  }

  /* ================= the record ================= */
  VIEWS.cal = function (ym) {
    var now = G.clock();
    ym = ym || (now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0'));
    var y = +ym.split('-')[0], mo = +ym.split('-')[1];
    var first = new Date(y, mo - 1, 1), days = new Date(y, mo, 0).getDate(), fdow = first.getDay();
    var prev = mo === 1 ? (y - 1) + '-12' : y + '-' + String(mo - 1).padStart(2, '0');
    var next = mo === 12 ? (y + 1) + '-01' : y + '-' + String(mo + 1).padStart(2, '0');
    var cells = '';
    for (var b = 0; b < fdow; b++) cells += '<span class="cc blank"></span>';
    var st = G.state, mChakra = 0, mRyo = 0;
    for (var d = 1; d <= days; d++) {
      var k = y + '-' + String(mo).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      var seals = G.daySeals(k), day = st.log[k];
      var touched = day && Object.keys(day).some(function (p) { return (day[p].done || []).length; });
      var sh = st.jutsu.used[k];
      var best = 'D'; seals.forEach(function (s) { if (s.rank && G.RANK_ORDER.indexOf(s.rank) > G.RANK_ORDER.indexOf(best)) best = s.rank; mChakra += s.chakra; mRyo += s.ryo; });
      var wkS = st.weeks[G.weekKeys(k)[0]] && G.weekKeys(k)[6] === k;
      cells += '<button class="cc' + (k === G.today() ? ' today' : '') + (seals.length ? ' sealed r-' + best : sh ? ' shield' : '') + '" data-k="' + k + '">' +
        '<span>' + d + '</span>' + (seals.length ? '<i class="brush">' + G.esc(seals[0].sigil || '封') + '</i>' + (seals.length > 1 ? '<em>×' + seals.length + '</em>' : '') : sh ? '<i class="brush shld">身</i>' : touched ? '<i class="dot">·</i>' : '') + (wkS ? '<b class="wks">S</b>' : '') + '</button>';
    }
    var shr = G.PATHS.map(function (pr, pi) {
      var ms = G.pathMastery(pr[0]), mt = G.masteryTier(ms);
      return '<button class="shr' + (ms ? '' : ' dead') + '" data-pi="' + pi + '"><span class="lp-sign' + (mt ? ' mt' + mt : '') + '" style="--pa:' + pr[6] + '">' + G.pathSign(pi) + '</span>' +
        '<small>' + (ms ? '封×' + ms : '—') + '</small></button>';
    }).join('');
    var mSealed = 0, mSeals = 0;
    Object.keys(st.log).forEach(function (k2) {
      if (k2.slice(0, 7) !== ym) return;
      var dd = st.log[k2], any = false;
      Object.keys(dd).forEach(function (p) { if (dd[p].sealed) { mSeals++; any = true; } });
      if (any) mSealed++;
    });
    if (G.calTab === 'in') { insightsView(ym); return; }
    render('<div class="pad"><div class="cal-h"><button class="hb" id="cP" aria-label="Previous month">‹</button><h1>' + G.MONTHS[mo - 1] + ' <span>' + y + '</span></h1><button class="hb" id="cN" aria-label="Next month">›</button></div>' +
      '<div class="rectabs"><button class="rt on" data-t="cal">暦 Calendar</button><button class="rt" data-t="in">析 Insights</button></div>' +
      '<div class="cal-dow">' + G.DOW.map(function (x) { return '<span>' + x[0] + '</span>'; }).join('') + '</div>' +
      '<div class="cal-g">' + cells + '</div>' +
      '<p class="hint c">Each sealed day wears the mark of the scroll that closed it. The border is the mission rank. 身 — a Substitution held the chain.</p>' +
      '<div class="mstats"><span><b>' + mSealed + '</b> days sealed</span><span><b>' + mSeals + '</b> seals</span><span><b>' + G.fmtN(mChakra) + '</b> chakra</span><span><b>' + G.fmtN(mRyo) + '</b> ryō</span><span><b>' + G.streak() + '</b> chain</span><span><b>' + st.sealedDays + '</b> lifetime</span></div>' +
      '<div class="shrine"><small class="shrine-t">神社 THE SHRINE · paths mastered</small><div class="shrine-g">' + shr + '</div></div></div>');
    $$('.rt').forEach(function (b) { b.addEventListener('click', function () { G.calTab = b.dataset.t; G.sfx('tick'); G.go('cal', ym); }); });
    $('#cP').addEventListener('click', function () { G.go('cal', prev); });
    $('#cN').addEventListener('click', function () { G.go('cal', next); });
    $$('.cc[data-k]').forEach(function (el) { el.addEventListener('click', function () { daySheet(el.dataset.k); }); });
    $$('.shr').forEach(function (el) { el.addEventListener('click', function () { pathDetail(+el.dataset.pi); }); });
  };
  function daySheet(k) {
    var seals = G.daySeals(k), logs = G.dayLogs(k);
    var p = k.split('-');
    var rows = seals.length ? seals.map(function (x) {
      var pr = G.state.protocols[x.pid];
      return '<div class="dsr"><span class="brush">' + G.esc(x.sigil || '封') + '</span><b>' + G.esc(pr ? pr.name : x.pid) + '</b>' + (x.rank ? G.rankPill(x.rank) : '') + '<small>' + (x.chakra ? '+' + x.chakra + ' ⚡ · +' + x.ryo + ' 両' : '') + '</small></div>';
    }).join('') : (G.state.jutsu.used[k] ? '<p class="lead">身 Kawarimi — a log took the hit. The chain held.</p>' : '<p class="lead">Nothing sealed this day.</p>');
    var lrows = logs.map(function (l, i) {
      return '<button class="dsl" data-i="' + i + '"><b>' + G.esc(l.name) + '</b><span>' + l.value + '</span><small>tap to edit</small></button>';
    }).join('');
    var s = G.sheet('<div class="sh-h"><b>' + G.MONTHS[+p[1] - 1] + ' ' + (+p[2]) + ', ' + p[0] + '</b></div>' + rows +
      (lrows ? '<small class="lab">✎ LOGGED</small>' + lrows : ''));
    $$('.dsl', s.body).forEach(function (el) {
      el.addEventListener('click', function () {
        var l = logs[+el.dataset.i];
        ask('✎ ' + G.esc(l.name), 'Edit the logged number.', String(l.value), '0', 8, 'num').then(function (cur) {
        if (cur === null) return;
        var num = parseFloat(cur);
        if (!isFinite(num) || num < 0) { G.toast('A number, shinobi'); return; }
        G.setDayLog(k, l.pid, l.name, Math.round(num * 100) / 100);
        s.close(function () { daySheet(k); });
        });
      });
    });
  }

  /* ================= scrolls ================= */
  VIEWS.scrolls = function () {
    function card(pid) {
      var p = G.state.protocols[pid], stt = G.scrollStats(pid);
      var sealed = (G.entry(pid, G.today(), false) || {}).sealed;
      return '<button class="sc' + (p.kind === 'path' ? ' ispath' : '') + (sealed ? ' sealedtoday' : '') + '" data-pid="' + pid + '">' +
        '<span class="sc-k brush">' + G.esc(p.kanji) + '</span>' +
        '<span class="sc-b"><b>' + G.esc(p.name) + (sealed ? ' <i class="sc-seal brush">封</i>' : '') + '</b><small>' + G.esc(p.en || '') + (p.en ? ' · ' : '') + (stt.steps ? stt.steps + ' steps · ~' + stt.mins + ' min · ⚡' + stt.chakra : '<i>blank — tap to write it</i>') + (p.builtin ? ' · base' : '') + '</small></span>' +
        (p.kind === 'path' && n ? '<span class="sc-sh" data-share="' + pid + '">share</span>' : '') + '<span class="sc-go">›</span></button>';
    }
    var scrolls = ['asageiko', 'fuin'].concat(G.userScrolls()).map(card).join('');
    var paths = G.userPaths().map(card).join('');
    render('<div class="pad"><h1>巻物 <span>Scrolls</span></h1>' +
      '<small class="lab">巻 SCROLLS</small>' + scrolls +
      '<button class="btn wide ghost" id="newS">+ Forge a new scroll</button>' +
      '<small class="lab">道 PATHS</small>' + (paths || '<p class="hint">Your own paths live here — forge one or receive a friend\u2019s.</p>') +
      '<div class="row2"><button class="btn ghost" id="newP">+ Forge a path</button><button class="btn ghost" id="shareP">契 Share / receive</button></div>' +
      '<button class="btn wide ghost" id="browseP">道 The character paths</button>' +
      '<small class="lab">倉 THE VAULT</small>' +
      '<div class="row2"><button class="btn ghost" id="vE">Export backup</button><button class="btn ghost" id="vI">Import backup</button></div>' +
      '<button class="btn wide danger ghost" id="vR">Reset everything</button>' +
      '<small class="ver">' + G.VERSION + '</small></div>');
    $$('.sc').forEach(function (el) {
      el.addEventListener('click', function (e) {
        var sh = e.target.closest ? e.target.closest('.sc-sh') : null;
        if (sh) { e.stopPropagation(); shareSheet(sh.dataset.share); return; }
        G.go('forge', el.dataset.pid);
      });
    });
    $('#newS').addEventListener('click', function () { G.go('forge', G.newScroll()); });
    $('#newP').addEventListener('click', function () { G.go('forge', G.newScroll('path')); });
    $('#shareP').addEventListener('click', function () { shareSheet(); });
    $('#browseP').addEventListener('click', browsePaths);
    $('#vE').addEventListener('click', function () {
      var txt = G.exportData();
      (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(
        function () { G.toast('Backup copied — save it somewhere safe'); },
        function () { var bs = G.sheet('<div class="sh-h"><b>倉 Your backup</b><small>Copy was blocked — select all of this and copy it by hand.</small></div><textarea class="inp" rows="6" readonly id="bkT"></textarea>'); $('#bkT', bs.body).value = txt; $('#bkT', bs.body).focus(); $('#bkT', bs.body).select(); });
    });
    $('#vI').addEventListener('click', function () {
      var s = G.sheet('<div class="sh-h"><b>倉 Import backup</b></div><textarea class="inp" id="vT" rows="4" placeholder="Paste your backup here"></textarea><button class="btn wide" id="vGo">Restore</button>');
      $('#vGo', s.body).addEventListener('click', function () {
        try { G.importData($('#vT', s.body).value.trim()); s.close(function () { G.toast('Record restored'); G.applyTheme(); G.go(G.state.village ? 'home' : 'intro'); }); }
        catch (e) { G.toast(e.message); }
      });
    });
    $('#vR').addEventListener('click', function () {
      G.confirm('Reset everything?', 'The record, the scrolls, the pouch, the ryō — all of it. This cannot be undone.', 'Burn it down', 'Keep it', true).then(function (y) { if (y) { G.resetAll(); document.body.removeAttribute('data-village'); G.go('intro'); } });
    });
  };
  function browsePaths() {
    var rows = G.PATHS.map(function (pr, i) {
      var ms = G.pathMastery(pr[0]);
      return '<button class="lp" data-i="' + i + '" style="--pa:' + pr[6] + '"><span class="lp-sign' + (G.masteryTier(ms) ? ' mt' + G.masteryTier(ms) : '') + '">' + G.pathSign(i) + '</span>' +
        '<span class="lp-b"><b>' + G.esc(pr[1]) + (pr[5] ? ' <i class="hard">極</i>' : '') + '</b><small>' + (pr[3] === 'am' ? '朝 morning' : pr[3] === 'pm' ? '夜 night' : '暁 dawn vow') + ' · ' + pr[4].length + ' steps · ' + G.pathTime(i) + (ms ? ' · 封×' + ms : '') + '</small></span>' + G.rankPill(pr[5] ? 'B' : 'C') + '</button>';
    }).join('');
    var s = G.sheet('<div class="sh-h"><b>道 The character paths</b><small>Read any of them — every step, every cue. Copy one to make it yours.</small></div>' + rows);
    $$('.lp', s.body).forEach(function (el) { el.addEventListener('click', function () { s.close(function () { pathDetail(+el.dataset.i); }); }); });
  }
  function pathDetail(i) {
    var pr = G.PATHS[i], ms = G.pathMastery(pr[0]);
    var steps = pr[4].map(function (m, n) {
      if (m.type === 'section') return '<div class="fsec pd-sec"><i></i><b>' + G.esc(m.name) + '</b><i></i></div>';
      var gd = G.guideFor && G.guideFor(m);
      var ico = (gd && gd.cat === 'body') ? '<span class="fthumb">' + G.guideSVG(gd) + '</span>' : '<span class="ficon">' + (G.TYPES[m.type] || G.TYPES.open)[0] + '</span>';
      return '<button class="pdr" data-n="' + n + '"><span class="fnum">' + (n + 1) + '</span>' + ico + '<span class="pd-b"><b>' + G.esc(m.name) + '</b>' + (m.cue ? '<p>' + G.esc(m.cue) + '</p>' : '') + '<small>' + G.meta(m) + (m.log ? ' · logs ' + G.esc(m.log) : '') + (gd ? ' · <em>習 how</em>' : '') + '</small></span></button>';
    }).join('');
    var s = G.sheet('<div class="sh-h" style="--pa:' + pr[6] + '"><span class="lp-sign' + (G.masteryTier(ms) ? ' mt' + G.masteryTier(ms) : '') + '">' + G.pathSign(i) + '</span><b>' + G.esc(pr[1]) + '</b><small>' + G.esc(pr[2]) + ' · ' + G.pathTime(i) + (ms ? ' · 封×' + ms + (ms >= 30 ? ' · grandmaster' : ms >= 7 ? ' · mastered' : ' · ' + (7 - ms) + ' to mastery') : ' · unsealed') + '</small></div>' +
      '<div class="pdlist">' + steps + '</div><button class="btn wide" id="pdC">Copy to my paths</button>', { cls: 'tall' });
    $$('.pdr', s.body).forEach(function (el) { el.addEventListener('click', function () { var m = pr[4][+el.dataset.n]; if (G.stepHasHelp(m)) G.guideSheet(m); }); });
    $('#pdC', s.body).addEventListener('click', function () {
      var pid = G.newScroll('path');
      var p = G.state.protocols[pid], mt = G.materializePath(i);
      p.name = mt.name; p.kanji = mt.kanji; p.en = pr[2]; p.schedule = pr[3] === 'pm' ? 'pm' : 'am';
      p.movements = mt.steps; G.save();
      s.close(function () { G.go('forge', pid); G.toast('The path is yours now'); });
    });
  }
  G.pathDetail = pathDetail;
  function insightsView(ym) {
    var st = G.state, I = G.insights(), col = G.collection(), bp = G.bountyProgress();
    var maxM = Math.max.apply(null, I.months.map(function (m) { return m.days; }).concat([1]));
    var bars = I.months.map(function (m) {
      var lab = G.MONTHS[+m.k.split('-')[1] - 1].slice(0, 3);
      return '<span class="ibar"><i style="height:' + Math.max(4, Math.round(100 * m.days / maxM)) + '%"></i><b>' + m.days + '</b><small>' + lab + '</small></span>';
    }).join('');
    var dowLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    var dows = I.rate.map(function (r, i) {
      var order = st.prefs.weekStart === 'sun' ? i : (i + 6) % 7;
      return { o: order, html: '<span class="idow' + (r >= 80 ? ' hot' : r < 40 ? ' cold' : '') + '"><i style="--p:' + r + '"></i><b>' + r + '%</b><small>' + dowLabels[i] + '</small></span>' };
    }).sort(function (a, b) { return a.o - b.o; }).map(function (x) { return x.html; }).join('');
    var skips = I.skips.length ? I.skips.map(function (s2) { return '<div class="tl"><span>' + G.esc(s2.name) + '</span><b>' + s2.n + '× skipped</b></div>'; }).join('')
      : '<p class="hint c">Nothing skipped in sixty days. Suspicious. Excellent.</p>';
    var paths = I.paths.length ? I.paths.slice(0, 6).map(function (pp) {
      var mt = G.masteryTier(pp.n);
      return '<div class="ipath"><span class="lp-sign' + (mt ? ' mt' + mt : '') + '" style="--pa:' + G.PATHS[pp.i][6] + '">' + G.pathSign(pp.i) + '</span><span><b>' + G.esc(pp.name) + (pp.hard ? ' 極' : '') + '</b><small>' + pp.n + ' seals' + (mt === 2 ? ' · grandmaster' : mt === 1 ? ' · mastered' : '') + '</small></span><i class="ipbar"><i style="width:' + Math.min(100, Math.round(100 * pp.n / 30)) + '%"></i></i></div>';
    }).join('') : '<p class="hint c">No path has been ridden yet. The shrine is empty.</p>';
    var hrs = ['dawn', 'morning', 'afternoon', 'night'], hMax = Math.max.apply(null, I.hours.concat([1]));
    var hours = I.hours.map(function (h, i) { return '<span class="ihr"><i style="width:' + Math.round(100 * h / hMax) + '%"></i><b>' + hrs[i] + '</b><small>' + h + '</small></span>'; }).join('');
    render('<div class="pad"><div class="cal-h"><button class="hb" id="iB" aria-label="Back">‹</button><h1>析 <span>Insights</span></h1><span style="width:38px"></span></div>' +
      '<div class="rectabs"><button class="rt" data-t="cal">暦 Calendar</button><button class="rt on" data-t="in">析 Insights</button></div>' +
      '<div class="igrid"><div><small>DAYS SEALED</small><b>' + I.days + '</b></div><div><small>SEALS</small><b>' + I.seals + '</b></div>' +
      '<div><small>BEST CHAIN</small><b>' + I.best + '</b></div><div><small>CURRENT</small><b>' + I.cur + '</b></div>' +
      '<div><small>CHAKRA EARNED</small><b>' + G.fmtN(st.chakra) + '</b></div><div><small>RYŌ EARNED</small><b>' + G.fmtN(st.ryoEarned) + '</b></div></div>' +
      (I.months.length ? '<small class="lab">月 SEALED DAYS BY MONTH</small><div class="ibars">' + bars + '</div>' : '') +
      '<small class="lab">曜 WHICH DAYS YOU KEEP</small><div class="idows">' + dows + '</div>' +
      '<small class="lab">刻 WHEN YOU SEAL</small><div class="ihrs">' + hours + '</div>' +
      '<small class="lab">影 THE STEPS YOU DODGE <em>· last 60 days</em></small><div class="tlines">' + skips + '</div>' +
      '<small class="lab">道 PATH MASTERY</small><div class="ipaths">' + paths + '</div>' +
      '<small class="lab">集 COLLECTION</small><div class="tlines"><div class="tl' + (col.pct >= 100 ? ' ok' : '') + '"><span>Bazaar &amp; contracts</span><b>' + col.got + ' / ' + col.total + '</b></div>' +
      '<div class="tl' + (bp.got >= bp.total ? ' ok' : '') + '"><span>Bingo Book</span><b>' + bp.got + ' / ' + bp.total + '</b></div>' +
      '<div class="tl"><span>Trials passed</span><b>' + ((st.climb.history || []).filter(function (h) { return h.ev === 'pass'; }).length) + '</b></div></div>' +
      '</div>');
    $('#iB').addEventListener('click', function () { G.calTab = 'cal'; G.go('cal', ym); });
    $$('.rt').forEach(function (b) { b.addEventListener('click', function () { G.calTab = b.dataset.t; G.sfx('tick'); G.go('cal', ym); }); });
  }

  function shareSheet(preId) {
    /* exported below as G.shareSheet */
    var mine = G.userPaths().filter(function (id) { return (G.state.protocols[id].movements || []).length; });
    var rows = mine.map(function (id) {
      var p = G.state.protocols[id];
      return '<div class="lp own share"><span class="lp-k brush">' + G.esc(p.kanji) + '</span>' +
        '<span class="lp-b"><b>' + G.esc(p.name) + '</b><small>' + p.movements.length + ' steps</small></span>' +
        '<button class="spa" data-a="share" data-x="' + id + '">Share</button><button class="spa ghost" data-a="copy" data-x="' + id + '">Copy</button></div>';
    }).join('');
    var s = G.sheet('<div class="sh-h"><b>契 Share a path</b><small>One tap sends the whole path. Receiving is Paste, then done. Sharing claims a bounty.</small></div>' +
      (rows ? '<small class="lab">道 YOUR PATHS</small>' + rows : '<p class="hint">Forge a path with steps, then come share it.</p>') +
      '<small class="lab">受 RECEIVE</small>' +
      '<button class="btn wide" id="spP">Paste from clipboard</button>' +
      '<textarea class="inp" id="spT" rows="3" placeholder="…or paste the code here"></textarea>' +
      '<button class="btn wide ghost" id="spGo">Receive the path</button>');
    function claimed() { var r = { bounties: [] }; G.checkBounties(r, {}); G.save(); if (r.bounties.length) { G.sfx('coin'); G.toast('契 Bounty claimed: The Bond · +' + r.bounties[0].ryo + ' ryō'); } }
    function doShare(id) {
      var p = G.state.protocols[id], code = G.exportPath(id);
      var payload = '道 ' + p.name + ' — a HOKAGE path. Paste this whole message into Scrolls → Share / receive:\n\n' + code;
      if (navigator.share) navigator.share({ text: payload }).then(claimed).catch(function () {});
      else (navigator.clipboard ? navigator.clipboard.writeText(payload) : Promise.reject()).then(
        function () { G.toast('Code copied — send it anywhere'); claimed(); },
        function () { $('#spT', s.body).value = code; });
    }
    $$('.spa', s.body).forEach(function (el) {
      el.addEventListener('click', function () {
        if (el.dataset.a === 'share') doShare(el.dataset.x);
        else (navigator.clipboard ? navigator.clipboard.writeText(G.exportPath(el.dataset.x)) : Promise.reject()).then(
          function () { G.toast('Path code copied'); claimed(); }, function () { $('#spT', s.body).value = G.exportPath(el.dataset.x); });
      });
    });
    function recv(txt) {
      if (!txt) { G.toast('Nothing to receive yet'); return; }
      try { var id = G.importPath(txt); s.close(function () { G.go('forge', id); G.toast('Path received — it is yours now'); }); }
      catch (e) { G.toast(e.message); }
    }
    $('#spP', s.body).addEventListener('click', function () {
      if (!navigator.clipboard || !navigator.clipboard.readText) { G.toast('Paste into the box below instead'); return; }
      navigator.clipboard.readText().then(function (t) { $('#spT', s.body).value = t || ''; recv(t); }, function () { G.toast('Allow paste, or use the box'); });
    });
    $('#spGo', s.body).addEventListener('click', function () { recv($('#spT', s.body).value.trim()); });
    if (preId) doShare(preId);
  }

  /* ================= forge ================= */
  VIEWS.forge = function (pid) {
    var p = G.state.protocols[pid];
    if (!p) { G.go('scrolls'); return; }
    G.forgeSel = {}; G.forgeFilter = '';
    var isPath = p.kind === 'path';
    render('<div class="pad forge"><div class="f-top"><button class="hb" id="fB" aria-label="Back">‹</button>' +
      '<h1>鍛冶場 <span>Forge</span></h1><span class="f-acts"><button class="hb" id="fMore" aria-label="More">⋯</button><button class="hb run" id="fRun" aria-label="Run">▶</button></span></div>' +
      '<div class="fid' + (isPath ? ' ispath' : '') + '">' +
      '<button class="f-kanji brush" id="fK">' + G.esc(p.kanji) + '</button>' +
      '<div class="f-nm"><input class="finp big" id="fN" maxlength="30" value="' + G.esc(p.name) + '" placeholder="' + (isPath ? 'Path name' : 'Scroll name') + '">' +
      '<input class="finp" id="fE" maxlength="40" value="' + G.esc(p.en || '') + '" placeholder="Subtitle"></div></div>' +
      '<div class="f-stats" id="fStats"></div>' +
      '<div class="f-chips" id="fChips"></div>' +
      '<div class="f-tools"><button class="ft" id="fSearchB" aria-label="Find a step">🔍</button><input class="finp fsearch" id="fSearch" placeholder="Find a step…" hidden>' +
      '<button class="ft" id="fSelB">Select</button><button class="ft" id="fSecB">＋ Section</button><span class="ft-sp"></span><button class="ft" id="fUndo" hidden>↶ Undo</button></div>' +
      '<div class="fbulk" id="fBulk" hidden></div>' +
      (G.state.seen.h_forge ? '' : '<p class="fnote" id="fNote">⠿ drag to reorder · tap a step to open it · Select for bulk moves <button class="fnote-x" aria-label="Dismiss">✕</button></p>') +
      '<div class="paper" id="fPaper"></div>' +
      '<div class="qbar"><button class="qb" id="qArch" aria-label="Archive">巻</button><input class="finp qi" id="qI" placeholder="Write a step … \u201cDead hang 45s\u201d or \u201cPush-ups x20\u201d"><button class="qb add" id="qAdd" aria-label="Add">✎</button></div>' +
      '</div>');
    $('#fB').addEventListener('click', function () { G.go('scrolls'); });
    $('#fRun').addEventListener('click', function () { G.launch(pid); });
    $('#fN').addEventListener('input', function () { p.name = this.value.slice(0, 30); G.save(); });
    $('#fE').addEventListener('input', function () { p.en = this.value.slice(0, 40); G.save(); });
    $('#fK').addEventListener('click', function () {
      ask('字 The mark', 'One or two characters — the kanji this ' + (isPath ? 'path' : 'scroll') + ' wears.', p.kanji, '朝', 2).then(function (k) {
        if (k && k.trim()) { G.snapshot(pid, 'the kanji'); p.kanji = k.trim().slice(0, 2); G.save(); G.go('forge', pid); }
      });
    });
    drawChips(pid); drawStats(pid); drawPaper(pid);
    var fn = $('#fNote'); if (fn) $('.fnote-x', fn).addEventListener('click', function () { G.state.seen.h_forge = 1; G.save(); fn.remove(); });
    $('#qAdd').addEventListener('click', function () { quickAdd(pid); });
    $('#qI').addEventListener('keydown', function (e) { if (e.key === 'Enter') quickAdd(pid); });
    $('#qArch').addEventListener('click', function () { archive(pid); });
    $('#fSearchB').addEventListener('click', function () {
      var f = $('#fSearch'); f.hidden = !f.hidden; if (!f.hidden) f.focus(); else { G.forgeFilter = ''; drawPaper(pid); }
    });
    $('#fSearch').addEventListener('input', function () { G.forgeFilter = this.value.toLowerCase(); drawPaper(pid); });
    $('#fSelB').addEventListener('click', function () { G.forgeSelMode = !G.forgeSelMode; G.forgeSel = {}; this.classList.toggle('on', G.forgeSelMode); drawPaper(pid); drawBulk(pid); });
    $('#fSecB').addEventListener('click', function () {
      ask('＋ Section', 'A heading that groups the steps below it. Sections never run and never pay.', '', 'Skin · Body · Mind', 30).then(function (nm) {
        if (!nm || !nm.trim()) return;
        G.snapshot(pid, 'the section');
        p.movements.push(G.mkStep(nm.trim().slice(0, 30), '', { type: 'section' }));
        p.movements[p.movements.length - 1].id = G.uid('m');
        G.save(); G.sfx('tick'); drawStats(pid); drawPaper(pid, true); drawUndo(pid);
      });
    });
    $('#fUndo').addEventListener('click', function () {
      var back = G.undo(); if (back) { G.sfx('flip'); G.toast('Undone'); G.go('forge', back); }
    });
    drawUndo(pid);
    $('#fMore').addEventListener('click', function () { forgeMenu(pid); });
  };
  function drawUndo(pid) { var u = $('#fUndo'); if (!u) return; u.hidden = !G.canUndo(); u.textContent = '↶ Undo ' + G.undoLabel(); }
  function drawStats(pid) {
    var el = $('#fStats'); if (!el) return;
    var st = G.scrollStats(pid), p = G.state.protocols[pid];
    var secs = (p.movements || []).filter(function (m) { return m.type === 'section'; }).length;
    el.innerHTML = '<span><b>' + st.steps + '</b> steps</span><span><b>~' + st.mins + '</b> min</span><span><b>⚡' + st.chakra + '</b> chakra</span>' + (secs ? '<span><b>' + secs + '</b> sections</span>' : '');
  }
  function forgeMenu(pid) {
    var p = G.state.protocols[pid], isPath = p.kind === 'path', st = G.scrollStats(pid);
    var others = ['asageiko', 'fuin'].concat(G.userScrolls(), G.userPaths()).filter(function (x) { return x !== pid && G.state.protocols[x]; });
    var sh = G.sheet('<div class="sh-h"><b class="brush big">' + G.esc(p.kanji) + '</b><b>' + G.esc(p.name) + '</b><small>' + st.steps + ' steps · ~' + st.mins + ' min · ⚡' + st.chakra + '</small></div>' +
      '<button class="btn wide ghost" id="fDup">Duplicate this ' + (isPath ? 'path' : 'scroll') + '</button>' +
      '<button class="btn wide ghost" id="fPrev">Preview the run</button>' +
      (p.builtin ? '' : '<button class="btn wide ghost" id="fShare2">Share it</button>') +
      (p.builtin ? '<button class="btn wide ghost" id="fReset">Reset to the base scroll</button>'
        : '<button class="btn wide danger ghost" id="fDel">Delete this ' + (isPath ? 'path' : 'scroll') + '</button>'));
    $('#fDup', sh.body).addEventListener('click', function () { var id = G.duplicateScroll(pid); G.sfx('stamp'); sh.close(function () { G.go('forge', id); G.toast('Copied — edit freely'); }); });
    $('#fPrev', sh.body).addEventListener('click', function () { sh.close(function () { previewSheet(pid); }); });
    var fs2 = $('#fShare2', sh.body); if (fs2) fs2.addEventListener('click', function () { sh.close(function () { shareSheet(pid); }); });
    var fr = $('#fReset', sh.body); if (fr) fr.addEventListener('click', function () {
      sh.close(function () { G.confirm('Reset ' + G.esc(p.name) + '?', 'Your edits are replaced by the original base scroll.', 'Reset it', 'Keep my edits').then(function (y) { if (y) { G.snapshot(pid, 'the reset'); G.deleteProtocol(pid); G.go('forge', pid); G.toast('The base is restored'); } }); });
    });
    var fd = $('#fDel', sh.body); if (fd) fd.addEventListener('click', function () {
      sh.close(function () { G.confirm('Delete ' + G.esc(p.name) + '?', 'The ' + (isPath ? 'path' : 'scroll') + ' and its steps are gone for good. The calendar record stays.', 'Delete', 'Keep it', true).then(function (y) { if (y) { G.deleteProtocol(pid); G.go('scrolls'); G.toast('Gone'); } }); });
    });
  }
  G.previewSheet = previewSheet;
  function previewSheet(pid) {
    var p = G.state.protocols[pid], st = G.scrollStats(pid), t = 0;
    var rows = (p.movements || []).map(function (m) {
      if (m.type === 'section') return '<div class="pv-sec">' + G.esc(m.name) + '</div>';
      var sec = m.type === 'path' ? 480 : (m.secs > 0 ? m.secs : (m.type === 'reps' ? Math.max(20, (m.reps || 10) * 2.5) : 18)) * (m.sides ? 2 : 1);
      var at = G.fmt(t); t += sec;
      return '<div class="pv-row' + (m.days ? ' sched' : '') + '"><span class="pv-t">' + at + '</span><span class="pv-n">' + G.esc(m.name) + (m.days ? ' <i>' + m.days.map(function (d) { return G.DOW[d]; }).join('') + '</i>' : '') + '</span><small>' + G.meta(m) + '</small></div>';
    }).join('');
    G.sheet('<div class="sh-h"><b>試 Preview</b><small>the whole scroll on one page · ~' + st.mins + ' min end to end</small></div><div class="pv">' + rows + '</div>');
  }
  function drawBulk(pid) {
    var el = $('#fBulk'); if (!el) return;
    var n = Object.keys(G.forgeSel || {}).length;
    if (!G.forgeSelMode) { el.hidden = true; return; }
    el.hidden = false;
    el.innerHTML = '<b>' + n + ' selected</b><button class="ft" data-b="all">All</button><button class="ft" data-b="move"' + (n ? '' : ' disabled') + '>Move…</button><button class="ft" data-b="days"' + (n ? '' : ' disabled') + '>Days…</button><button class="ft danger" data-b="del"' + (n ? '' : ' disabled') + '>Delete</button>';
    $$('[data-b]', el).forEach(function (b) {
      b.addEventListener('click', function () {
        var p = G.state.protocols[pid], keys = Object.keys(G.forgeSel);
        if (b.dataset.b === 'all') { p.movements.forEach(function (m, i) { if (m.type !== 'section') G.forgeSel[i] = 1; }); drawPaper(pid); drawBulk(pid); return; }
        if (b.dataset.b === 'del') {
          G.confirm('Delete ' + keys.length + ' step' + (keys.length > 1 ? 's' : '') + '?', 'You can undo this once.', 'Delete', 'Keep', true).then(function (y) {
            if (!y) return; G.snapshot(pid, keys.length + ' steps');
            keys.map(Number).sort(function (a, b2) { return b2 - a; }).forEach(function (i) { p.movements.splice(i, 1); });
            G.forgeSel = {}; G.save(); G.sfx('whoosh'); drawStats(pid); drawPaper(pid); drawBulk(pid); drawUndo(pid);
          });
          return;
        }
        if (b.dataset.b === 'move') {
          var others = ['asageiko', 'fuin'].concat(G.userScrolls(), G.userPaths()).filter(function (x) { return x !== pid && G.state.protocols[x]; });
          if (!others.length) { G.toast('No other scroll to move into — forge one first'); return; }
          var sh = G.sheet('<div class="sh-h"><b>移 Move ' + keys.length + ' step' + (keys.length > 1 ? 's' : '') + '</b><small>into which scroll?</small></div>' +
            others.map(function (o) { var q = G.state.protocols[o]; return '<button class="lp own" data-mv="' + o + '"><span class="lp-k brush">' + G.esc(q.kanji) + '</span><span class="lp-b"><b>' + G.esc(q.name) + '</b><small>' + G.scrollStats(o).steps + ' steps</small></span></button>'; }).join(''));
          $$('[data-mv]', sh.body).forEach(function (o) {
            o.addEventListener('click', function () {
              G.snapshot(pid, 'the move');
              keys.map(Number).sort(function (a, b2) { return b2 - a; }).forEach(function (i) { G.moveStep(pid, i, o.dataset.mv); });
              G.forgeSel = {}; G.sfx('flip'); sh.close(function () { G.go('forge', pid); G.toast('Moved'); });
            });
          });
          return;
        }
        if (b.dataset.b === 'days') {
          var sh2 = G.sheet('<div class="sh-h"><b>曜 Schedule ' + keys.length + ' step' + (keys.length > 1 ? 's' : '') + '</b><small>tap the days these run · all lit means every day</small></div>' +
            '<div class="fdays big" id="bulkDays">' + [0, 1, 2, 3, 4, 5, 6].map(function (d) { return '<button class="dd" data-d="' + d + '">' + G.DOW[d] + '</button>'; }).join('') + '</div>' +
            '<button class="btn wide" id="bulkGo">Apply</button><button class="btn wide ghost" id="bulkAll">Every day</button>');
          var picked = {};
          $$('[data-d]', sh2.body).forEach(function (d) { d.addEventListener('click', function () { var k = +d.dataset.d; picked[k] = !picked[k]; d.classList.toggle('on', !!picked[k]); }); });
          $('#bulkGo', sh2.body).addEventListener('click', function () {
            var days = Object.keys(picked).filter(function (k) { return picked[k]; }).map(Number);
            if (!days.length || days.length === 7) { G.toast('Pick between one and six days, or use Every day'); return; }
            G.snapshot(pid, 'the schedule');
            keys.map(Number).forEach(function (i) { var m = G.state.protocols[pid].movements[i]; if (m) m.days = days.slice(); });
            G.save(); G.forgeSel = {}; sh2.close(function () { G.go('forge', pid); G.toast('Scheduled'); });
          });
          $('#bulkAll', sh2.body).addEventListener('click', function () {
            G.snapshot(pid, 'the schedule');
            keys.map(Number).forEach(function (i) { var m = G.state.protocols[pid].movements[i]; if (m) delete m.days; });
            G.save(); G.forgeSel = {}; sh2.close(function () { G.go('forge', pid); G.toast('Every day'); });
          });
        }
      });
    });
  }

  function drawChips(pid) {
    var p = G.state.protocols[pid], el = $('#fChips'); if (!el) return;
    var sch = p.schedule === 'am' ? '朝 morning' : p.schedule === 'pm' ? '夜 night' : '随時 anytime';
    el.innerHTML = (p.kind === 'path'
      ? '<button class="chip' + (p.hard ? ' hardchip' : '') + '" id="cHard">' + (p.hard ? '極 hard · grades B' : '並 standard · grades C') + '</button><button class="chip" id="cSch">' + sch + '</button><button class="chip gold" id="cShare">契 share</button>'
      : '<button class="chip" id="cMode">' + (p.mode === 'seal' ? '封 seals the day · 3 merit' : '任 mission · 2 merit') + '</button><button class="chip" id="cSch">' + sch + '</button>');
    var cm = $('#cMode'); if (cm) cm.addEventListener('click', function () { p.mode = p.mode === 'seal' ? 'mission' : 'seal'; G.save(); drawChips(pid); });
    var ch = $('#cHard'); if (ch) ch.addEventListener('click', function () {
      if (!p.hard && !G.state.seen.h_hard) { G.state.seen.h_hard = 1; G.toast('極 is a vow, not a label. Grade it B only if it would earn the name.', 'long'); }
      p.hard = !p.hard; G.save(); G.buzz(6); drawChips(pid);
    });
    $('#cSch').addEventListener('click', function () { p.schedule = p.schedule === 'am' ? 'pm' : p.schedule === 'pm' ? 'any' : 'am'; G.save(); drawChips(pid); });
    var cs = $('#cShare'); if (cs) cs.addEventListener('click', function () { shareSheet(pid); });
  }
  function quickAdd(pid) {
    var p = G.state.protocols[pid], inp = $('#qI');
    var raw = inp.value.trim(); if (!raw) return;
    var m = { id: G.uid('m'), name: raw, cue: '', type: 'open', secs: 0, reps: 10 };
    var tm = raw.match(/(.+?)\s+(\d+)\s*(s|sec|m|min)$/i);
    var rm = raw.match(/(.+?)\s*[x×]\s*(\d+)$/i);
    if (tm) { m.name = tm[1].trim(); m.type = 'timed'; m.secs = (+tm[2]) * (/m/i.test(tm[3]) ? 60 : 1); }
    else if (rm) { m.name = rm[1].trim(); m.type = 'reps'; m.reps = +rm[2]; }
    /* “30 breaths”, “Meditate 5m”, “# Skin” for a section */
    if (/^#\s*/.test(raw)) { m.type = 'section'; m.name = raw.replace(/^#\s*/, '').slice(0, 30); }
    var bm = raw.match(/(.+?)\s+breath(e|ing)?$/i);
    if (bm && m.type === 'open') { m.name = bm[1].trim(); m.type = 'breath'; m.breath = [4, 4, 4, 4, 5]; m.secs = 80; }
    G.snapshot(pid, 'the step');
    p.movements.push(m); G.save(); inp.value = ''; G.sfx('tick');
    drawStats(pid); drawPaper(pid, true); drawUndo(pid);
  }
  function drawPaper(pid, scrollEnd) {
    var p = G.state.protocols[pid], paper = $('#fPaper'); if (!paper) return;
    if (!(p.movements || []).length) {
      paper.innerHTML = '<p class="hint c empty">⛩<br>Blank paper. Write the first step below,<br>or open the 巻 Archive for ready-made work.</p>';
      return;
    }
    var f = G.forgeFilter || '', sel = G.forgeSel || {}, selMode = !!G.forgeSelMode, n = 0;
    var html = p.movements.map(function (m, i) {
      var hit = !f || m.name.toLowerCase().indexOf(f) >= 0 || (m.cue || '').toLowerCase().indexOf(f) >= 0;
      if (m.type === 'section') {
        if (f && !hit) return '';
        return '<div class="frow sec" data-i="' + i + '"><div class="fline sec" data-i="' + i + '"><i class="sec-l"></i><b>' + G.esc(m.name) + '</b><i class="sec-l"></i>' +
          '<span class="fdrag" data-i="' + i + '" aria-label="Drag to reorder">⠿</span></div></div>';
      }
      n++;
      if (f && !hit) return '';
      var gd = G.guideFor && G.guideFor(m);
      var ico = (gd && gd.cat === 'body') ? '<span class="fthumb">' + G.guideSVG(gd) + '</span>' : '<span class="ficon">' + (G.TYPES[m.type] || G.TYPES.open)[0] + '</span>';
      var glyphs = (m.days ? '<i class="fg" title="scheduled">' + m.days.map(function (d) { return G.DOW[d][0]; }).join('') + '</i>' : '') + (m.log ? '<i class="fg">✎ ' + G.esc(m.log) + '</i>' : '') + (m.opt ? '<i class="fg">optional</i>' : '') + (m.dogu && G.dogu(m.dogu) ? '<i class="fg">具</i>' : '') + ((m.ref && m.ref.url) || m.img ? '<i class="fg">⧉</i>' : '');
      var meta = m.type === 'path' ? '⛩ path slot' : G.meta(m);
      return '<div class="frow' + (sel[i] ? ' picked' : '') + (m.type === 'path' ? ' slot' : '') + '" data-i="' + i + '">' +
        '<div class="fline" data-i="' + i + '">' +
        (selMode ? '<span class="fsel' + (sel[i] ? ' on' : '') + '" data-sel="' + i + '"></span>' : '<span class="fnum">' + n + '</span>') +
        ico +
        '<span class="fbody"><b>' + G.esc(m.name) + '</b><span class="fmeta"><em>' + meta + '</em><i class="fg ck">⚡' + G.stepChakra(m, false) + '</i>' + glyphs + '</span></span>' +
        '<span class="fdrag" data-i="' + i + '" aria-label="Drag to reorder">⠿</span></div></div>';
    }).join('');
    paper.innerHTML = html || '<p class="hint c empty">Nothing matches “' + G.esc(f) + '”</p>';
    wirePaper(pid);
    if (scrollEnd) { var last = $('.frow:last-child', paper); if (last && last.scrollIntoView) last.scrollIntoView({ block: 'center' }); }
  }
  /* the step editor: a full sheet, one thing per row, saves as you type */
  function stepSheet(pid, i) {
    var p = G.state.protocols[pid], m = p.movements[i]; if (!m) return;
    if (m.type === 'section') return sectionSheet(pid, i);
    if (m.type === 'path') { G.toast('The path slot is where your character path runs — drag it to move it'); return; }
    var sh = G.sheet(editorHTML(m, i, p), { cls: 'tall' });
    wireEditor(sh, pid, i);
    G.sfx('flip');
  }
  function sectionSheet(pid, i) {
    var p = G.state.protocols[pid], m = p.movements[i];
    var sh = G.sheet('<div class="sh-h"><b>— Section</b><small>groups the steps below it · never runs, never pays</small></div>' +
      '<input class="inp" id="secN" maxlength="30" value="' + G.esc(m.name) + '" placeholder="Section name">' +
      '<div class="row2"><button class="btn danger ghost" id="secDel">Remove section</button><button class="btn" id="secOk">Done</button></div>');
    $('#secN', sh.body).addEventListener('input', function () { m.name = this.value.slice(0, 30); G.save(); });
    $('#secOk', sh.body).addEventListener('click', function () { sh.close(function () { drawPaper(pid); }); });
    $('#secDel', sh.body).addEventListener('click', function () { G.snapshot(pid, 'the section'); p.movements.splice(i, 1); G.save(); G.sfx('whoosh'); sh.close(function () { drawStats(pid); drawPaper(pid); drawUndo(pid); }); });
  }
  function editorHTML(m, i, p) {
    var types = Object.keys(G.TYPES).filter(function (t) { return t !== 'path' && t !== 'section'; }).map(function (t) {
      return '<button class="tch' + (m.type === t ? ' on' : '') + '" data-t="' + t + '"><i>' + G.TYPES[t][0] + '</i>' + G.TYPES[t][1] + '</button>';
    }).join('');
    var gadget = '';
    if (m.type === 'timed') {
      gadget = '<div class="fpre">' + [15, 30, 45, 60, 90, 120, 180, 300, 600].map(function (v) {
        return '<button class="pch' + (m.secs === v ? ' on' : '') + '" data-v="' + v + '">' + G.fmt(v) + '</button>';
      }).join('') + '<button class="pch' + ([15, 30, 45, 60, 90, 120, 180, 300, 600].indexOf(m.secs) < 0 ? ' on' : '') + '" data-v="c">' + ([15, 30, 45, 60, 90, 120, 180, 300, 600].indexOf(m.secs) < 0 ? G.fmt(m.secs) + ' ✎' : 'custom…') + '</button></div>' +
        '<button class="fa2 wide' + (m.sides ? ' on' : '') + '" data-v="sd">⇄ Two sides — the chime flips you halfway' + (m.sides ? ' · ON' : '') + '</button>';
    } else if (m.type === 'reps') {
      gadget = '<div class="frep"><button class="rb" data-r="-5">−5</button><button class="rb" data-r="-1">−</button><b id="repN">' + m.reps + '</b><button class="rb" data-r="1">+</button><button class="rb" data-r="5">+5</button></div>' +
        '<p class="hint">Write “tap” in the cue to turn the reps into counted sets — one tap per set.</p>';
    } else if (m.type === 'breath') {
      var b = m.breath || [4, 4, 4, 4, 4];
      gadget = '<div class="fbre">' + ['in', 'hold', 'out', 'hold', 'rounds'].map(function (lab, bi) {
        return '<span class="bc"><small>' + lab + '</small><button class="rb sm" data-b="' + bi + '" data-d="-1">−</button><b data-bv="' + bi + '">' + b[bi] + '</b><button class="rb sm" data-b="' + bi + '" data-d="1">+</button></span>';
      }).join('') + '</div><p class="hint" id="bTot">' + G.fmt(m.secs || 0) + ' total</p>';
    }
    var days = m.days || [];
    var dayDots = [0, 1, 2, 3, 4, 5, 6].map(function (d) {
      return '<button class="dd' + (!days.length || days.indexOf(d) >= 0 ? ' on' : '') + '" data-d="' + d + '">' + G.DOW[d] + '</button>';
    }).join('');
    var dg = m.dogu && G.dogu(m.dogu), gd = G.guideFor && G.guideFor(m);
    return '<div class="sh-h ed-h"><b class="brush big">鍛</b><b>Step ' + (i + 1) + '</b><small>' + G.esc(p.name) + ' · every change saves itself</small></div>' +
      '<div class="ed">' +
      '<input class="inp" id="edName" maxlength="60" value="' + G.esc(m.name) + '" placeholder="Step name">' +
      '<textarea class="inp cue" id="edCue" rows="2" maxlength="300" placeholder="Cue — the one line you read mid-run">' + G.esc(m.cue || '') + '</textarea>' +
      '<small class="lab">型 TYPE</small><div class="tseg">' + types + '</div>' + gadget +
      '<small class="lab">曜 DAYS <em>· all lit means every day</em></small><div class="fdays">' + dayDots + '</div>' +
      '<small class="lab">習 TEACHING</small>' +
      (gd ? '<button class="gdrow" data-a="guide"><span class="gd-mini">' + G.guideSVG(gd) + '</span><span><b>' + G.esc(gd.t) + '</b><small>the sensei\u2019s demonstration — tap to read it</small></span><i>›</i></button>' : '') +
      '<input class="inp" data-ref="url" maxlength="300" value="' + G.esc((m.ref || {}).url || '') + '" placeholder="⧉ Your own link — a video or article" inputmode="url">' +
      ((m.ref || {}).url ? '<input class="inp" data-ref="note" maxlength="60" value="' + G.esc((m.ref || {}).note || '') + '" placeholder="Label, e.g. \u201cform video\u201d">' : '') +
      '<div class="fmedia" data-img="' + (m.img || '') + '">' + (m.img ? '<span class="fmed-th" id="medTh"></span><button class="fa2 danger" data-a="imgdel">remove photo</button>' : '<button class="fa2 wide" data-a="img">📷 Add your own photo — form, product, setup</button>') + '<input type="file" accept="image/*" id="medFile" hidden></div>' +
      '<small class="lab">具 EXTRAS</small>' +
      '<div class="edx">' +
      '<button class="fa2' + (m.opt ? ' on' : '') + '" data-a="opt">◇ ' + (m.opt ? 'Optional — skipping it keeps the seal' : 'Required') + '</button>' +
      '<button class="fa2' + (m.log ? ' on' : '') + '" data-v="log">✎ ' + (m.log ? 'Logs a number' : 'Log a number after it') + '</button>' +
      (m.log ? '<input class="inp unit" id="fUnit" maxlength="8" value="' + G.esc(m.log) + '" placeholder="unit, e.g. mi">' : '') +
      '<button class="fa2" data-a="tool">具 ' + (dg ? G.esc(dg.slot) + (dg.name ? ' · ' + G.esc(dg.name) : '') : 'Attach a tool from the pouch') + '</button></div>' +
      '<div class="edacts"><button class="fa2" data-a="dup">⎘ Duplicate</button><button class="fa2 danger" data-a="del">Delete step</button></div>' +
      '</div>';
  }
  function wireEditor(sh, pid, i) {
    var p = G.state.protocols[pid], m = p.movements[i], ed = sh.body;
    function redraw() { var cls = 'tall'; var html = editorHTML(m, i, p); ed.innerHTML = '<button class="sheet-x" aria-label="Close">✕</button>' + html; $('.sheet-x', ed).addEventListener('click', function () { sh.close(function () { drawStats(pid); drawPaper(pid); }); }); wireEditor(sh, pid, i); }
    /* the sheet close (x or backdrop) always repaints the paper */
    var x = $('.sheet-x', ed); if (x) { var nx = x.cloneNode(true); x.parentNode.replaceChild(nx, x); nx.addEventListener('click', function () { sh.close(function () { drawStats(pid); drawPaper(pid); }); }); }
    sh.el.addEventListener('click', function (e) { if (e.target === sh.el) setTimeout(function () { drawStats(pid); drawPaper(pid); }, 250); });
    $('#edName', ed).addEventListener('input', function () { m.name = this.value.slice(0, 60); G.save(); });
    $('#edCue', ed).addEventListener('input', function () { m.cue = this.value.slice(0, 300); G.save(); });
    $$('.tch', ed).forEach(function (el) {
      el.addEventListener('click', function () {
        m.type = el.dataset.t;
        if (m.type === 'timed' && !m.secs) m.secs = 60;
        if (m.type === 'breath') { m.breath = m.breath || [4, 4, 4, 4, 4]; m.secs = (m.breath[0] + m.breath[1] + m.breath[2] + m.breath[3]) * m.breath[4]; }
        G.save(); G.sfx('tick'); redraw();
      });
    });
    $$('.pch[data-v]', ed).forEach(function (el) {
      el.addEventListener('click', function () {
        var v = el.dataset.v;
        if (v === 'c') { ask('◷ Custom timer', 'Seconds — up to two hours.', m.secs || 60, '90', 5, 'num').then(function (x) { var n = parseInt(x, 10); if (isFinite(n) && n > 0) { m.secs = Math.min(7200, n); G.save(); } redraw(); }); return; }
        m.secs = +v; G.save(); G.sfx('tick'); redraw();
      });
    });
    $$('[data-v="sd"]', ed).forEach(function (el) { el.addEventListener('click', function () { if (m.sides) delete m.sides; else m.sides = 1; G.save(); redraw(); }); });
    $$('[data-v="log"]', ed).forEach(function (el) { el.addEventListener('click', function () { if (m.log) delete m.log; else m.log = 'mi'; G.save(); redraw(); }); });
    var fu = $('#fUnit', ed); if (fu) fu.addEventListener('input', function () { var v = fu.value.trim().slice(0, 8); if (v) m.log = v; G.save(); });
    $$('.rb[data-r]', ed).forEach(function (el) {
      el.addEventListener('click', function () { m.reps = G.clamp(m.reps + (+el.dataset.r), 1, 500); $('#repN', ed).textContent = m.reps; G.save(); G.buzz(3); });
    });
    $$('.rb[data-b]', ed).forEach(function (el) {
      el.addEventListener('click', function () {
        var bi = +el.dataset.b, d = +el.dataset.d;
        m.breath[bi] = G.clamp(m.breath[bi] + d, bi === 4 ? 1 : 0, 60);
        m.secs = (m.breath[0] + m.breath[1] + m.breath[2] + m.breath[3]) * m.breath[4];
        $('[data-bv="' + bi + '"]', ed).textContent = m.breath[bi]; var bt = $('#bTot', ed); if (bt) bt.textContent = G.fmt(m.secs) + ' total'; G.save();
      });
    });
    $$('.dd', ed).forEach(function (el) {
      el.addEventListener('click', function () {
        var d = +el.dataset.d, days = m.days || [0, 1, 2, 3, 4, 5, 6].slice();
        var ix = days.indexOf(d);
        if (ix >= 0) days.splice(ix, 1); else days.push(d);
        if (!days.length || days.length >= 7) delete m.days; else m.days = days.sort();
        G.save(); G.buzz(3); redraw();
      });
    });
    var gdB = $('[data-a="guide"]', ed); if (gdB) gdB.addEventListener('click', function () { G.guideSheet(m); });
    var imgB = $('[data-a="img"]', ed), fileI = $('#medFile', ed);
    if (imgB) imgB.addEventListener('click', function () { fileI.click(); });
    if (fileI) fileI.addEventListener('change', function () {
      var f = fileI.files && fileI.files[0]; if (!f) return;
      G.mediaIngest(f).then(function (bl) {
        var id = m.img || G.uid('img');
        return G.mediaPut(id, bl).then(function () { m.img = id; G.save(); G.sfx('stamp'); G.toast('Photo attached — it lives on this device'); redraw(); });
      }).catch(function () { G.toast('That image could not be read'); });
    });
    var thumb = $('#medTh', ed);
    if (thumb && m.img) G.mediaURL(m.img).then(function (u) { if (u && thumb) thumb.style.backgroundImage = 'url(' + u + ')'; });
    var imgD = $('[data-a="imgdel"]', ed);
    if (imgD) imgD.addEventListener('click', function () { var id = m.img; delete m.img; G.save(); if (id) G.mediaDel(id); redraw(); });
    $$('[data-ref]', ed).forEach(function (inp) {
      inp.addEventListener('input', function () {
        m.ref = m.ref || { url: '', note: '' };
        m.ref[inp.dataset.ref] = this.value.slice(0, inp.dataset.ref === 'url' ? 300 : 60);
        if (!m.ref.url) delete m.ref; G.save();
      });
      if (inp.dataset.ref === 'url') inp.addEventListener('blur', function () { var had = !!$('[data-ref="note"]', ed); if (!!(m.ref && m.ref.url) !== had) redraw(); });
    });
    var optB = $('[data-a="opt"]', ed); if (optB) optB.addEventListener('click', function () { m.opt = !m.opt; G.save(); G.buzz(4); redraw(); });
    $('[data-a="tool"]', ed).addEventListener('click', function () { toolSheet(pid, m, redraw); });
    $('[data-a="dup"]', ed).addEventListener('click', function () { G.snapshot(pid, 'the copy'); var cp = G.deep(m); cp.id = G.uid('m'); p.movements.splice(i + 1, 0, cp); G.save(); G.sfx('tick'); sh.close(function () { drawStats(pid); drawPaper(pid); drawUndo(pid); G.toast('Duplicated below'); }); });
    $('[data-a="del"]', ed).addEventListener('click', function () { G.snapshot(pid, 'the step'); p.movements.splice(i, 1); G.save(); G.sfx('whoosh'); sh.close(function () { drawStats(pid); drawPaper(pid); drawUndo(pid); G.toast('Deleted — undo is in the toolbar'); }); });
  }
  function wirePaper(pid) {
    var p = G.state.protocols[pid];
    $$('.fline').forEach(function (el) {
      el.addEventListener('click', function (e) {
        if (e.target.closest('.fdrag')) return;
        var i = +el.dataset.i;
        if (G.forgeSelMode && p.movements[i].type !== 'section') {
          G.forgeSel[i] = G.forgeSel[i] ? 0 : 1; if (!G.forgeSel[i]) delete G.forgeSel[i];
          G.buzz(4); drawPaper(pid); drawBulk(pid); return;
        }
        stepSheet(pid, i);
      });
    });
    /* drag-to-reorder: the handle owns the gesture; rows shift live under the thumb */
    $$('.fdrag').forEach(function (h) {
      h.addEventListener('pointerdown', function (e) {
        e.preventDefault(); e.stopPropagation();
        var from = +h.dataset.i, row = h.closest('.frow'), rows = $$('.frow'), rh = row.offsetHeight + 6;
        var startY = e.clientY, cur = from;
        row.classList.add('dragging'); G.buzz(6);
        h.setPointerCapture(e.pointerId);
        function mv(ev) {
          var dy = ev.clientY - startY; row.style.transform = 'translateY(' + dy + 'px)';
          var target = Math.max(0, Math.min(rows.length - 1, from + Math.round(dy / rh)));
          if (target !== cur) { cur = target; G.buzz(3); rows.forEach(function (r, ri) { if (r === row) return; var shift = 0; if (from < target && ri > from && ri <= target) shift = -rh; if (from > target && ri < from && ri >= target) shift = rh; r.style.transform = shift ? 'translateY(' + shift + 'px)' : ''; }); }
        }
        function up() {
          h.removeEventListener('pointermove', mv); h.removeEventListener('pointerup', up); h.removeEventListener('pointercancel', up);
          rows.forEach(function (r) { r.style.transform = ''; r.classList.remove('dragging'); });
          if (cur !== from) { G.snapshot(pid, 'the order'); var m2 = p.movements.splice(from, 1)[0]; p.movements.splice(cur, 0, m2); G.save(); G.sfx('tick'); drawUndo(pid); }
          drawPaper(pid);
        }
        h.addEventListener('pointermove', mv); h.addEventListener('pointerup', up); h.addEventListener('pointercancel', up);
      });
    });
    drawBulk(pid);
  }
  function toolSheet(pid, m, after) {
    var rows = G.doguIds().map(function (id) {
      var d = G.dogu(id);
      return '<button class="lp" data-id="' + id + '"><span class="lp-k">具</span><span class="lp-b"><b>' + G.esc(d.slot) + '</b><small>' + G.esc(d.name || 'no product yet') + '</small></span></button>';
    }).join('');
    var s = G.sheet('<div class="sh-h"><b>具 Attach a tool</b></div>' + rows + (m.dogu ? '<button class="btn wide ghost" id="tNone">Detach the tool</button>' : ''));
    $$('.lp', s.body).forEach(function (el) { el.addEventListener('click', function () { m.dogu = el.dataset.id; G.save(); s.close(function () { if (after) after(); else drawPaper(pid); }); }); });
    var tn = $('#tNone', s.body); if (tn) tn.addEventListener('click', function () { delete m.dogu; G.save(); s.close(function () { if (after) after(); else drawPaper(pid); }); });
  }
  function archive(pid) {
    var p = G.state.protocols[pid];
    var secs = G.LIB.map(function (sec, si) {
      return '<small class="lab">' + G.esc(sec[0]) + '</small>' + sec[1].map(function (st, i) {
        var gd = G.guideFor && G.guideFor(st);
        return '<button class="ar" data-s="' + si + '" data-i="' + i + '">' + ((gd && gd.cat === 'body') ? '<span class="fthumb">' + G.guideSVG(gd) + '</span>' : '<span class="ficon">' + (G.TYPES[st.type] || G.TYPES.open)[0] + '</span>') + '<span class="ar-b"><b>' + G.esc(st.name) + '</b><small>' + G.meta(st) + (st.dogu ? ' · 具' : '') + (st.cue ? ' · ' + G.esc(st.cue) : '') + '</small></span></button>';
      }).join('');
    }).join('');
    var paths = '<small class="lab">道 THE CHARACTER PATHS — copy whole</small>' + G.PATHS.map(function (pr, i) {
      return '<button class="ar path" data-p="' + i + '" style="--pa:' + pr[6] + '"><b>' + G.esc(pr[0]) + ' ' + G.esc(pr[1]) + '</b><small>' + pr[4].length + ' steps · ' + G.pathTime(i) + '</small></button>';
    }).join('');
    var s = G.sheet('<div class="sh-h"><b>巻 The Archive</b><small>Tap a step to add it to ' + G.esc(p.name) + '.</small></div>' + secs + paths);
    $$('.ar[data-s]', s.body).forEach(function (el) {
      el.addEventListener('click', function () {
        var st = G.LIB[+el.dataset.s][1][+el.dataset.i];
        var m = G.deep(st); m.id = G.uid('m');
        if (m.breath) m.secs = (m.breath[0] + m.breath[1] + m.breath[2] + m.breath[3]) * m.breath[4];
        p.movements.push(m); G.save();
        drawPaper(pid, true); drawStats(pid);
        G.toast('“' + m.name + '” added');
      });
    });
    $$('.ar[data-p]', s.body).forEach(function (el) {
      el.addEventListener('click', function () {
        var mt = G.materializePath(+el.dataset.p);
        p.movements = p.movements.concat(mt.steps); G.save();
        s.close(function () { drawPaper(pid, true); G.toast(mt.name + ' written in whole'); });
      });
    });
  }

  /* ================= pouch ================= */
  VIEWS.pouch = function () {
    var toBuy = G.doguIds().filter(function (id) { return !G.dogu(id).owned; }).length;
    var secs = G.CATS.map(function (c) {
      var rows = G.doguIds().filter(function (id) { return G.dogu(id).cat === c[0]; }).map(function (id) {
        var d = G.dogu(id);
        return '<div class="pc' + (d.owned ? ' owned' : '') + '" data-id="' + id + '">' +
          '<button class="pck" data-a="own" aria-label="Owned">' + (d.owned ? '✓' : '') + '</button>' +
          (d.owned ? '<span class="pdone brush">済</span>' : '') +
          '<div class="pcb" data-a="edit"><b>' + G.esc(d.slot) + '</b><small>' + (d.name ? G.esc(d.name) : '<i>no product chosen</i>') + '</small>' +
          (G.doguRefs(id) ? '<em>in ' + G.doguRefs(id) + ' step' + (G.doguRefs(id) > 1 ? 's' : '') + '</em>' : '') + '</div>' +
          (!d.owned ? '<a class="pcbuy" href="' + G.esc(G.doguBuy(d)) + '" target="_blank" rel="noopener">buy ›</a>' : '') + '</div>';
      }).join('');
      var ghosts = G.doguShelf(c[0]).map(function (slot) { return '<button class="pcg" data-slot="' + G.esc(slot) + '" data-cat="' + c[0] + '">+ ' + G.esc(slot) + '</button>'; }).join('');
      return '<small class="lab">' + c[1] + ' ' + c[2].toUpperCase() + '</small>' + rows + (ghosts ? '<div class="ghosts">' + ghosts + '</div>' : '');
    }).join('');
    var total = G.doguIds().length, owned = total - toBuy;
    render('<div class="pad"><h1>道具袋 <span>Pouch</span></h1>' +
      '<div class="pouchbar"><i style="width:' + Math.round(100 * owned / Math.max(1, total)) + '%"></i><b>' + owned + ' / ' + total + ' owned</b></div>' +
      (toBuy ? '<p class="lead">' + toBuy + ' tool' + (toBuy > 1 ? 's' : '') + ' still to buy — every buy › link is live. The full kit claims a bounty.</p>' : '<p class="lead">The kit is complete. 具 Full Pouch is yours.</p>') + secs + '</div>');
    $$('.pc').forEach(function (el) {
      el.addEventListener('click', function (e) {
        if (e.target.closest('.pcbuy')) return;
        var id = el.dataset.id, d = G.dogu(id);
        if (e.target.closest('.pck')) {
          d.owned = !d.owned; G.save(); G.sfx(d.owned ? 'coin' : 'tick');
          var r = { bounties: [] }; G.checkBounties(r, {}); G.save();
          if (r.bounties.length) G.toast('具 Bounty claimed: Full Pouch · +' + r.bounties[0].ryo + ' ryō');
          G.go('pouch'); return;
        }
        doguEdit(id);
      });
    });
    $$('.pcg').forEach(function (el) { el.addEventListener('click', function () { doguEdit(G.doguEnsure(el.dataset.slot, el.dataset.cat)); }); });
  };
  function doguEdit(id) {
    var d = G.dogu(id);
    var s = G.sheet('<div class="sh-h"><b>具 ' + G.esc(d.slot) + '</b></div>' +
      '<input class="inp" id="dgN" maxlength="60" value="' + G.esc(d.name) + '" placeholder="Product name (Buy › searches this)">' +
      '<input class="inp" id="dgU" maxlength="300" value="' + G.esc(d.url) + '" placeholder="Direct link (optional)">' +
      '<div class="row2"><button class="btn ghost danger" id="dgDel">Remove</button><button class="btn" id="dgS">Save</button></div>');
    $('#dgS', s.body).addEventListener('click', function () {
      d.name = $('#dgN', s.body).value.slice(0, 60);
      var u = $('#dgU', s.body).value.trim();
      d.url = /^https?:\/\//.test(u) ? u.slice(0, 300) : '';
      G.save(); s.close(function () { G.go('pouch'); });
    });
    $('#dgDel', s.body).addEventListener('click', function () { delete G.state.dogu.items[id]; G.save(); s.close(function () { G.go('pouch'); }); });
  }

  function copyOut(txt, ok, fail) {
    try { navigator.clipboard.writeText(txt).then(ok, function () { fallback(); }); } catch (e) { fallback(); }
    function fallback() { try { var ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); ok(); } catch (e) { fail(); } }
  }

  G.shareSheet = shareSheet;

  /* ================= the card ================= */
  VIEWS.card = function (open) {
    var st = G.state, v = G.VILLAGES[st.village], ri = G.rankInfo(), lp = G.levelProgress(), sen = G.sensei(), fr = G.cosmetic('frame');
    var wp = G.cosmetic('weapon'), ck = G.cosmetic('cloak'), sm = G.activeSummon(), spec = (st.climb.spec || []).map(function (k) { return G.TRACKS[k].kanji; }).join(' ');
    /* dock badges: what is worth tapping right now */
    var afford = G.BAZAAR.filter(function (it) { return ['charge', 'epithet', 'reroll', 'maskinfo'].indexOf(it.kind) < 0 && st.cosmetics.owned.indexOf(it.id) < 0 && G.canBuy(it).ok; }).length +
      G.SUMMONS.filter(function (S) { var ss = G.summonState(S.id); return ss.unlocked && !ss.owned && (S.vault || st.ryo >= S.price); }).length;
    var nextJ = G.JUTSU.filter(function (j) { return !j.streak && j.lvl > G.level(); })[0];
    if (nextJ && G.levelNeed(nextJ.lvl) - st.chakra > 60) nextJ = null;
    var bp = G.bountyProgress(), jl = G.jutsuList(), jOn = jl.filter(function (x) { return x.on; }).length;
    var ak = ri.idx >= 5 ? '<button class="akrow' + (st.akatsuki ? ' on' : '') + '" id="akB"><span class="ak-c"><svg viewBox="0 0 60 40"><path d="M14 26Q8 26 8 20 8 13 16 13 18 5 28 5 37 5 39 13 48 12 50 19 52 26 44 27 40 33 32 31 26 35 19 31 14 31 14 26Z" fill="#c9312b" stroke="#f2ede4" stroke-width="2.5"/></svg></span>' +
      '<span><b>' + (st.akatsuki ? 'Walking the rogue path' : 'The red clouds beckon') + '</b><small>' + (st.akatsuki ? 'Scratched headband, red sky. Tap to return.' : 'ANBU may defect. The headband is scratched; the record stays.') + '</small></span></button>' : '';
    render('<div class="pad"><h1>認可証 <span>Registration</span></h1>' +
      '<div class="reg t-' + st.clan.tier + (st.akatsuki ? ' rogue' : '') + (fr ? ' fr-' + fr.val : '') + (ck ? ' ck-' + ck.val : '') + (G.sageMode() ? ' sage' : '') + '"><div class="reg-foil"></div>' +
      (wp ? '<div class="reg-wpn">' + G.weaponSVG(wp.id) + '</div>' : '') + (sm ? '<div class="reg-sum">' + G.summonSVG(sm.def.id, 64, sm.grown) + '</div>' : '') +
      '<div class="reg-top">' + G.crest(66) + '<div class="reg-n"><b class="brush regk">' + G.esc((st.sName || {}).k || st.name) + '</b>' +
      '<b>' + G.esc((st.sName || {}).r || st.name) + '</b><span>' + G.esc(st.name) + ' · ' + v.kanji + ' ' + v.en + ' · ' + G.esc(st.reg || '') + '</span>' +
      (((st.sName || {}).m) ? '<small class="regm">「 ' + G.esc(st.sName.m) + ' 」</small>' : '') + '</div></div>' +
      (st.epithet ? '<p class="reg-epi">「 ' + G.esc(st.epithet) + ' 」</p>' : '') +
      '<button class="reg-nindo" id="ndB">' + (st.nindo ? '<small>NINDŌ</small><b>' + G.esc(st.nindo) + '</b>' : '<small>NINDŌ</small><b class="dim">Write the one line you live by ›</b>') + '</button>' +
      '<div class="reg-clan">' + G.clanEmblem(st.clan.id, 'onreg') + '<b>Clan ' + G.esc(st.clan.name) + '</b><span class="tierb t-' + st.clan.tier + '">' + st.clan.tier + '</span><small>' + G.esc(st.clan.perk) + '</small></div>' +
      '<div class="reg-g"><div><small>RANK</small><b>' + (st.akatsuki ? 'Rogue · ' : '') + ri.name + (spec ? ' <em class="brush">' + spec + '</em>' : '') + '</b></div><div><small>LEVEL</small><b>' + lp.lvl + ' <em>· ' + G.fmtN(st.chakra) + ' ⚡</em></b></div>' +
      '<div><small>MERIT</small><b>' + st.score + '</b></div><div><small>RYŌ</small><b>' + G.fmtN(st.ryo) + ' <em>· ' + G.fmtN(st.ryoEarned) + ' earned</em></b></div>' +
      '<div><small>MISSIONS</small><b>' + st.missions + '</b></div><div><small>DAYS SEALED</small><b>' + st.sealedDays + '</b></div></div>' +
      '<button class="reg-climb" id="rcB"><span><b>The Climb</b><small>' + G.esc(G.climbCard().title) + ' · ' + G.esc(G.climbCard().sub) + '</small></span></button></div>' + ak +
      '<div class="cgrid">' +
      '<button class="cg" id="cgJ"><span class="brush">術</span><b>Jutsu</b><small>' + jOn + ' / ' + jl.length + ' awakened</small>' + (nextJ ? '<i class="cg-b soon">L' + nextJ.lvl + '</i>' : '') + '</button>' +
      '<button class="cg" id="cgB"><span class="brush">賞</span><b>Bingo Book</b><small>' + bp.got + ' / ' + bp.total + ' bounties</small></button>' +
      '<button class="cg" id="cgS"><span class="brush">師</span><b>Sensei</b><small>' + (sen ? sen.name : 'none yet') + '</small></button>' +
      '<button class="cg" id="cgL"><span class="brush">文</span><b>Letters</b><small>' + st.letters.length + ' from the ' + v.kage + '</small></button>' +
      '<button class="cg" id="cgM"><span class="brush">市</span><b>Bazaar</b><small>' + G.fmtN(st.ryo) + ' ryō · ' + G.collection().pct + '%</small>' + (afford ? '<i class="cg-b">' + afford + '</i>' : '') + '</button>' +
      '<button class="cg" id="cgX"><span class="brush">設</span><b>Settings</b><small>day start · comfort · vault</small></button></div>' +
      '<button class="btn wide ghost cardshare" id="cgIMG">証 Save or share your card as an image</button>' +
      '<small class="lab">道 THE CLIMB — what each rank unlocks</small><div class="climb">' + climbRows() + '</div></div>');
    var akb = $('#akB'); if (akb) akb.addEventListener('click', function () { st.akatsuki = !st.akatsuki; G.save(); G.sfx(st.akatsuki ? 'whoosh' : 'chime'); var r = { bounties: [] }; G.checkBounties(r, {}); G.save(); G.go('card'); if (r.bounties.length) G.toast('暁 Bounty claimed: Red Clouds'); });
    $('#ndB').addEventListener('click', nindoSheet); $('#rcB').addEventListener('click', function () { G.trialSheet(); });
    $('#cgJ').addEventListener('click', jutsuSheet); $('#cgB').addEventListener('click', bingoSheet); $('#cgS').addEventListener('click', senseiSheet);
    $('#cgIMG').addEventListener('click', function () { G.cardShareSheet(); });
    $('#cgL').addEventListener('click', lettersSheet); $('#cgM').addEventListener('click', function () { G.bazaarSheet(); }); $('#cgX').addEventListener('click', settingsSheet);
    if (open === 'sensei') senseiSheet();
  };
  function climbRows() {
    var st = G.state;
    var UNLOCKS = ['The register opens — your scrolls, your record, your climb', 'The village counts your missions · streak fire begins', 'A name people repeat — the record deepens', 'The crest earns the HAT silhouette + silver plate', 'Your EPITHET is forged — the village names you', 'GOLD plate · the red clouds beckon — Akatsuki unlocks', 'The summit — the ' + ((G.VILLAGES[st.village] || {}).kage || 'Kage') + '’s own title'];
    return G.RANKS.map(function (r, i) {
      var lk = i > st.rankIdx, ex = G.TRIALS[i];
      return '<div class="cl-row' + (lk ? ' locked' : '') + (i === st.rankIdx ? ' now' : '') + '">' +
        '<span class="brush">' + (ex ? ex.kanji : '学') + '</span>' +
        '<span class="cl-b"><b>' + r[0] + '</b><small>' + UNLOCKS[i] + (ex ? ' · <i>' + ex.name + '</i>' : '') + '</small></span>' +
        '<span class="cl-m"><b>' + (lk ? (i === st.rankIdx + 1 ? '次' : '鎖') : '✓') + '</b><small>' + (lk ? (i === st.rankIdx + 1 ? 'NEXT' : 'LOCKED') : 'EARNED') + '</small></span></div>';
    }).join('');
  }
  function nindoSheet() {
    var s = G.sheet('<div class="sh-h"><b>忍道 Your nindō</b><small>One line. It shows on the card and speaks in every vow step.</small></div>' +
      '<textarea class="inp" id="ndT" rows="2" maxlength="120" placeholder="e.g. I never go back on my word">' + G.esc(G.state.nindo) + '</textarea><button class="btn wide" id="ndGo">Swear it</button>');
    $('#ndGo', s.body).addEventListener('click', function () { G.state.nindo = $('#ndT', s.body).value.trim().slice(0, 120); G.save(); G.sfx('stamp'); s.close(function () { G.go('card'); }); });
  }
  function jutsuSheet() {
    var st = G.state, L = G.level();
    var rows = G.jutsuList().map(function (x) {
      var j = x.j, extra = '';
      if (j.id === 'kawarimi' && x.on) extra = '<span class="ju-chg">charges <b>' + st.jutsu.charges + '</b> / ' + G.kawarimiMax() + ' · one every ' + G.kawarimiEvery() + ' sealed days</span>';
      if (j.id === 'rasengan' && x.on) extra = '<span class="ju-chg">spun <b>' + st.jutsu.rasengans + '</b> times</span>';
      if (j.id === 'sage') extra = '<span class="ju-chg">chain <b>' + G.streak() + '</b> / 30</span>';
      return '<div class="ju-row' + (x.on ? ' on' : '') + '" style="--ja:' + j.color + '"><span class="brush">' + j.kanji + '</span><span><b>' + j.name + '</b><small>' + j.sub + '</small><em>' + (x.on ? j.how : j.streak ? 'needs a ' + j.streak + '-day chain' : 'awakens at level ' + j.lvl + (L < j.lvl ? ' · ' + G.fmtN(G.levelNeed(j.lvl) - st.chakra) + ' chakra away' : '')) + '</em>' + extra + '</span></div>';
    }).join('');
    G.sheet('<div class="sh-h"><b>術 Jutsu</b><small>Level ' + L + '. Chakra comes from every stamped step; each jutsu changes the game for real.</small></div>' + rows);
  }
  function bingoSheet() {
    var st = G.state, bp = G.bountyProgress(), byakugan = !!G.clanPerk('seeAll');
    var prog = byakugan ? G.bountyEyes() : {};
    var rows = G.BOUNTIES.map(function (b) {
      var got = st.bounties[b[0]], eye = !got && prog[b[0]] ? '<i class="bb-eye">' + prog[b[0]] + '</i>' : '';
      return '<div class="bb' + (got ? ' on' : '') + '"><span class="brush">' + b[1] + '</span><span><b>' + b[2] + '</b><small>' + b[3] + '</small>' + eye + '</span><em>' + (got ? '<span class="brush">済</span>' : G.fmtN(b[4]) + ' 両') + '</em></div>';
    }).join('');
    if (!bp.got) rows = '<p class="hint c empty">賞<br>Thirty bounties are listed on your own deeds.<br>The first one — <b>First Blood</b> — pays the moment you seal a single day.</p>' + rows;
    G.sheet('<div class="sh-h"><b>賞 The Bingo Book</b><small>' + bp.got + ' of ' + bp.total + ' claimed' + (byakugan ? ' · 白眼 the Byakugan sees your progress' : '') + '. Every one pays ryō on the spot.</small></div>' + rows);
  }
  function senseiSheet() {
    var sen = G.sensei();
    if (!sen) { G.senseiPick('card'); return; }
    var lines = sen.lines.map(function (l) { return '<p class="quote sm">\u201c' + l + '\u201d</p>'; }).join('');
    var s = G.sheet('<div class="sh-h"><b class="brush big" style="color:' + sen.acc + '">' + sen.kanji + '</b><b>' + sen.name + ', ' + sen.title + '</b><small>perk: ' + sen.perk + '</small></div>' + lines +
      '<button class="btn wide ghost" id="senCh">Train under someone else</button>');
    $('#senCh', s.body).addEventListener('click', function () { s.close(function () { G.senseiPick('card'); }); });
  }
  function lettersSheet() {
    var st = G.state, v = G.VILLAGES[st.village];
    var rows = st.letters.slice().sort(function (a, b) { return b - a; }).map(function (i) {
      var L = G.LETTERS[i]; if (!L) return '';
      return '<div class="letter-p sm"><span class="brush lt-k">' + L.k + '</span><b>' + L.t + '</b><p>' + L.body + '</p><small>— the ' + v.kage + '</small></div>';
    }).join('');
    G.sheet('<div class="sh-h"><b>文 Letters from the ' + v.kage + '</b><small>One at enrollment, one at every promotion.</small></div>' + rows);
  }
  function settingsSheet() {
    var p = G.state.prefs;
    function row(id, k, lab, sub, on) { return '<button class="setrow' + (on ? ' on' : '') + '" data-k="' + k + '" data-id="' + id + '"><span class="brush">' + id + '</span><span><b>' + lab + '</b><small>' + sub + '</small></span><i class="sw"></i></button>'; }
    function chips(k, opts, cur) { return '<div class="chips set">' + opts.map(function (o) { return '<button class="chip' + (o[0] === cur ? ' on' : '') + '" data-ck="' + k + '" data-cv="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div>'; }
    var dayLabel = { 0: 'midnight', 2: '2 AM', 4: '4 AM', 6: '6 AM' };
    var s = G.sheet('<div class="sh-h"><b>設 Settings</b><small>the village, tuned to your life</small></div>' +
      '<small class="lab">刻 RHYTHM</small>' +
      '<div class="setblock"><b>The day begins at ' + dayLabel[p.dayStart] + '</b><small>Anything sealed before this hour belongs to the night before. Night owls: keep 4 AM.</small>' + chips('dayStart', [[0, '12 AM'], [2, '2 AM'], [4, '4 AM'], [6, '6 AM']], p.dayStart) + '</div>' +
      '<div class="setblock"><b>The week starts on ' + (p.weekStart === 'sun' ? 'Sunday' : 'Monday') + '</b><small>Display only — perfect-week S-ranks always run Monday to Sunday, for everyone.</small>' + chips('weekStart', [['mon', 'Monday'], ['sun', 'Sunday']], p.weekStart) + '</div>' +
      '<div class="setblock"><b>Evening warning at ' + (p.riskHour > 12 ? (p.riskHour - 12) + ' PM' : p.riskHour + ' AM') + '</b><small>If the day is unsealed past this hour, the village dims and the sensei sharpens.</small>' + chips('riskHour', [[18, '6 PM'], [20, '8 PM'], [22, '10 PM'], [23, '11 PM']], p.riskHour) + '</div>' +
      '<small class="lab">感 COMFORT</small>' +
      '<div class="setblock"><b>Text size</b>' + chips('textScale', [['s', 'Small'], ['m', 'Regular'], ['l', 'Large']], p.textScale) + '</div>' +
      row('音', 'sound', 'Sound', 'taiko, bells, the gong — synthesized, no files', p.sound) +
      row('震', 'haptics', 'Haptics', 'stamps, ticks, side flips', p.haptics) +
      row('動', 'motion', 'Motion', p.motion === 'auto' ? 'follows your device setting' : p.motion === 'off' ? 'reduced' : 'full', p.motion !== 'off') +
      '<small class="lab">蔵 THE VAULT</small>' +
      '<div class="row2"><button class="btn ghost" id="stE">Export backup</button><button class="btn ghost" id="stI">Import backup</button></div>' +
      row('鈴', 'backupNudge', 'Backup reminders', 'a letter every 14 days if your record has not left this device', p.backupNudge) +
      '<small class="lab">名 IDENTITY</small><button class="btn wide ghost" id="rnB">Change your name</button>' +
      '<small class="ver">HOKAGE ' + G.VERSION + '</small>');
    $$('.setrow', s.body).forEach(function (el) {
      el.addEventListener('click', function () {
        var k = el.dataset.k;
        if (k === 'motion') p.motion = p.motion === 'auto' ? 'off' : p.motion === 'off' ? 'on' : 'auto'; else p[k] = !p[k];
        G.save(); if (k === 'sound' && p.sound) { G.fxUnlock(); G.sfx('chime'); } s.close(settingsSheet);
      });
    });
    $$('[data-ck]', s.body).forEach(function (el) {
      el.addEventListener('click', function () {
        var k = el.dataset.ck, v = el.dataset.cv;
        p[k] = (k === 'dayStart' || k === 'riskHour') ? +v : v;
        G.save(); G.applyTextScale(); G.sfx('tick'); G.buzz(4); s.close(settingsSheet);
      });
    });
    $('#stE', s.body).addEventListener('click', function () { copyOut(G.exportData(), function () { G.toast('Backup copied — save it somewhere safe'); }, function () { G.toast('Copy blocked — use Scrolls → Vault'); }); });
    $('#stI', s.body).addEventListener('click', function () { s.close(function () { G.go('scrolls'); G.toast('Paste your backup in the Vault below'); }); });
    $('#rnB', s.body).addEventListener('click', function () {
      ask('名 Your name', 'The shinobi name is forged from it.', G.state.name, 'Your name', 24).then(function (n) { if (n && n.trim()) { G.state.name = n.trim().slice(0, 24); G.state.sName = G.forgeName(G.state.name); G.save(); s.close(function () { G.go('card'); }); } });
    });
  }
})(window.HOKAGE = window.HOKAGE || {});
