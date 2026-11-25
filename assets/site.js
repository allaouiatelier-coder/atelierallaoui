(function () {
var hdr = document.getElementById('hdr');
if (hdr && !hdr.classList.contains('hdr--solid')) {
var onScroll = function () { hdr.classList.toggle('is-stuck', window.scrollY > 80); };
onScroll();
addEventListener('scroll', onScroll, { passive: true });
}
var drawer = document.getElementById('drawer'), burger = document.getElementById('burger'),
bbarMenu = document.getElementById('bbarMenu');
if (drawer) {
var setDrawer = function (open) {
drawer.classList.toggle('is-open', open);
drawer.setAttribute('aria-hidden', String(!open));
if (burger) { burger.setAttribute('aria-expanded', String(open)); burger.classList.toggle('is-open', open); }
if (bbarMenu) bbarMenu.setAttribute('aria-expanded', String(open));
document.body.style.overflow = open ? 'hidden' : '';
};
if (burger) burger.addEventListener('click', function () { setDrawer(!drawer.classList.contains('is-open')); });
if (bbarMenu) bbarMenu.addEventListener('click', function () { setDrawer(!drawer.classList.contains('is-open')); });
var close = document.getElementById('drawerClose');
if (close) close.addEventListener('click', function () { setDrawer(false); });
drawer.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setDrawer(false); }); });
addEventListener('keydown', function (e) { if (e.key === 'Escape') setDrawer(false); });
}
var bbar = document.getElementById('bbar');
if (bbar) {
var path = location.pathname.replace(/\/(nl|fr|en)\/?/, '/').replace(/\/index\.html$/, '/');
var tabMap = { '/': 'home', '/shop/': 'shop', '/custom-made/': 'custom', '/contact/': 'contact' };
var active = tabMap[path] || '';
bbar.querySelectorAll('[data-tab]').forEach(function (tab) {
if (tab.getAttribute('data-tab') === active) tab.classList.add('is-on');
});
}
var io = new IntersectionObserver(function (entries) {
entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
}, { threshold: .12, rootMargin: '0px 0px -6%' });
document.querySelectorAll('.rv').forEach(function (el) { io.observe(el); });
document.querySelectorAll('.steps li').forEach(function (el) { io.observe(el); });
document.querySelectorAll('.card__media').forEach(function (media) {
var img = media.querySelector('picture img');
if (!img) { media.classList.add('is-loaded'); return; }
function done() { img.classList.add('is-loaded'); media.classList.add('is-loaded'); }
if (img.complete && img.naturalWidth > 0) { done(); return; }
img.addEventListener('load', done);
img.addEventListener('error', done);
});
document.querySelectorAll('.acc__btn').forEach(function (btn) {
btn.setAttribute('aria-expanded', 'false');
btn.addEventListener('click', function () {
var item = btn.closest('.acc__item');
var panel = item.querySelector('.acc__panel');
var open = item.classList.toggle('is-open');
btn.setAttribute('aria-expanded', String(open));
panel.style.maxHeight = open ? panel.scrollHeight + 'px' : 0;
});
});
document.querySelectorAll('.sizes').forEach(function (group) {
group.addEventListener('click', function (e) {
var b = e.target.closest('.size');
if (!b || b.classList.contains('is-off')) return;
group.querySelectorAll('.size').forEach(function (s) { s.classList.remove('is-on'); s.setAttribute('aria-pressed', 'false'); });
b.classList.add('is-on'); b.setAttribute('aria-pressed', 'true');
var tpl = group.getAttribute('data-size-tpl');
if (tpl) {
document.querySelectorAll('a[data-wa-base]').forEach(function (a) {
a.href = a.getAttribute('data-wa-base') + encodeURIComponent(tpl.replace('__S__', b.textContent.trim()));
});
}
});
});
var ft = document.getElementById('filterToggle'), fp = document.getElementById('filters');
if (ft && fp) {
ft.addEventListener('click', function () {
var open = fp.classList.toggle('is-open');
ft.setAttribute('aria-expanded', String(open));
ft.textContent = open ? (ft.getAttribute('data-hide') || 'Filters verbergen') : (ft.getAttribute('data-show') || 'Filters');
});
}
var shopGrid = document.querySelector('[data-shop-grid]');
if (shopGrid && fp) {
var count = document.querySelector('.toolbar__count');
var apply = function (cat) {
var n = 0;
shopGrid.querySelectorAll('.card').forEach(function (c) {
var cats = (c.getAttribute('data-cats') || '').split(' ');
var show = cat === 'all' || cats.indexOf(cat) > -1;
c.style.display = show ? '' : 'none';
if (show) n++;
});
fp.querySelectorAll('[data-cat]').forEach(function (b) {
b.setAttribute('aria-current', b.getAttribute('data-cat') === cat ? 'true' : 'false');
});
if (count) {
var one = count.getAttribute('data-one') || 'stuk', many = count.getAttribute('data-many') || 'stukken';
count.textContent = n + ' ' + (n === 1 ? one : many);
}
if (history.replaceState) history.replaceState(null, '', cat === 'all' ? location.pathname : '?cat=' + cat);
};
fp.addEventListener('click', function (e) {
var b = e.target.closest('[data-cat]');
if (b) { e.preventDefault(); apply(b.getAttribute('data-cat')); }
});
var q = new URLSearchParams(location.search).get('cat');
apply(q && fp.querySelector('[data-cat="' + q + '"]') ? q : 'all');
}
var qText = document.getElementById('quoteText');
if (qText) {
var box = document.getElementById('quote'), qName = document.getElementById('quoteName'),
dots = document.getElementById('dots'), qi = 0, quotes = [];
try { quotes = JSON.parse(box.getAttribute('data-quotes') || '[]'); } catch (err) { quotes = []; }
if (quotes.length) {
box.style.transition = 'opacity .26s';
dots.innerHTML = '';
quotes.forEach(function (_, i) {
var b = document.createElement('button');
b.className = 'dot' + (i === 0 ? ' is-on' : '');
b.setAttribute('aria-label', (dots.getAttribute('data-label') || 'Ervaring') + ' ' + (i + 1));
b.addEventListener('click', function () { show(i); });
dots.appendChild(b);
});
var show = function (i) {
qi = i; box.style.opacity = 0;
setTimeout(function () { qText.textContent = quotes[i][0]; qName.textContent = quotes[i][1]; box.style.opacity = 1; }, 260);
[].forEach.call(dots.children, function (d, n) { d.classList.toggle('is-on', n === i); });
};
show(0);
setInterval(function () { show((qi + 1) % quotes.length); }, 7000);
}
}
document.querySelectorAll('.card__dots').forEach(function (dots) {
var card = dots.closest('.card');
if (!card) return;
var pic = card.querySelector('.card__media picture');
if (!pic) return;
var origWebp = pic.querySelector('source') ? pic.querySelector('source').getAttribute('srcset') : '';
var origJpg = pic.querySelector('img') ? pic.querySelector('img').getAttribute('src') : '';
dots.querySelectorAll('.card__cdot[data-webp]').forEach(function (dot) {
dot.addEventListener('mouseenter', function () {
var s = pic.querySelector('source'); if (s) s.setAttribute('srcset', dot.getAttribute('data-webp'));
var i = pic.querySelector('img'); if (i) i.setAttribute('src', dot.getAttribute('data-jpg'));
});
dot.addEventListener('mouseleave', function () {
var s = pic.querySelector('source'); if (s) s.setAttribute('srcset', origWebp);
var i = pic.querySelector('img'); if (i) i.setAttribute('src', origJpg);
});
});
});
document.querySelectorAll('[data-year]').forEach(function (y) { y.textContent = new Date().getFullYear(); });
var cb = document.getElementById('cookieBanner');
if (cb) {
var consent = null;
try { consent = localStorage.getItem('aa_consent'); } catch (e) {}
if (consent) {
cb.style.display = 'none';
if (consent === 'all') loadAnalytics();
} else {
cb.style.display = 'flex';
}
cb.addEventListener('click', function (e) {
var btn = e.target.closest('[data-consent]');
if (!btn) return;
var choice = btn.getAttribute('data-consent');
try { localStorage.setItem('aa_consent', choice); } catch (e) {}
cb.style.display = 'none';
if (choice === 'all') loadAnalytics();
});
}
function loadAnalytics() {
if (window._gaLoaded) return;
window._gaLoaded = true;
var GA_ID = 'G-HXB1X7KVGK';
var s = document.createElement('script');
s.async = true;
s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
document.head.appendChild(s);
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
gtag('js', new Date());
gtag('config', GA_ID, { anonymize_ip: true, cookie_flags: 'SameSite=None;Secure' });
    /* Formulier-conversie: na verzenden landt de bezoeker op /bedankt/ */
    try {
      var ff = sessionStorage.getItem('aa_form');
      if (ff && /\/bedankt\/?$/.test(location.pathname)) {
        gtag('event', 'generate_lead', { form_name: ff });
        sessionStorage.removeItem('aa_form');
      }
    } catch (e) {}
}
var gal = document.querySelector('.gallery');
if (gal) {
var phs = [].slice.call(gal.querySelectorAll('.ph'));
if (phs.length) {
var lb = document.createElement('div'); lb.className = 'lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true');
var LBT = ({nl:['Sluiten','Vorige','Volgende'],en:['Close','Previous','Next'],fr:['Fermer','Précédent','Suivant']})[(document.documentElement.lang||'nl').slice(0,2)] || ['Sluiten','Vorige','Volgende'];
      var inner = '<button class="lb__close" aria-label="' + LBT[0] + '">' + LBT[0] + '</button>';
inner += '<button class="lb__arr lb__arr--prev" aria-label="' + LBT[1] + '">&#8249;</button>';
inner += '<button class="lb__arr lb__arr--next" aria-label="' + LBT[2] + '">&#8250;</button>';
inner += '<div class="lb__counter"></div><div class="lb__inner">';
phs.forEach(function (ph, i) {
var pic = ph.querySelector('picture');
var slideContent = pic
? '<img data-src="' + pic.querySelector('img').getAttribute('src') + '" alt="' + (pic.querySelector('img').getAttribute('alt') || '') + '" style="width:100%;height:100%;object-fit:contain">'
: '<div class="ph ' + ph.className.replace('ph ', '') + '" style="' + (ph.getAttribute('style') || '') + '"></div>';
inner += '<div class="lb__slide' + (i === 0 ? ' is-active' : '') + '">' + slideContent + '</div>';
});
inner += '</div><div class="lb__dots">';
phs.forEach(function (_, i) {
inner += '<button class="lb__dot' + (i === 0 ? ' is-on' : '') + '" aria-label="Foto ' + (i+1) + '"></button>';
});
inner += '</div>';
lb.innerHTML = inner;
document.body.appendChild(lb);
var slides = [].slice.call(lb.querySelectorAll('.lb__slide'));
var dots = [].slice.call(lb.querySelectorAll('.lb__dot'));
var counter = lb.querySelector('.lb__counter');
var ci = 0;
function lbShow(i) {
ci = (i + slides.length) % slides.length; [ci, ci + 1, ci - 1].forEach(function (n) { var sl = slides[(n + slides.length) % slides.length], im = sl && sl.querySelector('img[data-src]'); if (im) { im.src = im.getAttribute('data-src'); im.removeAttribute('data-src'); } });
slides.forEach(function (s, n) { s.classList.toggle('is-active', n === ci); });
dots.forEach(function (d, n) { d.classList.toggle('is-on', n === ci); });
counter.textContent = (ci + 1) + ' / ' + slides.length;
}
function lbOpen(i) { lbShow(i); lb.classList.add('is-open'); document.body.style.overflow = 'hidden'; }
function lbClose() { lb.classList.remove('is-open'); document.body.style.overflow = ''; }
phs.forEach(function (ph, i) { ph.addEventListener('click', function (e) { e.preventDefault(); lbOpen(i); }); });
lb.querySelector('.lb__close').addEventListener('click', lbClose);
lb.querySelector('.lb__arr--prev').addEventListener('click', function () { lbShow(ci - 1); });
lb.querySelector('.lb__arr--next').addEventListener('click', function () { lbShow(ci + 1); });
dots.forEach(function (d, i) { d.addEventListener('click', function () { lbShow(i); }); });
lb.addEventListener('click', function (e) { if (e.target === lb) lbClose(); });
addEventListener('keydown', function (e) {
if (!lb.classList.contains('is-open')) return;
if (e.key === 'Escape') lbClose();
if (e.key === 'ArrowLeft') lbShow(ci - 1);
if (e.key === 'ArrowRight') lbShow(ci + 1);
});
var tx = 0, ty = 0;
lb.addEventListener('touchstart', function (e) {
tx = e.touches[0].clientX; ty = e.touches[0].clientY;
}, { passive: true });
lb.addEventListener('touchend', function (e) {
var dx = e.changedTouches[0].clientX - tx;
var dy = e.changedTouches[0].clientY - ty;
if (Math.abs(dy) > 80 && dy > 0 && Math.abs(dy) > Math.abs(dx)) { lbClose(); return; }
if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) lbShow(ci + (dx < 0 ? 1 : -1));
});
}
}
})();
(function () {
var v = document.getElementById('heroVideo'),
btn = document.getElementById('heroSound');
if (!v) return;
  /* Mobiel / zuinige verbinding: alleen de poster, geen video-download (bespaart ~2 MB) */
  var cn = navigator.connection || {};
  if (innerWidth < 768 || cn.saveData || /(^|-)(2g|3g)$/.test(cn.effectiveType || '')) {
    if (btn) btn.hidden = true;
    return;
  }

var mp4 = v.getAttribute('data-mp4') || '';
var webm = v.getAttribute('data-webm') || '';
v.muted = true;
v.playsInline = true;
v.setAttribute('muted', '');
v.setAttribute('playsinline', '');
if (webm) { var s1 = document.createElement('source'); s1.src = webm; s1.type = 'video/webm'; v.appendChild(s1); }
if (mp4)  { var s2 = document.createElement('source'); s2.src = mp4;  s2.type = 'video/mp4';  v.appendChild(s2); }
var playing = false;
function onPlaying() {
if (playing) return;
playing = true;
v.classList.add('is-playing');
}
v.addEventListener('playing', onPlaying);
v.addEventListener('timeupdate', function () {
if (v.currentTime > 0.05) onPlaying();
});
function tryPlay() {
var p = v.play();
if (p && p.then) p.then(function(){}).catch(function(){});
}
if (v.readyState >= 3) {
tryPlay();
} else {
v.addEventListener('canplay', function () { tryPlay(); }, { once: true });
v.load();
}
if (!btn) return;
function setState(on) {
v.muted = !on;
if (!on) v.setAttribute('muted', '');
else v.removeAttribute('muted');
btn.classList.toggle('is-on', on);
btn.setAttribute('aria-pressed', on ? 'true' : 'false');
btn.setAttribute('aria-label', on ? (btn.getAttribute('data-off') || 'Geluid uitzetten') : (btn.getAttribute('data-on') || 'Geluid aanzetten'));
var t = btn.querySelector('.hero__sound-txt');
if (t) t.textContent = on ? (btn.getAttribute('data-txt-on') || 'Geluid aan') : (btn.getAttribute('data-txt-off') || 'Geluid');
}
setState(false);
btn.addEventListener('click', function () {
var turnOn = v.muted;
setState(turnOn);
if (turnOn) { v.volume = 1; var p = v.play(); if (p && p.catch) p.catch(function(){}); }
});
})();
(function () {
var cart = [];
var cartBtn = document.getElementById('cartBtn');
var cartCount = document.getElementById('cartCount');
var cartDrawer = document.getElementById('cartDrawer');
var cartOverlay = document.getElementById('cartOverlay');
var cartClose = document.getElementById('cartClose');
var cartBody = document.getElementById('cartBody');
var cartList = document.getElementById('cartList');
var cartEmpty = document.getElementById('cartEmpty');
var cartFoot = document.getElementById('cartFoot');
var cartSend = document.getElementById('cartSend');
if (!cartDrawer) return;
try {
var saved = sessionStorage.getItem('aa_cart');
if (saved) cart = JSON.parse(saved);
} catch (e) {}
function saveCart() {
try { sessionStorage.setItem('aa_cart', JSON.stringify(cart)); } catch (e) {}
}
function updateCount() {
var n = cart.length;
if (cartCount) {
cartCount.textContent = n > 0 ? n : '';
cartCount.style.display = n > 0 ? '' : 'none';
}
if (cartBtn) cartBtn.setAttribute('data-count', n);
document.querySelectorAll('[data-add-cart]').forEach(function (btn) {
var slug = btn.getAttribute('data-slug');
var inCart = cart.some(function (item) { return item.slug === slug; });
if (inCart) {
btn.classList.add('is-added');
btn.textContent = btn.getAttribute('data-added') || 'Added ✓';
} else {
btn.classList.remove('is-added');
var label = btn.getAttribute('data-label') || 'Add';
if (btn.querySelector('svg')) {
var svg = btn.querySelector('svg');
btn.textContent = '';
btn.appendChild(svg);
btn.appendChild(document.createTextNode(label));
} else {
btn.textContent = label;
}
}
});
}
function renderDrawer() {
if (!cartList) return;
cartList.innerHTML = '';
if (cart.length === 0) {
cartEmpty.style.display = '';
cartFoot.style.display = 'none';
return;
}
cartEmpty.style.display = 'none';
cartFoot.style.display = '';
cart.forEach(function (item, idx) {
var li = document.createElement('li');
li.className = 'cart-item';
li.style.animationDelay = (idx * 0.06) + 's';
var imgHtml = '';
if (item.img) {
imgHtml = '<picture class="cart-item__img">'
+ '<source srcset="/assets/img/products/' + item.img + '-thumb.webp" type="image/webp">'
+ '<img src="/assets/img/products/' + item.img + '-thumb.jpg" alt="' + item.name + '" loading="lazy" width="80" height="110">'
+ '</picture>';
} else {
imgHtml = '<div class="cart-item__ph"></div>';
}
li.innerHTML = imgHtml
+ '<div class="cart-item__info">'
+ '<span class="cart-item__cat">' + item.cat + '</span>'
+ '<span class="cart-item__name">' + item.name + '</span>'
+ '</div>'
+ '<button class="cart-item__rm" type="button" data-rm="' + idx + '" aria-label="Remove">'
+ '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
+ '</button>';
cartList.appendChild(li);
});
if (cartSend) {
var countSpan = cartSend.querySelector('.cart-drawer__count');
if (!countSpan) {
countSpan = document.createElement('span');
countSpan.className = 'cart-drawer__count';
cartSend.appendChild(countSpan);
}
countSpan.textContent = cart.length;
}
}
var cartPanel = cartDrawer.querySelector('.cart-drawer__panel');
function openDrawer() {
renderDrawer();
cartDrawer.classList.add('is-open');
cartDrawer.setAttribute('aria-hidden', 'false');
document.body.style.overflow = 'hidden';
if (cartPanel) cartPanel.style.transform = '';
}
function closeDrawer() {
cartDrawer.classList.remove('is-open');
cartDrawer.setAttribute('aria-hidden', 'true');
document.body.style.overflow = '';
if (cartPanel) cartPanel.style.transform = '';
}
function bumpCart() {
if (!cartBtn) return;
cartBtn.classList.remove('is-bump');
void cartBtn.offsetWidth;
cartBtn.classList.add('is-bump');
}
if (cartBtn) cartBtn.addEventListener('click', function () { openDrawer(); });
if (cartOverlay) cartOverlay.addEventListener('click', function () { closeDrawer(); });
if (cartClose) cartClose.addEventListener('click', function () { closeDrawer(); });
addEventListener('keydown', function (e) {
if (e.key === 'Escape' && cartDrawer.classList.contains('is-open')) closeDrawer();
});
(function () {
if (!cartPanel) return;
var sx = 0, sy = 0, dx = 0, lock = false;
cartPanel.addEventListener('touchstart', function (e) {
var t = e.touches[0]; sx = t.clientX; sy = t.clientY; dx = 0; lock = false;
}, { passive: true });
cartPanel.addEventListener('touchmove', function (e) {
if (lock) return;
var t = e.touches[0];
var mx = t.clientX - sx, my = t.clientY - sy;
if (Math.abs(my) > Math.abs(mx) && Math.abs(mx) < 10) { lock = true; return; }
dx = Math.max(0, mx);
if (dx > 8) {
cartPanel.style.transition = 'none';
cartPanel.style.transform = 'translateX(' + dx + 'px)';
}
}, { passive: true });
cartPanel.addEventListener('touchend', function () {
cartPanel.style.transition = '';
if (dx > 80) { closeDrawer(); } else { cartPanel.style.transform = ''; }
dx = 0;
}, { passive: true });
})();
document.addEventListener('click', function (e) {
var btn = e.target.closest('[data-add-cart]');
if (!btn) return;
e.preventDefault();
e.stopPropagation();
var slug = btn.getAttribute('data-slug');
var exists = cart.findIndex(function (item) { return item.slug === slug; });
if (exists > -1) {
cart.splice(exists, 1);
} else {
cart.push({
slug: slug,
name: btn.getAttribute('data-name'),
cat: btn.getAttribute('data-cat'),
img: btn.getAttribute('data-img') || ''
});
bumpCart();
setTimeout(function () { openDrawer(); }, 250);
}
saveCart();
updateCount();
});
if (cartList) cartList.addEventListener('click', function (e) {
var rm = e.target.closest('[data-rm]');
if (!rm) return;
var idx = parseInt(rm.getAttribute('data-rm'), 10);
var li = rm.closest('.cart-item');
if (li) {
li.classList.add('is-removing');
setTimeout(function () {
cart.splice(idx, 1);
saveCart();
updateCount();
renderDrawer();
}, 280);
} else {
cart.splice(idx, 1);
saveCart();
updateCount();
renderDrawer();
}
});
if (cartSend) cartSend.addEventListener('click', function () {
if (cart.length === 0) return;
var intro = cartSend.getAttribute('data-intro') || '';
var lines = cart.map(function (item, i) {
return (i + 1) + '. ' + item.name + ' (' + item.cat + ')';
});
var msg = intro + '\n\n' + lines.join('\n');
var phone = cartSend.getAttribute('data-wa') || '';
window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(msg), '_blank');
});
updateCount();
})();
(function () {
var KEY = 'aa_wishlist';
var wish = [];
try { var s = localStorage.getItem(KEY); if (s) wish = JSON.parse(s); } catch (e) {}
function save() {
try { localStorage.setItem(KEY, JSON.stringify(wish)); } catch (e) {}
}
function isWished(slug) { return wish.indexOf(slug) > -1; }
function toggle(slug) {
var i = wish.indexOf(slug);
if (i > -1) wish.splice(i, 1); else wish.push(slug);
save();
}
document.querySelectorAll('.card__wish').forEach(function (btn) {
var slug = btn.getAttribute('data-slug');
if (!slug) return;
if (isWished(slug)) btn.classList.add('is-saved');
btn.addEventListener('click', function (e) {
e.preventDefault(); e.stopPropagation();
toggle(slug);
btn.classList.toggle('is-saved', isWished(slug));
});
});
var wc = document.getElementById('wishCount');
if (wc) {
function updateWC() { wc.textContent = wish.length > 0 ? wish.length : ''; }
updateWC();
document.addEventListener('click', function (e) {
if (e.target.closest('.card__wish')) setTimeout(updateWC, 50);
});
}
})();
(function () {
var overlay = document.getElementById('sizeGuide');
if (!overlay) return;
var modal = overlay.querySelector('.sg-modal');
function sgOpen() {
overlay.classList.add('is-open');
document.body.style.overflow = 'hidden';
}
function sgClose() {
overlay.classList.remove('is-open');
document.body.style.overflow = '';
}
document.querySelectorAll('[data-size-guide]').forEach(function (btn) {
btn.addEventListener('click', function (e) { e.preventDefault(); sgOpen(); });
});
overlay.querySelector('.sg-modal__close').addEventListener('click', sgClose);
overlay.addEventListener('click', function (e) { if (e.target === overlay) sgClose(); });
addEventListener('keydown', function (e) {
if (e.key === 'Escape' && overlay.classList.contains('is-open')) sgClose();
});
var sy = 0;
modal.addEventListener('touchstart', function (e) { sy = e.touches[0].clientY; }, { passive: true });
modal.addEventListener('touchend', function (e) {
if (e.changedTouches[0].clientY - sy > 80) sgClose();
});
})();
function sendCustomForm(form) {
  var d = new FormData(form);
  var lg = (document.documentElement.lang || 'nl').slice(0, 2);
  var T = {
    nl: ['Naam', 'Tel', 'Type', 'Gelegenheid', 'Kleuren', 'Budget', 'Wensen', 'Hallo, ik wil graag een stuk op maat laten maken.'],
    en: ['Name', 'Phone', 'Type', 'Occasion', 'Colours', 'Budget', 'Wishes', 'Hello, I would like to have a piece made to measure.'],
    fr: ['Nom', 'Tél', 'Type', 'Occasion', 'Couleurs', 'Budget', 'Souhaits', 'Bonjour, je souhaite faire réaliser une pièce sur mesure.']
  }[lg] || null;
  if (!T) T = ['Naam', 'Tel', 'Type', 'Gelegenheid', 'Kleuren', 'Budget', 'Wensen', 'Hallo, ik wil graag een stuk op maat laten maken.'];
  var keys = ['name', 'phone', 'type', 'occasion', 'colors', 'budget', 'notes'];
  var lines = [];
  keys.forEach(function (k, i) { if (d.get(k)) lines.push('*' + T[i] + ':* ' + d.get(k)); });
  var msg = T[7] + '\n\n' + lines.join('\n');
  var phone = form.getAttribute('data-wa');
  window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(msg), '_blank');
  return false;
}
(function () {
var btt = document.getElementById('btt');
if (!btt) return;
var last = 0;
addEventListener('scroll', function () {
var y = window.scrollY;
btt.classList.toggle('is-visible', y > 500);
last = y;
}, { passive: true });
btt.addEventListener('click', function () {
window.scrollTo({ top: 0, behavior: 'smooth' });
});
})();
(function () {
var main = document.getElementById('main');
if (main) main.classList.add('page-enter');
})();
document.querySelectorAll('.share__copy').forEach(function (btn) {
btn.addEventListener('click', function () {
var url = btn.getAttribute('data-url');
if (!url) return;
if (navigator.clipboard && navigator.clipboard.writeText) {
navigator.clipboard.writeText(url).then(function () { feedback(); });
} else {
var ta = document.createElement('textarea');
ta.value = url; ta.style.position = 'fixed'; ta.style.opacity = '0';
document.body.appendChild(ta); ta.select();
try { document.execCommand('copy'); feedback(); } catch (e) {}
document.body.removeChild(ta);
}
function feedback() {
btn.classList.add('is-copied');
var orig = btn.innerHTML;
var label = btn.getAttribute('data-copied') || 'Copied!';
btn.innerHTML = '<span style="font-size:10px;letter-spacing:.12em;text-transform:uppercase">' + label + '</span>';
setTimeout(function () { btn.innerHTML = orig; btn.classList.remove('is-copied'); }, 1800);
}
});
});
if ('serviceWorker' in navigator) {
window.addEventListener('load', function () {
navigator.serviceWorker.register('/sw.js').catch(function () {});
});
}
;(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var PX = [
    ['.hero__poster, .hero__video', '.hero', 30, 1.1],
    ['.feature > .ph', '.feature', 34, 1.14],
    ['.pagehead > .ph', '.pagehead', 26, 1.14],
    ['.card__media picture', '.card__media', 11, 1.07]
  ];
  var items = [], ticking = false, vh = window.innerHeight;
  function initParallax() {
    if (reduce.matches || !('IntersectionObserver' in window)) return;
    PX.forEach(function (c) {
      document.querySelectorAll(c[0]).forEach(function (el) {
        var ref = el.closest(c[1]);
        if (!ref) return;
        el.setAttribute('data-px', '');
        items.push({ el: el, ref: ref, max: c[2], scale: c[3], vis: false, y: null });
      });
    });
    if (!items.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        items.forEach(function (it) {
          if (it.ref !== e.target) return;
          it.vis = e.isIntersecting;
          it.el.style.willChange = it.vis ? 'transform' : '';
        });
      });
      request();
    }, { rootMargin: '10% 0px' });
    var seen = [];
    items.forEach(function (it) { if (seen.indexOf(it.ref) < 0) { seen.push(it.ref); io.observe(it.ref); } });
    addEventListener('scroll', request, { passive: true });
    addEventListener('resize', function () { vh = innerHeight; request(); }, { passive: true });
    reduce.addEventListener && reduce.addEventListener('change', function () {
      if (reduce.matches) items.forEach(function (it) { it.el.style.transform = ''; });
    });
    request();
  }
  function request() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  function update() {
    ticking = false;
    if (reduce.matches) return;
    var k = innerWidth < 768 ? 0.6 : 1;
    var rects = items.map(function (it) { return it.vis ? it.ref.getBoundingClientRect() : null; });
    items.forEach(function (it, i) {
      var r = rects[i]; if (!r) return;
      var off = ((r.top + r.height / 2) - vh / 2) / (vh / 2 + r.height / 2);   // -1 … 1
      off = Math.max(-1, Math.min(1, off));
      var y = Math.round(-off * it.max * k * 2) / 2;
      if (y === it.y) return;
      it.y = y;
      it.el.style.transform = 'translate3d(0,' + y + 'px,0) scale(' + it.scale + ')';
    });
  }
  function start() { initParallax(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

/* Onthoud welk Netlify-formulier is verstuurd (voor de conversiemeting op /bedankt/) */
document.addEventListener('submit', function (e) {
  var f = e.target;
  if (f && f.hasAttribute && f.hasAttribute('data-netlify')) {
    try { sessionStorage.setItem('aa_form', f.getAttribute('name') || 'form'); } catch (x) {}
  }
}, true);
