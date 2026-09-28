import { chromium } from 'playwright';

const buildingId = '10000000-0000-4000-8000-000000000001';
const visitId = '20000000-0000-4000-8000-000000000002';
const origin = 'https://noonoo-prog.github.io/0610/';
const building = { id: buildingId, name: '모바일 시범 점검 건축물', address: '서울특별시 중구 퇴계로 264', use_type: '근린생활시설', approved_on: '1995-01-01' };
const visit = { id: visitId, building_id: buildingId, inspection_on: '2026-09-28', inspector: '', remarks: '' };
const mock = {
  status: { configured: true }, me: { name: '현장 직원', role: 'staff' },
  buildings: { buildings: [building] },
  visits: { visits: [visit] },
  visit: { building, visit, items: [], photos: [], maintenance: [], quick: [], photo_checks: [], care_schedules: [] }
};
const browser = await chromium.launch({ headless: true });
try {
 for (const width of [320, 390, 430]) {
  const page = await browser.newPage({ viewport: { width, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.addInitScript(() => sessionStorage.setItem('sangeoInspectionToken', 'sg_mock_for_layout'));
  const mockPhotoId1 = '30000000-0000-4000-8000-000000000003';
  const mockPhotoId2 = '30000000-0000-4000-8000-000000000004';
  const photos = width === 390 ? [mockPhotoId1,mockPhotoId2].map((id,i)=>({id,item_key:'inbox',url:'data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=',caption:'',original_name:'현장'+(i+1)+'.jpg',created_at:'2026-09-28T03:00:0'+i+'Z'})) : [];
  const shotChecks = [], quickChecks = [], careSchedules = [], savedItems = [];
  await page.route('**/functions/v1/sangeo-inspection*', async route => {
   const op = new URL(route.request().url()).searchParams.get('op');
   if(op==='photo-check'){
    const body=route.request().postDataJSON();
    if(body.check_key!=='p_site_landscape'||body.checked!==true||body.visit_id!==visitId)throw Error('Photo shot payload invalid');
    const row={check_key:body.check_key,checked:body.checked,updated_at:'2026-09-28T04:00:00Z',updated_by:'직원'};
    shotChecks.push(row);
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({photo_check:row})});
   }
   if(op==='quick'){
    const body=route.request().postDataJSON();
    if(body.item_key!=='3.1.1'||typeof body.checked!=='boolean'||body.visit_id!==visitId)throw Error('Linked quick payload invalid');
    const row={item_key:body.item_key,checked:body.checked,updated_at:'2026-09-28T04:01:00Z',updated_by:'공용 사용자'};
    quickChecks.splice(0,quickChecks.length,row);
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({quick:row})});
   }
   if(op==='care-schedule'){
    const body=route.request().postDataJSON();
    if(body.task_key!=='m_site_leaves'||body.frequency!=='monthly'||body.last_done_on!=='2026-09-01'||body.building_id!==buildingId)throw Error('Care schedule payload invalid');
    const row={task_key:body.task_key,frequency:body.frequency,last_done_on:body.last_done_on,note:body.note||'',updated_at:'2026-09-28T04:00:00Z',updated_by:'직원'};
    careSchedules.push(row);
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({care_schedule:row})});
   }
   if(op==='item'){
    const b=route.request().postDataJSON();
    if(b.item_key!=='3.2.1'||b.visit_id!==visitId||b.management?.cycle>600)throw Error('Invalid inspection period update');
    const row={item_key:b.item_key,result:b.result||null,note:b.note||'',management:b.management,
      updated_at:'2026-09-28T04:17:'+String(savedItems.length+1).padStart(2,'0')+'Z',updated_by:'공용 사용자'};
    const i=savedItems.findIndex(x=>x.item_key===row.item_key);
    if(i>=0)savedItems[i]=row;else savedItems.push(row);
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({item:row})});
   }
   if(op==='photo-category'){
    const body=route.request().postDataJSON();
    if(body.item_key!=='3.1.1'||body.moves.length!==2||body.moves.some(p=>p.from!=='inbox')) throw Error('Incorrect bulk assignment request');
    const changed=body.moves.map(p=>({id:p.id,item_key:body.item_key}));
    for(const photo of photos)if(changed.some(p=>p.id===photo.id))photo.item_key=body.item_key;
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({photos:changed})});
   }
   const value=op==='visit'?{...mock.visit,items:savedItems,photos,quick:quickChecks,photo_checks:shotChecks,care_schedules:careSchedules}:mock[op]??{ok:true};
   await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(value) });
  });
  await page.goto(origin + '?building=' + buildingId + '&visit=' + visitId, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.locator('#inspect:not(.hidden)').waitFor({ timeout: 15000 });
  const sizes = await page.evaluate(() => ({
   viewport: innerWidth,
   document: document.documentElement.scrollWidth,
   header: Math.round(document.querySelector('header').getBoundingClientRect().height),
   dock: Math.round(document.querySelector('.mobile-dock').getBoundingClientRect().height),
   textSize: parseFloat(getComputedStyle(document.getElementById('nt-3.1.1')).fontSize),
   buttonHeight: Math.min(...[...document.querySelectorAll('[id="card-3.1.1"] .st button')].map(b => Math.round(b.getBoundingClientRect().height))),
   groupCount: document.querySelectorAll('.inspection-group').length,
   openGroups: document.querySelectorAll('.inspection-group[open]').length,
   menuCount: document.querySelectorAll('.mobile-more-menu button').length,
   dockVisible: getComputedStyle(document.querySelector('.mobile-dock')).display !== 'none'
  }));
  if (sizes.document > width + 1) throw Error('Horizontal overflow at ' + width + 'px: ' + JSON.stringify(sizes));
  if (sizes.header > 88 || sizes.dock > 105) throw Error('Header or dock too tall: ' + JSON.stringify(sizes));
  if (sizes.textSize < 16 || sizes.buttonHeight < 44) throw Error('Form or rating target too small: ' + JSON.stringify(sizes));
  if (!sizes.dockVisible || sizes.groupCount !== 5 || sizes.openGroups !== 1 || sizes.menuCount !== 9) throw Error('Mobile navigation/groups missing: ' + JSON.stringify(sizes));
  if (!(await page.locator('#who').textContent()).includes('공용 점검 계정')) throw Error('Unified account label missing');
  if (await page.locator('#manageBtn').evaluate(el=>el.classList.contains('hidden'))) throw Error('Shared password settings not accessible');
  await page.locator('#mobileActions > summary').click();
  const menu = await page.locator('.mobile-more-menu').boundingBox();
  if (!menu || menu.x < -1 || menu.x + menu.width > width + 1) throw Error('More menu overflows viewport: ' + JSON.stringify(menu));
  await page.getByRole('button', { name: '촬영 체크', exact: true }).click();
  if ((await page.locator('.location-place').count()) !== 7) throw Error('Place groups missing');
  if ((await page.locator('.location-check').count()) !== 32) throw Error('Photo shot list not complete');
  if (width === 390) {
   await page.locator('input[data-check-key="p_site_landscape"]').check();
   await page.waitForFunction(() => document.getElementById('locPhotoTotal')?.textContent?.startsWith('1 / 32'));
   await page.waitForFunction(() => [...document.querySelectorAll('.quick-photo-link')].some(el => el.dataset.quickKey === '3.1.1' && el.textContent.trim() === '촬영 1/1'));
   await page.locator('[data-shot-row="p_site_landscape"] .linked-quick').click();
   await page.waitForFunction(() => document.querySelector('[data-shot-row="p_site_landscape"] .linked-quick')?.getAttribute('aria-pressed') === 'true');
   if (!(await page.locator('input[data-key="3.1.1"]').isChecked())) throw Error('Place check did not link to quick inspection');
   if (!(await page.locator('[id="card-3.1.1"] .status-pill').textContent()).includes('미평가')) throw Error('Photo check incorrectly changed formal rating');
   await page.locator('input[data-key="3.1.1"]').uncheck();
   await page.waitForFunction(() => document.querySelector('[data-shot-row="p_site_landscape"] .linked-quick')?.getAttribute('aria-pressed') === 'false');
   await page.locator('.quick-photo-link[data-quick-key="3.1.1"]').click();
   if (!(await page.locator('[data-shot-row="p_site_landscape"]').isVisible())) throw Error('Quick inspection cannot navigate to linked photo');
  }
  await page.getByRole('button', { name: '청소 주기', exact: true }).click();
  if ((await page.locator('.care-task').count()) !== 15) throw Error('Building care list not complete');
  if (width === 390) {
   await page.locator('#careFrequency-m_site_leaves').selectOption('monthly');
   await page.locator('#careLast-m_site_leaves').fill('2026-09-01');
   await page.locator('#careTask-m_site_leaves .care-actions .pri').click();
   await page.waitForFunction(() => document.querySelector('#careTask-m_site_leaves .care-next')?.textContent?.includes('2026-10-01'));
   if (!(await page.locator('#careTotal').textContent()).includes('1 / 15')) throw Error('Saved cycle not reflected');
  }
  await page.locator('#mobileActions > summary').click();
  await page.getByRole('button', { name: /사진 업로드·정리/ }).click();
  if (!(await page.locator('#fieldDetails').evaluate(el => el.open))) throw Error('Photo inbox jump failed');
  if (width === 390) {
   if (!(await page.locator('#fieldCount').textContent()).includes('미분류 2장')) throw Error('Unsorted photos missing');
   await page.getByRole('button', { name: '전체 선택', exact: true }).click();
   await page.locator('#fieldTarget').selectOption('3.1.1');
   await page.getByRole('button', { name: '선택 사진 항목 지정', exact: true }).click();
   await page.waitForFunction(() => document.getElementById('fieldCount')?.textContent === '미분류 0장', null, { timeout: 8000 });
   if ((await page.locator('[id="card-3.1.1"] .thumb').count()) !== 2) throw Error('Assigned photos not moved to landscaping');
   await page.locator('#fieldFilter').selectOption('all');
   if ((await page.locator('#fieldGrid .field-tile').count()) !== 2) throw Error('All photos view missing reclassified items');
  }
  await page.locator('#mobileActions > summary').click();
  await page.getByRole('button', { name: '간편 체크리스트', exact: true }).click();
  if (!(await page.locator('#quickChecklist').evaluate(el => el.open))) throw Error('Checklist jump failed');
  await page.locator('details.quick-group[data-group="3.5"] > summary').click();
  await page.locator('.quick-detail[data-key="3.5.4"]').click();
  if (!(await page.locator('[data-inspection-group="3.5"]').evaluate(el => el.open))) throw Error('Checklist failed to open detailed group');
  await page.locator('#mobileActions > summary').click();
  await page.getByRole('button', { name: '점검주기·교체시기', exact: true }).click();
  if (!(await page.locator('#cycleChecklist').evaluate(el => el.open))) throw Error('Period checklist failed to open');
  if ((await page.locator('#cycleRows .cycle-row').count()) !== 9) throw Error('Expected exactly nine manual period items');
  if (width === 390) {
    await page.locator('[id="pcAction-3.2.1"]').selectOption('점검');
    await page.locator('[id="pcMonths-3.2.1"]').fill('6');
    await page.locator('[id="pcRow-3.2.1"] .cycle-buttons .pri').click();
    await page.waitForFunction(() => document.getElementById('cycleCount')?.textContent?.includes('1 / 9'));
    if ((await page.locator('[id="cy-3.2.1"]').inputValue())!=='6') throw Error('Period did not reach the detailed inspection form');
    if ((await page.locator('[id="card-3.2.1"] .status-pill').textContent()).trim()!=='미평가') throw Error('Period input incorrectly completed the formal rating');
    await page.locator('[data-inspection-group="3.2"] > summary').click();
    await page.locator('[id="cy-3.2.1"]').fill('12');
    await page.locator('[id="card-3.2.1"] .card-actions .pri').click();
    await page.waitForFunction(() => document.getElementById('pcMonths-3.2.1')?.value==='12');
    if ((await page.locator('#cycleCount').textContent()).includes('2 / 9')) throw Error('Unexpected completed-period count');
  }
  if (width === 390) await page.screenshot({ path: '/tmp/sangeo-mobile-390.png', fullPage: false });
  console.log('PASS MOBILE ' + width + 'px ' + JSON.stringify(sizes));
  await page.close();
 }
 const desktop = await browser.newPage({ viewport: { width: 1024, height: 800 } });
 await desktop.addInitScript(() => sessionStorage.setItem('sangeoInspectionToken', 'sg_mock_for_layout'));
 await desktop.route('**/functions/v1/sangeo-inspection*', async route => {
  const op = new URL(route.request().url()).searchParams.get('op');
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mock[op] ?? { ok: true }) });
 });
 await desktop.goto(origin + '?building=' + buildingId + '&visit=' + visitId, { waitUntil: 'domcontentloaded', timeout: 30000 });
 await desktop.locator('#inspect:not(.hidden)').waitFor({ timeout: 15000 });
 const desktopGroups = await desktop.locator('.inspection-group[open]').count();
 const desktopDock = await desktop.locator('.mobile-dock').evaluate(el => getComputedStyle(el).display);
 if (desktopGroups !== 5 || desktopDock !== 'none') throw Error('Desktop layout regressed: ' + JSON.stringify({ desktopGroups, desktopDock }));
 console.log('PASS DESKTOP 1024px all groups visible, mobile dock hidden');
 await desktop.close();
} finally {
 await browser.close();
}
