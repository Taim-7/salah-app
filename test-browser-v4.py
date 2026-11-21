from playwright.sync_api import sync_playwright
from pathlib import Path
from urllib.parse import urlparse,parse_qs
import subprocess,time,json,re
base=Path(__file__).parent
server=subprocess.Popen(['python','-m','http.server','8776','--bind','127.0.0.1'],cwd=base,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 time.sleep(1)
 with sync_playwright() as pw:
  b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-web-security'])
  for width in [320,375,390,768,1280]:
   context=b.new_context(viewport={'width':width,'height':840},device_scale_factor=1,locale='en-GB',timezone_id='Europe/London',accept_downloads=True)
   page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   def mock(route):
    url=route.request.url
    query=parse_qs(urlparse(url).query)
    method=int(query.get('method',['12'])[0]);shafaq=query.get('shafaq',[''])[0]
    if method==15: assert shafaq=='ahmer'
    assert query.get('school',[''])[0]=='0'
    tim={k:v for k,v in zip(['Fajr','Sunrise','Dhuhr','Asr','Maghrib','Isha'],['06:20','08:12','12:18','13:58','16:18','17:58'])}
    route.fulfill(status=200,content_type='application/json',body=json.dumps({'code':200,'data':{'timings':tim,'meta':{'timezone':'Europe/London','method':{'id':method}}}}),headers={'Access-Control-Allow-Origin':'*'})
   page.route('**/api.aladhan.com/**',mock)
   def serve(route):
    route_path=urlparse(route.request.url).path.lstrip('/') or 'index.html'
    local=base/route_path
    if local.exists() and local.is_file():
     mime='text/html' if route_path.endswith('.html') else 'text/css' if route_path.endswith('.css') else 'text/javascript' if route_path.endswith('.js') else 'application/json'
     route.fulfill(status=200,content_type=mime,body=local.read_bytes())
    else: route.fulfill(status=404,body='missing')
   page.route('https://salah.test/**',serve)
   page.set_content(base.joinpath('index.html').read_text());page.add_style_tag(path=str(base/'styles.css'));
   for name in ['solar.js','providers.js','app.js']:page.add_script_tag(path=str(base/name))
   page.wait_for_timeout(500)
   defaultMethod=page.locator('#heroMethod').inner_text()
   print('default',width, defaultMethod, 'time',page.locator('#nextPrayerTime').inner_text())
   assert '15° / 13°' in defaultMethod
   assert page.locator('input[name="method"][value="12-12"]').count()==1
   assert page.locator('#calendarLead').input_value()=='15'
   assert page.locator('#timetableThird').is_visible() and page.locator('#timetableHalf').is_visible()
   assert page.locator('#avoidList .avoid-row').count()==5
   assert page.locator('.time-value').first.inner_text().lower().endswith(('am','pm'))
   assert page.locator('#soundChoice option[value="adhan"]').count()==1
   for theme in ['light','dark']:
    for accent in ['forest','ocean','sand']:
     page.locator('#accentPicker').select_option(accent)
     if page.locator('body').get_attribute('data-theme')!=theme: page.locator('#themeToggle').click()
     for view in ['classic','compact','timeline']:
      page.locator(f'#viewPicker button[data-view="{view}"]').click()
      page.wait_for_timeout(75)
      overflow=page.evaluate('document.documentElement.scrollWidth-document.documentElement.clientWidth')
      assert overflow<=1,(width,theme,accent,view,'overflow',overflow)
      assert page.locator('body').get_attribute('data-layout')==view
      assert page.locator('body').get_attribute('data-theme')==theme
      assert page.locator('body').get_attribute('data-accent')==accent
   if width==390:
    page.locator('#themeToggle').click() if page.locator('body').get_attribute('data-theme')=='dark' else None
    page.locator('#accentPicker').select_option('forest');page.locator('button[data-view="classic"]').click()
    page.screenshot(path=str(base/'preview-iphone-light.png'),full_page=False)
    page.locator('#themeToggle').click();page.screenshot(path=str(base/'preview-iphone-dark.png'),full_page=False)
    page.locator('button[data-view="compact"]').click();page.screenshot(path=str(base/'preview-iphone-compact.png'),full_page=False)
    page.locator('button[data-view="timeline"]').click();page.screenshot(path=str(base/'preview-iphone-timeline.png'),full_page=False)
    # 24hr toggle & persistence
    page.locator('#openSettings').click()
    page.locator('#settingsTimeFormat').select_option('24');page.locator('#settingsTheme').select_option('light')
    page.locator('#saveSettings').click();page.wait_for_timeout(200)
    assert not page.locator('.time-value').first.inner_text().lower().endswith(('am','pm'))
    assert page.locator('body').get_attribute('data-theme')=='light'
    assert page.locator('#settingsTimeFormat').input_value()=='24'
    page.locator('#openSettings').click();page.locator('#settingsTimeFormat').select_option('12');page.locator('#saveSettings').click()
    # mock calendar download and check trigger/offset
    with page.expect_download() as got:page.locator('#exportCalendar').click()
    download=got.value;path=base/'test-calendar.ics';download.save_as(path)
    raw=path.read_text()
    assert 'TRIGGER:-PT15M' in raw and 'BEGIN:VALARM' in raw
    assert raw.count('BEGIN:VEVENT')>5
    # verify source switching still working
    page.locator('button[data-source="moonsighting"]').click();page.wait_for_timeout(900)
    assert 'Moonsighting' in page.locator('#heroMethod').inner_text()
    page.screenshot(path=str(base/'preview-iphone-compare.png'),full_page=False)
   assert not errors,(width,errors)
   print('PASS',width,'all 18 theme/style/view combos, overflow',page.evaluate('document.documentElement.scrollWidth-document.documentElement.clientWidth'))
   context.close()
  b.close()
finally:server.terminate();server.wait()
