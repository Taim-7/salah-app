from os import environ
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path=environ.get('SALAH_CHROMIUM', '/usr/bin/chromium'),args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':390,'height':844},timezone_id='Europe/London')
 page.set_content((root/'index.html').read_text());page.add_style_tag(path=str(root/'styles.css'))
 page.evaluate("""window.saved={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem(k){return window.saved[k]||null},setItem(k,v){window.saved[k]=v},removeItem(k){delete window.saved[k]}}});Object.defineProperty(navigator,'onLine',{configurable:true,get:()=>false});""")
 for f in ['region.js','solar.js','providers.js','timetable.js','audio.js','hijri.js','app.js']:page.add_script_tag(path=str(root/f))
 page.locator('[data-screen-target="sounds"]').click()
 page.locator('#soundChoice').select_option('soft')
 page.locator('[data-screen-target="settings"]').click()
 page.locator('#saveSettings').click()
 stored=page.evaluate("JSON.parse(window.saved['salah-config'])")
 assert stored['soundChoice']=='soft'
 assert stored['audioDefaultV13'] is True
 # reload scripts against existing saved configuration in a fresh document context
 page.set_content((root/'index.html').read_text());page.add_style_tag(path=str(root/'styles.css'))
 for f in ['region.js','solar.js','providers.js','timetable.js','audio.js','hijri.js','app.js']:page.add_script_tag(path=str(root/f))
 assert page.locator('#soundChoice').input_value()=='soft'
 print('PASS: selected chime survives saving Settings and reloading app')
 browser.close()
