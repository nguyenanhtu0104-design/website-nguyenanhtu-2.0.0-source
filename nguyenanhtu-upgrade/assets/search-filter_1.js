
// SEARCH + FILTER CH04 - 19 vung, 79 du an
function natFilter(cat, btn){
  document.querySelectorAll('.nat-filter button').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  const q = (document.getElementById('natSearch')?.value||'').toLowerCase();
  document.querySelectorAll('[data-nat-item]').forEach(el=>{
    const text = el.innerText.toLowerCase();
    const c = el.getAttribute('data-cat')||'all';
    const matchCat = (cat==='all' || c===cat);
    const matchQ = (!q || text.includes(q));
    el.style.display = (matchCat && matchQ) ? '' : 'none';
  });
  const visible = [...document.querySelectorAll('[data-nat-item]')].filter(e=>e.style.display!=='none').length;
  const count = document.getElementById('natCount');
  if(count) count.innerText = 'Đang hiển thị: ' + visible + ' / 79 dự án - 19 vùng';
}
document.addEventListener('DOMContentLoaded', ()=>{
  const s=document.getElementById('natSearch');
  if(s) s.addEventListener('input', ()=>natFilter(document.querySelector('.nat-filter button.active')?.dataset?.cat||'all', null));
});
function natSubmit(e){
  e.preventDefault();
  const zalo = document.getElementById('natZaloInput').value.trim();
  if(!zalo){ alert('Bạn nhập Zalo / Email để mình gửi PDF nhé.'); return; }
  // TODO: Thay bằng Formspree / Google Form / Zalo OA của bạn
  // fetch('https://formspree.io/f/YOUR_ID', {method:'POST', body: JSON.stringify({zalo})})
  document.getElementById('natLeadDone').style.display='block';
  document.getElementById('natLeadDone').innerText = 'Đã nhận: ' + zalo + ' - Mình sẽ gửi PDF Cẩm nang v2.23.0 qua Zalo cho bạn. Nhắn CAMNANG tới 0978 618 149 để nhận nhanh hơn.';
  if(window.fbq) fbq('track','Lead');
  if(window.gtag) gtag('event','generate_lead',{method:'pdf_cam_nang'});
}
