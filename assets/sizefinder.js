/* Atelier Allaoui — maatadviseur ("Vind je maat")
   Alles wordt lokaal in de browser berekend: er wordt niets verstuurd of opgeslagen.

   MAATTABEL (lichaamsmaten in cm, [min, max]). Dit is de enige bron voor het advies.
   Pas je hier iets aan, werk dan ook de zichtbare tabel op de maatpagina's bij
   (de generator leest dit blok) en de ?v=-hash van dit bestand.
   - tolerance: binnen dit aantal cm van een grens tussen twee maten heet het "tussen twee maten".
   - limits: plausibele invoer (bewust ruim); daarbuiten vragen we alleen de meting te controleren.
   De tabel is een richtlijn: het atelier maakt elke maat. Buiten XS-XL luidt het advies daarom "op maat". */
var SF_TABLE = {
  "tolerance": 1,
  "sizes": [
    {"label": "XS", "eu": 34, "bust": [80, 84], "waist": [62, 66], "hip": [88, 92]},
    {"label": "S", "eu": 36, "bust": [84, 88], "waist": [66, 70], "hip": [92, 96]},
    {"label": "M", "eu": 38, "bust": [88, 94], "waist": [70, 76], "hip": [96, 102]},
    {"label": "L", "eu": 40, "bust": [94, 100], "waist": [76, 82], "hip": [102, 108]},
    {"label": "XL", "eu": 42, "bust": [100, 108], "waist": [82, 90], "hip": [108, 116]}
  ],
  "limits": {"bust": [60, 200], "waist": [45, 190], "hip": [70, 220], "height": [140, 210]}
};

