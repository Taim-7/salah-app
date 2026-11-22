from os import environ
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
clock="""(()=>{const O=Date;function F(...a){return a.length?new O(...a):new O('2026-11-22T01:30:00Z')};F.now=()=>new O('2026-11-22T01:30:00Z').getTime();F.parse=O.parse;F.UTC=O.UTC;F.prototype=O.prototype;window.Date=F})();"""
mock="""window.mockCalls=[];window.recovered=false;
window.fetch=async url=>{window.mockCalls.push(String(url)); if(!window.recovered)return {ok:false,status:503};return {ok:true,status:200,json:async()=>({code:200,data:{meta:{timezone:'Europe/Belfast',method:{id:15,params:{shafaq:'ahmer'}},latitude:54.9966,longitude:-7.3086,school:'STANDARD'},timings:{Fajr:'06:20',Sunrise:'08:12',Dhuhr:'12:16',Asr:'13:58',Maghrib:'16:18',Isha:'17:46'}}})}};"""
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=environ.get('SALAH_CHROMIUM', '/usr/bin/chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=b.new_page(viewport={'width':390,'height':844},timezone_id='Europe/London')
 errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
 page.set_content((root/'index.html').read_text());page.add_style_tag(path=str(root/'styles.css'))
 page.evaluate(clock);page.evaluate(mock)
 page.evaluate("""Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem(k){return k==='salah-config'?JSON.stringify({version4:true,version5:true,version6:true,version7:true,audioDefaultV13:true,soundChoice:'adhan-abu-bakr',method:'15-13',activeSource:'moonsighting',onlineCompare:false,timeZone:'Europe/London',lat:54.9966,lng:-7.3086}):null},setItem(){},removeItem(){}}})""")
 for f in ['region.js','solar.js','providers.js','timetable.js','audio.js','hijri.js','app.js']:page.add_script_tag(path=str(root/f))
 page.wait_for_function('window.mockCalls.length>=3',timeout=5000)
 assert 'AlAdhan is unavailable' in page.locator('#notice').inner_text()
 page.evaluate('window.recovered=true;window.dispatchEvent(new Event("online"))')
 page.wait_for_function('window.mockCalls.length>=6',timeout=5000)
 page.wait_for_function("document.querySelector('#notice').textContent.startsWith('AlAdhan supplies Fajr and Isha')",timeout=5000)
 assert page.locator('#heroLiveMessage').inner_text()=='Night'
 assert not errs, errs
 print('PASS: online API resumes after network recovery; correct 3 date requests; after-midnight state updated')
 b.close()
