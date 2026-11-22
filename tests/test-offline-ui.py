from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 cases=0
 for width in [320,375,390,430,768,1024]:
  context=b.new_context(viewport={'width':width,'height':844},timezone_id='Europe/London',is_mobile=width<768,has_touch=width<768)
  page=context.new_page();errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
  page.set_content((root/'index.html').read_text(),wait_until='domcontentloaded')
  page.add_style_tag(path=str(root/'styles.css'))
  page.evaluate('''() => {Object.defineProperty(navigator,'onLine',{configurable:true,get:()=>false});window.fetch=()=>{throw Error('Offline fetch was attempted')};}''')
  for f in ['region.js','solar.js','providers.js','app.js']:page.add_script_tag(path=str(root/f))
  assert page.locator('#heroMethod').inner_text().startswith('15° / 13°')
  assert page.locator('#prayerList .prayer-entry').count()==6,(width,page.locator('#prayerList .prayer-entry').count())
  assert page.locator('#offlineIndicator').is_visible()
  assert page.locator('#settingsTheme').count()==0
  assert page.locator('body').get_attribute('data-theme')=='dark'
  for tab in ['compare','qibla','sounds','settings','today']:
   page.locator(f'[data-screen-target="{tab}"]').click()
   assert page.evaluate('document.documentElement.scrollWidth-document.documentElement.clientWidth')<3,(width,tab)
  page.locator('[data-screen-target="sounds"]').click()
  assert page.locator('#soundChoice option').count()>=7
  assert page.locator('#saveOfflineAdhans').count()==0
  assert page.locator('#armSound').count()==0
  assert page.locator('#offlineAdhanStatus').count()==0
  assert page.locator('#hijriDate').inner_text() == 'Prayer times'
  if width==390:
   page.locator('[data-screen-target="today"]').click()
   page.screenshot(path=str(root/'preview-dark-v17.png'),full_page=True)
   page.locator('[data-screen-target="sounds"]').click()
   page.screenshot(path=str(root/'preview-sounds-v17.png'),full_page=True)
  assert not errors,(width,errors)
  cases+=1;context.close()
 print('PASS',cases,'offline simulated UI widths: local prayer list, 5 tabs, no light mode, sound controls, no overflow, no JS exceptions')
 b.close()
