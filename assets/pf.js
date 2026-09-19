/* ============================================================
   PRETTY FOCUSSED — the Plan
   Three questions, an address, and a plan she can read in seconds.

     1. CONFIG      keys, flags, the founding offer
     2. DATA        the twelve areas
     3. STATE       answers, storage, the URL hash
     4. MATHS       minutes to percentages that always sum to 100
     5. ANALYTICS   the funnel events
     6. MAP         the proportional composition
     7. VIEWS       routing and the focal-plane transition
     8. QUESTIONS   areas, one thing, time
     9. UNLOCK      the address, the reveal
    10. KLAVIYO     subscription + pretty_focussed_plan_created
    11. BOOT

   Nothing here talks to a server until an address is given.
   ============================================================ */
(function(){
'use strict';

/* ============================================================ 1. CONFIG */
var CONFIG = {
  klaviyo: {
    companyId: 'XJhFyV',          // public site id. Safe in the browser.
    listId:    'XNCgAA',          // Marketing · Email
    revision:  '2025-01-15',
    wording:   'plan-v2',         // version of the consent line under the form
    metric:    'pretty_focussed_plan_created',
    /* Campaign traffic that arrives already consented (the Instagram DM flow).
       Keyed by utm_campaign, lowercased. Carried over from the old assessment. */
    campaigns: { 'focus-30': { listId:'Vq8S75', source:'focus-30' } }
  },
  /* Optional. Set to the deployed netlify/functions/klaviyo-plan URL and every
     Klaviyo write goes through the server instead. Empty = Klaviyo's public
     client endpoints, which take the site id only and never a private key. */
  endpoint: '',
  /* Keep in step with LIST_OPEN in waitlist.html and founding.html. */
  listOpen: true,
  /* ?preview=1 runs the whole experience and sends nothing. */
  preview: /[?&]preview=1/.test(location.search),
  /* The founding offer, mirrored from OFFER in founding.html. live:false turns
     the closing section into a waitlist call instead. */
  offer: { live:true, price:149, places:100, opensBy:'15\u00a0November\u00a02026', url:'/founding/' },
  waitlistUrl: '/waitlist/',
  planPath:   '/plan/',
  resultPath: '/your-plan/',
  storeKey:   'pf.plan.v2',
  minMinutes: 30, maxMinutes: 2400, stepMinutes: 30, defaultMinutes: 180
};

/* ============================================================ 2. DATA */
var AREAS = [
  {id:'business',      name:'Business',      ex:['Build my digital product', 'Get more clients', 'Launch my offer', 'Grow my audience']},
  {id:'health',        name:'Health',        ex:['Get stronger', 'Move 3 times a week', 'Sleep 8 hours', 'Eat better']},
  {id:'relationships', name:'Relationships', ex:['More quality time together', 'A weekly date night', 'Be more present', 'Plan a trip together']},
  {id:'family',        name:'Family',        ex:['Sunday dinners with my parents', 'More time with the kids', 'Call home every week', 'Plan a family weekend']},
  {id:'career',        name:'Career',        ex:['Get ready for the next role', 'Ask for the promotion', 'Learn a new skill', 'Grow my network']},
  {id:'money',         name:'Money',         ex:['Pay off the credit card', 'Build a savings buffer', 'Invest every month', 'Track my spending']},
  {id:'friends',       name:'Friendships',   ex:['See my friends every week', 'Plan a weekend away with friends', 'Reconnect with old friends', 'Say yes to more dinners']},
  {id:'rest',          name:'Rest',          ex:['Keep my weekends free', 'One evening off a week', 'Switch off after 7 pm', 'Take a real holiday']},
  {id:'creativity',    name:'Creativity',    ex:['Finish the first draft', 'Paint every week', 'Start the side project', 'Take a class']},
  {id:'learning',      name:'Learning',      ex:['Get conversational in Spanish', 'Read a book a month', 'Finish my course', 'Learn to code']},
  {id:'home',          name:'Home',          ex:['Make the flat feel finished', 'Declutter one room', 'Cook at home more', 'Create a calm corner']},
  {id:'travel',        name:'Travel',        ex:['Plan the trip to Japan', 'One city trip a quarter', 'Book the summer holiday', 'See somewhere new every month']}
];
var AREA = {}; AREAS.forEach(function(a){ AREA[a.id] = a; });

var EXAMPLE = [
  {id:'business', focus:'Build my digital product', minutes:300},
  {id:'health', focus:'Get stronger', minutes:180},
  {id:'relationships', focus:'More quality time together', minutes:120}
];

/* ============================================================ 3. STATE */
var S = { areas:[], focus:{}, minutes:{}, name:'', mine:[] };
var UTM = {};
var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

function load(){
  try{
    var raw = localStorage.getItem(CONFIG.storeKey);
    if(!raw) return;
    var d = JSON.parse(raw);
    if(Array.isArray(d.areas)) S.areas = d.areas.filter(function(id){ return AREA[id]; }).slice(0, 3);
    if(d.focus && typeof d.focus === 'object') S.focus = d.focus;
    if(d.minutes && typeof d.minutes === 'object') S.minutes = d.minutes;
    if(typeof d.name === 'string') S.name = d.name;
    if(Array.isArray(d.mine)) S.mine = d.mine.slice(-10);
  }catch(e){}
}
function save(){
  try{ localStorage.setItem(CONFIG.storeKey, JSON.stringify(S)); }catch(e){}
}

/* The plan, as data. Percentages are always calculated, never stored as input. */
function planFrom(list){
  var mins = list.map(function(c){ return c.minutes; });
  var pct = percentages(mins);
  var total = mins.reduce(function(a, b){ return a + b; }, 0);
  return {
    categories: list.map(function(c, i){
      return { id:c.id, name:AREA[c.id].name, focus:c.focus, weeklyMinutes:c.minutes, percentage:pct[i], order:i };
    }),
    totalWeeklyMinutes: total
  };
}
function currentPlan(){
  return planFrom(S.areas.map(function(id){
    return { id:id, focus:(S.focus[id] || '').trim(), minutes:S.minutes[id] || CONFIG.defaultMinutes };
  }));
}

/* URL hash: category ids, her exact words, weekly minutes, and the date.
   Never an address, never a name. */
function b64urlEncode(str){
  var bytes = new TextEncoder().encode(str), bin = '';
  for(var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(s){
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while(s.length % 4) s += '=';
  var bin = atob(s), bytes = new Uint8Array(bin.length);
  for(var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}
function encodePlan(plan){
  return b64urlEncode(JSON.stringify({
    v:1,
    d:plan.date || new Date().toISOString().slice(0, 10),
    c:plan.categories.map(function(c){ return [c.id, c.focus, c.weeklyMinutes]; })
  }));
}
function decodePlan(hash){
  try{
    var d = JSON.parse(b64urlDecode(hash));
    if(!d || d.v !== 1 || !Array.isArray(d.c) || d.c.length !== 3) return null;
    var seen = {}, list = [];
    for(var i = 0; i < 3; i++){
      var r = d.c[i];
      if(!Array.isArray(r) || !AREA[r[0]] || seen[r[0]]) return null;
      var m = Math.round(Number(r[2]));
      if(!(m >= CONFIG.minMinutes && m <= CONFIG.maxMinutes)) return null;
      var f = String(r[1] || '').trim().slice(0, 80);
      if(!f) return null;
      seen[r[0]] = 1;
      list.push({ id:r[0], focus:f, minutes:m });
    }
    var plan = planFrom(list);
    plan.date = /^\d{4}-\d{2}-\d{2}$/.test(d.d || '') ? d.d : '';
    return plan;
  }catch(e){ return null; }
}

/* ============================================================ 4. MATHS
   percentage = categoryMinutes / totalMinutes, rounded by largest remainder
   so the three always add up to exactly 100. Ties go to the larger block,
   then to the order she chose them in. */
function percentages(mins){
  var total = mins.reduce(function(a, b){ return a + b; }, 0);
  if(!total) return mins.map(function(){ return 0; });
  var raw = mins.map(function(m){ return m * 100 / total; });
  var out = raw.map(Math.floor);
  var left = 100 - out.reduce(function(a, b){ return a + b; }, 0);
  raw.map(function(r, i){ return { i:i, frac:r - Math.floor(r), m:mins[i] }; })
     .sort(function(a, b){ return (b.frac - a.frac) || (b.m - a.m) || (a.i - b.i); })
     .slice(0, left).forEach(function(x){ out[x.i] += 1; });
  /* time she gave is never shown as 0%: the point comes from the largest block */
  out.forEach(function(v, i){
    if(v === 0 && mins[i] > 0){ out[i] = 1; out[out.indexOf(Math.max.apply(null, out))] -= 1; }
  });
  return out;
}
function hours(min){ var h = min / 60; return (h % 1 === 0) ? String(h) : h.toFixed(1); }
function fmtTime(min){ return min < 60 ? { n:String(min), u:'min / week' } : { n:hours(min), u:'h / week' }; }
function spoken(min){
  if(min < 60) return min + ' minutes a week';
  var h = Math.floor(min / 60), m = min % 60;
  return h + (h === 1 ? ' hour' : ' hours') + (m ? ' ' + m + ' minutes' : '') + ' a week';
}

/* ============================================================ 5. ANALYTICS
   Sent to whatever is on the page: dataLayer, Plausible, gtag, Meta, Klaviyo. */
var fired = {};
function track(name, props){
  var p = Object.assign({}, props || {}, UTM);
  try{
    (window.dataLayer = window.dataLayer || []).push(Object.assign({ event:name }, p));
    if(typeof window.plausible === 'function') window.plausible(name, { props:p });
    if(typeof window.gtag === 'function') window.gtag('event', name, p);
    if(typeof window.fbq === 'function') window.fbq('trackCustom', name, p);
    if(window.klaviyo && typeof window.klaviyo.push === 'function') window.klaviyo.push(['track', name, p]);
  }catch(e){}
}
function trackOnce(name, props){ if(fired[name]) return; fired[name] = 1; track(name, props); }

/* ============================================================ 6. MAP */
var $ = function(sel, root){ return (root || document).querySelector(sel); };
var $$ = function(sel, root){ return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
function el(tag, cls, text){ var n = document.createElement(tag); if(cls) n.className = cls; if(text != null) n.textContent = text; return n; }

var wideObserver = ('ResizeObserver' in window) ? new ResizeObserver(function(entries){
  entries.forEach(function(e){
    var m = e.target;
    m.classList.toggle('is-wide', m.dataset.wide !== 'off' && e.contentRect.width >= 620);
  });
}) : null;

function renderMap(map, plan, opts){
  opts = opts || {};
  var cats = plan.categories.slice().sort(function(a, b){
    return (b.weeklyMinutes - a.weeklyMinutes) || (a.order - b.order);
  });
  var t = plan.totalWeeklyMinutes || 1;
  var a = cats[0].weeklyMinutes / t;
  var bc = cats[1].weeklyMinutes + cats[2].weeklyMinutes;
  var b = cats[1].weeklyMinutes / bc, c = cats[2].weeklyMinutes / bc;
  var min = (opts.min || 84) + 'px';
  var fr = function(x){ return 'minmax(' + min + ', ' + (x * 100).toFixed(3) + 'fr)'; };
  map.style.setProperty('--tall-rows', fr(a) + ' ' + fr(1 - a));
  map.style.setProperty('--tall-cols', fr(b) + ' ' + fr(c));
  map.style.setProperty('--wide-cols', fr(a) + ' ' + fr(1 - a));
  map.style.setProperty('--wide-rows', fr(b) + ' ' + fr(c));

  /* blocks are keyed by area, so a drag updates them in place */
  var keep = {};
  $$('.blk', map).forEach(function(n){ keep[n.dataset.id] = n; });
  cats.forEach(function(cat){
    var blk = keep[cat.id];
    if(!blk){
      blk = el('div', 'blk');
      blk.dataset.id = cat.id;
      var top = el('div', 'b-top');
      top.appendChild(el('p', 'b-name veil'));
      top.appendChild(el('p', 'b-hrs'));
      var bot = el('div', 'b-bot');
      var pct = el('p', 'b-pct num');
      pct.appendChild(document.createTextNode(''));
      pct.appendChild(el('span', 'unit', '%'));
      bot.appendChild(pct);
      bot.appendChild(el('p', 'b-focus veil'));
      blk.appendChild(top); blk.appendChild(bot);
    }
    delete keep[cat.id];
    /* the plate follows the area she chose first, second, third: never its size */
    blk.dataset.plate = String(cat.order + 1);
    $('.b-name', blk).textContent = cat.name;
    var tm = fmtTime(cat.weeklyMinutes);
    $('.b-hrs', blk).textContent = tm.n + ' ' + tm.u;
    $('.b-pct', blk).firstChild.nodeValue = String(cat.percentage);
    var f = $('.b-focus', blk);
    f.textContent = cat.focus || '';
    f.hidden = !cat.focus;
    if(opts.sharp) blk.toggleAttribute('data-sharp', cat.id === opts.sharp);
    map.appendChild(blk);
  });
  Object.keys(keep).forEach(function(id){ keep[id].remove(); });

  if(!map.dataset.observed && wideObserver){ wideObserver.observe(map); map.dataset.observed = '1'; }
  if(opts.label){
    map.setAttribute('aria-label', opts.label + ' ' + cats.map(function(c){
      return c.name + (c.focus ? ', ' + c.focus : '') + ', ' + c.percentage + ' percent, ' + spoken(c.weeklyMinutes) + '.';
    }).join(' '));
  }
}

/* ============================================================ 7. VIEWS */
var ORDER = ['landing', 'areas', 'focus', 'time', 'plan'];
var current = 'landing';
var VIEW = {};
ORDER.forEach(function(v){ VIEW[v] = document.getElementById('v-' + v); });

function show(name, opts){
  opts = opts || {};
  if(name === current && !opts.force) return;
  var from = VIEW[current], to = VIEW[name];
  var enter = function(){
    if(from && from !== to){ from.hidden = true; from.dataset.state = ''; }
    document.body.dataset.view = name;
    to.hidden = false;
    to.dataset.state = 'pre';
    window.scrollTo({ top:0, left:0, behavior:'instant' });
    void to.offsetWidth;
    to.dataset.state = 'in';
    var h = to.querySelector('h1[tabindex]:not([data-on="false"])');
    if(h && !opts.noFocus) h.focus({ preventScroll:true });
    current = name;
    stepper(name);
    if(ENTER[name]) ENTER[name]();
  };
  if(from && from !== to && !from.hidden && !reduce){
    from.dataset.state = 'out';
    setTimeout(enter, 150);
  }else enter();
}
function go(name){
  var depth = (history.state && history.state.depth) || 0;
  history.pushState({ v:name, depth:depth + 1 }, '', name === 'landing' ? '/' : CONFIG.planPath);
  show(name);
}
function stepper(name){
  var i = ['areas', 'focus', 'time'].indexOf(name);
  if(i < 0) return;
  $('[data-count]').textContent = (i + 1) + ' of 3';
  /* five screens behind three questions: the ring moves on every one */
  var screen = name === 'areas' ? 1 : name === 'focus' ? 2 + fIdx : 5;
  $('[data-ring]').style.strokeDasharray = (screen / 5).toFixed(3) + ' 1';
}
/* the furthest step her answers allow, so a back or a refresh never lands on a broken screen */
function allowed(name){
  if(name === 'focus') return S.areas.length === 3 ? 'focus' : 'areas';
  if(name === 'time'){
    if(S.areas.length !== 3) return 'areas';
    return S.areas.every(function(id){ return (S.focus[id] || '').trim(); }) ? 'time' : 'focus';
  }
  return name;
}
window.addEventListener('popstate', function(e){
  var v = (e.state && e.state.v) || (location.pathname.indexOf('/plan') === 0 ? 'areas' : 'landing');
  if(v === 'plan' && !openPlan) v = 'time';
  v = allowed(v);
  if(v === 'focus'){
    var want = (e.state && e.state.i) || 0;
    /* never past the first area still waiting for an answer */
    for(var k = 0; k < want; k++) if(!(S.focus[S.areas[k]] || '').trim()){ want = k; break; }
    if(current === 'focus'){ toFocus(want, false); return; }
    fIdx = want;
  }
  show(v);
});
$('[data-back]').addEventListener('click', function(){
  var i = ORDER.indexOf(current);
  if(history.state && history.state.depth > 0) history.back();
  else if(current === 'focus' && fIdx > 0){ history.replaceState({ v:'focus', i:fIdx - 1, depth:0 }, '', CONFIG.planPath); toFocus(fIdx - 1, false); }
  else { var prev = ORDER[Math.max(0, i - 1)]; history.replaceState({ v:prev, depth:0 }, '', prev === 'landing' ? '/' : CONFIG.planPath); show(prev); }
});

var ENTER = {
  areas: function(){ trackOnce('plan_started'); drawChips(); },
  focus: function(){ drawFocus(); },
  time:  function(){ drawRows(); },
  plan:  function(){}
};

/* ============================================================ 8. QUESTIONS */

/* ---- Q1: exactly three areas ---- */
var chipsEl = $('[data-chips]');
var areasForm = $('[data-form="areas"]');
function drawChips(){
  if(!chipsEl.children.length){
    AREAS.forEach(function(a){
      var b = el('button', 'chip');
      b.type = 'button';
      b.dataset.id = a.id;
      var slot = el('span', 'slot'); slot.setAttribute('aria-hidden', 'true');
      slot.appendChild(el('b'));
      b.appendChild(slot);
      b.appendChild(el('span', '', a.name));
      b.addEventListener('click', function(){ toggleArea(a.id); });
      chipsEl.appendChild(b);
    });
  }
  syncChips();
}
function toggleArea(id){
  var i = S.areas.indexOf(id);
  if(i >= 0){ S.areas.splice(i, 1); say(areasForm, ''); }
  else if(S.areas.length < 3){ S.areas.push(id); say(areasForm, ''); }
  else { say(areasForm, 'You have 3 already. Tap one of them first to swap it out.'); return; }
  save(); syncChips();
}
function syncChips(){
  var n = S.areas.length, full = n === 3;
  $$('.chip', chipsEl).forEach(function(b){
    var at = S.areas.indexOf(b.dataset.id);
    b.setAttribute('aria-pressed', at >= 0 ? 'true' : 'false');
    $('.slot b', b).textContent = at >= 0 ? String(at + 1) : '';
  });
  chipsEl.dataset.full = full ? 'true' : 'false';
  var tally = $('[data-tally]');
  tally.dataset.full = full ? 'true' : 'false';
  $('[data-tally-ring]').style.strokeDasharray = (n / 3).toFixed(3) + ' 1';
  $('[data-tally-text]').textContent = full
    ? 'These 3 are your focus for now. Everything else can wait.'
    : n + ' of 3 chosen';
  $('button[type="submit"]', areasForm).setAttribute('aria-disabled', full ? 'false' : 'true');
}
areasForm.addEventListener('submit', function(e){
  e.preventDefault();
  if(S.areas.length !== 3){ say(areasForm, 'Choose 3 areas to continue.'); return; }
  track('categories_selected', { categories:S.areas.join(','), count:3 });
  fIdx = 0;
  go('focus');
});

/* ---- Q2: one area per screen, as a sentence she completes:
        "Business: my focus is ____". A tile fills the blank; she can type over it. ---- */
var focusForm = $('[data-form="focus"]');
var tilesEl = $('[data-tiles]');
var ownIn = $('#f-own');
var fIdx = 0;
function focusArea(){ return S.areas[fIdx]; }
function drawFocus(){
  var id = focusArea(), a = AREA[id];
  if(!a) return;
  $('[data-focus-area]').textContent = a.name;
  $('[data-focus-area-sr]').textContent = a.name;
  $('[data-focus-count]').textContent = (fIdx + 1) + ' of 3';
  ownIn.value = S.focus[id] || '';
  tilesEl.textContent = '';
  a.ex.forEach(function(text, i){
    var b = el('button', 'tile');
    b.type = 'button';
    b.setAttribute('aria-pressed', 'false');
    b.appendChild(el('span', 'n', '0' + (i + 1)));
    b.appendChild(el('span', 't', text));
    b.addEventListener('click', function(){
      S.focus[id] = text; ownIn.value = text;
      track('focus_suggestion_picked', { category:id });
      say(focusForm, ''); save(); syncFocus();
    });
    tilesEl.appendChild(b);
  });
  syncFocus();
}
function syncFocus(){
  var id = focusArea(), cur = (S.focus[id] || '').trim();
  $$('.tile', tilesEl).forEach(function(t){ t.setAttribute('aria-pressed', $('.t', t).textContent === cur ? 'true' : 'false'); });
  ownIn.classList.toggle('is-filled', !!cur);
  $('button[type="submit"]', focusForm).setAttribute('aria-disabled', cur ? 'false' : 'true');
  paintFocusMap();
  return !!cur;
}
/* the map beside the question: equal blocks (time comes later), the area she is
   on is sharp, and her words land in it as she types */
var focusMap = $('[data-map="focus"]');
function paintFocusMap(){
  if(S.areas.length !== 3) return;
  focusMap.dataset.wide = 'off';
  renderMap(focusMap, planFrom(S.areas.map(function(id){
    return { id:id, focus:(S.focus[id] || '').trim(), minutes:60 };
  })), { min:60, sharp:focusArea() });
  $('[data-focus-done]').textContent = String(S.areas.filter(function(id){ return (S.focus[id] || '').trim(); }).length);
}
ownIn.addEventListener('input', function(){ S.focus[focusArea()] = ownIn.value; say(focusForm, ''); save(); syncFocus(); });
ownIn.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ e.preventDefault(); focusForm.requestSubmit(); } });
/* the next area slides in within the same screen: out fast, in a touch slower */
function toFocus(i, push){
  var q = focusForm;
  if(push){
    var depth = (history.state && history.state.depth) || 0;
    history.pushState({ v:'focus', i:i, depth:depth + 1 }, '', CONFIG.planPath);
  }
  var swap = function(){
    fIdx = i; drawFocus(); stepper('focus');
    q.dataset.state = 'pre'; void q.offsetWidth; q.dataset.state = 'in';
    $('#q2-title').focus({ preventScroll:true });
    window.scrollTo({ top:0, left:0, behavior:'instant' });
  };
  if(reduce){ swap(); return; }
  q.dataset.state = 'out';
  setTimeout(swap, 150);
}
focusForm.addEventListener('submit', function(e){
  e.preventDefault();
  var id = focusArea();
  if(!syncFocus()){ say(focusForm, 'Pick one, or write your own.'); ownIn.focus(); return; }
  S.focus[id] = S.focus[id].trim(); save();
  if(fIdx < 2){ toFocus(fIdx + 1, true); return; }
  track('focuses_completed', { categories:S.areas.join(',') });
  go('time');
});

/* ---- Q3: hours, which become the proportions ---- */
var rowsEl = $('[data-rows]');
var timeForm = $('[data-form="time"]');
var previewMap = $('[data-map="preview"]');
function drawRows(){
  rowsEl.textContent = '';
  S.areas.forEach(function(id){
    if(!S.minutes[id]) S.minutes[id] = CONFIG.defaultMinutes;
    var a = AREA[id];
    var row = el('div', 'row');
    var meta = el('div', 'meta');
    var who = el('div', 'who');
    var lab = el('label', 'overline', a.name);
    lab.htmlFor = 't-' + id;
    who.appendChild(lab);
    who.appendChild(el('p', '', S.focus[id]));
    var val = el('p', 'val num');
    val.setAttribute('aria-hidden', 'true');
    val.appendChild(document.createTextNode(''));
    val.appendChild(el('span', 'unit'));
    meta.appendChild(who); meta.appendChild(val);
    var range = el('input');
    range.type = 'range'; range.id = 't-' + id;
    range.min = CONFIG.minMinutes; range.max = CONFIG.maxMinutes; range.step = CONFIG.stepMinutes;
    range.value = S.minutes[id];
    var scale = el('div', 'scale');
    scale.setAttribute('aria-hidden', 'true');
    scale.appendChild(el('span', '', '30 min'));
    scale.appendChild(el('span', '', (CONFIG.maxMinutes / 60) + ' h'));
    var paint = function(){
      var m = Number(range.value);
      var t = fmtTime(m);
      val.firstChild.nodeValue = t.n;
      val.lastChild.textContent = t.u;
      range.style.setProperty('--p', ((m - CONFIG.minMinutes) / (CONFIG.maxMinutes - CONFIG.minMinutes)).toFixed(4));
      range.setAttribute('aria-valuetext', spoken(m));
    };
    /* direct manipulation: no easing between her finger and the result */
    range.addEventListener('input', function(){ S.minutes[id] = Number(range.value); paint(); paintPreview(); });
    range.addEventListener('change', save);
    paint();
    row.appendChild(meta); row.appendChild(range); row.appendChild(scale);
    rowsEl.appendChild(row);
  });
  paintPreview();
}
var srTimer;
function paintPreview(){
  var plan = currentPlan();
  previewMap.dataset.wide = 'off';
  renderMap(previewMap, plan, { min:60 });
  var h = plan.totalWeeklyMinutes / 60;
  $('[data-total]').textContent = h % 1 === 0 ? String(h) : h.toFixed(1);
  clearTimeout(srTimer);
  srTimer = setTimeout(function(){
    $('[data-total-sr]').textContent = plan.categories.map(function(c){ return c.name + ' ' + c.percentage + ' percent'; }).join(', ') + '.';
  }, 600);
}
timeForm.addEventListener('submit', function(e){
  e.preventDefault();
  save();
  var plan = currentPlan();
  track('time_allocations_completed', {
    weekly_minutes:plan.categories.map(function(c){ return c.weeklyMinutes; }).join(','),
    percentages:plan.categories.map(function(c){ return c.percentage; }).join(','),
    total_weekly_minutes:plan.totalWeeklyMinutes
  });
  openLocked(plan);
});

/* ============================================================ 9. UNLOCK + PLAN */
var openPlan = null;
var planMap = $('[data-map="plan"]');
var planBody = $('[data-plan-body]');
var unlockForm = $('[data-form="unlock"]');
var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function openLocked(plan){
  plan.date = new Date().toISOString().slice(0, 10);
  openPlan = plan;
  setLocked(true);
  renderMap(planMap, plan, { min:84, label:'Your plan, ready to open.' });
  var nm = $('#f-name'); if(S.name && !nm.value) nm.value = S.name;
  go('plan');
  track('email_capture_viewed');
}
function setLocked(on){
  planMap.dataset.locked = on ? 'true' : 'false';
  planBody.dataset.locked = on ? 'true' : 'false';
  unlockForm.hidden = !on;
  unlockForm.dataset.gone = on ? 'false' : 'true';
  $$('[data-locked-only]').forEach(function(n){ n.dataset.on = on ? 'true' : 'false'; });
  $$('[data-open-only]').forEach(function(n){ n.dataset.on = on ? 'false' : 'true'; });
  $$('[data-after]').forEach(function(n){ if(on){ n.hidden = true; n.dataset.on = 'false'; } });
  var pill = $('.lockpill', planMap);
  if(on && !pill){
    pill = el('span', 'glass lockpill');
    var pip = el('span', 'pip'); pip.setAttribute('aria-hidden', 'true');
    pill.appendChild(pip);
    pill.appendChild(document.createTextNode('Ready for you'));
    planMap.appendChild(pill);
  }
}

function say(form, text){
  var n = $('[data-note]', form);
  if(!n) return;
  if(!text){ n.dataset.show = 'false'; n.textContent = ''; return; }
  n.textContent = text;
  requestAnimationFrame(function(){ n.dataset.show = 'true'; });
}

unlockForm.addEventListener('submit', function(e){
  e.preventDefault();
  var btn = $('button[type="submit"]', unlockForm);
  if(btn.dataset.busy === 'true') return;
  var nameIn = $('#f-name'), mailIn = $('#f-email');
  var name = nameIn.value.trim(), email = mailIn.value.trim().toLowerCase();
  nameIn.removeAttribute('aria-invalid'); mailIn.removeAttribute('aria-invalid');
  if(!name){ nameIn.setAttribute('aria-invalid', 'true'); say(unlockForm, 'Add your first name, so your plan can carry it.'); nameIn.focus(); return; }
  if(!EMAIL.test(email)){ mailIn.setAttribute('aria-invalid', 'true'); say(unlockForm, 'That address looks incomplete. Check it and try again.'); mailIn.focus(); return; }
  say(unlockForm, '');
  S.name = name; save();
  track('email_submitted');
  btn.dataset.busy = 'true';
  btn.setAttribute('aria-label', 'Opening your plan');

  var trap = unlockForm.querySelector('input[name="hp_note"]');
  var work = (trap && trap.value) ? Promise.resolve('trap') : send(email, name, openPlan);
  /* The plan never waits on a network. A short beat so the change is felt,
     then it opens, whatever the email is doing. */
  var beat = new Promise(function(r){ setTimeout(r, reduce ? 0 : 480); });
  var cap  = new Promise(function(r){ setTimeout(r, 1400); });
  Promise.race([Promise.all([work.catch(function(){}), beat]), cap]).then(function(){ reveal(true); });
  work.then(function(state){
    if(state === true) track('waitlist_joined', { source:'Pretty Focussed Plan' });
  }).catch(function(){
    var n = $('[data-sent-note]');
    n.textContent = 'Your plan is here, but the email copy did not send. Copy the link to your plan to keep it.';
    requestAnimationFrame(function(){ n.dataset.show = 'true'; });
  });
});

/* The reveal. The form goes first (fast), the blocks settle into their
   final place, the words come into focus one block at a time, and then
   the rest of the page arrives. */
function reveal(isAuthor){
  var plan = openPlan;
  var hash = encodePlan(plan);
  var first = planMap.getBoundingClientRect();

  unlockForm.dataset.gone = 'true';
  setTimeout(function(){ unlockForm.hidden = true; }, reduce ? 0 : 150);

  planBody.dataset.locked = 'false';
  renderMap(planMap, plan, { min:84, label:'Your Pretty Focussed Plan.' });
  var last = planMap.getBoundingClientRect();
  if(!reduce && first.width && last.width){
    var dx = first.left - last.left, dy = first.top - last.top;
    var sx = first.width / last.width;
    planMap.animate([
      { transform:'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ')', transformOrigin:'0 0' },
      { transform:'none', transformOrigin:'0 0' }
    ], { duration:600, easing:'cubic-bezier(.77,0,.175,1)' });
  }
  requestAnimationFrame(function(){
    planMap.dataset.locked = 'false';
    $$('[data-locked-only]').forEach(function(n){ n.dataset.on = 'false'; });
    $$('[data-open-only]').forEach(function(n){ n.dataset.on = 'true'; });
  });
  if(!isAuthor) $('h1[data-open-only]').textContent = 'A Pretty Focussed Plan';
  $('[data-for]').textContent = (isAuthor && S.name ? 'Prepared for ' + S.name + ', ' : '') + longDate(plan.date);
  $('[data-plan-total]').textContent = 'In total you are giving these 3 ' + spoken(plan.totalWeeklyMinutes).replace(' a week', '') + ' a week.';

  document.body.classList.add('is-settling');
  document.documentElement.style.setProperty('--room', '.55');
  document.body.style.setProperty('--room', '.55');

  $$('[data-after]').forEach(function(n){ n.hidden = false; });
  void planBody.offsetWidth;
  $$('[data-after]').forEach(function(n){ n.dataset.on = 'true'; });

  if(isAuthor){
    S.mine = S.mine.filter(function(h){ return h !== hash; }).concat(hash).slice(-10);
    save();
  }
  closing(isAuthor);
  history.replaceState({ v:'plan', depth:(history.state && history.state.depth) || 0 }, '', CONFIG.resultPath + '#' + hash);
  var h = $('h1[data-open-only]');
  setTimeout(function(){ h.focus({ preventScroll:true }); }, 200);
  track('plan_revealed', { author:!!isAuthor });
}
function longDate(iso){
  var d = iso ? new Date(iso + 'T12:00:00') : new Date();
  try{ return d.toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' }); }
  catch(e){ return d.toDateString(); }
}

/* the closing call: founding offer while it is live, the waitlist otherwise,
   and her own plan if this one was shared with her */
function closing(isAuthor){
  var O = CONFIG.offer;
  var over = $('[data-next-over]'), title = $('[data-next-title]'), body = $('[data-next-body]');
  var btn = $('[data-next-btn]'), alt = $('[data-next-alt]'), cap = $('[data-next-caption]');
  if(!isAuthor){
    over.textContent = 'Your own plan';
    title.textContent = 'You can make your own plan in 3 questions.';
    body.textContent = 'Someone shared their Pretty Focussed Plan with you. Yours takes about two minutes, and it uses your own words.';
    btn.textContent = 'Create my plan'; btn.href = CONFIG.planPath; btn.dataset.kind = 'plan';
    alt.hidden = false; alt.textContent = 'See the founding offer'; alt.href = O.url; alt.dataset.kind = 'founding';
    cap.textContent = '';
    return;
  }
  if(O.live){
    over.textContent = 'Founding places';
    title.textContent = 'Ready to get Pretty Focussed?';
    body.textContent = 'Pretty Focussed opens to ' + O.places + ' founding members first, by ' + O.opensBy + '. A founding place costs €' + O.price + ' a year, and that price stays the same for as long as you stay.';
    btn.textContent = 'Become a founding member'; btn.href = O.url; btn.dataset.kind = 'founding';
    cap.textContent = 'You’re already on the waiting list, so Laurence will write to you when it opens.';
  }else{
    over.textContent = 'The waiting list';
    title.textContent = 'Want to be the first to know?';
    body.textContent = 'Pretty Focussed opens soon. The people on the waiting list hear first.';
    btn.textContent = 'Create account'; btn.href = CONFIG.waitlistUrl; btn.dataset.kind = 'waitlist';
    cap.textContent = '';
  }
}
document.addEventListener('click', function(e){
  var a = e.target.closest && e.target.closest('[data-kind]');
  if(!a) return;
  if(a.dataset.kind === 'founding') track('founding_checkout_clicked', { from:'plan' });
  if(a.dataset.kind === 'waitlist') track('waitlist_cta_clicked', { from:'plan' });
  if(a.dataset.kind === 'plan'){
    e.preventDefault(); track('plan_cta_clicked', { from:'shared_plan' });
    history.replaceState({ v:'landing', depth:0 }, '', '/'); go('areas');
  }
});

/* keep the link */
var copyBtn = $('[data-copy]');
copyBtn.addEventListener('click', function(){
  var done = function(){
    copyBtn.textContent = 'Link copied';
    setTimeout(function(){ copyBtn.textContent = 'Copy the link to my plan'; }, 2200);
  };
  if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(location.href).then(done, function(){ prompt('Copy this link', location.href); });
  else prompt('Copy this link', location.href);
  track('plan_link_copied');
});
var shareBtn = $('[data-share]');
if(navigator.share){
  shareBtn.hidden = false;
  shareBtn.addEventListener('click', function(){
    navigator.share({ title:'My Pretty Focussed Plan', url:location.href }).catch(function(){});
    track('plan_shared');
  });
}

/* ============================================================ 10. KLAVIYO
   Two calls. The subscription carries consent and the profile; the event
   carries the plan, and the plan email renders from it. pf_ prefix on
   everything the product owns, so nothing collides with the coaching brand. */
var SENDING = false;
function sentKey(email, hash){ return 'pf.sent.' + b64urlEncode(email + '|' + hash); }

function campaign(){ return CONFIG.klaviyo.campaigns[(UTM.utm_campaign || '').toLowerCase()] || null; }

function profileProps(plan, url){
  var p = {
    signup_source:   UTM.utm_source === 'instagram' ? 'Instagram' : 'Pretty Focussed Plan',
    signup_page:     location.origin + CONFIG.planPath,
    consent_at:      new Date().toISOString(),
    consent_wording: CONFIG.klaviyo.wording,
    language:        (navigator.language || 'en').toLowerCase().indexOf('nl') === 0 ? 'NL' : 'EN',
    lifecycle_stage: 'Waitlist',
    pf_marketing_opt_in: true,
    pf_lead_magnet:  'Pretty Focussed Plan',
    pf_focus_areas:  plan.categories.map(function(c){ return c.name; }).join(', '),
    pf_plan_url:     url,
    pf_total_weekly_minutes: plan.totalWeeklyMinutes,
    pf_plan_created_at: new Date().toISOString()
  };
  plan.categories.forEach(function(c, i){
    var n = i + 1;
    p['pf_category_' + n] = c.name;
    p['pf_focus_' + n] = c.focus;
    p['pf_minutes_' + n] = c.weeklyMinutes;
    p['pf_percentage_' + n] = c.percentage;
  });
  for(var k in UTM) p[k] = UTM[k];
  return p;
}
function eventProps(plan, url, name){
  var cats = plan.categories;
  var e = {
    first_name: name,
    pf_categories: cats.map(function(c){ return c.name; }),
    pf_category_ids: cats.map(function(c){ return c.id; }),
    pf_focuses: cats.map(function(c){ return c.focus; }),
    pf_weekly_time_allocations: cats.map(function(c){
      return { category:c.name, category_id:c.id, focus:c.focus, weekly_minutes:c.weeklyMinutes, percentage:c.percentage };
    }),
    pf_weekly_minutes: cats.map(function(c){ return c.weeklyMinutes; }),
    pf_percentages: cats.map(function(c){ return c.percentage; }),
    pf_total_weekly_minutes: plan.totalWeeklyMinutes,
    pf_plan_url: url
  };
  /* flat copies, because email templates read these far more easily than lists */
  cats.forEach(function(c, i){
    var n = i + 1;
    e['pf_category_' + n] = c.name; e['pf_focus_' + n] = c.focus;
    e['pf_minutes_' + n] = c.weeklyMinutes; e['pf_percentage_' + n] = c.percentage;
  });
  return e;
}
function kFetch(path, body){
  return fetch('https://a.klaviyo.com/client/' + path + '/?company_id=' + encodeURIComponent(CONFIG.klaviyo.companyId), {
    method:'POST',
    headers:{ 'Content-Type':'application/json', 'revision':CONFIG.klaviyo.revision },
    body:JSON.stringify(body)
  }).then(function(r){ if(!r.ok) throw new Error('klaviyo ' + r.status); return r; });
}

/* Resolves true when sent, a string for a deliberate no-send, rejects on failure. */
function send(email, name, plan){
  if(CONFIG.preview) return Promise.resolve('preview');
  if(!CONFIG.listOpen) return Promise.resolve('held');
  var hash = encodePlan(plan);
  var key = sentKey(email, hash);
  try{ if(localStorage.getItem(key)) return Promise.resolve('kept'); }catch(e){}
  if(SENDING) return Promise.resolve('busy');
  SENDING = true;

  var url = location.origin + CONFIG.resultPath + '#' + hash;
  var props = profileProps(plan, url);
  var event = eventProps(plan, url, name);
  var uid = 'pfplan:' + hash.slice(0, 48);
  var camp = campaign();

  var work = CONFIG.endpoint
    ? fetch(CONFIG.endpoint, {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body:JSON.stringify({ email:email, first_name:name, opt_in:true, metric:CONFIG.klaviyo.metric,
          properties:props, event:event, unique_id:uid, source:(camp || {}).source || 'Pretty Focussed Plan' })
      }).then(function(r){ if(!r.ok) throw new Error('endpoint ' + r.status); })
    : kFetch('subscriptions', {
        data:{ type:'subscription',
          attributes:{
            custom_source:(camp || {}).source || 'Pretty Focussed Plan',
            profile:{ data:{ type:'profile', attributes:{ email:email, first_name:name, properties:props } } }
          },
          relationships:{ list:{ data:{ type:'list', id:(camp || {}).listId || CONFIG.klaviyo.listId } } }
        }
      }).then(function(){
        return kFetch('events', {
          data:{ type:'event', attributes:{
            properties:event,
            unique_id:uid,
            metric:{ data:{ type:'metric', attributes:{ name:CONFIG.klaviyo.metric } } },
            profile:{ data:{ type:'profile', attributes:{ email:email, first_name:name } } }
          } }
        });
      });

  return work.then(function(){
    SENDING = false;
    try{ localStorage.setItem(key, String(Date.now())); }catch(e){}
    track('plan_email_queued');
    return true;
  }, function(err){
    SENDING = false;
    track('email_failed', { message:String(err && err.message || err) });
    throw err;
  });
}

/* ============================================================ 11. BOOT */
(function utm(){
  var q = new URLSearchParams(location.search);
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function(k){
    var v = q.get(k); if(v) UTM[k] = v.slice(0, 80);
  });
  try{
    if(Object.keys(UTM).length) sessionStorage.setItem('pf.utm', JSON.stringify(UTM));
    else UTM = JSON.parse(sessionStorage.getItem('pf.utm') || '{}') || {};
  }catch(e){}
})();

try{
  if(!sessionStorage.getItem('pf.seen')){ document.body.classList.add('is-first'); sessionStorage.setItem('pf.seen', '1'); }
}catch(e){}

if('scrollRestoration' in history) history.scrollRestoration = 'manual';
load();

/* the hero specimen: one plane sharp. Health, the middle block, so the
   sharp one is never simply the biggest. */
renderMap($('[data-map="hero"]'), planFrom(EXAMPLE), { min:84, sharp:'health' });

$$('[data-start]').forEach(function(b){
  b.addEventListener('click', function(){ track('plan_cta_clicked', { from:'hero' }); go('areas'); });
});
$$('[data-signup]').forEach(function(a){
  a.addEventListener('click', function(){ track('create_account_clicked', { from:a.dataset.signup }); });
});

var founder = $('[data-founder]');
if('IntersectionObserver' in window){
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting && founder.dataset.on === 'true'){ track('founder_story_viewed'); io.disconnect(); }
    });
  }, { threshold:.35 });
  io.observe(founder);
}

/* route */
var path = location.pathname;
var fromHash = location.hash.length > 1 ? decodePlan(location.hash.slice(1)) : null;
if(fromHash){
  openPlan = fromHash;
  var mine = S.mine.indexOf(location.hash.slice(1)) >= 0;
  setLocked(true);
  VIEW.landing.hidden = true;
  history.replaceState({ v:'plan', depth:0 }, '', location.pathname + location.hash);
  show('plan', { force:true, noFocus:true });
  renderMap(planMap, fromHash, { min:84 });
  reveal(mine);
}else if(path.indexOf('/plan') === 0 || path.indexOf('/your-plan') === 0){
  VIEW.landing.hidden = true;
  history.replaceState({ v:'areas', depth:0 }, '', CONFIG.planPath);
  show('areas', { force:true, noFocus:true });
}else{
  history.replaceState({ v:'landing', depth:0 }, '', location.pathname + location.search);
  trackOnce('landing_viewed');
}

})();
