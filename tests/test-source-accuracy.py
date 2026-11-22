from os import environ
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
  b=p.chromium.launch(headless=True,executable_path=environ.get('SALAH_CHROMIUM', '/usr/bin/chromium'),args=['--no-sandbox','--disable-dev-shm-usage'])
  page=b.new_page(viewport={'width':390,'height':844}, timezone_id='Europe/London')
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content((root/'index.html').read_text());page.add_style_tag(path=str(root/'styles.css'))
  page.evaluate("""Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem(k){return k==='salah-config'?JSON.stringify({version4:true,version5:true,version6:true,version7:true,audioDefaultV13:true,method:'15-13',activeSource:'moonsighting',onlineCompare:false,timeZone:'Europe/London',lat:54.9966,lng:-7.3086}):null},setItem(){},removeItem(){}}});Object.defineProperty(navigator,'onLine',{configurable:true,get:()=>false});window.fetch=()=>Promise.reject(new Error('offline'));void 0;""")
  for f in ['region.js','solar.js','providers.js','timetable.js','audio.js','hijri.js','app.js']:page.add_script_tag(path=str(root/f))
  assert 'AlAdhan is unavailable' in page.locator('#notice').inner_text()
  page.locator('[data-screen-target="settings"]').click()
  page.locator('#comparisonPanel > summary').click()
  page.locator('#comparisonBody tr').last.wait_for()
  assert 'Using local times' in page.locator('#comparisonStatus').inner_text()
  assert not errors, errors
  print('PASS: fallback source clearly marked in the comparison')
  b.close()
