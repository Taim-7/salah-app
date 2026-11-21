const assert = require('node:assert/strict');
globalThis.SalahSolar = require('./solar.js');
const P = require('./providers.js');
const locs = [[54.9966,-7.3086],[51.51,-.12],[40.71,-74.01],[35.68,139.69],[-33.87,151.21],[21.42,39.83],[-36.85,174.76]];
let ok=0, missing=0;
for (const [lat,lng] of locs) for (const y of [2026,2027]) for (let m=1;m<=12;m++) for (let d=1;d<=28;d++) {
  const key = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const t = P.taybaDay(key,lat,lng);
  if (!t.valid) { missing++; continue; }
  assert.ok(t.fajr<t.sunrise && t.sunrise<t.dhuhr && t.dhuhr<t.asr && t.asr<t.maghrib && t.maghrib<t.isha,`order ${key} ${lat}`);
  assert.ok(t.maghrib<t.firstThird && t.firstThird<t.midnight && t.midnight<t.nextFajr,`night ${key} ${lat}`);
  assert.equal(Math.round(t.isha.getTime()%60000),0);
  assert.equal(Math.round(t.fajr.getTime()%60000),0);
  ok++;
}
const key='2026-11-21',z='Europe/London';
assert.equal(P.localToUtc(key,6,24,z).toISOString(),'2026-11-21T06:24:00.000Z');
assert.equal(P.localToUtc('2026-06-21',6,24,z).toISOString(),'2026-06-21T05:24:00.000Z');
assert.equal(P.localToUtc('2026-11-21',6,24,'Asia/Tokyo').toISOString(),'2026-11-20T21:24:00.000Z');
assert.equal(P.localToUtc('2026-03-29',1,30,z),null); // nonexistent hour at BST transition
const example={code:200,data:{timings:{Fajr:'2026-11-21T06:24:00+00:00',Sunrise:'2026-11-21T08:12:00+00:00',Dhuhr:'2026-11-21T12:17:00+00:00',Asr:'2026-11-21T13:58:00+00:00',Maghrib:'2026-11-21T16:18:00+00:00',Isha:'2026-11-21T17:46:00+00:00'},meta:{method:{id:12},timezone:z}}};
let data=P.decode('france',key,z,example);assert.equal(data.fajr.toISOString(),'2026-11-21T06:24:00.000Z');
const wrong=structuredClone(example);wrong.data.timings.Fajr='2026-11-20T06:24:00+00:00';
assert.throws(()=>P.decode('france',key,z,wrong),/date does not match/);
const schoolWrong=structuredClone(example);schoolWrong.data.meta.method.id=1;
assert.throws(()=>P.decode('france',key,z,schoolWrong),/Unexpected method/);
const zoneWrong=structuredClone(example);zoneWrong.data.meta.timezone='Asia/Tokyo';
assert.throws(()=>P.decode('france',key,z,zoneWrong),/zone mismatch/);
console.log({passedTaybaDays:ok,unsupportedTaybaDays:missing,dateAndZoneValidation:'PASS',asrSchoolParameter:'0 = one-shadow'});
