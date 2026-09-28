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
  await page.route('**/functions/v1/sangeo-inspection*', async route => {
   const op = new URL(route.request().url()).searchParams.get('op');
   await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mock[op] ?? { ok: true }) });
  });
  await page.goto(origin + '?building=' + buildingId + '&visit=' + visitId, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.locator('#inspect:not(.hidden)').waitFor({ timeout: 15000 });
  const sizes = await page.evaluate(() => ({
   viewport: innerWidth,
   document: document.documentElement.scrollWidth,
   header: Math.round(document.querySelector('header').getBoundingClientRect().height),
   dock: Math.round(document.querySelector('.mobile-dock').getBoundingClientRect().height),
   textSize: parseFloat(getComputedStyle(document.querySelector('#nt-3.1.1')).fontSize),
   buttonHeight: Math.min(...[...document.querySelectorAll('#card-3.1.1 .st button')].map(b => Math.round(b.getBoundingClientRect().height))),
   groupCount: document.querySelectorAll('.inspection-group').length,
   openGroups: document.querySelectorAll('.inspection-group[open]').length,
   menuCount: document.querySelectorAll('.mobile-more-menu button').length,
   dockVisible: getComputedStyle(document.querySelector('.mobile-dock')).display !== 'none'
  }));
  if (sizes.document > width + 1) throw Error('Horizontal overflow at ' + width + 'px: ' + JSON.stringify(sizes));
  if (sizes.header > 88 || sizes.dock > 105) throw Error('Header or dock too tall: ' + JSON.stringify(sizes));
  if (sizes.textSize < 16 || sizes.buttonHeight < 44) throw Error('Form or rating target too small: ' + JSON.stringify(sizes));
  if (!sizes.dockVisible || sizes.groupCount !== 5 || sizes.openGroups !== 1 || sizes.menuCount !== 5) throw Error('Mobile navigation/groups missing: ' + JSON.stringify(sizes));
  await page.locator('#mobileActions > summary').click();
  const menu = await page.locator('.mobile-more-menu').boundingBox();
  if (!menu || menu.x < -1 || menu.x + menu.width > width + 1) throw Error('More menu overflows viewport: ' + JSON.stringify(menu));
  await page.locator('#mobileActions > summary').click();
  await page.getByRole('button', { name: '체크리스트', exact: true }).click();
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
