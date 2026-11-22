from os import environ
from playwright.sync_api import sync_playwright
from pathlib import Path
from location_fixture import start_with_location
root=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=environ.get('SALAH_CHROMIUM', '/usr/bin/chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 c=b.new_context(viewport={'width':390,'height':844},timezone_id='Europe/London')
 page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content((root/'index.html').read_text());page.add_style_tag(path=str(root/'styles.css'))
 start_with_location(page)
 for f in ['region.js','solar.js','providers.js','timetable.js','audio.js','hijri.js','compass.js','app.js']:page.add_script_tag(path=str(root/f))
 page.locator('#allowPermissions').click()
 page.locator('#prayerDashboard').wait_for()
 page.locator('#nativeDate').fill('2026-07-21')
 page.locator('#nativeDate').dispatch_event('change')
 assert 'First third passed before Isha' in page.locator('#prayerList').inner_text(),page.locator('#prayerList').inner_text()
 assert not errors,errors
 print('PASS: 2026-07-21 first-third marker says Isha begins later, not a preferred time to pray')
 b.close()
