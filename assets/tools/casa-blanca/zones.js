const zona=document.querySelector('#zone'),detail=document.querySelector('#detail');
const profiles={beachtro:'beachtro-tower',b123:'cum-b1-b2-b3',b567:'cum-b5-b6-b7'};
const beaconTable='<table><caption>Cơ cấu căn hộ Beacon</caption><thead><tr><th>Loại căn</th><th>Thông thủy (m²)</th><th>Số căn</th></tr></thead><tbody>'+[['Garden house','Chưa ghi',47],['Studio','30,8–38,8',477],['1PN+','50,1–59,4',782],['2PN','65,7–79,9',721],['3PN','94,3–109,7',172],['Duplex','104,8–286,5',12]].map(row=>'<tr>'+row.map(v=>'<td>'+v+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
const sheets=['Tầng 4–19, 21–35','Tầng 20','Tầng 36','Tầng 37','Tầng 38','Tầng 39','Studio','1PN+','2PN','2PN+','3PN','3PN view kép'];
function showZone(key){
 if(!Array.from(zona.options).some(opt=>opt.value===key))key='all';
 zona.value=key;const isCasa=key==='casa';
 document.querySelector('#type').hidden=!isCasa;
 document.querySelector('#info').hidden=!isCasa;document.querySelector('#docs').hidden=!isCasa;
 document.querySelector('#info + p').hidden=!isCasa;
 detail.innerHTML=key==='beacon'?'<h2>Beacon Tower · E1 & E2</h2><p>2.211 căn hộ · 3 tầng hầm. Sơ đồ đứng E2 ghi 2 tầng khối đế, tầng 3–38 căn hộ và tầng 39–40 duplex.</p>'+beaconTable+'<p>Nguồn: Beacon.pdf, trang 6–7. Khối 3D minh họa vị trí E1 và E2 theo tổng mặt bằng, chiều cao và hình dáng được giản lược.</p><label>Mặt bằng Beacon 1 và mẫu căn <select id="level">'+sheets.map((name,i)=>'<option value="'+(8+i)+'">'+name+'</option>').join('')+'</select></label><p><a id="large" target="_blank" rel="noopener"><img id="floorplan" style="width:100%;max-width:1000px" alt="Mặt bằng Beacon"></a></p>':isCasa?'<h2>Casa Villa · 939 căn thấp tầng</h2>':profiles[key]?'<h2>'+zona.selectedOptions[0].text+'</h2><a href="/cam-nang/blanca-'+profiles[key]+'/" target="_top">Mở hồ sơ phân khu →</a>':'';
 if(key==='beacon'){const update=()=>{let src='beacon-'+document.querySelector('#level').value+'.webp';document.querySelector('#floorplan').src=src;document.querySelector('#large').href=src};document.querySelector('#level').onchange=update;update()}
 history.replaceState(null,'','#'+key);window.dispatchEvent(new Event('zonechange'));
}
zona.onchange=()=>showZone(zona.value);showZone(location.hash.slice(1));
