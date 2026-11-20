// Buyer-journey autoplay presenter. Cues are injected as window.__CUES by build.py.
// Space: start (3-2-1) / pause-resume. R: restart. Esc: exit.
(function () {
  if (window.__presenter) { window.__presenter.exit(); }
  const CUES = window.__CUES || [];
  const table = document.getElementById('cemTable');
  if (!table) { alert('Presenter: #cemTable not found on this page'); return; }
  const ROW = { head: 0, jtbd: 'jtbd-row', forces: 'forces-row', drop: 'leak-row', champion: 'champ-row', ai: 'ai-row' };
  const wrap = table.parentElement;
  const body = document.body;

  const css = document.createElement('style');
  css.textContent = `
    body.pz{transform-origin:0 0;transition:transform 1.2s cubic-bezier(.65,0,.35,1)}
    body.pz .cem-wrapper{overflow:visible!important}
    body.pz #cemTable td,body.pz #cemTable th{transition:opacity .6s}
    body.pz.dim #cemTable td:not(.pz-on),body.pz.dim #cemTable th:not(.pz-on){opacity:.18}
    #pz-hud{position:fixed;right:12px;bottom:12px;z-index:99999;font:600 13px system-ui;background:#000a;color:#fff;padding:6px 10px;border-radius:8px}
    #pz-count{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:99999;font:700 160px system-ui;color:#fff;background:#0006}`;
  document.head.appendChild(css);
  const hud = document.createElement('div'); hud.id = 'pz-hud'; document.documentElement.appendChild(hud);

  function rowEl(key) {
    const r = ROW[key];
    if (r === undefined) return null;
    return r === 0 ? table.rows[0] : table.querySelector('tr.' + r);
  }
  function cellsFor(tag) {
    // tag: map | off | stage:05 | jtbd:05 | a+b
    let out = [];
    for (const part of tag.split('+')) {
      const [k, s] = part.split(':');
      const col = parseInt(s, 10);
      if (k === 'map') out.push(...table.querySelectorAll('td,th'));
      else if (k === 'stage') {
        for (const key of Object.keys(ROW)) { const r = rowEl(key); if (r && r.cells[col]) out.push(r.cells[col]); }
      } else { const r = rowEl(k); if (r && r.cells[col]) out.push(r.cells[col]); }
    }
    return out;
  }
  function rectOf(els) {
    let x1 = 1e9, y1 = 1e9, x2 = -1e9, y2 = -1e9;
    for (const e of els) {
      const b = e.getBoundingClientRect();
      x1 = Math.min(x1, b.left); y1 = Math.min(y1, b.top); x2 = Math.max(x2, b.right); y2 = Math.max(y2, b.bottom);
    }
    return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
  }

  function shot(tag) {
    document.querySelectorAll('.pz-on').forEach(e => e.classList.remove('pz-on'));
    body.classList.add('pz');
    if (tag === 'off') { body.classList.remove('dim'); body.style.transform = ''; return; }
    // measure unscaled
    const prev = body.style.transform; body.style.transition = 'none'; body.style.transform = '';
    window.scrollTo(0, 0);
    const els = cellsFor(tag);
    const r = rectOf(els);
    body.style.transform = prev; void body.offsetWidth; body.style.transition = '';
    if (!els.length) return;
    const vw = window.innerWidth, vh = window.innerHeight, pad = 0.9;
    const s = Math.min(vw * pad / r.w, vh * pad / r.h, 2.5);
    const tx = (vw - r.w * s) / 2 - r.x * s, ty = (vh - r.h * s) / 2 - r.y * s;
    body.style.transform = `translate(${tx}px,${ty}px) scale(${s})`;
    if (tag === 'map') body.classList.remove('dim');
    else { els.forEach(e => e.classList.add('pz-on')); body.classList.add('dim'); }
  }

  let t0 = 0, elapsed = 0, playing = false, next = 0, timer = null;
  const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  function tick() {
    const now = elapsed + (playing ? (performance.now() - t0) / 1000 : 0);
    while (next < CUES.length && CUES[next].t <= now) { shot(CUES[next].tag); next++; }
    const up = CUES[next];
    hud.textContent = `${playing ? '▶' : '❚❚'} ${fmt(now)}  ${up ? 'next ' + up.tag + ' @' + fmt(up.t) : 'end'}  · Space R Esc`;
  }
  function play() { t0 = performance.now(); playing = true; timer = setInterval(tick, 100); }
  function pause() { elapsed += (performance.now() - t0) / 1000; playing = false; clearInterval(timer); tick(); }
  function countdown(done) {
    const c = document.createElement('div'); c.id = 'pz-count'; document.documentElement.appendChild(c);
    let n = 3; c.textContent = n;
    const iv = setInterval(() => { n--; if (n === 0) { clearInterval(iv); c.remove(); done(); } else c.textContent = n; }, 1000);
  }
  let started = false;
  function reset() { clearInterval(timer); playing = false; started = false; elapsed = 0; next = 0; shot('off'); window.scrollTo(0, 0); tick(); }
  function key(e) {
    if (e.code === 'Space') { e.preventDefault(); if (!started) { started = true; countdown(play); } else playing ? pause() : play(); }
    else if (e.key === 'r' || e.key === 'R') reset();
    else if (e.key === 'Escape') exit();
  }
  function exit() { reset(); body.classList.remove('pz', 'dim'); css.remove(); hud.remove(); window.removeEventListener('keydown', key, true); delete window.__presenter; }
  window.addEventListener('keydown', key, true);
  window.__presenter = { exit, shot };
  reset();
})();
