const el=id=>document.getElementById(id);
const format=t=>new Date(t).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'});
const selector=el('projectPicker'),root=el('inventoryTools');
let projects={},slug=root.dataset.project;
function paint(){
 const p=projects[slug];if(!p)return;drawDirectory();
 el('invStamp').textContent=p.updatedAt?'Nguồn cập nhật '+format(p.updatedAt)+' (giờ Việt Nam)':p.snapshotDate?'Bảng giá ngày 17/11/2026 · chưa có giờ nguồn':'Chưa có thời điểm cập nhật từ nguồn';
 try{const t=localStorage.getItem('inventory.check.'+slug);el('checkedAt').textContent=t?'Lần kiểm tra: '+format(t):''}catch{}
 const a=el('invSource');a.hidden=!p.inventoryUrl;
 if(p.inventoryUrl)a.href=p.inventoryUrl;
 el('invMissing').textContent=p.inventoryUrl?'':'Đang chờ link giỏ hàng từ phụ trách dự án.';
 if(selector){const show=slug==='blanca-city';el('blancaZones').hidden=!show;if(show&&!el('blancaFrame').hasAttribute('src'))el('blancaFrame').src='/assets/tools/casa-blanca/blanca.html';el('sandboxArtisan').hidden=slug!=='artisan-park';el('profile').href='/cam-nang/'+slug+'/';el('projectName').textContent=p.name;}
}
async function refresh(clicked){
 const btn=el('invRefresh');btn.disabled=true;
 try{
 const r=await fetch('/tim-nha/projects.json',{cache:'no-store'});if(!r.ok)throw Error();
 projects=await r.json();
 if(selector&&!selector.options.length){
 for(const [key,p] of Object.entries(projects).sort((a,b)=>a[1].name.localeCompare(b[1].name,'vi')))selector.add(new Option(p.name,key));
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

function drawDirectory(){
 const grid=el('grid');if(!grid)return;
 const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').toLowerCase();
 const q=norm(el('findProject').value.trim());
 const cards=[];
 for(const [key,p] of Object.entries(projects).sort(([a],[b])=>a==='artisan-park'?-1:b==='artisan-park'?1:projects[a].name.localeCompare(projects[b].name,'vi'))){
  if(!norm(p.name+' '+p.region).includes(q))continue;
  const card=document.createElement('button');card.className='property';card.type='button';card.setAttribute('aria-pressed',String(key===slug));
  const photo=new Image();photo.src=p.thumbnail;photo.loading='lazy';photo.alt=p.imageCaption+' · '+p.name;card.append(photo);
  function line(tag,value,parent=card){const child=document.createElement(tag);child.textContent=value;parent.append(child);return child;}
  line('small',p.imageCaption+' · '+p.region);line('strong',p.name);
  const metrics=line('span','');metrics.className='metrics';
  const count=v=>v==null?'Chưa cập nhật':v+' căn';
  line('span','Sơ cấp: '+count(p.primaryCount),metrics);line('span','Thứ cấp: '+count(p.secondaryCount),metrics);
  line('span','Giá chào TB: '+(p.meanAskingVnd==null?'Chưa cập nhật':(p.meanAskingVnd/1e9).toLocaleString('vi-VN',{maximumFractionDigits:2})+' tỷ/căn'),metrics);
  if(p.snapshotDate)line('small','Bảng giá '+p.snapshotDate.split('-').reverse().join('/')+' · gồm VAT');
  card.onclick=()=>{selector.value=key;selector.dispatchEvent(new Event('change'));el('selectedProject').scrollIntoView({block:'start'});};
  cards.push(card);
 }
 grid.replaceChildren(...cards);el('resultCount').textContent=cards.length+' dự án';
}
if(el('findProject'))el('findProject').oninput=drawDirectory;
