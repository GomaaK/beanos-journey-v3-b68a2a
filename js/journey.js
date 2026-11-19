(() => {
  document.documentElement.classList.add('jsr');
  const D = JSON.parse(document.getElementById('jd').textContent);
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* progress, rail, spotlight */
  const bar = $('#pbar');
  function prog() { const h = document.documentElement; bar.style.width = (scrollY / Math.max(1, h.scrollHeight - innerHeight) * 100) + '%'; }
  addEventListener('scroll', prog, { passive: true }); prog();
  const dots = $$('.rail a');
  const chIds = $$('.ch').map(c => c.id); let ci = 0;
  const labels = Object.fromEntries(dots.map(d => [d.dataset.c, $('span', d).textContent]));
  function hud() { $('#hudt').textContent = (ci + 1) + ' / ' + chIds.length + ' · ' + (labels[chIds[ci]] || ''); }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { ci = chIds.indexOf(e.target.id); document.body.classList.toggle('dim', ci > 0); window.__beansOff = ci > 0; dots.forEach(d => d.classList.toggle('on', d.dataset.c === e.target.id)); hud(); } }), { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
  $$('.ch').forEach(c => io.observe(c)); hud();
  function goto(i) { i = Math.max(0, Math.min(chIds.length - 1, i)); $('#' + chIds[i]).scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }
  $('#hprev').addEventListener('click', () => goto(ci - 1)); $('#hnext').addEventListener('click', () => goto(ci + 1));
  function pres() { if (document.fullscreenElement) document.exitFullscreen(); else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen(); }
  $('#hfull').addEventListener('click', pres);
  document.addEventListener('fullscreenchange', () => { const on = !!document.fullscreenElement; document.documentElement.classList.toggle('presenting', on); $('#hfull').textContent = on ? 'Exit' : 'Present'; });
  addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.target.closest('input,select,textarea,button,a,[role=button]')) return;
    const k = e.key;
    if (k === 'ArrowRight' || k === 'PageDown' || k === ' ') { e.preventDefault(); goto(ci + 1); }
    else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); goto(ci - 1); }
    else if (k === 'Home') { e.preventDefault(); goto(0); }
    else if (k === 'End') { e.preventDefault(); goto(chIds.length - 1); }
    else if (k === 'f' || k === 'F') pres();
  });
  const spot = $('#spot');
  if (!reduce) addEventListener('pointermove', e => { spot.style.setProperty('--x', e.clientX + 'px'); spot.style.setProperty('--y', e.clientY + 'px'); }, { passive: true });

  /* reveal + counters */
  function count(root) {
    $$('[data-count]', root).forEach(el => {
      const to = +el.dataset.count, from = +(el.dataset.from || 0), dec = +(el.dataset.dec || 0);
      if (reduce) { el.textContent = to.toFixed(dec); return; }
      const t0 = performance.now(), dur = 1200;
      (function f(t) { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = (from + (to - from) * e).toFixed(dec); if (k < 1) requestAnimationFrame(f); })(t0);
    });
  }
  const rv = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); count(e.target); rv.unobserve(e.target); } }), { threshold: .15 });
  $$('.rv').forEach(x => rv.observe(x));

  /* gap map: heatmap + radar */
  const B = D.branches, dims = B[0].rows.map(r => r.dim), short = b => b.name.split(',')[0].replace(' Mall', '');
  const score = st => ({ Strong: 3, Mixed: 2, Gap: 1 }[st] || 2);
  let selB = null;
  const heat = $('#heat');
  heat.style.setProperty('--cols', B.length);
  function drawHeat() {
    let h = '<div class="hc corner"></div>' + B.map(b => `<button class="hc bh ${selB === b.key ? 'on' : ''}" data-b="${b.key}">${esc(short(b))}</button>`).join('');
    dims.forEach(d => {
      h += `<div class="hc dl">${esc(d)}</div>`;
      B.forEach(b => { const r = b.rows.find(x => x.dim === d); const st = r ? r.st : 'Info'; h += `<button class="hc ce ${st}" data-b="${b.key}" data-d="${esc(d)}" aria-label="${esc(short(b))}, ${esc(d)}: ${st}"></button>`; });
    });
    heat.innerHTML = h;
  }
  drawHeat();
  const cell = $('#cell');
  function showCell(bk, d) {
    const b = B.find(x => x.key === bk), r = b.rows.find(x => x.dim === d);
    $$('.ce', heat).forEach(c => c.classList.toggle('sel', c.dataset.b === bk && c.dataset.d === d));
    cell.innerHTML = `<span class="k ${r.st}">${r.st === 'Info' ? 'Noted' : r.st}</span><b>${esc(short(b))} · ${esc(d)}</b><p>${esc(r.text)}</p>`;
    cell.classList.add('on');
  }
  const R = 120, cx = 0, cy = 0, ang = i => -Math.PI / 2 + i * 2 * Math.PI / dims.length;
  const rad = $('#radar'), NS = 'http://www.w3.org/2000/svg';
  let h = '';
  [1, 2, 3].forEach(v => { const r = 40 + (v - 1) * 40; h += `<polygon class="rg" points="${dims.map((_, i) => [Math.cos(ang(i)) * r, Math.sin(ang(i)) * r].map(n => n.toFixed(1)).join(',')).join(' ')}"/>`; });
  dims.forEach((d, i) => { const a = ang(i); h += `<line class="ra" x1="0" y1="0" x2="${(Math.cos(a) * R).toFixed(1)}" y2="${(Math.sin(a) * R).toFixed(1)}"/>`; const lx = Math.cos(a) * (R + 14), ly = Math.sin(a) * (R + 14); const anc = Math.abs(Math.cos(a)) < .2 ? 'middle' : (Math.cos(a) > 0 ? 'start' : 'end'); h += `<text class="rl" x="${lx.toFixed(1)}" y="${(ly + 4).toFixed(1)}" text-anchor="${anc}">${esc(d)}</text>`; });
  h += '<polygon id="rp" class="rpoly" points=""/><g id="rd"></g>';
  rad.innerHTML = h;
  let cur = dims.map(() => 1);
  function valsFor(bk) { return dims.map(d => { const rs = (bk ? B.filter(b => b.key === bk) : B).map(b => score((b.rows.find(x => x.dim === d) || {}).st)); return rs.reduce((a, c) => a + c, 0) / rs.length; }); }
  function setRadar(vals) {
    const from = cur.slice(), t0 = performance.now(), dur = reduce ? 1 : 600;
    (function f(t) {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      const v = vals.map((x, i) => from[i] + (x - from[i]) * e);
      const pts = v.map((x, i) => { const r = 40 + (x - 1) * 40, a = ang(i); return [Math.cos(a) * r, Math.sin(a) * r]; });
      $('#rp').setAttribute('points', pts.map(p => p.map(n => n.toFixed(1)).join(',')).join(' '));
      $('#rd').innerHTML = pts.map(p => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="4" class="rdot"/>`).join('');
      if (k < 1) requestAnimationFrame(f); else cur = vals.slice();
    })(t0);
    const mx = Math.max(...vals), mn = Math.min(...vals);
    const best = dims.filter((_, i) => vals[i] === mx), worst = dims.filter((_, i) => vals[i] === mn);
    $('#rnote').textContent = `Strongest: ${best.join(', ')}. Widest gap: ${worst.join(', ')}. Noted items count as mixed in this shape.`;
  }
  function pick(bk) { selB = bk; $('#rtitle').textContent = bk ? B.find(b => b.key === bk).name : 'All branches'; $$('.bh', heat).forEach(x => x.classList.toggle('on', x.dataset.b === bk)); setRadar(valsFor(bk)); }
  heat.addEventListener('click', e => {
    const c = e.target.closest('.ce'), b = e.target.closest('.bh');
    if (c) showCell(c.dataset.b, c.dataset.d);
    if (b) pick(selB === b.dataset.b ? null : b.dataset.b);
  });
  setRadar(valsFor(null));
  // opening hint: show the widest gap cell
  (() => { const g = []; B.forEach(b => b.rows.forEach(r => { if (r.st === 'Gap') g.push([b.key, r.dim]); })); if (g.length) showCell(g[0][0], g[0][1]); })();

  /* stats strip */
  (() => {
    const cnt = { Strong: 0, Mixed: 0, Gap: 0, Info: 0 }, gapDims = {};
    B.forEach(b => b.rows.forEach(r => { cnt[r.st] = (cnt[r.st] || 0) + 1; if (r.st === 'Gap') gapDims[r.dim] = (gapDims[r.dim] || 0) + 1; }));
    const tot = Object.values(cnt).reduce((a, c) => a + c, 0), top = Object.entries(gapDims).sort((a, b) => b[1] - a[1]).slice(0, 2).map(x => x[0]);
    $('#gstat').innerHTML = `<div class="gs"><b>${tot}</b><span>things we scored across 5 branches</span></div><div class="gs"><b class="Strong">${cnt.Strong}</b><span>strong</span></div><div class="gs"><b class="Mixed">${cnt.Mixed}</b><span>mixed</span></div><div class="gs"><b class="Gap">${cnt.Gap}</b><span>gaps${top.length ? ', most often in ' + top.join(' and ') : ''}</span></div>`;
  })();

  /* metrics */
  const mt = $('#mtabs'), mb = $('#mbars'); let mk = Object.keys(D.metrics)[0];
  const hi = { 'Coffee': v => v >= 4, 'Drink wait': v => v <= 5, 'Food': v => v >= 4.5, 'Recovery': v => v <= 1, 'Loyalty': () => false };
  function drawM() {
    mt.innerHTML = Object.keys(D.metrics).map(k => `<button class="${k === mk ? 'on' : ''}" data-k="${k}">${k}</button>`).join('');
    const m = D.metrics[mk];
    mb.innerHTML = `<div class="mt">${esc(m.title)}</div>` + m.rows.map(r => {
      const untested = r.l === 'Not tested', w = untested ? 0 : Math.max(r.v / m.max * 100, mk === 'Loyalty' ? 2 : (r.v === 0 ? 3 : 4));
      return `<div class="mr"><span class="mn">${esc(r.n)}</span><div class="mtrack">${m.title.indexOf('target 5') > -1 || mk === 'Coffee' ? `<u style="left:${(mk === 'Coffee' ? 4 : 5) / m.max * 100}%"></u>` : ''}<i class="${hi[mk](r.v) ? 'ok' : ''} ${untested ? 'un' : ''}" style="--w:${w}%"></i></div><span class="mv">${esc(r.l)}</span></div>`;
    }).join('');
    $('#mnote').textContent = m.note.replace('Orange = 4 or more. ', 'Orange = 4 or more; the dashed line is 4. ').replace('Orange = on target. ', 'Orange = on target (5 minutes or less). ');
    requestAnimationFrame(() => mb.classList.add('go'));
  }
  mt.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; mk = b.dataset.k; mb.classList.remove('go'); drawM(); });
  drawM();

  /* guest journey */
  const stops = $('#stops'), jc = $('#jcard'), guest = $('#guest');
  stops.innerHTML = D.steps.map((s, i) => `<button class="stop ${s.fix ? 'fix' : ''}" data-i="${i}"><i>${i + 1}</i><span>${esc(s.n)}</span>${s.fix ? '<em>Fix first</em>' : ''}</button>`).join('');
  let ji = -1, timer = null;
  function go(i) {
    ji = i; $$('.stop', stops).forEach((b, k) => { b.classList.toggle('on', k === i); b.classList.toggle('done', k < i); });
    const s = D.steps[i];
    jc.innerHTML = `<div class="jhead"><span>${i + 1} of ${D.steps.length}</span><h3>${esc(s.n)}</h3>${s.fix ? '<em class="fixr">One of the three to fix first</em>' : ''}</div><div class="jcols"><div><b>What we saw</b><p>${esc(s.saw)}</p></div><div><b>What we will do</b><p>${esc(s.do)}</p></div></div>`;
    const b = $$('.stop', stops)[i], line = $('.line'); const lr = line.getBoundingClientRect(), br = b.getBoundingClientRect();
    guest.style.setProperty('--gx', (br.left - lr.left + br.width / 2) + 'px'); guest.style.setProperty('--gy', (br.top - lr.top + 22) + 'px');
  }
  stops.addEventListener('click', e => { const b = e.target.closest('.stop'); if (!b) return; stop(); go(+b.dataset.i); });
  function stop() { if (timer) { clearInterval(timer); timer = null; $('#walk').textContent = 'Walk the visit'; } }
  $('#walk').addEventListener('click', () => {
    if (timer) { stop(); return; }
    $('#walk').textContent = 'Pause'; let i = ji >= D.steps.length - 1 ? -1 : ji;
    const step = () => { i++; if (i >= D.steps.length) { stop(); return; } go(i); };
    step(); timer = setInterval(step, 2400);
  });
  go(3);
  addEventListener('resize', () => go(Math.max(ji, 0)));

  /* gap explorer */
  const gl = $('#glist'), gd = $('#gdetail');
  const groups = [['now', 'Fix now'], ['plan', 'Plan']];
  gl.innerHTML = groups.map(([k, t]) => `<div class="gg"><div class="gt ${k}">${t}</div>${D.gaps.filter(g => g.when === k).map(g => `<button class="gp ${k}" data-id="${g.id}"><b>${g.id}</b><span>${esc(g.title)}</span></button>`).join('')}</div>`).join('');
  function showGap(id) {
    const g = D.gaps.find(x => x.id === id);
    $$('.gp', gl).forEach(b => b.classList.toggle('on', b.dataset.id === id));
    gd.innerHTML = `<div class="gdh"><span class="tag ${g.when}">${g.when === 'now' ? 'Fix now' : 'Plan'}</span><h3>${esc(g.id)} · ${esc(g.title)}</h3></div>
    <div class="ab"><div class="a1"><b>Today</b><p>${esc(g.today)}</p></div><div class="arr" aria-hidden="true"><i></i></div><div class="a2"><b>Target</b><p>${esc(g.target)}</p></div></div>
    <div class="gdf"><div><b>First move</b><p>${esc(g.move)}</p></div><div><b>Owner</b><p>${esc(g.owner)}</p><b style="margin-top:10px">Measure</b><p>${esc(g.kpi)}</p></div></div><div class="gsrc">${g.src}</div>`;
    gd.classList.remove('flash'); void gd.offsetWidth; gd.classList.add('flash');
  }
  gl.addEventListener('click', e => { const b = e.target.closest('.gp'); if (b) showGap(b.dataset.id); });
  showGap(D.gaps[0].id);
  $$('.tg button').forEach(b => b.addEventListener('click', () => { showGap(b.dataset.g); $('#gdetail').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); $$('.tg button').forEach(x => x.classList.toggle('on', x === b)); }));

  /* growth equation */
  const s = [1, 2, 3].map(i => $('#s' + i)), rf = $('#rf'), C = 2 * Math.PI * 50;
  rf.style.strokeDasharray = C;
  function eq() {
    s.forEach((x, i) => $('#v' + (i + 1)).textContent = '+' + x.value + '%');
    const r = (s.reduce((a, x) => a * (1 + x.value / 100), 1) - 1) * 100;
    $('#eqv').textContent = '+' + r.toFixed(1) + '%';
    rf.style.strokeDashoffset = C * (1 - Math.min(1, r / 20));
    rf.classList.toggle('hit', r >= 15);
  }
  s.forEach(x => x.addEventListener('input', eq)); eq();
  const sg = $('#seg');
  sg.innerHTML = D.seg.map((x, i) => `<button class="sc" data-i="${i}" aria-expanded="false"><b>${esc(x[0])}</b><i>→</i><span>${esc(x[1])}</span><p>${esc(x[2])}</p></button>`).join('');
  sg.addEventListener('click', e => { const b = e.target.closest('.sc'); if (!b) return; const o = b.classList.toggle('open'); b.setAttribute('aria-expanded', o); });


  /* marketing pillars wheel */
  const wsvg = $('#wsvg'), wdet = $('#wdet'), P = D.pillars;
  wsvg.innerHTML = '<circle r="118" class="wring"/>' + P.map((p, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / P.length; return `<g class="wn" data-i="${i}" transform="translate(${(Math.cos(a) * 118).toFixed(1)} ${(Math.sin(a) * 118).toFixed(1)})" tabindex="0" role="button" aria-label="${esc(p[0])}"><circle r="44"/><text y="5" text-anchor="middle">${esc(p[0])}</text></g>`; }).join('');
  function showP(i) { $$('.wn', wsvg).forEach(n => n.classList.toggle('on', +n.dataset.i === i)); const p = P[i]; wdet.innerHTML = `<h3>${esc(p[0])}</h3><p>${esc(p[1])}</p><span class="kpi">How we measure it: ${esc(p[2])}</span>`; }
  wsvg.addEventListener('click', e => { const n = e.target.closest('.wn'); if (n) showP(+n.dataset.i); });
  wsvg.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { const n = e.target.closest('.wn'); if (n) { e.preventDefault(); showP(+n.dataset.i); } } });
  showP(2);

  /* roadmap tabs */
  const rt = $('#rtabs');
  rt.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $$('button', rt).forEach(x => x.classList.toggle('on', x === b)); $$('.rp').forEach(p => p.classList.toggle('on', p.dataset.p === b.dataset.t)); });

  /* smooth in-page jumps */
  $$('a[href^="#c"]').forEach(a => a.addEventListener('click', e => { const t = $(a.getAttribute('href')); if (t) { e.preventDefault(); t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); } }));
})();
