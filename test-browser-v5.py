from playwright.sync_api import sync_playwright
from pathlib import Path
import json
base=Path(__file__).parent
with sync_playwright() as pw:
  b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
  for width in [320,375,390,430,768,1280]:
   context=b.new_context(viewport={'width':width,'height':900},device_scale_factor=1,locale='en-GB',timezone_id='Europe/London',accept_downloads=True,is_mobile=width<768,has_touch=width<768)
   # no real GPS origin in static browser preview
   context.set_geolocation({'latitude':54.9966,'longitude':-7.3086,'accuracy':10})
   page=context.new_page();errors=[]
   page.on('pageerror', lambda err: errors.append(str(err)))
   
   page.set_content((base/'index.html').read_text(),wait_until='domcontentloaded')
   page.add_style_tag(path=str(base/'styles.css'))
   for name in ['solar.js','providers.js','app.js']:
    page.add_script_tag(path=str(base/name))
   page.wait_for_timeout(650)
   print('LOADED',width,'theme',page.locator('body').get_attribute('data-theme'), 'method',page.locator('#heroMethod').inner_text(), 'qibla',page.locator('#qiblaBearing').inner_text(),'entries',page.locator('#prayerList .time-row').count(), 'errors',errors)
   assert not errors,(width,errors)
   assert page.locator('body').get_attribute('data-theme')=='dark'
   assert page.locator('#heroMethod').inner_text().startswith('15° / 13°')
   assert page.locator('#qiblaBearing').inner_text()!='—°'
   assert page.locator('#prayerList .time-row').count()==13
   assert 'sunrise' in page.locator('#prayerList').inner_text().lower()
   assert page.locator('#testResults .test-result').count()>=7
   assert page.locator('.lower-grid').count()==0
   assert page.locator('.research-note').count()==0
   for theme in ['light','dark']:
    for accent in ['forest','ocean','sand']:
     page.locator('#accentPicker').select_option(accent)
     if page.locator('body').get_attribute('data-theme')!=theme: page.locator('#themeToggle').click()
     for view in ['classic','compact','timeline']:
      page.locator(f'#viewPicker button[data-view="{view}"]').click()
      page.wait_for_timeout(80)
      overflow=page.evaluate('document.documentElement.scrollWidth-document.documentElement.clientWidth')
      if overflow>1: print('OVERFLOW',width,theme,accent,view,overflow)
      assert overflow<=1,(width,theme,accent,view,'overflow',overflow)
      if width==390 and accent=='forest':
       if theme=='dark': page.screenshot(path=str(base/f'preview-{view}-dark.png'),full_page=True)
       elif view=='classic':page.screenshot(path=str(base/'preview-classic-light.png'),full_page=True)
   if width==390:
    page.locator('button[data-view="classic"]').click();page.locator('#themeToggle').click() if page.locator('body').get_attribute('data-theme')=='light' else None
    # Qibla test the location and GPS update
    # GPS permission is device-only in this static browser preview
    # notification safe diagnostic cannot make background promise
    page.locator('#runBasicChecks').click()
    assert 'No server connected' in page.locator('#testResults').inner_text()
    with page.expect_download() as got:page.locator('#exportCalendar').click()
    d=got.value;d.save_as(str(base/'test-v5.ics'))
    txt=(base/'test-v5.ics').read_text()
    assert 'TRIGGER:-PT15M' in txt
    # Qibla manual declination simulated heading
    page.evaluate('''() => {Object.defineProperty(window,'isSecureContext',{value:true,configurable:true});window.DeviceOrientationEvent = class {static requestPermission(){return Promise.resolve('granted')}}; }''')
    page.locator('#declinationOverride').fill('0')
    page.locator('#startCompass').click()
    page.evaluate('''() => { const e=new Event('deviceorientation');e.webkitCompassHeading=110;e.webkitCompassAccuracy=5;window.dispatchEvent(e);}''')
    page.wait_for_timeout(250)
    print('SIM COMPASS',page.locator('#qiblaState').inner_text(),page.evaluate('window.isSecureContext'))
    assert 'Compass reading' in page.locator('#qiblaState').inner_text()
    page.screenshot(path=str(base/'preview-qibla-dial.png'),full_page=True)
    # Change the selected position and verify the destination bearing follows it.
    page.locator('#openSettings').click()
    page.locator('#latInput').fill('51.5072')
    page.locator('#lngInput').fill('-0.1276')
    page.locator('#placeInput').fill('London')
    page.locator('input[name="method"][value="12-12"]').check()
    page.locator('#saveSettings').click()
    page.wait_for_timeout(350)
    assert page.locator('#heroMethod').inner_text().startswith('12° / 12°')
    assert abs(float(page.locator('#qiblaBearing').inner_text().replace('°',''))-119)<0.2
    assert page.locator('#declinationOverride').input_value()==''
    # Confirm foreground reminder test is honest about locked/background limitations.
    page.locator('#testEarlyChime').click()
    assert 'stays visible' in page.locator('#testFeedback').inner_text()
   assert not errors,(width,errors)
   print('PASS',width,'18 combinations, 13 schedule entries, no overflow')
   context.close()
  b.close()
