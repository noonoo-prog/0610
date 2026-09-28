import { chromium } from 'playwright';

const origin='https://noonoo-prog.github.io/0610/';
const buildingId='10000000-0000-4000-8000-000000000001';
const visitId='20000000-0000-4000-8000-000000000002';
const building={id:buildingId,name:'모바일 시험 건축물',address:'서울특별시 중구 퇴계로 264',use_type:'근린생활시설'};
const visit={id:visitId,building_id:buildingId,inspection_on:'2026-09-28',inspector:'공용 사용자',remarks:''};
const base={building,visit,photos:[],items:[],quick:[],photo_checks:[],care_schedules:[],maintenance:[]};
const browser=await chromium.launch({headless:true});

function assert(check,message,context){if(!check)throw Error(message+(context?' · '+JSON.stringify(context):''));}
async function setup(page,width){
 const state={trashed:false,photos:width===390?[3,4].map((n)=>({
  id:'30000000-0000-4000-8000-00000000000'+n,
  item_key:'inbox',url:'data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=',
  original_name:'사진'+n+'.jpg',caption:'',created_at:'2026-09-28T03:00:0'+n+'Z'
 })):[],shots:[],quick:[],care:[],items:[],requests:[]};
 await page.addInitScript(()=>sessionStorage.setItem('sangeoInspectionToken','sg_browser_test'));
 page.on('dialog',async d=>{
  if(d.type()==='prompt')await d.accept('2026-09-28');
  else await d.accept();
 });
 await page.route('**/functions/v1/sangeo-inspection*',async route=>{
  const u=new URL(route.request().url()),op=u.searchParams.get('op'),method=route.request().method();
  let reply={ok:true},status=200;
  const payload=['POST','PUT','PATCH'].includes(method)?route.request().postDataJSON():null;
  if(op==='status')reply={configured:true};
  else if(op==='me')reply={name:'공용 사용자',role:'staff'};
  else if(op==='buildings')reply={buildings:[building]};
  else if(op==='visits')reply={visits:u.searchParams.get('trashed')==='1'
    ?(state.trashed?[{...visit,deleted_at:'2026-09-28T04:00:00Z'}]:[])
    :state.trashed?[]:[visit]};
  else if(op==='visit')reply={...base,items:state.items,photos:state.photos,quick:state.quick,
    photo_checks:state.shots,care_schedules:state.care};
  else if(op==='visit-trash'){
   assert(payload?.visit_id===visitId&&payload.building_id===buildingId&&payload.inspection_on===visit.inspection_on,
    'Trash request targets wrong visit',payload);
   assert(['trash','restore'].includes(payload.action),'Bad trash action');
   state.trashed=payload.action==='trash';
   reply={visit:{id:visitId,inspection_on:visit.inspection_on,deleted_at:state.trashed?'2026-09-28T04:00:00Z':null},action:payload.action};
  }else if(op==='photo-check'){
   assert(payload.check_key==='p_site_landscape','Incorrect photo check',payload);
   const row={check_key:payload.check_key,checked:payload.checked,updated_at:'2026-09-28T04:00:00Z'};
   state.shots=[row];reply={photo_check:row};
  }else if(op==='quick'){
   assert(payload.item_key==='3.1.1','Incorrect linked quick check',payload);
   const row={item_key:payload.item_key,checked:payload.checked,updated_at:'2026-09-28T04:01:00Z'};
   state.quick=[row];reply={quick:row};
  }else if(op==='care-schedule'){
   assert(payload.task_key==='m_site_leaves'&&payload.frequency==='monthly','Incorrect care schedule',payload);
   const row={...payload,updated_at:'2026-09-28T04:03:00Z'};
   state.care=[row];reply={care_schedule:row};
  }else if(op==='item'){
   assert(payload.item_key==='3.2.1'&&Number(payload.management.cycle)<=600,
    'Invalid period payload',payload);
   const row={item_key:payload.item_key,result:payload.result??null,note:payload.note??'',
    management:payload.management,updated_at:'2026-09-28T04:17:00Z',updated_by:'공용 사용자'};
   state.items=[row];reply={item:row};
  }else if(op==='photo-category'){
   assert(payload.item_key==='3.1.1'&&payload.moves.length===2,'Incorrect bulk photo assignment',payload);
   const changed=payload.moves.map(x=>({id:x.id,item_key:payload.item_key}));
   for(const p of state.photos)if(changed.some(c=>c.id===p.id))p.item_key=payload.item_key;
   reply={photos:changed};
  }
  state.requests.push({op,method});
  await route.fulfill({status,contentType:'application/json',body:JSON.stringify(reply)});
 });
 await page.goto(origin+'?building='+buildingId+'&visit='+visitId,{waitUntil:'domcontentloaded',timeout:30000});
 await page.locator('#inspect:not(.hidden)').waitFor({timeout:12000});
 return state;
}
try{
 for(const width of [320,390,430]){
  const page=await browser.newPage({viewport:{width,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const state=await setup(page,width);
  const layout=await page.evaluate(()=>({
   inner:innerWidth,overflow:document.documentElement.scrollWidth,
   header:Math.round(document.querySelector('header').getBoundingClientRect().height),
   bottom:Math.round(document.querySelector('.workspace-bottom').getBoundingClientRect().height),
   bottomVisible:getComputedStyle(document.querySelector('.workspace-bottom')).display!=='none',
   tabs:document.querySelectorAll('#inspectTabs button').length,
   panes:document.querySelectorAll('#inspect .workspace-pane').length
  }));
  assert(layout.overflow<=width+1,'Mobile horizontal overflow at '+width,layout);
  assert(layout.header<=90&&layout.bottom<=110,'Mobile header/footer too tall',layout);
  assert(layout.bottomVisible&&layout.tabs===4&&layout.panes===4,'Expected four mobile workspaces',layout);
  assert((await page.locator('#who').textContent()).includes('공용 점검 계정'),'Unified login missing');
  assert((await page.locator('#wsPane-onsite').isVisible())&&!await page.locator('#wsPane-evaluation').isVisible(),
    'On-site should be the only visible initial page');
  await page.getByRole('button',{name:'현장',exact:true}).click();
  assert((await page.locator('.location-check').count())===32,'Place photo check items missing');
  if(width===390){
   await page.locator('input[data-check-key="p_site_landscape"]').check();
   await page.waitForFunction(()=>document.getElementById('locPhotoTotal')?.textContent.startsWith('1 / 32'));
   await page.locator('[data-shot-row="p_site_landscape"] .linked-quick').click();
   await page.waitForFunction(()=>document.querySelector('[data-shot-row="p_site_landscape"] .linked-quick')?.getAttribute('aria-pressed')==='true');
   assert(await page.locator('input[data-key="3.1.1"]').isChecked(),'Place and quick link broken');
  }
  await page.getByRole('button',{name:'관리',exact:true}).click();
  assert(await page.locator('#wsPane-care').isVisible(),'Management page hidden');
  assert(!await page.locator('#wsPane-onsite').isVisible(),'On-site page still visible');
  assert((await page.locator('.care-task').count())===15,'Cleaning checklist should contain 15 tasks');
  assert((await page.locator('#cycleRows .cycle-row').count())===9,'Manual cycles should contain nine items');
  if(width===390){
   await page.locator('#careFrequency-m_site_leaves').selectOption('monthly');
   await page.locator('#careLast-m_site_leaves').fill('2026-09-01');
   await page.locator('#careTask-m_site_leaves .care-actions .pri').click();
   await page.waitForFunction(()=>document.querySelector('#careTask-m_site_leaves .care-next')?.textContent.includes('2026-10-01'));
   await page.locator('[id="pcAction-3.2.1"]').selectOption('점검');
   await page.locator('[id="pcMonths-3.2.1"]').fill('6');
   await page.locator('[id="pcRow-3.2.1"] .cycle-buttons .pri').click();
   await page.waitForFunction(()=>document.getElementById('cycleCount')?.textContent.includes('1 / 9'));
  }
  await page.getByRole('button',{name:'사진',exact:true}).click();
  assert(await page.locator('#wsPane-photos').isVisible(),'Photo page hidden');
  assert((await page.locator('.photo-export-buttons button').count())===2,'Photo exports unavailable');
  if(width===390){
   await page.locator('#fieldDetails > summary').click();
   await page.getByRole('button',{name:'전체 선택',exact:true}).click();
   await page.locator('#fieldTarget').selectOption('3.1.1');
   await page.getByRole('button',{name:'선택 사진 항목 지정',exact:true}).click();
   await page.waitForFunction(()=>document.getElementById('fieldCount')?.textContent==='미분류 0장');
   assert(state.photos.every(p=>p.item_key==='3.1.1'),'Photo data not reclassified');
  }
  await page.getByRole('button',{name:'평가',exact:true}).click();
  assert(await page.locator('#wsPane-evaluation').isVisible(),'Detailed evaluation page hidden');
  assert(!await page.locator('#wsPane-photos').isVisible(),'Duplicate photo page visible');
  const rating=await page.locator('[id="card-3.1.1"] .st button').first().boundingBox();
  assert(rating?.height>=44,'Mobile evaluation target too small');
  assert((await page.locator('.inspection-group').count())===5,'Five formal sections missing');
  if(width===390){
   await page.locator('[data-inspection-group="3.2"] > summary').click();
   assert((await page.locator('[id="cy-3.2.1"]').inputValue())==='6','Period failed to synchronize into full form');
   assert((await page.locator('[id="card-3.2.1"] .status-pill').textContent()).includes('미평가'),'Cycle incorrectly rated as good');
   await page.locator('[id="cy-3.2.1"]').fill('12');
   await page.locator('[id="card-3.2.1"] .card-actions .pri').click();
   await page.waitForFunction(()=>document.getElementById('pcMonths-3.2.1')?.value==='12');
   await page.locator('[id="pcRow-3.2.1"] .cycle-buttons .ghost').click();
   assert(await page.locator('#wsPane-evaluation').isVisible(),'Cycle -> detail tab navigation broken');
   await page.getByRole('button',{name:'현장',exact:true}).click();
   await page.locator('.quick-detail[data-key="3.5.4"]').click();
   assert(await page.locator('#wsPane-evaluation').isVisible(),'Quick -> detail tab navigation broken');
  }
  await page.locator('#inspect .inspect-heading button').first().click();
  await page.locator('#visits:not(.hidden)').waitFor();
  const visitCard=page.locator('#vl .visit-card');
  assert(await visitCard.count()===1,'Active visit missing from timeline');
  if(width===390){
   await visitCard.locator('.visit-trash-button').click();
   await page.waitForFunction(()=>document.getElementById('trashCount')?.textContent==='1건');
   assert(state.trashed,'Trash operation was not called');
   assert(state.photos.length===2&&state.items.length===1,'Trash destroyed photo/inspection data');
   await page.locator('#visitTrash > summary').click().catch(()=>{});
   await page.locator('#trashList button').click();
   await page.waitForFunction(()=>document.getElementById('trashCount')?.textContent==='0건');
   assert(!state.trashed,'Restore operation was not called');
   assert((await page.locator('#vl .visit-card').count())===1,'Restored visit missing');
   assert(state.requests.filter(x=>x.op==='visit-trash').length===2,'Expected trash and restore API requests');
  }
  if(width===390)await page.screenshot({path:'/tmp/sangeo-mobile-390.png',fullPage:false});
  console.log('PASS MOBILE '+width+'px '+JSON.stringify(layout));
  await page.close();
 }
 const desktop=await browser.newPage({viewport:{width:1024,height:800}});
 await setup(desktop,1024);
 assert(await desktop.locator('.workspace-tabs').isVisible(),'Desktop tabs missing');
 assert(!await desktop.locator('.workspace-bottom').isVisible(),'Mobile bar leaked to desktop');
 await desktop.locator('#wsTab-evaluation').click();
 assert(await desktop.locator('#wsPane-evaluation').isVisible(),'Desktop evaluation missing');
 console.log('PASS DESKTOP 1024px tab isolation and formal evaluation');
 await desktop.close();
}finally{await browser.close();}
