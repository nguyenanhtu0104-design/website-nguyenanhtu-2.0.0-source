const el=id=>document.getElementById(id);
const format=t=>new Date(t).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'});
const selector=el('projectPicker'),root=el('inventoryTools');
let projects={},slug=root.dataset.project;
let showPlatform=false;
function paint(){
 const p=projects[slug];if(!p)return;drawDirectory();
 el('invStamp').textContent=p.updatedAt?'Nguồn cập nhật '+format(p.updatedAt)+' (giờ Việt Nam)':p.snapshotDate?'Bảng giá ngày 17/11/2026 · chưa có giờ nguồn':'Chưa có thời điểm cập nhật từ nguồn';
 try{const t=localStorage.getItem('inventory.check.'+slug);el('checkedAt').textContent=t?'Lần kiểm tra: '+format(t):''}catch{}
 const a=el('invSource');a.hidden=!p.inventoryUrl;
 if(p.inventoryUrl)a.href=p.inventoryUrl;
 el('invMissing').textContent=p.inventoryUrl?'':'Đang chờ link giỏ hàng từ phụ trách dự án.';
 if(selector){const sb=p.saBan&&p.saBanTrang?'/assets/tools/'+p.saBan+'/'+p.saBanTrang:'';el('blancaZones').hidden=!sb;if(sb){if(el('blancaFrame').getAttribute('src')!==sb)el('blancaFrame').src=sb;el('saBanMo').href=sb;el('saBanMo').textContent='Mở sa bàn 3D '+p.name+' toàn màn hình ↗';el('blancaFrame').title=p.name+' · sa bàn 3D, giỏ hàng và tư vấn';}el('sandboxArtisan').hidden=slug!=='artisan-park';el('profile').href='/cam-nang/'+slug+'/';el('projectName').textContent=p.name;}
}
async function refresh(clicked){
 const btn=el('invRefresh');btn.disabled=true;
 try{
 const r=await fetch('/tim-nha/projects.json',{cache:'no-store'});if(!r.ok)throw Error();
 projects=await r.json();
 if(selector&&!selector.options.length){
 for(const [key,p] of Object.entries(projects).sort((a,b)=>byStar(a[1],b[1])))selector.add(new Option(p.name,key));
 slug=Object.hasOwn(projects,location.hash.slice(1))?location.hash.slice(1):'artisan-park';selector.value=slug;
 }
 if(selector){el('missingList').replaceChildren(...Object.values(projects).filter(p=>!p.inventoryUrl).map(p=>{const li=document.createElement('li');li.textContent=p.name;return li}));}
 if(clicked)try{localStorage.setItem('inventory.check.'+slug,new Date().toISOString())}catch{}
 paint();
 if(clicked)el('checkedAt').textContent='Đã kiểm tra danh mục lúc '+format(Date.now())+'.';
 }catch{el('checkedAt').textContent='Chưa tải được danh mục. Vui lòng thử lại.'}
 finally{btn.disabled=false}
}
el('invRefresh').onclick=()=>refresh(true);
if(selector)selector.onchange=()=>{slug=selector.value;history.replaceState(null,'','#'+slug);el('checkedAt').textContent='';el('sendBox').hidden=true;paint();};
refresh(false);
const form=el('consign');
if(form)form.onsubmit=async e=>{
 e.preventDefault();const f=new FormData(form);const msg=['Ký gửi '+projects[slug].name,'Nhu cầu: '+f.get('purpose'),'Căn: '+f.get('unit'),'Giá mong muốn: '+(f.get('price')||'Trao đổi'),'Liên hệ: '+f.get('contact')].join('\n');
 el('draft').value=msg;el('sendBox').hidden=false;
 try{await navigator.clipboard.writeText(msg);el('sendStatus').textContent='Đã sao chép. Mở Zalo, dán và gửi cho Nguyễn Anh Tú.'}catch{el('sendStatus').textContent='Sao chép nội dung bên dưới, mở Zalo và gửi cho Nguyễn Anh Tú.'}
};

