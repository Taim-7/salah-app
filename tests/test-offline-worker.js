'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const origin='https://salah.example';
const base=origin+'/salah-app/';
const listeners={};
const stores=new Map();
const notifications=[], opened=[];
let useNetwork=false, requests=0;
const key=req=>new URL(typeof req==='string'?req:req.url,base).href;
const cache={
  async addAll(paths){
    const pending=new Map();
    for(const p of paths){
      const name=key(p).slice(base.length)||'index.html';
      assert(fs.existsSync(path.join(root,name)),`Missing offline file ${name}`);
      pending.set(key(p),new Response(fs.readFileSync(path.join(root,name))));
    }
    for(const [url,resp] of pending)current.set(url,resp);
  },
  async put(req,resp){current.set(key(req),resp)},
  async match(req){return current.get(key(req))?.clone()}
};
let current;
const caches={
  async open(name){if(!stores.has(name))stores.set(name,new Map()); current=stores.get(name);return cache},
  async keys(){return [...stores.keys()]},
  async delete(name){return stores.delete(name)},
  async match(req){for(const entries of stores.values()){let v=entries.get(key(req));if(v)return v.clone()}return undefined}
};
const scope={
  self:{location:{origin},registration:{scope:base,showNotification:async(title, options)=>notifications.push({title,...options})},
    addEventListener:(name,fn)=>listeners[name]=fn,skipWaiting:async()=>{},
    clients:{claim:async()=>{},matchAll:async()=>[],openWindow:async url=>opened.push(url)}},
  caches,URL,Request,Response,Promise,
  fetch:async()=>{requests++;if(!useNetwork)throw new Error('Offline');return new Response('Network response',{status:200})}
};
vm.runInNewContext(fs.readFileSync(path.join(root,'sw.js'),'utf8'),scope);
const tick=async(type,request,fields={})=>{
  const pending=[];
  let reply;
  listeners[type]({request,...fields,waitUntil:prom=>pending.push(Promise.resolve(prom)),respondWith:prom=>reply=Promise.resolve(prom)});
  if(reply) { const r=await reply;await Promise.all(pending);return r; }
  await Promise.all(pending);
};
(async()=>{
 await caches.open('salah-static:/salah-app/:v15');
 await caches.open('salah-static:/other-app/:v15');
 await tick('install');
 assert.equal(stores.has('salah-static:/salah-app/:v27'),true);
 await tick('activate');
 assert.equal(stores.has('salah-static:/salah-app/:v15'),false);
 assert.equal(stores.has('salah-static:/other-app/:v15'),true);
 const urls=['','index.html','styles.css','region.js','solar.js','providers.js','timetable.js','reminders.js','audio.js','app.js','manifest.webmanifest','vendor/magvar/magvar.mjs','vendor/magvar/utils.mjs','vendor/magvar/WMMCOF2025.mjs'];
 const variants = ['ocean','midnight','sand','slate','mihrab','minaret','compass','mat'];
 for(const preset of variants) urls.push('manifest-'+preset+'.webmanifest');
 urls.push('install/icon.js', ...['forest', ...variants].map(preset => 'install/' + preset + '.html'));
 for(const palette of ['forest', 'ocean', 'midnight', 'sand', 'slate']) {
  for(const design of ['crescent', 'mihrab', 'minaret', 'compass', 'mat']) {
   urls.push(`install/${palette}-${design}.html`, `manifest-${palette}-${design}.webmanifest`);
   for(const size of [180,192,512]) urls.push(`icons/art/${palette}/${design}-${size}.png`);
  }
 }
 for(const u of urls){
  const resp=await tick('fetch',{url:base+u,method:'GET',mode:u?'same-origin':'navigate'});
  assert(resp?.ok,`Not cached offline: ${u}`);
  assert((await resp.arrayBuffer()).byteLength>0,`Empty asset ${u}`);
 }
 const refreshedIcon=await tick('fetch',{url:base+'icons/art/ocean/minaret-180.png?test=1',method:'GET',mode:'same-origin'});
 assert(refreshedIcon?.ok,'Updated icon should work offline with a query');
 const missingJs=await tick('fetch',{url:base+'not-found.js',method:'GET',mode:'same-origin'});
 assert.equal(missingJs.status,503);
 const missNav=await tick('fetch',{url:base+'some-new-path',method:'GET',mode:'navigate'});
 assert(missNav.ok);
 const cross=await tick('fetch',{url:'https://api.aladhan.com/test',method:'GET',mode:'cors'});
 assert.equal(cross,undefined);
 const api=await tick('fetch',{url:base+'api/reminders',method:'GET',mode:'same-origin'});
 assert.equal(api,undefined);
 assert.equal(requests,2);
 await tick('push',null,{data:{json:()=>({type:'test'})}});
 await tick('push',null,{data:{json:()=>({type:'prayer',title:'Fajr',time:'3:10 am',estimated:true,tag:'salah-2026-06-21:fajr'})}});
 assert.equal(notifications[0].body,'Test notification');
 assert.equal(notifications[1].title,'Fajr');
 assert.equal(notifications[1].body,'Starts at 3:10 am (estimate)');
 let closed=false;
 await tick('notificationclick',null,{notification:{close:()=>{closed=true}}});
 assert.equal(closed,true);
 assert.deepEqual(opened,[base]);
 console.log(`PASS: ${urls.length} precached URLs; offline shell, icon pages and scripts; navigation fallback; missing script 503; cross-origin bypass`);
})().catch(e=>{console.error(e);process.exitCode=1});
