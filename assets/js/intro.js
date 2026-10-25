/* Màn mở đầu bằng clip: tự chạy (có tiếng; nếu trình duyệt chặn thì chạy tắt tiếng và có nút bật tiếng), hết clip hoặc bấm "Bỏ qua" thì mờ dần để lộ nội dung trang */
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
var snd=box.querySelector('.intro-snd');
function icon(){ if(snd) snd.textContent=v.muted?'🔇':'🔊'; }
if(snd) snd.addEventListener('click',function(){ v.muted=!v.muted; icon(); if(v.paused) v.play().catch(function(){}); });
v.muted=false;
var p=v.play();
if(p&&p.catch) p.catch(function(){ v.muted=true; icon(); var q=v.play(); if(q&&q.catch) q.catch(finish); });
/* không tải được/đứng hình quá lâu thì bỏ qua để người đọc không bị kẹt */
setTimeout(function(){ if(!done&&v.readyState<3&&v.currentTime===0) finish(); },8000);
})();
