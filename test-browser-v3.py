from playwright.sync_api import sync_playwright
from pathlib import Path
from urllib.parse import urlparse,parse_qs
import subprocess,time,json,re
base=Path(__file__).parent
server=subprocess.Popen(['python','-m','http.server','8766','--bind','127.0.0.1'],cwd=base,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 time.sleep(0.6)
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
  for width in [320,390,768,1280]:
   context=b.new_context(viewport={'width':width,'height':820},device_scale_factor=1,locale='en-GB',timezone_id='Europe/London')
   page=context.new_page();errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
   def mock(route):
    url=route.request.url
    query=parse_qs(urlparse(url).query)
    method=int(query.get('method',['12'])[0]);shafaq=query.get('shafaq',[''])[0]
    assert method in [12,15,3]
    if method==15: assert shafaq=='ahmer'
    assert query.get('school',[''])[0]=='0'
    date=re.search(r'/timings/(\d\d)-(\d\d)-(\d{4})',url)
    day=int(date[1]);month=int(date[2]);year=int(date[3]);
    raw={k:v for k,v in zip(['Fajr','Sunrise','Dhuhr','Asr','Maghrib','Isha'],['06:20','08:12','12:18','13:58','16:18','17:58'])}
    j={'code':200,'data':{'timings':raw,'meta':{'timezone':'Europe/London','method':{'id':method}}}}
    route.fulfill(status=200,content_type='application/json',body=json.dumps(j),headers={'Access-Control-Allow-Origin':'*'})
   page.route('**/api.aladhan.com/**',mock)
   page.set_content(base.joinpath('index.html').read_text()); page.add_style_tag(path=str(base/'styles.css')); page.add_script_tag(path=str(base/'solar.js')); page.add_script_tag(path=str(base/'providers.js')); page.add_script_tag(path=str(base/'app.js'))
   page.wait_for_timeout(500)
   print('WIDTH',width,'over',page.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth'),'cols',page.locator('#comparisonHead th').count(),'status',page.locator('#comparisonStatus').inner_text()[:100],'errors',errs[:2])
   assert not errs
   assert page.locator('#comparisonHead th').count()==7
   assert page.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth')<=0
   if width==390:
    page.screenshot(path=str(base/'preview-iphone-v3.png'),full_page=True)
    page.locator('button[data-source="moonsighting"]').click();page.wait_for_timeout(500)
    print('MOON',page.locator('#heroMethod').inner_text(),page.locator('#nextPrayerTime').inner_text(),page.locator('#notice').inner_text()[:160]);
    assert 'Moonsighting' in page.locator('#heroMethod').inner_text()
    page.locator('#testSound').click();page.wait_for_timeout(100)
    page.locator('#exportCalendar').click();page.wait_for_timeout(100)
    print('CAL',page.locator('#calendarStatus').inner_text()[:120])
    page.locator('#openSettings').click();page.locator('input[name="method"][value="15-13"]').check();page.locator('#saveSettings').click()
    print('AFTER',page.locator('#comparisonHead').inner_text()[:200]);
    page.screenshot(path=str(base/'preview-iphone-compare-v3.png'),full_page=True)
   context.close()
  b.close()
finally:server.terminate();server.wait()
