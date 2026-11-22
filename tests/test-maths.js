const assert = require('node:assert/strict');
const S = require('../solar.js');
const cities = [[54.9966,-7.3086],[51.51,-.12],[40.71,-74.01],[35.68,139.69],[-33.87,151.21],[21.42,39.83],[-36.85,174.76],[21.3,-157.85]];
let count=0, estimates=0, invalid=0;
for (const [lat,lng] of cities) for (const [fa,ia] of [[12,12],[15,13]]) {
 for(let y of [2026,2027]) for (let m=1;m<=12;m++) for(let d=1;d<=28;d++) {
  const p=S.calculateFullDay(new Date(Date.UTC(y,m-1,d,12)),lat,lng,fa,ia,'seventh');
  if(!p.valid){invalid++;continue;}
  for(const k of ['fajr','sunrise','dhuhr','asr','maghrib','isha','firstThird','midnight','nextFajr'])assert.ok(Number.isFinite(p[k].getTime()),`Invalid ${k} ${lat}/${lng}/${y}/${m}/${d}`);
  assert.ok(p.fajr<p.sunrise&&p.sunrise<p.dhuhr&&p.dhuhr<p.asr&&p.asr<p.maghrib&&p.maghrib<p.isha,`order ${lat} ${lng} ${y}-${m}-${d}`);
  assert.ok(p.maghrib<p.firstThird&&p.firstThird<p.midnight&&p.midnight<p.nextFajr,`night ${lat} ${lng} ${y}-${m}-${d}`);
  assert.ok(Math.abs((p.firstThird-p.maghrib)-(p.nextFajr-p.maghrib)/3)<1, 'Night first third arithmetic');
  assert.ok(Math.abs((p.midnight-p.maghrib)-(p.nextFajr-p.maghrib)/2)<1, 'Night midpoint arithmetic');
  if(p.fajrFallback||p.ishaFallback)estimates++;
  count++;
 }
}
console.log(`PASS ${count} valid full days across 8 cities, 2 angle pairs and 2 years; ${estimates} estimated twilight dates; invalid ${invalid}.`);
