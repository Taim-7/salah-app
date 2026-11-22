/* Run: TZ=Europe/London node test-solar.js */
'use strict';
const assert = require('node:assert/strict');
const { calculateFullDay } = require('../solar.js');
function min(p) {return p.getHours()*60 + p.getMinutes();}
function day(y,m,d,isha=15,rule='seventh') {return calculateFullDay(new Date(y,m-1,d,12),54.9966,-7.3086,15,isha,rule);}
const november = day(2026,11,21);
assert.equal(november.valid,true);
assert.ok(min(november.sunrise)>=8*60+9 && min(november.sunrise)<=8*60+17,'November sunrise should agree with a local astronomical timetable within a few minutes');
assert.ok(min(november.maghrib)>=16*60+14 && min(november.maghrib)<=16*60+22,'November sunset sanity check');
assert.ok(november.fajr<november.sunrise);
assert.ok(november.sunrise<november.dhuhr && november.dhuhr<november.asr && november.asr<november.maghrib && november.maghrib<november.isha);
assert.ok(november.maghrib<november.firstThird && november.firstThird<november.midnight && november.midnight<november.nextFajr);
const june=day(2026,6,21,13);
assert.equal(june.valid,true);
assert.equal(june.fajrFallback,true,'15° Fajr unavailable in June');
assert.equal(june.ishaFallback,true,'13° Isha unavailable in June');
const july=day(2026,7,21,13);
assert.equal(july.valid,true);
assert.equal(july.ishaBeyondFirstThird,true,'Flag if calculated Isha begins after the first third');
let checked=0;
for (const angle of [13,15]) for (let d=new Date(2026,0,1,12);d.getFullYear()===2026;d.setDate(d.getDate()+1)) {
 const p=calculateFullDay(d,54.9966,-7.3086,15,angle,'seventh');
 assert.equal(p.valid,true,`Derry ${d.toDateString()}`);
 for (const key of ['fajr','sunrise','dhuhr','asr','maghrib','isha','firstThird','midnight','nextFajr']) assert.ok(Number.isFinite(p[key].getTime()),`${key} ${d}`);
 assert.ok(p.fajr<p.sunrise && p.sunrise<p.dhuhr && p.dhuhr<p.asr && p.asr<p.maghrib && p.maghrib<p.isha);
 assert.ok(p.maghrib < p.firstThird && p.firstThird < p.midnight && p.midnight < p.nextFajr);
 checked++;
}
console.log(`Passed: ${checked} daily method checks, Derry solar, high-latitude estimates, Asr and Islamic-night ordering.`);
