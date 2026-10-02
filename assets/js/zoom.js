/* Cẩm Nang BĐS — xem ảnh lớn (lightbox) dùng chung cho trang bài và trang bảng tính.
   - Trang bài: tự gắn nút "Phóng to" vào mọi ảnh nội dung (#pBody img[srcset]).
   - Trang công cụ: NATZoom.attach(img, () => ({src, cap, mark:{x,y,label}})).
   Tự chứa CSS, không phụ thuộc main.css. */
(function(){
'use strict';
if(window.NATZoom) return;

var CSS=[
'.nz-w{position:relative;display:block}',
'.nz-w>img{cursor:zoom-in}',
'.nz-b{position:absolute;right:8px;bottom:8px;z-index:3;display:inline-flex;align-items:center;gap:6px;min-height:36px;padding:0 13px;border:1px solid rgba(255,255,255,.38);border-radius:999px;background:rgba(14,12,9,.8);color:#f6f1e6;font:600 12.5px/1 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:.2px;cursor:pointer;-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);box-shadow:0 2px 10px rgba(0,0,0,.35);transition:background .15s,color .15s,transform .15s}',
'.nz-b:hover{background:#d9ab4b;color:#1a140a;transform:translateY(-1px)}',
'.nz-b:focus-visible,.nz-x:focus-visible,.nz-n:focus-visible{outline:2px solid #e7c680;outline-offset:2px}',
'.nz-l{position:fixed;inset:0;z-index:2147483000;display:none;flex-direction:column;background:rgba(8,7,5,.985);color:#f4efe4;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}',
'.nz-l.on{display:flex}',
'.nz-top{display:flex;align-items:center;gap:12px;padding:10px 14px;flex:none}',
'.nz-cap{flex:1;min-width:0;font-size:13.5px;line-height:1.4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
'.nz-cnt{flex:none;font-size:12px;opacity:.7}',
'.nz-x{flex:none;width:44px;height:44px;border:1px solid rgba(255,255,255,.3);border-radius:50%;background:rgba(255,255,255,.08);color:#fff;font-size:20px;line-height:1;cursor:pointer}',
'.nz-x:hover{background:#d9ab4b;color:#1a140a}',
'.nz-st{position:relative;flex:1;min-height:0;overflow:auto;display:flex;-webkit-overflow-scrolling:touch}',
'.nz-in{position:relative;margin:auto;line-height:0;max-width:100%}',
'.nz-in img{display:block;max-width:100%;max-height:calc(100vh - 118px);max-height:calc(100dvh - 118px);width:auto;height:auto;cursor:zoom-in;-webkit-user-select:none;user-select:none}',
'.nz-in.z{max-width:none}',
'.nz-in.z img{max-width:none;max-height:none;cursor:zoom-out}',
'.nz-mk{position:absolute;width:30px;height:30px;margin:-15px 0 0 -15px;border-radius:50%;background:rgba(220,38,38,.88);border:2px solid #fff;box-shadow:0 2px 10px rgba(220,38,38,.6);pointer-events:none;animation:nzp 1.5s ease-in-out infinite}',
'.nz-mk::after{content:"";position:absolute;left:50%;top:50%;width:8px;height:8px;margin:-4px 0 0 -4px;background:#fff;border-radius:50%}',
'.nz-mk i{position:absolute;left:50%;bottom:36px;transform:translateX(-50%);padding:3px 8px;border-radius:5px;background:rgba(11,31,58,.92);border:1px solid #e8c96a;color:#fff;font:700 12px/1.3 system-ui,sans-serif;font-style:normal;white-space:nowrap}',
'@keyframes nzp{0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.55)}50%{box-shadow:0 0 0 12px rgba(220,38,38,0)}}',
'.nz-n{position:absolute;top:50%;z-index:4;width:48px;height:68px;margin-top:-34px;border:0;border-radius:8px;background:rgba(255,255,255,.1);color:#fff;font-size:30px;line-height:1;cursor:pointer}',
'.nz-n:hover{background:#d9ab4b;color:#1a140a}',
'.nz-p{left:10px}.nz-nx{right:10px}',
'.nz-ld{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);padding:8px 14px;border-radius:999px;background:rgba(0,0,0,.65);font-size:12px;pointer-events:none;display:none}',
'.nz-ld.on{display:block}',
'.nz-ht{flex:none;padding:8px 14px 12px;text-align:center;font-size:11.5px;opacity:.65}',
'html.nz-open{overflow:hidden!important}',
'@media(max-width:640px){.nz-n{width:40px;height:56px;margin-top:-28px;font-size:26px}.nz-b{min-height:34px;padding:0 11px}.nz-ht{font-size:11px}}',
'@media(prefers-reduced-motion:reduce){.nz-mk{animation:none}.nz-b{transition:none}}',
'@media print{.nz-b,.nz-l{display:none!important}}'
].join('\n');

var st=document.createElement('style'); st.id='nz-css'; st.textContent=CSS; (document.head||document.documentElement).appendChild(st);

var L=null,el={},items=[],idx=0,lastFocus=null,tok=0;

function build(){
  L=document.createElement('div'); L.className='nz-l'; L.setAttribute('role','dialog'); L.setAttribute('aria-modal','true'); L.setAttribute('aria-label','Xem ảnh lớn');
  L.innerHTML='<div class="nz-top"><div class="nz-cap"></div><div class="nz-cnt"></div><button type="button" class="nz-x" aria-label="Đóng ảnh">✕</button></div>'+
    '<div class="nz-st"><div class="nz-in"><img alt=""></div><div class="nz-ld">Đang tải ảnh chất lượng cao…</div></div>'+
    '<button type="button" class="nz-n nz-p" aria-label="Ảnh trước">‹</button><button type="button" class="nz-n nz-nx" aria-label="Ảnh sau">›</button>'+
    '<div class="nz-ht">Bấm vào ảnh để phóng to hết cỡ · kéo để di chuyển · ← → đổi ảnh · Esc để đóng</div>';
  document.body.appendChild(L);
  el={cap:L.querySelector('.nz-cap'),cnt:L.querySelector('.nz-cnt'),x:L.querySelector('.nz-x'),st:L.querySelector('.nz-st'),in:L.querySelector('.nz-in'),img:L.querySelector('.nz-in img'),p:L.querySelector('.nz-p'),n:L.querySelector('.nz-nx'),ld:L.querySelector('.nz-ld')};
  el.x.addEventListener('click',close);
  el.p.addEventListener('click',function(){go(-1);});
  el.n.addEventListener('click',function(){go(1);});
  L.addEventListener('click',function(e){ if(e.target===L||e.target===el.st) close(); });
  el.img.addEventListener('click',toggleZoom);
  window.addEventListener('keydown',onKey,true);
  var sx=0,sy=0;
  el.st.addEventListener('touchstart',function(e){ if(e.touches.length===1){sx=e.touches[0].clientX;sy=e.touches[0].clientY;} },{passive:true});
  el.st.addEventListener('touchend',function(e){
    if(el.in.classList.contains('z')||!e.changedTouches.length) return;
    var dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;
    if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5) go(dx<0?1:-1);
  },{passive:true});
  /* kéo để di chuyển khi đã phóng to (chuột) */
  var drag=null;
  el.st.addEventListener('mousedown',function(e){ if(!el.in.classList.contains('z')) return; drag={x:e.clientX,y:e.clientY,l:el.st.scrollLeft,t:el.st.scrollTop,moved:false}; });
  window.addEventListener('mousemove',function(e){ if(!drag) return; var dx=e.clientX-drag.x,dy=e.clientY-drag.y; if(Math.abs(dx)+Math.abs(dy)>4) drag.moved=true; el.st.scrollLeft=drag.l-dx; el.st.scrollTop=drag.t-dy; });
  window.addEventListener('mouseup',function(){ if(drag&&drag.moved){ el.img.setAttribute('data-nodrag','1'); setTimeout(function(){el.img.removeAttribute('data-nodrag');},0);} drag=null; });
}

function onKey(e){
  if(!L||!L.classList.contains('on')) return;
  if(e.key==='Escape'||e.key==='ArrowLeft'||e.key==='ArrowRight'||e.key==='Tab'){ e.stopImmediatePropagation(); }
  if(e.key==='Escape'){e.preventDefault();close();}
  else if(e.key==='ArrowLeft'){go(-1);}
  else if(e.key==='ArrowRight'){go(1);}
  else if(e.key==='Tab'){
    var f=[el.x,el.p,el.n].filter(function(b){return b.style.display!=='none';}), i=f.indexOf(document.activeElement);
    e.preventDefault(); f[(i+(e.shiftKey?-1:1)+f.length)%f.length].focus();
  }
}

function toggleZoom(e){
  if(el.img.getAttribute('data-nodrag')) return;
  var inn=el.in, img=el.img;
  if(inn.classList.contains('z')){ inn.classList.remove('z'); img.style.width=''; el.st.scrollLeft=0; el.st.scrollTop=0; return; }
  var r=img.getBoundingClientRect(), fx=(e&&e.clientX!=null)?(e.clientX-r.left)/r.width:.5, fy=(e&&e.clientY!=null)?(e.clientY-r.top)/r.height:.5;
  var w=Math.max(img.naturalWidth||0,Math.round(r.width*2.2));
  inn.classList.add('z'); img.style.width=w+'px';
  el.st.scrollLeft=Math.max(0,fx*w-el.st.clientWidth/2);
  el.st.scrollTop=Math.max(0,fy*(w*(img.naturalHeight/img.naturalWidth||r.height/r.width))-el.st.clientHeight/2);
}

function show(){
  var it=items[idx], my=++tok;
  el.in.classList.remove('z'); el.img.style.width=''; el.st.scrollLeft=0; el.st.scrollTop=0;
  var old=el.in.querySelector('.nz-mk'); if(old) old.remove();
  el.cap.textContent=it.cap||''; el.cap.title=it.cap||'';
  el.cnt.textContent=items.length>1?(idx+1)+' / '+items.length:'';
  var multi=items.length>1; el.p.style.display=el.n.style.display=multi?'':'none';
  el.img.alt=it.cap||'';
  var hi=it.src;
  if(it.thumb&&it.thumb!==hi) el.img.src=it.thumb; else el.img.src=hi;
  if(it.mark){
    var m=document.createElement('div'); m.className='nz-mk'; m.style.left=it.mark.x; m.style.top=it.mark.y;
    if(it.mark.label){ var i=document.createElement('i'); i.textContent=it.mark.label; m.appendChild(i); }
    el.in.appendChild(m);
  }
  if(it.thumb&&it.thumb!==hi){
    el.ld.classList.add('on');
    var pre=new Image(); pre.onload=function(){ if(my===tok){ el.img.src=hi; el.ld.classList.remove('on'); } }; pre.onerror=function(){ if(my===tok) el.ld.classList.remove('on'); }; pre.src=hi;
  } else el.ld.classList.remove('on');
}

function go(d){ if(items.length<2) return; idx=(idx+d+items.length)%items.length; show(); }

function open(list,i){
  if(!list||!list.length) return;
  if(!L) build();
  items=list; idx=i||0; lastFocus=document.activeElement;
  document.documentElement.classList.add('nz-open'); L.classList.add('on'); show(); el.x.focus();
}
function close(){
  if(!L) return; L.classList.remove('on'); tok++; document.documentElement.classList.remove('nz-open');
  el.img.removeAttribute('src'); var m=el.in.querySelector('.nz-mk'); if(m) m.remove();
  if(lastFocus&&lastFocus.focus) try{lastFocus.focus();}catch(e){}
}

/* ─── gắn nút vào một ảnh (dùng cho trang công cụ) ─── */
function wrap(img,get){
  if(img.closest&&img.closest('.nz-w')) return null;
  var par=img.parentNode, cs=window.getComputedStyle(par), w=document.createElement('span'); w.className='nz-w';
  if(cs.display==='flex'||cs.display==='inline-flex'||cs.display==='grid'){
    var ic=window.getComputedStyle(img); w.style.flex=ic.flex; w.style.minWidth=ic.minWidth; img.style.flex='none';
  }
  par.insertBefore(w,img); w.appendChild(img);
  var b=document.createElement('button'); b.type='button'; b.className='nz-b'; b.innerHTML='<span aria-hidden="true">🔍</span> Phóng to';
  b.setAttribute('aria-label','Phóng to ảnh'+(img.alt?': '+img.alt:'')); w.appendChild(b);
  var run=function(e){ e.preventDefault(); e.stopPropagation(); get(); };
  b.addEventListener('click',run); img.addEventListener('click',run);
  return w;
}
function attach(img,getItem){
  if(!img) return;
  wrap(img,function(){ var it=getItem(); if(it&&it.src) open([it],0); });
}

/* ─── tự gắn cho ảnh nội dung của trang bài ─── */
function bindArticle(){
  var root=document.getElementById('pBody'); if(!root) return;
  var list=[].filter.call(root.querySelectorAll('img[srcset]'),function(im){
    return !im.closest('a')&&!im.closest('.p-360')&&!im.closest('.p-who')&&!im.closest('#pAside')&&(parseInt(im.getAttribute('width')||'0',10)>=400);
  });
  var data=list.map(function(im){
    var best=im.currentSrc||im.src,bw=0;
    (im.getAttribute('srcset')||'').split(',').forEach(function(p){ var m=p.trim().split(/\s+/); var w=parseInt(m[1],10)||0; if(w>bw){bw=w;best=m[0];} });
    var fig=im.closest('figure'), fc=fig&&fig.querySelector('figcaption');
    return {src:best,thumb:im.currentSrc||im.src,cap:((fc&&fc.textContent)||im.alt||'').replace(/\s+/g,' ').trim()};
  });
  list.forEach(function(im,i){
    wrap(im,function(){ open(data,i); });
  });
}

window.NATZoom={open:open,close:close,attach:attach};
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bindArticle); else bindArticle();
})();