// Dự án có dấu sao đứng trước; trong mỗi nhóm xếp theo tên (tiếng Việt).
function byStar(a,b){return (!!b.star-!!a.star)||a.name.localeCompare(b.name,'vi')}
function drawDirectory(){
 const grid=el('grid');if(!grid)return;
 const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').toLowerCase();
 const q=norm(el('findProject').value.trim());
 const cards=[];
 const cur=projects[slug],plat=cur&&cur.nenTang||null;
 const bar=el('platBar');
 if(bar){
  bar.hidden=!plat;
  if(plat){const n=Object.values(projects).filter(p=>p.nenTang===plat&&!(p.saBan&&cur.saBan)).length+(cur.saBan?1:0);el('platName').textContent=cur.nenTangTen;const t=el('platToggle');t.textContent=showPlatform?'Chỉ hiện '+cur.name:'Hiện các dự án khác ('+(n-1)+')';t.setAttribute('aria-pressed',String(showPlatform));}
 }
 // Dự án thuộc nền tảng: mặc định chỉ hiện dự án đang mở; khi đang tìm kiếm thì tìm trong tất cả.
 const scoped=plat&&!showPlatform&&!q;
 for(const [key,p] of Object.entries(projects).sort(([a],[b])=>a==='artisan-park'?-1:b==='artisan-park'?1:byStar(projects[a],projects[b]))){
  if(plat&&!q&&(showPlatform?p.nenTang!==plat:false))continue;
  // Dự án cùng nền tảng đã dựng trên cùng sa bàn (vd Nam Mekong và Artisan Park) luôn hiện cạnh nhau.
  if(scoped&&key!==slug&&!(p.nenTang===plat&&p.saBan&&cur.saBan))continue;
  if(!norm(p.name+' '+p.region).includes(q))continue;
  const card=document.createElement('button');card.className='property';card.type='button';card.setAttribute('aria-pressed',String(key===slug));
  const photo=new Image();photo.src=p.thumbnail;if(p.thumbnailNho){photo.srcset=p.thumbnailNho+' 640w, '+p.thumbnail+' 1200w';photo.sizes='(max-width:600px) 100vw, 300px';}photo.loading='lazy';photo.decoding='async';photo.alt=p.imageCaption+' · '+p.name;card.append(photo);
  function line(tag,value,parent=card){const child=document.createElement(tag);child.textContent=value;parent.append(child);return child;}
  line('small',p.imageCaption+' · '+p.region);line('strong',p.name);
  const metrics=line('span','');metrics.className='metrics';
  const count=v=>v==null?'Chưa cập nhật':v+' căn';
  if(p.quyDaiLy!=null)line('span','Quỹ đại lý: '+p.quyDaiLy.toLocaleString('vi-VN')+' căn',metrics);else line('span','Sơ cấp: '+count(p.primaryCount),metrics);line('span','Thứ cấp: '+count(p.secondaryCount),metrics);
  line('span','Giá chào TB: '+(p.meanAskingVnd==null?'Chưa cập nhật':(p.meanAskingVnd/1e9).toLocaleString('vi-VN',{maximumFractionDigits:2})+' tỷ/căn'),metrics);
  if(p.snapshotDate)line('small','Bảng giá '+p.snapshotDate.split('-').reverse().join('/')+' · gồm VAT');
  card.onclick=()=>{selector.value=key;selector.dispatchEvent(new Event('change'));el('selectedProject').scrollIntoView({block:'start'});};
  cards.push(card);
 }
 grid.replaceChildren(...cards);el('resultCount').textContent=cards.length+' dự án';
}
if(el('findProject'))el('findProject').oninput=drawDirectory;
if(el('platToggle'))el('platToggle').onclick=()=>{showPlatform=!showPlatform;drawDirectory();};
