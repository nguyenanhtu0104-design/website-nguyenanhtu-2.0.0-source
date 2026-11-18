(async()=>{
const groups=await fetch('lots.json').then(r=>r.json()),records=await fetch('geometry.json').then(r=>r.json()),plan=new Image();plan.src='plan.webp';await plan.decode();
const names=['Casa Townhouse','Casa Villa song lập','Casa Villa đơn lập','Casa Grand Villa'],floors=[4,3,3,4],sizes=['7,5 × (17,5 / 18 / 20)','10 × (16 / 17 / 17,5 / 18 / 20)','14 × (19 / 20)','16 × 22'],pages=[[12,13],[19,20],[26,27],[29]],colors=['#b67136','#b5a653','#89a453','#5a9992'];
const get=id=>document.getElementById(id),canvas=get('view'),ctx=canvas.getContext('2d'),select=get('type');
let cx=445,cy=192,zoom=1,angle=-.06,pitch=.85,dim=1,selected=-1;
names.forEach((v,i)=>select.add(new Option(v+' · '+groups[i].length+' căn',i)));
function draw(){
 const W=canvas.clientWidth,H=canvas.clientHeight,dpr=Math.min(devicePixelRatio,2);canvas.width=W*dpr;canvas.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
 const s=Math.min(W/790,H/425)*zoom,c=Math.cos(angle),a=Math.sin(angle),tilt=Math.sin(pitch),rise=Math.cos(pitch);
 function point(x,y,z=0){x-=cx;y-=cy;return [W/2+s*(c*x-a*y),H/2+s*((a*x+c*y)*tilt-z*rise)]}
 const origin=point(0,0);ctx.save();ctx.transform(c*s,a*s*tilt,-a*s,c*s*tilt,...origin);ctx.globalAlpha=.72;ctx.drawImage(plan,0,0,960,540);ctx.restore();
 // Calibrate the local plan to the nominal frontages. Row centres remain approximate.
 const unit=.44;
 const boxes=records.filter(r=>selected<0||selected===r.t).map(r=>{
   const width=(r.vertical?r.displayDepth:r.front)*unit, height=(r.vertical?r.front:r.displayDepth)*unit;
   const bodyW=(r.vertical?r.bodyDepth:r.bodyWidth),bodyH=(r.vertical?r.bodyWidth:r.bodyDepth);
   return {x:r.x,y:r.y,w:width,h:height,bw:bodyW&&bodyW*unit,bh:bodyH&&bodyH*unit,t:r.t,depth:r.x*a+r.y*c};
 }).sort((u,v)=>u.depth-v.depth);
 for(const b of boxes){const x=b.x-b.w/2,y=b.y-b.h/2;face([[x,y],[x+b.w,y],[x+b.w,y+b.h],[x,y+b.h]].map(q=>point(...q)),'#c8bda0');}
 function face(points,color){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=color;ctx.fill();}
 for(const b of boxes){let {x,y,w,h,t}=b;w=b.bw??w*.7;h=b.bh??h*.62;x-=w/2;y-=h/2;let z=floors[t]*1.4;const corners=[[x,y],[x+w,y],[x+w,y+h],[x,y+h]],low=corners.map(q=>point(...q)),high=corners.map(q=>point(...q,z));for(const i of [a>0?1:3,c>0?2:0]){const j=(i+1)%4;face([low[i],low[j],high[j],high[i]],i%2?'#9d9383':'#d5c7b3')}face(high,colors[t]);}
}
function choose(){selected=Number(select.value);const rows=groups[selected];cx=445;cy=192;zoom=1;if(rows){const xs=rows.map(b=>b[0]+b[2]/2),ys=rows.map(b=>b[1]+b[3]/2);cx=(Math.min(...xs)+Math.max(...xs))/2;cy=(Math.min(...ys)+Math.max(...ys))/2;zoom=Math.min(4,700/(Math.max(...xs)-Math.min(...xs)+65));}get('info').textContent=rows?names[selected]+' · '+rows.length+' căn · '+floors[selected]+' tầng nổi + 1 hầm · lô điển hình '+sizes[selected]+' m.':'171 townhouse · 460 villa song lập · 176 villa đơn lập · 132 grand villa.';const docs=get('docs');docs.replaceChildren();for(const p of pages[selected]||[]){const im=new Image();im.src='p'+p+'.webp';im.alt='Hồ sơ Casa Villa, trang '+p;docs.append(im)}draw()}
function scale(f){zoom=Math.max(.5,Math.min(10,zoom*f));draw()}
select.onchange=choose;get('plus').onclick=()=>scale(1.25);get('minus').onclick=()=>scale(.8);get('turn').onclick=()=>{angle+=Math.PI/4;draw()};get('home').onclick=()=>{select.value=-1;angle=-.06;pitch=.85;choose()};
let prev;canvas.onpointerdown=e=>{prev=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId)};canvas.onpointermove=e=>{if(!prev)return;angle+=(e.clientX-prev[0])*.008;pitch=Math.max(.2,Math.min(1.52,pitch+(e.clientY-prev[1])*.005));prev=[e.clientX,e.clientY];draw()};canvas.onpointerup=canvas.onpointercancel=()=>prev=null;canvas.addEventListener('wheel',e=>{e.preventDefault();scale(e.deltaY<0?1.1:1/1.1)},{passive:false});new ResizeObserver(draw).observe(canvas);choose();
})()
