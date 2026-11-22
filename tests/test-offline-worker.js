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
let useNetwork=false, requests=0;
const key=req=>new URL(typeof req==='string'?req:req.url,base).href;
const cache={
  async addAll(paths){
    const pending=new Map();
    for(const p of paths){
      const full=path.join(root,p.replace(/^\.\//,'')) || path.join(root,'index.html');
      let name=p==='./'?'index.html':p.replace(/^\.\//,'');
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
  self:{location:{origin},addEventListener:(name,fn)=>listeners[name]=fn,skipWaiting:async()=>{},clients:{claim:async()=>{}}},
  caches,URL,Response,Promise,
  fetch:async()=>{requests++;if(!useNetwork)throw new Error('Offline');return new Response('Network response',{status:200})}
};
vm.runInNewContext(fs.readFileSync(path.join(root,'sw.js'),'utf8'),scope);
const tick=async(type,request)=>{
  const pending=[];
  let reply;
  listeners[type]({request,waitUntil:prom=>pending.push(Promise.resolve(prom)),respondWith:prom=>reply=Promise.resolve(prom)});
  if(reply) { const r=await reply;await Promise.all(pending);return r; }
  await Promise.all(pending);
};
(async()=>{
 await caches.open('salah-static-v15');
 await tick('install');
 assert.equal(stores.has('salah-static-v19'),true);
 await tick('activate');
 assert.equal(stores.has('salah-static-v15'),false);
 const urls=['','index.html','styles.css','region.js','solar.js','providers.js','app.js','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/icon-180.png'];
 for(const u of urls){
  const resp=await tick('fetch',{url:base+u,method:'GET',mode:u?'same-origin':'navigate'});
  assert(resp?.ok,`Not cached offline: ${u}`);
  assert((await resp.arrayBuffer()).byteLength>0,`Empty asset ${u}`);
 }
 const missingJs=await tick('fetch',{url:base+'not-found.js',method:'GET',mode:'same-origin'});
 assert.equal(missingJs.status,503);
 const missNav=await tick('fetch',{url:base+'some-new-path',method:'GET',mode:'navigate'});
 assert(missNav.ok);
 const cross=await tick('fetch',{url:'https://api.aladhan.com/test',method:'GET',mode:'cors'});
 assert.equal(cross,undefined);
 assert.equal(requests,2);
 console.log('PASS: 11 precached URLs; offline shell and scripts; navigation fallback; missing script 503; cross-origin bypass');
})().catch(e=>{console.error(e);process.exitCode=1});
