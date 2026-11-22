from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 c=b.new_context(viewport={'width':390,'height':844},timezone_id='Europe/London')
 page=c.new_page();errors=[];page.on('pageerror',lambda e: errors.append(str(e)))
 page.set_content((root/'index.html').read_text())
 page.add_style_tag(path=str(root/'styles.css'))
 page.evaluate('''() => {
   window.offlineFlag = false;
   Object.defineProperty(navigator,'onLine',{configurable:true,get:()=>!window.offlineFlag});
   window.playedSources=[];window.remoteDownloads=0;
   const map=new Map();
   const db={objectStoreNames:{contains:()=>true},createObjectStore(){},close(){},transaction(){return {objectStore(){return {
     get(key){const q={};queueMicrotask(()=>{q.result=map.get(key);q.onsuccess?.()});return q},
     put(blob,key){const q={};queueMicrotask(()=>{map.set(key,blob);q.onsuccess?.()});return q},
     delete(key){const q={};queueMicrotask(()=>{map.delete(key);q.onsuccess?.()});return q}
   }}}}};
   Object.defineProperty(window,'indexedDB',{configurable:true,value:{open(){const q={};queueMicrotask(()=>{q.result=db;q.onsuccess?.()});return q}}});
   window.fetch=async(url)=>{
     if(String(url).includes('raw.githubusercontent.com')){window.remoteDownloads++;return new Response(new Uint8Array(50000),{status:200,headers:{'Content-Type':'audio/mpeg'}})}
     throw Error('Online API unavailable in test');
   };
   window.Audio=class {constructor(src){this.src=src}play(){window.playedSources.push(this.src);return Promise.resolve()}pause(){}};
 }''')
 for f in ['solar.js','providers.js','app.js']:page.add_script_tag(path=str(root/f))
 page.locator('[data-screen-target="sounds"]').click()
 # Audio downloads are initiated by the app without pressing a button.
 page.wait_for_function('window.remoteDownloads===3',timeout=5000)
 page.wait_for_timeout(700)
 print('SOUND',page.locator('#soundStatus').inner_text(),'fetchCount',page.evaluate('window.remoteDownloads'),'errors',errors)
 page.wait_for_function('window.playedSources.length === 0', timeout=4500)
 assert page.evaluate('window.remoteDownloads')==3
 page.evaluate('window.offlineFlag=true')
 page.locator('#testSound').click()
 page.wait_for_function('window.playedSources.length===1')
 assert page.evaluate('window.playedSources[0].startsWith("blob:")')
 page.locator('#soundChoice').select_option('adhan-fajr-abu-bakr')
 page.locator('#testSound').click()
 page.wait_for_function('window.playedSources.length===2')
 assert page.evaluate('window.playedSources[1].startsWith("blob:")')
 assert page.evaluate('window.remoteDownloads')==3
 assert not errors,errors
 print('PASS: 3 recordings saved; Abu Bakr and Echo play cached blob URLs with network disabled; no extra downloads')
 c.close();b.close()
