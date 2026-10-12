/* ASTER — comportements du site (navigation, animations, attribution UTM, formulaire, roster, Calendly) */
(() => {
  const d = document, html = d.documentElement, body = d.body;
  const lang = html.lang === 'en' ? 'en' : 'fr';
  const ROOT = body.dataset.root || '';
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const loc = lang === 'fr' ? 'fr-FR' : 'en-GB';

  /* Chargement : révèle les titres une fois les polices prêtes */
  const loaded = () => requestAnimationFrame(() => body.classList.add('is-loaded'));
  (d.fonts && d.fonts.ready ? Promise.race([d.fonts.ready, new Promise(r => setTimeout(r, 900))]) : Promise.resolve()).then(loaded);

  /* En-tête */
  const hdr = d.getElementById('hdr');
  let lastY = scrollY;

  /* Menus déroulants */
  d.querySelectorAll('.dd').forEach(dd => {
    const b = dd.querySelector('.dd-btn');
    const hover = matchMedia('(hover: hover)');
    const set = o => { dd.classList.toggle('is-open', o); b.setAttribute('aria-expanded', String(o)); };
    b.addEventListener('click', () => set(!dd.classList.contains('is-open')));
    dd.addEventListener('mouseenter', () => hover.matches && set(true));
    dd.addEventListener('mouseleave', () => hover.matches && set(false));
    dd.addEventListener('keydown', e => { if (e.key === 'Escape') { set(false); b.focus(); } });
    dd.addEventListener('focusout', e => { if (!dd.contains(e.relatedTarget)) set(false); });
    d.addEventListener('click', e => { if (!dd.contains(e.target)) set(false); });
  });
  if (hdr) hdr.addEventListener('focusin', () => hdr.classList.remove('is-hidden'));

  /* Menu mobile */
  const burger = d.querySelector('.burger'), mnav = d.getElementById('mnav');
  if (burger && mnav) {
    const set = o => {
      burger.setAttribute('aria-expanded', String(o));
      body.classList.toggle('menu-open', o);
      if (o) { mnav.hidden = false; requestAnimationFrame(() => mnav.classList.add('is-open')); const a = mnav.querySelector('a'); a && a.focus(); }
      else { mnav.classList.remove('is-open'); setTimeout(() => { if (!mnav.classList.contains('is-open')) mnav.hidden = true; }, 450); }
    };
    burger.addEventListener('click', () => set(burger.getAttribute('aria-expanded') !== 'true'));
    d.addEventListener('keydown', e => { if (e.key === 'Escape' && body.classList.contains('menu-open')) { set(false); burger.focus(); } });
    matchMedia('(min-width: 1060px)').addEventListener('change', e => e.matches && set(false));
  }

  /* Révélations */
  d.querySelectorAll('[data-stagger]').forEach(p => [...p.children].forEach((c, i) => c.style.setProperty('--d', (i * 0.09).toFixed(2) + 's')));
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px', threshold: 0.06 }) : null;
  const observe = root => root.querySelectorAll('[data-reveal]:not(.is-in),.ftr-mark').forEach(el => io ? io.observe(el) : el.classList.add('is-in'));
  observe(d);

  /* Scroll : mots du manifeste + parallaxe + en-tête */
  const W = [...d.querySelectorAll('[data-words]')].map(el => ({ el, w: el.querySelectorAll('.w') }));
  const P = [...d.querySelectorAll('[data-parallax]')];
  if (RM) W.forEach(o => o.w.forEach(w => w.classList.add('on')));
  let ticking = false;
  const frame = () => {
    ticking = false;
    const y = scrollY, vh = innerHeight;
    if (hdr) {
      hdr.classList.toggle('is-scrolled', y > 8);
      const hide = y > lastY && y > 480 && !body.classList.contains('menu-open') && !d.querySelector('.dd.is-open');
      hdr.classList.toggle('is-hidden', hide);
      lastY = y;
    }
    if (RM) return;
    W.forEach(({ el, w }) => {
      const r = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (vh * 0.88 - r.top) / (r.height + vh * 0.3)));
      const n = Math.round(p * w.length);
      w.forEach((x, i) => x.classList.toggle('on', i < n));
    });
    if (innerWidth > 700) P.forEach(el => {
      const r = el.getBoundingClientRect();
      const c = (r.top + r.height / 2 - vh / 2) / vh;
      el.style.transform = `translate3d(0,${(c * -(parseFloat(el.dataset.parallax) || 40)).toFixed(1)}px,0)`;
    });
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
  addEventListener('resize', frame);
  frame();

  /* Image collante : différenciateurs */
  const dm = d.querySelector('[data-dif-media]');
  if (dm && 'IntersectionObserver' in window) {
    const imgs = dm.querySelectorAll('img'), cap = dm.querySelector('[data-dif-cap]'), rows = d.querySelectorAll('[data-dif]');
    const o = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      const i = +e.target.dataset.dif;
      imgs.forEach((im, j) => im.classList.toggle('on', j === i));
      rows.forEach(r => r.classList.toggle('act', r === e.target));
      if (cap) cap.textContent = e.target.dataset.cap;
    }), { rootMargin: '-42% 0px -42% 0px' });
    rows.forEach(r => o.observe(r));
  }
  /* Image qui suit le curseur : liste des secteurs */
  const fl = d.querySelector('.sl-float');
  if (fl && matchMedia('(hover: hover) and (min-width: 960px)').matches) {
    const im = fl.querySelectorAll('img');
    d.querySelectorAll('.sl').forEach((a, i) => {
      a.addEventListener('mouseenter', () => { fl.classList.add('on'); im.forEach((x, j) => x.classList.toggle('on', j === i)); });
      a.addEventListener('mouseleave', () => fl.classList.remove('on'));
      a.addEventListener('mousemove', e => { fl.style.setProperty('--x', e.clientX + 'px'); fl.style.setProperty('--y', e.clientY + 'px'); });
    });
  }

  /* Attribution : UTM + page d'arrivée conservées pendant la visite */
  const KEY = 'aster.attr', UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  const qs = new URLSearchParams(location.search);
  let A = {};
  try { A = JSON.parse(sessionStorage.getItem(KEY)) || {}; } catch (e) {}
  if (UTM.some(k => qs.get(k))) UTM.forEach(k => { A[k] = qs.get(k) || ''; });
  if (!A.landing_page) { A.landing_page = location.href.split('#')[0]; A.landing_sector = body.dataset.sector || ''; }
  try { sessionStorage.setItem(KEY, JSON.stringify(A)); } catch (e) {}

  /* Budgets par devise */
  const BUD = { EUR: [5000, 15000, 40000, 100000], USD: [5000, 15000, 40000, 100000], GBP: [4000, 12000, 35000, 85000], AED: [20000, 60000, 150000, 400000] };
  const TX = { fr: { plus: 'et plus', tbd: 'À définir ensemble', choose: 'Sélectionner' }, en: { plus: 'and above', tbd: "Let's define it together", choose: 'Select' } }[lang];
  const money = (c, v) => new Intl.NumberFormat(loc, { style: 'currency', currency: c, maximumFractionDigits: 0 }).format(v);
  const fillBudget = (sel, c) => {
    const b = BUD[c] || BUD.EUR, o = [['', TX.choose]];
    for (let i = 0; i < b.length - 1; i++) o.push([`${c} ${b[i]}-${b[i + 1]}`, `${money(c, b[i])} – ${money(c, b[i + 1])}`]);
    o.push([`${c} ${b[b.length - 1]}+`, `${money(c, b[b.length - 1])} ${TX.plus}`], ['tbd', TX.tbd]);
    sel.innerHTML = o.map(([v, t]) => `<option value="${v}">${t}</option>`).join('');
  };

  d.querySelectorAll('form.brief').forEach(f => {
    const set = (n, v) => { const el = f.elements[n]; if (el) el.value = v || ''; };
    UTM.forEach(k => set(k, A[k]));
    set('landing_page', A.landing_page); set('landing_sector', A.landing_sector); set('site_language', lang);
    const sel = f.elements.sector, sec = f.dataset.presetSector || qs.get('sector') || A.landing_sector || '';
    if (sel && sec && [...sel.options].some(o => o.value === sec)) sel.value = sec;
    const type = qs.get('type');
    if (type) { const r = f.querySelector(`input[name="request_type"][value="${CSS.escape(type)}"]`); if (r) r.checked = true; }
    const cur = f.elements.budget_currency, bud = f.elements.budget_range;
    if (cur && bud) cur.addEventListener('change', () => fillBudget(bud, cur.value));
    f.addEventListener('submit', () => {
      try { sessionStorage.setItem('aster.contact', JSON.stringify({ name: f.elements.full_name.value, email: f.elements.email.value })); } catch (e) {}
    });
  });

  /* Calendly sur la page de remerciement */
  const cal = d.querySelector('[data-calendly]');
  if (cal && /^https:\/\/calendly\.com\//.test(cal.dataset.calendly)) {
    let c = {};
    try { c = JSON.parse(sessionStorage.getItem('aster.contact')) || {}; } catch (e) {}
    const u = new URL(cal.dataset.calendly);
    u.searchParams.set('embed_domain', location.hostname); u.searchParams.set('embed_type', 'Inline'); u.searchParams.set('hide_gdpr_banner', '1');
    if (c.name) u.searchParams.set('name', c.name);
    if (c.email) u.searchParams.set('email', c.email);
    UTM.forEach(k => A[k] && u.searchParams.set(k, A[k]));
    cal.innerHTML = `<iframe src="${u}" title="${lang === 'fr' ? 'Réserver un appel' : 'Book a call'}" loading="lazy" style="width:100%;height:760px;border:0;display:block"></iframe>`;
  }

  /* Roster */
  const grids = d.querySelectorAll('[data-roster]');
  if (!grids.length) return;
  const PF = { instagram: ['Instagram', 'IG'], tiktok: ['TikTok', 'TT'], youtube: ['YouTube', 'YT'], twitch: ['Twitch', 'TW'], kick: ['Kick', 'KK'], x: ['X', 'X'] };
  const SEC = { fr: { ecommerce: 'E-commerce', hospitality: 'Hôtellerie', 'crypto-fintech': 'Crypto & fintech' }, en: { ecommerce: 'E-commerce', hospitality: 'Hospitality', 'crypto-fintech': 'Crypto & fintech' } }[lang];
  const L = {
    fr: { aud: 'Audience', eng: 'Engagement', sample: 'Exemple', fit: 'Secteurs', photo: 'Photo à ajouter', tbc: 'à compléter', ig: 'Voir sur Instagram', prof: 'Voir le profil', close: 'Fermer', fol: 'Abonnés', eng2: 'Audience engagée', cred: 'Crédibilité de l’audience', women: 'Femmes', men: 'Hommes', age: 'Tranche d’âge principale', ctry: 'Pays', lng: 'Langues', intr: 'Centres d’intérêt', src: 'Source', count: n => `${n} profil${n > 1 ? 's' : ''}`, empty: 'Aucun profil ne correspond à ces critères.', err: 'Le roster n’a pas pu être chargé.' },
    en: { aud: 'Audience', eng: 'Engagement', sample: 'Sample', fit: 'Sectors', photo: 'Photo to add', tbc: 'to be completed', ig: 'View on Instagram', prof: 'View profile', close: 'Close', fol: 'Followers', eng2: 'Engaged audience', cred: 'Audience credibility', women: 'Women', men: 'Men', age: 'Main age group', ctry: 'Countries', lng: 'Languages', intr: 'Interests', src: 'Source', count: n => `${n} profile${n > 1 ? 's' : ''}`, empty: 'No profile matches these filters.', err: 'The roster could not be loaded.' }
  }[lang];
  const num = v => v == null ? '—' : new Intl.NumberFormat(loc, { notation: 'compact', maximumFractionDigits: 1 }).format(v);
  const pct = v => v == null ? '—' : new Intl.NumberFormat(loc, { style: 'percent', maximumFractionDigits: 1 }).format(v / 100);
  const dn = (type, v) => { try { const s = new Intl.DisplayNames([lang], { type }).of(v); return s.charAt(0).toUpperCase() + s.slice(1); } catch (e) { return v; } };
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const audience = t => t.platforms.some(p => p.followers != null) ? t.platforms.reduce((s, p) => s + (p.followers || 0), 0) : null;
  const size = a => a == null ? '' : a < 100000 ? 's' : a < 500000 ? 'm' : a < 1000000 ? 'l' : 'xl';

  const card = (t, i) => {
    const photo = t.photo ? `<img src="${/^https?:/.test(t.photo) ? '' : ROOT}${esc(t.photo)}" alt="${esc(t.name)}" loading="lazy" width="800" height="1000">` : '';
    const cats = (t.categories && (t.categories[lang] || t.categories.fr)) || [];
    return `<article class="tcard" data-reveal style="--d:${((i % 4) * 0.08).toFixed(2)}s">
      <div class="tcard-hd"><h3>${t.instagram ? `<a href="${esc(t.instagram)}" target="_blank" rel="noopener" class="tcard-lk">${esc(t.name || t.handle)}</a>` : esc(t.name || t.handle)}</h3>${t.name ? `<span class="mono muted">${esc(t.handle)}</span>` : ''}</div>
      <p class="tcard-loc">${dn('region', t.country)} · ${t.languages.map(x => dn('language', x)).join(', ')}</p>${t.audience ? `<button type="button" class="btn btn--ghost btn--sm tcard-prof" data-prof="${esc(t.id)}">${L.prof}</button>` : ''}${t.instagram ? `<a class="ul tcard-ig" href="${esc(t.instagram)}" target="_blank" rel="noopener">${L.ig} ↗</a>` : ''}
      <dl class="tcard-stats"><div><dt>${L.aud}</dt><dd>${num(audience(t))}</dd></div><div><dt>${L.eng}</dt><dd>${pct(t.engagement ?? (t.platforms.find(p => p.engagement != null) || {}).engagement)}</dd></div></dl>
      <ul class="tcard-pf">${t.platforms.map(p => `<li><span>${(PF[p.id] || [p.id])[0]}</span><span class="mono">${num(p.followers)}</span></li>`).join('')}</ul>
      ${cats.length ? `<ul class="chips">${cats.map(c => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
      <p class="tcard-sec"><span class="fl">${L.fit}</span>${t.sectors.length ? '' : `<span>${L.tbc}</span>`}${t.sectors.map(s => `<span><i class="sd sd--${s}"></i>${SEC[s] || s}</span>`).join('')}</p>
    </article>`;
  };
  const render = (g, list) => {
    g.innerHTML = list.length ? list.map(card).join('') : `<p class="empty">${L.empty}</p>`;
    observe(g);
  };

  const pctS = v => new Intl.NumberFormat(loc, { maximumFractionDigits: 1 }).format(v) + (lang === 'fr' ? '\u202f%' : '%');
  const bars = (title, rows) => `<div class="pd-blk"><p class="fl">${title}</p>${rows.map(([k, v]) => `<div class="pd-row"><span>${k}</span><span class="pd-bar"><i style="width:${Math.min(100, v)}%"></i></span><span class="mono">${pctS(v)}</span></div>`).join('')}</div>`;
  const aud = (title, a) => `<section class="pd-aud"><h4 class="h3">${title}</h4>
    <div class="pd-gender"><span style="flex:${a.female}">${L.women} ${pctS(a.female)}</span><span style="flex:${a.male}">${L.men} ${pctS(a.male)}</span></div>
    <p class="pd-age"><span class="fl">${L.age}</span> ${a.agePeak.replace('-', '–')}</p>
    <div class="pd-grid">${bars(L.ctry, a.countries.map(([c, v]) => [dn('region', c), v]))}${bars(L.lng, a.languages.map(([c, v]) => [dn('language', c), v]))}${a.interests ? bars(L.intr, a.interests[lang] || a.interests.fr) : ''}</div></section>`;
  let dlg;
  const openProf = t => {
    if (!dlg) { dlg = d.createElement('dialog'); dlg.className = 'pd'; body.appendChild(dlg); dlg.addEventListener('click', e => { if (e.target === dlg || e.target.closest('[data-close]')) dlg.close(); }); }
    const A = t.audience || {};
    const pfs = t.platforms.map(p => {
      const a = A[p.id] || {}, name = (PF[p.id] || [p.id])[0], url = p.id === 'instagram' ? t.instagram : p.url;
      return `<section class="pd-pf"><div class="pd-pf-hd"><h4 class="h3">${name}</h4>${url ? `<a class="ul" href="${esc(url)}" target="_blank" rel="noopener">${esc(p.handle || t.handle)} ↗</a>` : ''}</div>
        <dl class="pd-kpi"><div><dt>${L.fol}</dt><dd>${num(p.followers)}</dd></div><div><dt>${L.eng}</dt><dd>${pct(p.engagement ?? (p.id === 'instagram' ? t.engagement : null))}</dd></div>${a.credibility != null ? `<div><dt>${L.cred}</dt><dd>${pctS(a.credibility)}</dd></div>` : ''}</dl>
        ${a.followers ? aud(L.fol, a.followers) : ''}${a.engaged ? aud(L.eng2, a.engaged) : ''}</section>`;
    }).join('');
    dlg.innerHTML = `<div class="pd-in"><button class="pd-x" type="button" data-close aria-label="${L.close}">✕</button>
      <header class="pd-hd"><p class="eyebrow">${dn('region', t.country)} · ${t.platforms.map(p => (PF[p.id] || [p.id])[0]).join(' · ')}</p><h3 class="h2">${esc(t.name || t.handle)}</h3></header>
      ${pfs}${A.source ? `<p class="mono muted">${L.src} : ${esc(A.source)}</p>` : ''}</div>`;
    dlg.showModal();
  };
  d.addEventListener('click', e => { const b = e.target.closest('[data-prof]'); if (b && window.__T) { const t = window.__T.find(x => x.id === b.dataset.prof); t && openProf(t); } });

  fetch(ROOT + 'data/roster.json').then(r => r.json()).then(data => {
    const T = (data.talents || []).slice().sort((x, y) => (audience(y) || 0) - (audience(x) || 0)); window.__T = T;
    const net = d.querySelector('[data-net]');
    if (net) {
      const A = T.map(t => { const f = id => (t.platforms.find(p => p.id === id) || {}).followers || 0; return { t, a: audience(t) || 0, ig: f('instagram'), tt: f('tiktok') }; }).filter(x => x.a).sort((a, b) => b.a - a.a);
      const tot = A.reduce((s, x) => s + x.a, 0), nm = t => t.name || t.handle;
      const set = (k, v) => d.querySelectorAll(`[data-agg="${k}"]`).forEach(e => { e.textContent = v; });
      set('total', num(tot)); set('talents', T.length);
      const eng = T.map(t => t.engagement).filter(v => v != null);
      if (eng.length) set('eng', pct(eng.reduce((a, b) => a + b, 0) / eng.length));
      ['ecommerce', 'hospitality', 'crypto-fintech'].forEach(s => set('sec-' + s, T.filter(t => t.sectors.includes(s)).length));
      const ct = {}; let w = 0;
      A.forEach(x => { const au = x.t.audience || {}, f = (au.instagram && (au.instagram.followers || au.instagram.engaged)) || (au.tiktok && au.tiktok.followers); if (!f || !f.countries) return; w += x.a; f.countries.forEach(([c, v]) => { ct[c] = (ct[c] || 0) + v * x.a / 100; }); });
      const CT = Object.entries(ct).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([c, v]) => [c, v / w * 100]);
      if (w) set('fr', pct((ct.FR || 0) / w * 100));
      const bars = d.querySelector('[data-net-bars]');
      if (bars) {
        const PS = 15, pages = Math.max(1, Math.ceil(A.length / PS)), L = document.documentElement.lang.startsWith('fr');
        const pager = document.createElement('div'); pager.className = 'nb-pg';
        pager.innerHTML = `<span class="nb-pg-c" aria-live="polite"></span><span class="nb-pg-t" aria-hidden="true">${Array.from({ length: pages }, () => '<i><b></b></i>').join('')}</span><span class="nb-pg-b"><button type="button" data-d="-1" aria-label="${L ? 'Précédent' : 'Previous'}">←</button><button type="button" data-d="1" aria-label="${L ? 'Suivant' : 'Next'}">→</button></span>`;
        bars.after(pager);
        const cnt = pager.querySelector('.nb-pg-c'), ticks = [...pager.querySelectorAll('.nb-pg-t i')];
        let pg = 0, timer = null, paused = false;
        const render = () => {
          const sl = A.slice(pg * PS, pg * PS + PS), mx = sl.length ? sl[0].a : 1;
          bars.innerHTML = sl.map((x, j) => { const i = pg * PS + j, inner = `<span class="nb-n">${String(i + 1).padStart(2, '0')}</span><span class="nb-who"><span class="nb-name">${esc(nm(x.t))}</span><span class="nb-geo" title="${esc(dn('region', x.t.country))}">${esc(x.t.country || '')}</span></span><span class="nb-bar" style="--w:${(x.a / mx * 100).toFixed(1)}%"><i style="--p:${(x.ig / x.a * 100).toFixed(1)}%"></i></span><span class="nb-v">${num(x.a)}</span>`;
            return `<li style="--i:${j}">${x.t.instagram ? `<a class="nb-row" href="${esc(x.t.instagram)}" target="_blank" rel="noopener" aria-label="${esc(nm(x.t))} — Instagram">${inner}<span class="nb-go" aria-hidden="true">↗</span></a>` : `<div class="nb-row">${inner}<span class="nb-go"></span></div>`}</li>`; }).join('');
          cnt.textContent = `${String(pg * PS + 1).padStart(2, '0')}–${String(Math.min(A.length, pg * PS + PS)).padStart(2, '0')} / ${A.length}`;
          ticks.forEach((t, k) => { t.className = k < pg ? 'is-done' : k === pg ? 'is-on' : ''; });
        };
        const go = (n) => { bars.classList.add('is-out'); setTimeout(() => { pg = (n + pages) % pages; render(); bars.classList.remove('is-out'); bars.classList.remove('is-in'); void bars.offsetWidth; bars.classList.add('is-in'); }, 450); };
        const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
        const start = () => { clearInterval(timer); if (pages > 1 && !RM) timer = setInterval(() => { if (!paused) go(pg + 1); }, 5000); pager.classList.toggle('is-run', pages > 1 && !RM); };
        pager.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; go(pg + +b.dataset.d); start(); });
        const wrapEl = bars.parentElement;
        wrapEl.addEventListener('mouseenter', () => { paused = true; pager.classList.add('is-paused'); });
        wrapEl.addEventListener('mouseleave', () => { paused = false; pager.classList.remove('is-paused'); });
        wrapEl.addEventListener('focusin', () => { paused = true; pager.classList.add('is-paused'); });
        wrapEl.addEventListener('focusout', () => { paused = false; pager.classList.remove('is-paused'); });
        render();
        let seen = false, vis = false;
        const stop = () => { clearInterval(timer); timer = null; pager.classList.remove('is-run'); };
        if ('IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(e => {
          if (e.isIntersecting && !vis) { vis = true; if (!seen) { seen = true; pg = 0; render(); } else { ticks[pg] && (ticks[pg].className = ''), void pager.offsetWidth, render(); } start(); }
          else if (!e.isIntersecting && vis) { vis = false; stop(); }
        }), { threshold: 0.3 }).observe(wrapEl);
        else start();
      }
      const cEl = d.querySelector('[data-net-ctry]');
      if (cEl && CT.length) cEl.innerHTML = CT.map(([c, v]) => `<li><span class="nc-p">${pct(v)}</span><span class="nc-c">${dn('region', c)}</span><span class="nc-b"><i style="--w:${(v / CT[0][1] * 100).toFixed(1)}%"></i></span></li>`).join('');
      const igT = A.reduce((s, x) => s + x.ig, 0), ttT = A.reduce((s, x) => s + x.tt, 0), pfEl = d.querySelector('[data-net-pf]');
      if (pfEl && tot) { const p = igT / tot * 100; pfEl.innerHTML = `<div class="npf-n"><p><b>${num(igT)}</b><span>Instagram · ${pct(p)}</span></p><p><b>${num(ttT)}</b><span>TikTok · ${pct(100 - p)}</span></p></div><div class="npf-bar" style="--p:${p.toFixed(1)}%"><i></i></div>`; }
      const cc = {}; T.forEach(t => ((t.categories && (t.categories[lang] || t.categories.fr)) || []).forEach(c => { cc[c] = (cc[c] || 0) + 1; }));
      const CC = Object.entries(cc).sort((a, b) => b[1] - a[1]).slice(0, 14), cm = CC.length ? CC[0][1] : 1;
      const catEl = d.querySelector('[data-net-cats]');
      if (catEl) catEl.innerHTML = CC.map(([c, n]) => `<li style="--s:${(1 + 3.6 * Math.sqrt(n / cm)).toFixed(2)}"><span>${esc(c)}</span><sup>${n}</sup></li>`).join('');
      const tk = d.querySelector('[data-net-tick]');
      if (tk) { const h = A.map(x => `<span><b>${esc(nm(x.t))}</b><i>${num(x.a)}</i></span>`).join(''); tk.innerHTML = h + h; }
    }
    grids.forEach(g => {
      if (!g.hasAttribute('data-filterable')) {
        let list = T;
        if (g.dataset.sector) { const m = list.filter(t => t.sectors.includes(g.dataset.sector)); if (m.length) list = m; }
        if (g.dataset.limit) list = list.slice(0, +g.dataset.limit);
        return render(g, list);
      }
      const form = d.querySelector('[data-filters]'), count = d.querySelector('[data-count]');
      const used = new Set(T.flatMap(t => t.platforms.map(p => p.id)));
      [...form.elements.platform.options].forEach(o => { if (o.value && !used.has(o.value)) o.remove(); });
      const cSel = form.elements.country;
      [...new Set(T.map(t => t.country))].map(c => [c, dn('region', c)]).sort((a, b) => a[1].localeCompare(b[1], lang))
        .forEach(([c, n]) => cSel.insertAdjacentHTML('beforeend', `<option value="${c}">${n}</option>`));
      if (qs.get('sector')) form.elements.sector.value = qs.get('sector');
      const apply = () => {
        const v = Object.fromEntries(new FormData(form));
        const list = T.filter(t =>
          (!v.sector || t.sectors.includes(v.sector)) &&
          (!v.platform || t.platforms.some(p => p.id === v.platform)) &&
          (!v.country || t.country === v.country) &&
          (!v.size || size(audience(t)) === v.size));
        render(g, list);
        if (count) count.textContent = L.count(list.length);
      };
      form.addEventListener('change', apply);
      form.addEventListener('reset', () => setTimeout(apply));
      form.addEventListener('submit', e => e.preventDefault());
      apply();
    });
  }).catch(() => grids.forEach(g => { g.innerHTML = `<p class="empty">${L.err}</p>`; }));
})();

;(() => {
  const d = document, RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hx = d.querySelector('[data-hx]');
  if (hx) {
    const s = hx.querySelectorAll('.hx-s'), bars = hx.querySelectorAll('.hx-bars i'), cap = hx.querySelector('[data-hx-cap]');
    s.forEach((f, i) => { if (i) { const im = f.querySelector('img'); im && im.removeAttribute('loading'); } });
    let k = 0;
    const go = n => {
      s[k].classList.remove('is-on'); bars[k].classList.remove('is-on'); bars[k].classList.add('is-done');
      if (n === 0) bars.forEach(x => x.classList.remove('is-done'));
      k = n; s[k].classList.add('is-on'); void bars[k].offsetWidth; bars[k].classList.add('is-on');
      cap.classList.add('is-out'); setTimeout(() => { cap.textContent = bars[k].dataset.cap; cap.classList.remove('is-out'); }, 350);
    };
    if (!RM && s.length > 1) setInterval(() => { if (!d.hidden) go((k + 1) % s.length); }, 6000);
  }
  // Titres de section : révélation mot à mot
  d.querySelectorAll('main h2').forEach(h => {
    if (h.closest('[data-hx]') || h.querySelector('.line') || h.dataset.animH != null) return;
    let i = 0;
    const wrap = node => [...node.childNodes].forEach(c => {
      if (c.nodeType === 3) {
        const f = d.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach(w => { if (!w) return; if (/^\s+$/.test(w)) { f.appendChild(d.createTextNode(w)); return; } const o = d.createElement('span'); o.className = 'aw'; const n = d.createElement('span'); n.textContent = w; o.style.setProperty('--i', i++); o.firstChild; o.appendChild(n); n.style.setProperty('--i', i); f.appendChild(o); });
        c.replaceWith(f);
      } else if (c.nodeType === 1 && c.tagName !== 'BR') wrap(c);
    });
    wrap(h); h.setAttribute('data-anim-h', '');
  });
  const io = 'IntersectionObserver' in window && new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px' });
  d.querySelectorAll('[data-anim-h]').forEach(h => io ? io.observe(h) : h.classList.add('is-in'));
  // Compteurs
  const fmt = (v, t) => t.replace(/[\d.,]+/, m => { const dec = (m.split(/[.,]/)[1] || '').length; return v.toFixed(dec).replace('.', m.includes(',') ? ',' : '.'); });
  const co = 'IntersectionObserver' in window && new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; co.unobserve(e.target);
    const el = e.target, t = el.textContent, m = t.match(/[\d.,]+/); if (!m || RM) return;
    const end = parseFloat(m[0].replace(',', '.')), t0 = performance.now(), D = 1400;
    const step = now => { const p = Math.min(1, (now - t0) / D), q = 1 - Math.pow(1 - p, 3); el.textContent = fmt(end * q, t); if (p < 1) requestAnimationFrame(step); else el.textContent = t; };
    requestAnimationFrame(step);
  }), { threshold: .4 });
  setTimeout(() => d.querySelectorAll('.hx-st dt, .dx b, [data-agg], .num-xl').forEach(el => co && /\d/.test(el.textContent) && co.observe(el)), 400);
  // En-tête qui se cache au scroll
  const hd = d.querySelector('.hdr, header');
  if (hd) { let y0 = scrollY; addEventListener('scroll', () => { const y = scrollY; hd.classList.toggle('is-hid', y > y0 && y > 400); y0 = y; }, { passive: true }); }
})();
