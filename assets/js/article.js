/* Cẩm Nang BĐS 2.0 — trang bài: tương tác nội dung (FAQ, bộ lọc nguyên tắc), đóng, chia sẻ, xuất PDF */
(function(){
'use strict';
var BASE=document.documentElement.getAttribute('data-base')||'/';

/* ─── Tương tác nội dung (giữ nguyên từ v57) ─── */
window.showCluster=function(id,btn){
  document.querySelectorAll('#panel .faq-cluster').forEach(function(c){c.style.display='none';});
  document.querySelectorAll('#panel .faq-cluster-btn').forEach(function(b){b.classList.remove('active');});
  var el=document.getElementById(id); if(el) el.style.display='block';
  if(btn) btn.classList.add('active');
  document.querySelectorAll('#panel .faq-item.open').forEach(function(i){i.classList.remove('open');});
};
window.toggleFaq=function(el){
  var isOpen=el.classList.contains('open');
  var panel=el.closest('.faq-cluster')||document.getElementById('panel');
  panel.querySelectorAll('.faq-item.open').forEach(function(i){i.classList.remove('open');});
  if(!isOpen) el.classList.add('open');
};
window.filterPrinciple=function(tag,btn){
  document.querySelectorAll('#principle-list .tag-btn, .tag-filter-wrap .tag-btn').forEach(function(b){b.classList.remove('active');});
  document.querySelectorAll('.tag-filter-wrap .tag-btn[data-tag="'+tag+'"]').forEach(function(b){b.classList.add('active');});
  var count=0;
  document.querySelectorAll('.principle-card').forEach(function(card){
    var tags=card.getAttribute('data-tags')||'';
    if(tag==='all'||tags.indexOf(tag)>-1){card.style.display='flex';count++;} else card.style.display='none';
  });
  var c=document.getElementById('tag-count');
  if(c) c.textContent=tag==='all'?'Hiển thị tất cả 22 nguyên tắc':'Hiển thị '+count+' nguyên tắc phù hợp';
};
/* Mở cụm FAQ theo hash, vd /cam-nang/phap-luat-bds/#cluster-2 */
if(location.hash){
  var t=document.getElementById(location.hash.slice(1));
  if(t&&t.classList.contains('faq-cluster')){
    var b=[].find.call(document.querySelectorAll('#panel .faq-cluster-btn'),function(x){return (x.getAttribute('onclick')||'').indexOf(t.id)>-1;});
    window.showCluster(t.id,b);
  }
}
/* Phần tử liên kết dự phòng (data-href) */
document.addEventListener('click',function(e){
  var el=e.target.closest('[data-href]'); if(el){ location.href=el.getAttribute('data-href'); }
});
document.addEventListener('keydown',function(e){
  var el=e.target.closest&&e.target.closest('[data-href]');
  if(el&&(e.key==='Enter'||e.key===' ')){ e.preventDefault(); location.href=el.getAttribute('data-href'); }
  if(e.key==='Escape') closePage();
});

/* ─── Đóng (✕): quay lại trang trước nếu đến từ Cẩm nang, ngược lại về trang chủ ─── */
function closePage(){
  var ref=document.referrer;
  if(ref&&ref.indexOf(location.origin)===0&&history.length>1) history.back();
  else location.href=BASE;
}
var closeBtn=document.getElementById('pClose');
if(closeBtn) closeBtn.addEventListener('click',function(e){ e.preventDefault(); closePage(); });

/* ─── Chia sẻ ─── */
var copyBtn=document.getElementById('copyArticleLink'), linkStatus=document.getElementById('articleLinkStatus');
if(copyBtn) copyBtn.addEventListener('click',function(){
  var link=document.querySelector('link[rel=canonical]'), u=link?link.href:location.href;
  function ok(){ linkStatus.textContent='Đã sao chép liên kết'; setTimeout(function(){linkStatus.textContent='';},2500); }
  function fail(){ linkStatus.textContent='Không sao chép tự động được — liên kết: '+u; }
  if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(u).then(ok,fail); else fail();
});

/* ─── Xuất PDF (cửa sổ in, giữ định dạng — như v57, không cần thư viện ngoài) ─── */
window.exportPanelToPdf=function(){
  var pBody=document.getElementById('pBody');
  if(!pBody||!pBody.innerHTML.trim()){alert('Không có nội dung để xuất');return;}
  var panel=document.getElementById('panel');
  var panelTitle=panel.getAttribute('data-title')||document.title;
  var panelHex=panel.getAttribute('data-accent')||'#c8993a';
  var w=window.open('','','height=900,width=900');
  if(!w){alert('Lỗi: Bật popup blocker');return;}
  var cssHref=(document.querySelector('link[rel=stylesheet][href*="main.css"]')||{}).href;
  var clone=pBody.cloneNode(true), urls=[];
  clone.querySelectorAll('img').forEach(function(i){i.removeAttribute('loading');i.removeAttribute('srcset');i.removeAttribute('sizes');i.src=i.src;urls.push(i.src);});
  /* Tải trước ảnh ở cửa sổ chính (kể cả ảnh lazy chưa hiện) để bản in có đủ ảnh */
  var preload=Promise.all(urls.map(function(u){return new Promise(function(res){var im=new Image();im.onload=im.onerror=res;im.src=u;});}));
  var timeout=new Promise(function(res){setTimeout(res,10000);});
  var cssP=fetch(cssHref).then(function(r){return r.text();}).catch(function(){return '';});
  Promise.all([cssP,Promise.race([preload,timeout])]).then(function(r){
    var css=r[0];
    var P=panelHex;
    var html='<!DOCTYPE html><html><head><meta charset="utf-8"><base href="'+location.origin+'/"><title>'+panelTitle+'</title>'
      +'<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,500;0,700;1,400&family=IBM+Plex+Sans:wght@300;400;500&display=swap" rel="stylesheet">'
      +'<style>'+css+'\n'
      +'body{background:white!important;color:#1a1a1a!important}*{color:inherit!important}html{background:white!important}'
      +'#pdf-wrapper{width:100%;background:white;color:#1a1a1a}'
      +'#pdf-title-section{border-bottom:2px solid #c8993a;padding-bottom:10px;margin-bottom:15px}'
      +"#pdf-title{font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:700;color:#1a1a1a;margin-bottom:5px}"
      +'#pdf-date{font-size:10px;color:#777}'
      +'#pdf-content h1,#pdf-content .p-h1,#pdf-content h4,#pdf-content h5,#pdf-content h6{color:#1a1a1a!important;page-break-after:avoid}'
      +'#pdf-content h2,#pdf-content .p-h2,#pdf-content h3{color:'+P+'!important;page-break-after:avoid}'
      +'#pdf-content h2::before,#pdf-content .p-h2::before{background:'+P+'!important}'
      +'#pdf-content .p-lead{color:#4a4a4a!important;border-left-color:'+P+'!important}'
      +'#pdf-content p,#pdf-content .p-p,#pdf-content li,#pdf-content td{color:#1a1a1a!important}'
      +'#pdf-content strong{color:#2a2a2a!important;font-weight:700!important}'
      +'#pdf-content .p-card,#pdf-content .p-call{background:#fafafa!important;border-left:3px solid '+P+'!important;page-break-inside:avoid}'
      +'#pdf-content .p-card strong,#pdf-content .p-call-lbl,#pdf-content .p-tl-yr,#pdf-content .knum-n{color:'+P+'!important}'
      +'#pdf-content .p-tl-dot{background:'+P+'!important;border-color:'+P+'!important;color:#fff!important}'
      +'#pdf-content .p-facts .knum-n,#pdf-content .p-travel b{color:'+P+'!important}#pdf-content .p-360{display:none!important}#pdf-content .mix-bar{background:#e4e4e4!important}#pdf-content .mix-row small{color:#555!important}#pdf-content .mix-bar i{background:'+P+'!important}'
      +'#pdf-content .p-price,#pdf-content .p-offers{background:#fafafa!important;border:1px solid #ccc!important;border-radius:6px;text-align:center;margin:10px 0;page-break-inside:avoid}'
      +'#pdf-content .p-price{padding:12px}#pdf-content .p-price-n{font-size:30px;font-weight:700;color:'+P+'!important}#pdf-content .p-price-n span{font-size:14px;color:#444!important}#pdf-content .p-price-l,#pdf-content .p-price-d{font-size:11px;color:#555!important}'
      +'#pdf-content .p-offers{display:flex}#pdf-content .p-offers>div{flex:1;padding:10px 6px}#pdf-content .p-offers b{display:block;font-size:20px;color:'+P+'!important}#pdf-content .p-offers span{font-size:11px;color:#333!important}'
      +'#pdf-content .p-crumb,#pdf-content .p-hubline{display:none!important}'
      +'#pdf-content table{page-break-inside:avoid}#pdf-content th{background:#f0f0f0!important;color:#1a1a1a!important;border-color:#ccc!important}'
      +'#pdf-content img{max-width:100%;height:auto;page-break-inside:avoid}'
      +'button,[onclick],.p-close,.p-export-pdf,.faq-cluster-btn,#pdf-content .files-sec{display:none!important}'
      +'#pdf-contact{margin-top:32px;padding-top:18px;border-top:2px solid '+P+'}'
      +"#pdf-contact-name{font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:700;color:#1a1a1a}"
      +'#pdf-contact-role{font-size:11px;color:#777;margin-bottom:6px}.pdf-contact-line{font-size:11.5px;color:#333;margin-top:4px}'
      +'.pdf-contact-line b,.pdf-contact-line a{color:'+P+'}'
      +'</style></head><body><div id="pdf-wrapper">'
      +'<div id="pdf-title-section"><div id="pdf-title">'+panelTitle+'</div><div id="pdf-date">Xuất ngày: '+new Date().toLocaleString('vi-VN')+' · '+location.href+'</div></div>'
      +'<div id="pdf-content">'+clone.innerHTML+'</div>'
      +'<div id="pdf-contact"><div id="pdf-contact-name">Nguyễn Anh Tú</div><div id="pdf-contact-role">Nguyễn Anh Tú · Tư vấn bất động sản</div>'
      +'<div class="pdf-contact-line"><b>Hotline &amp; Zalo:</b> <a href="https://zalo.me/0978618149">0978 618 149</a></div>'
      +'<div class="pdf-contact-line"><b>Facebook:</b> <a href="https://www.facebook.com/nguyen.anh.tu.397787/">facebook.com/nguyen.anh.tu.397787</a></div>'
      +'<div class="pdf-contact-line"><b>YouTube:</b> <a href="https://www.youtube.com/@nguyenanhtu.kienphat">@nguyenanhtu.kienphat</a></div>'
      +'</div></div></body></html>';
    w.document.write(html); w.document.close();
    setTimeout(function(){ w.focus(); w.print(); setTimeout(function(){w.close();},500); },700);
  });
};
/* ─── 2.1: điều hướng nổi (đánh dấu mục đang đọc), chiều cao đầu trang, thanh cơ cấu sản phẩm ─── */
(function(){
  var head=document.getElementById('pHead'), nav=document.getElementById('secNav');
  function setHeadH(){ if(head) document.documentElement.style.setProperty('--head-h',(head.offsetHeight+8)+'px'); }
  setHeadH(); window.addEventListener('resize',setHeadH);
  if(window.ResizeObserver&&head) new ResizeObserver(setHeadH).observe(head);

  var navs=[].slice.call(document.querySelectorAll('#secNav,#asideNav'));
  if(navs.length){
    var links=[].slice.call(document.querySelectorAll('#secNav a,#asideNav a')), ids=[];
    links.forEach(function(a){ var id=a.getAttribute('href').slice(1); if(document.getElementById(id)&&ids.indexOf(id)<0) ids.push(id); });
    var mark=function(id){
      links.forEach(function(a){
        var on=a.getAttribute('href')==='#'+id; a.classList.toggle('on',on);
        if(on){ a.setAttribute('aria-current','true');
          var n=a.parentElement;
          if(n&&n.id==='secNav'&&n.offsetParent){ var nr=n.getBoundingClientRect(), ar=a.getBoundingClientRect();
            if(ar.left<nr.left+8||ar.right>nr.right-8) n.scrollLeft+=ar.left-nr.left-12; }
          if(n&&n.id==='asideNav'&&n.offsetParent){ var mr=n.getBoundingClientRect(), br=a.getBoundingClientRect();
            if(br.top<mr.top+6||br.bottom>mr.bottom-6) n.scrollTop+=br.top-mr.top-mr.height/3; }
        } else a.removeAttribute('aria-current');
      });
    };
    var ticking=false;
    var spy=function(){
      ticking=false;
      var line=(head?head.offsetHeight:0)+40, cur=null;
      ids.forEach(function(id){ if(document.getElementById(id).getBoundingClientRect().top<=line) cur=id; });
      if(ids.length&&window.innerHeight+window.scrollY>=document.documentElement.scrollHeight-4) cur=ids[ids.length-1];
      mark(cur);
    };
    window.addEventListener('scroll',function(){ if(!ticking){ ticking=true; requestAnimationFrame(spy); } },{passive:true});
    window.addEventListener('resize',spy);
    spy();
    /* Bấm mục: cuộn mượt, không thêm lịch sử (nút Back vẫn thoát khỏi bài) */
    navs.forEach(function(nav){ nav.addEventListener('click',function(e){
      var a=e.target.closest('a'); if(!a) return;
      var el=document.getElementById(a.getAttribute('href').slice(1)); if(!el) return;
      e.preventDefault(); el.scrollIntoView({behavior:'smooth',block:'start'});
      if(history.replaceState) history.replaceState(null,'',a.getAttribute('href'));
    }); });
  }

  /* Bảng có cột "Tỷ lệ" (vd cơ cấu sản phẩm): thêm thanh ngang + số % dưới tên ở cột đầu (luôn thấy được trên điện thoại,
     không phải vuốt ngang tới cột Tỷ lệ). Bảng gốc giữ nguyên. */
  [].forEach.call(document.querySelectorAll('#pBody table'),function(t){
    var rows=t.rows; if(!rows.length) return;
    var ci=-1; [].forEach.call(rows[0].cells,function(c,i){ if(ci<0&&/^\s*tỷ lệ\s*$/i.test(c.textContent)) ci=i; });
    if(ci<0) return;
    var vals=[];
    for(var r=1;r<rows.length;r++){
      var c=rows[r].cells[ci]; if(!c||!rows[r].cells[0]) continue;
      var txt=c.textContent.replace(/\s/g,''), m=txt.match(/^(\d+(?:[.,]\d+)?)%$/);
      if(m) vals.push({c:rows[r].cells[0],v:parseFloat(m[1].replace(',','.')),t:txt});
    }
    if(vals.length<2) return;
    var max=Math.max.apply(null,vals.map(function(x){return x.v;}));
    vals.forEach(function(x){
      var row=document.createElement('span'), bar=document.createElement('span'), i=document.createElement('i'), lb=document.createElement('small');
      row.className='mix-row'; row.setAttribute('aria-hidden','true'); bar.className='mix-bar';
      i.style.width=Math.max(3,x.v/max*100).toFixed(1)+'%'; bar.appendChild(i); lb.textContent=x.t;
      row.appendChild(bar); row.appendChild(lb); x.c.appendChild(row);
    });
  });
})();
/* ─── 2.3: khối 360° / mặt bằng nhúng (.p-360): iframe chỉ được tạo khi người đọc bấm; chỉ host đã duyệt (embedHosts) ─── */
(function(){
  var allow=(document.documentElement.getAttribute('data-embed')||'').split(',').filter(Boolean);
  var ok=function(u){ try{ var x=new URL(u); return x.protocol==='https:'&&allow.indexOf(x.hostname)>-1; }catch(e){ return false; } };
  [].forEach.call(document.querySelectorAll('#pBody .p-360'),function(box){
    var tabs=[].slice.call(box.querySelectorAll('.p-360-tab')).filter(function(t){ return ok(t.getAttribute('href')); });
    var stage=box.querySelector('.p-360-stage'), play=box.querySelector('.p-360-play'), full=box.querySelector('.p-360-full');
    if(box.getAttribute('data-mode')==='link') return;   /* chế độ mở tab mới: không nhúng, các liên kết chạy như bình thường */
    if(!tabs.length||!stage) return;
    box.classList.add('is-js'); tabs[0].parentNode.setAttribute('role','tablist');
    var show=function(tab){
      var u=tab.getAttribute('href');
      tabs.forEach(function(t){ var on=t===tab; t.classList.toggle('on',on); t.setAttribute('role','tab'); t.setAttribute('aria-selected',on?'true':'false'); });
      if(full) full.setAttribute('href',u);
      var f=stage.querySelector('iframe');
      if(!f){
        f=document.createElement('iframe');
        f.setAttribute('allow','fullscreen; autoplay; accelerometer; gyroscope; clipboard-write'); f.setAttribute('allowfullscreen','');
        f.setAttribute('referrerpolicy','strict-origin-when-cross-origin');
        f.setAttribute('title',(box.getAttribute('data-title')||'Tham quan 360°')+' — '+tab.textContent);
        stage.appendChild(f); if(play) play.remove();
      }
      if(f.getAttribute('src')!==u){ f.setAttribute('src',u); f.setAttribute('title',(box.getAttribute('data-title')||'Tham quan 360°')+' — '+tab.textContent); }
    };
    tabs.forEach(function(t){ t.addEventListener('click',function(e){ e.preventDefault(); show(t); }); });
    if(play) play.addEventListener('click',function(e){ e.preventDefault(); show(box.querySelector('.p-360-tab.on')||tabs[0]); });
  });
})();

/* ─── Hiện dần khi lướt tới (cải tiến dần: không JS / giảm chuyển động / công cụ tìm kiếm thì nội dung hiện đủ ngay) ─── */
(function(){
var REVEAL=true; /* đặt false để tắt toàn bộ hiệu ứng */
if(!REVEAL||!('IntersectionObserver' in window)||!window.matchMedia||!matchMedia('(prefers-reduced-motion: no-preference)').matches) return;
var body=document.getElementById('pBody'); if(!body) return;
var SEL='.p-h2,.p-p,.p-lead,.p-card,.p-call,.p-price,.p-offers,.p-tl-row,.p-travel,.knum,.swot-cell,.faq-item,.p-cta-box,.proj-row,figure,table';
var STAG='.p-grid,.knums,.swot-grid';
var vh=window.innerHeight||800;
var io=new IntersectionObserver(function(es){
  es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('rv-in'); io.unobserve(e.target); } });
},{rootMargin:'0px 0px -6% 0px',threshold:0.06});
var seen=new Map();
Array.prototype.forEach.call(body.querySelectorAll(SEL),function(el){
  if(el.closest('.p-360,.faq-a,#pAside')) return;
  var r=el.getBoundingClientRect();
  if(r.top<vh||r.bottom<0) return;                 /* đã ở trong/trên khung nhìn lúc mở trang: giữ nguyên, không ẩn */
  var par=el.parentElement;
  if(par&&par.matches&&par.matches(STAG)){ var i=seen.get(par)||0; seen.set(par,i+1); el.style.setProperty('--rv-d',Math.min(i*70,280)+'ms'); }
  el.classList.add('rv'); io.observe(el);
});
})();

})();
