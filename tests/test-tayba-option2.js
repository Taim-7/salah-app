const assert=require('node:assert/strict');
const S=require('../solar.js');global.SalahSolar=S;
const P=require('../providers.js');
let checked=0,capped=0,missing14=0;
for(let m=1;m<=12;m++)for(let d=1;d<=31;d++){
 const date=new Date(Date.UTC(2026,m-1,d,12));if(date.getUTCMonth()!==m-1)continue;
 const k=date.toISOString().slice(0,10);
 const t=P.taybaOneDay(k,54.9966,-7.3086);assert(t.valid,k);
 const a=S.solarEvents(2026,m,d,54.9966,-7.3086,14.5,14.5);
 const e=S.solarEvents(2026,m,d,54.9966,-7.3086,8,8);
 const cap=!a.ishaRaw||a.ishaRaw.getTime()-t.trueSunset.getTime()>90*60000;
 const expected=cap?new Date(Math.max(t.trueSunset.getTime()+90*60000,e.ishaRaw.getTime())):a.ishaRaw;
 assert.equal(t.isha.getTime(),Math.ceil(expected.getTime()/60000)*60000,k);
 if(cap)capped++;if(!a.ishaRaw)missing14++;checked++;
}
console.log(`PASS: ${checked} Tayba option-2 Isha days; cap used ${capped} days, missing 14.5° crossing ${missing14} days`);
