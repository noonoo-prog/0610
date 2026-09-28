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
  visit: { building, visit, items: [], photos: [], maintenance: [], quick: [] }
};
const browser = await chromium.launch({ headless: true });
try {
 for (const width of [320, 390, 430]) {
  const page = await browser.newPage({ viewport: { width, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.addInitScript(() => sessionStorage.setItem('sangeoInspectionToken', 'sg_mock_for_layout'));
  const mockPhotoId1 = '30000000-0000-4000-8000-000000000003';
  const mockPhotoId2 = '30000000-0000-4000-8000-000000000004';
  const photos = width === 390 ? [mockPhotoId1,mockPhotoId2].map((id,i)=>({id,item_key:'inbox',url:'data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=',caption:'',original_name:'현장'+(i+1)+'.jpg',created_at:'2026-09-28T03:00:0'+i+'Z'})) : [];
  await page.route('**/functions/v1/sangeo-inspection*', async route => {
   const op = new URL(route.request().url()).searchParams.get('op');
   if(op==='photo-category'){
    const body=route.request().postDataJSON();
    if(body.item_key!=='3.1.1'||body.moves.length!==2||body.moves.some(p=>p.from!=='inbox')) throw Error('Incorrect bulk assignment request');
    const changed=body.moves.map(p=>({id:p.id,item_key:body.item_key}));
    for(const photo of photos)if(changed.some(p=>p.id===photo.id))photo.item_key=body.item_key;
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({photos:changed})});
   }
   const value=op==='visit'?{...mock.visit,photos}:mock[op]??{ok:true};
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
  if (!sizes.dockVisible || sizes.groupCount !== 5 || sizes.openGroups !== 1 || sizes.menuCount !== 7) throw Error('Mobile navigation/groups missing: ' + JSON.stringify(sizes));
  await page.locator('#mobileActions > summary').click();
  const menu = await page.locator('.mobile-more-menu').boundingBox();
  if (!menu || menu.x < -1 || menu.x + menu.width > width + 1) throw Error('More menu overflows viewport: ' + JSON.stringify(menu));
  await page.locator('#mobileActions > summary').click();
  await page.getByRole('button', { name: /사진 정리/ }).click();
  if (!(await page.locator('#fieldDetails').evaluate(el => el.open))) throw Error('Photo inbox jump failed');
  if (width === 390) {
   if (!(await page.locator('#fieldCount').textContent()).includes('미분류 2장')) throw Error('Unsorted photos missing');
   await page.getByRole('button', { name: '전체 선택', exact: true }).click();
   await page.locator('#fieldTarget').selectOption('3.1.1');
   await page.getByRole('button', { name: '선택 사진 항목 지정', exact: true }).click();
   if ((await page.locator('#fieldCount').textContent()) !== '미분류 0장') throw Error('Assigned photos still unclassified');
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
