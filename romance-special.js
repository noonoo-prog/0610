
/* CG, 감정표현, 히든 이벤트 - 원본 캐릭터 리소스 활용 */
const CGS=[
['momo_rain','momo',2,'한 우산 아래','rain'],
['momo_cafe','momo',6,'둘만의 새벽 카페','cafe'],
['rui_read','rui',6,'한 사람을 위한 낭독회','books'],
['rui_page','rui',7,'둘만의 책갈피','books'],
['sion_sunset','sion',1,'옥상에 걸린 노을','sunset'],
['sion_stars','sion',7,'사진에 담지 못한 별','stars'],
['doha_ride','doha',5,'두 번째 정류장','river'],
['doha_letter','doha',7,'수신인, 너','letter'],
['momo_secret','momo',null,'창가 아래 숨긴 쪽지','cafe'],
['rui_secret','rui',null,'책장 뒤의 작은 방','books'],
['sion_secret','sion',null,'현상하지 않은 필름','stars'],
['doha_secret','doha',null,'우표 없는 편지','letter']
].map(function(a,i){return {id:a[0],who:a[1],chapter:a[2],title:a[3],art:a[4],secret:i>=8}});
const HIDDEN={
momo:{chapter:4,min:6,choice:3,title:'창가 아래 숨긴 쪽지',place:'문 닫은 카페',lines:[
['나레이션','창가 아래에서 바랜 쪽지 한 장을 발견한다.'],
['모모','그건 괜찮지 않으면서도 웃었던 날마다 적어 둔 거야. 들키고 싶지 않았는데…'],
['모모','너는 이런 내 모습도 괜찮아?']
],choices:[['“오늘은 웃지 않아도 괜찮아.”',2,'모모는 너의 어깨에 조용히 기대었다.'],['“천천히 들려줄래?”',2,'모모는 처음으로 마음에 담아 둔 이야기를 꺼냈다.'],['“옆에만 있을게.”',1,'따뜻한 침묵이 둘 사이에 머물렀다.']]},
rui:{chapter:5,min:7,choice:4,title:'책장 뒤의 작은 방',place:'책방의 비밀 서재',lines:[
['나레이션','루이가 책장 뒤로 이어지는 문을 열었다. 그곳에는 낡은 책상과 미완성 원고가 있다.'],
['루이','아무도 모르는 곳이야. 이 방에 누군가를 들일 줄 몰랐어.'],
['루이','오늘은 함께 조용히 있어도 될까?']
],choices:[['“말 없이 곁에 앉아 있을게.”',2,'루이는 바로 옆에 의자를 하나 더 놓았다.'],['“이 방을 소중히 지킬게.”',2,'루이가 오래된 책갈피를 네게 건넸다.'],['“함께 책을 읽자.”',1,'두 사람은 나란히 책을 펼쳤다.']]},
sion:{chapter:5,min:7,choice:3,title:'현상하지 않은 필름',place:'옥상 암실',lines:[
['나레이션','붉은 암실 조명 아래 작은 필름통이 있다.'],
['시온','집을 떠나던 날 찍은 사진이야. 아직 한 번도 열어 보지 못했어.'],
['시온','좋은 기억이 아닐 수도 있는데… 같이 봐 줄래?']
],choices:[['“어떤 사진이든 같이 볼게.”',2,'시온은 조금 떨리는 손으로 필름을 꺼냈다.'],['“지금은 어려우면 다음에 봐도 돼.”',2,'시온은 고개를 끄덕였다. 마음을 나눌 시간이 남아 있었다.'],['“네가 결정할 때까지 기다릴게.”',1,'시온은 네 손을 꼭 잡았다.']]},
doha:{chapter:5,min:7,choice:4,title:'우표 없는 편지',place:'우체국 보관실',lines:[
['나레이션','도하가 서랍에서 우표 없는 편지 한 통을 꺼낸다. 받는 사람은 “미래의 나”라고 적혀 있다.'],
['도하','예전에는 어디론가 도망가고 싶었어. 지금의 나한테 어떤 말을 해 줄 수 있을까?'],
['도하','네가 한마디 적어 줘도 될까?']
],choices:[['“네가 선택한 길을 믿어.”',2,'도하는 네가 적은 문장을 오래 바라보았다.'],['“언제든 네가 원하는 곳으로 가도 돼.”',2,'도하는 조심스럽게 편지를 접었다.'],['“함께 찾아보자.”',1,'두 사람은 작은 지도를 그리기 시작했다.']]}
};
function initSpecial(){
if(!Array.isArray(state.secretSeen))state.secretSeen=[];
if(!gallery.cgs||typeof gallery.cgs!=='object')gallery.cgs={};
if(!gallery.secrets||typeof gallery.secrets!=='object')gallery.secrets={};
}
function cgInfo(id){return CGS.find(x=>x.id===id)}
function cgForEvent(id,type,n){return type==='event'?CGS.find(x=>!x.secret&&x.who===id&&x.chapter===n):null}
function secretAvailable(id){
const h=HIDDEN[id],choices=state.choices[id]||[];
return !!(h&&chapter(id)>=h.chapter&&affection(id)>=h.min&&[0,1].includes(choices[h.choice])&&!state.secretSeen.includes(id+'_secret')&&!state.partner);
}
function secretButton(c,done){return secretAvailable(c.id)?'<button class="btn secret-button" onclick="meetSecret(\''+c.id+'\')" '+(done||!state.energy?'disabled':'')+'>✦ 숨겨진 이야기 발견</button>':''}
function meetSecret(id){
if(!secretAvailable(id)){toast('아직 열리지 않은 이야기예요.');return}
if(!state.energy||state.last[id]===state.day){toast('오늘은 더 만날 수 없어요. 다음 날 찾아와 주세요.');return}
const h=HIDDEN[id];
scene={id,type:'secret',secretId:id+'_secret',cgId:id+'_secret',data:{title:h.title,place:h.place,decoration:'✨',lines:h.lines,choices:h.choices}};
step=0;result=null;renderScene();
}
function moodFor(c,line){
const t=line&&line[1]||'',name=line&&line[0],say=name===c.name;
if(/울|슬프|무서|두렵|힘들|겁|실망|떠나|감추|걱정/.test(t))return 'worried';
if(/좋아|사랑|네 옆|손을 잡|두근|함께|고백|기다렸|마음/.test(t))return 'shy';
if(/갑자기|놀라|아, 너|들켰|정말\?/.test(t))return 'surprise';
if(/결심|결정|선택|직접|솔직/.test(t))return 'serious';
if(/웃|행복|신나|기뻐|반가|즐거/.test(t))return 'happy';
return say?'calm':'happy';
}
function emotionPortrait(c,line){
const m=moodFor(c,line),mood=({worried:2,shy:1,surprise:2,serious:0,happy:1,calm:0})[m];
const sign={worried:'···',shy:'♥',surprise:'!',serious:'✦',happy:'✧',calm:''}[m];
return '<div class="emotion emotion-'+m+'">'+portrait({...c,mood:mood})+'<span class="emotion-mark" aria-hidden="true">'+sign+'</span></div>';
}
/* SVG 동네 배경 + 기존 도트 캐릭터 합성으로 구성한 이벤트 일러스트 */
function artBackground(art){
const palette={rain:['#768bad','#d7a4c4','#ffe5ee'],cafe:['#664b67','#cb918a','#ffe1b6'],books:['#595073','#aa87a1','#fae3c7'],sunset:['#e0839a','#e9b184','#ffdda7'],stars:['#243a69','#6f689e','#c9b3d1'],river:['#6486aa','#b7a0c6','#ffd7ba'],letter:['#78638c','#d5a2a8','#ffe9c6']}[art]||['#768bad','#d7a4c4','#ffe5ee'];
const sky='<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop stop-color="'+palette[0]+'"/><stop offset=".60" stop-color="'+palette[1]+'"/><stop offset="1" stop-color="'+palette[2]+'"/></linearGradient></defs><rect width="800" height="430" fill="url(#sky)"/>';
let sceneSvg='';
if(art==='rain'){
sceneSvg='<path d="M0 280l100-48 135 25 100-60 120 39 135-56 210 60v190H0z" fill="#6c7299" opacity=".54"/><path d="M285 175Q420 30 537 145Q641 40 730 180Q628 161 520 180Q414 157 285 175" fill="#ffe2ee" stroke="#ac7597" stroke-width="8"/><path d="M520 183v200q0 26 30 9" stroke="#866c85" stroke-width="9" fill="none"/>'+Array.from({length:25},(_,i)=>'<path d="M'+(i*37)+' '+(i*19%210)+'l-20 26" stroke="#f4f5ff" stroke-width="2" opacity=".8"/>').join('');
}else if(art==='cafe'){
sceneSvg='<rect x="40" y="42" width="280" height="257" fill="#a36c7f" rx="8"/><rect x="65" y="68" width="230" height="198" fill="#f9d4b2" stroke="#ead9cd" stroke-width="14"/><path d="M180 70v198M65 170h230" stroke="#b58c8e" stroke-width="10"/><rect x="110" y="306" width="580" height="28" rx="10" fill="#f4c2ab"/><path d="M245 305v-55h66v55M348 305v-55h66v55" fill="#fff4e4" stroke="#dcb0a0" stroke-width="5"/><path d="M266 228q-14-16 0-30M369 226q-14-16 0-30" fill="none" stroke="#fff8e3" stroke-width="5"/><rect y="355" width="800" height="75" fill="#735267" opacity=".65"/>';
}else if(art==='books'){
sceneSvg=Array.from({length:3},(_,i)=>'<rect x="'+(30+i*252)+'" y="35" width="220" height="304" fill="#74586f" rx="8" stroke="#d6b2a9" stroke-width="8"/>'+
Array.from({length:11},(_,j)=>'<rect x="'+(43+i*252+j*17)+'" y="55" width="14" height="'+(105+j%3*8)+'" fill="'+(['#f0c9a7','#a3b9c0','#d5a9c5'][j%3])+'"/><rect x="'+(43+i*252+j*17)+'" y="209" width="14" height="105" fill="'+(['#d5c3ad','#a6a2c4','#e7acba'][j%3])+'"/>').join('')+'<path d="M30 187h220" stroke="#d6b2a9" stroke-width="8"/>').join('')+'<path d="M0 370h800" stroke="#a98283" stroke-width="42"/><path d="M240 371Q315 330 394 360Q475 327 555 371v25q-78-26-161 8-77-34-154-8z" fill="#fff4e9" stroke="#cfb4aa" stroke-width="6"/>';
}else if(art==='sunset'||art==='stars'){
sceneSvg=Array.from({length:17},(_,i)=>'<rect x="'+(i*52-8)+'" y="'+(248+(i%4)*18)+'" width="'+(42+i%3*7)+'" height="190" fill="#515076" opacity=".55"/>').join('')+'<path d="M0 356h800" stroke="#605575" stroke-width="13"/><path d="M55 430v-75M720 430v-75" stroke="#605575" stroke-width="9"/>';
if(art==='stars')sceneSvg+=Array.from({length:33},(_,i)=>'<circle cx="'+(i*83%795)+'" cy="'+(i*59%226)+'" r="'+(i%3+1.5)+'" fill="#fff9ec"/>').join('');
else sceneSvg+='<circle cx="635" cy="118" r="65" fill="#fff0bb" opacity=".83"/>';
}else if(art==='river'){
sceneSvg='<path d="M0 265Q125 242 265 264T530 264T800 260v170H0" fill="#a5c5d0" opacity=".77"/><path d="M40 255Q380 40 760 255M0 255h800" fill="none" stroke="#776784" stroke-width="11"/>'+
Array.from({length:8},(_,i)=>'<path d="M'+(100+i*85)+' 260v-'+(90+i%3*13)+'" stroke="#776784" stroke-width="7"/>').join('')+
'<circle cx="130" cy="361" r="42" fill="none" stroke="#705c74" stroke-width="8"/><circle cx="285" cy="361" r="42" fill="none" stroke="#705c74" stroke-width="8"/><path d="M130 361l64-80 90 80H130l66-77h38" fill="none" stroke="#705c74" stroke-width="7"/>';
}else if(art==='letter'){
sceneSvg='<path d="M0 330Q180 295 370 329T800 300v130H0z" fill="#99759b" opacity=".65"/><rect x="100" y="96" width="200" height="225" rx="12" fill="#ad6e90" stroke="#f3cdb8" stroke-width="11"/><path d="M100 156l100 80 100-80" fill="none" stroke="#f6ddd0" stroke-width="12"/><rect x="475" y="80" width="250" height="165" rx="8" fill="#fff1e0" stroke="#c28d9b" stroke-width="8"/><path d="M478 83l122 102 122-102" stroke="#e4b4b5" stroke-width="8" fill="none"/><circle cx="690" cy="200" r="18" fill="#d292a9"/>';
}
return '<svg viewBox="0 0 800 430" preserveAspectRatio="xMidYMid slice" aria-hidden="true" role="presentation">'+sky+sceneSvg+'</svg>';
}
function cgArtwork(info,mini){
const c=cast(info.who);
return '<div class="cg-card-art '+(mini?'cg-small':'')+'"><div class="cg-landscape">'+artBackground(info.art)+'<div class="cg-character">'+portrait({...c,mood:1})+'</div><span class="cg-sparkle" aria-hidden="true">♥</span></div><div class="cg-caption"><b>'+esc(info.title)+'</b><small>'+c.name+' · '+(info.secret?'숨겨진 이야기':'데이트 CG')+'</small></div></div>';
}
function scenePicture(c,line){
const info=scene.cgId&&cgInfo(scene.cgId);
if(info&&(result||step>=1))return cgArtwork(info,false);
return '<div class="scenery"><span class="scenery-label">'+esc(scene.data.place)+'</span><span class="scenery-decoration">'+esc(scene.data.decoration)+'</span></div>'+emotionPortrait(c,line);
}
function cgUnlocked(id){return !!gallery.cgs[id]}
function renderSpecialAlbum(){
initSpecial();const done=CGS.filter(x=>cgUnlocked(x.id)).length;
mainShell('<section class="hero"><div><span class="pill">추억 앨범</span><h1>다시 보고 싶은<br>우리의 특별한 장면.</h1><p class="desc">데이트와 비밀 이벤트를 완성하면 일러스트가 모여요. 연애를 새로 시작해도 이 앨범은 남아요.</p><div class="actions"><span class="stat">CG '+done+' / 12</span><span class="stat">엔딩 '+CAST.filter(c=>gallery[c.id]).length+' / 4</span></div></div><div class="hero-art">'+portrait(player())+'</div></section>'+
'<div class="section-header"><h2>특별 데이트 CG</h2><p>캐릭터별 2장</p></div><div class="album cg-grid">'+CGS.filter(x=>!x.secret).map(cgThumb).join('')+'</div>'+
'<div class="section-header"><h2>숨겨진 이야기</h2></div><div class="album cg-grid">'+CGS.filter(x=>x.secret).map(cgThumb).join('')+'</div>'+
'<div class="section-header"><h2>연애 엔딩</h2></div><div class="album">'+CAST.map(c=>'<article class="memory '+(gallery[c.id]?'':'locked')+'"><span class="symbol">'+(gallery[c.id]?'♥':'♡')+'</span><div class="pill">'+c.name+' ROUTE</div><b>'+(gallery[c.id]?c.ending:'아직 쓰이지 않은 이야기')+'</b><p class="sub">'+(gallery[c.id]?c.endingText:'더 친해지면 이야기가 열립니다.')+'</p></article>').join('')+'</div>'+
'<div class="section-header"><h2>다시 시작하기</h2></div><div class="panel"><p class="sub">연애 진행 상황만 새롭게 시작합니다. 생활 모드와 수집한 엔딩·CG는 보관돼요.</p><div class="actions"><button class="btn ghost" onclick="resetRomance()">새로운 연애 시작하기</button></div></div>');
}
function cgThumb(info){
return '<article class="memory cg-thumb '+(cgUnlocked(info.id)?'':'locked')+'">'+
(cgUnlocked(info.id)?'<button class="cg-open" onclick="viewCG(\''+info.id+'\')">'+cgArtwork(info,true)+'<span>장면 다시 보기 ↗</span></button>':'<div class="cg-missing"><span>✦</span><b>아직 발견하지 못한 장면</b><small>'+cast(info.who).name+' · ???</small></div>')+'</article>';
}
function viewCG(id){
const info=cgInfo(id);if(!info||!cgUnlocked(id))return;
page='cg';mainShell('<div class="actions" style="margin:0 0 15px"><button class="btn light" onclick="showPage(\'album\')">← 추억 앨범으로</button></div><div class="cg-preview">'+cgArtwork(info,false)+'</div><p class="sub" style="text-align:center;margin-top:15px">이 장면은 언제든 다시 감상할 수 있어요.</p>');
}
const specialStyle=document.createElement('style');
specialStyle.textContent=[
'.emotion{width:min(365px,65vw);position:relative;z-index:3;transform:translateY(35px)}',
'.emotion>.avatar{width:100%!important;transform:none!important}',
'.emotion-mark{position:absolute;top:7%;right:10%;font-size:clamp(25px,4vw,48px);font-weight:900;color:#ff719b;text-shadow:0 2px 7px #fff8}',
'.emotion-calm .emotion-mark{display:none}',
'.emotion-shy{transform:translateY(35px) rotate(-3deg)}',
'.emotion-shy:after{content:"••";position:absolute;top:45%;left:34%;font-size:29px;letter-spacing:30px;color:#ed7694;opacity:.72}',
'.emotion-worried{filter:saturate(.67)}',
'.emotion-worried .emotion-mark{font-size:24px;color:#7880b3}',
'.emotion-surprise{transform:translateY(35px) scale(1.04)}',
'.emotion-serious{filter:saturate(.8) contrast(1.05)}',
'.cg-card-art{position:relative;width:100%;overflow:hidden;border-radius:18px;background:#f3dde7;box-shadow:0 13px 31px #46365025}',
'.cg-landscape{position:relative;overflow:hidden;aspect-ratio:800/430}',
'.cg-landscape svg{position:absolute;inset:0;width:100%;height:100%}',
'.cg-character{position:absolute;right:10%;bottom:-14%;width:40%;max-width:290px}',
'.cg-character .avatar{width:100%!important;transform:none!important}',
'.cg-sparkle{position:absolute;right:9%;top:8%;font-size:35px;color:#fff5da;text-shadow:0 2px 10px #ffb5df}',
'.cg-caption{position:absolute;left:12px;bottom:12px;color:white;background:#51354b9c;padding:9px 13px;border-radius:12px;text-shadow:0 1px 3px #3336;display:grid;gap:2px}',
'.cg-caption b{font-size:clamp(16px,2.5vw,24px)}',
'.cg-caption small{font-size:12px}',
'.story-scene:has(>.cg-card-art){display:block;padding:0;min-height:0}',
'.story-scene:has(>.cg-card-art):after{display:none}',
'.story-scene>.cg-card-art{border-radius:26px}',
'.cg-grid{grid-template-columns:repeat(2,minmax(0,1fr))}',
'.cg-thumb{padding:10px;min-height:0}',
'.cg-open{padding:0;background:transparent;width:100%;box-shadow:none;text-align:left}',
'.cg-open>span{display:block;text-align:center;color:#a75f83;font-size:12px;margin-top:7px;font-weight:800}',
'.cg-small .cg-caption{padding:5px 8px;bottom:5px;left:5px}',
'.cg-small .cg-caption b{font-size:13px}',
'.cg-small .cg-caption small{font-size:10px}',
'.cg-missing{min-height:140px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:5px;background:#f8f4f8;border:2px dashed #e7dce4;border-radius:14px;text-align:center;padding:12px;color:#938092}',
'.cg-missing>span{font-size:30px}.cg-missing b{font-size:12px}.cg-missing small{font-size:11px}',
'.secret-button{margin-top:7px!important;background:#fff3dc!important;color:#966b47!important;border-color:#edddbb!important}',
'.cg-preview{max-width:960px;margin:auto}',
'@media(max-width:650px){.cg-grid{gap:8px}.cg-thumb{padding:6px}.cg-small .cg-caption small{display:none}.cg-small .cg-caption b{font-size:10px}.cg-small .cg-caption{max-width:70%}.cg-character{right:3%;width:48%}.cg-landscape{aspect-ratio:800/490}.cg-missing{min-height:110px}.story-scene .cg-landscape{min-height:290px}}'
].join('\n');
document.head.appendChild(specialStyle);
initSpecial();
render();
