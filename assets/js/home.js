/* Cẩm Nang BĐS 2.0 — trang chủ: accordion, tìm kiếm (index tải lười), chuyển hướng link cũ */
(function(){
'use strict';
var BASE=document.documentElement.getAttribute('data-base')||'/';
var VER=document.documentElement.getAttribute('data-ver')||'';

/* ─── Accordion chương (giữ nguyên hành vi v57) + nhớ trạng thái trong history ─── */
function toggleCh(n){
  var el=document.querySelector('.chapter[data-ch="'+n+'"]');
  if(!el) return;
  var was=el.classList.contains('open');
  document.querySelectorAll('.chapter').forEach(function(c){c.classList.remove('open');});
  if(!was) el.classList.add('open');
  try{history.replaceState(Object.assign({},history.state,{openCh:was?null:n}),'');}catch(e){}
}
window.toggleCh=toggleCh;

function restoreState(){
  var st=history.state||{};
  if(st.openCh){
    var el=document.querySelector('.chapter[data-ch="'+st.openCh+'"]');
    if(el&&!el.classList.contains('open')) el.classList.add('open');
  }
  var inp=document.getElementById('searchInput');
  if(inp&&inp.value.trim()) doSearch(inp.value);
}

/* Mobile touch fallback cho iOS Safari (từ v57) */
var lastTouch=0;
document.querySelectorAll('.ch-header').forEach(function(el){
  el.addEventListener('touchend',function(e){
    var now=Date.now(); if(now-lastTouch<350) return; lastTouch=now;
    var moved=Math.abs(e.changedTouches[0].clientX-(el._touchX||0))>8||Math.abs(e.changedTouches[0].clientY-(el._touchY||0))>8;
    if(moved) return;
    e.preventDefault();
    toggleCh(parseInt(el.closest('.chapter').dataset.ch,10));
  },{passive:false});
  el.addEventListener('touchstart',function(e){el._touchX=e.touches[0].clientX;el._touchY=e.touches[0].clientY;},{passive:true});
});

/* ─── Search index: chỉ tải khi người dùng dùng ô tìm kiếm ─── */
var IDX=null, idxPromise=null;
function loadIndex(){
  if(IDX) return Promise.resolve(IDX);
  if(!idxPromise) idxPromise=fetch(BASE+'data/search-index.json?v='+VER).then(function(r){return r.json();}).then(function(d){IDX=d;return d;});
  return idxPromise;
}
function url(slug){return BASE+'cam-nang/'+slug+'/';}
function norm(s){
  return (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/[^a-z0-9 ]/g,' ');
}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function highlight(text,q){
  if(!q) return esc(text);
  var out=esc(text);
  norm(q).trim().split(/\s+/).filter(Boolean).forEach(function(w){
    if(w.length<2) return;
    out=out.replace(new RegExp('('+w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','gi'),'<mark>$1</mark>');
  });
  return out;
}
function doSearch(q){
  var results=document.getElementById('searchResults'), count=document.getElementById('searchCount'),
      clear=document.getElementById('searchClear'), chapters=document.querySelector('.chapters');
  var qTrim=(q||'').trim();
  if(!qTrim){
    results.className='search-results'; count.className='search-count'; clear.className='search-clear';
    chapters.style.display=''; return;
  }
  clear.className='search-clear vis'; chapters.style.display='none';
  if(!IDX){ count.textContent='Đang tải chỉ mục…'; count.className='search-count vis';
    loadIndex().then(function(){ if(document.getElementById('searchInput').value.trim()===qTrim) doSearch(qTrim); });
    return; }
  var words=norm(qTrim).split(/\s+/).filter(function(w){return w.length>1;});
  var scored=IDX.items.map(function(it){
    var nt=norm(it.t), ns=norm(it.u), nc=norm(it.c), hay=norm(it.t+' '+it.u+' '+it.k+' '+it.c), score=0;
    words.forEach(function(w){
      if(nt.indexOf(w)>-1) score+=10; if(ns.indexOf(w)>-1) score+=5;
      if(nc.indexOf(w)>-1) score+=3; if(hay.indexOf(w)>-1) score+=1;
    });
    return {it:it,score:score};
  }).filter(function(x){return x.score>0;}).sort(function(a,b){return b.score-a.score;});
  if(!scored.length){
    results.innerHTML='<div class="s-empty"><span>🔍</span>Không tìm thấy kết quả cho "<strong>'+esc(qTrim)+'</strong>"</div>';
    results.className='search-results vis'; count.textContent='Không có kết quả'; count.className='search-count vis'; return;
  }
  results.innerHTML=scored.slice(0,20).map(function(x){
    var it=x.it;
    return '<a class="s-item xl-b" href="'+url(it.s)+'">'
      +'<div class="s-dot" style="background:'+it.x+'"></div>'
      +'<div class="s-body"><div class="s-title">'+highlight((it.i?it.i+' ':'')+it.t,qTrim)+'</div>'
      +'<div class="s-sub">'+highlight(it.u,qTrim)+'</div></div>'
      +'<div class="s-ch" style="color:'+it.x+';border-color:'+it.x+'33">CH.0'+it.n+'</div></a>';
  }).join('');
  results.className='search-results vis';
  count.textContent='Tìm thấy '+scored.length+' kết quả'+(scored.length>20?' (hiển thị 20)':'');
  count.className='search-count vis';
}
function clearSearch(){ var i=document.getElementById('searchInput'); i.value=''; doSearch(''); i.focus(); }
window.clearSearch=clearSearch;

var inp=document.getElementById('searchInput'), timer;
if(inp){
  inp.addEventListener('focus',loadIndex,{once:true});
  inp.addEventListener('input',function(){ clearTimeout(timer); timer=setTimeout(function(){doSearch(inp.value);},180); });
}

/* ─── Link cũ kiểu /#marq hoặc /?p=marq (ID panel v57) → URL bài mới ─── */
function legacyRedirect(){
  var q=new URLSearchParams(location.search);
  var id=q.get('bai')||q.get('p')||(location.hash||'').replace(/^#/,'');
  if(!id||!/^[a-z0-9_]+$/i.test(id)) return;
  loadIndex().then(function(d){ var s=d.legacy[id]; if(s) location.replace(url(s)); });
}

window.addEventListener('pageshow',restoreState);
legacyRedirect();
window.addEventListener('hashchange',legacyRedirect);
})();