(function (root) {
  'use strict';
  var T = SF_TABLE, S = T.sizes, N = S.length, KEYS = ['bust', 'waist', 'hip'], IN = 2.54;

  /* ---------- rekenkern (zonder DOM; ook gebruikt door de tests) ---------- */
  function r1(n) { return Math.round(n * 10) / 10; }

  /* "92", "92,5", "92.5" en Arabische cijfers; al het andere is ongeldig (NaN) */
  function parseNum(v) {
    v = String(v == null ? '' : v).trim()
      .replace(/[٠-٩]/g, function (c) { return c.charCodeAt(0) - 0x0660; })
      .replace(/[۰-۹]/g, function (c) { return c.charCodeAt(0) - 0x06F0; })
      .replace(/[٫,]/g, '.');
    return /^\d{1,3}(\.\d{1,2})?$/.test(v) ? parseFloat(v) : NaN;
  }
  function toCm(v, unit) { return unit === 'in' ? v * IN : v; }
  function fromCm(cm, unit) { return unit === 'in' ? cm / IN : cm; }
  function fmt(n, dec) { return String(r1(n)).replace('.', dec || '.'); }
  function fill(t, o) { return String(t).replace(/\{(\w+)\}/g, function (m, k) { return o[k] == null ? '' : o[k]; }); }

  /* invoer -> {ok, cm} of {ok:false, err:'empty'|'nan'|'range'} */
  function check(key, raw, unit) {
    if (String(raw == null ? '' : raw).trim() === '') return { ok: false, err: 'empty' };
    var n = parseNum(raw);
    if (isNaN(n)) return { ok: false, err: 'nan' };
    var cm = r1(toCm(n, unit)), L = T.limits[key];
    if (cm < L[0] || cm > L[1]) return { ok: false, err: 'range' };
    return { ok: true, cm: cm };
  }
  function heightCm(ft, inch) {
    var f = parseNum(ft), i = String(inch == null ? '' : inch).trim() === '' ? 0 : parseNum(inch);
    return isNaN(f) || isNaN(i) ? NaN : r1(f * 12 * IN + i * IN);
  }

  /* Eén meetpunt -> maat. Aansluitende bereiken: een waarde precies op de grens telt bij de hogere maat. */
  function sizeOf(key, cm) {
    if (cm < S[0][key][0]) return { i: 0, below: true };
    if (cm > S[N - 1][key][1]) return { i: N, above: true };
    var i = 0;
    while (i < N - 1 && cm >= S[i][key][1]) i++;
    return {
      i: i,
      nearLow: i > 0 && cm - S[i][key][0] <= T.tolerance,
      nearUp: i < N - 1 && S[i][key][1] - cm <= T.tolerance
    };
  }

  /* Advies. m = {bust, waist, hip} in cm; garment = 'kaftan' | 'takchita' | 'unknown'; fit = 'fitted' | 'roomy'
     Regels:
     1. Adviesmaat = de grootste maat van borst en heup; is de taille nog groter, dan telt die mee.
     2. Eén meetpunt buiten de standaardmaten (onder XS of boven XL), of twee of meer maten verschil -> "op maat"
        (het atelier maakt elke maat). Bij een kaftan (valt los) telt een smallere taille daarbij niet mee.
     3. Binnen de tolerantie van een grens -> "tussen twee maten" (beide tonen; de tabelmaat blijft het advies).
     4. Pasvorm "ruim" -> de volgende maat als alternatief, nooit als vervanging. */
  function advise(m, garment, fit) {
    var per = {}, top = 0, low = N, outside = false, out;
    KEYS.forEach(function (k) {
      var loose = garment === 'kaftan' && k === 'waist';
      per[k] = sizeOf(k, m[k]);
      top = Math.max(top, per[k].i);
      if (!loose) low = Math.min(low, per[k].i);
      if (per[k].above || (per[k].below && !loose)) outside = true;
    });
    out = { per: per, size: null, between: null, roomier: null, why: null, confidence: 'custom' };
    if (outside) { out.why = 'outside'; return out; }
    if (top - low >= 2) { out.why = 'spread'; return out; }
    var dec = KEYS.filter(function (k) { return per[k].i === top; });
    out.size = top;
    if (dec.some(function (k) { return per[k].nearUp; })) out.between = [top, top + 1];
    else if (dec.every(function (k) { return per[k].nearLow; })) out.between = [top - 1, top];
    out.confidence = out.between ? 'between' : 'clear';
    if (fit === 'roomy' && !out.between) out.roomier = top + 1 < N ? top + 1 : 'custom';
    return out;
  }

  function sizeName(i, sep) { return S[i].label + (sep === '(' ? ' (EU ' + S[i].eu + ')' : ' · EU ' + S[i].eu); }

  /* Waarde in de gekozen eenheid, met cm erbij als er in inch is ingevuld */
  function showVal(cm, unit, t) {
    if (unit !== 'in') return fmt(cm, t.dec) + ' ' + t.u.cm;
    return fmt(cm / IN, t.dec) + ' ' + t.u['in'] + ' (' + fmt(cm, t.dec) + ' ' + t.u.cm + ')';
  }
  function showHeight(cm, unit, t) {
    if (unit !== 'in') return fmt(cm, t.dec) + ' ' + t.u.cm;
    var tot = cm / IN, ft = Math.floor(tot / 12), inch = r1(tot - ft * 12);
    if (inch >= 12) { ft++; inch = 0; }
    return ft + ' ' + t.u.ft + ' ' + fmt(inch, t.dec) + ' ' + t.u['in'] + ' (' + fmt(cm, t.dec) + ' ' + t.u.cm + ')';
  }

  /* WhatsApp-/kopieertekst. st = {unit, cm:{bust,waist,hip,height}, heels, fit, garment, hem, product}; res = advise() of null */
  function message(st, res, t) {
    var p = [t.msg.hi], ms = [];
    KEYS.forEach(function (k) { if (st.cm[k] != null) ms.push(t.m[k] + (t.colon || ': ') + showVal(st.cm[k], st.unit, t)); });
    if (ms.length) { ms = ms.join(t.sep || ', ') + '.'; p.push(ms.charAt(0).toUpperCase() + ms.slice(1)); }
    if (st.cm.height != null) p.push(fill(t.msg.height, { v: showHeight(st.cm.height, st.unit, t) }));
    if (st.heels) p.push(fill(t.msg.heels, { v: t.val[st.heels] }));
    if (st.hem) p.push(fill(t.msg.hem, { v: t.val[st.hem] }));
    if (ms.length) {
      p.push(fill(t.msg.fit, { v: t.val[st.fit] }));
      if (st.garment !== 'unknown') p.push(fill(t.msg.garment, { v: t.val[st.garment] }));
    }
    if (res) {
      if (res.size == null) p.push(t.msg.custom);
      else {
        var a = sizeName(res.size, '(');
        if (res.between) a = fill(t.msg.between, { s: a, a: S[res.between[0]].label, b: S[res.between[1]].label });
        p.push(fill(t.msg.adv, { v: a }));
      }
    }
    if (st.product) p.push(fill(t.msg.piece, { v: st.product }));
    return p.join(' ');
  }

  var core = { table: T, parseNum: parseNum, toCm: toCm, fromCm: fromCm, fmt: fmt, check: check, heightCm: heightCm,
               sizeOf: sizeOf, advise: advise, sizeName: sizeName, message: message, showVal: showVal, showHeight: showHeight };
  if (typeof module !== 'undefined' && module.exports) { module.exports = core; return; }
  root.SizeFinder = core;

  /* ---------- pagina ---------- */
  var doc = root.document, el = doc && doc.getElementById('sf');
  if (!el) return;
  var t;
  try { t = JSON.parse(doc.getElementById('sfI18n').textContent); } catch (e) { return; }
  var $ = function (id) { return doc.getElementById(id); };
  var form = $('sfForm'), WA = 'https://wa.me/31645181359?text=';
  var inp = { bust: $('sfBust'), waist: $('sfWaist'), hip: $('sfHip'), height: $('sfHeight'), ft: $('sfFt'), inch: $('sfInch') };
  var exact = {};          /* onafgeronde cm-waarde na een eenheidswissel, tot het veld wordt bewerkt */
  var touched = {};        /* velden waarvan we een foutmelding mogen tonen */
  var unit = 'cm', product = null, lang = (doc.documentElement.lang || 'nl').slice(0, 2);
  var started = false, sent = {}, timer, gaTimer, last = null, lastRes = null;

  function track(name, params) {
    try { if (root.aaTrack) { params = params || {}; params.page_language = lang; root.aaTrack(name, params); } } catch (e) {}
  }
  function radio(name) { var r = el.querySelector('input[name="' + name + '"]:checked'); return r ? r.value : ''; }

  /* ?product=<slug> (of ?p=): alleen bekende slugs uit de ingebedde lijst */
  try {
    var q = new URLSearchParams(root.location.search), slug = (q.get('product') || q.get('p') || '').toLowerCase();
    var map = JSON.parse($('sfProducts').textContent);
    if (Object.prototype.hasOwnProperty.call(map, slug)) {
      product = map[slug][0];
      var a = doc.createElement('a');
      a.href = el.getAttribute('data-product-base') + slug + '/';
      a.textContent = product;
      $('sfProd').textContent = t.prod + ' ';
      $('sfProd').appendChild(a);
      var g = form.querySelector('input[name="garment"][value="' + ({ k: 'kaftan', t: 'takchita' }[map[slug][1]] || 'unknown') + '"]');
      if (g) g.checked = true;
    }
  } catch (e) {}

  function limitsText(key) {
    var L = T.limits[key];
    return { min: fmt(Math.ceil(fromCm(L[0], unit)), t.dec), max: fmt(Math.floor(fromCm(L[1], unit)), t.dec), u: t.u[unit], ex: unit === 'in' ? '36' : '92' };
  }
  function setErr(key, err) {
    var box = $('sfE' + key), ins = key === 'height' && unit === 'in' ? [inp.ft, inp.inch] : [inp[key]];
    box.textContent = err ? fill(err === 'nan' ? t.err.nan : key === 'height' && unit === 'in' ? t.err.heightFt : t.err.range, limitsText(key)) : '';
    ins.forEach(function (i) { if (err) i.setAttribute('aria-invalid', 'true'); else i.removeAttribute('aria-invalid'); });
  }
  function read(key) {
    if (exact[key] != null) return { ok: true, cm: exact[key] };
    if (key === 'height' && unit === 'in') {
      if (inp.ft.value.trim() === '' && inp.inch.value.trim() === '') return { ok: false, err: 'empty' };
      var cm = heightCm(inp.ft.value, inp.inch.value), L = T.limits.height;
      if (isNaN(cm)) return { ok: false, err: 'nan' };
      return cm < L[0] || cm > L[1] ? { ok: false, err: 'range' } : { ok: true, cm: cm };
    }
    return check(key, inp[key].value, unit);
  }

  function dots(res) {
    var li = $('sfDots').children, i;
    for (i = 0; i < li.length; i++) {
      li[i].className = res && res.size === i ? 'is-on' :
        res && ((res.between && (res.between[0] === i || res.between[1] === i)) || res.roomier === i) ? 'is-alt' : '';
    }
  }
  function pos(k, p) {
    return p.below ? fill(t.below, { s: S[0].label }) : p.above ? fill(t.above, { s: S[N - 1].label }) : fill(t.inS, { s: S[p.i].label });
  }

  function render(force) {
    var st = { unit: unit, cm: {}, heels: radio('heels'), fit: radio('fit'), garment: radio('garment'), hem: radio('hem'), product: product };
    var ok = true, res = null, more = [];
    KEYS.concat('height').forEach(function (k) {
      var v = read(k);
      if (v.ok) st.cm[k] = v.cm; else if (k !== 'height') ok = false;
      if (force && k !== 'height') touched[k] = true;
      if (v.ok || (v.err === 'empty' && !(force && k !== 'height'))) setErr(k, '');
      else if (touched[k]) setErr(k, v.err);
    });
    if (ok) {
      res = advise(st.cm, st.garment, st.fit);
      $('sfSize').textContent = res.size == null ? t.custom : sizeName(res.size);
      $('sfConf').textContent = t.conf[res.confidence];
      $('sfConf').setAttribute('data-c', res.confidence);
      $('sfWhy').textContent = fill(t.why, { b: pos('bust', res.per.bust), w: pos('waist', res.per.waist), h: pos('hip', res.per.hip) });
      if (res.size == null) more.push(t[res.why === 'outside' ? 'customOutside' : 'customSpread']);
      if (res.between) more.push(fill(t.between, { a: S[res.between[0]].label, b: S[res.between[1]].label }));
      if (res.roomier != null) more.push(res.roomier === 'custom' ? t.roomyCustom : fill(t.roomy, { s: sizeName(res.roomier) }));
      if (st.cm.waist > st.cm.bust) more.push(t.checkNote);
    } else {
      $('sfSize').textContent = '—';
      $('sfConf').textContent = '';
      $('sfConf').removeAttribute('data-c');
      $('sfWhy').textContent = t.empty;
    }
    $('sfMore').textContent = more.join(' ');
    el.classList.toggle('has-res', ok);
    dots(res);
    last = message(st, res, t); lastRes = res;
    $('sfWa').href = WA + encodeURIComponent(last);
    clearTimeout(gaTimer);
    if (res) gaTimer = setTimeout(function () {
      var size = res.size == null ? 'custom' : S[res.size].label, key = size + '|' + res.confidence;
      if (!sent[key]) { sent[key] = 1; track('size_finder_result', { size: size, confidence: res.confidence }); }
    }, 1200);
    return ok;
  }
  function soon() { clearTimeout(timer); timer = setTimeout(render, 250); }

  /* Eenheid wisselen: waarden omrekenen, de exacte cm-waarde bewaren zodat heen en weer wisselen niets verliest */
  function setUnit(u) {
    if (u === unit) return;
    var cm = {};
    KEYS.concat('height').forEach(function (k) { var v = read(k); if (v.ok) cm[k] = v.cm; });
    unit = u;
    el.setAttribute('data-unit', u);
    KEYS.forEach(function (k) {
      if (cm[k] != null) { exact[k] = cm[k]; inp[k].value = fmt(fromCm(cm[k], u), t.dec); }
    });
    if (cm.height != null) {
      exact.height = cm.height;
      var tot = cm.height / IN, ft = Math.floor(tot / 12), i = r1(tot - ft * 12);
      if (i >= 12) { ft++; i = 0; }
      inp.height.value = fmt(cm.height, t.dec); inp.ft.value = ft; inp.inch.value = fmt(i, t.dec);
    } else { inp.height.value = inp.ft.value = inp.inch.value = ''; }
    [].forEach.call(el.querySelectorAll('[data-u]'), function (n) { n.textContent = t.u[u]; });
    render();
  }

  el.addEventListener('input', function (e) {
    var n = e.target, k = n.getAttribute('data-k');
    if (!k) return;
    delete exact[k];
    if (!started) { started = true; track('size_finder_start'); }
    soon();
  });
  el.addEventListener('change', function (e) {
    var n = e.target, k = n.getAttribute('data-k');
    if (n.name === 'unit') return setUnit(n.value);
    if (k) touched[k] = true;
    render();
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearTimeout(timer);
    if (render(true)) {
      var card = $('sfRes');
      card.focus({ preventScroll: true });
      if (card.getBoundingClientRect().top > root.innerHeight * 0.55 || card.getBoundingClientRect().top < 0) {
        card.scrollIntoView({ block: 'start', behavior: root.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      }
    } else {
      var bad = form.querySelector('[aria-invalid="true"]');
      if (bad) bad.focus();
    }
  });

  /* Illustratie: de meetlijn van het actieve veld licht op */
  var fig = $('sfFig');
  el.addEventListener('focusin', function (e) {
    var k = e.target.getAttribute && e.target.getAttribute('data-k');
    if (k) fig.setAttribute('data-on', k);
  });
  el.addEventListener('focusout', function () { fig.removeAttribute('data-on'); });
  var figBtn = $('sfFigBtn');
  figBtn.addEventListener('click', function () {
    var open = el.classList.toggle('fig-off') === false;
    figBtn.setAttribute('aria-expanded', String(open));
    figBtn.textContent = open ? t.figHide : t.figShow;
  });

  /* Kopiëren: alleen op klik */
  $('sfCopy').addEventListener('click', function () {
    var btn = this, done = function (ok) {
      $('sfCopied').textContent = ok ? t.copied : t.copyFail;
      if (ok) { btn.textContent = t.copied; setTimeout(function () { btn.textContent = t.copy; $('sfCopied').textContent = ''; }, 2500); }
    };
    render();
    if (root.navigator.clipboard && root.navigator.clipboard.writeText) {
      root.navigator.clipboard.writeText(last).then(function () { done(true); }, function () { done(false); });
    } else {
      var ta = doc.createElement('textarea'), ok = false;
      ta.value = last; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      doc.body.appendChild(ta); ta.select();
      try { ok = doc.execCommand('copy'); } catch (e) {}
      doc.body.removeChild(ta); done(ok);
    }
  });

  /* WhatsApp-klik vanuit de adviseur: één whatsapp_click met eigen locatie (alleen na toestemming; geen maten).
     Capture op window loopt vóór de algemene klik-meting in site.js, zodat er niet dubbel wordt geteld. */
  root.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('#sfWa') : null;
    if (!a) return;
    render();
    e.stopPropagation();
    track('whatsapp_click', { link_location: 'size_finder', source: 'size_finder', page_path: root.location.pathname });
  }, true);

  el.setAttribute('data-unit', unit);
  if (radio('unit') === 'in') setUnit('in'); else render();
})(typeof window !== 'undefined' ? window : this);
