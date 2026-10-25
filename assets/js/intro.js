/* Màn mở đầu bằng clip: tự chạy (tắt tiếng), hết clip hoặc bấm "Bỏ qua" thì mờ dần để lộ nội dung trang */
(function(){
'use strict';
var box=document.getElementById('introClip'); if(!box) return;
var root=document.documentElement,v=box.querySelector('video'),bar=box.querySelector('.intro-bar'),skip=box.querySelector('.intro-skip'),done=false;
function finish(){
  if(done) return; done=true;
  box.classList.add('is-out'); root.classList.remove('intro-on');
  try{v.pause();}catch(e){}
  setTimeout(function(){ if(box.parentNode) box.parentNode.removeChild(box); },800);
}
if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion:reduce)').matches){ finish(); return; }
if(skip) skip.addEventListener('click',finish);
document.addEventListener('keydown',function(e){ if(e.key==='Escape') finish(); });
v.addEventListener('ended',finish);
v.addEventListener('error',finish);
v.addEventListener('timeupdate',function(){ if(bar&&v.duration) bar.style.width=(v.currentTime/v.duration*100)+'%'; });
v.muted=true;
var p=v.play();
if(p&&p.catch) p.catch(finish);
/* không tải được/đứng hình quá lâu thì bỏ qua để người đọc không bị kẹt */
setTimeout(function(){ if(!done&&v.readyState<3&&v.currentTime===0) finish(); },8000);
})();
