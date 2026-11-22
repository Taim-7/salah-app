const assert = require('node:assert/strict');
globalThis.SalahSolar = require('../solar.js');
const P = require('../providers.js');
const locs = [[54.9966,-7.3086],[55.2048,-6.6522],[54.9505,-7.734],[51.51,-.12],[53.3498,-6.2603],[55.8642,-4.2518],[60.1545,-1.1494]];
let ok=0, missing=0;
for (const [lat,lng] of locs) for (const y of [2026,2027]) for (let m=1;m<=12;m++) for (let d=1;d<=28;d++) {
  const key = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const t = P.taybaDay(key,lat,lng);
  if (!t.valid) { missing++; continue; }
  assert.ok(t.fajr<t.sunrise && t.sunrise<t.dhuhr && t.dhuhr<t.asr && t.asr<t.maghrib && (!t.isha || t.maghrib<t.isha),`order ${key} ${lat}`);
  assert.ok(t.maghrib<t.firstThird && t.firstThird<t.midnight && t.midnight<t.nextFajr,`night ${key} ${lat}`);
  if (t.isha) assert.equal(t.isha.getTime() % 60000, 0);
  assert.equal(Math.round(t.fajr.getTime()%60000),0);
  ok++;
}
const key='2026-11-21',z='Europe/London';
assert.equal(P.localToUtc(key,6,24,z).toISOString(),'2026-11-21T06:24:00.000Z');
assert.equal(P.localToUtc('2026-06-21',6,24,z).toISOString(),'2026-06-21T05:24:00.000Z');
assert.equal(P.localToUtc('2026-03-29',1,30,z),null); // nonexistent hour at BST transition
assert.equal(P.localToUtc('2026-10-25',1,30,z),null); // repeated wall-clock minute
assert.equal(P.parsePrayerTime('2026-10-25T01:30:00+01:00','2026-10-25',z).toISOString(),'2026-10-25T00:30:00.000Z');
assert.equal(P.parsePrayerTime('2026-07-21T14:00:00+00:00','2026-07-21',z),null);
const example={code:200,data:{timings:{Fajr:'2026-11-21T06:24:00+00:00',Sunrise:'2026-11-21T08:12:00+00:00',Dhuhr:'2026-11-21T12:17:00+00:00',Asr:'2026-11-21T13:58:00+00:00',Maghrib:'2026-11-21T16:18:00+00:00',Isha:'2026-11-21T17:46:00+00:00'},meta:{method:{id:12},timezone:z}}};
let data=P.decode('france',key,z,example);assert.equal(data.fajr.toISOString(),'2026-11-21T06:24:00.000Z');
const wrong=structuredClone(example);wrong.data.timings.Fajr='2026-11-20T06:24:00+00:00';
assert.throws(()=>P.decode('france',key,z,wrong),/date does not match/);
const schoolWrong=structuredClone(example);schoolWrong.data.meta.method.id=1;
assert.throws(()=>P.decode('france',key,z,schoolWrong),/Unexpected method/);
const belfastAlias=structuredClone(example);
belfastAlias.data.meta.timezone='Europe/Belfast';
assert.equal(P.decode('france',key,z,belfastAlias).valid,true,'British time-zone aliases agree across seasons');
const zoneWrong=structuredClone(example);zoneWrong.data.meta.timezone='Asia/Tokyo';
assert.throws(()=>P.decode('france',key,z,zoneWrong),/zone mismatch/);
// Tayba's published northern rule carries forward the final spring 18° day,
// rather than switching to the closer autumn boundary during the summer.
const summerKey='2026-07-02', lat=54.9966,lng=-7.3086;
let spring=null;
for(let n=1;n<=200;n++) {
 const k=P.keyShift(summerKey,-n), pieces=k.split('-').map(Number);
 if(globalThis.SalahSolar.solarEvents(...pieces,lat,lng,18,18).fajrRaw){spring=k;break;}
}
assert.ok(spring,'Spring 18° boundary found');
const springAngles=globalThis.SalahSolar.solarEvents(...spring.split('-').map(Number),lat,lng,14.5,14.5);
const currentAngles=globalThis.SalahSolar.solarEvents(...summerKey.split('-').map(Number),lat,lng,14.5,14.5);
const expected=Math.ceil((currentAngles.sunriseRaw.getTime()-(springAngles.sunriseRaw-springAngles.fajrRaw))/60000)*60000;
assert.equal(P.taybaDay(summerKey,lat,lng).fajr.getTime(),expected,'Summer Fajr uses final spring reference');
const northerly = P.taybaDay('2026-06-21',60.1545,-1.1494);
assert.ok(northerly.valid && northerly.fajr && northerly.nextFajr);
assert.equal(northerly.isha, null, 'Option 2 unavailable where the 8° crossing is absent');
assert.ok(P.hybridTwilightDay('2026-06-21',60.1545,-1.1494,15,13).fajr);
const late = structuredClone(example);
late.data.meta = { method:{id:15,params:{shafaq:'ahmer'}}, timezone:z, latitude:54.9966, longitude:-7.3086, school:'STANDARD' };
late.data.timings.Isha = key + 'T00:20:00+00:00';
late.data.timings.Maghrib = key + 'T22:00:00+00:00';
const requested = { lat:54.9966,lng:-7.3086 };
assert.equal(P.decode('moonsighting',key,z,late,requested).isha.toISOString(),'2026-11-22T00:20:00.000Z');
const otherAsr = structuredClone(late);
otherAsr.data.meta.school = 'HANAFI';
assert.throws(() => P.decode('moonsighting',key,z,otherAsr,requested), /Unexpected Asr/);
assert.throws(() => P.decode('moonsighting',key,z,late,{ ...requested, lat:55 }), /Wrong provider location/);
assert.equal(new URL(P.buildUrl('moonsighting',key,54.9966,-7.3086,z)).searchParams.get('school'),'0');
console.log({passedTaybaDays:ok,unsupportedTaybaDays:missing,dateAndZoneValidation:'PASS',springReference:spring,asrSchoolParameter:'0 = one-shadow'});
